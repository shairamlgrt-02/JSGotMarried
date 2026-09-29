"use client";
import Ambience from "@/components/public/Ambience";
import EnvelopeHero from "@/components/public/Envelope";
import Letter, { Peek } from "@/components/public/Letter";
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
  const peeks = (
    <>
      <Peek src="/img/rings.webp" alt="Wedding rings" side="right" top="2.5%" width="clamp(110px, 16vw, 230px)" rotate={-8} speed={0.35} />
      <Peek src="/img/veil.webp" side="left" top="10%" width="clamp(200px, 30vw, 460px)" rotate={8} speed={0.2} />
      <Peek src="/img/bowtie.webp" side="right" top="24%" width="clamp(110px, 15vw, 220px)" rotate={14} speed={0.45} mobile={false} />
      <Peek src="/img/garter.webp" side="left" top="36%" width="clamp(130px, 18vw, 260px)" rotate={-12} speed={0.3} />
      <Peek src="/img/shoes.webp" side="right" top="49%" width="clamp(150px, 20vw, 300px)" rotate={-6} speed={0.25} />
      <Peek src="/img/veil.webp" side="right" top="63%" width="clamp(200px, 28vw, 420px)" rotate={-10} speed={0.2} flip mobile={false} />
      <Peek src="/img/rings.webp" side="left" top="77%" width="clamp(100px, 13vw, 190px)" rotate={10} speed={0.4} mobile={false} />
      <Peek src="/img/bowtie.webp" side="left" top="90%" width="clamp(100px, 13vw, 190px)" rotate={-16} speed={0.35} />
    </>
  );
  return (
    <>
      <Ambience />
      <main className="relative z-[1] overflow-x-clip">
        <SmoothScroll /><ProgressBar />
        <EnvelopeHero info={info} />
        <Letter peeks={peeks}>
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
          <SignOff info={info} />
        </Letter>
        <Footer info={info} />
      </main>
    </>
  );
}
