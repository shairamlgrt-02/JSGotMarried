import type { BridesmaidCard, GemCut } from "./types";

/**
 * The bridesmaids' stones and the roles a bridesmaid can be given on the day.
 *
 * The stones are the bridesmaids' palette from the Dress Code, with the exact hexes the site
 * swatches: Garnet for the Maid of Honor, the Matron of Honor and the bride's sister-in-law, and
 * Turquoise, Citrine, Amethyst, Sapphire and Ruby for the bridesmaids. (The greens, browns, greys
 * and the like belong to the groom's side and the guests, so they are not offered here — though a
 * stone of your own is only a word and a swatch away.)
 *
 * Roles are separate from stones, because three women share Garnet and each needs her own job.
 * Every role is written so it reads after any stone's opening sentence — a card's mission is the
 * stone's `spirit` followed by the role's `mission` — and each stone still has the role that was
 * written in its spirit (`ownRole`), which is what a card starts with.
 *
 * Picking a stone or a role in the binder fills the card in from here; every line stays editable.
 */
export type Stone = {
  id: string;
  name: string;
  hex: string;
  cut: GemCut;
  /** What the stone stands for — printed under the gem. */
  embodies: string;
  /** The stone's opening sentence of the mission — "Sapphire is the stone of…". */
  spirit: string;
  /** The role written in this stone's spirit. */
  ownRole: string;
};

export type Role = {
  id: string;
  title: string;
  tagline: string;
  /** The "you are…" of the mission — reads after any stone's `spirit`. */
  mission: string;
  duties: string[];
  pro_tip: string;
};

export const STONES: Stone[] = [
  {
    id: "garnet", name: "Garnet", hex: "#8E1226", cut: "cushion",
    embodies: "Commitment, protection and keeping things whole — the stone of the ones who hold you up.",
    spirit: "Garnet is the stone of commitment and of holding things together — travellers carried it so nothing would come apart on the road.",
    ownRole: "wardrobe_medic",
  },
  {
    id: "turquoise", name: "Turquoise", hex: "#0F7E7A", cut: "oval",
    embodies: "Friendship, protection and good fortune — worn as a shield for a thousand years.",
    spirit: "Turquoise is the friendship stone, worn for protection since forever.",
    ownRole: "hydration",
  },
  {
    id: "citrine", name: "Citrine", hex: "#BE8B0F", cut: "pear",
    embodies: "Joy, sunshine and good energy — the stone that does not know how to dim.",
    spirit: "Citrine is bottled sunshine — the stone of joy and of energy that never runs out.",
    ownRole: "hype_girl",
  },
  {
    id: "amethyst", name: "Amethyst", hex: "#5E2487", cut: "oval",
    embodies: "Peace, clarity and a clear head — the stone people reach for when they need to breathe.",
    spirit: "Amethyst is the stone of calm and clear thinking — the one people reach for when they need to breathe.",
    ownRole: "family_anchor",
  },
  {
    id: "sapphire", name: "Sapphire", hex: "#0A2A6E", cut: "cushion",
    embodies: "Wisdom, loyalty and a deep, steady calm — the stone of true friends.",
    spirit: "Sapphire is the stone of wisdom and loyalty — the deep blue that steadies everything around it.",
    ownRole: "keeper_of_vows",
  },
  {
    id: "ruby", name: "Ruby", hex: "#B01A63", cut: "brilliant",
    embodies: "Radiance, passion and a glow that does not fade as the night goes on.",
    spirit: "Ruby is the stone of radiance — the light that stays bright long after everyone else has faded.",
    ownRole: "glow_up",
  },
];

/** Who gets Garnet: the stones the rest of the bridesmaids are handed, in this order. */
export const HONOR_STONE = "garnet";
export const BRIDESMAID_STONES = ["turquoise", "citrine", "amethyst", "sapphire", "ruby"];

export const ROLES: Role[] = [
  {
    id: "keeper_of_vows",
    title: "Keeper of the Vows & Calm in the Storm",
    tagline: "You hold the words. I hold the nerves. You hold me.",
    mission: "That is you: my rock and my confidante, the guardian of the most sacred minutes of the day, and the voice in my ear that says — breathe, you have got this.",
    duties: [
      "Keep the vow books and the rings safe until the very second they are needed.",
      "Talk me down from any pre-ceremony jitters — deep breaths, a squeeze of the hand, a terrible joke.",
      "Give the toast everyone will still be quoting next year.",
    ],
    pro_tip: "Keep a tissue in your sleeve. You will need it before I do.",
  },
  {
    id: "family_anchor",
    title: "Peacekeeper & Family Anchor",
    tagline: "Keeping the peace, the timeline and the family in line — gracefully.",
    mission: "You are the grounding presence that keeps our VIPs — the mothers, the grandmothers, the aunties — happy, organised and exactly where they need to be, so I only ever hear the lovely parts.",
    duties: [
      "Shepherd the family: who stands where, who sits where, who needs a chair in the shade.",
      "Field the relatives' questions so that not a single one reaches me.",
      "Keep everyone centred and smiling, from the first photo to the send-off.",
    ],
    pro_tip: "Know where both mothers are at all times. They are the real timeline.",
  },
  {
    id: "glow_up",
    title: "Glow-Up & Scent Specialist",
    tagline: "Smelling like a dream, looking like a vision — until the last dance.",
    mission: "You are in charge of keeping me pristine and unforgettable from the first “I do” to the final song: fresh, matte where it matters, and smelling exactly like the day I want to remember.",
    duties: [
      "My wedding perfume, for a spritz before every entrance.",
      "Lip gloss fresh, T-zone matte, veil straight — before every camera flash.",
      "Stray hairs, smudged liner and shiny foreheads: handled before anyone else notices.",
    ],
    pro_tip: "Blotting papers in one pocket, gloss in the other. You will need both.",
  },
  {
    id: "hydration",
    title: "Hydration, Fuel & Bathroom Captain",
    tagline: "Fed, watered and safely out of every dress disaster.",
    mission: "You are my ride-or-die bodyguard for everything behind the scenes: on your watch I will not faint, I will not get hangry, and I will not get stuck in a bathroom stall.",
    duties: [
      "Water, with a straw, so the lipstick survives.",
      "Snacks before the hunger shows on my face.",
      "The train, expertly held, during every gown and bathroom break — no questions asked.",
    ],
    pro_tip: "A granola bar in your clutch is worth more than the bouquet.",
  },
  {
    id: "wardrobe_medic",
    title: "Fashion Surgeon & Wardrobe Medic",
    tagline: "When a wardrobe emergency strikes, you swoop in and fix it.",
    mission: "You are our tactical hero, armed with the emergency pouch that neutralises any fashion crisis on impact — before a single photo catches it.",
    duties: [
      "Fashion tape, safety pins, a stain pen, blister plasters and a lint roller — the full kit.",
      "A popped button, a snagged strap, a loose hem: fixed in under a minute, no fuss.",
      "A last check of every dress in the line-up before we walk.",
    ],
    pro_tip: "Pack thread in the colour of every bridesmaid dress — and a tiny pair of scissors.",
  },
  {
    id: "content_creator",
    title: "Content Creator Girl",
    tagline: "If it wasn't on vertical video, did it even happen?",
    mission: "You are the official paparazzi of the morning: the raw, the hilarious, the unrepeatable behind-the-scenes, all of it caught on my phone before the professionals even arrive.",
    duties: [
      "Candid clips, quick transitions and getting-ready moments — on my phone, not just yours.",
      "The reveal, the first look, my mother's face: all of it.",
      "A goldmine of memories waiting for me the morning after.",
    ],
    pro_tip: "Portable charger. Vertical. Always vertical.",
  },
  {
    id: "hype_girl",
    title: "Hype Girl & Energy Officer",
    tagline: "Turning up the volume, the laughs and the celebration.",
    mission: "You are the vibe-setter of the morning and the heartbeat of the night: any trace of nerves gets cured on contact with you, and nobody within earshot is allowed to be bored.",
    duties: [
      "Own the bridal-suite speaker — the getting-ready playlist is yours.",
      "Lead the toasts, start the dancing, keep the room laughing.",
      "Spot anyone having a quiet wobble and bring them back into the sunshine.",
    ],
    pro_tip: "Charge the speaker the night before. Nobody hypes in silence.",
  },
  {
    id: "timekeeper",
    title: "Keeper of Time & Flow",
    tagline: "Every hour on the hour, with nobody feeling rushed.",
    mission: "You hold the morning's timeline: hair, make-up, dresses, photos and the first look, each at its hour, all in rhythm — with the calm of someone who has already thought three steps ahead.",
    duties: [
      "The schedule in your hand, the clock in your eye, the coordinator on speed dial.",
      "Gentle five-minute warnings — never a panic, never a shout.",
      "Make sure I actually sit down at least once before the ceremony.",
    ],
    pro_tip: "Build in ten quiet minutes that nobody else knows about. We will need them.",
  },
  {
    id: "documents",
    title: "Details & Documents Officer",
    tagline: "Nothing lost, nothing late, nothing forgotten.",
    mission: "You carry the things that must not go missing: the papers, the envelopes, the vendor list, the spare of everything — and the memory I will not have that day.",
    duties: [
      "The document folder and the vendor envelopes, handed over at exactly the right moment.",
      "The emergency numbers — coordinator, photographer, driver — saved in your phone.",
      "The spare earrings, the spare shoes, the spare of the spare.",
    ],
    pro_tip: "Write the checklist the night before and tick it out loud in the morning.",
  },
  {
    id: "messenger",
    title: "Voice of Calm & Chief Messenger",
    tagline: "Clear words, steady voice, smooth sailing.",
    mission: "You speak for me when I cannot: to the coordinator, to the photographer, to the cousin at the door — to anyone who needs an answer right now and should not be asking the bride.",
    duties: [
      "Relay every question to the right person and bring back only what I need to know.",
      "Call the moments — line-up, first look, the walk — in a voice that settles the room.",
      "Be the point of contact on the group chat all morning long.",
    ],
    pro_tip: "Save the coordinator's number under “CALL FIRST”.",
  },
  {
    id: "bodyguard",
    title: "Bodyguard & Boundary Keeper",
    tagline: "Nothing and nobody gets through that shouldn't.",
    mission: "You are the door: unexpected visitors, early guests and the cousin who wants “just a quick peek” — all of them handled kindly, firmly, and nowhere near me.",
    duties: [
      "Guard the suite door and the getting-ready window.",
      "Keep the groom and his men well away until the first look.",
      "Hold my phone, and decide who gets to reach me.",
    ],
    pro_tip: "“She will see you at the ceremony” solves almost everything.",
  },
  {
    id: "hearts",
    title: "Keeper of Hearts",
    tagline: "Soft words, warm hands, happy tears managed.",
    mission: "You are the keeper of hearts this morning: mine, my mother's, and that of any bridesmaid whose mascara is about to go.",
    duties: [
      "Tissues before the tears, hugs before the nerves.",
      "Keep the letters and gifts the two of us are swapping safe until the moment.",
      "Check in on me, quietly, once every hour.",
    ],
    pro_tip: "Waterproof mascara for the whole suite. It is an investment.",
  },
  {
    id: "morning_light",
    title: "Morning Light & Good-Omen Officer",
    tagline: "Sunshine before the sun is even up.",
    mission: "You are the first smile of the morning: coffee, something to eat and the gentle “we have got this” that sets the tone of the entire day.",
    duties: [
      "Breakfast and coffee for the suite before anyone has to ask.",
      "Curtains open, candles lit, the good playlist on low.",
      "A little note or treat tucked into every bridesmaid's bag.",
    ],
    pro_tip: "Oat milk for the ones who ask. Trust me.",
  },
];

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, "_");

export function findStone(idOrName: string): Stone | undefined {
  const key = norm(idOrName);
  return STONES.find((s) => s.id === key || norm(s.name) === key);
}
export const stoneById = (id: string) => STONES.find((s) => s.id === id);

export function findRole(idOrTitle: string): Role | undefined {
  const key = idOrTitle.trim().toLowerCase();
  return ROLES.find((r) => r.id === key || r.title.toLowerCase() === key);
}
export const roleById = (id: string) => ROLES.find((r) => r.id === id);
/** The stone a role was written for, if any — Garnet's own is the wardrobe medic, Sapphire's the keeper of the vows… */
export const stoneOfRole = (roleId: string) => STONES.find((s) => s.ownRole === roleId);

/** The card's mission: the stone's opening sentence, then the role's — or just the role's for a stone of her own. */
export const missionFor = (stone: Stone | undefined, role: Role) => (stone ? `${stone.spirit} ${role.mission}` : role.mission);

/** The wedding details a card's default lines are written from. */
export type CardContext = { bride: string; initials: string; date: string };

const first = (name: string) => name.trim().split(/\s+/)[0] ?? "";
/** "for saying yes, Ana" — the capitals under the greeting. */
export const sublineFor = (name: string) => (first(name) ? `for saying yes, ${first(name)}` : "for saying yes");
/** "Dear Ana," — the first line of the note. */
export const salutationFor = (name: string) => (first(name) ? `Dear ${first(name)},` : "Dearest,");

/**
 * The patch for a card whose bridesmaid was renamed: the subline and the note's salutation follow
 * the name as long as they still read exactly as the card first wrote them.
 */
export function renamed(c: BridesmaidCard, name: string): Partial<BridesmaidCard> {
  const patch: Partial<BridesmaidCard> = { name };
  if (c.subline.trim() === sublineFor(c.name)) patch.subline = sublineFor(name);
  const was = salutationFor(c.name);
  if (c.note.startsWith(was)) patch.note = salutationFor(name) + c.note.slice(was.length);
  return patch;
}

/** The lines a stone fills in: her colour, cut, the greeting and what the stone embodies. */
export function stoneLines(s: Stone): Pick<BridesmaidCard, "jewel" | "color" | "cut" | "greeting" | "embodies"> {
  return { jewel: s.name, color: s.hex, cut: s.cut, greeting: `Thank you, my ${s.name}`, embodies: s.embodies };
}

/** The lines a role fills in, with the mission opened by her stone. */
export function roleLines(r: Role, stone?: Stone): Pick<BridesmaidCard, "role_title" | "tagline" | "mission" | "duties" | "pro_tip"> {
  return { role_title: r.title, tagline: r.tagline, mission: missionFor(stone, r), duties: r.duties.join("\n"), pro_tip: r.pro_tip };
}

/** A complete card for a new bridesmaid, written from her stone, her role and the wedding's details. */
export function newBridesmaidCard(id: string, name: string, stone: Stone, role: Role, ctx: CardContext, order: number, kicker = "For my bridesmaid"): BridesmaidCard {
  return {
    id,
    name,
    ...stoneLines(stone),
    ...roleLines(role, stone),
    kicker,
    subline: sublineFor(name),
    note: `${salutationFor(name)}\n\nThank you for saying yes to standing beside me. Of all the people in my life, you are one of the few I could not imagine this day without — and now I don't have to.\n\nYou have been my ${stone.name.toLowerCase()} long before I asked: steady when I wobble, honest when I need it, and always, always on my side. I cannot wait to turn around on the day and find you there.`,
    role_kicker: "Her role on the day",
    closing: `With all my love, ${ctx.bride || "the bride"}`,
    footer: [ctx.initials, ctx.date].filter(Boolean).join(" · "),
    order,
  };
}

/** Lighten (amount > 0) or darken (amount < 0) a hex colour by mixing it with white / black. */
export function shade(hex: string, amount: number): string {
  const rgb = parseHex(hex);
  if (!rgb) return hex;
  const target = amount > 0 ? 255 : 0;
  const k = Math.min(1, Math.abs(amount));
  const [r, g, b] = rgb.map((c) => Math.round(c + (target - c) * k));
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

/** The stone's colour as an ink: a light stone is deepened so words stay legible on paper. */
export function inkOf(hex: string): string {
  const rgb = parseHex(hex);
  if (!rgb) return "#6E1F2E";
  const lum = (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255;
  return lum > 0.42 ? shade(hex, -Math.min(0.45, (lum - 0.42) * 1.6 + 0.15)) : hex;
}

export function parseHex(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = [...h].map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
