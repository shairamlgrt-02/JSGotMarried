"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { submitRsvp } from "@/lib/db";
import type { Attire, EntourageMember, Faq, ScheduleItem, WeddingInfo } from "@/lib/types";
import { fullDate } from "./Envelope";
import { EASE, Parallax, Reveal, Tilt } from "./fx";
import { Corners, Flourish, LaceEdge, OvalFrame, Paisley } from "./ornaments";

const longDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Bahrain" });

function Title({ kicker, title }: { kicker: string; title: string }) {
  return (
    <Reveal className="text-center">
      <p className="label text-taupe">{kicker}</p>
      <h2 className="script text-wine text-6xl md:text-8xl mt-3 leading-[1.1]">{title}</h2>
      <Flourish className="w-48 md:w-60 mx-auto mt-3 text-taupe/70" />
    </Reveal>
  );
}

/* ─────────── INVITATION WORDING ─────────── */
export function Invitation({ info }: { info: WeddingInfo }) {
  return (
    <section className="relative px-6 py-28 md:py-40 text-center">
      <Reveal>
        <p className="font-serif italic text-taupe text-xl md:text-2xl">Together with their families</p>
        <h2 className="caps text-mocha text-4xl md:text-7xl mt-8 leading-tight">
          {info.groom}<span className="block script normal-case tracking-normal text-wine text-5xl md:text-7xl my-2">and</span>{info.bride}
        </h2>
        <p className="font-serif italic text-mocha text-xl md:text-2xl mt-10 max-w-xl mx-auto leading-relaxed">
          request the pleasure of your company<br />at the celebration of their marriage
        </p>
        <Flourish className="w-56 mx-auto my-10 text-taupe/70" />
        <p className="caps text-mocha text-lg md:text-xl">{longDate(info.date)}</p>
        <p className="font-serif italic text-taupe text-xl mt-2">{info.venue_name}, {info.venue_address}</p>
      </Reveal>
    </section>
  );
}

/* ─────────── OUR STORY ─────────── */
export function Story({ info }: { info: WeddingInfo }) {
  const photo = info.gallery[0] || "";
  return (
    <section id="story" className="relative px-6 md:px-16 py-20 md:py-28">
      <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center max-w-6xl mx-auto">
        <Reveal><Parallax speed={0.35}><Tilt max={9} className="w-full max-w-sm mx-auto"><OvalFrame className="w-full">
          {photo ? <img src={photo} alt={`${info.groom} and ${info.bride}`} className="w-full h-full object-cover" /> : (
            <div className="w-full h-full bg-oat/70 flex flex-col items-center justify-center text-taupe">
              <Paisley className="w-10 h-16 opacity-60" />
              <span className="font-serif italic mt-3 text-sm">Our photo, coming soon</span>
            </div>
          )}
        </OvalFrame></Tilt></Parallax></Reveal>
        <div className="text-center md:text-left">
          <Reveal><p className="label text-taupe">Our Story</p>
            <h2 className="script text-wine text-6xl md:text-7xl mt-3 leading-[1.1]">A wish come true</h2></Reveal>
          <Reveal delay={0.1}><p className="font-serif text-2xl md:text-[1.7rem] leading-relaxed text-mocha mt-8">{info.story}</p></Reveal>
          <Reveal delay={0.2}><p className="label text-wine mt-8">{info.hashtags.join("   ")}</p></Reveal>
        </div>
      </div>
    </section>
  );
}

/* ─────────── 11.11 INTERLUDE ─────────── */
export function ElevenEleven({ info }: { info: WeddingInfo }) {
  const d = fullDate(info.date);
  return (
    <section className="relative py-24 md:py-32 overflow-hidden text-center">
      
      <div className="relative py-16 md:py-24 mx-4 md:mx-12 border-y border-taupe/25">
        <Reveal>
          <div className="flex items-center justify-center gap-4 md:gap-10">
            <Paisley className="w-8 h-12 md:w-12 md:h-20 text-taupe/70 -scale-x-100" />
            <p className="font-serif font-light text-wine text-[26vw] md:text-[16rem] leading-none tracking-tight [text-shadow:0_2px_0_rgba(255,255,255,.9),0_-1px_1px_rgba(60,20,30,.3),0_18px_30px_rgba(110,31,46,.18)]">{d.slice(0, 5)}</p>
            <Paisley className="w-8 h-12 md:w-12 md:h-20 text-taupe/70" />
          </div>
          <p className="caps text-taupe text-lg md:text-2xl -mt-2 md:-mt-4 tracking-[0.6em]">{d.slice(6)}</p>
          <p className="font-serif italic text-mocha text-xl mt-6">Make a wish — ours comes true.</p>
        </Reveal>
      </div>
    </section>
  );
}

/* ─────────── THE DAY ─────────── */
export function Schedule({ items }: { items: ScheduleItem[] }) {
  const sorted = [...items].sort((a, b) => a.order - b.order);
  return (
    <section id="day" className="relative px-6 md:px-16 py-20 md:py-28">
      <Title kicker="Order of the Day" title="The Day" />
      <div className="relative max-w-3xl mx-auto mt-16">
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-taupe/30 hidden md:block" />
        {sorted.map((s, i) => (
          <Reveal key={s.id} delay={i * 0.05} className={`relative md:w-1/2 mb-14 ${i % 2 ? "md:ml-auto md:pl-14" : "md:pr-14"}`}>
            <span className={`hidden md:block absolute top-1/2 w-3 h-3 rotate-45 bg-wine shadow ${i % 2 ? "-left-[6px]" : "-right-[6px]"}`} />
            <Tilt max={6}>
              <div className="[filter:drop-shadow(0_14px_14px_rgba(61,47,38,.22))]" style={{ transform: `rotate(${i % 2 ? 1.2 : -1.2}deg)` }}>
                <div className="paper-card deckle relative px-8 py-9 text-center">
                  <div className="absolute inset-2 border border-taupe/25 pointer-events-none" />
                  <p className="label text-wine">{s.time}</p>
                  <h3 className="font-serif text-4xl md:text-5xl text-mocha mt-2">{s.title}</h3>
                  <p className="font-serif italic text-lg text-taupe mt-3 leading-relaxed">{s.detail}</p>
                </div>
              </div>
            </Tilt>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ─────────── VENUE ─────────── */
export function Venue({ info }: { info: WeddingInfo }) {
  return (
    <section id="venue" className="relative px-6 md:px-16 py-20 md:py-28">
      <Title kicker="Where" title="The Venue" />
      <div className="grid md:grid-cols-[1fr_1.3fr] gap-10 md:gap-16 max-w-6xl mx-auto mt-16 items-center">
        <Reveal className="text-center md:text-left">
          <h3 className="caps text-mocha text-4xl md:text-5xl">{info.venue_name}</h3>
          <p className="font-serif italic text-taupe text-xl mt-4">{info.venue_address}</p>
          <p className="font-serif text-mocha text-xl mt-6">{longDate(info.date)}</p>
          <a href={info.venue_map_link} target="_blank" rel="noreferrer" className="label inline-block mt-10 text-lace bg-wine rounded-full px-8 py-4 hover:bg-mocha transition-colors">Get Directions</a>
        </Reveal>
        <Reveal delay={0.1}>
          <Tilt max={5}><div className="relative paper-card p-5 md:p-8 shadow-[0_2px_3px_rgba(61,47,38,.15),0_30px_60px_-30px_rgba(61,47,38,.55)]">
            <Corners className="w-16 h-16 md:w-20 md:h-20" inset="0" />
            <div className="relative aspect-[4/3] overflow-hidden border border-taupe/30">
              <iframe title="Venue map" src={info.venue_map_embed} className="absolute inset-0 w-full h-full sepia-[.35] saturate-[.7]" loading="lazy" />
            </div>
          </div></Tilt>
        </Reveal>
      </div>
    </section>
  );
}

/* ─────────── ATTIRE ─────────── */
export function DressCode({ attire }: { attire: Attire[] }) {
  const sorted = [...attire].sort((a, b) => a.order - b.order);
  const guests = sorted.find((a) => a.group === "guests");
  const reserved = sorted.filter((a) => a.reserved);
  const [picked, setPicked] = useState<number | null>(null);
  return (
    <section id="dress" className="relative px-6 md:px-16 py-20 md:py-28">
      <Title kicker="What to Wear" title="Attire" />
      {guests && (
        <div className="max-w-5xl mx-auto mt-14 text-center">
          <p className="font-serif italic text-xl md:text-2xl text-mocha max-w-2xl mx-auto">{guests.notes}</p>
          <p className="label text-taupe mt-10 mb-8">For our guests — tap a color</p>
          <div className="flex flex-wrap justify-center gap-5 md:gap-8">
            {guests.colors.map((c, i) => (
              <motion.button key={c.name} onClick={() => setPicked(i)} whileHover={{ y: -8 }} transition={{ duration: 0.4, ease: EASE }} className="flex flex-col items-center gap-3 group">
                <span className={`relative w-24 h-32 md:w-28 md:h-40 rounded-t-full shadow-[0_18px_30px_-18px_rgba(61,47,38,.6)] ring-1 ring-black/5 transition-all ${picked === i ? "ring-2 ring-offset-4 ring-offset-ivory ring-wine" : ""}`} style={{ backgroundColor: c.hex, backgroundImage: "linear-gradient(115deg, rgba(255,255,255,.18), transparent 40%, rgba(0,0,0,.12))" }}>
                  <span className="absolute inset-0 rounded-t-full overflow-hidden"><span className="absolute -inset-y-4 -left-full w-1/2 bg-gradient-to-r from-transparent via-white/35 to-transparent skew-x-[-18deg] group-hover:left-[150%] transition-all duration-1000 ease-out" /></span>
                  <span className="absolute inset-2 rounded-t-full border border-white/20" />
                  {picked === i && <span className="absolute inset-x-0 bottom-3 script text-lace text-2xl">lovely</span>}
                </span>
                <span className="font-serif text-lg text-mocha">{c.name}</span>
              </motion.button>
            ))}
          </div>
        </div>
      )}
      <div className="max-w-5xl mx-auto mt-20">
        <p className="label text-taupe text-center mb-8">Reserved for the couple, family &amp; entourage — kindly avoid</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {reserved.map((a) => (
            <div key={a.id} className="paper-card relative p-5 text-center border border-taupe/20 shadow-[0_2px_2px_rgba(61,47,38,.1),0_16px_24px_-14px_rgba(61,47,38,.4)] hover:-translate-y-1 transition-transform duration-500">
              <div className="flex justify-center -space-x-2 mb-4">
                {a.colors.map((c) => <span key={c.name} title={c.name} className="w-9 h-9 rounded-full ring-2 ring-lace" style={{ backgroundColor: c.hex }} />)}
              </div>
              <p className="font-serif text-xl text-mocha">{a.label}</p>
              <p className="font-serif italic text-sm text-taupe mt-1">{a.colors.map((c) => c.name).join(", ")}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────── ENTOURAGE ─────────── */
export function Entourage({ people }: { people: EntourageMember[] }) {
  const groups: [EntourageMember["role"], string][] = [["sponsor", "Principal Sponsors"], ["bridesmaid", "Bridesmaids"], ["groomsman", "Groomsmen"], ["other", "With Love"]];
  const sorted = [...people].sort((a, b) => a.order - b.order);
  return (
    <section className="relative px-6 md:px-16 py-20 md:py-28">
      <Title kicker="Standing With Us" title="The Entourage" />
      <div className="flex flex-wrap justify-center gap-x-20 gap-y-14 mt-16 max-w-5xl mx-auto text-center">
        {groups.map(([role, title]) => {
          const list = sorted.filter((p) => p.role === role);
          if (!list.length) return null;
          return (
            <Reveal key={role} className="min-w-[220px]">
              <p className="label text-wine mb-5">{title}</p>
              <ul className="space-y-3">
                {list.map((p) => (
                  <li key={p.id}><p className="font-serif text-2xl text-mocha">{p.name}</p>{p.title && <p className="font-serif italic text-taupe">{p.title}</p>}</li>
                ))}
              </ul>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

/* ─────────── RSVP (reply card) ─────────── */
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
  const choice = (on: boolean) => `font-serif text-xl px-6 py-2 rounded-full border transition-colors ${on ? "bg-wine text-lace border-wine" : "border-taupe/40 text-mocha hover:border-wine"}`;
  return (
    <section id="rsvp" className="relative px-5 md:px-16 py-24 md:py-36">
      <Title kicker="Répondez s'il vous plaît" title="Kindly Reply" />
      <Reveal className="max-w-2xl mx-auto mt-14">
        <div className="relative">
          <LaceEdge color="#FCFAF5" flip />
          <div className="paper-card relative px-6 md:px-16 py-14 md:py-20 shadow-[0_2px_3px_rgba(61,47,38,.15),0_40px_80px_-40px_rgba(61,47,38,.55)] min-h-[560px]">
            <div className="absolute inset-3 border border-taupe/30 pointer-events-none" />
            <Corners className="w-20 h-20 md:w-28 md:h-28" inset="0.25rem" />
            <AnimatePresence mode="wait">
              {state === "done" ? (
                <motion.div key="ok" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease: EASE }} className="text-center py-16">
                  <motion.img src="/img/seal.webp" alt="" initial={{ scale: 2.2, opacity: 0, rotate: -30 }} animate={{ scale: 1, opacity: 1, rotate: -8 }} transition={{ delay: 0.2, duration: 0.7, ease: [0.2, 1.4, 0.4, 1] }} className="mx-auto w-28 h-28 object-contain drop-shadow-[0_8px_10px_rgba(61,47,38,.45)]" />
                  <h3 className="script text-wine text-6xl mt-8">Wish granted</h3>
                  <p className="label text-taupe mt-4">{info.hashtags[0] ?? "#JSWeDo"}</p>
                  <p className="font-serif italic text-xl text-mocha mt-6">{f.attending === "yes" ? `We can't wait to celebrate with you, ${f.name.split(" ")[0]}.` : `You'll be missed, ${f.name.split(" ")[0]}. Thank you for letting us know.`}</p>
                </motion.div>
              ) : (
                <motion.form key="form" onSubmit={submit} exit={{ opacity: 0 }} className="relative space-y-7 text-center">
                  <p className="font-serif italic text-lg text-taupe">The favour of a reply is requested by the 25th of October</p>
                  <input className="field text-center" placeholder="Your full name" required value={f.name} onChange={set("name")} maxLength={120} />
                  <input className="field text-center" placeholder="WhatsApp number" type="tel" value={f.phone} onChange={set("phone")} maxLength={40} />
                  <div className="flex flex-wrap justify-center gap-3 pt-2">
                    <button type="button" className={choice(f.attending === "yes")} onClick={() => setF({ ...f, attending: "yes" })}>Joyfully accepts</button>
                    <button type="button" className={choice(f.attending === "no")} onClick={() => setF({ ...f, attending: "no" })}>Regretfully declines</button>
                  </div>
                  {f.attending === "yes" && (
                    <div className="flex justify-center items-center gap-3">
                      <span className="font-serif italic text-taupe text-lg mr-2">Number of guests</span>
                      {[1, 2].map((n) => <button key={n} type="button" className={choice(f.pax === n)} onClick={() => setF({ ...f, pax: n })}>{n}</button>)}
                    </div>
                  )}
                  <input className="field text-center" placeholder="Dietary requirements" value={f.dietary} onChange={set("dietary")} maxLength={200} />
                  <input className="field text-center" placeholder="A song to get you dancing" value={f.song_request} onChange={set("song_request")} maxLength={200} />
                  <textarea className="field text-center resize-none" rows={2} placeholder="A little note for the couple" value={f.message} onChange={set("message")} maxLength={1000} />
                  {state === "error" && <p className="text-wine text-sm">{err}</p>}
                  <button disabled={state === "sending"} className="label bg-wine text-lace rounded-full px-10 py-4 hover:bg-mocha transition-colors disabled:opacity-50">
                    {state === "sending" ? "Sending…" : "Send Reply"}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
          <LaceEdge color="#FCFAF5" />
        </div>
      </Reveal>
    </section>
  );
}

/* ─────────── FAQ ─────────── */
/** Handwritten closing of the love letter. */
export function SignOff({ info }: { info: WeddingInfo }) {
  return (
    <section className="relative px-6 md:px-16 pt-6 pb-24 md:pb-32 text-center md:text-right md:pr-24">
      <Reveal>
        <p className="font-serif italic text-2xl text-mocha">With all our love,</p>
        <p className="script text-wine text-6xl md:text-7xl mt-2 -rotate-2">{info.groom} &amp; {info.bride}</p>
        <p className="label text-taupe mt-6">{info.hashtags.join("  ")}</p>
      </Reveal>
    </section>
  );
}

export function FaqSection({ faqs }: { faqs: Faq[] }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <section id="faq" className="relative px-6 md:px-16 py-20 md:py-28">
      <Title kicker="Good to Know" title="Questions" />
      <div className="max-w-3xl mx-auto mt-14 border-t border-taupe/30">
        {[...faqs].sort((a, b) => a.order - b.order).map((q) => (
          <div key={q.id} className="border-b border-taupe/30">
            <button onClick={() => setOpen(open === q.id ? null : q.id)} className="w-full flex justify-between items-center py-6 text-left gap-6">
              <span className="font-serif text-2xl text-mocha">{q.question}</span>
              <motion.span animate={{ rotate: open === q.id ? 45 : 0 }} transition={{ duration: 0.5, ease: EASE }} className="text-wine text-3xl leading-none font-light">+</motion.span>
            </button>
            <AnimatePresence initial={false}>
              {open === q.id && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.5, ease: EASE }} className="overflow-hidden">
                  <p className="pb-7 font-serif italic text-xl text-taupe leading-relaxed">{q.answer}</p>
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
export function Gallery({ info }: { info: WeddingInfo }) {
  const imgs = [info.save_the_date_url, ...info.gallery.slice(1)].filter(Boolean);
  if (!imgs.length) return null;
  return (
    <section className="px-6 md:px-16 py-20">
      <Title kicker="Moments" title="Gallery" />
      <div className="columns-2 md:columns-3 gap-5 [&>*]:mb-5 max-w-6xl mx-auto mt-14">
        {imgs.map((src, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 1, ease: EASE, delay: (i % 3) * 0.08 }} className="paper-card p-3 shadow-[0_2px_3px_rgba(61,47,38,.15),0_20px_40px_-20px_rgba(61,47,38,.5)] hover:-rotate-1 hover:scale-[1.02] transition-transform duration-500">
            <img src={src} alt="" className="w-full" />
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export function Footer({ info }: { info: WeddingInfo }) {
  const handle = info.instagram.replace("@", "");
  return (
    <footer className="relative px-6 pt-20 pb-12 text-center">
      <Flourish className="w-56 mx-auto text-taupe/70" />
      <p className="script text-wine text-6xl md:text-7xl mt-8">{info.groom} &amp; {info.bride}</p>
      <p className="font-serif font-light text-mocha text-5xl md:text-6xl mt-4 tracking-[0.12em]">{fullDate(info.date)}</p>
      <div className="flex flex-col md:flex-row justify-center gap-3 md:gap-10 mt-10 label text-taupe">
        <a href={`https://instagram.com/${handle}`} target="_blank" rel="noreferrer" className="hover:text-wine">{info.instagram}</a>
        <span className="text-wine">{info.hashtags.join("  ")}</span>
      </div>
    </footer>
  );
}
