/**
 * Guest chat attachments (the /upload page and the QR codes on the table cards).
 *
 * Guests upload straight from their phone to a PRIVATE Supabase Storage bucket using the public
 * anon key — the Next.js server never proxies the bytes, so a long phone video doesn't hit a
 * serverless body limit. Anon can INSERT only (see the wedding-media policies in
 * supabase/schema.sql): guests can add their memories but never list, view or delete anyone
 * else's; the couple's service-role key (the binder) keeps full access.
 *
 * The 25-file / 1 GB per-guest cap is enforced here, on the guest's device, and remembered in
 * localStorage so it still holds if they reopen the page. Supabase's own bucket limit
 * (file_size_limit) backs it up per file on the server side.
 */


export const MEDIA_BUCKET = "wedding-media";
/** Max files one guest (one device) can send. */
export const MAX_FILES_PER_GUEST = 25;
/** Max total bytes one guest (one device) can send — 1 GB. */
export const MAX_TOTAL_BYTES = 1024 * 1024 * 1024;
/** The bucket itself rejects anything bigger, even if a tampered device skipped our check. */
export const MAX_FILE_BYTES = MAX_TOTAL_BYTES;

/** Mime families the picker and the validator accept (iPhone HEIC included — it is the default iPhone format). */
const ACCEPTED_PREFIXES = ["image/", "video/"];
export const UPLOAD_ACCEPT = "image/*,video/*,audio/*,.heic,.heif,.mov,.m4a,.mp3,.wav,.ogg,.webm,.aac";

const QUOTA_KEY = "jsos:upload-quota-v1";
const GUEST_KEY = "jsos:upload-guest-id";

export type UploadQuota = { count: number; bytes: number };

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value >= 100 ? Math.round(value) : value.toFixed(1)} ${units[i]}`;
}

export function isAcceptedFile(file: File): boolean {
  return ACCEPTED_PREFIXES.some((prefix) => file.type.startsWith(prefix)) || file.type.startsWith("audio/") || /\.(heic|heif|mov|m4a|mp3|wav|ogg|webm|aac)$/i.test(file.name);
}

/** A stable per-device guest id, so a guest's 25 files land together under one storage folder. */
export function guestId(): string {
  try {
    let id = localStorage.getItem(GUEST_KEY);
    if (!id) {
      id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `g-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(GUEST_KEY, id);
    }
    return id;
  } catch {
    return `g-${Date.now()}`;
  }
}

export function readQuota(): UploadQuota {
  try {
    const raw = localStorage.getItem(QUOTA_KEY);
    if (!raw) return { count: 0, bytes: 0 };
    const parsed = JSON.parse(raw) as Partial<UploadQuota>;
    return { count: Number(parsed.count) || 0, bytes: Number(parsed.bytes) || 0 };
  } catch {
    return { count: 0, bytes: 0 };
  }
}

export function addToQuota(files: { size: number }[]): UploadQuota {
  const next: UploadQuota = {
    count: readQuota().count + files.length,
    bytes: readQuota().bytes + files.reduce((sum, f) => sum + f.size, 0),
  };
  try {
    localStorage.setItem(QUOTA_KEY, JSON.stringify(next));
  } catch { /* private mode: the in-memory checks still run this visit */ }
  return next;
}

export type ValidationResult = { ok: boolean; errors: string[]; accepted: File[] };

/** Check a fresh selection against type, per-file size and the remembered per-guest quota. */
export function validateSelection(files: File[], quota: UploadQuota = readQuota()): ValidationResult {
  const errors: string[] = [];
  const accepted: File[] = [];
  let remainingCount = Math.max(0, MAX_FILES_PER_GUEST - quota.count);
  let remainingBytes = Math.max(0, MAX_TOTAL_BYTES - quota.bytes);

  for (const file of files) {
    if (!isAcceptedFile(file)) {
      errors.push(`“${file.name}” isn't a photo or video — it was skipped.`);
      continue;
    }
    if (file.size > MAX_FILE_BYTES) {
      errors.push(`“${file.name}” is over ${formatBytes(MAX_FILE_BYTES)} — the limit for one file.`);
      continue;
    }
    if (remainingCount <= 0) {
      errors.push(`You can send up to ${MAX_FILES_PER_GUEST} files in total — “${file.name}” was skipped.`);
      continue;
    }
    if (file.size > remainingBytes) {
      errors.push(`“${file.name}” would take you over the ${formatBytes(MAX_TOTAL_BYTES)} total limit — it was skipped.`);
      continue;
    }
    accepted.push(file);
    remainingCount--;
    remainingBytes -= file.size;
  }
  return { ok: errors.length === 0, errors, accepted };
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
