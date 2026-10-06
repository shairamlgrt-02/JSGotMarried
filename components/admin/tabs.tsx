"use client";
import { Reorder, useDragControls } from "framer-motion";
import { useMemo, useState } from "react";
import { getMode, pushSeedSafely, refreshFaqCopy, refreshStoryCopy, resetLocal, uid } from "@/lib/db";
import { entourageGroups } from "@/lib/entourage";
import { STATUS, cleanInviteNote, genCodeFor, inviteHref, inviteLink, inviteMessage, inviteStatus, mergeHousehold, planHouseholdMerges, tallyInvites, cleanCode, whoIsItFor, type InviteText } from "@/lib/guests";
import { useCountdown, useTable } from "@/lib/hooks";
import type { Attending, Attire, BudgetItem, BudgetStatus, ChecklistItem, EntourageMember, Guest, Priority, ScheduleItem, StoryChapter, Vendor, VendorStatus } from "@/lib/types";
import { ENTOURAGE_ROLES, TABLES } from "@/lib/types";
import { Btn, Card, Donut, EditText, PageHead, Progress, Select, Stat, Tag, download, fileToDataUrl, money, toCsv } from "./ui";

const num = (v: string) => (isNaN(parseFloat(v)) ? 0 : parseFloat(v));
const PRIORITY: Priority[] = ["critical", "high", "medium"];
const BSTATUS: BudgetStatus[] = ["confirmed", "quoted", "pending"];
const VSTATUS: VendorStatus[] = ["pending", "contacted", "quoted", "booked"];
const ATT: Attending[] = ["yes", "pending", "no"];

function useInfo() {
  const t = useTable("wedding_info");
  return { info: t.rows[0], saveInfo: (patch: Partial<typeof t.rows[0]>) => t.save({ ...t.rows[0], ...patch }) };
}

/* ═════════════ 1. OVERVIEW ═════════════ */
export function Overview({ go }: { go: (tab: string) => void }) {
  const { info } = useInfo();
  const cd = useCountdown(info.date);
  const { rows: budget } = useTable("budget");
  const { rows: guests } = useTable("guests", false);
  const { rows: tasks } = useTable("checklist");
  const allocated = budget.reduce((s, b) => s + b.quoted_cost, 0);
  const paid = budget.reduce((s, b) => s + b.paid_cost, 0);
  const left = info.total_budget - allocated;
  const g = { yes: 0, pending: 0, no: 0, pax: 0 };
  guests.forEach((x) => { g[x.attending]++; if (x.attending === "yes") g.pax += x.pax; });
  const inv = tallyInvites(guests);
  const done = tasks.filter((t) => t.completed).length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const upcoming = [...tasks].filter((t) => !t.completed).sort((a, b) => a.due_date.localeCompare(b.due_date)).slice(0, 6);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <PageHead kicker={`${info.bride} & ${info.groom} · ${info.venue_name}`} title="Good day, lovebirds." />
      <div className="grid md:grid-cols-3 gap-5">
        <Card className="md:col-span-1 !bg-wine !text-lace">
          <div className="label text-taupe">Countdown</div>
          <div className="display text-[7rem] leading-none mt-4 tabular-nums">{cd.ready ? cd.days : "--"}</div>
          <div className="label text-paper/60 mt-2">days to go · {cd.hours}h {cd.minutes}m</div>
          <div className="font-serif italic text-2xl mt-8 text-wine">{new Date(info.date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
        </Card>
        <Card title="Budget" action={<Btn variant="ghost" onClick={() => go("budget")}>Open →</Btn>}>
          <div className="flex items-center gap-6">
            <Donut size={150} parts={[{ value: paid, color: "#4A5D23" }, { value: allocated - paid, color: "#6E1F2E" }, { value: Math.max(0, left), color: "rgba(15,13,10,.08)" }]}
              center={<div><div className="display text-3xl">{Math.round((allocated / info.total_budget) * 100)}%</div><div className="label !text-[9px] text-ink/50">allocated</div></div>} />
            <div className="space-y-3 text-sm">
              <div><span className="inline-block w-2 h-2 rounded-full bg-wine mr-2" />Allocated <b>{money(allocated, info.currency)}</b></div>
              <div><span className="inline-block w-2 h-2 rounded-full bg-moss mr-2" />Paid <b>{money(paid, info.currency)}</b></div>
              <div className={left < 0 ? "text-burgundy font-semibold" : ""}><span className="inline-block w-2 h-2 rounded-full bg-ink/20 mr-2" />{left < 0 ? "Over by" : "Left"} <b>{money(Math.abs(left), info.currency)}</b></div>
              <div className="text-ink/50">of {money(info.total_budget, info.currency)}</div>
            </div>
          </div>
        </Card>
        <Card title="Guests" action={<Btn variant="ghost" onClick={() => go("guests")}>Open →</Btn>}>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Yes" value={g.yes} />
            <Stat label="Pending" value={g.pending} />
            <Stat label="No" value={g.no} />
          </div>
          <div className="mt-6 p-4 rounded-xl bg-moss/10 flex justify-between items-center">
            <span className="label text-moss">Headcount for catering</span><span className="display text-4xl">{g.pax}</span>
          </div>
        </Card>
        <Card title="Invite links" className="md:col-span-1" action={<Btn variant="ghost" onClick={() => go("invites")}>Open →</Btn>}>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Codes" value={inv.codes} />
            <Stat label="Waiting" value={inv.to_send + inv.sent + inv.opened + inv.no_code} />
            <Stat label="Filled" value={inv.filled} />
          </div>
          <div className="mt-5 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-ink/60">Opened but haven't replied</span><b>{inv.opened}</b></div>
            <div className="flex justify-between"><span className="text-ink/60">Awaiting your review (plus-ones)</span><b className={inv.needs_review ? "text-amethyst" : ""}>{inv.needs_review}</b></div>
            <div className="flex justify-between"><span className="text-ink/60">Declined</span><b>{inv.declined}</b></div>
          </div>
          <Btn variant="dark" className="mt-5 w-full" onClick={() => go("invites")}>Generate &amp; send codes</Btn>
        </Card>
        <Card title="Checklist" className="md:col-span-2" action={<Btn variant="ghost" onClick={() => go("checklist")}>Open →</Btn>}>
          <div className="flex items-baseline justify-between mb-3"><span className="display text-5xl">{pct}%</span><span className="text-sm text-ink/60">{done} of {tasks.length} done</span></div>
          <Progress value={pct} />
          <div className="label text-ink/50 mt-6 mb-2">Up next</div>
          <ul className="divide-y divide-ink/10">
            {upcoming.map((t) => (
              <li key={t.id} className="py-2.5 flex items-center justify-between gap-3">
                <span className="truncate">{t.task}</span>
                <span className="flex items-center gap-2 shrink-0"><Tag>{t.category}</Tag><span className={`text-sm tabular-nums ${t.due_date < today ? "text-burgundy font-semibold" : "text-ink/60"}`}>{t.due_date.slice(5)}</span></span>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Decisions pending">
          <ul className="space-y-3">
            {budget.filter((b) => b.status !== "confirmed").map((b) => (
              <li key={b.id} className="flex justify-between gap-2"><span>{b.item}</span><Tag>{b.status}</Tag></li>
            ))}
          </ul>
          <Btn variant="dark" className="mt-6 w-full" onClick={() => go("vendors")}>Compare vendors</Btn>
        </Card>
      </div>
    </>
  );
}

/* ═════════════ 2. DETAILS ═════════════ */
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="label text-ink/50 block mb-1">{label}</span>{children}</label>;
}
export function Details() {
  const { info, saveInfo } = useInfo();
  const localDate = (() => { const d = new Date(info.date); const off = 3 * 60; const b = new Date(d.getTime() + off * 60000); return b.toISOString().slice(0, 16); })();
  return (
    <>
      <PageHead kicker="Edits go live on the public site instantly" title="The details."><a href="/preview?all=1" target="_blank"><Btn variant="ghost">Preview the site ↗</Btn></a>
        <a href="/preview" target="_blank"><Btn variant="ghost">See it as a guest ↗</Btn></a>
        <a href="/" target="_blank"><Btn variant="ghost">Front door ↗</Btn></a></PageHead>
      <div className="grid md:grid-cols-2 gap-5">
        <Card title="The couple & the day">
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <F label="Bride"><EditText value={info.bride} onSave={(v) => saveInfo({ bride: v })} className="font-serif text-2xl" /></F>
              <F label="Groom"><EditText value={info.groom} onSave={(v) => saveInfo({ groom: v })} className="font-serif text-2xl" /></F>
            </div>
            <F label="Date & ceremony time (Bahrain time)">
              <input type="datetime-local" defaultValue={localDate} key={localDate} onBlur={(e) => e.target.value && saveInfo({ date: `${e.target.value}:00+03:00` })} className="w-full bg-transparent border border-ink/10 rounded-md px-2 py-1.5 focus:border-wine outline-none" />
            </F>
            <F label="Theme name"><EditText value={info.theme_name} onSave={(v) => saveInfo({ theme_name: v })} /></F>
            <F label="RSVP deadline"><EditText type="date" value={info.rsvp_deadline ?? "2026-10-25"} onSave={(v) => saveInfo({ rsvp_deadline: v })} /></F>
            <div className="grid grid-cols-2 gap-4">
              <F label="Total budget"><EditText type="number" value={info.total_budget} onSave={(v) => saveInfo({ total_budget: num(v) })} /></F>
              <F label="Currency"><EditText value={info.currency} onSave={(v) => saveInfo({ currency: v })} /></F>
            </div>
          </div>
        </Card>
        <Card title="Venue">
          <div className="grid gap-4">
            <F label="Venue name"><EditText value={info.venue_name} onSave={(v) => saveInfo({ venue_name: v })} className="font-serif text-2xl" /></F>
            <F label="Address"><EditText value={info.venue_address} onSave={(v) => saveInfo({ venue_address: v })} /></F>
            <F label="Google Maps link"><EditText value={info.venue_map_link} onSave={(v) => saveInfo({ venue_map_link: v })} /></F>
            <F label="Map embed URL (Google Maps → Share → Embed → copy the src)"><EditText value={info.venue_map_embed} onSave={(v) => saveInfo({ venue_map_embed: v })} /></F>
          </div>
        </Card>
        <Card title="Our story" className="md:col-span-2">
          <EditText multiline rows={5} value={info.story} onSave={(v) => saveInfo({ story: v })} className="font-serif text-2xl leading-snug" />
          <p className="text-xs text-ink/50 mt-3">The site shows the <b>Story chapters</b> carousel (Content → Story chapters). This classic one-paragraph version only appears if every chapter is deleted — it doubles as your rough draft.</p>
        </Card>
        <Card title="Social">
          <div className="grid gap-4">
            <F label="Instagram"><EditText value={info.instagram} onSave={(v) => saveInfo({ instagram: v })} /></F>
            <F label="Hashtags (space separated)"><EditText value={info.hashtags.join(" ")} onSave={(v) => saveInfo({ hashtags: v.split(/\s+/).filter(Boolean).map((h) => (h.startsWith("#") ? h : `#${h}`)) })} /></F>
            <F label="Follow &amp; tag invitation"><EditText value={info.instagram_note ?? ""} multiline rows={3} placeholder="Follow along for the countdown… then tag your photos on the day." onSave={(v) => saveInfo({ instagram_note: v })} className="text-sm" /></F>
          </div>
        </Card>
      </div>
    </>
  );
}

/* ═════════════ 3. SCHEDULE ═════════════ */
function ScheduleRow({ s, onSave, onDel }: { s: ScheduleItem; onSave: (s: ScheduleItem) => void; onDel: () => void }) {
  const controls = useDragControls();
  return (
    <Reorder.Item value={s} dragListener={false} dragControls={controls} className="bg-paper text-ink rounded-2xl p-4 md:p-5 flex gap-4 items-start shadow-lg list-none">
      <button onPointerDown={(e) => controls.start(e)} className="cursor-grab active:cursor-grabbing text-ink/30 hover:text-wine text-xl pt-1 touch-none select-none" aria-label="Drag">⋮⋮</button>
      <div className="grid md:grid-cols-[180px_1fr] gap-2 flex-1">
        <EditText value={s.time} onSave={(v) => onSave({ ...s, time: v })} className="label !tracking-[0.15em] text-espresso" />
        <div>
          <EditText value={s.title} onSave={(v) => onSave({ ...s, title: v })} className="font-serif text-3xl" />
          <EditText value={s.detail} onSave={(v) => onSave({ ...s, detail: v })} multiline rows={2} className="text-ink/70" />
        </div>
      </div>
      <Btn variant="danger" onClick={onDel}>✕</Btn>
    </Reorder.Item>
  );
}
export function ScheduleBuilder() {
  const { rows, setRows, save, del } = useTable("schedule");
  const sorted = useMemo(() => [...rows].sort((a, b) => a.order - b.order), [rows]);
  const commitOrder = () => save(sorted.map((s, i) => ({ ...s, order: i + 1 })));
  return (
    <>
      <PageHead kicker="Drag ⋮⋮ to reorder · wrap words in *asterisks* to highlight them" title="The day, hour by hour.">
        <Btn onClick={() => save({ id: uid(), time: "Time", title: "New moment", detail: "", order: sorted.length + 1 })}>+ Add moment</Btn>
      </PageHead>
      <Reorder.Group axis="y" values={sorted} onReorder={(next) => setRows(next.map((s, i) => ({ ...s, order: i + 1 })))} className="space-y-3" onPointerUp={commitOrder}>
        {sorted.map((s) => <ScheduleRow key={s.id} s={s} onSave={save} onDel={() => del(s.id)} />)}
      </Reorder.Group>
    </>
  );
}

/* ═════════════ 4. CHECKLIST ═════════════ */
export function Checklist() {
  const { rows, save, del } = useTable("checklist");
  const [filter, setFilter] = useState<"open" | "all" | "done" | Priority>("open");
  const [newTask, setNewTask] = useState("");
  const today = new Date().toISOString().slice(0, 10);
  const done = rows.filter((r) => r.completed).length;
  const shown = [...rows]
    .filter((r) => filter === "all" ? true : filter === "open" ? !r.completed : filter === "done" ? r.completed : r.category === filter)
    .sort((a, b) => Number(a.completed) - Number(b.completed) || a.due_date.localeCompare(b.due_date));
  const add = (e: React.FormEvent) => {
    e.preventDefault(); if (!newTask.trim()) return;
    save({ id: uid(), task: newTask.trim(), category: "medium", due_date: today, completed: false }); setNewTask("");
  };
  return (
    <>
      <PageHead kicker={`${done}/${rows.length} complete`} title="The to-do.">
        {(["open", "all", "done", ...PRIORITY] as const).map((f) => <Btn key={f} variant={filter === f ? "gold" : "ghost"} onClick={() => setFilter(f)}>{f}</Btn>)}
      </PageHead>
      <Card>
        <Progress value={rows.length ? (done / rows.length) * 100 : 0} color="#4A5D23" />
        <form onSubmit={add} className="flex gap-2 mt-6">
          <input value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="Add a task and press Enter…" className="flex-1 bg-white/60 rounded-full px-5 py-3 outline-none border border-ink/10 focus:border-wine" />
          <Btn type="submit" variant="dark">Add</Btn>
        </form>
        <ul className="mt-4 divide-y divide-ink/10">
          {shown.map((t: ChecklistItem) => (
            <li key={t.id} className="py-2 flex flex-wrap md:flex-nowrap items-center gap-3 group">
              <button onClick={() => save({ ...t, completed: !t.completed })} className={`w-6 h-6 shrink-0 rounded-md border-2 grid place-items-center transition-colors ${t.completed ? "bg-moss border-moss text-paper" : "border-ink/25 hover:border-wine"}`}>{t.completed && "✓"}</button>
              <div className={`flex-1 min-w-[200px] ${t.completed ? "line-through text-ink/40" : ""}`}><EditText value={t.task} onSave={(v) => save({ ...t, task: v })} /></div>
              <Select value={t.category} options={PRIORITY} onChange={(v) => save({ ...t, category: v })} className="text-sm" />
              <input type="date" value={t.due_date} onChange={(e) => save({ ...t, due_date: e.target.value })} className={`bg-transparent text-sm border border-ink/10 rounded-md px-2 py-1.5 ${!t.completed && t.due_date < today ? "text-burgundy font-semibold border-burgundy/40" : ""}`} />
              <button onClick={() => del(t.id)} className="text-ink/30 hover:text-burgundy opacity-100 md:opacity-0 group-hover:opacity-100 px-2">✕</button>
            </li>
          ))}
          {!shown.length && <li className="py-10 text-center text-ink/40 font-serif text-2xl italic">Nothing here. Breathe. ✦</li>}
        </ul>
      </Card>
    </>
  );
}

/* ═════════════ 5. BUDGET ═════════════ */
export function Budget() {
  const { info } = useInfo();
  const { rows, save, del } = useTable("budget");
  const allocated = rows.reduce((s, b) => s + b.quoted_cost, 0);
  const paid = rows.reduce((s, b) => s + b.paid_cost, 0);
  const left = info.total_budget - allocated;
  const cur = info.currency;
  return (
    <>
      <PageHead kicker={`Total budget ${money(info.total_budget, cur)}`} title="The money.">
        <Btn onClick={() => save({ id: uid(), category: "Other", item: "New item", quoted_cost: 0, paid_cost: 0, status: "pending" })}>+ Add line</Btn>
        <Btn variant="ghost" onClick={() => download("budget.csv", toCsv(rows))}>Export CSV</Btn>
      </PageHead>
      {left < 0 && <div className="mb-5 rounded-2xl bg-burgundy text-paper px-6 py-4 font-serif text-2xl">⚠ You&apos;re over budget by {money(-left, cur)}. Time to renegotiate (or elope).</div>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-5">
        <Card><Stat label="Allocated" value={allocated.toLocaleString()} sub={cur} /></Card>
        <Card><Stat label="Paid" value={paid.toLocaleString()} sub={cur} /></Card>
        <Card><Stat label="Still to pay" value={(allocated - paid).toLocaleString()} sub={cur} /></Card>
        <Card className={left < 0 ? "!bg-burgundy !text-paper" : "!bg-moss !text-paper"}><Stat label={left < 0 ? "Over" : "Unallocated"} value={Math.abs(left).toLocaleString()} sub={cur} /></Card>
      </div>
      <Card className="overflow-x-auto">
        <table className="w-full text-left min-w-[760px]">
          <thead><tr className="label text-ink/50 border-b border-ink/10">
            <th className="py-3 px-2">Category</th><th className="px-2">Item</th><th className="px-2 w-28">Quoted</th><th className="px-2 w-28">Paid</th><th className="px-2 w-28">Remaining</th><th className="px-2">Status</th><th />
          </tr></thead>
          <tbody className="divide-y divide-ink/10">
            {rows.map((b: BudgetItem) => (
              <tr key={b.id} className="group">
                <td className="px-1 py-1"><EditText value={b.category} onSave={(v) => save({ ...b, category: v })} className="label !tracking-[0.12em]" /></td>
                <td className="px-1"><EditText value={b.item} onSave={(v) => save({ ...b, item: v })} /></td>
                <td className="px-1"><EditText type="number" value={b.quoted_cost} onSave={(v) => save({ ...b, quoted_cost: num(v) })} className="tabular-nums" /></td>
                <td className="px-1"><EditText type="number" value={b.paid_cost} onSave={(v) => save({ ...b, paid_cost: num(v) })} className="tabular-nums" /></td>
                <td className="px-3 tabular-nums text-ink/60">{(b.quoted_cost - b.paid_cost).toLocaleString()}</td>
                <td className="px-1"><Select value={b.status} options={BSTATUS} onChange={(v) => save({ ...b, status: v })} className="text-sm" /></td>
                <td className="px-1 whitespace-nowrap text-right">
                  {b.paid_cost < b.quoted_cost && <button onClick={() => save({ ...b, paid_cost: b.quoted_cost, status: "confirmed" })} className="label !text-[10px] text-moss hover:underline mr-2">Mark paid</button>}
                  <button onClick={() => del(b.id)} className="text-ink/30 hover:text-burgundy px-2">✕</button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot><tr className="border-t-2 border-ink/20 font-semibold">
            <td className="py-3 px-2" colSpan={2}>Total</td><td className="px-3 tabular-nums">{allocated.toLocaleString()}</td><td className="px-3 tabular-nums">{paid.toLocaleString()}</td><td className="px-3 tabular-nums">{(allocated - paid).toLocaleString()}</td><td colSpan={2} />
          </tr></tfoot>
        </table>
      </Card>
    </>
  );
}

/* ═════════════ 6. GUESTS & RSVP ═════════════
   The master guest list, catering & day-of check-in sheet: every invited guest, their official
   plus-one, dietary requirements, song requests and RSVP wishes. */
type GuestEntry = {
  key: string;
  g: Guest;
  role: "primary" | "plus_one";
  displayName: string;
  companionName: string;
  invitedAs: string;
  idx: number;
};

export function Guests({ go }: { go: (tab: string) => void }) {
  const { rows, save, del, error } = useTable("guests", false);
  const { info } = useInfo();
  const [filter, setFilter] = useState<"all" | Attending | "needs_review">("all");
  const [detailFilter, setDetailFilter] = useState<"all" | "plus_one" | "dietary" | "song" | "message">("all");
  const [expandPlusOnes, setExpandPlusOnes] = useState(true);
  const [sortBy, setSortBy] = useState<
    "latest" | "oldest" | "name_asc" | "name_desc" | "plus_asc" | "plus_desc" | "pax_desc" | "pax_asc" | "code_asc" | "code_desc" | "status"
  >("latest");
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState("");
  /** Codes owning more than one row — leftovers from the old "reply = a new row" behaviour. */
  const merges = useMemo(() => planHouseholdMerges(rows), [rows]);
  const couple = `${info.bride} & ${info.groom}`;
  const day = new Date(info.date).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
  /** The invitation letter, re-sent from this list — the same text the Invite codes tab sends. */
  const text: InviteText = { couple, day, date: info.date, deadline: info.rsvp_deadline };

  const toggleSort = (asc: typeof sortBy, desc: typeof sortBy) => {
    setSortBy((cur) => (cur === asc ? desc : asc));
  };

  /** Build the guest entries: primary guests plus (when enabled) each named plus-one as their own official guest row. */
  const entries = useMemo<GuestEntry[]>(() => {
    const list: GuestEntry[] = [];
    rows.forEach((g, idx) => {
      const invitedAs = whoIsItFor(g);
      const primaryName = (g.name || "").trim() || invitedAs;
      const plusName = (g.plus_one || "").trim();
      list.push({
        key: `${g.id}:primary`,
        g,
        role: "primary",
        displayName: primaryName,
        companionName: plusName,
        invitedAs,
        idx: idx * 2,
      });
      if (expandPlusOnes && plusName) {
        list.push({
          key: `${g.id}:plus_one`,
          g,
          role: "plus_one",
          displayName: plusName,
          companionName: primaryName,
          invitedAs,
          idx: idx * 2 + 1,
        });
      }
    });
    return list;
  }, [rows, expandPlusOnes]);

  const shown = useMemo(() => {
    const query = q.trim().toLowerCase();
    return entries
      .filter(({ g }) => {
        if (filter === "all") return true;
        if (filter === "needs_review") return inviteStatus(g) === "needs_review";
        return g.attending === filter;
      })
      .filter(({ g }) => {
        if (detailFilter === "plus_one") return Boolean((g.plus_one || "").trim());
        if (detailFilter === "dietary") return Boolean((g.dietary || "").trim());
        if (detailFilter === "song") return Boolean((g.song_request || "").trim());
        if (detailFilter === "message") return Boolean((g.message || "").trim());
        return true;
      })
      .filter(({ g, displayName, companionName, invitedAs }) => {
        if (!query) return true;
        const haystack = `${displayName} ${companionName} ${invitedAs} ${g.name ?? ""} ${g.plus_one ?? ""} ${g.greet ?? ""} ${g.phone ?? ""} ${g.code ?? ""} ${cleanInviteNote(g.note)} ${g.dietary ?? ""} ${g.song_request ?? ""} ${g.message ?? ""}`.toLowerCase();
        return haystack.includes(query);
      })
      .sort((a, b) => {
        const timeA = a.g.created_at ?? "";
        const timeB = b.g.created_at ?? "";
        const nameA = a.displayName || a.invitedAs || "";
        const nameB = b.displayName || b.invitedAs || "";
        const plusA = a.companionName || "";
        const plusB = b.companionName || "";
        const codeA = cleanCode(a.g.code || "");
        const codeB = cleanCode(b.g.code || "");
        const statusOrder: Record<Attending, number> = { yes: 0, pending: 1, no: 2 };
        switch (sortBy) {
          case "latest":
            return timeB.localeCompare(timeA) || a.role.localeCompare(b.role) || b.idx - a.idx;
          case "oldest":
            return timeA.localeCompare(timeB) || a.role.localeCompare(b.role) || a.idx - b.idx;
          case "name_asc":
            return nameA.localeCompare(nameB, undefined, { sensitivity: "base" }) || timeB.localeCompare(timeA);
          case "name_desc":
            return nameB.localeCompare(nameA, undefined, { sensitivity: "base" }) || timeB.localeCompare(timeA);
          case "plus_asc":
            return (plusA ? 0 : 1) - (plusB ? 0 : 1) || plusA.localeCompare(plusB, undefined, { sensitivity: "base" }) || nameA.localeCompare(nameB, undefined, { sensitivity: "base" });
          case "plus_desc":
            return (plusA ? 0 : 1) - (plusB ? 0 : 1) || plusB.localeCompare(plusA, undefined, { sensitivity: "base" }) || nameA.localeCompare(nameB, undefined, { sensitivity: "base" });
          case "pax_desc":
            return (Number(b.g.pax) || 0) - (Number(a.g.pax) || 0) || nameA.localeCompare(nameB, undefined, { sensitivity: "base" });
          case "pax_asc":
            return (Number(a.g.pax) || 0) - (Number(b.g.pax) || 0) || nameA.localeCompare(nameB, undefined, { sensitivity: "base" });
          case "code_asc":
            return codeA.localeCompare(codeB) || a.role.localeCompare(b.role) || timeB.localeCompare(timeA);
          case "code_desc":
            return codeB.localeCompare(codeA) || a.role.localeCompare(b.role) || timeB.localeCompare(timeA);
          case "status":
            return (statusOrder[a.g.attending] ?? 9) - (statusOrder[b.g.attending] ?? 9) || timeB.localeCompare(timeA);
        }
      });
  }, [entries, filter, detailFilter, q, sortBy]);

  const pax = rows.filter((g) => g.attending === "yes").reduce((s, g) => s + (Number(g.pax) || 0), 0);
  const pendingPax = rows.filter((g) => g.attending === "pending").reduce((s, g) => s + (Number(g.pax) || 0), 0);
  const plusOneCount = rows.filter((g) => g.attending !== "no" && Boolean((g.plus_one || "").trim())).length;
  const needsReviewCount = rows.filter((g) => inviteStatus(g) === "needs_review").length;
  const dietaryCount = rows.filter((g) => g.attending !== "no" && Boolean((g.dietary || "").trim())).length;
  const songCount = rows.filter((g) => Boolean((g.song_request || "").trim())).length;
  const messageCount = rows.filter((g) => Boolean((g.message || "").trim())).length;

  const formatDay = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "";

  const exportCsv = () => {
    const sourceList = shown.length ? shown : entries;
    const csvRows = sourceList.map(({ g, role, displayName, companionName, invitedAs }) => ({
      guest_name: displayName || "(Unnamed guest)",
      guest_type: role === "plus_one" ? "Plus-one (Official Guest)" : "Primary Guest",
      plus_one_or_partner: companionName,
      invited_as: invitedAs,
      code: cleanCode(g.code || ""),
      status: STATUS[inviteStatus(g)].label,
      attending: g.attending,
      party_seats: Number(g.pax) || 0,
      whatsapp: g.phone || "",
      dietary: g.dietary || "",
      song_request: g.song_request || "",
      message: g.message || "",
      notes: cleanInviteNote(g.note),
      updated_at: formatDay(g.created_at),
    }));
    const content = csvRows.length
      ? toCsv(csvRows)
      : "guest_name,guest_type,plus_one_or_partner,invited_as,code,status,attending,party_seats,whatsapp,dietary,song_request,message,notes,updated_at\n";
    download("guests-rsvp.csv", content);
  };

  const add = () =>
    save({
      id: uid(),
      name: "New guest",
      greet: "New guest",
      phone: "",
      pax: 1,
      attending: "pending",
      dietary: "",
      message: "",
      song_request: "",
      plus_one: "",
      note: "",
      source: "manual",
      created_at: new Date().toISOString(),
    });

  /** Fold every extra row of a household back into one: the reply wins, the leftovers go. */
  async function mergeDuplicates() {
    if (!merges.length) return;
    if (!confirm(
      `Merge ${merges.length} duplicated household ${merges.length === 1 ? "row" : "rows"}?\n\n` +
      "Every invitation code keeps a single row: the guest's reply is written onto the row you typed " +
      "(their answer wins, anything it left blank is rescued from the copy) and the leftover row is deleted. " +
      "Nothing else in the binder is touched."
    )) return;
    for (const { keep, drop } of merges) {
      await save(mergeHousehold(keep, drop));
      for (const g of drop) await del(g.id);
    }
    setMsg(`Merged ✓ ${merges.length} household ${merges.length === 1 ? "row" : "rows"} — one row per invitation code again.`);
  }

  return (
    <>
      <PageHead kicker="Master check-in · plus-ones · catering & songs" title="The guest list.">
        <Btn variant="ghost" onClick={() => go("invites")}>Invite codes →</Btn>
        <Btn onClick={add}>+ Add guest</Btn>
        <Btn variant="ghost" onClick={exportCsv}>Export CSV ({shown.length || entries.length})</Btn>
        {merges.length > 0 && <Btn variant="ghost" onClick={mergeDuplicates}>Merge {merges.length} duplicate{merges.length === 1 ? "" : "s"}</Btn>}
      </PageHead>
      {msg && <p className="mb-4 text-sm text-moss">{msg}</p>}
      <p className="text-sm text-ink/60 mb-5 max-w-3xl">
        Your master check-in, catering and DJ sheet. Every official <b>plus-one</b> is listed and searchable as a guest right alongside
        the primary guest so you can double-check any name at a glance, review dietary notes and song requests, or export the full roster to CSV.
      </p>
      {error && <div className="mb-4 text-red-300">{error}</div>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-5">
        <Card className="!bg-moss !text-paper">
          <Stat label="Confirmed seats" value={pax} sub={`${plusOneCount} official plus-one${plusOneCount === 1 ? "" : "s"} · +${pendingPax} pending`} />
        </Card>
        <Card>
          <Stat
            label="RSVP status"
            value={`${rows.filter((g) => g.attending === "yes").length} yes`}
            sub={`${rows.filter((g) => g.attending === "pending").length} pending · ${rows.filter((g) => g.attending === "no").length} declined`}
          />
        </Card>
        <Card>
          <Stat
            label="Plus-ones"
            value={plusOneCount}
            sub={needsReviewCount ? `${needsReviewCount} waiting on your approval` : "all plus-ones reviewed"}
          />
        </Card>
        <Card>
          <Stat
            label="Dietary & songs"
            value={`${dietaryCount} / ${songCount}`}
            sub={`${dietaryCount} dietary · ${songCount} song${songCount === 1 ? "" : "s"} · ${messageCount} note${messageCount === 1 ? "" : "s"}`}
          />
        </Card>
      </div>
      <Card>
        <div className="flex flex-wrap gap-2 mb-3 items-center">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search guest name, plus-one, code, number, dietary or song…"
            className="flex-1 min-w-[220px] bg-white/60 rounded-full px-5 py-2.5 outline-none border border-ink/10 focus:border-wine"
          />
          <label className="flex items-center gap-1.5 bg-white/60 rounded-full px-3.5 py-2 border border-ink/10 text-xs">
            <span className="label !text-[9px] text-ink/50">Filter</span>
            <select value={detailFilter} onChange={(e) => setDetailFilter(e.target.value as typeof detailFilter)} className="bg-transparent outline-none font-medium text-ink cursor-pointer">
              <option value="all">All details</option>
              <option value="plus_one">Has plus-one ({plusOneCount})</option>
              <option value="dietary">Has dietary note ({dietaryCount})</option>
              <option value="song">Has song request ({songCount})</option>
              <option value="message">Has RSVP note ({messageCount})</option>
            </select>
          </label>
          <label className="flex items-center gap-1.5 bg-white/60 rounded-full px-3.5 py-2 border border-ink/10 text-xs">
            <span className="label !text-[9px] text-ink/50">Sort</span>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="bg-transparent outline-none font-medium text-ink cursor-pointer">
              <option value="latest">Latest to oldest</option>
              <option value="oldest">Oldest to latest</option>
              <option value="name_asc">Guest name: A → Z</option>
              <option value="name_desc">Guest name: Z → A</option>
              <option value="plus_asc">Plus-one: A → Z</option>
              <option value="plus_desc">Plus-one: Z → A</option>
              <option value="pax_desc">Seats: High → Low</option>
              <option value="pax_asc">Seats: Low → High</option>
              <option value="code_asc">Code: A → Z</option>
              <option value="code_desc">Code: Z → A</option>
              <option value="status">Attending status</option>
            </select>
          </label>
        </div>
        <div className="flex flex-wrap gap-2 mb-4 items-center justify-between">
          <div className="flex flex-wrap gap-2 items-center">
            {([
              ["all", `all ${entries.length}`],
              ["yes", `attending ${entries.filter((e) => e.g.attending === "yes").length}`],
              ["needs_review", `needs review ${entries.filter((e) => inviteStatus(e.g) === "needs_review").length}`],
              ["pending", `pending ${entries.filter((e) => e.g.attending === "pending").length}`],
              ["no", `declined ${entries.filter((e) => e.g.attending === "no").length}`],
            ] as const).map(([f, label]) => (
              <Btn key={f} variant={filter === f ? "dark" : "ghost"} onClick={() => setFilter(f)} className="!px-3 !py-1.5">
                {label}
              </Btn>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setExpandPlusOnes((v) => !v)}
            className={`label !text-[10px] rounded-full px-3.5 py-1.5 border transition-colors ${expandPlusOnes ? "bg-wine/10 text-wine border-wine/30" : "border-ink/15 text-ink/60 hover:border-wine"}`}
          >
            {expandPlusOnes ? "✦ Showing plus-ones as individual guests" : "Showing 1 row per household"}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[1220px] text-sm">
            <thead><tr className="label text-ink/50 border-b border-ink/10 select-none">
              <th className="py-3 px-2 cursor-pointer hover:text-wine" onClick={() => toggleSort("name_asc", "name_desc")}>
                Guest {sortBy === "name_asc" ? "↑" : sortBy === "name_desc" ? "↓" : "↕"}
              </th>
              <th className="px-2 cursor-pointer hover:text-wine" onClick={() => toggleSort("plus_asc", "plus_desc")}>
                Plus-one / Partner {sortBy === "plus_asc" ? "↑" : sortBy === "plus_desc" ? "↓" : "↕"}
              </th>
              <th className="px-2">WhatsApp</th>
              <th className="px-2 w-16 cursor-pointer hover:text-wine" onClick={() => toggleSort("pax_desc", "pax_asc")}>
                Seats {sortBy === "pax_desc" ? "↓" : sortBy === "pax_asc" ? "↑" : "↕"}
              </th>
              <th className="px-2 cursor-pointer hover:text-wine" onClick={() => setSortBy((s) => (s === "status" ? "latest" : "status"))}>
                Attending {sortBy === "status" ? "↓" : "↕"}
              </th>
              <th className="px-2">Dietary</th>
              <th className="px-2">Song</th>
              <th className="px-2">Message</th>
              <th className="px-2 cursor-pointer hover:text-wine" onClick={() => toggleSort("code_asc", "code_desc")}>
                Invite {sortBy === "code_asc" ? "↑" : sortBy === "code_desc" ? "↓" : "↕"}
              </th>
              <th className="px-2 cursor-pointer hover:text-wine" onClick={() => toggleSort("latest", "oldest")}>
                Date {sortBy === "latest" ? "↓" : sortBy === "oldest" ? "↑" : "↕"}
              </th>
              <th />
            </tr></thead>
            <tbody className="divide-y divide-ink/10">
              {shown.map(({ key, g, role, displayName, companionName, invitedAs }) => {
                const isPlusOneRow = role === "plus_one";
                return (
                  <tr key={key} className={`align-top ${isPlusOneRow ? "bg-wine/[0.03]" : ""}`}>
                    <td className="px-1 py-1.5 font-medium min-w-[180px]">
                      {isPlusOneRow ? (
                        <>
                          <EditText value={g.plus_one ?? ""} placeholder="Plus-one's full name" onSave={(v) => save({ ...g, plus_one: v })} />
                          <div className="px-2 text-[10px] text-wine font-medium">✦ Official plus-one of {companionName || invitedAs}</div>
                        </>
                      ) : (
                        <>
                          <EditText
                            value={g.name || g.greet || ""}
                            placeholder="Guest's full name"
                            onSave={(v) => save(g.name ? { ...g, name: v } : { ...g, name: v, greet: g.greet || v })}
                          />
                          {invitedAs && g.name && invitedAs.toLowerCase() !== g.name.trim().toLowerCase() && (
                            <div className="px-2 text-[10px] text-ink/45">Invited as: {invitedAs}</div>
                          )}
                          {cleanInviteNote(g.note) && (
                            <div className="px-2 text-[10px] text-ink/45 italic">{cleanInviteNote(g.note)}</div>
                          )}
                        </>
                      )}
                    </td>
                    <td className="px-1 py-1.5 min-w-[160px]">
                      {isPlusOneRow ? (
                        <div className="px-2 py-1.5 text-xs text-ink/60">
                          Guest of <b>{companionName || invitedAs}</b>
                        </div>
                      ) : (
                        <EditText
                          value={g.plus_one ?? ""}
                          placeholder={Number(g.pax) >= 2 ? "Plus-one name" : "Add plus-one…"}
                          onSave={(v) => save({ ...g, plus_one: v, pax: v.trim() && (Number(g.pax) || 1) < 2 ? 2 : g.pax })}
                          className="text-ink/75"
                        />
                      )}
                    </td>
                    <td className="px-1 min-w-[130px]">
                      <EditText value={g.phone} onSave={(v) => save({ ...g, phone: v })} />
                      {g.phone && <a className="label !text-[9px] text-moss px-2" target="_blank" rel="noreferrer" href={`https://wa.me/${g.phone.replace(/\D/g, "")}`}>Message ↗</a>}
                    </td>
                    <td className="px-1">
                      <EditText type="number" value={g.pax} onSave={(v) => save({ ...g, pax: Math.max(0, Math.round(num(v))) })} className="tabular-nums" />
                      <div className="px-2 text-[10px] text-ink/45">{isPlusOneRow ? "Seat 2" : g.plus_one ? "Seat 1 (+1)" : `${g.pax} seat${g.pax === 1 ? "" : "s"}`}</div>
                    </td>
                    <td className="px-1">
                      <Select value={g.attending} options={ATT} onChange={(v) => save({ ...g, attending: v })} />
                    </td>
                    <td className="px-1 min-w-[130px]"><EditText value={g.dietary} placeholder="None" onSave={(v) => save({ ...g, dietary: v })} /></td>
                    <td className="px-1 min-w-[130px]"><EditText value={g.song_request} placeholder="—" onSave={(v) => save({ ...g, song_request: v })} /></td>
                    <td className="px-1 max-w-[240px]"><EditText value={g.message} placeholder="—" onSave={(v) => save({ ...g, message: v })} /></td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <Tag>{STATUS[inviteStatus(g)].label}</Tag>
                      <div className="flex flex-wrap gap-x-2 gap-y-1 mt-1 max-w-[150px]">
                        {!g.code ? (
                          <button className="label !text-[9px] text-wine hover:text-burgundy" onClick={() => save({ ...g, code: genCodeFor(rows) })}>issue code</button>
                        ) : (
                          <>
                            <span className="label !text-[9px] text-ink/60">{cleanCode(g.code)}</span>
                            <button className="label !text-[9px] text-moss" onClick={() => navigator.clipboard?.writeText(inviteLink(g.code!, location.origin))}>copy link</button>
                            <a className="label !text-[9px] text-wine hover:text-burgundy" target="_blank" rel="noreferrer"
                              href={inviteHref(g.code!, g.phone || "", { ...text, greet: g.greet, name: g.name, seats: Number(g.pax) || 0 })} title={g.phone ? "Send the invitation on WhatsApp" : "Send the invitation on WhatsApp — pick the contact there"}>send ↗</a>
                            <button className="label !text-[9px] text-ink/50 hover:text-wine" onClick={() => go("invites")}>ledger →</button>
                          </>
                        )}
                        {g.approved === false && (
                          <>
                            <button className="label !text-[9px] text-moss" onClick={() => save({ ...g, approved: true })}>approve</button>
                            <button className="label !text-[9px] text-ink/40 hover:text-burgundy" onClick={() => save({ ...g, attending: "no", approved: true })}>decline</button>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-[11px] text-ink/55">
                      <div>{formatDay(g.created_at) || "—"}</div>
                      <div className="text-[10px] text-ink/40">{g.source === "RSVP form" ? "RSVP reply" : "Binder"}</div>
                    </td>
                    <td className="px-1">
                      {isPlusOneRow ? (
                        <button onClick={() => confirm(`Remove plus-one ${displayName}?`) && save({ ...g, plus_one: "", pax: 1 })} title="Remove plus-one" className="text-ink/30 hover:text-burgundy px-2 py-2">✕</button>
                      ) : (
                        <button onClick={() => confirm(`Remove ${displayName || "this guest"}?`) && del(g.id)} className="text-ink/30 hover:text-burgundy px-2 py-2">✕</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!shown.length && <div className="py-14 text-center text-ink/40 font-serif text-2xl italic">{rows.length ? "No guests match this filter — try “all”." : "No guests yet — add guests here or generate codes in Invite Codes! ✦"}</div>}
        </div>
      </Card>
    </>
  );
}

/* ═════════════ 7. VENDORS ═════════════ */
export function Vendors() {
  const { rows, save, del } = useTable("vendors");
  const { save: saveBudget } = useTable("budget");
  const types = Array.from(new Set(rows.map((v) => v.type)));
  const [newType, setNewType] = useState("");
  return (
    <>
      <PageHead kicker="Side-by-side quotes" title="The vendors.">
        <input value={newType} onChange={(e) => setNewType(e.target.value)} placeholder="New category (hmua, band…)" className="bg-transparent border border-taupe/40 rounded-full px-4 py-2 text-sm outline-none focus:border-wine" />
        <Btn onClick={() => { save({ id: uid(), type: (newType || "other").toLowerCase(), name: "New vendor", quote: 0, contact: "", status: "pending", notes: "" }); setNewType(""); }}>+ Add vendor</Btn>
      </PageHead>
      <div className="space-y-8">
        {types.map((type) => {
          const list = rows.filter((v) => v.type === type);
          const quoted = list.filter((v) => v.quote > 0);
          const cheapest = quoted.length ? Math.min(...quoted.map((v) => v.quote)) : null;
          return (
            <div key={type}>
              <div className="label text-taupe mb-3">{type}</div>
              <div className="grid md:grid-cols-3 gap-4">
                {list.map((v: Vendor) => (
                  <Card key={v.id} className={v.status === "booked" ? "ring-2 ring-moss" : ""}>
                    <div className="flex justify-between items-start gap-2">
                      <EditText value={v.name} onSave={(x) => save({ ...v, name: x })} className="font-serif text-2xl" />
                      <button onClick={() => confirm(`Delete ${v.name}?`) && del(v.id)} className="text-ink/30 hover:text-burgundy">✕</button>
                    </div>
                    <div className="flex items-baseline gap-2 mt-2">
                      <EditText type="number" value={v.quote} onSave={(x) => save({ ...v, quote: num(x) })} className="display text-4xl !w-32" />
                      <span className="label text-ink/40">BHD</span>
                      {cheapest !== null && v.quote === cheapest && quoted.length > 1 && <span className="label !text-[9px] bg-moss/15 text-moss px-2 py-1 rounded-full">Lowest</span>}
                    </div>
                    <div className="flex gap-1 flex-wrap mt-3">
                      {VSTATUS.map((s) => <button key={s} onClick={() => save({ ...v, status: s })} className={`label !text-[9px] !tracking-[0.12em] px-2.5 py-1 rounded-full border ${v.status === s ? "bg-ink text-paper border-ink" : "border-ink/15 text-ink/50 hover:border-wine"}`}>{s}</button>)}
                    </div>
                    <EditText value={v.contact} placeholder="Contact / phone" onSave={(x) => save({ ...v, contact: x })} className="mt-3 text-sm" />
                    <EditText value={v.notes} placeholder="Notes" multiline rows={2} onSave={(x) => save({ ...v, notes: x })} className="text-sm text-ink/70" />
                    {v.status === "booked" && (
                      <Btn variant="ghost" className="mt-2 !text-moss" onClick={() => saveBudget({ id: `vendor-${v.id}`, category: type, item: v.name, quoted_cost: v.quote, paid_cost: 0, status: "confirmed" })}>Add to budget →</Btn>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ═════════════ 8. ATTIRE ═════════════ */
export function AttireEditor() {
  const { rows, save } = useTable("attire");
  const sorted = [...rows].sort((a, b) => a.order - b.order);
  return (
    <>
      <PageHead kicker="Palette shown on the Dress Code section" title="Attire & colors." />
      <div className="grid md:grid-cols-2 gap-5">
        {sorted.map((a: Attire) => (
          <Card key={a.id}>
            <div className="flex justify-between items-center gap-3">
              <EditText value={a.label} onSave={(v) => save({ ...a, label: v })} className="font-serif text-3xl" />
              <label className="label !text-[10px] flex items-center gap-2 whitespace-nowrap">
                <input type="checkbox" checked={a.reserved} onChange={(e) => save({ ...a, reserved: e.target.checked })} className="accent-burgundy" /> Reserved 🔒
              </label>
            </div>
            <div className="flex flex-wrap gap-3 mt-4">
              {a.colors.map((c, i) => (
                <div key={i} className="flex flex-col items-center gap-1 group relative">
                  <label className="w-14 h-14 rounded-full ring-1 ring-ink/10 cursor-pointer overflow-hidden" style={{ backgroundColor: c.hex }}>
                    <input type="color" value={c.hex} onChange={(e) => save({ ...a, colors: a.colors.map((x, j) => (j === i ? { ...x, hex: e.target.value } : x)) })} className="opacity-0 w-full h-full cursor-pointer" />
                  </label>
                  <input value={c.name} onChange={(e) => save({ ...a, colors: a.colors.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} className="w-20 text-center text-xs bg-transparent outline-none focus:bg-white/60 rounded" />
                  <button onClick={() => save({ ...a, colors: a.colors.filter((_, j) => j !== i) })} className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-ink text-paper text-[10px] opacity-0 group-hover:opacity-100">✕</button>
                </div>
              ))}
              <button onClick={() => save({ ...a, colors: [...a.colors, { name: "New", hex: "#6E1F2E" }] })} className="w-14 h-14 rounded-full border-2 border-dashed border-ink/20 text-ink/40 hover:border-wine hover:text-wine text-2xl">+</button>
            </div>
            <EditText value={a.notes} placeholder="Notes for family / guests" multiline rows={2} onSave={(v) => save({ ...a, notes: v })} className="mt-4 text-sm" />
            <div className="mt-3 flex items-center gap-3">
              {a.swatch_url && <img src={a.swatch_url} alt="fabric" className="w-16 h-16 rounded-lg object-cover" />}
              <label className="label !text-[10px] cursor-pointer border border-ink/15 rounded-full px-3 py-2 hover:border-wine">
                {a.swatch_url ? "Replace fabric swatch" : "Upload fabric swatch"}
                <input type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) save({ ...a, swatch_url: await fileToDataUrl(f, 500) }); }} />
              </label>
              {a.swatch_url && <button onClick={() => save({ ...a, swatch_url: "" })} className="text-xs text-burgundy">remove</button>}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

/* ═════════════ 9. CONTENT (images, entourage, FAQ) ═════════════ */
/* One draggable row of the Our Story carousel: photo + title + a little paragraph. */
function StoryChapterRow({ c, onSave, onDel }: { c: StoryChapter; onSave: (c: StoryChapter) => void; onDel: () => void }) {
  const controls = useDragControls();
  return (
    <Reorder.Item value={c} dragListener={false} dragControls={controls} className="bg-paper text-ink rounded-2xl p-4 md:p-5 flex gap-4 items-start shadow-lg list-none">
      <button onPointerDown={(e) => controls.start(e)} className="cursor-grab active:cursor-grabbing text-ink/30 hover:text-wine text-xl pt-1 touch-none select-none" aria-label="Drag">⋮⋮</button>
      <div className="w-24 shrink-0 text-center">
        {c.photo ? <img src={c.photo} alt="" className="w-24 h-24 object-cover rounded-lg bg-ink/5" /> : (
          <div className="w-24 h-24 rounded-lg border-2 border-dashed border-ink/15 grid place-items-center text-ink/35 text-[10px] leading-tight px-1">empty → uses<br />a gallery photo</div>
        )}
        <div className="mt-1.5 flex justify-center gap-2">
          <label className="cursor-pointer text-[10px] text-wine underline underline-offset-2">upload<input type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) onSave({ ...c, photo: await fileToDataUrl(f, 900) }); }} /></label>
          {c.photo && <button onClick={() => onSave({ ...c, photo: "" })} className="text-[10px] text-ink/40 hover:text-burgundy">remove</button>}
        </div>
      </div>
      <div className="flex-1 grid gap-1">
        <EditText value={c.title} onSave={(v) => onSave({ ...c, title: v })} className="font-serif text-2xl" />
        <EditText value={c.text} placeholder="Two or three lines for this chapter…" onSave={(v) => onSave({ ...c, text: v })} multiline rows={2} className="text-sm text-ink/70" />
      </div>
      <Btn variant="danger" onClick={onDel}>✕</Btn>
    </Reorder.Item>
  );
}

export function Content() {
  const { info, saveInfo } = useInfo();
  const ent = useTable("entourage");
  const faq = useTable("faq");
  const story = useTable("story");
  const storySorted = useMemo(() => [...story.rows].sort((a, b) => a.order - b.order), [story.rows]);
  const commitStoryOrder = () => story.save(storySorted.map((s, i) => ({ ...s, order: i + 1 })));
  const ROLES = ENTOURAGE_ROLES;
  const [url, setUrl] = useState("");
  const [msg, setMsg] = useState("");
  /** Push the latest copy of the standard questions (dress code, kids' policy…) to the binder. */
  async function refreshFaq() {
    if (!confirm(
      "Refresh the standard questions with the latest wording?\n\n" +
      "· The standard questions (ceremony, plus-one, dress code, kids, parking, photos) are rewritten with the newest copy — use this when the dress code or the kids' policy changes.\n" +
      "· A standard question you deleted comes back.\n" +
      "· Questions you wrote yourself are never touched."
    )) return;
    try {
      const r = await refreshFaqCopy();
      setMsg(`FAQ refreshed ✓ ${r.rewritten} rewritten · ${r.added} added`);
    } catch (e) { setMsg(`Error: ${(e as Error).message}`); }
  }
  /** Push the latest wording of the five story chapters (the copy that ends on 1 Cor 11:11). */
  async function refreshStory() {
    if (!confirm(
      "Refresh the story chapters with the latest wording?\n\n" +
      "· The five chapters (ch1–ch5) are rewritten with the newest copy — their photos stay put.\n" +
      "· A chapter you deleted comes back.\n" +
      "· Chapters you wrote yourself are never touched."
    )) return;
    try {
      const r = await refreshStoryCopy();
      setMsg(`Story refreshed ✓ ${r.rewritten} rewritten · ${r.added} added`);
    } catch (e) { setMsg(`Error: ${(e as Error).message}`); }
  }
  return (
    <>
      <PageHead kicker="Images, entourage & FAQ" title="Content." />
      {msg && <p className="mb-4 text-sm text-moss">{msg}</p>}
      <div className="grid md:grid-cols-2 gap-5">
        <Card title="Cover photo (on the invitation card)">
          {info.cover_photo ? <img src={info.cover_photo} alt="" className="rounded-xl w-full max-h-80 object-contain bg-ink/5" /> : <div className="h-40 rounded-xl border-2 border-dashed border-ink/15 grid place-items-center text-ink/40">No cover photo yet — shows inside the carved oval frame</div>}
          <div className="flex gap-2 mt-4">
            <label className="label !text-[10px] cursor-pointer bg-wine text-lace rounded-full px-4 py-2.5">Upload<input type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) saveInfo({ cover_photo: await fileToDataUrl(f, 1000) }); }} /></label>
            {info.cover_photo && <Btn variant="danger" onClick={() => saveInfo({ cover_photo: "" })}>Remove</Btn>}
          </div>
        </Card>
        <Card title="Background music">
          <p className="text-sm text-ink/60">Paste a direct link to an .mp3 (e.g. Supabase Storage, Dropbox “?raw=1”). A small play button appears on the site; guests tap it to play.</p>
          <EditText value={info.music_url ?? ""} placeholder="https://…/our-song.mp3" onSave={(v) => saveInfo({ music_url: v.trim() })} className="mt-3 text-sm break-all" />
          {info.music_url && <audio src={info.music_url} controls className="w-full mt-3" />}
        </Card>
        <Card title="Save the Date">
          <p className="text-sm text-ink/60 mb-3">Your Save the Date graphic. It appears on the public site just under the big <b>11.11</b> date, and guests can open or download it from there.</p>
          {info.save_the_date_url ? <img src={info.save_the_date_url} alt="" className="rounded-xl w-full max-h-80 object-contain bg-ink/5" /> : <div className="h-40 rounded-xl border-2 border-dashed border-ink/15 grid place-items-center text-ink/40">No graphic yet</div>}
          <div className="flex gap-2 mt-4">
            <label className="label !text-[10px] cursor-pointer bg-wine text-lace rounded-full px-4 py-2.5">Upload<input type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) saveInfo({ save_the_date_url: await fileToDataUrl(f) }); }} /></label>
            {info.save_the_date_url && <Btn variant="danger" onClick={() => saveInfo({ save_the_date_url: "" })}>Remove</Btn>}
          </div>
        </Card>
        <Card title="Photos (strips & polaroids)">
          <div className="grid grid-cols-3 gap-2">
            {info.gallery.map((src, i) => (
              <div key={i} className="relative group aspect-square">
                <img src={src} alt="" className="w-full h-full object-cover rounded-lg" />
                <button onClick={() => saveInfo({ gallery: info.gallery.filter((_, j) => j !== i) })} className="absolute top-1 right-1 w-6 h-6 bg-ink text-paper rounded-full text-xs opacity-0 group-hover:opacity-100">✕</button>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <label className="label !text-[10px] cursor-pointer bg-wine text-lace rounded-full px-4 py-2.5">Upload photos
              <input type="file" accept="image/*" multiple hidden onChange={async (e) => { const files = Array.from(e.target.files ?? []); const urls = await Promise.all(files.map((f) => fileToDataUrl(f, 1200))); saveInfo({ gallery: [...info.gallery, ...urls] }); }} />
            </label>
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="…or paste an image URL" className="flex-1 min-w-[160px] bg-white/60 rounded-full px-4 text-sm border border-ink/10 outline-none focus:border-wine" />
            <Btn variant="dark" onClick={() => { if (url) { saveInfo({ gallery: [...info.gallery, url] }); setUrl(""); } }}>Add</Btn>
          </div>
          <p className="text-xs text-ink/60 mt-3"><b>Order matters:</b> 1–5 = photo strips in Our Story (one per chapter) · 5–8 = long photo strip · 9–12 = polaroids · 13+ = extra polaroids near the end.</p>
          <p className="text-xs text-ink/50 mt-1">A chapter with no photo of its own borrows the gallery slot of the same number — so gallery #5 also opens the long strip until you upload one for Chapter 5.</p>
          <p className="text-xs text-ink/50 mt-1">Tip: photos are compressed automatically. For many large photos, host them (e.g. Supabase Storage / Cloudinary) and paste URLs.</p>
        </Card>
        <Card title="Story chapters (the Our Story carousel)" className="md:col-span-2" action={
          <div className="flex items-center gap-2 shrink-0">
            <Btn variant="ghost" onClick={refreshStory}>Refresh story copy</Btn>
            <Btn onClick={() => story.save({ id: uid(), title: "New chapter", text: "", photo: "", order: storySorted.length + 1 })}>+ Add chapter</Btn>
          </div>
        }>
          <p className="text-sm text-ink/60 mb-4">
            Our Story as guests read it: each chapter shows a <b>title</b>, two or three lines and <b>one photo</b> in the framed photo strip —
            guests swipe sideways or tap the dots, and the strip winds on like film. Drag ⋮⋮ to reorder the chapters.
            A chapter with no photo borrows one from your gallery. Delete every chapter and the site falls back to the classic one-paragraph story (Details → Our story).
            The <b>“Refresh story copy”</b> button rewrites the five standard chapters (ch1–ch5) with the newest wording from the code — your photos, and any chapter you wrote yourself, are kept.
          </p>
          <Reorder.Group axis="y" values={storySorted} onReorder={(next) => story.setRows(next.map((s, i) => ({ ...s, order: i + 1 })))} className="space-y-3" onPointerUp={commitStoryOrder}>
            {storySorted.map((c) => <StoryChapterRow key={c.id} c={c} onSave={story.save} onDel={() => story.del(c.id)} />)}
          </Reorder.Group>
          {storySorted.length === 0 && <p className="py-8 text-center text-ink/40 font-serif text-2xl italic">No chapters — the classic story shows instead. Add your first chapter ✦</p>}
        </Card>
        <Card title="Entourage" action={<Btn onClick={() => ent.save({ id: uid(), role: "bridesmaid", name: "To be announced", title: "", order: ent.rows.length + 1 })}>+ Add</Btn>}>
          <p className="text-sm text-ink/60 mb-4">
            Every role is a category — add as many people as you like under <b>Principal Sponsors</b>, <b>Groomsmen</b> or <b>Bridesmaids</b> and the site
            gathers them under one heading. They always stand in this order: parents, principal sponsors, best man, groomsmen, maid of honor, bridesmaids,
            ring bearer, flower girl, honoured guests — no matter when you add them.
          </p>
          <div className="space-y-5">
            {entourageGroups(ent.rows).map((g) => (
              <div key={g.role}>
                <p className="label text-wine mb-1">{g.heading} · {g.people.length}</p>
                <ul className="divide-y divide-ink/10">
                  {g.people.map((p) => (
                    <li key={p.id} className="py-2 grid grid-cols-2 md:grid-cols-[165px_1fr_1fr_auto] gap-2 items-center">
                      <Select value={p.role} options={ROLES} onChange={(v) => ent.save({ ...p, role: v })} className="text-xs" />
                      <EditText value={p.name} onSave={(v) => ent.save({ ...p, name: v })} className="font-serif text-lg" />
                      <EditText value={p.title} placeholder="e.g. Sister of the bride" onSave={(v) => ent.save({ ...p, title: v })} className="text-sm" />
                      <button onClick={() => ent.del(p.id)} className="text-ink/30 hover:text-burgundy px-2">✕</button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Card>
        <Card title="FAQ" action={<><Btn variant="ghost" onClick={refreshFaq}>Refresh wording</Btn><Btn onClick={() => faq.save({ id: uid(), question: "New question?", answer: "", order: faq.rows.length + 1 })}>+ Add</Btn></>}>
          <ul className="divide-y divide-ink/10">
            {[...faq.rows].sort((a, b) => a.order - b.order).map((f) => (
              <li key={f.id} className="py-2 flex gap-2">
                <div className="flex-1">
                  <EditText value={f.question} onSave={(v) => faq.save({ ...f, question: v })} className="font-serif text-xl" />
                  <EditText value={f.answer} multiline rows={2} onSave={(v) => faq.save({ ...f, answer: v })} className="text-sm text-ink/70" />
                </div>
                <button onClick={() => faq.del(f.id)} className="text-ink/30 hover:text-burgundy px-2 self-start">✕</button>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}

/* ═════════════ 10. SETTINGS ═════════════ */
export function Settings({ mode, onPrint, go }: { mode: string; onPrint: () => void; go: (tab: string) => void }) {
  const { info, saveInfo } = useInfo();
  const { rows: guests } = useTable("guests", false);
  const [msg, setMsg] = useState("");
  /** The WhatsApp letter, rendered here so the wording is always in front of you — see the note below. */
  const inviteSample = useMemo(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const row = guests.find((g) => cleanCode(g.code || ""));
    const t: InviteText = {
      couple: `${info.bride} & ${info.groom}`,
      day: new Date(info.date).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }),
      date: info.date,
      deadline: info.rsvp_deadline,
      greet: row ? whoIsItFor(row) || undefined : undefined,
      seats: row ? Number(row.pax) || 0 : 2,
    };
    return inviteMessage(row?.code || "JS-XXXX", t, origin);
  }, [guests, info]);
  async function exportAll() {
    const { list } = await import("@/lib/db");
    const all: Record<string, unknown> = {};
    for (const t of TABLES) all[t] = await list(t);
    download(`js-wedding-binder-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(all, null, 2), "application/json");
  }
  async function pushSeed() {
    if (!confirm(
      "Push the starter data to Supabase?\n\n" +
      "· Your guest list, their RSVPs and the invite codes are never touched.\n" +
      "· The attire palette is refreshed from the code — families, entourage and guest weaves get the latest colours.\n" +
      "· Everything else — details, cover photo, gallery, song, schedule, budget, vendors, checklist, entourage and FAQ — only fills in rows that are missing. Nothing you wrote, uploaded or chose is ever overwritten.\n\n" +
      "Continue?"
    )) return;
    setMsg("Uploading…");
    try {
      const r = await pushSeedSafely();
      setMsg(`Done ✓ ${r.added ? `${r.added} missing ${r.added === 1 ? "row" : "rows"} added` : "nothing was missing"} · attire refreshed from the code · your guests and your edits are untouched.`);
    } catch (e) { setMsg(`Error: ${(e as Error).message}`); }
  }
  const sharePreview = info.share_image || "/og.jpg";
  return (
    <>
      <PageHead kicker="Housekeeping" title="Settings." />
      <div className="grid md:grid-cols-2 gap-5">
        <Card title="Website & sharing">
          <p className="text-sm text-ink/60 mb-4">How your site introduces itself — the browser tab, the card friends see when they share your link, and the little tab icon.</p>
          <div className="rounded-xl border border-ink/10 overflow-hidden max-w-sm mb-5">
            <div className="aspect-[1.91/1] bg-ink/5"><img src={sharePreview} alt="" className="w-full h-full object-cover" /></div>
            <div className="p-3 bg-white/60">
              <p className="label !text-[9px] text-ink/40">{location.host}</p>
              <p className="font-semibold text-sm">{info.site_title || "Your tab title"}</p>
              <p className="text-xs text-ink/60 line-clamp-2">{info.site_description || "The description friends read before they open your link."}</p>
            </div>
          </div>
          <div className="grid gap-5">
            <F label="Browser tab title"><EditText value={info.site_title ?? ""} placeholder="Jeger & Shaira — Wedding · 11.11.2026" onSave={(v) => saveInfo({ site_title: v })} /></F>
            <F label="Description on shared links"><EditText value={info.site_description ?? ""} multiline rows={2} placeholder="Jeger & Shaira are getting married on 11.11.2026…" onSave={(v) => saveInfo({ site_description: v })} />
              {info.site_description?.toLowerCase().includes((info.venue_name || "").toLowerCase()) && (
                <p className="text-[11px] text-burgundy/80 mt-1.5 leading-snug">
                  Heads-up: this line repeats your venue&apos;s name, and it is <b>public</b> — it is the text people read on the
                  shared link (and in search) before they unlock anything. The preview page hides the venue, so you may want to
                  write this one without it.
                </p>
              )}
            </F>
            <div>
              <span className="label text-ink/50 block mb-1">Preview banner on shared links</span>
              <p className="text-xs text-ink/50 mb-2">What WhatsApp, iMessage and Facebook show when someone shares your link. A 1200 × 630 image looks best.</p>
              <div className="flex flex-wrap gap-2">
                <label className="label !text-[10px] cursor-pointer bg-wine text-lace rounded-full px-4 py-2.5">Upload<input type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) saveInfo({ share_image: await fileToDataUrl(f, 1200) }); }} /></label>
                {info.share_image && <Btn variant="danger" onClick={() => saveInfo({ share_image: "" })}>Remove</Btn>}
              </div>
              <EditText value={/^https?:/i.test(info.share_image ?? "") ? info.share_image! : ""} placeholder="…or paste a link to a hosted image" onSave={(v) => v.trim() && saveInfo({ share_image: v.trim() })} className="mt-2 text-sm break-all" />
            </div>
            <div>
              <span className="label text-ink/50 block mb-1">Favicon (the tab icon)</span>
              <div className="flex items-center gap-3 mb-2">
                <img src={info.favicon || "/favicon.png"} alt="" className="w-10 h-10 rounded-lg object-cover bg-ink/5 ring-1 ring-ink/10" />
                <span className="text-sm text-ink/50">{info.favicon ? "Your icon" : "The default icon — upload your own"}</span>
              </div>
              <p className="text-xs text-ink/50 mb-2">Square works best (512 × 512 or smaller). It shows in browser tabs, bookmarks and phone home screens.</p>
              <div className="flex flex-wrap gap-2">
                <label className="label !text-[10px] cursor-pointer bg-wine text-lace rounded-full px-4 py-2.5">Upload<input type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) saveInfo({ favicon: await fileToDataUrl(f, 256) }); }} /></label>
                {info.favicon && <Btn variant="danger" onClick={() => saveInfo({ favicon: "" })}>Use default</Btn>}
              </div>
              <EditText value={/^https?:/i.test(info.favicon ?? "") ? info.favicon! : ""} placeholder="…or paste a link to a hosted icon" onSave={(v) => v.trim() && saveInfo({ favicon: v.trim() })} className="mt-2 text-sm break-all" />
            </div>
          </div>
          <p className="text-xs text-ink/50 mt-4">Leave a field empty and it falls back to the starter wording. Shared-link previews are cached by WhatsApp and Facebook for a while, so a new banner can take a few minutes to appear.</p>
        </Card>
        <Card title="The WhatsApp invitation">
          <p className="text-sm text-ink/60 mb-4">
            What your guests read when you send their link. It writes itself from the binder: who each
            link is for and how many seats it holds (<b>Invite Codes</b>), the wedding <b>date</b>{` `}
            (<b>Details</b>) and the <b>reply-by date</b> (Website &amp; sharing, above).
          </p>
          <pre className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded-xl bg-oat/60 p-4 font-sans text-[12px] leading-[1.65] text-ink/75">{inviteSample}</pre>
          <Btn variant="ghost" className="mt-4" onClick={() => go("invites")}>Proof it per household on Invite codes →</Btn>
          <div className="mt-4 rounded-xl border border-wine/15 bg-wine/5 p-4">
            <p className="label !text-[9px] text-wine mb-1.5">Where the wording lives</p>
            <p className="text-xs leading-5 text-ink/60">
              The message template is one function in the code: <code className="rounded bg-ink/10 px-1">lib/guests.ts</code> →{` `}
              <code className="rounded bg-ink/10 px-1">inviteMessage</code>, under the{` `}
              <code className="rounded bg-ink/10 px-1">── THIS IS THE MESSAGE TEMPLATE ──</code> heading. Edit those lines — or
              ask for the change — and the next deploy carries the new wording to every household,
              including the invitations you have already sent (their link reads the same site).
            </p>
          </div>
        </Card>
        <Card title="Storage">
          <div className="flex items-center gap-3 mb-3"><Tag>{mode === "supabase" ? "confirmed" : "pending"}</Tag><b>{mode === "supabase" ? "Connected to Supabase" : "Local demo mode (this browser only)"}</b></div>
          {mode === "supabase" ? (
            <>
              <p className="text-sm text-ink/70">Everything you edit is saved to your Supabase database and shown on the public site. First time? Seed it with the starter data — this is safe to press any time:</p>
              <ul className="text-sm text-ink/70 mt-3 space-y-1.5 list-disc pl-5">
                <li>Your <b>guest list, RSVPs and invite codes</b> are never touched.</li>
                <li>The <b>attire palette is refreshed from the code</b> — the gem stones, weaves and notes always match the site.</li>
                <li>Everything else <b>only fills in rows that are missing</b> — your details, cover photo, gallery, song, schedule, budget, vendors, checklist, entourage and FAQ are never overwritten.</li>
              </ul>
              <Btn variant="dark" className="mt-4" onClick={pushSeed}>Push starter data to Supabase</Btn>
            </>
          ) : (
            <>
              <p className="text-sm text-ink/70">Data is saved in this browser&apos;s localStorage. RSVPs from other people&apos;s phones will NOT reach you until you add Supabase keys (see README).</p>
              <Btn variant="danger" className="mt-4 border border-burgundy/30" onClick={() => { if (confirm("Reset all local data back to the starter data?")) { resetLocal(); setMsg("Reset ✓"); } }}>Reset local data</Btn>
            </>
          )}
          {msg && <p className="mt-3 text-sm">{msg}</p>}
        </Card>
        <Card title="Admin password">
          <p className="text-sm text-ink/70">The password is the <code className="bg-ink/10 px-1 rounded">ADMIN_PASSWORD</code> environment variable. To change it: Vercel → Project → Settings → Environment Variables → edit <code className="bg-ink/10 px-1 rounded">ADMIN_PASSWORD</code> → Redeploy. Changing it signs out every device.</p>
          <Btn variant="ghost" className="mt-4" onClick={async () => { await fetch("/api/logout", { method: "POST" }); location.href = "/admin/login"; }}>Sign out</Btn>
        </Card>
        <Card title="Export">
          <div className="flex flex-wrap gap-2">
            <Btn onClick={onPrint}>Print / Save binder as PDF</Btn>
            <Btn variant="dark" onClick={exportAll}>Download all data (JSON)</Btn>
          </div>
          <p className="text-xs text-ink/50 mt-3">For PDF: choose “Save as PDF” as the printer in the print dialog.</p>
        </Card>
      </div>
    </>
  );
}

/* ═════════════ PRINTABLE BINDER ═════════════ */
export function PrintBinder() {
  const { info } = useInfo();
  const { rows: schedule } = useTable("schedule");
  const { rows: budget } = useTable("budget");
  const { rows: guests } = useTable("guests", false);
  const { rows: vendors } = useTable("vendors");
  const { rows: tasks } = useTable("checklist");
  const { rows: attire } = useTable("attire");
  const H = ({ children }: { children: string }) => <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 28, margin: "28px 0 8px", borderBottom: "1px solid #ccc" }}>{children}</h2>;
  const T = ({ head, rows }: { head: string[]; rows: (string | number)[][] }) => (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
      <thead><tr>{head.map((h) => <th key={h} style={{ textAlign: "left", borderBottom: "1px solid #999", padding: 4 }}>{h}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} style={{ borderBottom: "1px solid #eee", padding: 4 }}>{c}</td>)}</tr>)}</tbody>
    </table>
  );
  return (
    <div className="hidden print:block p-8 text-black bg-white">
      <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 48 }}>{info.bride} &amp; {info.groom} — Wedding Binder</h1>
      <p>{new Date(info.date).toLocaleString("en-GB", { dateStyle: "full", timeStyle: "short", timeZone: "Asia/Bahrain" })} · {info.venue_name}, {info.venue_address}</p>
      <H>Schedule</H><T head={["Time", "Title", "Detail"]} rows={[...schedule].sort((a, b) => a.order - b.order).map((s) => [s.time, s.title, s.detail])} />
      <H>Budget</H><T head={["Category", "Item", "Quoted", "Paid", "Status"]} rows={[...budget.map((b) => [b.category, b.item, b.quoted_cost, b.paid_cost, b.status]), ["", "TOTAL", budget.reduce((s, b) => s + b.quoted_cost, 0), budget.reduce((s, b) => s + b.paid_cost, 0), `of ${info.total_budget}`]]} />
      <H>Vendors</H><T head={["Type", "Name", "Quote", "Status", "Contact", "Notes"]} rows={vendors.map((v) => [v.type, v.name, v.quote, v.status, v.contact, v.notes])} />
      <H>Checklist</H><T head={["", "Task", "Priority", "Due"]} rows={[...tasks].sort((a, b) => a.due_date.localeCompare(b.due_date)).map((t) => [t.completed ? "✓" : "☐", t.task, t.category, t.due_date])} />
      <H>Attire</H><T head={["Group", "Colors", "Notes"]} rows={attire.map((a) => [a.label, a.colors.map((c) => c.name).join(", "), a.notes])} />
      <H>{`Guests (${guests.filter((g) => g.attending === "yes").reduce((s, g) => s + g.pax, 0)} pax confirmed)`}</H>
      <T head={["Name", "Plus-one", "Code", "Phone", "Pax", "Attending", "Dietary"]} rows={guests.map((g) => [g.name || whoIsItFor(g), g.plus_one || "", cleanCode(g.code || ""), g.phone, g.pax, g.attending, g.dietary])} />
    </div>
  );
}

export { getMode };
