/**
 * The order of the day — one source for the public program, invitation card, calendar copy,
 * Social Studio reminders and the printable wedding-team guide.
 *
 * Confirmed arrival flow:
 *   · entourage & wedding team at 4:00 PM, straight to the Dome Tent majlis on the right of the
 *     main gate entrance;
 *   · closed-door ceremony begins at 4:30 PM;
 *   · all other guests arrive at 6:00 PM for Sip & Fellowship / Welcome Toast in the majlis;
 *   · reception begins at 7:00 PM.
 */
export type ProgramStop = {
  time: string;
  title: string;
  tag?: string;
  note?: string;
  programmeNote?: string;
};

/** The ceremony begins and its doors close at this time. */
export const CEREMONY_AT = "4:30 PM";
export const CEREMONY_DOORS_CLOSE = CEREMONY_AT;
/** The hall's current preparation window, as confirmed in the existing venue plan. */
export const HALL_CLOSED_FROM = "2:00 PM";
/** The Dome Tent majlis becomes available for the wedding party at 4:00 PM. */
export const ENTOURAGE_CALL_TIME = "4:00 PM";
export const MAJLIS_AVAILABLE_AT = ENTOURAGE_CALL_TIME;
export const HALL_CLOSED_UNTIL = MAJLIS_AVAILABLE_AT;
/** Exact wayfinding direction supplied by the couple. */
export const MAJLIS_LOCATION = "the Dome Tent majlis, to the right of the main gate entrance";
/** General guests are welcome from this time for Sip & Fellowship / Welcome Toast. */
export const ALL_WELCOME_FROM = "6:00 PM";
export const RECEPTION_AT = "7:00 PM";
export const SEND_OFF_AT = "10:00 PM";
export const WELCOME_EVENT_NAME = "Sip & Fellowship · Welcome Toast";

export const WEDDING_PROGRAM_STOPS: ProgramStop[] = [
  {
    time: ENTOURAGE_CALL_TIME,
    title: "Entourage & Wedding Team Arrival",
    tag: "Straight to the Dome Tent majlis",
    note: `Please go straight to ${MAJLIS_LOCATION}. Coordinators will meet you there for the briefing.`,
    programmeNote: "please arrive promptly; the closed-door ceremony begins at 4:30 PM",
  },
  {
    time: CEREMONY_AT,
    title: "Closed-Door Wedding Ceremony",
    tag: "Wedding party & invited ceremony guests",
    note: "The ceremony is private and doors close as it begins. Please be on time.",
  },
  {
    time: ALL_WELCOME_FROM,
    title: WELCOME_EVENT_NAME,
    tag: "All other guests welcome",
    note: `Join us at ${MAJLIS_LOCATION} for a welcome toast, sips, fellowship and photos.`,
    programmeNote: "we can't wait to welcome everyone and share a toast",
  },
  {
    time: RECEPTION_AT,
    title: "Wedding Reception",
    tag: "Reception begins",
    programmeNote: "the reception celebration begins in the hall",
  },
  { time: SEND_OFF_AT, title: "Send off" },
];

export const PROGRAM_HEADLINE = `The ceremony is closed-door at ${CEREMONY_AT}.`;
export const PROGRAM_HEADLINE_DETAIL =
  `Our ceremony is a private, closed-door moment for our wedding party and invited ceremony guests. ` +
  `Entourage and wedding team: please arrive at ${ENTOURAGE_CALL_TIME} and go straight to ${MAJLIS_LOCATION}. ` +
  `All other guests: please join us at ${ALL_WELCOME_FROM} at the majlis for Sip & Fellowship and a welcome toast. ` +
  `The reception begins at ${RECEPTION_AT}.`;

export type ArrivalNote = {
  who: string;
  time: string;
  where: string;
  brief: string;
  detail: string;
};

export const ARRIVAL_NOTES: { entourage: ArrivalNote; guests: ArrivalNote } = {
  entourage: {
    who: "Entourage & wedding team",
    time: ENTOURAGE_CALL_TIME,
    where: "Dome Tent majlis",
    brief: `Go straight to the Dome Tent, right of the main gate; coordinators will brief you there.`,
    detail:
      `Please arrive by ${ENTOURAGE_CALL_TIME} and go straight to ${MAJLIS_LOCATION}. ` +
      `The majlis is available from 4:00 PM; your coordinators will meet you there. ` +
      `The closed-door ceremony begins at ${CEREMONY_AT}, so please be on time.`,
  },
  guests: {
    who: "All other guests",
    time: ALL_WELCOME_FROM,
    where: "Dome Tent majlis",
    brief: `Sip & Fellowship and a welcome toast at the Dome Tent majlis; reception at ${RECEPTION_AT}.`,
    detail:
      `The ceremony is a closed-door event. Please join us from ${ALL_WELCOME_FROM} at ${MAJLIS_LOCATION} ` +
      `for Sip & Fellowship, a welcome toast and photos. The reception begins at ${RECEPTION_AT}.`,
  },
};

export type ArrivalWindow = {
  when: string;
  where: string;
  detail: string;
};

/** Guest wayfinding notes printed beside the venue plan. */
export const GUEST_ARRIVAL_GUIDE: ArrivalWindow[] = [
  {
    when: `Team · ${ENTOURAGE_CALL_TIME}`,
    where: "Dome Tent majlis",
    detail: `Entourage and wedding team: head straight to ${MAJLIS_LOCATION} for your coordinator briefing. The ceremony begins at ${CEREMONY_AT} behind closed doors.`,
  },
  {
    when: `Guests · ${ALL_WELCOME_FROM}`,
    where: "Dome Tent majlis",
    detail: `Please join us at ${MAJLIS_LOCATION} for Sip & Fellowship and the welcome toast. The reception begins at ${RECEPTION_AT}.`,
  },
];

export type ProgramMoment = {
  time: string;
  span: string;
  title: string;
  detail: string;
};

export const WEDDING_PROGRAM_HIGHLIGHTS: ProgramMoment[] = [
  {
    time: ENTOURAGE_CALL_TIME,
    span: "4:00 PM · Wedding party arrival",
    title: "Entourage & Wedding Team",
    detail: `Please be at the Dome Tent majlis, to the right of the main gate entrance, by *${ENTOURAGE_CALL_TIME}*. Your coordinators will meet you there. The closed-door ceremony begins at *${CEREMONY_AT}*.`,
  },
  {
    time: ALL_WELCOME_FROM,
    span: "6:00 PM · All other guests welcome",
    title: "Sip & Fellowship",
    detail: `Join us from *${ALL_WELCOME_FROM}* at the Dome Tent majlis for a welcome toast, sips, fellowship and photos. The reception begins at *${RECEPTION_AT}*.`,
  },
  {
    time: RECEPTION_AT,
    span: "7:00 PM · Reception",
    title: "The Reception",
    detail: `The reception begins in the hall at *${RECEPTION_AT}*. We can't wait to celebrate with you.`,
  },
];
