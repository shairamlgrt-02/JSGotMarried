"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Ambience from "@/components/public/Ambience";
import { EASE_OUT, Reveal, Tilt } from "@/components/public/fx";
import { Corners, Flourish } from "@/components/public/ornaments";
import { BAKED_COVER, fullDate } from "@/components/public/Envelope";
import type { WeddingInfo } from "@/lib/types";

/**
 * The front door of the site — deliberately almost empty.
 *
 * `/` is not the invitation: it is the couple's hub for the whole day (the invitation preview,
 * the code-locked reply card, and later the games, raffles and activities). Two links do the
 * work today, and one door is kept open for the day itself.
 */
function Door({
  href, kicker, title, text, cta, soon = false, primary = false, delay = 0,
}: {
  href?: string; kicker: string; title: string; text: string; cta: string; soon?: boolean; primary?: boolean; delay?: number;
}) {
  const inner = (
    <div
      className={`relative h-full flex flex-col items-start gap-3 text-left px-7 py-8 md:px-9 md:py-10 rounded-[3px] transition-colors duration-500 ${
        soon ? "bg-[#F1EADD] text-ink/55" : primary ? "bg-wine text-lace hover:bg-mocha" : "paper-card text-ink hover:bg-[#FFFCF5]"
      }`}
    >
      {!soon && <Corners className={`w-12 h-12 md:w-14 md:h-14 ${primary ? "text-lace/40" : "text-wine/30"}`} inset="0.4rem" />}
      <p className={`micro ${primary ? "text-lace/70" : soon ? "text-ink/40" : "text-wine"}`}>{kicker}</p>
      <h2 className={`font-serif font-medium text-h3 leading-tight ${soon ? "text-ink/60" : ""}`}>{title}</h2>
      <p className={`font-serif italic text-fine leading-relaxed ${primary ? "text-lace/85" : soon ? "text-ink/45" : "text-taupe"}`}>{text}</p>
      <p className={`mt-auto pt-4 micro ${primary ? "text-lace" : soon ? "text-ink/40" : "text-wine"}`}>
        {soon ? cta : <span className="inline-flex items-center gap-2">{cta}<span aria-hidden>→</span></span>}
      </p>
    </div>
  );
  if (soon || !href)
    return (
      <div aria-disabled className="h-full cursor-default select-none border border-dashed border-taupe/40 rounded-[3px] p-[6px]">
        {inner}
      </div>
    );
  return (
    <motion.a
      href={href}
      initial={{ opacity: 0, y: 26 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.9, ease: EASE_OUT }}
      className="block h-full no-underline rounded-[3px] focus:outline-none focus-visible:ring-2 focus-visible:ring-wine/60"
    >
      <Tilt max={5} glare={false}>{inner}</Tilt>
    </motion.a>
  );
}

/** Small floating "RSVP by Oct 25" button, fixed to the bottom-right of the Hub. */
function HubRsvpButton({ info }: { info: WeddingInfo }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 800);
    return () => clearTimeout(t);
  }, []);
  const d = new Date(`${info.rsvp_deadline || "2026-10-25"}T12:00:00+03:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Asia/Bahrain" });
  return (
    <AnimatePresence>
      {show && (
        <motion.a
          href="/rsvp"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
          className="fixed z-50 bottom-5 right-5 flex items-center gap-3 bg-wine text-lace rounded-full pl-2 pr-5 py-2 shadow-[0_10px_24px_-6px_rgba(110,31,46,.6)] hover:bg-mocha transition-colors"
        >
          <span className="w-9 h-9 rounded-full bg-lace/15 grid place-items-center text-lg">✉</span>
          <span className="leading-tight">
            <span className="block micro">RSVP now</span>
            <span className="block font-serif italic text-fine opacity-90">by {d}</span>
          </span>
        </motion.a>
      )}
    </AnimatePresence>
  );
}

export default function Hub({ info }: { info: WeddingInfo }) {
  const couple = `${info.groom} & ${info.bride}`;
  return (
    <>
      <Ambience />
      <main className="relative z-[1] min-h-[100svh] flex flex-col items-center justify-center px-5 py-16 md:py-24 text-center overflow-x-clip">
        {/* the monogram, letterpressed into the paper */}
        <Reveal>
          <p className="micro text-taupe">The Wedding Site of</p>
          <h1 className="script text-wine text-script mt-3 [text-shadow:0_1px_0_rgba(255,255,255,.8),0_14px_26px_rgba(110,31,46,.12)]">
            {couple}
          </h1>
          <p className="caps text-mocha text-h3 mt-3 tracking-[0.24em]">{fullDate(info.date)}</p>
          <Flourish className="w-48 md:w-64 mx-auto mt-5 text-taupe/70" />
        </Reveal>

        <Reveal delay={0.15}>
          <p className="font-serif italic text-body text-taupe mt-8 max-w-md mx-auto text-balance">
            Our little house for the day. The invitation lives behind the first door, your reply
            card behind the second — and the third one opens on the night itself.
          </p>
        </Reveal>

        <div className="relative w-full max-w-4xl grid gap-5 md:grid-cols-3 mt-12 md:mt-16">
          <Door href="/preview" kicker="Door one" title="Preview the invitation" text="The whole site the way we made it — our story, the dress code, the countdown." cta="Open the preview" delay={0.25} />
          <Door href="/rsvp" kicker="Door two" title="Send your reply" text="Open the card with the code on your invitation. It takes a minute, and it saves your seat." cta="Reply with my code" primary delay={0.35} />
          <Door kicker="Door three · 11.11.2026" title="Games, raffles & the giveaways" text="On the night we open this door: the raffle numbers, the games and everything you need to join in." cta="Opens on the day" soon delay={0.45} />
        </div>

        {/* one quiet picture so the page is ours, not a template */}
        <Reveal delay={0.55}>
          <div className="relative mt-14 md:mt-20 w-40 md:w-48">
            <img src={info.cover_photo || info.gallery[0] || BAKED_COVER} alt="" className="w-full aspect-[4/5] object-cover rounded-[2px] shadow-[0_2px_3px_rgba(61,47,38,.18),0_30px_50px_-30px_rgba(61,47,38,.55)]" />
            <p className="micro text-taupe mt-4">{info.hashtags.join("  ")}</p>
          </div>
        </Reveal>
      </main>
      <HubRsvpButton info={info} />
    </>
  );
}
