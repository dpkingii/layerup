import "server-only";
import type { Tables } from "@/lib/database.types";
import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type StyleIcon = Tables<"style_icons">;

export const MAX_STYLE_ICONS = 3;

export async function listStyleIcons(supabase: Supabase): Promise<StyleIcon[]> {
  const { data, error } = await supabase.from("style_icons").select("*").order("created_at");
  if (error) throw error;
  return data;
}
