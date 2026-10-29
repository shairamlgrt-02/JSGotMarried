"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Ambience from "@/components/public/Ambience";
import { EASE_OUT, Reveal } from "@/components/public/fx";
import { Flourish } from "@/components/public/ornaments";
import { fullDate } from "@/components/public/Envelope";
import { useCountdown } from "@/lib/hooks";
import { trackMessageLinkVisit } from "@/lib/db";
import type { WeddingInfo } from "@/lib/types";

type TileId = "gifts" | "chat" | "rsvp" | "instagram" | "games";
type TileTone = "rose" | "cream" | "wine" | "sage" | "gold";
type HomeTileData = {
  id: TileId;
  href?: string;
  external?: boolean;
  icon: string;
  title: string;
  summary: string;
  detail: string;
  cta: string;
  tone: TileTone;
};

const toneClasses: Record<TileTone, string> = {
  rose: "bg-[radial-gradient(circle_at_90%_8%,rgba(255,255,255,.92),transparent_43%),linear-gradient(145deg,#F6E7E1,#EEDBD6)] text-[#542D32]",
  cream: "bg-[radial-gradient(circle_at_90%_8%,rgba(255,255,255,.95),transparent_45%),linear-gradient(145deg,#FFFDF8,#F2EBDD)] text-[#46362C]",
  wine: "bg-[radial-gradient(circle_at_90%_8%,rgba(255,255,255,.22),transparent_40%),linear-gradient(145deg,#812D3E,#541725)] text-[#FFF9F3]",
  sage: "bg-[radial-gradient(circle_at_90%_8%,rgba(255,255,255,.85),transparent_45%),linear-gradient(145deg,#E9EFE5,#D8E4D5)] text-[#34483A]",
  gold: "bg-[radial-gradient(circle_at_90%_8%,rgba(255,255,255,.9),transparent_45%),linear-gradient(145deg,#F5EBD6,#EBDCBF)] text-[#554532]",
};

function HomeTile({
  tile,
  active,
  delay,
  onSelect,
}: {
  tile: HomeTileData;
  active: boolean;
  delay: number;
  onSelect: (id: TileId) => void;
}) {
  const reduceMotion = useReducedMotion();
  const detailsId = `home-tile-${tile.id}-details`;
  return (
    <motion.article
      layout
      initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.65, ease: EASE_OUT, layout: { duration: 0.42, ease: EASE_OUT } }}
      className={`relative min-w-0 overflow-hidden rounded-[28px] shadow-[0_18px_42px_-32px_rgba(75,43,37,.42)] ring-1 ring-white/55 ${toneClasses[tile.tone]} ${active ? "sm:col-span-2 lg:col-span-2" : ""}`}
    >
      <motion.button
        type="button"
        aria-expanded={active}
        aria-controls={detailsId}
        onClick={() => onSelect(tile.id)}
        whileHover={reduceMotion ? undefined : { y: -3 }}
        whileTap={reduceMotion ? undefined : { scale: 0.99 }}
        className="group relative flex min-h-[174px] w-full flex-col items-start p-5 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-wine/55 sm:min-h-[186px] sm:p-6"
      >
        <span aria-hidden className="pointer-events-none absolute -right-7 -top-10 h-36 w-36 rounded-full border border-current/10 transition-transform duration-700 group-hover:scale-110" />
        <span aria-hidden className="pointer-events-none absolute -right-1 top-0 h-24 w-24 rounded-full bg-white/15 blur-2xl" />
        <span className="relative flex w-full items-center justify-between gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/55 text-[21px] shadow-[0_5px_14px_-10px_rgba(60,36,31,.55)] ring-1 ring-white/60" aria-hidden>
            {tile.icon}
          </span>
          <span className="micro inline-flex items-center gap-1.5 text-[9px] tracking-[0.18em] opacity-65 transition-opacity group-hover:opacity-100">
            {active ? "CLOSE" : "EXPLORE"}
            <motion.span aria-hidden animate={{ rotate: active ? 180 : 0 }} transition={{ duration: 0.28 }}>⌄</motion.span>
          </span>
        </span>
        <span className="relative mt-4 block font-serif text-[1.45rem] font-medium leading-tight sm:text-[1.6rem]">{tile.title}</span>
        <span className="relative mt-1.5 block max-w-[35rem] font-serif text-[14px] leading-relaxed opacity-75 sm:text-[15px]">{tile.summary}</span>
        <span className="relative mt-auto flex items-center gap-2 pt-4 font-serif text-[11px] italic opacity-70">
          {active ? "A little more about this" : "Tap to see more"}<span aria-hidden className="text-base not-italic">✧</span>
        </span>
      </motion.button>

      <AnimatePresence initial={false}>
        {active && (
          <motion.div
            id={detailsId}
            key="details"
            initial={reduceMotion ? false : { opacity: 0, height: 0, y: 8 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, height: 0, y: 6 }}
            transition={{ duration: reduceMotion ? 0 : 0.36, ease: EASE_OUT }}
            className="overflow-hidden"
          >
            <div className="mx-5 mb-5 border-t border-current/15 pt-4 sm:mx-6 sm:mb-6 sm:pt-5">
              <p className="max-w-[42rem] font-serif text-[15px] leading-relaxed opacity-85 sm:text-base">{tile.detail}</p>
              {tile.href ? (
                <a
                  href={tile.href}
                  target={tile.external ? "_blank" : undefined}
                  rel={tile.external ? "noopener noreferrer" : undefined}
                  className="mt-4 inline-flex min-h-11 items-center gap-3 rounded-full bg-white/75 px-5 py-2.5 font-serif text-sm font-medium no-underline shadow-[0_8px_20px_-14px_rgba(50,28,24,.6)] ring-1 ring-white/70 transition-all hover:-translate-y-0.5 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-wine"
                >
                  {tile.cta}<span aria-hidden className="text-base">{tile.external ? "↗" : "→"}</span>
                </a>
              ) : (
                <span className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-full bg-white/45 px-4 py-2 font-serif text-xs italic ring-1 ring-white/45">
                  <span aria-hidden>✧</span>{tile.cta}
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

function CountdownPill({ date }: { date: string }) {
  const { ready, days } = useCountdown(date);
  if (!ready) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.22, duration: 0.6, ease: EASE_OUT }}
      className="inline-flex items-center gap-2.5 rounded-full bg-white/75 px-5 py-2.5 text-wine shadow-[0_8px_22px_-16px_rgba(91,36,45,.55)] ring-1 ring-white/85 backdrop-blur-sm"
    >
      <motion.span aria-hidden animate={{ scale: [1, 1.14, 1] }} transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}>♡</motion.span>
      <span className="micro text-[10px] tracking-[0.2em]">{days > 0 ? `${days} DAY${days === 1 ? "" : "S"} TO GO` : "TODAY IS THE DAY"}</span>
    </motion.div>
  );
}

export default function Hub({ info }: { info: WeddingInfo }) {
  const couple = `${info.groom} & ${info.bride}`;
  const handle = (info.instagram || "").replace(/^@/, "").trim();
  const [activeTile, setActiveTile] = useState<TileId | null>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    trackMessageLinkVisit();
  }, []);

  const tiles: HomeTileData[] = [
    {
      id: "gifts", href: "/gifts", icon: "🎁", title: "Gift list",
      summary: "A little help as we begin our home together.",
      detail: "Browse our wish list, mark a gift you have chosen, or find the transfer details. Every kind gesture means so much to us.",
      cta: "Explore the gift list", tone: "gold",
    },
    {
      id: "chat", href: "/upload", icon: "💬", title: "Wedding chat & Stories",
      summary: "Say hello, share a photo, and keep the memories close.",
      detail: "Join the group conversation with messages, voice notes and photos or videos. You can also add a separate Story for everyone to enjoy.",
      cta: "Join the conversation", tone: "rose",
    },
    {
      id: "rsvp", href: "/rsvp", icon: "💌", title: "Send your reply",
      summary: "Let us know if you can celebrate with us.",
      detail: "Open your personal reply card using the code printed on your invitation. It only takes a moment, and it helps us plan the day with care.",
      cta: "Reply with my code", tone: "wine",
    },
    ...(handle ? [{
      id: "instagram" as const, href: `https://instagram.com/${handle}`, external: true, icon: "✧", title: "Follow along",
      summary: "Little moments from the countdown and behind the scenes.",
      detail: `Follow @${handle} for updates, snapshots and the happy lead-up to our wedding day.`,
      cta: "Visit Instagram", tone: "sage" as const,
    }] : []),
    {
      id: "games", icon: "🎟", title: "Games & raffles",
      summary: "A little fun is waiting for the wedding day.",
      detail: "Raffle numbers and party games will appear here on the day. Come back during the celebration and join in with everyone.",
      cta: "Opens on November 11, 2026", tone: "cream",
    },
  ];

  return (
    <>
      <Ambience />
      <main className="relative z-[1] min-h-[100svh] overflow-x-clip px-4 pb-12 pt-10 text-center sm:px-6 sm:pt-14 md:pb-16">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px] bg-[radial-gradient(ellipse_at_50%_10%,rgba(255,255,255,.85),transparent_67%),radial-gradient(ellipse_at_18%_58%,rgba(229,197,190,.22),transparent_33%),radial-gradient(ellipse_at_84%_68%,rgba(221,202,162,.2),transparent_32%)]" />
        <motion.span
          aria-hidden
          className="pointer-events-none absolute left-[8%] top-[12rem] hidden font-serif text-3xl text-[#9D6570]/50 sm:block"
          animate={reduceMotion ? undefined : { y: [0, -9, 0], rotate: [0, 8, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >✧</motion.span>
        <motion.span
          aria-hidden
          className="pointer-events-none absolute right-[8%] top-[19rem] hidden font-serif text-2xl text-[#A98F5C]/55 sm:block"
          animate={reduceMotion ? undefined : { y: [0, 8, 0], rotate: [0, -8, 0] }}
          transition={{ duration: 7.2, repeat: Infinity, ease: "easeInOut" }}
        >♡</motion.span>

        <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center">
          <Reveal>
            <p className="micro inline-flex items-center gap-2 rounded-full bg-white/65 px-4 py-2 text-[9px] tracking-[0.28em] text-taupe shadow-sm ring-1 ring-white/85 backdrop-blur-sm">
              <span aria-hidden className="text-wine">✧</span> THE WEDDING SITE OF
            </p>
            <h1 className="script mt-4 text-[clamp(3.35rem,11vw,6.3rem)] leading-[.93] text-wine [text-shadow:0_2px_0_rgba(255,255,255,.88),0_16px_34px_rgba(110,31,46,.13)]">
              {couple}
            </h1>
            <p className="caps mt-4 text-[11px] tracking-[0.32em] text-mocha sm:text-xs">{fullDate(info.date)}</p>
            <Flourish className="mx-auto mt-5 w-44 text-taupe/75 sm:w-56" />
            <p className="mx-auto mt-4 max-w-md font-serif text-base italic leading-relaxed text-[#77615A] sm:text-lg">
              We can&apos;t wait to celebrate together. Find everything you need for the day below.
            </p>
          </Reveal>

          <div className="mt-6">
            <CountdownPill date={info.date} />
          </div>

          <section aria-label="Explore the wedding site" className="mt-10 w-full text-left sm:mt-12">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2 px-1 sm:px-2">
              <div>
                <p className="micro text-[9px] tracking-[0.25em] text-taupe">A LITTLE HOUSE FOR OUR DAY</p>
                <h2 className="mt-1 font-serif text-2xl font-medium text-[#4F3834] sm:text-[1.7rem]">Where would you like to go?</h2>
              </div>
              <p className="font-serif text-xs italic text-taupe/90">Tap a card to open it ✧</p>
            </div>

            <motion.div layout className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              {tiles.map((tile, index) => (
                <HomeTile
                  key={tile.id}
                  tile={tile}
                  delay={index * 0.055}
                  active={activeTile === tile.id}
                  onSelect={(id) => setActiveTile((current) => current === id ? null : id)}
                />
              ))}
            </motion.div>
          </section>

          <Reveal delay={0.25}>
            <a
              href="/preview"
              className="mt-9 inline-flex items-center gap-2 rounded-full bg-white/55 px-5 py-2.5 font-serif text-sm italic text-taupe no-underline shadow-sm ring-1 ring-white/75 transition-all hover:-translate-y-0.5 hover:bg-white/85 hover:text-wine focus:outline-none focus-visible:ring-2 focus-visible:ring-wine/60"
            >
              Preview the full invitation <span aria-hidden className="text-base not-italic">→</span>
            </a>
            <p className="micro mt-6 text-[9px] tracking-[0.22em] text-taupe/80">{info.hashtags.join("  ")}</p>
          </Reveal>
        </div>
      </main>
    </>
  );
}
