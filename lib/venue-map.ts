import { ALL_WELCOME_FROM, CEREMONY_DOORS_CLOSE, RECEPTION_AT } from "./program";
import { EDGE, MOCHA, PAPER, TAUPE, WINE, caps, pin, roundRect, serif, text } from "./card-draw";

/**
 * A small wayfinding plan of the venue for the programme card: where the hall is, where the
 * majlis is (just outside it), where to park and where the entrance is — the three places the
 * arrival notes send a guest to, numbered to match the legend printed under the map.
 *
 * ┌─ PROVISIONAL ──────────────────────────────────────────────────────────────────────────────┐
 * │ This is a schematic, not a survey: parking at the front, the entrance path, the majlis   │
 * │ beside the hall doors. Redraw the shapes below from the couple's own sketch of The Heaven │
 * │ — everything is in the logical MAP_W × MAP_H space and scales to whatever box it is given.│
 * └────────────────────────────────────────────────────────────────────────────────────────────┘
 */
export const MAP_W = 640;
export const MAP_H = 420;

/** The legend under the map — the same numbers as the pins. */
export const VENUE_MAP_LEGEND: { n: number; place: string; detail: string }[] = [
  { n: 1, place: "Parking", detail: "park, then follow the path in" },
  { n: 2, place: "The majlis", detail: `just outside the hall — welcome toast, snacks & photos from ${ALL_WELCOME_FROM}` },
  { n: 3, place: "The hall", detail: `ceremony at ${CEREMONY_DOORS_CLOSE} (doors close as the procession begins) · reception at ${RECEPTION_AT}` },
];

type Ctx = CanvasRenderingContext2D;

const GROUND = "#F3EDE1";
const PATH = "#D8CBB7";
const SEAT = "#C9B7A0";

function dashedLine(g: Ctx, pts: [number, number][], color = WINE, width = 2.2, dash: number[] = [8, 8]) {
  g.save();
  g.strokeStyle = color;
  g.lineWidth = width;
  g.lineCap = "round";
  g.setLineDash(dash);
  g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.stroke();
  g.restore();
}

function arrowHead(g: Ctx, x: number, y: number, dir: "up" | "right", size = 9, color = WINE) {
  g.fillStyle = color;
  g.beginPath();
  if (dir === "up") { g.moveTo(x, y - size); g.lineTo(x - size * 0.8, y + size * 0.6); g.lineTo(x + size * 0.8, y + size * 0.6); }
  else { g.moveTo(x + size, y); g.lineTo(x - size * 0.6, y - size * 0.8); g.lineTo(x - size * 0.6, y + size * 0.8); }
  g.closePath();
  g.fill();
}

/** Two blocks of seat rows with an aisle between — the first `reserved` rows drawn darker. */
function seatRows(g: Ctx, x: number, y: number, w: number, rows: number, reserved: number, gap = 20) {
  const aisle = 34;
  const block = (w - aisle) / 2;
  for (let r = 0; r < rows; r++) {
    const yy = y + r * gap;
    g.strokeStyle = r < reserved ? WINE : SEAT;
    g.lineWidth = r < reserved ? 5 : 4;
    g.lineCap = "round";
    g.beginPath();
    g.moveTo(x, yy); g.lineTo(x + block, yy);
    g.moveTo(x + block + aisle, yy); g.lineTo(x + w, yy);
    g.stroke();
  }
}

/** Parking bays either side of a drive lane. */
function parkingBays(g: Ctx, x: number, y: number, w: number, h: number) {
  g.strokeStyle = PATH;
  g.lineWidth = 1.6;
  const lane = h * 0.3;
  const bayH = (h - lane) / 2;
  const n = Math.floor(w / 26);
  const step = w / n;
  for (let i = 0; i <= n; i++) {
    const xx = x + i * step;
    g.beginPath();
    g.moveTo(xx, y); g.lineTo(xx, y + bayH);
    g.moveTo(xx, y + h - bayH); g.lineTo(xx, y + h);
    g.stroke();
  }
  g.beginPath(); g.moveTo(x, y + bayH); g.lineTo(x + w, y + bayH); g.moveTo(x, y + h - bayH); g.lineTo(x + w, y + h - bayH); g.stroke();
}

/**
 * Draw the plan into the box (x, y, w, h). The drawing is laid out in MAP_W × MAP_H and scaled to
 * fit, so the card decides how big the map is.
 */
export function drawVenueMap(g: Ctx, x: number, y: number, w: number, h: number) {
  const s = Math.min(w / MAP_W, h / MAP_H);
  g.save();
  g.translate(x + (w - MAP_W * s) / 2, y + (h - MAP_H * s) / 2);
  g.scale(s, s);

  // the grounds
  roundRect(g, 4, 4, MAP_W - 8, MAP_H - 8, 18);
  g.fillStyle = GROUND; g.fill();
  g.strokeStyle = EDGE; g.lineWidth = 1.5; g.stroke();

  // ── the hall (ceremony & reception) ──
  const hall = { x: 170, y: 28, w: 444, h: 192 };
  roundRect(g, hall.x, hall.y, hall.w, hall.h, 10);
  g.fillStyle = PAPER; g.fill();
  g.strokeStyle = WINE; g.lineWidth = 2.6; g.stroke();
  // stage at the far end
  roundRect(g, hall.x + 110, hall.y + 12, hall.w - 220, 18, 6);
  g.fillStyle = "#E9DCCB"; g.fill();
  caps(g, "stage", hall.x + hall.w / 2, hall.y + 25, 11, TAUPE, 0.3);
  // reserved rows (wine) with open seats behind them
  seatRows(g, hall.x + 72, hall.y + 58, hall.w - 144, 5, 2, 18);
  text(g, "reserved rows · families & entourage", hall.x + hall.w / 2, hall.y + 46, serif(14, "i400"), WINE);
  text(g, "open seats around them", hall.x + hall.w / 2, hall.y + 150, serif(14, "i400"), TAUPE);
  caps(g, "the hall", hall.x + hall.w / 2, hall.y + 178, 22, WINE, 0.3);
  // the doors — a gap in the front wall, two leaves swung open
  const door = { x: hall.x + hall.w / 2 - 22, y: hall.y + hall.h, w: 44 };
  g.strokeStyle = PAPER; g.lineWidth = 4; g.beginPath(); g.moveTo(door.x, door.y); g.lineTo(door.x + door.w, door.y); g.stroke();
  g.strokeStyle = WINE; g.lineWidth = 2;
  g.beginPath(); g.arc(door.x, door.y, 20, 0, Math.PI / 2); g.stroke();
  g.beginPath(); g.arc(door.x + door.w, door.y, 20, Math.PI / 2, Math.PI); g.stroke();
  text(g, "doors", door.x - 30, door.y + 18, serif(13, "i400"), WINE, "right");

  // ── the majlis, just outside the hall ──
  const majlis = { x: 438, y: 262, w: 176, h: 112 };
  roundRect(g, majlis.x, majlis.y, majlis.w, majlis.h, 14);
  g.fillStyle = "#F9F1E4"; g.fill();
  g.save(); g.setLineDash([7, 5]); g.strokeStyle = WINE; g.lineWidth = 2; g.stroke(); g.restore();
  // low seating around a centre table
  g.fillStyle = SEAT;
  for (const [cx, cy] of [[majlis.x + 36, majlis.y + 24], [majlis.x + 36, majlis.y + 52], [majlis.x + majlis.w - 36, majlis.y + 24], [majlis.x + majlis.w - 36, majlis.y + 52]] as [number, number][]) {
    roundRect(g, cx - 10, cy - 6, 20, 12, 5); g.fill();
  }
  g.beginPath(); g.ellipse(majlis.x + majlis.w / 2, majlis.y + 38, 24, 14, 0, 0, Math.PI * 2); g.fillStyle = "#E9DCCB"; g.fill();
  caps(g, "the majlis", majlis.x + majlis.w / 2, majlis.y + majlis.h - 30, 17, WINE, 0.26);
  text(g, `toast & photos · ${ALL_WELCOME_FROM}`, majlis.x + majlis.w / 2, majlis.y + majlis.h - 11, serif(13, "i400"), MOCHA);

  // ── parking ──
  const park = { x: 30, y: 262, w: 300, h: 112 };
  roundRect(g, park.x, park.y, park.w, park.h, 10);
  g.fillStyle = "#EBE3D5"; g.fill();
  g.strokeStyle = EDGE; g.lineWidth = 1.4; g.stroke();
  parkingBays(g, park.x + 16, park.y + 14, park.w - 32, park.h - 28);
  g.fillStyle = "rgba(252,250,245,.85)";
  roundRect(g, park.x + park.w / 2 - 58, park.y + park.h / 2 - 13, 116, 26, 13); g.fill();
  caps(g, "parking", park.x + park.w / 2, park.y + park.h / 2 + 6, 15, TAUPE, 0.3);

  // ── the entrance and the walk in ──
  const gate = { x: 384, y: MAP_H - 4 };
  g.strokeStyle = GROUND; g.lineWidth = 6; g.beginPath(); g.moveTo(gate.x - 26, gate.y); g.lineTo(gate.x + 26, gate.y); g.stroke();
  g.strokeStyle = WINE; g.lineWidth = 2.2;
  g.beginPath(); g.moveTo(gate.x - 26, gate.y - 14); g.lineTo(gate.x - 26, gate.y + 2); g.moveTo(gate.x + 26, gate.y - 14); g.lineTo(gate.x + 26, gate.y + 2); g.stroke();
  caps(g, "entrance", gate.x + 100, gate.y - 12, 13, WINE, 0.26);
  arrowHead(g, gate.x, gate.y - 34, "up");
  // the path: in from the gate, up to the doors — and a step to the right for the majlis
  dashedLine(g, [[gate.x, gate.y - 10], [gate.x, 318], [gate.x, door.y + 44]]);
  arrowHead(g, gate.x, door.y + 40, "up", 8);
  dashedLine(g, [[gate.x, 318], [majlis.x - 14, 318]]);
  arrowHead(g, majlis.x - 10, 318, "right", 8);
  // …and from the car park
  dashedLine(g, [[park.x + park.w, 318], [gate.x - 12, 318]], PATH, 2, [6, 7]);

  // the pins, numbered as in the legend
  pin(g, 1, park.x + 16, park.y - 2, 15);
  pin(g, 2, majlis.x + 16, majlis.y - 2, 15);
  pin(g, 3, hall.x + 16, hall.y - 2, 15);

  text(g, "not to scale", MAP_W - 22, MAP_H - 18, serif(12, "i400"), TAUPE, "right");
  g.restore();
}
