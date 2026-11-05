"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { ArrowUp, CheckCircle2, RotateCcw } from "lucide-react";
import { askStylist, wearOutfit, type AskInput } from "@/app/today/actions";
import { Button } from "@/components/ui/button";
import { WeatherSection } from "@/components/weather/weather-section";
import type { StylistItem, SuggestionView } from "@/lib/outfit/types";
import type { Outfit, WeatherWindow } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import { OutfitCard, OutfitCardSkeleton } from "./outfit-card";

const STARTERS = ["Work day, polished", "Rainy errands", "Gym then coffee", "Dinner out tonight"];
const REFINEMENTS = ["Warmer", "Lighter", "Dressier", "More relaxed"];

// A thrown action (network drop, server crash) would otherwise escape the transition and blank the page.
const UNREACHABLE = { ok: false, error: "Couldn't reach Layerup. Check your connection and try again." } as const;

type Turn =
  | { kind: "user"; text: string }
  | { kind: "outfit"; suggestion: SuggestionView; items: Outfit["items"]; worn: boolean };

export function Stylist({ closet }: { closet: StylistItem[] }) {
  const closetById = useMemo(() => new Map(closet.map((item) => [item.id, item])), [closet]);
  const [weather, setWeather] = useState<WeatherWindow | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<{ message: string; retry: () => void } | null>(null);
  const [thinking, startThinking] = useTransition();
  const [wearing, startWearing] = useTransition();
  // Created on the first message, not on render, so a visit without chatting starts no session.
  const sessionId = useRef<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const latestIndex = turns.findLastIndex((t) => t.kind === "outfit");
  const latest = latestIndex >= 0 ? (turns[latestIndex] as Extract<Turn, { kind: "outfit" }>) : null;
  const busy = thinking || wearing;

  useEffect(() => {
    const smooth = matchMedia("(prefers-reduced-motion: no-preference)").matches;
    endRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "end" });
  }, [turns.length, thinking]);

  function run(input: AskInput) {
    setError(null);
    startThinking(async () => {
      const result = await askStylist(input).catch(() => UNREACHABLE);
      if (result.ok) {
        setTurns((prev) => [...prev, { kind: "outfit", suggestion: result.data, items: result.data.items, worn: false }]);
      } else {
        setError({ message: result.error, retry: () => run(input) });
      }
    });
  }

  function send(text: string) {
    const message = text.trim();
    if (!message || !weather || busy) return;
    sessionId.current ??= crypto.randomUUID();
    setTurns((prev) => [...prev, { kind: "user", text: message }]);
    setDraft("");
    run({
      sessionId: sessionId.current,
      message,
      weather,
      kept: latest && !latest.worn ? { suggestionId: latest.suggestion.id, items: latest.items } : undefined,
    });
  }

  function updateLatest(patch: Partial<Extract<Turn, { kind: "outfit" }>>) {
    setTurns((prev) => prev.map((t, i) => (i === latestIndex && t.kind === "outfit" ? { ...t, ...patch } : t)));
  }

  function wear() {
    if (!latest) return;
    const { suggestion, items } = latest;
    setError(null);
    startWearing(async () => {
      const result = await wearOutfit(suggestion.id, items).catch(() => UNREACHABLE);
      if (result.ok) updateLatest({ worn: true });
      else setError({ message: result.error, retry: wear });
    });
  }

  function startOver() {
    sessionId.current = null;
    setTurns([]);
    setError(null);
  }

  const chips = latest && !latest.worn ? REFINEMENTS : STARTERS;
  const empty = turns.length === 0;

  const composer = (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        send(draft);
      }}
      className={cn(
        "flex flex-col gap-2",
        !empty && "sticky bottom-0 -mx-4 bg-background/90 px-4 pt-2 pb-4 backdrop-blur sm:-mx-6 sm:px-6",
      )}
    >
      <div className={cn("flex flex-wrap gap-2", empty && "order-last justify-center")}>
        {chips.map((chip) => (
          <button
            key={chip}
            type="button"
            disabled={!weather || busy}
            onClick={() => send(chip)}
            className="rounded-full border bg-card px-3 py-1.5 text-sm transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
          >
            {chip}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 rounded-full border bg-card p-1.5 pl-4 shadow-sm focus-within:ring-3 focus-within:ring-ring/30">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={300}
          placeholder={latest && !latest.worn ? "Change anything: warmer, swap the shoes…" : "What are you dressing for?"}
          aria-label="Message the stylist"
          className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
        />
        <Button type="submit" size="icon" className="rounded-full" disabled={!draft.trim() || !weather || busy} aria-label="Send">
          <ArrowUp />
        </Button>
      </div>
      {!weather && <p className="text-xs text-muted-foreground">Waiting for the weather before styling…</p>}
    </form>
  );

  return (
    <div className="flex flex-1 flex-col gap-5">
      <WeatherSection onWeatherChange={setWeather} />

      <section aria-label="Stylist" aria-live="polite" className="flex flex-1 flex-col gap-4">
        {empty ? (
          <div className="flex flex-1 flex-col justify-center gap-6 pb-[10vh]">
            <div className="flex flex-col gap-1 text-center">
              <h1 className="text-3xl font-semibold tracking-tight">Hi! What&apos;s the plan today?</h1>
              <p className="text-muted-foreground">Tell me where you&apos;re headed and I&apos;ll dress you from your closet.</p>
            </div>
            {composer}
          </div>
        ) : (
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={startOver} disabled={busy}>
              <RotateCcw />
              Start over
            </Button>
          </div>
        )}

        {turns.map((turn, i) =>
          turn.kind === "user" ? (
            <p key={i} className="max-w-[80%] self-end rounded-3xl rounded-br-md bg-primary px-4 py-2 text-primary-foreground">
              {turn.text}
            </p>
          ) : (
            <StylistBubble key={turn.suggestion.id} faded={i !== latestIndex}>
              <OutfitCard
                items={turn.items}
                closet={closetById}
                editable={i === latestIndex && !turn.worn && !busy}
                onChange={(items) => updateLatest({ items })}
              />
              <p className="text-sm">{turn.suggestion.rationale}</p>
              {i === latestIndex &&
                (turn.worn ? (
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <CheckCircle2 className="size-4 text-primary" aria-hidden />
                    Logged. Have a good day in it.
                  </p>
                ) : (
                  <div className="flex flex-wrap items-center gap-3">
                    <Button onClick={wear} disabled={busy}>
                      {wearing ? "Saving…" : "Wear this"}
                    </Button>
                    {closet.length > 1 && (
                      <span className="text-xs text-muted-foreground">Swipe a piece to swap it.</span>
                    )}
                  </div>
                ))}
            </StylistBubble>
          ),
        )}

        {thinking && (
          <StylistBubble>
            <OutfitCardSkeleton />
            <p className="text-sm text-muted-foreground">Pulling a look together…</p>
          </StylistBubble>
        )}

        {error && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-destructive/30 p-4 text-sm"
          >
            <span className="text-destructive">{error.message}</span>
            <Button variant="outline" onClick={error.retry}>
              Retry
            </Button>
          </div>
        )}
        <div ref={endRef} />
      </section>

      {!empty && composer}
    </div>
  );
}

function StylistBubble({ faded, children }: { faded?: boolean; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "flex max-w-xl flex-col gap-3 rounded-3xl rounded-bl-md border border-transparent bg-card p-3 shadow-sm ring-1 ring-foreground/10 transition-opacity sm:p-4",
        faded && "opacity-60",
      )}
    >
      {children}
    </div>
  );
}
