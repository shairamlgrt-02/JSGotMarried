"use client";
import { useEffect, useMemo, useState } from "react";
import { Btn, Card, EditText, PageHead, Progress, Tag } from "@/components/admin/ui";
import { uid } from "@/lib/db";
import { useTable } from "@/lib/hooks";
import { DEFAULT_REGISTRY_NOTE, type GiftItem } from "@/lib/types";
import { listGifts, saveRegistryNote } from "@/lib/gifts";

const inputCls = "bg-white/60 rounded-full px-5 py-3 outline-none border border-ink/10 focus:border-wine";

/**
 * Binder → Gift list. The couple owns the wish list shown on the public /gifts page (and linked
 * from the Hub): add, word, reorder and remove items, release a claim made by mistake, and edit
 * the invite-code-free note that says monetary gifts are appreciated most.
 */
export function GiftRegistry() {
  const { rows, save, del, error } = useTable("gift_items");
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [note, setNote] = useState("");
  const [noteLoaded, setNoteLoaded] = useState(false);
  const [noteMsg, setNoteMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    let live = true;
    listGifts().then((b) => {
      if (live) {
        // The API returns the default when the stored note is blank — show an empty editor instead.
        setNote(b.note === DEFAULT_REGISTRY_NOTE ? "" : b.note);
        setNoteLoaded(true);
      }
    });
    return () => {
      live = false;
    };
  }, []);

  const items = useMemo(
    () => [...rows].sort((a, b) => a.order - b.order || a.title.localeCompare(b.title)),
    [rows],
  );
  const open = items.filter((g) => !g.claimed).length;

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    const order = items.reduce((m, g) => Math.max(m, g.order), -1) + 1;
    save({ id: uid(), title: t, note: detail.trim(), claimed: false, claimed_by: "", claimed_at: null, order });
    setTitle("");
    setDetail("");
  };

  const move = (index: number, dir: -1 | 1) => {
    const swapWith = items[index + dir];
    const current = items[index];
    if (!swapWith) return;
    // Swap the order positions and persist both rows in one upsert.
    save([
      { ...current, order: swapWith.order },
      { ...swapWith, order: current.order },
    ]);
  };

  const persistNote = async (value: string) => {
    setNote(value);
    setNoteMsg(null);
    try {
      await saveRegistryNote(value);
      setNoteMsg({ kind: "ok", text: "Note saved — it updates on the site immediately." });
    } catch (e) {
      setNoteMsg({ kind: "err", text: (e as Error).message });
    }
  };

  return (
    <>
      <PageHead kicker={`${open} of ${items.length} still open`} title="The gift list.">
        <Btn variant="ghost" onClick={() => window.open("/gifts", "_blank")}>
          Open the guest page ↗
        </Btn>
      </PageHead>
      {error && <p className="mb-4 text-sm text-burgundy">{error}</p>}

      <Card title="The note above the list (public — no account numbers in this box)">
        <p className="text-sm text-ink/55 mb-3">
          Shown to every guest on /gifts and from the homepage. The BenefitPay number and IBAN are edited in the{" "}
          <b>Details tab → Note on Gifts</b>; when filled, they also appear on the public /gifts page as tap-to-copy
          rows, so guests can give without opening their personal link. Leave them blank there to hide the transfer
          card completely.
        </p>
        {noteLoaded ? (
          <EditText
            multiline
            rows={3}
            value={note}
            placeholder={DEFAULT_REGISTRY_NOTE}
            onSave={persistNote}
            className="text-sm leading-relaxed"
          />
        ) : (
          <p className="text-sm text-ink/40 italic">Loading note…</p>
        )}
        {noteMsg && (
          <p className={`mt-3 text-sm ${noteMsg.kind === "ok" ? "text-moss" : "text-burgundy"}`}>{noteMsg.text}</p>
        )}
      </Card>

      <Card className="mt-6">
        <Progress value={items.length ? ((items.length - open) / items.length) * 100 : 0} color="#4A5D23" />
        <form onSubmit={add} className="flex flex-col md:flex-row gap-2 mt-6">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Gift name — e.g. Ceramic vase"
            className={`${inputCls} flex-[2]`}
          />
          <input
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="Optional detail (size, colour, shop…)"
            className={`${inputCls} flex-[2]`}
          />
          <Btn type="submit" variant="dark">
            Add
          </Btn>
        </form>

        <ul className="mt-5 divide-y divide-ink/10">
          {items.map((g: GiftItem, i) => (
            <li key={g.id} className="py-3 flex flex-wrap md:flex-nowrap items-center gap-3">
              <div className="flex flex-col gap-1 shrink-0">
                <button
                  type="button"
                  aria-label="Move up"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="text-ink/40 hover:text-wine disabled:opacity-25 leading-none px-1"
                >
                  ↑
                </button>
                <button
                  type="button"
                  aria-label="Move down"
                  onClick={() => move(i, 1)}
                  disabled={i === items.length - 1}
                  className="text-ink/40 hover:text-wine disabled:opacity-25 leading-none px-1"
                >
                  ↓
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <EditText
                  value={g.title}
                  placeholder="Gift name"
                  onSave={(v) => v.trim() && save({ ...g, title: v.trim() })}
                  className={`font-serif text-lg ${g.claimed ? "line-through text-ink/40" : ""}`}
                />
                <EditText
                  value={g.note}
                  placeholder="Add a detail…"
                  onSave={(v) => save({ ...g, note: v.trim() })}
                  className="text-sm text-taupe italic"
                />
              </div>
              {g.claimed ? (
                <div className="flex items-center gap-2 shrink-0">
                  <Tag>{`Bought${g.claimed_by ? ` · ${g.claimed_by}` : ""}`}</Tag>
                  <Btn variant="ghost" onClick={() => save({ ...g, claimed: false, claimed_by: "", claimed_at: null })}>
                    Release
                  </Btn>
                </div>
              ) : (
                <Tag>Open</Tag>
              )}
              <Btn variant="danger" onClick={() => del(g.id)}>
                Delete
              </Btn>
            </li>
          ))}
          {!items.length && (
            <li className="py-8 text-center text-ink/45 font-serif italic">
              No gifts yet — add the first one above. Guests see this list on /gifts and from the homepage.
            </li>
          )}
        </ul>
      </Card>
    </>
  );
}
