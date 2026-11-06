import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export const DEMO_AI_LIMIT_MESSAGE =
  "Demo limit reached: guests get 10 AI requests. Browsing, swapping pieces and editing still work.";

// Counts one AI request for demo guests and says whether it's allowed; real accounts always pass.
export async function allowAiRequest(supabase: SupabaseClient<Database>): Promise<boolean> {
  const { data, error } = await supabase.rpc("use_ai_request");
  if (error) throw error;
  return data;
}
