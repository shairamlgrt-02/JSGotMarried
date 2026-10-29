export const GUEST_NAME_KEY = "jsos:moment-name-v1";
export const GUEST_NAME_EVENT = "jsos:guest-name-updated";
export const OPEN_GUEST_NAME_EVENT = "jsos:open-guest-name";

export function cleanGuestName(value: unknown): string {
  return String(value ?? "").trim().replace(/\s+/g, " ").slice(0, 120);
}
