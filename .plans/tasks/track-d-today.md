# Track D: Today Screen & Outfit Generation

Read `.plans/tasks/README.md` first. Spec: sections 6–7 of `.plans/layerup-spec.md`.

## Goal
The core morning loop: pick today's context → get an outfit from your closet for the day's weather → shuffle with feedback or "Wear this".

## Owned paths
- `src/app/page.tsx` (replace the placeholder; keep a sign-out reachable until settings lands, e.g. a small link)
- `src/app/today/**` (server actions, if you prefer them there)
- `src/components/today/**`
- `src/lib/outfit/**`

## Working without Tracks A, B and C
- **Weather:** use fixtures in `src/lib/outfit/fixtures.ts`: at least one `forecast` `WeatherWindow` (e.g. 41→63°F, 60% rain at 3pm) and one `manual` window. Add a dev-only switcher to flip between them. Integration replaces this with Track B's `WeatherSection`.
- **Profile:** read `profiles` directly; if vibes are empty, use a fixture profile (e.g. `["minimal"]`, neutral). Integration switches to Track C's `getOnboardedProfile()`.
- **Items:** read real `items` (tagged/confirmed only). If the closet has fewer than ~6 usable items, fall back to a fixture closet of generic items (in-memory, not inserted).

## Requirements
1. **Prompt-first flow:** on open, show the context picker first (Work / Casual / Active / Going out, i.e. `DayContext`). Nothing generates until one is picked.
2. **Generation:** server action `generateOutfit`
   - Send `outfitModel` the item list (id + tags only, no images), the `WeatherWindow`, the profile (vibes, temp sensitivity, fit), the context, and this session's previous outfits + feedback.
   - Use `Output.object({ schema: Outfit })` from `@/lib/schemas`.
   - Layer-based outfit: base + optional mid + optional outer + bottom (or one_piece) + shoes + optional accessory. Summed warmth should handle the window's low and high (layers you can take off).
   - Temperature sensitivity shifts how cold it "feels" (e.g. runs cold ≈ treat it as ~5°F colder).
   - **No validation of the output** (explicit product decision; an integrity check is backlog). Render whatever comes back, skipping ids not found in the closet.
   - Insert a `suggestions` row (session_id, context, weather, outfit, rationale).
3. **Outfit display:** collage grid of uniform square tiles (object-fit cover; generic items as a placeholder tile), each labeled with its slot, plus the rationale. Show a loading state during generation.
4. **Shuffle with feedback**
   - Shuffle opens preset chips: too warm, too cold, too formal, too casual, dislike a piece (then tap which tile). At least one chip is required.
   - Store the feedback on the *rejected* suggestion (`suggestions.feedback`, format per `ShuffleFeedback` comment in schemas). Generate the next one with that feedback in the prompt.
   - Soft cap: after 5 shuffles in a session, show a nudge ("Try a different context or add items to your closet") but still allow shuffling.
   - `session_id`: new uuid per context pick; persists across shuffles; resets when context changes.
5. **Wear this:** set `worn_at` on that suggestion, then show a confirmed state.
6. **Errors:** if generation fails, show a retry, not a blank screen.

## Done when
- With fixture weather and either real or fixture items, the full loop works: pick context → outfit → shuffle with feedback (the next outfit visibly reacts to the feedback) → wear.
- Rows in `suggestions` look right (check in the Supabase dashboard).
- Report 2–3 sample outfits + rationales for different weather fixtures.
