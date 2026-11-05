"use client";

import { useRef, useState } from "react";
import { ImagePlus, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { prepareImage } from "@/lib/wardrobe/image";
import { BUCKET, photoPath, type ItemRow, type WardrobeItem } from "@/lib/wardrobe/items";
import { SLOT_ORDER } from "@/lib/outfit/labels";
import { addPhotoItem } from "@/app/wardrobe/actions";
import { ClosetFilters, type FilterOption } from "./closet-filters";
import { ItemEditor } from "./item-editor";
import { ItemTile, UploadTile } from "./item-tile";
import { SLOT_LABELS } from "./slots";
import { StarterPicker } from "./starter-picker";
import { useCutoutQueue } from "./use-cutout-queue";
import { useTagQueue } from "./use-tag-queue";

const UPLOAD_CONCURRENCY = 4;

type Upload = { id: string; name: string; previewUrl?: string; error?: string };

const GRID = "grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5";
const GROUPS = [...SLOT_ORDER, "untagged"] as const;
type Group = (typeof GROUPS)[number];
const GROUP_LABELS: Record<Group, string> = { ...SLOT_LABELS, untagged: "Not tagged yet" };

const groupOf = (item: WardrobeItem): Group => item.slot ?? "untagged";
const colorKey = (color: string) => color.trim().toLowerCase().replace(/\bgrey\b/, "gray");
const bySubtype = (a: WardrobeItem, b: WardrobeItem) =>
  (a.subtype ?? "").localeCompare(b.subtype ?? "") || (a.colors[0] ?? "").localeCompare(b.colors[0] ?? "");

function isImage(file: File) {
  return file.type.startsWith("image/") || /\.hei[cf]$/i.test(file.name);
}

export function WardrobeBoard({ userId, initialItems }: { userId: string; initialItems: WardrobeItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [editingId, setEditingId] = useState<string>();
  const [pickingStarters, setPickingStarters] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [colorFilter, setColorFilter] = useState<string | null>(null);
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

  // Each filter's counts reflect the other filter, so a pill never promises items that won't show.
  const matchesColor = (i: WardrobeItem) => !colorFilter || i.colors.some((c) => colorKey(c) === colorFilter);
  const matchesType = (i: WardrobeItem) => !typeFilter || groupOf(i) === typeFilter;
  const typeOptions: FilterOption[] = GROUPS.map((g) => ({
    value: g,
    label: GROUP_LABELS[g],
    count: items.filter((i) => matchesColor(i) && groupOf(i) === g).length,
  })).filter((o) => o.count > 0 || o.value === typeFilter);
  const colorCounts = new Map<string, number>();
  for (const item of items.filter(matchesType)) {
    for (const c of new Set(item.colors.map(colorKey))) colorCounts.set(c, (colorCounts.get(c) ?? 0) + 1);
  }
  if (colorFilter && !colorCounts.has(colorFilter)) colorCounts.set(colorFilter, 0);
  const colorOptions: FilterOption[] = [...colorCounts]
    .map(([value, count]) => ({ value, label: value, count }))
    .toSorted((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  const visible = items.filter((i) => matchesType(i) && matchesColor(i));
  const groups = GROUPS.map((g) => ({ group: g, items: visible.filter((i) => groupOf(i) === g).toSorted(bySubtype) })).filter(
    (g) => g.items.length > 0,
  );
  const filtering = typeFilter !== null || colorFilter !== null;
  const clearFilters = () => {
    setTypeFilter(null);
    setColorFilter(null);
  };
  const failedUploads = uploads.filter((u) => u.error).length;

  return (
    <div
      className="flex flex-1 flex-col gap-8"
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
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-3xl font-semibold tracking-tight">Wardrobe</h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span>
              {filtering ? `${visible.length} of ${items.length}` : items.length} item{items.length === 1 ? "" : "s"}
            </span>
            {filtering && (
              <Button variant="link" size="sm" className="h-auto p-0" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
            {uploads.length - failedUploads > 0 && <span>· uploading {uploads.length - failedUploads}</span>}
            {untagged.length > 0 && (
              <span>
                · {untagged.length} need{untagged.length === 1 ? "s" : ""} tags
              </span>
            )}
            {tagQueue.busy ? (
              <Button variant="link" size="sm" className="h-auto p-0" onClick={tagQueue.stop}>
                Stop AI tagging ({tagQueue.states.size} left)
              </Button>
            ) : (
              untagged.length > 0 && (
                <Button variant="link" size="sm" className="h-auto p-0" onClick={() => tagQueue.enqueue(untagged.map((i) => i.id))}>
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
        </div>
        <div className="flex gap-2">
          <Button size="lg" className="rounded-full px-5" onClick={() => inputRef.current?.click()}>
            <Plus />
            Add photos
          </Button>
          <Button size="lg" variant="secondary" className="rounded-full px-5" onClick={() => setPickingStarters(true)}>
            Starter items
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
      </header>

      {dragging && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-6 backdrop-blur-sm">
          <div className="flex size-full flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-primary text-center">
            <ImagePlus className="size-10" strokeWidth={1.5} />
            <p className="text-lg font-semibold">Drop to add to your wardrobe</p>
            <p className="text-sm text-muted-foreground">One item per photo works best.</p>
          </div>
        </div>
      )}

      {items.length + uploads.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-20 text-center">
          <ImagePlus className="size-10 text-muted-foreground" strokeWidth={1.5} />
          <p className="font-medium">Your closet is empty</p>
          <p className="text-sm text-muted-foreground">
            Add photos, one item per photo, or drag them anywhere on this page. Starter items get you going without photos.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {items.length > 0 && (
            <ClosetFilters
              types={typeOptions}
              type={typeFilter}
              onTypeChange={setTypeFilter}
              colors={colorOptions}
              color={colorFilter}
              onColorChange={setColorFilter}
            />
          )}
          {uploads.length > 0 && (
            <section className="flex flex-col gap-4">
              <h2 className="text-xl font-semibold">Uploading</h2>
              <div className={GRID}>
                {uploads.map((u) => (
                  <UploadTile key={u.id} {...u} />
                ))}
              </div>
            </section>
          )}
          {groups.map(({ group, items: groupItems }) => (
            <section key={group} className="flex flex-col gap-4">
              <h2 className="text-xl font-semibold">
                {GROUP_LABELS[group]} <span className="font-normal text-muted-foreground">{groupItems.length}</span>
              </h2>
              <div className={GRID}>
                {groupItems.map((item) => (
                  <ItemTile
                    key={item.id}
                    item={item}
                    queueState={tagQueue.states.get(item.id)}
                    onOpen={() => setEditingId(item.id)}
                    onAutoTag={() => tagQueue.enqueue([item.id])}
                  />
                ))}
              </div>
            </section>
          ))}
          {filtering && groups.length === 0 && (
            <p className="py-12 text-center text-muted-foreground">
              Nothing matches these filters.{" "}
              <Button variant="link" className="h-auto p-0" onClick={clearFilters}>
                Clear filters
              </Button>
            </p>
          )}
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
