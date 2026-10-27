# Track A: Wardrobe

Read `.plans/tasks/README.md` first. Spec: section 5 of `.plans/layerup-spec.md`.

## Goal
A user can get their closet into Layerup: bulk-upload photos, have AI tag them in the background, review and edit the tags in a grid, delete items, and add photo-less starter items.

## Owned paths
- `src/app/wardrobe/**` (page, server actions, route handlers)
- `src/components/wardrobe/**`
- `src/lib/wardrobe/**`

## Requirements
1. **Upload**
   - Multi-file picker + drag-and-drop on `/wardrobe`. ~20 files at once must work.
   - Client-side: convert HEIC to JPEG, downscale to max ~1600px long edge, JPEG ~0.85. The `wardrobe` bucket only accepts JPEG/PNG/WebP up to 10 MB.
   - For each file: insert an `items` row (`tag_status = 'pending'`), upload to bucket `wardrobe` at `<user_id>/<item_id>.jpg`, set `photo_path`.
   - HEIC conversion needs a library: you may add **one** dependency for it (e.g. `heic2any`); say which in your report.
2. **Background tagging**
   - Upload returns immediately. Tagging runs server-side (e.g. Next `after()` or a route handler the client fires per item). Check the Next 16 docs for `after`.
   - Send the image to `taggingModel` and get `ItemTags` (from `@/lib/schemas`). Write the tags and set `tag_status = 'tagged'`. On error, set `'failed'`.
   - Limit concurrency to ~4 tagging calls at a time.
3. **Review grid**
   - Grid of uniform square tiles (object-fit cover, neutral background). Show "Tagging…" for pending, a retry button for failed.
   - Click a tile to edit every `ItemTags` field inline (category, subtype, slot, colors, pattern, warmth 1–5, waterproof/windproof/breathable). Saving sets `tag_status = 'confirmed'`.
   - The grid updates as tagging finishes (polling every few seconds while any item is pending is fine; no realtime needed).
   - Images are private: use signed URLs.
4. **Delete:** remove the storage object and the row.
5. **Starter items**
   - Catalog in `src/lib/wardrobe/starter-items.ts`: ~20 generic items with preset `ItemTags` (white tee, jeans, chinos, hoodie, rain jacket, puffer, sneakers, boots, ...), covering every slot and warmth range.
   - Pick from the catalog → insert with `is_generic = true`, `photo_path = null`, `tag_status = 'confirmed'`.
   - Render as a placeholder tile (category icon + color swatch).
6. **Nav:** add nothing to the global layout. `/wardrobe` must be reachable by URL; integration adds nav.

## Done when
- 10+ real photos upload in one go, all reach `tagged` (or `failed` with a working retry), tags are editable and persist, delete works, starter items appear in the grid.
- Report a sample of AI tag quality (2–3 items: photo vs tags).
