/* Writes content/pieces.js into the pages.

   node tools/build.mjs

   - <slug>.html   one page per piece, whole (and removes pages of pieces no
                   longer listed; a built page says so on its second line)
   - pieces.html   the list, between <!-- build:pieces --> markers

   Run it after changing content/, and commit what it writes. */

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const write = (f, s) => {
    const p = path.join(ROOT, f);
    if (fs.existsSync(p) && fs.readFileSync(p, 'utf8') === s) return;
    fs.writeFileSync(p, s);
    console.log('wrote', f);
};

const ctx = {};
vm.createContext(ctx);
vm.runInContext(read('content/pieces.js') + '\n;globalThis.__x = { VAULT, PIECES };', ctx);
const { VAULT, PIECES } = ctx.__x;

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const clock = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
const BUILT = '<!-- Built by tools/build.mjs from content/pieces.js. Edit that, not this. -->';

const slugs = new Set();
for (const p of PIECES) {
    if (!/^[a-z0-9-]+$/.test(p.slug)) throw new Error(`slug "${p.slug}": lowercase letters, digits and dashes only`);
    if (['index', 'pieces', '404'].includes(p.slug) || slugs.has(p.slug)) throw new Error(`slug "${p.slug}" is taken`);
    if (!fs.existsSync(path.join(ROOT, p.file))) throw new Error(`${p.slug}: no file at ${p.file}`);
    slugs.add(p.slug);
}

// A row that plays the piece on demand; js/vault.js drives it.
const row = (p, link) =>
    `<div class="track" data-file="/${esc(p.file)}" data-duration="${p.duration}">` +
    `<button type="button" class="track-play" aria-label="Play ${esc(p.title)}"><i></i></button>` +
    `<div class="track-name">${link ? `<a class="track-title" href="/${p.slug}">${esc(p.title)}</a>` : `<span class="track-title">${esc(p.title)}</span>`}` +
    `<span class="track-sub label">${esc(p.artist)} · <span class="status">${esc(p.status)}</span>${link ? ` <span class="onair" data-onair="${p.slug}" hidden>On air</span>` : ''}</span></div>` +
    `<span class="track-time label">0:00 / ${clock(p.duration)}</span>` +
    `<div class="track-bar" aria-hidden="true"><span></span></div></div>`;

const head = (title, desc, extra = '') => `<!DOCTYPE html>
${BUILT}
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <meta name="robots" content="noindex, nofollow">
    <title>${title}</title>
    <link rel="icon" type="image/png" href="/assets/favicon.png">
    <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
    <meta name="description" content="${desc}">
    <meta name="theme-color" content="#0a0a0a">
    <link rel="stylesheet" href="/css/base.css">
    <link rel="stylesheet" href="/css/pages.css">
    <link rel="stylesheet" href="/css/vault.css">${extra}
</head>`;

const corner = `<div class="corner">
<a class="mailmark" href="mailto:${VAULT.email}?subject=Vault" aria-label="Email">
<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 5H4L12 11.6 20 5H22V19H2Z"/></svg>
</a>
</div>
<a class="backmark" href="/" aria-label="Back"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12 12 4.5V10H21V14H12V19.5Z"/></svg></a>
<a class="homemark" href="/" aria-label="Front page"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 22 11.5H19V21H13.8V15H10.2V21H5V11.5H2Z"/></svg></a>`;

const exit = here => `<nav class="exit">
    <a href="/">Vault</a>
    ${here === 'pieces' ? '<span class="here">Pieces</span>' : '<a href="/pieces">Pieces</a>'}<a href="https://audiospatials.com/">Audiospatials</a>
    <span class="spacer"></span>
    <span class="copy">&copy; 2026 Audiospatials</span>
</nav>`;

const scripts = clean => `<script>
if (location.pathname.endsWith('.html')) history.replaceState(history.state, '', '${clean}' + location.search + location.hash);
</script>
<script src="/content/pieces.js"></script>
<script src="/js/geo.js"></script>
<script src="/js/vault.js"></script>
<script src="/js/nav.js"></script>
<script src="/js/menu.js"></script>`;

// ---------- a page per piece

for (const p of PIECES) {
    const desc = esc(`${p.title} by ${p.artist}, ${p.status}. In the Audiospatials Vault.`);
    const mail = `mailto:${VAULT.email}?subject=${encodeURIComponent('Vault: ' + p.title)}`;
    write(p.slug + '.html', `${head(`${esc(p.title)} &mdash; Audiospatials Vault`, desc)}
<body>
${corner}
<div class="wrap">
    <h1 class="piece" data-arrive>${esc(p.title)}</h1>
    <p class="byline label">${esc(p.artist)} &nbsp;|&nbsp; <span class="status">${esc(p.status)}</span> <span class="onair" data-onair="${p.slug}" hidden>On air now</span></p>
${p.note ? `    <div class="prose"><p>${esc(p.note)}</p></div>\n` : ''}
    <section>
        <div class="tracks">
            ${row(p, false)}
        </div>
        <p class="feedback label"><a href="${esc(mail)}">Tell us what you think</a></p>
    </section>
</div>

${exit()}
${scripts('/' + p.slug)}
</body>
</html>
`);
}

// Pages of pieces that have left the list.
for (const f of fs.readdirSync(ROOT)) {
    if (!f.endsWith('.html') || slugs.has(f.slice(0, -5))) continue;
    const text = read(f);
    if (text.split('\n')[1] === BUILT) { fs.unlinkSync(path.join(ROOT, f)); console.log('removed', f); }
}

// ---------- the list

const list = read('pieces.html');
const block = `<!-- build:pieces -->\n${PIECES.map(p => '            ' + row(p, true)).join('\n')}\n<!-- /build:pieces -->`;
write('pieces.html', list.replace(/<!-- build:pieces -->[\s\S]*?<!-- \/build:pieces -->/, block));
