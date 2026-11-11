"use client";
import { useEffect, useMemo, useState } from "react";
import { useTable } from "@/lib/hooks";
import { downloadCanvas, drawInvitation, drawPhotobooth } from "@/lib/wedding-assets";
import type { Guest, WeddingInfo } from "@/lib/types";
import { Btn, Card, PageHead, Tag, toCsv, download } from "./ui";

const fmtDate = (value: string) => new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Bahrain" }).format(new Date(value));

function DownloadableKeepsakes({ info }: { info: WeddingInfo }) {
  const [which, setWhich] = useState<"invitation" | "booth">("invitation");
  const [preview, setPreview] = useState("");
  useEffect(() => {
    try {
      const c = which === "invitation" ? drawInvitation(info) : drawPhotobooth(info);
      setPreview(c.toDataURL("image/png"));
    } catch { setPreview(""); }
  }, [info, which]);
  const save = () => {
    const c = which === "invitation" ? drawInvitation(info) : drawPhotobooth(info);
    downloadCanvas(c, which === "invitation" ? "shaira-jeger-wedding-invitation.png" : "shaira-jeger-three-frame-photobooth.png");
  };
  return (
    <Card title="Wedding keepsakes · download PNGs">
      <div className="flex flex-wrap gap-2 mb-4">
        <Btn variant={which === "invitation" ? "dark" : "ghost"} onClick={() => setWhich("invitation")}>Invitation · 5 × 7 in</Btn>
        <Btn variant={which === "booth" ? "dark" : "ghost"} onClick={() => setWhich("booth")}>Photobooth · 3 frames</Btn>
      </div>
      <p className="text-sm text-ink/60 leading-relaxed mb-4">
        {which === "invitation"
          ? "A clean, vintage-inspired invitation prop for your couple portraits and flat-lays. It uses your saved names, date and venue; update those under Details before downloading. Print at 5 × 7 inches."
          : "A burgundy-and-gold 6 × 4 in landscape overlay with three transparent photo windows, a warm paper mat and a little vintage detail. Ask the photobooth operator to place this PNG above the three captured photos; it is an overlay, not a finished strip of photos."}
      </p>
      {which === "booth" && <p className="mb-3 rounded-xl bg-wine/5 p-3 text-xs text-ink/65">Design direction: rich burgundy, antique gold, soft ivory, fine corner flourishes and generous face-safe frames—more like a keepsake print than three plain white boxes. The three photo openings are transparent.</p>}
      <div className={`mx-auto max-w-2xl overflow-hidden rounded-xl border border-taupe/30 shadow-sm ${which === "booth" ? "bg-[repeating-conic-gradient(#eee_0%_25%,white_0%_50%)] bg-[length:20px_20px]" : "bg-white"}`}>
        {preview ? <img src={preview} alt={which === "invitation" ? "Wedding invitation card preview" : "Three-frame burgundy photobooth template preview"} className="block h-auto w-full" /> : <div className="h-72 grid place-items-center text-sm text-taupe">Preparing the preview…</div>}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-ink/50">Names, date and venue read from Binder → Details.</span>
        <Btn variant="dark" onClick={save}>Download {which === "invitation" ? "invitation" : "3-frame template"} (.png)</Btn>
      </div>
    </Card>
  );
}

type ShotItem = { time: string; heading: string; detail: string; priority?: string };
type TimelineItem = { time: string; heading: string; bullets: string[]; flag?: string };

/** A fast, bullet-first handoff for the crew; the full creative brief remains below it. */
const photoVideoTimeline: TimelineItem[] = [
  {
    time: "12:30–1:00 PM",
    heading: "P/V arrival, setup + details",
    flag: "12:30 IDEAL · 1:00 LATEST",
    bullets: [
      "Ask the team to arrive at 1:00 PM at the latest; 12:30 gives time for setup and detail shots. A 2:00 PM arrival misses most prep and vow-writing.",
      "Room wide shots, dress/suit, rings, shoes, flowers, invitation and handwritten vows; check audio and light.",
    ],
  },
  {
    time: "1:00–2:00 PM",
    heading: "Natural prep + vow-writing BTS",
    bullets: [
      "Bride: mum and sisters helping, bridesmaids and family chatting, laughing and getting ready. Groom: groomsmen and family in their room.",
      "Film each of you writing or rereading vows; hands, pages and natural pauses. Ask one or two relaxed questions; no scripted answers or staged emotion.",
      "Split photo/video coverage between rooms. If prep is already finished, capture real final moments and details—do not recreate them.",
    ],
  },
  {
    time: "2:00–2:20 PM",
    heading: "Bride’s first looks · garden by bridal suite",
    bullets: [
      "Bridesmaids first; reset; family separately. Stay on the entrance, genuine reactions, hugs and comments.",
      "After each candid reveal, take one natural group portrait with that group.",
    ],
  },
  {
    time: "2:20–2:35 PM",
    heading: "Groom with family + groomsmen",
    bullets: [
      "Capture their first reactions in the groom’s room, warm comments, greetings and a relaxed group portrait.",
    ],
  },
  {
    time: "2:35–3:00 PM",
    heading: "Couple’s private first look, prayer + vows",
    flag: "PRIORITY MOMENT",
    bullets: [
      "A quiet garden spot: genuine first reaction, prayer together, personal words and private vows before the ceremony.",
      "Use discreet close-ups and clean audio; give the moment space and do not ask for a repeat.",
    ],
  },
  {
    time: "3:00–3:15 PM",
    heading: "Wedding party + motion-blur scene",
    bullets: [
      "A few joyful portraits with bridesmaids and groomsmen together.",
      "Keep the couple still and sharp while the party walks past; get one slow-shutter blur and one clean frame, plus a moving video pass.",
    ],
  },
  {
    time: "3:15–3:30 PM",
    heading: "Family portraits + room reactions",
    bullets: [
      "Shaira’s family, Jeger’s family, then one combined family/party portrait. Have groups ready; keep posing quick and warm.",
      "Capture a few real comments about how you look in each room before everyone moves.",
    ],
  },
  {
    time: "3:30–4:30 PM",
    heading: "Guest arrival, venue details + entourage briefing",
    flag: "COORDINATE THE OVERLAP",
    bullets: [
      "The ceremony PDF lists guest arrival from 3:30–4:00 PM. Ask the coordinator to hold guests in the Majlis until empty-room photos are done, or photograph the hall before guests arrive.",
      "Split coverage: one shooter on arrivals/venue; another on the 4:00 PM entourage briefing and short, optional guest messages in the Dome Tent Majlis.",
      "Keep interviews natural and brief; do not delay the ceremony call.",
    ],
  },
  {
    time: "By 4:15 PM",
    heading: "Livestream ready for the 4:30 ceremony",
    flag: "DEDICATED STREAM OPERATOR",
    bullets: [
      "Livestream operator arrives by 3:30–3:45 PM; finish framing, sound and connection checks by 4:00 PM.",
      "Open the stream / waiting screen by 4:15 PM so remote guests can tune in. Keep the locked wide camera and cables clear of the aisle.",
    ],
  },
  {
    time: "4:30 PM onward",
    heading: "Ceremony · follow the printed programme",
    flag: "WORSHIP · PRAY-OVER · RING BLESSING · FOOT WASHING",
    bullets: [
      "Welcome and instrumental; procession: best man → groom’s mother → groom → principal sponsors → groomsmen → bridesmaids → Bible bearer → matron → maid → bride’s parents → flower girl → bride.",
      "Prologue → opening prayer → praise & worship → wedding message. Prioritise the couple worshipping and the congregation joining.",
      "Pray-over and wedding charge → Communion → Bible ceremony → ring blessings → washing of feet → cord. Capture faces, hands, rings and the reverent wide view; groom washes the bride’s feet first.",
      "Vows (groom first) → I Do → ring exchange → unity candle → marriage declaration/kiss/presentation → final benediction → victory worship → celebratory march.",
    ],
  },
  {
    time: "After the ceremony",
    heading: "Family groups + Heaven Door exit",
    bullets: [
      "If the coordinator can pause the flow: family and wedding-party photos first, then the couple’s exit through the Heaven door with flowers/confetti.",
      "If the recessional must happen immediately, capture the exit first and gather the groups straight after, before guests leave for the Majlis.",
    ],
  },
  {
    time: "After ceremony–6:30 PM",
    heading: "Couple portraits + Majlis guest moments",
    bullets: [
      "Couple: wide venue view, stairs, bridal entrance door, garden, gentle run and a short dance; Victorian-inspired, romantic and lively, not overly posed.",
      "While you are away: Majlis snacks, guest portraits and short messages/interviews about the couple. Keep one shooter with guests.",
    ],
  },
  {
    time: "6:30–7:10 PM",
    heading: "Reception arrival, welcome mirror + seating",
    flag: "CONFIRM ARRIVAL TIME",
    bullets: [
      "Reception PDF: guest arrival 6:30–7:00 PM; seating 7:00–7:10 PM. This differs from the 7:00 PM guest-entry note—confirm the final cue with the coordinator.",
      "If dry, take individual/group portraits at the welcome mirror before seating; agree on an indoor rain backup. Follow the hall-entry cue; guests may wait in the Majlis/Tent.",
    ],
  },
  {
    time: "7:10–7:40 PM",
    heading: "Reception welcome, entrances + dances",
    bullets: [
      "7:10 welcome → 7:15 groomsmen → 7:20 bridesmaids → 7:25 couple entrance. Capture each entrance and guest reactions.",
      "Insert your music-video presentation immediately before the listed 7:30 PM first dance; confirm its length with the MC and shift later cues if needed.",
      "Listed: first dance 7:30–7:35; father–daughter dance 7:35–7:40. Capture movement, reactions and one full-room view.",
    ],
  },
  {
    time: "7:40–8:19 PM",
    heading: "Speeches, cake + meal blessing",
    bullets: [
      "7:40–7:47 Matron → 7:47–7:54 Maid → 7:54–8:04 Best Man → 8:04–8:14 cake/toast → 8:14–8:19 meal blessing.",
      "Record clean speech audio; cut to the couple, laughter and family reactions. Photograph the cake before it is cut.",
    ],
  },
  {
    time: "8:19–9:04 PM",
    heading: "Dinner, table portraits + DIY keepsakes",
    bullets: [
      "Table 1 first, then photos with the remaining tables in order. Capture guests making keychains and charms, helping each other and showing finished keepsakes.",
      "Photobooth runs 8:00–10:00 PM; assign a dedicated operator so the main P/V team does not miss programme moments.",
    ],
  },
  {
    time: "After dinner → 9:04 PM",
    heading: "Unlisted game, then Prosperity / money dance",
    flag: "ADD GAME TO MC CUE SHEET",
    bullets: [
      "The game/activity is not in the reception PDF. Confirm its name and slot with the MC; insert it after dinner and move the dance cue if needed.",
      "The PDF lists a 9:04–9:14 PM Prosperity Dance to “Dilaw”; confirm this is the money dance you mean.",
    ],
  },
  {
    time: "9:14 PM onward",
    heading: "Performances, blessings + open dance floor",
    bullets: [
      "9:14–9:34 performances → 9:34–9:49 parent blessings → 9:49 bouquet → 9:54 thank-you → 10:00 prayer; capture faces and reactions.",
      "10:05 transition; 10:15 open dance floor. Flexible guest speeches may be inserted—keep cameras ready for candid dancing.",
    ],
  },
];

const prepShots: ShotItem[] = [
  { time: "12:30–1:00 PM", heading: "P/V arrival and quiet details", detail: "Ask the team to arrive at 12:30 PM if possible (1:00 PM latest), not 2:00 PM. Capture the rooms, window light, dress and suit, rings, shoes, bouquet, invitation and handwritten vows; check audio and light before filming begins.", priority: "RECOMMENDED CALL TIME" },
  { time: "1:00–2:00 PM", heading: "Vow-writing BTS + natural prep", detail: "Film Shaira and Jeger writing or rereading vows naturally in their separate rooms: hands, pages, pauses and small reactions. Ask one or two gentle questions, not scripted lines. Also capture Shaira's mum and sisters helping, bridesmaids and family interacting, and Jeger's family and groomsmen. Split coverage between rooms; do not recreate getting-ready moments that have already happened." },
  { time: "2:00–2:20 PM", heading: "Bride's first looks · garden by bridal suite", detail: "Invite bridesmaids first, then reset and bring in Shaira's family separately. Capture the entrance, genuine expressions, embraces and comments, followed by one graceful group portrait with each group." },
  { time: "2:20–2:35 PM", heading: "Groom with family + groomsmen", detail: "Capture Jeger's first reactions with his family and groomsmen in his room: greetings, comments, laughter and a relaxed group portrait. Keep the moment separate from the bride's first looks." },
  { time: "2:35–3:00 PM", heading: "Couple's private first look, prayer and vows", detail: "Meet in a quiet garden spot. Capture the genuine first reaction, prayer together, personal words and private vows. Use discreet close-ups and clean audio; do not interrupt or ask them to repeat the moment.", priority: "MOST IMPORTANT" },
  { time: "3:00–3:15 PM", heading: "Bridal party together + motion-blur pass-by", detail: "Get a few joyful portraits of the couple with bridesmaids and groomsmen. Then keep the couple still and sharp while the party walks past; take one slow-shutter blur and one clean frame. Video can capture a natural moving pass-through." },
  { time: "3:15–3:30 PM", heading: "Family portraits + room reactions", detail: "Shaira with her family, Jeger with his family, then one combined family/party portrait. Have groups ready and keep posing warm and quick. Capture a few genuine comments about how you look before everyone moves; the ceremony programme lists guest arrival from 3:30 PM." },
];
const ceremonyShots: ShotItem[] = [
  { time: "3:30–4:00 PM", heading: "Ceremony guest arrivals + seating", detail: "The ceremony PDF lists guest arrival from 3:30–4:00 PM. Capture greetings and the room filling. This overlaps the planned 4:00 PM empty-room photos; ask the coordinator to hold guests in the Majlis until details are finished, or photograph the room before guest entry. Split coverage if possible.", priority: "CONFIRM WITH COORDINATOR" },
  { time: "4:00–4:15 PM", heading: "Venue details + livestream check", detail: "Capture the altar/cross, aisle, chairs, flowers, rings, Bible, Communion, cord, candle and foot-washing setup. A dedicated livestream operator should arrive by 3:30–3:45 PM, test framing/audio/connection by 4:00 and open the stream or waiting screen by 4:15. Keep the locked wide shot and cables out of the aisle.", priority: "LIVESTREAM LIVE BY 4:15" },
  { time: "4:00–4:30 PM", heading: "Entourage briefing + guest voices", detail: "Take candid frames at the Dome Tent Majlis while the entourage receives instructions. If time allows, record short, optional guest messages in a quiet corner. Split this with venue/arrival coverage; do not delay the ceremony call." },
  { time: "4:30 PM", heading: "Welcome, instrumental and procession", detail: "Get a wide room view, host welcome and instrumental cue. Procession order: best man; groom's mother; groom; principal sponsors; groomsmen; bridesmaids; Bible bearer; matron of honour; maid of honour; bride's parents; flower girl; bride. Capture each entrance, both sides' reactions and the full aisle arrival. Keep a locked wide angle for the livestream." },
  { time: "After procession", heading: "Prologue, opening prayer + praise & worship", detail: "Follow the host's prologue, Pastor Deon Aguilar's opening prayer, then the worship song led by Mr. & Mrs. Deon Aguilar. Prioritise the couple worshipping and the congregation joining; also capture musicians and quiet expressions. No flash or movement that distracts." },
  { time: "Message + pray-over", heading: "Wedding message, prayer circle + charge", detail: "Pastor Benny's message, then parents, principal sponsors and entourage praying over the couple, followed by the wedding charge. Capture one full-circle wide, hands and expressions, and the couple's faces. Record clean audio and do not stage a repeat.", priority: "MOST IMPORTANT" },
  { time: "Ceremony rites", heading: "Communion, Bible + ring blessings", detail: "Follow the printed overview: Holy Communion → Bible ceremony → ring blessings. Capture the couple with the Bible and their promise; then the entourage praying over the rings, with a clear view of hands, faces and symbols. Follow the officiant's live cue if the detailed script shifts the order.", priority: "MOST IMPORTANT" },
  { time: "Ceremony rites", heading: "Washing of feet + cord", detail: "Capture the couple serving one another (groom washes the bride first), the water/towel details and their expressions; then the cord and the couple tying the knots. Hold a respectful distance and preserve the quiet reverence.", priority: "MOST IMPORTANT" },
  { time: "Vows + rings", heading: "Personal vows, I Do, rings + unity candle", detail: "Face-to-face, hands held: groom's vows first, then bride's; each I Do; exchange of rings; then the unity candle. Frame hands and faces, plus a clean wide view with both families. Record vow audio clearly and never block the livestream camera." },
  { time: "Ceremony close", heading: "Declaration, kiss, benediction + march", detail: "Marriage declaration and presentation, first kiss, final benediction, victory worship song and celebratory march. If the coordinator can pause the flow, take family/wedding-party photos first, then the Heaven door exit. If the recessional must be immediate, film the exit first and gather groups straight after before guests move to the Majlis." },
];
const fellowshipShots: ShotItem[] = [
  { time: "After ceremony–6:30 PM", heading: "Majlis fellowship + couple portraits", detail: "While guests have snacks and portraits/interviews at the Dome Tent Majlis, use the venue for a short couple session: a whole-room view, staircase, bridal entrance door, garden, gentle run and a brief dance. Mix Victorian-inspired editorial frames with movement and laughter; avoid making every image solemn or heavily posed. Return in time for the reception call." },
  { time: "After ceremony–6:30 PM", heading: "Guest portraits + interview sound bites", detail: "At the Majlis: candid greetings, snacks, individual/small-group guest portraits and short optional messages about the couple. Keep audio clean and answers natural. Assign a shooter to guests while the couple is photographed; do not let interviews delay hall seating." },
  { time: "6:30–7:10 PM", heading: "Welcome-mirror arrivals + seating", detail: "The reception PDF lists guest arrival 6:30–7:00 PM and seating 7:00–7:10 PM (the couple's note says 7:00 PM entry). Confirm the final cue. If weather permits, photograph guests individually or in groups by the welcome-sign mirror before seating; agree on an indoor rain backup and follow the coordinator's hall-entry instruction." },
];
const receptionShots: ShotItem[] = [
  { time: "6:30–7:10 PM", heading: "Hall arrival and seating", detail: "The supplied master programme has guests arriving at the hall 6:30–7:00, then seating 7:00–7:10. Capture the styled empty hall first, welcome mirror, table settings, guests arriving and finding seats. At 6:30, bridesmaids/groomsmen may enter to freshen up, per the programme." },
  { time: "7:10–7:30 PM", heading: "Welcome + entrances", detail: "Welcome remarks, groomsmen entrance, bridesmaids entrance, then couple entrance. Capture each person's entrance and guest reactions; one wide room view plus close reactions. Coordinate the entrance path and keep it clear." },
  { time: "Before first dance", heading: "Music-video presentation", detail: "Play the couple's music video before the first dance as requested. Get the screen and couple in one frame, guest reactions, and a few close-ups of family watching. Confirm its exact slot with the MC because it is not listed in the supplied timed reception programme." , priority: "ADD TO MC RUN-OF-SHOW" },
  { time: "7:30–7:40 PM", heading: "First dance + father–daughter dance", detail: "Couple's first dance, then father and daughter. Capture opening movement, hands, expressions, wide room atmosphere, and parent/family reactions. Mix a few elegant portrait-like frames with genuine smiles and movement." },
  { time: "7:40–8:14 PM", heading: "Speeches, cake, toast and meal blessing", detail: "Matron of Honour Rhema; Maid of Honour Beah; Best Man Karl's speech/toast; cake cutting and couple's toast; blessing over the meal. Record each speaker cleanly and cut to the couple listening, laughter/tears and family reactions. Photograph the cake before it is cut." },
  { time: "8:14–9:04 PM", heading: "Dinner, table portraits + handmade favours", detail: "Dinner begins with Table 1 photo opportunity with the couple, then continue in table-number order. Capture warm table interactions, requested songs, and guests making their own DIY keychains and charms—hands choosing pieces, helping each other, finished keepsakes and smiles. Keep food/documentary shots natural, not staged." },
  { time: "After dinner, before Prosperity Dance", heading: "Add the unlisted game/activity", detail: "The couple mentioned a game/activity after dinner but before the money/prosperity dance; it is absent from the supplied master programme. Ask the MC/coordinator for its name, exact slot, props and participant list, then add the cue to the final run-of-show. Capture the instructions, participants, reactions and result." , priority: "CONFIRM WITH MC" },
  { time: "9:04–9:14 PM", heading: "Prosperity / money dance", detail: "The master programme calls this the Prosperity Dance, with the band performing “Dilaw” as a full-band performance. Capture the couple and each interaction, guests joining, wide dance-floor energy and a few close details. Confirm this is the same moment the couple calls the money dance." },
  { time: "9:14–10:15 PM", heading: "Performances, parent blessings, bouquet + close", detail: "Kaia, bridesmaids and groomsmen performances; parents' blessing speeches (Pastor Benny, Marlyn, Gwen); bouquet toss; couple thank-you speech; closing prayer; transition to open dance floor. Get a safe wide shot, speaker/performance close-ups and family responses. Flexible speeches from Gideon, Jannel, Laureen and Kerk may be inserted by the host—keep cameras ready." },
  { time: "8:00–10:00 PM", heading: "Three-frame photobooth", detail: "Photobooth runs 8:00–10:00 PM, overlapping dinner and the programme. Assign a dedicated booth operator or second photographer; the main photographer should not be asked to miss the scheduled reception moments. Capture a few behind-the-scenes booth interactions and the couple's own strip." },
];

function ShotCard({ item }: { item: ShotItem }) {
  return <article className="break-inside-avoid rounded-xl border border-wine/15 bg-white/75 p-4 md:p-5">
    <div className="flex flex-wrap items-center gap-2 mb-2"><span className="label !text-[10px] text-wine">{item.time}</span>{item.priority && <span className="label !text-[9px] rounded-full bg-wine/10 px-2.5 py-1 text-wine">{item.priority}</span>}</div>
    <h3 className="font-serif text-xl text-ink">{item.heading}</h3><p className="mt-1.5 text-sm leading-relaxed text-ink/70">{item.detail}</p>
  </article>;
}

function PhotoVideoTimeline({ info }: { info: WeddingInfo }) {
  return <article className="print-guide mx-auto max-w-5xl rounded-2xl border border-wine/15 bg-[#fbf8f0] p-5 shadow-sm md:p-9">
    <header className="border-b border-wine/20 pb-5">
      <p className="label text-wine">PHOTO + VIDEO · QUICK HAND-OFF</p>
      <h1 className="display mt-2 text-4xl md:text-5xl">The day, at a glance.</h1>
      <p className="mt-3 text-sm text-ink/70">{info.bride} &amp; {info.groom} · {fmtDate(info.date)} · {info.venue_name}, {info.venue_address}</p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl bg-white p-3"><p className="label text-wine">CALL TIME</p><p className="mt-1 text-sm">Ask for <b>12:30 PM</b> if possible; <b>1:00 PM latest</b>. 2:00 PM is too late for prep and vow-writing.</p></div>
        <div className="rounded-xl bg-white p-3"><p className="label text-wine">PHOTO FEEL</p><p className="mt-1 text-sm">Natural, candid, joyful. Add a few flattering, Pinterest-worthy portraits—no over-posing or heavy glam.</p></div>
        <div className="rounded-xl bg-white p-3"><p className="label text-wine">COVERAGE</p><p className="mt-1 text-sm">Split bride/groom prep and Majlis/venue moments. Use a separate livestream operator and photobooth attendant.</p></div>
      </div>
    </header>
    <ol className="mt-5 space-y-3">
      {photoVideoTimeline.map((item) => <li key={`${item.time}-${item.heading}`}>
        <article className="break-inside-avoid rounded-xl border border-wine/15 bg-white/80 p-4 md:grid md:grid-cols-[145px_minmax(0,1fr)] md:gap-5">
          <time className="label !text-[11px] text-wine">{item.time}</time>
          <div className="mt-2 min-w-0 md:mt-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-serif text-xl leading-tight text-ink">{item.heading}</h2>
              {item.flag && <span className="label !text-[9px] rounded-full bg-wine/10 px-2.5 py-1 text-wine">{item.flag}</span>}
            </div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-ink/75">
              {item.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
            </ul>
          </div>
        </article>
      </li>)}
    </ol>
    <footer className="mt-5 border-t border-wine/20 pt-4 text-xs leading-relaxed text-ink/65">
      <b>Confirm with the coordinator / MC:</b> ceremony guests are listed from 3:30 PM, the hall is expected ready around 4:00 PM, reception arrivals are listed from 6:30 PM (not 7:00 PM), and the music-video and game slots need adding to the final run-of-show.
    </footer>
  </article>;
}

function PhotoVideoGuide({ info }: { info: WeddingInfo }) {
  const sections = [
    { title: "Prep, vows & first looks", note: "The requested tone is documentary first, with a few polished portraits: warm, candid, faith-filled, joyful and unforced—not a full day of solemn poses or heavy glam retouching.", items: prepShots },
    { title: "Ceremony · 4:30 PM", note: "Follow the officiant and host for real-time cues. Keep the livestream's locked wide camera and the central aisle unobstructed; take stills from the sides and back when possible.", items: ceremonyShots },
    { title: "Majlis & couple portraits", note: "Ceremony is private. After the recessional and group photos, guide other guests to the Dome Tent majlis while the couple uses the venue for a short portrait/video session.", items: fellowshipShots },
    { title: "Reception · from 6:30 PM", note: "Use the supplied reception programme timings as the base, then confirm the additional music-video presentation and game with the MC before the final day-of copy is printed.", items: receptionShots },
  ];
  return <div className="print-guide">
    <div className="rounded-2xl border border-wine/15 bg-[#fbf8f0] p-5 md:p-8">
      <div className="border-b border-wine/20 pb-5 mb-5">
        <div className="label text-wine">PHOTO + VIDEO · WORKING CREATIVE BRIEF</div>
        <h2 className="display text-4xl md:text-5xl mt-2">A day, honestly remembered.</h2>
        <p className="mt-3 text-sm text-ink/70">{info.bride} &amp; {info.groom} · {fmtDate(info.date)} · {info.venue_name}, {info.venue_address}</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl bg-white p-3"><div className="label text-wine">THE FEEL</div><p className="mt-1 text-sm">Candid, lively, romantic and faith-centred; natural moments with a few timeless editorial portraits.</p></div>
          <div className="rounded-xl bg-white p-3"><div className="label text-wine">ARRIVAL REQUEST</div><p className="mt-1 text-sm">Please arrive around <b>12:30–1:00 PM</b>, not 2:00 PM, if possible. Prep is mostly finished by 2 and we want vow-writing BTS and genuine getting-ready moments.</p></div>
          <div className="rounded-xl bg-white p-3"><div className="label text-wine">COVERAGE NOTE</div><p className="mt-1 text-sm">Use a separate livestream operator. A second shooter helps cover simultaneous prep, Majlis guests and the 8–10 PM photobooth.</p></div>
        </div>
      </div>
      <div className="space-y-7">
        {sections.map((section) => <section key={section.title} className="break-inside-avoid-page">
          <h2 className="font-serif text-2xl md:text-3xl text-wine">{section.title}</h2><p className="mb-3 mt-1 text-sm leading-relaxed text-ink/65">{section.note}</p>
          <div className="grid gap-3 md:grid-cols-2">{section.items.map((item) => <ShotCard key={`${section.title}-${item.heading}`} item={item} />)}</div>
        </section>)}
      </div>
      <footer className="mt-7 border-t border-wine/20 pt-4 text-xs leading-relaxed text-ink/60">
        <b>Before wedding day:</b> confirm the 12:30 PM preferred / 1:00 PM latest P/V call time, second shooter and separate livestream operator; resolve the ceremony guest-arrival 3:30 PM vs empty-hall photos at 4:00 PM; confirm reception arrivals at 6:30 PM vs the requested 7:00 PM entry; add the music video and game to the MC cue sheet; and name a family-photo wrangler. Keep the look candid and movement-led, with a few classic family and Victorian-inspired portraits.
      </footer>
    </div>
  </div>;
}

function SeatingPlanner() {
  const guestsTable = useTable("guests", false);
  const guests = guestsTable.rows;
  const confirmedSeats = guests.filter((g) => g.attending === "yes").reduce((sum, g) => sum + Math.max(1, Number(g.pax) || 1), 0);
  const [tableCount, setTableCount] = useState(1);
  const [message, setMessage] = useState("");
  useEffect(() => {
    const biggest = guests.reduce((n, g) => Math.max(n, Number(g.table_number) || 0), 0);
    setTableCount(Math.max(1, biggest, Math.ceil(confirmedSeats / 10)));
  }, [guests, confirmedSeats]);
  const tables = useMemo(() => Array.from({ length: tableCount }, (_, i) => i + 1), [tableCount]);
  const guestsByTable = useMemo(() => {
    const map = new Map<number, Guest[]>();
    for (let n = 1; n <= tableCount; n++) map.set(n, []);
    for (const g of guests) if (Number(g.table_number) && Number(g.table_number) <= tableCount) map.get(Number(g.table_number))!.push(g);
    return map;
  }, [guests, tableCount]);
  const seatsAt = (number: number) => (guestsByTable.get(number) ?? []).reduce((n, g) => n + Math.max(1, Number(g.pax) || 1), 0);
  const label = (g: Guest) => g.name?.trim() || g.greet?.trim() || g.plus_one?.trim() || "Unnamed household";
  const saveAssignment = async (guest: Guest, table: number | null) => {
    const old = Number(guest.table_number) || null;
    if (table !== null && table !== old) {
      const proposed = seatsAt(table) + Math.max(1, Number(guest.pax) || 1);
      if (proposed > 10) { setMessage(`Table ${table} would have ${proposed} seats. Each table holds 10; choose another table or add a table.`); return; }
    }
    setMessage("");
    await guestsTable.save({ ...guest, table_number: table });
  };
  const autoAssign = async () => {
    const eligible = guests.filter((g) => g.attending === "yes").sort((a, b) => label(a).localeCompare(label(b)));
    if (!eligible.length) { setMessage("No confirmed RSVPs to seat yet. Add or confirm guests first."); return; }
    const occupancy = new Array(tableCount + 1).fill(0);
    // Leave manually seated pending/not-attending households in place and reserve their seats.
    for (const guest of guests) {
      if (guest.attending === "yes") continue;
      const existingTable = Number(guest.table_number) || 0;
      if (existingTable > 0 && existingTable <= tableCount) occupancy[existingTable] += Math.max(1, Number(guest.pax) || 1);
    }
    const changes: Guest[] = [];
    for (const guest of eligible) {
      const size = Math.max(1, Number(guest.pax) || 1);
      let target = 0;
      for (let n = 1; n <= tableCount; n++) if (occupancy[n] + size <= 10) { target = n; break; }
      if (!target) { setMessage(`Not enough table capacity for ${label(guest)}. Add a table and try again.`); return; }
      occupancy[target] += size;
      changes.push({ ...guest, table_number: target });
    }
    await guestsTable.save(changes);
    setMessage(`Placed ${eligible.length} confirmed household${eligible.length === 1 ? "" : "s"} into tables. Review family/friend groups before you lock the plan.`);
  };
  const clearAssignments = async () => {
    const assigned = guests.filter((g) => Number(g.table_number));
    if (assigned.length) await guestsTable.save(assigned.map((g) => ({ ...g, table_number: null })));
    setMessage("All table assignments cleared.");
  };
  const exportCsv = () => download("wedding-seating-plan.csv", toCsv(guests.filter((g) => Number(g.table_number)).map((g) => ({ table: g.table_number, household: label(g), plus_ones: g.plus_one ?? "", seats: Math.max(1, Number(g.pax) || 1), rsvp: g.attending, dietary: g.dietary ?? "", notes: g.note ?? "" }))));
  return <>
    <PageHead kicker="The Binder · guest seating" title="A seat for everyone.">
      <Btn variant="ghost" onClick={() => window.print()}>Print seating plan</Btn>
      <Btn variant="ghost" onClick={exportCsv}>Export CSV</Btn>
    </PageHead>
    <p className="max-w-4xl text-sm leading-relaxed text-ink/65 mb-5">Seat households together and track the number of seats, including plus-ones. Each table is capped at <b>10 people</b>. Start with confirmed RSVPs; pending guests stay unassigned unless you choose to place them manually. Guest tags, dietary notes and household notes remain visible while you plan.</p>
    <div className="grid gap-4 md:grid-cols-3 mb-6">
      <Card><div className="label text-ink/50">Confirmed seats</div><div className="display text-4xl mt-1">{confirmedSeats}</div></Card>
      <Card><div className="label text-ink/50">Current table capacity</div><div className="display text-4xl mt-1">{tableCount * 10}</div></Card>
      <Card><div className="label text-ink/50">Unassigned confirmed seats</div><div className="display text-4xl mt-1">{guests.filter((g) => g.attending === "yes" && !Number(g.table_number)).reduce((sum, g) => sum + Math.max(1, Number(g.pax) || 1), 0)}</div></Card>
    </div>
    <Card title="Quick actions" className="mb-6">
      <div className="flex flex-wrap items-center gap-2"><Btn onClick={() => setTableCount((n) => n + 1)}>+ Add table</Btn><Btn variant="dark" onClick={() => void autoAssign()}>Auto-seat confirmed RSVPs</Btn><Btn variant="ghost" onClick={() => void clearAssignments()}>Clear assignments</Btn><span className="text-xs text-ink/50">Auto-seat is a starting draft by name; it keeps households together, but does not infer relationships.</span></div>
      {message && <p className="mt-3 rounded-lg bg-wine/5 p-3 text-sm text-wine">{message}</p>}
      {guestsTable.error && <p className="mt-3 text-sm text-burgundy">{guestsTable.error}</p>}
    </Card>
    <div className="grid gap-5 xl:grid-cols-2">
      {tables.map((n) => {
        const occupied = seatsAt(n);
        return <Card key={n} title={`Table ${n}`} action={<Tag>{`${occupied}/10 seats`}</Tag>}>
          <div className="mb-3 h-2 rounded-full bg-ink/10 overflow-hidden"><div className={`h-full ${occupied >= 10 ? "bg-wine" : "bg-moss"}`} style={{ width: `${Math.min(100, occupied * 10)}%` }} /></div>
          {(guestsByTable.get(n) ?? []).length === 0 ? <p className="py-4 text-sm text-ink/45">No guests assigned yet.</p> : <ul className="divide-y divide-ink/10">{(guestsByTable.get(n) ?? []).map((g) => <li key={g.id} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><div className="truncate font-medium">{label(g)} <span className="ml-1 text-xs text-ink/50">· {Math.max(1, Number(g.pax) || 1)} seats</span></div><div className="truncate text-xs text-ink/50">{g.plus_one ? `With ${g.plus_one} · ` : ""}{g.dietary || g.note || ""}</div></div><Btn variant="ghost" className="!px-3 !py-1.5" onClick={() => void saveAssignment(g, null)}>Remove</Btn></li>)}</ul>}
          <div className="mt-3 flex gap-2"><Btn variant="ghost" disabled={n !== tableCount || occupied > 0 || tableCount === 1} onClick={() => setTableCount((x) => Math.max(1, x - 1))}>Remove empty last table</Btn></div>
        </Card>;
      })}
    </div>
    <Card title="Guest list · assign households" className="mt-6">
      <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead><tr className="border-b border-ink/10 text-xs text-ink/50"><th className="py-2 pr-3">Household</th><th className="py-2 pr-3">RSVP</th><th className="py-2 pr-3">Seats</th><th className="py-2 pr-3">Dietary / note</th><th className="py-2">Table</th></tr></thead><tbody>{guests.map((g) => <tr key={g.id} className="border-b border-ink/5"><td className="py-3 pr-3 font-medium">{label(g)}{g.plus_one && <small className="block text-ink/50">+ {g.plus_one}</small>}</td><td className="py-3 pr-3 capitalize">{g.attending}</td><td className="py-3 pr-3">{Math.max(1, Number(g.pax) || 1)}</td><td className="max-w-[240px] truncate py-3 pr-3 text-ink/60">{g.dietary || g.note || "—"}</td><td className="py-3"><select aria-label={`Assign ${label(g)} to a table`} value={Number(g.table_number) || ""} onChange={(e) => void saveAssignment(g, e.target.value ? Number(e.target.value) : null)} className="rounded-md border border-ink/15 bg-white px-2 py-1.5"><option value="">Unassigned</option>{tables.map((n) => <option key={n} value={n} disabled={Number(g.table_number) !== n && seatsAt(n) + Math.max(1, Number(g.pax) || 1) > 10}>Table {n} · {seatsAt(n)}/10</option>)}</select></td></tr>)}</tbody></table></div>
      {!guests.length && <p className="py-6 text-center text-sm text-ink/50">Add guests and record RSVPs in Guests &amp; RSVP first; their households will appear here.</p>}
    </Card>
  </>;
}

export function WeddingPhotosTab() {
  const { rows } = useTable("wedding_info");
  const info = rows[0] as WeddingInfo | undefined;
  const [view, setView] = useState<"home" | "timeline" | "full">("home");
  const print = () => {
    document.body.classList.add("printing-photo-guide");
    const cleanup = () => document.body.classList.remove("printing-photo-guide");
    window.addEventListener("afterprint", cleanup, { once: true });
    window.print();
  };
  if (!info) return <div className="p-8 text-sm text-ink/60">Wedding details are loading…</div>;
  return <>
    {view === "home" && <PageHead kicker="The Binder · photo & video" title="Make the moments yours.">
      <Btn variant="dark" onClick={() => setView("timeline")}>Open quick timeline</Btn>
      <Btn variant="ghost" onClick={() => setView("full")}>Open full P/V guide</Btn>
    </PageHead>}
    {view === "home" && <DownloadableKeepsakes info={info} />}
    {view !== "home" && <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-ink/60">{view === "timeline" ? "A concise, time-blocked hand-off for your photo/video team." : "The detailed creative brief and shot guidance."} Print or save this view as a PDF to share.</p>
      <div className="flex flex-wrap gap-2">
        <Btn variant="ghost" onClick={() => setView("home")}>Back to keepsakes</Btn>
        <Btn variant="ghost" onClick={() => setView(view === "timeline" ? "full" : "timeline")}>{view === "timeline" ? "Open full P/V guide" : "View quick timeline"}</Btn>
        <Btn onClick={print}>Print / save PDF</Btn>
      </div>
    </div>}
    {view === "timeline" && <PhotoVideoTimeline info={info} />}
    {view === "full" && <PhotoVideoGuide info={info} />}
  </>;
}

export function SeatingTab() { return <SeatingPlanner />; }
