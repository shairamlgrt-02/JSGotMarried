"use client";
import { useEffect } from "react";
import { motion } from "framer-motion";
import Ambience from "@/components/public/Ambience";
import { EASE_OUT, Reveal } from "@/components/public/fx";
import { Flourish } from "@/components/public/ornaments";
import { fullDate } from "@/components/public/Envelope";
import { useCountdown } from "@/lib/hooks";
import { trackMessageLinkVisit } from "@/lib/db";
import type { WeddingInfo } from "@/lib/types";

/**
 * The front door of the site — the couple's compact "house" for the whole day.
 *
 * Guests have usually already read the invitation by the time they come back here, so the live
 * day-of things lead: the gift list, the photo/video album, the reply card, Instagram and the
 * games door (which stays sealed until the night). The full invitation preview is a quiet link
 * at the very bottom. Everything fits in one glance on a phone — no long scroll.
 */
type TileKind = "paper" | "wine" | "soon";

function Tile({
  href,
  external = false,
  icon,
  title,
  text,
  cta,
  kind = "paper",
  span = false,
  delay = 0,
}: {
  href?: string;
  external?: boolean;
  icon: string;
  title: string;
  text: string;
  cta: string;
  kind?: TileKind;
  span?: boolean;
  delay?: number;
}) {
  const inner = (
    <div
      className={`relative flex h-full flex-col items-start gap-2.5 rounded-[3px] px-5 py-6 md:px-6 md:py-7 text-left transition-colors duration-500 ${
        kind === "soon"
          ? "bg-[#F1EADD] text-ink/55"
          : kind === "wine"
            ? "bg-wine text-lace hover:bg-mocha"
            : "paper-card text-ink hover:bg-[#FFFCF5]"
      }`}
    >
      <span
        className={`grid h-10 w-10 place-items-center rounded-full text-lg leading-none ${
          kind === "wine" ? "bg-lace/15 text-lace" : kind === "soon" ? "bg-ink/5 text-ink/40" : "bg-wine/8 text-wine"
        }`}
        aria-hidden
      >
        {icon}
      </span>
      <h2 className="font-serif font-medium text-[1.25rem] leading-tight">{title}</h2>
      <p
        className={`font-serif italic text-[13px] leading-snug ${
          kind === "wine" ? "text-lace/85" : kind === "soon" ? "text-ink/45" : "text-taupe"
        }`}
      >
        {text}
      </p>
      <p
        className={`micro mt-auto pt-2 ${
          kind === "wine" ? "text-lace" : kind === "soon" ? "text-ink/40" : "text-wine"
        }`}
      >
        {kind === "soon" ? cta : <span className="inline-flex items-center gap-1.5">{cta}<span aria-hidden>{external ? "↗" : "→"}</span></span>}
      </p>
    </div>
  );

  if (kind === "soon" || !href) {
    return (
      <div aria-disabled className={`h-full cursor-default select-none rounded-[3px] border border-dashed border-taupe/40 p-[5px] ${span ? "col-span-2 md:col-span-1" : ""}`}>
        {inner}
      </div>
    );
  }
  return (
    <motion.a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.8, ease: EASE_OUT }}
      className={`block h-full no-underline rounded-[3px] focus:outline-none focus-visible:ring-2 focus-visible:ring-wine/60 ${span ? "col-span-2 md:col-span-1" : ""}`}
    >
      {inner}
    </motion.a>
  );
}

function CountdownPill({ date }: { date: string }) {
  const { ready, days } = useCountdown(date);
  if (!ready) return null;
  return (
    <Reveal delay={0.1}>
      <p className="micro inline-flex items-center gap-2 rounded-full border border-wine/25 bg-[#FCFAF6] px-5 py-2 tracking-[0.2em] text-wine">
        <span aria-hidden>♡</span>
        {days > 0 ? `${days} DAY${days === 1 ? "" : "S"} TO GO` : "TODAY IS THE DAY"}
      </p>
    </Reveal>
  );
}

export default function Hub({ info }: { info: WeddingInfo }) {
  const couple = `${info.groom} & ${info.bride}`;
  const handle = (info.instagram || "").replace(/^@/, "").trim();
  useEffect(() => {
    trackMessageLinkVisit();
  }, []);

  return (
    <>
      <Ambience />
      <main className="relative z-[1] min-h-[100svh] flex flex-col items-center justify-center px-5 py-12 md:py-16 text-center overflow-x-clip">
        {/* the monogram, letterpressed into the paper */}
        <Reveal>
          <p className="micro text-taupe">The Wedding Site of</p>
          <h1 className="script text-wine text-[clamp(2.6rem,11vw,4.2rem)] leading-[1.05] mt-2 [text-shadow:0_1px_0_rgba(255,255,255,.8),0_14px_26px_rgba(110,31,46,.12)]">
            {couple}
          </h1>
          <p className="caps text-mocha text-h4 mt-2 tracking-[0.24em]">{fullDate(info.date)}</p>
          <Flourish className="w-40 md:w-52 mx-auto mt-4 text-taupe/70" />
        </Reveal>

        <div className="mt-5">
          <CountdownPill date={info.date} />
        </div>

        {/* the house: everything the wedding needs from one glance, phone-first */}
        <div className="relative w-full max-w-3xl grid grid-cols-2 md:grid-cols-3 gap-3.5 md:gap-4 mt-9">
          <Tile
            href="/gifts"
            icon="🎁"
            title="Gift list"
            text="Our little wish list — mark anything you've bought so others know."
            cta="Open the list"
            delay={0.15}
          />
          <Tile
            href="/upload"
            icon="📷"
            title="Wedding chat & Stories"
            text="Chat with everyone, send voice notes, and share photos or videos to Stories."
            cta="Join the chat"
            delay={0.2}
          />
          <Tile
            href="/rsvp"
            icon="✉"
            title="Send your reply"
            text="Open the card with the code on your invitation — it takes a minute."
            cta="Reply with my code"
            kind="wine"
            delay={0.25}
          />
          {handle && (
            <Tile
              href={`https://instagram.com/${handle}`}
              external
              icon="◎"
              title="Follow along"
              text={`The countdown and behind-the-scenes on @${handle}.`}
              cta="Instagram"
              delay={0.3}
            />
          )}
          <Tile
            icon="🎟"
            title="Games & raffles"
            text="The raffle numbers, the games and everything you need to join in."
            cta="Opens on the day · 11.11.2026"
            kind="soon"
            span
            delay={0.35}
          />
        </div>

        {/* the invitation is already in everyone's hands — it rests quietly at the bottom */}
        <Reveal delay={0.45}>
          <a
            href="/preview"
            className="mt-10 inline-flex items-center gap-2 font-serif italic text-taupe no-underline border-b border-taupe/30 pb-1 transition-colors hover:text-wine hover:border-wine/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-wine/60 rounded-sm"
          >
            Preview the full invitation <span aria-hidden>→</span>
          </a>
          <p className="micro text-taupe/80 mt-6 tracking-[0.22em]">{info.hashtags.join("  ")}</p>
        </Reveal>
      </main>
    </>
  );
}
