# Layerup — MVP Spec

Name: **Layerup**. Project folder: `~/Documents/Code/repos/layerup`. Greenfield web app. Status: spec from interview, 2026-10-27.

## 1. Product

Web app that answers "what do I wear today?" from the user's own wardrobe, the day's weather, and their style preferences.

**Primary moment (MVP focus):** morning "what do I wear". One great suggestion fast, shuffle if it's wrong.

**Done bar:** (a) the author uses it daily for a week with ~15 uploaded items; then (b) deployed, polished happy path, README, demo video, usable by invited friends.

## 2. MVP Scope

### In
1. Invite-only accounts (email magic link, allowlist).
2. Onboarding: style vibe picker, temperature sensitivity, optional fit/silhouette preference.
3. Wardrobe: bulk photo upload, background AI tagging, review grid, edit tags, delete item, photo-less generic starter items.
4. Today screen (prompt-first): pick context of the day, weather strip, generated outfit, shuffle with feedback.
5. Location: browser geolocation, manual city entry, manual weather chips as last resort.

### Out (see Backlog, section 11)
Inspiration/celebrity style, saved outfit references, gap suggestions, trip planning, shopping, embeddings, background removal, preference-profile derivation, item-integrity check, laundry/favorite flags, PWA/push.

## 3. Users and Access

- Required account from the start. No anonymous mode.
- **Invite-only:** email allowlist checked at signup/sign-in; non-allowlisted emails get a "invite only" message and no account.
- **Auth:** Supabase email magic link. No passwords, no OAuth in MVP.
- **Token-abuse protection:** allowlist + provider-side spend control (Gemini: stay on the free tier's rate limits, or set a budget alert in Google Cloud billing once on the paid tier). LLM and weather keys are server-side env vars only (`.env.local` gitignored, Vercel env settings). No per-user caps in MVP. Publishing the repo on GitHub is safe as long as no key is committed.

## 4. Onboarding (interactive prompts)

Asked once, editable later in settings:
- **Style vibe picker:** visual choices (e.g. minimal, streetwear, classic, sporty, ...). Multi-select.
- **Temperature sensitivity:** runs cold / neutral / runs hot. Used to shift "feels like" in the outfit prompt.
- **Fit/silhouette (optional):** relaxed / fitted / oversized. No gender field.

Asked per day, not at onboarding: **context of the day** (section 7).

## 5. Wardrobe

### 5.1 Item data model
- `id`, `user_id`, `photo_path` (nullable for generic items), `is_generic`, `created_at`
- `category` + `subtype` (e.g. outerwear / rain jacket)
- `colors` (primary, optional secondary) + `pattern` (solid, striped, ...)
- `warmth` (1–5)
- `layer_role`: `base` | `mid` | `outer` (shoes/accessories use a non-layer role, see 6.1)
- `weather_props`: `waterproof`, `windproof`, `breathable` (booleans)
- `tag_status`: `pending` | `tagged` | `confirmed`

### 5.2 Upload and tagging
- Bulk multi-photo upload (drop ~20 at once).
- Upload returns immediately; items show "tagging…" while a vision LLM extracts tags in the background.
- **Review grid:** user confirms or edits tags per item (inline edit of every tag field). `confirmed` is set on user action.
- Photos stored as-is (resize + thumbnail only). No background removal in MVP.
- Delete item removes the row and the stored image.

### 5.3 Generic starter items
- Photo-less items chosen from a list (e.g. "white tee", "jeans", "sneakers") with preset tags.
- Rendered as a placeholder tile (category icon + color swatch).
- Treated identically to photographed items in outfit generation.

### 5.4 Cold start
No hard closet-size gate. Starter items let users get a suggestion on day one.

## 6. Outfit Model and Generation

### 6.1 Layer-based stack
An outfit is a stack: base layer, optional mid layer, optional outer layer, plus bottom, shoes, optional accessory. Layer warmth values are summed against the weather window. Dresses/jumpsuits may fill base+bottom.

### 6.2 Generation logic
- **LLM does everything.** Inputs sent as **text/structured data**: item list (id + tags), weather window summary, temperature sensitivity, vibes, fit pref, context of the day, recent shuffle feedback. Item photos are not sent at generation time (assumption — confirm during build).
- Output: structured object (Zod schema) listing item ids per slot, plus a short rationale (e.g. "4–15°C with rain at 3pm, so waterproof outer").
- **No validation in MVP** (explicit decision). Known risk: hallucinated item ids or weather-inappropriate picks. Item-integrity check is first in backlog.
- **Provider-agnostic:** use the Vercel AI SDK so tagging and generation can swap providers. Use a cheaper vision model for tagging and a stronger model for outfits (configurable by env).
- **Default provider: Google Gemini** (`@ai-sdk/google`, one `GOOGLE_GENERATIVE_AI_API_KEY` from Google AI Studio). `gemini-flash-lite-latest` for tagging, `gemini-flash-latest` for outfit generation; override with `TAGGING_MODEL` / `OUTFIT_MODEL`. The `-latest` aliases move to newer models over time; pin a specific version if outputs drift.
- Gemini's free tier fits the MVP. On the free (unpaid) tier Google may use submitted content, including clothing photos, to improve its products; enable billing (paid tier) before inviting people beyond close friends. Set a budget alert in Google Cloud billing as the spend backstop.

## 7. Today Screen (prompt-first)

Flow on open:
1. Weather strip loads (location + forecast).
2. User picks **context of the day**: Work/office, Casual/errands, Gym/active, Going out/event.
3. App generates the outfit.
4. Outfit shown as a **collage grid**: uniform square tiles per item with layer labels, plus the AI rationale. Photos are as-is, so uniform tiles (object-fit) with a neutral background.
5. Actions: **Shuffle**, **Wear this**.

### 7.1 Shuffle with feedback
- Shuffle opens preset feedback chips: too warm, too cold, too formal, too casual, dislike a piece (pick which), other (no free text).
- Feedback from this session is passed into the next generation prompt.
- **Soft cap ~5 shuffles per session:** after that, suggest changing the context or adding items. Does not hard-block.
- Per-slot swap is not in MVP.

### 7.2 Wear this
Logs the worn outfit (date, item ids, context, weather summary). History is stored for later features; in MVP it is not used to derive a preference profile.

## 8. Weather and Location

### 8.1 Day-span forecast
- User-set time window (default 8am–8pm, editable). Uses hourly forecast over the window: min/max feels-like, rain chance, wind. The outfit must handle the swing (layers).

### 8.2 Provider
- **Open-Meteo** (no API key). Forecast endpoint with hourly `apparent_temperature`, `precipitation_probability`, `wind_speed_10m`, `weather_code`, plus `temperature_unit=fahrenheit`, `wind_speed_unit=mph`, `timezone=auto`.
- City search via the Open-Meteo geocoding API (no key).
- Weather codes are numeric WMO codes; map them to labels in a small lookup table.
- Cache per location (rounded lat/lon) for ~1 hour.
- Keep the call behind a small weather adapter so the provider can be swapped later.
- License: the free tier is non-commercial. Fine for MVP, personal use and portfolio; switch to Open-Meteo's paid API plan (same API + key) if Layerup is ever commercialized.
- Considered and dropped: Tomorrow.io (25 req/hr free limit; hourly access on free tier unconfirmed) and WeatherAPI.com (needs a key; Open-Meteo is simpler).

Units: °F (and mph) by default; a °C toggle is backlog.

### 8.3 Location
- Browser geolocation on load; if it fails or is denied, the user can type a city or easily override at any time.
- Failure states: user can type a location, or use manual weather chips (cold/mild/hot, rain yes/no). No outfit is generated with no weather input at all.

## 9. Tech Stack

- **Next.js (App Router) + TypeScript**
- **Supabase:** Auth (magic link), Postgres, private Storage bucket, Row Level Security so users only access their own rows/images
- **Vercel AI SDK + Zod** for provider-agnostic structured LLM output
- **Tailwind + shadcn/ui**
- Deploy on Vercel
- Desktop-first layout; usable on mobile, not optimized (no mobile-specific design, camera upload via file input works)

## 10. Privacy and Cost

- Clothing photos are stored in a private bucket with per-user paths and served via signed URLs.
- MVP is minimal: no in-app disclosure copy and no delete-my-data flow (account/data deletion is a later addition). Note: photos are sent to a third-party LLM provider for tagging; tell invited users out-of-band.
- Cost control relies on the allowlist and provider-side spend limit (section 3).

## 11. Backlog (ordered roughly by value)

1. **Item-integrity check** (ids exist, schema valid, retry once) and optional hard weather guardrails
2. **Background removal**, via in-browser `@imgly/background-removal` (free; AGPL license, review LICENSE before relying on it). Refloow Photo Studio was evaluated and rejected: it is a desktop app with no API/library, so it can't run in the pipeline
3. **Saved outfit references** (upload/like an outfit photo)
4. **Inspiration / celebrity style:** user names an influencer or celebrity or uploads outfits; AI researches or analyses and builds a similar look from owned items when weather allows
5. **Gap suggestions:** when a reference outfit has pieces the user doesn't own, suggest the missing piece (no shopping links)
6. **Closest-match vs generic fallback toggle** for inspiration matching
7. **Embeddings** for style similarity (add alongside tags)
8. **Derived preference profile** from feedback history
9. **Laundry / unavailable and favorite / never-suggest flags**
10. **Wardrobe-building and shopping** (gaps + purchasable suggestions)
11. **Trip / event planning** with multi-day forecast
12. **PWA / push** morning notification
13. **Delete-my-data flow and in-app privacy disclosure**
14. **Per-user daily caps** (before opening beyond invites)
15. **Per-slot swap** in shuffle

## 12. Open Questions / Assumptions to Confirm

- Whether item photos should be sent to the LLM at generation time (spec assumes tags only).
- Formality is not a tag field; the LLM infers it from category/subtype. Add a `formality` tag if "Going out / event" results are weak.
- Open-Meteo attribution: the free tier asks for credit (CC BY 4.0); add a small "Weather data by Open-Meteo.com" link in the weather strip.
