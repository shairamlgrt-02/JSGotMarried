"use client";
import { useEffect, useMemo, useState } from "react";
import { useTable } from "@/lib/hooks";
import { Btn, Card, PageHead, Tag } from "./ui";
import {
  DEFAULT_BINGO_TILES,
  DEFAULT_FRAME_OPTIONS,
  IG_FRAME_COLORS,
  IG_FRAME_LAYOUTS,
  IG_STORY_IDS,
  IG_STORY_META,
  downloadIgFrame,
  downloadIgStory,
  igFramePreviewDataUrl,
  igStoryDataFromInfo,
  igStoryPreviewDataUrl,
  loadIgFonts,
  type IgFrameColorName,
  type IgFrameElements,
  type IgFrameOptions,
  type IgStoryData,
  type IgStoryId,
} from "@/lib/ig-stories";
import { qrDataUrl, saveDataUrl } from "@/lib/qr";
import { MomentGallery } from "./moment-gallery";
import type { WeddingInfo } from "@/lib/types";

/* The full-resolution story is drawn once fonts are ready; edits redraw the preview instantly. */
function StoryPreview({ id, data, fontsReady }: { id: IgStoryId; data: IgStoryData; fontsReady: boolean }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    if (!fontsReady) return;
    try {
      setSrc(igStoryPreviewDataUrl(id, data, 300));
    } catch {
      /* canvas unavailable (very old browser) — the download still works after font load */
    }
  }, [id, data, fontsReady]);
  if (!src) return <div className="aspect-[9/16] w-full rounded-xl bg-oat/60 grid place-items-center text-xs text-ink/40">Drawing preview…</div>;
  return <img src={src} alt={IG_STORY_META[id].name} className="w-full rounded-xl shadow-[0_14px_34px_-18px_rgba(61,47,38,.55)]" />;
}

/* The transparent frame preview — shown over a checkerboard (or dark/light sample photo backdrop). */
function FramePreview({ data, options, fontsReady, backdrop }: { data: IgStoryData; options: IgFrameOptions; fontsReady: boolean; backdrop: "checker" | "dark" | "light" }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    if (!fontsReady) return;
    try {
      setSrc(igFramePreviewDataUrl(data, options, 300));
    } catch {
      /* canvas unavailable — the download still works after font load */
    }
  }, [data, options, fontsReady]);
  const backdropCls =
    backdrop === "checker"
      ? "bg-[conic-gradient(#e9dfce_90deg,#f7f4ee_90deg_180deg,#e9dfce_180deg_270deg,#f7f4ee_0)] bg-[length:24px_24px]"
      : backdrop === "dark"
        ? "bg-mocha"
        : "bg-white";
  if (!src) return <div className="aspect-[9/16] w-full rounded-xl bg-oat/60 grid place-items-center text-xs text-ink/40">Drawing preview…</div>;
  return (
    <div className={`aspect-[9/16] w-full rounded-xl overflow-hidden ${backdropCls}`}>
      <img src={src} alt="Transparent story frame preview" className="w-full h-full object-contain" />
    </div>
  );
}

const FRAME_ELEMENT_LABELS: { key: keyof IgFrameElements; label: string }[] = [
  { key: "monogram", label: "J&S monogram seal" },
  { key: "names", label: "Couple names" },
  { key: "flourish", label: "Flourish divider" },
  { key: "date", label: "Date" },
  { key: "handle", label: "Instagram handle" },
  { key: "hashtags", label: "Hashtags" },
];

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="label !text-[10px] text-ink/50 block mb-1">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full px-3 py-2 text-sm border border-taupe/30 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-wine/40";

export function IgStories({ embedded = false }: { embedded?: boolean }) {
  const { rows: infoRows } = useTable("wedding_info");
  const info = infoRows[0] as WeddingInfo | undefined;
  const suggested = useMemo(() => igStoryDataFromInfo(info), [info]);

  // Editable draft, seeded from the saved wedding details. It is intentionally NOT saved back:
  // stories are generated assets — the source of truth stays in Details, and Reset restores it.
  const [data, setData] = useState<IgStoryData | null>(null);
  const [fontsReady, setFontsReady] = useState(false);
  const [busy, setBusy] = useState<IgStoryId | "all" | "qr" | "frame" | null>(null);
  const [flash, setFlash] = useState("");

  /* ── transparent story frames ── */
  const [frame, setFrame] = useState<IgFrameOptions>(DEFAULT_FRAME_OPTIONS);
  const [backdrop, setBackdrop] = useState<"checker" | "dark" | "light">("checker");
  const patchFrame = (patch: Partial<IgFrameOptions>) => setFrame((f) => ({ ...f, ...patch }));
  const toggleFrameElement = (key: keyof IgFrameElements) =>
    setFrame((f) => ({ ...f, elements: { ...f.elements, [key]: !f.elements[key] } }));

  const downloadFrame = async () => {
    if (!data) return;
    setBusy("frame");
    try {
      const ok = await downloadIgFrame(data, frame);
      tell(ok ? "Transparent frame saved — overlay it on any photo in Instagram ✓" : "Your browser blocked the download — try again.");
    } finally {
      setBusy(null);
    }
  };

  useEffect(() => {
    loadIgFonts().then(() => setFontsReady(true));
  }, []);

  useEffect(() => {
    if (!data) setData(suggested);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggested.couple, suggested.handle, suggested.hashtag, suggested.dateLabel]);

  const set = <K extends keyof IgStoryData>(key: K, value: IgStoryData[K]) =>
    setData((d) => (d ? { ...d, [key]: value } : d));

  const setBingoTile = (i: number, value: string) =>
    setData((d) => {
      if (!d) return d;
      const tiles = [...d.bingoTiles];
      tiles[i] = value;
      return { ...d, bingoTiles: tiles };
    });

  const tell = (m: string) => {
    setFlash(m);
    setTimeout(() => setFlash(""), 4000);
  };

  const downloadOne = async (id: IgStoryId) => {
    if (!data) return;
    setBusy(id);
    try {
      const ok = await downloadIgStory(id, data);
      tell(ok ? `Saved ${IG_STORY_META[id].filename}-1080x1920.png ✓` : "Your browser blocked the download — try again.");
    } finally {
      setBusy(null);
    }
  };

  const downloadAll = async () => {
    if (!data) return;
    setBusy("all");
    try {
      for (const id of IG_STORY_IDS) {
        await downloadIgStory(id, data);
        await new Promise((r) => setTimeout(r, 700)); // browsers drop downloads fired back to back
      }
      tell("All three stories saved ✓");
    } finally {
      setBusy(null);
    }
  };

  /* ── guest upload QR (/upload) ── */
  const uploadUrl = typeof window !== "undefined" ? `${window.location.origin}/upload` : "/upload";
  const [qr, setQr] = useState("");
  useEffect(() => {
    let live = true;
    qrDataUrl(uploadUrl, 1024).then((url) => live && setQr(url)).catch(() => {});
    return () => {
      live = false;
    };
  }, [uploadUrl]);

  if (!data) return null;

  return (
    <div className="space-y-6">
      {!embedded && (
        <>
          <PageHead kicker="1080 × 1920 · ready to post" title="Instagram story templates.">
            <Btn onClick={downloadAll} disabled={busy !== null}>
              {busy === "all" ? "Saving…" : "Download all 3 (PNG)"}
            </Btn>
          </PageHead>
          <p className="text-sm text-ink/60 max-w-3xl -mt-3">
            Three on-brand story cards drawn straight from your binder details — names, date, handle and hashtags fill themselves in —
            plus <b>transparent frame PNGs</b>: just your lettering and ornaments, no background, to lay on top of your own photos in
            Instagram&apos;s story editor. For the bingo &amp; prompt cards, add Instagram&apos;s own <b>Add Yours</b> sticker on top so
            your guests can join in.
          </p>
        </>
      )}
      {flash && <div className="text-sm bg-moss/10 text-moss rounded-xl px-4 py-3">{flash}</div>}

      <div className="grid md:grid-cols-3 gap-5">
        {IG_STORY_IDS.map((id) => (
          <Card key={id}>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="font-medium">{IG_STORY_META[id].name}</span>
              <Tag>1080 × 1920</Tag>
            </div>
            <StoryPreview id={id} data={data} fontsReady={fontsReady} />
            <p className="text-xs text-ink/55 mt-3 min-h-[48px]">{IG_STORY_META[id].hint}</p>
            <Btn variant="dark" className="mt-3 w-full" onClick={() => void downloadOne(id)} disabled={busy !== null}>
              {busy === id ? "Saving…" : "Download PNG"}
            </Btn>
          </Card>
        ))}
      </div>

      <Card title="Transparent story frames (overlay on your own photos)">
        <p className="text-sm text-ink/60 mb-5">
          No background card — just your names, date, monogram, flourish, handle and hashtags in the wedding lettering, exported as a{" "}
          <b>transparent 1080 × 1920 PNG</b>. Add it on top of any photo inside Instagram&apos;s story editor (sticker → add from
          photos, or paste), and only your mark shows. The wording below follows the editable fields in the next card.
        </p>
        <div className="grid md:grid-cols-[300px_1fr] gap-7 items-start">
          <div>
            <FramePreview data={data} options={frame} fontsReady={fontsReady} backdrop={backdrop} />
            <div className="flex justify-center gap-1.5 mt-2">
              {(["checker", "dark", "light"] as const).map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBackdrop(b)}
                  className={`label !text-[9px] rounded-full px-3 py-1.5 border transition-colors ${
                    backdrop === b ? "bg-wine text-lace border-wine" : "border-ink/15 text-ink/60 hover:border-wine"
                  }`}
                >
                  {b === "checker" ? "transparent" : b}
                </button>
              ))}
            </div>
            <Btn variant="dark" className="mt-3 w-full" onClick={() => void downloadFrame()} disabled={busy !== null}>
              {busy === "frame" ? "Saving…" : "Download transparent PNG"}
            </Btn>
          </div>

          <div className="space-y-5">
            <div>
              <span className="label !text-[10px] text-ink/50 block mb-2">Placement</span>
              <div className="flex flex-wrap gap-2">
                {IG_FRAME_LAYOUTS.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => patchFrame({ layout: l.id })}
                    className={`label !text-[10px] rounded-full px-4 py-2 border transition-colors ${
                      frame.layout === l.id ? "bg-wine text-lace border-wine" : "border-ink/15 text-ink/65 hover:border-wine"
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
              {frame.layout === "corner" && (
                <div className="flex gap-2 mt-2">
                  {(["left", "right"] as const).map((side) => (
                    <button
                      key={side}
                      type="button"
                      onClick={() => patchFrame({ side })}
                      className={`label !text-[10px] rounded-full px-3.5 py-1.5 border transition-colors ${
                        frame.side === side ? "bg-ink text-paper border-ink" : "border-ink/15 text-ink/60 hover:border-wine"
                      }`}
                    >
                      {side} corner
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <span className="label !text-[10px] text-ink/50 block mb-2">Colour (pick paper/white for dark photos)</span>
              <div className="flex flex-wrap gap-2.5">
                {(Object.keys(IG_FRAME_COLORS) as IgFrameColorName[]).map((name) => (
                  <button
                    key={name}
                    type="button"
                    title={IG_FRAME_COLORS[name].label}
                    onClick={() => patchFrame({ color: name })}
                    className={`flex items-center gap-2 label !text-[10px] rounded-full pl-1.5 pr-3.5 py-1.5 border transition-colors ${
                      frame.color === name ? "border-wine ring-2 ring-wine/30" : "border-ink/15 hover:border-wine"
                    }`}
                  >
                    <span
                      className="w-5 h-5 rounded-full border border-ink/15"
                      style={{ backgroundColor: IG_FRAME_COLORS[name].hex }}
                    />
                    {IG_FRAME_COLORS[name].label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="label !text-[10px] text-ink/50 block mb-2">Elements (toggle what the frame carries)</span>
              <div className="grid sm:grid-cols-2 gap-2">
                {FRAME_ELEMENT_LABELS.map(({ key, label }) => (
                  <label
                    key={key}
                    className="flex items-center gap-2.5 text-sm border border-ink/10 rounded-lg px-3 py-2 cursor-pointer hover:border-wine/50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={frame.elements[key]}
                      onChange={() => toggleFrameElement(key)}
                      className="accent-wine w-4 h-4"
                    />
                    {label}
                  </label>
                ))}
              </div>
              {!Object.values(frame.elements).some(Boolean) && (
                <p className="text-xs text-burgundy mt-2">Switch at least one element on — an empty frame would be a blank PNG.</p>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Card title="Edit the wording">
        <p className="text-sm text-ink/60 mb-4">
          Changes redraw the previews above instantly. Nothing here overwrites your binder — <b>Reset</b> restores the names,
          handle and hashtags from Details at any time.
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Couple names (script line)">
            <input className={inputCls} value={data.couple} onChange={(e) => set("couple", e.target.value)} />
          </Field>
          <Field label="Date label">
            <input className={inputCls} value={data.dateLabel} onChange={(e) => set("dateLabel", e.target.value)} />
          </Field>
          <Field label="Instagram handle">
            <input className={inputCls} value={data.handle} onChange={(e) => set("handle", e.target.value)} />
          </Field>
          <Field label="Primary hashtag">
            <input className={inputCls} value={data.hashtag} onChange={(e) => set("hashtag", e.target.value)} />
          </Field>
          <Field label="Other hashtags (space separated)" className="md:col-span-2">
            <input
              className={inputCls}
              value={data.extraHashtags.join(" ")}
              onChange={(e) => set("extraHashtags", e.target.value.split(/\s+/).filter(Boolean))}
            />
          </Field>
        </div>

        <div className="mt-6">
          <h4 className="font-serif text-xl mb-3">Bingo tiles (six, in grid order)</h4>
          <div className="grid md:grid-cols-3 gap-3">
            {data.bingoTiles.map((tile, i) => (
              <Field key={i} label={`Tile ${i + 1}`}>
                <input className={inputCls} value={tile} onChange={(e) => setBingoTile(i, e.target.value)} />
              </Field>
            ))}
          </div>
          <button
            type="button"
            className="label !text-[10px] text-wine hover:underline mt-2"
            onClick={() => set("bingoTiles", [...DEFAULT_BINGO_TILES])}
          >
            Reset tiles to the suggested six
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mt-6">
          <Field label="Outfit story — kicker">
            <input className={inputCls} value={data.outfitKicker} onChange={(e) => set("outfitKicker", e.target.value)} />
          </Field>
          <Field label="Outfit story — event name">
            <input className={inputCls} value={data.outfitEvent} onChange={(e) => set("outfitEvent", e.target.value)} />
          </Field>
          <Field label="Add Yours prompt" className="md:col-span-2">
            <textarea
              className={`${inputCls} font-sans`}
              rows={2}
              value={data.addYoursPrompt}
              onChange={(e) => set("addYoursPrompt", e.target.value)}
            />
          </Field>
          <Field label="Add Yours how-to line" className="md:col-span-2">
            <input className={inputCls} value={data.addYoursHint} onChange={(e) => set("addYoursHint", e.target.value)} />
          </Field>
        </div>

        <div className="mt-5">
          <Btn variant="ghost" onClick={() => setData(igStoryDataFromInfo(info))}>
            Reset to suggested wording
          </Btn>
        </div>
      </Card>

      <Card title="Guest photo & video upload — QR for the tables">
        <div className="grid md:grid-cols-[220px_1fr] gap-6 items-start">
          <div>
            {qr ? (
              <img src={qr} alt="QR code to the guest upload page" className="w-full rounded-xl border border-taupe/25 bg-white p-2" />
            ) : (
              <div className="aspect-square rounded-xl bg-oat/60 grid place-items-center text-xs text-ink/40">Drawing QR…</div>
            )}
            <div className="flex gap-2 mt-3 flex-wrap">
              <Btn variant="dark" onClick={() => qr && saveDataUrl(qr, "guest-upload-qr-1024.png")} disabled={!qr || busy === "qr"}>
                Download PNG
              </Btn>
              <Btn variant="ghost" onClick={() => void navigator.clipboard?.writeText(uploadUrl).then(() => tell("Upload link copied ✓"))}>
                Copy link
              </Btn>
            </div>
          </div>
          <div className="text-sm text-ink/70 space-y-3">
            <p>
              This QR opens <code className="bg-ink/10 px-1 rounded">{uploadUrl}</code> — the public page where guests send their
              photos and videos straight to your Supabase Storage, no login or invitation code needed.
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                Print it on the <b>12 double-sided table cards</b> (table number on the front, QR on the back) and the two{" "}
                <b>A4 signs</b> for the welcome table and photo area.
              </li>
              <li>
                Each guest can send up to <b>25 files and 1 GB</b> from their phone — tracked on their device so the cap holds even
                if they reopen the page.
              </li>
              <li>
                One-time setup: run the <b>wedding-media + wedding_moments</b> sections in <code className="bg-ink/10 px-1 rounded">supabase/schema.sql</code>.
                In Vercel, set <code className="bg-ink/10 px-1 rounded">NEXT_PUBLIC_SUPABASE_URL</code>,{" "}
                <code className="bg-ink/10 px-1 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, and the server-only{" "}
                <code className="bg-ink/10 px-1 rounded">SUPABASE_SERVICE_ROLE_KEY</code> (Supabase → Project Settings → API).
              </li>
              <li>The album stays private in Storage. Guests can post and browse signed feed previews; only the couple&apos;s server can list or remove original files. Never prefix the service-role key with <code>NEXT_PUBLIC_</code>.</li>
            </ul>
          </div>
        </div>
      </Card>

      <MomentGallery />
    </div>
  );
}
