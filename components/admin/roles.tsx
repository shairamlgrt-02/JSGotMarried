"use client";
import { useEffect, useMemo, useState } from "react";
import { useTable } from "@/lib/hooks";
import { dayRoleBrief, dayRoleIcon, dayRoleLabel, dayRoleIdFor, groupGuestsByRole, DAY_ROLE_IDS, DAY_ROLES } from "@/lib/roles";
import { dayRoleCategoryId } from "@/lib/messaging";
import { parseGuestTags, type Guest } from "@/lib/types";
import { Btn, Card, PageHead, Tag, download, toCsv } from "./ui";
import { whoIsItFor } from "@/lib/guests";

/**
 * Guest Roles — the day-of jobs the couple entrust to their own guests, in one place.
 *
 * A household carries exactly one role (the coffee & tea station, the souvenir table, the
 * ushers…), stored on the guest row itself — so it follows the household everywhere: it shows in
 * the messaging module as its own recipient group ("📨 Message this team" below jumps straight
 * there), and it rides along in the CSV export. The suggested roles are the shared dictionary in
 * lib/roles.ts; typing your own words makes a role just the same.
 *
 * Save errors (a Supabase project that hasn't re-run schema.sql for the `role` / `role_note`
 * columns) surface exactly like the binder's other tabs: the row restores and the message shows.
 */
export function RolesTab({ go }: { go: (tab: string) => void }) {
  const { rows, save, error } = useTable("guests", false);
  const [q, setQ] = useState("");
  const [byRole, setByRole] = useState(false);
  const [copied, setCopied] = useState("");

  /** Households with people actually coming (a role for a "no" can wait), searched. */
  const assignable = useMemo(() => {
    const query = q.trim().toLowerCase();
    return rows
      .filter((g) => g.attending !== "no")
      .filter((g) => {
        if (!query) return true;
        const role = dayRoleLabel(g.role).toLowerCase();
        const tags = parseGuestTags(g.tags).join(" ");
        return `${whoIsItFor(g)} ${g.name ?? ""} ${g.greet ?? ""} ${g.phone ?? ""} ${g.code ?? ""} ${role} ${g.role_note ?? ""} ${tags}`.toLowerCase().includes(query);
      })
      .sort((a, b) => (dayRoleLabel(a.role) || "zzz").localeCompare(dayRoleLabel(b.role) || "zzz") || whoIsItFor(a).localeCompare(whoIsItFor(b)));
  }, [rows, q]);

  const groups = useMemo(() => groupGuestsByRole(assignable), [assignable]);
  const assigned = rows.filter((g) => g.attending !== "no" && (g.role || "").trim()).length;
  const active = rows.filter((g) => g.attending !== "no").length;

  const flash = (msg: string) => { setCopied(msg); setTimeout(() => setCopied(""), 2500); };

  /** The whole roster as tab-separated text — select nothing, paste into their sheet. */
  const copyRoster = async () => {
    const lines = [
      ["Role", "Household", "Phone", "Attending", "Note"].join("\t"),
      ...groupGuestsByRole(rows.filter((g) => g.attending !== "no")).flatMap(({ role, households }) =>
        households.map((g) => [dayRoleLabel(role), whoIsItFor(g) || g.name || "", g.phone || "", g.attending, g.role_note || ""].join("\t")),
      ),
    ].join("\n");
    try { await navigator.clipboard.writeText(lines); flash("Roster copied — paste straight into your sheet ✓"); }
    catch { flash("Couldn't reach the clipboard — use Export CSV instead"); }
  };

  const exportCsv = () => {
    const rowsOut = rows
      .filter((g) => g.attending !== "no" && (g.role || "").trim())
      .map((g) => ({ role: dayRoleLabel(g.role), household: whoIsItFor(g) || g.name || "", phone: g.phone || "", attending: g.attending, note: g.role_note || "", code: g.code || "" }));
    download("guest-roles.csv", toCsv(rowsOut));
  };

  const messageTeam = (roleId: string) => {
    try { localStorage.setItem("jsos:compose_category", dayRoleCategoryId(roleId)); } catch {}
    go("messaging-compose");
  };

  const copyTeam = async (roleId: string, households: Guest[]) => {
    const lines = households.map((g) => `${whoIsItFor(g) || g.name || ""}${g.phone ? ` — ${g.phone}` : ""}`).join("\n");
    try { await navigator.clipboard.writeText(`${dayRoleLabel(roleId)}\n${lines}`); flash("Team list copied ✓"); }
    catch { flash("Couldn't reach the clipboard"); }
  };

  return (
    <>
      <PageHead kicker={`${assigned} of ${active} households have a role`} title="Guest roles.">
        <Btn variant="ghost" onClick={copyRoster}>Copy roster (paste into Excel)</Btn>
        <Btn variant="ghost" onClick={exportCsv}>Export CSV</Btn>
        <Btn variant={byRole ? "gold" : "ghost"} onClick={() => setByRole(!byRole)}>{byRole ? "By role" : "By household"}</Btn>
      </PageHead>

      {error && <p className="mb-4 text-sm text-burgundy">{error}</p>}
      {copied && <p className="mb-4 text-sm text-moss">{copied}</p>}

      <Card className="mb-5">
        <p className="text-sm text-ink/70">
          Give each household the small job you&apos;re entrusting to them for the day — the coffee &amp; tea station, the souvenir
          table, the ushers. Pick a <b>suggested role</b> from the list or type your own words. Every role becomes a group in{" "}
          <b>📨 Compose</b> (and the <i>Day-of Role</i> ready-made template fills the <code className="rounded bg-ink/10 px-1">{`{role}`}</code> in),
          so briefing a team is one message to everyone serving with them.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1.5 mt-4 text-xs text-ink/60">
          {DAY_ROLE_IDS.map((id) => (
            <p key={id}><span className="text-wine">{DAY_ROLES[id].icon} {DAY_ROLES[id].label}</span> — {DAY_ROLES[id].brief}</p>
          ))}
        </div>
      </Card>

      {!byRole ? (
        <Card>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search a household, a code or a role…"
            className="w-full bg-white/60 rounded-full px-5 py-3 outline-none border border-ink/10 focus:border-wine mb-4"
          />
          <datalist id="day-role-options">
            {DAY_ROLE_IDS.map((id) => <option key={id} value={DAY_ROLES[id].label} />)}
          </datalist>
          <ul className="divide-y divide-ink/10">
            {assignable.map((g) => (
              <li key={g.id} className="py-2.5 flex flex-wrap md:flex-nowrap items-center gap-2 md:gap-3">
                <div className="min-w-[180px] flex-1">
                  <div className="font-serif text-lg leading-tight">{whoIsItFor(g) || g.name || "Guest"}</div>
                  <div className="text-xs text-ink/50 flex gap-2 items-center">
                    {g.attending === "yes" ? <Tag>yes</Tag> : <Tag>pending</Tag>}
                    {g.phone && <span>📱 {g.phone}</span>}
                    {g.code && <span>{g.code}</span>}
                  </div>
                </div>
                <div className="w-full md:w-64">
                  <RoleInput value={dayRoleLabel(g.role)} onSave={(v) => save({ ...g, role: dayRoleIdFor(v) })} />
                </div>
                <div className="w-full md:w-56">
                  <input
                    defaultValue={g.role_note || ""}
                    placeholder="how they'll serve it…"
                    onBlur={(e) => { const v = e.target.value.trim(); if (v !== (g.role_note || "")) save({ ...g, role_note: v }); }}
                    className="w-full bg-transparent rounded-md px-2 py-1.5 text-sm outline-none border border-transparent hover:border-ink/10 focus:border-wine focus:bg-white/60"
                  />
                </div>
              </li>
            ))}
            {!assignable.length && <li className="py-10 text-center text-ink/40 font-serif text-2xl italic">No households here yet — send the invites first ✦</li>}
          </ul>
        </Card>
      ) : (
        <div className="space-y-4">
          {groups.map(({ role, households }) => (
            <Card key={role}>
              <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                <div>
                  <h3 className="font-serif text-xl">{dayRoleIcon(role)} {dayRoleLabel(role)} <span className="text-sm text-ink/40">· {households.length}</span></h3>
                  {dayRoleBrief(role) && <p className="text-xs text-ink/50 mt-0.5">{dayRoleBrief(role)}</p>}
                </div>
                <div className="flex gap-2">
                  <Btn variant="ghost" onClick={() => copyTeam(role, households)}>Copy list</Btn>
                  <Btn onClick={() => messageTeam(role)}>📨 Message this team</Btn>
                </div>
              </div>
              <ul className="divide-y divide-ink/10">
                {households.map((g) => (
                  <li key={g.id} className="py-2 flex flex-wrap gap-2 items-center text-sm">
                    <span className="font-medium">{whoIsItFor(g) || g.name || "Guest"}</span>
                    {g.phone && <span className="text-ink/50">📱 {g.phone}</span>}
                    {g.role_note && <span className="text-ink/60 italic">— {g.role_note}</span>}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
          {!groups.length && (
            <Card className="text-center py-12 text-ink/40 font-serif text-2xl italic">No roles assigned yet — switch to “By household” to start ✦</Card>
          )}
        </div>
      )}
    </>
  );
}

/** The role picker: a text input with the suggested roles offered — presets, or your own words. */
function RoleInput({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  const commit = () => { if (v !== value) onSave(v); };
  return (
    <input
      list="day-role-options"
      value={v}
      placeholder="— no role yet —"
      onChange={(e) => setV(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
      className="w-full bg-transparent rounded-md px-2 py-1.5 outline-none border border-transparent hover:border-ink/10 focus:border-wine focus:bg-white/60"
    />
  );
}
