import { ALL_WELCOME_FROM, CEREMONY_DOORS_CLOSE, ENTOURAGE_CALL_TIME, RECEPTION_AT } from "./program";
import { EDGE, LACE, MOCHA, PAPER, TAUPE, WINE, caps, capsWidth, pin, roundRect, serif, text } from "./card-draw";

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
export const MAP_H = 440;

/** The two arrival notes written onto the plan itself — one on the hall, one on the majlis. */
export const MAP_NOTE_ENTOURAGE = [`Entourage & wedding team · ${ENTOURAGE_CALL_TIME} arrival`];
export const MAP_NOTE_GUESTS = ["Guests welcome", `${ALL_WELCOME_FROM.replace(/\s*PM$/, "")} – ${RECEPTION_AT} arrival`];
/** The Heaven posts people at the entrance to show cars where to park. */
export const PARKING_GUIDES = "The Heaven's team will meet you at the entrance and guide you where to park";

/** The legend under the map — the same numbers as the pins. */
export const VENUE_MAP_LEGEND: { n: number; place: string; detail: string }[] = [
  { n: 1, place: "Parking", detail: "their team meets you at the entrance and shows you where to park" },
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

/**
 * A wine strip along the top edge of a box with a note in lace caps, one line per entry — the
 * arrival notes on the plan. The text sits right of the pin that marks the box's corner.
 */
function band(g: Ctx, x: number, y: number, w: number, r: number, lines: string[]) {
  const lead = 17;
  const h = 8 + lines.length * lead;
  g.save();
  roundRect(g, x, y, w, h * 3, r); g.clip();
  g.fillStyle = WINE; g.fillRect(x, y, w, h);
  g.restore();
  const inset = 24; // room for the numbered pin on the corner
  lines.forEach((line, i) => {
    let size = 11.5;
    while (capsWidth(g, line, size, 0.14) > w - inset - 16 && size > 8) size -= 0.5;
    caps(g, line, x + inset + (w - inset) / 2, y + 4 + (i + 1) * lead - 3, size, LACE, 0.14);
  });
  return h;
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
  const hall = { x: 170, y: 28, w: 444, h: 206 };
  roundRect(g, hall.x, hall.y, hall.w, hall.h, 10);
  g.fillStyle = PAPER; g.fill();
  g.strokeStyle = WINE; g.lineWidth = 2.6; g.stroke();
  band(g, hall.x, hall.y, hall.w, 10, MAP_NOTE_ENTOURAGE);
  // stage at the far end
  roundRect(g, hall.x + 110, hall.y + 36, hall.w - 220, 16, 6);
  g.fillStyle = "#E9DCCB"; g.fill();
  caps(g, "stage", hall.x + hall.w / 2, hall.y + 48, 10, TAUPE, 0.3);
  // reserved rows (wine) with open seats behind them
  text(g, "reserved rows · families & entourage", hall.x + hall.w / 2, hall.y + 70, serif(14, "i400"), WINE);
  seatRows(g, hall.x + 72, hall.y + 84, hall.w - 144, 5, 2, 17);
  text(g, "open seats around them", hall.x + hall.w / 2, hall.y + 168, serif(14, "i400"), TAUPE);
  caps(g, "the hall", hall.x + hall.w / 2, hall.y + 193, 21, WINE, 0.3);
  // the doors — a gap in the front wall under the walk-in, two leaves swung open
  const door = { x: 300 - 22, y: hall.y + hall.h, w: 44 };
  g.strokeStyle = PAPER; g.lineWidth = 4; g.beginPath(); g.moveTo(door.x, door.y); g.lineTo(door.x + door.w, door.y); g.stroke();
  g.strokeStyle = WINE; g.lineWidth = 2;
  g.beginPath(); g.arc(door.x, door.y, 20, 0, Math.PI / 2); g.stroke();
  g.beginPath(); g.arc(door.x + door.w, door.y, 20, Math.PI / 2, Math.PI); g.stroke();
  text(g, "doors", door.x - 30, door.y + 18, serif(13, "i400"), WINE, "right");

  // ── the majlis, just outside the hall ──
  const majlis = { x: 364, y: 268, w: 250, h: 112 };
  roundRect(g, majlis.x, majlis.y, majlis.w, majlis.h, 14);
  g.fillStyle = "#F9F1E4"; g.fill();
  g.save(); g.setLineDash([7, 5]); g.strokeStyle = WINE; g.lineWidth = 2; g.stroke(); g.restore();
  const majlisBand = band(g, majlis.x, majlis.y, majlis.w, 14, MAP_NOTE_GUESTS);
  // low seating around a centre table
  const lounge = majlis.y + majlisBand + 20;
  g.fillStyle = SEAT;
  for (const cx of [majlis.x + 56, majlis.x + 84, majlis.x + majlis.w - 84, majlis.x + majlis.w - 56]) {
    roundRect(g, cx - 10, lounge - 5, 20, 10, 5); g.fill();
  }
  g.beginPath(); g.ellipse(majlis.x + majlis.w / 2, lounge, 22, 10, 0, 0, Math.PI * 2); g.fillStyle = "#E9DCCB"; g.fill();
  caps(g, "the majlis", majlis.x + majlis.w / 2, majlis.y + majlis.h - 24, 16, WINE, 0.26);
  text(g, "welcome toast, snacks & photos", majlis.x + majlis.w / 2, majlis.y + majlis.h - 8, serif(12, "i400"), MOCHA);

  // ── parking ──
  const park = { x: 30, y: 268, w: 206, h: 112 };
  roundRect(g, park.x, park.y, park.w, park.h, 10);
  g.fillStyle = "#EBE3D5"; g.fill();
  g.strokeStyle = EDGE; g.lineWidth = 1.4; g.stroke();
  parkingBays(g, park.x + 14, park.y + 12, park.w - 28, park.h - 24);
  g.fillStyle = "rgba(252,250,245,.88)";
  roundRect(g, park.x + park.w / 2 - 54, park.y + park.h / 2 - 12, 108, 24, 12); g.fill();
  caps(g, "parking", park.x + park.w / 2, park.y + park.h / 2 + 5, 14, TAUPE, 0.3);

  // ── the entrance and the walk in ──
  const gate = { x: 300, y: MAP_H - 4 };
  g.strokeStyle = GROUND; g.lineWidth = 6; g.beginPath(); g.moveTo(gate.x - 26, gate.y); g.lineTo(gate.x + 26, gate.y); g.stroke();
  g.strokeStyle = WINE; g.lineWidth = 2.2;
  g.beginPath(); g.moveTo(gate.x - 26, gate.y - 14); g.lineTo(gate.x - 26, gate.y + 2); g.moveTo(gate.x + 26, gate.y - 14); g.lineTo(gate.x + 26, gate.y + 2); g.stroke();
  arrowHead(g, gate.x, gate.y - 34, "up");
  caps(g, "entrance", gate.x + 42, gate.y - 30, 13, WINE, 0.26, "left");
  text(g, "The Heaven's team will guide you to parking", gate.x + 42, gate.y - 10, serif(13, "i400"), MOCHA, "left");
  // the path: in from the gate, straight up to the doors — with a step right for the majlis
  dashedLine(g, [[gate.x, gate.y - 10], [gate.x, door.y + 44]]);
  arrowHead(g, gate.x, door.y + 40, "up", 8);
  dashedLine(g, [[gate.x, 326], [majlis.x - 14, 326]]);
  arrowHead(g, majlis.x - 10, 326, "right", 8);
  // …and from the car park
  dashedLine(g, [[park.x + park.w, 326], [gate.x - 12, 326]], PATH, 2, [6, 7]);

  // the pins, numbered as in the legend
  pin(g, 1, park.x + 16, park.y - 2, 15);
  pin(g, 2, majlis.x + 16, majlis.y - 2, 15);
  pin(g, 3, hall.x + 16, hall.y - 2, 15);

  text(g, "not to scale", 30, MAP_H - 16, serif(12, "i400"), TAUPE, "left");
  g.restore();
}
