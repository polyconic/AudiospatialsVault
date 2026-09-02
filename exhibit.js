/* ==================================================================
   THE EXHIBITION

   The half of the stream that Delilah's Vault did not have. There, the
   picture was anonymous texture. Here it is the other half of the
   collection, so whatever is on screen is credited and links straight
   into its own thread.

   Runs on a timer rather than requestAnimationFrame, for the same
   reason everything else here does: browsers pause rAF in background
   tabs, and this is a station people leave running in one. A plate
   that stopped rotating because the tab was hidden would come back
   hours stale and disagree with every other listener.
   ================================================================== */

(() => {
  const $ = s => document.querySelector(s);

  const layers = [$('#artA'), $('#artB')];
  const cred   = $('#artCred');
  const link   = $('#artLink');
  const aTitle = $('#artTitle');
  const aBy    = $('#artBy');
  const discuss = $('#discussLink');

  if (!layers[0] || !layers[1]) return;

  let front = 0;
  let showing = null;
  const dead = new Set();          // plates that 404'd or wouldn't decode

  function showArt() {
    const piece = Clock.artOnAir();

    if (!piece || dead.has(piece.slug)) {
      // one missing file must not blank the screen — drop it and let the
      // next slot bring the next plate in
      if (piece) dead.add(piece.slug);
      return;
    }
    if (showing && showing.slug === piece.slug) return;

    const next = layers[front ^ 1];
    const prev = layers[front];

    next.onerror = () => {
      dead.add(piece.slug);
      showing = null;
    };
    next.onload = () => {
      next.classList.add('on');
      prev.classList.remove('on');
      front ^= 1;

      aTitle.textContent = piece.title;
      aBy.textContent    = piece.artist;
      link.href = 'piece.html?p=' + encodeURIComponent(piece.slug);
      cred.classList.add('on');
    };

    showing  = piece;
    next.src = piece.file;
  }

  /* The way into the thread for the sound. Generative blocks have no
     piece behind them, so the link goes away rather than pointing at
     something that does not exist. */
  function showDiscuss() {
    const piece = Clock.audioOnAir();
    if (!piece) {
      discuss.hidden = true;
      return;
    }
    discuss.hidden = false;
    discuss.href = 'piece.html?p=' + encodeURIComponent(piece.slug);
  }

  function tick() {
    showArt();
    showDiscuss();
  }

  tick();
  setInterval(tick, 1000);
})();
