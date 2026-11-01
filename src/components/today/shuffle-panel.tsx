"use client";

import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { FEEDBACK_LABELS } from "@/lib/outfit/labels";
import type { FeedbackReason } from "@/lib/schemas";
import { cn } from "@/lib/utils";

type Reason = z.infer<typeof FeedbackReason>;

export function ShufflePanel({
  reasons,
  dislikedCount,
  onToggleReason,
  onCancel,
  onSubmit,
}: {
  reasons: Set<Reason>;
  dislikedCount: number;
  onToggleReason: (reason: Reason) => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  const needsPiece = reasons.has("dislike_piece") && dislikedCount === 0;
  const canSubmit = reasons.size > 0 && !needsPiece;

  return (
    <div className="flex flex-col gap-3 rounded-xl border p-4">
      <p className="text-sm font-medium">What should change?</p>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(FEEDBACK_LABELS) as Reason[]).map((reason) => {
          const active = reasons.has(reason);
          return (
            <button
              key={reason}
              type="button"
              aria-pressed={active}
              onClick={() => onToggleReason(reason)}
              className={cn(
                "rounded-full border px-3 py-1 text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                active ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
              )}
            >
              {FEEDBACK_LABELS[reason]}
            </button>
          );
        })}
      </div>
      {reasons.has("dislike_piece") && (
        <p className="text-sm text-muted-foreground">
          {dislikedCount === 0 ? "Tap the piece you don't like." : `${dislikedCount} piece${dislikedCount > 1 ? "s" : ""} selected.`}
        </p>
      )}
      <div className="flex gap-2">
        <Button onClick={onSubmit} disabled={!canSubmit}>
          Shuffle
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
