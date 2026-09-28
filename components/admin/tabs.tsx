"use client";
import { Reorder, useDragControls } from "framer-motion";
import { useMemo, useState } from "react";
import { getMode, resetLocal, uid, upsert } from "@/lib/db";
import { useCountdown, useTable } from "@/lib/hooks";
import { SEED } from "@/lib/seed";
import type { Attending, Attire, BudgetItem, BudgetStatus, ChecklistItem, EntourageMember, Guest, Priority, ScheduleItem, TableName, Vendor, VendorStatus } from "@/lib/types";
import { TABLES } from "@/lib/types";
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
      <PageHead kicker="Edits go live on the public site instantly" title="The details."><a href="/" target="_blank"><Btn variant="ghost">View site ↗</Btn></a></PageHead>
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
        </Card>
        <Card title="Social">
          <div className="grid gap-4">
            <F label="Instagram"><EditText value={info.instagram} onSave={(v) => saveInfo({ instagram: v })} /></F>
            <F label="Hashtags (space separated)"><EditText value={info.hashtags.join(" ")} onSave={(v) => saveInfo({ hashtags: v.split(/\s+/).filter(Boolean).map((h) => (h.startsWith("#") ? h : `#${h}`)) })} /></F>
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
      <PageHead kicker="Drag ⋮⋮ to reorder" title="The day, hour by hour.">
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

/* ═════════════ 6. GUESTS ═════════════ */
export function Guests() {
  const { rows, save, del, error } = useTable("guests", false);
  const [filter, setFilter] = useState<"all" | Attending>("all");
  const [q, setQ] = useState("");
  const shown = rows
    .filter((g) => filter === "all" || g.attending === filter)
    .filter((g) => !q || `${g.name} ${g.phone}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
  const pax = rows.filter((g) => g.attending === "yes").reduce((s, g) => s + g.pax, 0);
  const pendingPax = rows.filter((g) => g.attending === "pending").reduce((s, g) => s + g.pax, 0);
  const add = () => save({ id: uid(), name: "New guest", phone: "", pax: 1, attending: "pending", dietary: "", message: "", song_request: "", source: "manual", created_at: new Date().toISOString() });
  return (
    <>
      <PageHead kicker="RSVP inbox + manual list" title="The guest list.">
        <Btn onClick={add}>+ Add guest</Btn>
        <Btn variant="ghost" onClick={() => download("guests.csv", toCsv(rows))}>Export CSV</Btn>
      </PageHead>
      {error && <div className="mb-4 text-red-300">{error}</div>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-5">
        <Card className="!bg-moss !text-paper"><Stat label="Catering headcount" value={pax} sub={`+ up to ${pendingPax} pending`} /></Card>
        {ATT.map((a) => <Card key={a}><Stat label={a === "yes" ? "Attending" : a === "no" ? "Declined" : "Pending"} value={rows.filter((g) => g.attending === a).length} sub="parties" /></Card>)}
      </div>
      <Card>
        <div className="flex flex-wrap gap-2 mb-4">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or number…" className="flex-1 min-w-[200px] bg-white/60 rounded-full px-5 py-2.5 outline-none border border-ink/10 focus:border-wine" />
          {(["all", ...ATT] as const).map((f) => <Btn key={f} variant={filter === f ? "dark" : "ghost"} onClick={() => setFilter(f)}>{f}</Btn>)}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[1000px] text-sm">
            <thead><tr className="label text-ink/50 border-b border-ink/10">
              <th className="py-3 px-2">Name</th><th className="px-2">WhatsApp</th><th className="px-2 w-16">Pax</th><th className="px-2">Attending</th><th className="px-2">Dietary</th><th className="px-2">Song</th><th className="px-2">Message</th><th className="px-2">Source</th><th />
            </tr></thead>
            <tbody className="divide-y divide-ink/10">
              {shown.map((g: Guest) => (
                <tr key={g.id} className="align-top">
                  <td className="px-1 py-1 font-medium"><EditText value={g.name} onSave={(v) => save({ ...g, name: v })} /></td>
                  <td className="px-1"><EditText value={g.phone} onSave={(v) => save({ ...g, phone: v })} />{g.phone && <a className="label !text-[9px] text-moss px-2" target="_blank" rel="noreferrer" href={`https://wa.me/${g.phone.replace(/\D/g, "")}`}>Message ↗</a>}</td>
                  <td className="px-1"><EditText type="number" value={g.pax} onSave={(v) => save({ ...g, pax: Math.max(0, Math.round(num(v))) })} /></td>
                  <td className="px-1"><Select value={g.attending} options={ATT} onChange={(v) => save({ ...g, attending: v })} /></td>
                  <td className="px-1"><EditText value={g.dietary} onSave={(v) => save({ ...g, dietary: v })} /></td>
                  <td className="px-1"><EditText value={g.song_request} onSave={(v) => save({ ...g, song_request: v })} /></td>
                  <td className="px-1 max-w-[260px]"><EditText value={g.message} onSave={(v) => save({ ...g, message: v })} /></td>
                  <td className="px-2 py-2"><Tag>{g.source === "RSVP form" ? "quoted" : "pending"}</Tag><div className="text-[10px] text-ink/40 mt-1">{g.source}</div></td>
                  <td className="px-1"><button onClick={() => confirm(`Remove ${g.name}?`) && del(g.id)} className="text-ink/30 hover:text-burgundy px-2 py-2">✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!shown.length && <div className="py-14 text-center text-ink/40 font-serif text-2xl italic">No RSVPs yet — share the link! ✦</div>}
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
export function Content() {
  const { info, saveInfo } = useInfo();
  const ent = useTable("entourage");
  const faq = useTable("faq");
  const ROLES: EntourageMember["role"][] = ["sponsor", "bridesmaid", "groomsman", "other"];
  const [url, setUrl] = useState("");
  return (
    <>
      <PageHead kicker="Images, entourage & FAQ" title="Content." />
      <div className="grid md:grid-cols-2 gap-5">
        <Card title="Save the Date">
          {info.save_the_date_url ? <img src={info.save_the_date_url} alt="" className="rounded-xl w-full max-h-80 object-contain bg-ink/5" /> : <div className="h-40 rounded-xl border-2 border-dashed border-ink/15 grid place-items-center text-ink/40">No graphic yet</div>}
          <div className="flex gap-2 mt-4">
            <label className="label !text-[10px] cursor-pointer bg-wine text-lace rounded-full px-4 py-2.5">Upload<input type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) saveInfo({ save_the_date_url: await fileToDataUrl(f) }); }} /></label>
            {info.save_the_date_url && <Btn variant="danger" onClick={() => saveInfo({ save_the_date_url: "" })}>Remove</Btn>}
          </div>
        </Card>
        <Card title="Gallery">
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
          <p className="text-xs text-ink/50 mt-3">Tip: photos are compressed automatically. For many large photos, host them (e.g. Supabase Storage / Cloudinary) and paste URLs.</p>
        </Card>
        <Card title="Entourage" action={<Btn onClick={() => ent.save({ id: uid(), role: "bridesmaid", name: "Name", title: "", order: ent.rows.length + 1 })}>+ Add</Btn>}>
          <ul className="divide-y divide-ink/10">
            {[...ent.rows].sort((a, b) => a.order - b.order).map((p) => (
              <li key={p.id} className="py-1.5 grid grid-cols-[110px_1fr_1fr_auto] gap-2 items-center">
                <Select value={p.role} options={ROLES} onChange={(v) => ent.save({ ...p, role: v })} className="text-xs" />
                <EditText value={p.name} onSave={(v) => ent.save({ ...p, name: v })} className="font-serif text-lg" />
                <EditText value={p.title} placeholder="e.g. Sister of the bride" onSave={(v) => ent.save({ ...p, title: v })} className="text-sm" />
                <button onClick={() => ent.del(p.id)} className="text-ink/30 hover:text-burgundy px-2">✕</button>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="FAQ" action={<Btn onClick={() => faq.save({ id: uid(), question: "New question?", answer: "", order: faq.rows.length + 1 })}>+ Add</Btn>}>
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
export function Settings({ mode, onPrint }: { mode: string; onPrint: () => void }) {
  const [msg, setMsg] = useState("");
  async function exportAll() {
    const { list } = await import("@/lib/db");
    const all: Record<string, unknown> = {};
    for (const t of TABLES) all[t] = await list(t);
    download(`js-wedding-binder-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(all, null, 2), "application/json");
  }
  async function pushSeed() {
    if (!confirm("Upload the starter data (details, schedule, budget, vendors, checklist, attire, entourage, FAQ) to Supabase? Existing rows with the same id will be overwritten.")) return;
    setMsg("Uploading…");
    try {
      for (const t of TABLES) if (t !== "guests") await upsert(t as TableName, SEED[t] as never);
      setMsg("Done ✓ Supabase is seeded.");
    } catch (e) { setMsg(`Error: ${(e as Error).message}`); }
  }
  return (
    <>
      <PageHead kicker="Housekeeping" title="Settings." />
      <div className="grid md:grid-cols-2 gap-5">
        <Card title="Storage">
          <div className="flex items-center gap-3 mb-3"><Tag>{mode === "supabase" ? "confirmed" : "pending"}</Tag><b>{mode === "supabase" ? "Connected to Supabase" : "Local demo mode (this browser only)"}</b></div>
          {mode === "supabase" ? (
            <>
              <p className="text-sm text-ink/70">Everything you edit is saved to your Supabase database and shown on the public site. First time? Seed it with the starter data:</p>
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
      <T head={["Name", "Phone", "Pax", "Attending", "Dietary"]} rows={guests.map((g) => [g.name, g.phone, g.pax, g.attending, g.dietary])} />
    </div>
  );
}

export { getMode };
