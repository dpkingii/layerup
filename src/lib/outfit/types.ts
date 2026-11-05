import type { z } from "zod";
import type { FitPref, ItemSlot, ItemTags, Outfit, TempSensitivity } from "@/lib/schemas";

export type ClosetItem = ItemTags & { id: string; photoPath: string | null };

export type OutfitProfile = {
  vibes: string[];
  tempSensitivity: z.infer<typeof TempSensitivity>;
  fitPref: z.infer<typeof FitPref> | null;
};

// What the stylist chat needs to draw a tile and offer swaps.
export type StylistItem = {
  id: string;
  slot: z.infer<typeof ItemSlot>;
  label: string;
  photoUrl: string | null;
  cutoutUrl: string | null;
};

export type SuggestionView = {
  id: string;
  items: Outfit["items"];
  rationale: string;
};
