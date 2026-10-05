"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  eventDateLong, eventDateShort, eventDay, eventMonth, eventTimeWords, googleCalendarUrl,
  suggestedCalendar, weddingEvent,
} from "@/lib/calendar";
import type { WeddingInfo } from "@/lib/types";
import { EASE_OUT } from "./fx";
import { Flourish } from "./ornaments";

/**
 * "Add to calendar" — the first thing a guest does after reading the 11.11 dedication: the whole
 * day, in their own calendar, in one tap. Apple, Google and Outlook are all served, and nothing is
 * uploaded anywhere: the `.ics` comes from this site's own /api/calendar (a real URL, so iOS Safari
 * hands it to Calendar), and the Google link only carries the event the invitation already shows.
 * The venue travels with the event only when the guest's code (or the couple's own view) has
 * unsealed it — a preview visitor saves the date, nothing more.
 */

/* ── glyphs ── */

/** The button's calendar: 11 November, with an unmissable little plus waiting to be pressed. */
function CalendarGlyph() {
  return (
    <svg viewBox="0 0 44 44" aria-hidden="true" className="h-full w-full drop-shadow-[0_2px_3px_rgba(0,0,0,.3)]">
      <rect x="3" y="7.5" width="38" height="33" rx="5.5" fill="#FCFAF5" stroke="#6E1F2E" strokeWidth="2.4" />
      <path d="M3 13.6V12A4.6 4.6 0 0 1 7.6 7.4h28.8A4.6 4.6 0 0 1 41 12v1.6Z" fill="#6E1F2E" />
      <path d="M13 4.6v5.6M31 4.6v5.6" stroke="#6E1F2E" strokeWidth="2.6" strokeLinecap="round" />
      <text x="21" y="34.5" textAnchor="middle" fontSize="16.5" fontWeight="600" fill="#6E1F2E" style={{ fontFamily: "var(--font-serif), Georgia, serif" }}>11</text>
      <path d="M31.5 29.2l1 2.3 2.3 1-2.3 1-1 2.3-1-2.3-2.3-1 2.3-1z" fill="#C8A468" />
    </svg>
  );
}

/** The Apple mark, for the row that hands the guest a calendar file. */
function AppleGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[18px] w-[18px] text-mocha">
      <path fill="currentColor" d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
    </svg>
  );
}

/** Google's four colours — instantly readable as "Google", which is what that row is. */
function GoogleGlyph() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className="h-[18px] w-[18px]">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

/* ── one line in the sheet ── */
/** The shell both rows wear; `href` makes it a real link (the .ics must be one for iOS), otherwise a button. */
const rowClass = "group relative flex w-full items-center gap-3.5 rounded-2xl border border-taupe/30 bg-[#FCFAF6] px-3.5 py-3 text-left shadow-[0_2px_3px_rgba(61,47,38,.08)] transition-colors hover:border-wine/45 hover:bg-lace focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine md:gap-4 md:px-4 md:py-3.5";
const rowMotion = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  whileHover: { y: -2 },
  whileTap: { scale: 0.985 },
};
function RowBody({ glyph, title, sub, tag }: { glyph: React.ReactNode; title: string; sub: string; tag?: string }) {
  return (
    <>
      <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-taupe/25 bg-ivory md:h-11 md:w-11">{glyph}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-serif text-[16px] leading-tight text-mocha md:text-[17px]">{title}</span>
        <span className="mt-0.5 block font-serif text-[12px] italic leading-snug text-taupe md:text-[13px]">{sub}</span>
      </span>
      {tag && <span className="micro shrink-0 rounded-full bg-wine/10 px-2 py-1 text-[9px] tracking-[.14em] text-wine">{tag}</span>}
      <span aria-hidden className="shrink-0 text-lg leading-none text-wine/70 transition-transform duration-300 group-hover:translate-x-0.5">↗</span>
    </>
  );
}
function OptionRow({ glyph, title, sub, tag, delay, href, onClick }: {
  glyph: React.ReactNode; title: string; sub: string; tag?: string; delay: number; href?: string; onClick?: () => void;
}) {
  const transition = { duration: 0.45, ease: EASE_OUT, delay };
  if (href) {
    return (
      <motion.a href={href} onClick={onClick} {...rowMotion} transition={transition} className={rowClass}>
        <RowBody glyph={glyph} title={title} sub={sub} tag={tag} />
      </motion.a>
    );
  }
  return (
    <motion.button
      type="button"
      onClick={onClick}
      {...rowMotion}
      transition={transition}
      className={rowClass}
    >
      <RowBody glyph={glyph} title={title} sub={sub} tag={tag} />
    </motion.button>
  );
}

/**
 * `sealed` = the guest has no unsealed invitation (the public preview): the venue is kept out of
 * the sheet and out of the Google link there. The .ics never guesses — it asks /api/calendar with
 * the guest's code and the server decides.
 */
export default function AddToCalendar({ info, code = "", sealed = false }: { info: WeddingInfo; code?: string; sealed?: boolean }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState<"apple" | "google" | null>(null);
  const [mounted, setMounted] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => setMounted(true), []);
  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  /** The sheet's own event card — the same day, drawn from the invitation, venue only if unsealed. */
  const event = useMemo(
    () => weddingEvent(sealed ? { ...info, venue_name: "", venue_address: "", venue_map_link: "" } : info),
    [info, sealed],
  );

  const close = useCallback(() => {
    setOpen(false);
    // hand the keyboard back to the button the guest came from, without yanking the page
    window.setTimeout(() => trigger.current?.focus({ preventScroll: true }), 0);
  }, []);

  /**
   * The .ics lives on the server (`/api/calendar`) rather than being built here as a blob: iOS
   * Safari opens a calendar *response* in Calendar, but silently refuses a file made in the page.
   * The guest's code rides along so the venue is in the event only once it has been unsealed.
   */
  const icsHref = `/api/calendar${code ? `?code=${encodeURIComponent(code)}` : ""}`;

  const later = (ms: number) => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => { setDone(null); close(); }, ms);
  };

  /** The Apple row is a plain link to the file — the browser (and iOS) takes it from there. */
  const addFile = () => { setDone("apple"); later(3000); };

  const addGoogle = () => {
    window.open(googleCalendarUrl(event), "_blank", "noopener,noreferrer");
    setDone("google");
    later(2200);
  };

  // Open: hold the page still behind the sheet, close on Escape, and put the focus on the panel.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    panel.current?.focus();
    return () => { document.body.style.overflow = previous; document.removeEventListener("keydown", onKey); };
  }, [open, close]);

  const suggestion = mounted ? suggestedCalendar() : "apple";

  return (
    <>
      <div className="no-print mt-7 text-center md:mt-9">
        <div className="relative inline-block">
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full border-2 border-wine/50 motion-reduce:hidden"
            animate={{ scale: [1, 1.16, 1.16], opacity: [0.5, 0, 0] }}
            transition={{ duration: 3.4, times: [0, 0.7, 1], repeat: Infinity, ease: "easeOut", repeatDelay: 0.6 }}
          />
          <motion.button
            ref={trigger}
            type="button"
            onClick={() => setOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={open}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.7 }}
            transition={{ duration: 0.5, ease: EASE_OUT }}
            className="group relative inline-flex max-w-full items-center gap-3 overflow-hidden rounded-full border-2 border-[#C8A468] bg-[linear-gradient(135deg,#8A2839_0%,#6E1F2E_46%,#531320_100%)] px-4 py-3 text-lace shadow-[0_14px_32px_-12px_rgba(110,31,46,.8),inset_0_1px_0_rgba(252,250,245,.18)] transition-transform duration-300 hover:-translate-y-0.5 active:scale-[.97] motion-reduce:transform-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-wine sm:gap-3.5 sm:px-5 sm:py-3.5 md:gap-5 md:px-8 md:py-4"
          >
            {/* a hairline of lace inside the gold rim — the same double border the page's buttons wear */}
            <span aria-hidden className="pointer-events-none absolute inset-[3px] rounded-full border border-lace/25" />
            {/* the shine that keeps catching the eye */}
            <motion.span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/4 -skew-x-12 bg-[linear-gradient(90deg,transparent,rgba(252,250,245,.45),transparent)] motion-reduce:hidden"
              animate={{ x: ["0%", "560%"] }}
              transition={{ duration: 2.2, ease: "easeInOut", repeat: Infinity, repeatDelay: 3.2 }}
            />
            <motion.span
              aria-hidden
              className="relative grid h-10 w-10 shrink-0 place-items-center sm:h-11 sm:w-11 md:h-[3.4rem] md:w-[3.4rem]"
              animate={{ y: [0, -2.5, 0], rotate: [0, -2, 0] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
            >
              <CalendarGlyph />
              <motion.span
                className="absolute -bottom-1 -right-1 grid h-[17px] w-[17px] place-items-center rounded-full border-2 border-lace bg-[#E8CE8C] text-[#4A1218] shadow-[0_1px_3px_rgba(0,0,0,.45)] sm:h-[18px] sm:w-[18px] md:h-5 md:w-5"
                animate={{ scale: [1, 1.18, 1] }}
                transition={{ duration: 1.7, repeat: Infinity, ease: "easeInOut" }}
              >
                <svg viewBox="0 0 12 12" aria-hidden className="h-2.5 w-2.5 md:h-3 md:w-3" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M6 2.1v7.8M2.1 6h7.8" /></svg>
              </motion.span>
            </motion.span>
            <span className="relative text-left">
              <span className="block whitespace-nowrap font-serif text-[13.5px] font-semibold uppercase leading-none tracking-[0.13em] sm:text-[15px] sm:tracking-[0.16em] md:text-[17px]">Add to Calendar</span>
              <span className="mt-1.5 block whitespace-nowrap font-serif text-[11.5px] italic leading-none text-lace/85 sm:text-[12px] md:text-[13px]">{eventDateShort(info.date)}</span>
            </span>
          </motion.button>
        </div>
        <p className="micro mt-3 px-4 text-taupe/80 tracking-[0.14em] text-balance">
          One tap · Apple Calendar · Google · Outlook
        </p>
      </div>

      {mounted && createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              key="add-to-calendar"
              className="fixed inset-0 z-[90] flex items-end justify-center pb-[env(safe-area-inset-bottom)] sm:items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28 }}
            >
              <button type="button" aria-label="Close the calendar options" onClick={close} className="absolute inset-0 cursor-default bg-ink/50 backdrop-blur-[3px]" />
              <motion.div
                ref={panel}
                role="dialog"
                aria-modal="true"
                aria-labelledby="atc-title"
                tabIndex={-1}
                initial={{ y: 64, scale: 0.97 }}
                animate={{ y: 0, scale: 1 }}
                exit={{ y: 48, scale: 0.98, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="relative z-10 m-3 w-full max-w-md outline-none sm:m-0 sm:max-w-[440px]"
              >
                <div className="paper-card relative overflow-hidden rounded-[22px] border border-taupe/30 px-5 pb-5 pt-6 shadow-[0_36px_70px_-30px_rgba(51,39,31,.8)] md:px-7 md:pb-6 md:pt-7">
                  <span aria-hidden className="absolute inset-x-0 top-0 h-1.5 bg-[linear-gradient(90deg,#6E1F2E,#C8A468,#6E1F2E)]" />
                  <button
                    type="button"
                    onClick={close}
                    aria-label="Close"
                    className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-taupe transition-colors hover:bg-wine/8 hover:text-wine"
                  >
                    <svg viewBox="0 0 20 20" aria-hidden className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M5 5l10 10M15 5L5 15" /></svg>
                  </button>

                  <p className="micro text-center text-taupe">11 · 11 · 2026</p>
                  <h2 id="atc-title" className="script mt-1 text-center text-[clamp(1.85rem,6.4vw,2.5rem)] leading-none text-wine">Save our date</h2>
                  <Flourish className="mx-auto mt-2 w-40 text-taupe/60" />

                  <div className="mt-4 flex items-center gap-3.5 rounded-2xl border border-taupe/25 bg-[linear-gradient(160deg,#FCFAF6,#F3E9DA)] p-3.5">
                    <span aria-hidden className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-wine text-lace shadow-[0_8px_18px_-8px_rgba(110,31,46,.8)]">
                      <span className="block font-serif text-[9px] uppercase leading-none tracking-[0.2em] text-lace/85">{eventMonth(info.date)}</span>
                      <span className="mt-1 block font-serif text-[24px] font-semibold leading-none tabular-nums">{eventDay(info.date)}</span>
                    </span>
                    <span className="min-w-0">
                      <span className="block font-serif text-[15.5px] leading-tight text-mocha md:text-[16.5px]">{info.groom} &amp; {info.bride} — Wedding Day</span>
                      <span className="mt-1 block font-serif text-[12.5px] italic leading-snug text-taupe">{eventDateLong(info.date)}</span>
                      <span className="block font-serif text-[12.5px] italic leading-snug text-taupe">
                        {eventTimeWords(info.date)} onwards{!sealed && info.venue_name ? ` · ${info.venue_name}` : ""}
                      </span>
                    </span>
                  </div>

                  <p className="micro mt-4 text-center text-taupe/85">Which calendar do you use?</p>
                  <div className="mt-2.5 space-y-2.5">
                    <OptionRow
                      glyph={<AppleGlyph />}
                      title="Apple Calendar"
                      sub="iPhone · iPad · Mac · Outlook"
                      tag={suggestion === "apple" ? "Suggested" : undefined}
                      delay={0.06}
                      href={icsHref}
                      onClick={addFile}
                    />
                    <OptionRow
                      glyph={<GoogleGlyph />}
                      title="Google Calendar"
                      sub="Android · Gmail · any browser"
                      tag={suggestion === "google" ? "Suggested" : undefined}
                      delay={0.14}
                      onClick={addGoogle}
                    />
                  </div>

                  <AnimatePresence mode="wait">
                    {done && (
                      <motion.p
                        key={done}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.35, ease: EASE_OUT }}
                        className="mt-3.5 text-center font-serif text-[13px] italic leading-snug text-moss"
                      >
                        {done === "google"
                          ? "Google Calendar is opening in a new tab — press Save ✓"
                          : suggestion === "apple"
                            ? "Your calendar is opening — press Add and it's saved ✓"
                            : "Saved to your downloads — open it and press Add ✓"}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <p className="micro mt-3 text-center text-[10px] leading-relaxed tracking-[0.14em] text-taupe/70 text-balance">
                    A reminder the day before comes with it — change it any time in your calendar
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
