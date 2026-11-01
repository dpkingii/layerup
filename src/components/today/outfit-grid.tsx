import { Check, Shirt } from "lucide-react";
import { SLOT_LABELS } from "@/lib/outfit/labels";
import type { OutfitTile } from "@/lib/outfit/types";
import { cn } from "@/lib/utils";

const GRID = "grid grid-cols-2 gap-3 sm:grid-cols-3";

export function OutfitGrid({
  tiles,
  selecting,
  selectedIds,
  onToggle,
}: {
  tiles: OutfitTile[];
  selecting?: boolean;
  selectedIds?: Set<string>;
  onToggle?: (itemId: string) => void;
}) {
  return (
    <ul className={GRID}>
      {tiles.map((tile) => {
        const selected = selectedIds?.has(tile.itemId) ?? false;
        const body = (
          <>
            {tile.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- short-lived signed URLs; next/image would need a remotePatterns entry in the shared config
              <img src={tile.photoUrl} alt={tile.label} className="size-full object-cover" />
            ) : (
              <div className="flex size-full flex-col items-center justify-center gap-2 p-3 text-center text-muted-foreground">
                <Shirt className="size-8" aria-hidden />
                <span className="text-sm capitalize">{tile.label}</span>
              </div>
            )}
            <span className="absolute top-2 left-2 rounded-md bg-background/85 px-1.5 py-0.5 text-xs font-medium">
              {SLOT_LABELS[tile.slot]}
            </span>
            {selected && (
              <span className="absolute top-2 right-2 rounded-full bg-primary p-1 text-primary-foreground">
                <Check className="size-3" aria-hidden />
              </span>
            )}
          </>
        );
        const tileClass = cn(
          "relative block aspect-square w-full overflow-hidden rounded-xl bg-muted",
          selected && "ring-3 ring-primary",
        );

        return (
          <li key={`${tile.slot}-${tile.itemId}`}>
            {selecting ? (
              <button
                type="button"
                aria-pressed={selected}
                aria-label={`${SLOT_LABELS[tile.slot]}: ${tile.label}`}
                onClick={() => onToggle?.(tile.itemId)}
                className={cn(tileClass, "cursor-pointer outline-none focus-visible:ring-3 focus-visible:ring-ring/50")}
              >
                {body}
              </button>
            ) : (
              <div className={tileClass} title={tile.label}>
                {body}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function OutfitGridSkeleton() {
  return (
    <ul className={GRID} aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (
        <li key={i} className="aspect-square animate-pulse rounded-xl bg-muted" />
      ))}
    </ul>
  );
}
