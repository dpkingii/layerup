import "server-only";
import { generateText, Output } from "ai";
import { z } from "zod";
import { outfitModel } from "@/lib/ai";

export const IconProfile = z.object({
  summary: z.string().describe("One line naming the style, e.g. \"Off-duty minimalism: oversized tailoring over sporty basics\""),
  signaturePieces: z.array(z.string()).min(2).max(6).describe("Garments they're known for, e.g. \"oversized blazer\""),
  palette: z.array(z.string()).min(1).max(5).describe("Plain color names"),
  silhouette: z.string().describe("Fit and proportions in a few words"),
  layering: z.string().describe("How they layer, in a few words"),
});
export type IconProfile = z.infer<typeof IconProfile>;

// `known` lets the model admit it doesn't know someone instead of inventing a style for them.
const FromName = IconProfile.extend({
  known: z
    .boolean()
    .describe("true only if you confidently know this person's public, recurring personal style; false for unknown or ambiguous names"),
});

const RULES = `Describe everyday clothing style for a personal outfit app: garments, colors, fit and layering a person could recreate from their own closet. No brands, prices or body descriptions.`;

export async function profileFromName(name: string): Promise<IconProfile | null> {
  const { output } = await generateText({
    model: outfitModel,
    output: Output.object({ schema: FromName }),
    prompt: `${RULES}\n\nWhose style: ${name}`,
  });
  const { known, ...profile } = output;
  return known ? profile : null;
}

export async function profileFromDescription(name: string, description: string): Promise<IconProfile> {
  const { output } = await generateText({
    model: outfitModel,
    output: Output.object({ schema: IconProfile }),
    prompt: `${RULES}\nBase it only on the user's description of ${name}'s style; don't add what you might know about them.\n\nDescription: ${description}`,
  });
  return output;
}
