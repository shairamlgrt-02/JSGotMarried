"use client";
import EnvelopeHero from "@/components/public/Envelope";
import { ProgressBar, SmoothScroll } from "@/components/public/fx";
import { DressCode, ElevenEleven, Entourage, FaqSection, Footer, Gallery, Invitation, Rsvp, Schedule, Story, Venue } from "@/components/public/sections";
import { useTable } from "@/lib/hooks";

export default function Home() {
  const { rows: infoRows } = useTable("wedding_info");
  const { rows: schedule } = useTable("schedule");
  const { rows: attire } = useTable("attire");
  const { rows: entourage } = useTable("entourage");
  const { rows: faq } = useTable("faq");
  const info = infoRows[0];
  return (
    <main className="relative z-[1]">
      <SmoothScroll /><ProgressBar />
      <EnvelopeHero info={info} />
      <Invitation info={info} />
      <Story info={info} />
      <ElevenEleven info={info} />
      <Schedule items={schedule} />
      <Venue info={info} />
      <DressCode attire={attire} />
      {entourage.length > 0 && <Entourage people={entourage} />}
      <Rsvp info={info} />
      <FaqSection faqs={faq} />
      <Gallery info={info} />
      <Footer info={info} />
    </main>
  );
}
