import { removeBackground } from "@imgly/background-removal";

const MAX_EDGE = 800;
const ALPHA_MIN = 8;

export type CutoutRequest = { id: number; photo: Blob };
export type CutoutResponse = { id: number; cutout: Blob } | { id: number; error: string };

// Inference takes seconds, so it runs here to keep the page responsive.
self.onmessage = async ({ data: { id, photo } }: MessageEvent<CutoutRequest>) => {
  try {
    const removed = await removeBackground(photo, { output: { format: "image/png" } });
    self.postMessage({ id, cutout: await trimToItem(removed) } satisfies CutoutResponse);
  } catch (err) {
    self.postMessage({ id, error: err instanceof Error ? err.message : String(err) } satisfies CutoutResponse);
  }
};

// Crops away the transparent margin so cutouts line up by the item itself, not the original framing.
async function trimToItem(png: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(png);
  const full = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = full.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

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
