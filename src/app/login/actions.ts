"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { BUCKET, cutoutPath, photoPath } from "@/lib/wardrobe/items";

export type LoginState = { status: "idle" | "sent" | "error"; message?: string };

export async function sendMagicLink(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = z.email().safeParse(String(formData.get("email") ?? "").trim().toLowerCase());
  if (!parsed.success) return { status: "error", message: "Enter a valid email address." };

  const origin = (await headers()).get("origin");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  if (error) {
    // The allowlist trigger aborts user creation, which Supabase reports as a generic DB error.
    if (error.message.includes("Database error saving new user")) {
      return { status: "error", message: "Layerup is invite-only right now, and this email isn't on the list." };
    }
    return { status: "error", message: error.message };
  }

  return { status: "sent", message: `Check ${parsed.data} for your sign-in link.` };
}

const DEMO_UNAVAILABLE = "The demo isn't available right now. Try again in a minute.";

// Signs the visitor in as an anonymous guest with their own copy of the sample closet.
export async function startDemo(): Promise<LoginState> {
  const supabase = await createClient();
  const { data: auth, error } = await supabase.auth.signInAnonymously();
  if (error || !auth.user) {
    console.error("Demo sign-in failed", error);
    return { status: "error", message: DEMO_UNAVAILABLE };
  }

  const { data: copies, error: seedError } = await supabase.rpc("seed_demo_closet");
  if (seedError) {
    console.error("Seeding the demo closet failed", seedError);
    await supabase.auth.signOut();
    return { status: "error", message: DEMO_UNAVAILABLE };
  }

  const userId = auth.user.id;
  const storage = supabase.storage.from(BUCKET);
  const results = await Promise.all(
    copies.flatMap(({ item_id, photo_from, cutout_from }) => [
      storage.copy(photo_from, photoPath(userId, item_id)),
      ...(cutout_from ? [storage.copy(cutout_from, cutoutPath(userId, item_id))] : []),
    ]),
  );
  // A missing copy only leaves that item without a picture, so the demo still opens.
  for (const { error: copyError } of results) if (copyError) console.error("Copying a demo photo failed", copyError);

  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
