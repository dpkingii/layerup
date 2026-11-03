import type { z } from "zod";
import type { DayContext, FitPref, ItemSlot, ItemTags, TempSensitivity } from "@/lib/schemas";

export type ClosetItem = ItemTags & { id: string; photoPath: string | null };

export type OutfitProfile = {
  vibes: string[];
  tempSensitivity: z.infer<typeof TempSensitivity>;
  fitPref: z.infer<typeof FitPref> | null;
};

export type OutfitTile = {
  slot: z.infer<typeof ItemSlot>;
  itemId: string;
  label: string;
  photoUrl: string | null;
};

export type SuggestionView = {
  id: string;
  context: z.infer<typeof DayContext>;
  tiles: OutfitTile[];
  rationale: string;
};
