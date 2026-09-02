/* ==================================================================
   THE CLOCK

   Pure functions, no DOM. Given a moment in time they say what is on
   air, and they say the same thing in every browser that asks.

   This was inline in app.js on the old site. It lives on its own here
   because the piece pages need the same answer — a piece page has to
   know whether the thing you are reading about happens to be playing
   right now, and it must not disagree with the stream about it.
   ================================================================== */

const Clock = (() => {

  const stationSeconds = () => Date.now() / 1000 + STATION.tzOffset * 3600;

  function now() {
    const s   = stationSeconds();
    const day = Math.floor(s / 86400);
    return { s, day, sod: s - day * 86400 };
  }

  function onAir() {
    const { s, day, sod } = now();
    let idx = 0;
    for (let i = 0; i < SCHEDULE.length; i++) {
      if (sod >= SCHEDULE[i].start * 3600) idx = i;
    }
    const startS = SCHEDULE[idx].start * 3600;
    const endS   = (idx + 1 < SCHEDULE.length) ? SCHEDULE[idx + 1].start * 3600 : 86400;
    return {
      block: SCHEDULE[idx], idx, day, sod, s,
      elapsed: sod - startS,
      remain:  endS - sod,
      length:  endS - startS,
    };
  }

  // Where a block's playlist is, given how long the block has been
  // running. The day number shifts the running order, so the same hour
  // doesn't play the same thing every day.
  function playlistPos(block, elapsed, day) {
    const items = block.items;
    const total = items.reduce((a, t) => a + t.duration, 0);
    const shift = (day * 7919) % total;
    let off = ((elapsed + shift) % total + total) % total;
    for (let i = 0; i < items.length; i++) {
      if (off < items[i].duration) return { i, off, total };
      off -= items[i].duration;
    }
    return { i: 0, off: 0, total };
  }

  /* A shuffle that is the same everywhere, because the seed is the
     cycle number rather than the machine. Used by both rotations. */
  function seededOrder(n, seed) {
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

  /* Which artwork is holding the screen. Same shape of rotation as the
     audio, on its own hold length, so sound and image drift against
     each other instead of marching in step. */
  function artOnAir(at) {
    const n = ALL_ART.length;
    if (!n) return null;
    const t     = at != null ? at : stationSeconds();
    const slot  = Math.floor(t / ART_HOLD);
    const cycle = Math.floor(slot / n);
    const pos   = ((slot % n) + n) % n;
    const order = seededOrder(n, cycle);
    return ALL_ART[order[pos]];
  }

  /* The piece currently playing, or null during a generative block —
     those are synthesized on the spot and are not pieces, so they have
     nothing to discuss. */
  function audioOnAir() {
    const s = onAir();
    if (s.block.mode !== 'playlist') return null;
    const p = playlistPos(s.block, s.elapsed, s.day);
    return s.block.items[p.i] || null;
  }

  return { stationSeconds, now, onAir, playlistPos, seededOrder, artOnAir, audioOnAir };
})();
