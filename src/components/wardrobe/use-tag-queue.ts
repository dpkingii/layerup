"use client";

import { useEffect, useRef, useState } from "react";
import { autoTagItem } from "@/app/wardrobe/actions";
import type { ItemRow } from "@/lib/wardrobe/items";

// Tagging shares Gemini's free-tier quota (15 requests/min) with outfit generation,
// so one call at a time, spaced to ~12/min.
const MIN_GAP_MS = 5_000;
const RATE_LIMIT_WAIT_MS = 60_000;
const MAX_RATE_LIMIT_RETRIES = 3;

export type QueueState = "queued" | "tagging" | "waiting";

export function useTagQueue(onRow: (row: ItemRow) => void) {
  const [states, setStates] = useState<ReadonlyMap<string, QueueState>>(new Map());
  const [quotaExhausted, setQuotaExhausted] = useState(false);
  const queue = useRef<string[]>([]);
  const running = useRef(false);
  const stopped = useRef(false);
  const lastCallAt = useRef(0);
  const onRowRef = useRef(onRow);
  useEffect(() => {
    onRowRef.current = onRow;
  }, [onRow]);

  function setState(id: string, state: QueueState | null) {
    setStates((prev) => {
      const next = new Map(prev);
      if (state) next.set(id, state);
      else next.delete(id);
      return next;
    });
  }

  // Sleeps in short steps so stop() takes effect within a second.
  async function sleep(ms: number) {
    const until = Date.now() + ms;
    while (!stopped.current && Date.now() < until) {
      await new Promise((r) => setTimeout(r, Math.min(1_000, until - Date.now())));
    }
  }

  async function tagOne(id: string): Promise<"done" | "quota"> {
    for (let attempt = 0; attempt <= MAX_RATE_LIMIT_RETRIES; attempt++) {
      await sleep(lastCallAt.current + MIN_GAP_MS - Date.now());
      if (stopped.current) return "done";
      setState(id, "tagging");
      lastCallAt.current = Date.now();
      try {
        const result = await autoTagItem(id);
        if (result.status === "demo_limit") return "quota";
        if (result.status !== "rate_limited") {
          onRowRef.current(result.row);
          return "done";
        }
      } catch (err) {
        console.error(`Auto-tagging item ${id} failed`, err);
        return "done";
      }
      if (attempt === MAX_RATE_LIMIT_RETRIES) return "quota";
      setState(id, "waiting");
      await sleep(RATE_LIMIT_WAIT_MS);
    }
    return "quota";
  }

  async function run() {
    if (running.current) return;
    running.current = true;
    for (let id = queue.current.shift(); id && !stopped.current; id = queue.current.shift()) {
      const outcome = await tagOne(id);
      setState(id, null);
      if (outcome === "quota") {
        setQuotaExhausted(true);
        stop();
      }
    }
    running.current = false;
  }

  function enqueue(ids: string[]) {
    const fresh = ids.filter((id) => !queue.current.includes(id) && !states.has(id));
    if (!fresh.length) return;
    setQuotaExhausted(false);
    // A loop still winding down after stop() picks these up instead of exiting.
    stopped.current = false;
    queue.current.push(...fresh);
    setStates((prev) => new Map([...prev, ...fresh.map((id) => [id, "queued"] as const)]));
    run();
  }

  function stop() {
    stopped.current = true;
    queue.current = [];
    setStates(new Map());
  }

  useEffect(() => () => stop(), []);

  return { states, enqueue, stop, busy: states.size > 0, quotaExhausted };
}
