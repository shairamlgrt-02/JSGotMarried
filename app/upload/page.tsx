"use client";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTable } from "@/lib/hooks";
import { fullDate } from "@/components/public/Envelope";
import { countNewMoments, deleteMoment, loadMoments, publishMoment, updateMoment, type WeddingMoment } from "@/lib/moments";
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

type DraftMedia = {
  file: File;
  previewUrl: string;
  path?: string;
  progress: number;
  status: "waiting" | "uploading" | "uploaded" | "error";
};

const MAX_POST_MEDIA = 8;
const firstName = (name: string) => name.trim().split(/\s+/)[0] || "A guest";
const POSTER_TONES = [
  { ink: "#6B1D2A", edge: "#D8A7A8", wash: "#F8ECEA", deep: "#8F4650" },
  { ink: "#47614D", edge: "#A9BEA9", wash: "#EDF3EC", deep: "#607E65" },
  { ink: "#9A604E", edge: "#E0BDA9", wash: "#FAF0E9", deep: "#BA806B" },
  { ink: "#67547D", edge: "#C6B8D3", wash: "#F2EEF6", deep: "#88749E" },
  { ink: "#8A6B2D", edge: "#D9C68D", wash: "#F7F2E2", deep: "#A98943" },
  { ink: "#35666A", edge: "#A1C5C3", wash: "#EAF3F2", deep: "#548487" },
];
const posterTone = (name: string) => {
  const hash = [...name].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return POSTER_TONES[hash % POSTER_TONES.length]!;
};
const mediaContentType = (file: File) => {
  if (file.type) return file.type;
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "heic") return "image/heic";
  if (extension === "heif") return "image/heif";
  if (extension === "mov") return "video/quicktime";
  return "application/octet-stream";
};
function relativeTime(value: string) {
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return "just now";
  const minutes = Math.max(0, Math.floor((Date.now() - time) / 60_000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function MomentMediaGrid({ post, expanded, onExpand }: { post: WeddingMoment; expanded: boolean; onExpand: () => void }) {
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const visible = expanded ? post.media : post.media.slice(0, 4);
  const overflow = post.media.length - visible.length;
  const current = previewIndex === null ? undefined : post.media[previewIndex];
  const movePreview = useCallback((direction: 1 | -1) => {
    setPreviewIndex((index) => index === null ? null : (index + direction + post.media.length) % post.media.length);
  }, [post.media.length]);

  useEffect(() => {
    if (previewIndex === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreviewIndex(null);
      if (event.key === "ArrowRight") movePreview(1);
      if (event.key === "ArrowLeft") movePreview(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previewIndex, movePreview]);

  return (
    <>
      <div className={`mt-3 grid gap-1.5 overflow-hidden rounded-2xl ${visible.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
        {visible.map((media, index) => (
          <div key={`${post.id}-${index}`} className={`relative overflow-hidden bg-ink/5 ${visible.length === 1 ? "aspect-[4/3] max-h-[340px]" : "aspect-square"}`}>
            <button type="button" onClick={() => setPreviewIndex(index)} className="absolute inset-0 h-full w-full" aria-label={`Open ${media.contentType.startsWith("video/") ? "video" : "photo"} ${index + 1}`}>
              {media.contentType.startsWith("video/") ? (
                <video src={media.url} muted playsInline preload="metadata" className="h-full w-full object-cover" />
              ) : (
                <img src={media.url} alt={`Shared moment ${index + 1}`} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.02]" />
              )}
              {media.contentType.startsWith("video/") && <span className="absolute inset-0 grid place-items-center text-4xl text-white drop-shadow">▶</span>}
              {post.overlayText && <span className="pointer-events-none absolute inset-x-2 bottom-2 line-clamp-2 rounded-lg bg-ink/55 px-3 py-2 text-center font-serif text-sm text-white shadow backdrop-blur-sm">{post.overlayText}</span>}
            </button>
            {overflow > 0 && index === visible.length - 1 && (
              <button type="button" onClick={onExpand} className="absolute inset-0 z-10 grid place-items-center bg-ink/65 text-white transition-colors hover:bg-ink/75" aria-label={`Show ${overflow} more photos or videos`}>
                <span className="font-serif text-4xl">+{overflow}</span>
                <span className="micro absolute mt-16 tracking-[0.16em]">MORE MOMENTS</span>
              </button>
            )}
          </div>
        ))}
      </div>
      {!expanded && post.media.length > 4 && (
        <button type="button" onClick={onExpand} className="micro mt-2 text-wine underline underline-offset-4">Show all {post.media.length} moments</button>
      )}
      <AnimatePresence>
        {current && typeof document !== "undefined" && createPortal(
          <motion.div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#17110f]/95 p-3 text-white sm:p-6" role="dialog" aria-modal="true" aria-label="Photo or video preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPreviewIndex(null)}>
            <div className="relative flex h-[min(88vh,850px)] w-full max-w-5xl flex-col items-center justify-center" onClick={(event) => event.stopPropagation()}>
              <div className="absolute right-0 top-0 z-20 flex items-center gap-3">
                <span className="rounded-full bg-black/35 px-3 py-1 text-xs">{(previewIndex ?? 0) + 1} / {post.media.length}</span>
                <button type="button" onClick={() => setPreviewIndex(null)} className="grid h-10 w-10 place-items-center rounded-full bg-black/45 text-2xl" aria-label="Close photo preview">×</button>
              </div>
              <button type="button" onClick={() => movePreview(-1)} className="absolute left-0 z-20 grid h-12 w-12 place-items-center rounded-full bg-black/40 text-2xl hover:bg-black/65" aria-label="Previous photo">‹</button>
              {current.contentType.startsWith("video/") ? <video key={current.url} src={current.url} controls autoPlay playsInline className="max-h-full max-w-[88%] object-contain" /> : <img key={current.url} src={current.url} alt={`Shared moment ${(previewIndex ?? 0) + 1}`} className="max-h-full max-w-[88%] object-contain" />}
              <button type="button" onClick={() => movePreview(1)} className="absolute right-0 z-20 grid h-12 w-12 place-items-center rounded-full bg-black/40 text-2xl hover:bg-black/65" aria-label="Next photo">›</button>
              {post.overlayText && <p className="absolute bottom-5 left-16 right-16 rounded-xl bg-black/55 px-4 py-3 text-center font-serif text-lg shadow-lg backdrop-blur-sm">{post.overlayText}</p>}
            </div>
          </motion.div>,
          document.body,
        )}
      </AnimatePresence>
    </>
  );
}

function MomentCard({ post, expanded, onExpand, onEdit, onDelete }: { post: WeddingMoment; expanded: boolean; onExpand: () => void; onEdit: (post: WeddingMoment) => void; onDelete: (post: WeddingMoment) => void }) {
  const initials = post.displayName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "♡";
  const tone = posterTone(post.displayName);
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="rounded-[24px] border border-t-4 p-4 shadow-[0_16px_34px_-24px_rgba(61,35,45,.42)] transition-shadow hover:shadow-[0_20px_42px_-24px_rgba(61,35,45,.5)] sm:p-5"
      style={{ borderColor: tone.edge, borderTopColor: tone.ink, backgroundColor: "#FFFCF8" }}
    >
      <header className="flex items-center gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full border font-serif shadow-sm" style={{ backgroundColor: tone.wash, borderColor: tone.edge, color: tone.ink }}>
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium" style={{ color: tone.ink }}>{post.displayName}</p>
          <p className="micro mt-0.5 text-taupe">{relativeTime(post.createdAt)} <span aria-hidden>·</span> shared a moment</p>
        </div>
        {post.canManage ? (
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" onClick={() => onEdit(post)} className="micro text-taupe hover:text-wine">EDIT</button>
            <button type="button" onClick={() => onDelete(post)} className="micro text-taupe hover:text-burgundy" aria-label="Delete your post">DELETE</button>
          </div>
        ) : <span className="script text-2xl" style={{ color: tone.deep }} aria-hidden>♡</span>}
      </header>
      {post.body && <p className="mt-3 whitespace-pre-wrap break-words text-[15px] leading-relaxed text-ink/85">{post.body}</p>}
      {post.media.length > 0 && <MomentMediaGrid post={post} expanded={expanded} onExpand={onExpand} />}
      <footer className="mt-3 flex items-center gap-2 border-t pt-2.5 text-[10px] tracking-[0.08em] text-taupe/80" style={{ borderColor: `${tone.edge}88` }}>
        <span className="text-sm" style={{ color: tone.deep }} aria-hidden>✦</span> A little piece of the day, shared with love
      </footer>
    </motion.article>
  );
}

function EditMomentDialog({ post, onClose, onSave }: { post: WeddingMoment; onClose: () => void; onSave: (body: string, overlayText: string) => Promise<void> }) {
  const [body, setBody] = useState(post.body);
  const [overlayText, setOverlayText] = useState(post.overlayText);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const save = async () => {
    setSaving(true);
    setError("");
    try { await onSave(body, overlayText); } catch (e) { setError((e as Error).message); } finally { setSaving(false); }
  };
  return (
    <motion.div className="fixed inset-0 z-[120] flex items-center justify-center bg-ink/65 p-4" role="dialog" aria-modal="true" aria-labelledby="edit-moment-title" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div initial={{ y: 8, scale: 0.98 }} animate={{ y: 0, scale: 1 }} onClick={(event) => event.stopPropagation()} className="w-full max-w-lg rounded-2xl bg-paper p-5 shadow-2xl sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div><p className="micro tracking-[0.18em] text-taupe">YOUR MOMENT</p><h2 id="edit-moment-title" className="mt-1 font-serif text-2xl text-mocha">Edit post</h2></div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full text-2xl text-taupe hover:bg-ink/5" aria-label="Close edit dialog">×</button>
        </div>
        <label className="micro mb-1 block text-taupe" htmlFor="edit-moment-body">Caption or note</label>
        <textarea id="edit-moment-body" value={body} onChange={(event) => setBody(event.target.value.slice(0, 1200))} rows={5} maxLength={1200} className="w-full resize-y rounded-xl border border-taupe/25 bg-white/80 p-3 text-sm leading-relaxed text-ink outline-none focus:border-wine/50" />
        {post.media.length > 0 && <div className="mt-3"><label className="micro mb-1 block text-taupe" htmlFor="edit-moment-overlay">Text over your photo/video</label><input id="edit-moment-overlay" value={overlayText} onChange={(event) => setOverlayText(event.target.value.slice(0, 120))} maxLength={120} className="w-full rounded-xl border border-taupe/25 bg-white/80 px-3 py-2 text-sm outline-none focus:border-wine/50" /></div>}
        {error && <p role="alert" className="mt-3 text-sm text-burgundy">{error}</p>}
        <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={onClose} disabled={saving} className="micro rounded-full border border-taupe/30 px-4 py-2 text-taupe">CANCEL</button><button type="button" onClick={() => void save()} disabled={saving} className="micro rounded-full bg-wine px-5 py-2 text-lace disabled:opacity-50">{saving ? "SAVING…" : "SAVE CHANGES"}</button></div>
      </motion.div>
    </motion.div>
  );
}

type StoryItem = {
  id: string;
  media: WeddingMoment["media"][number];
  body: string;
  overlayText: string;
  createdAt: string;
  post: WeddingMoment;
};
type StoryGroup = { key: string; displayName: string; items: StoryItem[]; latestAt: string };

function StoriesRail({ posts, onEdit, onDelete }: { posts: WeddingMoment[]; onEdit: (post: WeddingMoment) => void; onDelete: (post: WeddingMoment) => void }) {
  const [active, setActive] = useState<{ group: number; item: number } | null>(null);
  const groups = useMemo(() => {
    const byName = new Map<string, StoryGroup>();
    for (const post of posts) {
      if (!post.media.length) continue;
      const key = post.displayName.trim().toLocaleLowerCase();
      let group = byName.get(key);
      if (!group) {
        group = { key, displayName: post.displayName, items: [], latestAt: post.createdAt };
        byName.set(key, group);
      }
      if (new Date(post.createdAt).getTime() > new Date(group.latestAt).getTime()) group.latestAt = post.createdAt;
      post.media.forEach((media, index) => group!.items.push({
        id: `${post.id}-${index}`,
        media,
        body: post.body,
        overlayText: post.overlayText,
        createdAt: post.createdAt,
        post,
      }));
    }
    return [...byName.values()]
      .map((group) => ({ ...group, items: group.items.sort((a, b) => a.createdAt.localeCompare(b.createdAt)) }))
      .sort((a, b) => b.latestAt.localeCompare(a.latestAt));
  }, [posts]);

  const currentGroup = active ? groups[active.group] : undefined;
  const currentItem = currentGroup?.items[active?.item ?? 0];
  const advance = useCallback((direction: 1 | -1 = 1) => {
    setActive((current) => {
      if (!current) return current;
      const group = groups[current.group];
      if (!group) return null;
      const next = current.item + direction;
      if (next >= 0 && next < group.items.length) return { ...current, item: next };
      const nextGroup = current.group + direction;
      if (nextGroup >= 0 && nextGroup < groups.length) {
        return { group: nextGroup, item: direction > 0 ? 0 : groups[nextGroup].items.length - 1 };
      }
      return null;
    });
  }, [groups]);

  useEffect(() => {
    if (!currentItem || currentItem.media.contentType.startsWith("video/")) return;
    const timer = window.setTimeout(() => advance(), 5200);
    return () => window.clearTimeout(timer);
  }, [active, currentItem, advance]);

  useEffect(() => {
    if (!active) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActive(null);
      if (event.key === "ArrowRight") advance();
      if (event.key === "ArrowLeft") advance(-1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active, advance]);

  if (!groups.length) return null;
  return (
    <section aria-label="Stories from guests" className="mb-5 overflow-hidden rounded-[22px] border border-[#D8B9AE] bg-[#FBF3EF] px-3 py-3 shadow-[0_12px_30px_-22px_rgba(107,29,42,.45)] sm:px-4 sm:py-4">
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2.5"><span className="grid h-8 w-8 place-items-center rounded-full bg-[#6B1D2A] text-sm text-[#F8EBCF] shadow-sm" aria-hidden>✦</span><div><h2 className="font-serif text-lg leading-none text-[#6B1D2A]">Stories</h2><p className="script mt-0.5 text-xl leading-none text-[#9A6D6A]">little glimpses, shared with love</p></div></div>
        <span className="micro hidden rounded-full border border-[#B4C5AE] bg-white/60 px-3 py-1 text-[#526B56] sm:block">MOMENTS FROM EVERYONE</span>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-1 [scrollbar-width:thin]">
        {groups.map((group, index) => {
          const first = group.items[0];
          const tone = posterTone(group.displayName);
          const initials = group.displayName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "♡";
          return (
            <button key={group.key} type="button" onClick={() => setActive({ group: index, item: 0 })} className="group flex w-[72px] shrink-0 flex-col items-center gap-1.5 text-center">
              <span className="relative grid h-[66px] w-[66px] place-items-center rounded-full p-[3px] shadow-[0_5px_12px_-8px_rgba(51,39,31,.8)] transition-transform group-hover:scale-105" style={{ background: `conic-gradient(from 220deg,${tone.ink},#E5C982,${tone.deep},#D7A7A8,${tone.ink})` }}>
                <span className="relative grid h-full w-full place-items-center overflow-hidden rounded-full border-2 border-white font-serif" style={{ backgroundColor: tone.wash, color: tone.ink }}>
                  {first.media.contentType.startsWith("image/") ? <img src={first.media.url} alt="" className="h-full w-full object-cover" loading="lazy" /> : <span className="text-xl">{initials}</span>}
                </span>
                {group.items.some((item) => item.media.contentType.startsWith("video/")) && <span className="absolute bottom-0 right-0 grid h-5 w-5 place-items-center rounded-full border-2 border-white text-[9px] text-white" style={{ backgroundColor: tone.ink }}>▶</span>}
              </span>
              <span className="w-full truncate text-[11px] font-medium" style={{ color: tone.ink }}>{firstName(group.displayName)}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {active && currentGroup && currentItem && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#17110f]/95 p-3 text-white sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-label={`${currentGroup.displayName}'s stories`}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setActive(null)}
          >
            <motion.div initial={{ scale: 0.98, y: 8 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.98 }} onClick={(event) => event.stopPropagation()} className="relative flex h-[min(82vh,760px)] w-full max-w-[430px] flex-col overflow-hidden rounded-[26px] bg-[#241b19] shadow-2xl">
              <div className="absolute inset-x-3 top-3 z-20 flex gap-1">
                {currentGroup.items.map((item, index) => <span key={item.id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/35"><span className={`block h-full rounded-full ${index <= (active?.item ?? 0) ? "bg-white" : "bg-transparent"}`} /></span>)}
              </div>
              <div className="absolute inset-x-4 top-7 z-20 flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-full border border-white/50 bg-white/10 font-serif">{currentGroup.displayName.slice(0, 1).toUpperCase()}</div>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{currentGroup.displayName}</p><p className="text-[10px] text-white/65">{relativeTime(currentItem.createdAt)}</p></div>
                {currentItem.post.canManage && <>
                  <button type="button" aria-label="Edit this story" onClick={() => { onEdit(currentItem.post); setActive(null); }} className="rounded-full bg-black/30 px-2.5 py-1.5 text-[10px] tracking-wide">EDIT</button>
                  <button type="button" aria-label="Delete this story" onClick={() => { onDelete(currentItem.post); setActive(null); }} className="rounded-full bg-black/30 px-2.5 py-1.5 text-[10px] tracking-wide">DELETE</button>
                </>}
                <button type="button" aria-label="Close stories" onClick={() => setActive(null)} className="grid h-9 w-9 place-items-center rounded-full bg-black/25 text-2xl">×</button>
              </div>
              <div className="relative flex min-h-0 flex-1 items-center justify-center bg-black/25">
                <button type="button" aria-label="Previous story" onClick={() => advance(-1)} className="absolute inset-y-16 left-0 z-10 w-1/5 cursor-w-resize" />
                {currentItem.media.contentType.startsWith("video/") ? (
                  <video key={currentItem.id} src={currentItem.media.url} controls autoPlay muted playsInline onEnded={() => advance()} className="max-h-full max-w-full object-contain" />
                ) : (
                  <img key={currentItem.id} src={currentItem.media.url} alt="A shared wedding moment" className="max-h-full max-w-full object-contain" />
                )}
                <button type="button" aria-label="Next story" onClick={() => advance()} className="absolute inset-y-16 right-0 z-10 w-1/5 cursor-e-resize" />
                {currentItem.overlayText && <p className="absolute bottom-16 left-4 right-4 z-10 rounded-xl bg-black/55 px-4 py-3 text-center font-serif text-lg shadow-lg backdrop-blur-sm">{currentItem.overlayText}</p>}
              </div>
              {currentItem.body && <p className="max-h-24 overflow-y-auto px-5 py-3 text-center text-sm leading-relaxed text-white/85">{currentItem.body}</p>}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

export default function UploadPage() {
  const { rows: infoRows } = useTable("wedding_info");
  const info = infoRows[0];
  const configured = useMemo(() => mediaConfigured(), []);
  const galleryInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);
  const deviceId = useMemo(() => guestId(), []);

  const [quota, setQuota] = useState(readQuota());
  const [draftMedia, setDraftMedia] = useState<DraftMedia[]>([]);
  const draftRef = useRef(draftMedia);
  draftRef.current = draftMedia;
  const [displayName, setDisplayName] = useState("");
  const [body, setBody] = useState("");
  const [overlayText, setOverlayText] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [showInFeed, setShowInFeed] = useState(true);
  const [editingPost, setEditingPost] = useState<WeddingMoment | null>(null);
  const [posts, setPosts] = useState<WeddingMoment[]>([]);
  const [storyPosts, setStoryPosts] = useState<WeddingMoment[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [posting, setPosting] = useState(false);
  const [uploadIndex, setUploadIndex] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pulling, setPulling] = useState(false);
  const [newCount, setNewCount] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const newestAt = useRef("");
  const touchStartY = useRef<number | null>(null);

  const couple = info?.bride && info?.groom ? `${info.groom} & ${info.bride}` : "the couple";
  const hashtag = info?.hashtags?.[0] || "";
  const unuploadedDraft = draftMedia.filter((item) => !item.path);
  const draftBytes = unuploadedDraft.reduce((sum, item) => sum + item.file.size, 0);
  const remainingFiles = Math.max(0, MAX_FILES_PER_GUEST - quota.count - unuploadedDraft.length);
  const remainingBytes = Math.max(0, MAX_TOTAL_BYTES - quota.bytes - draftBytes);

  const refreshFeed = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    setError("");
    try {
      const [page, storyPage] = await Promise.all([
        loadMoments({ limit: 12, deviceId }),
        loadMoments({ limit: 48, stories: true, deviceId }),
      ]);
      setPosts(page.posts);
      setStoryPosts(storyPage.posts);
      setNextCursor(page.nextCursor);
      newestAt.current = page.posts[0]?.createdAt || new Date().toISOString();
      setNewCount(0);
    } catch (e) {
      if (!quiet) setError((e as Error).message);
    } finally {
      if (!quiet) setLoading(false);
      setPulling(false);
    }
  }, [deviceId]);

  useEffect(() => {
    try { setDisplayName(localStorage.getItem("jsos:moment-name-v1") || ""); } catch { /* private mode */ }
    void refreshFeed();
    return () => draftRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
  }, [refreshFeed]);

  useEffect(() => {
    const timer = setInterval(async () => {
      if (!newestAt.current || document.visibilityState !== "visible") return;
      const count = await countNewMoments(newestAt.current);
      if (count > 0) setNewCount(count);
    }, 60_000);
    return () => clearInterval(timer);
  }, []);

  const chooseFiles = (picked: FileList | null) => {
    if (!picked) return;
    const files = Array.from(picked);
    const quotaWithDraft = {
      count: quota.count + unuploadedDraft.length,
      bytes: quota.bytes + draftBytes,
    };
    const result = validateSelection(files, quotaWithDraft);
    const room = Math.max(0, MAX_POST_MEDIA - draftMedia.length);
    const accepted = result.accepted.slice(0, room);
    const notices = [...result.errors];
    if (result.accepted.length > room) notices.push(`One post can include up to ${MAX_POST_MEDIA} items.`);
    if (!accepted.length && files.length) setError(notices[0] || "No more media can be added to this post.");
    else setError("");
    if (notices.length) setNotice(notices.join(" "));
    if (accepted.length) {
      setComposerOpen(true);
      setDraftMedia((current) => [...current, ...accepted.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
        progress: 0,
        status: "waiting" as const,
      }))]);
    }
    if (galleryInput.current) galleryInput.current.value = "";
    if (cameraInput.current) cameraInput.current.value = "";
    if (videoInput.current) videoInput.current.value = "";
  };

  const removeDraft = (index: number) => {
    const item = draftMedia[index];
    if (item) URL.revokeObjectURL(item.previewUrl);
    const remaining = draftMedia.filter((_, i) => i !== index);
    setDraftMedia(remaining);
    if (!remaining.length) setShowInFeed(true);
  };

  const sharePost = async () => {
    if (!configured || posting || (!body.trim() && !draftMedia.length) || (!showInFeed && !draftMedia.length)) return;
    setPosting(true);
    setError("");
    setNotice("");
    try {
      const readyMedia: { path: string; contentType: string }[] = [];
      for (let i = 0; i < draftMedia.length; i++) {
        let item = draftMedia[i];
        if (!item.path) {
          const path = objectPath(item.file, deviceId);
          setUploadIndex(i);
          setUploadProgress(0);
          setDraftMedia((current) => current.map((x, n) => n === i ? { ...x, status: "uploading", progress: 0 } : x));
          await uploadMediaFile(item.file, path, (percent) => {
            setUploadProgress(percent);
            setDraftMedia((current) => current.map((x, n) => n === i ? { ...x, progress: percent } : x));
          });
          item = { ...item, path, progress: 100, status: "uploaded" };
          setDraftMedia((current) => current.map((x, n) => n === i ? item : x));
          setQuota(addToQuota([item.file]));
        }
        readyMedia.push({ path: item.path!, contentType: mediaContentType(item.file) });
      }

      const post = await publishMoment({ deviceId, displayName: displayName.trim(), body, overlayText, media: readyMedia, showInFeed });
      if (post.showInFeed) setPosts((current) => [post, ...current.filter((item) => item.id !== post.id)]);
      if (post.media.length) setStoryPosts((current) => [post, ...current.filter((item) => item.id !== post.id)]);
      newestAt.current = post.createdAt;
      setBody("");
      setOverlayText("");
      setShowInFeed(true);
      setComposerOpen(false);
      draftRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      setDraftMedia([]);
      setNotice(post.showInFeed ? "Posted to the Newsfeed and Stories — thank you for sharing it ♡" : "Posted to Stories only — it won't appear in the Newsfeed ♡");
      try { localStorage.setItem("jsos:moment-name-v1", displayName.trim()); } catch { /* private mode */ }
      window.setTimeout(() => setNotice(""), 4500);
    } catch (e) {
      setError((e as Error).message || "That didn't send — please try again.");
    } finally {
      setPosting(false);
      setUploadIndex(null);
      setUploadProgress(0);
    }
  };

  const removePost = async (post: WeddingMoment) => {
    if (!post.canManage || !window.confirm("Delete your post and its uploaded photos/videos? This can't be undone.")) return;
    setError("");
    try {
      await deleteMoment(post.id, deviceId);
      setPosts((current) => current.filter((item) => item.id !== post.id));
      setStoryPosts((current) => current.filter((item) => item.id !== post.id));
      setNotice("Your moment has been deleted.");
      window.setTimeout(() => setNotice(""), 4500);
    } catch (e) {
      setError((e as Error).message || "That moment couldn't be deleted. Please try again.");
    }
  };

  const savePostEdit = async (bodyText: string, overlay: string) => {
    if (!editingPost) return;
    const updated = await updateMoment({ id: editingPost.id, deviceId, body: bodyText, overlayText: overlay });
    setPosts((current) => current.map((item) => item.id === updated.id ? updated : item));
    setStoryPosts((current) => current.map((item) => item.id === updated.id ? updated : item));
    setEditingPost(null);
    setNotice("Your changes have been saved ♡");
    window.setTimeout(() => setNotice(""), 4500);
  };

  const loadOlder = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await loadMoments({ before: nextCursor, limit: 12, deviceId });
      setPosts((current) => {
        const seen = new Set(current.map((post) => post.id));
        return [...current, ...page.posts.filter((post) => !seen.has(post.id))];
      });
      setNextCursor(page.nextCursor);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoadingMore(false);
    }
  };

  const refreshFromTop = () => {
    setPulling(true);
    void refreshFeed();
  };

  const onTouchStart = (event: React.TouchEvent) => {
    if (window.scrollY <= 0) touchStartY.current = event.touches[0]?.clientY ?? null;
  };
  const onTouchEnd = (event: React.TouchEvent) => {
    const start = touchStartY.current;
    const end = event.changedTouches[0]?.clientY;
    touchStartY.current = null;
    if (start !== null && typeof end === "number" && end - start > 78 && window.scrollY <= 0) refreshFromTop();
  };

  return (
    <main className="relative min-h-screen paper-bg text-ink" style={{ backgroundImage: "radial-gradient(ellipse at 4% 12%,rgba(205,148,156,.13),transparent 29%),radial-gradient(ellipse at 80% 88%,rgba(218,190,126,.10),transparent 30%)" }} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="relative z-[1] mx-auto max-w-2xl px-3 pb-14 pt-4 sm:px-5 sm:pt-6">
        <header className="mb-4 flex items-center justify-between gap-4 border-b border-taupe/20 pb-3">
          <div className="min-w-0">
            <a href="/" className="micro inline-flex items-center gap-1.5 text-taupe no-underline transition-colors hover:text-wine">
              <span aria-hidden>←</span> BACK TO THE HOUSE
            </a>
            <h1 className="mt-1 font-serif text-2xl leading-tight text-wine sm:text-[1.7rem]">Memory Wall</h1>
            <p className="mt-0.5 truncate text-xs text-taupe">{info ? fullDate(info.date) : "11.11.2026"} · {couple}{hashtag ? ` · ${hashtag}` : ""}</p>
          </div>
          <span className="hidden shrink-0 font-serif text-3xl text-wine/45 sm:block" aria-hidden>♡</span>
        </header>

        <div className="mb-4 flex items-center justify-between gap-3 overflow-hidden rounded-2xl border border-[#E1C8C2] bg-[#F2E5E2] px-4 py-2.5 text-[#6B1D2A] shadow-[0_8px_20px_-16px_rgba(107,29,42,.45)] sm:px-5">
          <div className="flex min-w-0 items-center gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#D7B5AD] bg-white/60 text-lg text-[#9A604E]" aria-hidden>✦</span><p className="micro truncate !tracking-[0.16em]">YOUR DAY, THROUGH EVERYONE&apos;S EYES</p></div>
          <span className="script hidden shrink-0 text-3xl leading-none text-[#9A604E] sm:block">every moment matters</span>
        </div>

        {!configured && (
          <div className="mb-4 rounded-2xl border border-taupe/25 bg-white/70 p-5 text-center text-sm text-ink/65">
            The private album is not connected yet. Please let the couple know so they can finish the one-time setup.
          </div>
        )}

        <StoriesRail posts={storyPosts} onEdit={setEditingPost} onDelete={(post) => void removePost(post)} />

        <section aria-label="Write a post" className="mt-4 rounded-[20px] border border-[#E3D1CB] bg-[#FFFCF8] shadow-[0_10px_28px_-22px_rgba(107,29,42,.42)]">
          <input ref={galleryInput} type="file" accept={UPLOAD_ACCEPT} multiple hidden onChange={(event) => chooseFiles(event.target.files)} />
          <input ref={cameraInput} type="file" accept="image/*" capture="environment" hidden onChange={(event) => chooseFiles(event.target.files)} />
          <input ref={videoInput} type="file" accept="video/*" capture="environment" hidden onChange={(event) => chooseFiles(event.target.files)} />

          {!composerOpen ? (
            <div className="flex items-center gap-3 p-3 sm:p-4">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#D8B5AE] bg-[#F2E4E1] font-serif text-xl text-[#6B1D2A]">♡</div>
              <button type="button" onClick={() => setComposerOpen(true)} className="flex h-11 min-w-0 flex-1 items-center rounded-full border border-[#E7DAD5] bg-[#F8F5F1] px-4 text-left text-sm text-[#84766F] transition-colors hover:border-[#C99A91] hover:bg-white sm:text-base">
                What&apos;s on your mind{displayName.trim() ? `, ${firstName(displayName.trim())}` : ""}?
              </button>
              <button type="button" onClick={() => galleryInput.current?.click()} aria-label="Upload a photo or video" title="Upload a photo or video" className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-[#D8C79F] bg-[#F5EFDF] px-3.5 text-[10px] font-medium tracking-[0.1em] text-[#7B6331] transition-colors hover:bg-[#EFE4C8] sm:px-4 sm:text-xs">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-4 w-4"><path d="M4 6.5A1.5 1.5 0 0 1 5.5 5h13A1.5 1.5 0 0 1 20 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5v-11Z" stroke="currentColor" strokeWidth="1.6"/><circle cx="9" cy="9" r="1.3" fill="currentColor"/><path d="m5 17 4.4-4.6a1 1 0 0 1 1.45 0l2.1 2.2 1.5-1.5a1 1 0 0 1 1.42 0L19 16.7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                UPLOAD
              </button>
            </div>
          ) : (
            <div className="p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3 border-b border-[#E8DCD7] pb-3">
                <div className="flex items-center gap-2.5"><span className="grid h-8 w-8 place-items-center rounded-full bg-[#F2E4E1] text-[#9A604E]" aria-hidden>✧</span><div><p className="micro !tracking-[0.16em] text-[#8C6260]">SHARE A MOMENT</p><h2 className="font-serif text-xl leading-tight text-[#46362C]">What&apos;s on your mind?</h2></div></div>
                <button type="button" onClick={() => setComposerOpen(false)} aria-label="Close composer" title="Close composer" className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#E3D1CB] text-xl text-[#806F68] transition-colors hover:bg-[#F5E9E6]">×</button>
              </div>
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#D8B5AE] bg-[#F2E4E1] font-serif text-xl text-[#6B1D2A]">♡</div>
                <div className="min-w-0 flex-1">
                  <input value={displayName} onChange={(event) => setDisplayName(event.target.value.slice(0, 60))} placeholder="Your name (optional)" aria-label="Your name" className="w-full border-b border-[#E3D8D2] bg-transparent pb-2 font-serif text-lg text-mocha outline-none placeholder:text-taupe/65 focus:border-wine/50" />
                  <textarea value={body} onChange={(event) => setBody(event.target.value.slice(0, 1200))} placeholder="Leave a little note, a wish, or a moment you want to remember…" rows={3} className="mt-3 w-full resize-y bg-transparent text-[15px] leading-relaxed text-ink outline-none placeholder:text-ink/40" />
                  {draftMedia.length > 0 && (
                    <div className={`mt-3 grid gap-2 ${draftMedia.length === 1 ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-4"}`}>
                      {draftMedia.map((item, index) => (
                        <div key={`${item.file.name}-${index}`} className="relative aspect-square overflow-hidden rounded-xl bg-oat">
                          {item.file.type.startsWith("video/") ? <video src={item.previewUrl} controls playsInline className="h-full w-full object-cover" /> : <img src={item.previewUrl} alt={item.file.name} className="h-full w-full object-cover" />}
                          {overlayText && <div className="pointer-events-none absolute inset-x-2 bottom-2 rounded-lg bg-ink/55 px-2 py-1.5 text-center font-serif text-xs text-white shadow backdrop-blur-sm">{overlayText}</div>}
                          {item.status === "uploading" && <div className="absolute inset-x-0 bottom-0 bg-ink/65 p-2 text-xs text-white">Uploading {uploadIndex === index ? uploadProgress : item.progress}%<div className="mt-1 h-1 overflow-hidden rounded bg-white/30"><div className="h-full bg-white" style={{ width: `${item.progress}%` }} /></div></div>}
                          {item.status === "uploaded" && <span className="absolute bottom-2 left-2 rounded-full bg-moss/90 px-2 py-1 text-[10px] text-white">ready ✓</span>}
                          {!posting && <button type="button" onClick={() => removeDraft(index)} aria-label={`Remove ${item.file.name}`} className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-ink/65 text-sm text-white">×</button>}
                        </div>
                      ))}
                    </div>
                  )}
                  {draftMedia.length > 0 && <input value={overlayText} onChange={(event) => setOverlayText(event.target.value.slice(0, 120))} placeholder="Optional text over your photos/videos" className="mt-3 w-full rounded-xl border border-[#E5D8D2] bg-white px-3 py-2 text-xs text-ink outline-none focus:border-wine/40" />}
                  <p className="mt-2 text-right text-[10px] text-taupe/70">{body.length}/1200</p>
                </div>
              </div>

              <div className="mt-4 border-t border-[#E8DCD7] pt-3">
                <div className="grid grid-cols-3 gap-2">
                  <button type="button" title="Upload photos or videos" aria-label="Upload photos or videos" onClick={() => galleryInput.current?.click()} className="micro flex min-w-0 items-center justify-center gap-1.5 rounded-full border border-[#D8C7C1] bg-white px-2 py-2 text-[9px] text-[#70434A] transition-colors hover:bg-[#F7ECE9] sm:gap-2 sm:px-3 sm:text-[10px]">
                    <span aria-hidden>▧</span><span className="truncate">Upload</span>
                  </button>
                  <button type="button" title="Take a photo" aria-label="Take a photo" onClick={() => cameraInput.current?.click()} className="micro flex min-w-0 items-center justify-center gap-1.5 rounded-full border border-[#D8C7C1] bg-white px-2 py-2 text-[9px] text-[#70434A] transition-colors hover:bg-[#F7ECE9] sm:gap-2 sm:px-3 sm:text-[10px]">
                    <span aria-hidden>◉</span><span className="truncate">Photo</span>
                  </button>
                  <button type="button" title="Record a video" aria-label="Record a video" onClick={() => videoInput.current?.click()} className="micro flex min-w-0 items-center justify-center gap-1.5 rounded-full border border-[#D8C7C1] bg-white px-2 py-2 text-[9px] text-[#70434A] transition-colors hover:bg-[#F7ECE9] sm:gap-2 sm:px-3 sm:text-[10px]">
                    <span aria-hidden>▷</span><span className="truncate">Video</span>
                  </button>
                </div>
                {draftMedia.length > 0 && <label className="mt-3 flex cursor-pointer items-start gap-2 rounded-xl bg-[#F8F2E7] px-3 py-2.5 text-sm text-ink/75"><input type="checkbox" checked={showInFeed} onChange={(event) => setShowInFeed(event.target.checked)} className="mt-0.5 accent-burgundy" /><span><b>Also show this in the Newsfeed</b><span className="block text-xs text-taupe">Uncheck to share it as a Story only.</span></span></label>}
                <div className="mt-3 flex justify-end">
                  <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={() => void sharePost()} disabled={posting || !configured || (!body.trim() && draftMedia.length === 0) || (!showInFeed && draftMedia.length === 0)} className="micro inline-flex min-w-32 items-center justify-center gap-2 rounded-full bg-[#6B1D2A] px-6 py-2.5 tracking-[0.12em] text-white shadow-sm transition-colors hover:bg-[#4E1722] disabled:cursor-not-allowed disabled:opacity-45">
                    {posting ? "POSTING…" : <><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-4 w-4"><path d="M21 3 10.8 13.2M21 3l-6.5 18-3.7-7.8L3 9.5 21 3Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>POST</>}
                  </motion.button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[10px] text-taupe/75"><span>{MAX_POST_MEDIA} items per post · {MAX_FILES_PER_GUEST} files per device</span><span>{formatBytes(quota.bytes + draftBytes)} of {formatBytes(MAX_TOTAL_BYTES)} used · private album</span></div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink/8"><div className="h-full rounded-full bg-wine/60 transition-all" style={{ width: `${Math.min(100, Math.round(((quota.bytes + draftBytes) / MAX_TOTAL_BYTES) * 100))}%` }} /></div>
            </div>
          )}
          {error && <p role="alert" className="m-3 rounded-xl bg-burgundy/10 px-3 py-2 text-sm text-burgundy">{error}</p>}
          {notice && <motion.p role="status" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="m-3 rounded-xl bg-[#EDF2E9] px-3 py-2 text-sm text-[#526B56]">{notice}</motion.p>}
        </section>

        <section aria-label="Wedding moments" className="mt-7">
          <div className="mb-4 flex items-center justify-between gap-3 px-1">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[#D8B5AE] bg-[#F2E4E1] text-xl text-[#8B4A53]" aria-hidden>✦</span>
              <div className="min-w-0">
                <p className="micro tracking-[0.2em] text-[#815861]">THE SHARED ALBUM</p>
                <h2 className="mt-0.5 font-serif text-2xl leading-none text-[#46362C]">Newsfeed</h2>
                <p className="mt-1 text-xs text-taupe">Little notes and moments from everyone</p>
              </div>
            </div>
            <button type="button" onClick={refreshFromTop} disabled={loading || pulling} className="micro shrink-0 rounded-full border border-[#D7C28D] bg-[#F7F0DE] px-3 py-2 text-[#80662E] shadow-sm transition-colors hover:border-[#6B1D2A] hover:bg-[#6B1D2A] hover:text-white disabled:opacity-50">
              {pulling ? "REFRESHING…" : "↻ REFRESH"}
            </button>
          </div>

          <AnimatePresence>
            {newCount > 0 && (
              <motion.button
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                type="button"
                onClick={refreshFromTop}
                className="mb-4 w-full rounded-2xl border border-[#D8B5AE] bg-[#F2E4E1] py-3 font-serif text-[#6B1D2A] shadow-[0_10px_24px_-16px_rgba(107,29,42,.3)] transition-colors hover:bg-[#EBD6D2]"
              >
                {newCount} new {newCount === 1 ? "moment" : "moments"} · tap to see ♡
              </motion.button>
            )}
          </AnimatePresence>

          {pulling && <p className="mb-3 text-center text-xs text-wine/70">Gathering the newest moments…</p>}
          {error && posts.length === 0 && <p className="rounded-2xl bg-white/70 p-5 text-center text-sm text-ink/55">The shared album is getting ready. Please try refreshing in a moment.</p>}
          {loading ? (
            <div className="space-y-4" aria-label="Loading moments">
              {[0, 1, 2].map((item) => <div key={item} className="h-48 animate-pulse rounded-[24px] bg-white/55" />)}
            </div>
          ) : posts.length ? (
            <div className="space-y-4">
              <AnimatePresence initial={false}>
                {posts.map((post) => (
                  <MomentCard
                    key={post.id}
                    post={post}
                    expanded={expandedIds.has(post.id)}
                    onExpand={() => setExpandedIds((current) => new Set(current).add(post.id))}
                    onEdit={setEditingPost}
                    onDelete={(item) => void removePost(item)}
                  />
                ))}
              </AnimatePresence>
              {nextCursor && (
                <button type="button" onClick={() => void loadOlder()} disabled={loadingMore} className="micro block w-full rounded-full border border-taupe/25 bg-white/65 py-3 text-taupe transition-colors hover:border-wine hover:text-wine disabled:opacity-50">
                  {loadingMore ? "LOADING…" : "OLDER MOMENTS  ↓"}
                </button>
              )}
            </div>
          ) : !error ? (
            <div className="relative overflow-hidden rounded-[26px] border border-[#D6B7AD] bg-[#FBF5F0] px-6 py-10 text-center shadow-[0_18px_38px_-28px_rgba(107,29,42,.35)]">
              <span className="absolute -left-5 -top-8 h-24 w-24 rounded-full bg-[#D9AFB0]/25 blur-xl" aria-hidden />
              <span className="absolute -bottom-10 -right-2 h-28 w-28 rounded-full bg-[#AFC2A8]/30 blur-xl" aria-hidden />
              <div className="relative mx-auto mb-4 grid h-16 w-16 place-items-center rounded-[22px] border border-[#D7C18E] bg-white/75 text-3xl text-[#9A604E] shadow-sm" aria-hidden>✿</div>
              <p className="relative font-serif text-2xl text-[#6B1D2A]">Every memory starts somewhere</p>
              <p className="relative mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink/60">No Newsfeed posts yet. Share a note, or include a Story in the Newsfeed when you post.</p>
              <div className="relative mt-5 flex flex-wrap justify-center gap-2 text-[10px] tracking-wide">
                <span className="rounded-full bg-[#F4E2E1] px-3 py-1.5 text-[#7C3945]">A little note</span><span className="rounded-full bg-[#E9F0E6] px-3 py-1.5 text-[#526B56]">A favorite photo</span><span className="rounded-full bg-[#F4EEDB] px-3 py-1.5 text-[#80662E]">A bit of joy</span>
              </div>
            </div>
          ) : null}
        </section>

        <footer className="mt-10 text-center">
          <p className="micro text-taupe/75">{remainingFiles} uploads left on this device · {formatBytes(remainingBytes)} remaining</p>
          <p className="mt-2 font-serif text-xs italic text-taupe/70">A private little album for {firstName(couple)} and everyone who loves them.</p>
        </footer>
      </div>
      <AnimatePresence>
        {editingPost && <EditMomentDialog key={editingPost.id} post={editingPost} onClose={() => setEditingPost(null)} onSave={savePostEdit} />}
      </AnimatePresence>
    </main>
  );
}
