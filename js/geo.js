/* The geometric alphabet. Every letter is a few flat primitives — bars,
   triangles, half discs, ring slices — in a box one unit tall, so the
   wordmark, the headings and the 404 are all drawn from the same parts.
   Each piece is an SVG path string in those units; holes are extra subpaths
   filled even-odd. The front page and the 404 draw them on a canvas through
   Path2D, the headings as inline SVG. */
(function () {
    const T = 0.2;
    const PI = Math.PI;
    const n = v => +v.toFixed(4);
    const pt = (x, y) => n(x) + ' ' + n(y);

    const rect = (x, y, w, h) => `M${pt(x, y)}H${n(x + w)}V${n(y + h)}H${n(x)}Z`;
    const poly = (...p) => 'M' + p.reduce((s, v, i) => s + (i % 2 ? ' ' + n(v) : (i ? 'L' : '') + n(v)), '') + 'Z';
    const arcTo = (r, a0, a1, cw, cx, cy) =>
        `A${n(r)} ${n(r)} 0 ${Math.abs(a1 - a0) > PI ? 1 : 0} ${cw ? 1 : 0} ${pt(cx + r * Math.cos(a1), cy + r * Math.sin(a1))}`;
    // A filled slice of a disc, a0 to a1 clockwise (screen angles, y down).
    const half = (cx, cy, r, a0, a1) =>
        `M${pt(cx, cy)}L${pt(cx + r * Math.cos(a0), cy + r * Math.sin(a0))}${arcTo(r, a0, a1, true, cx, cy)}Z`;
    // A slice of an annulus; a full turn becomes two circles with the inner one cut.
    const ring = (cx, cy, R, r, a0, a1) => {
        if (a1 - a0 >= 2 * PI - 1e-6) {
            const circle = rad => `M${pt(cx + rad, cy)}A${n(rad)} ${n(rad)} 0 1 1 ${pt(cx - rad, cy)}A${n(rad)} ${n(rad)} 0 1 1 ${pt(cx + rad, cy)}Z`;
            return circle(R) + circle(r);
        }
        return `M${pt(cx + R * Math.cos(a0), cy + R * Math.sin(a0))}${arcTo(R, a0, a1, true, cx, cy)}` +
               `L${pt(cx + r * Math.cos(a1), cy + r * Math.sin(a1))}${arcTo(r, a1, a0, false, cx, cy)}Z`;
    };
    // Mirror a path string top to bottom inside the unit box.
    const flip = d => d.replace(/([MLHVAZ])([^MLHVAZ]*)/g, (m, c, args) => {
        const v = args.trim() ? args.trim().split(/\s+/).map(Number) : [];
        if (c === 'V') return 'V' + n(1 - v[0]);
        if (c === 'M' || c === 'L') return c + pt(v[0], 1 - v[1]);
        if (c === 'A') return `A${n(v[0])} ${n(v[1])} ${v[2]} ${v[3]} ${1 - v[4]} ${pt(v[5], 1 - v[6])}`;
        return m;
    });

    // Heavy strokes: a short, narrow notch. Drawn as one outline, not a cut-out
    // hole, so the seam stroke can't trace a line across the notch's mouth.
    const vee = [poly(0, 0, 0.3, 0, 0.43, 0.32, 0.56, 0, 0.86, 0, 0.43, 1)];
    const oh = [ring(0.45, 0.5, 0.45, 0.25, 0, 2 * PI)];

    // w is the advance; parts are the pieces that move independently.
    const G = {
        A: { w: 0.86, parts: vee.map(flip) },
        B: { w: 0.47, parts: [rect(0, 0, T, 1), half(T, 0.25, 0.25, -PI / 2, PI / 2), half(T, 0.75, 0.25, -PI / 2, PI / 2)] },
        C: { w: 0.8, parts: [ring(0.45, 0.5, 0.45, 0.25, PI / 4, 7 * PI / 4)] },
        // The bowl is centred on the bar's right edge, so it leaves the bar
        // flush at the top and bottom. Centred inside the bar, the bar's corners
        // stuck out past the curve.
        D: { w: 0.7, parts: [rect(0, 0, T, 1), ring(T, 0.5, 0.5, 0.3, -PI / 2, PI / 2)] },
        E: { w: 0.56, parts: [rect(0, 0, T, 1), rect(T, 0, 0.36, T), rect(T, 0.4, 0.26, T), rect(T, 0.8, 0.36, T)] },
        F: { w: 0.56, parts: [rect(0, 0, T, 1), rect(T, 0, 0.36, T), rect(T, 0.4, 0.26, T)] },
        G: { w: 0.9, parts: [ring(0.45, 0.5, 0.45, 0.25, 0, 7 * PI / 4), rect(0.5, 0.4, 0.4, T)] },
        H: { w: 0.7, parts: [rect(0, 0, T, 1), rect(0.5, 0, T, 1), rect(T, 0.4, 0.3, T)] },
        I: { w: T, parts: [rect(0, 0, T, 1)] },
        J: { w: 0.6, parts: [rect(0.4, 0, T, 0.7), ring(0.3, 0.7, 0.3, 0.1, 0, PI)] },
        K: { w: 0.7, parts: [rect(0, 0, T, 1), poly(T, 0.5, 0.7, 0, 0.7, 0.26, 0.46, 0.5, 0.7, 0.74, 0.7, 1)] },
        L: { w: 0.56, parts: [rect(0, 0, T, 1), rect(T, 1 - T, 0.36, T)] },
        M: { w: 0.9, parts: [rect(0, 0, T, 1), rect(0.7, 0, T, 1), poly(T, 0, 0.7, 0, 0.45, 0.55)] },
        N: { w: 0.8, parts: [rect(0, 0, T, 1), rect(0.6, 0, T, 1), poly(T, 0, 0.4, 0, 0.6, 1, 0.4, 1)] },
        O: { w: 0.9, parts: oh },
        P: { w: 0.49, parts: [rect(0, 0, T, 1), half(T, 0.29, 0.29, -PI / 2, PI / 2)] },
        Q: { w: 0.95, parts: [...oh, poly(0.6, 0.72, 0.74, 0.6, 0.95, 0.94, 0.8, 1)] },
        R: { w: 0.62, parts: [rect(0, 0, T, 1), half(T, 0.29, 0.29, -PI / 2, PI / 2), poly(0.22, 0.52, 0.42, 0.52, 0.62, 1, 0.42, 1)] },
        // When an S's bar lands in a different tone from the half disc it meets,
        // even the seam stroke reads as an overlap, so that bar swaps to its
        // `clear` shape, stopping a hair short. Same tones keep touching.
        S: { w: 0.56, parts: [half(0.28, 0.25, 0.25, PI / 2, 3 * PI / 2), rect(0.28, 0, 0.28, T), half(0.28, 0.75, 0.25, -PI / 2, PI / 2), rect(0, 0.8, 0.28, T)],
             clear: { 1: [0, rect(0.286, 0, 0.274, T)], 3: [2, rect(0, 0.8, 0.274, T)] } },
        T: { w: 0.72, parts: [rect(0, 0, 0.72, T), rect(0.26, T, T, 1 - T)] },
        U: { w: 0.68, parts: [rect(0, 0, T, 0.66), rect(0.48, 0, T, 0.66), ring(0.34, 0.66, 0.34, 0.14, 0, PI)] },
        V: { w: 0.86, parts: vee },
        W: { w: 1.3, parts: [vee[0], shift(vee[0], 0.44)] },
        X: { w: 0.7, parts: [poly(0, 0, 0.7, 0, 0.35, 0.5), poly(0, 1, 0.35, 0.5, 0.7, 1)] },
        Y: { w: 0.7, parts: [poly(0, 0, 0.2, 0, 0.35, 0.3, 0.5, 0, 0.7, 0, 0.35, 0.56), rect(0.25, 0.5, T, 0.5)] },
        Z: { w: 0.7, parts: [rect(0, 0, 0.7, T), poly(0.46, T, 0.7, T, 0.24, 0.8, 0, 0.8), rect(0, 0.8, 0.7, T)] },
        0: { w: 0.9, parts: oh },
        4: { w: 0.8, parts: [poly(0, 0.72, 0.45, 0, 0.45, 0.72), rect(0.45, 0, T, 1), rect(0, 0.62, 0.8, T)] },
        '.': { w: T, parts: [rect(0, 1 - T, T, T)] },
        '/': { w: 0.55, parts: [poly(0.35, 0, 0.55, 0, 0.2, 1, 0, 1)] },
        '↗': { w: 0.5, parts: [poly(0, 0, 0.5, 0, 0.5, 0.5)] },
        ' ': { w: 0.3, parts: [] },
    };

    // Shift every x in a path string; used for the second V of the W.
    function shift(d, dx) {
        return d.replace(/([MLHA])([^MLHVAZ]*)/g, (m, c, args) => {
            const v = args.trim().split(/\s+/).map(Number);
            if (c === 'H') return 'H' + n(v[0] + dx);
            if (c === 'A') return `A${n(v[0])} ${n(v[1])} ${v[2]} ${v[3]} ${v[4]} ${pt(v[5] + dx, v[6])}`;
            return c + pt(v[0] + dx, v[1]);
        });
    }

    const GAP = 0.16;
    // Pieces that butt up against each other leave an anti-aliased seam; a
    // hairline stroke in the same colour closes it. It is a fixed fraction of a
    // screen pixel, not a fraction of the letter, or at large sizes it grows
    // wide enough to spill visibly over a neighbouring piece of another tone.
    const SEAM = 0.7;

    // Lay a string out: one entry per piece, with its x offset in units.
    function layout(text) {
        const out = [];
        let x = 0;
        [...text.toUpperCase()].forEach((ch, i, all) => {
            const g = G[ch] || G[' '];
            g.parts.forEach((d, part) => out.push({ d, x, ch, index: i, part }));
            x += g.w + (i < all.length - 1 ? GAP : 0);
        });
        return { pieces: out, width: x };
    }

    const MOVING = !matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* Replace an element's text with the drawn word. Colours are read off each
       character's own element first, so an <em> or a .slash keeps its colour.
       Everything else takes currentColor. The real text stays for readers and
       search, visually hidden. With
       assemble, the pieces slide in from the right once and settle. */
    function heading(el, opts) {
        opts = opts || {};
        const chars = [];
        (function walk(node) {
            node.childNodes.forEach(c => {
                if (c.nodeType === 3) [...c.textContent].forEach(ch => chars.push({ ch, color: getComputedStyle(node).color }));
                else if (c.nodeType === 1) walk(c);
            });
        })(el);
        // Collapse runs of whitespace the way the page would, keeping colours aligned.
        const kept = chars.reduce((a, c) => {
            const space = /\s/.test(c.ch);
            if (space && (!a.length || a[a.length - 1].ch === ' ')) return a;
            a.push(space ? { ch: ' ', color: c.color } : c);
            return a;
        }, []);
        while (kept.length && kept[kept.length - 1].ch === ' ') kept.pop();
        const { pieces, width } = layout(kept.map(c => c.ch).join(''));
        const own = getComputedStyle(el).color;

        const NS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(NS, 'svg');
        svg.setAttribute('viewBox', `0 0 ${n(width)} 1`);
        svg.setAttribute('aria-hidden', 'true');
        svg.classList.add('geo');
        pieces.forEach(p => {
            const path = document.createElementNS(NS, 'path');
            path.setAttribute('d', p.d);
            path.setAttribute('fill-rule', 'evenodd');
            path.setAttribute('transform', `translate(${n(p.x)} 0)`);
            // Pieces in the heading's own colour follow it (hover included);
            // only a differently coloured span, like an <em>, is pinned.
            if (kept[p.index].color !== own) path.style.fill = path.style.stroke = kept[p.index].color;
            path.style.strokeWidth = SEAM + 'px';
            svg.appendChild(path);
        });

        const sr = document.createElement('span');
        sr.className = 'geo-text';
        sr.append(...el.childNodes);
        el.append(svg, sr);

        if (opts.assemble && MOVING) {
            let seed = 7;
            const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
            svg.querySelectorAll('path').forEach((path, i) => {
                const from = 3 + rnd() * 9;
                const x = pieces[i].x;
                path.animate([
                    { transform: `translate(${n(x + from)}px, 0)`, opacity: 0 },
                    { transform: `translate(${n(x)}px, 0)`, opacity: 1 }
                ], { duration: 900 + rnd() * 900, delay: 80 + rnd() * 260,
                     easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'backwards' });
            });
        }
        return svg;
    }

    /* The looping version, on a canvas: every piece slides left at 1, 2 or 3
       laps a cycle and wraps, so they only line up into the word once a cycle.
       Time is warped to slow around that moment so the word holds; with
       opts.hold it also sits still, assembled, for that many seconds each
       time it lines up, starting from the first frame. place()
       returns the word's left edge, top and unit size for the current window. */
    function converge(canvas, text, place, opts) {
        opts = opts || {};
        const CYCLE = opts.cycle || 26;
        const HOLD = opts.hold || 0;
        const INK = opts.ink || '#f2f2ef', DIM = opts.dim || '#8c8c88';
        const cx = canvas.getContext('2d');
        const { pieces: layoutPieces, width } = layout(text);
        let W = 0, H = 0, pieces = [], box = null;
        let blastAt = -1e9;

        function build() {
            W = innerWidth; H = innerHeight;
            if (W < 2 || H < 2) { pieces = []; return; }
            const dpr = Math.min(3, devicePixelRatio || 1);
            canvas.width = W * dpr;
            canvas.height = H * dpr;
            cx.setTransform(dpr, 0, 0, dpr, 0, 0);
            box = place(width);
            let seed = 11;
            const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
            pieces = layoutPieces.map(p => {
                const a = Math.random() * 6.2832, d = 200 + Math.random() * 400;
                return { d: p.d, ax: box.x + p.x * box.s, laps: 1 + Math.floor(rnd() * 3),
                         tone: rnd() < 0.2 ? DIM : INK, bx: Math.cos(a) * d, by: Math.sin(a) * d };
            });
            layoutPieces.forEach((p, i) => {
                const swap = ((G[p.ch] || {}).clear || {})[p.part];
                if (swap && pieces[i - p.part + swap[0]].tone !== pieces[i].tone) pieces[i].d = swap[1];
            });
            pieces.forEach(q => { q.path = new Path2D(q.d); });
        }

        // Blows out over 6s and settles back over 2.5s.
        function blast() {
            const t = (performance.now() - blastAt) / 1000;
            if (t < 0 || t > 8.5) return 0;
            if (t < 6) { const k = t / 6; return k * k * (3 - 2 * k); }
            const k = 1 - (t - 6) / 2.5;
            return k * k * k;
        }

        function render(sec) {
            if (!pieces.length || W !== innerWidth || H !== innerHeight) build();
            if (!pieces.length) return;
            cx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
            cx.clearRect(0, 0, W, H);
            const t = sec % (CYCLE + HOLD);
            const f = Math.max(0, t - HOLD) / CYCLE;
            const warped = f - (HOLD ? 1 : 0.94) * Math.sin(2 * PI * f) / (2 * PI);
            const margin = box.s * 1.3, span = W + 2 * margin;
            const b = blast();
            cx.globalAlpha = 1 - b;
            pieces.forEach(q => {
                let x = q.ax - q.laps * span * warped;
                x = ((x + margin) % span + span) % span - margin;
                cx.save();
                cx.translate(x + q.bx * b, box.y + q.by * b);
                cx.scale(box.s, box.s);
                cx.fillStyle = cx.strokeStyle = q.tone;
                cx.lineWidth = SEAM / box.s;
                cx.fill(q.path, 'evenodd');
                cx.stroke(q.path);
                cx.restore();
            });
        }

        // opts.still: draw the word once, assembled (the vault's front).
        if (MOVING && !opts.still) (function loop(ms) { render(ms / 1000); requestAnimationFrame(loop); })(0);
        else { render(0); addEventListener('resize', () => render(0)); }

        return {
            explode() {
                blastAt = performance.now();
                if (!MOVING) requestAnimationFrame(function settle() {
                    render(0);
                    if (blast() > 0) requestAnimationFrame(settle);
                });
            }
        };
    }

    /* The same arrival as an assembling heading, but the letters stay in the
       page's own type: each character slides in from the right once and
       settles. A ↗ becomes the alphabet's arrow, drawn at cap height. */
    function arrive(el) {
        const NS = 'http://www.w3.org/2000/svg';
        const shown = document.createElement('span');
        shown.setAttribute('aria-hidden', 'true');
        const letters = [];
        (function walk(node, into) {
            [...node.childNodes].forEach(c => {
                if (c.nodeType === 1) {
                    const copy = c.cloneNode(false);
                    into.appendChild(copy);
                    walk(c, copy);
                    return;
                }
                if (c.nodeType !== 3) return;
                // Letters sit in a word that can't break, so a long title wraps
                // at its spaces rather than between any two letters.
                let word = null;
                [...c.textContent.replace(/\s+/g, ' ')].forEach(ch => {
                    const span = document.createElement('span');
                    span.className = 'arrive';
                    if (ch === '↗') {
                        const svg = document.createElementNS(NS, 'svg');
                        svg.setAttribute('viewBox', '0 0 0.5 1');
                        svg.classList.add('geo', 'arrow');
                        const path = document.createElementNS(NS, 'path');
                        path.setAttribute('d', G['↗'].parts[0]);
                        svg.appendChild(path);
                        span.appendChild(svg);
                    } else span.textContent = ch;
                    if (ch === ' ') { word = null; into.appendChild(span); }
                    else {
                        if (!word) { word = document.createElement('span'); word.style.whiteSpace = 'nowrap'; into.appendChild(word); }
                        word.appendChild(span);
                    }
                    letters.push(span);
                });
            });
        })(el, shown);

        const sr = document.createElement('span');
        sr.className = 'geo-text';
        sr.textContent = el.textContent.replace('↗', '').replace(/\s+/g, ' ').trim();
        el.replaceChildren(shown, sr);

        if (!MOVING) return;
        let seed = 7;
        const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
        letters.forEach(span => {
            const from = (3 + rnd() * 9) * 0.72;
            span.animate([
                { transform: `translateX(${n(from)}em)`, opacity: 0 },
                { transform: 'none', opacity: 1 }
            ], { duration: 900 + rnd() * 900, delay: 80 + rnd() * 260,
                 easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'backwards' });
        });
    }

    window.Geo = { glyphs: G, layout, heading, arrive, converge, T };

    // data-geo redraws an element in the alphabet and assembles it once;
    // data-arrive keeps its type and only borrows the motion.
    const run = () => {
        document.querySelectorAll('[data-geo]').forEach(el => heading(el, { assemble: true }));
        document.querySelectorAll('[data-arrive]').forEach(arrive);
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
    else run();
})();
