/**
 * Tiny QR helper for the binder's printable signs (the guest photo/video upload page, table
 * cards, A4 welcome signs). Branded with the invitation's ink-on-paper colours so a printed code
 * matches the rest of the stationery.
 */
import QRCode from "qrcode";

export async function qrDataUrl(
  text: string,
  width = 1024,
  colors: { dark?: string; light?: string } = {},
): Promise<string> {
  return QRCode.toDataURL(text, {
    width,
    margin: 2,
    errorCorrectionLevel: "M",
    color: { dark: colors.dark ?? "#33271F", light: colors.light ?? "#FCFAF5" },
  });
}

/** Save a `data:` URL (canvas PNG, QR PNG) as a file download. */
export function saveDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
