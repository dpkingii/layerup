"use client";

import { useActionState } from "react";
import { sendMagicLink, startDemo, type LoginState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(sendMagicLink, {
    status: "idle",
  });
  const [demoState, demoAction, demoPending] = useActionState<LoginState>(startDemo, { status: "idle" });

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="flex w-full max-w-sm flex-col gap-10">
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Layerup</h1>
          <p className="text-pretty text-muted-foreground">
            Tell the stylist about your day and get an outfit from your own closet, dressed for the forecast.
          </p>
        </div>

        <form action={demoAction} className="flex flex-col gap-2">
          <Button type="submit" size="lg" className="h-12 rounded-full text-base" disabled={demoPending}>
            {demoPending ? "Setting up your demo closet…" : "Try the demo"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">No sign-up. You get a sample closet of 19 pieces.</p>
          {demoState.message && (
            <p role="alert" className="text-center text-sm text-destructive">
              {demoState.message}
            </p>
          )}
        </form>

        <form action={formAction} className="flex flex-col gap-3 border-t border-border/60 pt-8">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Have an invite? Sign in with email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required className="h-10" />
          </div>
          <Button type="submit" variant="secondary" className="h-10 rounded-full" disabled={pending}>
            {pending ? "Sending…" : "Email me a sign-in link"}
          </Button>
          {state.message && (
            <p
              role="status"
              className={state.status === "error" ? "text-sm text-destructive" : "text-sm text-muted-foreground"}
            >
              {state.message}
            </p>
          )}
        </form>
      </div>
    </main>
  );
}
