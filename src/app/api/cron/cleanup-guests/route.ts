import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

// Daily Vercel cron: deletes demo guests older than 7 days. Their rows cascade from auth.users,
// but storage files can't be deleted through SQL, so those go first through the Storage API.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false } },
  );

  const cutoff = Date.now() - MAX_AGE_MS;
  const expired: string[] = [];
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    for (const user of data.users) {
      if (user.is_anonymous && Date.parse(user.created_at) < cutoff) expired.push(user.id);
    }
    if (data.users.length < 1000) break;
  }

  for (const id of expired) {
    const { data: files, error: listError } = await supabase.storage.from("wardrobe").list(id, { limit: 1000 });
    if (listError) throw listError;
    if (files.length > 0) {
      const { error } = await supabase.storage.from("wardrobe").remove(files.map((f) => `${id}/${f.name}`));
      if (error) throw error;
    }
    const { error } = await supabase.auth.admin.deleteUser(id);
    if (error) throw error;
  }

  return Response.json({ deleted: expired.length });
}
