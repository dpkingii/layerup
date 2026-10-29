"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { FitPref, TempSensitivity } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";
import { VIBE_IDS } from "./vibes";

export type SaveState = { status: "idle" | "saved" | "error"; message?: string };

const Time = z.string().regex(/^\d{2}:\d{2}$/, "Enter a time like 08:00.");

const ProfileInput = z
  .object({
    vibes: z.array(z.enum(VIBE_IDS)).min(1, "Pick at least one vibe."),
    temp_sensitivity: TempSensitivity,
    fit_pref: FitPref.nullable(),
    day_start: Time,
    day_end: Time,
  })
  .refine((p) => p.day_end > p.day_start, { message: "Your day has to end after it starts." });

function parse(formData: FormData) {
  return ProfileInput.safeParse({
    vibes: formData.getAll("vibes"),
    temp_sensitivity: formData.get("temp_sensitivity"),
    fit_pref: formData.get("fit_pref") || null,
    day_start: formData.get("day_start"),
    day_end: formData.get("day_end"),
  });
}

async function save(fields: z.infer<typeof ProfileInput> & { onboarded_at?: string }) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims) redirect("/login");

  const { error } = await supabase.from("profiles").update(fields).eq("id", claims.claims.sub);
  return error;
}

export async function completeOnboarding(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const parsed = parse(formData);
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0].message };

  const error = await save({ ...parsed.data, onboarded_at: new Date().toISOString() });
  if (error) return { status: "error", message: error.message };

  redirect("/");
}

export async function updateSettings(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const parsed = parse(formData);
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0].message };

  const error = await save(parsed.data);
  if (error) return { status: "error", message: error.message };

  return { status: "saved", message: "Saved." };
}
