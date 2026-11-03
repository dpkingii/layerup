import "server-only";
import { google } from "@ai-sdk/google";

// Swap providers here; feature code only imports these two models.
// Use with generateText({ model, output: Output.object({ schema }) }) — see node_modules/ai/docs.
// Both pinned to Flash Lite: on Gemini's free tier, Flash models allow only 20 requests/day, Flash Lite 500.
export const taggingModel = google(process.env.TAGGING_MODEL ?? "gemini-3.5-flash-lite");
export const outfitModel = google(process.env.OUTFIT_MODEL ?? "gemini-3.5-flash-lite");
