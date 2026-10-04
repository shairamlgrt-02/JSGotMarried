"use client";
import { useMemo, useState } from "react";
import { uid } from "@/lib/db";
import {
  STATUS, cleanCode, genCode, inviteHref, inviteLink, inviteMessage, inviteSheet, inviteStatus,
  parseGuestLines, previewLink, tallyInvites, type InviteStatus,
} from "@/lib/guests";
import { useTable } from "@/lib/hooks";
import type { Guest } from "@/lib/types";
import { Btn, Card, EditText, PageHead, Stat, download, toCsv } from "./ui";

/** What a copy button did, one row at a time. */
async function copyText(text: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(text); return true; } catch { /* http, or an old browser — fall back */ }
  try {
    const ta = document.createElement("textarea");
    ta.value = text; ta.setAttribute("readonly", ""); ta.style.cssText = "position:fixed;top:0;left:-9999px";
    document.body.appendChild(ta); ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch { return false; }
}

const TONE: Record<string, string> = {
  moss: "bg-moss/15 text-moss", wine: "bg-wine/10 text-wine", ink: "bg-ink/10 text-ink/60",
  amethyst: "bg-amethyst/15 text-amethyst", burgundy: "bg-burgundy/15 text-burgundy",
};
function StatusTag({ s }: { s: InviteStatus }) {
  const { label, hint, tone } = STATUS[s];
  return <span title={hint} className={`label !text-[10px] !tracking-[0.15em] px-2.5 py-1 rounded-full whitespace-nowrap ${TONE[tone]}`}>{label}</span>;
}
/** Rows that need something from you first; answered ones sink to the bottom. */
const ORDER: InviteStatus[] = ["needs_review", "opened", "to_send", "sent", "no_code", "confirmed", "declined"];
const day = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "");

/**
 * The invite-code ledger: generate codes in bulk, copy the links straight into WhatsApp, and watch
 * each one move from `to send` → `sent` → `opened` → `confirmed`/`needs review`/`declined`.
 *
 * One table backs both this tab and Guests & RSVP: a household is one row, and the guest's reply
 * is written onto that same row (never a second one). A row joins the guest list the moment its
 * link has been filled in — see lib/guests.ts (`onGuestList`).
 */
export function InviteCodes({ go }: { go: (tab: string) => void }) {
  const { rows, save, del, error } = useTable("guests", false);
  const { rows: infoRows } = useTable("wedding_info");
  const info = infoRows[0];
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const [filter, setFilter] = useState<"all" | InviteStatus>("all");
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState("");
  const [copied, setCopied] = useState("");
  const [panel, setPanel] = useState(false);
  const [paste, setPaste] = useState("");
  const [blanks, setBlanks] = useState(12);
  const [seatDefault, setSeatDefault] = useState(1);
  const [copyAfter, setCopyAfter] = useState(true);

  const couple = info ? `${info.bride} & ${info.groom}` : "Jeger & Shaira";
  const dayText = info ? new Date(info.date).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }) : "11.11.2026";
  const tally = useMemo(() => tallyInvites(rows), [rows]);

  const ledger = useMemo(() => {
    const withStatus = rows.map((g) => ({ g, s: inviteStatus(g) }));
    const filtered = withStatus
      .filter((x) => filter === "all" || x.s === filter)
      .filter((x) => !q || `${x.g.name} ${x.g.phone} ${x.g.code} ${x.g.note ?? ""} ${x.g.plus_one ?? ""}`.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => ORDER.indexOf(a.s) - ORDER.indexOf(b.s) || a.g.name.localeCompare(b.g.name));
    return filtered;
  }, [rows, filter, q]);

  const flash = (t: string) => { setMsg(t); setTimeout(() => setMsg(""), 6000); };
  const mark = (key: string) => { setCopied(key); setTimeout(() => setCopied(""), 1800); };

  /** Issue a code per household and (optionally) hand you every link at once, ready to paste. */
  async function generate(kind: "names" | "blanks") {
    const parsed = kind === "names" ? parseGuestLines(paste) : [];
    if (kind === "names" && !parsed.length) return flash("Nothing to add — put one household per line, e.g. “Ana & Ivan, 973 1234 5678, 2 pax”.");
    const taken = new Set(rows.map((r) => cleanCode(r.code || "")));
    const known = new Set(rows.map((r) => r.name.trim().toLowerCase()));
    const fresh = parsed.filter((p) => !known.has(p.name.trim().toLowerCase()));
    const skipped = parsed.length - fresh.length;
    const start = rows.length;
    const next = (name: string, phone: string, pax: number, note: string): Guest => {
      const code = genCode(taken);
      taken.add(code);
      return { id: uid(), name, phone, pax, attending: "pending", dietary: "", message: "", song_request: "", note, source: "manual", code, created_at: new Date().toISOString() };
    };
    const created = kind === "names"
      ? fresh.map((p) => next(p.name, p.phone, p.pax, p.note))
      : Array.from({ length: Math.max(1, Math.min(500, Math.round(blanks) || 1)) }, (_, i) => next(`Household ${start + i + 1}`, "", seatDefault, "name to fill in"));
    if (created.length) await save(created);
    const links = inviteSheet(created, origin);
    if (copyAfter && links) await copyText(links);
    if (kind === "names" && !created.length) return flash(`Those ${skipped} household${skipped === 1 ? "" : "s"} are already on the list — no second code for the same name.`);
    setPanel(false); setPaste("");
    flash(
      `Generated ${created.length} code${created.length === 1 ? "" : "s"} ✓ ` +
      (skipped ? `${skipped} already on the list ${skipped === 1 ? "was" : "were"} skipped. ` : "") +
      (copyAfter && links ? "Every name, code and link is on your clipboard — paste and send. " : "") +
      "Marking a row's link as copied marks it sent; when the guest opens it, the row turns to opened."
    );
  }

  const copy = async (g: Guest, text: string, key: string, andMarkSent = false) => {
    if (!(await copyText(text))) return flash("Your browser blocked the clipboard — long-press the text and copy it by hand.");
    mark(key);
    if (andMarkSent && !g.sent_at) await save({ ...g, sent_at: new Date().toISOString() });
  };

  const bulkCopy = (list: Guest[]) => {
    const text = inviteSheet(list, origin);
    if (!text) return flash("Nothing to copy in this view.");
    void copyText(text);
    flash(`Copied ${list.length} household${list.length === 1 ? "" : "s"} — one line each: name, code, link.`);
  };

  const rowsForCsv = ledger.map(({ g, s }) => ({
    name: g.name, note: g.note ?? "", phone: g.phone, pax: g.pax, code: cleanCode(g.code || ""),
    link: g.code ? inviteLink(g.code, origin) : "", status: STATUS[s].label,
    attending: g.attending, plus_one: g.plus_one ?? "", sent: g.sent_at ? day(g.sent_at) : "",
    opened: g.viewed_at ? day(g.viewed_at) : "", replied_at: g.source === "RSVP form" ? day(g.created_at) : "",
    message: g.message ?? "",
  }));

  const filterChips: ("all" | InviteStatus)[] = ["all", ...ORDER];
  const countFor = (f: "all" | InviteStatus) => (f === "all" ? rows.length : rows.filter((g) => inviteStatus(g) === f).length);

  return (
    <>
      <PageHead kicker="Issue · send · track" title="The invite codes.">
        <Btn onClick={() => setPanel(!panel)}>{panel ? "Close" : "✦ Generate codes"}</Btn>
        <Btn variant="ghost" onClick={() => bulkCopy(ledger.map((x) => x.g))}>Copy these links</Btn>
        <Btn variant="ghost" onClick={() => download("invite-codes.csv", toCsv(rowsForCsv))}>Export CSV</Btn>
        <Btn variant="ghost" onClick={() => go("guests")}>Guests &amp; RSVP →</Btn>
      </PageHead>

      <p className="text-sm text-ink/60 mb-5 max-w-3xl">
        Every household gets one code, <b>JS-XXXX</b>, and one personal link. Send the link, and the row moves itself along:
        you copy or send it (<i>sent</i>), they open it (<i>opened</i> — stamped by the server), they answer
        (<i>confirmed</i>, <i>needs review</i> or <i>declined</i>). Answered rows appear on <b>Guests &amp; RSVP</b> too.
        A guest without the link can type the last four characters at <b>{`${origin}/rsvp`}</b>.
      </p>

      {msg && <div className="mb-5 text-sm bg-moss/10 text-moss rounded-xl px-4 py-3">{msg}</div>}
      {error && <div className="mb-4 text-red-300">{error}</div>}

      {panel && (
        <Card className="mb-5">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-serif text-2xl mb-1">Paste your list</h3>
              <p className="text-xs text-ink/55 mb-3">One household per line. A phone number and a seat count are picked up automatically.</p>
              <textarea
                value={paste} onChange={(e) => setPaste(e.target.value)} rows={9} spellCheck={false}
                placeholder={"Ana & Ivan, 973 1234 5678, 2 pax\nFaisal\nNadia +2, 973 7777 1234, cousins\n# lines starting with # are ignored"}
                className="w-full bg-white/60 rounded-xl border border-ink/10 focus:border-wine outline-none p-4 font-mono text-[13px] leading-6 resize-y"
              />
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <Btn onClick={() => void generate("names")}>Generate a code for each</Btn>
                <label className="label !text-[10px] text-ink/60 flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={copyAfter} onChange={(e) => setCopyAfter(e.target.checked)} className="accent-[#6E1F2E]" />
                  copy every new link afterwards
                </label>
              </div>
            </div>
            <div>
              <h3 className="font-serif text-2xl mb-1">Or just print codes</h3>
              <p className="text-xs text-ink/55 mb-3">A batch of blank households for a card table or a guest book — fill the names in later.</p>
              <div className="flex items-center gap-3 flex-wrap">
                <label className="label !text-[10px] text-ink/60">Codes
                  <input type="number" min={1} max={500} value={blanks} onChange={(e) => setBlanks(Number(e.target.value))} className="block mt-1 w-24 bg-white/60 rounded-md border border-ink/10 focus:border-wine outline-none px-3 py-2 text-base" />
                </label>
                <label className="label !text-[10px] text-ink/60">Seats each
                  <select value={seatDefault} onChange={(e) => setSeatDefault(Number(e.target.value))} className="block mt-1 bg-white/60 rounded-md border border-ink/10 focus:border-wine outline-none px-3 py-2 text-base">
                    {[1, 2].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </label>
                <span className="self-end pb-2.5"><Btn variant="dark" onClick={() => void generate("blanks")}>Add {Math.max(1, Math.min(500, Math.round(blanks) || 1))} blank codes</Btn></span>
              </div>
              <div className="mt-5 rounded-xl bg-oat/60 p-4 text-xs leading-5 text-ink/70">
                <p className="label !text-[9px] text-wine mb-1.5">The two links you'll use</p>
                <p className="break-all">Invitation link · <b>{inviteLink("JS-XXXX", origin)}</b></p>
                <p className="break-all mt-1">Preview link · <b>{previewLink(origin)}</b> — the site with no venue, programme or reply card</p>
                <p className="mt-2">A guest can also open <b>{`${origin}/rsvp`}</b> and type the last four characters.</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        <Card className="!bg-wine !text-lace"><div><Stat label="Codes issued" value={tally.codes} sub={`${tally.total - tally.codes} household${tally.total - tally.codes === 1 ? "" : "s"} still without one`} /></div></Card>
        <Card><Stat label="To send / sent" value={`${tally.to_send + tally.no_code} / ${tally.sent}`} sub={tally.opened ? `${tally.opened} opened but not replied` : "nobody has opened one yet"} /></Card>
        <Card><Stat label="Filled" value={tally.filled} sub={`${tally.needs_review} waiting on your review`} /></Card>
        <Card><Stat label="Seats" value={tally.seats} sub={`+ up to ${tally.pendingSeats} pending · ${tally.declined} declined`} /></Card>
      </div>

      <Card>
        <div className="flex flex-wrap gap-2 mb-4 items-center">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a name, number or code…" className="flex-1 min-w-[200px] bg-white/60 rounded-full px-5 py-2.5 outline-none border border-ink/10 focus:border-wine" />
          {filterChips.map((f) => (
            <Btn key={f} variant={filter === f ? "dark" : "ghost"} onClick={() => setFilter(f)} className="!px-3 !py-1.5">
              {f === "all" ? "all" : STATUS[f].label} <span className="opacity-60">{countFor(f)}</span>
            </Btn>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[1080px] text-sm">
            <thead><tr className="label text-ink/50 border-b border-ink/10">
              <th className="py-3 px-2">Household</th><th className="px-2">WhatsApp</th><th className="px-2 w-16">Seats</th>
              <th className="px-2">Code</th><th className="px-2">Link</th><th className="px-2">Status</th><th className="px-2">Their answer</th><th />
            </tr></thead>
            <tbody className="divide-y divide-ink/10">
              {ledger.map(({ g, s }) => (
                <tr key={g.id} className="align-top">
                  <td className="px-1 py-1 font-medium min-w-[170px]">
                    <EditText value={g.name} onSave={(v) => save({ ...g, name: v })} />
                    <EditText value={g.note ?? ""} placeholder="note (side of the family, table…)" onSave={(v) => save({ ...g, note: v })} className="!text-[11px] text-ink/50 italic" />
                  </td>
                  <td className="px-1 min-w-[130px]">
                    <EditText value={g.phone} onSave={(v) => save({ ...g, phone: v })} />
                    {g.phone && <a className="label !text-[9px] text-moss px-2" target="_blank" rel="noreferrer" href={`https://wa.me/${g.phone.replace(/\D/g, "")}`}>message ↗</a>}
                  </td>
                  <td className="px-1"><EditText type="number" value={g.pax} onSave={(v) => save({ ...g, pax: Math.max(0, Math.min(9, Math.round(Number(v) || 0))) })} className="tabular-nums" /></td>
                  <td className="px-2 py-2 whitespace-nowrap">
                    {g.code ? (
                      <>
                        <span className="label !text-[11px] text-ink">{cleanCode(g.code)}</span>
                        <div className="flex flex-wrap gap-x-2 mt-1">
                          <button className="label !text-[9px] text-ink/50 hover:text-wine" onClick={() => void copy(g, cleanCode(g.code), `${g.id}:code`)}>{copied === `${g.id}:code` ? "copied ✓" : "copy code"}</button>
                          <button className="label !text-[9px] text-ink/50 hover:text-burgundy" title="A new code retires the old link"
                            onClick={() => { if (!confirm(`Issue a new code for ${g.name}? Their old link stops working.`)) return; const c = genCode(rows.map((r) => r.code || "")); void save({ ...g, code: c, sent_at: null, viewed_at: null }); flash(`New code ${c} for ${g.name} ✓`); }}>
                            new code
                          </button>
                        </div>
                      </>
                    ) : (
                      <button className="label !text-[9px] text-wine hover:text-burgundy" onClick={() => void save({ ...g, code: genCode(rows.map((r) => r.code || "")) })}>+ issue code</button>
                    )}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap">
                    {g.code ? (
                      <div className="flex flex-wrap gap-x-2.5 gap-y-1 max-w-[190px]">
                        <button className="label !text-[9px] text-moss" onClick={() => void copy(g, inviteLink(g.code!, origin), g.id, true)} title={inviteLink(g.code!, origin)}>
                          {copied === g.id ? "copied ✓ sent" : "copy link"}
                        </button>
                        <button className="label !text-[9px] text-ink/60 hover:text-wine" onClick={() => void copy(g, inviteMessage(g.code!, couple, dayText, origin), `${g.id}:msg`, true)}>copy message</button>
                        <a className="label !text-[9px] text-wine hover:text-burgundy" target="_blank" rel="noreferrer"
                          onClick={() => void save({ ...g, sent_at: g.sent_at ?? new Date().toISOString() })}
                          href={inviteHref(g.code!, g.phone || "", couple, dayText, origin)}
                          title={g.phone ? "Send the invitation on WhatsApp" : "Send it on WhatsApp — pick the contact there"}>send ↗</a>
                        <button className="label !text-[9px] text-ink/50 hover:text-wine" onClick={() => void save({ ...g, sent_at: g.sent_at ? null : new Date().toISOString() })}>
                          {g.sent_at ? `sent ${day(g.sent_at)} · undo` : "mark sent"}
                        </button>
                      </div>
                    ) : <span className="text-ink/30 text-[11px]">issue a code to get a link</span>}
                  </td>
                  <td className="px-2 py-2">
                    <StatusTag s={s} />
                    <div className="text-[10px] text-ink/45 mt-1 leading-snug">
                      {g.viewed_at ? `opened ${day(g.viewed_at)}` : g.sent_at ? "waiting on them" : "not shared yet"}
                      {g.source === "RSVP form" && g.created_at ? ` · replied ${day(g.created_at)}` : ""}
                    </div>
                  </td>
                  <td className="px-2 py-2 max-w-[220px] text-[12px] leading-snug">
                    {g.attending === "yes" && <p><b className="text-moss">Yes</b> · {g.pax} seat{g.pax === 1 ? "" : "s"}{g.plus_one ? ` (+ ${g.plus_one})` : ""}</p>}
                    {g.attending === "no" && <p className="text-burgundy/80">Declined with love</p>}
                    {g.message && <p className="italic text-ink/55 truncate" title={g.message}>“{g.message}”</p>}
                    {s === "needs_review" && (
                      <div className="flex gap-2 mt-1">
                        <button className="label !text-[9px] text-moss" onClick={() => void save({ ...g, approved: true })}>approve</button>
                        <button className="label !text-[9px] text-ink/50 hover:text-burgundy" onClick={() => void save({ ...g, approved: false, attending: "no", pax: 0 })}>decline</button>
                      </div>
                    )}
                  </td>
                  <td className="px-1"><button onClick={() => confirm(`Remove ${g.name}${g.code ? ` and retire code ${cleanCode(g.code)}` : ""}?`) && del(g.id)} className="text-ink/30 hover:text-burgundy px-2 py-2">✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!ledger.length && (
            <div className="py-14 text-center text-ink/40 font-serif text-2xl italic">
              {rows.length ? "Nothing in this view — try “all”." : "No codes yet — press “Generate codes” and paste your list. ✦"}
            </div>
          )}
        </div>
        {!!ledger.length && (
          <div className="flex flex-wrap gap-2 items-center justify-between mt-5 pt-4 border-t border-ink/10">
            <span className="text-xs text-ink/50">{ledger.length} row{ledger.length === 1 ? "" : "s"} shown · answered rows also live on the Guests &amp; RSVP list</span>
            <div className="flex gap-2">
              <Btn variant="ghost" onClick={() => bulkCopy(ledger.map((x) => x.g))}>Copy this view</Btn>
              <Btn variant="ghost" onClick={() => { void Promise.all(ledger.filter((x) => !x.g.sent_at).map((x) => save({ ...x.g, sent_at: new Date().toISOString() }))); flash("Marked every unsent link in this view as sent ✓"); }}>Mark all sent</Btn>
            </div>
          </div>
        )}
      </Card>
    </>
  );
}
