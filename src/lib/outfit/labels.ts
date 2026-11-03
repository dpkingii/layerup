import type { z } from "zod";
import type { DayContext, FeedbackReason, ItemSlot } from "@/lib/schemas";

export const CONTEXT_LABELS: Record<z.infer<typeof DayContext>, string> = {
  work: "Work",
  casual: "Casual",
  active: "Active",
  going_out: "Going out",
};

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

export const FEEDBACK_LABELS: Record<z.infer<typeof FeedbackReason>, string> = {
  too_warm: "Too warm",
  too_cold: "Too cold",
  too_formal: "Too formal",
  too_casual: "Too casual",
  dislike_piece: "Dislike a piece",
};
