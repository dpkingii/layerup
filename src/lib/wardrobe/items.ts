import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { ItemTags } from "@/lib/schemas";

export const BUCKET = "wardrobe";

export type ItemRow = Database["public"]["Tables"]["items"]["Row"];
export type WardrobeItem = ItemRow & { photoUrl: string | null };

export function photoPath(userId: string, itemId: string) {
  return `${userId}/${itemId}.jpg`;
}

export function tagsFromRow(item: ItemRow): ItemTags | null {
  const parsed = ItemTags.safeParse(item);
  return parsed.success ? parsed.data : null;
}

// `knownUrls` maps photo_path to an existing URL so polling doesn't re-sign (and re-download) every image.
export async function listItems(
  supabase: SupabaseClient<Database>,
  knownUrls: ReadonlyMap<string, string> = new Map(),
): Promise<WardrobeItem[]> {
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;

  const urls = new Map(knownUrls);
  const toSign = data.flatMap((i) => (i.photo_path && !urls.has(i.photo_path) ? [i.photo_path] : []));
  if (toSign.length) {
    const { data: signed, error: signError } = await supabase.storage
      .from(BUCKET)
      .createSignedUrls(toSign, 60 * 60);
    if (signError) throw signError;
    for (const s of signed) if (s.path && s.signedUrl) urls.set(s.path, s.signedUrl);
  }

  return data.map((i) => ({ ...i, photoUrl: i.photo_path ? (urls.get(i.photo_path) ?? null) : null }));
}
