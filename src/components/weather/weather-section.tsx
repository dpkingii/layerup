"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { CloudRain, LoaderCircle, MapPin, Wind } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WeatherWindow } from "@/lib/schemas";
import type { WeatherReport } from "@/lib/weather";
import {
  getWeatherSettings,
  loadWeather,
  saveLocation,
  type Place,
  type WeatherSettings,
} from "@/lib/weather/actions";
import { CitySearch } from "./city-search";
import { ManualWeather } from "./manual-weather";

const NOTABLE_WIND_MPH = 15;

type State =
  | { status: "loading" }
  | { status: "search"; report: WeatherReport | null }
  | { status: "ready"; report: WeatherReport }
  | { status: "failed"; place: Place };

export function WeatherSection({ onWeatherChange }: { onWeatherChange: (w: WeatherWindow) => void }) {
  const [state, setState] = useState<State>({ status: "loading" });
  const [settings, setSettings] = useState<WeatherSettings | null>(null);

  async function show(place: Place, s: WeatherSettings) {
    setState({ status: "loading" });
    const report = await loadWeather(place, s.dayStart, s.dayEnd);
    if (!report) return setState({ status: "failed", place });
    setState({ status: "ready", report });
    onWeatherChange(report.window);
  }

  const showOnMount = useEffectEvent(show);
  // A late position fix must not override a city the user picked while the prompt was open.
  const showPosition = useEffectEvent((place: Place, s: WeatherSettings) => {
    if (state.status === "loading") show(place, s);
  });

  useEffect(() => {
    const toSearch = () => setState((prev) => (prev.status === "loading" ? { status: "search", report: null } : prev));

    getWeatherSettings().then(async (s) => {
      setSettings(s);
      if (s.place) return showOnMount(s.place, s);
      if (!navigator.geolocation) return toSearch();
      // Chrome withholds the denial callback from background tabs, so check a known denial up front.
      const permission = await navigator.permissions?.query({ name: "geolocation" }).catch(() => null);
      if (permission?.state === "denied") return toSearch();
      navigator.geolocation.getCurrentPosition(
        (pos) => showPosition({ name: "Current location", lat: pos.coords.latitude, lon: pos.coords.longitude }, s),
        toSearch,
        { timeout: 10_000, maximumAge: 10 * 60_000 },
      );
    });
  }, []);

  function choose(place: Place) {
    if (!settings) return;
    saveLocation(place).catch(console.error);
    show(place, settings);
  }

  if (state.status === "loading") {
    return (
      <Shell>
        <LoaderCircle className="size-4 animate-spin text-muted-foreground" />
        <span className="text-muted-foreground">Getting your forecast…</span>
        <Button variant="link" size="sm" onClick={() => setState({ status: "search", report: null })}>
          Pick a city instead
        </Button>
      </Shell>
    );
  }

  if (state.status === "search") {
    const { report } = state;
    return (
      <Shell>
        <CitySearch onSelect={choose} />
        {report ? (
          <Button variant="ghost" size="sm" onClick={() => setState({ status: "ready", report })}>
            Cancel
          </Button>
        ) : (
          <span className="text-muted-foreground">Location unavailable. Pick a city.</span>
        )}
      </Shell>
    );
  }

  if (state.status === "failed") {
    return (
      <Shell>
        <span className="text-muted-foreground">Couldn&apos;t load weather for {state.place.name}.</span>
        <ManualWeather onChange={onWeatherChange} />
        <Button variant="link" size="sm" onClick={() => setState({ status: "search", report: null })}>
          Change location
        </Button>
      </Shell>
    );
  }

  const { window: w, currentFeelsLikeF } = state.report;
  const rainPeak = w.hourly.reduce((peak, h) => (h.precipChance > peak.precipChance ? h : peak));

  return (
    <Shell>
      <span className="flex items-center gap-1 font-medium">
        <MapPin className="size-4" />
        {w.locationName}
      </span>
      {currentFeelsLikeF != null && <span>Feels {currentFeelsLikeF}° now</span>}
      <span>
        {formatHour(w.start)}–{formatHour(w.end)}: {w.minFeelsLikeF}° → {w.maxFeelsLikeF}°
      </span>
      <span className="flex items-center gap-1">
        <CloudRain className="size-4" />
        {rainPeak.precipChance > 0 ? `${rainPeak.precipChance}% at ${formatHour(rainPeak.time)}` : "No rain"}
      </span>
      {w.maxWindMph >= NOTABLE_WIND_MPH && (
        <span className="flex items-center gap-1">
          <Wind className="size-4" />
          Up to {w.maxWindMph} mph
        </span>
      )}
      <Button variant="link" size="sm" onClick={() => setState({ status: "search", report: state.report })}>
        Change
      </Button>
      <a
        href="https://open-meteo.com/"
        target="_blank"
        rel="noreferrer"
        className="ml-auto text-xs text-muted-foreground hover:underline"
      >
        Weather data by Open-Meteo.com
      </a>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <section
      aria-label="Weather"
      className="flex min-h-12 flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border px-4 py-2 text-sm"
    >
      {children}
    </section>
  );
}

function formatHour(time: string) {
  const hour = Number(time.slice(11, 13));
  const minutes = time.slice(14, 16);
  return `${hour % 12 || 12}${minutes === "00" ? "" : `:${minutes}`} ${hour < 12 ? "AM" : "PM"}`;
}
