#!/bin/zsh
# Writes each piece's credits into its audio file (title, artist, album,
# copyright, its page), so a downloaded track says what it is. No re-encode.
# Run after adding a piece: zsh tools/tag.sh
cd "${0:A:h}/.."
node -e "
const vm = require('vm'), fs = require('fs'), c = {};
vm.createContext(c);
vm.runInContext(fs.readFileSync('content/pieces.js', 'utf8') + ';globalThis.P = PIECES', c);
for (const p of c.P) console.log([p.file, p.title, p.artist, p.slug].join('\t'));
" | while IFS=$'\t' read -r file title artist slug; do
  ffmpeg -hide_banner -loglevel error -y -i "$file" -map 0 -c copy -map_metadata -1 -map_chapters -1 \
    -metadata title="$title" -metadata artist="$artist" -metadata album_artist="$artist" \
    -metadata album="Audiospatials Vault" -metadata date="$(date +%Y)" \
    -metadata copyright="© $(date +%Y) Audiospatials" -metadata comment="https://vault.audiospatials.com/$slug" \
    -movflags +faststart "${file:r}.tmp.m4a" && mv "${file:r}.tmp.m4a" "$file" && echo "tagged $file"
done
