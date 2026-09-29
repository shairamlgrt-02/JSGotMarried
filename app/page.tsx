"use client";
import Ambience from "@/components/public/Ambience";
import EnvelopeHero from "@/components/public/Envelope";
import Letter from "@/components/public/Letter";
import { ProgressBar, SmoothScroll } from "@/components/public/fx";
import { DressCode, ElevenEleven, Entourage, FaqSection, Footer, Gallery, Invitation, PolaroidPair, RsvpNudge, SignOff, Rsvp, Schedule, Story, Venue } from "@/components/public/sections";
import { Moments, MusicButton, SidePolaroids } from "@/components/public/photos";
import { Postcard, Postmark, Stamp, StickOn, Sticker } from "@/components/public/stickers";

/** Places a sticker/stamp in a section's top padding (never over the text). */
const Deco = ({ children, at, rotate, className = "" }: { children: React.ReactNode; at: "tl" | "tr"; rotate: number; className?: string }) => (
  <div className={`absolute z-[3] top-2 md:top-8 ${at === "tl" ? "left-3 md:left-10" : "right-3 md:right-10"} pointer-events-none ${className}`}><StickOn rotate={rotate}>{children}</StickOn></div>
);
const D = ({ deco, children, className = "" }: { deco: React.ReactNode; children: React.ReactNode; className?: string }) => <div className={`relative ${className}`}>{deco}{children}</div>;
import { useTable } from "@/lib/hooks";

export default function Home() {
  const { rows: infoRows } = useTable("wedding_info");
  const { rows: schedule } = useTable("schedule");
  const { rows: attire } = useTable("attire");
  const { rows: entourage } = useTable("entourage");
  const { rows: faq } = useTable("faq");
  const info = infoRows[0];
  return (
    <>
      <Ambience />
      <main className="relative z-[1] overflow-x-clip">
        <SmoothScroll /><ProgressBar />
        <EnvelopeHero info={info} />
        <Letter aside={<SidePolaroids info={info} />}>
            <D deco={<Deco at="tr" rotate={7}><Stamp kind="rings" className="w-12 md:w-24" /></Deco>}><Invitation info={info} /></D>
            <D deco={<Deco at="tl" rotate={-8}><Sticker kind="wish" className="scale-[.62] md:scale-100 origin-top-left" /></Deco>}><Story info={info} /></D>
            <D deco={<Deco at="tr" rotate={-6}><Stamp kind="date" className="w-12 md:w-24" /></Deco>}><ElevenEleven info={info} /></D>
            <PolaroidPair info={info} from={8} caps={["us", "11.11"]} />
            <D deco={<Deco at="tr" rotate={5}><Sticker kind="wedo" className="text-sm" /></Deco>}><Schedule items={schedule} /></D>
            <D deco={<Deco at="tl" rotate={-4}><Postmark className="w-28 md:w-48" /></Deco>}><Venue info={info} /></D>
            <Postcard from={`${info.groom} & ${info.bride}`} venue={info.venue_name} date="11.11.2026" />
            <Gallery info={info} />
            <D deco={<Deco at="tr" rotate={-10}><Sticker kind="ido" className="block scale-[.62] md:scale-100 origin-top-right" /></Deco>}><DressCode attire={attire} /></D>
            <PolaroidPair info={info} from={10} caps={["always", "forever"]} />
            {entourage.length > 0 && <D deco={<Deco at="tl" rotate={-7}><Stamp kind="initials" className="w-12 md:w-24" /></Deco>}><Entourage people={entourage} /></D>}
            <Rsvp info={info} />
            <D deco={<Deco at="tr" rotate={6}><Sticker kind="dance" className="text-sm" /></Deco>}><FaqSection faqs={faq} /></D>
            <Moments info={info} />
            <D className="pt-16 md:pt-8" deco={<Deco at="tl" rotate={-6}><Sticker kind="cheers" /></Deco>}><SignOff info={info} /></D>
        </Letter>
        <Footer info={info} />
        <MusicButton src={info.music_url} />
        <RsvpNudge info={info} />
      </main>
    </>
  );
}
