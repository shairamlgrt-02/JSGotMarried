"use client";
import { useEffect, useMemo, useState } from "react";
import { cardFilename, downloadBridesmaidCard, previewDataUrl } from "@/lib/bridesmaid-card";
import { loadCardFonts } from "@/lib/card-draw";
import { uid } from "@/lib/db";
import { useTable } from "@/lib/hooks";
import { BRIDESMAID_STONES, DEFAULT_VERSE, HONOR_STONE, ROLES, STONES, findRole, findStone, inkOf, missionFor, newBridesmaidCard, parseHex, renamed, roleById, roleLines, stoneById, stoneLines, stoneOfRole, type CardContext, type Role, type Stone } from "@/lib/jewels";
import { shortDate } from "@/lib/guests";
import { GEM_CUTS, type BridesmaidCard, type EntourageMember, type GemCut, type WeddingInfo } from "@/lib/types";
import { Btn, Card, EditText, PageHead, Select } from "./ui";

/* ═════════════ BRIDESMAID CARDS ═════════════ */

const NOBODY = /to be announced|tba/i;
/** A bridesmaid whose title says she is the bride's sister-in-law wears Garnet with the Maid and Matron of Honor. */
const SISTER_IN_LAW = /sister[- ]in[- ]law|sister of the groom|groom'?s sister/i;

function contextOf(info?: WeddingInfo): CardContext {
  const g = (info?.groom ?? "").trim(), b = (info?.bride ?? "").trim();
  return {
    bride: b,
    initials: g && b ? `${g[0]} & ${b[0]}`.toUpperCase() : "",
    date: shortDate(info?.date) || "11.11.2026",
  };
}

/** The jewel picker's options: the bridesmaids' jewels, plus "her own jewel" when the card's word isn't one of them. */
function stoneOptions(current: string) {
  const own = findStone(current) ? [] : [{ value: "__own__", label: current.trim() ? `${current.trim()} (her own jewel)` : "Choose a jewel…" }];
  return [...own, ...STONES.map((s) => ({ value: s.id, label: s.name }))];
}

/** The role picker's options: every role, naming the jewel it was written for. */
function roleOptions(currentTitle: string) {
  const own = findRole(currentTitle) ? [] : [{ value: "__own__", label: currentTitle.trim() ? `${currentTitle.trim()} (her own role)` : "Choose a role…" }];
  return [...own, ...ROLES.map((r) => { const s = stoneOfRole(r.id); return { value: r.id, label: s ? `${r.title} — written for ${s.name}` : r.title }; })];
}

type Person = { name: string; role: EntourageMember["role"]; title?: string };

export function BridesmaidCards() {
  const info = useTable("wedding_info").rows[0];
  const cards = useTable("bridesmaid_cards");
  const ent = useTable("entourage");
  const sorted = useMemo(() => [...cards.rows].sort((a, b) => a.order - b.order), [cards.rows]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = sorted.find((c) => c.id === selectedId) ?? sorted[0];
  const ctx = contextOf(info);

  /** The maid and matron of honor and the bridesmaids named in the entourage who have no card yet. */
  const waiting = useMemo(() => {
    const named = new Set(sorted.map((c) => c.name.trim().toLowerCase()));
    const rank = (r: EntourageMember["role"]) => (r === "maid_of_honor" ? 0 : r === "matron_of_honor" ? 1 : 2);
    return ent.rows
      .filter((p) => (p.role === "bridesmaid" || p.role === "maid_of_honor" || p.role === "matron_of_honor") && p.name.trim() && !NOBODY.test(p.name) && !named.has(p.name.trim().toLowerCase()))
      .sort((a, b) => rank(a.role) - rank(b.role) || a.order - b.order);
  }, [ent.rows, sorted]);

  /**
   * New cards. The maid of honor, the matron of honor and the sister-in-law wear Garnet; everyone
   * else takes the next bridesmaid jewel nobody has. Each gets her jewel's own role unless another
   * card already has it, then the first role still free — so no two cards start with the same job.
   */
  const makeCards = (people: Person[]) => {
    const usedStones = new Set(sorted.map((c) => findStone(c.jewel)?.id).filter(Boolean));
    const usedRoles = new Set(sorted.map((c) => findRole(c.role_title)?.id).filter(Boolean));
    const rows: BridesmaidCard[] = [];
    people.forEach((p, i) => {
      const honor = p.role === "maid_of_honor" || p.role === "matron_of_honor" || SISTER_IN_LAW.test(p.title ?? "");
      const stoneId = honor ? HONOR_STONE : BRIDESMAID_STONES.find((id) => !usedStones.has(id)) ?? BRIDESMAID_STONES[i % BRIDESMAID_STONES.length];
      const stone = stoneById(stoneId) ?? STONES[0];
      usedStones.add(stone.id);
      const own = roleById(stone.ownRole);
      const role = (own && !usedRoles.has(own.id) ? own : ROLES.find((r) => !usedRoles.has(r.id))) ?? own ?? ROLES[0];
      usedRoles.add(role.id);
      const kicker = p.role === "maid_of_honor" ? "For my maid of honor" : p.role === "matron_of_honor" ? "For my matron of honor" : "For my bridesmaid";
      rows.push(newBridesmaidCard(uid(), p.name, stone, role, ctx, sorted.length + i + 1, kicker));
    });
    return rows;
  };
  const add = () => { const [row] = makeCards([{ name: "", role: "bridesmaid" }]); cards.save(row); setSelectedId(row.id); };
  const addWaiting = () => {
    const rows = makeCards(waiting.map((p) => ({ name: p.name.trim(), role: p.role, title: p.title })));
    if (rows.length) { cards.save(rows); setSelectedId(rows[0].id); }
  };

  const [bulk, setBulk] = useState<"idle" | "working" | "done">("idle");
  const downloadAll = async () => {
    if (bulk === "working" || !sorted.length) return;
    setBulk("working");
    for (const c of sorted) {
      await downloadBridesmaidCard(c);
      await new Promise((r) => setTimeout(r, 700)); // browsers drop downloads fired back to back
    }
    setBulk("done");
    setTimeout(() => setBulk("idle"), 2500);
  };

  return (
    <>
      <PageHead kicker="Thank you, my Garnet…" title="Bridesmaid cards.">
        {waiting.length > 0 && <Btn variant="ghost" onClick={addWaiting}>Add {waiting.length === 1 ? waiting[0].name.split(/\s+/)[0] : `the ${waiting.length} from the entourage`}</Btn>}
        {sorted.length > 1 && <Btn variant="dark" onClick={downloadAll} disabled={bulk === "working"}>{bulk === "working" ? "Drawing the cards…" : bulk === "done" ? "All saved ✓" : `Download all ${sorted.length} (A4)`}</Btn>}
        <Btn onClick={add}>+ Add a bridesmaid</Btn>
      </PageHead>

      <p className="text-sm text-ink/70 max-w-3xl mb-6">
        One A4 card for each of the girls: <em>thank you for saying yes</em>, in her own jewel and its colour, a line on what that colour says of
        her, <em>“she is far more precious than jewels”</em> (Proverbs 31:10), a note from you, and her role on the day — a title, a motto, her
        mission, the duties and a pro tip. <b>Garnet</b> is for the maid of honor, the matron of honor and your sister-in-law; the four bridesmaids
        wear Turquoise, Citrine, Sapphire or Ruby. Jewels and roles are picked separately, so three Garnets can each have a different job;
        <b>every line is yours to change</b> afterwards. Downloads print at 300 dpi, exactly A4.
      </p>

      {cards.error && (
        <p className="text-sm text-burgundy bg-burgundy/5 border border-burgundy/20 rounded-xl px-4 py-3 mb-6">
          Couldn't reach the cards: <b>{cards.error}</b>. If this is the first time the binder has opened this tab on Supabase, run <code>supabase/schema.sql</code> once more — it adds the <code>bridesmaid_cards</code> table and changes nothing else.
        </p>
      )}

      {sorted.length === 0 ? (
        <Card>
          <p className="py-10 text-center text-ink/40 font-serif text-2xl italic">No cards yet — add your first bridesmaid ✿</p>
          <div className="flex justify-center gap-2 flex-wrap">
            <Btn onClick={add}>+ Add a bridesmaid</Btn>
            {waiting.length > 0 && <Btn variant="ghost" onClick={addWaiting}>Start with the {waiting.length} named in the entourage</Btn>}
          </div>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-6">
            {sorted.map((c) => {
              const on = selected?.id === c.id;
              return (
                <button key={c.id} onClick={() => setSelectedId(c.id)} className={`flex items-center gap-2.5 rounded-full pl-2 pr-4 py-1.5 border transition-colors ${on ? "bg-wine text-lace border-wine" : "bg-paper border-ink/10 hover:border-wine"}`}>
                  <span className="w-6 h-6 rounded-full border border-white/60 shadow-inner" style={{ background: parseHex(c.color) ? c.color : "#6E1F2E" }} />
                  <span className="font-serif text-lg leading-none">{c.name.trim() || "New bridesmaid"}</span>
                  <span className={`label !text-[9px] !tracking-[0.18em] ${on ? "text-lace/70" : "text-ink/50"}`}>{c.jewel || "—"}</span>
                </button>
              );
            })}
          </div>
          {selected && <Editor key={selected.id} card={selected} ctx={ctx} onSave={cards.save} onDelete={() => { cards.del(selected.id); setSelectedId(null); }} />}
        </>
      )}
    </>
  );
}

function Field({ label, hint, children, className = "" }: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="label !text-[10px] text-ink/50">{label}</span>
      {children}
      {hint && <span className="block text-xs text-ink/45 mt-1">{hint}</span>}
    </label>
  );
}

function Editor({ card, ctx, onSave, onDelete }: { card: BridesmaidCard; ctx: CardContext; onSave: (c: BridesmaidCard) => void; onDelete: () => void }) {
  const set = (patch: Partial<BridesmaidCard>) => onSave({ ...card, ...patch });
  const stone: Stone | undefined = findStone(card.jewel);
  const role: Role | undefined = findRole(card.role_title);

  /** Pick a jewel: her colour, cut, greeting and the line under the gem change; the role's mission re-opens with the new jewel if it was untouched. */
  const pickStone = (id: string) => {
    const next = stoneById(id);
    if (!next) return;
    const patch: Partial<BridesmaidCard> = { ...stoneLines(next) };
    // keep a greeting she rewrote, swapping only the jewel's name in it
    if (stone && card.greeting.toLowerCase().includes(stone.name.toLowerCase())) patch.greeting = card.greeting.replace(new RegExp(stone.name, "i"), next.name);
    if (role && card.mission.trim() === missionFor(stone, role)) patch.mission = missionFor(next, role);
    set(patch);
  };
  /** Pick a role: the title, motto, mission (opened by her jewel), duties and tip come from it. */
  const pickRole = (id: string) => {
    const next = roleById(id);
    if (next) set({ ...roleLines(next, stone) });
  };
  const refill = () => {
    if (!stone && !role) return;
    if (!confirm(`Rewrite the card's lines from ${[stone?.name, role?.title].filter(Boolean).join(" and ")}? Your name lines, verse, note and sign-off are kept.`)) return;
    set({ ...(stone ? stoneLines(stone) : {}), ...(role ? roleLines(role, stone) : {}) });
  };

  // the live preview: the real A4 drawing, scaled down — redrawn when any line of the card changes
  const [preview, setPreview] = useState<{ url: string; fits: boolean; scale: number } | null>(null);
  const signature = JSON.stringify(card);
  useEffect(() => {
    let alive = true;
    const snapshot = JSON.parse(signature) as BridesmaidCard;
    const t = setTimeout(async () => {
      await loadCardFonts(['italic 400 30px "Cormorant Garamond"', 'italic 500 31px "Cormorant Garamond"', '60px "Pinyon Script"']);
      if (!alive) return;
      try { setPreview(previewDataUrl(snapshot, 720)); } catch { setPreview(null); }
    }, 120);
    return () => { alive = false; clearTimeout(t); };
  }, [signature]);

  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">("idle");
  const save = async () => {
    if (status === "working") return;
    setStatus("working");
    const ok = await downloadBridesmaidCard(card);
    setStatus(ok ? "done" : "error");
    setTimeout(() => setStatus("idle"), 2500);
  };

  const hexOk = !!parseHex(card.color);
  const swatch = hexOk ? card.color : "#6E1F2E";

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(300px,420px)] gap-6 items-start">
      <div className="space-y-6 min-w-0">
        <Card title="Who she is" action={<Btn variant="danger" onClick={() => { if (confirm(`Delete ${card.name.trim() || "this card"}?`)) onDelete(); }}>Delete</Btn>}>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Her name">
              <EditText value={card.name} placeholder="Ana" onSave={(v) => set(renamed(card, v))} className="font-serif text-2xl" />
            </Field>
            <Field label="Capitals at the very top" hint="“For my maid of honor”, “For my matron of honor”, “For my bridesmaid”…">
              <EditText value={card.kicker} placeholder="For my bridesmaid" onSave={(v) => set({ kicker: v })} className="font-serif text-lg" />
            </Field>
            <Field label="Her jewel" hint="Brings its colour and cut, the greeting and the line on what its colour says of her. Garnet is the honour jewel; the bridesmaids wear the other four.">
              <Select value={stone?.id ?? "__own__"} options={stoneOptions(card.jewel)} onChange={pickStone} className="w-full font-serif text-lg !capitalize" />
            </Field>
            <Field label="Her role" hint="Any role fits any jewel — the mission opens with why you chose her jewel for her.">
              <Select value={role?.id ?? "__own__"} options={roleOptions(card.role_title)} onChange={pickRole} className="w-full font-serif text-lg !normal-case" />
            </Field>
            <Field label="The jewel's name on the card" hint="Any word works — a jewel of your own gets its colour from the swatch beside it.">
              <EditText value={card.jewel} placeholder="Garnet" onSave={(v) => set({ jewel: v })} className="font-serif text-lg" />
            </Field>
            <div className="grid grid-cols-[auto_1fr_auto] gap-3 items-end">
              <Field label="Her colour">
                <span className="flex items-center gap-2 mt-1">
                  <input type="color" value={hexOk ? card.color : "#6E1F2E"} onChange={(e) => set({ color: e.target.value.toUpperCase() })} className="w-11 h-11 rounded-lg border border-ink/10 bg-transparent cursor-pointer" aria-label="Her colour" />
                  <span className="w-11 h-11 rounded-lg border border-ink/10" style={{ background: inkOf(swatch) }} title="As ink — a light jewel is deepened so the words stay readable" />
                </span>
              </Field>
              <Field label="Hex">
                <EditText value={card.color} placeholder="#8E1226" onSave={(v) => set({ color: v.trim().startsWith("#") ? v.trim().toUpperCase() : `#${v.trim().toUpperCase()}` })} className={`font-mono text-sm ${hexOk ? "" : "text-burgundy"}`} />
              </Field>
              <Field label="The cut">
                <Select value={card.cut} options={GEM_CUTS} onChange={(v: GemCut) => set({ cut: v })} />
              </Field>
            </div>
          </div>
        </Card>

        <Card title="The top of the card">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="The greeting (in script)" hint="Her jewel's name inside it is picked out in her colour.">
              <EditText value={card.greeting} placeholder="Thank you, my Garnet" onSave={(v) => set({ greeting: v })} className="font-script text-3xl" />
            </Field>
            <Field label="Capitals under the greeting">
              <EditText value={card.subline} placeholder="for saying yes, Ana" onSave={(v) => set({ subline: v })} className="text-sm" />
            </Field>
            <Field label="What her jewel's colour says of her" hint="One line under the gem, in her colour." className="md:col-span-2">
              <EditText value={card.embodies} placeholder="Deep, warm red — the colour of commitment and of a heart that keeps its word." onSave={(v) => set({ embodies: v })} className="font-serif italic text-lg" />
            </Field>
            <Field label="The verse" hint="Printed under that line — the words in italic, the reference after the dash in small capitals. Leave empty to print none." className="md:col-span-2">
              <EditText value={card.verse ?? ""} placeholder={DEFAULT_VERSE} onSave={(v) => set({ verse: v })} className="font-serif italic text-lg" />
            </Field>
          </div>
        </Card>

        <Card title="Your note to her">
          <EditText value={card.note} multiline rows={9} placeholder={"Dear Ana,\n\nThank you for saying yes…"} onSave={(v) => set({ note: v })} className="font-serif italic text-lg leading-relaxed" />
          <p className="text-xs text-ink/45 mt-2">Each new line starts a new paragraph. If the note runs long the card's type steps down a little to keep everything on the page.</p>
        </Card>

        <Card title="Her role on the day" action={(stone || role) && <Btn variant="ghost" onClick={refill}>Rewrite from {[stone?.name, role ? "the role" : ""].filter(Boolean).join(" & ")}</Btn>}>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Small heading over the role">
              <EditText value={card.role_kicker} placeholder="Her role on the day" onSave={(v) => set({ role_kicker: v })} className="text-sm" />
            </Field>
            <Field label="Her title (printed in capitals)">
              <EditText value={card.role_title} placeholder="Keeper of the Vows & Calm in the Storm" onSave={(v) => set({ role_title: v })} className="font-serif text-lg" />
            </Field>
            <Field label="Her motto (printed in quotes)" className="md:col-span-2">
              <EditText value={card.tagline} placeholder="You hold the words. I hold the nerves. You hold me." onSave={(v) => set({ tagline: v })} className="font-serif italic text-lg" />
            </Field>
            <Field label="Your mission" className="md:col-span-2">
              <EditText value={card.mission} multiline rows={4} onSave={(v) => set({ mission: v })} className="text-sm leading-relaxed" />
            </Field>
            <Field label="The duties" hint="One duty per line — each becomes a bullet." className="md:col-span-2">
              <EditText value={card.duties} multiline rows={4} onSave={(v) => set({ duties: v })} className="text-sm leading-relaxed" />
            </Field>
            <Field label="Pro tip" hint="Leave empty to print none." className="md:col-span-2">
              <EditText value={card.pro_tip} onSave={(v) => set({ pro_tip: v })} className="font-serif italic text-lg" />
            </Field>
          </div>
        </Card>

        <Card title="The sign-off">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="In script">
              <EditText value={card.closing} placeholder={`With all my love, ${ctx.bride || "Shaira"}`} onSave={(v) => set({ closing: v })} className="font-script text-2xl" />
            </Field>
            <Field label="Capitals underneath">
              <EditText value={card.footer} placeholder="J & S · 11.11.2026" onSave={(v) => set({ footer: v })} className="text-sm" />
            </Field>
          </div>
        </Card>
      </div>

      <div className="lg:sticky lg:top-6">
        <Card title="Her card" action={<Btn onClick={save} disabled={status === "working"}>{status === "working" ? "Drawing…" : status === "done" ? "Saved ✓" : status === "error" ? "Try again" : "Download A4 PNG"}</Btn>}>
          {preview?.url ? (
            <img src={preview.url} alt={`Preview of ${card.name || "the"} card`} className="w-full rounded-md shadow-[0_12px_30px_-12px_rgba(0,0,0,.5)] border border-ink/10" />
          ) : (
            <div className="aspect-[2480/3508] rounded-md border-2 border-dashed border-ink/15 grid place-items-center text-ink/40 font-serif italic text-xl">Drawing the preview…</div>
          )}
          <p className="text-xs text-ink/50 mt-3">
            A4 portrait, 2480 × 3508 px (300 dpi) — <b>{cardFilename(card)}</b>. Print on a heavy ivory stock, or send it as it is.
          </p>
          {preview && preview.scale < 1 && (
            <p className={`text-xs mt-2 ${preview.fits ? "text-mocha" : "text-burgundy"}`}>
              {preview.fits
                ? `Her words run long, so the type stepped down to ${Math.round(preview.scale * 100)}% to keep everything on the page. Trim the note or the duties for full size.`
                : "Even at the smallest size this card runs past the page — please trim the note, the mission or the duties."}
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
