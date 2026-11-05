import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { ItemTags } from "@/lib/schemas";

export const BUCKET = "wardrobe";

export type ItemRow = Database["public"]["Tables"]["items"]["Row"];
export type WardrobeItem = ItemRow & { photoUrl: string | null; cutoutUrl: string | null };

export function photoPath(userId: string, itemId: string) {
  return `${userId}/${itemId}.jpg`;
}

export function cutoutPath(userId: string, itemId: string) {
  return `${userId}/${itemId}.png`;
}

export function tagsFromRow(item: ItemRow): ItemTags | null {
  const parsed = ItemTags.safeParse(item);
  return parsed.success ? parsed.data : null;
}

export async function listItems(supabase: SupabaseClient<Database>): Promise<WardrobeItem[]> {
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;

  const urls = new Map<string, string>();
  const toSign = data.flatMap((i) => [i.photo_path, i.cutout_path].filter((p) => p !== null));
  if (toSign.length) {
    const { data: signed, error: signError } = await supabase.storage
      .from(BUCKET)
      .createSignedUrls(toSign, 60 * 60);
    if (signError) throw signError;
    for (const s of signed) if (s.path && s.signedUrl) urls.set(s.path, s.signedUrl);
  }

  const urlOf = (path: string | null) => (path ? (urls.get(path) ?? null) : null);
  return data.map((i) => ({ ...i, photoUrl: urlOf(i.photo_path), cutoutUrl: urlOf(i.cutout_path) }));
}
