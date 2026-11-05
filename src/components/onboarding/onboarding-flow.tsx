"use client";

import { startTransition, useActionState, useState } from "react";
import { completeOnboarding, type SaveState } from "@/lib/profile/actions";
import { Button } from "@/components/ui/button";
import { StyleIcons } from "@/components/style-icons/style-icons";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { StyleIcon } from "@/lib/style-icons";
import { DayWindowFields, FitPicker, TempPicker, VibePicker, type ProfileFields } from "./fields";

const STEPS = [
  { title: "What's your style?", description: "Pick every vibe that feels like you." },
  {
    title: "Anyone whose style you love?",
    description: "Optional. Add up to 3 people and outfits will borrow from their style.",
  },
  {
    title: "How do you handle temperature?",
    description: "We'll shift what \"cold\" means for you.",
  },
  { title: "Any fit preference?", description: "Optional. Skip if you don't mind." },
  { title: "When are you usually out?", description: "We'll dress you for the weather in this window." },
];

export function OnboardingFlow({ initial, icons }: { initial: ProfileFields; icons: StyleIcon[] }) {
  const [state, formAction, pending] = useActionState<SaveState, FormData>(completeOnboarding, {
    status: "idle",
  });
  const [step, setStep] = useState(0);
  const [fields, setFields] = useState(initial);
  const isLast = step === STEPS.length - 1;
  const canAdvance = step !== 0 || fields.vibes.length > 0;

  return (
    <form
      // A form `action` auto-resets after submit, reverting controlled radios in the DOM to their initial value.
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(() => formAction(formData));
      }}
      className="w-full max-w-2xl"
    >
      <Card>
        <CardHeader>
          <p className="text-xs text-muted-foreground">
            Step {step + 1} of {STEPS.length}
          </p>
          <CardTitle className="text-lg">{STEPS[step].title}</CardTitle>
          <CardDescription>{STEPS[step].description}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Every step stays mounted so all inputs are submitted with the final step. */}
          <div hidden={step !== 0}>
            <VibePicker value={fields.vibes} onChange={(vibes) => setFields({ ...fields, vibes })} />
          </div>
          <div hidden={step !== 1}>
            <StyleIcons initial={icons} />
          </div>
          <div hidden={step !== 2}>
            <TempPicker
              value={fields.temp_sensitivity}
              onChange={(temp_sensitivity) => setFields({ ...fields, temp_sensitivity })}
            />
          </div>
          <div hidden={step !== 3}>
            <FitPicker value={fields.fit_pref} onChange={(fit_pref) => setFields({ ...fields, fit_pref })} />
          </div>
          <div hidden={step !== 4}>
            <DayWindowFields
              start={fields.day_start}
              end={fields.day_end}
              onChange={(window) => setFields({ ...fields, ...window })}
            />
          </div>
          {state.status === "error" && (
            <p role="alert" className="mt-4 text-sm text-destructive">
              {state.message}
            </p>
          )}
        </CardContent>
        <CardFooter className="justify-between gap-2">
          <Button type="button" variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>
            Back
          </Button>
          <div className="flex gap-2">
            {step === 3 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFields({ ...fields, fit_pref: null });
                  setStep(step + 1);
                }}
              >
                Skip
              </Button>
            )}
            {/* Distinct keys stop React reusing the Next button as submit mid-click, which would submit early. */}
            {isLast ? (
              <Button key="finish" type="submit" disabled={pending}>
                {pending ? "Saving…" : "Finish"}
              </Button>
            ) : (
              <Button key="next" type="button" disabled={!canAdvance} onClick={() => setStep(step + 1)}>
                Next
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </form>
  );
}
