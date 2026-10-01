"use client";
import { AnimatePresence, motion, useInView, useScroll, useSpring } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { submitRsvp, type InviteState } from "@/lib/db";
import type { Attire, EntourageMember, Faq, ScheduleItem, WeddingInfo } from "@/lib/types";
import { fullDate } from "./Envelope";
import { EASE, EASE_OUT, Reveal, Tilt, rise } from "./fx";
import { Corners, Flourish, GemDot, LaceEdge, Paisley } from "./ornaments";
import { PhotoStrip, Polaroid, ScratchReveal, slots } from "./photos";
import { AttireGuide } from "./attire";

const longDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Bahrain" });

function Title({ kicker, title }: { kicker: string; title: string }) {
  return (
    <Reveal className="text-center">
      <p className="micro text-taupe">{kicker}</p>
      <h2 className="script text-wine text-script mt-2 text-balance">{title}</h2>
      <Flourish className="w-44 md:w-56 mx-auto mt-2 text-taupe/70" />
    </Reveal>
  );
}

/* ─────────── INVITATION WORDING ─────────── */
export function Invitation({ info }: { info: WeddingInfo }) {
  return (
    <section className="sec-lg text-center">
      <Reveal>
        <p className="font-serif italic text-taupe text-lead">Together with their families</p>
        <h2 className="caps text-mocha text-display mt-6 md:mt-8">
          {info.groom}<span className="block script normal-case tracking-normal text-wine text-script-sm my-1">and</span>{info.bride}
        </h2>
        <p className="font-serif italic text-mocha text-lead mt-8 max-w-xl mx-auto text-balance">
          request the pleasure of your company<br />at the celebration of their marriage
        </p>
        <Flourish className="w-48 md:w-56 mx-auto my-8 text-taupe/70" />
        <p className="caps text-mocha text-body text-balance">{longDate(info.date)}</p>
        <p className="font-serif italic text-taupe text-body mt-2 text-balance">{info.venue_name}, {info.venue_address}</p>
      </Reveal>
    </section>
  );
}

/* ─────────── OUR STORY ─────────── */
export function Story({ info }: { info: WeddingInfo }) {
  return (
    <section id="story" className="sec">
      <div className="col-wide grid md:grid-cols-2 gap-10 md:gap-16 items-center">
        <div className="flex justify-center gap-4 md:gap-8">
          <PhotoStrip photos={slots(info, 0, 4)} caption={`J & S · ${fullDate(info.date)}`} rotate={-3} className="w-[46%] max-w-[200px]" />
          <PhotoStrip photos={slots(info, 0, 4).slice(2).concat(slots(info, 0, 2))} caption="#JSGotMarried" rotate={2.5} className="w-[46%] max-w-[200px] mt-8 md:mt-10" />
        </div>
        <div className="text-center md:text-left">
          <Reveal><p className="micro text-taupe">Our Story</p>
            <h2 className="script text-wine text-script mt-2 text-balance">A wish come true</h2></Reveal>
          <Reveal delay={0.1}><p className="font-serif text-lead text-mocha mt-6 text-pretty">{info.story}</p></Reveal>
          <Reveal delay={0.2}><p className="micro text-wine mt-6">{info.hashtags.join("   ")}</p></Reveal>
        </div>
      </div>
    </section>
  );
}

/* ─────────── 11.11 INTERLUDE ─────────── */
export function ElevenEleven({ info }: { info: WeddingInfo }) {
  const d = fullDate(info.date);
  return (
    <section className="sec-sm overflow-hidden text-center">
      <div className="col-wide relative py-10 md:py-16 border-y border-taupe/25">
        <Reveal>
          <div className="flex items-center justify-center gap-3 md:gap-10">
            <Paisley className="w-7 h-11 md:w-12 md:h-20 text-taupe/70 -scale-x-100" />
            <p className="font-serif font-light text-wine text-numeral tracking-tight [text-shadow:0_2px_0_rgba(255,255,255,.9),0_-1px_1px_rgba(60,20,30,.3),0_18px_30px_rgba(110,31,46,.18)]">{d.slice(0, 5)}</p>
            <Paisley className="w-7 h-11 md:w-12 md:h-20 text-taupe/70" />
          </div>
          <p className="font-serif font-light text-wine text-year tracking-[0.18em] mt-1 md:-mt-1 pl-[0.18em] [text-shadow:0_2px_0_rgba(255,255,255,.9),0_-1px_1px_rgba(60,20,30,.3)]">{d.slice(6)}</p>
          <p className="font-serif italic text-mocha text-lead mt-5">Make a wish — ours comes true.</p>
        </Reveal>
      </div>
    </section>
  );
}

/* ─────────── THE DAY ─────────── */
/** Line-art medallion icon chosen from the program title (sized to sit inside a 52px medallion on phones). */
function ProgramIcon({ title }: { title: string }) {
  const t = title.toLowerCase();
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (t.includes("ceremony")) return <Paisley className="w-6 h-9 md:w-10 md:h-14" />;
  if (t.includes("cocktail") || t.includes("mingl")) return (
    <svg viewBox="0 0 48 48" className="w-8 h-8 md:w-12 md:h-12" {...common}><path d="M10 8h12l-1.5 12a4.5 4.5 0 01-9 0zM16 25v13M11 38h10M38 8H26l1.5 12a4.5 4.5 0 009 0zM32 25v13M27 38h10M22 4l2-3M26 5l3-2M24 12h0" /><circle cx="15" cy="15" r="1" fill="currentColor" /><circle cx="33" cy="14" r="1" fill="currentColor" /></svg>
  );
  if (t.includes("reception") || t.includes("dinner") || t.includes("party")) return (
    <svg viewBox="0 0 48 48" className="w-8 h-8 md:w-12 md:h-12" {...common}><circle cx="24" cy="22" r="11" /><path d="M13 22h22M24 11v22M16 14c4 3 12 3 16 0M16 30c4-3 12-3 16 0M24 5v6" /><path d="M8 40l3-3M40 40l-3-3M6 30h3M39 30h3M24 38v4" strokeWidth="1" /></svg>
  );
  return <svg viewBox="0 0 24 24" className="w-7 h-7 md:w-10 md:h-10" fill="currentColor"><path d="M12 2l2.6 6.6L21 9.3l-5 4.4 1.6 6.8L12 16.8 6.4 20.5 8 13.7 3 9.3l6.4-.7z" /></svg>;
}

/**
 * Renders *highlighted phrases* with a highlighter-pen sweep when `on` (played once).
 * The phrase is plain inline text with a background gradient, so a long phrase wraps with the paragraph
 * instead of overflowing a narrow card — and the sweep never changes the layout.
 */
function Highlighted({ text, on }: { text: string; on: boolean }) {
  const parts = text.split(/(\*[^*]+\*)/g);
  let k = 0;
  return (
    <>
      {parts.map((p, idx) => {
        if (!p.startsWith("*")) return <span key={idx}>{p}</span>;
        const d = 0.3 + k++ * 0.25;
        return (
          <motion.span key={idx} initial={false} animate={{ backgroundSize: on ? "100% 55%" : "0% 55%" }} transition={{ delay: on ? d : 0, duration: 0.7, ease: EASE_OUT }}
            className="not-italic font-medium text-ink px-0.5 bg-no-repeat bg-[position:0_88%] bg-gradient-to-r from-[#E8C3BC]/80 to-[#E8C3BC]/80 [box-decoration-break:clone] [-webkit-box-decoration-break:clone]">
            {p.slice(1, -1)}
          </motion.span>
        );
      })}
    </>
  );
}

/**
 * One stop on the journey map: a medallion on the dotted path + an angled paper card.
 * Everything is visible from the start (time, title, full details) — nothing grows, shrinks or rotates while you
 * scroll, so the page height never changes. The card rises in once; the highlighter sweeps once.
 */
function ProgramStop({ s, i }: { s: ScheduleItem; i: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });
  const right = i % 2 === 1;
  const tilt = right ? 1.5 : -1.5;
  return (
    <div ref={ref} className={`relative flex items-start mb-stack ${right ? "md:flex-row-reverse" : ""}`}>
      {/* medallion on the path (centred with a negative margin — a transform here would be overridden by the entrance animation) */}
      <div className="relative z-[2] shrink-0 mt-7 md:mt-0 w-[52px] h-[52px] md:w-24 md:h-24 md:absolute md:left-1/2 md:-ml-12 md:top-2">
        <motion.div initial={{ opacity: 0, scale: 0.85 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, margin: "-8%" }} transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.1 }}
          className="relative w-full h-full rounded-full bg-[#FBF7EF] border-2 border-wine/60 grid place-items-center text-wine shadow-[0_8px_18px_-8px_rgba(61,47,38,.55)]">
          <div className="absolute inset-1 md:inset-1.5 rounded-full border border-wine/25" />
          <ProgramIcon title={s.title} />
          <span className="absolute -bottom-1.5 md:-bottom-2 left-1/2 -ml-3 md:-ml-3.5 bg-wine text-lace rounded-full w-6 h-6 md:w-7 md:h-7 grid place-items-center font-serif text-[13px] md:text-sm font-semibold leading-none">{i + 1}</span>
        </motion.div>
      </div>

      {/* the card — overlaps the medallion's edge on phones so the text column stays wide */}
      <motion.div {...rise(0, 26)} className="relative flex-1 min-w-0 -ml-3 md:ml-0 md:flex-none md:w-[calc(50%-4.5rem)]">
        <div style={{ transform: `rotate(${tilt}deg)` }} className="relative [filter:drop-shadow(0_14px_14px_rgba(61,47,38,.2))]">
          {/* time tag like a luggage label — a sibling of the torn-edge card (not inside it), so the card's clip-path can never slice it */}
          <div className="absolute z-[2] -top-4 left-4 md:left-6 w-max max-w-[calc(100%-2rem)] bg-wine text-lace pl-4 pr-7 py-1.5 [clip-path:polygon(0_0,calc(100%-11px)_0,100%_50%,calc(100%-11px)_100%,0_100%)]">
            <span className="block font-serif font-semibold uppercase text-tag tracking-[0.08em] leading-tight lining-nums">{s.time}</span>
          </div>
          <div className="paper-card deckle relative px-5 md:px-8 pt-9 pb-6 md:pt-11 md:pb-8">
            <div className="absolute inset-2 border border-taupe/25 pointer-events-none" />
            <h3 className="font-serif text-h3 text-ink text-balance">{s.title}</h3>
            <p className="font-serif italic text-body text-mocha mt-3"><Highlighted text={s.detail} on={seen} /></p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function Schedule({ items }: { items: ScheduleItem[] }) {
  const sorted = [...items].sort((a, b) => a.order - b.order);
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 60%"] });
  const draw = useSpring(scrollYProgress, { stiffness: 80, damping: 20 });
  return (
    <section id="day" className="sec">
      <Title kicker="Order of the Day" title="The Day" />
      <Reveal className="text-center mt-6 md:mt-8">
        <p className="inline-block font-serif text-fine md:text-body text-ink bg-[#FBF6EE] border border-wine/30 rounded-[1.75rem] md:rounded-full px-5 md:px-6 py-2 shadow-sm text-balance">
          Everyone is welcome from <b className="text-wine lining-nums">5:00 PM</b> until the last dance
        </p>
      </Reveal>
      <div ref={ref} className="relative col-wide mt-head">
        {/* the journey path — draws itself as you scroll (a drawing effect only: it doesn't touch the layout) */}
        <svg aria-hidden className="absolute left-[10px] md:left-1/2 md:-translate-x-1/2 top-0 h-full w-8 md:w-40 overflow-visible" viewBox="0 0 100 1000" preserveAspectRatio="none">
          <defs>
            <mask id="journey-mask" maskUnits="userSpaceOnUse" x="-50" y="0" width="200" height="1000">
              <motion.path d="M50 0 C95 120 5 220 50 333 C95 450 5 550 50 666 C95 780 5 880 50 1000" stroke="#fff" strokeWidth="30" fill="none" style={{ pathLength: draw }} />
            </mask>
          </defs>
          <path d="M50 0 C95 120 5 220 50 333 C95 450 5 550 50 666 C95 780 5 880 50 1000" stroke="#6E1F2E" strokeOpacity=".12" strokeWidth="2" fill="none" vectorEffect="non-scaling-stroke" strokeDasharray="2 7" />
          <path d="M50 0 C95 120 5 220 50 333 C95 450 5 550 50 666 C95 780 5 880 50 1000" stroke="#6E1F2E" strokeOpacity=".7" strokeWidth="2.2" fill="none" vectorEffect="non-scaling-stroke" strokeDasharray="3 8" strokeLinecap="round" mask="url(#journey-mask)" />
        </svg>
        {sorted.map((s, i) => <ProgramStop key={s.id} s={s} i={i} />)}
        <Reveal className="relative text-center">
          <span className="script text-wine text-script-sm text-balance">…and happily ever after</span>
        </Reveal>
      </div>
    </section>
  );
}

/* ─────────── VENUE ─────────── */
export function Venue({ info }: { info: WeddingInfo }) {
  return (
    <section id="venue" className="sec">
      <Title kicker="Where" title="The Venue" />
      <div className="col-wide grid md:grid-cols-[1fr_1.3fr] gap-8 md:gap-14 mt-head items-center">
        <Reveal className="text-center md:text-left">
          <h3 className="caps text-mocha text-display">{info.venue_name}</h3>
          <p className="font-serif italic text-taupe text-body mt-3">{info.venue_address}</p>
          <p className="font-serif text-mocha text-body mt-4">{longDate(info.date)}</p>
          <a href={info.venue_map_link} target="_blank" rel="noreferrer" className="micro inline-block mt-8 text-lace bg-wine rounded-full px-8 py-4 hover:bg-mocha transition-colors">Get Directions</a>
        </Reveal>
        <Reveal delay={0.1}>
          <Tilt max={5}><div className="relative paper-card p-4 md:p-8 shadow-[0_2px_3px_rgba(61,47,38,.15),0_30px_60px_-30px_rgba(61,47,38,.55)]">
            {/* lace border across the top and bottom edges, like the letter */}
            <div aria-hidden className="lace-trim absolute z-[6] -top-3 md:-top-4 -inset-x-1" style={{ transform: "scaleY(-1)" }} />
            <div aria-hidden className="lace-trim lace-trim-bottom absolute z-[6] -bottom-3 md:-bottom-4 -inset-x-1" />
            <Corners className="w-14 h-14 md:w-20 md:h-20" inset="0" />
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
  return (
    <section id="dress" className="sec">
      <Title kicker="What to Wear" title="Attire" />
      <AttireGuide guests={guests} />
      <div className="col-wide mt-10 md:mt-12">
        <p className="micro text-taupe text-center mb-6 text-balance">Reserved for the couple, family &amp; entourage — kindly avoid</p>
        {/* two columns on phones (the odd last card spans both, so there's no orphan), three rows of two on wide screens */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 max-w-4xl mx-auto">
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
  const sorted = [...people].sort((a, b) => a.order - b.order);
  const by = (r: EntourageMember["role"]) => sorted.filter((p) => p.role === r);
  // two columns everywhere — his side left, her side right — so neither family reads as "first"
  const bride = by("bride_family"), groom = by("groom_family");
  const sponsors = by("sponsor");
  const groomsmen = by("groomsman"), bridesmaids = by("bridesmaid");
  const others = by("other");
  const half = Math.ceil(sponsors.length / 2);
  const Person = ({ p }: { p: EntourageMember }) => (
    <li><p className="font-serif text-lead md:text-h3 text-ink text-balance">{p.name}</p>{p.title && <p className="font-serif italic text-taupe text-tag md:text-fine">{p.title}</p>}</li>
  );
  const List = ({ list, className = "" }: { list: EntourageMember[]; className?: string }) => (
    <ul className={`space-y-3 ${className}`}>{list.map((p) => <Person key={p.id} p={p} />)}</ul>
  );
  const Divider = () => (
    <div aria-hidden className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 flex flex-col items-center">
      <div className="flex-1 w-px bg-taupe/35" /><Paisley className="w-8 h-12 md:w-10 md:h-14 text-wine/70 my-3" /><div className="flex-1 w-px bg-taupe/35" />
    </div>
  );
  return (
    <section id="family" className="sec">
      <Title kicker="The Hearts Behind Us" title="Our Families" />
      {(bride.length > 0 || groom.length > 0) && (
        <Reveal className="col-wide mt-head">
          <p className="font-serif italic text-mocha text-lead text-center text-balance">With grateful hearts and the blessing of our parents</p>
          <div className="relative grid grid-cols-2 gap-8 md:gap-0 mt-8 text-center">
            <Divider />
            <div className="px-2 md:px-12">
              <p className="micro text-wine mb-4">Parents of the Groom</p>
              <List list={groom} />
            </div>
            <div className="px-2 md:px-12">
              <p className="micro text-wine mb-4">Parents of the Bride</p>
              <List list={bride} />
            </div>
          </div>
        </Reveal>
      )}
      <Flourish className="w-48 md:w-56 mx-auto mt-10 md:mt-12 text-taupe/70" />
      <p className="micro text-taupe text-center mt-5">Standing with us</p>
      <div className="col-wide mt-8 text-center space-y-10 md:space-y-12">
        {sponsors.length > 0 && (
          <Reveal>
            <p className="micro text-wine mb-4 text-center">Principal Sponsors</p>
            {sponsors.length === 1 ? (
              <List list={sponsors} className="max-w-sm mx-auto" />
            ) : (
              <div className="relative grid grid-cols-2 gap-8 md:gap-0">
                <Divider />
                <div className="px-2 md:px-10"><List list={sponsors.slice(0, half)} /></div>
                <div className="px-2 md:px-10"><List list={sponsors.slice(half)} /></div>
              </div>
            )}
          </Reveal>
        )}
        {(groomsmen.length > 0 || bridesmaids.length > 0) && (
          <Reveal>
            <div className="relative grid grid-cols-2 gap-8 md:gap-0">
              <Divider />
              <div className="px-2 md:px-10">
                <p className="micro text-wine mb-4">Groomsmen</p>
                <List list={groomsmen} />
              </div>
              <div className="px-2 md:px-10">
                <p className="micro text-wine mb-4">Bridesmaids</p>
                <List list={bridesmaids} />
              </div>
            </div>
          </Reveal>
        )}
        {others.length > 0 && (
          <Reveal>
            <p className="micro text-wine mb-4 text-center">With Love</p>
            <List list={others} className="max-w-sm mx-auto" />
          </Reveal>
        )}
      </div>
    </section>
  );
}

/* ─────────── RSVP (reply card) ─────────── */
export function Rsvp({ info, invite, code, onReplied }: { info: WeddingInfo; invite: InviteState; code: string; onReplied: () => void }) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [err, setErr] = useState("");
  const [approved, setApproved] = useState<boolean | null>(null);
  const [f, setF] = useState({ name: invite.name, phone: "", attending: "yes" as "yes" | "no", pax: 1, dietary: "", message: "", song_request: "", plus_one: "" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const seatCap = invite.pax || 1;
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
          <p className="micro text-taupe mt-1">{invite.name} · {yes ? `${reply.pax} seat${reply.pax > 1 ? "s" : ""} saved` : "declined with love"}</p>
        </div>
        <div className="col mt-head">
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
      <div className="col mt-head">
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
          <div className="paper-card relative px-5 md:px-14 pt-10 pb-12 md:pt-14 md:pb-16 shadow-[0_2px_3px_rgba(61,47,38,.15),0_40px_80px_-40px_rgba(61,47,38,.55)] min-h-[560px]">
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
                </motion.div>
              ) : (
                <motion.form key="form" onSubmit={submit} exit={{ opacity: 0 }} className="relative space-y-6 text-center">
                  <p className="micro text-moss tracking-[0.18em]">Invitation — {invite.name} · up to {seatCap} seat{seatCap > 1 ? "s" : ""}</p>
                  <p className="font-serif italic text-body text-mocha text-balance">Fill this in now — it takes less than a minute.</p>
                  <input className="field text-center" placeholder="Your full name" required value={f.name} onChange={set("name")} maxLength={120} />
                  <input className="field text-center" placeholder="WhatsApp number" type="tel" value={f.phone} onChange={set("phone")} maxLength={40} />
                  <div className="flex flex-wrap justify-center gap-3 pt-2">
                    <button type="button" className={choice(f.attending === "yes")} onClick={() => setF({ ...f, attending: "yes" })}>Joyfully accepts</button>
                    <button type="button" className={choice(f.attending === "no")} onClick={() => setF({ ...f, attending: "no" })}>Regretfully declines</button>
                  </div>
                  {f.attending === "yes" && (
                    <div className="flex justify-center items-center gap-3">
                      <span className="font-serif italic text-taupe text-body mr-2">Number of guests</span>
                      {[1, 2].map((n) => <button key={n} type="button" disabled={seatCap < n} className={choice(f.pax === n) + (seatCap < n ? " opacity-35 pointer-events-none" : "")} onClick={() => setF({ ...f, pax: n })}>{n}</button>)}
                    </div>
                  )}
                  {f.attending === "yes" && f.pax === 2 && (
                    <div className="space-y-2">
                      <input className="field text-center" placeholder="Name of your plus-one" required value={f.plus_one} onChange={set("plus_one")} maxLength={120} />
                      <p className="micro text-taupe tracking-[0.14em]">Two seats always wait for the couple&apos;s personal confirmation</p>
                    </div>
                  )}
                  <input className="field text-center" placeholder="Dietary requirements" value={f.dietary} onChange={set("dietary")} maxLength={200} />
                  <input className="field text-center" placeholder="A song to get you dancing" value={f.song_request} onChange={set("song_request")} maxLength={200} />
                  <textarea className="field text-center resize-none" rows={2} placeholder="A little note for the couple" value={f.message} onChange={set("message")} maxLength={1000} />
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

export function Footer({ info }: { info: WeddingInfo }) {
  const handle = info.instagram.replace("@", "");
  return (
    <footer className="relative px-5 pt-12 pb-10 text-center">
      <Flourish className="w-48 md:w-56 mx-auto text-taupe/70" />
      <p className="script text-wine text-script mt-6 text-balance">{info.groom} &amp; {info.bride}</p>
      <p className="font-serif font-light text-mocha text-display mt-3 tracking-[0.12em]">{fullDate(info.date)}</p>
      <div className="flex flex-col md:flex-row justify-center gap-2 md:gap-10 mt-8 micro text-taupe">
        <a href={`https://instagram.com/${handle}`} target="_blank" rel="noreferrer" className="hover:text-wine">{info.instagram}</a>
        <span className="text-wine">{info.hashtags.join("  ")}</span>
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
