import { Suspense } from "react";
import { WardrobeBoard } from "@/components/wardrobe/wardrobe-board";
import { createClient } from "@/lib/supabase/server";
import { listItems } from "@/lib/wardrobe/items";

export default function WardrobePage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-4 sm:p-6">
      <h1 className="text-2xl font-semibold">Wardrobe</h1>
      <Suspense fallback={<p className="text-muted-foreground">Loading your closet…</p>}>
        <Wardrobe />
      </Suspense>
    </main>
  );
}

async function Wardrobe() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const items = await listItems(supabase);
  return <WardrobeBoard userId={data!.claims.sub} initialItems={items} />;
}
