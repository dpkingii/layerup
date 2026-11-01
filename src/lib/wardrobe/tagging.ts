import "server-only";
import { generateText, Output } from "ai";
import type { SupabaseClient } from "@supabase/supabase-js";
import { taggingModel } from "@/lib/ai";
import type { Database } from "@/lib/database.types";
import { ItemTags } from "@/lib/schemas";
import { BUCKET } from "./items";

const MAX_CONCURRENT = 4;
let running = 0;
const waiting: (() => void)[] = [];

async function withSlot<T>(fn: () => Promise<T>): Promise<T> {
  if (running >= MAX_CONCURRENT) await new Promise<void>((resolve) => waiting.push(resolve));
  running++;
  try {
    return await fn();
  } finally {
    running--;
    waiting.shift()?.();
  }
}

const PROMPT = `Tag this clothing item for a weather-based outfit app.
- slot: base (worn against skin: tees, shirts, blouses), mid (sweaters, hoodies, fleeces, cardigans), outer (jackets, coats), bottom, one_piece (dresses, jumpsuits), shoes, accessory (hats, scarves, gloves, bags).
- colors: one or two plain color names, primary first.
- warmth: 1 = very light summer piece, 5 = heavy winter piece.
- waterproof/windproof/breathable: only true if the material clearly has that property.
If several items are visible, tag the main garment the photo is about. Prefer it over socks, underlayers or other incidental items, even if those take up more of the frame (e.g. shoes worn with bold socks: tag the shoes).`;

export async function tagItem(supabase: SupabaseClient<Database>, itemId: string, path: string) {
  await withSlot(async () => {
    try {
      const { data: file, error } = await supabase.storage.from(BUCKET).download(path);
      if (error) throw error;

      const { output } = await generateText({
        model: taggingModel,
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

      // Don't clobber edits the user made while tagging was in flight.
      const { error: updateError } = await supabase
        .from("items")
        .update({ ...output, tag_status: "tagged" })
        .eq("id", itemId)
        .eq("tag_status", "pending");
      if (updateError) throw updateError;
    } catch (err) {
      console.error(`Tagging item ${itemId} failed`, err);
      await supabase
        .from("items")
        .update({ tag_status: "failed" })
        .eq("id", itemId)
        .eq("tag_status", "pending");
    }
  });
}
