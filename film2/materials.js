// Seeded, load-time material generators. Albedo maps are drawn, then lit by a multiplied irradiance map,
// so texture only shows where light falls (physically, not as a fade). Nothing here depends on time.
import { rng, clamp, lerp } from '../engine/motion.js';
import { canvas, ctx2, rgba } from './core.js';

// ---------- noise ----------
export function valueNoise(seed, cells = 64) {
  const r = rng(seed), N = cells, g = new Float32Array((N + 1) * (N + 1));
  for (let i = 0; i < g.length; i++) g[i] = r();
  for (let i = 0; i <= N; i++) { g[i * (N + 1) + N] = g[i * (N + 1)]; g[N * (N + 1) + i] = g[i]; } // tileable
  return (x, y) => {
    x = ((x % N) + N) % N; y = ((y % N) + N) % N;
    const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const a = g[iy * (N + 1) + ix], b = g[iy * (N + 1) + ix + 1], c = g[(iy + 1) * (N + 1) + ix], d = g[(iy + 1) * (N + 1) + ix + 1];
    return lerp(lerp(a, b, sx), lerp(c, d, sx), sy);
  };
}
export function fbm(n, x, y, oct = 4, lac = 2, gain = 0.5) {
  let s = 0, a = 1, f = 1, norm = 0;
  for (let i = 0; i < oct; i++) { s += a * n(x * f, y * f); norm += a; a *= gain; f *= lac; }
  return s / norm;
}
const hexRGB = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };

// ---------- board-formed concrete (albedo) ----------
// sills: [{x, y, w}] — rain streaks run down from each sill's underside.
export function concrete({ w = 2400, h = 1400, seed = 1401, tone = '#c4c2ba', board = 72, tie = [288, 216], sills = [], crack = true } = {}) {
  const c = canvas(w, h), g = ctx2(c), img = g.createImageData(w, h), d = img.data;
  const n1 = valueNoise(seed), n2 = valueNoise(seed + 7), n3 = valueNoise(seed + 13, 128), r = rng(seed + 99);
  const [R, G, B] = hexRGB(tone);
  const seamY = []; for (let y = board; y < h; y += board) seamY.push(y + Math.round((r() - 0.5) * 2));
  const boardShade = seamY.map(() => (r() - 0.5) * 0.05);
  for (let y = 0; y < h; y++) {
    const bi = seamY.findIndex((s) => s > y); const bs = boardShade[bi < 0 ? seamY.length - 1 : bi] || 0;
    for (let x = 0; x < w; x++) {
      const low = fbm(n1, x / 180, y / 180, 4) - 0.5;
      const grainStreak = n2(x / 160, y / 9) - 0.5;               // wood-grain imprint, stretched on x
      const fine = n3(x / 2.2, y / 2.2) - 0.5;
      let v = 1 + low * 0.16 + grainStreak * 0.05 + fine * 0.06 + bs;
      const i = (y * w + x) * 4;
      d[i] = clamp(R * v, 0, 255); d[i + 1] = clamp(G * v, 0, 255); d[i + 2] = clamp(B * v * 1.01, 0, 255); d[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  // seams: 1 px dark, 1 px light below
  for (const s of seamY) { g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(0, s, w, 1); g.fillStyle = 'rgba(255,255,255,0.10)'; g.fillRect(0, s + 1, w, 1); }
  // tie holes: dark cone + crescent highlight (key from upper left)
  for (let y = tie[1] / 2; y < h; y += tie[1]) for (let x = tie[0] / 2; x < w; x += tie[0]) {
    const jx = x + (r() - 0.5) * 3, jy = y + (r() - 0.5) * 3;
    const gr = g.createRadialGradient(jx, jy, 0, jx, jy, 7);
    gr.addColorStop(0, 'rgba(0,0,0,0.38)'); gr.addColorStop(0.6, 'rgba(0,0,0,0.16)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(jx, jy, 7, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.12)'; g.lineWidth = 1; g.beginPath(); g.arc(jx + 0.8, jy + 0.8, 5.5, Math.PI * 0.05, Math.PI * 0.6); g.stroke();
  }
  // rain streaks under sills: vertical noise columns with exponential alpha
  for (const s of sills) {
    for (let x = s.x; x < s.x + s.w; x += 1) {
      const k = n2(x / 6, 3.3), len = 120 + 260 * k, a0 = 0.05 + 0.13 * n1(x / 14, 9.1);
      const gr = g.createLinearGradient(0, s.y, 0, s.y + len);
      gr.addColorStop(0, `rgba(30,30,28,${a0.toFixed(3)})`); gr.addColorStop(1, 'rgba(30,30,28,0)');
      g.fillStyle = gr; g.fillRect(x, s.y, 1, len);
    }
  }
  if (crack) { // one hairline crack, a random walk
    let x = w * (0.25 + r() * 0.5), y = h * (0.1 + r() * 0.2);
    g.strokeStyle = 'rgba(20,20,18,0.45)'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(x, y);
    for (let i = 0; i < 90; i++) { x += (r() - 0.45) * 5; y += 2 + r() * 4; g.lineTo(x, y); }
    g.stroke();
  }
  return c;
}

// ---------- plaster ----------
export function plaster({ w = 2400, h = 1200, seed = 1404, tone = '#bcb8ae', scuffs = [], pins = [] } = {}) {
  const c = canvas(w, h), g = ctx2(c), img = g.createImageData(w, h), d = img.data;
  const n1 = valueNoise(seed), n3 = valueNoise(seed + 5, 128);
  const [R, G, B] = hexRGB(tone);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const v = 1 + (fbm(n1, x / 260, y / 260, 4) - 0.5) * 0.09 + (n3(x / 1.8, y / 1.8) - 0.5) * 0.035;
    const i = (y * w + x) * 4; d[i] = R * v; d[i + 1] = G * v; d[i + 2] = B * v; d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const r = rng(seed + 1);
  for (let i = 0; i < 40; i++) { // trowel arcs, 2%
    const x = r() * w, y = r() * h, rad = 120 + r() * 260, a0 = r() * Math.PI * 2;
    g.strokeStyle = `rgba(${r() < 0.5 ? '255,255,255' : '0,0,0'},0.02)`; g.lineWidth = 14 + r() * 20;
    g.beginPath(); g.arc(x, y, rad, a0, a0 + 0.5 + r() * 0.6); g.stroke();
  }
  for (const s of scuffs) { const gr = g.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r); gr.addColorStop(0, 'rgba(40,36,30,0.22)'); gr.addColorStop(1, 'rgba(40,36,30,0)'); g.fillStyle = gr; g.fillRect(s.x - s.r, s.y - s.r, 2 * s.r, 2 * s.r); }
  for (const p of pins) { g.fillStyle = 'rgba(0,0,0,0.5)'; g.beginPath(); g.arc(p.x, p.y, 1.6, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,0.25)'; g.beginPath(); g.arc(p.x + 0.7, p.y + 0.9, 1.2, 0, 3); g.fill(); }
  return c;
}

// ---------- asphalt + pavement ----------
export function asphalt({ w = 2048, h = 1024, seed = 1408, tone = '#3a3d40', damp = 0.62 } = {}) {
  const c = canvas(w, h), g = ctx2(c), img = g.createImageData(w, h), d = img.data;
  const n1 = valueNoise(seed), n2 = valueNoise(seed + 3, 128), r = rng(seed + 2);
  const [R, G, B] = hexRGB(tone);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dampK = fbm(n1, x / 300, y / 300, 3) > damp ? 0.72 : 1;
    let v = (1 + (n2(x / 1.3, y / 1.3) - 0.5) * 0.35 + (fbm(n1, x / 40, y / 40, 2) - 0.5) * 0.12) * dampK;
    const i = (y * w + x) * 4; d[i] = R * v; d[i + 1] = G * v; d[i + 2] = B * v; d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  for (let i = 0; i < (w * h) / 900; i++) { // aggregate highlights
    g.fillStyle = `rgba(200,205,210,${(0.05 + r() * 0.12).toFixed(3)})`; g.fillRect(r() * w, r() * h, 1 + (r() < 0.2), 1);
  }
  return c;
}
export function pavement({ w = 2048, h = 600, seed = 1418, tone = '#77787a', slab = 120 } = {}) {
  const c = canvas(w, h), g = ctx2(c), img = g.createImageData(w, h), d = img.data;
  const n1 = valueNoise(seed), n2 = valueNoise(seed + 9, 128), r = rng(seed);
  const [R, G, B] = hexRGB(tone);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const v = 1 + (fbm(n1, x / 90, y / 90, 3) - 0.5) * 0.12 + (n2(x / 1.5, y / 1.5) - 0.5) * 0.1;
    const i = (y * w + x) * 4; d[i] = R * v; d[i + 1] = G * v; d[i + 2] = B * v; d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  g.fillStyle = 'rgba(0,0,0,0.35)';
  for (let x = 0; x < w; x += slab) g.fillRect(x + Math.round((r() - 0.5) * 2), 0, 1.4, h);
  for (let y = 0; y < h; y += slab) g.fillRect(0, y + Math.round((r() - 0.5) * 2), w, 1.4);
  for (let i = 0; i < 18; i++) { g.fillStyle = 'rgba(0,0,0,0.25)'; const x = Math.floor(r() * w / slab) * slab, y = Math.floor(r() * h / slab) * slab; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 4 + r() * 6, y); g.lineTo(x, y + 3 + r() * 5); g.fill(); }
  return c;
}

// ---------- glass wear (white on transparent; drawn with 'screen' scaled by local light) ----------
export function glassWear({ w = 600, h = 430, seed = 1402, specks = 360, rings = 50, drip = true, bubble = false } = {}) {
  const c = canvas(w, h), g = ctx2(c), r = rng(seed);
  for (let i = 0; i < specks; i++) { g.fillStyle = `rgba(255,255,255,${(0.06 + r() * 0.12).toFixed(3)})`; const s = 1 + (r() < 0.3); g.fillRect(r() * w, r() * h, s, s); }
  g.lineWidth = 1;
  for (let i = 0; i < rings; i++) { g.strokeStyle = `rgba(255,255,255,${(0.05 + r() * 0.05).toFixed(3)})`; g.beginPath(); g.ellipse(r() * w, r() * h, 3 + r() * 7, 3 + r() * 6, r() * 3, 0, 7); g.stroke(); }
  if (drip) { let x = w * (0.2 + r() * 0.6), y = h * 0.05; g.strokeStyle = 'rgba(255,255,255,0.10)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); for (let i = 0; i < 30; i++) { x += (r() - 0.5) * 2; y += h * 0.025; g.lineTo(x, y); } g.stroke(); g.beginPath(); g.arc(x, y + 2, 2.5, 0, 7); g.fillStyle = 'rgba(255,255,255,0.12)'; g.fill(); }
  // one fingerprint: concentric sine-warped ellipses at 4%
  const fx = w * (0.15 + r() * 0.7), fy = h * (0.2 + r() * 0.6);
  for (let k = 1; k < 14; k++) { g.strokeStyle = 'rgba(255,255,255,0.045)'; g.lineWidth = 0.8; g.beginPath(); for (let a = 0; a <= 64; a++) { const th = (a / 64) * Math.PI * 2, rr = k * 1.6 + Math.sin(th * 5 + k) * 0.5; const px = fx + Math.cos(th) * rr * 1.25, py = fy + Math.sin(th) * rr; a ? g.lineTo(px, py) : g.moveTo(px, py); } g.stroke(); }
  if (bubble) { const bx = w * 0.7, by = h * 0.3; g.strokeStyle = 'rgba(255,255,255,0.12)'; g.beginPath(); g.ellipse(bx, by, 9, 6, 0.3, 0, 7); g.stroke(); }
  return c;
}

// ---------- paper slip ----------
export function paperSlip(lines, { w = 330, h = 120, seed = 1406, tone = '#e9e6dd', ink = '#2a2a28' } = {}) {
  const c = canvas(w, h), g = ctx2(c), img = g.createImageData(w, h), d = img.data;
  const n = valueNoise(seed, 128), [R, G, B] = hexRGB(tone);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const edge = Math.min(x, y, w - 1 - x, h - 1 - y), e = edge < 6 ? 0.9 + edge * 0.017 : 1;
    const v = (1 + (n(x / 1.2, y / 3.5) - 0.5) * 0.06) * e;
    const i = (y * w + x) * 4; d[i] = R * v; d[i + 1] = G * v; d[i + 2] = B * v; d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  g.fillStyle = 'rgba(0,0,0,0.05)'; g.fillRect(0, h * 0.55, w, 1); // crease
  g.fillStyle = ink; g.font = '400 24px "Geist Mono"';
  lines.forEach((l, i) => { g.globalAlpha = 0.92; g.fillText(l, 22, 44 + i * 36); g.globalAlpha = 0.25; g.fillText(l, 22.3, 44.3 + i * 36); });
  g.globalAlpha = 1;
  return c;
}

// ---------- Dymo tape (embossed label) ----------
export function dymo(text, { tape = 'black', capH = 60, seed = 1407 } = {}) {
  const size = Math.round(capH / 0.7), padX = Math.round(capH * 0.55), th = Math.round(capH * 1.73);
  const m = canvas(10, 10), mg = ctx2(m);
  const font = `700 ${size}px "Bricolage Grotesque"`;
  mg.font = font; mg.fontStretch = 'condensed'; mg.letterSpacing = `${(0.04 * size).toFixed(1)}px`;
  const tw = mg.measureText(text).width;
  const w = Math.ceil(tw + padX * 2), h = th, c = canvas(w, h), g = ctx2(c), r = rng(seed + text.length * 31);
  const body = tape === 'volt' ? '#d4ff3f' : '#111214', letter = tape === 'volt' ? '#0b0f02' : '#e9ecee';
  // tape body with cut ends at 4–7°
  const cutL = (4 + r() * 3) * Math.PI / 180, cutR = (4 + r() * 3) * Math.PI / 180;
  g.beginPath(); g.moveTo(Math.tan(cutL) * h, 0); g.lineTo(w, 0); g.lineTo(w - Math.tan(cutR) * h, h); g.lineTo(0, h); g.closePath();
  g.fillStyle = body; g.fill(); g.save(); g.clip();
  for (let x = 0; x < w; x += 2) { g.fillStyle = `rgba(${tape === 'volt' ? '0,0,0' : '255,255,255'},${(0.015 + r() * 0.03).toFixed(3)})`; g.fillRect(x, 0, 1, h); }
  const base = Math.round(h / 2 + capH / 2);
  const draw = (dx, dy, col) => { g.font = font; g.fontStretch = 'condensed'; g.letterSpacing = `${(0.04 * size).toFixed(1)}px`; g.fillStyle = col; g.fillText(text, padX + dx, base + dy); };
  draw(1.5, 1.5, tape === 'volt' ? 'rgba(80,110,0,0.55)' : 'rgba(0,0,0,0.85)');   // emboss shadow
  draw(-1, -1, tape === 'volt' ? 'rgba(255,255,230,0.55)' : 'rgba(255,255,255,0.25)'); // emboss light
  draw(0, 0, letter);
  // stress-whitening noise on letters
  g.globalCompositeOperation = 'source-atop';
  for (let i = 0; i < w * h / 40; i++) { g.fillStyle = `rgba(255,255,255,${(r() * 0.05).toFixed(3)})`; g.fillRect(r() * w, r() * h, 1, 1); }
  g.restore();
  c.capH = capH;
  return c;
}

// ---------- road paint (white letters, worn, aggregate showing through) ----------
export function roadPaint(text, { size = 120, scaleY = 1.8, seed = 1409 } = {}) {
  const m = canvas(10, 10), mg = ctx2(m), font = `800 ${size}px "Bricolage Grotesque"`;
  mg.font = font; mg.fontStretch = 'condensed';
  const tm = mg.measureText(text), pad = 20;
  const w = Math.ceil(tm.width + pad * 2), hh = Math.ceil((tm.actualBoundingBoxAscent + tm.actualBoundingBoxDescent) * scaleY + pad * 2);
  const c = canvas(w, hh), g = ctx2(c);
  g.save(); g.translate(pad, pad + tm.actualBoundingBoxAscent * scaleY); g.scale(1, scaleY);
  g.font = font; g.fontStretch = 'condensed'; g.fillStyle = '#eeeeea'; g.fillText(text, 0, 0); g.restore();
  // wear: knock out where noise < 0.3; aggregate speckle
  const img = g.getImageData(0, 0, w, hh), d = img.data, n = valueNoise(seed), n2 = valueNoise(seed + 1, 128);
  for (let y = 0; y < hh; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4; if (!d[i + 3]) continue;
    const wear = fbm(n, x / 26, y / 26, 3), sp = n2(x / 1.4, y / 1.4);
    let a = d[i + 3] / 255;
    if (wear < 0.32) a *= clamp((wear - 0.22) / 0.1);
    if (sp > 0.78) a *= 0.35;
    d[i + 3] = a * 235;
  }
  g.putImageData(img, 0, 0);
  return c;
}

// ---------- fingerprint stamp (persistent where presses happen) ----------
export function fingerprint(seed = 7, r0 = 26) {
  const s = r0 * 2 + 8, c = canvas(s, s), g = ctx2(c), rr = rng(seed);
  for (let k = 1; k < 16; k++) {
    g.strokeStyle = `rgba(255,255,255,${(0.05 + rr() * 0.03).toFixed(3)})`; g.lineWidth = 0.9; g.beginPath();
    for (let a = 0; a <= 72; a++) { const th = (a / 72) * Math.PI * 2, r = k * (r0 / 16) + Math.sin(th * 6 + k * 0.7) * 0.6; const x = s / 2 + Math.cos(th) * r * 0.82, y = s / 2 + Math.sin(th) * r; a ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.stroke();
  }
  return c;
}

export { rgba };
