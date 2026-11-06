import * as ort from "onnxruntime-web";

// IS-Net general-use (Apache-2.0 weights from the DIS project) as a 91 MB fp16 export, run with onnxruntime-web (MIT).
// Pinned to a commit of a community mirror; the 44 MB quantized export left speckled backgrounds on white shoes.
const MODEL_URL = "https://huggingface.co/tiper-penta/isnet-general-use-fp16/resolve/edcb78a6822640f4c2a1e6c9aa0ca6abab60a674/isnet-general-use-fp16.onnx";
const SIZE = 1024;
const MAX_EDGE = 800;
const ALPHA_MIN = 8;

ort.env.wasm.wasmPaths = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ort.env.versions.web}/dist/`;

export type CutoutRequest = { id: number; photo: Blob };
export type CutoutResponse = { id: number; cutout: Blob } | { id: number; error: string };

let session: Promise<ort.InferenceSession> | undefined;

// Kept in Cache Storage so the model downloads once, not on every visit.
async function loadModel() {
  const cache = await caches.open("layerup-models");
  let response = await cache.match(MODEL_URL);
  if (!response) {
    response = await fetch(MODEL_URL);
    if (!response.ok) throw new Error(`Model download failed: ${response.status}`);
    await cache.put(MODEL_URL, response.clone());
  }
  return ort.InferenceSession.create(new Uint8Array(await response.arrayBuffer()), { executionProviders: ["wasm"] });
}

// Inference takes seconds, so it runs here to keep the page responsive.
self.onmessage = async ({ data: { id, photo } }: MessageEvent<CutoutRequest>) => {
  try {
    self.postMessage({ id, cutout: await trimToItem(await removeBackground(photo)) } satisfies CutoutResponse);
  } catch (err) {
    self.postMessage({ id, error: err instanceof Error ? err.message : String(err) } satisfies CutoutResponse);
  }
};

async function removeBackground(photo: Blob): Promise<OffscreenCanvas> {
  session ??= loadModel();
  const model = await session;
  const bitmap = await createImageBitmap(photo);

  const input = new OffscreenCanvas(SIZE, SIZE).getContext("2d")!;
  input.drawImage(bitmap, 0, 0, SIZE, SIZE);
  const rgba = input.getImageData(0, 0, SIZE, SIZE).data;
  const plane = SIZE * SIZE;
  const tensor = new Float32Array(3 * plane);
  for (let i = 0; i < plane; i++) {
    for (let c = 0; c < 3; c++) tensor[c * plane + i] = rgba[i * 4 + c] / 255 - 0.5;
  }
  const outputs = await model.run({ [model.inputNames[0]]: new ort.Tensor("float32", tensor, [1, 3, SIZE, SIZE]) });
  const prediction = outputs[model.outputNames[0]].data as Float32Array;

  let min = Infinity, max = -Infinity;
  for (let i = 0; i < plane; i++) {
    if (prediction[i] < min) min = prediction[i];
    if (prediction[i] > max) max = prediction[i];
  }
  const mask = new OffscreenCanvas(SIZE, SIZE);
  const maskCtx = mask.getContext("2d")!;
  const maskPixels = maskCtx.createImageData(SIZE, SIZE);
  for (let i = 0; i < plane; i++) {
    maskPixels.data[i * 4 + 3] = Math.round(((prediction[i] - min) / (max - min || 1)) * 255);
  }
  maskCtx.putImageData(maskPixels, 0, 0);

  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  ctx.globalCompositeOperation = "destination-in";
  ctx.drawImage(mask, 0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = "source-over";
  return canvas;
}

// Crops away the transparent margin so cutouts line up by the item itself, not the original framing.
async function trimToItem(full: OffscreenCanvas): Promise<Blob> {
  const ctx = full.getContext("2d")!;

  const image = ctx.getImageData(0, 0, full.width, full.height);
  const { data, width, height } = image;
  erodeAlpha(data, width, height);
  ctx.putImageData(image, 0, 0);

  let top = height, left = width, bottom = -1, right = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] < ALPHA_MIN) continue;
      if (y < top) top = y;
      if (y > bottom) bottom = y;
      if (x < left) left = x;
      if (x > right) right = x;
    }
  }
  if (bottom < 0) throw new Error("Nothing left after removing the background");

  const w = right - left + 1;
  const h = bottom - top + 1;
  const scale = Math.min(1, MAX_EDGE / Math.max(w, h));
  const out = new OffscreenCanvas(Math.round(w * scale), Math.round(h * scale));
  out.getContext("2d")!.drawImage(full, left, top, w, h, 0, 0, out.width, out.height);

  return out.convertToBlob({ type: "image/png" });
}

// Shrinks the mask by one pixel: the model's soft edge keeps a rim of the old background,
// which shows as a light halo around dark clothes on the dark theme.
function erodeAlpha(data: Uint8ClampedArray, width: number, height: number) {
  const alpha = new Uint8ClampedArray(width * height);
  for (let i = 0; i < alpha.length; i++) alpha[i] = data[i * 4 + 3];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let min = alpha[y * width + x];
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx, ny = y + dy;
          const a = nx < 0 || ny < 0 || nx >= width || ny >= height ? 0 : alpha[ny * width + nx];
          if (a < min) min = a;
        }
      }
      data[(y * width + x) * 4 + 3] = min;
    }
  }
}
