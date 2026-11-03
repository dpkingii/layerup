"use client";

import { WEATHER_FIXTURES, type WeatherFixtureKey } from "@/lib/outfit/fixtures";
import type { WeatherWindow } from "@/lib/schemas";

// Placeholder for Track B's WeatherSection; the switcher is dev-only.
export function FixtureWeather({
  value,
  onChange,
}: {
  value: WeatherFixtureKey;
  onChange: (key: WeatherFixtureKey) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted px-4 py-3 text-sm">
      <span>{summarize(WEATHER_FIXTURES[value].window)}</span>
      {process.env.NODE_ENV !== "production" && (
        <label className="flex items-center gap-2 text-muted-foreground">
          <span className="text-xs">Dev weather</span>
          <select
            value={value}
            onChange={(e) => onChange(e.target.value as WeatherFixtureKey)}
            className="rounded-md border bg-background px-2 py-1 text-xs text-foreground"
          >
            {(Object.keys(WEATHER_FIXTURES) as WeatherFixtureKey[]).map((key) => (
              <option key={key} value={key}>
                {WEATHER_FIXTURES[key].label}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}

function summarize(w: WeatherWindow): string {
  if (w.source === "manual") return `${w.band[0].toUpperCase()}${w.band.slice(1)} day${w.rain ? ", rain likely" : ""}`;
  return `${w.locationName} · feels ${Math.round(w.minFeelsLikeF)}–${Math.round(w.maxFeelsLikeF)}°F · ${w.maxPrecipChance}% rain`;
}
