#!/usr/bin/env node
// Static determinism lint for everything the film page loads.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = [];
const walk = (d) => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); fs.statSync(p).isDirectory() ? walk(p) : /\.(m?js|css|html)$/.test(f) && files.push(p); } };
['film', 'film2', 'engine', 'assets/vendor'].forEach((d) => fs.existsSync(path.join(ROOT, d)) && walk(path.join(ROOT, d)));

const rules = [
  [/requestAnimationFrame/, 'requestAnimationFrame'],
  [/\bsetTimeout\s*\(/, 'setTimeout'],
  [/\bsetInterval\s*\(/, 'setInterval'],
  [/\bDate\.now\b|new Date\s*\(/, 'Date-based time'],
  [/performance\.now/, 'performance.now'],
  [/Math\.random/, 'Math.random (use seeded rng)'],
  [/will-change/, 'will-change'],
  [/translate3d/, 'translate3d'],
  [/translateZ\(\s*0/, 'translateZ(0)'],
  [/(^|[;{\s])transition\s*:(?!\s*none)/m, 'CSS transition'],
  [/(^|[;{\s])animation\s*:(?!\s*none)/m, 'CSS animation'],
  [/@keyframes/, '@keyframes'],
  [/\.animate\s*\(/, 'Web Animations API'],
];
let bad = 0;
for (const f of files) {
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  lines.forEach((line, i) => {
    const code = line.replace(/\/\/.*$/, '').replace(/\/\*.*?\*\//g, '');
    for (const [re, name] of rules) if (re.test(code)) { bad++; console.log(`lint: ${path.relative(ROOT, f)}:${i + 1}  ${name}`); }
  });
}
console.log(bad ? `LINT: FAIL (${bad})` : `LINT: PASS (${files.length} files)`);
process.exit(bad ? 1 : 0);
