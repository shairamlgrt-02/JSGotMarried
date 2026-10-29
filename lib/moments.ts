export type MomentMedia = {
  url: string;
  contentType: string;
};

export type WeddingMoment = {
  id: string;
  displayName: string;
  body: string;
  overlayText: string;
  media: MomentMedia[];
  createdAt: string;
  showInFeed: boolean;
  showInStories: boolean;
  /** Present only when the request proves this post belongs to the current device (or is admin). */
  canManage?: boolean;
};

export type MomentPage = {
  posts: WeddingMoment[];
  nextCursor: string | null;
  newCount?: number;
};

/** Public feed or Stories: media URLs are temporary signed URLs for the private bucket. */
export async function loadMoments(options: {
  before?: string;
  limit?: number;
  admin?: boolean;
  stories?: boolean;
  deviceId?: string;
  id?: string;
} = {}): Promise<MomentPage> {
  const params = new URLSearchParams();
  if (options.before) params.set("before", options.before);
  if (options.limit) params.set("limit", String(options.limit));
  if (options.admin) params.set("admin", "1");
  if (options.stories) params.set("stories", "1");
  if (options.deviceId) params.set("deviceId", options.deviceId);
  if (options.id) params.set("id", options.id);
  const response = await fetch(`/api/moments?${params.toString()}`, { cache: "no-store" });
  const data = (await response.json().catch(() => ({}))) as MomentPage & { error?: string };
  if (!response.ok) throw new Error(data.error || "Could not load wedding moments.");
  return data;
}

export async function countNewMoments(since: string): Promise<number> {
  const response = await fetch(`/api/moments?since=${encodeURIComponent(since)}`, { cache: "no-store" });
  if (!response.ok) return 0;
  const data = (await response.json().catch(() => ({}))) as { newCount?: number };
  return Number(data.newCount) || 0;
}

export async function publishMoment(input: {
  deviceId: string;
  displayName: string;
  body: string;
  overlayText: string;
  media: { path: string; contentType: string }[];
  showInFeed: boolean;
  showInStories: boolean;
}): Promise<WeddingMoment> {
  const response = await fetch("/api/moments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = (await response.json().catch(() => ({}))) as { post?: WeddingMoment; error?: string };
  if (!response.ok || !data.post) throw new Error(data.error || "Your post couldn't be published. Please try again.");
  return data.post;
}

export async function updateMoment(input: {
  id: string;
  deviceId: string;
  body: string;
  overlayText: string;
}): Promise<WeddingMoment> {
  const response = await fetch(`/api/moments?id=${encodeURIComponent(input.id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = (await response.json().catch(() => ({}))) as { post?: WeddingMoment; error?: string };
  if (!response.ok || !data.post) throw new Error(data.error || "Could not update this moment.");
  return data.post;
}

export async function deleteMoment(id: string, deviceId?: string): Promise<void> {
  const params = new URLSearchParams({ id });
  if (deviceId) params.set("deviceId", deviceId);
  const response = await fetch(`/api/moments?${params.toString()}`, { method: "DELETE" });
  const data = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) throw new Error(data.error || "Could not remove this moment.");
}
