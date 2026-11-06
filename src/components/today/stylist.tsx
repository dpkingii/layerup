"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { ArrowUp, CheckCircle2, RotateCcw } from "lucide-react";
import Link from "next/link";
import { askStylist, wearOutfit, type AskInput } from "@/app/today/actions";
import { Button } from "@/components/ui/button";
import { WeatherSection } from "@/components/weather/weather-section";
import { DEMO_AI_LIMIT_MESSAGE } from "@/lib/demo";
import type { StylistItem, SuggestionView } from "@/lib/outfit/types";
import type { Outfit, WeatherWindow } from "@/lib/schemas";
import { addStyleIcon } from "@/lib/style-icons/actions";
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
  const [error, setError] = useState<{ message: string; retry?: () => void } | null>(null);
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
        setError({
          message: result.error,
          retry: result.error === DEMO_AI_LIMIT_MESSAGE ? undefined : () => run(input),
        });
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
        !empty && "sticky bottom-0 z-40 -mx-4 bg-background/90 px-4 pt-2 pb-4 backdrop-blur sm:-mx-6 sm:px-6",
      )}
    >
      <div className={cn("flex flex-wrap gap-2", empty && "order-last justify-center")}>
        {chips.map((chip) => (
          <button
            key={chip}
            type="button"
            disabled={!weather || busy}
            onClick={() => send(chip)}
            className="h-8 rounded-full bg-secondary px-3.5 text-sm font-medium transition-colors outline-none hover:bg-secondary/70 focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
          >
            {chip}
          </button>
        ))}
      </div>
      <div className="flex h-12 items-center gap-2 rounded-full bg-secondary p-1.5 pl-5 focus-within:ring-3 focus-within:ring-ring/30">
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
      {!weather && <p className="text-center text-xs text-muted-foreground">Waiting for the weather before styling…</p>}
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
            <Button variant="secondary" size="sm" className="rounded-full" onClick={startOver} disabled={busy}>
              <RotateCcw />
              Start over
            </Button>
          </div>
        )}

        {turns.map((turn, i) =>
          turn.kind === "user" ? (
            <p key={i} className="max-w-[80%] self-end rounded-3xl bg-secondary px-4 py-2.5">
              {turn.text}
            </p>
          ) : (
            <StylistReply
              key={turn.suggestion.id}
              faded={i !== latestIndex}
              look={
                <OutfitCard
                  items={turn.items}
                  closet={closetById}
                  editable={i === latestIndex && !turn.worn && !busy}
                  onChange={(items) => updateLatest({ items })}
                />
              }
            >
              <p className="text-base text-pretty">{turn.suggestion.rationale}</p>
              {turn.suggestion.mentionedIcon && <IconOffer name={turn.suggestion.mentionedIcon} />}
              {i === latestIndex &&
                (turn.worn ? (
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <CheckCircle2 className="size-4 text-primary" aria-hidden />
                    Logged. Have a good day in it.
                  </p>
                ) : (
                  <div className="flex flex-col items-start gap-2">
                    <Button size="lg" className="rounded-full px-6" onClick={wear} disabled={busy}>
                      {wearing ? "Saving…" : "Wear this"}
                    </Button>
                    {closet.length > 1 && (
                      <span className="text-xs text-muted-foreground">Swipe a piece, or use its arrows, to swap it.</span>
                    )}
                  </div>
                ))}
            </StylistReply>
          ),
        )}

        {thinking && (
          <StylistReply look={<OutfitCardSkeleton />}>
            <p className="text-sm text-muted-foreground">Pulling a look together…</p>
          </StylistReply>
        )}

        {error && (
          <div role="alert" className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-destructive">{error.message}</span>
            {error.retry && (
              <Button variant="secondary" size="sm" className="rounded-full" onClick={error.retry}>
                Retry
              </Button>
            )}
          </div>
        )}
        <div ref={endRef} />
      </section>

      {!empty && composer}
    </div>
  );
}

// Saving makes one AI call to read their style, so it only happens on tap.
function IconOffer({ name }: { name: string }) {
  const [result, setResult] = useState<{ error: boolean; text: React.ReactNode } | null>(null);
  const [pending, start] = useTransition();

  function save() {
    start(async () => {
      const r = await addStyleIcon(name).catch(() => null);
      if (r?.ok) {
        setResult({ error: false, text: `Saved ${name} to your style icons.` });
      } else if (r?.reason === "unknown") {
        setResult({
          error: false,
          text: (
            <>
              I don&apos;t know {name}&apos;s style well. Describe it in{" "}
              <Link href="/settings/style-icons" className="underline underline-offset-2">
                Settings
              </Link>
              .
            </>
          ),
        });
      } else {
        setResult({ error: true, text: r?.error ?? "Couldn't reach Layerup. Try again." });
      }
    });
  }

  if (result) {
    return <p className={cn("text-sm", result.error ? "text-destructive" : "text-muted-foreground")}>{result.text}</p>;
  }
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-muted-foreground">Save {name} to your style icons?</span>
      <Button variant="secondary" size="sm" className="rounded-full" onClick={save} disabled={pending}>
        {pending ? "Reading their style…" : "Save"}
      </Button>
    </div>
  );
}

// Laid out like a Pinterest pin closeup: the look on an image panel, the note and actions beside it.
function StylistReply({ look, faded, children }: { look: React.ReactNode; faded?: boolean; children: React.ReactNode }) {
  return (
    <div className={cn("grid items-center gap-5 transition-opacity sm:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] sm:gap-8", faded && "opacity-50")}>
      <div className="rounded-3xl bg-card px-3 py-4">{look}</div>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
}
