import { Suspense } from "react";
import { AppNav } from "@/components/app-nav";
import { Today } from "@/components/today/today";
import { getOnboardedProfile } from "@/lib/profile";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-4 sm:p-6">
      <AppNav />
      <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
        <OnboardedToday />
      </Suspense>
    </main>
  );
}

async function OnboardedToday() {
  await getOnboardedProfile();
  return <Today />;
}
