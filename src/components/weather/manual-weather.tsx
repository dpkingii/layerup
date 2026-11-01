"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { WeatherWindow } from "@/lib/schemas";

type Manual = Extract<WeatherWindow, { source: "manual" }>;
const BANDS: Manual["band"][] = ["cold", "mild", "hot"];

export function ManualWeather({ onChange }: { onChange: (w: Manual) => void }) {
  const [band, setBand] = useState<Manual["band"] | null>(null);
  const [rain, setRain] = useState(false);

  function update(next: { band: Manual["band"] | null; rain: boolean }) {
    setBand(next.band);
    setRain(next.rain);
    if (next.band) onChange({ source: "manual", band: next.band, rain: next.rain });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-muted-foreground">How&apos;s it out?</span>
      {BANDS.map((b) => (
        <Button
          key={b}
          size="sm"
          variant={band === b ? "default" : "outline"}
          aria-pressed={band === b}
          onClick={() => update({ band: b, rain })}
          className="capitalize"
        >
          {b}
        </Button>
      ))}
      <span className="ml-2 text-muted-foreground">Rain?</span>
      {[true, false].map((r) => (
        <Button
          key={String(r)}
          size="sm"
          variant={rain === r ? "default" : "outline"}
          aria-pressed={rain === r}
          onClick={() => update({ band, rain: r })}
        >
          {r ? "Yes" : "No"}
        </Button>
      ))}
    </div>
  );
}
