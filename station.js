/* ==================================================================
   THE STATION

   Everything the broadcast is, declared in one place.

   Same rule as before: what is on air is a pure function of the wall
   clock, identical for everyone, nothing random at runtime. What is
   new is that every piece now has a SLUG — a permanent name that never
   changes once anyone has commented on it. The slug is the only link
   between a piece and its thread, so renaming one orphans a
   conversation. Change titles freely. Never change a slug.
   ================================================================== */

const STATION = {
  name:  "AUDIOPATIALS VAULT",
  title: "Audiopatials Vault",

  tzOffset: 0,

  // Never change once live — the day counter is measured from here.
  epoch: 1788220800,            // 2026-09-01 00:00:00 UTC
};


/* ---------- the library -------------------------------------------
   Unreleased and in-progress audio. `duration` in SECONDS and it must
   be accurate — the broadcast clock is built on these numbers.

   `status` is shown on the piece page and sets the tone of the thread:
     "work in progress"  — feedback wanted, it is going to change
     "unreleased"        — finished, just never put out
     "abandoned"         — kept for the record, not coming back
   ------------------------------------------------------------------ */
const LIBRARY = {
  metaphysics: {
    slug:"metaphysics", title:"METAPHYSICS", artist:"Gregor Egan",
    status:"work in progress", file:"audio/metaphysics.m4a", duration:316.07,
    note:"Third pass. The break at 3:40 still does not land.",
  },
  ethereal: {
    slug:"ethereal", title:"ETHEREAL", artist:"Gregor Egan",
    status:"work in progress", file:"audio/ethereal.m4a", duration:134.12,
    note:"Too short. Wants another sixteen bars somewhere.",
  },
  noforest: {
    slug:"noforest", title:"NO FOREST", artist:"Gregor Egan",
    status:"unreleased", file:"audio/noforest.m4a", duration:314.05,
    note:"",
  },
  wavorian: {
    slug:"wavorian", title:"WAVORIAN", artist:"Gregor Egan",
    status:"work in progress", file:"audio/wavorian.m4a", duration:133.12,
    note:"Mix is bottom-heavy on speakers, fine on headphones.",
  },
  theevening: {
    slug:"theevening", title:"THE EVENING", artist:"Gregor Egan",
    status:"unreleased", file:"audio/theevening.m4a", duration:105.07,
    note:"",
  },
  interstellar: {
    slug:"interstellar", title:"INTERSTELLAR!", artist:"Gregor Egan",
    status:"abandoned", file:"audio/interstellar.m4a", duration:236.05,
    note:"Kept for the record. Went nowhere twice.",
  },
  byansel: {
    slug:"byansel", title:"BY ANSEL", artist:"Gregor Egan",
    status:"work in progress", file:"audio/byansel.m4a", duration:102.10,
    note:"Sketch. Barely an arrangement yet.",
  },
  futuresequoia: {
    slug:"futuresequoia", title:"FUTURE SEQUOIA", artist:"Gregor Egan",
    status:"unreleased", file:"audio/futuresequoia.m4a", duration:112.11,
    note:"",
  },
};


/* ---------- the exhibition -----------------------------------------
   In Delilah's Vault the picture was anonymous wallpaper. Here it is
   the other half of the collection: each piece is credited on screen
   while it holds, and clicking it opens its own thread.

   One piece holds the screen for HOLD seconds, then the next. The
   rotation is continuous and independent of the audio schedule — it
   carries on across block boundaries and reshuffles once it has been
   through the whole set, so the pairing of sound and image is never
   the same twice.
   ------------------------------------------------------------------ */
const ART = {
  plate01: {
    slug:"plate01", title:"PLATE 01 — INTERFERENCE", artist:"Gregor Egan",
    status:"work in progress", file:"art/plate01.svg",
    note:"Testing whether the moiré survives being printed.",
  },
  plate02: {
    slug:"plate02", title:"PLATE 02 — HORIZON STUDY", artist:"Gregor Egan",
    status:"work in progress", file:"art/plate02.svg",
    note:"One of eleven. The others are worse.",
  },
  plate03: {
    slug:"plate03", title:"PLATE 03 — CARRIER", artist:"Gregor Egan",
    status:"unreleased", file:"art/plate03.svg",
    note:"",
  },
  plate04: {
    slug:"plate04", title:"PLATE 04 — DECAY", artist:"Gregor Egan",
    status:"work in progress", file:"art/plate04.svg",
    note:"Wants to be much bigger than a screen.",
  },
};

const ART_HOLD = 180;                       // seconds one piece holds the screen
const ALL_ART  = Object.values(ART);

/* Moving footage, still supported and still uncredited on screen —
   this is texture behind the exhibition, not part of the collection. */
const FOOTAGE = {
  cro:     ["video/cro1.mp4"],
  torus:   ["video/torus1.mp4"],
  sound:   ["video/sound1.mp4"],
  cyberia: ["video/cyberia1.mp4"],
  pirate:  ["video/pirate1.mp4"],
};
const ALL_FOOTAGE = Object.values(FOOTAGE).flat();


/* ---------- everything with a thread --------------------------------
   One flat index of every piece in the vault, sound and image alike,
   keyed by slug. The piece page and the vault index both read from
   here, so a piece only ever has to be declared once above.
   ------------------------------------------------------------------ */
const PIECES = {};
for (const p of Object.values(LIBRARY)) PIECES[p.slug] = { ...p, kind: "audio" };
for (const p of Object.values(ART))     PIECES[p.slug] = { ...p, kind: "art"   };


/* ---------- the day -----------------------------------------------
   Blocks run from their `start` hour until the next block begins.
   Must be sorted, and the first must start at 0.
   ------------------------------------------------------------------ */
const SCHEDULE = [
  {
    start: 0,
    name:  "NIGHT SHIFT",
    note:  "unfinished work, for those still awake",
    mode:  "playlist",
    visual:"spectrum",
    items: [LIBRARY.metaphysics, LIBRARY.wavorian, LIBRARY.byansel],
  },
  {
    start: 7,
    name:  "CARRIER",
    note:  "the signal, unattended",
    mode:  "generative",
    preset:"carrier",
    visual:"testcard",
  },
  {
    start: 9,
    name:  "FIRST LIGHT",
    note:  "slow music for an empty hour",
    mode:  "generative",
    preset:"firstlight",
    visual:"horizon",
  },
  {
    start: 11,
    name:  "DAY SERVICE",
    note:  "",
    mode:  "playlist",
    visual:"drift",
    items: [LIBRARY.ethereal, LIBRARY.noforest, LIBRARY.futuresequoia],
  },
  {
    start: 17,
    name:  "THE LONG EVENING",
    note:  "",
    mode:  "playlist",
    visual:"horizon",
    items: [LIBRARY.theevening, LIBRARY.interstellar],
  },
  {
    start: 21,
    name:  "LATE TRANSMISSION",
    note:  "louder as it gets later",
    mode:  "playlist",
    visual:"spectrum",
    items: [LIBRARY.metaphysics, LIBRARY.interstellar, LIBRARY.wavorian],
  },
];
