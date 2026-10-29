import "server-only";
import { cacheLife } from "next/cache";
import type { z } from "zod";
import type { HourlyWeather } from "@/lib/schemas";
import { weatherCodeLabel } from "./wmo-codes";

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

export type Forecast = {
  utcOffsetSeconds: number;
  hourly: z.infer<typeof HourlyWeather>[];
};

type ForecastResponse = {
  utc_offset_seconds: number;
  hourly: {
    time: string[];
    temperature_2m: number[];
    apparent_temperature: number[];
    precipitation_probability: number[];
    wind_speed_10m: number[];
    weather_code: number[];
  };
};

export function getForecast(lat: number, lon: number): Promise<Forecast> {
  return fetchForecast(Math.round(lat * 100) / 100, Math.round(lon * 100) / 100);
}

async function fetchForecast(lat: number, lon: number): Promise<Forecast> {
  "use cache";
  // Expire soon after revalidating so a long-idle entry never serves a forecast from a previous day.
  cacheLife({ stale: 300, revalidate: 3600, expire: 7200 });

  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    hourly: "temperature_2m,apparent_temperature,precipitation_probability,wind_speed_10m,weather_code",
    temperature_unit: "fahrenheit",
    wind_speed_unit: "mph",
    timezone: "auto",
    forecast_days: "2",
  });
  const res = await fetch(`${FORECAST_URL}?${params}`);
  if (!res.ok) throw new Error(`Open-Meteo forecast failed: ${res.status}`);
  const data: ForecastResponse = await res.json();
  const h = data.hourly;

  return {
    utcOffsetSeconds: data.utc_offset_seconds,
    hourly: h.time.map((time, i) => ({
      time,
      tempF: Math.round(h.temperature_2m[i]),
      feelsLikeF: Math.round(h.apparent_temperature[i]),
      precipChance: h.precipitation_probability[i] ?? 0,
      windMph: Math.round(h.wind_speed_10m[i]),
      condition: weatherCodeLabel(h.weather_code[i]),
    })),
  };
}
