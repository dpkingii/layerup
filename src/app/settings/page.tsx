import { Suspense } from "react";
import { redirect } from "next/navigation";
import { signOut } from "@/app/login/actions";
import { AppNav } from "@/components/app-nav";
import { SettingsForm } from "@/components/onboarding/settings-form";
import { Button } from "@/components/ui/button";
import { getOnboardedProfile, toFields } from "@/lib/profile";

export default function SettingsPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
      <AppNav />
      <h1 className="text-2xl font-semibold">Settings</h1>
      <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
        <Settings />
      </Suspense>
      <form action={signOutAndRedirect}>
        <Button type="submit" variant="outline">
          Sign out
        </Button>
      </form>
    </main>
  );
}

async function signOutAndRedirect() {
  "use server";
  await signOut();
  redirect("/login");
}

async function Settings() {
  const profile = await getOnboardedProfile();
  return <SettingsForm initial={toFields(profile)} />;
}
