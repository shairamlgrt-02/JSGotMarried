"use client";
import Ambience from "@/components/public/Ambience";
import EnvelopeHero from "@/components/public/Envelope";
import Letter, { Page } from "@/components/public/Letter";
import { ProgressBar, SmoothScroll } from "@/components/public/fx";
import { DressCode, ElevenEleven, Entourage, FaqSection, Footer, Gallery, Invitation, SignOff, Rsvp, Schedule, Story, Venue } from "@/components/public/sections";
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
        <Letter>
          <Page n={1}>
            <Invitation info={info} />
            <Story info={info} />
          </Page>
          <Page n={2} tilt={-0.35}>
            <ElevenEleven info={info} />
            <Schedule items={schedule} />
          </Page>
          <Page n={3} tilt={0.3}>
            <Venue info={info} />
            <DressCode attire={attire} />
          </Page>
          <Page n={4} tilt={-0.25}>
            {entourage.length > 0 && <Entourage people={entourage} />}
            <Rsvp info={info} />
          </Page>
          <Page n={5} tilt={0.2}>
            <FaqSection faqs={faq} />
            <Gallery info={info} />
            <SignOff info={info} />
          </Page>
        </Letter>
        <Footer info={info} />
      </main>
    </>
  );
}
