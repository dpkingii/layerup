import { Suspense } from "react";
import { redirect } from "next/navigation";
import { signOut } from "@/app/login/actions";
import { SettingsHeader, SettingsRow } from "@/components/settings-section";
import { Button } from "@/components/ui/button";
import { getOnboardedProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";

export default function AccountPage() {
  return (
    <>
      <SettingsHeader title="Account" description="Your Layerup sign-in." />
      <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
        <AccountSettings />
      </Suspense>
    </>
  );
}

async function signOutAndRedirect() {
  "use server";
  await signOut();
  redirect("/login");
}

async function AccountSettings() {
  await getOnboardedProfile();
  const { data: auth } = await (await createClient()).auth.getClaims();
  return (
    <SettingsRow
      title="Signed in as"
      description={auth?.claims.is_anonymous ? "A demo guest. Signing out ends this demo session." : (auth?.claims.email ?? "Your Layerup account.")}
    >
      <form action={signOutAndRedirect}>
        <Button type="submit" variant="outline">
          Sign out
        </Button>
      </form>
    </SettingsRow>
  );
}
