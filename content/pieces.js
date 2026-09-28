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
        slug: 'dream-state',
        title: 'dream state',
        artist: 'Gregor Egan',
        status: 'unreleased',
        file: 'audio/dream-state.m4a',
        duration: 203.52,
        note: '',
    },
    {
        slug: 'side-quest',
        title: 'side quest',
        artist: 'Gregor Egan',
        status: 'unreleased',
        file: 'audio/side-quest.m4a',
        duration: 160.62,
        note: '',
    },
    {
        slug: 'loop-windows-xp',
        title: 'LOOP [WINDOWS XP]',
        artist: 'Gregor Egan',
        status: 'unreleased',
        file: 'audio/loop-windows-xp.m4a',
        duration: 236.15,
        note: '',
    },
    {
        slug: 'odessey-1',
        title: 'odessey 1',
        artist: 'Gregor Egan',
        status: 'work in progress',
        file: 'audio/odessey-1.m4a',
        duration: 148.47,
        note: '',
    },
    {
        slug: 'gyro-prototype-v1',
        title: 'gyro prototype v1',
        artist: 'Gregor Egan',
        status: 'work in progress',
        file: 'audio/gyro-prototype-v1.m4a',
        duration: 355.26,
        note: '',
    },
    {
        slug: 'gyro-prototype-brand-new',
        title: 'gyro prototype brand new',
        artist: 'Gregor Egan',
        status: 'work in progress',
        file: 'audio/gyro-prototype-brand-new.m4a',
        duration: 367.3,
        note: '',
    },
    {
        slug: 'sketch-01',
        title: 'sketch 01',
        artist: 'Gregor Egan',
        status: 'work in progress',
        file: 'audio/sketch-01.m4a',
        duration: 164.0,
        note: '',
    },
    {
        slug: 'sketch-03',
        title: 'sketch 03',
        artist: 'Gregor Egan',
        status: 'work in progress',
        file: 'audio/sketch-03.m4a',
        duration: 180.0,
        note: '',
    },
];
