import type { z } from "zod";
import type { ItemSlot } from "@/lib/schemas";

export const SLOT_LABELS: Record<z.infer<typeof ItemSlot>, string> = {
  base: "Base",
  mid: "Mid layer",
  outer: "Outer",
  bottom: "Bottom",
  one_piece: "One-piece",
  shoes: "Shoes",
  accessory: "Accessory",
};

export const SLOT_ORDER = Object.keys(SLOT_LABELS) as z.infer<typeof ItemSlot>[];
