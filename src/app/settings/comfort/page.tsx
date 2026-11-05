import { Suspense } from "react";
import { SettingsForm } from "@/components/onboarding/settings-form";
import { SettingsHeader } from "@/components/settings-section";
import { getOnboardedProfile, toFields } from "@/lib/profile";

export default function ComfortSettingsPage() {
  return (
    <>
      <SettingsHeader title="Comfort" description="How warm to dress you, and for how long." />
      <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
        <ComfortSettings />
      </Suspense>
    </>
  );
}

async function ComfortSettings() {
  const profile = await getOnboardedProfile();
  return <SettingsForm initial={toFields(profile)} section="comfort" />;
}
