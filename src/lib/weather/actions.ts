"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getWeatherReport, type WeatherReport } from "@/lib/weather";

const Place = z.object({
  name: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
});
export type Place = z.infer<typeof Place>;

export type WeatherSettings = { place: Place | null; dayStart: string; dayEnd: string };

export async function getWeatherSettings(): Promise<WeatherSettings> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("location_name, location_lat, location_lon, day_start, day_end")
    .single();

  const place =
    data?.location_name && data.location_lat != null && data.location_lon != null
      ? { name: data.location_name, lat: data.location_lat, lon: data.location_lon }
      : null;
  return { place, dayStart: data?.day_start ?? "08:00", dayEnd: data?.day_end ?? "20:00" };
}

export async function loadWeather(
  place: Place,
  dayStart: string,
  dayEnd: string,
): Promise<WeatherReport | null> {
  const { name, lat, lon } = Place.parse(place);
  try {
    return await getWeatherReport({ lat, lon, dayStart, dayEnd, locationName: name });
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function saveLocation(place: Place): Promise<void> {
  const { name, lat, lon } = Place.parse(place);
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) throw new Error("Not signed in");
  const { error } = await supabase
    .from("profiles")
    .update({ location_name: name, location_lat: lat, location_lon: lon })
    .eq("id", data.claims.sub);
  if (error) throw new Error(error.message);
}
