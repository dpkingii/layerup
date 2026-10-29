"use server";

import { after } from "next/server";
import { z } from "zod";
import { ItemTags } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";
import { BUCKET, photoPath, type ItemRow } from "@/lib/wardrobe/items";
import { STARTER_ITEMS } from "@/lib/wardrobe/starter-items";
import { tagItem } from "@/lib/wardrobe/tagging";

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

  after(() => tagItem(supabase, itemId, path));
  return data;
}

export async function retryTagging(id: string): Promise<ItemRow> {
  const itemId = ItemId.parse(id);
  const { supabase } = await signedIn();

  const { data, error } = await supabase
    .from("items")
    .update({ tag_status: "pending" })
    .eq("id", itemId)
    .eq("tag_status", "failed")
    .not("photo_path", "is", null)
    .select()
    .single();
  if (error) throw error;

  after(() => tagItem(supabase, itemId, data.photo_path!));
  return data;
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
