import type { BridesmaidCard, GemCut } from "./types";

/**
 * The stones a bridesmaid can be — each with its colour, what it embodies and a role on the day
 * written from that meaning. Picking a stone in the binder fills a card in from here; every line
 * stays editable afterwards, so these are starting points, not rules.
 *
 * The first six are the bridesmaids' palette from the Dress Code (the Maid of Honor's Citrine
 * among them), with the exact hexes the site swatches; the rest are there for a seventh girl,
 * a junior bridesmaid, or simply a better fit for someone.
 */
export type Jewel = {
  id: string;
  name: string;
  hex: string;
  cut: GemCut;
  /** What the stone stands for — printed under the gem. */
  embodies: string;
  role_title: string;
  tagline: string;
  mission: string;
  duties: string[];
  pro_tip: string;
};

export const JEWELS: Jewel[] = [
  {
    id: "sapphire", name: "Sapphire", hex: "#0A2A6E", cut: "cushion",
    embodies: "Wisdom, loyalty and a deep, steady calm — the stone of true friends.",
    role_title: "Keeper of the Vows & Calm in the Storm",
    tagline: "You hold the words. I hold the nerves. You hold me.",
    mission: "Sapphire is the stone of wisdom and loyalty — the deep blue that steadies everything around it. That is you. You are my rock and my confidante, the guardian of the most sacred minutes of the day and the voice in my ear that says: breathe, you have got this.",
    duties: [
      "Keep the vow books and the rings safe until the very second they are needed.",
      "Talk me down from any pre-ceremony jitters — deep breaths, a squeeze of the hand, a terrible joke.",
      "Give the toast everyone will still be quoting next year.",
    ],
    pro_tip: "Keep a tissue in your sleeve. You will need it before I do.",
  },
  {
    id: "amethyst", name: "Amethyst", hex: "#5E2487", cut: "oval",
    embodies: "Peace, clarity and a clear head — the stone people reach for when they need to breathe.",
    role_title: "Peacekeeper & Family Anchor",
    tagline: "Keeping the peace, the timeline and the family in line — gracefully.",
    mission: "Amethyst is the stone of calm and clear thinking, and you have both in abundance. You are the grounding presence that keeps our VIPs — the mothers, the grandmothers, the aunties — happy, organised and exactly where they need to be, so I only ever hear the lovely parts.",
    duties: [
      "Shepherd the family: who stands where, who sits where, who needs a chair in the shade.",
      "Field the relatives' questions so that not a single one reaches me.",
      "Keep everyone centred and smiling, from the first photo to the send-off.",
    ],
    pro_tip: "Know where both mothers are at all times. They are the real timeline.",
  },
  {
    id: "garnet", name: "Garnet", hex: "#8E1226", cut: "cushion",
    embodies: "Commitment, protection and keeping things whole — the traveller's stone.",
    role_title: "Fashion Surgeon & Wardrobe Medic",
    tagline: "When a wardrobe emergency strikes, you swoop in and fix it.",
    mission: "Garnet is the stone of protection and of holding things together — travellers carried it so nothing would come apart on the road. You are our tactical hero, armed with the emergency pouch that neutralises any fashion crisis on impact, before a single photo catches it.",
    duties: [
      "Fashion tape, safety pins, a stain pen, blister plasters and a lint roller — the full kit.",
      "A popped button, a snagged strap, a loose hem: fixed in under a minute, no fuss.",
      "A last check of every dress in the line-up before we walk.",
    ],
    pro_tip: "Pack thread in the colour of every bridesmaid dress — and a tiny pair of scissors.",
  },
  {
    id: "turquoise", name: "Turquoise", hex: "#0F7E7A", cut: "oval",
    embodies: "Friendship, protection and good fortune — worn as a shield for a thousand years.",
    role_title: "Hydration, Fuel & Bathroom Captain",
    tagline: "Fed, watered and safely out of every dress disaster.",
    mission: "Turquoise is the friendship stone, worn for protection since forever — and that is exactly your job. You are my ride-or-die bodyguard for everything behind the scenes: on your watch I will not faint, I will not get hangry, and I will not get stuck in a bathroom stall.",
    duties: [
      "Water, with a straw, so the lipstick survives.",
      "Snacks before the hunger shows on my face.",
      "The train, expertly held, during every gown and bathroom break — no questions asked.",
    ],
    pro_tip: "A granola bar in your clutch is worth more than the bouquet.",
  },
  {
    id: "ruby", name: "Ruby", hex: "#B01A63", cut: "brilliant",
    embodies: "Radiance, passion and a glow that does not fade as the night goes on.",
    role_title: "Glow-Up & Scent Specialist",
    tagline: "Smelling like a dream, looking like a vision — until the last dance.",
    mission: "Ruby is the stone of radiance — the light that stays bright long after everyone else has faded. You are in charge of keeping me pristine and unforgettable from the first \"I do\" to the final song: fresh, matte where it matters and smelling exactly like the day I want to remember.",
    duties: [
      "My wedding perfume, for a spritz before every entrance.",
      "Lip gloss fresh, T-zone matte, veil straight — before every camera flash.",
      "Stray hairs, smudged liner and shiny foreheads: handled before anyone else notices.",
    ],
    pro_tip: "Blotting papers in one pocket, gloss in the other. You will need both.",
  },
  {
    id: "citrine", name: "Citrine", hex: "#BE8B0F", cut: "pear",
    embodies: "Joy, sunshine and good energy — the stone that does not know how to dim.",
    role_title: "Hype Girl & Energy Officer",
    tagline: "Turning up the volume, the laughs and the celebration.",
    mission: "Citrine is bottled sunshine — the stone of joy and of energy that never runs out. You are the vibe-setter of the morning and the heartbeat of the night: any trace of nerves gets cured on contact with you, and nobody within earshot is allowed to be bored.",
    duties: [
      "Own the bridal-suite speaker — the getting-ready playlist is yours.",
      "Lead the toasts, start the dancing, keep the room laughing.",
      "Spot anyone having a quiet wobble and bring them back into the sunshine.",
    ],
    pro_tip: "Charge the speaker the night before. Nobody hypes in silence.",
  },
  {
    id: "emerald", name: "Emerald", hex: "#0A5C33", cut: "emerald",
    embodies: "Harmony, patience and everything in its season — the stone of growing things.",
    role_title: "Keeper of Time & Flow",
    tagline: "Every hour on the hour, with nobody feeling rushed.",
    mission: "Emerald is the stone of harmony and patient growth — everything in its own time. You hold the morning's timeline: hair, make-up, dresses, photos and the first look, each at its hour, all in rhythm, and all of it done with the calm of someone who has already thought three steps ahead.",
    duties: [
      "The schedule in your hand, the clock in your eye, the coordinator on speed dial.",
      "Gentle five-minute warnings — never a panic, never a shout.",
      "Make sure I actually sit down at least once before the ceremony.",
    ],
    pro_tip: "Build in ten quiet minutes that nobody else knows about. We will need them.",
  },
  {
    id: "opal", name: "Opal", hex: "#7FA7C9", cut: "oval",
    embodies: "Imagination, inspiration and every colour at once — the stone that catches the light.",
    role_title: "Content Creator Girl",
    tagline: "If it wasn't on vertical video, did it even happen?",
    mission: "Opal holds every colour at once — the stone of imagination and of catching the light exactly as it falls. You are the official paparazzi of the morning: the raw, the hilarious, the unrepeatable behind-the-scenes, all of it caught on my phone before the professionals even arrive.",
    duties: [
      "Candid clips, quick transitions and getting-ready moments — on my phone, not just yours.",
      "The reveal, the first look, my mother's face: all of it.",
      "A goldmine of memories waiting for me the morning after.",
    ],
    pro_tip: "Portable charger. Vertical. Always vertical.",
  },
  {
    id: "pearl", name: "Pearl", hex: "#A8907A", cut: "brilliant",
    embodies: "Serenity, patience and wisdom earned slowly — made quietly, layer by layer.",
    role_title: "Keeper of Calm & Small Comforts",
    tagline: "Serene on the outside, five steps ahead on the inside.",
    mission: "A pearl is made slowly and in quiet — the stone of serenity and of wisdom that was earned. You are the gentle presence of the morning: the warm hand, the right word, the comfort nobody knew they needed until you had already offered it.",
    duties: [
      "Tissues, mints, plasters and hand cream — the small-comforts kit lives with you.",
      "A kind word for the nervous, a chair for the tired, a glass of water for the overwhelmed.",
      "Sit with me in the last quiet minute before the doors open.",
    ],
    pro_tip: "Pack two handkerchiefs. One of them is for the mothers.",
  },
  {
    id: "topaz", name: "Topaz", hex: "#C2711F", cut: "emerald",
    embodies: "Clarity, focus and strength — the clear head in a busy room.",
    role_title: "Details & Documents Officer",
    tagline: "Nothing lost, nothing late, nothing forgotten.",
    mission: "Topaz is the stone of clarity and focus — the one that keeps a clear head when a room gets busy. You carry the things that must not go missing: the papers, the envelopes, the vendor list, the spare of everything, and the memory I will not have that day.",
    duties: [
      "The document folder and the vendor envelopes, handed over at exactly the right moment.",
      "The emergency numbers — coordinator, photographer, driver — saved in your phone.",
      "The spare earrings, the spare shoes, the spare of the spare.",
    ],
    pro_tip: "Write the checklist the night before and tick it out loud in the morning.",
  },
  {
    id: "aquamarine", name: "Aquamarine", hex: "#3E8FAE", cut: "pear",
    embodies: "Courage, calm water and clear words — the sailors' stone.",
    role_title: "Voice of Calm & Chief Messenger",
    tagline: "Clear words, steady voice, smooth sailing.",
    mission: "Aquamarine is the sailors' stone — courage, calm seas and saying the right thing clearly. You are the one who speaks for me when I cannot: to the coordinator, to the photographer, to the cousin at the door, to anyone who needs an answer right now and should not be asking the bride.",
    duties: [
      "Relay every question to the right person and bring back only what I need to know.",
      "Call the moments — line-up, first look, the walk — in a voice that settles the room.",
      "Be the point of contact on the group chat all morning long.",
    ],
    pro_tip: "Save the coordinator's number under \"CALL FIRST\".",
  },
  {
    id: "peridot", name: "Peridot", hex: "#8E9A25", cut: "oval",
    embodies: "Light, warmth and good omens — worn to keep bad dreams away.",
    role_title: "Morning Light & Good-Omen Officer",
    tagline: "Sunshine before the sun is even up.",
    mission: "Peridot is the stone of light — the ancients wore it to keep the night terrors away, and you have been doing that for me for years. You are the first smile of the morning: coffee, something to eat and the gentle \"we have got this\" that sets the tone of the entire day.",
    duties: [
      "Breakfast and coffee for the suite before anyone has to ask.",
      "Curtains open, candles lit, the good playlist on low.",
      "A little note or treat tucked into every bridesmaid's bag.",
    ],
    pro_tip: "Oat milk for the ones who ask. Trust me.",
  },
  {
    id: "rose_quartz", name: "Rose Quartz", hex: "#C96B86", cut: "cushion",
    embodies: "Love, tenderness and the kind of care that notices.",
    role_title: "Keeper of Hearts",
    tagline: "Soft words, warm hands, happy tears managed.",
    mission: "Rose quartz is the stone of love itself — gentleness, and the kind of care that notices before it is asked. You are the keeper of hearts this morning: mine, my mother's, and that of any bridesmaid whose mascara is about to go.",
    duties: [
      "Tissues before the tears, hugs before the nerves.",
      "Keep the letters and gifts the two of us are swapping safe until the moment.",
      "Check in on me, quietly, once every hour.",
    ],
    pro_tip: "Waterproof mascara for the whole suite. It is an investment.",
  },
  {
    id: "jade", name: "Jade", hex: "#23825A", cut: "cushion",
    embodies: "Harmony, balance and good fortune — luck you can hold.",
    role_title: "Harmony & Good-Fortune Officer",
    tagline: "Balance in the room, luck in the air.",
    mission: "Jade is the stone of harmony and good fortune — balance in every sense of the word. You keep the energy of the suite even: no drama, no rush, nobody left out — and the little traditions, something old, new, borrowed and blue, all found and accounted for.",
    duties: [
      "Something old, new, borrowed and blue — found, checked and pinned in place.",
      "Smooth over any friction long before it reaches me.",
      "Make sure every bridesmaid gets her moment in the photos.",
    ],
    pro_tip: "A coin in the shoe is optional. A spare blue ribbon is not.",
  },
  {
    id: "moonstone", name: "Moonstone", hex: "#7C8DA6", cut: "pear",
    embodies: "Intuition, new beginnings and quiet light.",
    role_title: "Intuition & New-Beginnings Officer",
    tagline: "You see what I need before I know it myself.",
    mission: "Moonstone is the stone of intuition and of beginnings. You read the room — and you read me — and you quietly make the next thing happen before anyone has to ask, right up to the moment you walk me into the next chapter.",
    duties: [
      "Notice the small things: the pin that is slipping, the bridesmaid who has gone quiet, the water I forgot.",
      "Keep my going-away bag packed, zipped and by the door.",
      "Walk me out at the end of the night with a steady arm and the flat shoes.",
    ],
    pro_tip: "A flat pair of shoes for me, in your bag, for the last hour.",
  },
  {
    id: "onyx", name: "Onyx", hex: "#2B2A33", cut: "emerald",
    embodies: "Strength, grounding and standing firm — the protector's stone.",
    role_title: "Bodyguard & Boundary Keeper",
    tagline: "Nothing and nobody gets through that shouldn't.",
    mission: "Onyx is the stone of strength and standing firm, and nobody does it with a warmer smile than you. You are the door: unexpected visitors, early guests and the cousin who wants \"just a quick peek\" — all of them handled kindly, firmly, and nowhere near me.",
    duties: [
      "Guard the suite door and the getting-ready window.",
      "Keep the groom and his men well away until the first look.",
      "Hold my phone, and decide who gets to reach me.",
    ],
    pro_tip: "\"She will see you at the ceremony\" solves almost everything.",
  },
];

export function findJewel(idOrName: string): Jewel | undefined {
  const key = idOrName.trim().toLowerCase().replace(/\s+/g, "_");
  return JEWELS.find((j) => j.id === key || j.name.toLowerCase() === idOrName.trim().toLowerCase());
}

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

/** The lines a stone fills in — everything except the bridesmaid's own name, note and the sign-off. */
export function jewelLines(j: Jewel): Pick<BridesmaidCard, "jewel" | "color" | "cut" | "greeting" | "embodies" | "role_title" | "tagline" | "mission" | "duties" | "pro_tip"> {
  return {
    jewel: j.name,
    color: j.hex,
    cut: j.cut,
    greeting: `Thank you, my ${j.name}`,
    embodies: j.embodies,
    role_title: j.role_title,
    tagline: j.tagline,
    mission: j.mission,
    duties: j.duties.join("\n"),
    pro_tip: j.pro_tip,
  };
}

/** A complete card for a new bridesmaid, written from her stone and the wedding's details. */
export function newBridesmaidCard(id: string, name: string, j: Jewel, ctx: CardContext, order: number): BridesmaidCard {
  return {
    id,
    name,
    ...jewelLines(j),
    kicker: "For my bridesmaid",
    subline: sublineFor(name),
    note: `${salutationFor(name)}\n\nThank you for saying yes to standing beside me. Of all the people in my life, you are one of the few I could not imagine this day without — and now I don't have to.\n\nYou have been my ${j.name.toLowerCase()} long before I asked: steady when I wobble, honest when I need it, and always, always on my side. I cannot wait to turn around on the day and find you there.`,
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

/** The stone's colour as an ink: light stones (opal, pearl, moonstone) are deepened so words stay legible on paper. */
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
