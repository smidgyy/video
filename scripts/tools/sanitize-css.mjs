// Vendor the real tryvoice.fun stylesheet for deterministic film rendering.
// - removes transitions / animations (motion is driven only by window.seek)
// - removes viewport-dependent max-width / reduced-motion / coarse-pointer blocks so
//   components keep their desktop layout in every aspect ratio
// - removes the Google Fonts @import (fonts are vendored locally)
// - freezes vw/vh to the 1440x900 capture viewport
import fs from 'node:fs';
const [src, dst] = process.argv.slice(2);
let css = fs.readFileSync(src, 'utf8');

function dropAtBlocks(text, test) {
  let out = '', i = 0;
  while (i < text.length) {
    const at = text.indexOf('@media', i);
    if (at < 0) { out += text.slice(i); break; }
    const open = text.indexOf('{', at);
    const cond = text.slice(at, open);
    let depth = 1, j = open + 1;
    while (depth && j < text.length) { if (text[j] === '{') depth++; else if (text[j] === '}') depth--; j++; }
    out += text.slice(i, at);
    if (!test(cond)) out += text.slice(at, j);
    i = j;
  }
  return out;
}
const before = css.length;
css = css.replace(/@import[^;]+;/g, '');
css = dropAtBlocks(css, c => /max-width|prefers-reduced-motion|pointer:\s*coarse/.test(c));
// only real declarations (after '{' or ';'), never inside @supports conditions, never across braces
css = css.replace(/([{;])\s*(-webkit-)?(transition|animation)(-[a-z-]+)?\s*:[^;{}]*;?/g, '$1');
css = css.replace(/@keyframes\s+[\w-]+\s*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '');
css = css.replace(/([{;])\s*will-change\s*:[^;{}]*;?/g, '$1');
// Freeze viewport units to the 1440x900 design viewport the site was captured at, so components
// render identically in every film aspect ratio (16:9, 9:16, 1:1, 4:5).
css = css.replace(/(-?\d*\.?\d+)vw\b/g, (_, n) => `${(parseFloat(n) * 14.4).toFixed(2)}px`);
css = css.replace(/(-?\d*\.?\d+)vh\b/g, (_, n) => `${(parseFloat(n) * 9).toFixed(2)}px`);
let depth = 0;
for (const c of css) { depth += c === '{' ? 1 : c === '}' ? -1 : 0; if (depth < 0) { console.error('sanitize: unbalanced braces'); process.exit(1); } }
if (depth !== 0) { console.error('sanitize: unbalanced braces at end'); process.exit(1); }
for (const bad of ['transition:', 'animation:', 'will-change', 'translate3d', 'translateZ(0)', '@keyframes'])
  if (css.includes(bad)) { console.error('sanitize: still contains', bad); process.exit(1); }
fs.writeFileSync(dst, '/* Vendored from https://tryvoice.fun (index.DVedYikm.css), sanitized for deterministic rendering by scripts/tools/sanitize-css.mjs */\n' + css);
console.log(`sanitized ${before} -> ${css.length} bytes`);
