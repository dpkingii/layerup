"use client";

import type { Enums } from "@/lib/database.types";
import { VIBES } from "@/lib/profile/vibes";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type ProfileFields = {
  vibes: string[];
  temp_sensitivity: Enums<"temp_sensitivity">;
  fit_pref: Enums<"fit_pref"> | null;
  day_start: string;
  day_end: string;
};

const TEMP_OPTIONS: { value: Enums<"temp_sensitivity">; label: string; description: string }[] = [
  { value: "runs_cold", label: "I run cold", description: "Reach for a layer sooner than most." },
  { value: "neutral", label: "Neutral", description: "The forecast feels about right to me." },
  { value: "runs_hot", label: "I run hot", description: "I'm in a T-shirt when others want a jacket." },
];

const FIT_OPTIONS: { value: Enums<"fit_pref"> | ""; label: string; description: string }[] = [
  { value: "relaxed", label: "Relaxed", description: "Easy, a little room to move." },
  { value: "fitted", label: "Fitted", description: "Close to the body, tailored." },
  { value: "oversized", label: "Oversized", description: "Big, boxy, intentionally roomy." },
  { value: "", label: "No preference", description: "Mix it up." },
];

const optionClass = "flex cursor-pointer items-start gap-3 py-1 text-sm";
const inputClass = "mt-0.5 size-4 shrink-0 cursor-pointer accent-primary";

function OptionText({ label, description, children }: { label: string; description: string; children?: React.ReactNode }) {
  return (
    <span className="flex flex-col gap-0.5">
      <span className="flex items-center gap-2 font-medium">
        {label}
        {children}
      </span>
      <span className="text-muted-foreground">{description}</span>
    </span>
  );
}

export function VibePicker({ value, onChange }: { value: string[]; onChange: (vibes: string[]) => void }) {
  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
      {VIBES.map((vibe) => (
        <label key={vibe.id} className={optionClass}>
          <input
            type="checkbox"
            name="vibes"
            value={vibe.id}
            checked={value.includes(vibe.id)}
            onChange={(e) =>
              onChange(e.target.checked ? [...value, vibe.id] : value.filter((id) => id !== vibe.id))
            }
            className={inputClass}
          />
          <OptionText label={vibe.label} description={vibe.description}>
            <span className="flex gap-1" aria-hidden>
              {vibe.palette.map((color) => (
                <span key={color} className="size-2.5 rounded-full ring-1 ring-foreground/10" style={{ background: color }} />
              ))}
            </span>
          </OptionText>
        </label>
      ))}
    </div>
  );
}

export function TempPicker({
  value,
  onChange,
}: {
  value: ProfileFields["temp_sensitivity"];
  onChange: (value: ProfileFields["temp_sensitivity"]) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {TEMP_OPTIONS.map((option) => (
        <label key={option.value} className={optionClass}>
          <input
            type="radio"
            name="temp_sensitivity"
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className={inputClass}
          />
          <OptionText label={option.label} description={option.description} />
        </label>
      ))}
    </div>
  );
}

export function FitPicker({
  value,
  onChange,
}: {
  value: ProfileFields["fit_pref"];
  onChange: (value: ProfileFields["fit_pref"]) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {FIT_OPTIONS.map((option) => (
        <label key={option.value} className={optionClass}>
          <input
            type="radio"
            name="fit_pref"
            value={option.value}
            checked={(value ?? "") === option.value}
            onChange={() => onChange(option.value || null)}
            className={inputClass}
          />
          <OptionText label={option.label} description={option.description} />
        </label>
      ))}
    </div>
  );
}

export function DayWindowFields({
  start,
  end,
  onChange,
}: {
  start: string;
  end: string;
  onChange: (window: { day_start: string; day_end: string }) => void;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <div className="flex flex-1 flex-col gap-2">
        <Label htmlFor="day_start">Head out around</Label>
        <Input
          id="day_start"
          name="day_start"
          type="time"
          value={start}
          onChange={(e) => onChange({ day_start: e.target.value, day_end: end })}
        />
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <Label htmlFor="day_end">Home by</Label>
        <Input
          id="day_end"
          name="day_end"
          type="time"
          value={end}
          onChange={(e) => onChange({ day_start: start, day_end: e.target.value })}
        />
      </div>
    </div>
  );
}
