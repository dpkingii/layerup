import { Suspense } from "react";
import { AppNav } from "@/components/app-nav";
import { Stylist } from "@/components/today/stylist";
import type { StylistItem } from "@/lib/outfit/types";
import { getOnboardedProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import { listItems, tagsFromRow } from "@/lib/wardrobe/items";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-4 sm:p-6">
      <AppNav />
      <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
        <OnboardedStylist />
      </Suspense>
    </main>
  );
}

async function OnboardedStylist() {
  await getOnboardedProfile();
  const items = await listItems(await createClient());
  const closet: StylistItem[] = items.flatMap((item) => {
    const tags = item.tag_status === "pending" || item.tag_status === "failed" ? null : tagsFromRow(item);
    return tags
      ? [{ id: item.id, slot: tags.slot, label: `${tags.colors[0]} ${tags.subtype}`, photoUrl: item.photoUrl, cutoutUrl: item.cutoutUrl }]
      : [];
  });
  return <Stylist closet={closet} />;
}
