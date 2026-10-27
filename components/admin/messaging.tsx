"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTable } from "@/lib/hooks";
import {
  MESSAGE_CATEGORIES,
  MESSAGE_STATUS,
  MERGE_TAGS,
  PRESET_TEMPLATES,
  applyMergeTags,
  attachTrackingParam,
  genMessageId,
  messageCategoryFor,
  messageTrackingInfo,
  recipientTrackedLink,
  resolveRecipients,
  templateUsesInviteCode,
  type MessageCategory,
  type MessageStage,
  type Recipient,
} from "@/lib/messaging";
import {
  cleanCode,
  formatDateTimeStamp,
  genCode,
  inviteHref,
  inviteLink,
  inviteMessage,
  normalizeLinkSearch,
  plusOneLabel,
  relativeTimeAgo,
  whatsappHref,
  whoIsItFor,
  type InviteText,
} from "@/lib/guests";
import type { Guest, MessageLog, MessageTemplate } from "@/lib/types";
import { Btn, Card, EditText, PageHead, Stat, Tag, download, toCsv } from "./ui";
import { refreshTables, uid } from "@/lib/db";

/** Clipboard helper with fallback for older/in-app browsers (matches Invite Codes). */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch { /* fallback below */ }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;top:0;left:-9999px";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

const TONE: Record<string, string> = {
  moss: "bg-moss/15 text-moss",
  wine: "bg-wine/10 text-wine",
  ink: "bg-ink/10 text-ink/60",
  amethyst: "bg-amethyst/15 text-amethyst",
  burgundy: "bg-burgundy/15 text-burgundy",
};

function MessageStatusTag({ s, opens = 0 }: { s: MessageStage; opens?: number }) {
  const { label, hint, tone } = MESSAGE_STATUS[s];
  return (
    <span title={hint} className={`label !text-[10px] !tracking-[0.15em] px-2.5 py-1 rounded-full whitespace-nowrap ${TONE[tone]}`}>
      {label}{s === "opened" && opens > 1 ? ` · ${opens}×` : ""}
    </span>
  );
}

const STAGE_ORDER: MessageStage[] = ["opened", "to_send", "sent", "responded", "declined"];
const day = (iso?: string | null) => formatDateTimeStamp(iso);

/** Derive a clean fallback title for a custom (non-template) message so Tracker stays readable. */
function deriveCampaignLabel(label: string, body: string): string {
  if (label.trim()) return label.trim();
  const firstLine = body
    .split(/\r?\n/)
    .map((l) => l.replace(/\{[^}]+\}/g, "").replace(/\*/g, "").trim())
    .find(Boolean);
  if (!firstLine) return "Custom Message";
  return firstLine.length > 42 ? `${firstLine.slice(0, 40).trim()}…` : firstLine;
}

/**
 * The recipient picker, used by both the template editor and Compose.
 *
 * It is one list on purpose: the guest tags come from the same dictionary the binder's Tags column
 * edits (`GUEST_TAGS`), so a group never exists in one place and not the other. Tag groups come
 * first, then the RSVP-status buckets, the ring bearer and flower girl, the vendors, and — last,
 * because it is everyone — All Wedding Guests.
 */
function GroupPicker({ value, onChange }: { value: string[]; onChange: (next: string[]) => void }) {
  /** chip id → the id actually stored for it, so a legacy tick can be cleared again */
  const stored = new Map<string, string>();
  const extras: MessageCategory[] = [];
  for (const raw of value) {
    const cat = messageCategoryFor(raw);
    if (!cat) continue;
    if (!stored.has(cat.id)) stored.set(cat.id, raw);
    if (!MESSAGE_CATEGORIES.some((c) => c.id === cat.id) && !extras.some((c) => c.id === cat.id)) extras.push(cat);
  }
  const toggle = (id: string) => {
    const held = stored.get(id);
    onChange(held === undefined ? [...value, id] : value.filter((v) => v !== held));
  };
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
      {[...MESSAGE_CATEGORIES, ...extras].map((cat) => {
        const on = stored.has(cat.id);
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => toggle(cat.id)}
            className={`px-3 py-2 text-sm rounded-lg border transition-all text-left ${on ? "bg-wine text-lace border-wine" : "bg-white border-taupe/30 hover:border-wine/50"}`}
          >
            <span className="mr-1">{cat.icon}</span>
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}

/* ═══════════ READY-MADE TEMPLATES ═══════════ */
function PresetTemplates({
  templates,
  onAdd,
  onUseInCompose,
}: {
  templates: MessageTemplate[];
  onAdd: (t: MessageTemplate) => void;
  onUseInCompose?: (p: (typeof PRESET_TEMPLATES)[number]) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Card className="border-wine/20">
      <button type="button" onClick={() => setOpen(!open)} className="w-full flex items-center justify-between gap-4 text-left">
        <div>
          <h3 className="font-serif text-xl">Ready-made templates ✦</h3>
          <p className="text-sm text-ink/60 mt-1">
            Written for you — {PRESET_TEMPLATES.length} letters: the RSVP reminders &amp; final calls, thank-yous for the wedding team and the guests, deadline &amp; livestream notes, and the day-of role briefing. Use straight away or save to your templates.
          </p>
        </div>
        <span className="text-2xl text-wine shrink-0">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="grid gap-3 mt-5">
          {PRESET_TEMPLATES.map((p) => {
            const added = templates.some((t) => t.name === p.name);
            return (
              <div key={p.id} className="border border-taupe/20 rounded-xl p-4 bg-white/50">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{p.name}</span>
                      <Tag>{p.label}</Tag>
                    </div>
                    <p className="text-xs text-ink/60">{p.hint}</p>
                    <p className="text-xs text-ink/40 mt-1">
                      Goes to: {p.categories.map((id) => messageCategoryFor(id)?.label).filter(Boolean).join(", ") || "whoever you pick when you send it"}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {onUseInCompose && (
                      <Btn variant="gold" onClick={() => { onUseInCompose(p); setOpen(false); }}>
                        Use in Compose
                      </Btn>
                    )}
                    <Btn
                      variant={added ? "ghost" : onUseInCompose ? "ghost" : "gold"}
                      disabled={added}
                      onClick={() =>
                        onAdd({
                          id: uid(),
                          name: p.name,
                          label: p.label,
                          body: p.body,
                          categories: p.categories.join(","),
                          created_at: new Date().toISOString(),
                        })
                      }
                    >
                      {added ? "Saved ✓" : "Save to templates"}
                    </Btn>
                  </div>
                </div>
                <details className="mt-3 text-xs">
                  <summary className="cursor-pointer text-ink/60 hover:text-ink">Preview the message</summary>
                  <div className="mt-2 p-3 bg-oat/50 rounded font-mono whitespace-pre-wrap">{p.body}</div>
                </details>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

/* ═══════════ TEMPLATES TAB ═══════════ */
export function TemplatesTab({ go }: { go?: (tab: string) => void }) {
  const { rows: templates, save, del } = useTable("message_templates");
  const [editing, setEditing] = useState<MessageTemplate | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleNew = () => {
    setEditing({ id: uid(), name: "", label: "", body: "", categories: "", created_at: new Date().toISOString() });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!editing) return;
    save(editing);
    setShowForm(false);
    setEditing(null);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this template?")) {
      del(id);
    }
  };

  const openInCompose = (t: MessageTemplate) => {
    try { localStorage.setItem("jsos:compose_template", t.id); } catch {}
    go?.("messaging-compose");
  };

  return (
    <div className="space-y-6">
      <PageHead kicker="Reusable letters · merge tags" title="Message templates.">
        <Btn onClick={handleNew}>+ New template</Btn>
        {go && <Btn variant="ghost" onClick={() => go("messaging-compose")}>📨 Compose →</Btn>}
        {go && <Btn variant="ghost" onClick={() => go("messaging-tracker")}>📊 Tracker →</Btn>}
      </PageHead>

      <PresetTemplates templates={templates} onAdd={save} />

      {showForm && editing && (
        <TemplateForm
          template={editing}
          onChange={setEditing}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      <div className="grid gap-4">
        {templates.map((t) => (
          <Card key={t.id} className="p-5">
            <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-serif text-xl">{t.name}</h3>
                  {t.label && <Tag>{t.label}</Tag>}
                </div>
                <div className="text-xs text-ink/50">
                  Sends to: {t.categories.split(",").map((id) => messageCategoryFor(id)?.label).filter(Boolean).join(", ") || "Whoever you pick when you send it"}
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {go && <Btn onClick={() => openInCompose(t)}>Compose &amp; send →</Btn>}
                <Btn variant="ghost" onClick={() => { setEditing(t); setShowForm(true); }}>Edit</Btn>
                <Btn variant="ghost" onClick={() => handleDelete(t.id)}>Delete</Btn>
              </div>
            </div>
            <div className="bg-oat/50 rounded-lg p-3 text-sm whitespace-pre-wrap font-mono">{t.body}</div>
          </Card>
        ))}
        {templates.length === 0 && !showForm && (
          <div className="text-center py-12 text-ink/40 font-serif text-2xl italic">
            No saved templates yet — add a ready-made letter above or create your first one ✦
          </div>
        )}
      </div>
    </div>
  );
}

function TemplateForm({
  template,
  onChange,
  onSave,
  onCancel,
}: {
  template: MessageTemplate;
  onChange: (t: MessageTemplate) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [selectedCats, setSelectedCats] = useState<string[]>(template.categories.split(",").filter(Boolean));

  const setCats = (next: string[]) => {
    setSelectedCats(next);
    onChange({ ...template, categories: next.join(",") });
  };

  const insertTag = (tag: string) => {
    onChange({ ...template, body: template.body + tag });
  };

  return (
    <Card className="p-6 space-y-5">
      <div>
        <label className="block text-sm font-medium mb-2">Template Name</label>
        <input
          type="text"
          value={template.name}
          onChange={(e) => onChange({ ...template, name: e.target.value })}
          placeholder="e.g., Save the Date Reminder"
          className="w-full px-4 py-2 border border-taupe/30 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-wine/40"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Label (optional)</label>
        <input
          type="text"
          value={template.label}
          onChange={(e) => onChange({ ...template, label: e.target.value })}
          placeholder="e.g., Reminder, Thank You, Save the Date"
          className="w-full px-4 py-2 border border-taupe/30 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-wine/40"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-3">Who it goes to</label>
        <GroupPicker value={selectedCats} onChange={setCats} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Message Body</label>
        <textarea
          value={template.body}
          onChange={(e) => onChange({ ...template, body: e.target.value })}
          placeholder="Write your message here. Use merge tags to personalize..."
          rows={8}
          className="w-full px-4 py-3 border border-taupe/30 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-wine/40 font-mono text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-3">Merge Tags (click to insert)</label>
        <div className="flex flex-wrap gap-2">
          {MERGE_TAGS.map((tag) => (
            <button
              key={tag.tag}
              type="button"
              onClick={() => insertTag(tag.tag)}
              title={tag.hint}
              className="px-3 py-1.5 text-xs bg-oat hover:bg-wine/10 border border-taupe/30 rounded-full transition-colors"
            >
              {tag.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Btn onClick={onSave}>Save Template</Btn>
        <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
      </div>
    </Card>
  );
}

/* ═══════════ COMPOSE TAB ═══════════ */
export function ComposeTab({ go }: { go?: (tab: string) => void }) {
  const { rows: templates, save: saveTemplate } = useTable("message_templates");
  const { rows: messages, save: saveMessage, error: msgError } = useTable("messages");
  const { rows: entourage } = useTable("entourage");
  const { rows: vendors, save: saveVendor } = useTable("vendors");
  const { rows: guests, save: saveGuest } = useTable("guests", false);
  const { rows: infoRows } = useTable("wedding_info");
  const info = infoRows[0];
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [customCampaignId, setCustomCampaignId] = useState<string>(() => `custom_${genMessageId()}`);
  const [campaignLabel, setCampaignLabel] = useState("");
  const [customBody, setCustomBody] = useState("");
  const [filter, setFilter] = useState<"all" | MessageStage>("all");
  const [q, setQ] = useState("");
  const [flashMsg, setFlashMsg] = useState("");
  const [copiedKey, setCopiedKey] = useState("");
  const ledgerRef = useRef<HTMLDivElement>(null);

  /** Stable candidate message tracking ID per `(campaignKey:recipientId)` before first save. */
  const candidateIdsRef = useRef<Map<string, string>>(new Map());

  const flash = (t: string) => {
    setFlashMsg(t);
    setTimeout(() => setFlashMsg(""), 5000);
  };
  const markCopied = (key: string) => {
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(""), 2000);
  };

  // Preselect group or template when navigating from Guests & RSVP, Guest Roles, Templates, or Tracker
  useEffect(() => {
    const preCat = localStorage.getItem("jsos:compose_category");
    if (preCat) {
      setSelectedCats([preCat]);
      localStorage.removeItem("jsos:compose_category");
    }
  }, []);

  useEffect(() => {
    if (!templates.length) return;
    const preTpl = localStorage.getItem("jsos:compose_template");
    if (!preTpl) return;
    const hit = templates.find((t) => t.id === preTpl);
    localStorage.removeItem("jsos:compose_template");
    if (hit) {
      setSelectedTemplate(hit);
      setCampaignLabel(hit.name);
      setCustomBody(hit.body);
      const cats = hit.categories.split(",").filter(Boolean);
      if (cats.length) setSelectedCats(cats);
    }
  }, [templates]);

  const activeCampaignId = selectedTemplate ? selectedTemplate.id : customCampaignId;
  const effectiveLabel = selectedTemplate ? selectedTemplate.name : deriveCampaignLabel(campaignLabel, customBody);

  const handleSelectTemplate = (t: MessageTemplate) => {
    if (selectedTemplate?.id === t.id) {
      // Clicking again switches cleanly back to a custom message while keeping text editable
      setSelectedTemplate(null);
      setCustomCampaignId(`custom_${genMessageId()}`);
      return;
    }
    setSelectedTemplate(t);
    setCampaignLabel(t.name);
    setCustomBody(t.body);
    const cats = t.categories.split(",").filter(Boolean);
    if (cats.length) setSelectedCats(cats);
  };

  const handleUsePreset = (p: (typeof PRESET_TEMPLATES)[number]) => {
    const savedCopy = templates.find((t) => t.name === p.name);
    if (savedCopy) {
      handleSelectTemplate(savedCopy);
      return;
    }
    setSelectedTemplate({
      id: p.id,
      name: p.name,
      label: p.label,
      body: p.body,
      categories: p.categories.join(","),
    });
    setCampaignLabel(p.name);
    setCustomBody(p.body);
    if (p.categories.length) setSelectedCats(p.categories);
  };

  const startFreshCustomMessage = () => {
    setSelectedTemplate(null);
    setCustomCampaignId(`custom_${genMessageId()}`);
    setCampaignLabel("");
    setCustomBody("");
  };

  /** Live recipients resolved directly from selected groups — always up to date when tags/groups change. */
  const recipients = useMemo<Recipient[]>(() => {
    if (!info || selectedCats.length === 0) return [];
    return resolveRecipients(selectedCats, entourage, vendors, guests, info);
  }, [selectedCats, entourage, vendors, guests, info]);

  const guestById = useMemo(() => {
    const m = new Map<string, Guest>();
    for (const g of guests) m.set(g.id, g);
    return m;
  }, [guests]);

  /**
   * Merge live group recipients with anyone already logged for this campaign so a `Pending RSVP`
   * guest who confirms `Yes` stays visible right in the `responded` column instead of disappearing.
   */
  const campaignRecipients = useMemo<Recipient[]>(() => {
    const map = new Map<string, Recipient>();
    for (const r of recipients) map.set(r.id, r);
    const matchingLogs = messages.filter((m) =>
      selectedTemplate
        ? m.template_id === selectedTemplate.id
        : m.template_id === customCampaignId || (Boolean(customBody.trim()) && m.original_body.trim() === customBody.trim()),
    );
    for (const log of matchingLogs) {
      if (map.has(log.recipient_id)) continue;
      const gId = log.recipient_id.startsWith("gst_") ? log.recipient_id.slice(4) : undefined;
      const g = gId ? guestById.get(gId) : undefined;
      const code = cleanCode(g?.code);
      map.set(log.recipient_id, {
        id: log.recipient_id,
        guestId: g?.id,
        name: g ? g.greet || g.name || log.recipient_name : log.recipient_name,
        greetName: (g ? g.greet || g.name || log.recipient_name : log.recipient_name).split(" ")[0],
        phone: g ? g.phone : log.recipient_phone,
        role: log.category,
        category: log.category,
        code,
        inviteLink: code ? `${origin}/${code}` : "",
        pax: g?.pax,
        plusOne: g?.plus_one,
        rsvpStatus: g ? (g.attending === "yes" ? "Confirmed ✓" : g.attending === "no" ? "Declined ✗" : "Pending ⏳") : undefined,
        attending: g?.attending,
        viewedAt: g?.viewed_at ?? null,
        sentAt: g?.sent_at ?? null,
      });
    }
    return Array.from(map.values());
  }, [recipients, messages, selectedTemplate, customCampaignId, customBody, guestById, origin]);

  /** Find an already-logged message for `(recipient, active campaign/body)` so status shows right on the row. */
  const findExistingLog = (r: Recipient): MessageLog | undefined => {
    const matches = messages.filter((m) => {
      if (m.recipient_id !== r.id) return false;
      if (selectedTemplate) return m.template_id === selectedTemplate.id;
      if (m.template_id === customCampaignId) return true;
      return Boolean(customBody.trim()) && m.original_body.trim() === customBody.trim();
    });
    if (!matches.length) return undefined;
    return matches.sort((a, b) => (b.sent_at ?? b.created_at ?? "").localeCompare(a.sent_at ?? a.created_at ?? ""))[0];
  };

  /** Stable message ID used in `?m=…` links BEFORE and AFTER saving, so Preview, Copy and WhatsApp agree on one ID. */
  const getTrackingId = (r: Recipient, existing?: MessageLog): string => {
    if (existing?.id) return existing.id;
    const key = `${activeCampaignId}:${r.id}`;
    let id = candidateIdsRef.current.get(key);
    if (!id) {
      id = genMessageId();
      candidateIdsRef.current.set(key, id);
    }
    return id;
  };

  const usesCode = useMemo(() => templateUsesInviteCode(customBody), [customBody]);
  const prefersRsvpJump = useMemo(() => /\{rsvp_link\}/.test(customBody), [customBody]);

  /** Issue an invitation code on the spot if a guest row does not have one yet. */
  const ensureGuestCode = (r: Recipient, markSentOnGuest = false): { recipient: Recipient; issued?: string } => {
    if (!r.guestId) return { recipient: r };
    const g = guestById.get(r.guestId);
    if (!g) return { recipient: r };
    const existingCode = cleanCode(g.code);
    const nowIso = new Date().toISOString();
    if (existingCode) {
      if (markSentOnGuest && !g.sent_at) {
        void saveGuest({ ...g, sent_at: nowIso });
      }
      return { recipient: r };
    }
    if (!usesCode) {
      if (markSentOnGuest && !g.sent_at) {
        void saveGuest({ ...g, sent_at: nowIso });
      }
      return { recipient: r };
    }
    const newCode = genCode(guests.map((x) => x.code || ""));
    void saveGuest({ ...g, code: newCode, sent_at: markSentOnGuest ? g.sent_at ?? nowIso : g.sent_at });
    const updated: Recipient = {
      ...r,
      code: newCode,
      inviteLink: `${origin}/${newCode}`,
    };
    return { recipient: updated, issued: newCode };
  };

  const buildAndRecordSent = (
    r: Recipient,
    existing?: MessageLog,
  ): { log: MessageLog; body: string; link: string; issued?: string } | null => {
    if (!info) return null;
    const { recipient: ready, issued } = ensureGuestCode(r, true);
    const msgId = getTrackingId(ready, existing);
    const nowIso = new Date().toISOString();
    const resolvedBody = customBody.trim()
      ? applyMergeTags(customBody, ready, info, msgId, origin)
      : recipientTrackedLink(ready, msgId, origin, true);
    const link = recipientTrackedLink(ready, msgId, origin, prefersRsvpJump);
    const log: MessageLog = {
      id: msgId,
      template_id: activeCampaignId,
      template_name: effectiveLabel,
      original_body: customBody,
      body: resolvedBody,
      recipient_id: ready.id,
      recipient_name: ready.name,
      recipient_phone: ready.phone,
      category: ready.role || ready.category,
      sent: true,
      responded: existing?.responded ?? false,
      link_opens: existing?.link_opens ?? 0,
      opened_at: existing?.opened_at ?? null,
      sent_at: existing?.sent && existing?.sent_at ? existing.sent_at : nowIso,
      created_at: existing?.created_at ?? nowIso,
    };
    void saveMessage(log);
    return { log, body: resolvedBody, link, issued };
  };

  /** Copy full personalized message + mark sent (just like Invite Codes). */
  const handleCopyMessage = async (r: Recipient, existing?: MessageLog) => {
    if (!customBody.trim()) return flash("Write a message or choose a template above first.");
    const built = buildAndRecordSent(r, existing);
    if (!built) return;
    if (!(await copyText(built.body))) {
      return flash("Your browser blocked the clipboard — expand Preview message below and copy it.");
    }
    markCopied(`${r.id}:msg`);
    flash(
      `Copied message for ${r.name} ✓ Marked as sent — opens track automatically when they tap their link.` +
        (built.issued ? ` (Issued code ${built.issued})` : ""),
    );
  };

  /** Copy just the tracked personal link + mark sent (just like Invite Codes). */
  const handleCopyLink = async (r: Recipient, existing?: MessageLog) => {
    const { recipient: ready, issued } = ensureGuestCode(r, true);
    const msgId = getTrackingId(ready, existing);
    const link = recipientTrackedLink(ready, msgId, origin, prefersRsvpJump);
    if (!link) return flash("No link available yet.");
    if (!(await copyText(link))) {
      return flash("Your browser blocked the clipboard — copy the link from Preview message.");
    }
    buildAndRecordSent(ready, existing);
    markCopied(`${r.id}:link`);
    flash(`Copied personal tracked link for ${r.name} ✓ Marked as sent.` + (issued ? ` (Issued code ${issued})` : ""));
  };

  /** Click handler on the WhatsApp `send ↗` anchor: records sent & opens WhatsApp cleanly. */
  const handleWhatsAppClick = (e: React.MouseEvent<HTMLAnchorElement>, r: Recipient, existing?: MessageLog) => {
    if (!customBody.trim()) {
      e.preventDefault();
      flash("Write a message or select a template above before sending.");
      return;
    }
    // If guest lacks an invite code and message uses one, issue the code synchronously so the link in WhatsApp works right away
    if (r.guestId && !cleanCode(r.code) && usesCode) {
      e.preventDefault();
      const built = buildAndRecordSent(r, existing);
      if (!built) return;
      window.open(whatsappHref(r.phone, built.body), "_blank", "noopener,noreferrer");
      flash(`Issued code ${built.issued} & opened WhatsApp for ${r.name} ✓ Marked as sent.`);
      return;
    }
    const built = buildAndRecordSent(r, existing);
    if (built) {
      flash(`Opened WhatsApp for ${r.name} ✓ Marked as sent.`);
    }
  };

  /** Toggle `sent` / undo (Invite Codes style). */
  const handleToggleSent = (r: Recipient, existing?: MessageLog) => {
    if (existing?.sent) {
      void saveMessage({ ...existing, sent: false, sent_at: null });
      return;
    }
    const built = buildAndRecordSent(r, existing);
    if (built) flash(`Marked ${r.name} as sent ✓`);
  };

  /** Reversible `responded` toggle. */
  const handleToggleResponded = (r: Recipient, existing?: MessageLog) => {
    if (existing) {
      void saveMessage({ ...existing, responded: !existing.responded });
      return;
    }
    if (!info) return;
    const msgId = getTrackingId(r);
    const nowIso = new Date().toISOString();
    void saveMessage({
      id: msgId,
      template_id: activeCampaignId,
      template_name: effectiveLabel,
      original_body: customBody,
      body: customBody.trim() ? applyMergeTags(customBody, r, info, msgId, origin) : "",
      recipient_id: r.id,
      recipient_name: r.name,
      recipient_phone: r.phone,
      category: r.role || r.category,
      sent: true,
      responded: true,
      link_opens: 0,
      opened_at: null,
      sent_at: nowIso,
      created_at: nowIso,
    });
  };

  const handleSavePhone = (r: Recipient, nextPhone: string) => {
    if (r.guestId) {
      const g = guestById.get(r.guestId);
      if (g) void saveGuest({ ...g, phone: nextPhone });
    } else if (r.vendorId) {
      const v = vendors.find((x) => x.id === r.vendorId);
      if (v) void saveVendor({ ...v, contact: nextPhone });
    }
  };

  const issueMissingCodes = async (targets: Recipient[]) => {
    const taken = new Set(guests.map((g) => cleanCode(g.code || "")));
    const updates: Guest[] = [];
    for (const r of targets) {
      if (!r.guestId) continue;
      const g = guestById.get(r.guestId);
      if (!g || cleanCode(g.code)) continue;
      const code = genCode(taken);
      taken.add(code);
      updates.push({ ...g, code });
    }
    if (updates.length) {
      await saveGuest(updates);
      flash(`Issued ${updates.length} invitation code${updates.length === 1 ? "" : "s"} ✓`);
    }
  };

  const insertTag = (tag: string) => {
    setCustomBody((prev) => prev + tag);
  };

  /** Enriched ledger rows with live status, tracking info, and resolved preview message. */
  const enrichedRows = useMemo(() => {
    const rsvpLogByGuest = new Map<string, MessageLog>();
    for (const m of messages) {
      if (!(Number(m.link_opens) > 0)) continue;
      const isRsvp =
        m.id.startsWith("link_rsvp_") || /#rsvp\b/i.test(m.body || "") || /\{rsvp_link\}/i.test(m.original_body || "");
      if (!isRsvp) continue;
      const prev = rsvpLogByGuest.get(m.recipient_id);
      const curTs = m.opened_at ?? m.created_at ?? "";
      const prevTs = prev ? prev.opened_at ?? prev.created_at ?? "" : "";
      if (!prev || curTs >= prevTs) rsvpLogByGuest.set(m.recipient_id, m);
    }

    return campaignRecipients.map((r) => {
      const existing = findExistingLog(r);
      const guest = r.guestId ? guestById.get(r.guestId) : undefined;
      const trackInfo = messageTrackingInfo(existing, guest);
      const rsvpLog = r.guestId ? rsvpLogByGuest.get(`gst_${r.guestId}`) : undefined;
      const rsvpOpenedAt = rsvpLog ? rsvpLog.opened_at ?? rsvpLog.created_at ?? null : null;
      const rsvpOpens = Number(rsvpLog?.link_opens) || 0;
      const msgId = getTrackingId(r, existing);
      const previewBody = info && customBody.trim() ? applyMergeTags(customBody, r, info, msgId, origin) : "";
      const trackedLink = recipientTrackedLink(r, msgId, origin, prefersRsvpJump);
      return { r, existing, guest, trackInfo, rsvpOpenedAt, rsvpOpens, msgId, previewBody, trackedLink };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignRecipients, messages, guestById, info, customBody, origin, prefersRsvpJump, activeCampaignId]);

  const counts = useMemo(() => {
    const base: Record<MessageStage, number> & { totalOpens: number } = {
      to_send: 0,
      sent: 0,
      opened: 0,
      responded: 0,
      declined: 0,
      totalOpens: 0,
    };
    for (const x of enrichedRows) {
      base[x.trackInfo.stage]++;
      base.totalOpens += x.trackInfo.opens;
    }
    return base;
  }, [enrichedRows]);

  const filteredRows = useMemo(() => {
    const query = normalizeLinkSearch(q);
    return enrichedRows
      .filter((x) => filter === "all" || x.trackInfo.stage === filter)
      .filter((x) => {
        if (!query) return true;
        return `${x.r.name} ${x.r.phone} ${x.r.code ?? ""} ${x.msgId} ${x.r.role} ${x.r.category}`.toLowerCase().includes(query);
      })
      .sort((a, b) => STAGE_ORDER.indexOf(a.trackInfo.stage) - STAGE_ORDER.indexOf(b.trackInfo.stage) || a.r.name.localeCompare(b.r.name));
  }, [enrichedRows, filter, q]);

  const uncodedGuests = useMemo(
    () => enrichedRows.filter((x) => x.r.guestId && !cleanCode(x.r.code)).map((x) => x.r),
    [enrichedRows],
  );

  const bulkCopyMessages = async () => {
    if (!customBody.trim()) return flash("Write a message or choose a template first.");
    const list = filteredRows;
    if (!list.length) return flash("No recipients in this view.");
    const blocks: string[] = [];
    for (const x of list) {
      const built = buildAndRecordSent(x.r, x.existing);
      if (built) blocks.push(`── ${x.r.name}${x.r.phone ? ` (${x.r.phone})` : ""} ──\n${built.body}`);
    }
    if (!(await copyText(blocks.join("\n\n")))) {
      return flash("Couldn't copy automatically — copy rows individually below.");
    }
    flash(`Copied ${blocks.length} personalized message${blocks.length === 1 ? "" : "s"} & marked all as sent ✓`);
  };

  const bulkMarkSent = () => {
    const unsent = filteredRows.filter((x) => !x.existing?.sent);
    if (!unsent.length) return flash("Every recipient in this view is already marked sent.");
    for (const x of unsent) buildAndRecordSent(x.r, x.existing);
    flash(`Marked ${unsent.length} recipient${unsent.length === 1 ? "" : "s"} as sent ✓`);
  };

  const exportComposeCsv = () => {
    const out = filteredRows.map(({ r, existing, guest, trackInfo, trackedLink }) => ({
      recipient: r.name,
      groups: r.role,
      phone: r.phone || "",
      code: cleanCode(r.code),
      tracked_link: trackedLink,
      status: MESSAGE_STATUS[trackInfo.stage].label,
      sent_at: existing?.sent_at ? day(existing.sent_at) : "",
      link_opens: trackInfo.opens,
      opened_at: trackInfo.openedAt ? day(trackInfo.openedAt) : "",
      rsvp_status: guest ? `${guest.attending} (${guest.pax} seats)` : "",
      campaign: effectiveLabel,
    }));
    download("compose-messages.csv", toCsv(out));
  };

  const sentTotal = enrichedRows.filter((x) => x.existing?.sent).length;
  const openedTotal = enrichedRows.filter((x) => x.trackInfo.opens > 0).length;
  const filterChips: ("all" | MessageStage)[] = ["all", ...STAGE_ORDER];
  const chipCount = (f: "all" | MessageStage) => (f === "all" ? enrichedRows.length : counts[f]);

  return (
    <div className="space-y-6">
      <PageHead kicker="Compose · copy · send · track" title="Compose message.">
        <Btn
          variant="ghost"
          onClick={() => {
            refreshTables("messages", "guests");
            flash("Refreshed live link opens & RSVPs ✓");
          }}
        >
          ↻ Refresh opens
        </Btn>
        {enrichedRows.length > 0 && (
          <Btn variant="ghost" onClick={exportComposeCsv}>Export CSV</Btn>
        )}
        {go && <Btn variant="ghost" onClick={() => go("messaging-tracker")}>📊 Tracker ({messages.length}) →</Btn>}
        {go && <Btn variant="ghost" onClick={() => go("invites")}>Invite codes →</Btn>}
      </PageHead>

      <p className="text-sm text-ink/60 max-w-3xl -mt-3">
        Pick a template or write your own message, choose who it goes to, then send row by row — just like{" "}
        <b>Invite Codes</b>: <b>copy message</b>, <b>copy link</b> or <b>send ↗</b> on WhatsApp automatically marks
        that household <i>sent</i> and gives them a tracked personal link so you see the moment they <i>open</i> it
        and when they <i>reply</i>.
      </p>

      {flashMsg && <div className="text-sm bg-moss/10 text-moss rounded-xl px-4 py-3">{flashMsg}</div>}
      {msgError && (
        <div role="alert" className="rounded-xl border border-burgundy/25 bg-burgundy/5 px-4 py-3 text-sm text-burgundy">
          {msgError}
        </div>
      )}

      <PresetTemplates templates={templates} onAdd={saveTemplate} onUseInCompose={handleUsePreset} />

      <Card className="p-6 space-y-5">
        <div>
          <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
            <label className="text-sm font-medium">Select Template (optional — or write your own below)</label>
            {selectedTemplate && (
              <button type="button" onClick={startFreshCustomMessage} className="label !text-[10px] text-wine hover:underline">
                ✕ Clear template · start custom message
              </button>
            )}
          </div>
          {templates.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-2">
              {templates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleSelectTemplate(t)}
                  className={`px-4 py-3 text-left rounded-lg border transition-all ${
                    selectedTemplate?.id === t.id
                      ? "bg-wine text-lace border-wine"
                      : "bg-white border-taupe/30 hover:border-wine/50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium truncate">{t.name}</span>
                    {t.label && (
                      <span className={`label !text-[9px] px-2 py-0.5 rounded-full ${selectedTemplate?.id === t.id ? "bg-lace/20 text-lace" : "bg-ink/10"}`}>
                        {t.label}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {!selectedTemplate && (
          <div>
            <label className="block text-sm font-medium mb-1.5">Message Label in Tracker (optional)</label>
            <input
              type="text"
              value={campaignLabel}
              onChange={(e) => setCampaignLabel(e.target.value)}
              placeholder="e.g., Weekend RSVP Nudge, Majlis Reminder, Vendor Check-in…"
              className="w-full px-4 py-2 border border-taupe/30 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-wine/40 text-sm"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-3">Who it goes to</label>
          <GroupPicker value={selectedCats} onChange={setSelectedCats} />
          <p className="text-xs text-ink/50 mt-2">
            Tags are the groups you set on each household in Guests &amp; RSVP — a guest in two tags is ticked in both,
            and still receives a single message.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Message Body</label>
          <textarea
            value={customBody}
            onChange={(e) => setCustomBody(e.target.value)}
            placeholder="Write your message here (merge tags personalize each household automatically)…"
            rows={8}
            className="w-full px-4 py-3 border border-taupe/30 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-wine/40 font-mono text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2.5">Merge Tags (click to insert)</label>
          <div className="flex flex-wrap gap-2">
            {MERGE_TAGS.map((tag) => (
              <button
                key={tag.tag}
                type="button"
                onClick={() => insertTag(tag.tag)}
                title={tag.hint}
                className="px-3 py-1.5 text-xs bg-oat hover:bg-wine/10 border border-taupe/30 rounded-full transition-colors"
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Btn
            onClick={() => ledgerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
            disabled={selectedCats.length === 0}
          >
            {selectedCats.length === 0
              ? "Pick who it goes to above"
              : `Recipients ready · ${recipients.length} ${recipients.length === 1 ? "household" : "households"} ↓`}
          </Btn>
          {customBody.trim() && !selectedTemplate && (
            <Btn
              variant="ghost"
              onClick={() => {
                const newTpl: MessageTemplate = {
                  id: uid(),
                  name: effectiveLabel,
                  label: "Custom",
                  body: customBody,
                  categories: selectedCats.join(","),
                  created_at: new Date().toISOString(),
                };
                void saveTemplate(newTpl);
                setSelectedTemplate(newTpl);
                flash(`Saved "${effectiveLabel}" to your templates ✓`);
              }}
            >
              + Save as template
            </Btn>
          )}
        </div>
      </Card>

      {(selectedCats.length > 0 || enrichedRows.length > 0) && (
        <div ref={ledgerRef} id="compose-recipients" className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="!bg-wine !text-lace">
              <Stat
                label="Recipients"
                value={enrichedRows.length}
                sub={`${counts.to_send} still to send`}
              />
            </Card>
            <Card>
              <Stat
                label="Sent / copied"
                value={`${sentTotal} / ${enrichedRows.length}`}
                sub={counts.sent ? `${counts.sent} waiting on open` : "copy or send to mark sent"}
              />
            </Card>
            <Card>
              <Stat
                label="Link opened"
                value={openedTotal}
                sub={counts.totalOpens ? `${counts.totalOpens} total open${counts.totalOpens === 1 ? "" : "s"}` : "nobody has opened yet"}
              />
            </Card>
            <Card>
              <Stat
                label="Responded"
                value={counts.responded}
                sub={counts.declined ? `${counts.declined} declined RSVP` : "RSVP answers + replies"}
              />
            </Card>
          </div>

          {usesCode && uncodedGuests.length > 0 && (
            <div className="rounded-xl border border-wine/25 bg-wine/5 px-4 py-3 flex items-center justify-between gap-3 flex-wrap text-sm">
              <span>
                <b>{uncodedGuests.length}</b> guest{uncodedGuests.length === 1 ? " has" : "s have"} no personal invite code yet — copying or sending will automatically issue one, or issue them all now:
              </span>
              <Btn onClick={() => void issueMissingCodes(uncodedGuests)}>
                ✦ Issue codes for all {uncodedGuests.length}
              </Btn>
            </div>
          )}

          <Card>
            <div className="flex flex-wrap gap-2 mb-3 items-center">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search recipient, phone number, code or group…"
                className="flex-1 min-w-[220px] bg-white/60 rounded-full px-5 py-2.5 outline-none border border-ink/10 focus:border-wine text-sm"
              />
              {!customBody.trim() && (
                <span className="text-xs text-burgundy font-medium px-2">
                  ✎ Write a message or pick a template above to copy / send
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-4 items-center">
              {filterChips.map((f) => (
                <Btn
                  key={f}
                  variant={filter === f ? "dark" : "ghost"}
                  onClick={() => setFilter(f)}
                  className="!px-3 !py-1.5"
                >
                  {f === "all" ? "all" : MESSAGE_STATUS[f].label}{" "}
                  <span className="opacity-60">{chipCount(f)}</span>
                </Btn>
              ))}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[980px] text-sm">
                <thead>
                  <tr className="label text-ink/50 border-b border-ink/10 select-none">
                    <th className="py-3 px-2">Recipient</th>
                    <th className="px-2">WhatsApp</th>
                    <th className="px-2">Code</th>
                    <th className="px-2">Send / Copy</th>
                    <th className="px-2">Status &amp; Link Opens</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/10">
                  {filteredRows.map(({ r, existing, guest, trackInfo, rsvpOpenedAt, rsvpOpens, previewBody, trackedLink }) => {
                    const waUrl = whatsappHref(r.phone, previewBody || customBody);
                    return (
                      <tr key={r.id} className="align-top">
                        <td className="px-2 py-2.5 min-w-[200px]">
                          <div className="font-medium text-ink">{r.name}</div>
                          <div className="text-xs text-ink/55 mt-0.5">
                            {r.role}
                            {r.pax ? ` · ${r.pax} seat${r.pax === 1 ? "" : "s"}` : ""}
                          </div>
                          {guest && (
                            <div className="text-[10px] text-ink/45 mt-0.5">
                              RSVP:{" "}
                              <b className={guest.attending === "yes" ? "text-moss" : guest.attending === "no" ? "text-burgundy" : ""}>
                                {guest.attending}
                              </b>
                              {guest.plus_one ? ` (+ ${plusOneLabel(guest.plus_one)})` : ""}
                            </div>
                          )}
                          {previewBody && (
                            <details className="mt-1.5 text-xs">
                              <summary className="cursor-pointer text-ink/55 hover:text-wine select-none">
                                Preview message
                              </summary>
                              <pre
                                onCopy={() => {
                                  if (!existing?.sent) {
                                    buildAndRecordSent(r, existing);
                                    flash(`Copied text for ${r.name} ✓ Automatically marked as sent.`);
                                  }
                                }}
                                className="mt-2 p-3 max-w-md bg-oat/60 rounded-lg font-mono text-[11px] leading-relaxed whitespace-pre-wrap overflow-x-auto"
                              >
                                {previewBody}
                              </pre>
                              {trackedLink && (
                                <div className="mt-1.5 text-[10px] text-ink/50 font-mono break-all">
                                  🔗 Tracks open{prefersRsvpJump ? " + jumps to #rsvp" : ""}: {trackedLink}
                                </div>
                              )}
                            </details>
                          )}
                        </td>

                        <td className="px-1 py-2 min-w-[145px]">
                          {r.guestId || r.vendorId ? (
                            <EditText
                              value={r.phone}
                              placeholder="+973 …"
                              onSave={(v) => handleSavePhone(r, v)}
                            />
                          ) : (
                            <span className="px-2 py-1.5 block text-xs text-ink/45">{r.phone || "—"}</span>
                          )}
                          {r.phone && (
                            <a
                              className="label !text-[9px] text-moss px-2"
                              target="_blank"
                              rel="noreferrer"
                              href={whatsappHref(r.phone)}
                            >
                              chat ↗
                            </a>
                          )}
                        </td>

                        <td className="px-2 py-2.5 whitespace-nowrap">
                          {cleanCode(r.code) ? (
                            <>
                              <span className="label !text-[11px] text-ink">{cleanCode(r.code)}</span>
                              <div>
                                <button
                                  type="button"
                                  className="label !text-[9px] text-ink/50 hover:text-wine"
                                  onClick={() =>
                                    void (async () => {
                                      if (await copyText(cleanCode(r.code))) markCopied(`${r.id}:code`);
                                    })()
                                  }
                                >
                                  {copiedKey === `${r.id}:code` ? "copied ✓" : "copy code"}
                                </button>
                              </div>
                            </>
                          ) : r.guestId ? (
                            <button
                              type="button"
                              className="label !text-[9px] text-wine hover:text-burgundy"
                              onClick={() => void issueMissingCodes([r])}
                            >
                              + issue code
                            </button>
                          ) : (
                            <span className="text-ink/30 text-xs">—</span>
                          )}
                        </td>

                        <td className="px-2 py-2.5">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 max-w-[260px]">
                            <button
                              type="button"
                              onClick={() => void handleCopyMessage(r, existing)}
                              title="Copy the addressed message & automatically mark this household as sent"
                              className="label !text-[10px] px-3 py-1.5 rounded-full bg-wine text-lace hover:bg-mocha transition-colors"
                            >
                              {copiedKey === `${r.id}:msg` ? "copied ✓ sent" : "copy message"}
                            </button>

                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => handleWhatsAppClick(e, r, existing)}
                              title={
                                r.phone
                                  ? `Open WhatsApp chat with ${r.name} & mark sent`
                                  : "Open WhatsApp with message pre-filled — pick the contact there & mark sent"
                              }
                              className="label !text-[10px] px-3 py-1.5 rounded-full border border-wine/40 text-wine hover:bg-wine hover:text-lace transition-colors"
                            >
                              send ↗
                            </a>

                            <button
                              type="button"
                              onClick={() => void handleCopyLink(r, existing)}
                              title={trackedLink}
                              className="label !text-[9px] text-moss hover:underline"
                            >
                              {copiedKey === `${r.id}:link` ? "copied ✓ sent" : "copy link"}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleSent(r, existing)}
                              className="label !text-[9px] text-ink/55 hover:text-wine"
                            >
                              {existing?.sent ? `sent ${day(existing.sent_at)} · undo` : "mark sent"}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleResponded(r, existing)}
                              className="label !text-[9px] text-ink/55 hover:text-moss"
                            >
                              {existing?.responded ? "responded ✓ · undo" : "mark responded"}
                            </button>
                          </div>
                        </td>

                        <td className="px-2 py-2.5 min-w-[215px]">
                          <MessageStatusTag s={trackInfo.stage} opens={trackInfo.opens} />
                          <div className="text-[11px] text-ink/55 mt-1 leading-snug space-y-0.5">
                            {trackInfo.opens > 0 ? (
                              <div className="text-amethyst font-medium tabular-nums" title={trackInfo.openedAt ? new Date(trackInfo.openedAt).toString() : undefined}>
                                👀 {prefersRsvpJump ? "#rsvp opened " : "Opened "}
                                {trackInfo.openedAt ? formatDateTimeStamp(trackInfo.openedAt) : "link"}
                                {trackInfo.openedAt && relativeTimeAgo(trackInfo.openedAt) ? ` (${relativeTimeAgo(trackInfo.openedAt)})` : ""}
                                {trackInfo.opens > 1 ? ` · ${trackInfo.opens}×` : ""}
                              </div>
                            ) : rsvpOpens > 0 ? (
                              <div className="text-amethyst font-medium tabular-nums" title={rsvpOpenedAt ? new Date(rsvpOpenedAt).toString() : undefined}>
                                👀 #rsvp opened {rsvpOpenedAt ? formatDateTimeStamp(rsvpOpenedAt) : "recently"}
                                {rsvpOpenedAt && relativeTimeAgo(rsvpOpenedAt) ? ` (${relativeTimeAgo(rsvpOpenedAt)})` : ""}
                                {rsvpOpens > 1 ? ` · ${rsvpOpens}×` : ""}
                              </div>
                            ) : guest?.viewed_at ? (
                              <div className="space-y-0.5 tabular-nums" title={new Date(guest.viewed_at).toString()}>
                                <div className="text-ink/70 font-medium">
                                  Invite ({cleanCode(guest.code) ? `/${cleanCode(guest.code)}` : "code"}) opened{" "}
                                  {formatDateTimeStamp(guest.viewed_at)}
                                </div>
                                <div className="text-[10px] text-ink/40">
                                  {prefersRsvpJump ? "#rsvp follow-up not opened yet" : existing?.sent ? "waiting on new open" : "not re-sent from Compose yet"}
                                </div>
                              </div>
                            ) : existing?.sent ? (
                              <div>waiting on them to open</div>
                            ) : (
                              <div className="text-ink/40">not shared yet</div>
                            )}
                            {trackInfo.repliedViaRsvp && guest && (
                              <div className={guest.attending === "yes" ? "text-moss font-medium" : "text-burgundy"}>
                                {guest.attending === "yes" ? `✓ Replied Yes (${guest.pax} seat${guest.pax === 1 ? "" : "s"})` : "Declined on RSVP"}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {!filteredRows.length && (
                <div className="py-12 text-center text-ink/40 font-serif text-2xl italic">
                  {enrichedRows.length
                    ? "Nobody in this filter — switch back to “all”."
                    : "No recipients match the selected groups yet."}
                </div>
              )}
            </div>

            {!!filteredRows.length && (
              <div className="flex flex-wrap gap-2 items-center justify-between mt-5 pt-4 border-t border-ink/10">
                <span className="text-xs text-ink/50">
                  {filteredRows.length} recipient{filteredRows.length === 1 ? "" : "s"} shown · every copied or sent message is logged in{" "}
                  <b>📊 Tracker</b>
                </span>
                <div className="flex gap-2 flex-wrap">
                  <Btn variant="ghost" onClick={() => void bulkCopyMessages()}>
                    Copy all messages &amp; mark sent
                  </Btn>
                  <Btn variant="ghost" onClick={bulkMarkSent}>
                    Mark all sent
                  </Btn>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

/* ═══════════ TRACKER TAB ═══════════ */
type TrackerViewMode = "all" | "rsvp" | "links" | "messages";
type TrackerSort = "opened_desc" | "opened_asc" | "opens_desc" | "sent_desc" | "name_asc" | "code_asc";

type TrackerEntry = {
  id: string;
  kind: "message" | "household_link";
  linkKind: "rsvp" | "invite";
  log?: MessageLog;
  guest?: Guest;
  recipientName: string;
  recipientPhone: string;
  code: string;
  label: string;
  group: string;
  body: string;
  inviteUrl: string;
  rsvpUrl: string;
  trackedUrl: string;
  sent: boolean;
  sentAt: string | null;
  openedAt: string | null;
  repliedAt: string | null;
  opens: number;
  stage: MessageStage;
  repliedViaRsvp: boolean;
};

function latestIso(...values: (string | null | undefined)[]): string | null {
  let best: string | null = null;
  for (const v of values) {
    if (!v) continue;
    if (!best || v > best) best = v;
  }
  return best;
}

export function TrackerTab({ go }: { go?: (tab: string) => void }) {
  const { rows: messages, save: saveMessage, del: delMessage } = useTable("messages");
  const { rows: guests, save: saveGuest } = useTable("guests", false);
  const { rows: infoRows } = useTable("wedding_info");
  const info = infoRows[0];

  const [viewMode, setViewMode] = useState<TrackerViewMode>("all");
  const [filter, setFilter] = useState<"all" | MessageStage>("all");
  const [campaignFilter, setCampaignFilter] = useState("all");
  const [sortBy, setSortBy] = useState<TrackerSort>("opened_desc");
  const [q, setQ] = useState("");
  const [copiedKey, setCopiedKey] = useState("");
  const [flashMsg, setFlashMsg] = useState("");
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const guestByRecipientId = useMemo(() => {
    const m = new Map<string, Guest>();
    for (const g of guests) m.set(`gst_${g.id}`, g);
    return m;
  }, [guests]);

  const markCopied = (k: string) => {
    setCopiedKey(k);
    setTimeout(() => setCopiedKey(""), 2200);
  };
  const flash = (t: string) => {
    setFlashMsg(t);
    setTimeout(() => setFlashMsg(""), 4500);
  };

  /** Logged rows in `messages` (from Compose AND auto-recorded distributed `#rsvp` / invite link opens). */
  const messageEntries = useMemo<TrackerEntry[]>(() => {
    return messages.map((m) => {
      const guest = guestByRecipientId.get(m.recipient_id);
      const trackInfo = messageTrackingInfo(m, guest);
      const code = cleanCode(guest?.code);
      const inviteUrl = code ? inviteLink(code, origin) : origin;
      const rsvpUrl = code ? `${inviteUrl}#rsvp` : origin ? `${origin}/rsvp` : "/rsvp";
      const isRsvpLink =
        m.id.startsWith("link_rsvp_") ||
        /#rsvp\b/i.test(m.body || "") ||
        /\{rsvp_link\}/i.test(m.original_body || "");
      const isAutoLink = m.id.startsWith("link_");
      const baseTarget = isRsvpLink ? rsvpUrl : inviteUrl;
      const trackedUrl = isAutoLink
        ? baseTarget
        : baseTarget
          ? attachTrackingParam(baseTarget, origin, m.id)
          : "";
      const repliedAt = guest?.source === "RSVP form" && guest.created_at ? guest.created_at : null;
      return {
        id: m.id,
        kind: "message",
        linkKind: isRsvpLink ? "rsvp" : "invite",
        log: m,
        guest,
        recipientName: m.recipient_name || (guest ? whoIsItFor(guest) || guest.name : ""),
        recipientPhone: m.recipient_phone || guest?.phone || "",
        code,
        label: m.template_name || "Custom Message",
        group: m.category || "",
        body: m.body || "",
        inviteUrl,
        rsvpUrl,
        trackedUrl,
        sent: Boolean(m.sent || trackInfo.opens > 0 || trackInfo.repliedViaRsvp),
        sentAt: m.sent_at ?? guest?.sent_at ?? null,
        openedAt: trackInfo.openedAt,
        repliedAt,
        opens: trackInfo.opens,
        stage: trackInfo.stage,
        repliedViaRsvp: trackInfo.repliedViaRsvp,
      };
    });
  }, [messages, guestByRecipientId, origin]);

  /**
   * Unified generated household links (`guests` with a `code`) —
   * distinguishes true `#rsvp` link opens from historical invitation-code (`/{code}`) opens!
   */
  const householdLinkEntries = useMemo<TrackerEntry[]>(() => {
    const logsByGuest = new Map<string, MessageLog[]>();
    for (const m of messages) {
      const list = logsByGuest.get(m.recipient_id);
      if (list) list.push(m);
      else logsByGuest.set(m.recipient_id, [m]);
    }

    const inviteText: InviteText | null = info
      ? {
          couple: `${info.bride} & ${info.groom}`,
          day: new Date(info.date).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }),
          date: info.date,
          deadline: info.rsvp_deadline,
        }
      : null;

    return guests
      .filter((g) => Boolean(cleanCode(g.code)))
      .map((g) => {
        const code = cleanCode(g.code);
        const inviteUrl = inviteLink(code, origin);
        const rsvpUrl = `${inviteUrl}#rsvp`;
        const guestLogs = logsByGuest.get(`gst_${g.id}`) ?? [];
        const loggedOpens = guestLogs.reduce((sum, m) => sum + (Number(m.link_opens) || 0), 0);
        const latestLogOpen = latestIso(
          ...guestLogs.map((m) => m.opened_at ?? (m.id.startsWith("link_") && Number(m.link_opens) > 0 ? m.created_at : null)),
        );
        const openedAt = latestIso(g.viewed_at, latestLogOpen);
        const opens = loggedOpens > 0 ? loggedOpens : openedAt ? 1 : 0;
        const repliedViaRsvp = g.source === "RSVP form" || g.attending !== "pending";
        const anyLogResponded = guestLogs.some((m) => m.responded);
        const sentAt = latestIso(g.sent_at, ...guestLogs.filter((m) => m.sent).map((m) => m.sent_at));
        const sent = Boolean(sentAt || opens > 0 || repliedViaRsvp || guestLogs.some((m) => m.sent));

        let stage: MessageStage;
        if (g.attending === "no") stage = "declined";
        else if (repliedViaRsvp || anyLogResponded) stage = "responded";
        else if (opens > 0) stage = "opened";
        else if (sent) stage = "sent";
        else stage = "to_send";

        const repliedAt = g.source === "RSVP form" && g.created_at ? g.created_at : null;
        const hasRsvpLinkOpen = guestLogs.some(
          (m) =>
            Number(m.link_opens) > 0 &&
            (m.id.startsWith("link_rsvp_") || /#rsvp\b/i.test(m.body || "") || /\{rsvp_link\}/i.test(m.original_body || "")),
        );
        const linkKind: "rsvp" | "invite" = hasRsvpLinkOpen ? "rsvp" : "invite";
        const label = hasRsvpLinkOpen ? "RSVP Link (#rsvp)" : `Invite Code (/${code})`;
        const letterBody = inviteText ? inviteMessage(code, inviteText, origin) : inviteUrl;

        return {
          id: `household_${g.id}`,
          kind: "household_link" as const,
          linkKind,
          guest: g,
          recipientName: whoIsItFor(g) || g.name || code,
          recipientPhone: g.phone || "",
          code,
          label,
          group: `${g.pax} seat${g.pax === 1 ? "" : "s"}`,
          body: letterBody,
          inviteUrl,
          rsvpUrl,
          trackedUrl: hasRsvpLinkOpen ? rsvpUrl : inviteUrl,
          sent,
          sentAt,
          openedAt,
          repliedAt,
          opens,
          stage,
          repliedViaRsvp,
        };
      });
  }, [guests, messages, info, origin]);

  const rsvpOnlyEntries = useMemo(
    () => messageEntries.filter((e) => e.linkKind === "rsvp"),
    [messageEntries],
  );

  /**
   * Combined view:
   * - `all`: every logged message + every pre-existing household invite code that has no open message log yet
   * - `rsvp`: ONLY `#rsvp` follow-up messages & `#rsvp` link opens (excludes historical Oct 6–13 `/JS-XXXX` invite code opens!)
   * - `links`: 1 unified row per generated household code
   * - `messages`: all rows stored in `messages`
   */
  const baseEntries = useMemo<TrackerEntry[]>(() => {
    if (viewMode === "rsvp") return rsvpOnlyEntries;
    if (viewMode === "links") return householdLinkEntries;
    if (viewMode === "messages") return messageEntries;
    const guestIdsWithOpenLog = new Set(
      messageEntries.filter((e) => e.opens > 0 && e.log).map((e) => e.log!.recipient_id),
    );
    const guestIdsWithAnyLog = new Set(messages.map((m) => m.recipient_id));
    const surfacedHouseholds = householdLinkEntries.filter((e) => {
      if (!e.guest) return false;
      const rid = `gst_${e.guest.id}`;
      if (!guestIdsWithAnyLog.has(rid)) return true;
      return Boolean(e.guest.viewed_at && !guestIdsWithOpenLog.has(rid));
    });
    return [...messageEntries, ...surfacedHouseholds];
  }, [viewMode, rsvpOnlyEntries, householdLinkEntries, messageEntries, messages]);

  const campaigns = useMemo(() => {
    const counts = new Map<string, { label: string; count: number }>();
    for (const e of baseEntries) {
      const cur = counts.get(e.label);
      if (cur) cur.count++;
      else counts.set(e.label, { label: e.label, count: 1 });
    }
    return Array.from(counts.values());
  }, [baseEntries]);

  const campaignScoped = useMemo(
    () => (campaignFilter === "all" ? baseEntries : baseEntries.filter((e) => e.label === campaignFilter)),
    [baseEntries, campaignFilter],
  );

  const stageCounts = useMemo(() => {
    const c: Record<MessageStage, number> & { totalOpens: number; openedCount: number } = {
      to_send: 0,
      sent: 0,
      opened: 0,
      responded: 0,
      declined: 0,
      totalOpens: 0,
      openedCount: 0,
    };
    for (const x of campaignScoped) {
      c[x.stage]++;
      c.totalOpens += x.opens;
      if (x.opens > 0) c.openedCount++;
    }
    return c;
  }, [campaignScoped]);

  const shown = useMemo(() => {
    const query = normalizeLinkSearch(q);
    return campaignScoped
      .filter((x) => filter === "all" || x.stage === filter)
      .filter((x) => {
        if (!query) return true;
        return `${x.id} ${x.recipientName} ${x.guest?.name ?? ""} ${x.guest?.plus_one ?? ""} ${x.recipientPhone} ${x.code} ${x.rsvpUrl} ${x.inviteUrl} ${x.label} ${x.group} ${x.body}`
          .toLowerCase()
          .includes(query);
      })
      .sort((a, b) => {
        const openA = a.openedAt ?? "";
        const openB = b.openedAt ?? "";
        const sentA = a.sentAt ?? a.guest?.created_at ?? "";
        const sentB = b.sentAt ?? b.guest?.created_at ?? "";
        switch (sortBy) {
          case "opened_desc":
            return (
              (openB ? 0 : 1) - (openA ? 0 : 1) ||
              openB.localeCompare(openA) ||
              sentB.localeCompare(sentA) ||
              a.recipientName.localeCompare(b.recipientName)
            );
          case "opened_asc":
            return (
              (openA ? 0 : 1) - (openB ? 0 : 1) ||
              openA.localeCompare(openB) ||
              sentA.localeCompare(sentB)
            );
          case "opens_desc":
            return b.opens - a.opens || openB.localeCompare(openA) || a.recipientName.localeCompare(b.recipientName);
          case "sent_desc":
            return (sentB ? 0 : 1) - (sentA ? 0 : 1) || sentB.localeCompare(sentA) || openB.localeCompare(openA);
          case "name_asc":
            return a.recipientName.localeCompare(b.recipientName);
          case "code_asc":
            return a.code.localeCompare(b.code);
        }
      });
  }, [campaignScoped, filter, q, sortBy]);

  const markEntrySent = async (entry: TrackerEntry) => {
    const nowIso = new Date().toISOString();
    if (entry.log && !entry.log.sent) {
      await saveMessage({ ...entry.log, sent: true, sent_at: nowIso });
    }
    if (entry.guest && !entry.guest.sent_at) {
      await saveGuest({ ...entry.guest, sent_at: nowIso });
    }
  };

  const handleToggleSent = (entry: TrackerEntry) => {
    const nowIso = new Date().toISOString();
    if (entry.log) {
      if (entry.log.sent) void saveMessage({ ...entry.log, sent: false, sent_at: null });
      else void saveMessage({ ...entry.log, sent: true, sent_at: nowIso });
      return;
    }
    if (entry.guest) {
      void saveGuest({ ...entry.guest, sent_at: entry.guest.sent_at ? null : nowIso });
    }
  };

  const handleToggleResponded = (entry: TrackerEntry) => {
    if (entry.log) {
      void saveMessage({ ...entry.log, responded: !entry.log.responded });
    }
  };

  const handleCopyUrl = async (entry: TrackerEntry, url: string, suffix: string, labelText: string) => {
    if (!url) return;
    if (!(await copyText(url))) return flash("Browser blocked clipboard.");
    markCopied(`${entry.id}:${suffix}`);
    await markEntrySent(entry);
    flash(`Copied ${labelText} for ${entry.recipientName} ✓`);
  };

  const handleCopyBody = async (entry: TrackerEntry) => {
    if (!(await copyText(entry.body))) return flash("Browser blocked clipboard — expand View message below to copy.");
    markCopied(`${entry.id}:msg`);
    await markEntrySent(entry);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this message log entry?")) {
      void delMessage(id);
    }
  };

  const exportCsv = () => {
    const out = shown.map((e) => ({
      recipient: e.recipientName,
      phone: e.recipientPhone || "",
      code: e.code,
      rsvp_link: e.rsvpUrl,
      invite_link: e.inviteUrl,
      source: e.label,
      group: e.group,
      status: MESSAGE_STATUS[e.stage].label,
      link_opened: e.opens > 0 ? "yes" : "no",
      opened_at: e.openedAt ? formatDateTimeStamp(e.openedAt) : "",
      opened_at_iso: e.openedAt ?? "",
      link_opens: e.opens,
      sent_at: e.sentAt ? formatDateTimeStamp(e.sentAt) : "",
      replied_at: e.repliedAt ? formatDateTimeStamp(e.repliedAt) : "",
      rsvp_status: e.guest ? `${e.guest.attending} (${e.guest.pax} seats)` : "",
    }));
    download("link-and-message-tracker.csv", toCsv(out));
  };

  const sentCount = campaignScoped.filter((e) => e.sent).length;
  const filterChips: ("all" | MessageStage)[] = ["all", ...STAGE_ORDER];
  const chipCount = (f: "all" | MessageStage) => (f === "all" ? campaignScoped.length : stageCounts[f]);

  return (
    <div className="space-y-6">
      <PageHead kicker="Distributed #rsvp links · invite codes · Compose messages" title="Link &amp; message tracker.">
        <Btn
          variant="ghost"
          onClick={() => {
            refreshTables("messages", "guests");
            flash("Refreshed live link opens & timestamps ✓");
          }}
        >
          ↻ Refresh opens
        </Btn>
        {shown.length > 0 && <Btn variant="ghost" onClick={exportCsv}>Export CSV</Btn>}
        {go && <Btn onClick={() => go("messaging-compose")}>📨 Compose message →</Btn>}
      </PageHead>

      {flashMsg && <div className="text-sm bg-moss/10 text-moss rounded-xl px-4 py-3">{flashMsg}</div>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="!bg-wine !text-lace">
          <Stat
            label="Links &amp; messages"
            value={campaignScoped.length}
            sub={`${sentCount} distributed / sent`}
          />
        </Card>
        <Card>
          <Stat
            label="Links opened"
            value={stageCounts.openedCount}
            sub={`${stageCounts.totalOpens} total open${stageCounts.totalOpens === 1 ? "" : "s"} recorded`}
          />
        </Card>
        <Card>
          <Stat
            label="Opened · awaiting RSVP"
            value={stageCounts.opened}
            sub={stageCounts.opened ? "opened link — haven't submitted RSVP yet" : "everyone who opened has replied"}
          />
        </Card>
        <Card>
          <Stat
            label="RSVP replied"
            value={stageCounts.responded}
            sub={stageCounts.declined ? `${stageCounts.declined} declined RSVP` : "confirmed responses"}
          />
        </Card>
      </div>

      <Card>
        {/* View mode selector clearly separating #rsvp links from historical /JS-XXXX invite codes */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-ink/10">
          <div className="flex flex-wrap gap-1.5 items-center">
            <Btn
              variant={viewMode === "all" ? "dark" : "ghost"}
              onClick={() => { setViewMode("all"); setCampaignFilter("all"); }}
              className="!px-3.5 !py-1.5"
            >
              All activity <span className="opacity-65 ml-1">{messageEntries.length + householdLinkEntries.filter((e) => !e.guest || !messages.some((m) => m.recipient_id === `gst_${e.guest!.id}`) || (e.guest.viewed_at && !messageEntries.some((me) => me.opens > 0 && me.log?.recipient_id === `gst_${e.guest!.id}`))).length}</span>
            </Btn>
            <Btn
              variant={viewMode === "rsvp" ? "dark" : "ghost"}
              onClick={() => { setViewMode("rsvp"); setCampaignFilter("all"); }}
              className="!px-3.5 !py-1.5"
            >
              🎯 #rsvp links &amp; follow-ups <span className="opacity-65 ml-1">{rsvpOnlyEntries.length}</span>
            </Btn>
            <Btn
              variant={viewMode === "links" ? "dark" : "ghost"}
              onClick={() => { setViewMode("links"); setCampaignFilter("all"); }}
              className="!px-3.5 !py-1.5"
            >
              🔑 Invite codes (/JS-…) <span className="opacity-65 ml-1">{householdLinkEntries.length}</span>
            </Btn>
            <Btn
              variant={viewMode === "messages" ? "dark" : "ghost"}
              onClick={() => { setViewMode("messages"); setCampaignFilter("all"); }}
              className="!px-3.5 !py-1.5"
            >
              📨 All logged messages <span className="opacity-65 ml-1">{messageEntries.length}</span>
            </Btn>
          </div>

          <label className="flex items-center gap-1.5 bg-white/60 rounded-full px-3.5 py-2 border border-ink/10 text-xs">
            <span className="label !text-[9px] text-ink/50">Sort</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as TrackerSort)}
              className="bg-transparent outline-none font-medium text-ink cursor-pointer"
            >
              <option value="opened_desc">Link opened: Latest first</option>
              <option value="opened_asc">Link opened: Oldest first</option>
              <option value="opens_desc">Most opens first</option>
              <option value="sent_desc">Sent / created: Latest first</option>
              <option value="name_asc">Recipient: A → Z</option>
              <option value="code_asc">Code: A → Z</option>
            </select>
          </label>
        </div>

        <div className="flex flex-wrap gap-2 mb-3 items-center">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Paste any link (e.g. https://…/JS-RD8P#rsvp), code, name, or number…"
            className="flex-1 min-w-[240px] bg-white/60 rounded-full px-5 py-2.5 outline-none border border-ink/10 focus:border-wine text-sm"
          />
          {campaigns.length > 1 && (
            <label className="flex items-center gap-1.5 bg-white/60 rounded-full px-3.5 py-2 border border-ink/10 text-xs">
              <span className="label !text-[9px] text-ink/50">Source</span>
              <select
                value={campaignFilter}
                onChange={(e) => setCampaignFilter(e.target.value)}
                className="bg-transparent outline-none font-medium text-ink cursor-pointer"
              >
                <option value="all">All sources ({baseEntries.length})</option>
                {campaigns.map((c) => (
                  <option key={c.label} value={c.label}>
                    {c.label} ({c.count})
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mb-4 items-center">
          {filterChips.map((f) => (
            <Btn
              key={f}
              variant={filter === f ? "dark" : "ghost"}
              onClick={() => setFilter(f)}
              className="!px-3 !py-1.5"
            >
              {f === "all" ? "all" : MESSAGE_STATUS[f].label}{" "}
              <span className="opacity-60">{chipCount(f)}</span>
            </Btn>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[1040px] text-sm">
            <thead>
              <tr className="label text-ink/50 border-b border-ink/10 select-none">
                <th className="py-3 px-2">Recipient &amp; Link</th>
                <th className="px-2">Source</th>
                <th className="px-2">Link Opened (Date &amp; Time)</th>
                <th className="px-2">Sent &amp; RSVP Stamps</th>
                <th className="px-2">Actions</th>
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {shown.map((e) => {
                const openedStamp = formatDateTimeStamp(e.openedAt);
                const openedRel = relativeTimeAgo(e.openedAt);
                const sentStamp = formatDateTimeStamp(e.sentAt);
                const repliedStamp = formatDateTimeStamp(e.repliedAt);
                return (
                  <tr key={e.id} className="align-top">
                    <td className="px-2 py-3 min-w-[230px]">
                      <div className="font-medium text-ink">{e.recipientName}</div>
                      {e.recipientPhone && <div className="text-xs text-ink/55 mt-0.5">📱 {e.recipientPhone}</div>}
                      {e.code ? (
                        <div className="mt-1 space-y-0.5">
                          <span className="inline-block label !text-[10px] px-2 py-0.5 rounded bg-ink/5 text-ink/80 font-mono">
                            {e.code}
                          </span>
                          <div className="font-mono text-[11px] text-ink/55 break-all">
                            {e.linkKind === "rsvp" ? `/${e.code}#rsvp` : `/${e.code}`}
                          </div>
                        </div>
                      ) : null}
                    </td>

                    <td className="px-2 py-3 min-w-[185px]">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`label !text-[9px] px-2 py-0.5 rounded-full ${
                            e.linkKind === "rsvp" ? "bg-wine/10 text-wine" : "bg-ink/8 text-ink/65"
                          }`}
                        >
                          {e.linkKind === "rsvp" ? "🎯 #rsvp link" : "🔑 invite code"}
                        </span>
                      </div>
                      <div className="font-medium text-ink/90 mt-1">{e.label}</div>
                      {e.group && <div className="text-xs text-ink/55">{e.group}</div>}
                      {e.body && (
                        <details className="mt-1.5 text-xs">
                          <summary className="cursor-pointer text-ink/55 hover:text-wine select-none">
                            View link / message
                          </summary>
                          <pre className="mt-2 p-3 max-w-md bg-oat/60 rounded-lg font-mono text-[11px] leading-relaxed whitespace-pre-wrap overflow-x-auto">
                            {e.body}
                          </pre>
                        </details>
                      )}
                    </td>

                    {/* Dedicated Date & Time column showing exact open timestamp & whether #rsvp vs invite code */}
                    <td className="px-2 py-3 min-w-[235px]">
                      {e.opens > 0 ? (
                        <div className="space-y-0.5">
                          <div
                            className="font-semibold text-amethyst tabular-nums"
                            title={e.openedAt ? new Date(e.openedAt).toString() : undefined}
                          >
                            👀 {openedStamp || "Opened"}
                          </div>
                          <div className="text-xs text-ink/55 tabular-nums">
                            {openedRel ? `${openedRel} · ` : ""}
                            {e.linkKind === "rsvp"
                              ? `#rsvp link (${e.opens} ${e.opens === 1 ? "open" : "opens"})`
                              : `Original invite code (/${e.code})`}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <div className="text-xs text-ink/40 font-medium">Not opened yet</div>
                          <div className="text-[11px] text-ink/35">
                            {e.sent
                              ? e.linkKind === "rsvp"
                                ? "Waiting for guest to open #rsvp link"
                                : "Waiting for guest to open invite"
                              : "Link generated · not marked sent"}
                          </div>
                        </div>
                      )}
                    </td>

                    <td className="px-2 py-3 min-w-[205px]">
                      <MessageStatusTag s={e.stage} opens={e.opens} />
                      <div className="text-[11px] text-ink/55 mt-1.5 leading-snug space-y-0.5 tabular-nums">
                        {sentStamp ? (
                          <div>Sent: {sentStamp}</div>
                        ) : e.sent ? (
                          <div>Distributed prior to log</div>
                        ) : (
                          <div className="text-ink/40">Not marked sent yet</div>
                        )}
                        {e.guest && e.guest.attending !== "pending" && (
                          <div className={e.guest.attending === "yes" ? "text-moss font-medium" : "text-burgundy font-medium"}>
                            RSVP: {e.guest.attending === "yes" ? `Yes (${e.guest.pax} seat${e.guest.pax === 1 ? "" : "s"})` : "Declined"}
                            {repliedStamp ? ` · ${repliedStamp}` : ""}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-2 py-3">
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 max-w-[235px]">
                        {e.rsvpUrl && (
                          <button
                            type="button"
                            onClick={() => void handleCopyUrl(e, e.rsvpUrl, "rsvp", "#rsvp link")}
                            title={e.rsvpUrl}
                            className="label !text-[10px] px-2.5 py-1 rounded-full bg-wine text-lace hover:bg-mocha transition-colors"
                          >
                            {copiedKey === `${e.id}:rsvp` ? "copied ✓" : "copy #rsvp"}
                          </button>
                        )}

                        {e.trackedUrl && (
                          <button
                            type="button"
                            onClick={() => void handleCopyUrl(e, e.trackedUrl, "link", "link")}
                            title={e.trackedUrl}
                            className="label !text-[9px] text-moss hover:underline"
                          >
                            {copiedKey === `${e.id}:link` ? "copied ✓" : "copy link"}
                          </button>
                        )}

                        {e.body && (
                          <button
                            type="button"
                            onClick={() => void handleCopyBody(e)}
                            className="label !text-[9px] text-ink/60 hover:text-wine"
                          >
                            {copiedKey === `${e.id}:msg` ? "copied ✓" : "copy msg"}
                          </button>
                        )}

                        <a
                          href={whatsappHref(e.recipientPhone, e.body || e.rsvpUrl)}
                          target="_blank"
                          rel="noreferrer"
                          onClick={() => void markEntrySent(e)}
                          className="label !text-[9px] text-wine hover:text-burgundy"
                        >
                          send ↗
                        </a>

                        <button
                          type="button"
                          onClick={() => handleToggleSent(e)}
                          className="label !text-[9px] text-ink/50 hover:text-wine"
                        >
                          {e.sent ? "undo sent" : "mark sent"}
                        </button>

                        {e.log && (
                          <button
                            type="button"
                            onClick={() => handleToggleResponded(e)}
                            className="label !text-[9px] text-ink/50 hover:text-moss"
                          >
                            {e.log.responded ? "undo reply" : "mark replied"}
                          </button>
                        )}
                      </div>
                    </td>

                    <td className="px-1 py-3">
                      {e.log && (
                        <button
                          type="button"
                          onClick={() => handleDelete(e.log!.id)}
                          className="text-ink/30 hover:text-burgundy px-2 py-1.5"
                          title="Delete log entry"
                        >
                          ✕
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {shown.length === 0 && (
            <div className="py-12 text-center text-ink/40 font-serif text-2xl italic">
              {baseEntries.length
                ? "Nothing matches this filter — switch back to “all” or clear your search."
                : "No generated links or messages yet — create an invite code or send a message in Compose ✦"}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
