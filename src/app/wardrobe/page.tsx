import { Suspense } from "react";
import { AppNav } from "@/components/app-nav";
import { PAGE_FRAME } from "@/components/page-frame";
import { WardrobeBoard } from "@/components/wardrobe/wardrobe-board";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { listItems } from "@/lib/wardrobe/items";

export default function WardrobePage() {
  return (
    <>
      <AppNav />
      <main className={cn(PAGE_FRAME, "flex flex-1 flex-col gap-6 py-6")}>
        <h1 className="text-2xl font-semibold">Wardrobe</h1>
        <Suspense fallback={<p className="text-muted-foreground">Loading your closet…</p>}>
          <Wardrobe />
        </Suspense>
      </main>
    </>
  );
}

async function Wardrobe() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const items = await listItems(supabase);
  return <WardrobeBoard userId={data!.claims.sub} initialItems={items} />;
}
