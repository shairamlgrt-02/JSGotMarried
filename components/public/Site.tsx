"use client";
import { MotionConfig } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import Ambience from "@/components/public/Ambience";
import EnvelopeHero from "@/components/public/Envelope";
import Letter from "@/components/public/Letter";
import { ProgressBar, SmoothScroll } from "@/components/public/fx";
import { DressCode, ElevenEleven, Entourage, FaqSection, FollowAndTag, Footer, Gallery, Invitation, PolaroidPair, RsvpNudge, SaveTheDate, SignOff, Rsvp, Schedule, Story, Venue } from "@/components/public/sections";
import { Moments, MusicButton, SidePolaroids } from "@/components/public/photos";
import { Postcard, Postmark, Stamp, StickOn, Sticker } from "@/components/public/stickers";
import { fetchInvite, type InviteState } from "@/lib/db";

/** Places a sticker/stamp in a section's top padding (never over the text). */
const Deco = ({ children, at, rotate, className = "" }: { children: React.ReactNode; at: "tl" | "tr"; rotate: number; className?: string }) => (
  <div className={`absolute z-[3] top-2 md:top-8 ${at === "tl" ? "left-3 md:left-10" : "right-3 md:right-10"} pointer-events-none ${className}`}><StickOn rotate={rotate}>{children}</StickOn></div>
);
const D = ({ deco, children, className = "" }: { deco: React.ReactNode; children: React.ReactNode; className?: string }) => <div className={`relative ${className}`}>{deco}{children}</div>;
import { useTable } from "@/lib/hooks";

/**
 * The public site. `code` arrives from a personal invitation link (…/JS-7KQF or ?rsvp=…);
 * without a valid one the private pages — programme, venue, postcard, RSVP and FAQ —
 * stay sealed, and a used code turns the reply card into a sealed welcome card.
 */
export default function Home({ code = "" }: { code?: string }) {
  const { rows: infoRows } = useTable("wedding_info");
  const { rows: schedule } = useTable("schedule");
  const { rows: attire } = useTable("attire");
  const { rows: entourage } = useTable("entourage");
  const { rows: faq } = useTable("faq");
  const info = infoRows[0];

  const activeCode = useMemo(() => {
    const fromQuery = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("rsvp") || "" : "";
    return (code || fromQuery).trim().toUpperCase();
  }, [code]);
  const [invite, setInvite] = useState<InviteState | null>(null);
  const [codeState, setCodeState] = useState<"none" | "checking" | "ok" | "bad">(activeCode ? "checking" : "none");
  const [preview, setPreview] = useState(false);
  useEffect(() => {
    if (activeCode) return;
    fetch("/api/mode", { cache: "no-store" }).then((r) => r.json()).then((j) => setPreview(!!j.admin)).catch(() => {});
  }, [activeCode]);
  const load = useMemo(() => () => {
    if (!activeCode) { setCodeState("none"); return; }
    // note: no "checking" flash on refetch — unmounting the reply card mid-animation would drop its state
    fetchInvite(activeCode).then((r) => { if (r) { setInvite(r); setCodeState("ok"); } else { setInvite(null); setCodeState("bad"); } });
  }, [activeCode]);
  useEffect(() => { load(); }, [load]);
  const unlocked = (codeState === "ok" && !!invite) || preview;
  const rsvpInvite: InviteState = invite ?? { name: "Preview guest", pax: 2, reply: null };

  return (
    <MotionConfig reducedMotion="user">
      <Ambience />
      <main className="relative z-[1] overflow-x-clip">
        <SmoothScroll /><ProgressBar />
        <EnvelopeHero info={info} sealed={!unlocked} />
        <Letter aside={<SidePolaroids info={info} />}>
            {preview ? (
              <p className="micro text-moss text-center tracking-[0.16em] px-6 pt-10 md:pt-14 text-balance">Admin preview — you see everything; guests unseal this with their personal invitation link.</p>
            ) : !unlocked ? (
              <p className="micro text-taupe text-center tracking-[0.16em] px-6 pt-10 md:pt-14 text-balance">
                {codeState === "bad"
                  ? "We couldn't match this link to an invitation — open the personal link the couple sent you to unseal the invitation, venue, programme, FAQ and reply card."
                  : "You're viewing the public preview — the invitation, venue, programme, FAQ and reply card unseal with your personal invitation link."}
              </p>
            ) : null}
            {unlocked && <D deco={<Deco at="tr" rotate={7}><Stamp kind="rings" className="w-12 md:w-24" /></Deco>}><Invitation info={info} /></D>}
            <D deco={<Deco at="tl" rotate={-8}><Sticker kind="wish" className="scale-[.62] md:scale-100 origin-top-left" /></Deco>}><Story info={info} /></D>
            <D deco={<Deco at="tr" rotate={-6}><Stamp kind="date" className="w-12 md:w-24" /></Deco>}><ElevenEleven info={info} /></D>
            <SaveTheDate info={info} />
            <PolaroidPair info={info} from={8} caps={["us", "11.11"]} />
            {unlocked && <D deco={<Deco at="tr" rotate={5}><Sticker kind="wedo" /></Deco>}><Schedule items={schedule} /></D>}
            {unlocked && <D deco={<Deco at="tl" rotate={-4}><Postmark className="w-28 md:w-48" /></Deco>}><Venue info={info} /></D>}
            {unlocked && <Postcard from={`${info.groom} & ${info.bride}`} venue={info.venue_name} date="11.11.2026" photo={info.cover_photo || info.gallery[0]} />}
            <Gallery info={info} />
            <D deco={<Deco at="tr" rotate={-10}><Sticker kind="ido" className="block scale-[.62] md:scale-100 origin-top-right" /></Deco>}><DressCode attire={attire} /></D>
            <PolaroidPair info={info} from={10} caps={["always", "forever"]} />
            {entourage.length > 0 && <D deco={<Deco at="tl" rotate={-7}><Stamp kind="initials" className="w-12 md:w-24" /></Deco>}><Entourage people={entourage} /></D>}
            {unlocked && <Rsvp info={info} invite={rsvpInvite} code={activeCode} onReplied={load} />}
            {unlocked && <D deco={<Deco at="tr" rotate={6}><Sticker kind="dance" /></Deco>}><FaqSection faqs={faq} /></D>}
            <Moments info={info} />
            <FollowAndTag info={info} />
            <D className="pt-16 md:pt-8" deco={<Deco at="tl" rotate={-6}><Sticker kind="cheers" /></Deco>}><SignOff info={info} /></D>
        </Letter>
        <Footer info={info} />
        <MusicButton src={info.music_url} />
        {unlocked && !invite?.reply && <RsvpNudge info={info} />}
      </main>
    </MotionConfig>
  );
}
