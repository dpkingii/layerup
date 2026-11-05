import { Suspense } from "react";
import { SettingsHeader, SettingsRow } from "@/components/settings-section";
import { StyleIcons } from "@/components/style-icons/style-icons";
import { getOnboardedProfile } from "@/lib/profile";
import { listStyleIcons } from "@/lib/style-icons";
import { createClient } from "@/lib/supabase/server";

export default function StyleIconsPage() {
  return (
    <>
      <SettingsHeader title="Style icons" description="People whose style you love. Saved as you go." />
      <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
        <StyleIconSettings />
      </Suspense>
    </>
  );
}

async function StyleIconSettings() {
  await getOnboardedProfile();
  const icons = await listStyleIcons(await createClient());
  return (
    <SettingsRow title="People you dress like" description="Up to 3. Everyday outfits blend their style with your vibes.">
      <StyleIcons initial={icons} />
    </SettingsRow>
  );
}
