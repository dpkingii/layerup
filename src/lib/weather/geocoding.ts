import type { Place } from "./actions";

const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";

type GeocodingResponse = {
  results?: { id: number; name: string; latitude: number; longitude: number; admin1?: string; country?: string }[];
};

export async function searchCities(query: string, signal?: AbortSignal): Promise<(Place & { id: number })[]> {
  const params = new URLSearchParams({ name: query, count: "5" });
  const res = await fetch(`${GEOCODING_URL}?${params}`, { signal });
  if (!res.ok) throw new Error(`Open-Meteo geocoding failed: ${res.status}`);
  const data: GeocodingResponse = await res.json();
  return (data.results ?? []).map((r) => ({
    id: r.id,
    name: [r.name, r.admin1, r.country].filter((part, i, parts) => part && parts.indexOf(part) === i).join(", "),
    lat: r.latitude,
    lon: r.longitude,
  }));
}
