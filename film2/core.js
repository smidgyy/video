// film2 core — the deterministic stage every shot draws into.
// Layers (back → front):  #world canvas  →  #ui (real product DOM)  →  #mul canvas (multiply)  →  #add canvas (screen)
//                         →  #front canvas (normal: foreground planes, type on glass)  →  #grain (soft-light)  →  #vig
// Every frame is redrawn from t alone. Shots never keep state between seeks.
import { clamp, lerp, invLerp, ease, spring, springs, rng, hash01, noise1 } from '../engine/motion.js';
export { clamp, lerp, invLerp, ease, spring, springs, rng, hash01, noise1 };

export const W = 1920, H = 1080;
export const TL = await (await fetch('../timeline2.json')).json();
export const P = TL.grid.P, T0 = TL.grid.T0;
// Output beat → seconds (the music edit's measured grid). Author everything in beats: b(25) is the drop.
export const b = (ob) => T0 + ob * P;
export const EV = Object.fromEntries(TL.events.map((e) => [e.id, e.t]));
export const SHOT = Object.fromEntries(TL.shots.map((s) => [s.id, s]));

// ---------- stage ----------
export const stage = document.getElementById('stage');
function layer(id) { const c = document.getElementById(id); const g = c.getContext('2d', { alpha: true }); return g; }
export const L = {
  world: layer('world'),   // opaque scene
  mul: layer('mul'),       // multiply over UI (ambient, shadows)
  add: layer('add'),       // screen over UI (light, reflections, halation)
  front: layer('front'),   // normal: foreground planes
};
export const UI = document.getElementById('ui');
export function clearLayers() {
  for (const k of ['mul', 'add', 'front']) { const g = L[k]; g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.filter = 'none'; g.clearRect(0, 0, W, H); }
  const g = L.world; g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.filter = 'none';
  g.fillStyle = '#0a0a0c'; g.fillRect(0, 0, W, H);
  L.mul.fillStyle = '#ffffff'; L.mul.fillRect(0, 0, W, H);
}

// ---------- canvas helpers ----------
export function canvas(w, h) { const c = document.createElement('canvas'); c.width = Math.ceil(w); c.height = Math.ceil(h); return c; }
export const ctx2 = (c) => c.getContext('2d');
export function rgba(hex, a = 1) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a.toFixed(4)})`;
}
export function mixHex(a, b, k) {
  const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16);
  const c = [16, 8, 0].map((s) => Math.round(lerp((A >> s) & 255, (B >> s) & 255, clamp(k))));
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
}
// Pre-blur a canvas once (load-time only — never per frame).
export function blurred(src, px) {
  if (!px) return src;
  const c = canvas(src.width, src.height), g = ctx2(c);
  g.filter = `blur(${px}px)`; g.drawImage(src, 0, 0); g.filter = 'none';
  return c;
}

// ---------- camera (2D affine only; no 3D contexts) ----------
// A camera looks at world point (x, y) with zoom; a plane at depth z moves by (world − cam)·zoom/z.
export function cam(x, y, zoom = 1, roll = 0) { return { x, y, zoom, roll }; }
export function apply(g, c, z = 1) {
  const k = c.zoom / z;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.translate(W / 2, H / 2);
  if (c.roll) g.rotate((c.roll * Math.PI) / 180);
  g.scale(k, k);
  g.translate(-c.x, -c.y);
}
export function toScreen(c, wx, wy, z = 1) {
  const k = c.zoom / z, r = ((c.roll || 0) * Math.PI) / 180;
  const dx = (wx - c.x) * k, dy = (wy - c.y) * k;
  return [W / 2 + dx * Math.cos(r) - dy * Math.sin(r), H / 2 + dx * Math.sin(r) + dy * Math.cos(r)];
}
// CSS transform placing a DOM element (authored at world size, origin top-left at wx, wy) under camera c at depth z.
export function domTransform(c, wx, wy, z = 1, extra = '') {
  const [sx, sy] = toScreen(c, wx, wy, z);
  const k = c.zoom / z;
  return `translate(${sx.toFixed(2)}px, ${sy.toFixed(2)}px) rotate(${(c.roll || 0).toFixed(3)}deg) scale(${k.toFixed(5)}) ${extra}`;
}

// ---------- light ----------
// Inverse-square-ish falloff L(r) = I / (1 + (r/r0)^2), drawn as a radial gradient with enough stops to read as physical.
export function falloff(g, x, y, r0, color, I = 1, reach = 6) {
  const R = r0 * reach;
  const gr = g.createRadialGradient(x, y, 0, x, y, R);
  for (let i = 0; i <= 12; i++) {
    const r = (i / 12) * R;
    const v = clamp(I / (1 + (r / r0) ** 2)) * (1 - (i / 12) ** 4);
    gr.addColorStop(i / 12, rgba(color, v));
  }
  g.fillStyle = gr;
  g.fillRect(x - R, y - R, 2 * R, 2 * R);
}
// Incandescent response: ~120 ms rise, ~200 ms decay, from a target on/off schedule [[t, level], ...] (levels stepwise).
export function bulb(t, schedule, rise = 0.12, decay = 0.2) {
  let v = 0;
  for (let i = 0; i < schedule.length; i++) {
    const [ti, li] = schedule[i];
    if (t < ti) break;
    const prev = v;
    const tau = li > prev ? rise / 3 : decay / 3;
    const tn = i + 1 < schedule.length ? Math.min(t, schedule[i + 1][0]) : t;
    v = li + (prev - li) * Math.exp(-(tn - ti) / tau);
  }
  return v;
}
// One breath per bar for every manager light from the wake (b(25)) to the last frame.
export const WAKE = b(25);
export const breath = (t) => (t < WAKE ? 1 : 1 + 0.015 * Math.sin((2 * Math.PI * (t - WAKE)) / (4 * P)));

// ---------- grain (24 fps cadence over 60 fps motion) ----------
let grainTiles = [];
const grainEl = document.getElementById('grain');
export function setGrainTiles(urls) { grainTiles = urls; }
export function grain(t, opacity = 0.045) {
  if (!grainTiles.length) return;
  const i = (Math.floor(t * 24) * 5 + 3) % grainTiles.length;
  const ox = Math.floor(hash01(Math.floor(t * 24) + 77) * 256), oy = Math.floor(hash01(Math.floor(t * 24) + 991) * 256);
  grainEl.style.backgroundImage = `url(${grainTiles[i]})`;
  grainEl.style.backgroundPosition = `${ox}px ${oy}px`;
  grainEl.style.opacity = opacity.toFixed(3);
}
const vigEl = document.getElementById('vig');
export function vignette(strength = 0.08) { vigEl.style.opacity = (strength / 0.1).toFixed(3); }

// ---------- type sprites (load-time) ----------
// Bricolage with the wdth axis via canvas fontStretch keywords: 'semi-condensed' = 87.5% (≈ wdth 88), 'condensed' = 75%.
export function textSprite(str, { size = 104, weight = 660, stretch = 'semi-condensed', family = 'Bricolage Grotesque', color = '#f5f5ef', tracking = -0.04, pad = 24, mono = false } = {}) {
  const fam = mono ? 'Geist Mono' : family;
  const m = canvas(10, 10), mg = ctx2(m);
  const set = (g) => { g.font = `${weight} ${size}px "${fam}"`; if (!mono) g.fontStretch = stretch; g.letterSpacing = `${(tracking * size).toFixed(2)}px`; g.textBaseline = 'alphabetic'; };
  set(mg);
  const tm = mg.measureText(str);
  const w = Math.ceil(tm.width + pad * 2), asc = Math.ceil(tm.actualBoundingBoxAscent), desc = Math.ceil(tm.actualBoundingBoxDescent);
  const c = canvas(w, asc + desc + pad * 2), g = ctx2(c);
  set(g); g.fillStyle = color; g.fillText(str, pad, pad + asc);
  c.baseline = pad + asc; c.pad = pad; c.textW = tm.width; c.asc = asc; c.desc = desc;
  return c;
}

// ---------- the shot table ----------
// Shot modules register { id, set, render(t, u) } where u = local beats since shot start.
export const shots = [];
export function shot(id, render, opts = {}) { shots.push({ id, render, ...opts, ...SHOT[id] }); }
export function activeShot(t) {
  let s = shots[0];
  for (const x of shots) if (t >= x.start - 1e-6) s = x;
  return s;
}
// local beat position inside the edit (for authoring): ob(t)
export const obAt = (t) => (t - T0) / P;

// ---------- real product UI ----------
// Loads a captured fragment (capture/fragments/<name>.html: outerHTML from tryvoice.fun) into a .ui-item wrapper.
// The product's own stylesheet renders it; shots only change real classes/attributes/text and the wrapper transform.
export async function fragment(name, { width = null, className = '' } = {}) {
  const html = await (await fetch(`../capture/fragments/${name}.html`)).text();
  const wrap = document.createElement('div');
  wrap.className = `ui-item ${className}`.trim();
  if (width) wrap.style.width = `${width}px`;
  wrap.innerHTML = html;
  UI.appendChild(wrap);
  return wrap;
}
// Place a .ui-item: authored at world size, top-left at world (wx, wy) under camera c at depth z; extra CSS transform appended.
export function place(el, c, wx, wy, z = 1, extra = '', opacity = 1) {
  el.style.visibility = 'visible';
  el.style.transform = domTransform(c, wx, wy, z, extra);
  el.style.opacity = opacity.toFixed(3);
}
