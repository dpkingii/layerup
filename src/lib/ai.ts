import "server-only";
import { google } from "@ai-sdk/google";

// Swap providers here; feature code only imports these two models.
// Use with generateText({ model, output: Output.object({ schema }) }) — see node_modules/ai/docs.
export const taggingModel = google(process.env.TAGGING_MODEL ?? "gemini-flash-lite-latest");
export const outfitModel = google(process.env.OUTFIT_MODEL ?? "gemini-flash-latest");
