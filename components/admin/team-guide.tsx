"use client";
import { useTable } from "@/lib/hooks";
import {
  ALL_WELCOME_FROM,
  CEREMONY_AT,
  ENTOURAGE_CALL_TIME,
  MAJLIS_LOCATION,
  RECEPTION_AT,
  WELCOME_EVENT_NAME,
} from "@/lib/program";
import { Btn, Card, PageHead } from "./ui";

const TIMELINE = [
  {
    time: ENTOURAGE_CALL_TIME,
    who: "Entourage & wedding team",
    where: "Dome Tent majlis",
    note: `Go straight to ${MAJLIS_LOCATION}. Coordinators will meet you there for the briefing.`,
  },
  {
    time: CEREMONY_AT,
    who: "Wedding party & invited ceremony guests",
    where: "Ceremony venue",
    note: "Private, closed-door ceremony begins. Please arrive on time and follow the coordinators' directions.",
  },
  {
    time: ALL_WELCOME_FROM,
    who: "All other guests",
    where: "Dome Tent majlis",
    note: `Join us for ${WELCOME_EVENT_NAME}, sips, fellowship and photos.`,
  },
  {
    time: RECEPTION_AT,
    who: "Everyone invited to the reception",
    where: "Reception hall",
    note: "The reception begins.",
  },
];

const csvCell = (value: string) => `"${value.replace(/"/g, '""')}"`;

export function TeamGuide() {
  const { rows: infoRows } = useTable("wedding_info");
  const info = infoRows[0];
  const weddingDate = info?.date
    ? new Date(info.date).toLocaleDateString("en-GB", {
        weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Bahrain",
      })
    : "11 November 2026";

  const downloadSheet = () => {
    const rows = [
      ["Time", "Who", "Where", "What to do"],
      ...TIMELINE.map((item) => [item.time, item.who, item.where, item.note]),
    ];
    const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "JSGotMarried-wedding-team-timeline.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="no-print">
        <PageHead kicker="The confirmed day-of flow" title="Wedding team guide.">
          <div className="flex flex-wrap gap-2">
            <Btn onClick={downloadSheet}>Download timeline sheet (.csv)</Btn>
            <Btn variant="ghost" onClick={() => window.print()}>Print / save as PDF</Btn>
          </div>
        </PageHead>
        <Card className="mb-5 border border-wine/15 bg-lace/60 p-5">
          <p className="font-serif text-xl text-wine">{weddingDate} · The Heaven, Damistan</p>
          <p className="mt-2 text-sm text-ink/70">
            Please use the same arrival flow below when briefing the team. This is the shared timeline;
            individual role assignments, what to prepare and what to bring will be added when those details are confirmed.
          </p>
        </Card>
      </div>

      <article className="team-guide-print mx-auto max-w-4xl rounded-2xl border border-taupe/25 bg-[#FCFAF5] p-6 shadow-sm md:p-10">
        <header className="border-b border-wine/25 pb-5 text-center">
          <p className="font-serif text-xs uppercase tracking-[0.3em] text-taupe">Jeger & Shaira · Wedding Day</p>
          <h1 className="mt-2 font-serif text-3xl text-wine md:text-4xl">Team timeline</h1>
          <p className="mt-2 font-serif italic text-mocha">{weddingDate} · The Heaven, Damistan</p>
        </header>
        <div className="mt-6 rounded-xl border border-wine/20 bg-white/70 p-4 text-center">
          <p className="font-serif text-lg font-semibold text-wine">Important arrival directions</p>
          <p className="mt-1 text-sm text-ink">At 4:00 PM, entourage and wedding team: go straight to the Dome Tent majlis, to the right of the main gate entrance.</p>
        </div>
        <ol className="mt-6 divide-y divide-taupe/20">
          {TIMELINE.map((item) => (
            <li key={`${item.time}-${item.who}`} className="grid gap-2 py-4 sm:grid-cols-[120px_1fr] sm:gap-5">
              <time className="font-serif text-2xl font-semibold tabular-nums text-wine">{item.time}</time>
              <div>
                <h2 className="font-serif text-lg font-semibold text-ink">{item.who}</h2>
                <p className="text-xs uppercase tracking-wider text-taupe">{item.where}</p>
                <p className="mt-1 text-sm leading-relaxed text-mocha">{item.note}</p>
              </div>
            </li>
          ))}
        </ol>
        <footer className="mt-5 border-t border-wine/25 pt-4 text-center">
          <p className="font-serif text-lg italic text-wine">Individual task, preparation and bring-list cards to follow.</p>
          <p className="mt-1 text-xs text-taupe">Please confirm your assigned role and any personal call time with the coordinator.</p>
        </footer>
      </article>

      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 14mm; }
          body * { visibility: hidden !important; }
          .team-guide-print, .team-guide-print * { visibility: visible !important; }
          .team-guide-print {
            position: absolute !important; left: 0 !important; top: 0 !important;
            width: 100% !important; max-width: none !important; margin: 0 !important;
            padding: 0 !important; border: 0 !important; box-shadow: none !important;
            background: #fff !important; color: #241b18 !important;
          }
          .team-guide-print li { break-inside: avoid; }
          .no-print { display: none !important; }
        }
      `}</style>
    </>
  );
}
