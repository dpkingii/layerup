import "server-only";
import { generateText, Output } from "ai";
import { z } from "zod";
import { outfitModel } from "@/lib/ai";
import { DayContext, Outfit, type WeatherWindow } from "@/lib/schemas";
import type { createClient } from "@/lib/supabase/server";
import type { StyleIcon } from "@/lib/style-icons";
import type { ClosetItem, OutfitProfile } from "./types";

type Supabase = Awaited<ReturnType<typeof createClient>>;

const SENSITIVITY_OFFSET_F: Record<OutfitProfile["tempSensitivity"], number> = {
  runs_cold: -5,
  neutral: 0,
  runs_hot: 5,
};

const INSTRUCTIONS = `You are Layerup's stylist. The user tells you what they're dressing for today; reply with one outfit using only items from their closet, copying item ids exactly.

Structure: one base + one bottom (or a single one_piece instead of both), plus one shoes. Optionally one mid, one outer and one accessory. Use each item in the slot listed for it.

Warmth: items are rated 1 (very light) to 5 (heavy). Sum the warmth of base + mid + outer. Dress for the coldest part of the day with layers that can come off for the warmest part. Rough targets for the coldest "plan-as" feels-like temperature: 75°F+ → 1–2 total, skip mid and outer; 60–75°F → 2–4; 45–60°F → 4–7; 32–45°F → 7–10; below 32°F → 10+.
If rain is 40% or more, use a waterproof outer when one exists and prefer waterproof shoes. Above 15 mph wind, prefer windproof outerwear.

Match what they're dressing for and their vibes and fit. Set context to the closest of work, casual, active or going_out.

Earlier turns of this conversation are listed oldest first. Treat the latest message as a change to the latest outfit unless it describes a new occasion: keep what they didn't ask to change. "Warmer" means more total warmth or another layer; "lighter" the reverse. When the user swapped pieces themselves, the outfit shown is what they kept; respect those choices.

Style icons, when listed, are people whose style the user likes. For everyday requests, treat the icons and the user's vibes as one taste with equal weight, and don't mention the icons. When the latest message asks to dress like one of them, lead with that icon's style within the weather rules: the rationale says how the outfit nods to them and, if one of their signature pieces is missing from the closet, names that one missing piece.

Rationale: one or two sentences to the user ("you"), tying the pick to their request, the actual temperatures and rain timing. Don't mention item ids or warmth numbers.

mentionedIcon: when the latest message names a person whose style the user admires and who isn't listed under Style icons, their name as written; otherwise null.`;

const StylistReply = Outfit.extend({ context: DayContext, mentionedIcon: z.string().nullable() });
export type StylistReply = z.infer<typeof StylistReply>;

export async function loadCloset(supabase: Supabase): Promise<ClosetItem[]> {
  const { data, error } = await supabase
    .from("items")
    .select("id, photo_path, category, subtype, slot, colors, pattern, warmth, waterproof, windproof, breathable")
    .in("tag_status", ["tagged", "confirmed"]);
  if (error) throw error;

  const items = data.flatMap((row) =>
    row.category && row.subtype && row.slot && row.warmth && row.colors.length > 0
      ? [
          {
            id: row.id,
            photoPath: row.photo_path,
            category: row.category,
            subtype: row.subtype,
            slot: row.slot,
            colors: row.colors,
            pattern: row.pattern ?? "solid",
            warmth: row.warmth,
            waterproof: row.waterproof,
            windproof: row.windproof,
            breathable: row.breathable,
          },
        ]
      : [],
  );
  return items;
}

// Placeholders have no profile yet, so they stay out of the prompt.
export async function loadReadyIcons(supabase: Supabase): Promise<StyleIcon[]> {
  const { data, error } = await supabase.from("style_icons").select("*").eq("status", "ready").order("created_at");
  if (error) throw error;
  return data;
}

export async function loadProfile(supabase: Supabase): Promise<OutfitProfile> {
  const { data, error } = await supabase.from("profiles").select("vibes, temp_sensitivity, fit_pref").single();
  if (error) throw error;
  return { vibes: data.vibes, tempSensitivity: data.temp_sensitivity, fitPref: data.fit_pref };
}

// The minimum the prompt's structure rule can be satisfied with.
export function canDress(closet: ClosetItem[]): boolean {
  const has = (slot: ClosetItem["slot"]) => closet.some((item) => item.slot === slot);
  return has("shoes") && (has("one_piece") || (has("base") && has("bottom")));
}

export type SessionTurn = { prompt: string; outfit: Outfit; edited: boolean };

export async function generateOutfit(input: {
  closet: ClosetItem[];
  profile: OutfitProfile;
  icons: StyleIcon[];
  weather: WeatherWindow;
  message: string;
  history: SessionTurn[];
}): Promise<StylistReply> {
  const { output, usage } = await generateText({
    model: outfitModel,
    instructions: INSTRUCTIONS,
    prompt: buildPrompt(input),
    output: Output.object({ schema: StylistReply }),
  });
  // Reasoning tokens show whether a slow reply came from the model thinking longer.
  console.log(
    `[gemini] outfit tokens: in ${usage.inputTokens}, out ${usage.outputTokenDetails.textTokens}, reasoning ${usage.outputTokenDetails.reasoningTokens}`,
  );
  return output;
}

function buildPrompt({
  closet,
  profile,
  icons,
  weather,
  message,
  history,
}: Parameters<typeof generateOutfit>[0]): string {
  const offset = SENSITIVITY_OFFSET_F[profile.tempSensitivity];
  const closetLines = closet.map((item) => JSON.stringify({ ...item, photoPath: undefined }));

  return [
    `## Weather\n${describeWeather(weather, offset)}`,
    `## User\nVibes: ${profile.vibes.join(", ")}\nFit: ${profile.fitPref ?? "no preference"}\nTemperature sensitivity: ${profile.tempSensitivity.replace("_", " ")}`,
    icons.length > 0 ? `## Style icons\n${icons.map(describeIcon).join("\n")}` : "",
    `## Closet (one JSON item per line)\n${closetLines.join("\n")}`,
    history.length > 0 ? `## Conversation so far (oldest first)\n${history.map(describeTurn).join("\n")}` : "",
    `## Latest message\n${message}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

function describeWeather(weather: WeatherWindow, offset: number): string {
  const planAs = (f: number) => Math.round(f + offset);
  const sensitivityNote =
    offset === 0 ? "" : `\nThe user runs ${offset < 0 ? "cold" : "hot"}: plan as if it feels ${Math.abs(offset)}°F ${offset < 0 ? "colder" : "warmer"}.`;

  if (weather.source === "manual") {
    return `No forecast available. The user says it's a ${weather.band} day${weather.rain ? " with rain" : ", no rain"}.${sensitivityNote}`;
  }

  const hourly = weather.hourly.map(
    (h) => `${h.time.slice(11, 16)}  ${Math.round(h.tempF)}°F (feels ${Math.round(h.feelsLikeF)}°F), ${h.precipChance}% precip, ${Math.round(h.windMph)} mph, ${h.condition}`,
  );
  return [
    `${weather.locationName}, ${weather.start.slice(11, 16)}–${weather.end.slice(11, 16)}.`,
    `Feels like ${Math.round(weather.minFeelsLikeF)}–${Math.round(weather.maxFeelsLikeF)}°F; plan as ${planAs(weather.minFeelsLikeF)}–${planAs(weather.maxFeelsLikeF)}°F.`,
    `Max precip ${weather.maxPrecipChance}%, max wind ${Math.round(weather.maxWindMph)} mph.${sensitivityNote}`,
    `Hourly:\n${hourly.join("\n")}`,
  ].join("\n");
}

function describeIcon(icon: StyleIcon): string {
  return `- ${icon.name}: ${icon.summary}. Signature pieces: ${icon.signature_pieces.join(", ")}. Palette: ${icon.palette.join(", ")}. Silhouette: ${icon.silhouette}. Layering: ${icon.layering}.`;
}

function describeTurn({ prompt, outfit, edited }: SessionTurn, i: number): string {
  const items = outfit.items.map((it) => `${it.slot}=${it.itemId}`).join(", ");
  return `${i + 1}. User: ${prompt}\n   Outfit${edited ? " (after the user's own swaps)" : ""}: ${items}`;
}
