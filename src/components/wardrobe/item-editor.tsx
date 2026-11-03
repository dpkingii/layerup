"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ItemSlot, ItemTags } from "@/lib/schemas";
import { tagsFromRow, type ItemRow, type WardrobeItem } from "@/lib/wardrobe/items";
import { cn } from "@/lib/utils";
import { deleteItem, updateItemTags } from "@/app/wardrobe/actions";
import { SLOT_LABELS } from "./slots";

const BLANK: ItemTags = {
  category: "",
  subtype: "",
  slot: "base",
  colors: [""],
  pattern: "solid",
  warmth: 3,
  waterproof: false,
  windproof: false,
  breathable: false,
};

const PROPS = ["waterproof", "windproof", "breathable"] as const;

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
  const [draft, setDraft] = useState<ItemTags>(() => tagsFromRow(item) ?? BLANK);
  const [error, setError] = useState<string>();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, startTransition] = useTransition();

  const set = <K extends keyof ItemTags>(key: K, value: ItemTags[K]) => setDraft((d) => ({ ...d, [key]: value }));

  function save() {
    const parsed = ItemTags.safeParse({
      ...draft,
      category: draft.category.trim(),
      subtype: draft.subtype.trim(),
      pattern: draft.pattern.trim(),
      colors: draft.colors.map((c) => c.trim()).filter(Boolean),
    });
    if (!parsed.success) {
      setError("Fill in category, subtype and at least one color.");
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
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl">
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
            <Field label="Category" id="category">
              <Input id="category" value={draft.category} onChange={(e) => set("category", e.target.value)} />
            </Field>
            <Field label="Subtype" id="subtype">
              <Input id="subtype" value={draft.subtype} onChange={(e) => set("subtype", e.target.value)} />
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
            <Field label="Pattern" id="pattern">
              <Input id="pattern" value={draft.pattern} onChange={(e) => set("pattern", e.target.value)} />
            </Field>
            <Field label="Primary color" id="color-0">
              <Input
                id="color-0"
                value={draft.colors[0] ?? ""}
                onChange={(e) => set("colors", [e.target.value, draft.colors[1] ?? ""])}
              />
            </Field>
            <Field label="Secondary color" id="color-1">
              <Input
                id="color-1"
                placeholder="Optional"
                value={draft.colors[1] ?? ""}
                onChange={(e) => set("colors", [draft.colors[0] ?? "", e.target.value])}
              />
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
