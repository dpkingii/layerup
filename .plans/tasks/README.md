# Parallel tracks

Four independent tracks, each run by its own agent in its own Superset worktree. Full product spec: `.plans/layerup-spec.md`.

| Track | Brief | Depends on other tracks? |
|---|---|---|
| A. Wardrobe | `track-a-wardrobe.md` | No |
| B. Weather | `track-b-weather.md` | No |
| C. Onboarding | `track-c-onboarding.md` | No |
| D. Today | `track-d-today.md` | Uses test data for A and B until they merge |

After all four merge, one **integration** pass on `main` wires B's weather into D's Today screen and C's onboarding redirect (see "Integration" at the bottom).

## Rules for every track

1. **Stay inside your owned paths** (listed in your brief). If you think you need to edit a file outside them, stop and ask instead.
2. **Frozen on `main`; do not edit in a worktree:**
   - `src/lib/schemas.ts` (shared Zod contracts)
   - `src/lib/database.types.ts`, `supabase/migrations/**` (no schema changes; ask if a column is missing)
   - `src/lib/supabase/**`, `src/lib/ai.ts`, `src/proxy.ts`, `src/app/layout.tsx`, `src/app/login/**`, `src/app/auth/**`
   - `package.json` / `package-lock.json`: don't add dependencies without asking (lockfile conflicts across worktrees). Exception noted in Track A.
3. **Next.js 16 is not the Next.js you know.** Read `AGENTS.md` and the relevant guide in `node_modules/next/dist/docs/` before writing code. `cacheComponents` is on:
   - Anything reading cookies/headers/Supabase must sit inside `<Suspense>`.
   - `createClient()` from `@/lib/supabase/server` already calls `connection()`.
   - Caching uses `"use cache"` + `cacheLife`, not `fetch(..., { next: { revalidate } })`.
4. **AI calls:** import `taggingModel` / `outfitModel` from `@/lib/ai` and use `generateText({ model, output: Output.object({ schema }) })` (AI SDK v7; docs in `node_modules/ai/docs/`). Never import a provider directly.
5. **Supabase:** RLS scopes every query to the signed-in user; never use a service-role key. Server Components / Server Actions use `@/lib/supabase/server`, client components use `@/lib/supabase/client`.
6. **UI:** shadcn/ui (`npx shadcn@latest add <component>` is allowed; it writes to `src/components/ui/`). After adding, check the import is `@/lib/utils`, not `"cn"` (generator bug seen once). Desktop-first; must not break on a phone.
7. **Style:** match existing code. No comments unless explaining a non-obvious why. No speculative abstractions.
8. **Done means:** `npx tsc --noEmit`, `npm run lint`, and `npm run build` all pass, and you've exercised the feature in the browser on your workspace's port (`./.superset/run.sh`). Report what you tested and what you couldn't.
9. **Don't commit or push unless the user asks.**

## Integration (after all tracks merge, on `main`)

- Replace D's weather fixture with B's `WeatherSection` + `getWeatherWindow`.
- Call C's `getOnboardedProfile()` in the Today page and pass the real profile into generation.
- Remove fixtures, run the full morning flow end to end.
