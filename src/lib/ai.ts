import "server-only";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

// Logs each HTTP attempt, so a slow generation shows whether the time went to retries (429/503) or one slow response.
const google = createGoogleGenerativeAI({
  fetch: async (input, init) => {
    const start = Date.now();
    const res = await fetch(input, init);
    console.log(`[gemini] HTTP ${res.status} in ${Date.now() - start}ms`);
    return res;
  },
});

// Swap providers here; feature code only imports these two models.
// Use with generateText({ model, output: Output.object({ schema }) }) — see node_modules/ai/docs.
// Both pinned to Flash Lite: on Gemini's free tier, Flash models allow only 20 requests/day, Flash Lite 500.
export const taggingModel = google(process.env.TAGGING_MODEL ?? "gemini-3.5-flash-lite");
export const outfitModel = google(process.env.OUTFIT_MODEL ?? "gemini-3.5-flash-lite");
