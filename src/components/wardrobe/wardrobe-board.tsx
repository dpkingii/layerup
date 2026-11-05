"use client";

import { useRef, useState } from "react";
import { ImagePlus, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { prepareImage } from "@/lib/wardrobe/image";
import { BUCKET, photoPath, type ItemRow, type WardrobeItem } from "@/lib/wardrobe/items";
import { cn } from "@/lib/utils";
import { addPhotoItem } from "@/app/wardrobe/actions";
import { ItemEditor } from "./item-editor";
import { ItemTile, UploadTile } from "./item-tile";
import { StarterPicker } from "./starter-picker";
import { useCutoutQueue } from "./use-cutout-queue";
import { useTagQueue } from "./use-tag-queue";

const UPLOAD_CONCURRENCY = 4;

type Upload = { id: string; name: string; previewUrl?: string; error?: string };

function isImage(file: File) {
  return file.type.startsWith("image/") || /\.hei[cf]$/i.test(file.name);
}

export function WardrobeBoard({ userId, initialItems }: { userId: string; initialItems: WardrobeItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [editingId, setEditingId] = useState<string>();
  const [pickingStarters, setPickingStarters] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [supabase] = useState(createClient);

  function upsertRow(row: ItemRow, photoUrl?: string) {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === row.id);
      const next = { ...row, photoUrl: photoUrl ?? existing?.photoUrl ?? null, cutoutUrl: existing?.cutoutUrl ?? null };
      return existing ? prev.map((i) => (i.id === row.id ? next : i)) : [next, ...prev];
    });
  }

  const tagQueue = useTagQueue((row) => upsertRow(row));
  useCutoutQueue(items, userId, supabase, (row) => upsertRow(row));
  const untagged = items.filter((i) => i.photo_path && (i.tag_status === "pending" || i.tag_status === "failed"));

  async function uploadOne(upload: Upload, file: File) {
    const patch = (p: Partial<Upload>) => setUploads((prev) => prev.map((u) => (u.id === upload.id ? { ...u, ...p } : u)));
    try {
      const blob = await prepareImage(file);
      const previewUrl = URL.createObjectURL(blob);
      patch({ previewUrl });
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(photoPath(userId, upload.id), blob, { contentType: "image/jpeg" });
      if (error) throw error;
      upsertRow(await addPhotoItem(upload.id), previewUrl);
      setUploads((prev) => prev.filter((u) => u.id !== upload.id));
    } catch (err) {
      console.error(`Uploading ${file.name} failed`, err);
      patch({ error: err instanceof Error ? err.message : "Upload failed" });
    }
  }

  async function handleFiles(fileList: FileList | null) {
    const files = Array.from(fileList ?? []).filter(isImage);
    if (!files.length) return;
    const queue = files.map((file) => ({ upload: { id: crypto.randomUUID(), name: file.name }, file }));
    setUploads((prev) => [...queue.map((q) => q.upload), ...prev]);
    await Promise.all(
      Array.from({ length: UPLOAD_CONCURRENCY }, async () => {
        for (let next = queue.shift(); next; next = queue.shift()) await uploadOne(next.upload, next.file);
      }),
    );
  }

  const editing = items.find((i) => i.id === editingId);
  const failedUploads = uploads.filter((u) => u.error).length;

  return (
    <div
      className="flex flex-col gap-6"
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
    >
      <div
        className={cn(
          "flex flex-col items-center gap-3 rounded-xl border-2 border-dashed p-6 text-center transition-colors sm:p-8",
          dragging ? "border-primary bg-primary/5" : "border-border",
        )}
      >
        <ImagePlus className="size-8 text-muted-foreground" strokeWidth={1.5} />
        <div>
          <p className="font-medium">Drop photos of your clothes here</p>
          <p className="text-sm text-muted-foreground">One item per photo works best. JPEG, PNG, WebP or HEIC.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={() => inputRef.current?.click()}>Choose photos</Button>
          <Button variant="outline" onClick={() => setPickingStarters(true)}>
            <Plus />
            Add starter items
          </Button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.heic,.heif"
          multiple
          hidden
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
        <span>
          {items.length} item{items.length === 1 ? "" : "s"}
        </span>
        {uploads.length - failedUploads > 0 && <span>· uploading {uploads.length - failedUploads}</span>}
        {untagged.length > 0 && (
          <span>
            · {untagged.length} item{untagged.length === 1 ? "" : "s"} need{untagged.length === 1 ? "s" : ""} tags
          </span>
        )}
        {tagQueue.busy ? (
          <Button variant="outline" size="sm" onClick={tagQueue.stop}>
            Stop AI tagging ({tagQueue.states.size} left)
          </Button>
        ) : (
          untagged.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => tagQueue.enqueue(untagged.map((i) => i.id))}>
              <Sparkles />
              Tag all with AI
            </Button>
          )
        )}
        {tagQueue.quotaExhausted && (
          <span className="text-destructive">AI tagging limit reached for now. Try again later or tag by hand.</span>
        )}
        {failedUploads > 0 && (
          <Button variant="link" size="sm" className="h-auto p-0" onClick={() => setUploads((prev) => prev.filter((u) => !u.error))}>
            Clear {failedUploads} failed upload{failedUploads === 1 ? "" : "s"}
          </Button>
        )}
      </div>

      {items.length + uploads.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">Your closet is empty. Upload photos or add starter items.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {uploads.map((u) => (
            <UploadTile key={u.id} {...u} />
          ))}
          {items.map((item) => (
            <ItemTile
              key={item.id}
              item={item}
              queueState={tagQueue.states.get(item.id)}
              onOpen={() => setEditingId(item.id)}
              onAutoTag={() => tagQueue.enqueue([item.id])}
            />
          ))}
        </div>
      )}

      {editing && (
        <ItemEditor
          key={editing.id}
          item={editing}
          onClose={() => setEditingId(undefined)}
          onSaved={(row) => {
            upsertRow(row);
            setEditingId(undefined);
          }}
          onDeleted={(id) => {
            setItems((prev) => prev.filter((i) => i.id !== id));
            setEditingId(undefined);
          }}
        />
      )}
      {pickingStarters && (
        <StarterPicker
          onClose={() => setPickingStarters(false)}
          onAdded={(rows) => {
            setItems((prev) => [...rows.map((r) => ({ ...r, photoUrl: null, cutoutUrl: null })), ...prev]);
            setPickingStarters(false);
          }}
        />
      )}
    </div>
  );
}
