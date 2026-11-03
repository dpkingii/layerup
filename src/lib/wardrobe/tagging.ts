import "server-only";
import { APICallError, generateText, Output } from "ai";
import type { SupabaseClient } from "@supabase/supabase-js";
import { taggingModel } from "@/lib/ai";
import type { Database } from "@/lib/database.types";
import { ItemTags } from "@/lib/schemas";
import { BUCKET } from "./items";

const PROMPT = `Tag this clothing item for a weather-based outfit app.
- slot: base (worn against skin: tees, shirts, blouses), mid (sweaters, hoodies, fleeces, cardigans), outer (jackets, coats), bottom, one_piece (dresses, jumpsuits), shoes, accessory (hats, scarves, gloves, bags).
- colors: one or two plain color names, primary first.
- warmth: 1 = very light summer piece, 5 = heavy winter piece.
- waterproof/windproof/breathable: only true if the material clearly has that property.
If several items are visible, tag the main garment the photo is about. Prefer it over socks, underlayers or other incidental items, even if those take up more of the frame (e.g. shoes worn with bold socks: tag the shoes).`;

export type SuggestResult = { status: "ok"; tags: ItemTags } | { status: "rate_limited" } | { status: "failed" };

// Never throws: server action errors are redacted in production, so callers need the rate-limit case spelled out.
export async function suggestTags(supabase: SupabaseClient<Database>, path: string): Promise<SuggestResult> {
  try {
    const { data: file, error } = await supabase.storage.from(BUCKET).download(path);
    if (error) throw error;

    const { output } = await generateText({
      model: taggingModel,
      // The SDK's few-second retries can't outlast a per-minute quota; the client queue waits instead.
      maxRetries: 0,
      output: Output.object({ schema: ItemTags }),
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: PROMPT },
            { type: "file", mediaType: "image/jpeg", data: new Uint8Array(await file.arrayBuffer()) },
          ],
        },
      ],
    });
    return { status: "ok", tags: output };
  } catch (err) {
    if (APICallError.isInstance(err) && err.statusCode === 429) return { status: "rate_limited" };
    console.error(`Tagging ${path} failed`, err);
    return { status: "failed" };
  }
}
