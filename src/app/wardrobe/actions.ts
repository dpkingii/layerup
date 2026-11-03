"use server";

import { z } from "zod";
import { ItemTags } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";
import { BUCKET, photoPath, type ItemRow } from "@/lib/wardrobe/items";
import { STARTER_ITEMS } from "@/lib/wardrobe/starter-items";
import { suggestTags, type SuggestResult } from "@/lib/wardrobe/tagging";

const ItemId = z.uuid();

async function signedIn() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) throw new Error("Not signed in");
  return { supabase, userId: data.claims.sub };
}

// The client uploads the photo to <user_id>/<id>.jpg first, because the items
// table requires photo_path on every non-generic row.
export async function addPhotoItem(id: string): Promise<ItemRow> {
  const itemId = ItemId.parse(id);
  const { supabase, userId } = await signedIn();
  const path = photoPath(userId, itemId);

  const { data, error } = await supabase
    .from("items")
    .insert({ id: itemId, photo_path: path, is_generic: false, tag_status: "pending" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function photoOf(supabase: Awaited<ReturnType<typeof createClient>>, itemId: string) {
  const { data, error } = await supabase.from("items").select("photo_path").eq("id", itemId).single();
  if (error) throw error;
  if (!data.photo_path) throw new Error("Item has no photo");
  return data.photo_path;
}

// Fills the editor form; nothing is saved until the user confirms.
export async function suggestItemTags(id: string): Promise<SuggestResult> {
  const itemId = ItemId.parse(id);
  const { supabase } = await signedIn();
  return suggestTags(supabase, await photoOf(supabase, itemId));
}

export type AutoTagResult = { status: "ok" | "failed"; row: ItemRow } | { status: "rate_limited" };

// For grid tagging: saves suggestions as 'tagged' for later review. Only touches items
// still untagged, so it can't overwrite tags the user confirmed while the queue ran.
export async function autoTagItem(id: string): Promise<AutoTagResult> {
  const itemId = ItemId.parse(id);
  const { supabase } = await signedIn();
  const result = await suggestTags(supabase, await photoOf(supabase, itemId));
  if (result.status === "rate_limited") return result;

  const { data, error } = await supabase
    .from("items")
    .update(result.status === "ok" ? { ...result.tags, tag_status: "tagged" } : { tag_status: "failed" })
    .eq("id", itemId)
    .in("tag_status", ["pending", "failed"])
    .select()
    .maybeSingle();
  if (error) throw error;
  if (data) return { status: result.status, row: data };

  const { data: current, error: currentError } = await supabase.from("items").select().eq("id", itemId).single();
  if (currentError) throw currentError;
  return { status: "ok", row: current };
}

export async function updateItemTags(id: string, tags: ItemTags): Promise<ItemRow> {
  const itemId = ItemId.parse(id);
  const parsed = ItemTags.parse(tags);
  const { supabase } = await signedIn();

  const { data, error } = await supabase
    .from("items")
    .update({ ...parsed, tag_status: "confirmed" })
    .eq("id", itemId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteItem(id: string) {
  const itemId = ItemId.parse(id);
  const { supabase } = await signedIn();

  const { data: item, error } = await supabase.from("items").select("photo_path").eq("id", itemId).single();
  if (error) throw error;

  if (item.photo_path) {
    const { error: storageError } = await supabase.storage.from(BUCKET).remove([item.photo_path]);
    if (storageError) throw storageError;
  }
  const { error: deleteError } = await supabase.from("items").delete().eq("id", itemId);
  if (deleteError) throw deleteError;
}

export async function addStarterItems(keys: string[]): Promise<ItemRow[]> {
  const picked = STARTER_ITEMS.filter((s) => keys.includes(s.key));
  if (!picked.length) return [];
  const { supabase } = await signedIn();

  const { data, error } = await supabase
    .from("items")
    .insert(picked.map((s) => ({ ...s.tags, is_generic: true, photo_path: null, tag_status: "confirmed" as const })))
    .select();
  if (error) throw error;
  return data;
}
