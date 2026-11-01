import { redirect } from "next/navigation";
import { signOut } from "@/app/login/actions";
import { Today } from "@/components/today/today";
import { Button } from "@/components/ui/button";

export default function Home() {
  async function signOutAndRedirect() {
    "use server";
    await signOut();
    redirect("/login");
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-4 sm:p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Layerup</h1>
        {/* Until settings lands, sign-out lives here. */}
        <form action={signOutAndRedirect}>
          <Button type="submit" variant="link" size="sm" className="text-muted-foreground">
            Sign out
          </Button>
        </form>
      </header>
      <Today />
    </main>
  );
}
