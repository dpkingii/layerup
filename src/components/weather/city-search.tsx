"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Place } from "@/lib/weather/actions";
import { searchCities } from "@/lib/weather/geocoding";

type Result = Place & { id: number };

export function CitySearch({ onSelect }: { onSelect: (place: Place) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [error, setError] = useState(false);
  const trimmed = query.trim();

  useEffect(() => {
    if (trimmed.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      searchCities(trimmed, controller.signal)
        .then((r) => {
          setResults(r);
          setError(false);
        })
        .catch(() => {
          if (!controller.signal.aborted) setError(true);
        });
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed]);

  const visible = trimmed.length < 2 ? [] : results;

  return (
    <div className="flex w-full max-w-sm flex-col gap-1">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a city"
          aria-label="City"
          className="pl-8"
        />
      </div>
      {error && <p className="text-sm text-destructive">City search failed. Try again.</p>}
      {visible.length > 0 && (
        <ul className="flex flex-col rounded-lg border bg-popover py-1 text-sm">
          {visible.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => onSelect({ name: r.name, lat: r.lat, lon: r.lon })}
                className="w-full px-2.5 py-1.5 text-left hover:bg-muted"
              >
                {r.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
