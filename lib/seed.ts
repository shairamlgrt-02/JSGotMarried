import type { Priority, TableMap, TableName } from "./types";

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
    // Note on Gifts — left blank on purpose: the public section appears the moment the couple
    // fills any of these in (binder → Details → Note on Gifts).
    gift_note: "",
    benefitpay_number: "+973 33177332",
    benefitpay_iban: "BH69BIBB00100003377119",
  }],
  schedule: [
    { id: "s1", time: "4:00 – 5:00 PM", title: "The Ceremony", detail: "An *intimate ceremony*, shared with our families, entourage and a few honoured guests. If your heart wants to witness us say “I do”, you are *warmly welcome to join* — open seating is available around our reserved rows.", order: 1 },
    { id: "s2", time: "5:00 – 7:00 PM", title: "Cocktail & Mingling Hour", detail: "*Everyone is welcome from 5 PM!* Snacks, refreshments, *photo moments* and little activities at the *majlis*, just outside the hall. This is where we’ll come find you — to hug, laugh and take pictures together.", order: 2 },
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
  /**
   * The to-do list, in two halves:
   *  · c1… — the original starter list. NEVER reword these: a live project already holds them
   *    (ticked, edited, re-dated) and "push starter data" only fills in rows whose id is missing,
   *    so changed words would reach nobody.
   *  · k1… — the couple's updated sheet, transcribed row by row (their Category → `section`,
   *    Item → `task`, Details/Notes → `details`, Deadline → `due_date`, Person In-charge →
   *    `owner`, Done → `completed`), followed by the finer-grained tasks that grew out of
   *    reviewing it. Press "Push starter data" once and every missing k-row appears; a handful of
   *    the old c-rows cover the same ground (rings, vows, rehearsal, emergency kit, headcount,
   *    street food) — keep whichever copy you like and delete the other.
   */
  checklist: [
    // ── the original starter list (c1…) ──
    ...([
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
    ] as [string, Priority, string][]).map(([task, category, due], i) => ({
      id: `c${i + 1}`, task, category, due_date: due, completed: false,
    })),

    // ── the couple's updated sheet + the fine detail (k1…) ──
    ...([
    // ── Legal & Admin ──
    ["Legal & Admin", "Embassy wedding", "high", "2026-11-06", "Couple", "Date confirmed: Nov 09 @ 3:00 PM — documents ready; confirm the witness.", ""],
    ["Legal & Admin", "Marriage licence & church paperwork", "critical", "2026-10-28", "Couple", "Confirm with Pastor Deon exactly which documents the church needs (baptismal/confirmation certs, licence, seminar); originals + photocopies.", ""],
    ["Legal & Admin", "Civil-register witnesses confirmed", "high", "2026-11-01", "Couple", "Two witnesses for the civil signing — confirm they're attending and brief them on when to sign.", ""],
    ["Legal & Admin", "Embassy documents pack", "high", "2026-11-06", "Couple", "Passports, IDs, certificates and copies in one folder for the Nov 9 appointment; re-check the embassy checklist the week before.", ""],
    ["Legal & Admin", "Marriage certificate collection", "medium", "2026-11-20", "Couple", "Ask the officiant / civil registrar when and how to claim it; assign a runner if you'll be travelling.", ""],
    // ── Invitations & Guests ──
    ["Invitations & Guests", "Invitation reminders to send out", "high", "2026-10-30", "Jeg", "The second wave of reminder invites — Binder → Compose has the ready-made templates.", ""],
    ["Invitations & Guests", "RSVP reminders (Oct 16 & Oct 20)", "critical", "2026-10-20", "Jeg", "Gentle reminder first, then the final call — both pre-written in Binder → Templates.", ""],
    ["Invitations & Guests", "Table numbers / reserved signs", "medium", "2026-10-30", "Shai & Coordinator", "Check name spellings twice; print 2 of each (spares).", ""],
    ["Invitations & Guests", "Table seatings", "high", "2026-11-02", "Couple", "Identify tables, decor + plan; lock after the Oct 25 RSVP deadline.", ""],
    ["Invitations & Guests", "Chase \u201copened link, no reply\u201d households", "critical", "2026-10-22", "Jeg", "Binder → Compose → \u201cOpened Link · No Reply\u201d: send the gentle reminder, then the final call.", ""],
    ["Invitations & Guests", "Send the final-call RSVP message", "critical", "2026-10-24", "Jeg", "One day before the deadline: kind but firm — no reply by Oct 25 means we can't save the seats.", ""],
    ["Invitations & Guests", "Master guest sheet for coordinators", "high", "2026-10-28", "Jeg", "Export CSV from Guests & RSVP — dietary notes, song requests, plus-ones, tags; one printed copy per coordinator.", ""],
    ["Invitations & Guests", "Welcome sign & direction signage", "medium", "2026-10-30", "Shai & Coordinator", "Welcome + arrows for majlis / hall / parking; A4 prints on kraft or an acrylic stand.", ""],
    ["Invitations & Guests", "Dietary & kids' meal list to caterer", "high", "2026-10-30", "Couple", "Allergies and special requests from the RSVP notes; count kids' plates separately.", ""],
    ["Invitations & Guests", "Elderly & PWD assistance plan", "medium", "2026-11-08", "Coordinator", "One usher per elderly guest who needs a hand; confirm step-free access to the majlis and hall.", ""],
    ["Invitations & Guests", "Special-seat requests locked", "medium", "2026-11-05", "Couple", "Guests with babies, wheelchairs or hearing needs nearest the aisle/exit; keep 2 spare seats per side.", ""],
    // ── Venue & Catering ──
    ["Venue & Catering", "The Heaven meeting", "critical", "2026-10-22", "Couple & Coordinator", "Buffet + decor + plan — get the final agreement in writing.", ""],
    ["Venue & Catering", "Venue visit with coordinators", "high", "2026-10-24", "Couple & Coordinator", "Schedule date & time; walk the majlis-to-hall flow while you're there.", ""],
    ["Venue & Catering", "Catering — confirm and pay", "critical", "2026-10-30", "Couple", "Final headcount in hand first (RSVP closes Oct 25); receipt filed with the payment envelopes.", ""],
    ["Venue & Catering", "Wedding cake — to order", "high", "2026-11-01", "Couple", "Design, size vs. headcount, topper, delivery time and who receives it.", ""],
    ["Venue & Catering", "Wedding cake / sparkling wine", "critical", "2026-10-23", "Couple", "To order.", ""],
    ["Venue & Catering", "Cocktail-hour street food (pass-around)", "medium", "2026-10-30", "Gracie", "Donuts; confirm quantity, delivery time and serving trays.", ""],
    ["Venue & Catering", "Coffee & tea station", "medium", "2026-10-30", "Tita Lorle", "Coffee & tea, sugar, milk — assign this role on the Guest Roles tab so reminders reach her.", ""],
    ["Venue & Catering", "Serveware (snacks area)", "medium", "2026-10-30", "Marilyn", "Coffee cups, drinking glasses, stirrers, forks, small plates.", ""],
    ["Venue & Catering", "Serveware (cake & wine table)", "medium", "2026-10-30", "Marilyn", "Cake plates, cake knife, 2 forks, 2 wine glasses.", ""],
    ["Venue & Catering", "Tissue & table napkins", "medium", "2026-10-30", "Marilyn", "Boxes & table napkin.", ""],
    ["Venue & Catering", "Wine glasses — rental", "high", "2026-10-30", "Couple", "Confirm rental at Al Wasmiva (20 BD); delivery, count +10% spares, return plan.", ""],
    ["Venue & Catering", "Buffet menu & quantities locked", "critical", "2026-10-30", "Couple", "Final dishes, servings per pan, lechon confirmed in writing at The Heaven meeting.", ""],
    ["Venue & Catering", "Vendor & staff entry at 4:00 PM", "critical", "2026-11-08", "Couple & Coordinator", "The hall is closed 2:00–4:00 PM for The Heaven's cleaning — cake, decor and sound teams enter WITH everyone at 4:00; brief each vendor personally.", ""],
    ["Venue & Catering", "Majlis refreshments for the 3:30 briefing", "high", "2026-11-08", "Gracie", "Snacks, water and juice at the majlis for the entourage briefing (hall is closed 2–4 PM); assign a server.", ""],
    ["Venue & Catering", "Cake delivery & placement", "high", "2026-11-09", "Couple", "Delivery time, who receives it, where it sits (clear of the cross backdrop), cake table styled.", ""],
    ["Venue & Catering", "Sparkling wine chilled & toast glasses", "high", "2026-11-10", "Couple", "Chill by 4 PM; 2 glasses on the cake table (Marilyn's serveware) + the rest for the toasts.", ""],
    ["Venue & Catering", "Coffee & tea supplies box", "medium", "2026-11-08", "Tita Lorle", "Coffee, tea, sugar, milk, cups, stirrers, small plates, napkins — one labelled box per station.", ""],
    ["Venue & Catering", "Ice, water & refill duty", "medium", "2026-11-09", "Couple", "Confirm what The Heaven provides; bottled water for hall + majlis; assign who refills.", ""],
    ["Venue & Catering", "Leftovers & cleanup plan", "medium", "2026-11-10", "Couple", "Containers for leftovers and who takes them home; confirm what The Heaven's cleaning covers and what we carry out.", ""],
    // ── Ceremony Team ──
    ["Ceremony Team", "Wedding officiant", "high", "2026-10-30", "Couple", "Couple needs to meet with Pastor Deon.", ""],
    ["Ceremony Team", "MC / Host — Carlo to confirm", "critical", "2026-10-23", "Jeg", "Backup: Tito Ramon. Confirm before the program writing starts.", ""],
    ["Ceremony Team", "Ushers", "medium", "2026-10-30", "Marilyn", "Snacks & souvenir server; assign them on the Guest Roles tab.", ""],
    ["Ceremony Team", "Wedding singer — to confirm", "high", "2026-10-23", "Couple", "Ceremony songs; check against the musician's set.", ""],
    ["Ceremony Team", "Musician — to confirm; keyboard needed", "critical", "2026-10-23", "Couple", "Keyboard, mic stand and power point at the venue.", ""],
    ["Ceremony Team", "Reception playlist DJ — to confirm; laptop needed", "critical", "2026-10-23", "Jeg", "Laptop + aux cable as backup to the band.", ""],
    ["Ceremony Team", "Meet Pastor Deon: order of service", "critical", "2026-10-30", "Couple", "Bring the paperwork, ceremony outline, music cues, entourage names & pronunciations; walk through the 4:00 PM entrance together.", ""],
    ["Ceremony Team", "MC script & rundown to Carlo", "high", "2026-11-08", "Jeg", "One-pager: sequence, transitions, games, thanking sponsors; set the mic-check time.", ""],
    ["Ceremony Team", "Ushers' briefing card", "medium", "2026-11-08", "Marilyn", "Who seats whom, reserved rows, walk-ins at 5:30, souvenir-table handover.", ""],
    ["Ceremony Team", "Singer & musician song list", "high", "2026-11-03", "Couple", "Ceremony + reception songs, lyrics and keys shared; keyboard, mic stands and sound-check slot confirmed.", ""],
    ["Ceremony Team", "Procession order cards for coordinators", "medium", "2026-11-08", "Coordinator", "Who walks when and with whom, pacing, where each pair stands at the front.", ""],
    // ── Attire & Beauty ──
    ["Attire & Beauty", "Bride's bouquet", "critical", "2026-10-23", "Shai & Coordinator", "Image samples; find a supplier.", ""],
    ["Attire & Beauty", "Make-up artist — to confirm", "critical", "2026-10-23", "Shai & Rhema", "Contract, call time and touch-up terms.", ""],
    ["Attire & Beauty", "Groomsmen fitting", "high", "2026-10-30", "Jeg", "", "done"],
    ["Attire & Beauty", "Bridesmaids' bags & gifts", "high", "2026-10-23", "Shai", "Order from Shein.", "done"],
    ["Attire & Beauty", "Pocket squares for groomsmen", "high", "2026-10-16", "Jeg", "Confirm with seamstress.", ""],
    ["Attire & Beauty", "Family corsages", "high", "2026-10-23", "Shai", "Count: parents, grandparents, sponsors who wish; pins included.", ""],
    ["Attire & Beauty", "HMUA day-of timeline", "high", "2026-11-05", "Shai", "Call time per person (bride first), touch-up after the ceremony, payment envelope ready.", ""],
    ["Attire & Beauty", "Bridal accessories tray", "medium", "2026-11-09", "Shai", "Veil, earrings, shoes, perfume, something borrowed/blue — one box + a checklist photo in the group chat.", ""],
    ["Attire & Beauty", "Steam & press everything", "medium", "2026-11-10", "Couple", "Gown, suits, dresses and the white chiffon cloth; assign who brings the steamer.", ""],
    ["Attire & Beauty", "Bouquet & boutonnière pick-up", "high", "2026-11-11", "Shai & Coordinator", "Confirm the supplier's delivery time and receiver; pins for the boutonnières.", ""],
    ["Attire & Beauty", "Break in your shoes", "medium", "2026-11-08", "Couple", "Both of you — and pack flats / backup heels in the emergency kit.", ""],
    ["Attire & Beauty", "Emergency kit", "medium", "2026-11-09", "Shai", "Fashion tape, stain stick, extra tights, meds, phone batteries, sewing kit, heel tips, oil blotting, extra earrings.", ""],
    // ── Photo & Video ──
    ["Photo & Video", "Photographer / videographer", "critical", "2026-10-23", "Couple", "To confirm with Mark Villanueva team.", ""],
    ["Photo & Video", "Photo/video mood board & shot list", "critical", "2026-10-22", "Couple", "Create the list.", ""],
    ["Photo & Video", "Livestream", "medium", "2026-11-08", "Jeg", "Included in the package + guestbook booth. Need to provide internet & YouTube account.", ""],
    ["Photo & Video", "Livestream equipment (DIY)", "medium", "2026-11-08", "Jeg", "Stand, phone/camera, laptop & HDMI cable, charger/powerbank, pocket wifi.", "done"],
    ["Photo & Video", "Photo booth / DIY video guestbook", "medium", "2026-10-23", "Shai", "Included in the package.", "done"],
    ["Photo & Video", "Family photo groupings list", "high", "2026-11-05", "Couple", "Every grouping written with names (\u201cShai's family: parents + siblings\u201d) so the photographer calls them fast.", ""],
    ["Photo & Video", "Same-day edit & screen test", "high", "2026-11-09", "Couple", "Confirm the film plays on the venue's projector/screen; bring HDMI + adapters.", ""],
    ["Photo & Video", "YouTube livestream test & link", "medium", "2026-11-09", "Jeg", "Create the stream, test on the venue's internet, assign who watches the comments.", ""],
    ["Photo & Video", "Guestbook booth kit", "medium", "2026-11-10", "Shai", "Sign, phone/tablet stand, charger; a quiet corner spot at the majlis.", ""],
    // ── Decor ──
    ["Decor", "Cross backdrop", "high", "2026-11-10", "Pastor Benny", "Cross installation on Nov 11.", ""],
    ["Decor", "White chiffon cloth", "medium", "2026-10-30", "Couple", "To purchase.", ""],
    ["Decor", "Cross backdrop install team & fixings", "high", "2026-11-09", "Pastor Benny", "Confirm who helps carry and install on Nov 11, and that wall fixings are allowed.", ""],
    ["Decor", "Flowers: bouquets, corsages, aisle", "high", "2026-11-10", "Shai & Coordinator", "One list with counts per person; a cool spot to store; water tubes for the aisle pieces.", ""],
    ["Decor", "Entrance & majlis styling", "medium", "2026-11-10", "Coordinator", "Welcome sign, guestbook table, souvenir table (church table + cloth), photo corner.", ""],
    ["Decor", "Ceremony bags master checklist", "medium", "2026-11-10", "Couple", "One labelled bag per rite — rings, cords, bible, bucket/dipper/towel, stones & jars — one bearer per bag.", ""],
    // ── Music ──
    ["Music", "Ceremony background playlist", "medium", "2026-10-30", "Couple", "", ""],
    ["Music", "Reception background playlist", "medium", "2026-10-30", "Couple", "", ""],
    ["Music", "Father & daughter's dance song", "medium", "2026-10-30", "Couple", "", ""],
    ["Music", "Mother & son's dance song", "medium", "2026-10-30", "Couple", "", ""],
    ["Music", "Cake and wine background song", "medium", "2026-10-30", "Couple", "", ""],
    ["Music", "Processional & recessional cues", "high", "2026-11-08", "Couple", "Who cues each song (coordinator), what's sung live vs. played back.", ""],
    ["Music", "Parents' dance songs confirmed with parents", "medium", "2026-11-03", "Couple", "Send the final picks to the DJ/laptop operator and to the parents themselves.", ""],
    ["Music", "Do-not-play list", "medium", "2026-11-08", "Couple", "A short list for the DJ; include the cake & wine dance song.", ""],
    // ── Ceremony Elements ──
    ["Ceremony Elements", "Wedding rings", "critical", "2026-10-30", "Couple", "Order and confirm; engraving checked on pick-up.", ""],
    ["Ceremony Elements", "Bucket, dipper & towel", "medium", "2026-11-08", "Couple", "Purchase and prepare in 1 bag.", ""],
    ["Ceremony Elements", "Stones, jars & instruction display", "high", "2026-10-30", "Couple", "Stones (different sizes), 4 jars, sand jar, instruction display.", ""],
    ["Ceremony Elements", "Cords", "high", "2026-10-30", "Couple", "Purchase and prepare in 1 bag.", ""],
    ["Ceremony Elements", "Bible for the wedding", "medium", "2026-11-08", "Couple", "Prepare in 1 bag.", ""],
    // ── Sound System ──
    ["Sound System", "Sound system provider", "critical", "2026-10-23", "Jeg", "Kuya Marvin (check availability & charges) or church sound system.", ""],
    ["Sound System", "Sound equipment", "high", "2026-11-08", "Jeg", "Microphones (4 pcs), speakers, mixers, socket extension.", ""],
    ["Sound System", "Kuya Marvin: availability, charges, gear list", "critical", "2026-10-25", "Jeg", "4 mics (2 handheld + lapels if possible), speakers, mixer, extension cords; church system as backup.", ""],
    ["Sound System", "Sound check schedule", "high", "2026-11-10", "Jeg", "A slot once everyone walks in at 4:00 (or at the majlis); who runs playback (phone + laptop + aux).", ""],
    ["Sound System", "Projector & screen playback test", "high", "2026-11-09", "Jeg", "Love-story film + livestream feed tested; HDMI, adapters and a taped-down power strip.", ""],
    // ── Souvenirs ──
    ["Souvenirs", "Souvenirs", "critical", "2026-10-23", "Rhema", "Need to order ASAP to avoid delays.", ""],
    ["Souvenirs", "Principal sponsors' gift", "critical", "2026-10-23", "Rhema", "Need to order ASAP to avoid delays.", ""],
    ["Souvenirs", "Souvenir table", "medium", "2026-10-11", "Rhema", "Borrow 1 table from church & table cloth.", ""],
    ["Souvenirs", "Souvenir assembly & count", "high", "2026-11-08", "Rhema", "Count against the final yes-headcount + 10 spares; team assembles into bags with tags.", ""],
    ["Souvenirs", "Principal sponsors' gifts wrapped & cards signed", "high", "2026-11-08", "Rhema", "Assign who hands them out after the ceremony.", ""],
    ["Souvenirs", "Parents' & entourage thank-you gifts", "medium", "2026-11-08", "Shai", "Personal notes with each; hand out at the reception entrance or during the program.", ""],
    // ── Programs & Speeches ──
    ["Programs & Speeches", "Speech / toast list", "high", "2026-10-27", "Couple & Coordinator", "List of who will make a speech/toast; inform the list.", ""],
    ["Programs & Speeches", "Parents' speech", "medium", "2026-11-01", "Coordinator", "Parents to prepare.", ""],
    ["Programs & Speeches", "Couple vows", "high", "2026-11-06", "Couple", "Prepare vows.", ""],
    ["Programs & Speeches", "Rehearsal with entourage", "high", "2026-11-10", "Coordinator", "Select date and confirm with entourage — walk the 3:30 majlis briefing and the 4:00 walk-in while you're at it.", ""],
    ["Programs & Speeches", "Ceremony program", "high", "2026-11-05", "Coordinator", "", ""],
    ["Programs & Speeches", "Reception program", "high", "2026-11-05", "Coordinator", "", ""],
    ["Programs & Speeches", "Speech & toast time limits", "high", "2026-10-27", "Couple & Coordinator", "Tell each speaker 2–3 minutes max; give the MC the running order.", ""],
    ["Programs & Speeches", "Write & rehearse our vows", "high", "2026-11-06", "Couple", "Write separately, 2–3 minutes each, one practice read-through together.", ""],
    ["Programs & Speeches", "Ceremony program printing", "medium", "2026-11-05", "Coordinator", "One folded card per seat OR one big sign at the majlis door (fewer prints if livestreamed).", ""],
    ["Programs & Speeches", "Reception rundown & games kit", "high", "2026-11-05", "Coordinator", "Scratch cards, raffle box, prizes, markers; MC script with music cues.", ""],
    ["Programs & Speeches", "Coordinator master document", "critical", "2026-11-09", "Couple & Coordinator", "One doc for each coordinator: full timeline, vendor contacts & payments, guest list, seating, procession order, floor plan.", ""],
    ["Programs & Speeches", "Couple's pocket timeline", "medium", "2026-11-10", "Couple", "Your own version: call times, HMUA, photos, ceremony, grand entrance — on your phone lock screen.", ""],
    // ── Wedding Day (the last 48 hours) ──
    ["Wedding Day", "Cash envelopes & designated payer", "critical", "2026-11-09", "Jeg", "Label each envelope (venue, caterer, P/V, sound, HMUA); ONE person holds and pays; amounts checked against receipts.", ""],
    ["Wedding Day", "Transport & call times", "high", "2026-11-08", "Jeg", "Who drives whom, departure times; parking is the separate area (The Heaven's team point the way at the gate).", ""],
    ["Wedding Day", "Phone charging station", "medium", "2026-11-10", "Marilyn", "Power bank + cables at the majlis for guests; our own chargers labelled in the emergency kit.", ""],
    ["Wedding Day", "Weather plan B", "medium", "2026-11-08", "Coordinator", "If it rains: is the majlis covered? Umbrellas, towels, plastic sleeves for anything outdoors.", ""],
    ["Wedding Day", "The 4:00 PM walk-in marshals", "critical", "2026-11-08", "Coordinator", "Coordinators line everyone up at the majlis by 3:50 and walk the whole party into the hall together; assign who signals it.", ""],
    ["Wedding Day", "Little ones' quiet basket", "medium", "2026-11-10", "Shai", "Non-messy snacks and a quiet activity for the ring bearer & flower girl during the briefing.", ""],
    ["Wedding Day", "Final pack check: emergency kit", "high", "2026-11-10", "Shai", "Add safety pins, blotting paper, spare earrings, meds, sewing kit, heel tips, phone batteries, tissue, stain stick.", ""],
    ] as [string, string, Priority, string, string, string, string][]).map(
      ([section, task, category, due_date, owner, details, done], i) => ({
        id: `k${i + 1}`, task, category: category as Priority, due_date, completed: done === "done", section, owner, details,
      }),
    ),
  ],
  attire: [
    { id: "a1", group: "bride", label: "The Bride", colors: [c("White", "#F6F1EB")], reserved: true, notes: "", swatch_url: "", order: 1 },
    { id: "a2", group: "groom", label: "The Groom", colors: [c("Black", "#0B0B0B")], reserved: true, notes: "", swatch_url: "", order: 2 },
    { id: "a3", group: "shai_family", label: "Shai's Family", colors: [c("Copper", "#8C3617")], reserved: true, notes: "", swatch_url: "", order: 3 },
    { id: "a4", group: "jeg_family", label: "Jeg's Family", colors: [c("Burgundy", "#5C1223")], reserved: true, notes: "", swatch_url: "", order: 4 },
    { id: "a5", group: "bridesmaids", label: "Bridesmaids", colors: [c("Garnet", "#8E1226"), c("Turquoise", "#0F7E7A"), c("Citrine", "#BE8B0F"), c("Sapphire", "#0A2A6E"), c("Ruby", "#B01A63")], reserved: true, notes: "Garnet for the Maid of Honor, the Matron of Honor and the bride's sister-in-law; the bridesmaids in Turquoise, Citrine, Sapphire and Ruby", swatch_url: "", order: 5 },
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
    { id: "f0", question: "Can I watch the ceremony?", answer: "Please do — it would mean the world. We chose to keep our 4 PM ceremony intimate, with our families, our entourage and a few honoured guests — and if your heart wishes to be there as we say “I do”, you are more than welcome to join us. The hall is being cleaned and prepared until 4:00 PM, so please come straight to the majlis, just outside the hall, before 4:00 PM: our coordinators will gather everyone there, snacks and refreshments are served, and a few minutes before the procession we will all walk into the hall together — the doors close the moment it begins. Reserved rows are for our families and entourage, with open seats around them. From 5:30 PM everyone is welcome — join us for the Welcome Toast & Snacks, then the reception at 7:00 PM.", order: 0 },
    { id: "f1", question: "Can I bring a plus one?", answer: "Your invitation lists your seats. The RSVP lets you choose 1 or 2 pax only if we've reserved two for you.", order: 1 },
    { id: "f2", question: "What should I wear?", answer: "Black tie, in glossy greens and warm shining browns. Greens: emerald, laurel, jade, scarab, olive, peridot. Warm browns: coffee, smoky topaz, bronze, dark honey, caramel, toffee — every shade is swatched in the Dress Code section above. Kindly avoid black, white, burgundy and copper, which are reserved for our families and entourage. Do bring the shine: satin, velvet, silk, fine suit wool and liquid poly are all welcome, while tulle, chiffon and anything fully matte are best left at home.", order: 2 },
    { id: "f3", question: "Are kids welcome?", answer: "We adore your little ones — they are welcome to join the reception whenever your invitation says so. The ceremony itself is an adults-only celebration, unless they are part of our entourage: our flower girl and ring bearer hold the front row.", order: 3 },
    { id: "f4", question: "Is there parking?", answer: "Yes — though not in the courtyard: parking is in a separate area, and The Heaven's team will tell you where to park when you arrive at the gate. Then walk straight to the majlis — it is where everyone is gathered.", order: 4 },
    { id: "f5", question: "Can I post photos?", answer: "Please! Tag @shaiandjeg and use #JSGotMarried — #JSSayIDo and #JSWishComeTrue work beautifully too. We only ask for an unplugged ceremony.", order: 5 },
    { id: "f6", question: "Where do I go when I arrive?", answer: "Straight to the majlis — the welcome lounge just outside the hall. The hall itself rests from 2:00 to 4:00 PM while The Heaven's team clean and prepare it, so nobody enters until 4:00. Our coordinators will meet you at the majlis, the entourage is briefed there, and snacks and refreshments are served from the moment you arrive. A few minutes before 4:00 PM we all walk into the hall together for the ceremony — and from 5:30 PM the majlis hosts the Welcome Toast & Snacks until the reception at 7:00 PM.", order: 6 },
  ],
  message_templates: [],
  messages: [],
  bridesmaid_cards: [],

  // The starter wish list for the public /gifts page — the couple edits every line in the
  // binder's Gift list tab. Claims are never seeded: every guest starts with everything open.
  gift_items: [
    { id: "g1", title: "Espresso machine", note: "For our slow mornings together", claimed: false, claimed_by: "", claimed_at: null, order: 0 },
    { id: "g2", title: "Luxury bed linen", note: "Crisp cotton, king size", claimed: false, claimed_by: "", claimed_at: null, order: 1 },
    { id: "g3", title: "Dinnerware set", note: "Twelve settings, for hosting our favourite people", claimed: false, claimed_by: "", claimed_at: null, order: 2 },
    { id: "g4", title: "Stand mixer", note: "The baking dream", claimed: false, claimed_by: "", claimed_at: null, order: 3 },
    { id: "g5", title: "Weekend away", note: "Towards our first little trip as a married couple", claimed: false, claimed_by: "", claimed_at: null, order: 4 },
    { id: "g6", title: "Smart speaker", note: "For dancing in the kitchen", claimed: false, claimed_by: "", claimed_at: null, order: 5 },
  ],
};
