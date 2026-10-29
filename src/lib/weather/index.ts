import "server-only";
import { connection } from "next/server";
import type { WeatherWindow } from "@/lib/schemas";
import { getForecast } from "./open-meteo";

type WindowArgs = {
  lat: number;
  lon: number;
  dayStart: string;
  dayEnd: string;
  locationName?: string;
};

export type WeatherReport = {
  window: Extract<WeatherWindow, { source: "forecast" }>;
  currentFeelsLikeF: number | null;
};

export async function getWeatherWindow(args: WindowArgs): Promise<WeatherWindow> {
  return (await getWeatherReport(args)).window;
}

export async function getWeatherReport({
  lat,
  lon,
  dayStart,
  dayEnd,
  locationName = "Current location",
}: WindowArgs): Promise<WeatherReport> {
  await connection();
  const { utcOffsetSeconds, hourly } = await getForecast(lat, lon);

  // Open-Meteo times are local to the location, so derive "now" there rather than from the server clock.
  const localNow = new Date(Date.now() + utcOffsetSeconds * 1000).toISOString();
  const today = localNow.slice(0, 10);
  const startHm = dayStart.slice(0, 5);
  const endHm = dayEnd.slice(0, 5);
  const endDate = endHm <= startHm ? addDays(today, 1) : today;
  const start = `${today}T${startHm}`;
  const end = `${endDate}T${endHm}`;

  // Include the hour the window starts in, so a 07:30 start still counts the 07:00 forecast.
  const firstHour = `${start.slice(0, 13)}:00`;
  const inWindow = hourly.filter((h) => h.time >= firstHour && h.time <= end);
  if (inWindow.length === 0) throw new Error(`No forecast hours between ${start} and ${end}`);

  const feelsLike = inWindow.map((h) => h.feelsLikeF);
  const currentHour = `${localNow.slice(0, 13)}:00`;

  return {
    window: {
      source: "forecast",
      locationName,
      start,
      end,
      minFeelsLikeF: Math.min(...feelsLike),
      maxFeelsLikeF: Math.max(...feelsLike),
      maxPrecipChance: Math.max(...inWindow.map((h) => h.precipChance)),
      maxWindMph: Math.max(...inWindow.map((h) => h.windMph)),
      hourly: inWindow,
    },
    currentFeelsLikeF: hourly.find((h) => h.time === currentHour)?.feelsLikeF ?? null,
  };
}

function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
