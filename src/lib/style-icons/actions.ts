"use server";

import { z } from "zod";
import { aiUnavailableMessage } from "@/lib/ai";
import type { TablesInsert } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";
import { MAX_STYLE_ICONS, type StyleIcon } from "./index";
import { profileFromDescription, profileFromName, type IconProfile } from "./profile";

export type IconResult =
  | { ok: true; icon: StyleIcon }
  | { ok: false; reason: "unknown" | "error"; error: string };

const Name = z.string().trim().min(1, "Enter a name.").max(80);
const Description = z.string().trim().min(3, "Describe their style in a few words.").max(500);
const Fields = z.object({
  summary: z.string().trim().max(200),
  signature_pieces: z.array(z.string().trim().min(1).max(60)).max(8),
  palette: z.array(z.string().trim().min(1).max(30)).max(6),
  silhouette: z.string().trim().max(120),
  layering: z.string().trim().max(120),
});
export type IconFields = z.infer<typeof Fields>;

type Supabase = Awaited<ReturnType<typeof createClient>>;

const toRow = (p: IconProfile) => ({
  status: "ready" as const,
  summary: p.summary,
  signature_pieces: p.signaturePieces,
  palette: p.palette,
  silhouette: p.silhouette,
  layering: p.layering,
});

export async function addStyleIcon(rawName: string): Promise<IconResult> {
  const name = Name.safeParse(rawName);
  if (!name.success) return fail(name.error.issues[0].message);
  const supabase = await createClient();
  const blocked = await checkRoom(supabase, name.data);
  if (blocked) return fail(blocked);

  return withAi(async () => {
    const profile = await profileFromName(name.data);
    if (!profile) {
      return { ok: false, reason: "unknown", error: `I don't know ${name.data}'s style well.` };
    }
    return insert(supabase, { name: name.data, ...toRow(profile) });
  });
}

// Creates an icon from the user's own words, or fills in a saved placeholder when `id` is given.
export async function describeStyleIcon(input: { id?: string; name: string; description: string }): Promise<IconResult> {
  const name = Name.safeParse(input.name);
  const description = Description.safeParse(input.description);
  if (!name.success) return fail(name.error.issues[0].message);
  if (!description.success) return fail(description.error.issues[0].message);
  const supabase = await createClient();
  if (!input.id) {
    const blocked = await checkRoom(supabase, name.data);
    if (blocked) return fail(blocked);
  }

  return withAi(async () => {
    const row = { name: name.data, ...toRow(await profileFromDescription(name.data, description.data)) };
    if (!input.id) return insert(supabase, row);
    const { data, error } = await supabase.from("style_icons").update(row).eq("id", input.id).select().single();
    if (error) throw error;
    return { ok: true, icon: data };
  });
}

export async function saveStyleIconPlaceholder(rawName: string): Promise<IconResult> {
  const name = Name.safeParse(rawName);
  if (!name.success) return fail(name.error.issues[0].message);
  const supabase = await createClient();
  const blocked = await checkRoom(supabase, name.data);
  if (blocked) return fail(blocked);
  try {
    return await insert(supabase, { name: name.data, status: "placeholder" });
  } catch (e) {
    console.error("saveStyleIconPlaceholder failed", e);
    return fail("Couldn't save that. Try again.");
  }
}

export async function updateStyleIcon(id: string, fields: IconFields): Promise<IconResult> {
  const parsed = Fields.safeParse(fields);
  if (!z.uuid().safeParse(id).success || !parsed.success) return fail("Check the fields and try again.");
  const supabase = await createClient();
  const { data, error } = await supabase.from("style_icons").update(parsed.data).eq("id", id).select().single();
  if (error) {
    console.error("updateStyleIcon failed", error);
    return fail("Couldn't save that. Try again.");
  }
  return { ok: true, icon: data };
}

export async function deleteStyleIcon(id: string): Promise<{ ok: boolean }> {
  if (!z.uuid().safeParse(id).success) return { ok: false };
  const supabase = await createClient();
  const { error } = await supabase.from("style_icons").delete().eq("id", id);
  return { ok: !error };
}

function fail(error: string): IconResult {
  return { ok: false, reason: "error", error };
}

async function checkRoom(supabase: Supabase, name: string): Promise<string | null> {
  const { data, error } = await supabase.from("style_icons").select("name");
  if (error) throw error;
  if (data.some((icon) => icon.name.toLowerCase() === name.toLowerCase())) return `${name} is already saved.`;
  if (data.length >= MAX_STYLE_ICONS) return `You can save up to ${MAX_STYLE_ICONS} style icons. Remove one in Settings first.`;
  return null;
}

async function insert(supabase: Supabase, row: TablesInsert<"style_icons">): Promise<IconResult> {
  const { data, error } = await supabase.from("style_icons").insert(row).select().single();
  if (error) throw error;
  return { ok: true, icon: data };
}

async function withAi(run: () => Promise<IconResult>): Promise<IconResult> {
  try {
    return await run();
  } catch (e) {
    const unavailable = aiUnavailableMessage(e);
    if (unavailable) return fail(unavailable);
    console.error("Style icon AI call failed", e);
    return fail("Couldn't read their style. Try again.");
  }
}
