// UNIT G·14 · ELEVATION A — the door wall, seen from the window side (the street window is behind the camera).
// Shots: S4 absence · S5 Voice at the door · S6 "One coin. One X Manager." · S7 a brain · S9 boundaries · S10 a budget.
//
// World units: 1 = 1 mm. x grows right, y grows DOWN; the wall/floor line is y = 0, so the wall is y < 0.
// δ = mm in front of the wall plane (toward the lens). A frontal camera C.cam(x, y, zoom) stands D = F/zoom from the wall,
// so a plane δ mm off the wall sits at C.apply depth z = (D − δ)/D. The floor is drawn per row in true perspective from an
// eye height (lens-shift model: the eye only changes floor foreshortening, frontal planes stay orthographic).
//
// Light model (as S12): albedo → × irradiance (moon ambient + the patch through the street window + Voice's hall light)
// → emissive (frosted glass, the line under the door, the hall seen through the gap). Real UI sits in #ui and gets the
// same irradiance on #mul, clipped to its own shape.
import * as C from '../core.js';
import { glassWear, paperSlip, dymo, fingerprint, valueNoise, fbm } from '../materials.js';
import { roundRect } from './facade.js';
const { clamp, lerp, invLerp, ease, spring, b, W, H } = C;

const F = 2380;                                    // focal length (screen px): D = F / zoom
const VOLT = '#d4ff3f', INK = '#0b0f02';
const HALL = '#e4f2b4';                            // Voice's hall light: volt-white, reads volt on plaster
const MOON = '#8fa3ad';

// ---------------------------------------------------------------- the set (mm)
const DOOR = { x0: 0, x1: 900, top: -2050, gap: 9 };
const GLASS = { x0: 100, x1: 800, top: -1850, bot: -1110 };
const ARCH = 64, SKIRT = 96;
const SW = { x: 1450, y: -1027, s: 86 };                        // the room's light switch (it says "go" in S11)
const PLATE = { x: 1560, y: -1487, w: 460, h: 797, bez: 24 };  // permissions panel at 1 mm per CSS px
const METER = { x: 1610, y: -2400, w: 340, h: 268 };           // utility meter box, mounted high above the plate
const MW = [{ x: 29, y: 26, w: 282, h: 80, sy: 132 }, { x: 29, y: 132, w: 282, h: 80, sy: 453 }]; // windows (box-local) → field top in the panel
const TILE = { x: 520, y: -1716, s: 210 };                      // Voice's lamp, behind the glass (centre, size)
// Panes (model cards at 1.5 mm per CSS px). δ = mean distance off the wall; lean = in-plane tilt (deg) about the bottom corner.
const PANES = [
  { id: 'luna', x: 2328, d: 380, lean: 5.0 },
  { id: 'sol', x: 2835, d: 80, lean: -3.6 },
  { id: 'astra', x: 3360, d: 80, lean: 4.4 },
];
const PANE_S = 1.5, CARD_W = 324, CARD_H = 496;
const DY = {
  brain: { x: 2219, y: -908, a: -0.6, shot: 's07-brain', t0: 14.5, t1: 15 },
  bound: { x: 1386, y: -1232, a: 0.9, shot: 's09-bounds', t0: 18.75, t1: 19, stack: true },
  budget: { x: 1608, y: -2104, a: -0.8, shot: 's10-budget', t0: 20.5, t1: 21 },
};

let T = {};
let U = {};

// ---------------------------------------------------------------- textures (load time)
function plasterTile(N, seed) {
  const c = C.canvas(N, N), g = C.ctx2(c), img = g.createImageData(N, N), d = img.data;
  const nL = valueNoise(seed, 4), nM = valueNoise(seed + 3, 16), nF = valueNoise(seed + 5, N / 4), nS = valueNoise(seed + 9, N / 2);
  const R = 190, G = 186, B = 177;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const u = x / N, v = y / N;
    const val = 1 + (fbm(nL, u * 4, v * 4, 3) - 0.5) * 0.07 + (fbm(nM, u * 16, v * 16, 3) - 0.5) * 0.06
      + (nF(x / 4, y / 4) - 0.5) * 0.05 + (nS(x / 2, y / 2) - 0.5) * 0.06;
    const i = (y * N + x) * 4; d[i] = R * val; d[i + 1] = G * val; d[i + 2] = B * val; d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const r = C.rng(seed + 1);
  for (let i = 0; i < 46; i++) { // trowel arcs (2%), wrapped so the tile stays seamless
    const x = r() * N, y = r() * N, rad = 160 + r() * 420, a0 = r() * Math.PI * 2, da = 0.4 + r() * 0.6, lw = 20 + r() * 34;
    g.strokeStyle = `rgba(${r() < 0.5 ? '255,255,255' : '0,0,0'},0.025)`; g.lineWidth = lw;
    for (const ox of [-N, 0, N]) for (const oy of [-N, 0, N]) { g.beginPath(); g.arc(x + ox, y + oy, rad, a0, a0 + da); g.stroke(); }
  }
  for (let i = 0; i < 900; i++) { // sand grains and pores
    const x = r() * N, y = r() * N;
    g.fillStyle = r() < 0.6 ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.10)'; g.fillRect(x, y, 1 + (r() < 0.3), 1);
  }
  return c;
}
function downscale(src, k) {
  const c = C.canvas(src.width * k, src.height * k), g = C.ctx2(c);
  g.imageSmoothingQuality = 'high'; g.drawImage(src, 0, 0, c.width, c.height); return c;
}
function floorTile(N, seed) { // polished concrete, 2 mm per px, tileable
  const c = C.canvas(N, N), g = C.ctx2(c), img = g.createImageData(N, N), d = img.data;
  const nL = valueNoise(seed, 4), nM = valueNoise(seed + 2, 32), nF = valueNoise(seed + 4, N / 2);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const u = x / N, v = y / N;
    const cloud = fbm(nL, u * 4, v * 4, 4) - 0.5, mid = fbm(nM, u * 32, v * 32, 2) - 0.5, f = nF(x / 2, y / 2) - 0.5;
    const val = 1 + cloud * 0.16 + mid * 0.07 + f * 0.10;
    const i = (y * N + x) * 4; d[i] = 116 * val; d[i + 1] = 116 * val; d[i + 2] = 113 * val; d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const r = C.rng(seed + 9);
  for (let i = 0; i < 2600; i++) { const s = 1 + (r() < 0.25); g.fillStyle = `rgba(${r() < 0.5 ? '230,230,225' : '30,30,28'},${(0.10 + r() * 0.22).toFixed(3)})`; g.fillRect(r() * N, r() * N, s, s); }
  for (let i = 0; i < 26; i++) { // scratches
    let x = r() * N, y = r() * N; const a = r() * Math.PI, l = 20 + r() * 90;
    g.strokeStyle = 'rgba(220,220,215,0.07)'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(0, 0, 2, N); g.fillStyle = 'rgba(255,255,255,0.10)'; g.fillRect(2, 0, 1, N);   // saw-cut joint
  return c;
}
function doorLeaf() { // painted timber, 1 px = 1 mm, the glass cut out
  const w = DOOR.x1 - DOOR.x0, h = -DOOR.top, c = C.canvas(w, h), g = C.ctx2(c), img = g.createImageData(w, h), d = img.data;
  const n = valueNoise(1421, 64), n2 = valueNoise(1422, 128);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const v = 1 + (n(x / 3, y / 90) - 0.5) * 0.08 + (n2(x / 1.5, y / 1.5) - 0.5) * 0.05 + (fbm(n, x / 200, y / 200, 3) - 0.5) * 0.06;
    const i = (y * w + x) * 4; d[i] = 48 * v; d[i + 1] = 50 * v; d[i + 2] = 54 * v; d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const gy = (yy) => h + yy; // world y → texture y
  // glass bead moulding around the opening, then cut the opening
  const gx0 = GLASS.x0, gx1 = GLASS.x1, gt = gy(GLASS.top), gb = gy(GLASS.bot);
  g.fillStyle = 'rgba(255,255,255,0.10)'; g.fillRect(gx0 - 18, gt - 18, gx1 - gx0 + 36, 4); g.fillRect(gx0 - 18, gt - 18, 4, gb - gt + 36);
  g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(gx0 - 18, gb + 14, gx1 - gx0 + 36, 4); g.fillRect(gx1 + 14, gt - 18, 4, gb - gt + 36);
  g.fillStyle = 'rgba(0,0,0,0.30)'; g.fillRect(gx0 - 4, gt - 4, gx1 - gx0 + 8, 4); g.fillRect(gx0 - 4, gt - 4, 4, gb - gt + 8);
  // lower raised panel
  const px0 = 100, px1 = 800, pt = gy(-1000), pb = gy(-160);
  g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(px0, pt, px1 - px0, 5); g.fillRect(px0, pt, 5, pb - pt);
  g.fillStyle = 'rgba(0,0,0,0.38)'; g.fillRect(px0, pb - 5, px1 - px0, 5); g.fillRect(px1 - 5, pt, 5, pb - pt);
  g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(px0 + 40, pt + 40, px1 - px0 - 80, 3); g.fillRect(px0 + 40, pt + 40, 3, pb - pt - 80);
  g.fillStyle = 'rgba(255,255,255,0.05)'; g.fillRect(px0 + 40, pb - 43, px1 - px0 - 80, 3); g.fillRect(px1 - 43, pt + 40, 3, pb - pt - 80);
  // kick scuffs at the foot, a hand-polished halo round the handle
  const r = C.rng(1423);
  for (let i = 0; i < 30; i++) { g.strokeStyle = `rgba(0,0,0,${(0.08 + r() * 0.12).toFixed(3)})`; g.lineWidth = 1 + r() * 2; const x = 80 + r() * 700, y = h - 30 - r() * 110; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 10 + r() * 40, y + (r() - 0.5) * 6); g.stroke(); }
  const hg = g.createRadialGradient(70, gy(-1020), 0, 70, gy(-1020), 120);
  hg.addColorStop(0, 'rgba(255,255,255,0.08)'); hg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = hg; g.fillRect(0, gy(-1150), 220, 260);
  g.clearRect(gx0, gt, gx1 - gx0, gb - gt);
  return c;
}
function frostTile(w, h, seed) { // transmission mottling of acid-etched glass (1 px = 1 mm), mid-grey = neutral
  const c = C.canvas(w, h), g = C.ctx2(c), img = g.createImageData(w, h), d = img.data;
  const n = valueNoise(seed, 64), n2 = valueNoise(seed + 1, 128);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const v = 0.93 + (fbm(n, x / 60, y / 60, 3) - 0.5) * 0.14 + (n2(x / 1.4, y / 1.4) - 0.5) * 0.10;
    const i = (y * w + x) * 4; d[i] = d[i + 1] = d[i + 2] = clamp(v, 0, 1) * 255; d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return c;
}
function softRect(w, h, blur, color = '#000') { // pre-blurred soft rectangle (shadows)
  const p = blur * 2, c = C.canvas(w + p * 2, h + p * 2), g = C.ctx2(c);
  g.filter = `blur(${blur}px)`; g.fillStyle = color; g.fillRect(p, p, w, h); g.filter = 'none'; c.pad = p; return c;
}

// ---------------------------------------------------------------- real UI
function splitCards(wrapGrid) {
  const cards = [...wrapGrid.querySelectorAll('.model-card')];
  const out = cards.map((card) => {
    const w = document.createElement('div'); w.className = 'ui-item ua-pane'; w.style.width = `${CARD_W}px`;
    const grid = document.createElement('div'); grid.className = 'model-grid'; grid.appendChild(card); w.appendChild(grid);
    C.UI.appendChild(w); return { wrap: w, card };
  });
  wrapGrid.remove();
  return out;
}
const CHECK_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>';

export async function init() {
  // anisotropic motion-blur filters for the DOM during whips (stdDeviation set per frame, in each element's own px)
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '0'); svg.setAttribute('height', '0'); svg.style.position = 'absolute';
  svg.innerHTML = ['uaB0', 'uaB1', 'uaB2', 'uaB3', 'uaB4', 'uaB5'].map((id) => `<filter id="${id}" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="0 0"/></filter>`).join('');
  document.body.appendChild(svg);
  U.blurF = [...svg.querySelectorAll('feGaussianBlur')];

  const t0 = C.rng(1); void t0;
  T.pl = [plasterTile(2048, 1404)];
  T.pl.push(downscale(T.pl[0], 0.5), downscale(T.pl[0], 0.25), downscale(T.pl[0], 0.125));
  T.plTexel = [0.5, 1, 2, 4];
  T.plPat = T.pl.map((c) => C.ctx2(C.canvas(2, 2)).createPattern(c, 'repeat'));
  // macro variation (soft-light, 25 mm per px) across the whole elevation: age, damp near the floor, a grimy zone near the door
  {
    const w = 400, h = 130, c = C.canvas(w, h), g = C.ctx2(c), img = g.createImageData(w, h), d = img.data, n = valueNoise(1430, 32);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const wy = -3250 + y * 25, wx = -3500 + x * 25;
      let v = 128 + (fbm(n, x / 14, y / 14, 4) - 0.5) * 34;
      if (wy > -260) v -= 18 * (1 - (-wy) / 260);                               // damp/scuff band at the foot of the wall
      v -= 10 * Math.exp(-(((wx - 1000) / 900) ** 2) - (((wy + 900) / 700) ** 2)); // traffic grime beside the door
      const i = (y * w + x) * 4; d[i] = d[i + 1] = d[i + 2] = clamp(v, 0, 255); d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    T.macro = C.blurred(c, 2);
  }
  T.floor = floorTile(1024, 1440);
  T.door = doorLeaf();
  T.frost = frostTile(GLASS.x1 - GLASS.x0, GLASS.bot - GLASS.top, 1450);
  T.wear = glassWear({ w: GLASS.x1 - GLASS.x0, h: GLASS.bot - GLASS.top, seed: 1412, specks: 420, rings: 60, bubble: true });
  T.mwear = glassWear({ w: METER.w, h: METER.h, seed: 1413, specks: 260, rings: 34, drip: false });
  T.fp = fingerprint(11, 30);
  T.slips = [['@orbitonsolana', '9 d ago'], ['@orbitonsolana', '6 d ago'], ['@orbitonsolana', '4 d ago'], ['@orbitonsolana', '2 d ago'], ['@orbitonsolana', 'now']]
    .map((l, i) => paperSlip(l, { w: 330, h: 120, seed: 1406 + i }));
  T.cardShadow = softRect(150, 210, 7);
  T.tapeShadow = softRect(90, 26, 4);
  // Dymo (created at 1.25× for crispness; drawn at cap height 64 px on screen)
  const dcap = 80;
  T.dy = {
    giveA: dymo('GIVE IT', { tape: 'black', capH: dcap, seed: 1407 }),
    giveB: dymo('GIVE IT', { tape: 'black', capH: dcap, seed: 1517 }),
    giveC: dymo('GIVE IT', { tape: 'black', capH: dcap, seed: 1627 }),
    brain: dymo('A BRAIN.', { tape: 'volt', capH: dcap, seed: 1407 }),
    bound: dymo('BOUNDARIES.', { tape: 'volt', capH: dcap, seed: 1407 }),
    budget: dymo('A BUDGET.', { tape: 'volt', capH: dcap, seed: 1407 }),
  };
  // door vinyl (drawn at 70 mm type ≈ 100 px on screen in S6)
  T.oneCoin = C.textSprite('One coin.', { size: 200, weight: 700, color: INK, tracking: -0.04, pad: 30 });
  T.oneX = C.textSprite('One X Manager.', { size: 200, weight: 700, color: '#ffffff', tracking: -0.04, pad: 30 });
  T.brow = C.textSprite('X MANAGER · @orbitonsolana', { mono: true, size: 44, weight: 500, color: INK, tracking: 0.16, pad: 10 });
  // meter rail engraving
  T.engL = C.textSprite('A CEILING, NEVER A QUOTA.', { mono: true, size: 40, weight: 500, color: '#ffffff', tracking: 0.14, pad: 8 });
  T.engD = C.textSprite('A CEILING, NEVER A QUOTA.', { mono: true, size: 40, weight: 500, color: '#000000', tracking: 0.14, pad: 8 });
  T.tileOff = C.canvas(420, 420);

  // ---- UI
  const grid = await C.fragment('model-grid', { width: 1000 });
  const cards = splitCards(grid);
  U.panes = PANES.map((p, i) => ({ ...p, ...cards[i] }));
  U.checkSel = U.panes[1].card.querySelector('.lucide-check.positive');
  U.rowLuna = U.panes[0].card.querySelector('.row.between');
  U.rowSol = U.panes[1].card.querySelector('.row.between');

  U.perm = await C.fragment('permissions', { width: PLATE.w });
  U.permCards = [...U.perm.querySelectorAll('.permission-card')];
  U.limits = [await C.fragment('limits', { width: 640 }), await C.fragment('limits', { width: 640 })];
  U.limits.forEach((el, i) => {
    const sel = el.querySelector('select'); sel.selectedIndex = 2;         // "Busy · up to 15 actions"
    const m = MW[i]; const top = m.sy, left = 31;
    el.style.clipPath = `inset(${top}px ${640 - left - m.w}px ${700 - top - m.h}px ${left}px)`;
  });
  U.daily = U.limits[0].querySelector('input.input');
}

// ---------------------------------------------------------------- state (pure functions of t)
const OB = (t) => C.obAt(t);
function moonLevel(t) { // hidden cut from black: moonlight fades up over 0.3 s; a cloud breathes it ±3 %
  const up = ease.inOutCubic(clamp((t - b(8.5)) / 0.3));
  const cloud = 1 - 0.03 * Math.sin(Math.PI * clamp((t - b(8.95)) / 0.95)) * (t < b(9.9) ? 1 : 0);
  return up * cloud;
}
const LINE_T = b(9.85);
function bloomLevel(t) { // Voice's hall light through the frosted glass
  if (t < b(10)) return 0;
  const rise = spring(t - b(10), { k: 90, c: 12 });                  // ~0.4 s, small overshoot
  let v = 0.32 * rise;
  v += 0.10 * ease.inOutCubic(invLerp(b(10.6), b(11.8), t));         // the lamp walks closer
  if (t >= b(12) - 0.04) v += 0.55 * spring(t - (b(12) - 0.04), { k: 140, c: 14 }); // reaches the glass: bloom peak
  return v;
}
function lampNear(t) { return ease.inCubic(invLerp(b(10), b(11.95), t)); } // 0 far down the hall → 1 at the glass
function doorAngle(t) { // opens inward 22°, hinged on the right; overshoots to ~26° and settles (a closer arm)
  if (t < b(13.5)) return 0;
  return 22 * spring(t - b(13.5), { k: 60, c: 7.5 });
}
function doorShudder(t) {
  let s = 0;
  for (const tk of [b(12.5), b(12.75)]) if (t >= tk) s += 1.4 * Math.exp(-(t - tk) / 0.05) * Math.sin((t - tk) * 2 * Math.PI * 28);
  return s;
}
function hallOpen(t) { return clamp(doorAngle(t) / 22); } // how much hall light is in the room
function lunaPose(t) { // the pick: lift, straighten 5° → −0.6° → 0°, slide forward into the light
  if (t < b(14)) return { lean: PANES[0].lean, lift: 0, fwd: 0 };
  const u = t - b(14);
  const s = spring(u, { k: 150, c: 13 });
  const lift = 4 * Math.sin(Math.PI * clamp(u / 0.32)) * (u < 0.32 ? 1 : 0);
  return { lean: lerp(PANES[0].lean, 0, s), lift, fwd: 34 * ease.outCubic(clamp(u / 0.4)) };
}
function toggleState(t, i) { const tt = [b(18.25), b(18.375), b(18.5)][i]; return t >= tt ? (t - tt) : -1; }
function dailyValue(t) {
  const t0 = C.EV.odometer || b(20.25), d = 0.5;
  return 5 * (1 - Math.pow(1 - clamp((t - t0) / d), 3));
}
function slap(t, t0) { // Dymo slap: 0 before; impact squash then settle (seconds since)
  if (t < t0) return null;
  const u = t - t0;
  return { u, s: 1 + 0.035 * Math.exp(-u / 0.03), sh: 1 + 2.5 * Math.exp(-u / 0.04) };
}

// ---------------------------------------------------------------- cameras
const CAM4 = { x: -760, y: -925, zoom: 0.42, eye: 1250 };
const CAM6 = { x: 450, y: -1480, zoom: 1.43 };
const CAM7 = { x: 2905, y: -513, zoom: 1.19, eye: 513 };
const CAM9 = { x: 1693, y: -1100, zoom: 2.95, eye: 1100 };
const CAM10 = { x: 1780, y: -2266, zoom: 3.2, eye: 1100 };
const lerpCam = (a, c, k) => ({ x: lerp(a.x, c.x, k), y: lerp(a.y, c.y, k), zoom: Math.exp(lerp(Math.log(a.zoom), Math.log(c.zoom), k)), eye: lerp(a.eye ?? 1200, c.eye ?? 1200, k) });

function camAt(t) {
  const ob = OB(t);
  if (ob < 10) return { ...CAM4 };
  if (ob < 12) return lerpCam(CAM4, { ...CAM6, eye: 1250 }, ease.voiceInOut(invLerp(b(10), b(12), t)));
  if (ob < 14) {
    const c6 = { ...CAM6, eye: 1250, zoom: CAM6.zoom * (1 + 0.006 * invLerp(b(12), b(13.6), t)) };
    const c7 = cam7(b(14));
    if (t < b(13.66)) return c6;
    const k = ease.inOutCubic(invLerp(b(13.66), b(13.92), t));
    return lerpCam(c6, c7, k);
  }
  if (ob < 16) {
    const c = cam7(t);
    if (t > b(15.82)) { const k = ease.inCubic(invLerp(b(15.82), b(16), t)); c.y += 900 * k; }  // whip-tilt down to the desk
    return c;
  }
  if (ob < 20) {
    const k = ease.outCubic(invLerp(b(18), b(18.16), t));                                       // arrive from the desk below
    const c = { ...CAM9, zoom: CAM9.zoom * (1 + 0.04 * ease.inOutCubic(invLerp(b(18.1), b(19.9), t))) };
    c.y += 520 * (1 - k);
    if (t > b(19.8)) { const q = ease.inCubic(invLerp(b(19.8), b(20), t)); c.y = lerp(c.y, CAM10.y + 420, q); c.x = lerp(c.x, CAM10.x, q); }
    return c;
  }
  const k = ease.outCubic(invLerp(b(20), b(20.16), t));
  const c = { ...CAM10 };
  c.y += 420 * (1 - k);
  c.zoom *= 1 + 0.01 * invLerp(b(20.2), b(21.8), t);
  if (t > b(21.82)) { const q = ease.inCubic(invLerp(b(21.82), b(22), t)); c.y += 1100 * q; }   // whip-tilt down to the desk
  return c;
}
function cam7(t) { // slow truck right → left (wall 1.0×, panes faster)
  const k = ease.outCubic(invLerp(b(13.9), b(16), t));
  return { ...CAM7, x: CAM7.x + 28 - 46 * k };
}
// screen velocity of the wall plane (px per frame) — drives motion blur on whips
function camVel(t) {
  const a = camAt(t - 1 / 120), c = camAt(t + 1 / 120);
  const pa = C.toScreen(a, 0, 0), pc = C.toScreen(c, 0, 0);
  const ca = C.toScreen(a, a.x, a.y), cc = C.toScreen(c, c.x, c.y); void ca; void cc;
  return [(pc[0] - pa[0]), (pc[1] - pa[1]), Math.abs(Math.log(c.zoom / a.zoom))];
}

// ---------------------------------------------------------------- projection helpers
const Dof = (cam) => F / cam.zoom;
const zOf = (cam, d) => (Dof(cam) - d) / Dof(cam);
function floorPt(cam, x, d) { // floor point (x, δ) → screen
  const D = Dof(cam), k = F / (D - d), eye = cam.eye ?? 1200;
  const yh = H / 2 + (-eye - cam.y) * cam.zoom;
  return [W / 2 + (x - cam.x) * k, yh + eye * k];
}
function floorAffine(g, cam, x, d, rot) { // local frame on the floor at (x, δ): +u along x, +v toward the lens (mm)
  const D = Dof(cam), k = F / (D - d), eye = cam.eye ?? 1200, ky = k * eye / (D - d);
  const [sx, sy] = floorPt(cam, x, d), c = Math.cos(rot), s = Math.sin(rot);
  g.setTransform(k * c, ky * s, -k * s, ky * c, sx, sy);
}
const visible = (cam, x0, y0, x1, y1, z = 1) => {
  const [a, bq] = C.toScreen(cam, x0, y0, z), [c, d] = C.toScreen(cam, x1, y1, z);
  return c > -40 && a < W + 40 && d > -40 && bq < H + 40;
};

// ---------------------------------------------------------------- albedo
function drawWall(g, cam) {
  const Z = cam.zoom, x0 = cam.x - W / 2 / Z - 10, x1 = cam.x + W / 2 / Z + 10, y0 = cam.y - H / 2 / Z - 10, y1 = Math.min(0, cam.y + H / 2 / Z + 10);
  if (y1 <= y0) return;
  C.apply(g, cam);
  // plaster at the right level of detail (cross-fade between LODs so a push never pops)
  const want = Math.log2(1 / (0.5 * Z * 1.15));
  const l = clamp(want, 0, 3), li = Math.floor(l), lf = l - li;
  for (const [idx, a] of [[li, 1], [Math.min(3, li + 1), lf]]) {
    if (a <= 0.002) continue;
    const pat = T.plPat[idx]; pat.setTransform(new DOMMatrix().scale(T.plTexel[idx]));
    g.globalAlpha = a; g.fillStyle = pat; g.fillRect(x0, y0, x1 - x0, y1 - y0);
  }
  g.globalAlpha = 1;
  g.globalCompositeOperation = 'soft-light'; g.drawImage(T.macro, -3500, -3250, 400 * 25, 130 * 25); g.globalCompositeOperation = 'source-over';
  // grime round the light switch (fingers), old pin holes, a hairline crack above the door
  const fg = g.createRadialGradient(SW.x + 10, SW.y, 20, SW.x + 10, SW.y, 120);
  fg.addColorStop(0, 'rgba(60,54,44,0.20)'); fg.addColorStop(1, 'rgba(60,54,44,0)'); g.fillStyle = fg; g.fillRect(SW.x - 130, SW.y - 130, 260, 260);
  for (const [px, py] of [[1240, -1480], [1268, -1471], [2140, -1210], [2610, -1340], [3105, -1012]]) {
    g.fillStyle = 'rgba(0,0,0,0.5)'; g.beginPath(); g.arc(px, py, 1.3, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,0.3)'; g.beginPath(); g.arc(px + 0.6, py + 0.7, 0.9, 0, 3); g.fill();
  }
  g.strokeStyle = 'rgba(30,28,24,0.35)'; g.lineWidth = 0.7; g.beginPath();
  { const r = C.rng(1431); let x = 760, y = -2114; g.moveTo(x, y); for (let i = 0; i < 70; i++) { x += 3 + r() * 6; y -= 1 + r() * 5 - 2.4; g.lineTo(x, y); } }
  g.stroke();
  // skirting: painted board standing 15 mm proud; top face catches light, contact line on the wall
  g.fillStyle = '#3a3b3e'; g.fillRect(x0, -SKIRT, x1 - x0, SKIRT);
  g.fillStyle = 'rgba(255,255,255,0.10)'; g.fillRect(x0, -SKIRT, x1 - x0, 4);
  g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(x0, -SKIRT - 3, x1 - x0, 3);
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x0, -4, x1 - x0, 4);
}
function drawFloor(g, cam) {
  const eye = cam.eye ?? 1200, D = Dof(cam);
  const yh = H / 2 + (-eye - cam.y) * cam.zoom, base = yh + eye * cam.zoom;
  if (base >= H) return;
  g.setTransform(1, 0, 0, 1, 0, 0);
  const tw = T.floor.width, tx = 2; // 2 mm per texel
  for (let y = Math.max(0, Math.floor(base)); y < H; y++) {
    const k = (y + 0.5 - yh) / eye;          // = F / (D − δ)
    const d = D - F / k;
    if (d < 0) continue;
    const v = ((d / tx) % tw + tw) % tw;
    const wx0 = cam.x - W / 2 / k;
    let sx = ((wx0 / tx) % tw + tw) % tw;
    const sw = W / k / tx;
    if (sx + sw <= tw) g.drawImage(T.floor, sx, v, sw, 1, 0, y, W, 1);
    else { const a = tw - sx; g.drawImage(T.floor, sx, v, a, 1, 0, y, a * k * tx, 1); g.drawImage(T.floor, 0, v, Math.min(tw, sw - a), 1, a * k * tx, y, W - a * k * tx, 1); }
  }
}
// The door: architrave, the leaf (scaled about the hinge as it opens), the floor gap, handle.
function drawDoorAlbedo(g, cam, t, st) {
  if (!visible(cam, DOOR.x0 - ARCH, DOOR.top - ARCH, DOOR.x1 + ARCH, 0)) return;
  C.apply(g, cam);
  // opening behind the leaf (seen only through the gap when open): the hall, drawn emissive later
  g.fillStyle = '#060606'; g.fillRect(DOOR.x0, DOOR.top, DOOR.x1 - DOOR.x0, -DOOR.top);
  // architrave
  g.fillStyle = '#3b3c40';
  g.fillRect(DOOR.x0 - ARCH, DOOR.top - ARCH, ARCH, -DOOR.top + ARCH); g.fillRect(DOOR.x1, DOOR.top - ARCH, ARCH, -DOOR.top + ARCH);
  g.fillRect(DOOR.x0 - ARCH, DOOR.top - ARCH, DOOR.x1 - DOOR.x0 + 2 * ARCH, ARCH);
  g.fillStyle = 'rgba(255,255,255,0.09)'; g.fillRect(DOOR.x0 - ARCH, DOOR.top - ARCH, 5, -DOOR.top + ARCH); g.fillRect(DOOR.x0 - ARCH, DOOR.top - ARCH, DOOR.x1 - DOOR.x0 + 2 * ARCH, 5); g.fillRect(DOOR.x1, DOOR.top - ARCH, 5, -DOOR.top + ARCH);
  g.fillStyle = 'rgba(0,0,0,0.40)'; g.fillRect(DOOR.x0 - 6, DOOR.top - 6, 6, -DOOR.top + 6); g.fillRect(DOOR.x1 + ARCH - 6, DOOR.top - ARCH, 6, -DOOR.top + ARCH); g.fillRect(DOOR.x0, DOOR.top - 6, DOOR.x1 - DOOR.x0, 6);
  // the leaf
  g.save(); leafTransform(g, cam, st);
  g.drawImage(T.door, 0, DOOR.top);
  g.fillStyle = '#121416'; g.fillRect(GLASS.x0, GLASS.top, GLASS.x1 - GLASS.x0, GLASS.bot - GLASS.top); // unlit frosted glass
  g.globalAlpha = 0.5; g.drawImage(T.frost, GLASS.x0, GLASS.top); g.globalAlpha = 1;
  g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(GLASS.x0, GLASS.top, GLASS.x1 - GLASS.x0, GLASS.bot - GLASS.top);
  // the leaf's latch edge thickness when open (Lambert: it faces the hall light)
  if (st.open > 0.001) { g.fillStyle = '#4a4c50'; g.fillRect(-46, DOOR.top, 46, -DOOR.top - DOOR.gap); }
  // lever handle: rose + lever, satin steel
  g.fillStyle = '#5c5e62'; g.beginPath(); g.arc(70, -1020, 27, 0, 7); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.22)'; g.beginPath(); g.arc(66, -1025, 20, Math.PI * 0.9, Math.PI * 1.6); g.lineWidth = 3; g.strokeStyle = 'rgba(255,255,255,0.25)'; g.stroke();
  g.fillStyle = '#6a6c70'; roundRect(g, 58, -1031, 150, 22, 10); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.28)'; g.fillRect(64, -1030, 138, 3);
  g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(64, -1012, 140, 3);
  g.fillStyle = '#2a2b2e'; g.fillRect(56, -960, 26, 40); g.fillStyle = '#0a0a0a'; g.fillRect(65, -948, 8, 18);   // key cylinder
  g.restore();
  // floor gap under the leaf
  g.fillStyle = '#040405'; g.fillRect(DOOR.x0, -DOOR.gap, DOOR.x1 - DOOR.x0, DOOR.gap);
}
function leafTransform(g, cam, st) { // scaleX about the hinge (x1) plus the key shudder
  C.apply(g, cam);
  g.translate(DOOR.x1 + st.shudder, 0); g.scale(st.k, 1); g.translate(-DOOR.x1, 0);
}
function drawSwitch(g, cam, t) {
  if (!visible(cam, SW.x - 60, SW.y - 60, SW.x + 60, SW.y + 60)) return;
  C.apply(g, cam);
  const s = SW.s, x = SW.x - s / 2, y = SW.y - s / 2;
  g.fillStyle = 'rgba(0,0,0,0.30)'; roundRect(g, x + 3, y + 4, s, s, 5); g.fill();   // contact shadow
  g.fillStyle = '#2b2c30'; roundRect(g, x, y, s, s, 5); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.10)'; g.fillRect(x + 3, y + 1, s - 6, 2); g.fillRect(x + 1, y + 3, 2, s - 6);
  g.fillStyle = 'rgba(0,0,0,0.40)'; g.fillRect(x + 3, y + s - 3, s - 6, 2); g.fillRect(x + s - 3, y + 3, 2, s - 6);
  // toggle lever (down = off until S11)
  g.fillStyle = '#18191b'; roundRect(g, SW.x - 9, SW.y - 16, 18, 32, 4); g.fill();
  g.fillStyle = '#4a4b4f'; roundRect(g, SW.x - 6, SW.y + 2, 12, 22, 5); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.3)'; g.fillRect(SW.x - 4, SW.y + 4, 8, 2);
  for (const sy of [y + 9, y + s - 9]) { g.fillStyle = '#4b4c50'; g.beginPath(); g.arc(SW.x, sy, 3.2, 0, 7); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.6)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(SW.x - 2.4, sy - 0.6); g.lineTo(SW.x + 2.4, sy + 0.6); g.stroke(); }
}
function drawPlateAlbedo(g, cam) {
  const P = PLATE, B = P.bez;
  if (!visible(cam, P.x - B - 40, P.y - B - 40, P.x + P.w + B + 60, P.y + P.h + B + 60)) return;
  C.apply(g, cam);
  // backing glass + graphite bezel, standing 18 mm proud
  g.fillStyle = '#26272b'; roundRect(g, P.x - B, P.y - B, P.w + 2 * B, P.h + 2 * B, 10); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(P.x - B + 4, P.y - B + 1, P.w + 2 * B - 8, 2); g.fillRect(P.x - B + 1, P.y - B + 4, 2, P.h + 2 * B - 8);
  g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(P.x - B + 4, P.y + P.h + B - 3, P.w + 2 * B - 8, 2); g.fillRect(P.x + P.w + B - 3, P.y - B + 4, 2, P.h + 2 * B - 8);
  g.fillStyle = '#0d0e10'; roundRect(g, P.x - 3, P.y - 3, P.w + 6, P.h + 6, 29); g.fill();
  // six screws, one turned 30° (the creator's)
  const screws = [[P.x - B / 2, P.y - B / 2, 12], [P.x + P.w + B / 2, P.y - B / 2, -8], [P.x - B / 2, P.y + P.h / 2, 30 + 60], [P.x + P.w + B / 2, P.y + P.h / 2, 4], [P.x - B / 2, P.y + P.h + B / 2, -14], [P.x + P.w + B / 2, P.y + P.h + B / 2, 9]];
  for (const [sx, sy, a] of screws) screw(g, sx, sy, 5.2, a);
}
function screw(g, x, y, r, a) {
  const gr = g.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
  gr.addColorStop(0, '#8d8f93'); gr.addColorStop(1, '#3d3e42');
  g.fillStyle = 'rgba(0,0,0,0.5)'; g.beginPath(); g.arc(x + 0.8, y + 1, r, 0, 7); g.fill();
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
  const c = Math.cos((a * Math.PI) / 180), s = Math.sin((a * Math.PI) / 180);
  g.strokeStyle = 'rgba(10,10,10,0.85)'; g.lineWidth = r * 0.32; g.beginPath(); g.moveTo(x - c * r * 0.8, y - s * r * 0.8); g.lineTo(x + c * r * 0.8, y + s * r * 0.8); g.stroke();
  g.strokeStyle = 'rgba(255,255,255,0.25)'; g.lineWidth = 0.5; g.beginPath(); g.moveTo(x - c * r * 0.8 + s * 0.6, y - s * r * 0.8 - c * 0.6); g.lineTo(x + c * r * 0.8 + s * 0.6, y + s * r * 0.8 - c * 0.6); g.stroke();
}
function drawMeterAlbedo(g, cam) {
  const M = METER;
  if (!visible(cam, M.x - 30, M.y - 30, M.x + M.w + 60, M.y + M.h + 60)) return;
  C.apply(g, cam);
  // a deep graphite box: side faces (light from lower left → left/bottom sides lit), front frame, the windows
  g.fillStyle = '#1d1e21'; g.fillRect(M.x + 10, M.y + 10, M.w, M.h);       // depth (seen as a right/bottom return)
  g.fillStyle = '#2f3034'; roundRect(g, M.x, M.y, M.w, M.h, 8); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.10)'; g.fillRect(M.x + 4, M.y + M.h - 3, M.w - 8, 2); g.fillRect(M.x + 1, M.y + 4, 2, M.h - 8);
  g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(M.x + 4, M.y + 1, M.w - 8, 2); g.fillRect(M.x + M.w - 3, M.y + 4, 2, M.h - 8);
  for (const m of MW) { // window reveals (the UI shows through; dark reveal edges)
    g.fillStyle = '#08090a'; roundRect(g, M.x + m.x - 4, M.y + m.y - 4, m.w + 8, m.h + 8, 6); g.fill();
  }
  // bottom rail: brushed band where the line is engraved
  g.fillStyle = '#35363a'; g.fillRect(M.x + 14, M.y + 222, M.w - 28, 32);
  g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(M.x + 14, M.y + 222, M.w - 28, 1);
  for (const [sx, sy, a] of [[M.x + 12, M.y + 12, 20], [M.x + M.w - 12, M.y + 12, -35], [M.x + 12, M.y + M.h - 12, 70], [M.x + M.w - 12, M.y + M.h - 12, 5]]) screw(g, sx, sy, 4.4, a);
}
// pane geometry → matrices (shared by the DOM, the canvas clip, the glass edge and the shadows)
function paneMatrix(cam, p, pose) {
  const d = p.d + (pose?.fwd || 0), z = zOf(cam, d), k = cam.zoom / z;
  const h = CARD_H * PANE_S, top = -h - (pose?.lift || 0);
  const [sx, sy] = C.toScreen(cam, p.x, top, z);
  const lean = pose ? pose.lean : p.lean;
  const m = new DOMMatrix().translate(sx, sy).scale(k * PANE_S).translate(0, CARD_H).rotate(lean).translate(0, -CARD_H);
  return { m, k: k * PANE_S, z, lean };
}
function drawPaneBacks(g, cam, t, st) {
  for (const p of st.panes) {
    const { m } = p.M;
    // cast shadow on the wall (the hall light comes from the lens-left; the pane stands off the wall)
    const wallShift = p.d * 0.55 + (p.pose?.fwd || 0) * 0.5;
    g.save(); g.setTransform(m.translate(wallShift / PANE_S * 0.55, 6 / PANE_S));
    g.fillStyle = `rgba(0,0,0,${(0.42 * st.hall).toFixed(3)})`; g.filter = `blur(${(10 + p.d * 0.05).toFixed(1)}px)`;
    roundRect(g, 0, 0, CARD_W, CARD_H, 28); g.fill(); g.filter = 'none'; g.restore();
    // the glass sheet itself (6 mm float glass, frosted): lit left edge, dark right edge, a little proud of the card
    g.save(); g.setTransform(m);
    g.fillStyle = '#1b1d1f'; roundRect(g, -3, -3, CARD_W + 6, CARD_H + 6, 30); g.fill();
    g.strokeStyle = 'rgba(190,205,170,0.55)'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(-2, CARD_H - 20); g.lineTo(-2, 22); g.arcTo(-2, -2, 22, -2, 26); g.lineTo(CARD_W * 0.6, -2); g.stroke();
    g.strokeStyle = 'rgba(0,0,0,0.6)'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(CARD_W + 2, 24); g.lineTo(CARD_W + 2, CARD_H); g.stroke();
    g.restore();
  }
}
function drawDymo(g, cam, t, key) {
  const D = DY[key];
  const sa = slap(t, b(D.t0)), sb = slap(t, b(D.t1));
  if (!sa) return;
  const giveTex = key === 'brain' ? T.dy.giveA : key === 'bound' ? T.dy.giveB : T.dy.giveC;
  const nounTex = T.dy[key];
  const scr = 64 / 80;                               // sprite px → screen px at the shot's own zoom
  const zoomRef = key === 'brain' ? CAM7.zoom : key === 'bound' ? CAM9.zoom : CAM10.zoom;
  const mm = scr / zoomRef;                          // sprite px → mm on the wall
  C.apply(g, cam);
  const put = (tex, x, y, a, s, sh, curl) => {
    const w = tex.width * mm, h = tex.height * mm;
    g.save(); g.translate(x + w / 2, y + h / 2); g.rotate((a * Math.PI) / 180); g.scale(s, s);
    g.globalAlpha = 0.45 / sh; g.drawImage(T.tapeShadow, -w / 2 - 2 * sh, -h / 2 + 1.5 * sh, w + 4 * sh, h + 2 * sh); g.globalAlpha = 1;
    g.drawImage(tex, -w / 2, -h / 2, w, h);
    if (curl > 0) { // free end lifting: a strip of the tape end catches less light and throws a shadow
      const cw = w * 0.16;
      g.fillStyle = `rgba(0,0,0,${(0.35 * curl).toFixed(3)})`; g.fillRect(w / 2 - cw, -h / 2, cw, h);
      g.fillStyle = `rgba(255,255,230,${(0.25 * curl).toFixed(3)})`; g.fillRect(w / 2 - cw, -h / 2, 1.2, h);
    }
    g.restore();
    return [w, h];
  };
  const [gw, gh] = put(giveTex, D.x, D.y, D.a, sa.s, sa.sh, 0);
  if (sb) {
    const curl = key === 'brain' ? clamp(1 - (t - b(15.25)) / 0.06) * clamp((t - b(D.t1)) / 0.08) : 0;
    if (D.stack) put(nounTex, D.x - 6, D.y + gh + 3, D.a - 1.4, sb.s, sb.sh, 0);
    else put(nounTex, D.x + gw + 10, D.y + 0.6 + (key === 'budget' ? -0.5 : 0), D.a + 0.7, sb.s, sb.sh, curl);
  }
}
function drawSlips(g, cam, t, st) {
  if (!visible(cam, -100, -100, 1100, 20)) return;
  // four old slips (seeded rotations; 6 d ago rests on 9 d ago, lifted by the paper's stiffness)
  const L = [
    { tex: 0, x: 240, d: 150, r: -0.22 }, { tex: 1, x: 300, d: 175, r: 0.14, lift: 3 },
    { tex: 2, x: 610, d: 110, r: 0.31 }, { tex: 3, x: 470, d: 250, r: -0.08 },
  ];
  // the fifth ("now") slides in under the door: fast, a friction stop 30 ms late, turns 3°
  const tn = b(9) + 0.03, ts = b(9) - 0.11;
  if (t >= ts) {
    const u = clamp((t - ts) / (tn - ts)), k = 1 - Math.pow(1 - u, 2.4);
    const turn = (3 * Math.PI) / 180 * ease.outCubic(clamp((t - tn + 0.03) / 0.09));
    L.push({ tex: 4, x: 400 + 30 * k, d: lerp(-90, 205, k), r: 0.05 + turn, now: true });
  }
  for (const s of L) {
    if (s.d < -45) continue;
    const tex = T.slips[s.tex], w = 150, h = 54;
    // contact shadow (soft, under the slip)
    floorAffine(g, cam, s.x, s.d + 6, s.r);
    g.globalAlpha = 0.5; g.drawImage(T.cardShadow, -w / 2 - 6, -h / 2 - 6, w + 12, h + 12); g.globalAlpha = 1;
    floorAffine(g, cam, s.x, s.d, s.r);
    if (s.lift) g.translate(0, -s.lift);
    g.save(); if (s.d < 0) { g.beginPath(); g.rect(-w, -s.d - 1, 3 * w, 4 * h); g.clip(); } // still half under the door
    g.drawImage(tex, -w / 2, -h / 2, w, h);
    g.restore();
  }
  st.slipList = L;
}

// ---------------------------------------------------------------- irradiance
const IRR = (() => { const c = C.canvas(W / 2, H / 2); return { c, g: C.ctx2(c) }; })();
function irrWorld(g, cam, z = 1) { const k = (cam.zoom / z) * 0.5; g.setTransform(k, 0, 0, k, W / 4 - cam.x * k, H / 4 - cam.y * k); }
function floorQuadIrr(g, cam, pts, fill) { // pts: [[x, δ], ...] on the floor
  g.setTransform(0.5, 0, 0, 0.5, 0, 0); g.fillStyle = fill; g.beginPath();
  pts.forEach(([x, d], i) => { const [sx, sy] = floorPt(cam, x, d); i ? g.lineTo(sx, sy) : g.moveTo(sx, sy); });
  g.closePath(); g.fill();
}
// the window behind the lens: bay c2 (Orbit's card taped inside) and c3 beyond the pier; 16 slats, moon from upper right
const PATCH = { x0: -950, x1: 650, top: -1280, skew: Math.tan((18 * Math.PI) / 180), dmax: 1300, slatFill: 0.62 };
function moonPatch(g, cam, I) {
  if (I <= 0.001) return;
  const P = PATCH, col = (a) => C.rgba(MOON, a);
  irrWorld(g, cam);
  for (const [ox, wbay] of [[0, 1], [-2250, 0.82]]) {
    // wall part: 9 slat gaps climbing the wall, skewed 18° (moves left as it rises)
    for (let i = 0; i < 9; i++) {
      const y0 = P.top * (i / 9), y1 = P.top * ((i + P.slatFill) / 9);
      const s0 = -y0 * P.skew, s1 = -y1 * P.skew;
      g.fillStyle = col(I * 0.55 * wbay); g.beginPath();
      g.moveTo(P.x0 + ox - s0, y0); g.lineTo(P.x1 + ox - s0, y0); g.lineTo(P.x1 + ox - s1, y1); g.lineTo(P.x0 + ox - s1, y1); g.closePath(); g.fill();
    }
    // floor part: 7 gaps, from the wall toward the lens (shifting right)
    for (let i = 0; i < 7; i++) {
      const d0 = P.dmax * (i / 7), d1 = P.dmax * ((i + P.slatFill) / 7);
      const s0 = d0 * P.skew * 0.5, s1 = d1 * P.skew * 0.5;
      floorQuadIrr(g, cam, [[P.x0 + ox + s0, d0], [P.x1 + ox + s0, d0], [P.x1 + ox + s1, d1], [P.x0 + ox + s1, d1]], col(I * 0.42 * wbay));
      irrWorld(g, cam);
    }
  }
  // Orbit's card, taped crooked to the glass: present only as its shadow (with the tape strip's lighter shadow)
  g.globalCompositeOperation = 'source-over';
  irrWorld(g, cam);
  g.save(); g.translate(-470, -760); g.rotate(-0.07); g.transform(1, 0, -P.skew, 1, 0, 0);
  g.globalAlpha = 0.92; g.drawImage(T.cardShadow, -75 - T.cardShadow.pad, -105 - T.cardShadow.pad);
  g.globalAlpha = 0.45; g.rotate(0.12); g.drawImage(T.tapeShadow, -40 - T.tapeShadow.pad, -128 - T.tapeShadow.pad);
  g.restore(); g.globalAlpha = 1;
  g.globalCompositeOperation = 'lighter';
}

// ---------------------------------------------------------------- emissive: the frosted glass, the hall
function drawGlassLight(g, cam, t, st) {
  if (!visible(cam, GLASS.x0, GLASS.top, GLASS.x1, GLASS.bot)) return;
  const L = st.bloom, near = st.near;
  g.save(); leafTransform(g, cam, st);
  g.beginPath(); g.rect(GLASS.x0, GLASS.top, GLASS.x1 - GLASS.x0, GLASS.bot - GLASS.top); g.clip();
  const gw = GLASS.x1 - GLASS.x0, gh = GLASS.bot - GLASS.top;
  if (L > 0.002) {
    // hall glow: enters from the bottom-left of the glass, evens out as the lamp nears
    const cx = lerp(GLASS.x0 + 40, TILE.x - 40, ease.outCubic(clamp(near * 1.3))), cy = lerp(GLASS.bot + 40, TILE.y + 120, ease.outCubic(clamp(near * 1.2)));
    g.globalCompositeOperation = 'lighter';
    C.falloff(g, cx, cy, lerp(420, 300, near), '#8a9a5c', L * 0.9, 4);
    C.falloff(g, TILE.x, TILE.y, lerp(260, 120, near), '#c8de7a', L * lerp(0.25, 0.9, near), 5);
    // evenly lit at the peak (the lamp at the glass floods the frost)
    const peak = clamp((L - 0.4) / 0.45);
    g.fillStyle = C.rgba('#9aa86c', 0.55 * peak); g.fillRect(GLASS.x0, GLASS.top, gw, gh);
    // the lamp's silhouette: the tile is backlit, the pulse stroke dark; frost blur falls 38 → 5 px as it nears the glass
    const blurPx = lerp(38, 5, near) / (cam.zoom * 1.0);          // in mm on the glass
    const s = TILE.s * lerp(1, 1.06, near), O = T.tileOff, og = C.ctx2(O), sc = O.width / 600; // offscreen: 600 mm square
    og.setTransform(1, 0, 0, 1, 0, 0); og.clearRect(0, 0, O.width, O.height);
    og.filter = `blur(${(blurPx * sc).toFixed(2)}px)`;
    og.setTransform(sc, 0, 0, sc, O.width / 2, O.height / 2);
    const tl = lerp(0.35, 1, near) * clamp(L * 1.6);
    const gr = og.createLinearGradient(-s / 2, -s / 2, s / 2, s / 2);
    gr.addColorStop(0, C.rgba('#f2ffbf', tl)); gr.addColorStop(0.55, C.rgba('#d4ff3f', tl)); gr.addColorStop(1, C.rgba('#a9e62a', tl));
    og.fillStyle = gr; roundRect(og, -s / 2, -s / 2, s, s, s * 0.31); og.fill();
    og.globalCompositeOperation = 'destination-out'; og.lineCap = 'round'; og.lineJoin = 'round';
    const k = s / 32; og.strokeStyle = `rgba(0,0,0,${(0.92 * clamp(near * 1.4)).toFixed(3)})`; og.lineWidth = 2.4 * k;
    og.beginPath(); [[6.5, 16], [9.5, 16], [11.7, 10.5], [15.3, 22.5], [18.7, 7.5], [21.7, 18.5], [23.5, 16], [25.5, 16]].forEach(([x, y], i) => (i ? og.lineTo(-s / 2 + x * k, -s / 2 + y * k) : og.moveTo(-s / 2 + x * k, -s / 2 + y * k)));
    og.stroke(); og.globalCompositeOperation = 'source-over'; og.filter = 'none';
    g.globalCompositeOperation = 'lighter'; g.drawImage(O, TILE.x - 300, TILE.y - 300, 600, 600);
    // frost mottling and backlit dust (multiply / screen)
    g.globalCompositeOperation = 'multiply'; g.globalAlpha = 0.9; g.drawImage(T.frost, GLASS.x0, GLASS.top); g.globalAlpha = 1;
    g.globalCompositeOperation = 'screen'; g.globalAlpha = clamp(L * 1.1) * 0.8; g.drawImage(T.wear, GLASS.x0, GLASS.top); g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';
  }
  // door vinyl, on the room side of the glass: "One coin." opaque dark; "One X Manager." translucent volt; the eyebrow
  const fs = 70 / 200, lx = GLASS.x0 + 42;
  const sp1 = T.oneCoin, sp2 = T.oneX, br = T.brow;
  g.drawImage(sp1, lx - sp1.pad * fs, -1431 - sp1.baseline * fs, sp1.width * fs, sp1.height * fs);
  const vl = clamp((L - 0.25) / 0.55);
  if (vl > 0.001) {
    g.globalAlpha = 0.9 * vl; g.globalCompositeOperation = 'source-over';
    tintDraw(g, sp2, lx - sp2.pad * fs, -1354 - sp2.baseline * fs, sp2.width * fs, sp2.height * fs, C.mixHex('#5a6a20', '#e3ff6a', vl));
    g.globalAlpha = 1;
  } else {
    g.globalAlpha = 0.85; tintDraw(g, sp2, lx - sp2.pad * fs, -1354 - sp2.baseline * fs, sp2.width * fs, sp2.height * fs, '#1a1f0a'); g.globalAlpha = 1;
  }
  const bs = 15.4 / 44;
  g.globalAlpha = 0.92; g.drawImage(br, lx - br.pad * bs + 2, -1158 - br.baseline * bs, br.width * bs, br.height * bs); g.globalAlpha = 1;
  // a vinyl air bubble on the "M"
  if (L > 0.05) { g.strokeStyle = C.rgba('#f4ffd0', 0.35 * clamp(L)); g.lineWidth = 0.8; g.beginPath(); g.ellipse(lx + 205, -1380, 5, 3.4, 0.3, 0, 7); g.stroke(); }
  g.restore();
}
const TINT = new Map();
function tintDraw(g, spr, x, y, w, h, color) { // draw a white sprite in a colour (cached per colour bucket)
  const key = `${spr.width}x${spr.height}:${color}`;
  let c = TINT.get(key);
  if (!c) { c = C.canvas(spr.width, spr.height); const q = C.ctx2(c); q.drawImage(spr, 0, 0); q.globalCompositeOperation = 'source-in'; q.fillStyle = color; q.fillRect(0, 0, c.width, c.height); if (TINT.size > 80) TINT.clear(); TINT.set(key, c); }
  g.drawImage(c, x, y, w, h);
}
function drawUnderDoor(g, cam, t, st) {
  if (t < LINE_T) return;
  if (!visible(cam, DOOR.x0, -40, DOOR.x1, 10)) return;
  // the first volt pixel: a hairline in the floor gap, widening as the hall light comes closer
  const w = clamp(1 + 5 * ease.inCubic(clamp(st.bloom / 0.5)), 1, 6);
  const I = clamp(0.35 + 1.6 * st.bloom) * C.bulb(t, [[LINE_T, 1]], 0.12, 0.2);
  const [x0, y0] = C.toScreen(cam, DOOR.x0 + 4, 0), [x1] = C.toScreen(cam, DOOR.x1 - 4, 0);
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.fillStyle = C.rgba(C.mixHex('#9bbf2c', '#efffb0', clamp(st.bloom)), clamp(I));
  g.fillRect(x0, Math.round(y0 - w), x1 - x0, w);
}
function drawHallGap(g, cam, t, st) { // the hall seen through the opening gap (pure light)
  if (st.open <= 0.001) return;
  C.apply(g, cam);
  const gx1 = DOOR.x1 - (DOOR.x1 - DOOR.x0) * st.k;
  const gr = g.createLinearGradient(DOOR.x0, 0, gx1, 0);
  gr.addColorStop(0, '#f6ffd8'); gr.addColorStop(1, '#d9f07a');
  g.fillStyle = gr; g.fillRect(DOOR.x0, DOOR.top, gx1 - DOOR.x0 - 46, -DOOR.top);
}

// ---------------------------------------------------------------- UI placement + lighting over UI
function placeUI(t, cam, st) {
  const ob = OB(t);
  // panes
  if (ob >= 13.6 && ob < 16.2) {
    const lunaSel = t >= b(14);
    U.panes[0].card.classList.toggle('selected', lunaSel); U.panes[1].card.classList.toggle('selected', !lunaSel);
    const host = lunaSel ? U.rowLuna : U.rowSol; if (U.checkSel.parentNode !== host) host.appendChild(U.checkSel);
    for (const p of st.panes) {
      const { m } = p.M;
      p.wrap.style.visibility = 'visible';
      p.wrap.style.transform = `matrix(${m.a.toFixed(5)},${m.b.toFixed(5)},${m.c.toFixed(5)},${m.d.toFixed(5)},${m.e.toFixed(2)},${m.f.toFixed(2)})`;
      p.wrap.style.opacity = '1';
      const blurPx = p.id !== 'luna' ? 3.4 * ease.inOutCubic(invLerp(b(14.3), b(14.9), t)) : 0;
      p.wrap.style.filter = st.mb ? `url(#${p.id === 'luna' ? 'uaB0' : p.id === 'sol' ? 'uaB1' : 'uaB2'})` : (blurPx > 0.05 ? `blur(${blurPx.toFixed(2)}px)` : 'none');
    }
  }
  // permissions plate
  if (ob >= 13.6 && ob < 14 || ob >= 17.9 && ob < 20.2) {
    for (let i = 0; i < 3; i++) setToggle(U.permCards[i + 1], toggleState(t, i));
    const z = zOf(cam, 22), k = cam.zoom / z;
    const [sx, sy] = C.toScreen(cam, PLATE.x, PLATE.y, z);
    U.perm.style.visibility = 'visible';
    U.perm.style.transform = `translate(${sx.toFixed(2)}px, ${sy.toFixed(2)}px) scale(${k.toFixed(5)})`;
    U.perm.style.filter = st.mb ? 'url(#uaB3)' : 'none';
    st.permK = k; st.permXY = [sx, sy];
  }
  // the meter: two windows onto the real limits panel
  if (ob >= 19.7 || (ob >= 13.6 && ob < 14)) {
    const v = dailyValue(t), vl = dailyValue(t - 1 / 60);
    const units = Math.floor(vl + 1e-6), cents = Math.round((v - Math.floor(v + 1e-6)) * 100);
    const txt = t < (C.EV.odometer || b(20.25)) ? '0.00' : (v >= 4.9999 ? '5.00' : `${Math.min(units, 4)}.${String(Math.min(99, cents)).padStart(2, '0')}`);
    U.daily.value = txt;
    const z = zOf(cam, 60), k = cam.zoom / z;
    U.limits.forEach((el, i) => {
      const m = MW[i];
      const [sx, sy] = C.toScreen(cam, METER.x + m.x - 31, METER.y + m.y - m.sy, z);
      el.style.visibility = 'visible';
      el.style.transform = `translate(${sx.toFixed(2)}px, ${sy.toFixed(2)}px) scale(${k.toFixed(5)})`;
      el.style.filter = st.mb ? 'url(#uaB4)' : 'none';
    });
    st.limK = k;
  }
}
function setToggle(card, since) {
  const on = since >= 0, sw = card.querySelector('.permission-switch'), stat = card.querySelector('.permission-status'), thumb = card.querySelector('.toggle-track > span');
  card.classList.toggle('enabled', on);
  sw.setAttribute('aria-checked', on ? 'true' : 'false');
  stat.textContent = on ? 'ON' : 'OFF';
  if (on && !thumb.firstChild) thumb.innerHTML = CHECK_SVG;
  if (!on && thumb.firstChild) thumb.innerHTML = '';
  // the thumb's travel: 3 frames out, 2 frames of bounce
  if (on && since < 5 / 60) { const f = Math.floor(since * 60); thumb.style.transform = `translate(${[9, 17, 23, 21, 20][f]}px)`; }
  else thumb.style.transform = '';
}
function lightUI(t, cam, st) { // #mul: the same irradiance over each UI element's own shape; plus contact shades
  const g = C.L.mul;
  const shapes = [];
  if (st.panes) for (const p of st.panes) shapes.push({ m: p.M.m, w: CARD_W, h: CARD_H, r: 28 });
  if (st.permK) shapes.push({ m: new DOMMatrix().translate(st.permXY[0], st.permXY[1]).scale(st.permK), w: PLATE.w, h: PLATE.h, r: 28 });
  if (st.limK) for (const m of MW) { const [sx, sy] = C.toScreen(cam, METER.x + m.x, METER.y + m.y, zOf(cam, 60)); shapes.push({ m: new DOMMatrix().translate(sx, sy).scale(st.limK), w: m.w, h: m.h, r: 0 }); }
  if (!shapes.length) return;
  g.save(); g.beginPath();
  for (const s of shapes) { g.setTransform(s.m); if (s.r) roundRect(g, 0, 0, s.w, s.h, s.r); else g.rect(0, 0, s.w, s.h); }
  g.setTransform(1, 0, 0, 1, 0, 0); g.clip();
  g.drawImage(IRR.c, 0, 0, W, H);
  g.restore();
}

// ---------------------------------------------------------------- one frame of elevation A
function frame(t, shotLook) {
  const cam = camAt(t), ob = OB(t);
  const g = C.L.world;
  const st = {
    moon: moonLevel(t), bloom: bloomLevel(t), near: lampNear(t), shudder: doorShudder(t),
    open: hallOpen(t), k: Math.cos((doorAngle(t) * Math.PI) / 180) * (1 - 0) || 1,
  };
  st.k = Math.cos((doorAngle(t) * Math.PI) / 180);
  st.hall = clamp(st.open * 1.15);
  const [vx, vy] = camVel(t);
  const vmag = Math.hypot(vx, vy);
  st.mb = vmag > 6;
  // panes (S6 tail → S7)
  if (ob >= 13.6 && ob < 16.2) {
    st.panes = U.panes.map((p) => { const pose = p.id === 'luna' ? lunaPose(t) : null; return { ...p, pose, M: paneMatrix(cam, p, pose) }; });
  }

  // ---------- albedo
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#0a0a0c'; g.fillRect(0, 0, W, H);
  drawWall(g, cam);
  drawFloor(g, cam);
  drawDoorAlbedo(g, cam, t, st);
  drawSwitch(g, cam, t);
  drawPlateAlbedo(g, cam);
  drawMeterAlbedo(g, cam);
  if (st.panes) drawPaneBacks(g, cam, t, st);
  for (const key of ['brain', 'bound', 'budget']) drawDymo(g, cam, t, key);
  drawSlips(g, cam, t, st);

  // ---------- irradiance
  const irr = IRR.g;
  irr.setTransform(1, 0, 0, 1, 0, 0); irr.globalCompositeOperation = 'source-over'; irr.globalAlpha = 1; irr.filter = 'none';
  const amb = C.mixHex('#000000', '#151a1e', clamp(st.moon * 1.0 + 0.0));
  irr.fillStyle = amb; irr.fillRect(0, 0, W / 2, H / 2);
  irr.globalCompositeOperation = 'lighter';
  moonPatch(irr, cam, st.moon);
  // Voice's light through the frosted glass: the glass is a big soft source on the room side
  if (st.bloom > 0.001) {
    irrWorld(irr, cam);
    const gx = (GLASS.x0 + GLASS.x1) / 2, gy = (GLASS.top + GLASS.bot) / 2;
    C.falloff(irr, gx, gy, 520, '#9fb24e', 0.55 * st.bloom, 5);
    // under the door: a thin sheet of light along the floor; the slips throw long shadows toward the lens
    const ud = clamp(0.2 + st.bloom * 1.3);
    for (let i = 0; i < 6; i++) {
      const d0 = i * 70, d1 = (i + 1) * 70, a = ud * 0.5 * Math.exp(-i * 0.55);
      floorQuadIrr(irr, cam, [[DOOR.x0 - 40 - i * 20, d0], [DOOR.x1 + 40 + i * 20, d0], [DOOR.x1 + 60 + i * 20, d1], [DOOR.x0 - 60 - i * 20, d1]], C.rgba('#b9d64a', a));
    }
    irrWorld(irr, cam);
  }
  if (t >= LINE_T && t < b(10)) { // the hairline's own spill: barely there
    floorQuadIrr(irr, cam, [[DOOR.x0, 0], [DOOR.x1, 0], [DOOR.x1 + 20, 60], [DOOR.x0 - 20, 60]], C.rgba('#a6c832', 0.10 * C.bulb(t, [[LINE_T, 1]])));
  }
  // the hall light through the open door: raking across the wall from the left, a wedge on the floor
  if (st.open > 0.001) {
    const I = st.hall;
    irrWorld(irr, cam);
    C.falloff(irr, 120, -1050, 1250, HALL, 1.25 * I, 5.5);
    C.falloff(irr, 300, -500, 700, '#cfe58c', 0.45 * I, 4);
    // the wedge's lit pool on the panes: sweeps past all three while the door overshoots, rests on Luna as it settles
    const ang = doorAngle(t), sweep = clamp(ang / 26);
    const ex = lerp(1200, 3900, sweep);
    const cx = lerp(1400, 2520, clamp(ang / 22));
    irr.save(); irr.beginPath(); irr.rect(-4000, -4000, ex + 4000, 8000); irr.clip();
    C.falloff(irr, cx, -560, 760, HALL, 0.95 * I, 4);
    irr.restore();
    // floor wedge
    floorQuadIrr(irr, cam, [[60, 0], [500, 0], [500 + 2600 * sweep, 3000], [60 + 600 * sweep, 3000]], C.rgba('#c3dc72', 0.35 * I));
    irrWorld(irr, cam);
  }
  // toggles: each lit track throws a small volt bounce on the plate glass and the plaster
  for (let i = 0; i < 3; i++) {
    const s = toggleState(t, i); if (s < 0) continue;
    const cardY = PLATE.y + [237, 340, 442][i] + 47;
    C.falloff(irr, PLATE.x + 370, cardY, 60, VOLT, 0.25 * clamp(s / 0.05), 3);
  }
  // shadows cast by things standing off the wall (raking hall light from the left)
  irr.globalCompositeOperation = 'source-over';
  if (st.hall > 0.01) {
    irrWorld(irr, cam);
    const sh = (x, y, w, h, off, a, blur) => { irr.save(); irr.filter = `blur(${blur}px)`; irr.fillStyle = `rgba(0,0,0,${a.toFixed(3)})`; roundRect(irr, x + off, y + off * 0.25, w, h, 8); irr.fill(); irr.restore(); };
    irr.globalCompositeOperation = 'multiply';
    if (visible(cam, PLATE.x, PLATE.y, PLATE.x + PLATE.w + 120, PLATE.y + PLATE.h + 30)) sh(PLATE.x - PLATE.bez, PLATE.y - PLATE.bez, PLATE.w + 2 * PLATE.bez, PLATE.h + 2 * PLATE.bez, 26, 0.6 * st.hall, 4);
    if (visible(cam, SW.x - 50, SW.y - 50, SW.x + 80, SW.y + 50)) sh(SW.x - 43, SW.y - 43, 86, 86, 9, 0.5 * st.hall, 2);
    if (visible(cam, METER.x, METER.y, METER.x + METER.w + 120, METER.y + METER.h + 30)) sh(METER.x, METER.y, METER.w, METER.h, 44, 0.65 * st.hall, 6);
    irr.globalCompositeOperation = 'source-over';
  }
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'multiply'; g.drawImage(IRR.c, 0, 0, W, H); g.globalCompositeOperation = 'source-over';

  // ---------- emissive
  drawHallGap(g, cam, t, st);
  drawGlassLight(g, cam, t, st);
  drawUnderDoor(g, cam, t, st);
  // slips: their far edges catch the under-door light (rim), once Voice is at the door
  if (st.bloom > 0.01 && st.slipList) {
    for (const s of st.slipList) {
      if (s.d < 0) continue;
      floorAffine(g, cam, s.x, s.d, s.r);
      g.fillStyle = C.rgba('#dff58a', clamp(st.bloom * 1.2) * 0.7 * Math.exp(-s.d / 300)); g.fillRect(-75, -27 - (s.lift || 0), 150, 1.6);
    }
  }
  // meter rail engraving: legible only where the hall light reaches it
  if (visible(cam, METER.x, METER.y + 200, METER.x + METER.w, METER.y + 260)) {
    const light = st.hall * 0.9;
    const es = 9 / 40, sp = T.engL;
    C.apply(g, cam);
    const ex = METER.x + METER.w / 2 - (sp.width * es) / 2, ey = METER.y + 230;
    g.globalAlpha = clamp(light) * 0.75; g.globalCompositeOperation = 'multiply'; g.drawImage(T.engD, ex + 0.5, ey + 0.6, sp.width * es, sp.height * es);
    g.globalAlpha = clamp(light) * 0.55; g.globalCompositeOperation = 'screen'; g.drawImage(T.engL, ex - 0.35, ey - 0.35, sp.width * es, sp.height * es);
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }

  // ---------- UI + its light
  placeUI(t, cam, st);
  lightUI(t, cam, st);

  // ---------- add: glass reflections, halation from the real sources
  const ad = C.L.add;
  if (st.bloom > 0.01 && visible(cam, GLASS.x0, GLASS.top, GLASS.x1, GLASS.bot)) {
    ad.setTransform(1, 0, 0, 1, 0, 0);
    const [hx, hy] = C.toScreen(cam, TILE.x, TILE.y);
    C.falloff(ad, hx, hy, 160 * cam.zoom, '#c9e36a', 0.10 * st.bloom, 4);
  }
  if (st.open > 0.01) { ad.setTransform(1, 0, 0, 1, 0, 0); const [gx, gy] = C.toScreen(cam, 20, -1000); C.falloff(ad, gx, gy, 300 * cam.zoom, '#e8f7b0', 0.16 * st.open, 4); }
  // meter front glass: a fingerprint and a water ring, visible where light grazes it
  if (st.limK) {
    C.apply(ad, cam); ad.globalAlpha = 0.25 + 0.4 * st.hall; ad.drawImage(T.mwear, METER.x, METER.y, METER.w, METER.h);
    ad.globalAlpha = 0.6 * st.hall; ad.drawImage(T.fp, METER.x + 238, METER.y + 140, 44, 44);
    ad.strokeStyle = 'rgba(255,255,255,0.10)'; ad.lineWidth = 0.9; ad.beginPath(); ad.ellipse(METER.x + 70, METER.y + 118, 14, 12, 0.4, 0, 7); ad.stroke();
    ad.globalAlpha = 1;
    // glass sheen: the hall light's reflection band across the box front
    const gr = ad.createLinearGradient(METER.x, METER.y + METER.h, METER.x + METER.w, METER.y);
    gr.addColorStop(0, C.rgba('#dfeeb0', 0.06 * st.hall)); gr.addColorStop(0.35, C.rgba('#dfeeb0', 0.015)); gr.addColorStop(1, 'rgba(0,0,0,0)');
    ad.fillStyle = gr; ad.fillRect(METER.x, METER.y, METER.w, METER.h);
  }
  // Luna: the specular sweep across its "Verified · ready" chip as it is lifted into the light
  if (st.panes && t > b(14) && t < b(14) + 0.5) {
    const p = st.panes[0], u = (t - b(14) - 0.08) / 0.32;
    if (u > 0 && u < 1) {
      ad.save(); ad.setTransform(p.M.m); ad.beginPath(); roundRect(ad, 0, 0, CARD_W, CARD_H, 28); ad.clip();
      const x = lerp(-80, CARD_W + 80, u), gr = ad.createLinearGradient(x - 50, 0, x + 50, 40);
      gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(240,255,200,0.16)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      ad.fillStyle = gr; ad.fillRect(-20, 200, CARD_W + 40, 90); ad.restore();
    }
  }

  // ---------- motion blur on whips (anisotropic, along the camera's screen velocity)
  if (st.mb) motionBlur(vx * 0.5, vy * 0.5, st);
  else for (const f of U.blurF) f.setAttribute('stdDeviation', '0 0');
  return shotLook;
}

// copy each canvas layer and re-draw it as an average of taps along (dx, dy) screen px; the DOM gets a matching SVG blur
const MB = (() => { const c = C.canvas(W, H); return { c, g: C.ctx2(c) }; })();
function motionBlur(dx, dy, st) {
  const L = Math.hypot(dx, dy), n = Math.min(14, Math.max(3, Math.ceil(L / 6)));
  for (const key of ['world', 'mul', 'add', 'front']) {
    const g = C.L[key];
    MB.g.setTransform(1, 0, 0, 1, 0, 0); MB.g.globalCompositeOperation = 'copy'; MB.g.drawImage(g.canvas, 0, 0); MB.g.globalCompositeOperation = 'source-over';
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.filter = 'none';
    if (key === 'world') { g.fillStyle = '#0a0a0c'; g.fillRect(0, 0, W, H); } else if (key === 'mul') { g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); } else g.clearRect(0, 0, W, H);
    for (let i = 0; i < n; i++) {
      const f = n === 1 ? 0 : i / (n - 1) - 0.5;
      g.globalAlpha = 1 / (i + 1); g.drawImage(MB.c, dx * f, dy * f);
    }
    g.globalAlpha = 1;
  }
  // DOM: stdDeviation is in each element's own (pre-scale) px
  const sd = (k) => `${(Math.abs(dx) / 2.2 / k).toFixed(2)} ${(Math.abs(dy) / 2.2 / k).toFixed(2)}`;
  const kp = st.panes ? st.panes.map((p) => p.M.k) : [1, 1, 1];
  U.blurF[0].setAttribute('stdDeviation', sd(kp[0])); U.blurF[1].setAttribute('stdDeviation', sd(kp[1])); U.blurF[2].setAttribute('stdDeviation', sd(kp[2]));
  U.blurF[3].setAttribute('stdDeviation', sd(st.permK || 1)); U.blurF[4].setAttribute('stdDeviation', sd(st.limK || 1));
}

// ---------------------------------------------------------------- the shots
C.shot('s04-absence', (t) => frame(t, { grain: 0.05, vignette: 0.14 }));
C.shot('s05-voice', (t) => frame(t, { grain: 0.05, vignette: 0.13 }));
C.shot('s06-oneone', (t) => frame(t, { grain: 0.048, vignette: 0.12 }));
C.shot('s07-brain', (t) => frame(t, { grain: 0.045, vignette: 0.11 }));
C.shot('s09-bounds', (t) => frame(t, { grain: 0.045, vignette: 0.11 }));
C.shot('s10-budget', (t) => frame(t, { grain: 0.045, vignette: 0.11 }));
