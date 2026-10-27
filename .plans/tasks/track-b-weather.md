# Track B: Weather & Location

Read `.plans/tasks/README.md` first. Spec: section 8 of `.plans/layerup-spec.md`.

## Goal
Produce a `WeatherWindow` (from `@/lib/schemas`) for the user's day: from the forecast when possible, from manual chips when not.

## Owned paths
- `src/lib/weather/**`
- `src/components/weather/**`
- `src/app/api/weather/**` (if you need route handlers)
- `src/app/dev/weather/page.tsx`: a throwaway demo page for testing (integration deletes it)

## Requirements
1. **Provider adapter:** `src/lib/weather/open-meteo.ts`
   - Open-Meteo forecast API (`https://api.open-meteo.com/v1/forecast`); no API key. Request hourly `temperature_2m,apparent_temperature,precipitation_probability,wind_speed_10m,weather_code` with `temperature_unit=fahrenheit`, `wind_speed_unit=mph`, `timezone=auto`, `forecast_days=2` (covers windows that cross midnight).
   - Map WMO `weather_code` to a short label (`src/lib/weather/wmo-codes.ts`, e.g. 0 → "Clear", 61 → "Light rain", 95 → "Thunderstorm") for `HourlyWeather.condition`.
   - Map hourly data to `HourlyWeather`. Clip to the user's window and compute min/max feels-like, max precip chance and max wind.
   - Cache per location (lat/lon rounded to 2 decimals) for ~1 hour using `"use cache"` + `cacheLife` (read the Next 16 caching docs).
2. **Public interface (integration depends on these exact names):**
   - `getWeatherWindow(args: { lat: number; lon: number; dayStart: string; dayEnd: string }): Promise<WeatherWindow>` in `src/lib/weather/index.ts`. `dayStart`/`dayEnd` are `"HH:MM"` (from `profiles.day_start/day_end`). The window uses the location's local timezone: with `timezone=auto`, Open-Meteo returns hourly times already in local time, plus `timezone` and `utc_offset_seconds`. Use those to find "today" at the location, not the server's clock.
   - `<WeatherSection onWeatherChange={(w: WeatherWindow) => void} />` in `src/components/weather/weather-section.tsx`. Client component; handles location, shows the strip, and emits the current window.
3. **Location**
   - On mount, request browser geolocation. Success → fetch the forecast.
   - Denied or failed → show city search (Open-Meteo geocoding: `https://geocoding-api.open-meteo.com/v1/search?name=…&count=5`, debounced; show "City, Region, Country" to disambiguate).
   - The user can always change location from the strip ("Change"). A manually chosen city saves to `profiles.location_name/lat/lon` and is the default next time, before geolocation.
4. **Weather strip:** location name, current feels-like, the window's low→high, rain chance peak and when, and wind if notable. Compact, one row on desktop. Include a small "Weather data by Open-Meteo.com" link (required attribution on the free tier).
5. **Failure fallback:** if the forecast fetch fails, show manual chips (cold / mild / hot + rain yes/no) and emit `{ source: "manual", band, rain }`.

## Done when
- The demo page shows a correct strip for your location and for a typed city, and logs the emitted `WeatherWindow`.
- With geolocation blocked and the forecast fetch forced to fail (e.g. temporarily point at a bad URL), manual chips appear and emit a manual window.
- Report how you verified the timezone handling (pick a city in a different timezone).
