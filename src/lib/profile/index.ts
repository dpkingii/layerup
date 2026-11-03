import "server-only";
import { redirect } from "next/navigation";
import type { ProfileFields } from "@/components/onboarding/fields";
import type { Tables } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

export type Profile = Tables<"profiles">;

export async function getProfile(): Promise<Profile> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims) redirect("/login");

  const { data, error } = await supabase.from("profiles").select("*").eq("id", claims.claims.sub).single();
  if (error) throw error;
  return data;
}

export async function getOnboardedProfile(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile.onboarded_at) redirect("/onboarding");
  return profile;
}

// Postgres `time` comes back as "08:00:00"; <input type="time"> wants "08:00".
export function toFields(profile: Profile): ProfileFields {
  return {
    vibes: profile.vibes,
    temp_sensitivity: profile.temp_sensitivity,
    fit_pref: profile.fit_pref,
    day_start: profile.day_start.slice(0, 5),
    day_end: profile.day_end.slice(0, 5),
  };
}
