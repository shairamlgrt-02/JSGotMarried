"use client";
import { useState } from "react";
import { useTable } from "@/lib/hooks";
import { uid } from "@/lib/db";
import { downloadProgramCard } from "@/lib/program-card";
import { downloadTeamCard } from "@/lib/team-card";
import {
  ALL_WELCOME_FROM,
  CEREMONY_AT,
  ENTOURAGE_CALL_TIME,
  MAJLIS_LOCATION,
  RECEPTION_AT,
  WELCOME_EVENT_NAME,
  WEDDING_PROGRAM_STOPS,
} from "@/lib/program";
import type { TeamCard, TeamCardCategory } from "@/lib/types";
import { Btn, Card, EditText, PageHead, Select, download, toCsv } from "./ui";

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

const CATEGORIES: { value: TeamCardCategory; label: string }[] = [
  { value: "bridesmaid", label: "Bridesmaid" },
  { value: "groomsman", label: "Groomsman" },
  { value: "coordinator", label: "Coordinator" },
  { value: "other", label: "Other team member" },
];
const categoryLabel = (category: TeamCardCategory) => CATEGORIES.find((x) => x.value === category)?.label ?? "Other team member";
const blankCard = (category: TeamCardCategory): TeamCard => ({
  id: uid(), category, name: "", role_title: "", call_time: ENTOURAGE_CALL_TIME,
  meet_at: MAJLIS_LOCATION, prepare: "", bring: "", reminder: "",
});
const EMPTY_TEMPLATES = CATEGORIES.map(({ value }) => ({ ...blankCard(value), id: value }));

export function TeamGuide() {
  const { rows: infoRows } = useTable("wedding_info");
  const { rows: attireRows } = useTable("attire");
  const teamCards = useTable("team_cards", false);
  const [programCardStatus, setProgramCardStatus] = useState<"idle" | "working" | "done" | "error">("idle");
  const [downloadingCardId, setDownloadingCardId] = useState("");
  const [cardDownloadStatus, setCardDownloadStatus] = useState<Record<string, "done" | "error">>({});
  const info = infoRows[0];
  const dressNote = (attireRows.find((row) => row.group === "guests")?.notes || "").split("—")[0].replace(/\.?\s*$/, "").trim();
  const cardData = {
    groom: info?.groom || "Jeger", bride: info?.bride || "Shaira",
    dateISO: info?.date || "2026-11-11T16:30:00+03:00",
    venue: info?.venue_name || "The Heaven", address: info?.venue_address || "Damistan, Kingdom of Bahrain",
    program: WEDDING_PROGRAM_STOPS,
    dressNote: dressNote || "Black tie — details live in the attire guide",
    hashtags: info?.hashtags || ["#JSGotMarried", "#JSSayIDo", "#JSWishComeTrue"],
  };
  const downloadUpdatedProgramCard = async () => {
    if (programCardStatus === "working") return;
    setProgramCardStatus("working");
    const ok = await downloadProgramCard(cardData).catch(() => false);
    setProgramCardStatus(ok ? "done" : "error");
  };
  const weddingDate = info?.date
    ? new Date(info.date).toLocaleDateString("en-GB", {
        weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Bahrain",
      })
    : "11 November 2026";

  const downloadTimeline = () => {
    const rows = [
      ["Time", "Who", "Where", "What to do"],
      ...TIMELINE.map((item) => [item.time, item.who, item.where, item.note]),
    ];
    const csv = `\uFEFF${rows.map((row) => row.map((value) => `"${value.replace(/"/g, '""')}"`).join(",")).join("\r\n")}`;
    download("JSGotMarried-wedding-team-timeline.csv", csv);
  };

  const downloadCardSheet = () => {
    const rows = teamCards.rows.length ? teamCards.rows : EMPTY_TEMPLATES;
    download("JSGotMarried-team-role-cards.csv", toCsv(rows.map((card) => ({
      category: categoryLabel(card.category), name: card.name, role_title: card.role_title,
      call_time: card.call_time, meet_at: card.meet_at, prepare: card.prepare, bring: card.bring,
      reminder: card.reminder,
    }))));
  };

  const addCard = (category: TeamCardCategory) => teamCards.save(blankCard(category));
  const updateCard = (card: TeamCard, patch: Partial<TeamCard>) => teamCards.save({ ...card, ...patch });
  const saveTeamCardPng = async (card: TeamCard) => {
    setDownloadingCardId(card.id);
    const ok = await downloadTeamCard(card);
    setCardDownloadStatus((current) => ({ ...current, [card.id]: ok ? "done" : "error" }));
    setDownloadingCardId("");
  };
  const cardsForPrint = teamCards.rows.length ? teamCards.rows : EMPTY_TEMPLATES;

  return (
    <>
      <div className="no-print">
        <PageHead kicker="The confirmed day-of flow" title="Wedding team guide.">
          <div className="flex flex-wrap gap-2">
            <Btn onClick={downloadUpdatedProgramCard} disabled={programCardStatus === "working"}>
              {programCardStatus === "working" ? "Drawing updated card…" : programCardStatus === "done" ? "Updated card downloaded ✓" : "Download updated programme card (.png)"}
            </Btn>
            <Btn onClick={downloadTimeline}>Download timeline (.csv)</Btn>
            <Btn variant="ghost" onClick={downloadCardSheet}>Download role-card sheet (.csv)</Btn>
            <Btn variant="ghost" onClick={() => window.print()}>Print / save as PDF</Btn>
          </div>
        </PageHead>
        {programCardStatus === "error" && <p className="mb-4 text-sm text-burgundy">The updated card could not be saved. Please try again from a browser that allows downloads.</p>}
        <Card className="mb-5 border border-wine/15 bg-lace/60 p-5">
          <p className="font-serif text-xl text-wine">{weddingDate} · The Heaven, Damistan</p>
          <p className="mt-2 text-sm text-ink/70">
            Download the updated PNG above and attach it manually to the schedule-change WhatsApp messages. Please use the same arrival flow below when briefing the team. Individual role assignments, preparation and bring-lists stay blank until confirmed.
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
          <p className="font-serif text-lg italic text-wine">Fillable individual role and reminder cards are below.</p>
          <p className="mt-1 text-xs text-taupe">Download each card as a PNG after its confirmed details are filled in.</p>
        </footer>
      </article>

      <section className="no-print mt-8">
        <Card title="Fillable role & reminder cards" className="border border-wine/10">
          <p className="mb-4 text-sm text-ink/65">Start a card for a bridesmaid, groomsman, coordinator or another team member. Shared 4:00 PM call time and majlis meet-up are prefilled; names, assignments and personal notes are yours to confirm.</p>
          <div className="mb-5 flex flex-wrap gap-2">
            {CATEGORIES.map((category) => <Btn key={category.value} variant="ghost" onClick={() => addCard(category.value)}>+ Add {category.label.toLowerCase()} card</Btn>)}
          </div>
          {teamCards.error && <p className="mb-4 rounded-lg bg-burgundy/10 p-3 text-sm text-burgundy">Team cards could not be loaded: {teamCards.error}. Run the latest <code>supabase/schema.sql</code> to add their private table.</p>}
          {teamCards.rows.length === 0 ? <p className="rounded-xl border border-dashed border-taupe/40 p-5 text-sm text-taupe">No individual cards yet. Choose a card type above; nothing is assigned automatically.</p> : (
            <div className="space-y-4">
              {teamCards.rows.map((card) => (
                <div key={card.id} className="rounded-xl border border-taupe/25 bg-lace/35 p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <Select value={card.category} options={CATEGORIES} onChange={(category) => updateCard(card, { category })} />
                    <div className="flex flex-wrap gap-2">
                      <Btn variant="ghost" disabled={downloadingCardId === card.id} onClick={() => void saveTeamCardPng(card)}>
                        {downloadingCardId === card.id ? "Drawing card…" : cardDownloadStatus[card.id] === "done" ? "Download again ✓" : cardDownloadStatus[card.id] === "error" ? "Try download again" : "Download card (.png)"}
                      </Btn>
                      <Btn variant="danger" onClick={() => teamCards.del(card.id)}>Remove card</Btn>
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="text-xs text-taupe">Team member name<EditText value={card.name} placeholder="Fill in when confirmed" onSave={(name) => updateCard(card, { name })} className="mt-1 bg-white/70" /></label>
                    <label className="text-xs text-taupe">Role / assignment<EditText value={card.role_title} placeholder="Leave blank until assigned" onSave={(role_title) => updateCard(card, { role_title })} className="mt-1 bg-white/70" /></label>
                    <label className="text-xs text-taupe">Call time<EditText value={card.call_time} placeholder="Confirm personal time" onSave={(call_time) => updateCard(card, { call_time })} className="mt-1 bg-white/70" /></label>
                    <label className="text-xs text-taupe">Meeting place<EditText value={card.meet_at} placeholder="Confirm exact meet-up point" onSave={(meet_at) => updateCard(card, { meet_at })} className="mt-1 bg-white/70" /></label>
                    <label className="text-xs text-taupe">Preparation<EditText value={card.prepare} multiline rows={2} placeholder="Add confirmed preparation notes" onSave={(prepare) => updateCard(card, { prepare })} className="mt-1 bg-white/70" /></label>
                    <label className="text-xs text-taupe">What to bring<EditText value={card.bring} multiline rows={2} placeholder="Add confirmed items" onSave={(bring) => updateCard(card, { bring })} className="mt-1 bg-white/70" /></label>
                    <label className="text-xs text-taupe md:col-span-2">Reminder / day-of note<EditText value={card.reminder} multiline rows={2} placeholder="Add a reminder when details are confirmed" onSave={(reminder) => updateCard(card, { reminder })} className="mt-1 bg-white/70" /></label>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>

      <article className="team-cards-print mx-auto mt-8 max-w-4xl rounded-2xl border border-taupe/25 bg-[#FCFAF5] p-6 shadow-sm md:p-10">
        <header className="border-b border-wine/25 pb-5 text-center">
          <p className="font-serif text-xs uppercase tracking-[0.3em] text-taupe">Jeger & Shaira · Wedding Day</p>
          <h1 className="mt-2 font-serif text-3xl text-wine">Role & reminder cards</h1>
          <p className="mt-2 font-serif italic text-mocha">Fill only when each detail is confirmed</p>
        </header>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {cardsForPrint.map((card) => (
            <section key={card.id} className="team-role-card rounded-xl border border-wine/20 bg-white/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-taupe">{categoryLabel(card.category)}</p>
              <h2 className="mt-1 font-serif text-xl text-wine">{card.name || "Name: ____________________"}</h2>
              <p className="mt-2 text-sm text-ink">Role / assignment: {card.role_title || "____________________________"}</p>
              <p className="mt-1 text-sm text-ink">Call time: {card.call_time || "____________________________"}</p>
              <p className="mt-1 text-sm text-ink">Meet at: {card.meet_at || "____________________________"}</p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-taupe">Preparation</p>
              <p className="min-h-8 whitespace-pre-wrap text-sm text-mocha">{card.prepare || "____________________________________________"}</p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-taupe">Bring</p>
              <p className="min-h-8 whitespace-pre-wrap text-sm text-mocha">{card.bring || "____________________________________________"}</p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-taupe">Reminder</p>
              <p className="min-h-8 whitespace-pre-wrap text-sm text-mocha">{card.reminder || "____________________________________________"}</p>
            </section>
          ))}
        </div>
      </article>

      <style>{`
        .team-cards-print { display: none; }
        @media print {
          @page { size: A4 portrait; margin: 14mm; }
          body * { visibility: hidden !important; }
          .team-guide-print, .team-guide-print *, .team-cards-print, .team-cards-print * { visibility: visible !important; }
          .team-guide-print, .team-cards-print {
            position: relative !important; left: auto !important; top: auto !important;
            width: 100% !important; max-width: none !important; margin: 0 !important;
            padding: 0 !important; border: 0 !important; box-shadow: none !important;
            background: #fff !important; color: #241b18 !important;
          }
          .team-cards-print { display: block !important; break-before: page; }
          .team-guide-print li, .team-role-card { break-inside: avoid; }
          .no-print { display: none !important; }
        }
      `}</style>
    </>
  );
}
