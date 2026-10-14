/**
 * The order of the day — one source for the website's Program section, the guest's downloadable
 * keepsake card and the programme card (lib/program-card.ts), so none of them can drift apart.
 *
 * Two facts matter more than anything else here, so they are written once and shown on every
 * surface (timeline, highlight cards, keepsake, FAQ):
 *   · the ceremony is intimate and closed-door — a guest who wishes to witness it must be seated
 *     before 4:00 PM, because the doors close the moment the procession begins;
 *   · from 5:30 PM everyone is welcome — the Welcome Toast & Snacks run until the reception at 6:30 PM.
 */
export type ProgramStop = {
  time: string;
  title: string;
  /** Two–four words shown under the stop on the timeline — "Doors close at 4:00 PM". */
  tag?: string;
  /** One short sentence for the keepsake card, where there is room to say it properly. */
  note?: string;
  /**
   * The programme card's line under the stop. That card has already said who arrives when and
   * where the doors are, higher up — so this is the warm part: what the hour holds. (The `tag`
   * is printed beside the title there; this goes underneath.)
   */
  programmeNote?: string;
};

/** When the ceremony doors close — as the procession begins. Guests are asked to be seated before this. */
export const CEREMONY_DOORS_CLOSE = "4:00 PM";
/** From this time on every guest is welcome — no doors, no reserved rows. */
export const ALL_WELCOME_FROM = "5:30 PM";
/** The entourage and the wedding team's call time — the first stop of the day, half an hour before the doors close. */
export const ENTOURAGE_CALL_TIME = "3:30 PM";
/** When the hall opens for the reception. */
export const RECEPTION_AT = "6:30 PM";
/** The last stop of the night. */
export const SEND_OFF_AT = "10:00 PM";

export const WEDDING_PROGRAM_STOPS: ProgramStop[] = [
  {
    time: ENTOURAGE_CALL_TIME,
    title: "Entourage Arrival",
    tag: "Entourage & wedding team",
    note: "Our entourage & wedding team only — find your reserved seat and wait for the coordinators' cue.",
  },
  {
    time: "4:00 PM",
    title: "Wedding Ceremony",
    tag: `Doors close at ${CEREMONY_DOORS_CLOSE}`,
    note: `Be seated before ${CEREMONY_DOORS_CLOSE} — doors close as the procession begins.`,
  },
  { time: "5:00 PM", title: "Wedding Photos" },
  {
    time: "5:30 PM",
    title: "Welcome Toast & Snacks",
    tag: "Everyone welcome",
    note: "Everyone is welcome from here — join us before the reception.",
    programmeNote: "this is the hour we expect you, and the hour we get to hug you",
  },
  {
    time: RECEPTION_AT,
    title: "Wedding Reception",
    programmeNote: "dinner, our film on the big screen, games and giveaways — then we dance",
  },
  { time: SEND_OFF_AT, title: "Send off" },
];

/* ─────────── Who arrives when — the programme card's two notes ───────────
   The card a guest saves says, before anything else, that nobody needs to be there at 4:00 PM:
   the entourage and the wedding team have a call time and a job (reserved seats, wait for the
   coordinators' cue); everyone else is expected at 5:30 PM at the majlis — and if they arrive at
   some other hour, GUEST_ARRIVAL_GUIDE tells them where to go. Written once, here. */

/** The sentence at the top of the programme card — the one thing every guest must read. */
export const PROGRAM_HEADLINE = `You don't need to be there at ${CEREMONY_DOORS_CLOSE}.`;
/**
 * …and the warm explanation under it: the ceremony is welcome-but-small. It stops there on purpose —
 * the two notes (ARRIVAL_NOTES) sit right under it on the card and say when everyone else is expected.
 */
export const PROGRAM_HEADLINE_DETAIL =
  `Our ${CEREMONY_DOORS_CLOSE} ceremony is small and intimate — our families, our entourage and a few honoured guests. ` +
  `If your heart wishes to witness it, you are more than welcome; just be seated before ${CEREMONY_DOORS_CLOSE}, as the doors close the moment the procession begins.`;

export type ArrivalNote = {
  /** Who the note is for — its heading. */
  who: string;
  /** The hour they are asked to arrive by. */
  time: string;
  /** Where to head once they arrive. */
  where: string;
  /** The same in one short line — the website's Program section prints this beside the hour. */
  brief: string;
  /** What to do once there — the couple's own words, for the card. */
  detail: string;
};

/** The two notes, side by side on the card: the entourage & wedding team, and every other guest. */
export const ARRIVAL_NOTES: { entourage: ArrivalNote; guests: ArrivalNote } = {
  entourage: {
    who: "Entourage & wedding team",
    time: ENTOURAGE_CALL_TIME,
    where: "The hall",
    brief: "Find your reserved seat in the hall, then wait for the coordinators' cue.",
    detail:
      "Please come straight into the hall and find your reserved seat. Settle in and stay close by — our coordinators will give you the cue for the procession, so kindly wait for it.",
  },
  guests: {
    who: "All other guests",
    time: ALL_WELCOME_FROM,
    where: "The majlis",
    brief: `The majlis — welcome toast, snacks & photos; the reception at ${RECEPTION_AT}.`,
    detail:
      `Please join us at the majlis, just outside the hall, for the welcome toast, snacks and photos. At ${RECEPTION_AT} the hall opens for the reception — dinner, our film, games and dancing until the send-off.`,
  },
};

export type ArrivalWindow = {
  /** The hour (or span) a guest might turn up. */
  when: string;
  /** Where to go at that hour. */
  where: string;
  /** Why, and what they will find there. */
  detail: string;
};

/**
 * For guests who are not in the entourage and turn up at some *other* hour — early for the ceremony,
 * or while it is under way behind closed doors: where to go. The expected hours (5:30 at the majlis,
 * 6:30 the reception) are the guests' note above and the `programmeNote`s in the order of the day,
 * so they are not repeated here. Printed beside the plan of the venue on the programme card.
 */
export const GUEST_ARRIVAL_GUIDE: ArrivalWindow[] = [
  {
    when: `Before ${CEREMONY_DOORS_CLOSE}`,
    where: "The hall",
    detail: `Wish to witness the ceremony? Take an open seat around the reserved rows and be seated before ${CEREMONY_DOORS_CLOSE} — the doors close the moment the procession begins.`,
  },
  {
    when: `${CEREMONY_DOORS_CLOSE.replace(/\s*PM$/, "")} – ${ALL_WELCOME_FROM}`,
    where: "The majlis",
    detail: "The ceremony is under way behind closed doors. Make yourself at home at the majlis, just outside the hall — we will come and find you.",
  },
];

export type ProgramMoment = {
  /** The stop on the timeline this moment expands on. */
  time: string;
  /** How long it runs — the ribbon on the card. */
  span: string;
  title: string;
  /**
   * The couple's own words — warm, first person, a few sentences. Wrap the parts a guest must not
   * miss in *asterisks* (the hour, "everyone is welcome") and the card sets them in bold wine.
   */
  detail: string;
};

export const WEDDING_PROGRAM_HIGHLIGHTS: ProgramMoment[] = [
  {
    time: "4:00 PM",
    span: "4:00 – 5:00 PM",
    title: "The Ceremony",
    detail: `We chose to keep our ceremony *intimate* — our families, our entourage and a few honoured guests. If your heart wishes to be there as we say “I do”, you are *more than welcome to join us*. Just please be seated before *${CEREMONY_DOORS_CLOSE}*, as the *doors close the moment the procession begins*.`,
  },
  {
    time: "5:30 PM",
    span: "5:30 – 6:30 PM",
    title: "Welcome Toast & Snacks",
    detail: `From *${ALL_WELCOME_FROM}, everyone is welcome*! Come find us at the majlis just outside the hall for a toast, snacks, photo moments and little activities. This is the hour we get to hug you, laugh with you and take all the pictures — before the reception begins at *6:30 PM*.`,
  },
  {
    time: "6:30 PM",
    span: "6:30 – 10:00 PM",
    title: "The Reception",
    detail: "Then, the party. At *6:30 PM* we sit down to dinner, watch our film on the big screen, play games, give away a few surprises — and *dance until the very end*. We can’t wait to celebrate with you.",
  },
];
