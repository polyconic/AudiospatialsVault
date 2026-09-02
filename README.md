# Audiospatials Vault

Unreleased and in-progress work, on a stream, with an argument under each piece.

Two halves that need each other:

- **The stream** (`index.html`) — the same clock-driven broadcast as
  Delilah's Vault. You arrive and something is already playing, the same
  thing for everyone at that moment. This is the discovery half.
- **The vault** (`vault.html`, `piece.html`) — every piece has a permanent
  address and a thread that keeps growing. This is the discourse half.

The stream is how you find something. The vault is where you say what you
think of it. A piece that only existed for the four minutes it was on air
would never accumulate a conversation, which is the whole reason this site
is not just Delilah's Vault with a comment box on it.

## Threads

Nested replies, collapsible, no voting. There is no score on a comment,
because on work that is not finished a downvote reads as a verdict on the
piece rather than on the reply.

There are no accounts either. You pick a name and post. Each browser mints
a random token the first time it is used and keeps it in `localStorage`;
only the SHA-256 of that token is ever stored, which is enough to prove a
comment is yours when you delete it and useless to anyone reading the
table. Clearing your site data really does lose you the ability to delete
what you wrote — there is deliberately no recovery, because any recovery
path is an account.

Deletes are soft. The row survives so its replies keep their place in the
tree, exactly like a `[deleted]` comment on Reddit.

## Setting up the database

The site runs with no database at all — threads go to `localStorage` and a
`local only` badge appears next to the comment count. That is enough to work
on the layout. To make threads real:

1. Create a project at [supabase.com](https://supabase.com) (free tier is
   plenty).
2. Dashboard → SQL Editor → New query → paste all of
   [`supabase.sql`](supabase.sql) → Run.
3. Dashboard → Project Settings → API. Copy the **Project URL** and the
   **`anon` `public`** key into [`config.js`](config.js).

Never put the `service_role` key in `config.js`. It is a master key and
`config.js` is readable by anyone who views source. The `anon` key is meant
to be public: the table refuses writes from it entirely, and everything a
visitor can do goes through two validated functions that enforce length
limits, reply depth and rate limiting server-side.

Rate limits are 3 comments a minute and 40 an hour, per browser rather than
per name — changing your displayed name does not get you a fresh allowance.
To change them, edit `post_comment` in `supabase.sql` and re-run it.

### Moderating

There is no admin screen. To remove something, use the Supabase table
editor, or run SQL:

```sql
update comments set deleted_at = now(), body = '', handle = ''
 where id = 123;
```

## Running it locally

```bash
python3 serve.py
```

Then open <http://localhost:4747>.

Don't open `index.html` directly — Python's plain built-in server breaks
audio seeking, and this script fixes that so local testing behaves like the
real site.

## Adding a piece

Everything you'd normally touch lives in [`station.js`](station.js).

- `LIBRARY` — one entry per piece of audio (title, artist, status, file,
  exact length in seconds)
- `ART` — one entry per artwork
- `SCHEDULE` — the day's blocks and what each one plays
- `FOOTAGE` — moving texture behind the exhibition, uncredited on screen

Every piece needs a `slug`. **The slug is the only link between a piece and
its thread, so renaming one orphans a conversation.** Change titles freely.
Never change a slug once anyone has commented.

`status` is one of `work in progress`, `unreleased` or `abandoned`. It shows
on the piece page and sets the tone of the thread.

To add a track: drop the file in `audio/`, add an entry to `LIBRARY`, then
list it in a block's `items` in `SCHEDULE`. To add an artwork: drop it in
`art/` and add an entry to `ART` — it joins the on-screen rotation and gets
a vault page automatically.

## Deploying

Static, so no build step and no environment variables. `config.js` ships as
part of the site. Point any static host at the repo.

## Files

| | |
|---|---|
| `index.html` | the stream — layout and all its styling |
| `vault.html` | the index of everything with a thread |
| `piece.html` | one piece and its thread |
| `station.js` | the file you actually edit |
| `config.js` | the two Supabase values, or empty for local mode |
| `supabase.sql` | the schema — run once, safe to re-run |
| `clock.js` | what is on air, as pure functions of the time |
| `db.js` | storage, either Supabase or localStorage |
| `threads.js` | building and drawing the thread |
| `vault.css` | styling for the two document pages |
| `app.js` | the stream's clock logic, audio and display |
| `exhibit.js` | the on-screen artwork rotation and its credit |
| `synth.js` | the generated-live blocks |
| `visuals.js` | the background visual effects |
| `serve.py` | local preview only — not used in production |

## Credits

Sound and image are Gregor's own work unless a piece says otherwise.
Background texture is short muted clips from archive.org:

| source | licence |
|---|---|
| The many faces of a Torus | CC BY 3.0 |
| The PIRATE UTOPIA Experiments — Vivid Tribe Of Psychics | CC BY-NC-SA 3.0 |
| Introduction to the Cathode Ray Oscilloscope | not stated |
| Learning About Sound (2nd Ed) | courtesy Encyclopedia Britannica |
| Welcome To Cyberia | not stated |
