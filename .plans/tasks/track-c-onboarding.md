# Track C: Onboarding & Settings

Read `.plans/tasks/README.md` first. Spec: section 4 of `.plans/layerup-spec.md`.

## Goal
New users answer a short set of style questions once; everyone can change them later.

## Owned paths
- `src/app/onboarding/**`
- `src/app/settings/**`
- `src/components/onboarding/**`
- `src/lib/profile/**`

## Requirements
1. **Vibes catalog:** `src/lib/profile/vibes.ts` with ~8 vibes (id, label, one-line description, and a visual such as a color/emoji/simple illustration; no stock photos). Suggested: minimal, classic, streetwear, sporty, preppy, bohemian, edgy, smart-casual. Stored as ids in `profiles.vibes`.
2. **`/onboarding` flow**, one question per step, with back/next:
   1. Style vibes (multi-select, at least 1)
   2. Temperature sensitivity: runs cold / neutral / runs hot (explain briefly: "we'll shift what 'cold' means for you")
   3. Fit preference, optional: relaxed / fitted / oversized / skip
   4. Day window: when you're usually out (defaults 8:00–20:00)
   Finishing writes all fields plus `onboarded_at = now()` and redirects to `/`.
3. **`/settings`:** the same fields on one page, saved with a server action. A sign-out button lives here too (reuse `signOut` from `@/app/login/actions`).
4. **Public interface (integration depends on this exact name):**
   - `getOnboardedProfile(): Promise<Profile>` in `src/lib/profile/index.ts`. It reads the signed-in user's profile and calls `redirect("/onboarding")` if `onboarded_at` is null. `Profile` is `Tables<"profiles">`.
5. If an already-onboarded user visits `/onboarding`, redirect them to `/settings`.

## Done when
- A fresh user (reset `onboarded_at` to null in the Supabase dashboard) goes through onboarding, the values persist, and settings edits persist.
- `getOnboardedProfile()` redirects correctly (demo it on `/settings` or a temporary page).
