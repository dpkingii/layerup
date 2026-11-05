# Layerup

**Dressed for the day in one message.**

A stylist that knows your closet and today's forecast.

## The problem

Every morning starts the same way: check the weather, open the closet, and stare. The clothes are all there, but turning "52°F, rain by 3pm, office then dinner" into an outfit is a small puzzle you solve half-awake. So you reach for the same three things, get it wrong by noon, and the rest of your wardrobe sits unworn.

## What Layerup does

Layerup turns that puzzle into one message. Tell the stylist what your day looks like, and it dresses you **from the clothes you already own**, layered for the weather you'll actually walk through, from the cold morning to the warm afternoon and the rainy commute home.

- **Your clothes, not a catalog.** Every suggestion comes from your own wardrobe. Nothing to buy.
- **Weather you'll actually feel.** Outfits are built for the whole window you're out, and adjusted for whether you run hot or cold.
- **A stylist you can talk to.** Say "warmer", "dressier" or "more relaxed" and it refines the look instead of starting over.
- **You have the last word.** Swipe any piece on the mannequin to swap it, and the stylist keeps your choice.

## How it works

1. **Build your closet.** Snap your clothes. Layerup removes the background so each piece stands on its own, and picking a type (hoodie, chinos, boots) fills in warmth and weather details for you. AI tagging is one tap away if you want it.
2. **Set your style once.** Pick your vibes, how you run on temperature and how you like things to fit.
3. **Ask the stylist.** Type your plans or tap a starter like "Rainy errands". You get one outfit on a mannequin made from your own pieces, with a short note on why it works.
4. **Refine and wear.** Swipe, chat, then tap **Wear this** to lock it in.

## Status

An invite-only MVP built for daily personal use. Runs on free tiers: Gemini Flash Lite for the stylist, Open-Meteo for weather, Supabase for data and photos, and in-browser background removal.

## Run it locally

Create `.env.local` with:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
GOOGLE_GENERATIVE_AI_API_KEY=
```

Then:

```bash
npm install
npm run dev
```

Stack: Next.js 16, React 19, Tailwind v4, Supabase (auth, Postgres, storage), AI SDK with Gemini.
