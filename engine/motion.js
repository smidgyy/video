// Deterministic motion engine.
// Every value is a pure function of time. No timers, no rAF, no Date, no Math.random,
// no CSS transitions, no state carried between frames. window.seek(t) is the only clock.

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, k) => a + (b - a) * k;
export const invLerp = (a, b, x) => (b === a ? (x >= b ? 1 : 0) : clamp((x - a) / (b - a)));
export const mix = (a, b, k) => (Array.isArray(a) ? a.map((v, i) => lerp(v, b[i], k)) : lerp(a, b, k));

// ---------- easing ----------
export function cubicBezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (t) => ((ax * t + bx) * t + cx) * t;
  const sy = (t) => ((ay * t + by) * t + cy) * t;
  const dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const e = sx(t) - x, d = dx(t);
      if (Math.abs(e) < 1e-6) break;
      if (Math.abs(d) < 1e-6) break;
      t -= e / d;
    }
    let lo = 0, hi = 1;
    for (let i = 0; i < 20 && Math.abs(sx(t) - x) > 1e-6; i++) {
      if (sx(t) < x) lo = t; else hi = t;
      t = (lo + hi) / 2;
    }
    return sy(t);
  };
}
export const ease = {
  linear: (x) => x,
  // tryvoice.fun tokens: --ease and --ease-in-out
  voice: cubicBezier(0.2, 0.8, 0.2, 1),
  voiceInOut: cubicBezier(0.65, 0, 0.35, 1),
  outExpo: (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)),
  inExpo: (x) => (x <= 0 ? 0 : Math.pow(2, 10 * x - 10)),
  outCubic: (x) => 1 - Math.pow(1 - x, 3),
  inCubic: (x) => x * x * x,
  inOutCubic: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  outQuart: (x) => 1 - Math.pow(1 - x, 4),
  inQuart: (x) => x * x * x * x,
  inOutQuart: (x) => (x < 0.5 ? 8 * x ** 4 : 1 - Math.pow(-2 * x + 2, 4) / 2),
  outQuint: (x) => 1 - Math.pow(1 - x, 5),
  inOutExpo: (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2),
};

// Closed-form damped spring step response (0 -> 1). Pure: evaluated analytically at t seconds.
// stiffness k, damping c, mass m — same parameterisation as common spring libraries.
export function spring(t, { k = 170, c = 26, m = 1, v0 = 0 } = {}) {
  if (t <= 0) return 0;
  const w0 = Math.sqrt(k / m);
  const zeta = c / (2 * Math.sqrt(k * m));
  const x0 = -1; // displacement from target
  if (zeta < 1) {
    const wd = w0 * Math.sqrt(1 - zeta * zeta);
    const A = x0, B = (v0 + zeta * w0 * x0) / wd;
    return 1 + Math.exp(-zeta * w0 * t) * (A * Math.cos(wd * t) + B * Math.sin(wd * t));
  }
  if (zeta === 1) return 1 + Math.exp(-w0 * t) * (x0 + (v0 + w0 * x0) * t);
  const r1 = -w0 * (zeta - Math.sqrt(zeta * zeta - 1));
  const r2 = -w0 * (zeta + Math.sqrt(zeta * zeta - 1));
  const C2 = (v0 - r1 * x0) / (r2 - r1), C1 = x0 - C2;
  return 1 + C1 * Math.exp(r1 * t) + C2 * Math.exp(r2 * t);
}
// Named spring presets (weight + follow-through without "bouncy UI").
export const springs = {
  snap: { k: 420, c: 38 },   // UI controls: decisive, ~3% overshoot
  soft: { k: 170, c: 24 },   // panels: gentle overshoot, settles ~0.45s
  heavy: { k: 120, c: 22 },  // large cards / camera: weight, slight follow-through
  type: { k: 300, c: 30 },   // kinetic type rise
  firm: { k: 260, c: 34 },   // near-critically damped, no visible overshoot
};
export const sp = (t, t0, preset = springs.soft) => spring(t - t0, preset);

// ---------- keyframe tracks ----------
// kf(t, [[t0, v0], [t1, v1, easeFn], ...]) — ease on a key applies to the segment arriving at it.
export function kf(t, keys) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1, e] = keys[i];
    const [t0, v0] = keys[i - 1];
    if (t <= t1) {
      const k = (e || ease.voice)(invLerp(t0, t1, t));
      return mix(v0, v1, k);
    }
  }
  return keys[keys.length - 1][1];
}
// Progress through a window with an easing.
export const prog = (t, a, b, e = ease.voice) => e(invLerp(a, b, t));
// 1 inside [a,b] with eased in/out ramps of length r.
export function window01(t, a, b, rin = 0.2, rout = 0.2, ein = ease.voice, eout = ease.inCubic) {
  if (t < a || t > b) return 0;
  const i = rin > 0 ? ein(invLerp(a, a + rin, t)) : 1;
  const o = rout > 0 ? 1 - eout(invLerp(b - rout, b, t)) : 1;
  return Math.min(i, o);
}

// ---------- seeded randomness ----------
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// Stateless hash noise for per-frame deterministic jitter.
export function hash01(n) {
  let x = Math.imul((n | 0) ^ 0x9e3779b9, 0x85ebca6b);
  x ^= x >>> 13; x = Math.imul(x, 0xc2b2ae35); x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}
// Smooth 1D value noise, deterministic.
export function noise1(x, seed = 0) {
  const i = Math.floor(x), f = x - i;
  const a = hash01(i * 374761393 + seed * 668265263), b = hash01((i + 1) * 374761393 + seed * 668265263);
  const u = f * f * (3 - 2 * f);
  return lerp(a, b, u) * 2 - 1;
}

// ---------- text helpers ----------
export const typed = (str, t, t0, cps = 40) => str.slice(0, clamp(Math.floor((t - t0) * cps), 0, str.length));
export function countUp(t, t0, t1, from, to, e = ease.outCubic) { return lerp(from, to, e(invLerp(t0, t1, t))); }

// ---------- DOM writing ----------
// Writes are idempotent: the same t always produces the same style string.
export function css(el, props) {
  if (!el) return;
  for (const k in props) {
    const v = props[k];
    if (k.startsWith('--')) el.style.setProperty(k, v);
    else el.style[k] = v;
  }
}
export const px = (v) => `${v.toFixed(2)}px`;
export function tf({ x = 0, y = 0, z = 0, s = 1, sx, sy, rx = 0, ry = 0, rz = 0, persp } = {}) {
  const p = persp ? `perspective(${persp}px) ` : '';
  const scale = sx !== undefined || sy !== undefined ? `scale(${(sx ?? s).toFixed(4)}, ${(sy ?? s).toFixed(4)})` : `scale(${s.toFixed(4)})`;
  const zz = z ? ` translateZ(${z.toFixed(2)}px)` : '';
  return `${p}translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)${zz} rotateX(${rx.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg) rotate(${rz.toFixed(3)}deg) ${scale}`;
}
// Explicit display value (an empty string would fall back to stylesheet defaults such as display:none).
export function show(el, on) { if (el) el.style.display = on ? (el.dataset.display || 'block') : 'none'; }
