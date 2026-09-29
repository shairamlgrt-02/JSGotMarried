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
  // Real-world relative scale: veil (huge) > shoes > garter > bowtie > rings. Sizes in vw so proportions hold on phones.
  const under = (
    <>
      <Peek src="/img/veil.webp" side="right" top="1%" width="78vw" rotate={-18} edge={0.3} />
      <Peek src="/img/shoes.webp" side="right" top="19%" width="44vw" rotate={96} edge={0.46} />
      <Peek src="/img/garter.webp" side="right" top="41%" width="30vw" rotate={18} edge={0.42} />
      <Peek src="/img/veil.webp" side="left" top="50%" width="74vw" rotate={164} edge={0.32} flip />
      <Peek src="/img/shoes.webp" side="left" top="67%" width="42vw" rotate={-84} edge={0.46} flip />
      <Peek src="/img/garter.webp" side="left" top="87%" width="28vw" rotate={196} edge={0.42} mobile={false} />
    </>
  );
  const over = (
    <>
      <Peek src="/img/rings.webp" side="left" top="8%" width="clamp(70px, 10vw, 150px)" rotate={24} edge={0.72} layer="over" speed={0.12} />
      <Peek src="/img/bowtie.webp" side="left" top="30%" width="22vw" rotate={-28} edge={0.62} layer="over" />
      <Peek src="/img/rings.webp" side="right" top="76%" width="clamp(64px, 9vw, 140px)" rotate={-32} edge={0.7} layer="over" speed={0.12} />
      <Peek src="/img/bowtie.webp" side="right" top="94%" width="20vw" rotate={34} edge={0.6} layer="over" mobile={false} />
    </>
  );
  return (
    <>
      <Ambience />
      <main className="relative z-[1] overflow-x-clip">
        <SmoothScroll /><ProgressBar />
        <EnvelopeHero info={info} />
        <Letter under={under} over={over}>
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
