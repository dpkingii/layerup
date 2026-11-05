import {
  Columns2,
  Footprints,
  Glasses,
  Layers2,
  Layers3,
  PersonStanding,
  Shirt,
  type LucideIcon,
} from "lucide-react";
import type { z } from "zod";
import type { ItemSlot } from "@/lib/schemas";
import { cn } from "@/lib/utils";

type Slot = z.infer<typeof ItemSlot>;

export const SLOT_LABELS: Record<Slot, string> = {
  base: "Base layer",
  mid: "Mid layer",
  outer: "Outer layer",
  bottom: "Bottom",
  one_piece: "One-piece",
  shoes: "Shoes",
  accessory: "Accessory",
};

export const SLOT_ICONS: Record<Slot, LucideIcon> = {
  base: Shirt,
  mid: Layers2,
  outer: Layers3,
  bottom: Columns2,
  one_piece: PersonStanding,
  shoes: Footprints,
  accessory: Glasses,
};

// Tag colors are free text from the model or the user; map common non-CSS names, pass the rest through.
const COLOR_ALIASES: Record<string, string> = {
  camel: "#c19a6b",
  charcoal: "#36454f",
  cream: "#fffdd0",
  denim: "#1560bd",
  "light blue": "lightblue",
  "dark blue": "darkblue",
  brown: "#6f4e37",
  "dark brown": "#4a3424",
  burgundy: "#800020",
  multicolor: "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)",
};

export function ColorSwatch({ color, className }: { color: string; className?: string }) {
  const key = color.trim().toLowerCase();
  return (
    <span
      title={color}
      className={cn("inline-block size-4 shrink-0 rounded-full border border-foreground/15", className)}
      style={{ background: COLOR_ALIASES[key] ?? key.replace(/\s+/g, "") }}
    />
  );
}
