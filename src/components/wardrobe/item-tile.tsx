import { CircleAlert, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WardrobeItem } from "@/lib/wardrobe/items";
import { ColorSwatch, SLOT_ICONS, SLOT_LABELS } from "./slots";

export function ItemTile({
  item,
  onOpen,
  onRetry,
}: {
  item: WardrobeItem;
  onOpen: () => void;
  onRetry: () => void;
}) {
  const Icon = item.slot ? SLOT_ICONS[item.slot] : null;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
        <button
          type="button"
          onClick={onOpen}
          className="group absolute inset-0 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
          aria-label={`Edit ${item.subtype ?? "item"}`}
        >
          {item.photoUrl ? (
            // Signed Supabase URLs change per session; next/image would need remotePatterns in the shared config.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.photoUrl}
              alt={item.subtype ?? "Clothing item"}
              loading="lazy"
              className="size-full object-cover transition-transform group-hover:scale-[1.02]"
            />
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-3 text-muted-foreground">
              {Icon && <Icon className="size-10" strokeWidth={1.5} />}
              <div className="flex gap-1">
                {item.colors.map((c) => (
                  <ColorSwatch key={c} color={c} className="size-5" />
                ))}
              </div>
            </div>
          )}
          {item.tag_status === "pending" && (
            <span className="absolute inset-x-2 bottom-2 flex items-center justify-center gap-1.5 rounded-md bg-background/85 py-1 text-xs font-medium backdrop-blur">
              <Loader2 className="size-3.5 animate-spin" />
              Tagging…
            </span>
          )}
          {item.tag_status === "tagged" && (
            <span className="absolute top-2 left-2 rounded-md bg-background/85 px-1.5 py-0.5 text-xs font-medium backdrop-blur">
              Review
            </span>
          )}
          {item.tag_status === "failed" && (
            <span className="absolute top-2 left-2 flex items-center gap-1 rounded-md bg-background/85 px-1.5 py-0.5 text-xs font-medium text-destructive backdrop-blur">
              <CircleAlert className="size-3.5" />
              Tagging failed
            </span>
          )}
        </button>
        {item.tag_status === "failed" && (
          <Button size="sm" variant="secondary" onClick={onRetry} className="absolute inset-x-2 bottom-2">
            <RefreshCw />
            Retry
          </Button>
        )}
      </div>
      <div className="min-w-0 px-0.5">
        <p className="truncate text-sm font-medium first-letter:uppercase">{item.subtype ?? "Untagged"}</p>
        <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
          {item.photoUrl && item.colors[0] && <ColorSwatch color={item.colors[0]} className="size-3" />}
          {item.slot ? SLOT_LABELS[item.slot] : " "}
        </p>
      </div>
    </div>
  );
}

export function UploadTile({ name, previewUrl, error }: { name: string; previewUrl?: string; error?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {previewUrl && <img src={previewUrl} alt="" className="size-full object-cover opacity-60" />}
        <span className="absolute inset-x-2 bottom-2 flex items-center justify-center gap-1.5 rounded-md bg-background/85 py-1 text-xs font-medium backdrop-blur">
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
      <p className="truncate px-0.5 text-sm text-muted-foreground" title={error ?? name}>
        {error ?? name}
      </p>
    </div>
  );
}
