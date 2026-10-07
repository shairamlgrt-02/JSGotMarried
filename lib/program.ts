/**
 * The order of the day — one source for the website's Program section and the guest's
 * downloadable keepsake card, so the two can never drift apart.
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
};

/** When the ceremony doors close — as the procession begins. Guests are asked to be seated before this. */
export const CEREMONY_DOORS_CLOSE = "4:00 PM";
/** From this time on every guest is welcome — no doors, no reserved rows. */
export const ALL_WELCOME_FROM = "5:30 PM";

export const WEDDING_PROGRAM_STOPS: ProgramStop[] = [
  { time: "3:30 PM", title: "Entourage Arrival" },
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
