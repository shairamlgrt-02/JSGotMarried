import type { TableMap, TableName } from "./types";

const c = (name: string, hex: string, fabric?: string) => ({ name, hex, fabric });

/** Our song — Dilaw (Maki), piano instrumental by Angelo Magnaye. Signed Supabase Storage link. */
const SONG_URL = "https://bqdjucurmpophnafchwi.supabase.co/storage/v1/object/sign/song/Dilaw%20-%20Maki%20Piano%20Instrumental%20Tutorial%20by%20Angelo%20Magnaye.mp3?token=eyJraWQiOiIwMzUwMzI3Ni04N2FlLTRmNDYtOTQ3Zi0wYmQ2ZWM3OTY4ZDYiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJzb25nL0RpbGF3IC0gTWFraSBQaWFubyBJbnN0cnVtZW50YWwgVHV0b3JpYWwgYnkgQW5nZWxvIE1hZ25heWUubXAzIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc5MDg2OTEzMiwiZXhwIjoxODIyNDA1MTMyfQ.EFDXxP2IC_q8CBs05vn-xLsDJW8nVHHSsZ-_Xmekkkk_Jfafvv6ACXpJuGOQHQFHXkapY7RcHc4Q42UMLKQ94w";

export const SEED: { [K in TableName]: TableMap[K][] } = {
  wedding_info: [{
    id: "main",
    date: "2026-11-11T16:00:00+03:00",
    bride: "Shaira",
    groom: "Jeger",
    venue_name: "The Heaven",
    venue_address: "Damistan, Kingdom of Bahrain",
    venue_map_link: "https://maps.google.com/?q=The+Heaven+Damistan+Bahrain",
    venue_map_embed: "https://maps.google.com/maps?q=Damistan%20Bahrain&z=14&output=embed",
    theme_name: "Vintage Lace",
    story: "We met serving at an inter-church youth camp, and three years of friendship, longer glances and quiet admiration followed. Jeg confessed in the IKEA parking lot on October 29, 2020, and four months later that wish was answered on our first official date at the Amwaj Lagoon, on March 14, 2021. Five years of ups and downs and a ring under the blue skies of Gudauri later, we get married on 11.11.2026, because in the Lord neither of us is whole without the other.",
    instagram: "@shaiandjeg",
    instagram_note: "Follow along for the countdown, the behind-the-scenes and our favourite moments — then tag your photos on the day so we can keep them forever.",
    hashtags: ["#JSGotMarried", "#JSSayIDo", "#JSWishComeTrue"],
    total_budget: 2500,
    currency: "BHD",
    save_the_date_url: "",
    site_title: "Jeger & Shaira — Wedding · 11.11.2026",
    // deliberately no venue in here: this line is what the whole world reads on a shared link,
    // while the invitation itself stays behind each guest's code.
    site_description: "Jeger & Shaira are getting married on 11.11.2026 in Bahrain — you're invited. #JSSayIDo",
    share_image: "/og.jpg",
    favicon: "",
    gallery: [],
    cover_photo: "",
    music_url: SONG_URL,
    rsvp_deadline: "2026-10-25",
  }],
  schedule: [
    { id: "s1", time: "4:00 – 5:00 PM", title: "The Ceremony", detail: "An *intimate ceremony*, shared with our families, entourage and a few honoured guests. If your heart wants to witness us say “I do”, you are *warmly welcome to join* — open seating is available around our reserved rows.", order: 1 },
    { id: "s2", time: "5:00 – 6:30 PM", title: "Cocktail & Mingling Hour", detail: "*Everyone is welcome from 5 PM!* Snacks, refreshments, *photo moments* and little activities at the *majlis*, just outside the hall. This is where we’ll come find you — to hug, laugh and take pictures together.", order: 2 },
    { id: "s3", time: "7:00 PM onwards", title: "The Reception", detail: "Doors open for the celebration — *dinner*, our *film on the big screen*, *games and giveaways*, and dancing until the very end.", order: 3 },
  ],

  /**
   * Our Story, chapter by chapter — swipeable on the site; photos upload in the binder (Content → Story chapters).
   * Five chapters — the glances, the parking lot and the lagoon, the five years, Gudauri, the invitation — told as
   * the couple telling it themselves: "we" for everything shared, Shai or Jeg by name where a moment belongs to one of
   * them, and never an "I", so neither of them reads as the sole narrator. Short plain sentences, one real detail per
   * beat (camp 2018 · IKEA car park Oct 29 2020 · Amwaj Lagoon Mar 14 2021 · five years · Gudauri Feb 20 2026 ·
   * 11.11.2026). The last line hands it to 1 Corinthians 11:11, which the 11.11 interlude right after quotes in full (KJV).
   */
  story: [
    { id: "ch1", title: "She Fell First", text: "We met serving at an inter-church youth camp, and three years of friendship followed. The glances got a little longer, the conversations a little later, and the quiet admiration kept getting deeper. Ours is a classic story: she fell first, and he fell… harder. 😉", photo: "", order: 1 },
    { id: "ch2", title: "From a Parking Lot to a Lagoon", text: "On October 29, 2020, Jeg confessed in the huge, half-empty IKEA parking lot. He had practised a whole speech and lost every word of it on the way. Four months later that wish was answered, on our first official date at the Amwaj Lagoon. March 14, 2021 became our official day.", photo: "", order: 2 },
    { id: "ch3", title: "Five Years Up and Down", text: "Five years since that day, and we tumbled down and rose back up again more than once. God moulded us and refined us. We still get a little flutter from time to time. But the joy we hold on to is the life waiting ahead: loving God together, and loving each other through it.", photo: "", order: 3 },
    { id: "ch4", title: "Blue Skies in Gudauri", text: "On February 20, 2026, Gudauri gave us snowy mountains and wide blue skies. Right there, on that mountain, Jeg put a ring on Shai's finger. The future suddenly looked brighter and far more colourful. We could hardly wait to make it official for good, with our families and friends behind us.", photo: "", order: 4 },
    { id: "ch5", title: "So, Come", text: "On November 11, 2026 we get married, and we want you there: our families, our friends, everyone who prayed for us before we knew it was coming. We are each other's answered prayer, and in the Lord neither of us is whole without the other.", photo: "", order: 5 },
  ],

  budget: [
    { id: "b1", category: "Venue", item: "The Heaven, Damistan", quoted_cost: 660, paid_cost: 0, status: "confirmed" },
    { id: "b2", category: "Attire", item: "Bridal dress — Jolaida", quoted_cost: 180, paid_cost: 0, status: "confirmed" },
    { id: "b3", category: "Rings", item: "Wedding rings (est.)", quoted_cost: 350, paid_cost: 0, status: "confirmed" },
    { id: "b4", category: "Attire", item: "Groom suit (est.)", quoted_cost: 100, paid_cost: 0, status: "confirmed" },
    { id: "b5", category: "Sound", item: "Church sound system — FREE", quoted_cost: 0, paid_cost: 0, status: "confirmed" },
    { id: "b6", category: "AV", item: "Projector — ViewSonic (est.)", quoted_cost: 25, paid_cost: 0, status: "confirmed" },
    { id: "b7", category: "Catering", item: "Catering 120 pax (pending decision)", quoted_cost: 394, paid_cost: 0, status: "pending" },
    { id: "b8", category: "Photo / Video", item: "P/V coverage (pending quotes)", quoted_cost: 500, paid_cost: 0, status: "pending" },
  ],
  guests: [],
  vendors: [
    { id: "v1", type: "catering", name: "Shai's Resto", quote: 380, contact: "", status: "quoted", notes: "300 + 80 utensils, 120 pax, lechon included" },
    { id: "v2", type: "catering", name: "Heaven Catering", quote: 394, contact: "", status: "quoted", notes: "2.7/pax × 120 = 324 + outside lechon 70" },
    { id: "v3", type: "p/v", name: "Cinmox", quote: 500, contact: "", status: "quoted", notes: "8 hours coverage" },
    { id: "v4", type: "p/v", name: "Alexandria", quote: 0, contact: "", status: "pending", notes: "Awaiting quote" },
    { id: "v5", type: "p/v", name: "Mark Villaruel", quote: 0, contact: "", status: "pending", notes: "Awaiting quote" },
    { id: "v6", type: "projector", name: "ViewSonic", quote: 25, contact: "", status: "booked", notes: "For 120\" screen video" },
  ],
  checklist: [
    ["Decide caterer: Shai's Resto vs Heaven", "critical", "2026-10-03"],
    ["Collect P/V quotes (Alexandria, Mark Villaruel)", "critical", "2026-10-03"],
    ["Book photo/video team & pay deposit", "critical", "2026-10-08"],
    ["Send Save the Date + website link", "critical", "2026-10-01"],
    ["Confirm church ceremony schedule & sound", "critical", "2026-10-05"],
    ["Order wedding rings", "critical", "2026-10-10"],
    ["First dress fitting with Jolaida", "high", "2026-10-12"],
    ["Groom suit fitting", "high", "2026-10-15"],
    ["Finalize entourage & sponsors list", "high", "2026-10-06"],
    ["Brief bridesmaids on jewel-satin colors", "high", "2026-10-07"],
    ["Book HMUA", "high", "2026-10-10"],
    ["Book band / playlist DJ", "high", "2026-10-14"],
    ["Edit same-day / love-story video for 120\" screen", "high", "2026-11-01"],
    ["RSVP deadline & chase pending guests", "critical", "2026-10-25"],
    ["Final headcount to caterer", "critical", "2026-10-30"],
    ["Print scratch cards for reception game", "medium", "2026-10-28"],
    ["Source market giveaway items", "medium", "2026-10-28"],
    ["Seating plan", "high", "2026-11-02"],
    ["Order cocktail-hour street food", "medium", "2026-10-30"],
    ["Test projector + screen at venue", "medium", "2026-11-05"],
    ["Prepare vows", "high", "2026-11-05"],
    ["Final vendor payments", "critical", "2026-11-08"],
    ["Pack wedding-day emergency kit", "medium", "2026-11-09"],
    ["Rehearsal with entourage", "high", "2026-11-09"],
  ].map(([task, category, due], i) => ({ id: `c${i + 1}`, task, category: category as "critical", due_date: due, completed: false })),
  attire: [
    { id: "a1", group: "bride", label: "The Bride", colors: [c("White", "#F6F1EB")], reserved: true, notes: "", swatch_url: "", order: 1 },
    { id: "a2", group: "groom", label: "The Groom", colors: [c("Black", "#0B0B0B")], reserved: true, notes: "", swatch_url: "", order: 2 },
    { id: "a3", group: "shai_family", label: "Shai's Family", colors: [c("Copper", "#8C3617")], reserved: true, notes: "", swatch_url: "", order: 3 },
    { id: "a4", group: "jeg_family", label: "Jeg's Family", colors: [c("Burgundy", "#5C1223")], reserved: true, notes: "", swatch_url: "", order: 4 },
    { id: "a5", group: "bridesmaids", label: "Bridesmaids", colors: [c("Turquoise", "#0F7E7A"), c("Amethyst", "#5E2487"), c("Garnet", "#8E1226"), c("Sapphire", "#0A2A6E"), c("Ruby", "#B01A63"), c("Citrine", "#BE8B0F")], reserved: true, notes: "Five bridesmaids in jewel stones; the Maid of Honor shines in Citrine gold", swatch_url: "", order: 5 },
    { id: "a7", group: "groomsmen", label: "Groomsmen", colors: [c("Grey", "#6E6E6E"), c("Black", "#101010")], reserved: true, notes: "Satin-lapel tux or suit", swatch_url: "", order: 6 },
    { id: "a6", group: "guests", label: "Our Guests", colors: [c("Emerald", "#0A5C33", "Velvet"), c("Laurel", "#35562B", "Fine suit wool"), c("Jade", "#23825A", "Silk charmeuse"), c("Scarab", "#2C8C3C", "Shiny polyester · dry-fit"), c("Olive", "#5F6B24", "Duchesse satin"), c("Peridot", "#9AA62C", "Silk charmeuse"), c("Coffee", "#452A18", "Velvet"), c("Smoky Topaz", "#5E4630", "Fine suit wool"), c("Bronze", "#6F4F1D", "Duchesse satin"), c("Toffee", "#7C5230", "Silk charmeuse"), c("Dark Honey", "#8A5A0C", "Liquid satin · poly"), c("Caramel", "#9C6A28", "Velvet")], reserved: false, notes: "Black tie in glossy greens and warm shining browns — kindly avoid black, white, burgundy and copper. Shine welcome: satin, velvet, silk, fine suit or liquid poly — please skip tulle, chiffon and anything fully matte.", swatch_url: "", order: 7 },
  ],
  entourage: [
    // Every role is a category — add as many rows per role as you need and the site groups
    // them under one heading, standing in this order (see lib/entourage.ts).
    { id: "p3", role: "groom_family", name: "Mr. ——", title: "Father of the Groom", order: 1 },
    { id: "p4", role: "groom_family", name: "Mrs. ——", title: "Mother of the Groom", order: 2 },
    { id: "p1", role: "bride_family", name: "Mr. ——", title: "Father of the Bride", order: 3 },
    { id: "p2", role: "bride_family", name: "Mrs. ——", title: "Mother of the Bride", order: 4 },
    { id: "e3", role: "sponsor", name: "Mr. & Mrs. ——", title: "Principal Sponsor", order: 5 },
    { id: "e6", role: "sponsor", name: "Mr. & Mrs. ——", title: "Principal Sponsor", order: 6 },
    { id: "e2", role: "best_man", name: "To be announced", title: "", order: 7 },
    { id: "e7", role: "groomsman", name: "To be announced", title: "", order: 8 },
    { id: "e8", role: "groomsman", name: "To be announced", title: "", order: 9 },
    { id: "e1", role: "maid_of_honor", name: "To be announced", title: "", order: 10 },
    { id: "e9", role: "bridesmaid", name: "To be announced", title: "", order: 11 },
    { id: "e10", role: "bridesmaid", name: "To be announced", title: "", order: 12 },
    { id: "e5", role: "ring_bearer", name: "To be announced", title: "", order: 13 },
    { id: "e4", role: "flower_girl", name: "To be announced", title: "", order: 14 },
    // Honoured guests have no placeholder row — add them as they're found and they'll gather
    // under “Our Honoured Guests” on the site, in two columns.
  ],

  faq: [
    { id: "f0", question: "Can I watch the ceremony?", answer: "Please do come — witnessing our vows would mean the world. Our ceremony at 4 PM is intimate and closed-door: please be seated by 3:45 PM, as the doors close the moment the procession begins. Reserved rows are for our families and entourage, with open seats around them. From 5:30 PM everyone is welcome — join us for the Welcome Toast & Snacks, then the reception at 6:30 PM.", order: 0 },
    { id: "f1", question: "Can I bring a plus one?", answer: "Your invitation lists your seats. The RSVP lets you choose 1 or 2 pax only if we've reserved two for you.", order: 1 },
    { id: "f2", question: "What should I wear?", answer: "Black tie, in glossy greens and warm shining browns. Greens: emerald, laurel, jade, scarab, olive, peridot. Warm browns: coffee, smoky topaz, bronze, dark honey, caramel, toffee — every shade is swatched in the Dress Code section above. Kindly avoid black, white, burgundy and copper, which are reserved for our families and entourage. Do bring the shine: satin, velvet, silk, fine suit wool and liquid poly are all welcome, while tulle, chiffon and anything fully matte are best left at home.", order: 2 },
    { id: "f3", question: "Are kids welcome?", answer: "We adore your little ones — they are welcome to join the reception whenever your invitation says so. The ceremony itself is an adults-only celebration, unless they are part of our entourage: our flower girl and ring bearer hold the front row.", order: 3 },
    { id: "f4", question: "Is there parking?", answer: "Yes, parking is available at The Heaven, Damistan.", order: 4 },
    { id: "f5", question: "Can I post photos?", answer: "Please! Tag @shaiandjeg and use #JSGotMarried — #JSSayIDo and #JSWishComeTrue work beautifully too. We only ask for an unplugged ceremony.", order: 5 },
  ],
  message_templates: [],
  messages: [],
};
