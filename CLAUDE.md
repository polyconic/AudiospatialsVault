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
- Every visitor downloads whatever is on air, muted or not — that's the cost
  of it already playing.

## Shared with audiospatials.com

`css/base.css`, `css/pages.css`, `js/geo.js`, `js/nav.js`, `js/menu.js` and
`assets/` are copies from the audiospatials repo; change them there and copy
over. **One difference:** here `geo.js`'s `arrive` keeps each word's letters
together, so long titles wrap at spaces rather than between any two letters
("MASTE / R 1" on a piece page). Audiospatials doesn't have that yet.
Vault-only styles are in `css/vault.css`.

The front page's VAULT wordmark is `Geo.converge` like the main sites', set
larger (`12vw` against their `7vw`) because it's five letters, not thirteen.

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

**Unlisted, not private (Greg's choice, 2026-09-27).** Until launch every page
carries `noindex, nofollow` (the build's template too), `robots.txt`
disallows everything, and nothing on audiospatials.com links here. The repo is
public, so anyone can find the audio. **Launch** = drop the robots meta from
`index.html`, `tracklist.html`, `404.html` and the build's `head()`, delete
`robots.txt`, rebuild, and link the vault from the main site.
