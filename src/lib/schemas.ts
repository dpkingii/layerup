// Shared contracts between the wardrobe, weather, onboarding and Today tracks.
// Change these only on main, never inside a feature worktree.
import { z } from "zod";
import { Constants } from "@/lib/database.types";

const E = Constants.public.Enums;

export const ItemSlot = z.enum(E.item_slot);
export const DayContext = z.enum(E.day_context);
export const TempSensitivity = z.enum(E.temp_sensitivity);
export const FitPref = z.enum(E.fit_pref);

// Output of AI tagging and the shape users edit in the review grid.
export const ItemTags = z.object({
  category: z.string().min(1).describe("Broad category, e.g. outerwear, top, bottom, footwear"),
  subtype: z.string().min(1).describe("Specific type, e.g. rain jacket, crewneck sweater"),
  slot: ItemSlot,
  colors: z.array(z.string()).min(1).max(2).describe("Primary color first"),
  pattern: z.string().describe("solid, striped, plaid, floral, graphic, ..."),
  warmth: z.number().int().min(1).max(5).describe("1 = very light, 5 = heavy winter"),
  waterproof: z.boolean(),
  windproof: z.boolean(),
  breathable: z.boolean(),
});
export type ItemTags = z.infer<typeof ItemTags>;

export const HourlyWeather = z.object({
  time: z.string().describe("ISO local time"),
  tempF: z.number(),
  feelsLikeF: z.number(),
  precipChance: z.number().min(0).max(100),
  windMph: z.number(),
  condition: z.string(),
});

// The user's day window, from the forecast or from manual chips when weather/location fails.
export const WeatherWindow = z.discriminatedUnion("source", [
  z.object({
    source: z.literal("forecast"),
    locationName: z.string(),
    start: z.string(),
    end: z.string(),
    minFeelsLikeF: z.number(),
    maxFeelsLikeF: z.number(),
    maxPrecipChance: z.number(),
    maxWindMph: z.number(),
    hourly: z.array(HourlyWeather),
  }),
  z.object({
    source: z.literal("manual"),
    band: z.enum(["cold", "mild", "hot"]),
    rain: z.boolean(),
  }),
]);
export type WeatherWindow = z.infer<typeof WeatherWindow>;

// LLM output for one suggestion; stored as suggestions.outfit (+ rationale).
export const Outfit = z.object({
  items: z.array(z.object({ slot: ItemSlot, itemId: z.string() })).min(1),
  rationale: z.string().describe("One or two sentences tying the pick to the weather and context"),
});
export type Outfit = z.infer<typeof Outfit>;

export const FeedbackReason = z.enum(["too_warm", "too_cold", "too_formal", "too_casual", "dislike_piece"]);

// Stored in suggestions.feedback as "reason" or "dislike_piece:<itemId>".
export const ShuffleFeedback = z.object({
  reasons: z.array(FeedbackReason).min(1),
  dislikedItemIds: z.array(z.string()).default([]),
});
export type ShuffleFeedback = z.infer<typeof ShuffleFeedback>;
