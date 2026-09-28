/* The stream and the players. Needs content/pieces.js loaded first.

   The stream: what's on air is a pure function of the wall clock, so everyone
   hears the same moment. The pieces play end to end in an order reshuffled
   each time through, seeded by the pass number so every browser agrees.
   Pausing and playing again rejoins the stream live, like a radio.

   Rows (.track[data-file]) play one piece on demand, from the start, and seek
   when their line is clicked. One thing plays at a time across the page.

   Timers are setInterval, not requestAnimationFrame: browsers stop rAF in
   background tabs, and the stream gets left running in one. */
(function () {
    const n = PIECES.length;
    const total = PIECES.reduce((a, p) => a + p.duration, 0);

    function order(seed) {
        const a = [...Array(n).keys()];
        let s = seed;
        const rnd = () => {
            s |= 0; s = s + 0x6D2B79F5 | 0;
            let t = Math.imul(s ^ s >>> 15, 1 | s);
            t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
        for (let i = n - 1; i > 0; i--) {
            const j = Math.floor(rnd() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    // The piece on air and how far into it the stream is, in seconds.
    function onAir() {
        const t = Date.now() / 1000 - VAULT.epoch;
        let off = ((t % total) + total) % total;
        for (const i of order(Math.floor(t / total))) {
            if (off < PIECES[i].duration) return { piece: PIECES[i], off };
            off -= PIECES[i].duration;
        }
        return { piece: PIECES[0], off: 0 };
    }

    const clock = s => {
        s = Math.max(0, Math.floor(s));
        return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
    };
    const src = p => '/' + p.file;

    const players = [];
    const silenceOthers = me => players.forEach(p => p !== me && p.stop());

    // Marks whichever piece is on air, wherever it's listed.
    function markOnAir() {
        const slug = onAir().piece.slug;
        document.querySelectorAll('[data-onair]').forEach(el => { el.hidden = el.dataset.onair !== slug; });
    }
    if (n) { markOnAir(); setInterval(markOnAir, 1000); }

    // ---------- the stream

    const live = document.querySelector('.track.live');
    if (live && n) {
        const btn = live.querySelector('.track-play');
        const title = live.querySelector('.track-title');
        const sub = live.querySelector('.track-sub');
        const time = live.querySelector('.track-time');
        const fill = live.querySelector('.track-bar span');
        const audio = new Audio();
        audio.preload = 'metadata';
        let current = null, on = false;

        const tuneTo = (piece, off) => {
            if (current !== piece) {
                current = piece;
                audio.src = src(piece);
                if ('mediaSession' in navigator)
                    navigator.mediaSession.metadata = new MediaMetadata({ title: piece.title, artist: piece.artist, album: 'Audiospatials Vault' });
            }
            // Before its metadata arrives, a seek can be dropped; do it once it has.
            if (audio.readyState >= 1) audio.currentTime = off;
            else audio.addEventListener('loadedmetadata', () => { audio.currentTime = onAir().off; }, { once: true });
        };

        const show = () => {
            const { piece, off } = onAir();
            title.textContent = piece.title;
            title.href = '/' + piece.slug;
            sub.textContent = piece.artist + ' · ' + piece.status;
            time.textContent = clock(off) + ' / ' + clock(piece.duration);
            fill.style.transform = `scaleX(${off / piece.duration})`;
            if (!on) { if (current !== piece) tuneTo(piece, off); return; }
            if (current !== piece) { tuneTo(piece, off); audio.play().catch(() => {}); }
            else if (audio.readyState >= 1 && Math.abs(audio.currentTime - off) > 3) audio.currentTime = off;
        };

        const state = s => {
            live.dataset.state = s;
            btn.setAttribute('aria-label', s === 'playing' ? 'Stop the stream' : 'Play the stream');
        };
        const player = {
            stop() { if (!on) return; on = false; audio.pause(); state('idle'); },
        };
        players.push(player);

        // Play inside the tap itself: Safari refuses sound started any later.
        btn.addEventListener('click', () => {
            if (on) return player.stop();
            silenceOthers(player);
            on = true;
            const { piece, off } = onAir();
            tuneTo(piece, off);
            state('playing');
            audio.play().catch(() => player.stop());
        });
        // Paused from outside the page (headphones, lock screen): show it. The
        // paused check skips the late event from our own stop and replay.
        audio.addEventListener('pause', () => { if (on && audio.paused && !audio.ended) player.stop(); });

        state('idle');
        show();
        setInterval(show, 500);
    }

    // ---------- pieces on demand

    document.querySelectorAll('.track[data-file]').forEach(row => {
        const btn = row.querySelector('.track-play');
        const time = row.querySelector('.track-time');
        const fill = row.querySelector('.track-bar span');
        const bar = row.querySelector('.track-bar');
        const name = row.querySelector('.track-title').textContent;
        const dur = +row.dataset.duration;
        let audio = null;

        const state = s => {
            row.dataset.state = s;
            btn.setAttribute('aria-label', (s === 'playing' ? 'Pause ' : 'Play ') + name);
        };
        const show = () => {
            const at = audio ? audio.currentTime : 0;
            time.textContent = clock(at) + ' / ' + clock(dur);
            fill.style.transform = `scaleX(${Math.min(1, at / dur)})`;
        };
        const load = () => {
            if (audio) return audio;
            audio = new Audio(row.dataset.file);
            audio.addEventListener('play', () => state('playing'));
            audio.addEventListener('pause', () => state('paused'));
            audio.addEventListener('ended', () => { audio.currentTime = 0; state('idle'); show(); });
            audio.addEventListener('timeupdate', show);
            return audio;
        };
        const player = { stop() { if (audio && !audio.paused) audio.pause(); } };
        players.push(player);

        btn.addEventListener('click', () => {
            const a = load();
            if (!a.paused) return a.pause();
            silenceOthers(player);
            a.play().catch(() => state('idle'));
        });
        bar.addEventListener('click', e => {
            const a = load();
            const r = bar.getBoundingClientRect();
            a.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * dur;
            show();
            if (a.paused) { silenceOthers(player); a.play().catch(() => state('idle')); }
        });

        state('idle');
        show();
    });
})();
