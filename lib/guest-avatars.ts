export const GUEST_AVATARS = [
  { id: "man", label: "Man silhouette", emoji: "" },
  { id: "man-alt", label: "Man with beard", emoji: "🧔🏻" },
  { id: "woman", label: "Woman", emoji: "👩🏻" },
  { id: "baby", label: "Baby", emoji: "👶" },
  { id: "cat", label: "Cat", emoji: "🐱" },
  { id: "bear", label: "Bear", emoji: "🐻" },
  { id: "heart", label: "Heart", emoji: "🤍" },
  { id: "prayer", label: "Prayer", emoji: "🙏" },
] as const;

export type GuestAvatarId = (typeof GUEST_AVATARS)[number]["id"];
export const DEFAULT_GUEST_AVATAR: GuestAvatarId = "man";

export function isGuestAvatarId(value: unknown): value is GuestAvatarId {
  return typeof value === "string" && GUEST_AVATARS.some((avatar) => avatar.id === value);
}

/** Map the earlier curly-hair portrait preset to the baby choice without breaking saved avatars. */
export function normalizeGuestAvatarId(value: unknown): GuestAvatarId {
  if (value === "woman-alt") return "baby";
  return isGuestAvatarId(value) ? value : DEFAULT_GUEST_AVATAR;
}

export function guestAvatarEmoji(id: GuestAvatarId): string {
  return GUEST_AVATARS.find((avatar) => avatar.id === id)?.emoji ?? "";
}
