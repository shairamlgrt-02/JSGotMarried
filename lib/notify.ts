import nodemailer from "nodemailer";

type RsvpForMail = {
  name: string;
  phone: string;
  pax: number;
  attending: "yes" | "no";
  dietary: string;
  message: string;
  song_request: string;
  approval?: string;
  plus_one?: string;
};

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>");

/** True when the mailbox env vars are all present. */
export function mailConfigured() {
  return Boolean(process.env.RSVP_NOTIFY_EMAIL && process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

/** E-mail the couple a copy of one RSVP. Never throws — returns false when not configured or on error. */
export async function sendRsvpEmail(row: RsvpForMail): Promise<boolean> {
  if (!mailConfigured()) return false;
  try {
    const to = process.env.RSVP_NOTIFY_EMAIL!; // one address or comma-separated list
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    });
    const when = new Date().toLocaleString("en-GB", { timeZone: "Asia/Bahrain", dateStyle: "full", timeStyle: "short" });
    const yes = row.attending === "yes";
    const rows: [string, string][] = [
      ["Name", row.name],
      ["Attending", yes ? `Yes — ${row.pax} ${row.pax === 2 ? "guests" : "guest"}` : "Sorry, can't make it"],
      ...(row.phone ? [["Phone", row.phone] as [string, string]] : []),
      ...(row.plus_one ? [["Plus-one", row.plus_one] as [string, string]] : []),
      ...(row.dietary ? [["Dietary needs", row.dietary] as [string, string]] : []),
      ...(row.message ? [["Message", row.message] as [string, string]] : []),
      ...(row.song_request ? [["Song request", row.song_request] as [string, string]] : []),
      ...(row.approval ? [["Invite", row.approval] as [string, string]] : []),
    ];
    const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#F7F2E9;font-family:Georgia,serif;color:#37312B">
      <table role="presentation" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#FBF8F1;border:1px solid #E7DCCA;border-radius:14px;padding:26px 30px;width:100%">
        <tr><td>
          <p style="margin:0 0 4px;font-size:12px;letter-spacing:.22em;text-transform:uppercase;color:#7A2E3F">New RSVP · Jeger &amp; Shaira</p>
          <h2 style="margin:0 0 6px;font-size:30px;font-weight:normal;font-style:italic;color:#4A241A">${yes ? "🎉 Someone is coming!" : "💌 A kind decline"}</h2>
          <p style="margin:0 0 18px;font-size:13px;color:#8B8070">${when} (Bahrain time)</p>
          <table cellpadding="8" cellspacing="0" style="width:100%;font-size:16px;border-collapse:collapse">
            ${rows.map(([k, v]) => `<tr><td style="width:34%;vertical-align:top;color:#8B8070;font-size:12px;letter-spacing:.12em;text-transform:uppercase;border-bottom:1px solid #EFE7DA;padding:9px 4px 9px 0">${k}</td><td style="border-bottom:1px solid #EFE7DA;padding:9px 0">${esc(v)}</td></tr>`).join("")}
          </table>
          <p style="margin:20px 0 0;font-size:13px;color:#8B8070;font-style:italic">See everyone in your binder: your website → /admin → Guests.</p>
        </td></tr>
      </table></body></html>`;
    const text = `New RSVP\n${rows.map(([k, v]) => `${k}: ${v}`).join("\n")}\n(${when} Bahrain time)`;
    await transporter.sendMail({
      from: `"Jeger & Shaira Wedding" <${process.env.GMAIL_USER}>`,
      to,
      replyTo: row.phone ? undefined : undefined,
      subject: yes ? `RSVP ✓ ${row.name} (${row.pax}) is coming` : `RSVP · ${row.name} can't make it`,
      text,
      html,
    });
    return true;
  } catch (e) {
    console.error("rsvp email failed:", (e as Error)?.message);
    return false;
  }
}
