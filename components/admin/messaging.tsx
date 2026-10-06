"use client";
import { useEffect, useState } from "react";
import { useTable } from "@/lib/hooks";
import { MESSAGE_CATEGORIES, MERGE_TAGS, applyMergeTags, resolveRecipients, type Recipient } from "@/lib/messaging";
import type { MessageTemplate, MessageLog } from "@/lib/types";
import { Btn, Card, Tag } from "./ui";
import { uid } from "@/lib/db";

/* ═══════════ TEMPLATES TAB ═══════════ */
export function TemplatesTab() {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif">Message Templates</h2>
          <p className="text-sm text-ink/60 mt-1">Create reusable templates with merge tags for different groups</p>
        </div>
        <Btn onClick={handleNew}>+ New Template</Btn>
      </div>

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
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-serif text-lg">{t.name}</h3>
                  {t.label && <Tag>{t.label}</Tag>}
                </div>
                <div className="text-xs text-ink/50">
                  Categories: {t.categories.split(",").filter(Boolean).map((id) => MESSAGE_CATEGORIES.find((c) => c.id === id)?.label).join(", ") || "None"}
                </div>
              </div>
              <div className="flex gap-2">
                <Btn variant="ghost" onClick={() => { setEditing(t); setShowForm(true); }}>Edit</Btn>
                <Btn variant="ghost" onClick={() => handleDelete(t.id)}>Delete</Btn>
              </div>
            </div>
            <div className="bg-oat/50 rounded-lg p-3 text-sm whitespace-pre-wrap font-mono">{t.body}</div>
          </Card>
        ))}
        {templates.length === 0 && !showForm && (
          <div className="text-center py-12 text-ink/40">
            <p className="text-lg mb-2">No templates yet</p>
            <p className="text-sm">Create your first template to get started</p>
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

  const toggleCategory = (id: string) => {
    const next = selectedCats.includes(id)
      ? selectedCats.filter((c) => c !== id)
      : [...selectedCats, id];
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
        <label className="block text-sm font-medium mb-3">Categories</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {MESSAGE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => toggleCategory(cat.id)}
              className={`px-3 py-2 text-sm rounded-lg border transition-all ${
                selectedCats.includes(cat.id)
                  ? "bg-wine text-lace border-wine"
                  : "bg-white border-taupe/30 hover:border-wine/50"
              }`}
            >
              <span className="mr-1">{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>
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
export function ComposeTab() {
  const { rows: templates } = useTable("message_templates");
  const { rows: messages, save: saveMessage } = useTable("messages");
  const { rows: entourage } = useTable("entourage");
  const { rows: vendors } = useTable("vendors");
  const { rows: guests } = useTable("guests");
  const { rows: infoRows } = useTable("wedding_info");
  const info = infoRows[0];

  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [customBody, setCustomBody] = useState("");
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [showRecipients, setShowRecipients] = useState(false);

  // Check if we're coming from Guests tab with a pre-selected category
  useEffect(() => {
    const preselected = localStorage.getItem("jsos:compose_category");
    if (preselected) {
      setSelectedCats([preselected]);
      localStorage.removeItem("jsos:compose_category");
    }
  }, []);

  const handleSelectTemplate = (t: MessageTemplate) => {
    setSelectedTemplate(t);
    setCustomBody(t.body);
    const cats = t.categories.split(",").filter(Boolean);
    setSelectedCats(cats);
  };

  const handleGenerateRecipients = () => {
    if (!info || selectedCats.length === 0) return;
    const resolved = resolveRecipients(selectedCats, entourage, vendors, guests, info);
    setRecipients(resolved);
    setShowRecipients(true);
  };

  const handleSendMessage = (recipient: Recipient) => {
    if (!selectedTemplate || !info) return;
    const resolvedBody = applyMergeTags(customBody, recipient, info);
    const log: MessageLog = {
      id: uid(),
      template_id: selectedTemplate.id,
      template_name: selectedTemplate.name,
      original_body: customBody,
      body: resolvedBody,
      recipient_id: recipient.id,
      recipient_name: recipient.name,
      recipient_phone: recipient.phone,
      category: recipient.category,
      sent: false,
      responded: false,
      link_opens: 0,
      created_at: new Date().toISOString(),
    };
    saveMessage(log);
  };

  const handleMarkSent = (logId: string) => {
    const log = messages.find((m) => m.id === logId);
    if (log) {
      saveMessage({ ...log, sent: true, sent_at: new Date().toISOString() });
    }
  };

  const handleMarkResponded = (logId: string) => {
    const log = messages.find((m) => m.id === logId);
    if (log) {
      saveMessage({ ...log, responded: true });
    }
  };

  const toggleCategory = (id: string) => {
    setSelectedCats((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const insertTag = (tag: string) => {
    setCustomBody((prev) => prev + tag);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-serif">Compose Message</h2>
        <p className="text-sm text-ink/60 mt-1">Create and send personalized messages to your guests</p>
      </div>

      <Card className="p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium mb-3">Select Template (optional)</label>
          <div className="grid gap-2">
            {templates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleSelectTemplate(t)}
                className={`px-4 py-3 text-left rounded-lg border transition-all ${
                  selectedTemplate?.id === t.id
                    ? "bg-wine/10 border-wine"
                    : "bg-white border-taupe/30 hover:border-wine/50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{t.name}</span>
                  {t.label && <Tag>{t.label}</Tag>}
                </div>
              </button>
            ))}
            {templates.length === 0 && (
              <p className="text-sm text-ink/40">No templates yet. Create one in the Templates tab.</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-3">Categories</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {MESSAGE_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggleCategory(cat.id)}
                className={`px-3 py-2 text-sm rounded-lg border transition-all ${
                  selectedCats.includes(cat.id)
                    ? "bg-wine text-lace border-wine"
                    : "bg-white border-taupe/30 hover:border-wine/50"
                }`}
              >
                <span className="mr-1">{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Message Body</label>
          <textarea
            value={customBody}
            onChange={(e) => setCustomBody(e.target.value)}
            placeholder="Write your message or select a template..."
            rows={8}
            className="w-full px-4 py-3 border border-taupe/30 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-wine/40 font-mono text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-3">Merge Tags</label>
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

        <Btn onClick={handleGenerateRecipients} disabled={selectedCats.length === 0 || !customBody}>
          Generate Recipients ({selectedCats.length} categories selected)
        </Btn>
      </Card>

      {showRecipients && recipients.length > 0 && (
        <Card className="p-6">
          <h3 className="font-serif text-lg mb-4">Recipients ({recipients.length})</h3>
          <div className="space-y-3">
            {recipients.map((r) => {
              const existingLog = messages.find((m) => m.recipient_id === r.id && m.template_id === selectedTemplate?.id);
              const previewBody = info ? applyMergeTags(customBody, r, info) : "";

              return (
                <div key={r.id} className="border border-taupe/20 rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium">{r.name}</div>
                      <div className="text-sm text-ink/60">{r.role} · {r.category}</div>
                      {r.phone && <div className="text-xs text-ink/50 mt-1">📱 {r.phone}</div>}
                    </div>
                    <div className="flex gap-2">
                      {!existingLog ? (
                        <Btn onClick={() => handleSendMessage(r)}>Send Message</Btn>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleMarkSent(existingLog.id)}
                            disabled={existingLog.sent}
                            className={`px-3 py-1 text-xs rounded ${
                              existingLog.sent
                                ? "bg-moss text-lace"
                                : "bg-oat hover:bg-moss/20"
                            }`}
                          >
                            {existingLog.sent ? "✓ Sent" : "Mark Sent"}
                          </button>
                          <button
                            onClick={() => handleMarkResponded(existingLog.id)}
                            disabled={existingLog.responded}
                            className={`px-3 py-1 text-xs rounded ${
                              existingLog.responded
                                ? "bg-wine text-lace"
                                : "bg-oat hover:bg-wine/20"
                            }`}
                          >
                            {existingLog.responded ? "✓ Responded" : "Mark Responded"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <details className="text-xs">
                    <summary className="cursor-pointer text-ink/60 hover:text-ink">Preview message</summary>
                    <div className="mt-2 p-3 bg-oat/50 rounded font-mono whitespace-pre-wrap">{previewBody}</div>
                  </details>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {showRecipients && recipients.length === 0 && (
        <Card className="p-6 text-center text-ink/40">
          No recipients found for the selected categories
        </Card>
      )}
    </div>
  );
}

/* ═══════════ TRACKER TAB ═══════════ */
export function TrackerTab() {
  const { rows: messages, save, del } = useTable("messages");

  const handleMarkSent = (log: MessageLog) => {
    save({ ...log, sent: true, sent_at: new Date().toISOString() });
  };

  const handleMarkResponded = (log: MessageLog) => {
    save({ ...log, responded: true });
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this message log?")) {
      del(id);
    }
  };

  const sent = messages.filter((m) => m.sent).length;
  const responded = messages.filter((m) => m.responded).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-serif">Message Tracker</h2>
        <p className="text-sm text-ink/60 mt-1">Track delivery and responses for all messages</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-5 text-center">
          <div className="text-3xl font-bold">{messages.length}</div>
          <div className="text-sm text-ink/60 mt-1">Total Messages</div>
        </Card>
        <Card className="p-5 text-center bg-moss/5">
          <div className="text-3xl font-bold text-moss">{sent}</div>
          <div className="text-sm text-ink/60 mt-1">Sent</div>
        </Card>
        <Card className="p-5 text-center bg-wine/5">
          <div className="text-3xl font-bold text-wine">{responded}</div>
          <div className="text-sm text-ink/60 mt-1">Responded</div>
        </Card>
      </div>

      <div className="space-y-3">
        {messages.map((m) => (
          <Card key={m.id} className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="font-medium">{m.recipient_name}</div>
                <div className="text-xs text-ink/60">{m.template_name} · {m.category}</div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleMarkSent(m)}
                  disabled={m.sent}
                  className={`px-3 py-1 text-xs rounded ${
                    m.sent ? "bg-moss text-lace" : "bg-oat hover:bg-moss/20"
                  }`}
                >
                  {m.sent ? "✓ Sent" : "Mark Sent"}
                </button>
                <button
                  onClick={() => handleMarkResponded(m)}
                  disabled={m.responded}
                  className={`px-3 py-1 text-xs rounded ${
                    m.responded ? "bg-wine text-lace" : "bg-oat hover:bg-wine/20"
                  }`}
                >
                  {m.responded ? "✓ Responded" : "Mark Responded"}
                </button>
                <button
                  onClick={() => handleDelete(m.id)}
                  className="px-3 py-1 text-xs rounded bg-oat hover:bg-burgundy/20"
                >
                  Delete
                </button>
              </div>
            </div>
            {m.sent_at && (
              <div className="text-xs text-ink/50 mt-1">
                Sent: {new Date(m.sent_at).toLocaleString()}
              </div>
            )}
            <details className="mt-2 text-xs">
              <summary className="cursor-pointer text-ink/60 hover:text-ink">View message</summary>
              <div className="mt-2 p-3 bg-oat/50 rounded font-mono whitespace-pre-wrap">{m.body}</div>
            </details>
          </Card>
        ))}
        {messages.length === 0 && (
          <div className="text-center py-12 text-ink/40">
            <p className="text-lg mb-2">No messages sent yet</p>
            <p className="text-sm">Go to the Compose tab to send your first message</p>
          </div>
        )}
      </div>
    </div>
  );
}
