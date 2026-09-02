# Audiopatials Vault — conventions

Read this before editing. Read `README.md` too; it explains what the site is.

## The two halves

The stream (`index.html`) and the vault (`vault.html`, `piece.html`) are
different kinds of page and should stay that way. The stream is fixed,
full-bleed and never scrolls; its styling is inline in `index.html`. The
vault pages are documents — they scroll, they have a measure, they are read
rather than watched; they share `vault.css`. Do not merge the two
stylesheets.

## Rules that are settled — don't relitigate

- **What is on air is a pure function of the wall clock.** Nothing about
  the broadcast is stored and nothing is random at runtime, so every
  listener gets the same thing at the same moment. Comments are the only
  stored state on the site.
- **The station keeps its own time zone** (`STATION.tzOffset`), not the
  viewer's. It preserves the shared-broadcast feeling.
- **Anything the sound or the picture depends on runs on `setInterval`,
  never `requestAnimationFrame`.** Browsers pause rAF in background tabs,
  and this is a station people leave running in one.
- **Generative audio must stay deterministic from the clock** — seeded PRNG
  plus wall-clock-derived events, never `Math.random()` or
  `ctx.currentTime`.
- **The mute gain sits downstream of the analyser** (mix → analyser →
  master → destination), so the visualiser keeps moving while muted.
  Muting upstream freezes the picture and makes the page look broken.
- **Threads have no voting.** Nesting and collapse only. On unfinished work
  a downvote reads as a verdict on the piece rather than on the reply.

## Slugs

Every piece in `station.js` has a `slug`, and it is the only link between a
piece and its thread. Renaming a slug orphans a conversation and there is no
migration for it. Titles can change freely; slugs cannot, once anyone has
commented.

## Security

`threads.js` is the one place on the site where a stranger's text reaches
the page. It never uses `innerHTML` for user content — handles and bodies go
in as text nodes, always. Keep it that way. If rich text is ever wanted,
that is a sanitiser and a decision, not a quick change.

Writes never touch the table directly. `anon` has no insert, update or
delete; everything goes through `post_comment` and `delete_comment` in
`supabase.sql`, which is where every rule about what counts as a valid
comment lives. Validation added only on the client can be routed around by
anyone with a console, so any new rule goes in the SQL function first.

Never put the Supabase `service_role` key in `config.js` or anywhere else in
this repo. `config.js` ships to every visitor.

## Local mode

With `config.js` empty the site keeps threads in `localStorage` and shows a
`local only` badge. The whole interface can be built and tested this way.
Local mode deliberately does not enforce the server's length and rate rules
— it is a layout harness, not a simulator.

## Comments in code

Minimal. Explain why something is the way it is when the reason is not
obvious from reading it — especially the ones that look wrong but are load-
bearing. Don't narrate what the next line does.

## Deploying

GitHub Pages from `main`, same as the other sites. **Pushing to `main`
publishes.** There is no staging. Confirm before pushing, and leave the push
to Gregor unless he asks otherwise.
