"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTable } from "@/lib/hooks";
import { fullDate } from "@/components/public/Envelope";
import { countNewMoments, loadMoments, publishMoment, type WeddingMoment } from "@/lib/moments";
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
  const visible = expanded ? post.media : post.media.slice(0, 4);
  const overflow = post.media.length - visible.length;
  return (
    <div className={`mt-3 grid gap-1.5 overflow-hidden rounded-2xl ${visible.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
      {visible.map((media, index) => (
        <div
          key={`${post.id}-${index}`}
          className={`relative overflow-hidden bg-ink/5 ${visible.length === 1 ? "max-h-[620px]" : "aspect-square"}`}
        >
          {media.contentType.startsWith("video/") ? (
            <video
              src={media.url}
              controls
              playsInline
              preload="metadata"
              className={`h-full w-full object-cover ${visible.length === 1 ? "max-h-[620px]" : "absolute inset-0"}`}
            />
          ) : (
            <img src={media.url} alt={`Shared moment ${index + 1}`} loading="lazy" className="h-full w-full object-cover" />
          )}
          {post.overlayText && (
            <div className="pointer-events-none absolute inset-x-2 bottom-2 rounded-lg bg-ink/55 px-3 py-2 text-center font-serif text-sm text-white shadow backdrop-blur-sm">
              {post.overlayText}
            </div>
          )}
          {overflow > 0 && index === visible.length - 1 && (
            <button
              type="button"
              onClick={onExpand}
              className="absolute inset-0 grid place-items-center bg-ink/65 text-white transition-colors hover:bg-ink/75"
              aria-label={`Show ${overflow} more photos or videos`}
            >
              <span className="font-serif text-4xl">+{overflow}</span>
              <span className="micro absolute mt-16 tracking-[0.16em]">MORE MOMENTS</span>
            </button>
          )}
        </div>
      ))}
      {!expanded && post.media.length > 4 && overflow === 0 && (
        <button type="button" onClick={onExpand} className="micro mt-1 text-wine underline underline-offset-4">
          Show all {post.media.length} moments
        </button>
      )}
    </div>
  );
}

function MomentCard({ post, expanded, onExpand }: { post: WeddingMoment; expanded: boolean; onExpand: () => void }) {
  const initials = post.displayName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "♡";
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="rounded-[24px] border border-taupe/20 bg-white/85 p-4 shadow-[0_12px_28px_-22px_rgba(61,47,38,.55)] sm:p-5"
    >
      <header className="flex items-center gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-wine/15 bg-[linear-gradient(145deg,#EFE3D3,#FBF8F2)] font-serif text-wine">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-mocha">{post.displayName}</p>
          <p className="micro mt-0.5 text-taupe">{relativeTime(post.createdAt)}</p>
        </div>
        <span className="script text-2xl text-wine/55" aria-hidden>♡</span>
      </header>
      {post.body && <p className="mt-3 whitespace-pre-wrap break-words text-[15px] leading-relaxed text-ink/85">{post.body}</p>}
      {post.media.length > 0 && <MomentMediaGrid post={post} expanded={expanded} onExpand={onExpand} />}
      <footer className="micro mt-3 flex items-center gap-2 text-taupe/75">
        <span aria-hidden>✦</span> A little piece of the day, shared with love
      </footer>
    </motion.article>
  );
}

type StoryItem = {
  id: string;
  media: WeddingMoment["media"][number];
  body: string;
  overlayText: string;
  createdAt: string;
};
type StoryGroup = { key: string; displayName: string; items: StoryItem[]; latestAt: string };

function StoriesRail({ posts }: { posts: WeddingMoment[] }) {
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
    <section aria-label="Stories from guests" className="mb-5 overflow-hidden rounded-2xl border border-taupe/20 bg-white/75 px-3 py-3 shadow-sm sm:px-4">
      <div className="mb-2 flex items-center justify-between px-1">
        <h2 className="font-serif text-lg text-mocha">Stories</h2>
        <span className="micro text-taupe">MOMENTS FROM EVERYONE</span>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-1 [scrollbar-width:thin]">
        {groups.map((group, index) => {
          const first = group.items[0];
          const initials = group.displayName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "♡";
          return (
            <button key={group.key} type="button" onClick={() => setActive({ group: index, item: 0 })} className="group flex w-[68px] shrink-0 flex-col items-center gap-1.5 text-center">
              <span className="relative grid h-[62px] w-[62px] place-items-center rounded-full bg-[conic-gradient(from_220deg,#8b3d50,#e7c6a2,#a07b52,#8b3d50)] p-[2px] transition-transform group-hover:scale-105">
                <span className="relative grid h-full w-full place-items-center overflow-hidden rounded-full border-2 border-white bg-[#efe3d3] font-serif text-wine">
                  {first.media.contentType.startsWith("image/") ? <img src={first.media.url} alt="" className="h-full w-full object-cover" loading="lazy" /> : <span className="text-xl">{initials}</span>}
                </span>
                {group.items.some((item) => item.media.contentType.startsWith("video/")) && <span className="absolute bottom-0 right-0 grid h-5 w-5 place-items-center rounded-full border-2 border-white bg-wine text-[9px] text-white">▶</span>}
              </span>
              <span className="w-full truncate text-[11px] text-ink/75">{firstName(group.displayName)}</span>
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
  const [posts, setPosts] = useState<WeddingMoment[]>([]);
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
      const page = await loadMoments({ limit: 12 });
      setPosts(page.posts);
      setNextCursor(page.nextCursor);
      newestAt.current = page.posts[0]?.createdAt || new Date().toISOString();
      setNewCount(0);
    } catch (e) {
      if (!quiet) setError((e as Error).message);
    } finally {
      if (!quiet) setLoading(false);
      setPulling(false);
    }
  }, []);

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
    setDraftMedia((current) => current.filter((_, i) => i !== index));
  };

  const sharePost = async () => {
    if (!configured || posting || (!body.trim() && !draftMedia.length)) return;
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

      const post = await publishMoment({ deviceId, displayName: displayName.trim(), body, overlayText, media: readyMedia });
      setPosts((current) => [post, ...current.filter((item) => item.id !== post.id)]);
      newestAt.current = post.createdAt;
      setBody("");
      setOverlayText("");
      draftRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      setDraftMedia([]);
      setNotice("Your moment is in the album — thank you for sharing it ♡");
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

  const loadOlder = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await loadMoments({ before: nextCursor, limit: 12 });
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
    <main className="min-h-screen paper-bg text-ink" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="mx-auto max-w-2xl px-3 pb-14 pt-4 sm:px-5 sm:pt-6">
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

        {!configured && (
          <div className="mb-4 rounded-2xl border border-taupe/25 bg-white/70 p-5 text-center text-sm text-ink/65">
            The private album is not connected yet. Please let the couple know so they can finish the one-time setup.
          </div>
        )}

        <StoriesRail posts={posts} />

        <section aria-label="Write a post" className="mt-4 rounded-[22px] border border-taupe/25 bg-[#FCFAF6] p-4 shadow-[0_14px_36px_-24px_rgba(61,47,38,.55)] sm:p-6">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-wine text-lace font-serif text-xl">♡</div>
            <div className="min-w-0 flex-1">
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value.slice(0, 60))}
                placeholder="Your name (optional)"
                aria-label="Your name"
                className="w-full border-b border-taupe/20 bg-transparent pb-2 font-serif text-lg text-mocha outline-none placeholder:text-taupe/55 focus:border-wine/50"
              />
              <textarea
                value={body}
                onChange={(event) => setBody(event.target.value.slice(0, 1200))}
                placeholder="Leave a little note, a wish, or a moment you want to remember…"
                rows={3}
                className="mt-3 w-full resize-y bg-transparent text-[15px] leading-relaxed text-ink outline-none placeholder:text-ink/40"
              />
              {draftMedia.length > 0 && (
                <div className={`mt-3 grid gap-2 ${draftMedia.length === 1 ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-4"}`}>
                  {draftMedia.map((item, index) => (
                    <div key={`${item.file.name}-${index}`} className="relative aspect-square overflow-hidden rounded-xl bg-oat">
                      {item.file.type.startsWith("video/") ? (
                        <video src={item.previewUrl} controls playsInline className="h-full w-full object-cover" />
                      ) : (
                        <img src={item.previewUrl} alt={item.file.name} className="h-full w-full object-cover" />
                      )}
                      {overlayText && <div className="pointer-events-none absolute inset-x-2 bottom-2 rounded-lg bg-ink/55 px-2 py-1.5 text-center font-serif text-xs text-white shadow backdrop-blur-sm">{overlayText}</div>}
                      {item.status === "uploading" && (
                        <div className="absolute inset-x-0 bottom-0 bg-ink/65 p-2 text-xs text-white">
                          Uploading {uploadIndex === index ? uploadProgress : item.progress}%
                          <div className="mt-1 h-1 overflow-hidden rounded bg-white/30"><div className="h-full bg-white" style={{ width: `${item.progress}%` }} /></div>
                        </div>
                      )}
                      {item.status === "uploaded" && <span className="absolute bottom-2 left-2 rounded-full bg-moss/90 px-2 py-1 text-[10px] text-white">ready ✓</span>}
                      {!posting && <button type="button" onClick={() => removeDraft(index)} aria-label={`Remove ${item.file.name}`} className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-ink/65 text-sm text-white">×</button>}
                    </div>
                  ))}
                </div>
              )}
              {draftMedia.length > 0 && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="script text-xl text-wine">✧</span>
                  <input
                    value={overlayText}
                    onChange={(event) => setOverlayText(event.target.value.slice(0, 120))}
                    placeholder="Optional feed overlay (your original stays unchanged)"
                    className="min-w-0 flex-1 rounded-full border border-taupe/20 bg-white/70 px-3 py-2 text-xs text-ink outline-none focus:border-wine/40"
                  />
                </div>
              )}
              <p className="mt-2 text-right text-[10px] text-taupe/70">{body.length}/1200</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-taupe/15 pt-4">
            <div className="flex flex-wrap gap-2">
              <input ref={galleryInput} type="file" accept={UPLOAD_ACCEPT} multiple hidden onChange={(event) => chooseFiles(event.target.files)} />
              <input ref={cameraInput} type="file" accept="image/*" capture="environment" hidden onChange={(event) => chooseFiles(event.target.files)} />
              <input ref={videoInput} type="file" accept="video/*" capture="environment" hidden onChange={(event) => chooseFiles(event.target.files)} />
              <button type="button" onClick={() => galleryInput.current?.click()} className="micro rounded-full border border-wine/20 px-3.5 py-2 text-wine transition-colors hover:bg-wine/[0.05]">
                ▧ Photos / videos
              </button>
              <button type="button" onClick={() => cameraInput.current?.click()} className="micro rounded-full border border-wine/20 px-3.5 py-2 text-wine transition-colors hover:bg-wine/[0.05]">
                ◉ Take a photo
              </button>
              <button type="button" onClick={() => videoInput.current?.click()} className="micro rounded-full border border-wine/20 px-3.5 py-2 text-wine transition-colors hover:bg-wine/[0.05]">
                ▷ Record video
              </button>
            </div>
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => void sharePost()}
              disabled={posting || !configured || (!body.trim() && draftMedia.length === 0)}
              className="micro rounded-full bg-wine px-6 py-3 tracking-[0.12em] text-lace shadow-sm transition-colors hover:bg-mocha disabled:cursor-not-allowed disabled:opacity-45"
            >
              {posting ? "SHARING…" : "SHARE A MOMENT  ♡"}
            </motion.button>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[10px] text-taupe/75">
            <span>{MAX_POST_MEDIA} items per post · {MAX_FILES_PER_GUEST} files per device</span>
            <span>{formatBytes(quota.bytes + draftBytes)} of {formatBytes(MAX_TOTAL_BYTES)} used · private album</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink/8"><div className="h-full rounded-full bg-wine/60 transition-all" style={{ width: `${Math.min(100, Math.round(((quota.bytes + draftBytes) / MAX_TOTAL_BYTES) * 100))}%` }} /></div>
          {error && <p role="alert" className="mt-3 rounded-xl bg-burgundy/10 px-3 py-2 text-sm text-burgundy">{error}</p>}
          {notice && <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="mt-3 text-sm text-moss">{notice}</motion.p>}
        </section>

        <section aria-label="Wedding moments" className="mt-6">
          <div className="mb-4 flex items-end justify-between gap-3 px-1">
            <div>
              <p className="micro tracking-[0.22em] text-taupe">THE SHARED ALBUM</p>
              <h2 className="mt-1 font-serif text-2xl text-mocha">Newsfeed</h2>
            </div>
            <button type="button" onClick={refreshFromTop} disabled={loading || pulling} className="micro rounded-full border border-taupe/25 px-3 py-2 text-taupe hover:border-wine hover:text-wine disabled:opacity-50">
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
                className="mb-4 w-full rounded-2xl border border-wine/15 bg-white/80 py-3 font-serif text-wine shadow-sm"
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
            <div className="rounded-[24px] border border-dashed border-taupe/35 bg-white/45 px-6 py-10 text-center">
              <p className="script text-4xl text-wine/70">A page waiting to be filled</p>
              <p className="mt-2 text-sm text-ink/50">Be the first to leave a note or share a photo.</p>
            </div>
          ) : null}
        </section>

        <footer className="mt-10 text-center">
          <p className="micro text-taupe/75">{remainingFiles} uploads left on this device · {formatBytes(remainingBytes)} remaining</p>
          <p className="mt-2 font-serif text-xs italic text-taupe/70">A private little album for {firstName(couple)} and everyone who loves them.</p>
        </footer>
      </div>
    </main>
  );
}
