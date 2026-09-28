"use client";
import Loader from "@/components/public/Loader";
import { Cursor, ProgressBar, SmoothScroll, Vines } from "@/components/public/fx";
import { DressCode, Entourage, FaqSection, Footer, Gallery, Hero, Rsvp, Schedule, Venue, Wish, dotDate } from "@/components/public/sections";
import { useTable } from "@/lib/hooks";

export default function Home() {
  const { rows: infoRows } = useTable("wedding_info");
  const { rows: schedule } = useTable("schedule");
  const { rows: attire } = useTable("attire");
  const { rows: entourage } = useTable("entourage");
  const { rows: faq } = useTable("faq");
  const info = infoRows[0];
  return (
    <main className="grain cursor-none-desktop relative">
      <div className="vignette" />
      <SmoothScroll /><ProgressBar /><Cursor /><Vines />
      <Loader dateLabel={dotDate(info.date)} />
      <Hero info={info} />
      <Wish info={info} />
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
