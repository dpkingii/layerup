"use client";

import { useActionState } from "react";
import { startDemo, type LoginState } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DemoButton({ note, className }: { note: string; className?: string }) {
  const [state, action, pending] = useActionState<LoginState>(startDemo, { status: "idle" });

  return (
    <form action={action} className={cn("flex flex-col items-center gap-2", className)}>
      <Button type="submit" size="lg" className="h-12 rounded-full px-7 text-base" disabled={pending}>
        {pending ? "Setting up your demo closet…" : "Try the demo"}
      </Button>
      <p className="text-sm text-muted-foreground">{note}</p>
      {state.message && (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      )}
    </form>
  );
}
