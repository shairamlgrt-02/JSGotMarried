/**
 * The order of the day — one source for the website's Program section and the guest's
 * downloadable keepsake card, so the two can never drift apart.
 *
 * Two facts matter more than anything else here, so they are written once and shown on every
 * surface (timeline, highlight cards, keepsake, FAQ):
 *   · the ceremony is intimate and closed-door — a guest who wishes to witness it must be seated
 *     by 3:45 PM, because the doors close the moment the procession begins;
 *   · from 5:30 PM everyone is welcome — the Welcome Toast & Snacks run until the reception at 6:30 PM.
 */
export type ProgramStop = {
  time: string;
  title: string;
  /** Two–four words shown under the stop on the timeline — "Doors close 3:45 PM". */
  tag?: string;
  /** One short sentence for the keepsake card, where there is room to say it properly. */
  note?: string;
};

/** When the ceremony doors close — the one time a guest must not miss. */
export const CEREMONY_DOORS_CLOSE = "3:45 PM";
/** From this time on every guest is welcome — no doors, no reserved rows. */
export const ALL_WELCOME_FROM = "5:30 PM";

export const WEDDING_PROGRAM_STOPS: ProgramStop[] = [
  { time: "3:30 PM", title: "Entourage Arrival" },
  {
    time: "4:00 PM",
    title: "Wedding Ceremony",
    tag: `Doors close ${CEREMONY_DOORS_CLOSE}`,
    note: `Doors close as the procession begins — be seated by ${CEREMONY_DOORS_CLOSE}.`,
  },
  { time: "5:00 PM", title: "Wedding Photos" },
  {
    time: "5:30 PM",
    title: "Welcome Toast & Snacks",
    tag: "Everyone welcome",
    note: "Everyone is welcome from here — join us before the reception.",
  },
  { time: "6:30 PM", title: "Wedding Reception" },
  { time: "10:00 PM", title: "Send off" },
];

export type ProgramMoment = {
  /** The stop on the timeline this moment expands on. */
  time: string;
  /** How long it runs — the ribbon on the card. */
  span: string;
  title: string;
  /** The one thing to remember, set apart from the description. */
  badge: string;
  /** Two short sentences at most — short but sweet. */
  detail: string;
};

export const WEDDING_PROGRAM_HIGHLIGHTS: ProgramMoment[] = [
  {
    time: "4:00 PM",
    span: "4:00 – 5:00 PM",
    title: "The Ceremony",
    badge: `Closed doors · be seated by ${CEREMONY_DOORS_CLOSE}`,
    detail: `An intimate, closed-door ceremony. If you wish to witness our vows, please be seated by ${CEREMONY_DOORS_CLOSE} — the doors close as the procession begins.`,
  },
  {
    time: "5:30 PM",
    span: "5:30 – 6:30 PM",
    title: "Welcome Toast & Snacks",
    badge: `Everyone welcome from ${ALL_WELCOME_FROM}`,
    detail: `From ${ALL_WELCOME_FROM}, everyone is welcome. Meet us at the majlis for a toast, snacks and photos before the reception begins.`,
  },
  {
    time: "6:30 PM",
    span: "6:30 – 10:00 PM",
    title: "The Reception",
    badge: "Dinner & dancing until 10:00 PM",
    detail: "Dinner, our film on the big screen, games, giveaways — and dancing until the send-off.",
  },
];
