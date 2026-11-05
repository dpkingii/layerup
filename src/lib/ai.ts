import "server-only";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { APICallError, RetryError } from "ai";

const FALLBACK_MODEL = process.env.FALLBACK_MODEL ?? "gemini-3.1-flash-lite";

// Logs each HTTP attempt, so a slow generation shows whether the time went to retries (429/503) or one slow response.
async function timedFetch(input: RequestInfo | URL, init?: RequestInit) {
  const start = Date.now();
  const res = await fetch(input, init);
  console.log(`[gemini] HTTP ${res.status} in ${Date.now() - start}ms ${String(input).match(/models\/([^:]+)/)?.[1] ?? ""}`);
  return res;
}

const google = createGoogleGenerativeAI({
  // A 503 means Google is short on capacity for that model, often for minutes, so retrying it mostly adds wait.
  // Another model usually has room, and its free-tier quota is separate.
  fetch: async (input, init) => {
    const res = await timedFetch(input, init);
    if (res.status !== 503) return res;
    const fallback = String(input).replace(/models\/[^:]+:/, `models/${FALLBACK_MODEL}:`);
    return fallback === String(input) ? res : timedFetch(fallback, init);
  },
});

// Swap providers here; feature code only imports these two models.
// Use with generateText({ model, output: Output.object({ schema }) }) — see node_modules/ai/docs.
// Both pinned to Flash Lite: on Gemini's free tier, Flash models allow only 20 requests/day, Flash Lite 500.
export const taggingModel = google(process.env.TAGGING_MODEL ?? "gemini-3.5-flash-lite");
export const outfitModel = google(process.env.OUTFIT_MODEL ?? "gemini-3.5-flash-lite");

// User-facing message for quota and capacity errors; null for anything else.
export function aiUnavailableMessage(e: unknown): string | null {
  const cause = RetryError.isInstance(e) ? e.lastError : e;
  if (!APICallError.isInstance(cause)) return null;
  if (cause.statusCode === 429) return "AI limit reached. Wait a minute and try again.";
  if (cause.statusCode === 503) return "The AI is busy right now. Try again in a minute.";
  return null;
}
