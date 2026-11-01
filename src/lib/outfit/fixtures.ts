// Stand-ins until Tracks A (closet), B (weather) and C (profile) merge; integration removes this file.
import type { WeatherWindow } from "@/lib/schemas";
import type { ClosetItem, OutfitProfile } from "./types";

function forecastHours(date: string, temps: number[], precip: number[], conditions: string[]) {
  return temps.map((tempF, i) => ({
    time: `${date}T${String(8 + i).padStart(2, "0")}:00`,
    tempF,
    feelsLikeF: tempF - 3,
    precipChance: precip[i],
    windMph: 8 + (i % 4),
    condition: conditions[i],
  }));
}

export const WEATHER_FIXTURES = {
  coolRain: {
    label: "Cool, rain at 3pm (41→63°F)",
    window: {
      source: "forecast",
      locationName: "Seattle, WA",
      start: "2026-10-27T08:00",
      end: "2026-10-27T20:00",
      minFeelsLikeF: 41,
      maxFeelsLikeF: 63,
      maxPrecipChance: 60,
      maxWindMph: 14,
      hourly: forecastHours(
        "2026-10-27",
        [44, 47, 51, 55, 59, 62, 64, 66, 63, 58, 53, 50, 48],
        [5, 5, 10, 10, 15, 25, 40, 60, 55, 30, 15, 10, 5],
        ["Fog", "Cloudy", "Cloudy", "Partly cloudy", "Partly cloudy", "Cloudy", "Light rain", "Rain", "Rain", "Light rain", "Cloudy", "Cloudy", "Clear"],
      ),
    },
  },
  hotDry: {
    label: "Hot and dry (74→91°F)",
    window: {
      source: "forecast",
      locationName: "Austin, TX",
      start: "2026-10-27T08:00",
      end: "2026-10-27T20:00",
      minFeelsLikeF: 74,
      maxFeelsLikeF: 91,
      maxPrecipChance: 5,
      maxWindMph: 11,
      hourly: forecastHours(
        "2026-10-27",
        [77, 80, 84, 87, 89, 91, 93, 94, 94, 92, 88, 84, 81],
        [0, 0, 0, 0, 0, 5, 5, 5, 5, 0, 0, 0, 0],
        Array(13).fill("Sunny"),
      ),
    },
  },
  manualCold: {
    label: "Manual: cold, rain",
    window: { source: "manual", band: "cold", rain: true },
  },
} satisfies Record<string, { label: string; window: WeatherWindow }>;

export type WeatherFixtureKey = keyof typeof WEATHER_FIXTURES;

export const FIXTURE_PROFILE: OutfitProfile = {
  vibes: ["minimal"],
  tempSensitivity: "neutral",
  fitPref: null,
};

type GenericTags = Pick<ClosetItem, "category" | "subtype" | "slot" | "colors" | "warmth"> &
  Partial<Pick<ClosetItem, "pattern" | "waterproof" | "windproof" | "breathable">>;

function generic(id: string, tags: GenericTags): ClosetItem {
  return { id: `fixture-${id}`, photoPath: null, pattern: "solid", waterproof: false, windproof: false, breathable: false, ...tags };
}

export const FIXTURE_CLOSET: ClosetItem[] = [
  generic("white-tee", { category: "top", subtype: "crew t-shirt", slot: "base", colors: ["white"], warmth: 1, breathable: true }),
  generic("black-tee", { category: "top", subtype: "crew t-shirt", slot: "base", colors: ["black"], warmth: 1, breathable: true }),
  generic("oxford", { category: "top", subtype: "oxford shirt", slot: "base", colors: ["light blue"], warmth: 2 }),
  generic("longsleeve", { category: "top", subtype: "long-sleeve tee", slot: "base", colors: ["grey"], warmth: 2 }),
  generic("tank", { category: "top", subtype: "athletic tank", slot: "base", colors: ["navy"], warmth: 1, breathable: true }),
  generic("merino", { category: "top", subtype: "merino crewneck sweater", slot: "mid", colors: ["charcoal"], warmth: 3 }),
  generic("fleece", { category: "top", subtype: "quarter-zip fleece", slot: "mid", colors: ["olive"], warmth: 3 }),
  generic("cardigan", { category: "top", subtype: "cardigan", slot: "mid", colors: ["camel"], warmth: 2 }),
  generic("rain-shell", { category: "outerwear", subtype: "rain shell", slot: "outer", colors: ["navy"], warmth: 1, waterproof: true, windproof: true }),
  generic("wool-coat", { category: "outerwear", subtype: "wool overcoat", slot: "outer", colors: ["black"], warmth: 4, windproof: true }),
  generic("denim-jacket", { category: "outerwear", subtype: "denim jacket", slot: "outer", colors: ["blue"], warmth: 2 }),
  generic("jeans", { category: "bottom", subtype: "straight jeans", slot: "bottom", colors: ["indigo"], warmth: 2 }),
  generic("chinos", { category: "bottom", subtype: "chinos", slot: "bottom", colors: ["khaki"], warmth: 2 }),
  generic("trousers", { category: "bottom", subtype: "wool trousers", slot: "bottom", colors: ["charcoal"], warmth: 3 }),
  generic("shorts", { category: "bottom", subtype: "running shorts", slot: "bottom", colors: ["black"], warmth: 1, breathable: true }),
  generic("linen-shorts", { category: "bottom", subtype: "linen shorts", slot: "bottom", colors: ["beige"], warmth: 1, breathable: true }),
  generic("slip-dress", { category: "dress", subtype: "midi slip dress", slot: "one_piece", colors: ["black"], warmth: 1 }),
  generic("sneakers", { category: "footwear", subtype: "leather sneakers", slot: "shoes", colors: ["white"], warmth: 2 }),
  generic("boots", { category: "footwear", subtype: "chelsea boots", slot: "shoes", colors: ["brown"], warmth: 3, waterproof: true }),
  generic("runners", { category: "footwear", subtype: "running shoes", slot: "shoes", colors: ["grey"], warmth: 1, breathable: true }),
  generic("beanie", { category: "accessory", subtype: "knit beanie", slot: "accessory", colors: ["grey"], warmth: 2 }),
  generic("cap", { category: "accessory", subtype: "baseball cap", slot: "accessory", colors: ["navy"], warmth: 1 }),
];
