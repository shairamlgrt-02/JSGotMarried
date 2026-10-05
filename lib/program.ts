/**
 * The program shown to guests and repeated on the RSVP keepsake card.
 * Keep these times and names in one place so the downloaded card cannot drift from the page.
 */
export type ProgramStop = { time: string; title: string };

export const WEDDING_PROGRAM_STOPS: ProgramStop[] = [
  { time: "3:30 PM", title: "Entourage Arrival" },
  { time: "4:00 PM", title: "Wedding Ceremony" },
  { time: "5:00 PM", title: "Wedding Photos" },
  { time: "5:30 PM", title: "Welcome Toasts & Snacks" },
  { time: "6:30 PM", title: "Wedding Reception" },
  { time: "10:00 PM", title: "Send off" },
];

export const WEDDING_PROGRAM_HIGHLIGHTS = [
  {
    time: "4:00 PM",
    title: "The Ceremony",
    detail: "An intimate ceremony with our families, entourage and a few honoured guests. You’re warmly welcome to witness our vows, with open seating around the reserved rows.",
  },
  {
    time: "5:30 PM",
    title: "Welcome Toasts & Snacks",
    detail: "Join us from 5:30 PM for toasts, snacks, refreshments, photo moments and little activities at the majlis outside the hall. We’ll come find you for hugs, laughs and pictures.",
  },
  {
    time: "6:30 PM",
    title: "The Reception",
    detail: "Dinner, our film on the big screen, games, giveaways and dancing until the end. We can’t wait to celebrate with you.",
  },
];
