import { ALL_WELCOME_FROM, ENTOURAGE_CALL_TIME, HALL_CLOSED_FROM, HALL_CLOSED_UNTIL, RECEPTION_AT, type ArrivalWindow } from "./program";
import { EDGE, LACE, MOCHA, PAPER, TAUPE, WINE, caps, capsWidth, pin, roundRect, serif, text } from "./card-draw";

/**
 * A small wayfinding plan of the venue for the programme card: where the hall is, where the
 * majlis is (just outside it), the courtyard beside it and where the entrance is — the places the
 * arrival notes send a guest to, numbered to match the legend printed under the map.
 *
 * The one flow on the plan: from the gate, straight to the majlis — the hall is The Heaven's to
 * clean and prepare until 4:00 PM, so everybody (entourage included) gathers at the majlis first,
 * and the whole party walks into the hall together just before the procession.
 *
 * Parking is deliberately NOT drawn: it is not in the grounds (the open yard beside the path is
 * just the courtyard) but in a separate area, and The Heaven's team tell each car where to go when
 * it arrives at the gate — so the plan says exactly that at the entrance and nothing more.
 *
 * ┌─ PROVISIONAL ──────────────────────────────────────────────────────────────────────────────┐
 * │ This is a schematic, not a survey: the entrance path, the courtyard to one side of it, the │
 * │ majlis beside the hall doors. Redraw the shapes below from the couple's own sketch of The  │
 * │ Heaven — everything is in the logical MAP_W × MAP_H space and scales to the box it is given.│
 * └────────────────────────────────────────────────────────────────────────────────────────────┘
 */
export const MAP_W = 640;
export const MAP_H = 440;

/** The two arrival notes written onto the plan itself — one on the hall, one on the majlis. */
export const MAP_NOTE_HALL = [`Closed ${HALL_CLOSED_FROM} – ${HALL_CLOSED_UNTIL} · being prepared`];
export const MAP_NOTE_MAJLIS = ["Everyone gathers at the majlis first", `Entourage ${ENTOURAGE_CALL_TIME} · Guests ${ALL_WELCOME_FROM}`];
/** How a guest gets from the majlis into the hall — the line along the majlis-to-hall arrow. */
export const MAP_NOTE_WALK_IN = "just before 4:00 PM · all together";
export const MAP_NOTE_ENTOURAGE = MAP_NOTE_HALL;
export const MAP_NOTE_GUESTS = MAP_NOTE_MAJLIS;
/**
 * Where the cars go: not the courtyard, but a separate area that The Heaven's team point each car
 * to on arrival at the gate. Two short lines at the gate on the plan itself — and, beside the plan
 * on the programme card, the third wayfinding note, in the same shape as the arrival windows.
 */
export const MAP_NOTE_PARKING = ["parking is in a separate area —", "The Heaven's team will tell you where at the gate"];
export const PARKING_NOTE: ArrivalWindow = {
  when: "Parking",
  where: "A separate area",
  detail: "Not in the courtyard — The Heaven's team will tell you where to park when you arrive at the gate.",
};

/** The legend under the map — the same numbers as the pins, in the order a guest meets them. */
export const VENUE_MAP_LEGEND: { n: number; place: string }[] = [
  { n: 1, place: "The entrance" },
  { n: 2, place: "The majlis" },
  { n: 3, place: "The hall" },
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

function arrowHead(g: Ctx, x: number, y: number, dir: "up" | "right" | "left", size = 9, color = WINE) {
  g.fillStyle = color;
  g.beginPath();
  if (dir === "up") { g.moveTo(x, y - size); g.lineTo(x - size * 0.8, y + size * 0.6); g.lineTo(x + size * 0.8, y + size * 0.6); }
  else if (dir === "left") { g.moveTo(x - size, y); g.lineTo(x + size * 0.6, y - size * 0.8); g.lineTo(x + size * 0.6, y + size * 0.8); }
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

/** Flagstone paving for the courtyard — a soft grid of slabs, every other row set half a slab over. */
function paving(g: Ctx, x: number, y: number, w: number, h: number, slab = 22) {
  g.save();
  roundRect(g, x, y, w, h, 6); g.clip();
  g.strokeStyle = PATH;
  g.lineWidth = 1.2;
  const rows = Math.ceil(h / slab);
  for (let r = 0; r <= rows; r++) {
    const yy = y + r * slab;
    g.beginPath(); g.moveTo(x, yy); g.lineTo(x + w, yy); g.stroke();
    for (let xx = x + (r % 2 ? slab / 2 : 0); xx < x + w; xx += slab) {
      g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx, yy + slab); g.stroke();
    }
  }
  g.restore();
}

/** A line of italic serif that shrinks a little rather than run past `maxW`. */
function note(g: Ctx, s: string, x: number, y: number, maxW: number, size = 13, color = MOCHA) {
  g.font = serif(size, "i400");
  while (g.measureText(s).width > maxW && size > 10) { size -= 0.5; g.font = serif(size, "i400"); }
  text(g, s, x, y, serif(size, "i400"), color, "left");
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

  // ── the hall (ceremony & reception) — closed until 4:00 while it is prepared ──
  const hall = { x: 170, y: 28, w: 444, h: 206 };
  roundRect(g, hall.x, hall.y, hall.w, hall.h, 10);
  g.fillStyle = PAPER; g.fill();
  g.strokeStyle = WINE; g.lineWidth = 2.6; g.stroke();
  band(g, hall.x, hall.y, hall.w, 10, MAP_NOTE_HALL);
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
  const majlis = { x: 364, y: 262, w: 250, h: 112 };
  roundRect(g, majlis.x, majlis.y, majlis.w, majlis.h, 14);
  g.fillStyle = "#F9F1E4"; g.fill();
  g.save(); g.setLineDash([7, 5]); g.strokeStyle = WINE; g.lineWidth = 2; g.stroke(); g.restore();
  const majlisBand = band(g, majlis.x, majlis.y, majlis.w, 14, MAP_NOTE_MAJLIS);
  // low seating around a centre table
  const lounge = majlis.y + majlisBand + 20;
  g.fillStyle = SEAT;
  for (const cx of [majlis.x + 56, majlis.x + 84, majlis.x + majlis.w - 84, majlis.x + majlis.w - 56]) {
    roundRect(g, cx - 10, lounge - 5, 20, 10, 5); g.fill();
  }
  g.beginPath(); g.ellipse(majlis.x + majlis.w / 2, lounge, 22, 10, 0, 0, Math.PI * 2); g.fillStyle = "#E9DCCB"; g.fill();
  caps(g, "the majlis", majlis.x + majlis.w / 2, majlis.y + majlis.h - 24, 16, WINE, 0.26);
  text(g, "briefing · snacks · welcome toast & photos", majlis.x + majlis.w / 2, majlis.y + majlis.h - 8, serif(11.5, "i400"), MOCHA);

  // ── the courtyard — an open paved yard across the path from the majlis (not the parking) ──
  const yard = { x: 30, y: 262, w: 206, h: 112 };
  roundRect(g, yard.x, yard.y, yard.w, yard.h, 10);
  g.fillStyle = "#EBE3D5"; g.fill();
  g.strokeStyle = EDGE; g.lineWidth = 1.4; g.stroke();
  paving(g, yard.x + 14, yard.y + 12, yard.w - 28, yard.h - 24);
  const yardLabelW = capsWidth(g, "the courtyard", 13, 0.26);
  g.fillStyle = "rgba(252,250,245,.88)";
  roundRect(g, yard.x + yard.w / 2 - yardLabelW / 2 - 14, yard.y + yard.h / 2 - 12, yardLabelW + 28, 24, 12); g.fill();
  caps(g, "the courtyard", yard.x + yard.w / 2, yard.y + yard.h / 2 + 5, 13, TAUPE, 0.26);

  // ── the entrance and the walk in — where The Heaven's team say where to park ──
  const gate = { x: 300, y: MAP_H - 4 };
  g.strokeStyle = GROUND; g.lineWidth = 6; g.beginPath(); g.moveTo(gate.x - 26, gate.y); g.lineTo(gate.x + 26, gate.y); g.stroke();
  g.strokeStyle = WINE; g.lineWidth = 2.2;
  g.beginPath(); g.moveTo(gate.x - 26, gate.y - 14); g.lineTo(gate.x - 26, gate.y + 2); g.moveTo(gate.x + 26, gate.y - 14); g.lineTo(gate.x + 26, gate.y + 2); g.stroke();
  arrowHead(g, gate.x, gate.y - 34, "up");
  const noteL = gate.x + 58;
  const noteW = MAP_W - 18 - noteL;
  caps(g, "entrance", noteL, gate.y - 35, 13, WINE, 0.26, "left");
  MAP_NOTE_PARKING.forEach((line, i) => note(g, line, noteL, gate.y - 20 + i * 13.5, noteW));
  // the path: in from the gate, straight up the courtyard side, then a step right into the majlis —
  // everyone gathers there first, because the hall is closed while it is being prepared
  const step = majlis.y + 64;
  dashedLine(g, [[gate.x, gate.y - 10], [gate.x, step]]);
  dashedLine(g, [[gate.x, step], [majlis.x - 14, step]]);
  arrowHead(g, majlis.x - 10, step, "right", 8);
  // …and just before the procession, the whole party walks in from the majlis to the hall together
  dashedLine(g, [[majlis.x + 60, majlis.y - 8], [door.x + door.w + 26, door.y + 16]], WINE, 2.2, [6, 7]);
  arrowHead(g, door.x + door.w + 22, door.y + 15, "left", 8);
  note(g, MAP_NOTE_WALK_IN, majlis.x + 66, majlis.y - 17, 210, 11.5, WINE);

  // the pins, numbered as in the legend — 1 sits by the entrance, where parking is explained
  pin(g, 1, gate.x + 36, gate.y - 40, 15);
  pin(g, 2, majlis.x + 16, majlis.y - 2, 15);
  pin(g, 3, hall.x + 16, hall.y - 2, 15);

  text(g, "not to scale", 30, MAP_H - 16, serif(12, "i400"), TAUPE, "left");
  g.restore();
}
