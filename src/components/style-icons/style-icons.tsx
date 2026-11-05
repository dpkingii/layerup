"use client";

import { useState, useTransition } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { StyleIcon } from "@/lib/style-icons";
import {
  addStyleIcon,
  deleteStyleIcon,
  describeStyleIcon,
  saveStyleIconPlaceholder,
  updateStyleIcon,
  type IconResult,
} from "@/lib/style-icons/actions";

const MAX = 3;
const UNREACHABLE: IconResult = { ok: false, reason: "error", error: "Couldn't reach Layerup. Try again." };

const textareaClass =
  "min-h-20 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

// Also rendered inside the onboarding <form>: buttons are type="button", Enter is handled here,
// and inputs have no `name`, so nothing leaks into that form's submit.
export function StyleIcons({ initial }: { initial: StyleIcon[] }) {
  const [icons, setIcons] = useState(initial);
  const replace = (icon: StyleIcon) => setIcons((prev) => prev.map((i) => (i.id === icon.id ? icon : i)));

  return (
    <div className="flex flex-col gap-4">
      {icons.map((icon) => (
        <IconCard
          key={icon.id}
          icon={icon}
          onChange={replace}
          onDelete={() => setIcons((prev) => prev.filter((i) => i.id !== icon.id))}
        />
      ))}
      {icons.length < MAX ? (
        <AddIcon onAdded={(icon) => setIcons((prev) => [...prev, icon])} />
      ) : (
        <p className="text-sm text-muted-foreground">You&apos;ve saved {MAX} style icons. Remove one to add another.</p>
      )}
    </div>
  );
}

function AddIcon({ onAdded }: { onAdded: (icon: StyleIcon) => void }) {
  const [name, setName] = useState("");
  const [unknownName, setUnknownName] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function handle(result: IconResult, forName: string) {
    if (result.ok) {
      onAdded(result.icon);
      setName("");
      setUnknownName(null);
      setDescription("");
      setError(null);
    } else if (result.reason === "unknown") {
      setUnknownName(forName);
      setError(null);
    } else {
      setError(result.error);
    }
  }

  function add() {
    const value = name.trim();
    if (!value || pending) return;
    start(async () => handle(await addStyleIcon(value).catch(() => UNREACHABLE), value));
  }

  if (unknownName) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm">
          I don&apos;t know {unknownName}&apos;s style well. Describe it in a few words and I&apos;ll build their profile from that.
        </p>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
          placeholder="e.g. baggy vintage denim, boxy tees, chunky sneakers, earth tones"
          aria-label={`Describe ${unknownName}'s style`}
          className={textareaClass}
        />
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={pending || description.trim().length < 3}
            onClick={() =>
              start(async () =>
                handle(await describeStyleIcon({ name: unknownName, description }).catch(() => UNREACHABLE), unknownName),
              )
            }
          >
            {pending && <Loader2 className="animate-spin" />}
            Save profile
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() =>
              start(async () => handle(await saveStyleIconPlaceholder(unknownName).catch(() => UNREACHABLE), unknownName))
            }
          >
            Save name for later
          </Button>
          <Button type="button" variant="ghost" disabled={pending} onClick={() => setUnknownName(null)}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          maxLength={80}
          placeholder="e.g. Tom Holland"
          aria-label="Style icon name"
          disabled={pending}
        />
        <Button type="button" variant="outline" onClick={add} disabled={pending || !name.trim()}>
          {pending ? <Loader2 className="animate-spin" /> : <Plus />}
          {pending ? "Reading their style…" : "Add"}
        </Button>
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

function IconCard({
  icon,
  onChange,
  onDelete,
}: {
  icon: StyleIcon;
  onChange: (icon: StyleIcon) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const placeholder = icon.status === "placeholder";

  function remove() {
    start(async () => {
      const result = await deleteStyleIcon(icon.id).catch(() => ({ ok: false }));
      if (result.ok) onDelete();
      else setError("Couldn't remove that. Try again.");
    });
  }

  function save(run: () => Promise<IconResult>) {
    start(async () => {
      const result = await run().catch(() => UNREACHABLE);
      if (result.ok) {
        onChange(result.icon);
        setEditing(false);
        setError(null);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-3 border-b border-border/60 pb-4 text-sm">
      <div className="flex items-start gap-2">
        <div className="flex flex-1 flex-col gap-0.5">
          <p className="font-medium">{icon.name}</p>
          {placeholder ? (
            <p className="text-muted-foreground">No profile yet, so it isn&apos;t used in outfits.</p>
          ) : (
            !editing && <p className="text-muted-foreground">{icon.summary}</p>
          )}
        </div>
        {!placeholder && !editing && (
          <Button type="button" variant="ghost" size="icon-sm" aria-label={`Edit ${icon.name}`} onClick={() => setEditing(true)}>
            <Pencil />
          </Button>
        )}
        <Button type="button" variant="ghost" size="icon-sm" aria-label={`Remove ${icon.name}`} onClick={remove} disabled={pending}>
          <Trash2 />
        </Button>
      </div>

      {placeholder ? (
        <DescribeForm
          name={icon.name}
          pending={pending}
          onSubmit={(description) => save(() => describeStyleIcon({ id: icon.id, name: icon.name, description }))}
        />
      ) : editing ? (
        <EditForm
          icon={icon}
          pending={pending}
          onCancel={() => setEditing(false)}
          onSubmit={(fields) => save(() => updateStyleIcon(icon.id, fields))}
        />
      ) : (
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
          <dt className="text-muted-foreground">Pieces</dt>
          <dd>{icon.signature_pieces.join(", ")}</dd>
          <dt className="text-muted-foreground">Palette</dt>
          <dd>{icon.palette.join(", ")}</dd>
          <dt className="text-muted-foreground">Fit</dt>
          <dd>{icon.silhouette}</dd>
          <dt className="text-muted-foreground">Layering</dt>
          <dd>{icon.layering}</dd>
        </dl>
      )}
      {error && <p role="alert" className="text-destructive">{error}</p>}
    </div>
  );
}

function DescribeForm({ name, pending, onSubmit }: { name: string; pending: boolean; onSubmit: (description: string) => void }) {
  const [description, setDescription] = useState("");
  return (
    <div className="flex flex-col gap-2">
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        maxLength={500}
        placeholder="Describe their style in a few words"
        aria-label={`Describe ${name}'s style`}
        className={textareaClass}
      />
      <Button type="button" className="self-start" disabled={pending || description.trim().length < 3} onClick={() => onSubmit(description)}>
        {pending && <Loader2 className="animate-spin" />}
        Build profile
      </Button>
    </div>
  );
}

const splitList = (value: string) =>
  value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

function EditForm({
  icon,
  pending,
  onCancel,
  onSubmit,
}: {
  icon: StyleIcon;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (fields: Parameters<typeof updateStyleIcon>[1]) => void;
}) {
  const [summary, setSummary] = useState(icon.summary ?? "");
  const [pieces, setPieces] = useState(icon.signature_pieces.join(", "));
  const [palette, setPalette] = useState(icon.palette.join(", "));
  const [silhouette, setSilhouette] = useState(icon.silhouette ?? "");
  const [layering, setLayering] = useState(icon.layering ?? "");

  const fields: [string, string, (v: string) => void][] = [
    ["Summary", summary, setSummary],
    ["Signature pieces (comma-separated)", pieces, setPieces],
    ["Palette (comma-separated)", palette, setPalette],
    ["Fit", silhouette, setSilhouette],
    ["Layering", layering, setLayering],
  ];

  return (
    <div className="flex flex-col gap-3">
      {fields.map(([label, value, set]) => (
        <Label key={label} className="flex-col items-stretch gap-1.5">
          {label}
          <Input
            value={value}
            onChange={(e) => set(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
            className="font-normal"
          />
        </Label>
      ))}
      <div className="flex gap-2">
        <Button
          type="button"
          disabled={pending}
          onClick={() =>
            onSubmit({ summary, signature_pieces: splitList(pieces), palette: splitList(palette), silhouette, layering })
          }
        >
          {pending ? "Saving…" : "Save"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
