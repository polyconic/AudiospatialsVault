# Audiospatials Vault — working notes

Unreleased and unfinished work from Audiospatials, on a stream that plays
around the clock, with a tracklist and a page per piece. Lives at `vault.audiospatials.com`,
under the studio site (repo `polyconic/Audiospatials`,
`~/Documents/GitHub/audiospatials`). `README.md` is the public face; this is
the working document.

**Remade 2026-09-27** to look like audiospatials.com and visuospatials.com.
The first version (a fork of Delilah's Vault: scheduled blocks, generated
sound, visualisers, placeholder art and footage, and a Reddit-style comment
thread per piece on Supabase) is all in git history. **Comments were dropped
on purpose** — Greg's call: empty threads make unfinished work look unloved,
strangers critiquing artists' demos needs moderating, and a database is one
more thing to run. Feedback goes by email instead ("Tell us what you think" on
each piece page). Don't bring comments back without asking.

## Pieces

`content/pieces.js` is the whole interface: one entry per piece. To add one:
encode it to `audio/` (AAC in .m4a, as the two there), add an entry with an
**accurate `duration` in seconds** (the stream's clock is built on it —
`ffprobe -v error -show_entries format=duration -of csv=p=0 file`), then
`node tools/build.mjs` and commit what it writes. Masters stay out of git:
`tracks/` is ignored.

The build writes `<slug>.html` per piece (whole; removes pages of pieces no
longer listed) and the list in `tracklist.html` between its build markers.
`index.html` and the rest of `tracklist.html` are hand-written. The browser also
loads `content/pieces.js` directly, for the stream.

A slug is a page address: keep it once the page has been shared.

## The stream (`js/vault.js`)

- **What's on air is a pure function of the wall clock** and
  `VAULT.epoch`, so everyone hears the same moment. The pieces play end to
  end; the order reshuffles each pass through, seeded by the pass number so
  every browser agrees. Never change `epoch` once live.
- **No play button, nothing on demand** (Greg, 2026-09-27). The stream is
  already running when you arrive, **muted** — his call: people tune in if
  they want. The only control is sound on / off (the speaker in the circle).
  A piece can only be heard while it's on air.
- Where the button is: the front page's live row, and on the tracklist and
  piece pages the row of whichever piece is on air. Other rows show no
  button; an off-air piece page says when it's next on ("On air next in 36
  min"). No line can be seeked.
- Pausing from outside (headphones, lock screen) counts as sound off; the
  stream itself never stops.
- Unmuting happens inside the tap, as Safari requires. The stream re-syncs if
  it drifts more than 3s and moves to the next piece on the clock's word.
- Timers are `setInterval`, not `requestAnimationFrame`: browsers stop rAF in
  background tabs, and the stream gets left running in one.
- **Muted downloads nothing** (Greg agreed, 2026-09-27). Until someone tunes
  in, the audio element has no source at all; the line and clock run on the
  clock alone, so it still looks live. (`preload="metadata"` isn't enough —
  Chrome buffered 49s with it.) Tuning in sets the source and plays inside
  the tap, then seeks to the live moment once metadata arrives: about half a
  second to sound. Muting keeps it running silently for 60s (`GRACE`), so
  tuning back in is instant, then drops the source.

## The front page's video (2026-09-29)

Behind VAULT: `video/clouds.mp4` (1920 wide) and, for screens taller than
4:5, `video/clouds-tall.mp4` (1080×1920, cut from the 4K frame so phones get
full sharpness). About 13.5 MB each; a visitor loads only one. Muted, looping,
paused under reduced motion. Source: `~/Desktop/3P6A5630.MOV` (4K MJPEG,
3.9 GB, not committed). How they were made, for the next one:
- 60.5s of source, the last 4s cross-faded into the start so the loop has
  no seam (56.5s).
- Dusk footage full of sensor grain, which is what made the first encodes
  100 MB and 248 MB. `hqdn3d` (for the tall cut, once at full res before
  scaling and again after) plus `curves=all='0/0 0.08/0 1/1'` to sink the
  trees' blacks brought them to ~13 MB at the same sharpness; x264 slow,
  CRF 22 (wide) / 24 (tall), `+faststart`. The curve also deepens the sky.
- VAULT stays plain white over it (a difference blend turned it bronze
  over the blue). `.shade` darkens the bottom for the player.

## Shared with audiospatials.com

`css/base.css`, `css/pages.css`, `js/geo.js`, `js/nav.js`, `js/menu.js` and
`assets/` are copies from the audiospatials repo; change them there and copy
over. **One difference:** here `geo.js`'s `arrive` keeps each word's letters
together, so long titles wrap at spaces rather than between any two letters
("MASTE / R 1" on a piece page). Audiospatials doesn't have that yet.
Vault-only styles are in `css/vault.css`.

The front page's VAULT wordmark is drawn by `Geo.converge` like the main
sites', but **still and all white** (Greg, 2026-09-27): `{ still: true, dim:
ink }`. `opts.still` is a vault-only addition to `geo.js` that draws the word
once, assembled. It's set larger (`12vw` against their `7vw`) because it's
five letters, not thirteen.

- **Hover styles go inside `@media (hover: hover)`** (2026-09-27). On iOS a tap
  on anything with a :hover style is spent showing the hover, so the menu
  took two taps. Keep `:focus-visible` outside it, for keyboards.

## Preview

`python3 tools/serve.py` → localhost:8766 (launch config `vault`). Unlike the
studio site's copy it answers **range requests** — without them the browser
can't seek into audio, so the stream would always start from 0:00 locally.
GitHub Pages does ranges itself.

## Deploying

GitHub Pages from `main`, root. **Pushing to `main` publishes.** Greg pushes;
Claude commits locally and stops. No co-author trailer.

**Address: `vault.audiospatials.com`** (`CNAME`). DNS at Namecheap: one CNAME
record, `vault` → `polyconic.github.io.`. Add only that — **never touch the
domain's MX or TXT records**, they carry @audiospatials.com mail.

**Public and in search since 2026-09-29.** Linked from audiospatials.com
(menu, between Studio and About; Music's "Check the Vault"). Every page has a
canonical; the build writes `sitemap.xml`, which `robots.txt` points to. Only
`404.html` stays `noindex`. It was unlisted (noindex + robots.txt Disallow)
from 2026-09-27 until then.
