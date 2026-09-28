/* The stream. Needs content/pieces.js loaded first.

   What's on air is a pure function of the wall clock, so everyone hears the
   same moment. The pieces play end to end in an order reshuffled each time
   through, seeded by the pass number so every browser agrees. Nothing plays
   on demand and there's no play button: the stream is running when you
   arrive, and the only control is sound on / off.

   It always starts muted — Greg's call: people tune in if they want (and
   browsers won't start sound without a tap anyway). A tap on a sound button
   unmutes it, inside the tap, as Safari requires.

   The sound buttons: .track.live on the front, and on the tracklist and piece
   pages the row of whichever piece is on air (.track[data-slug]; the others
   show no button). Every row's line fills with the stream.

   Timers are setInterval, not requestAnimationFrame: browsers stop rAF in
   background tabs, and the stream gets left running in one. */
(function () {
    const n = PIECES.length;
    if (!n) return;
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

    // Seconds until a piece next comes on air, walking the clock forward.
    function untilNext(slug) {
        const t = Date.now() / 1000 - VAULT.epoch;
        let pass = Math.floor(t / total), at = pass * total - t;
        for (let k = 0; k < 3; k++, pass++) {
            for (const i of order(pass)) {
                if (at > 0 && PIECES[i].slug === slug) return at;
                at += PIECES[i].duration;
            }
        }
        return null;
    }
    const soon = s => s < 90 ? 'in a minute' : s < 5400 ? `in ${Math.round(s / 60)} min` : `in ${Math.round(s / 3600)} hr`;

    const clock = s => {
        s = Math.max(0, Math.floor(s));
        return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
    };

    // ---------- the one audio element

    const audio = new Audio();
    audio.preload = 'auto';
    audio.muted = true;
    let current = null;

    const tuneTo = (piece, off) => {
        if (current !== piece) {
            current = piece;
            audio.src = '/' + piece.file;
            if ('mediaSession' in navigator)
                navigator.mediaSession.metadata = new MediaMetadata({ title: piece.title, artist: piece.artist, album: 'Audiospatials Vault' });
        }
        // Before its metadata arrives, a seek can be dropped; do it once it has.
        if (audio.readyState >= 1) audio.currentTime = off;
        else audio.addEventListener('loadedmetadata', () => { audio.currentTime = onAir().off; }, { once: true });
    };

    const start = () => audio.play().catch(() => {});

    // Paused from outside (headphones, lock screen): the stream doesn't stop
    // for anyone, so that means sound off; tick() picks it back up, muted.
    audio.addEventListener('pause', () => { if (!audio.ended && !audio.muted) { audio.muted = true; render(); } });
    if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('pause', () => { audio.muted = true; render(); });
        navigator.mediaSession.setActionHandler('play', () => { audio.muted = false; start(); render(); });
    }

    const toggle = () => {
        audio.muted = !audio.muted;
        if (audio.paused) { const { piece, off } = onAir(); tuneTo(piece, off); audio.play().catch(() => {}); }
        render();
    };

    // ---------- the controls

    const ON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 9H6L11 4.5V19.5L6 15H2Z"/><path d="M14 8.2A5 5 0 0 1 14 15.8L15.1 17.2A6.8 6.8 0 0 0 15.1 6.8Z"/><path d="M16.6 5.1A9 9 0 0 1 16.6 18.9L17.8 20.3A10.8 10.8 0 0 0 17.8 3.7Z"/></svg>';
    const OFF = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 9H6L11 4.5V19.5L6 15H2Z"/><path d="M14.3 9.4 15.4 8.3 17.5 10.4 19.6 8.3 20.7 9.4 18.6 11.5 20.7 13.6 19.6 14.7 17.5 12.6 15.4 14.7 14.3 13.6 16.4 11.5Z"/></svg>';
    const live = document.querySelector('.track.live');
    const rows = [...document.querySelectorAll('.track[data-slug]')];
    const button = (btn, loud) => {
        if (btn.dataset.loud !== String(loud)) { btn.innerHTML = loud ? ON : OFF; btn.dataset.loud = loud; }
        btn.setAttribute('aria-label', loud ? 'Turn sound off' : 'Turn sound on');
        btn.setAttribute('aria-pressed', String(loud));
    };
    [live, ...rows].forEach(r => r && r.querySelector('.track-play').addEventListener('click', toggle));

    function render() {
        const { piece, off } = onAir();
        const loud = !audio.paused && !audio.muted;
        const at = `scaleX(${off / piece.duration})`;

        if (live) {
            const title = live.querySelector('.track-title');
            title.textContent = piece.title;
            title.href = '/' + piece.slug;
            live.querySelector('.track-sub').textContent = piece.artist + ' · ' + piece.status;
            live.querySelector('.track-time').textContent = clock(off) + ' / ' + clock(piece.duration);
            live.querySelector('.track-bar span').style.transform = at;
            live.dataset.state = loud ? 'playing' : 'idle';
            button(live.querySelector('.track-play'), loud);
        }
        rows.forEach(r => {
            const p = PIECES.find(x => x.slug === r.dataset.slug);
            const air = p === piece;
            r.classList.toggle('on-air', air);
            r.dataset.state = air && loud ? 'playing' : 'idle';
            r.querySelector('.track-play').tabIndex = air ? 0 : -1;
            button(r.querySelector('.track-play'), air && loud);
            r.querySelector('.track-time').textContent = air ? clock(off) + ' / ' + clock(p.duration) : clock(p.duration);
            r.querySelector('.track-bar span').style.transform = air ? at : 'scaleX(0)';
        });
        document.querySelectorAll('[data-onair]').forEach(el => { el.hidden = el.dataset.onair !== piece.slug; });
        document.querySelectorAll('[data-next]').forEach(el => {
            const air = el.dataset.next === piece.slug, wait = air ? 0 : untilNext(el.dataset.next);
            el.hidden = air || wait == null;
            if (!el.hidden) el.textContent = 'On air next ' + soon(wait);
        });
    }

    function tick() {
        const { piece, off } = onAir();
        if (current !== piece) { tuneTo(piece, off); start(); }
        else if (audio.readyState >= 1 && Math.abs(audio.currentTime - off) > 3) audio.currentTime = off;
        else if (audio.paused && !audio.ended) start();
        render();
    }

    tick();
    setInterval(tick, 500);
})();
