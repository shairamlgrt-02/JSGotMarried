export const COOKIE = "js_admin";

export function adminPassword() {
  return process.env.ADMIN_PASSWORD || "JS2026";
}

/** Session token = SHA-256(password + pepper). Changing ADMIN_PASSWORD logs everyone out. */
export async function sessionToken(password = adminPassword()) {
  const data = new TextEncoder().encode(`js-wedding-os::${password}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function isAuthed(cookieValue?: string) {
  if (!cookieValue) return false;
  return cookieValue === (await sessionToken());
}
