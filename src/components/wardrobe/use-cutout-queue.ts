"use client";

import { useEffect, useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { saveCutout } from "@/app/wardrobe/actions";
import type { Database } from "@/lib/database.types";
import { makeCutout } from "@/lib/wardrobe/cutout";
import { BUCKET, cutoutPath, type ItemRow, type WardrobeItem } from "@/lib/wardrobe/items";

// Makes a cutout for every photo item that lacks one, one at a time (the model is heavy).
// Covers fresh uploads and older photos alike; a failure is skipped until the next page load.
export function useCutoutQueue(
  items: WardrobeItem[],
  userId: string,
  supabase: SupabaseClient<Database>,
  onRow: (row: ItemRow) => void,
) {
  const running = useRef(false);
  const failed = useRef(new Set<string>());
  const [settled, setSettled] = useState(0);
  const onRowRef = useRef(onRow);
  useEffect(() => {
    onRowRef.current = onRow;
  }, [onRow]);

  useEffect(() => {
    if (running.current) return;
    const next = items.find((i) => i.photoUrl && !i.cutout_path && !failed.current.has(i.id));
    if (!next?.photoUrl) return;

    running.current = true;
    const photoUrl = next.photoUrl;
    (async () => {
      const photo = await fetch(photoUrl).then((r) => r.blob());
      const cutout = await makeCutout(photo);
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(cutoutPath(userId, next.id), cutout, { contentType: "image/png", upsert: true });
      if (error) throw error;
      return saveCutout(next.id);
    })()
      .then((row) => onRowRef.current(row))
      .catch((err) => {
        console.error(`Cutout for item ${next.id} failed`, err);
        failed.current.add(next.id);
      })
      .finally(() => {
        running.current = false;
        setSettled((n) => n + 1);
      });
  }, [items, settled, supabase, userId]);
}
