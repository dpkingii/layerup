"use client";

import { useState, useTransition } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ItemSlot, ItemTags } from "@/lib/schemas";
import { tagsFromRow, type ItemRow, type WardrobeItem } from "@/lib/wardrobe/items";
import { findPreset, PRESETS } from "@/lib/wardrobe/presets";
import { cn } from "@/lib/utils";
import { deleteItem, suggestItemTags, updateItemTags } from "@/app/wardrobe/actions";
import { ColorSwatch, SLOT_LABELS } from "./slots";

const BLANK: ItemTags = {
  category: "",
  subtype: "",
  slot: "base",
  colors: [],
  pattern: "solid",
  warmth: 3,
  waterproof: false,
  windproof: false,
  breathable: false,
};

const PROPS = ["waterproof", "windproof", "breathable"] as const;
const COLORS = ["black", "white", "gray", "navy", "blue", "light blue", "beige", "brown", "green", "red", "pink", "yellow"];
const PATTERNS = ["solid", "striped", "plaid", "floral", "graphic", "polka dot"];

// Chips compare lowercase names; AI and older rows may capitalize colors.
function normalize(tags: ItemTags): ItemTags {
  return { ...tags, colors: tags.colors.map((c) => c.trim().toLowerCase()).filter(Boolean) };
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <Button type="button" size="sm" variant={active ? "default" : "outline"} aria-pressed={active} onClick={onClick}>
      {children}
    </Button>
  );
}

export function ItemEditor({
  item,
  onClose,
  onSaved,
  onDeleted,
}: {
  item: WardrobeItem;
  onClose: () => void;
  onSaved: (row: ItemRow) => void;
  onDeleted: (id: string) => void;
}) {
  const [draft, setDraft] = useState<ItemTags>(() => normalize(tagsFromRow(item) ?? BLANK));
  const [error, setError] = useState<string>();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, startTransition] = useTransition();

  const [aiState, setAiState] = useState<"idle" | "loading" | "filled">("idle");
  const [customColor, setCustomColor] = useState("");

  const set = <K extends keyof ItemTags>(key: K, value: ItemTags[K]) => setDraft((d) => ({ ...d, [key]: value }));

  // Picking a known type fills everything it implies; colors and pattern stay as they are.
  function setSubtype(value: string) {
    const preset = findPreset(value);
    setDraft((d) => (preset ? { ...d, ...preset } : { ...d, subtype: value }));
  }

  // Up to two colors, primary first; a third pick replaces the secondary.
  function toggleColor(color: string) {
    const c = color.trim().toLowerCase();
    if (!c) return;
    setDraft((d) => {
      if (d.colors.includes(c)) return { ...d, colors: d.colors.filter((x) => x !== c) };
      return { ...d, colors: d.colors.length < 2 ? [...d.colors, c] : [d.colors[0], c] };
    });
  }

  async function autoTag() {
    setAiState("loading");
    setError(undefined);
    try {
      const result = await suggestItemTags(item.id);
      if (result.status === "ok") {
        setDraft(normalize(result.tags));
        setAiState("filled");
        return;
      }
      setError(
        result.status === "rate_limited"
          ? "AI tagging limit reached. Wait a minute and try again, or tag by hand."
          : "AI couldn't tag this photo. Tag it by hand.",
      );
    } catch {
      setError("AI couldn't tag this photo. Tag it by hand.");
    }
    setAiState("idle");
  }

  function save() {
    const parsed = ItemTags.safeParse({
      ...draft,
      category: draft.category.trim(),
      subtype: draft.subtype.trim(),
      pattern: draft.pattern.trim(),
      colors: draft.colors.map((c) => c.trim()).filter(Boolean),
    });
    if (!parsed.success) {
      setError("Fill in the item type, category and at least one color.");
      return;
    }
    startTransition(async () => {
      try {
        onSaved(await updateItemTags(item.id, parsed.data));
      } catch {
        setError("Couldn't save. Try again.");
      }
    });
  }

  function remove() {
    startTransition(async () => {
      try {
        await deleteItem(item.id);
        onDeleted(item.id);
      } catch {
        setError("Couldn't delete. Try again.");
      }
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{item.is_generic ? "Starter item" : "Edit tags"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-5 sm:grid-cols-[220px_1fr]">
          {item.photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.photoUrl}
              alt=""
              className="aspect-square w-full max-w-[220px] justify-self-center rounded-lg bg-muted object-cover"
            />
          )}
          <form
            id="item-tags"
            className={cn("grid grid-cols-2 gap-3", !item.photoUrl && "sm:col-span-2")}
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
          >
            <div className="col-span-2 flex flex-col gap-2">
              <div className="flex items-end justify-between gap-2">
                <Label htmlFor="subtype">Item type</Label>
                {item.photo_path && (
                  <Button type="button" size="sm" variant="outline" disabled={aiState === "loading"} onClick={autoTag}>
                    {aiState === "loading" ? <Loader2 className="animate-spin" /> : <Sparkles />}
                    Auto-tag with AI
                  </Button>
                )}
              </div>
              <Input
                id="subtype"
                list="subtype-presets"
                placeholder="Start typing: jeans, rain jacket, hoodie…"
                autoFocus={!draft.subtype}
                value={draft.subtype}
                onChange={(e) => setSubtype(e.target.value)}
              />
              <datalist id="subtype-presets">
                {PRESETS.map((preset) => (
                  <option key={preset.subtype} value={preset.subtype} />
                ))}
              </datalist>
              {aiState === "filled" && (
                <p className="text-xs text-muted-foreground">AI filled these in. Check them, then confirm.</p>
              )}
            </div>
            <div className="col-span-2 flex flex-col gap-2">
              <Label>Colors</Label>
              <div className="flex flex-wrap gap-1.5">
                {[...new Set([...COLORS, ...draft.colors])].map((c) => (
                  <Chip key={c} active={draft.colors.includes(c)} onClick={() => toggleColor(c)}>
                    <ColorSwatch color={c} className="size-3" />
                    {c}
                    {draft.colors[0] === c && draft.colors.length > 1 && <span className="opacity-70">(main)</span>}
                  </Chip>
                ))}
              </div>
              <Input
                aria-label="Other color"
                placeholder="Other color, then Enter"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  e.preventDefault();
                  toggleColor(customColor);
                  setCustomColor("");
                }}
              />
            </div>
            <div className="col-span-2 flex flex-col gap-2">
              <Label htmlFor="pattern">Pattern</Label>
              <div className="flex flex-wrap gap-1.5">
                {PATTERNS.map((pt) => (
                  <Chip key={pt} active={draft.pattern === pt} onClick={() => set("pattern", pt)}>
                    {pt}
                  </Chip>
                ))}
              </div>
              <Input id="pattern" value={draft.pattern} onChange={(e) => set("pattern", e.target.value)} />
            </div>
            <Field label="Category" id="category">
              <Input id="category" value={draft.category} onChange={(e) => set("category", e.target.value)} />
            </Field>
            <Field label="Slot" id="slot">
              <Select
                items={SLOT_LABELS}
                value={draft.slot}
                onValueChange={(v) => v && set("slot", ItemSlot.parse(v))}
              >
                <SelectTrigger id="slot" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ItemSlot.options.map((s) => (
                    <SelectItem key={s} value={s}>
                      {SLOT_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="col-span-2 flex flex-col gap-2">
              <Label>Warmth</Label>
              <div className="flex gap-1.5" role="radiogroup" aria-label="Warmth">
                {[1, 2, 3, 4, 5].map((w) => (
                  <Button
                    key={w}
                    type="button"
                    role="radio"
                    aria-checked={draft.warmth === w}
                    variant={draft.warmth === w ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => set("warmth", w)}
                  >
                    {w}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">1 = very light, 5 = heavy winter</p>
            </div>
            <div className="col-span-2 flex flex-wrap gap-x-5 gap-y-2">
              {PROPS.map((p) => (
                <Label key={p} className="font-normal capitalize">
                  <Checkbox checked={draft[p]} onCheckedChange={(checked) => set(p, checked)} />
                  {p}
                </Label>
              ))}
            </div>
          </form>
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <DialogFooter className="sm:justify-between">
          <Button
            type="button"
            variant="destructive"
            disabled={pending}
            onClick={() => (confirmDelete ? remove() : setConfirmDelete(true))}
          >
            {confirmDelete ? "Confirm delete" : "Delete"}
          </Button>
          <Button type="submit" form="item-tags" disabled={pending}>
            {pending ? "Saving…" : item.tag_status === "confirmed" ? "Save" : "Confirm tags"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="col-span-2 flex flex-col gap-2 sm:col-span-1">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
