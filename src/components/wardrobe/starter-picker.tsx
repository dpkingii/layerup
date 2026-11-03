"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { ItemRow } from "@/lib/wardrobe/items";
import { STARTER_ITEMS } from "@/lib/wardrobe/starter-items";
import { cn } from "@/lib/utils";
import { addStarterItems } from "@/app/wardrobe/actions";
import { ColorSwatch, SLOT_ICONS } from "./slots";

export function StarterPicker({ onClose, onAdded }: { onClose: () => void; onAdded: (rows: ItemRow[]) => void }) {
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function toggle(key: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (!next.delete(key)) next.add(key);
      return next;
    });
  }

  function add() {
    startTransition(async () => {
      try {
        onAdded(await addStarterItems([...picked]));
      } catch {
        setError("Couldn't add items. Try again.");
      }
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add starter items</DialogTitle>
          <DialogDescription>Basics you own but haven&apos;t photographed. You can edit their tags later.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {STARTER_ITEMS.map((s) => {
            const Icon = SLOT_ICONS[s.tags.slot];
            const on = picked.has(s.key);
            return (
              <button
                key={s.key}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(s.key)}
                className={cn(
                  "flex items-center gap-2 rounded-lg border p-2 text-left text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  on ? "border-primary bg-primary/5" : "hover:bg-muted",
                )}
              >
                <Icon className="size-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate">{s.name}</span>
                <ColorSwatch color={s.tags.colors[0]} className="size-3.5" />
                <Check className={cn("size-4 shrink-0", !on && "invisible")} />
              </button>
            );
          })}
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <DialogFooter>
          <Button disabled={!picked.size || pending} onClick={add}>
            {pending ? "Adding…" : picked.size ? `Add ${picked.size} item${picked.size === 1 ? "" : "s"}` : "Add items"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
