"use client";

import { startTransition, useActionState, useState } from "react";
import { updateSettings, type SaveState } from "@/lib/profile/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DayWindowFields, FitPicker, TempPicker, VibePicker, type ProfileFields } from "./fields";

export function SettingsForm({ initial }: { initial: ProfileFields }) {
  const [state, formAction, pending] = useActionState<SaveState, FormData>(updateSettings, {
    status: "idle",
  });
  const [fields, setFields] = useState(initial);

  return (
    <form
      // A form `action` auto-resets after submit, reverting controlled radios in the DOM to their initial value.
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(() => formAction(formData));
      }}
      className="flex flex-col gap-4"
    >
      <Section title="Style vibes" description="Pick every vibe that feels like you.">
        <VibePicker value={fields.vibes} onChange={(vibes) => setFields({ ...fields, vibes })} />
      </Section>
      <Section title="Temperature sensitivity" description={`We'll shift what "cold" means for you.`}>
        <TempPicker
          value={fields.temp_sensitivity}
          onChange={(temp_sensitivity) => setFields({ ...fields, temp_sensitivity })}
        />
      </Section>
      <Section title="Fit preference" description="Optional.">
        <FitPicker value={fields.fit_pref} onChange={(fit_pref) => setFields({ ...fields, fit_pref })} />
      </Section>
      <Section title="Day window" description="When you're usually out.">
        <DayWindowFields
          start={fields.day_start}
          end={fields.day_end}
          onChange={(window) => setFields({ ...fields, ...window })}
        />
      </Section>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending || fields.vibes.length === 0}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
        {state.message && (
          <p
            role="status"
            className={state.status === "error" ? "text-sm text-destructive" : "text-sm text-muted-foreground"}
          >
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
