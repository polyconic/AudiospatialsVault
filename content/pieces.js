/* The vault's pieces: unreleased and in-progress work. The stream plays them
   around the clock, and each gets its own page at /<slug>.

   After editing, run `node tools/build.mjs` and commit its output.

   - slug      the page's address. Keep it once the page has been shared.
   - duration  seconds, and accurate: the stream's clock is built on it
               (ffprobe -v error -show_entries format=duration -of csv=p=0 file).
   - status    'sketch' | 'work in progress' | 'unreleased' | 'abandoned'
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
        title: 'DREAM STATE',
        artist: 'Gregor Egan & Hunter Bowersmith',
        status: 'sketch',
        file: 'audio/dream-state.m4a',
        duration: 203.52,
        note: '',
    },
    {
        slug: 'side-quest',
        title: 'SIDE QUEST',
        artist: 'WOLFMANWOOF',
        status: 'sketch',
        file: 'audio/side-quest.m4a',
        duration: 160.62,
        note: '',
    },
    {
        slug: 'loop-windows-xp',
        title: 'LOOP [WINDOWS XP]',
        artist: 'WOLFMANWOOF',
        status: 'unreleased',
        file: 'audio/loop-windows-xp.m4a',
        duration: 182.02,
        note: '',
    },
    {
        slug: 'odessey-1',
        title: 'ODESSEY 1',
        artist: 'WOLFMANWOOF',
        status: 'work in progress',
        file: 'audio/odessey-1.m4a',
        duration: 148.47,
        note: '',
    },
    {
        slug: 'prototype-v2',
        title: 'PROTOTYPE V2',
        artist: 'Gregor Egan',
        status: 'sketch',
        file: 'audio/prototype-v2.m4a',
        duration: 367.3,
        note: '',
    },
    {
        slug: 'sketch-01',
        title: 'SKETCH 01',
        artist: 'Gregor Egan',
        status: 'work in progress',
        file: 'audio/sketch-01.m4a',
        duration: 164.0,
        note: '',
    },
    {
        slug: 'sketch-03',
        title: 'SKETCH 03',
        artist: 'Gregor Egan',
        status: 'work in progress',
        file: 'audio/sketch-03.m4a',
        duration: 180.0,
        note: '',
    },
    {
        slug: 'in-the-garden',
        title: 'IN THE GARDEN',
        artist: 'Hunter Bowersmith',
        status: 'unreleased',
        file: 'audio/in-the-garden.m4a',
        duration: 202.47,
        note: '',
    },
    {
        slug: 'the-night-she-left-me',
        title: 'THE NIGHT SHE LEFT ME',
        artist: 'Hunter Bowersmith',
        status: 'unreleased',
        file: 'audio/the-night-she-left-me.m4a',
        duration: 151.53,
        note: '',
    },
    {
        slug: 'daywalk-1-1',
        title: 'DAYWALK 1.1',
        artist: 'Hunter Bowersmith',
        status: 'unreleased',
        file: 'audio/daywalk-1-1.m4a',
        duration: 176.66,
        note: '',
    },
    {
        slug: 'really',
        title: 'REALLY!',
        artist: 'Hunter Bowersmith',
        status: 'unreleased',
        file: 'audio/really.m4a',
        duration: 308.57,
        note: '',
    },
    {
        slug: 'soar',
        title: 'SOAR',
        artist: 'Hunter Bowersmith',
        status: 'unreleased',
        file: 'audio/soar.m4a',
        duration: 113.32,
        note: '',
    },
    {
        slug: 'set-me-free',
        title: 'SET ME FREE',
        artist: 'Hunter Bowersmith',
        status: 'unreleased',
        file: 'audio/set-me-free.m4a',
        duration: 157.03,
        note: '',
    },
    {
        slug: 'tide-swing',
        title: 'TIDE SWING',
        artist: 'Hunter Bowersmith',
        status: 'unreleased',
        file: 'audio/tide-swing.m4a',
        duration: 187.95,
        note: '',
    },
    {
        slug: 'cnry-groove-1-demo',
        title: 'CNRY - GROOVE 1 DEMO',
        artist: 'Canary',
        status: 'unreleased',
        file: 'audio/cnry-groove-1-demo.m4a',
        duration: 106.5,
        note: '',
    },
    {
        slug: 'dragonfly',
        title: 'DRAGONFLY',
        artist: 'Canary',
        status: 'unreleased',
        file: 'audio/dragonfly.m4a',
        duration: 361.84,
        note: '',
    },
    {
        slug: 'gentle',
        title: 'GENTLE',
        artist: 'Canary',
        status: 'unreleased',
        file: 'audio/gentle.m4a',
        duration: 300.63,
        note: '',
    },
    {
        slug: 'somos-igual',
        title: 'SOMOS IGUAL',
        artist: 'Canary',
        status: 'unreleased',
        file: 'audio/somos-igual.m4a',
        duration: 465.21,
        note: '',
    },
];
