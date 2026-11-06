import type { CutoutRequest, CutoutResponse } from "./cutout.worker";

// Background removal runs in the browser (the model loads from Hugging Face), so it costs no AI quota.
let worker: Worker | undefined;
let nextId = 0;
const pending = new Map<number, { resolve: (blob: Blob) => void; reject: (err: Error) => void }>();

export function makeCutout(photo: Blob): Promise<Blob> {
  if (!worker) {
    worker = new Worker(new URL("./cutout.worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = ({ data }: MessageEvent<CutoutResponse>) => {
      const call = pending.get(data.id);
      pending.delete(data.id);
      if ("cutout" in data) call?.resolve(data.cutout);
      else call?.reject(new Error(data.error));
    };
  }
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    worker!.postMessage({ id, photo } satisfies CutoutRequest);
  });
}
