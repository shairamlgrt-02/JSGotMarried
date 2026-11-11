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
const prepShots: ShotItem[] = [
  { time: "12:30–1:15 PM", heading: "P/V arrival and quiet details", detail: "Recommended earlier arrival: ask the team to be camera-ready by 12:30–1:00 PM, rather than arriving at 2:00 PM. Capture the rooms, window light, dress and suit details, rings, shoes, bouquet, invitation, handwritten vows and natural room activity before the formal prep is finished.", priority: "PLEASE ARRIVE EARLIER" },
  { time: "1:00–1:30 PM", heading: "Vow-writing BTS · both rooms", detail: "Film Shaira and Jeger writing or rereading their vows separately. Stay documentary: natural room sound, hands writing, pauses and small reactions; ask each person one or two gentle questions while they write or just after. Avoid staging tears, scripted answers or a dramatic monologue. A second shooter is needed to cover both rooms at once." },
  { time: "1:30–2:00 PM", heading: "Getting-ready atmosphere", detail: "Candid bridesmaid and groomsmen interactions, family checking in, Shaira's mum and sisters helping her, and the same warmth with Jeger's family. Beauty touch-ups, fastening a button, adjusting a veil or tie, laughter and small gestures. Keep it relaxed and let people talk naturally." },
  { time: "2:00–2:20 PM", heading: "Dress and final details", detail: "Shaira gets into the dress with mum/sisters' help if that timing works; veil, fastening, shoes and a calm breath. Jeger's final jacket, tie, boutonniere and family moment. Capture real reactions; do not hold the couple in a pose for every detail." },
  { time: "2:20–2:40 PM", heading: "Bride's first look · garden by bridal suite", detail: "First invite bridesmaids only, then reset and bring in Shaira's family separately. Keep the camera on the entrance, their first expressions, embraces and comments about how she looks. Leave a little time for one graceful group portrait after each natural reaction." },
  { time: "2:40–3:00 PM", heading: "Groom's family first-look reactions", detail: "Jeger with his family in his room; record their first expressions, greetings and honest comments about his look. Get a small group portrait after the candid exchange. Keep family and bridal-party moments separate as requested." },
  { time: "3:00–3:20 PM", heading: "Couple's private first look, prayer and vows", detail: "First look in the garden, away from the ceremony crowd. Give them a quiet moment to see one another, pray together, say what they want to say and read their personal vows. Use a long lens for the first reaction, then respectful close-ups of hands and faces; do not interrupt the prayer or make them repeat it." , priority: "MOST IMPORTANT" },
  { time: "3:20–3:40 PM", heading: "Bridal party together + motion-blur pass-by", detail: "A few joyful, editorial portraits of the couple with bridesmaids and groomsmen together. Then make the requested busy frame: keep the couple still and sharp in one spot while the party walks past the lens. Ask the photographer for a slow shutter / motion-blur take and a clean sharp version too; video can capture a natural pass-through as a moving shot." },
  { time: "3:40–4:00 PM", heading: "Family portraits and room reactions", detail: "Shaira with her own family; Jeger with his own family; then one full family / party combination if time allows. Get genuine family remarks and affectionate reactions in each room before moving out. Coordinator should call the next group so this stays calm and on time." },
];
const ceremonyShots: ShotItem[] = [
  { time: "4:00–4:15 PM", heading: "Venue ready + livestream setup", detail: "Photograph the ceremony room, altar/cross, aisle, chairs, flowers, rings, Bible, communion, cord, candle and foot-washing items before guests enter. Livestream crew has gear, audio, framing and connection checked by 4:00; start a stable private/unlisted stream and have it live by 4:15 so remote family can tune in before the 4:30 start. Keep tripods and cables out of the aisle and photographer's sightlines.", priority: "LIVESTREAM LIVE BY 4:15" },
  { time: "4:00–4:30 PM", heading: "Entourage briefing + guest voices", detail: "A few candid frames at the Dome Tent majlis while entourage receives instructions. Record short, optional guest messages for the couple in a quiet corner; keep each answer natural and brief. Capture room ambience, greetings and refreshments without delaying the ceremony call." },
  { time: "4:30 PM", heading: "Welcome, instrumental and procession", detail: "Wide establishing shot of guests and room, host welcome, instrumental cue, then each procession entrance in order from the ceremony programme: best man; groom's mother; groom; principal sponsors; groomsmen; bridesmaids; Bible bearer; matron of honour; maid of honour; bride's parents; flower girl; bride. Capture each entrance, reactions from both sides and the bride's full aisle arrival. Keep a locked wide angle for the stream." },
  { time: "After procession", heading: "Prologue, opening prayer and praise & worship", detail: "Host's prologue and invitation to worship; opening prayer; worship song led by Mr. & Mrs. Deon Aguilar. Prioritise the couple worshipping, congregation joining in, musicians and quiet expressions. Use respectful wide and close shots; no flash or movement that distracts from worship." },
  { time: "Message + blessing", heading: "Wedding message and pray-over", detail: "Pastor Benny's message, then parents, principal sponsors and entourage gathering to pray over the couple. Capture the full circle in a wide frame, individual hands/expressions and the couple's faces. Keep sound clean for video and record the prayer without staging repetitions.", priority: "MOST IMPORTANT" },
  { time: "Rites", heading: "Charge, communion, Bible and ring blessing", detail: "Wedding charge; Holy Communion; Bible ceremony with the couple holding the Bible and making their promise; sponsors, groomsmen and bridesmaids praying over the rings. Keep a clear view of hands, symbols and faces. The programme's detailed script places ring blessing around Communion, so follow the officiant's live cue if order varies." },
  { time: "Rites", heading: "Washing of feet + cord", detail: "For foot washing, capture the couple serving one another (groom washes bride first), water and towel details, their expressions and the reverent room. Then the cord ceremony and the couple tying the knots. Hold a respectful distance and allow quiet; this is a key story moment.", priority: "MOST IMPORTANT" },
  { time: "Vows + rings", heading: "Personal vows, I Do and exchange of rings", detail: "Face-to-face, hands held, groom's vows first and bride second; each I Do; Karl hands the rings to the pastor; ring placement and spoken promises. Use stable close-ups of hands and reactions, plus a clean wide shot with both families. Record the vow audio clearly; never block the livestream camera." },
  { time: "Marriage declared", heading: "Kiss, presentation, benediction and exit", detail: "Marriage declaration; first kiss; couple presented as newlyweds; final benediction; victory worship song; celebratory march and recessional. If the officiant/coordinator can pause the flow, take the requested wedding-party and family group portraits first, then the couple's full-width exit through the Heaven door. If the printed recessional must happen immediately, capture that exit first and take the group portraits straight after before everyone moves to the majlis." },
];
const fellowshipShots: ShotItem[] = [
  { time: "After ceremony–7:00 PM", heading: "Majlis fellowship + couple portraits", detail: "While guests have snacks and portraits/interviews at the Dome Tent majlis, use the venue for a short, varied couple session: whole-room establishing composition; staircase; bridal entrance door; garden; gentle walking and one playful run through the garden; a brief dance; details that feel like a romantic Victorian editorial. Mix elegant stills with movement and laughter—avoid making every frame solemn or heavily posed. Keep an eye on heat, footwear and the reception call." },
  { time: "6:00–7:00 PM", heading: "Guest portraits and interview sound bites", detail: "At the majlis: candid greetings, snack/fellowship details, individual and small-group guest portraits, plus short optional messages about the couple. Get names if useful, clean audio, and a mixture of generations. Confirm with the coordinator who is calling guests so portrait/interview queues do not delay hall seating." },
  { time: "Before seating", heading: "Welcome-mirror arrivals", detail: "If weather permits, take individual or group guest portraits by the welcome-sign mirror before guests are seated. Have a rain/indoor backup marked. The supplied reception programme says hall arrival 6:30–7:00 and seating 7:00–7:10; confirm with the coordinator how this fits the couple's requested 7:00 PM guest entrance." },
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

type TimelineBlock = { time: string; heading: string; photos: string[]; video: string[]; note?: string };
const QUICK_TIMELINE: TimelineBlock[] = [
  { time: "12:30–1:00 PM", heading: "P/V arrival · details", photos: ["Dress, suit, rings, shoes, bouquet, invitation", "Room light and candid prep details"], video: ["Room atmosphere and natural sound", "Detail clips; no staged action"], note: "Ask them to arrive before 2 PM; makeup/prep is mostly done by then." },
  { time: "1:00–1:30 PM", heading: "Write the vows", photos: ["Hands writing; thoughtful pauses", "Natural reaction, not a posed cry"], video: ["Quiet BTS in each room", "Ask 1–2 gentle, unscripted questions"], note: "Two shooters needed to cover Shaira and Jeger at once." },
  { time: "1:30–2:00 PM", heading: "Candid getting ready", photos: ["Mum and sisters helping Shaira", "Bridesmaids and groomsmen together", "Family talking, laughing, checking in"], video: ["Natural conversations and small gestures", "Touch-ups, buttoning jackets, veil/tie" ] },
  { time: "2:00–2:20 PM", heading: "Final-ready details", photos: ["Dress/veil/shoes with mum or sisters", "Jeger's jacket, tie and boutonniere"], video: ["Getting-ready movement and reactions", "Keep prompts light; let moments happen" ] },
  { time: "2:20–2:40 PM", heading: "Bride's first looks · garden", photos: ["Bridesmaids first; family separately", "Entrance, reactions, hugs", "One relaxed group portrait each"], video: ["First reactions and natural comments", "Garden ambience" ] },
  { time: "2:40–3:00 PM", heading: "Jeger's family first look", photos: ["Family sees Jeger in his room", "Hugs and one small family portrait"], video: ["Unprompted comments and greetings", "Short candid room scene" ] },
  { time: "3:00–3:20 PM", heading: "Couple first look · prayer · vows", photos: ["First reaction from a little distance", "Hands, embraces, quiet portrait"], video: ["Let them pray and read vows privately", "Do not interrupt or ask for a repeat"], note: "Top-priority private moment." },
  { time: "3:20–3:40 PM", heading: "Joint bridal party", photos: ["Couple with bridesmaids and groomsmen", "Still couple; party walks past for blur", "One sharp version too"], video: ["Natural pass-through / moving shot", "Short candid laughter and walking" ] },
  { time: "3:40–4:00 PM", heading: "Family portraits + reactions", photos: ["Shaira with her family", "Jeger with his family", "Natural room comments; quick full group"], video: ["Family reactions and affectionate remarks", "Short room moments" ] },
  { time: "4:00–4:15 PM", heading: "Venue details + livestream", photos: ["Empty hall, aisle, altar, flowers", "Rings, Bible, communion, cord, candle, foot-washing items"], video: ["Livestream framing/audio check", "Stream live by 4:15 PM"], note: "Keep camera, tripod and cables out of the aisle." },
  { time: "4:00–4:30 PM", heading: "Majlis briefing + guest messages", photos: ["Entourage briefing candids", "Quick group / greeting shots"], video: ["Short guest wishes for the couple", "Clean audio; keep answers natural"], note: "Parallel coverage needs a second shooter; stop in time for ceremony." },
  { time: "4:30 PM onward", heading: "Ceremony · follow live cues", photos: ["Procession and bride's entrance", "Worship, prayers over the couple and rings", "Communion/Bible; washing of feet; cord", "Vows, rings, kiss and family reactions"], video: ["Locked wide livestream + clean audio", "Capture every rite in programme order", "Group photos, then Heaven-door exit if timing allows" ] },
  { time: "After ceremony–7:00 PM", heading: "Couple portraits + majlis", photos: ["Whole venue, staircase, bridal door", "Garden walk/run, short dance", "Victorian-inspired portraits, natural movement"], video: ["Wide venue reveal, walking and dancing", "Majlis guests: snacks, portraits, interviews"], note: "Couple portraits and guest coverage happen at the same time." },
  { time: "6:30–7:10 PM", heading: "Welcome mirror + hall seating", photos: ["Guest portraits at mirror if weather allows", "Styled hall, table details, arrivals"], video: ["Guest greetings and room atmosphere"], note: "Programme says hall arrivals 6:30–7:00; your note says 7:00. Confirm with coordinator." },
  { time: "7:10–7:30 PM", heading: "Welcome + entrances", photos: ["Groomsmen, bridesmaids, then couple", "Wide shot plus guest reactions"], video: ["Entrance walk-ins and applause", "Keep entrance path clear" ] },
  { time: "Before first dance", heading: "Music-video presentation", photos: ["Couple and screen in one frame", "Family watching and reacting"], video: ["Record presentation and audience reactions"], note: "Add an exact slot before the first dance to the MC run-sheet." },
  { time: "7:30–8:19 PM", heading: "Dances, speeches, cake + blessing", photos: ["First dance; father–daughter dance", "Three speeches; cake cut and toast", "Meal blessing and family reactions"], video: ["Clean audio for speeches and blessing", "Full dances, cake/toast and reactions" ] },
  { time: "8:00–10:00 PM", heading: "Photobooth · parallel", photos: ["Couple's own strip; fun guest groups"], video: ["A few booth BTS clips"], note: "Assign a booth operator/second shooter; this overlaps the reception." },
  { time: "8:19–9:04 PM", heading: "Dinner + DIY keepsakes", photos: ["Table 1 with couple, then table order", "Guests making keychains and charms", "Hands, finished souvenirs, natural smiles"], video: ["Table reactions and DIY activity", "Guest song requests / dinner ambience" ] },
  { time: "After dinner · before 9:04", heading: "Game / activity", photos: ["Players, props, reactions, result"], video: ["Instructions and full activity"], note: "Not timed in the supplied programme—confirm cue and duration with MC." },
  { time: "9:04–9:14 PM", heading: "Prosperity / money dance", photos: ["Couple with guests joining", "Wide dance-floor energy and close moments"], video: ["Full-band “Dilaw” and dance", "Keep a wide angle plus reactions" ] },
  { time: "9:14 PM onward", heading: "Performances + close", photos: ["Performances and parent blessings", "Bouquet toss, thank-you, family reactions", "Closing prayer and open dance"], video: ["Record speeches, performances and prayer", "Open-floor start and joyful dancing" ] },
];

function PhotoVideoTimeline({ info }: { info: WeddingInfo }) {
  return <div className="print-guide rounded-2xl border border-wine/15 bg-[#fbf8f0] p-4 md:p-7">
    <div className="mb-4 border-b border-wine/20 pb-4">
      <div className="label text-wine">PHOTO + VIDEO · QUICK TIMELINE</div>
      <h2 className="display mt-2 text-3xl md:text-4xl">{info.bride} &amp; {info.groom} · {fmtDate(info.date)}</h2>
      <p className="mt-2 text-sm text-ink/65">The short version for the day. Check each cue with the coordinator; ceremony and portrait timings may shift.</p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-wine/10 px-3 py-1.5 text-wine"><b>Recommended P/V call:</b> 12:30–1:00 PM</span>
        <span className="rounded-full bg-wine/10 px-3 py-1.5 text-wine"><b>Livestream:</b> live by 4:15 PM</span>
        <span className="rounded-full bg-wine/10 px-3 py-1.5 text-wine"><b>Style:</b> candid first, a few editorial portraits</span>
      </div>
    </div>
    <div className="mb-2 hidden grid-cols-[145px_1fr_1fr] gap-3 px-3 md:grid">
      <span className="label !text-[9px] text-ink/40">TIME</span><span className="label !text-[9px] text-ink/40">PHOTO</span><span className="label !text-[9px] text-ink/40">VIDEO / SCENE</span>
    </div>
    <ol className="space-y-2">
      {QUICK_TIMELINE.map((block) => <li key={block.time + block.heading} className="break-inside-avoid rounded-xl border border-ink/5 bg-white/85 p-3 md:grid md:grid-cols-[145px_1fr_1fr] md:gap-3 md:px-4">
        <div><div className="label !text-[10px] text-wine">{block.time}</div><h3 className="mt-1 font-serif text-lg leading-tight text-ink">{block.heading}</h3></div>
        <div className="mt-2 md:mt-0"><div className="label !text-[9px] text-ink/40 md:hidden">PHOTO</div><ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs leading-snug text-ink/75">{block.photos.map((item) => <li key={item}>{item}</li>)}</ul></div>
        <div className="mt-2 md:mt-0"><div className="label !text-[9px] text-ink/40 md:hidden">VIDEO / SCENE</div><ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs leading-snug text-ink/75">{block.video.map((item) => <li key={item}>{item}</li>)}</ul>{block.note && <p className="mt-1.5 rounded-md bg-wine/5 px-2 py-1 text-[10px] leading-snug text-wine">{block.note}</p>}</div>
      </li>)}
    </ol>
    <p className="mt-4 border-t border-wine/15 pt-3 text-[11px] text-ink/55"><b>Coverage:</b> second shooter recommended for simultaneous vow-writing, 4:00 PM majlis/venue coverage, and the photobooth during reception. Photobooth operator should be separate from the main event shooter.</p>
  </div>;
}

function ShotCard({ item }: { item: ShotItem }) {
  return <article className="break-inside-avoid rounded-xl border border-wine/15 bg-white/75 p-4 md:p-5">
    <div className="flex flex-wrap items-center gap-2 mb-2"><span className="label !text-[10px] text-wine">{item.time}</span>{item.priority && <span className="label !text-[9px] rounded-full bg-wine/10 px-2.5 py-1 text-wine">{item.priority}</span>}</div>
    <h3 className="font-serif text-xl text-ink">{item.heading}</h3><p className="mt-1.5 text-sm leading-relaxed text-ink/70">{item.detail}</p>
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
          <div className="rounded-xl bg-white p-3"><div className="label text-wine">COVERAGE NOTE</div><p className="mt-1 text-sm">A second shooter is strongly recommended for simultaneous bride/groom prep, ceremony coverage, and the 8–10 PM booth overlap.</p></div>
        </div>
      </div>
      <div className="space-y-7">
        {sections.map((section) => <section key={section.title} className="break-inside-avoid-page">
          <h2 className="font-serif text-2xl md:text-3xl text-wine">{section.title}</h2><p className="mb-3 mt-1 text-sm leading-relaxed text-ink/65">{section.note}</p>
          <div className="grid gap-3 md:grid-cols-2">{section.items.map((item) => <ShotCard key={`${section.title}-${item.heading}`} item={item} />)}</div>
        </section>)}
      </div>
      <footer className="mt-7 border-t border-wine/20 pt-4 text-xs leading-relaxed text-ink/60">
        <b>Before wedding day:</b> confirm the 12:30–1:00 PM call time, the second shooter, camera/lighting plan for the garden and rooms, audio capture for vows/prayers/speeches, livestream access and test, music-video slot before first dance, game/activity cue, rain backup for mirror portraits, and who is the family-photo wrangler. Ask for a mix of documentary moments, flattering movement-led portraits and a few classic family groupings.
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
  const [showDetailed, setShowDetailed] = useState(false);
  const print = () => {
    document.body.classList.add("printing-photo-guide");
    const cleanup = () => document.body.classList.remove("printing-photo-guide");
    window.addEventListener("afterprint", cleanup, { once: true });
    window.print();
  };
  if (!info) return <div className="p-8 text-sm text-ink/60">Wedding details are loading…</div>;
  return <>
    <PageHead kicker="The Binder · keepsakes & photo plan" title="Make the moments yours.">
      <Btn variant="ghost" onClick={() => setShowDetailed((shown) => !shown)}>{showDetailed ? "Show quick timeline" : "Open detailed guide"}</Btn>
      <Btn variant="dark" onClick={print}>Print / save this plan as PDF</Btn>
    </PageHead>
    <div className="no-print mb-5 max-w-3xl text-sm text-ink/60">The quick timeline is the day-of version: short time blocks, photo ideas and video scenes. The detailed brief is there when you want more context.</div>
    <div className="mb-6"><DownloadableKeepsakes info={info} /></div>
    {showDetailed ? <PhotoVideoGuide info={info} /> : <PhotoVideoTimeline info={info} />}
  </>;
}

export function SeatingTab() { return <SeatingPlanner />; }
