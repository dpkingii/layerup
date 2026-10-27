"use client";

import { useActionState } from "react";
import { sendMagicLink, type LoginState } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(sendMagicLink, {
    status: "idle",
  });

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign in to Layerup</CardTitle>
          <CardDescription>We&apos;ll email you a sign-in link.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" autoComplete="email" required />
            </div>
            <Button type="submit" disabled={pending}>
              {pending ? "Sending…" : "Send link"}
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
        </CardContent>
      </Card>
    </main>
  );
}
