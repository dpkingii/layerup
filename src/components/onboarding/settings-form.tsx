"use client";

import { startTransition, useActionState, useState } from "react";
import { updateSettings, type SaveState } from "@/lib/profile/actions";
import { Button } from "@/components/ui/button";
import { SettingsRow } from "@/components/settings-section";
import { DayWindowFields, FitPicker, TempPicker, VibePicker, type ProfileFields } from "./fields";

const sameFields = (a: ProfileFields, b: ProfileFields) =>
  JSON.stringify({ ...a, vibes: a.vibes.toSorted() }) === JSON.stringify({ ...b, vibes: b.vibes.toSorted() });

// Each settings page edits part of the profile; the save action takes the whole profile,
// so the fields shown elsewhere ride along as hidden inputs.
export function SettingsForm({ initial, section }: { initial: ProfileFields; section: "style" | "comfort" }) {
  const [state, formAction, pending] = useActionState<SaveState, FormData>(updateSettings, {
    status: "idle",
  });
  const [fields, setFields] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [submitted, setSubmitted] = useState(initial);
  const [handledState, setHandledState] = useState(state);

  if (state !== handledState) {
    setHandledState(state);
    if (state.status === "saved") setSaved(submitted);
  }

  const dirty = !sameFields(fields, saved);

  return (
    <form
      // A form `action` auto-resets after submit, reverting controlled radios in the DOM to their initial value.
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        setSubmitted(fields);
        startTransition(() => formAction(formData));
      }}
      className="flex flex-col gap-10"
    >
      {section === "style" ? (
        <>
          <SettingsRow title="Vibes" description="Pick every vibe that feels like you.">
            <VibePicker value={fields.vibes} onChange={(vibes) => setFields({ ...fields, vibes })} />
          </SettingsRow>
          <SettingsRow title="Fit" description="How you like clothes to sit. Optional.">
            <FitPicker value={fields.fit_pref} onChange={(fit_pref) => setFields({ ...fields, fit_pref })} />
          </SettingsRow>
          <input type="hidden" name="temp_sensitivity" value={fields.temp_sensitivity} />
          <input type="hidden" name="day_start" value={fields.day_start} />
          <input type="hidden" name="day_end" value={fields.day_end} />
        </>
      ) : (
        <>
          <SettingsRow title="Temperature" description={`We'll shift what "cold" means for you.`}>
            <TempPicker
              value={fields.temp_sensitivity}
              onChange={(temp_sensitivity) => setFields({ ...fields, temp_sensitivity })}
            />
          </SettingsRow>
          <SettingsRow title="Day window" description="When you're usually out. Outfits cover the weather in between.">
            <DayWindowFields
              start={fields.day_start}
              end={fields.day_end}
              onChange={(window) => setFields({ ...fields, ...window })}
            />
          </SettingsRow>
          {fields.vibes.map((vibe) => (
            <input key={vibe} type="hidden" name="vibes" value={vibe} />
          ))}
          <input type="hidden" name="fit_pref" value={fields.fit_pref ?? ""} />
        </>
      )}

      <div className="sticky bottom-0 z-30 flex items-center gap-3 border-t border-border/60 bg-background/95 py-3 backdrop-blur">
        <p
          role="status"
          className={state.status === "error" && dirty ? "text-sm text-destructive" : "text-sm text-muted-foreground"}
        >
          {dirty
            ? state.status === "error"
              ? state.message
              : fields.vibes.length === 0
                ? "Pick at least one vibe."
                : "Unsaved changes"
            : state.status === "saved" && "All changes saved"}
        </p>
        <div className="ml-auto flex gap-2">
          <Button type="button" variant="secondary" disabled={!dirty || pending} onClick={() => setFields(saved)}>
            Reset
          </Button>
          <Button type="submit" disabled={!dirty || pending || fields.vibes.length === 0}>
            {pending ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </form>
  );
}
