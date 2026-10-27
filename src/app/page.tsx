import { Suspense } from "react";
import { redirect } from "next/navigation";
import { signOut } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

// Placeholder home until the Today screen (track D) lands.
export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold">Layerup</h1>
      <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
        <SignedInAs />
      </Suspense>
    </main>
  );
}

async function SignedInAs() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  async function signOutAndRedirect() {
    "use server";
    await signOut();
    redirect("/login");
  }

  return (
    <>
      <p className="text-muted-foreground">Signed in as {data?.claims.email}</p>
      <form action={signOutAndRedirect}>
        <Button type="submit" variant="outline">
          Sign out
        </Button>
      </form>
    </>
  );
}
