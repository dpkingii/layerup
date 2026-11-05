import { Suspense } from "react";
import { redirect } from "next/navigation";
import { signOut } from "@/app/login/actions";
import { AppNav } from "@/components/app-nav";
import { PAGE_FRAME } from "@/components/page-frame";
import { SettingsForm } from "@/components/onboarding/settings-form";
import { Button } from "@/components/ui/button";
import { getOnboardedProfile, toFields } from "@/lib/profile";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  return (
    <>
      <AppNav />
      <main className={cn(PAGE_FRAME, "flex flex-1 flex-col gap-6 py-6")}>
        <div className="flex max-w-2xl flex-col gap-6">
          <h1 className="text-2xl font-semibold">Settings</h1>
          <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
            <Settings />
          </Suspense>
          <form action={signOutAndRedirect}>
            <Button type="submit" variant="outline">
              Sign out
            </Button>
          </form>
        </div>
      </main>
    </>
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
