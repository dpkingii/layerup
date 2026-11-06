import { CircleAlert, Clock, Loader2, Pencil, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WardrobeItem } from "@/lib/wardrobe/items";
import { ColorSwatch, SLOT_ICONS } from "./slots";
import type { QueueState } from "./use-tag-queue";

const QUEUE_LABELS: Record<QueueState, string> = {
  queued: "Queued for AI…",
  tagging: "AI tagging…",
  waiting: "Waiting for AI quota…",
};

export function ItemTile({
  item,
  queueState,
  onOpen,
  onAutoTag,
}: {
  item: WardrobeItem;
  queueState?: QueueState;
  onOpen: () => void;
  onAutoTag: () => void;
}) {
  const Icon = item.slot ? SLOT_ICONS[item.slot] : null;
  const QueueIcon = queueState === "waiting" ? Clock : Loader2;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative aspect-4/5 overflow-hidden rounded-2xl bg-card">
        <button
          type="button"
          onClick={onOpen}
          className="group absolute inset-0 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
          aria-label={`Edit ${item.subtype ?? "item"}`}
        >
          {item.cutoutUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.cutoutUrl}
              alt={item.subtype ?? "Clothing item"}
              loading="lazy"
              className="size-full object-contain p-5 drop-shadow-[0_6px_10px_rgb(0_0_0/0.35)] motion-safe:transition-transform motion-safe:group-hover:scale-[1.03]"
            />
          ) : item.photoUrl ? (
            // Signed Supabase URLs change per session; next/image would need remotePatterns in the shared config.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.photoUrl}
              alt={item.subtype ?? "Clothing item"}
              loading="lazy"
              className="size-full object-cover outline outline-1 -outline-offset-1 outline-white/10 motion-safe:transition-transform motion-safe:group-hover:scale-[1.02]"
            />
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-3 text-muted-foreground">
              {Icon && <Icon className="size-10" strokeWidth={1.5} />}
              {item.subtype && <span className="px-3 text-center text-sm font-medium text-foreground first-letter:uppercase">{item.subtype}</span>}
              <div className="flex gap-1">
                {item.colors.map((c) => (
                  <ColorSwatch key={c} color={c} className="size-5" />
                ))}
              </div>
            </div>
          )}
          <span aria-hidden className="absolute inset-0 transition-colors group-hover:bg-black/25" />
          <span
            aria-hidden
            className="absolute top-2 right-2 flex size-8 items-center justify-center rounded-full bg-background/90 text-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
          >
            <Pencil className="size-3.5" />
          </span>
          {item.tag_status === "pending" && (
            <span className="absolute top-2 left-2 rounded-full bg-background/85 px-2 py-0.5 text-xs font-medium backdrop-blur">
              Needs tags
            </span>
          )}
          {item.tag_status === "tagged" && (
            <span className="absolute top-2 left-2 rounded-full bg-background/85 px-2 py-0.5 text-xs font-medium backdrop-blur">
              Review
            </span>
          )}
          {item.tag_status === "failed" && (
            <span className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-background/85 px-2 py-0.5 text-xs font-medium text-destructive backdrop-blur">
              <CircleAlert className="size-3.5" />
              Tagging failed
            </span>
          )}
        </button>
        {queueState ? (
          <span className="absolute inset-x-2 bottom-2 flex items-center justify-center gap-1.5 rounded-full bg-background/85 py-1 text-xs font-medium backdrop-blur">
            <QueueIcon className={queueState === "waiting" ? "size-3.5" : "size-3.5 animate-spin"} />
            {QUEUE_LABELS[queueState]}
          </span>
        ) : (
          item.photo_path &&
          (item.tag_status === "pending" || item.tag_status === "failed") && (
            <Button size="sm" variant="secondary" onClick={onAutoTag} className="absolute inset-x-2 bottom-2 rounded-full">
              {item.tag_status === "failed" ? <RefreshCw /> : <Sparkles />}
              {item.tag_status === "failed" ? "Retry AI" : "Auto-tag"}
            </Button>
          )
        )}
      </div>
    </div>
  );
}

export function UploadTile({ name, previewUrl, error }: { name: string; previewUrl?: string; error?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative aspect-4/5 overflow-hidden rounded-2xl bg-muted" title={error ?? name}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {previewUrl && <img src={previewUrl} alt="" className="size-full object-cover opacity-60 outline outline-1 -outline-offset-1 outline-white/10" />}
        <span className="absolute inset-x-2 bottom-2 flex items-center justify-center gap-1.5 rounded-full bg-background/85 py-1 text-xs font-medium backdrop-blur">
          {error ? (
            <span className="text-destructive">Upload failed</span>
          ) : (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              Uploading…
            </>
          )}
        </span>
      </div>
    </div>
  );
}
