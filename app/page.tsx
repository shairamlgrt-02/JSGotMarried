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
  // Everything lies flat ON the letter, fixed per section. Real-world relative scale:
  // veil (huge) > shoe ≈ envelope ≈ garter ≈ pen > bowtie > rings > wax seal. vw-based so proportions hold on phones.
  const over = (
    <>
      <Peek src="/img/veil.webp" side="right" top="0.5%" width="117vw" rotate={-14} edge={0.9} edgeMobile={0.93} />
      <Peek src="/img/rings_flat.webp" side="left" top="6%" width="clamp(140px, 20vw, 300px)" rotate={-22} edge={0.55} edgeMobile={0.62} />
      <Peek src="/img/pen.webp" side="right" top="15%" width="40vw" rotate={28} edge={0.62} edgeMobile={0.72} />
      <Peek src="/img/seal.webp" side="left" top="22%" width="clamp(80px, 10vw, 140px)" rotate={-18} edge={0.45} edgeMobile={0.6} />
      <Peek src="/img/bowtie.webp" side="right" top="28%" width="22vw" rotate={-24} edge={0.6} mobile={false} />
      <Peek src="/img/shoe_flat.webp" side="left" top="34%" width="40vw" rotate={72} edge={0.6} edgeMobile={0.72} />
      <Peek src="/img/garter.webp" side="right" top="43%" width="45vw" rotate={16} edge={0.7} edgeMobile={0.78} />
      <Peek src="/img/veil.webp" side="left" top="51%" width="110vw" rotate={166} edge={0.92} edgeMobile={0.94} flip />
      <Peek src="/img/envelope_flat.webp" side="right" top="60%" width="42vw" rotate={-10} edge={0.7} edgeMobile={0.8} />
      <Peek src="/img/seal.webp" side="right" top="69%" width="clamp(70px, 9vw, 130px)" rotate={22} edge={0.4} mobile={false} />
      <Peek src="/img/shoe_flat.webp" side="right" top="76%" width="38vw" rotate={-104} edge={0.6} edgeMobile={0.72} flip />
      <Peek src="/img/pen.webp" side="left" top="85%" width="38vw" rotate={-150} edge={0.62} mobile={false} />
      <Peek src="/img/garter.webp" side="left" top="92%" width="42vw" rotate={196} edge={0.7} edgeMobile={0.8} />
      <Peek src="/img/rings_flat.webp" side="right" top="96%" width="clamp(120px, 17vw, 260px)" rotate={30} edge={0.5} mobile={false} />
    </>
  );
  return (
    <>
      <Ambience />
      <main className="relative z-[1] overflow-x-clip">
        <SmoothScroll /><ProgressBar />
        <EnvelopeHero info={info} />
        <Letter over={over}>
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
