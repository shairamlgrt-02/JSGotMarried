"use client";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { submitRsvp, type InviteState } from "@/lib/db";
import { entourageHeading } from "@/lib/entourage";
import { useCountdown } from "@/lib/hooks";
import { downloadKeepsake } from "@/lib/keepsake";
import type { Attire, EntourageMember, Faq, ScheduleItem, StoryChapter, WeddingInfo } from "@/lib/types";
import { BAKED_COVER, fullDate } from "./Envelope";
import { EASE, EASE_OUT, Reveal, Tilt, rise } from "./fx";
import { Corners, Flourish, GemDot, LaceEdge, Paisley } from "./ornaments";
import { PhotoStrip, Polaroid, ScratchReveal, slots } from "./photos";
import { AttireGuide } from "./attire";
import VenueMapPreview from "./VenueMapPreview";

const longDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Bahrain" });

function Title({ kicker, title }: { kicker?: string; title: string }) {
  return (
    <Reveal className="text-center">
      {kicker && <p className="micro text-taupe">{kicker}</p>}
      <h2 className={`script text-wine text-script ${kicker ? "mt-2" : ""} text-balance`}>{title}</h2>
      <Flourish className="w-44 md:w-56 mx-auto mt-2 text-taupe/70" />
    </Reveal>
  );
}

/* ─────────── OUR STORY — the chapter carousel ─────────── */
/** Repeating perforations are part of each moving film frame, not a fixed overlay. */
function FilmSprockets() {
  const style = {
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='12' viewBox='0 0 20 12'%3E%3Crect x='5' y='2' width='10' height='8' rx='2' fill='%23F3E8D6'/%3E%3C/svg%3E\")",
    backgroundSize: "20px 12px",
    backgroundRepeat: "repeat-x" as const,
    backgroundPosition: "center",
  };
  return <div aria-hidden className="h-3 w-full shrink-0 bg-[#211E1B] md:h-3.5" style={style} />;
}

/** Three copies of the reel let the five chapter frames loop seamlessly in both directions. */
function ChapterFilm({ chapters, stripIndex, snapping, info, reduceMotion, onNavigate, onAnimationComplete }: {
  chapters: StoryChapter[];
  stripIndex: number;
  snapping: boolean;
  info: WeddingInfo;
  reduceMotion: boolean | null;
  onNavigate: (direction: number) => void;
  onAnimationComplete: () => void;
}) {
  const win = useRef<HTMLDivElement>(null);
  const startX = useRef<number | null>(null);
  const [w, setW] = useState(300);
  useEffect(() => {
    const el = win.current;
    if (!el) return;
    const measure = () => setW(Math.max(1, el.clientWidth));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Multiples of the sprocket-hole pitch keep the cloned joins visually seamless.
  const frameWidth = Math.max(160, Math.min(200, Math.round((w * 0.72) / 20) * 20));
  // Symmetric side padding keeps the active photo centered, with neighboring frames peeking at both sides.
  const sidePadding = Math.max(0, (w - frameWidth) / 2);
  const filmFrames = [...chapters, ...chapters, ...chapters];
  const stripWidth = filmFrames.length * frameWidth + sidePadding * 2;

  return (
    <motion.div {...rise(0, 26)} style={{ rotate: -1.5 }} className="relative mx-auto w-full max-w-[336px] lg:w-[336px] lg:max-w-none">
      <div
        ref={win}
        role="group"
        aria-label="Swipe the filmstrip to move through the story chapters"
        className="relative h-[152px] overflow-hidden rounded-[3px] border-2 border-[#171311] bg-[#211E1B] shadow-[0_5px_12px_rgba(30,22,18,.34)] lg:h-[164px] cursor-grab select-none touch-pan-y active:cursor-grabbing"
        onPointerDown={(e) => { if (e.pointerType !== "mouse" || e.button === 0) { startX.current = e.clientX; e.currentTarget.setPointerCapture(e.pointerId); } }}
        onPointerUp={(e) => {
          if (startX.current === null) return;
          const delta = e.clientX - startX.current;
          startX.current = null;
          if (Math.abs(delta) > 36) onNavigate(delta < 0 ? 1 : -1);
        }}
        onPointerCancel={() => { startX.current = null; }}
      >
        <motion.div
          initial={false}
          animate={{ x: -frameWidth * stripIndex }}
          transition={{ duration: snapping ? 0 : 0.7, ease: EASE }}
          onAnimationComplete={onAnimationComplete}
          className="absolute inset-y-0 left-0 flex bg-[#211E1B]"
          style={{ width: stripWidth, paddingLeft: sidePadding, paddingRight: sidePadding }}
        >
          {filmFrames.map((c, frame) => {
            const chapterPhoto = frame % chapters.length;
            const isClone = frame < chapters.length || frame >= chapters.length * 2;
            return (
              <div key={`${frame}-${c.id}`} style={{ width: frameWidth }} aria-hidden={isClone} className="flex h-full shrink-0 flex-col bg-[#211E1B]">
                <FilmSprockets />
                <div className="min-h-0 flex-1 p-1">
                  <div className="h-full w-full overflow-hidden border border-[#6B5747]/70 bg-[linear-gradient(145deg,#E9DFD1,#D9CBB8)]">
                    <img src={c.photo || info.gallery[chapterPhoto] || BAKED_COVER} alt={isClone ? "" : c.title} loading="lazy" draggable={false} className="h-full w-full object-cover object-center [filter:sepia(.12)_saturate(.92)_contrast(1.02)]" />
                  </div>
                </div>
                <FilmSprockets />
              </div>
            );
          })}
        </motion.div>
        <div className="absolute left-1 top-1/2 z-20 -translate-y-1/2">
          <StoryArrowButton direction="previous" onClick={() => onNavigate(-1)} reduceMotion={reduceMotion} />
        </div>
        <div className="absolute right-1 top-1/2 z-20 -translate-y-1/2">
          <StoryArrowButton direction="next" onClick={() => onNavigate(1)} reduceMotion={reduceMotion} />
        </div>
      </div>
    </motion.div>
  );
}

/** Chapter text slides sideways with the swipe; `dir` keeps enter & exit facing the same way. */
const chapterSlide = {
  enter: (d: number) => ({ opacity: 0, x: d * 56 }),
  center: { opacity: 1, x: 0 },
  exit: (d: number) => ({ opacity: 0, x: d * -56 }),
};

/** Bold page-turn buttons sit close to the film edges; motion points gently in each direction. */
function StoryArrowButton({ direction, onClick, reduceMotion }: {
  direction: "previous" | "next";
  onClick: () => void;
  reduceMotion: boolean | null;
}) {
  const previous = direction === "previous";
  return (
    <motion.button
      type="button"
      onPointerDown={(event) => event.stopPropagation()}
      onClick={onClick}
      aria-label={previous ? "Previous story chapter" : "Next story chapter"}
      initial={false}
      animate={reduceMotion ? undefined : { x: previous ? [0, -4, 0] : [0, 4, 0] }}
      transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 0.9, ease: "easeInOut" }}
      whileHover={reduceMotion ? undefined : { scale: 1.12, rotate: previous ? -5 : 5, transition: { duration: 0.18 } }}
      whileTap={reduceMotion ? undefined : { scale: 0.9 }}
      className="relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-[#B99D7D] bg-wine text-lace shadow-[0_4px_12px_rgba(110,31,46,.3)] ring-2 ring-[#FBF7EF] transition-colors hover:bg-mocha focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-wine sm:h-10 sm:w-10 lg:h-11 lg:w-11"
    >
      <span aria-hidden="true" className="absolute inset-[3px] rounded-full border border-lace/25" />
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="relative h-5 w-5 sm:h-6 sm:w-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        {previous ? <path d="M14.5 5.5 8 12l6.5 6.5M8 12h10" /> : <path d="m9.5 5.5 6.5 6.5-6.5 6.5M16 12H6" />}
      </svg>
    </motion.button>
  );
}

export function Story({ info, chapters = [] }: { info: WeddingInfo; chapters?: StoryChapter[] }) {
  const sorted = useMemo(() => [...chapters].sort((a, b) => a.order - b.order), [chapters]);
  const n = sorted.length;
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);
  const [filmIndex, setFilmIndex] = useState(n);
  const [snappingFilm, setSnappingFilm] = useState(false);
  const filmReset = useRef<number | null>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    filmReset.current = null;
    setI(0);
    setFilmIndex(n);
    setSnappingFilm(true);
    const frame = requestAnimationFrame(() => setSnappingFilm(false));
    return () => cancelAnimationFrame(frame);
  }, [n]);

  const go = (k: number) => {
    if (n < 2) return;
    const next = ((k % n) + n) % n;
    if (next === i) return;
    const wrapForward = i === n - 1 && k > i;
    const wrapBackward = i === 0 && k < 0;
    filmReset.current = wrapForward ? n : wrapBackward ? 2 * n - 1 : null;
    setSnappingFilm(false);
    setDir(wrapForward ? 1 : wrapBackward ? -1 : next > i ? 1 : -1);
    setI(next);
    setFilmIndex(wrapForward ? 2 * n : wrapBackward ? n - 1 : n + next);
  };

  const finishFilmMove = () => {
    const resetTo = filmReset.current;
    if (resetTo === null) return;
    filmReset.current = null;
    setSnappingFilm(true);
    setFilmIndex(resetTo);
    requestAnimationFrame(() => setSnappingFilm(false));
  };

  // If every chapter is deleted in the binder, keep the fallback story just as compact as the carousel.
  if (n === 0) {
    return (
      <section id="story" className="sec">
        <Title kicker="Our Story" title="A wish come true" />
        <div className="col-wide grid md:grid-cols-[280px_1fr] gap-4 md:gap-16 mt-5 md:mt-head items-center">
          <PhotoStrip photos={slots(info, 0, 4)} caption={`J & S · ${fullDate(info.date)}`} horizontal className="w-full max-w-sm mx-auto" />
          <div className="text-center md:text-left">
            <p className="font-serif text-fine md:text-lead text-mocha text-pretty">{info.story}</p>
            {info.hashtags.length > 0 && <p className="micro text-taupe mt-3">{info.hashtags.join("   ")}</p>}
          </div>
        </div>
      </section>
    );
  }

  const ch = sorted[Math.min(i, n - 1)];
  return (
    <section id="story" className="sec">
      <Title kicker="Our Story" title="A wish come true" />
      <div className="col-wide grid lg:grid-cols-[336px_1fr] gap-4 lg:gap-10 mt-5 lg:mt-head items-center">
        <ChapterFilm chapters={sorted} stripIndex={filmIndex} snapping={snappingFilm} info={info} reduceMotion={reduceMotion} onNavigate={(direction) => go(i + direction)} onAnimationComplete={finishFilmMove} />
        <div className="text-center lg:text-left">
          <div className="h-[216px] max-[360px]:h-[254px] overflow-hidden sm:h-[184px] md:h-[166px] lg:h-[276px]">
            <AnimatePresence mode="wait" custom={dir} initial={false}>
              <motion.div
                key={ch.id}
                variants={chapterSlide}
                custom={dir}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.55, ease: EASE_OUT }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.16}
                dragDirectionLock
                onDragEnd={(_, o) => { if (o.offset.x < -48) go(i + 1); else if (o.offset.x > 48) go(i - 1); }}
                className="cursor-grab select-none touch-pan-y active:cursor-grabbing"
              >
                <p className="micro text-center text-taupe">Chapter {i + 1} of {n}</p>
                <h3 className="script mt-1 text-center text-[clamp(1.6rem,7vw,2.1rem)] leading-[1.02] text-wine text-balance lg:text-script-sm">{ch.title}</h3>
                <p className="mt-2 font-serif text-center text-fine leading-[1.35] text-mocha text-pretty lg:mt-3 lg:text-left lg:text-lead lg:leading-[1.4]">{ch.text}</p>
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="mt-1.5 flex items-center justify-center lg:mt-2" role="group" aria-label="Choose a story chapter">
            <div className="flex items-center gap-0.5">
              {sorted.map((c, k) => (
                <motion.button
                  key={c.id}
                  type="button"
                  onClick={() => go(k)}
                  aria-label={`Chapter ${k + 1}: ${c.title}`}
                  aria-current={k === i ? "step" : undefined}
                  initial={false}
                  whileHover={reduceMotion ? undefined : { scale: 1.15 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.88 }}
                  className="group grid h-8 w-8 place-items-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-wine"
                >
                  <span className={`rounded-full border border-wine/50 transition-all duration-300 ${k === i ? "h-2.5 w-6 bg-wine shadow-[0_0_0_3px_rgba(110,31,46,.1)]" : "h-2.5 w-2.5 bg-wine/15 group-hover:bg-wine/55"}`} />
                </motion.button>
              ))}
            </div>
          </div>
          {info.hashtags.length > 0 && <p className="micro mt-1.5 text-center text-taupe/75">{info.hashtags.join("   ")}</p>}
        </div>
      </div>
    </section>
  );
}

/* ─────────── 11.11 OPENING ─────────── */
/** A short dedication at the beginning of the letter scroll, before the story and voice guestbook. */
export function ElevenEleven({ info }: { info: WeddingInfo }) {
  return (
    <section className="sec-sm text-center" aria-labelledby="wedding-dedication-title">
      <div className="col-wide relative pt-8 pb-2 md:pt-12 md:pb-3">
        <Reveal>
          <p className="micro text-taupe">The Wedding of</p>
          <h2 id="wedding-dedication-title" className="script mt-1 text-[clamp(2.1rem,8vw,4.6rem)] leading-tight text-wine text-balance">{info.groom} &amp; {info.bride}</h2>
          <p className="script mt-1 whitespace-nowrap text-[clamp(2.5rem,10vw,5.8rem)] leading-none tracking-[.015em] text-wine">{fullDate(info.date)}</p>
          <p className="mt-3 font-serif text-fine italic text-mocha text-balance">A wish made by two — a prayer answered by the One above.</p>
          <Flourish className="mx-auto mt-4 w-36 text-taupe/60" />
          <div className="mx-auto mt-4 max-w-2xl border-y border-taupe/20 py-3">
            <p className="micro text-taupe">1 Corinthians 11:11</p>
            <p className="mx-auto mt-2 max-w-xl px-3 font-serif text-fine italic leading-relaxed text-mocha text-balance">“Nevertheless neither is the man without the woman, neither the woman without the man, in the Lord.”</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ─────────── THE DAY ─────────── */
/** Small line-art icons for the fixed six-stop program timeline. */
function ProgramIcon({ title }: { title: string }) {
  const t = title.toLowerCase();
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (t.includes("arrival")) return (
    <svg viewBox="0 0 32 32" className="w-6 h-6" {...common}><circle cx="12" cy="10" r="3.5" /><circle cx="22" cy="12" r="3" /><path d="M4.5 26v-2a7.5 7.5 0 0115 0v2zM18 20a6 6 0 019.5 4v2H22" /></svg>
  );
  if (t.includes("ceremony")) return <Paisley className="w-5 h-7" />;
  if (t.includes("photo")) return (
    <svg viewBox="0 0 32 32" className="w-6 h-6" {...common}><path d="M5 10h5l2-3h8l2 3h5v16H5z" /><circle cx="16" cy="18" r="5" /><path d="M8 13h2" /></svg>
  );
  if (t.includes("toast") || t.includes("snack")) return (
    <svg viewBox="0 0 32 32" className="w-6 h-6" {...common}><path d="M5 8h10l-1.2 9a3.8 3.8 0 01-7.6 0zM10 21v6M6 27h8M27 8h-9l1.2 9a3.4 3.4 0 006.8 0zM22 21v6M18 27h8" /><path d="M16 5l1.5-2M20 5l2-1" /></svg>
  );
  if (t.includes("reception") || t.includes("dinner") || t.includes("party")) return (
    <svg viewBox="0 0 32 32" className="w-6 h-6" {...common}><circle cx="16" cy="16" r="8" /><circle cx="16" cy="16" r="3.5" /><path d="M4 8v8M2 8v4h4V8M4 12v16M28 8v20M28 8c-3 2-4 5-4 9h4" /></svg>
  );
  if (t.includes("send off")) return (
    <svg viewBox="0 0 32 32" className="w-6 h-6" {...common}><path d="M16 3v5M16 24v5M3 16h5M24 16h5M6.8 6.8l3.5 3.5M21.7 21.7l3.5 3.5M25.2 6.8l-3.5 3.5M10.3 21.7l-3.5 3.5" /><path d="M16 11l1.6 3.4 3.7.5-2.7 2.6.7 3.7-3.3-1.8-3.3 1.8.7-3.7-2.7-2.6 3.7-.5z" /></svg>
  );
  return <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor"><path d="M12 2l2.6 6.6L21 9.3l-5 4.4 1.6 6.8L12 16.8 6.4 20.5 8 13.7 3 9.3l6.4-.7z" /></svg>;
}

const PROGRAM_STOPS = [
  { time: "3:30 PM", title: "Entourage Arrival" },
  { time: "4:00 PM", title: "Wedding Ceremony" },
  { time: "5:00 PM", title: "Wedding Photos" },
  { time: "5:30 PM", title: "Welcome Toasts & Snacks" },
  { time: "6:30 PM", title: "Wedding Reception" },
  { time: "10:00 PM", title: "Send off" },
];

const PROGRAM_HIGHLIGHTS = [
  {
    time: "4:00 PM",
    title: "The Ceremony",
    detail: "An intimate ceremony with our families, entourage and a few honoured guests. You’re warmly welcome to witness our vows, with open seating around the reserved rows.",
  },
  {
    time: "5:30 PM",
    title: "Welcome Toasts & Snacks",
    detail: "Join us from 5:30 PM for toasts, snacks, refreshments, photo moments and little activities at the majlis outside the hall. We’ll come find you for hugs, laughs and pictures.",
  },
  {
    time: "6:30 PM",
    title: "The Reception",
    detail: "Dinner, our film on the big screen, games, giveaways and dancing until the end. We can’t wait to celebrate with you.",
  },
];

/** One fixed, six-stop timeline; the mobile view fits without a horizontal swipe. */
export function Schedule() {
  const reduceMotion = useReducedMotion();
  return (
    <section id="program" className="sec">
      <Title title="Program" />
      <div className="col-wide mt-head">
        <div role="list" aria-label="Wedding program timeline" className="relative grid grid-cols-6 pt-1">
          <div aria-hidden className="pointer-events-none absolute left-[8.333%] right-[8.333%] top-[5.0625rem] border-t border-dashed border-wine/45 sm:top-[5.25rem]" />
          {!reduceMotion && (
            <motion.span
              aria-hidden="true"
              initial={{ left: "8.333%" }}
              whileInView={{ left: "91.667%" }}
              viewport={{ once: true, amount: 0.7 }}
              transition={{ duration: 2.5, ease: EASE_OUT, delay: 0.2 }}
              className="pointer-events-none absolute top-[calc(5.0625rem-3px)] z-0 -ml-[3px] h-1.5 w-1.5 rounded-full bg-[#B99D7D] shadow-[0_0_10px_3px_rgba(110,31,46,.35)] sm:top-[calc(5.25rem-3px)]"
            />
          )}
          {PROGRAM_STOPS.map((stop, i) => {
            const titleAbove = i % 2 === 0;
            return (
              <motion.div
                role="listitem"
                key={stop.time}
                aria-label={`${stop.time} — ${stop.title}`}
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.4, ease: EASE_OUT, delay: reduceMotion ? 0 : i * 0.035 }}
                className="relative z-[1] grid min-w-0 grid-rows-[60px_34px_20px_60px] text-center sm:grid-rows-[60px_40px_20px_60px]"
              >
                <div className="flex min-w-0 items-end justify-center px-0.5 pb-1">
                  {titleAbove && <h3 className="break-words font-serif text-[10px] leading-[1.05] text-mocha text-balance sm:text-xs md:text-sm">{stop.title}</h3>}
                </div>
                <div className="flex items-center justify-center">
                  <span aria-hidden="true" className="grid h-8 w-8 place-items-center rounded-full border border-wine/20 bg-[#F8F2E7] text-wine shadow-[0_2px_6px_rgba(61,47,38,.12)] [&>svg]:!h-5 [&>svg]:!w-5 sm:h-10 sm:w-10 sm:[&>svg]:!h-6 sm:[&>svg]:!w-6">
                    <ProgramIcon title={stop.title} />
                  </span>
                </div>
                <time className="whitespace-nowrap font-serif text-[9px] font-semibold tabular-nums text-wine sm:text-xs">{stop.time}</time>
                <div className="min-w-0 px-0.5 pt-1">
                  {!titleAbove && <h3 className="break-words font-serif text-[10px] leading-[1.05] text-mocha text-balance sm:text-xs md:text-sm">{stop.title}</h3>}
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-5 sm:mt-7">
          <div className="mb-3 flex items-center justify-center gap-2.5 sm:mb-4">
            <span aria-hidden="true" className="h-px w-7 bg-gradient-to-r from-transparent to-wine/45 sm:w-10" />
            <motion.span aria-hidden="true" className="text-sm text-wine/65" animate={reduceMotion ? undefined : { rotate: [0, 90, 180, 270, 360] }} transition={{ duration: 18, repeat: Infinity, ease: "linear" }}>✦</motion.span>
            <p className="text-center font-serif text-sm italic text-wine/80 sm:text-base">A little more about the day</p>
            <motion.span aria-hidden="true" className="text-sm text-wine/65" animate={reduceMotion ? undefined : { rotate: [360, 270, 180, 90, 0] }} transition={{ duration: 18, repeat: Infinity, ease: "linear" }}>✦</motion.span>
            <span aria-hidden="true" className="h-px w-7 bg-gradient-to-l from-transparent to-wine/45 sm:w-10" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
            {PROGRAM_HIGHLIGHTS.map((moment, i) => (
              <motion.article
                key={moment.title}
                initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.18 }}
                transition={{ duration: 0.55, ease: EASE_OUT, delay: reduceMotion ? 0 : i * 0.12 }}
                whileHover={reduceMotion ? undefined : { y: -4 }}
                className={`paper-card relative overflow-hidden rounded-xl border border-taupe/20 p-3 shadow-[0_2px_3px_rgba(61,47,38,.1),0_14px_24px_-18px_rgba(61,47,38,.4)] sm:p-4 ${i === 2 ? "col-span-2 md:col-span-1" : ""}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span style={{ clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%)" }} className="inline-flex bg-wine py-1 pl-2.5 pr-4 font-serif text-[10px] font-semibold tabular-nums text-lace sm:text-xs">{moment.time}</span>
                  <motion.span
                    aria-hidden="true"
                    animate={reduceMotion ? undefined : { rotate: [0, 3, 0, -3, 0] }}
                    transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: i * 0.35 }}
                    className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-[#F8F2E7] bg-[#EFE3D4] text-wine shadow-[0_2px_6px_rgba(61,47,38,.14)] [&>svg]:!h-5 [&>svg]:!w-5"
                  >
                    <ProgramIcon title={moment.title} />
                    <span className="absolute -bottom-1 -right-1 grid h-4 w-4 place-items-center rounded-full border border-[#F8F2E7] bg-wine font-serif text-[8px] leading-none text-lace">{i + 1}</span>
                  </motion.span>
                </div>
                <h3 className="relative mt-2 pr-1 font-serif text-sm leading-tight text-mocha sm:text-base">{moment.title}</h3>
                <p className="mt-2 font-serif text-xs leading-[1.35] text-mocha/85 sm:text-sm">{moment.detail}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────── VENUE ─────────── */
export function Venue({ info }: { info: WeddingInfo }) {
  return (
    <section id="venue" className="sec">
      <Title kicker="Where" title="The Venue" />
      <div className="col-wide mt-head grid items-center gap-6 md:grid-cols-[.95fr_1.05fr] md:gap-10">
        <Reveal className="text-center md:text-left">
          <h3 className="caps text-mocha text-display">{info.venue_name}</h3>
          <p className="font-serif italic text-taupe text-body mt-3">{info.venue_address}</p>
          <p className="font-serif text-mocha text-body mt-4">{longDate(info.date)}</p>
          <a href={info.venue_map_link} target="_blank" rel="noreferrer" className="micro inline-flex items-center gap-2 mt-6 text-lace bg-wine rounded-full px-7 py-3.5 shadow-[0_8px_20px_-8px_rgba(110,31,46,.55)] hover:bg-mocha transition-colors">
            Get Directions <span aria-hidden="true">↗</span>
          </a>
        </Reveal>
        <Reveal delay={0.1} className="mx-auto w-full max-w-[390px] sm:max-w-[420px] md:max-w-[520px]">
          <Tilt max={3}>
            <div className="relative paper-card p-2 sm:p-3 shadow-[0_2px_3px_rgba(61,47,38,.15),0_18px_36px_-24px_rgba(61,47,38,.5)]">
              {/* Smaller lace edges keep the map framed without covering much of it. */}
              <div aria-hidden className="lace-trim absolute z-[6] -top-2 md:-top-3 -inset-x-1" style={{ transform: "scaleY(-1)", height: "clamp(30px, 5vw, 48px)" }} />
              <div aria-hidden className="lace-trim lace-trim-bottom absolute z-[6] -bottom-2 md:-bottom-3 -inset-x-1" style={{ height: "clamp(30px, 5vw, 48px)" }} />
              <Corners className="w-10 h-10 md:w-14 md:h-14" inset="0" />
              <VenueMapPreview />
              <p className="micro mt-2 text-center text-taupe/80">Damistan map preview · live directions above</p>
            </div>
          </Tilt>
        </Reveal>
      </div>
    </section>
  );
}

/* ─────────── ATTIRE ─────────── */
export function DressCode({ attire, info }: { attire: Attire[]; info: WeddingInfo }) {
  const sorted = [...attire].sort((a, b) => a.order - b.order);
  const guests = sorted.find((a) => a.group === "guests");
  const reserved = sorted.filter((a) => a.reserved);
  return (
    <section id="dress" className="sec">
      <Title kicker="What to Wear" title="Attire" />
      <AttireGuide guests={guests} couple={`${info.bride} & ${info.groom}`} date={longDate(info.date)} reserved={reserved} />
      <div className="col-wide mt-10 md:mt-12">
        <p className="micro text-taupe text-center mb-6 text-balance">Reserved for the couple, family &amp; entourage — kindly avoid</p>
        {/* two columns on phones (the odd last card spans both, so there's no orphan), three rows of two on wide screens */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 max-w-3xl mx-auto">
          {reserved.map((a) => (
            <div key={a.id} className="paper-card relative p-4 md:p-5 text-center border border-taupe/20 shadow-[0_2px_2px_rgba(61,47,38,.1),0_16px_24px_-14px_rgba(61,47,38,.4)] max-lg:[&:last-child:nth-child(odd)]:col-span-2 [@media(hover:hover)]:hover:-translate-y-1 transition-transform duration-500">
              <div className="flex justify-center -space-x-2 mb-3">
                {a.colors.map((c) => <GemDot key={c.name} name={c.name} hex={c.hex} kind={a.group === "bride" ? "pearl" : a.group === "groom" ? "onyx" : a.group === "groomsmen" ? "geode" : "gem"} className="w-8 h-8 md:w-9 md:h-9" />)}
              </div>
              <p className="font-serif text-body text-mocha text-balance">{a.label}</p>
              <p className="font-serif italic text-fine text-taupe mt-1">{a.colors.map((c) => c.name).join(", ")}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────── ENTOURAGE ─────────── */
export function Entourage({ people }: { people: EntourageMember[] }) {
  const reduceMotion = useReducedMotion();
  const sorted = [...people].sort((a, b) => a.order - b.order);
  const by = (r: EntourageMember["role"]) => sorted.filter((p) => p.role === r);
  // Two columns everywhere — his side left, her side right — so neither family reads as "first".
  const bride = by("bride_family"), groom = by("groom_family");
  const sponsors = by("sponsor");
  const bestMan = by("best_man"), maidOfHonor = by("maid_of_honor");
  const groomsmen = by("groomsman"), bridesmaids = by("bridesmaid");
  const ringBearer = by("ring_bearer"), flowerGirl = by("flower_girl");
  const honoured = by("honored_guest");
  const others = by("other");
  const half = Math.ceil(sponsors.length / 2);
  const honouredHalf = Math.ceil(honoured.length / 2);
  const Person = ({ p, index }: { p: EntourageMember; index: number }) => (
    <motion.li
      initial={reduceMotion ? false : { opacity: 0, y: 7 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.75 }}
      transition={{ duration: 0.45, ease: EASE_OUT, delay: reduceMotion ? 0 : Math.min(index, 5) * 0.055 }}
      whileHover={reduceMotion ? undefined : { y: -1 }}
      className="group"
    >
      <p className="font-serif text-[16px] leading-tight text-ink text-balance transition-colors duration-300 group-hover:text-wine sm:text-[18px] md:text-[19px]">{p.name}</p>
      {p.title && <p className="mt-0.5 font-serif text-[12px] leading-snug italic text-taupe sm:text-[13px] md:text-[14px]">{p.title}</p>}
    </motion.li>
  );
  const List = ({ list, className = "" }: { list: EntourageMember[]; className?: string }) => (
    <ul className={`space-y-2 ${className}`}>{list.map((p, index) => <Person key={p.id} p={p} index={index} />)}</ul>
  );
  const GroupLabel = ({ children }: { children: string }) => (
    <p className="micro mb-2 text-center text-[10px] tracking-[.16em] text-wine sm:mb-2.5 sm:text-[11px]">{children}</p>
  );
  const Divider = () => (
    <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 bottom-0 z-0 flex -translate-x-1/2 flex-col items-center">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, scaleY: 0.2 }}
        whileInView={{ opacity: 1, scaleY: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.65, ease: EASE_OUT }}
        className="w-px flex-1 origin-top bg-taupe/30"
      />
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.55, ease: EASE_OUT, delay: reduceMotion ? 0 : 0.12 }}
        className="my-1.5"
      >
        <Paisley className="h-9 w-7 text-wine/65 md:h-11 md:w-8" />
      </motion.div>
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, scaleY: 0.2 }}
        whileInView={{ opacity: 1, scaleY: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.65, ease: EASE_OUT, delay: reduceMotion ? 0 : 0.08 }}
        className="w-px flex-1 origin-bottom bg-taupe/30"
      />
    </div>
  );
  return (
    <section id="family" className="sec !py-6 md:!py-12">
      <Reveal className="text-center">
        <p className="micro text-[10px] tracking-[.2em] text-taupe sm:text-[11px]">The Hearts Behind Us</p>
        <h2 className="script mt-1 text-[clamp(1.9rem,5.2vw,2.75rem)] leading-none text-wine text-balance">Our Families</h2>
        <Flourish className="mx-auto mt-1 w-36 text-taupe/70 sm:w-44" />
      </Reveal>
      {(bride.length > 0 || groom.length > 0) && (
        <Reveal className="col-wide mt-5 sm:mt-6">
          <p className="font-serif text-center text-[15px] leading-snug italic text-mocha text-balance sm:text-[17px] md:text-lg">With grateful hearts and the blessing of our parents</p>
          <div className="relative mt-5 grid grid-cols-2 gap-x-4 gap-y-4 text-center sm:mt-6 md:mt-5 md:gap-0">
            <Divider />
            <div className="min-w-0 px-1 sm:px-3 md:px-10">
              <GroupLabel>{entourageHeading("groom_family")}</GroupLabel>
              <List list={groom} />
            </div>
            <div className="min-w-0 px-1 sm:px-3 md:px-10">
              <GroupLabel>{entourageHeading("bride_family")}</GroupLabel>
              <List list={bride} />
            </div>
          </div>
        </Reveal>
      )}
      <Flourish className="mx-auto mt-6 w-40 text-taupe/65 sm:mt-7 md:mt-8 md:w-48" />
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.7 }}
        transition={{ duration: 0.65, ease: EASE_OUT }}
        className="mt-3 text-center sm:mt-4"
      >
        <p className="micro text-[10px] tracking-[.2em] text-taupe sm:text-[11px]">Standing with us</p>
        <h3 className="script mt-0.5 text-[clamp(1.9rem,4.8vw,2.65rem)] leading-none text-wine">Entourage</h3>
        <div aria-hidden className="mt-2 flex items-center justify-center gap-2.5 text-wine/60">
          <span className="h-px w-7 bg-taupe/35 sm:w-9" />
          <motion.span
            animate={reduceMotion ? undefined : { opacity: [0.45, 1, 0.45], rotate: [0, 24, 0], scale: [0.9, 1.08, 0.9] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
            className="text-[11px]"
          >✦</motion.span>
          <span className="h-px w-7 bg-taupe/35 sm:w-9" />
        </div>
      </motion.div>
      <div className="col-wide mt-5 space-y-6 text-center sm:mt-6 sm:space-y-7">
        {sponsors.length > 0 && (
          <Reveal>
            <GroupLabel>{entourageHeading("sponsor")}</GroupLabel>
            {sponsors.length === 1 ? (
              <List list={sponsors} className="mx-auto max-w-sm" />
            ) : (
              <div className="relative grid grid-cols-2 gap-x-4 gap-y-3 md:gap-0">
                <Divider />
                <div className="min-w-0 px-1 sm:px-3 md:px-10"><List list={sponsors.slice(0, half)} /></div>
                <div className="min-w-0 px-1 sm:px-3 md:px-10"><List list={sponsors.slice(half)} /></div>
              </div>
            )}
          </Reveal>
        )}
        {(bestMan.length > 0 || maidOfHonor.length > 0 || groomsmen.length > 0 || bridesmaids.length > 0) && (
          <Reveal>
            <div className="relative grid grid-cols-2 gap-x-4 gap-y-4 md:gap-0">
              <Divider />
              <div className="min-w-0 space-y-6 px-1 sm:px-3 md:space-y-7 md:px-10">
                {bestMan.length > 0 && (
                  <div>
                    <GroupLabel>{entourageHeading("best_man")}</GroupLabel>
                    <List list={bestMan} />
                  </div>
                )}
                {groomsmen.length > 0 && (
                  <div>
                    <GroupLabel>{entourageHeading("groomsman")}</GroupLabel>
                    <List list={groomsmen} />
                  </div>
                )}
              </div>
              <div className="min-w-0 space-y-6 px-1 sm:px-3 md:space-y-7 md:px-10">
                {maidOfHonor.length > 0 && (
                  <div>
                    <GroupLabel>{entourageHeading("maid_of_honor")}</GroupLabel>
                    <List list={maidOfHonor} />
                  </div>
                )}
                {bridesmaids.length > 0 && (
                  <div>
                    <GroupLabel>{entourageHeading("bridesmaid")}</GroupLabel>
                    <List list={bridesmaids} />
                  </div>
                )}
              </div>
            </div>
          </Reveal>
        )}
        {(ringBearer.length > 0 || flowerGirl.length > 0) && (
          <Reveal>
            <div className="relative grid grid-cols-2 gap-x-4 gap-y-3 md:gap-0">
              <Divider />
              <div className="min-w-0 px-1 sm:px-3 md:px-10">
                <GroupLabel>{entourageHeading("ring_bearer")}</GroupLabel>
                <List list={ringBearer} />
              </div>
              <div className="min-w-0 px-1 sm:px-3 md:px-10">
                <GroupLabel>{entourageHeading("flower_girl")}</GroupLabel>
                <List list={flowerGirl} />
              </div>
            </div>
          </Reveal>
        )}
        {honoured.length > 0 && (
          <Reveal>
            <GroupLabel>{entourageHeading("honored_guest")}</GroupLabel>
            {honoured.length === 1 ? (
              <List list={honoured} className="mx-auto max-w-sm" />
            ) : (
              <div className="relative mx-auto grid max-w-3xl grid-cols-2 gap-x-4 gap-y-3 md:gap-0">
                <Divider />
                <div className="min-w-0 px-1 sm:px-3 md:px-10"><List list={honoured.slice(0, honouredHalf)} /></div>
                <div className="min-w-0 px-1 sm:px-3 md:px-10"><List list={honoured.slice(honouredHalf)} /></div>
              </div>
            )}
          </Reveal>
        )}
        {others.length > 0 && (
          <Reveal>
            <GroupLabel>{entourageHeading("other")}</GroupLabel>
            <List list={others} className="mx-auto max-w-sm" />
          </Reveal>
        )}
      </div>
    </section>
  );
}

/* ─────────── FOLLOW & TAG ─────────── */
/**
 * "Come follow us, and tag your moments." Hidden until the couple fills in an Instagram handle
 * in the binder (Details → Social), so the site never links to an account that doesn't exist
 * yet — fill the handle in and the whole section appears, no deploy needed.
 */
export function FollowAndTag({ info }: { info: WeddingInfo }) {
  const reduceMotion = useReducedMotion();
  const handle = (info.instagram || "").replace(/^@/, "").trim();
  if (!handle) return null;
  const tags = (info.hashtags || []).filter(Boolean);
  const photos = (info.gallery || []).filter(Boolean);
  const firstPhoto = info.cover_photo || photos[0] || BAKED_COVER;
  const secondPhoto = photos.find((photo) => photo !== firstPhoto) || "/img/banners-js.png";
  const thirdPhoto = photos.find((photo) => photo !== firstPhoto && photo !== secondPhoto);
  const tiles: { src?: string; label: string; note?: string }[] = [
    { src: firstPhoto, label: "our story so far" },
    { src: secondPhoto, label: "counting down" },
    thirdPhoto ? { src: thirdPhoto, label: "little moments" } : { label: "your turn", note: tags[0] || "11.11.2026" },
  ];
  const note = info.instagram_note?.trim() || "Follow for the countdown, behind-the-scenes peeks and all the wedding-day joy.";
  return (
    <section className="sec-sm">
      <Reveal className="col text-center">
        <p className="micro text-taupe">The happy bits before “I do”</p>
        <h2 className="script text-wine text-script mt-2 text-balance">Follow our story</h2>
        <Flourish className="w-44 mx-auto mt-2 text-taupe/70" />
        <p className="font-serif italic text-body text-mocha mt-4 max-w-xl mx-auto text-balance line-clamp-3">
          {note}
        </p>

        <div className="mx-auto mt-6 max-w-xl rounded-[22px] border border-taupe/25 bg-[#FCFAF6] p-3 md:p-4 shadow-[0_12px_30px_-18px_rgba(61,47,38,.45)]">
          <div className="flex items-center gap-2.5 px-1">
            <div className="w-9 h-9 rounded-full bg-[linear-gradient(135deg,#D9B56D,#9B4A67,#66508B)] p-[2px] shrink-0">
              <div className="w-full h-full rounded-full bg-[#FBF8F2] grid place-items-center script text-wine text-[17px] leading-none">J&amp;S</div>
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="micro text-mocha leading-tight truncate">@{handle}</p>
              <p className="font-serif italic text-taupe text-sm mt-0.5 truncate">countdown to 11.11.2026</p>
            </div>
            <svg viewBox="0 0 24 24" aria-hidden fill="none" className="w-5 h-5 shrink-0 text-wine" stroke="currentColor" strokeWidth="1.6">
              <rect x="3.25" y="3.25" width="17.5" height="17.5" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.7" cy="6.4" r=".9" fill="currentColor" stroke="none" />
            </svg>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-3">
            {tiles.map((tile, index) => (
              <motion.figure key={tile.label} initial={reduceMotion ? false : { opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.8 }}
                transition={{ delay: index * 0.08, duration: 0.4 }} className="min-w-0">
                {tile.src ? (
                  <div className="aspect-square overflow-hidden rounded-lg bg-oat">
                    <img src={tile.src} alt="" loading="lazy" draggable={false} className="w-full h-full object-cover [filter:sepia(.08)_saturate(.94)] transition-transform duration-500 hover:scale-105" />
                  </div>
                ) : (
                  <div className="aspect-square rounded-lg border border-wine/15 bg-[linear-gradient(145deg,#EFE3D3,#FBF8F2)] flex flex-col items-center justify-center px-2 text-center">
                    <span aria-hidden className="script text-wine text-[27px] leading-none">♡</span>
                    <span className="script text-wine text-[19px] leading-none mt-1">your turn</span>
                    <span className="micro text-taupe text-[9px] mt-2 truncate max-w-full">{tile.note}</span>
                  </div>
                )}
                <figcaption className="font-serif italic text-taupe text-[12px] md:text-sm truncate mt-1.5">{tile.label}</figcaption>
              </motion.figure>
            ))}
          </div>

          <div className="flex items-center justify-between gap-3 mt-3 px-1">
            <div className="flex items-center gap-1.5" aria-hidden>
              <span className="w-2 h-2 rounded-full bg-wine" />
              <span className="w-1.5 h-1.5 rounded-full bg-taupe/35" />
              <span className="w-1.5 h-1.5 rounded-full bg-taupe/35" />
            </div>
            <p className="micro text-taupe/80 text-right">countdown · behind the scenes · celebration</p>
          </div>
        </div>

        <a href={`https://instagram.com/${handle}`} target="_blank" rel="noreferrer"
          aria-label={`Follow @${handle} on Instagram in a new tab`}
          className="micro inline-flex items-center justify-center gap-3 mt-5 bg-wine text-lace rounded-full px-6 py-3.5 shadow-[0_8px_20px_-7px_rgba(110,31,46,.48)] hover:bg-mocha hover:-translate-y-0.5 transition-all">
          <svg viewBox="0 0 24 24" aria-hidden fill="none" className="w-5 h-5 shrink-0" stroke="currentColor" strokeWidth="1.7">
            <rect x="3.25" y="3.25" width="17.5" height="17.5" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.7" cy="6.4" r=".9" fill="currentColor" stroke="none" />
          </svg>
          <span className="flex flex-col items-start leading-tight">
            <span>Follow @{handle}</span>
            <span className="font-serif normal-case tracking-normal text-[12px] opacity-85 mt-0.5">for the fun</span>
          </span>
          <span aria-hidden className="text-lg leading-none">↗</span>
        </a>
        <p className="micro text-taupe/75 mt-2">Tag your photos and help us keep the joy.</p>

        {tags.length > 0 && (
          <div className="mt-5">
            <div className="flex flex-wrap justify-center gap-2">
              {tags.map((tag) => (
                <a key={tag} href={`https://instagram.com/explore/tags/${tag.replace("#", "")}`} target="_blank" rel="noreferrer"
                  className="font-serif text-fine text-wine border border-wine/25 rounded-full px-3.5 py-1 hover:bg-wine hover:text-lace transition-colors">{tag}</a>
              ))}
            </div>
            <p className="micro text-taupe/70 mt-2">Tap a tag to see everyone’s photos.</p>
          </div>
        )}
      </Reveal>
    </section>
  );
}

/* ─────────── RSVP (reply card) ─────────── */
/**
 * The "Save your invitation card" offer — one tap draws a personal keepsake PNG in the guest's own
 * browser (their name, seats, time, venue, programme, dress code) and saves it to their phone.
 */
function KeepsakeOffer({ onBuild }: { onBuild: () => Promise<unknown> }) {
  const [busy, setBusy] = useState<"idle" | "working" | "done">("idle");
  return (
    <div className="mt-8 text-center">
      <motion.button type="button" whileTap={{ scale: 0.97 }} disabled={busy === "working"}
        onClick={async () => { setBusy("working"); await onBuild().catch(() => {}); setBusy("done"); }}
        className="micro bg-wine text-lace rounded-full px-8 md:px-10 py-4 shadow-[0_8px_20px_-6px_rgba(110,31,46,.6)] hover:bg-mocha transition-colors disabled:opacity-60">
        {busy === "working" ? "Drawing your card…" : busy === "done" ? "Saved to your device ✓" : "Save your invitation card"}
      </motion.button>
      <p className="micro text-taupe/80 mt-3 tracking-[0.14em] text-balance">your seats, the time, the venue & the dress code — in one picture for your phone</p>
    </div>
  );
}

export function Rsvp({ info, invite, code, onReplied, schedule, dressNote }: { info: WeddingInfo; invite: InviteState; code: string; onReplied: () => void; schedule: ScheduleItem[]; dressNote: string }) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [err, setErr] = useState("");
  const [approved, setApproved] = useState<boolean | null>(null);
  const [f, setF] = useState({ name: invite.name, phone: "", attending: "yes" as "yes" | "no", pax: 1, dietary: "", message: "", song_request: "", plus_one: "" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const seatCap = invite.pax || 1;
  /** The couple's label for this link — shown, never typed into the guest's name field. */
  const household = invite.label || invite.name;
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.name.trim()) return;
    if (f.attending === "yes" && f.pax === 2 && !f.plus_one.trim()) { setErr("Please add your plus-one's name so we can save their seat."); return; }
    setErr("");
    setState("sending");
    try {
      const res = await submitRsvp({ ...f, pax: f.attending === "no" ? 0 : f.pax, code: code || undefined });
      if (res.already) { onReplied(); setErr("This invitation link has already replied — your confirmation is sealed below."); setState("idle"); return; }
      setApproved(res.approved);
      setState("done");
      onReplied();
    }
    catch (e) { setErr((e as Error).message); setState("error"); }
  }
  const deadline = new Date(`${info.rsvp_deadline || "2026-10-25"}T23:59:00+03:00`);
  const deadlineText = deadline.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Bahrain" });
  const daysLeft = Math.max(0, Math.ceil((deadline.getTime() - Date.now()) / 86400000));
  useEffect(() => { if (state === "done") try { localStorage.setItem("jsos:rsvped", "1"); window.dispatchEvent(new Event("rsvped")); } catch {} }, [state]);
  const choice = (on: boolean) => `font-serif text-body px-6 py-2 rounded-full border transition-colors ${on ? "bg-wine text-lace border-wine" : "border-taupe/40 text-mocha hover:border-wine"}`;
  /** Prompt the keepsake card for this guest — personal PNG with their seats and the day in short. */
  const makeKeepsake = (guestName: string, plusOne?: string) =>
    downloadKeepsake({
      groom: info.groom, bride: info.bride,
      guestName, plusOne: plusOne || undefined,
      dateISO: info.date, venue: info.venue_name, address: info.venue_address,
      program: [...schedule].sort((a, b) => a.order - b.order).map((s) => ({ time: s.time, title: s.title })),
      dressNote: dressNote || "Black tie — details live in the attire guide",
      hashtags: info.hashtags,
      photo: info.cover_photo || info.gallery[0] || BAKED_COVER,
    });
  // the wax seal pops half above the card — leave it its own room so it never sits on the text (mobile)
  const cardGap = "col mt-16 md:mt-20";

  /* ── a burned link: greet the guest, seal the reply ── */
  const reply = invite.reply;
  if (reply && state !== "done") {
    const first = reply.name.split(" ")[0];
    const yes = reply.attending === "yes";
    return (
      <section id="rsvp" className="sec">
        <div className="text-center">
          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1, ease: EASE }}
            className="inline-block bg-moss text-lace px-8 md:px-12 py-2.5 [clip-path:polygon(0_0,100%_0,96%_50%,100%_100%,0_100%,4%_50%)] shadow-[0_6px_14px_rgba(61,72,42,.3)]">
            <span className="micro">Your reply is sealed</span>
          </motion.div>
          <h2 className="script text-wine text-script mt-4 text-balance">{yes ? `Welcome, ${first}` : `Thank you, ${first}`}</h2>
          <p className="micro text-taupe mt-1">{household ? `${household} · ` : ""}{yes ? `${reply.pax} seat${reply.pax > 1 ? "s" : ""} saved` : "declined with love"}</p>
        </div>
        <div className={cardGap}>
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: EASE_OUT }} className="relative">
            <motion.div initial={{ scale: 1.6, opacity: 0, rotate: -24 }} animate={{ scale: 1, opacity: 1, rotate: -10 }} transition={{ delay: 0.45, duration: 0.6, ease: EASE_OUT }}
              className="absolute z-20 -top-12 md:-top-14 left-1/2 -ml-12 md:-ml-14 w-24 h-24 md:w-28 md:h-28">
              <img src="/img/seal.webp" alt="" className="absolute inset-0 w-full h-full object-contain drop-shadow-[0_8px_8px_rgba(61,47,38,.45)]" />
              <span className="absolute inset-0 grid place-items-center font-serif font-semibold text-[#F3DCD8] text-lg md:text-xl tracking-[0.12em] [text-shadow:0_1px_1px_rgba(0,0,0,.45)]">RSVP</span>
            </motion.div>
            <div className="relative">
              <LaceEdge color="#FCFAF5" flip />
              <div className="paper-card relative px-6 md:px-14 pt-12 pb-12 md:pt-16 md:pb-16 shadow-[0_2px_3px_rgba(61,47,38,.15),0_40px_80px_-40px_rgba(61,47,38,.55)] min-h-[520px] text-center">
                <div className="absolute inset-3 border border-taupe/30 pointer-events-none" />
                <Corners className="w-16 h-16 md:w-28 md:h-28" inset="0.25rem" />
                <p className="micro text-taupe tracking-[0.18em]">11 . 11 . 2026 · Bahrain</p>
                {yes && reply.plus_one && <p className="font-serif italic text-body text-mocha mt-5 text-balance">A seat is saved for <b className="font-semibold text-wine">{reply.plus_one}</b> beside you.</p>}
                <p className="font-serif italic text-body text-mocha mt-5 text-balance">
                  {yes
                    ? reply.approved === false
                      ? "Your reply is in — we're confirming your plus-one personally, and then your seats are sealed. Keep an eye on your messages."
                      : "Your seats are confirmed — we can't wait to celebrate with you. Come hungry, come ready to dance."
                    : "You'll be missed — thank you for letting us know early so we can plan our seats with love."}
                </p>
                {(reply.dietary || reply.song_request || reply.message) && (
                  <div className="mt-6 space-y-1.5 font-serif italic text-fine text-taupe">
                    {reply.dietary && <p>From the kitchen note: {reply.dietary}</p>}
                    {reply.song_request && <p>On the dance floor for you: {reply.song_request}</p>}
                    {reply.message && <p className="text-balance">“{reply.message}”</p>}
                  </div>
                )}
                <div className="mt-8 inline-block border-t border-dashed border-taupe/40 pt-5">
                  <p className="micro text-taupe tracking-[0.16em]">Questions? Check the FAQ below or message the couple directly</p>
                  {invite.demo && (
                    <button type="button" onClick={() => { try { localStorage.removeItem("jsos:demo-reply"); } catch {} onReplied(); }}
                      className="micro text-wine underline underline-offset-4 block mx-auto mt-4 tracking-[0.16em] hover:text-mocha">
                      Demo reply — stored only in this browser · test again
                    </button>
                  )}
                </div>
                {yes && <KeepsakeOffer onBuild={() => makeKeepsake(reply.name, reply.plus_one || undefined)} />}
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

  /* ── a fresh personal link: the reply form ── */
  return (
    <section id="rsvp" className="sec">
      <Reveal className="text-center">
        <motion.div initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 1, ease: EASE }}
          className="inline-block bg-wine text-lace px-8 md:px-12 py-2.5 [clip-path:polygon(0_0,100%_0,96%_50%,100%_100%,0_100%,4%_50%)] shadow-[0_6px_14px_rgba(110,31,46,.3)]">
          <span className="micro">Your reply is needed</span>
        </motion.div>
        <h2 className="script text-wine text-script mt-4 text-balance">Kindly Reply</h2>
        <p className="micro text-taupe mt-1">Répondez s&apos;il vous plaît</p>
        <p className="font-serif text-mocha text-lead mt-5 text-balance">Please reply by <b className="text-wine font-semibold">{deadlineText}</b></p>
        {daysLeft > 0 ? (
          <p className="inline-flex items-baseline gap-2 mt-3 font-serif text-wine">
            <span className="text-display font-medium tabular-nums lining-nums">{daysLeft}</span><span className="micro">day{daysLeft === 1 ? "" : "s"} left to reply</span>
          </p>
        ) : <p className="micro text-wine mt-3">The deadline has passed — please message us directly</p>}
      </Reveal>
      <div className={cardGap}>
        <motion.div {...rise(0, 40)} className="relative">
          {state !== "done" && (
            <div aria-hidden className="absolute -inset-2 md:-inset-3 rounded-[6px] border border-wine/35 pointer-events-none" />
          )}
          <motion.div initial={{ scale: 1.6, opacity: 0, rotate: -24 }} whileInView={{ scale: 1, opacity: 1, rotate: -10 }} viewport={{ once: true, margin: "-8%" }} transition={{ delay: 0.45, duration: 0.6, ease: EASE_OUT }}
            className="absolute z-20 -top-12 md:-top-14 left-1/2 -ml-12 md:-ml-14 w-24 h-24 md:w-28 md:h-28">
            <img src="/img/seal.webp" alt="" className="absolute inset-0 w-full h-full object-contain drop-shadow-[0_8px_8px_rgba(61,47,38,.45)]" />
            <span className="absolute inset-0 grid place-items-center font-serif font-semibold text-[#F3DCD8] text-lg md:text-xl tracking-[0.12em] [text-shadow:0_1px_1px_rgba(0,0,0,.45)]">RSVP</span>
          </motion.div>
          <div className="relative">
            <LaceEdge color="#FCFAF5" flip />
          <div className="paper-card relative px-5 md:px-14 pt-10 pb-10 md:pt-14 md:pb-14 shadow-[0_2px_3px_rgba(61,47,38,.15),0_40px_80px_-40px_rgba(61,47,38,.55)] min-h-[520px]">
            <div className="absolute inset-3 border border-taupe/30 pointer-events-none" />
            <Corners className="w-16 h-16 md:w-28 md:h-28" inset="0.25rem" />
            <AnimatePresence mode="wait">
              {state === "done" ? (
                <motion.div key="ok" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease: EASE }} className="text-center py-12">
                  <motion.img src="/img/seal.webp" alt="" initial={{ scale: 1.8, opacity: 0, rotate: -24 }} animate={{ scale: 1, opacity: 1, rotate: -8 }} transition={{ delay: 0.2, duration: 0.7, ease: EASE_OUT }} className="mx-auto w-24 h-24 md:w-28 md:h-28 object-contain drop-shadow-[0_8px_10px_rgba(61,47,38,.45)]" />
                  <h3 className="script text-wine text-script mt-6 text-balance">Wish granted</h3>
                  <p className="micro text-taupe mt-4">{info.hashtags[0] ?? "#JSGotMarried"}</p>
                  <p className="font-serif italic text-body text-mocha mt-5 text-balance">{f.attending === "yes" ? `We can't wait to celebrate with you, ${f.name.split(" ")[0]}.` : `You'll be missed, ${f.name.split(" ")[0]}. Thank you for letting us know.`}</p>
                  <p className="micro text-taupe mt-4 tracking-[0.16em]">{approved === true ? "Confirmed with your invitation — see you on the 11th!" : approved === false ? (f.pax === 2 ? "Reply received — the couple will confirm your plus-one personally." : "Reply received — it's waiting in the couple's review queue.") : ""}</p>
                  <p className="micro text-taupe mt-2 tracking-[0.16em]">Reopen this link any time — your reply will be waiting here</p>
                  {f.attending === "yes" && <KeepsakeOffer onBuild={() => makeKeepsake(f.name, f.plus_one || undefined)} />}
                </motion.div>
              ) : (
                <motion.form key="form" onSubmit={submit} exit={{ opacity: 0 }} className="relative space-y-4 text-center sm:space-y-5">
                  <p className="micro text-moss tracking-[0.18em]">Invitation{household ? ` — ${household}` : ""} · up to {seatCap} seat{seatCap > 1 ? "s" : ""}</p>
                  <p className="font-serif italic text-body text-mocha text-balance">Fill this in now — it takes less than a minute.</p>
                  <input className="field !py-2 text-center" placeholder="Your full name" required value={f.name} onChange={set("name")} maxLength={120} />
                  <input className="field !py-2 text-center" placeholder="WhatsApp number" type="tel" value={f.phone} onChange={set("phone")} maxLength={40} />
                  <div className="flex flex-wrap justify-center gap-2 pt-1 sm:gap-3 sm:pt-2">
                    <button type="button" className={choice(f.attending === "yes")} onClick={() => setF({ ...f, attending: "yes" })}>Joyfully accepts</button>
                    <button type="button" className={choice(f.attending === "no")} onClick={() => setF({ ...f, attending: "no" })}>Regretfully declines</button>
                  </div>
                  {f.attending === "yes" && (
                    <div className="flex justify-center items-center gap-2 sm:gap-3">
                      <span className="font-serif italic text-taupe text-body mr-1">Number of guests</span>
                      {[1, 2].map((n) => <button key={n} type="button" disabled={seatCap < n} className={choice(f.pax === n) + (seatCap < n ? " opacity-35 pointer-events-none" : "")} onClick={() => setF({ ...f, pax: n })}>{n}</button>)}
                    </div>
                  )}
                  {f.attending === "yes" && f.pax === 2 && (
                    <div className="space-y-1.5">
                      <input className="field !py-2 text-center" placeholder="Name of your plus-one" required value={f.plus_one} onChange={set("plus_one")} maxLength={120} />
                      <p className="micro text-taupe tracking-[0.14em]">Two seats always wait for the couple&apos;s personal confirmation</p>
                    </div>
                  )}
                  <input className="field !py-2 text-center" placeholder="Dietary requirements" value={f.dietary} onChange={set("dietary")} maxLength={200} />
                  <input className="field !py-2 text-center" placeholder="A song to get you dancing" value={f.song_request} onChange={set("song_request")} maxLength={200} />
                  <textarea className="field !py-2 text-center resize-none" rows={2} placeholder="A little note for the couple" value={f.message} onChange={set("message")} maxLength={1000} />
                  {err && <p className="text-wine text-fine text-balance">{err}</p>}
                  <motion.button disabled={state === "sending"} whileTap={{ scale: 0.97 }}
                    className="micro bg-wine text-lace rounded-full px-12 py-4 shadow-[0_8px_20px_-6px_rgba(110,31,46,.6)] hover:bg-mocha transition-colors disabled:opacity-50">
                    {state === "sending" ? "Sending…" : "Send My Reply"}
                  </motion.button>
                  <p className="micro text-taupe tracking-[0.14em]">This personal link replies once — afterwards it becomes your keepsake confirmation</p>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export function SignOff({ info }: { info: WeddingInfo }) {
  return (
    <section className="relative px-5 md:px-16 pt-4 pb-sec text-center md:text-right md:pr-24">
      <Reveal>
        <p className="font-serif italic text-lead text-mocha">With all our love,</p>
        <p className="script text-wine text-script mt-2 -rotate-2 text-balance">{info.groom} &amp; {info.bride}</p>
        <p className="micro text-taupe mt-5">{info.hashtags.join("  ")}</p>
      </Reveal>
    </section>
  );
}

export function FaqSection({ faqs }: { faqs: Faq[] }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <section id="faq" className="sec">
      <Title kicker="Good to Know" title="Questions" />
      <div className="col mt-head border-t border-taupe/30">
        {[...faqs].sort((a, b) => a.order - b.order).map((q) => (
          <div key={q.id} className="border-b border-taupe/30">
            <button onClick={() => setOpen(open === q.id ? null : q.id)} className="w-full flex justify-between items-center py-5 text-left gap-5">
              <span className="font-serif text-lead text-mocha">{q.question}</span>
              <motion.span animate={{ rotate: open === q.id ? 45 : 0 }} transition={{ duration: 0.4, ease: EASE }} className="text-wine text-h3 leading-none font-light">+</motion.span>
            </button>
            <AnimatePresence initial={false}>
              {open === q.id && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.45, ease: EASE }} className="overflow-hidden">
                  <p className="pb-6 font-serif italic text-body text-taupe">{q.answer}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─────────── GALLERY + FOOTER ─────────── */
/** Horizontal photobooth strip between sections — part of the letter design. */
export function Gallery({ info }: { info: WeddingInfo }) {
  return (
    <section className="sec-sm">
      <ScratchReveal hint="scratch to reveal our moments">
        <PhotoStrip horizontal photos={slots(info, 4, 4)} caption={`${info.groom.toUpperCase()} & ${info.bride.toUpperCase()} · ${fullDate(info.date)}`} rotate={-1.5} className="col" />
      </ScratchReveal>
    </section>
  );
}

/** A pair of polaroids tucked between sections on phones/tablets (on wide screens they sit on the letter's sides). */
export function PolaroidPair({ info, from, caps }: { info: WeddingInfo; from: number; caps: [string, string] }) {
  const [a, b] = slots(info, from, 2);
  return (
    <div className="xl:hidden flex justify-center gap-5 px-5 py-5">
      <Polaroid src={a} caption={caps[0]} rotate={-5} className="w-[44%] max-w-[200px]" />
      <Polaroid src={b} caption={caps[1]} rotate={4} className="w-[44%] max-w-[200px] mt-6" />
    </div>
  );
}

/* ─────────── COUNTING DOWN (the last beat before the footer) ─────────── */
/** `sealed` = the visitor hasn't unlocked anything yet, so the where stays off the page. */
export function CountdownSection({ info, sealed = false }: { info: WeddingInfo; sealed?: boolean }) {
  const cd = useCountdown(info.date);
  return (
    <section className="sec-sm text-center">
      <Reveal className="col">
        <p className="micro text-taupe">Counting the days until</p>
        <p className="script text-wine text-script-sm mt-2 text-balance">we say “I do”</p>
        <div className="flex justify-center gap-6 md:gap-12 mt-6 md:mt-8 font-serif text-ink">
          {([["Days", cd.days], ["Hours", cd.hours], ["Mins", cd.minutes], ["Secs", cd.seconds]] as const).map(([l, v]) => (
            <div key={l} className="flex flex-col items-center">
              <span className="text-h3 md:text-display font-medium leading-none tabular-nums lining-nums">{cd.ready ? String(v).padStart(2, "0") : "--"}</span>
              <span className="uppercase tracking-[0.18em] text-micro font-semibold text-mocha mt-2.5">{l}</span>
            </div>
          ))}
        </div>
        <p className="caps text-mocha text-body mt-6 text-balance">{longDate(info.date)}{!sealed && info.venue_name ? ` · ${info.venue_name}` : ""}</p>
      </Reveal>
    </section>
  );
}

export function Footer({ info }: { info: WeddingInfo }) {
  const handle = (info.instagram || "").replace(/^@/, "").trim();
  return (
    <footer className="relative px-5 pt-12 pb-10 text-center">
      <Flourish className="w-48 md:w-56 mx-auto text-taupe/70" />
      <p className="script text-wine text-script mt-6 text-balance">{info.groom} &amp; {info.bride}</p>
      <p className="font-serif font-light text-mocha text-display mt-3 tracking-[0.12em]">{fullDate(info.date)}</p>
      <div className="flex flex-col md:flex-row justify-center gap-2 md:gap-10 mt-8 micro text-taupe">
        {handle ? <a href={`https://instagram.com/${handle}`} target="_blank" rel="noreferrer" className="hover:text-wine">{info.instagram}</a> : null}
        {info.hashtags.length > 0 && <span className="text-wine">{info.hashtags.join("  ")}</span>}
      </div>
    </footer>
  );
}

/** Floating "RSVP" reminder: shows once the invitation is scrolled past, hides at the form and after replying. */
export function RsvpNudge({ info }: { info: WeddingInfo }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const check = () => {
      let done = false; try { done = localStorage.getItem("jsos:rsvped") === "1"; } catch {}
      const r = document.getElementById("rsvp")?.getBoundingClientRect();
      const atForm = r ? r.top < window.innerHeight * 0.8 && r.bottom > window.innerHeight * 0.2 : false;
      setShow(!done && window.scrollY > window.innerHeight * 1.1 && !atForm);
    };
    check(); window.addEventListener("scroll", check, { passive: true }); window.addEventListener("rsvped", check);
    return () => { window.removeEventListener("scroll", check); window.removeEventListener("rsvped", check); };
  }, []);
  const d = new Date(`${info.rsvp_deadline || "2026-10-25"}T12:00:00+03:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Asia/Bahrain" });
  return (
    <AnimatePresence>
      {show && (
        <motion.a href="#rsvp" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }} transition={{ duration: 0.5, ease: EASE_OUT }}
          className="fixed z-50 bottom-5 right-5 flex items-center gap-3 bg-wine text-lace rounded-full pl-2 pr-5 py-2 shadow-[0_10px_24px_-6px_rgba(110,31,46,.6)]">
          <span className="w-9 h-9 rounded-full bg-lace/15 grid place-items-center text-lg">✉</span>
          <span className="leading-tight"><span className="block micro">RSVP now</span><span className="block font-serif italic text-fine opacity-90">by {d}</span></span>
        </motion.a>
      )}
    </AnimatePresence>
  );
}
