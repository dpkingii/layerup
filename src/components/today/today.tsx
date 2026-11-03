"use client";

import { useState, useTransition } from "react";
import type { z } from "zod";
import { CheckCircle2 } from "lucide-react";
import { generateOutfit, wearOutfit, type GenerateInput } from "@/app/today/actions";
import { Button } from "@/components/ui/button";
import { WEATHER_FIXTURES, type WeatherFixtureKey } from "@/lib/outfit/fixtures";
import { CONTEXT_LABELS } from "@/lib/outfit/labels";
import type { SuggestionView } from "@/lib/outfit/types";
import type { DayContext, FeedbackReason } from "@/lib/schemas";
import { FixtureWeather } from "./fixture-weather";
import { OutfitGrid, OutfitGridSkeleton } from "./outfit-grid";
import { ShufflePanel } from "./shuffle-panel";

type Context = z.infer<typeof DayContext>;
type Reason = z.infer<typeof FeedbackReason>;

const SHUFFLE_NUDGE_AFTER = 5;

// A thrown action (network drop, server crash) would otherwise escape the transition and blank the page.
const UNREACHABLE = { ok: false, error: "Couldn't reach Layerup. Check your connection and try again." } as const;

export function Today() {
  const [weatherKey, setWeatherKey] = useState<WeatherFixtureKey>("coolRain");
  const [context, setContext] = useState<Context | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<SuggestionView | null>(null);
  const [shuffles, setShuffles] = useState(0);
  const [shuffling, setShuffling] = useState(false);
  const [reasons, setReasons] = useState<Set<Reason>>(new Set());
  const [disliked, setDisliked] = useState<Set<string>>(new Set());
  const [worn, setWorn] = useState(false);
  const [error, setError] = useState<{ message: string; retry: () => void } | null>(null);
  const [generating, startGenerate] = useTransition();
  const [wearing, startWear] = useTransition();

  function generate(input: GenerateInput, onSuccess?: () => void) {
    setError(null);
    startGenerate(async () => {
      const result = await generateOutfit(input).catch(() => UNREACHABLE);
      if (result.ok) {
        setSuggestion(result.data);
        onSuccess?.();
      } else {
        setError({ message: result.error, retry: () => generate(input, onSuccess) });
      }
    });
  }

  function pickContext(next: Context) {
    const id = crypto.randomUUID();
    setContext(next);
    setSessionId(id);
    setSuggestion(null);
    setShuffles(0);
    setWorn(false);
    closeShuffle();
    generate({ sessionId: id, context: next, weather: WEATHER_FIXTURES[weatherKey].window });
  }

  function closeShuffle() {
    setShuffling(false);
    setReasons(new Set());
    setDisliked(new Set());
  }

  function toggleReason(reason: Reason) {
    setReasons((prev) => toggle(prev, reason));
    if (reason === "dislike_piece") setDisliked(new Set());
  }

  function submitShuffle() {
    if (!context || !sessionId || !suggestion) return;
    const input: GenerateInput = {
      sessionId,
      context,
      weather: WEATHER_FIXTURES[weatherKey].window,
      rejected: {
        suggestionId: suggestion.id,
        feedback: { reasons: [...reasons], dislikedItemIds: [...disliked] },
      },
    };
    closeShuffle();
    generate(input, () => setShuffles((n) => n + 1));
  }

  function wear() {
    if (!suggestion) return;
    const id = suggestion.id;
    setError(null);
    startWear(async () => {
      const result = await wearOutfit(id).catch(() => UNREACHABLE);
      if (result.ok) setWorn(true);
      else setError({ message: result.error, retry: wear });
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <FixtureWeather value={weatherKey} onChange={setWeatherKey} />

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{context ? "Today is for" : "What's today for?"}</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(Object.keys(CONTEXT_LABELS) as Context[]).map((c) => (
            <Button
              key={c}
              variant={c === context ? "default" : "outline"}
              size="lg"
              aria-pressed={c === context}
              disabled={generating || wearing}
              onClick={() => pickContext(c)}
            >
              {CONTEXT_LABELS[c]}
            </Button>
          ))}
        </div>
      </section>

      {context && (
        <section className="flex flex-col gap-4" aria-live="polite" aria-busy={generating}>
          {generating ? (
            <Loading />
          ) : (
            suggestion && (
              <>
                <OutfitGrid
                  tiles={suggestion.tiles}
                  selecting={shuffling && reasons.has("dislike_piece")}
                  selectedIds={disliked}
                  onToggle={(id) => setDisliked((prev) => toggle(prev, id))}
                />
                <p className="text-sm">{suggestion.rationale}</p>
              </>
            )
          )}

          {error ? (
            <ErrorRetry {...error} />
          ) : (
            suggestion &&
            !generating &&
            (worn ? (
              <div className="flex items-center gap-2 rounded-xl border p-4 text-sm">
                <CheckCircle2 className="size-5 text-primary" aria-hidden />
                <span>Logged. Have a good day in it.</span>
              </div>
            ) : shuffling ? (
              <ShufflePanel
                reasons={reasons}
                dislikedCount={disliked.size}
                onToggleReason={toggleReason}
                onCancel={closeShuffle}
                onSubmit={submitShuffle}
              />
            ) : (
              <div className="flex flex-col gap-3">
                {shuffles >= SHUFFLE_NUDGE_AFTER && (
                  <p className="text-sm text-muted-foreground">
                    Not finding it? Try a different context or add items to your closet.
                  </p>
                )}
                <div className="flex gap-2">
                  <Button size="lg" onClick={wear} disabled={wearing}>
                    {wearing ? "Saving…" : "Wear this"}
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => setShuffling(true)} disabled={wearing}>
                    Shuffle
                  </Button>
                </div>
              </div>
            ))
          )}
        </section>
      )}
    </div>
  );
}

function Loading() {
  return (
    <div className="flex flex-col gap-3">
      <OutfitGridSkeleton />
      <p className="text-sm text-muted-foreground">Picking an outfit for today…</p>
    </div>
  );
}

function ErrorRetry({ message, retry }: { message: string; retry: () => void }) {
  return (
    <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/30 p-4 text-sm">
      <span className="text-destructive">{message}</span>
      <Button variant="outline" onClick={retry}>
        Retry
      </Button>
    </div>
  );
}

function toggle<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}
