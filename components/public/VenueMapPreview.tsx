"use client";

import { motion, useReducedMotion } from "framer-motion";

/** A local, lightweight illustration of the Damistan area; live routing stays on the directions link. */
function DamistanMap() {
  return (
    <svg aria-hidden="true" viewBox="0 0 900 600" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
      <defs>
        <pattern id="damistan-streets" width="92" height="78" patternUnits="userSpaceOnUse" patternTransform="rotate(-8)">
          <path d="M-15 9H108M-12 27H110M-12 49H110M-12 69H110M14-12V92M40-12V92M67-12V92M89-12V92" fill="none" stroke="#CAD5DF" strokeWidth="1.6" />
          <path d="M7 33Q42 29 75 37M27 3Q24 39 31 73M74 11Q68 45 78 78" fill="none" stroke="#E1E6E7" strokeWidth="3" />
        </pattern>
        <linearGradient id="damistan-sea" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#77D5E6" />
          <stop offset="1" stopColor="#8DE0EA" />
        </linearGradient>
      </defs>

      <rect width="900" height="600" fill="#F5F0E3" />
      <rect x="205" width="695" height="600" fill="url(#damistan-streets)" />

      {/* West coast and small inlets around Damistan Beach */}
      <path d="M0 0H239C249 34 218 51 234 79c17 28-25 47-8 77 18 31-22 53-3 83 17 26-18 49 5 78 20 26-24 53-2 84 20 29-17 57 11 86 20 28-12 51 20 83 17 17 28 25 33 30H0Z" fill="url(#damistan-sea)" />
      <path d="M239 0c10 34-21 51-5 79s-25 47-8 77-22 53-3 83-18 49 5 78-24 53-2 84-17 57 11 86-12 51 20 83" fill="none" stroke="#C4DDD9" strokeWidth="5" />
      <path d="M221 194c45-18 78-11 100 18m-84 111c43-22 78-15 106 15m-83 117c39-19 69-13 101 18" fill="none" stroke="#8ED9E3" strokeWidth="7" opacity=".8" />

      {/* Parks and open blocks */}
      <path d="M550 102q44-21 85 4l-12 43q-45 17-84-8zM676 397q45-28 84 2l-9 56q-44 15-79-10zM421 480q24-18 57-8l-2 33q-28 13-55-2z" fill="#D8EBD8" />
      <path d="M278 126c65-22 90-4 130 8m-141 265c44-17 89-13 133 10M330 535c62-23 121-15 177 11M445 77c25 25 34 48 28 75" fill="none" stroke="#E6DCC8" strokeWidth="8" />

      {/* A few broad local roads */}
      <path d="M219 249c114-28 198 20 298-2s196 6 383-22M239 432c103-25 172 15 272-4s219 19 389-11M365 0c-18 82 20 137 7 211s24 118 2 191 7 132-2 198M533 0c-7 72 28 128 11 198s16 144-1 213 20 117 8 189" fill="none" stroke="#BECBD4" strokeWidth="4" />
      <path d="M220 249c114-28 198 20 298-2s196 6 383-22M239 432c103-25 172 15 272-4s219 19 389-11" fill="none" stroke="#FAF7EF" strokeWidth="2" />

      {/* Main road 106 */}
      <path d="M676 600c-16-49-47-70-39-120 8-45-19-78-1-119 20-44-14-79 15-117 27-35 11-74 44-108 35-37 75-58 92-136" fill="none" stroke="#8199AE" strokeWidth="25" strokeLinecap="round" />
      <path d="M676 600c-16-49-47-70-39-120 8-45-19-78-1-119 20-44-14-79 15-117 27-35 11-74 44-108 35-37 75-58 92-136" fill="none" stroke="#F7F7F2" strokeWidth="17" strokeLinecap="round" />
      <path d="M676 600c-16-49-47-70-39-120 8-45-19-78-1-119 20-44-14-79 15-117 27-35 11-74 44-108 35-37 75-58 92-136" fill="none" stroke="#BECAD3" strokeWidth="1.5" strokeDasharray="7 13" strokeLinecap="round" />

      {/* Town labels */}
      <g fontFamily="Arial, sans-serif" fill="#37434B" paintOrder="stroke" stroke="#F8F4E9" strokeWidth="6" strokeLinejoin="round">
        <text x="650" y="87" fontSize="23" fontWeight="600">Hamad Town</text>
        <text x="657" y="113" fontSize="16" direction="rtl">مدينة حمد</text>
        <text x="708" y="368" fontSize="22" fontWeight="600">Al Lawzi</text>
        <text x="720" y="391" fontSize="15" direction="rtl">اللوزي</text>
        <text x="280" y="343" fontSize="19" fontWeight="600">Dumistan Beach</text>
        <text x="310" y="366" fontSize="15" direction="rtl">شاطئ دمستان</text>
        <text x="499" y="531" fontSize="21" fontWeight="600">Karzakan</text>
        <text x="515" y="554" fontSize="15" direction="rtl">كرزكان</text>
        <text x="772" y="230" fontSize="15" fontWeight="600" transform="rotate(-78 772 230)">Road 106</text>
      </g>

      {/* Road shields and a few bus-stop dots to give the preview a map-like scale. */}
      <g fontFamily="Arial, sans-serif" textAnchor="middle">
        <g transform="translate(682 216)"><rect x="-20" y="-13" width="40" height="26" rx="6" fill="#FFFDF8" stroke="#596975" strokeWidth="2"/><text y="6" fontSize="15" fontWeight="700" fill="#34414A">106</text></g>
        <g transform="translate(650 467)"><rect x="-20" y="-13" width="40" height="26" rx="6" fill="#FFFDF8" stroke="#596975" strokeWidth="2"/><text y="6" fontSize="15" fontWeight="700" fill="#34414A">106</text></g>
        {[[659, 288], [640, 393], [683, 520]].map(([x, y], i) => (
          <g key={i} transform={`translate(${x} ${y})`}>
            <circle r="13" fill="#FCFAF5" stroke="#60778A" strokeWidth="3" />
            <rect x="-6" y="-5" width="12" height="10" rx="2" fill="#60778A" />
            <path d="M-4-2h8M-4 1h8" stroke="#FCFAF5" strokeWidth="1.3" />
            <circle cx="-3.5" cy="6" r="1.4" fill="#60778A"/><circle cx="3.5" cy="6" r="1.4" fill="#60778A"/>
          </g>
        ))}
      </g>
    </svg>
  );
}

export default function VenueMapPreview() {
  const reduceMotion = useReducedMotion();

  return (
    <div role="img" aria-label="Illustrated map preview of The Heaven in Damistan, near Road 106 and Dumistan Beach" className="relative isolate aspect-[16/10] overflow-hidden rounded-[3px] border border-taupe/35 bg-[#F5F0E3] shadow-inner">
      <DamistanMap />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[#F4EBDD]/[.06]" />

      {/* A softly pulsing marker locates the venue area; the Directions button opens the live map. */}
      <div aria-hidden="true" className="pointer-events-none absolute left-[50%] top-[49%] z-[2] -translate-x-1/2 -translate-y-full">
        <span className="absolute left-1/2 top-[9px] -translate-x-1/2">
          <motion.span
            className="block h-8 w-8 rounded-full bg-wine/35 blur-[2px]"
            animate={reduceMotion ? undefined : { scale: [0.5, 1.8], opacity: [0.65, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
          />
        </span>
        <svg viewBox="0 0 40 50" className="relative h-11 w-9 drop-shadow-[0_3px_4px_rgba(61,31,38,.42)]">
          <path d="M20 48S4 29 4 18a16 16 0 1 1 32 0c0 11-16 30-16 30Z" fill="#6E1F2E" stroke="#FCFAF5" strokeWidth="2" />
          <circle cx="20" cy="18" r="6.5" fill="#FCFAF5" />
          <circle cx="20" cy="18" r="2.5" fill="#6E1F2E" />
        </svg>
        <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-full border border-wine/15 bg-[#FCFAF5]/95 px-2.5 py-1 font-sans text-[9px] font-semibold uppercase tracking-[.14em] text-wine shadow-sm">The Heaven</span>
      </div>
    </div>
  );
}
