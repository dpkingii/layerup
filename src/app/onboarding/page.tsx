import { Suspense } from "react";
import { redirect } from "next/navigation";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { getProfile, toFields } from "@/lib/profile";
import { listStyleIcons } from "@/lib/style-icons";
import { createClient } from "@/lib/supabase/server";

export default function OnboardingPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-2xl font-semibold">Welcome to Layerup</h1>
      <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
        <Onboarding />
      </Suspense>
    </main>
  );
}

async function Onboarding() {
  const profile = await getProfile();
  if (profile.onboarded_at) redirect("/settings");

  const icons = await listStyleIcons(await createClient());
  return <OnboardingFlow initial={toFields(profile)} icons={icons} />;
}
