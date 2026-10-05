"use client";
import { MotionConfig } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import Ambience from "@/components/public/Ambience";
import EnvelopeHero, { BAKED_COVER } from "@/components/public/Envelope";
import Letter from "@/components/public/Letter";
import { ProgressBar, ScrollContinue, SmoothScroll } from "@/components/public/fx";
import { CountdownSection, DressCode, ElevenEleven, Entourage, FaqSection, FollowAndTag, Footer, Gallery, PolaroidPair, RsvpNudge, SignOff, Rsvp, Schedule, Story, Venue } from "@/components/public/sections";
import { Moments, MusicButton, SidePolaroids } from "@/components/public/photos";
import VoiceGuestbook from "@/components/public/VoiceGuestbook";
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
 * without a valid one the private pages — invitation wording, programme, venue, postcard, RSVP
 * and FAQ — stay sealed, and a used code turns the reply card into a sealed welcome card.
 *
 * `variant="preview"` is the shareable …/preview page: sealed on purpose, with a line pointing at
 * the code door. It reads as a guest's even for the signed-in binder — the couple opts into the
 * finished site with …/preview?all=1 (that's `preview` below, kept separate from `admin` so the
 * plain preview still shows the sealed notice), and the server withholds the venue/programme/FAQ
 * fields for every sealed visitor anyway.
 */
export default function Home({ code = "", variant = "guest" }: { code?: string; variant?: "guest" | "preview" }) {
  const activeCode = useMemo(() => {
    if (variant === "preview") return "";
    const fromQuery = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("rsvp") || "" : "";
    return (code || fromQuery).trim().toUpperCase();
  }, [code, variant]);

  // The sensitive tables are asked for *with* the guest's code, so the server only answers with
  // the venue, the programme and the FAQ for a code the couple actually issued.
  const { rows: infoRows } = useTable("wedding_info", true, activeCode);
  const { rows: schedule } = useTable("schedule", true, activeCode);
  const { rows: attire } = useTable("attire");
  const { rows: entourage } = useTable("entourage");
  const { rows: faq } = useTable("faq", true, activeCode);
  const { rows: storyChapters } = useTable("story");
  const info = infoRows[0];
  const hasInstagram = !!(info?.instagram || "").replace(/^@/, "").trim();
  /** The dress-code in one breath for printed/keepsake summaries ("Black tie in glossy greens and warm shining browns"). */
  const dressNote = useMemo(() => (attire.find((a) => a.group === "guests")?.notes || "").split("—")[0].replace(/\.?\s*$/, "").trim(), [attire]);

  const [invite, setInvite] = useState<InviteState | null>(null);
  const [codeState, setCodeState] = useState<"none" | "checking" | "ok" | "bad">(activeCode ? "checking" : "none");
  const [admin, setAdmin] = useState(false);
  const [preview, setPreview] = useState(false);
  useEffect(() => {
    if (activeCode) return;
    fetch("/api/mode", { cache: "no-store" }).then((r) => r.json()).then((j) => {
      const signedIn = !!j.admin;
      setAdmin(signedIn);
      // …/preview stays the sealed guest view even for the binder; the couple opts into the
      // finished site — venue, programme, reply card — with ?all=1 (or ?admin=1).
      const search = new URLSearchParams(window.location.search);
      setPreview(signedIn && (search.has("all") || search.has("admin")));
    }).catch(() => {});
  }, [activeCode]);
  const load = useMemo(() => () => {
    if (!activeCode) { setCodeState("none"); return; }
    // note: no "checking" flash on refetch — unmounting the reply card mid-animation would drop its state
    fetchInvite(activeCode).then((r) => { if (r) { setInvite(r); setCodeState("ok"); } else { setInvite(null); setCodeState("bad"); } });
  }, [activeCode]);
  useEffect(() => { load(); }, [load]);
  const unlocked = (codeState === "ok" && !!invite) || preview;
  const rsvpInvite: InviteState = invite ?? { name: "Preview guest", pax: 2, reply: null };
  /** The code the reply is written under — the canonical one, in case a guest only typed the last four characters. */
  const replyCode = invite?.code || activeCode;

  // …/JS-7KQF#rsvp (where /rsvp hands a guest over) should land on the card, not the top of the
  // letter. The reply card only mounts once the invite has been read, and the smooth-scroll layer
  // needs a beat to wake up — so it is nudged twice rather than trusted to one anchor jump.
  useEffect(() => {
    if (!unlocked || window.location.hash !== "#rsvp") return;
    const to = (ms: number) => setTimeout(() => {
      const el = document.getElementById("rsvp");
      if (el && el.getBoundingClientRect().top > 8) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, ms);
    const a = to(420); const b = to(1300);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [unlocked]);

  return (
    <MotionConfig reducedMotion="user">
      <Ambience />
      <main className="relative z-[1] overflow-x-clip">
        <SmoothScroll /><ProgressBar />
        <EnvelopeHero info={info} sealed={!unlocked} home />
        <Letter aside={<SidePolaroids info={info} />}>
            {preview ? (
              <p className="micro text-moss text-center tracking-[0.16em] px-6 pt-10 md:pt-14 text-balance">Admin preview — you see everything; guests unseal this with their personal invitation link.{" "}
                <a href="/preview" className="underline decoration-moss/40 underline-offset-4 hover:text-wine transition-colors">See it as a guest →</a></p>
            ) : !unlocked ? (
              <div className="text-center px-6 pt-10 md:pt-14 space-y-4">
                <p className="micro text-taupe tracking-[0.16em] text-balance">
                  {codeState === "bad"
                    ? "We couldn't match this link to an invitation — open the personal link the couple sent you to unseal the invitation, venue, programme, FAQ and reply card."
                    : variant === "preview"
                      ? "This is the invitation preview — the day's private pages (the venue, the programme, the FAQ and your reply card) stay sealed until the couple sends them."
                      : "You're viewing the public preview — the invitation, venue, programme, FAQ and reply card unseal with your personal invitation link."}
                </p>
                <a href="/rsvp" className="inline-block micro bg-wine text-lace rounded-full px-8 py-3.5 hover:bg-mocha transition-colors tracking-[0.18em]">
                  Have an invitation code? Unlock your RSVP →
                </a>
                {admin && (
                  <p className="micro tracking-[0.16em]">
                    <a href="/preview?all=1" className="inline-block text-taupe underline decoration-taupe/40 underline-offset-4 hover:text-wine transition-colors">
                      Open the whole site, venue and all →
                    </a>
                  </p>
                )}
              </div>
            ) : null}
            <ElevenEleven info={info} code={activeCode} sealed={!unlocked} />
            {unlocked && <Postcard info={info} photo={info.cover_photo || info.gallery[0] || BAKED_COVER} />}
            <ScrollContinue />
            <D deco={<Deco at="tl" rotate={-8}><Sticker kind="wish" className="scale-[.62] md:scale-100 origin-top-left" /></Deco>}><Story info={info} chapters={storyChapters} /></D>
            <ScrollContinue />
            <VoiceGuestbook code={unlocked ? replyCode : ""} />
            <PolaroidPair info={info} from={8} caps={["us", "11.11"]} />
            <ScrollContinue />
            {unlocked && <>
              <D className="pt-6 md:pt-8" deco={<Deco at="tr" rotate={5} className="!top-1 md:!top-4 scale-[.75] origin-top-right"><Sticker kind="wedo" /></Deco>}><Schedule /></D>
              <ScrollContinue />
              <D deco={<Deco at="tl" rotate={-4}><Postmark className="w-28 md:w-48" /></Deco>}><Venue info={info} /></D>
            </>}
            <Gallery info={info} />
            <ScrollContinue />
            <D deco={<Deco at="tr" rotate={-10}><Sticker kind="ido" className="block scale-[.62] md:scale-100 origin-top-right" /></Deco>}><DressCode attire={attire} info={info} /></D>
            <PolaroidPair info={info} from={10} caps={["always", "forever"]} />
            <ScrollContinue />
            {entourage.length > 0 && <>
              <D deco={<Deco at="tl" rotate={-7}><Stamp kind="initials" className="w-12 md:w-24" /></Deco>}><Entourage people={entourage} /></D>
              <ScrollContinue />
            </>}
            {unlocked && <>
              <Rsvp info={info} invite={rsvpInvite} code={replyCode} onReplied={load} schedule={schedule} dressNote={dressNote} />
              <ScrollContinue />
              <D deco={<Deco at="tr" rotate={6}><Sticker kind="dance" /></Deco>}><FaqSection faqs={faq} /></D>
            </>}
            <Moments info={info} />
            <ScrollContinue />
            {hasInstagram && <>
              <FollowAndTag info={info} />
              <ScrollContinue />
            </>}
            <D className="pt-16 md:pt-8" deco={<Deco at="tl" rotate={-6}><Sticker kind="cheers" /></Deco>}><SignOff info={info} /></D>
            <CountdownSection info={info} sealed={!unlocked} />
        </Letter>
        <Footer info={info} />
        <MusicButton src={info.music_url} />
        {unlocked && !invite?.reply && <RsvpNudge info={info} />}
      </main>
    </MotionConfig>
  );
}
