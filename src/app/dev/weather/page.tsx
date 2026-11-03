"use client";

import { useState } from "react";
import { WeatherSection } from "@/components/weather/weather-section";
import type { WeatherWindow } from "@/lib/schemas";

export default function WeatherDemoPage() {
  const [weather, setWeather] = useState<WeatherWindow | null>(null);

  function handleChange(w: WeatherWindow) {
    console.log("[weather] emitted", w);
    setWeather(w);
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-4 sm:p-6">
      <h1 className="text-xl font-semibold">Weather demo</h1>
      <WeatherSection onWeatherChange={handleChange} />
      <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-xs">
        {weather ? JSON.stringify(weather, null, 2) : "No window emitted yet."}
      </pre>
    </main>
  );
}
