import "server-only";
import { generateText, Output } from "ai";
import type { z } from "zod";
import { outfitModel } from "@/lib/ai";
import { Outfit, type DayContext, type ShuffleFeedback, type WeatherWindow } from "@/lib/schemas";
import type { createClient } from "@/lib/supabase/server";
import type { ClosetItem, OutfitProfile } from "./types";

type Supabase = Awaited<ReturnType<typeof createClient>>;

const SENSITIVITY_OFFSET_F: Record<OutfitProfile["tempSensitivity"], number> = {
  runs_cold: -5,
  neutral: 0,
  runs_hot: 5,
};

const CONTEXT_PROMPTS: Record<z.infer<typeof DayContext>, string> = {
  work: "Work / office: polished but practical.",
  casual: "Casual / errands: relaxed and comfortable.",
  active: "Gym / active: breathable, moves well, athletic shoes.",
  going_out: "Going out / event: a step up, more expressive.",
};

const INSTRUCTIONS = `You are Layerup's stylist. Build one outfit for today using only items from the user's closet, copying item ids exactly.

Structure: one base + one bottom (or a single one_piece instead of both), plus one shoes. Optionally one mid, one outer and one accessory. Use each item in the slot listed for it.

Warmth: items are rated 1 (very light) to 5 (heavy). Sum the warmth of base + mid + outer. Dress for the coldest part of the day with layers that can come off for the warmest part. Rough targets for the coldest "plan-as" feels-like temperature: 75°F+ → 1–2 total, skip mid and outer; 60–75°F → 2–4; 45–60°F → 4–7; 32–45°F → 7–10; below 32°F → 10+.
If rain is 40% or more, use a waterproof outer when one exists and prefer waterproof shoes. Above 15 mph wind, prefer windproof outerwear.

Match the day's context and the user's vibes and fit.

Earlier outfits this session were rejected with feedback; react to it:
- too warm: lower total warmth than the rejected outfit, or drop a layer.
- too cold: raise total warmth, or add a layer.
- too formal / too casual: shift the formality the other way.
- disliked items: never use them again.
Never repeat a rejected outfit exactly.

Rationale: one or two sentences to the user ("you"), tying the pick to the actual temperatures, rain timing and context. Don't mention item ids or warmth numbers.`;

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

export type SessionTurn = { outfit: Outfit; feedback: string[] | null };

export async function generateOutfit(input: {
  closet: ClosetItem[];
  profile: OutfitProfile;
  weather: WeatherWindow;
  context: z.infer<typeof DayContext>;
  history: SessionTurn[];
}): Promise<Outfit> {
  const { output } = await generateText({
    model: outfitModel,
    instructions: INSTRUCTIONS,
    prompt: buildPrompt(input),
    output: Output.object({ schema: Outfit }),
  });
  return output;
}

function buildPrompt({
  closet,
  profile,
  weather,
  context,
  history,
}: Parameters<typeof generateOutfit>[0]): string {
  const offset = SENSITIVITY_OFFSET_F[profile.tempSensitivity];
  const closetLines = closet.map((item) => JSON.stringify({ ...item, photoPath: undefined }));

  return [
    `## Context\n${CONTEXT_PROMPTS[context]}`,
    `## Weather\n${describeWeather(weather, offset)}`,
    `## User\nVibes: ${profile.vibes.join(", ")}\nFit: ${profile.fitPref ?? "no preference"}\nTemperature sensitivity: ${profile.tempSensitivity.replace("_", " ")}`,
    `## Closet (one JSON item per line)\n${closetLines.join("\n")}`,
    history.length > 0 ? `## Rejected this session (oldest first)\n${history.map(describeTurn).join("\n")}` : "",
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

function describeTurn({ outfit, feedback }: SessionTurn, i: number): string {
  const items = outfit.items.map((it) => `${it.slot}=${it.itemId}`).join(", ");
  const reasons = (feedback ?? []).map((f) =>
    f.startsWith("dislike_piece:") ? `disliked ${f.slice("dislike_piece:".length)}` : f.replace("_", " "),
  );
  return `${i + 1}. ${items} → ${reasons.length > 0 ? reasons.join("; ") : "no feedback"}`;
}

export function toFeedbackStrings(feedback: ShuffleFeedback): string[] {
  return feedback.reasons.flatMap((r) =>
    r === "dislike_piece" ? feedback.dislikedItemIds.map((id) => `dislike_piece:${id}`) : [r],
  );
}
