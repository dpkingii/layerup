import { Suspense } from "react";
import { SettingsForm } from "@/components/onboarding/settings-form";
import { SettingsHeader } from "@/components/settings-section";
import { getOnboardedProfile, toFields } from "@/lib/profile";

export default function StyleSettingsPage() {
  return (
    <>
      <SettingsHeader title="Style" description="What the stylist reaches for." />
      <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
        <StyleSettings />
      </Suspense>
    </>
  );
}

async function StyleSettings() {
  const profile = await getOnboardedProfile();
  return <SettingsForm initial={toFields(profile)} section="style" />;
}
