/**
 * Private guest media uploads for the group chat and Stories. Chat attachments are resized before
 * upload and never consume the Stories quota. The Stories uploader tracks its own 1 GB device cap.
 */
export const MEDIA_BUCKET = "wedding-media";
/** Stories-only total bytes one device can upload. */
export const MAX_TOTAL_BYTES = 1024 * 1024 * 1024;
/** Supabase also rejects any individual object larger than 1 GB. */
export const MAX_FILE_BYTES = MAX_TOTAL_BYTES;
export const UPLOAD_ACCEPT = "image/*,video/*,audio/*,.heic,.heif,.mov,.m4a,.mp3,.wav,.ogg,.webm,.aac";
const QUOTA_KEY = "jsos:stories-quota-v1";
const GUEST_KEY = "jsos:upload-guest-id";

export type UploadQuota = { count: number; bytes: number };

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) { value /= 1024; i++; }
  return `${value >= 100 ? Math.round(value) : value.toFixed(1)} ${units[i]}`;
}

export function isAcceptedFile(file: File): boolean {
  return /^(image|video|audio)\//i.test(file.type) || /\.(heic|heif|mov|m4a|mp3|wav|ogg|webm|aac)$/i.test(file.name);
}

/** Stable per-device guest id used to authorize edits and group private uploads. */
export function guestId(): string {
  try {
    let id = localStorage.getItem(GUEST_KEY);
    if (!id) {
      id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `g-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(GUEST_KEY, id);
    }
    return id;
  } catch { return `g-${Date.now()}`; }
}

/** Stories-only quota; the new key intentionally excludes older mixed chat/Stories accounting. */
export function readQuota(): UploadQuota {
  try {
    const raw = localStorage.getItem(QUOTA_KEY);
    if (!raw) return { count: 0, bytes: 0 };
    const parsed = JSON.parse(raw) as Partial<UploadQuota>;
    return { count: Number(parsed.count) || 0, bytes: Number(parsed.bytes) || 0 };
  } catch { return { count: 0, bytes: 0 }; }
}

export function addToQuota(files: { size: number }[]): UploadQuota {
  const current = readQuota();
  const next = { count: current.count + files.length, bytes: current.bytes + files.reduce((sum, f) => sum + f.size, 0) };
  try { localStorage.setItem(QUOTA_KEY, JSON.stringify(next)); } catch { /* in-memory checks still run this visit */ }
  return next;
}

export type ValidationResult = { ok: boolean; errors: string[]; accepted: File[] };
function validateFiles(files: File[], remainingBytes: number, storyOnly: boolean): ValidationResult {
  const errors: string[] = [];
  const accepted: File[] = [];
  for (const file of files) {
    if (!isAcceptedFile(file) || (storyOnly && !/^(image|video)\//i.test(file.type) && !/\.(heic|heif|mov)$/i.test(file.name))) {
      errors.push(`“${file.name}” isn't an eligible ${storyOnly ? "photo or video" : "photo, video or audio file"} — it was skipped.`);
      continue;
    }
    if (file.size > MAX_FILE_BYTES) { errors.push(`“${file.name}” is over ${formatBytes(MAX_FILE_BYTES)} — the limit for one file.`); continue; }
    if (storyOnly && file.size > remainingBytes) {
      errors.push(`“${file.name}” would take you over the ${formatBytes(MAX_TOTAL_BYTES)} Stories limit for this device — it was skipped.`);
      continue;
    }
    accepted.push(file);
    if (storyOnly) remainingBytes -= file.size;
  }
  return { ok: errors.length === 0, errors, accepted };
}

/** Chat validation has no Stories device quota and no lifetime file-count cap. */
export function validateChatSelection(files: File[]): ValidationResult {
  return validateFiles(files, Number.POSITIVE_INFINITY, false);
}

/** The 1 GB device quota applies only to explicit Stories uploads. */
export function validateStorySelection(files: File[], quota: UploadQuota = readQuota()): ValidationResult {
  return validateFiles(files, Math.max(0, MAX_TOTAL_BYTES - quota.bytes), true);
}

/** Storage path, grouped by day and guest so the binder can browse one phone's memories together. */
export function objectPath(file: File, id = guestId()): string {
  const day = new Date().toISOString().slice(0, 10);
  const uuid = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const ext = (file.name.split(".").pop() || file.type.split("/")[1] || "bin").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8) || "bin";
  return `${day}/${id}/${uuid}.${ext}`;
}

/** Whether the public Storage env vars are configured — the /upload page's connected check. */
export function mediaConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export type UploadProgress = (percent: number, loaded: number, total: number) => void;

/**
 * Upload one file straight to the private bucket with a real progress bar.
 *
 * The installed storage-js bundle ships no progress callback, so this posts to the same
 * `…/storage/v1/object/{bucket}/{path}` endpoint the SDK uses, with the anon key and an
 * XMLHttpRequest — the only browser primitive that reports upload progress. The anon INSERT
 * policy in supabase/schema.sql applies to this request exactly as it would to the SDK.
 */
export function uploadMediaFile(file: File, path: string, onProgress?: UploadProgress): Promise<void> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !anonKey) return Promise.reject(new Error("The upload album isn't connected yet."));

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${base.replace(/\/$/, "")}/storage/v1/object/${MEDIA_BUCKET}/${path}`);
    xhr.setRequestHeader("Authorization", `Bearer ${anonKey}`);
    xhr.setRequestHeader("apikey", anonKey);
    const declaredType = file.type.split(";")[0]?.trim() || "";
    const extension = file.name.split(".").pop()?.toLowerCase();
    const fallbackTypes: Record<string, string> = {
      heic: "image/heic", heif: "image/heif", mov: "video/quicktime", m4a: "audio/mp4",
      mp3: "audio/mpeg", wav: "audio/wav", ogg: "audio/ogg", aac: "audio/aac",
    };
    const contentType = /^(image|video|audio)\//i.test(declaredType) ? declaredType : fallbackTypes[extension || ""] || declaredType || "application/octet-stream";
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = (event) => {
      if (onProgress && event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100), event.loaded, event.total);
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else {
        let message = `Upload failed (${xhr.status}).`;
        try {
          const body = JSON.parse(xhr.responseText);
          if (body?.message) message = body.message;
        } catch { /* keep the status message */ }
        reject(new Error(message));
      }
    };
    xhr.onerror = () => reject(new Error("Network error — check your connection and try again."));
    xhr.send(file);
  });
}

const CHAT_IMAGE_MAX_EDGE = 1440;
const CHAT_VIDEO_MAX_EDGE = 720;

function canvasBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Could not optimize this photo.")), type, quality));
}

async function optimizeChatImage(file: File): Promise<File> {
  let bitmap: ImageBitmap | undefined;
  let image: HTMLImageElement | undefined;
  let objectUrl = "";
  try {
    let width = 0;
    let height = 0;
    if (typeof createImageBitmap !== "undefined") {
      bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      width = bitmap.width;
      height = bitmap.height;
    } else {
      objectUrl = URL.createObjectURL(file);
      image = new Image();
      image.src = objectUrl;
      await image.decode();
      width = image.naturalWidth;
      height = image.naturalHeight;
    }
    const scale = Math.min(1, CHAT_IMAGE_MAX_EDGE / Math.max(width, height));
    if (scale === 1 && file.type === "image/jpeg" && file.size <= 450_000) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) return file;
    if (bitmap) context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    else if (image) context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await canvasBlob(canvas, "image/jpeg", 0.76);
    if (blob.size >= file.size) return file;
    const name = file.name.replace(/\.[^.]+$/, "") || "chat-photo";
    return new File([blob], `${name}.jpg`, { type: "image/jpeg", lastModified: file.lastModified });
  } catch { return file; }
  finally { bitmap?.close(); if (objectUrl) URL.revokeObjectURL(objectUrl); }
}

async function optimizeChatVideo(file: File): Promise<File> {
  if (typeof MediaRecorder === "undefined") return file;
  const video = document.createElement("video");
  const url = URL.createObjectURL(file);
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.src = url;
  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("Could not read this video."));
    });
    const scale = Math.min(1, CHAT_VIDEO_MAX_EDGE / Math.max(video.videoWidth, video.videoHeight));
    if (scale === 1 && file.size < 1_500_000) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(2, Math.round(video.videoWidth * scale / 2) * 2);
    canvas.height = Math.max(2, Math.round(video.videoHeight * scale / 2) * 2);
    const context = canvas.getContext("2d");
    const captureCanvas = canvas as HTMLCanvasElement & { captureStream?: (fps?: number) => MediaStream };
    const captureVideo = video as HTMLVideoElement & { captureStream?: () => MediaStream; mozCaptureStream?: () => MediaStream };
    if (!context || !captureCanvas.captureStream) return file;
    const stream = captureCanvas.captureStream(24);
    const sourceStream = captureVideo.captureStream?.() || captureVideo.mozCaptureStream?.();
    sourceStream?.getAudioTracks().forEach((track) => stream.addTrack(track));
    const mimeType = ["video/webm;codecs=vp8,opus", "video/webm;codecs=vp9,opus", "video/webm", "video/mp4;codecs=avc1.42E01E,mp4a.40.2", "video/mp4"]
      .find((type) => MediaRecorder.isTypeSupported(type));
    if (!mimeType) { stream.getTracks().forEach((track) => track.stop()); return file; }
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 900_000, audioBitsPerSecond: 96_000 });
    const chunks: Blob[] = [];
    const result = new Promise<Blob>((resolve, reject) => {
      recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      recorder.onerror = () => reject(new Error("Could not optimize this video."));
      recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
    });
    const draw = () => {
      if (video.readyState >= 2 && !video.ended) context.drawImage(video, 0, 0, canvas.width, canvas.height);
      if (!video.ended && !video.paused) requestAnimationFrame(draw);
    };
    recorder.start(1000);
    await video.play();
    draw();
    await new Promise<void>((resolve, reject) => {
      video.onended = () => resolve();
      video.onerror = () => reject(new Error("Could not read this video."));
    });
    if (recorder.state !== "inactive") recorder.stop();
    const blob = await result;
    stream.getTracks().forEach((track) => track.stop());
    sourceStream?.getTracks().forEach((track) => track.stop());
    if (!blob.size || blob.size >= file.size) return file;
    const name = file.name.replace(/\.[^.]+$/, "") || "chat-video";
    const extension = mimeType.includes("mp4") ? "mp4" : "webm";
    return new File([blob], `${name}.${extension}`, { type: mimeType, lastModified: file.lastModified });
  } catch { return file; }
  finally { video.pause(); video.removeAttribute("src"); video.load(); URL.revokeObjectURL(url); }
}

/** Reduce chat media dimensions/bitrate before it reaches private storage; Stories remain original. */
export async function optimizeChatMedia(file: File): Promise<File> {
  if (file.type.startsWith("image/") || /\.(jpe?g|png|webp|gif|heic|heif)$/i.test(file.name)) return optimizeChatImage(file);
  if (file.type.startsWith("video/") || /\.(mp4|mov|m4v|webm|3gp)$/i.test(file.name)) return optimizeChatVideo(file);
  return file;
}
