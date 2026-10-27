"use client";
import { useMemo, useRef, useState } from "react";
import { useTable } from "@/lib/hooks";
import { fullDate } from "@/components/public/Envelope";
import {
  MAX_FILES_PER_GUEST,
  MAX_TOTAL_BYTES,
  UPLOAD_ACCEPT,
  addToQuota,
  formatBytes,
  guestId,
  mediaConfigured,
  objectPath,
  readQuota,
  uploadMediaFile,
  validateSelection,
} from "@/lib/media-upload";

type RowState = { file: File; status: "waiting" | "uploading" | "sent" | "error"; progress: number; error?: string };

export default function UploadPage() {
  const { rows: infoRows } = useTable("wedding_info");
  const info = infoRows[0];
  const configured = useMemo(() => mediaConfigured(), []);
  const inputRef = useRef<HTMLInputElement>(null);

  const [rows, setRows] = useState<RowState[]>([]);
  const [quota, setQuota] = useState(readQuota());
  const [notices, setNotices] = useState<string[]>([]);
  const [phase, setPhase] = useState<"idle" | "uploading" | "done">("idle");

  const couple = info?.bride && info?.groom ? `${info.groom} & ${info.bride}` : "the couple";
  const hashtag = info?.hashtags?.[0] || "";
  const remainingFiles = Math.max(0, MAX_FILES_PER_GUEST - quota.count);
  const remainingBytes = Math.max(0, MAX_TOTAL_BYTES - quota.bytes);
  const quotaPct = Math.min(100, Math.round((quota.bytes / MAX_TOTAL_BYTES) * 100));

  const patchRow = (index: number, patch: Partial<RowState>) =>
    setRows((cur) => cur.map((r, i) => (i === index ? { ...r, ...patch } : r)));

  const onPick = (picked: FileList | null) => {
    if (!picked) return;
    const result = validateSelection(Array.from(picked), quota);
    setNotices(result.errors);
    setRows((cur) => {
      const known = new Set(cur.map((r) => `${r.file.name}-${r.file.size}`));
      const fresh = result.accepted
        .filter((f) => !known.has(`${f.name}-${f.size}`))
        .map((file) => ({ file, status: "waiting" as const, progress: 0 }));
      return [...cur, ...fresh];
    });
    if (inputRef.current) inputRef.current.value = "";
  };

  const removeRow = (index: number) => setRows((cur) => cur.filter((_, i) => i !== index));

  const send = async () => {
    if (!configured || !rows.length) return;
    setPhase("uploading");
    setNotices([]);
    const id = guestId();
    const sentFiles: File[] = [];
    const failures: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (row.status === "sent") continue;
      patchRow(i, { status: "uploading", progress: 0, error: undefined });
      const path = objectPath(row.file, id);
      try {
        await uploadMediaFile(row.file, path, (percent) => patchRow(i, { progress: percent }));
        patchRow(i, { status: "sent", progress: 100 });
        sentFiles.push(row.file);
      } catch (e) {
        const message = /bucket not found|not found/i.test((e as Error).message)
          ? "The upload album isn't set up yet — please let the couple know."
          : "This one didn't send — please try again in a little while.";
        patchRow(i, { status: "error", error: message });
        failures.push(row.file.name);
      }
    }

    if (sentFiles.length) {
      setQuota(addToQuota(sentFiles));
      setRows((cur) => cur.filter((r) => r.status !== "sent"));
    }
    if (failures.length) {
      setNotices([`${failures.length} file${failures.length === 1 ? "" : "s"} couldn't be sent — they're kept below so you can retry.`]);
      setPhase("idle");
    } else {
      setPhase("done");
    }
  };

  const totalSelected = rows.reduce((s, r) => s + r.file.size, 0);

  return (
    <main className="min-h-screen paper-bg text-ink">
      <div className="max-w-2xl mx-auto px-5 py-14 md:py-20">
        <a
          href="/"
          className="micro inline-flex items-center gap-2 tracking-[0.18em] text-taupe no-underline transition-colors hover:text-wine focus:outline-none focus-visible:ring-2 focus-visible:ring-wine/60 rounded-full"
        >
          <span aria-hidden>←</span> BACK TO THE HOUSE
        </a>
        <header className="text-center mt-8">
          <p className="micro tracking-[0.3em] text-taupe">A WEDDING KEEPSAKE</p>
          <h1 className="script text-wine text-[clamp(2.6rem,9vw,4.5rem)] leading-tight mt-3">Share your moments</h1>
          <p className="font-serif font-light tracking-[0.14em] text-mocha mt-3">
            {info ? fullDate(info.date) : "11.11.2026"} · {couple}
          </p>
          {hashtag && <p className="font-serif text-wine text-fine mt-2">{hashtag}</p>}
        </header>

        {!configured ? (
          <div className="mt-12 rounded-[22px] border border-taupe/25 bg-lace/60 p-8 text-center space-y-3">
            <p className="font-serif text-2xl text-mocha">The upload album isn&apos;t connected yet.</p>
            <p className="text-sm text-ink/60">
              The couple still needs to switch on photo storage — please check back in a little while, or send your photos to
              them directly. Thank you!
            </p>
          </div>
        ) : phase === "done" ? (
          <div className="mt-12 rounded-[22px] border border-moss/30 bg-moss/10 p-10 text-center space-y-4">
            <div className="text-4xl" aria-hidden>♡</div>
            <p className="font-serif text-3xl text-moss">Thank you — they&apos;re with us!</p>
            <p className="text-sm text-ink/65">
              Your photos and videos went straight into the couple&apos;s private album. Only {couple} can see them.
            </p>
            {remainingFiles > 0 && (
              <button
                type="button"
                onClick={() => setPhase("idle")}
                className="micro inline-block bg-wine text-lace rounded-full px-7 py-3.5 hover:bg-mocha transition-colors tracking-[0.16em]"
              >
                SEND MORE MEMORIES
              </button>
            )}
          </div>
        ) : (
          <section className="mt-10 rounded-[22px] border border-taupe/25 bg-[#FCFAF6] p-6 md:p-9 shadow-[0_12px_30px_-18px_rgba(61,47,38,.45)]">
            <label
              htmlFor="media-picker"
              className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-wine/35 bg-white/60 px-6 py-12 text-center cursor-pointer hover:border-wine hover:bg-wine/[0.04] transition-colors"
            >
              <span className="text-3xl" aria-hidden>📷</span>
              <span className="font-serif text-2xl text-mocha">Tap to choose photos &amp; videos</span>
              <span className="micro text-taupe tracking-[0.12em]">
                UP TO {MAX_FILES_PER_GUEST} FILES · {formatBytes(MAX_TOTAL_BYTES)} TOTAL · PHONE PHOTOS, HEIC, MOV &amp; MP4
              </span>
              <input
                id="media-picker"
                ref={inputRef}
                type="file"
                accept={UPLOAD_ACCEPT}
                multiple
                hidden
                onChange={(e) => onPick(e.target.files)}
              />
            </label>

            <div className="mt-5">
              <div className="flex justify-between micro text-taupe tracking-[0.12em]">
                <span>YOUR ALBUM QUOTA</span>
                <span>
                  {quota.count}/{MAX_FILES_PER_GUEST} files · {formatBytes(quota.bytes)}/{formatBytes(MAX_TOTAL_BYTES)}
                </span>
              </div>
              <div className="h-2 rounded-full bg-ink/10 mt-2 overflow-hidden">
                <div className="h-full rounded-full bg-wine transition-all duration-500" style={{ width: `${quotaPct}%` }} />
              </div>
              <p className="text-xs text-ink/50 mt-2">
                You can still send <b>{remainingFiles}</b> more file{remainingFiles === 1 ? "" : "s"} ({formatBytes(remainingBytes)}).
              </p>
            </div>

            {notices.length > 0 && (
              <ul className="mt-5 rounded-xl bg-burgundy/10 text-burgundy text-sm px-4 py-3 space-y-1">
                {notices.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            )}

            {rows.length > 0 && (
              <>
                <ul className="mt-5 divide-y divide-ink/10">
                  {rows.map((row, i) => (
                    <li key={`${row.file.name}-${row.file.size}-${i}`} className="py-3 flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm truncate">{row.file.name}</p>
                        <p className="micro text-taupe mt-0.5">
                          {formatBytes(row.file.size)}
                          {row.status === "error" && <span className="text-burgundy"> · {row.error}</span>}
                          {row.status === "sent" && <span className="text-moss"> · sent ✓</span>}
                        </p>
                        {row.status === "uploading" && (
                          <div className="h-1.5 rounded-full bg-ink/10 mt-2 overflow-hidden">
                            <div className="h-full bg-wine transition-all" style={{ width: `${row.progress}%` }} />
                          </div>
                        )}
                      </div>
                      {row.status !== "uploading" && (
                        <button
                          type="button"
                          onClick={() => removeRow(i)}
                          className="text-ink/35 hover:text-burgundy px-2 text-sm"
                          aria-label={`Remove ${row.file.name}`}
                        >
                          ✕
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-ink/55">
                    {rows.length} ready · {formatBytes(totalSelected)}
                  </p>
                  <button
                    type="button"
                    onClick={() => void send()}
                    disabled={phase === "uploading" || rows.length === 0}
                    className="micro bg-wine text-lace rounded-full px-8 py-3.5 hover:bg-mocha transition-colors tracking-[0.16em] disabled:opacity-50"
                  >
                    {phase === "uploading" ? "SENDING…" : `SEND ${rows.length} MEMOR${rows.length === 1 ? "Y" : "IES"}`}
                  </button>
                </div>
              </>
            )}

            <p className="micro text-taupe/80 text-center mt-7 leading-relaxed">
              Everything uploads to a private album — guests can add their own but never see anyone else&apos;s.
              <br />
              Tag {hashtag || "the couple"} when you post, too!
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
