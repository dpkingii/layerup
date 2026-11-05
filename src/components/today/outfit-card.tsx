"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SLOT_ICONS } from "@/components/wardrobe/slots";
import { SLOT_LABELS } from "@/lib/outfit/labels";
import type { StylistItem } from "@/lib/outfit/types";
import type { Outfit } from "@/lib/schemas";
import { cn } from "@/lib/utils";

const SWIPE_PX = 40;

type Items = Outfit["items"];
type Slot = Items[number]["slot"];

// Innermost first: later layers sit in front and overlap the ones before.
const UPPER_ORDER: Slot[] = ["one_piece", "base", "mid", "outer"];

// Pieces are sized by height so hems and waists line up across items photographed at different scales.
const PIECE_HEIGHT: Record<Slot, string> = {
  base: "h-44",
  mid: "h-44",
  outer: "h-44",
  one_piece: "h-96",
  bottom: "h-56",
  shoes: "h-16",
  accessory: "h-14",
};

export function OutfitCard({
  items,
  closet,
  editable,
  onChange,
}: {
  items: Items;
  closet: Map<string, StylistItem>;
  editable: boolean;
  onChange: (items: Items) => void;
}) {
  function swap(index: number, step: 1 | -1) {
    const current = items[index];
    const usedElsewhere = new Set(items.filter((_, i) => i !== index).map((it) => it.itemId));
    const options = [...closet.values()].filter(
      (c) => c.slot === current.slot && (c.id === current.itemId || !usedElsewhere.has(c.id)),
    );
    const at = options.findIndex((c) => c.id === current.itemId);
    const next = options[(at + step + options.length) % options.length];
    if (!next || next.id === current.itemId) return;
    onChange(items.map((it, i) => (i === index ? { ...it, itemId: next.id } : it)));
  }

  const pieces = items.flatMap((entry, index) => {
    const item = closet.get(entry.itemId);
    if (!item) return [];
    const swappable = editable && [...closet.values()].some((c) => c.slot === entry.slot && c.id !== entry.itemId);
    return [{ key: entry.slot + index, item, slot: entry.slot, onSwap: swappable ? (step: 1 | -1) => swap(index, step) : undefined }];
  });
  const inSlots = (...slots: Slot[]) => pieces.filter((p) => slots.includes(p.slot));
  const upper = inSlots(...UPPER_ORDER).toSorted((a, b) => UPPER_ORDER.indexOf(a.slot) - UPPER_ORDER.indexOf(b.slot));

  return (
    <div className="flex flex-col items-center py-2" aria-label="Outfit">
      <Row pieces={inSlots("accessory")} className="mb-1" />
      <Layers pieces={upper} />
      <Row pieces={inSlots("bottom")} className="relative z-10 -mt-6" />
      <Row pieces={inSlots("shoes")} className="relative z-20 -mt-1" />
    </div>
  );
}

type PieceProps = { key: string; item: StylistItem; slot: Slot; onSwap?: (step: 1 | -1) => void };

function Row({ pieces, className }: { pieces: PieceProps[]; className?: string }) {
  if (!pieces.length) return null;
  return (
    <div className={cn("flex max-w-full justify-center", className)}>
      {pieces.map(({ key, ...piece }) => (
        <Piece key={key} {...piece} />
      ))}
    </div>
  );
}

// Share of an inner layer's own width that shows past the left edge of the layer in front.
const PEEK = 0.4;

// The outermost layer stands centered over the bottoms; each inner layer sits behind it,
// shifted left and slightly smaller, so every layer stays visible and swipeable.
function Layers({ pieces }: { pieces: PieceProps[] }) {
  if (!pieces.length) return null;
  const { key: frontKey, ...front } = pieces.at(-1)!;
  const behind = pieces.slice(0, -1);
  return (
    <div className="relative z-20 flex justify-center">
      {behind.map(({ key, ...piece }, i) => {
        const depth = behind.length - i;
        return (
          <Piece
            key={key}
            {...piece}
            className="absolute top-0 left-1/2 w-max origin-top"
            arrowsLeft
            style={{ transform: `translateX(-${50 + depth * PEEK * 100}%) scale(${1 - depth * 0.06})` }}
          />
        );
      })}
      <Piece key={frontKey} {...front} />
    </div>
  );
}

function Piece({
  item,
  slot,
  onSwap,
  className,
  style,
  arrowsLeft,
}: Omit<PieceProps, "key"> & { className?: string; style?: React.CSSProperties; arrowsLeft?: boolean }) {
  const startX = useRef<number | null>(null);
  const Icon = SLOT_ICONS[slot];
  const height = PIECE_HEIGHT[slot];

  return (
    <div
      className={cn("group relative flex min-w-0 shrink justify-center", onSwap && "touch-pan-y select-none", className)}
      style={style}
      onPointerDown={(e) => {
        startX.current = e.clientX;
      }}
      onPointerUp={(e) => {
        if (!onSwap || startX.current == null) return;
        const dx = e.clientX - startX.current;
        startX.current = null;
        if (Math.abs(dx) >= SWIPE_PX) onSwap(dx < 0 ? 1 : -1);
      }}
    >
      {item.cutoutUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- short-lived signed URLs
        <img
          src={item.cutoutUrl}
          alt={item.label}
          draggable={false}
          className={cn(height, "w-auto max-w-full object-contain drop-shadow-[0_6px_10px_rgb(0_0_0/0.35)]")}
        />
      ) : item.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- short-lived signed URLs
        <img
          src={item.photoUrl}
          alt={item.label}
          draggable={false}
          className={cn(height, "aspect-square max-w-full rounded-2xl object-cover shadow-sm outline outline-1 -outline-offset-1 outline-white/10")}
        />
      ) : (
        <div
          className={cn(
            height,
            "flex aspect-square max-w-full flex-col items-center justify-center gap-1 rounded-2xl bg-muted p-2 text-center text-xs text-muted-foreground",
          )}
        >
          <Icon className="size-6 shrink-0" strokeWidth={1.5} aria-hidden />
          <span className="line-clamp-2 first-letter:uppercase">{item.label}</span>
        </div>
      )}
      {onSwap && (
        <div
          className={cn(
            "absolute top-1/2 z-30 flex -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100",
            // An inner layer's right side is hidden behind the layer in front, so both arrows go on its visible left edge.
            arrowsLeft ? "left-0 flex-col gap-1" : "inset-x-0 justify-between",
          )}
        >
          <SwapButton label={`Previous ${SLOT_LABELS[slot].toLowerCase()}`} onClick={() => onSwap(-1)}>
            <ChevronLeft className="size-4" />
          </SwapButton>
          <SwapButton label={`Next ${SLOT_LABELS[slot].toLowerCase()}`} onClick={() => onSwap(1)}>
            <ChevronRight className="size-4" />
          </SwapButton>
        </div>
      )}
    </div>
  );
}

function SwapButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      onClick={onClick}
      className="flex size-8 items-center justify-center rounded-full bg-background/90 shadow-sm backdrop-blur outline-none hover:bg-background focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {children}
    </button>
  );
}

export function OutfitCardSkeleton() {
  return (
    <div className="flex flex-col items-center gap-2 py-2" aria-hidden>
      <div className="h-44 w-40 animate-pulse rounded-3xl bg-muted" />
      <div className="h-52 w-28 animate-pulse rounded-3xl bg-muted" />
      <div className="h-14 w-32 animate-pulse rounded-2xl bg-muted" />
    </div>
  );
}
