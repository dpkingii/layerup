"use server";

import { APICallError, RetryError } from "ai";
import { z } from "zod";
import { Outfit, WeatherWindow } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";
import { canDress, generateOutfit, loadCloset, loadProfile, type SessionTurn } from "@/lib/outfit/generate";
import { SLOT_ORDER } from "@/lib/outfit/labels";
import type { SuggestionView } from "@/lib/outfit/types";

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

const OutfitItems = Outfit.shape.items;

const AskInput = z.object({
  sessionId: z.uuid(),
  message: z.string().trim().min(1).max(300),
  weather: WeatherWindow,
  // The latest outfit as the user left it after swiping pieces.
  kept: z.object({ suggestionId: z.uuid(), items: OutfitItems }).optional(),
});
export type AskInput = z.input<typeof AskInput>;

export async function askStylist(input: AskInput): Promise<ActionResult<SuggestionView>> {
  const parsed = AskInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  const { sessionId, message, weather, kept } = parsed.data;

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth) return { ok: false, error: "You're signed out. Sign in again." };

  try {
    if (kept) await saveKept(supabase, kept.suggestionId, kept.items);

    const [closet, profile, history] = await Promise.all([
      loadCloset(supabase),
      loadProfile(supabase),
      supabase
        .from("suggestions")
        .select("prompt, outfit, feedback")
        .eq("session_id", sessionId)
        .order("created_at")
        .then(({ data, error }): SessionTurn[] => {
          if (error) throw error;
          return data.map((row) => ({
            prompt: row.prompt ?? "",
            outfit: Outfit.parse(row.outfit),
            edited: row.feedback?.includes("edited") ?? false,
          }));
        }),
    ]);

    if (!canDress(closet)) {
      return { ok: false, error: "Your closet needs at least a top, a bottom and shoes. Add or tag them in Wardrobe." };
    }

    const { context, ...reply } = await generateOutfit({ closet, profile, weather, message, history });
    const outfit = { ...reply, items: reply.items.toSorted((a, b) => SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot)) };

    const { data: row, error } = await supabase
      .from("suggestions")
      .insert({ session_id: sessionId, prompt: message, context, weather, outfit, rationale: outfit.rationale })
      .select("id")
      .single();
    if (error) throw error;

    return { ok: true, data: { id: row.id, items: outfit.items, rationale: outfit.rationale } };
  } catch (e) {
    const cause = RetryError.isInstance(e) ? e.lastError : e;
    if (APICallError.isInstance(cause) && cause.statusCode === 429) {
      return { ok: false, error: "AI limit reached. Wait a minute and try again." };
    }
    console.error("askStylist failed", e);
    return { ok: false, error: "Couldn't put an outfit together. Try again." };
  }
}

export async function wearOutfit(suggestionId: string, items: z.input<typeof OutfitItems>): Promise<ActionResult<null>> {
  const parsedId = z.uuid().safeParse(suggestionId);
  const parsedItems = OutfitItems.safeParse(items);
  if (!parsedId.success || !parsedItems.success) return { ok: false, error: "Invalid request." };

  const supabase = await createClient();
  try {
    await saveKept(supabase, parsedId.data, parsedItems.data);
    const { error } = await supabase
      .from("suggestions")
      .update({ worn_at: new Date().toISOString() })
      .eq("id", parsedId.data);
    if (error) throw error;
    return { ok: true, data: null };
  } catch (e) {
    console.error("wearOutfit failed", e);
    return { ok: false, error: "Couldn't save that. Try again." };
  }
}

type Supabase = Awaited<ReturnType<typeof createClient>>;

// Saves swiped pieces over the stored outfit; a no-op when nothing was swapped.
async function saveKept(supabase: Supabase, suggestionId: string, items: Outfit["items"]) {
  const { data, error } = await supabase.from("suggestions").select("outfit").eq("id", suggestionId).single();
  if (error) throw error;
  const outfit = Outfit.parse(data.outfit);
  if (JSON.stringify(outfit.items) === JSON.stringify(items)) return;

  const { error: updateError } = await supabase
    .from("suggestions")
    .update({ outfit: { ...outfit, items }, feedback: ["edited"] })
    .eq("id", suggestionId);
  if (updateError) throw updateError;
}
