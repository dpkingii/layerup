"use server";

import { z } from "zod";
import { Outfit, DayContext, ShuffleFeedback, WeatherWindow } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";
import { generateOutfit as runModel, loadCloset, loadProfile, toFeedbackStrings } from "@/lib/outfit/generate";
import { SLOT_ORDER } from "@/lib/outfit/labels";
import type { OutfitTile, SuggestionView } from "@/lib/outfit/types";

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

const GenerateInput = z.object({
  sessionId: z.uuid(),
  context: DayContext,
  weather: WeatherWindow,
  rejected: z.object({ suggestionId: z.uuid(), feedback: ShuffleFeedback }).optional(),
});
export type GenerateInput = z.input<typeof GenerateInput>;

export async function generateOutfit(input: GenerateInput): Promise<ActionResult<SuggestionView>> {
  const parsed = GenerateInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  const { sessionId, context, weather, rejected } = parsed.data;

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth) return { ok: false, error: "You're signed out. Sign in again." };

  try {
    if (rejected) {
      const { error } = await supabase
        .from("suggestions")
        .update({ feedback: toFeedbackStrings(rejected.feedback) })
        .eq("id", rejected.suggestionId);
      if (error) throw error;
    }

    const [closet, profile, history] = await Promise.all([
      loadCloset(supabase),
      loadProfile(supabase),
      supabase
        .from("suggestions")
        .select("outfit, feedback")
        .eq("session_id", sessionId)
        .order("created_at")
        .then(({ data, error }) => {
          if (error) throw error;
          return data.map((row) => ({ outfit: Outfit.parse(row.outfit), feedback: row.feedback }));
        }),
    ]);

    const outfit = await runModel({ closet, profile, weather, context, history });

    const { data: row, error } = await supabase
      .from("suggestions")
      .insert({ session_id: sessionId, context, weather, outfit, rationale: outfit.rationale })
      .select("id")
      .single();
    if (error) throw error;

    const byId = new Map(closet.map((item) => [item.id, item]));
    const picked = outfit.items
      .flatMap(({ slot, itemId }) => {
        const item = byId.get(itemId);
        return item ? [{ slot, item }] : [];
      })
      .sort((a, b) => SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot));

    const photoPaths = picked.flatMap(({ item }) => (item.photoPath ? [item.photoPath] : []));
    const signed = new Map<string, string>();
    if (photoPaths.length > 0) {
      const { data: urls, error: urlError } = await supabase.storage.from("wardrobe").createSignedUrls(photoPaths, 60 * 60);
      if (urlError) throw urlError;
      urls.forEach((u) => u.path && u.signedUrl && signed.set(u.path, u.signedUrl));
    }

    const tiles: OutfitTile[] = picked.map(({ slot, item }) => ({
      slot,
      itemId: item.id,
      label: `${item.colors[0]} ${item.subtype}`,
      photoUrl: item.photoPath ? (signed.get(item.photoPath) ?? null) : null,
    }));

    return { ok: true, data: { id: row.id, context, tiles, rationale: outfit.rationale } };
  } catch (e) {
    console.error("generateOutfit failed", e);
    return { ok: false, error: "Couldn't put an outfit together. Try again." };
  }
}

export async function wearOutfit(suggestionId: string): Promise<ActionResult<null>> {
  const parsed = z.uuid().safeParse(suggestionId);
  if (!parsed.success) return { ok: false, error: "Invalid request." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("suggestions")
    .update({ worn_at: new Date().toISOString() })
    .eq("id", parsed.data)
    .select("id");
  if (error || data.length === 0) {
    if (error) console.error("wearOutfit failed", error);
    return { ok: false, error: "Couldn't save that. Try again." };
  }
  return { ok: true, data: null };
}
