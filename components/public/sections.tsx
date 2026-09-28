"use client";
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import { submitRsvp } from "@/lib/db";
import { useCountdown } from "@/lib/hooks";
import type { Attire, EntourageMember, Faq, ScheduleItem, WeddingInfo } from "@/lib/types";
import { EASE, Magnetic, Reveal, SplitText } from "./fx";

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Bahrain" });
export const dotDate = (iso: string) => {
  const d = new Date(iso);
  const p = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit", timeZone: "Asia/Bahrain" }).formatToParts(d);
  const g = (t: string) => p.find((x) => x.type === t)?.value;
  return `${g("month")}.${g("day")}.${g("year")}`;
};

function SectionLabel({ n, children }: { n: string; children: React.ReactNode }) {
  return <div className="label text-gold flex items-center gap-4"><span>{n}</span><span className="h-px w-12 bg-gold/50" />{children}</div>;
}

/* ─────────────────── HERO ─────────────────── */
export function Hero({ info }: { info: WeddingInfo }) {
  const cd = useCountdown(info.date);
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const o = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const D = 2.8; // after loader
  return (
    <section ref={ref} className="relative min-h-[100svh] flex flex-col justify-between px-6 md:px-16 pt-8 pb-10 overflow-hidden">
      <motion.nav initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: D + 0.8, duration: 1 }} className="flex justify-between items-center label text-paper/70 relative z-10">
        <span className="font-serif italic normal-case tracking-normal text-2xl text-gold">JS</span>
        <div className="hidden md:flex gap-8">
          <a href="#schedule">Schedule</a><a href="#venue">Venue</a><a href="#dress">Dress Code</a><a href="#faq">FAQ</a>
        </div>
        <a href="#rsvp" data-cursor="RSVP" className="border border-gold/60 text-gold rounded-full px-5 py-2 hover:bg-gold hover:text-ink transition-colors">RSVP</a>
      </motion.nav>

      <motion.div style={{ y, opacity: o }} className="relative z-10">
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: D, duration: 1, ease: EASE }} className="label text-gold mb-6">
          {info.theme_name} · {fmtDate(info.date)}
        </motion.p>
        <h1 className="display text-[19vw] md:text-[13vw]">
          <span className="block"><SplitText text={info.bride} delay={D} /></span>
          <span className="block pl-[8vw] md:pl-[18vw]">
            <motion.span initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: D + 0.5, duration: 1, ease: EASE }} className="italic text-gold inline-block mr-[2vw]">&amp;</motion.span>
            <SplitText text={info.groom} delay={D + 0.3} />
          </span>
        </h1>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: D + 1, duration: 1, ease: EASE }} className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="flex gap-6 md:gap-10">
          {([["Days", cd.days], ["Hours", cd.hours], ["Min", cd.minutes], ["Sec", cd.seconds]] as const).map(([l, v]) => (
            <div key={l}>
              <div className="display text-5xl md:text-7xl tabular-nums">{cd.ready ? String(v).padStart(2, "0") : "--"}</div>
              <div className="label text-paper/50 mt-2">{l}</div>
            </div>
          ))}
        </div>
        <div className="label text-paper/60 md:text-right leading-relaxed">
          {info.venue_name}<br />{info.venue_address}<br /><span className="text-gold">{info.hashtags.join(" ")}</span>
        </div>
      </motion.div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_30%,rgba(201,168,106,0.12),transparent_60%)]" />
    </section>
  );
}

/* ─────────────────── OUR WISH (marquee) ─────────────────── */
export function Wish({ info }: { info: WeddingInfo }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const x1 = useTransform(scrollYProgress, [0, 1], ["0%", "-40%"]);
  const x2 = useTransform(scrollYProgress, [0, 1], ["-40%", "0%"]);
  const words = ["Our Wish", "✦", "11.11", "✦", "Make a Wish", "✦", ...info.hashtags, "✦"];
  const row = [...words, ...words, ...words];
  return (
    <section ref={ref} className="py-28 md:py-40 overflow-hidden border-y border-gold/15">
      <motion.div style={{ x: x1 }} className="whitespace-nowrap display text-[14vw] md:text-[9vw] flex gap-[4vw]">
        {row.map((w, i) => <span key={i} className={i % 2 ? "text-gold italic" : ""}>{w}</span>)}
      </motion.div>
      <div className="max-w-3xl mx-auto px-6 my-20 md:my-28 text-center">
        <SectionLabel n="01">Our Story</SectionLabel>
        <p className="font-serif text-3xl md:text-5xl leading-tight mt-10 text-paper/90"><Reveal>{info.story}</Reveal></p>
      </div>
      <motion.div style={{ x: x2 }} className="whitespace-nowrap display text-[14vw] md:text-[9vw] flex gap-[4vw] text-transparent [-webkit-text-stroke:1px_#C9A86A]">
        {row.map((w, i) => <span key={i}>{w}</span>)}
      </motion.div>
    </section>
  );
}

/* ─────────────────── SCHEDULE (pinned) ─────────────────── */
export function Schedule({ items }: { items: ScheduleItem[] }) {
  const sorted = [...items].sort((a, b) => a.order - b.order);
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const bg = useTransform(scrollYProgress, [0, 0.5, 1], ["#3C2415", "#4A5D23", "#6B1D2A"]);
  const [active, setActive] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => setActive(Math.min(sorted.length - 1, Math.floor(v * sorted.length))));
  return (
    <motion.section id="schedule" ref={ref} style={{ backgroundColor: bg, height: `${Math.max(1, sorted.length) * 90 + 30}vh` }} className="relative">
      <div className="sticky top-0 h-screen flex flex-col justify-center px-6 md:px-16 overflow-hidden">
        <SectionLabel n="02">The Day</SectionLabel>
        <div className="grid md:grid-cols-[1fr_1.4fr] gap-10 md:gap-20 mt-12 items-center">
          <div className="space-y-5">
            {sorted.map((s, i) => (
              <div key={s.id} className={`flex items-baseline gap-5 transition-opacity duration-700 ${i === active ? "opacity-100" : "opacity-30"}`}>
                <span className="label text-gold w-6">0{i + 1}</span>
                <span className="label">{s.time}</span>
              </div>
            ))}
            <div className="h-px bg-paper/20 relative mt-8"><motion.div style={{ scaleX: scrollYProgress }} className="absolute inset-0 bg-gold origin-left" /></div>
          </div>
          <div className="min-h-[40vh] relative">
            <AnimatePresence mode="wait">
              {sorted[active] && (
                <motion.div key={sorted[active].id} initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -60 }} transition={{ duration: 0.7, ease: EASE }}>
                  <div className="label text-gold mb-6">{sorted[active].time}</div>
                  <h3 className="display text-6xl md:text-[8vw]">{sorted[active].title}</h3>
                  <p className="text-paper/80 text-lg md:text-xl mt-8 max-w-xl leading-relaxed">{sorted[active].detail}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

/* ─────────────────── VENUE ─────────────────── */
export function Venue({ info }: { info: WeddingInfo }) {
  return (
    <section id="venue" className="grid md:grid-cols-2 min-h-screen">
      <div className="px-6 md:px-16 py-24 flex flex-col justify-between gap-16">
        <SectionLabel n="03">The Venue</SectionLabel>
        <div>
          <h2 className="display text-7xl md:text-[9vw]"><Reveal>{info.venue_name.split(" ")[0]}</Reveal><Reveal delay={0.1}><span className="italic text-gold">{info.venue_name.split(" ").slice(1).join(" ")}</span></Reveal></h2>
          <p className="label text-paper/60 mt-8">{info.venue_address}</p>
          <p className="label text-paper/60 mt-2">{fmtDate(info.date)}</p>
        </div>
        <Magnetic>
          <a href={info.venue_map_link} target="_blank" rel="noreferrer" data-cursor="MAP" className="label inline-flex items-center gap-4 border border-gold text-gold rounded-full px-8 py-4 hover:bg-gold hover:text-ink transition-colors">Open in Maps ↗</a>
        </Magnetic>
      </div>
      <div className="relative min-h-[60vh] md:min-h-full">
        <iframe title="Venue map" src={info.venue_map_embed} className="absolute inset-0 w-full h-full grayscale invert-[.9] contrast-[.9] sepia-[.3]" loading="lazy" />
        <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-gold/20" />
      </div>
    </section>
  );
}

/* ─────────────────── DRESS CODE ─────────────────── */
export function DressCode({ attire }: { attire: Attire[] }) {
  const sorted = [...attire].sort((a, b) => a.order - b.order);
  const guests = sorted.find((a) => a.group === "guests");
  const reserved = sorted.filter((a) => a.reserved);
  const [picked, setPicked] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  return (
    <section id="dress" className="px-6 md:px-16 py-28 md:py-40">
      <SectionLabel n="04">Dress Code</SectionLabel>
      <div className="grid md:grid-cols-2 gap-10 mt-10 items-end">
        <h2 className="display text-6xl md:text-[7vw]"><Reveal>Wear the</Reveal><Reveal delay={0.1}><span className="italic text-gold">earth.</span></Reveal></h2>
        <p className="text-paper/70 text-lg max-w-md">{guests?.notes}</p>
      </div>

      {guests && (
        <div className="mt-16">
          <div className="label text-paper/50 mb-5">For our guests — tap a tone</div>
          <div className="flex h-[55vh] md:h-[60vh] gap-2 flex-col md:flex-row">
            {guests.colors.map((c, i) => {
              const grow = hover === i || (hover === null && picked === i);
              return (
                <motion.button key={c.name} data-cursor={c.name.toUpperCase()} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onClick={() => setPicked(i)}
                  animate={{ flex: grow ? 4 : 1 }} transition={{ duration: 0.8, ease: EASE }}
                  className="relative rounded-sm overflow-hidden text-left min-h-[48px]" style={{ backgroundColor: c.hex }}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                    <span className={`font-serif text-2xl md:text-4xl transition-opacity ${grow ? "opacity-100" : "opacity-70 md:opacity-0"}`}>{c.name}</span>
                    <span className={`label text-paper/70 transition-opacity ${grow ? "opacity-100" : "opacity-0"}`}>{c.hex}</span>
                  </div>
                  {picked === i && <span className="absolute top-4 right-4 label bg-paper text-ink rounded-full px-3 py-1">Your pick ✓</span>}
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-20">
        <div className="label text-paper/50 mb-5">Reserved for the family & entourage — please avoid</div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {reserved.map((a) => (
            <div key={a.id} className="relative border border-paper/10 p-4 group overflow-hidden">
              <div className="flex -space-x-2 mb-6">
                {a.colors.map((c) => <span key={c.name} title={c.name} className="w-10 h-10 rounded-full ring-2 ring-ink" style={{ backgroundColor: c.hex }} />)}
              </div>
              <div className="font-serif text-2xl">{a.label}</div>
              <div className="label text-paper/40 mt-1 !tracking-[0.15em]">{a.colors.map((c) => c.name).join(" · ")}</div>
              <div className="absolute top-3 right-3 text-paper/40 text-sm" title="Reserved">🔒</div>
              <div className="absolute inset-0 bg-ink/85 flex items-center justify-center label text-gold opacity-0 group-hover:opacity-100 transition-opacity">Reserved for {a.group.includes("family") ? "Family" : a.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────── ENTOURAGE ─────────────────── */
export function Entourage({ people }: { people: EntourageMember[] }) {
  const groups: [EntourageMember["role"], string][] = [["sponsor", "Principal Sponsors"], ["bridesmaid", "Bridesmaids"], ["groomsman", "Groomsmen"], ["other", "With Love"]];
  const sorted = [...people].sort((a, b) => a.order - b.order);
  return (
    <section className="px-6 md:px-16 py-28 md:py-40 bg-paper text-ink">
      <div className="label text-espresso flex items-center gap-4"><span>05</span><span className="h-px w-12 bg-espresso/50" />The Entourage</div>
      <h2 className="display text-6xl md:text-[7vw] mt-10"><Reveal>Our people.</Reveal></h2>
      <div className="grid md:grid-cols-3 gap-12 mt-16">
        {groups.map(([role, title]) => {
          const list = sorted.filter((p) => p.role === role);
          if (!list.length) return null;
          return (
            <div key={role}>
              <div className="label text-burgundy border-b border-ink/15 pb-3 mb-5">{title}</div>
              <ul className="space-y-3">
                {list.map((p, i) => (
                  <motion.li key={p.id} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06, duration: 0.8, ease: EASE }}>
                    <div className="font-serif text-3xl leading-tight">{p.name}</div>
                    {p.title && <div className="label text-ink/50 !tracking-[0.15em]">{p.title}</div>}
                  </motion.li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ─────────────────── RSVP ─────────────────── */
export function Rsvp({ info }: { info: WeddingInfo }) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [err, setErr] = useState("");
  const [f, setF] = useState({ name: "", phone: "", attending: "yes" as "yes" | "no", pax: 1, dietary: "", message: "", song_request: "" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.name.trim()) return;
    setState("sending");
    try { await submitRsvp({ ...f, pax: f.attending === "no" ? 0 : f.pax }); setState("done"); }
    catch (e) { setErr((e as Error).message); setState("error"); }
  }
  const Pill = ({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button type="button" onClick={onClick} className={`label px-6 py-3 rounded-full border transition-colors ${on ? "bg-gold text-ink border-gold" : "border-paper/25 text-paper/70 hover:border-gold"}`}>{children}</button>
  );
  return (
    <section id="rsvp" className="relative px-6 md:px-16 py-28 md:py-40 overflow-hidden">
      <div className="absolute -top-40 -left-40 w-[40rem] h-[40rem] rounded-full bg-amethyst/40 blur-[120px]" />
      <div className="absolute -bottom-40 -right-20 w-[36rem] h-[36rem] rounded-full bg-burgundy/50 blur-[120px]" />
      <div className="relative grid md:grid-cols-[1fr_1.2fr] gap-16">
        <div>
          <SectionLabel n="06">RSVP</SectionLabel>
          <h2 className="display text-7xl md:text-[8vw] mt-10"><Reveal>Will you</Reveal><Reveal delay={0.1}><span className="italic text-gold">be there?</span></Reveal></h2>
          <p className="text-paper/60 mt-8 max-w-sm">Kindly reply by October 25, 2026 so we can save you a seat (and a plate of lechon).</p>
        </div>
        <div className="glass rounded-2xl p-6 md:p-12 min-h-[520px] relative">
          <AnimatePresence mode="wait">
            {state === "done" ? (
              <motion.div key="ok" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease: EASE }} className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                <svg viewBox="0 0 100 100" className="w-28 h-28 mb-8">
                  <motion.circle cx="50" cy="50" r="46" fill="none" stroke="#C9A86A" strokeWidth="1.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, ease: EASE }} />
                  <motion.path d="M50 22 L56 44 L78 50 L56 56 L50 78 L44 56 L22 50 L44 44 Z" fill="#C9A86A" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} style={{ originX: "50px", originY: "50px" }} transition={{ delay: 0.6, duration: 0.9, ease: EASE }} />
                </svg>
                <h3 className="display text-5xl md:text-6xl">Wish granted</h3>
                <p className="label text-gold mt-5">{info.hashtags[0] ?? "#JSWeDo"}</p>
                <p className="text-paper/60 mt-6">{f.attending === "yes" ? `See you on ${fmtDate(info.date)}, ${f.name.split(" ")[0]}.` : `We'll miss you, ${f.name.split(" ")[0]}. Thank you for letting us know.`}</p>
              </motion.div>
            ) : (
              <motion.form key="form" onSubmit={submit} exit={{ opacity: 0, y: -20 }} className="space-y-7">
                <div className="grid md:grid-cols-2 gap-7">
                  <input className="field" placeholder="Full name *" required value={f.name} onChange={set("name")} maxLength={120} />
                  <input className="field" placeholder="WhatsApp number" type="tel" value={f.phone} onChange={set("phone")} maxLength={40} />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="label text-paper/50 w-24">Attending</span>
                  <Pill on={f.attending === "yes"} onClick={() => setF({ ...f, attending: "yes" })}>Joyfully yes</Pill>
                  <Pill on={f.attending === "no"} onClick={() => setF({ ...f, attending: "no" })}>Sadly no</Pill>
                </div>
                {f.attending === "yes" && (
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="label text-paper/50 w-24">Pax</span>
                    <Pill on={f.pax === 1} onClick={() => setF({ ...f, pax: 1 })}>1</Pill>
                    <Pill on={f.pax === 2} onClick={() => setF({ ...f, pax: 2 })}>2</Pill>
                  </div>
                )}
                <input className="field" placeholder="Dietary needs / allergies" value={f.dietary} onChange={set("dietary")} maxLength={200} />
                <input className="field" placeholder="Song that'll get you dancing" value={f.song_request} onChange={set("song_request")} maxLength={200} />
                <textarea className="field resize-none" rows={3} placeholder="A message for the couple" value={f.message} onChange={set("message")} maxLength={1000} />
                {state === "error" && <p className="text-red-300 text-sm">{err}</p>}
                <Magnetic>
                  <button disabled={state === "sending"} data-cursor="RSVP" className="label bg-gold text-ink rounded-full px-10 py-5 hover:bg-paper transition-colors disabled:opacity-50">
                    {state === "sending" ? "Sending wish…" : "Send my RSVP ✦"}
                  </button>
                </Magnetic>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────── FAQ ─────────────────── */
export function FaqSection({ faqs }: { faqs: Faq[] }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <section id="faq" className="px-6 md:px-16 py-28 md:py-40 grid md:grid-cols-[1fr_1.6fr] gap-12">
      <div>
        <SectionLabel n="07">FAQ</SectionLabel>
        <h2 className="display text-6xl md:text-[6vw] mt-10"><Reveal>Good</Reveal><Reveal delay={0.1}><span className="italic text-gold">to know.</span></Reveal></h2>
      </div>
      <div className="border-t border-paper/15">
        {[...faqs].sort((a, b) => a.order - b.order).map((q) => (
          <div key={q.id} className="border-b border-paper/15">
            <button onClick={() => setOpen(open === q.id ? null : q.id)} className="w-full flex justify-between items-center py-7 text-left gap-6">
              <span className="font-serif text-2xl md:text-3xl">{q.question}</span>
              <motion.span animate={{ rotate: open === q.id ? 45 : 0 }} transition={{ duration: 0.5, ease: EASE }} className="text-gold text-3xl leading-none">+</motion.span>
            </button>
            <AnimatePresence initial={false}>
              {open === q.id && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.6, ease: EASE }} className="overflow-hidden">
                  <p className="pb-8 text-paper/70 text-lg max-w-2xl leading-relaxed">{q.answer}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────── GALLERY + FOOTER ─────────────────── */
export function Gallery({ info }: { info: WeddingInfo }) {
  const imgs = [info.save_the_date_url, ...info.gallery].filter(Boolean);
  if (!imgs.length) return null;
  return (
    <section className="px-6 md:px-16 py-20">
      <div className="columns-2 md:columns-3 gap-4 [&>*]:mb-4">
        {imgs.map((src, i) => (
          <motion.img key={i} src={src} alt="" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 1, ease: EASE, delay: (i % 3) * 0.08 }} className="w-full rounded-sm" />
        ))}
      </div>
    </section>
  );
}

export function Footer({ info }: { info: WeddingInfo }) {
  const handle = info.instagram.replace("@", "");
  return (
    <footer className="px-6 md:px-16 pt-24 pb-10 border-t border-gold/15 overflow-hidden">
      <div className="display text-[22vw] leading-none gold-foil italic text-center select-none">{dotDate(info.date)}</div>
      <div className="flex flex-col md:flex-row justify-between gap-6 mt-12 label text-paper/50">
        <a href={`https://instagram.com/${handle}`} target="_blank" rel="noreferrer" className="hover:text-gold">{info.instagram}</a>
        <span className="text-gold">{info.hashtags.join("  ")}</span>
        <span>{info.bride} & {info.groom} · {info.venue_name}</span>
      </div>
    </footer>
  );
}
