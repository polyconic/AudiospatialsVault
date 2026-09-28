/* The vault's pieces: unreleased and in-progress work. The stream plays them
   around the clock, and each gets its own page at /<slug>.

   After editing, run `node tools/build.mjs` and commit its output.

   - slug      the page's address. Keep it once the page has been shared.
   - duration  seconds, and accurate: the stream's clock is built on it
               (ffprobe -v error -show_entries format=duration -of csv=p=0 file).
   - status    'work in progress' | 'unreleased' | 'abandoned'
   - note      a line or two from Gregor or Hunter: what it is, what's unsure,
               what changed. Optional. */

const VAULT = {
    // The stream's day count starts here. Never change it once live, or
    // everyone's position in the stream jumps.
    epoch: 1788220800, // 2026-09-01 00:00 UTC
    email: 'hello@audiospatials.com',
};

const PIECES = [
    {
        slug: 'medium',
        title: 'MEDIUM MASTER 01',
        artist: 'Gregor Egan',
        status: 'work in progress',
        file: 'audio/mediummaster01.m4a',
        duration: 340,
        note: '',
    },
    {
        slug: 'quarry-2001',
        title: 'QUARRY 2001 MASTER 1',
        artist: 'Gregor Egan',
        status: 'unreleased',
        file: 'audio/quarry2001master1.m4a',
        duration: 326,
        note: '',
    },
];
