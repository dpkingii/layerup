import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PAGE_FRAME } from "@/components/page-frame";
import { cn } from "@/lib/utils";
import { DemoButton } from "./demo-button";

export const metadata: Metadata = {
  title: "Layerup: dressed for the day in one message",
  description: "A stylist that knows your closet and today's forecast.",
};

const BENEFITS = [
  { title: "Your clothes, not a catalog.", body: "Every suggestion comes from your own wardrobe. Nothing to buy." },
  {
    title: "Weather you'll actually feel.",
    body: "Outfits are built for the whole window you're out, and adjusted for whether you run hot or cold.",
  },
  {
    title: "A stylist you can talk to.",
    body: "Say “warmer”, “dressier” or “more relaxed” and it refines the look instead of starting over.",
  },
  { title: "You have the last word.", body: "Swipe any piece on the mannequin to swap it, and the stylist keeps your choice." },
];

const STEPS = [
  { title: "Build your closet.", body: "Snap your clothes. Layerup removes the background and fills in warmth and weather details from the type." },
  { title: "Set your style once.", body: "Pick your vibes, how you run on temperature and how you like things to fit." },
  { title: "Ask the stylist.", body: "Type your plans or tap a starter like “Rainy errands”. You get one outfit and a short note on why it works." },
  { title: "Refine and wear.", body: "Swipe, chat, then tap Wear this to lock it in." },
];

const screenshot = "w-full rounded-3xl outline outline-1 -outline-offset-1 outline-white/10";

export default function WelcomePage() {
  return (
    <>
      <header className={cn(PAGE_FRAME, "flex h-14 items-center justify-between text-sm")}>
        <span className="font-semibold tracking-tight">Layerup</span>
        <Link href="/login" className="text-muted-foreground transition-colors hover:text-foreground">
          Sign in
        </Link>
      </header>

      <main className="flex flex-col">
        <section className={cn(PAGE_FRAME, "grid items-center gap-12 py-16 sm:py-24 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]")}>
          <div className="flex flex-col items-center gap-8 text-center sm:items-start sm:text-left">
            <div className="flex flex-col gap-4">
              <h1 className="text-4xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-5xl">
                Dressed for the day in one message.
              </h1>
              <p className="max-w-[48ch] text-lg leading-relaxed text-pretty text-muted-foreground">
                Tell the stylist what your day looks like. It picks an outfit from the clothes you already own, layered
                for the forecast.
              </p>
            </div>
            <DemoButton note="No sign-up. A sample closet of 19 pieces and 10 AI requests." className="sm:items-start" />
          </div>
          <Image
            src="/welcome/today.jpg"
            alt="The stylist's outfit for “Dinner out tonight”: a dark crewneck, black jeans and leather boots on a mannequin made from closet photos"
            width={1040}
            height={812}
            loading="eager"
            sizes="(min-width: 768px) 560px, 100vw"
            className={screenshot}
          />
        </section>

        <section className="border-y border-border/60 bg-card">
          <div className={cn(PAGE_FRAME, "flex flex-col gap-4 py-16 sm:py-20")}>
            <h2 className="text-2xl leading-tight font-semibold tracking-tight text-balance sm:text-3xl">
              Your closet is full. Getting dressed is still a puzzle.
            </h2>
            <p className="max-w-[65ch] text-lg leading-relaxed text-pretty text-muted-foreground">
              Turning “52°F, rain by 3pm, office then dinner” into an outfit is a small puzzle you solve half-awake. So
              you reach for the same three things, get it wrong by noon, and the rest of your wardrobe sits unworn.
            </p>
          </div>
        </section>

        <section className={cn(PAGE_FRAME, "flex flex-col gap-10 py-16 sm:py-24")}>
          <h2 className="max-w-[24ch] text-2xl leading-tight font-semibold tracking-tight text-balance sm:text-3xl">
            Outfits from what you own, for the weather you&apos;ll walk through
          </h2>
          <ul className="grid gap-x-12 gap-y-8 sm:grid-cols-2">
            {BENEFITS.map(({ title, body }) => (
              <li key={title} className="flex flex-col gap-1.5">
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="leading-relaxed text-pretty text-muted-foreground">{body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className={cn(PAGE_FRAME, "grid items-center gap-12 pb-16 sm:pb-24 md:grid-cols-2")}>
          <div className="flex flex-col gap-8">
            <h2 className="text-2xl leading-tight font-semibold tracking-tight text-balance sm:text-3xl">
              From photos to an outfit in four steps
            </h2>
            <ol className="flex flex-col gap-6">
              {STEPS.map(({ title, body }, i) => (
                <li key={title} className="flex gap-4">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold tabular-nums">
                    {i + 1}
                  </span>
                  <div className="flex flex-col gap-1">
                    <h3 className="font-semibold">{title}</h3>
                    <p className="leading-relaxed text-pretty text-muted-foreground">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <Image
            src="/welcome/closet.jpg"
            alt="The wardrobe: closet photos with backgrounds removed, grouped by layer, with type and color filters"
            width={1040}
            height={776}
            sizes="(min-width: 768px) 480px, 100vw"
            className={screenshot}
          />
        </section>

        <section className="border-t border-border/60 bg-card">
          <div className={cn(PAGE_FRAME, "flex flex-col items-center gap-8 py-16 text-center sm:py-24")}>
            <div className="flex flex-col gap-3">
              <h2 className="text-2xl leading-tight font-semibold tracking-tight text-balance sm:text-3xl">
                See it with a sample closet
              </h2>
              <p className="text-lg text-muted-foreground">One click gets you a private copy. Nothing you change affects anyone else.</p>
            </div>
            <DemoButton note="Browsing, swapping and editing don't use AI requests." />
            <p className="text-sm text-muted-foreground">
              Have an invite?{" "}
              <Link href="/login" className="text-foreground underline underline-offset-4">
                Sign in with email
              </Link>
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
