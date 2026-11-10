import { EDGE, LACE, MOCHA, PAPER, TAUPE, WINE, caps, diamondRule, drawLines, loadCardFonts, paper, savePng, script, serif, text, wrapLines } from "./card-draw";
import type { TeamCard, TeamCardCategory } from "./types";

const W = 1500;
const CX = W / 2;
const M = 150;
const INNER = W - 2 * M;
const MIN_H = 2121; // A4 portrait at 150 dpi
const BOTTOM = 150;

const categoryName: Record<TeamCardCategory, string> = {
  bridesmaid: "Bridesmaid",
  groomsman: "Groomsman",
  coordinator: "Coordinator",
  other: "Other team member",
};

function paragraphLines(g: CanvasRenderingContext2D, value: string, font: string, width: number) {
  if (!value.trim()) return ["____________________________________________"];
  return value.split(/\r?\n/).flatMap((paragraph) => paragraph.trim() ? wrapLines(g, paragraph, font, width) : [""]);
}

function field(g: CanvasRenderingContext2D, title: string, value: string, y: number, multiline = false) {
  const x = M + 25;
  const width = INNER - 50;
  caps(g, title, x, y, 24, TAUPE, 0.22, "left");
  const font = serif(multiline ? 36 : 40, "400");
  const leading = multiline ? 48 : 52;
  const lines = paragraphLines(g, value, font, width);
  const firstBaseline = y + 53;
  drawLines(g, lines, x, firstBaseline, font, value.trim() ? MOCHA : EDGE, leading, "left");
  return firstBaseline + Math.max(1, lines.length) * leading + (multiline ? 36 : 25);
}

function draw(g: CanvasRenderingContext2D, card: TeamCard, height: number) {
  paper(g, W, height);
  let y = 180;
  caps(g, "Jeger & Shaira · Wedding Day", CX, y, 26, TAUPE, 0.3);
  y += 105;
  text(g, card.name.trim() || "Name", CX, y, script(104), WINE);
  y += 62;
  caps(g, `${categoryName[card.category]} · Role & Reminder Card`, CX, y, 25, WINE, 0.25);
  y += 70;
  diamondRule(g, CX, y, 270);
  y += 85;

  y = field(g, "Role / assignment", card.role_title, y);
  y = field(g, "Call time", card.call_time, y);
  y = field(g, "Meeting place", card.meet_at, y, true);
  y = field(g, "Preparation", card.prepare, y, true);
  y = field(g, "What to bring", card.bring, y, true);
  y = field(g, "Reminder", card.reminder, y, true);

  y += 18;
  diamondRule(g, CX, y, 220, EDGE);
  y += 65;
  caps(g, "With love · 11.11.2026", CX, y, 22, TAUPE, 0.28);
  return y;
}

/** A branded A4 PNG card for any wedding-team member; empty fields stay visibly fillable. */
export function renderTeamCard(card: TeamCard): HTMLCanvasElement | null {
  const probe = document.createElement("canvas");
  probe.width = W;
  probe.height = MIN_H;
  const pg = probe.getContext("2d");
  if (!pg) return null;
  const bottom = draw(pg, card, probe.height) + BOTTOM;
  const height = Math.max(MIN_H, Math.ceil(bottom));

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = height;
  const g = canvas.getContext("2d");
  if (!g) return null;
  draw(g, card, height);
  return canvas;
}

function filename(card: TeamCard) {
  const slug = [card.name || "team-member", categoryName[card.category]]
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${slug || "team-member-card"}-11.11.2026.png`;
}

export async function downloadTeamCard(card: TeamCard): Promise<boolean> {
  await loadCardFonts(['104px "Pinyon Script"', '600 26px "Cormorant Garamond"', '400 40px "Cormorant Garamond"']);
  try {
    const canvas = renderTeamCard(card);
    if (!canvas) return false;
    return await savePng(canvas, filename(card));
  } catch {
    return false;
  }
}
