// FAÇADE · ACT I and the rhyme. Same Block, same light model as S12 (albedo → irradiance multiply → emissive → UI → mul/add).
//   S1  s01-launch  ob 0–4      day. "Launching a coin takes seconds." peeled on in vinyl along the floor-2 ribbon; real coin cards taped in.
//   S2  s02-exists  ob 4–6      MCU on Orbit's card (G·14, bay c2) → time-lapse to blue hour → pull-back into the rhyme frame.
//   S3  s03-quiet   ob 6–8.5    the rhyme frame (locked). "Then it goes quiet." as lit channel letters that die; the full stop last, at P.
//   S15 s15-choice  ob 39–41    the same frame at night. "quiet" (S3's exact glyph pixels, no full stop) · "Now" · "is a choice." (volt).
// Act I is colourless: zero volt pixels before ob 9.85 (the cards wear .colourless; two hard-coded volt values are mapped the same way below).
// Reference: Hopper, "Early Sunday Morning" — pale blinds at uneven heights, dark glass, a frontal façade in flat light.
import * as C from '../core.js';
import { cubicBezier } from '../../engine/motion.js';
import { WIN, GROUND, PLINTH, FLOORS, winX, winRect, drawBlockAlbedo, groundModel, drawGround, drawGlass, roundRect } from './facade.js';
import { valueNoise, fbm, glassWear, fingerprint } from '../materials.js';
const { clamp, lerp, invLerp, ease, b, W, H } = C;
const EV = C.EV;
const T = {};                                   // load-time textures

// ---------------------------------------------------------------- cameras (world: 1 px ≈ 5 mm, ground line y = 0)
const CAM1 = { x: 1456, y: -836, z: 0.625 };   // S1 wide elevation: the floor-2 ribbon (the sentence), floor 1, ground, plinth
const CAM2 = { x: 1784, y: -246, z: 3.1 };     // S2 MCU: Orbit's card, "Orbit" ≈ 48 px, G·14 on the plinth below
export const RHYME = { x: 1675, y: -370, z: 0.8 };  // S3 = S15, locked
export const RHYME_P = [1252, 528];             // the rhyme pixel: centre of "quiet."'s full stop (and of S17's lime full stop)
const massy = cubicBezier(0.62, 0, 0.18, 1);    // a dolly with weight: slow to start, long settle
// zoom interpolates in log space; the centre follows 1/zoom so the move reads as a dolly, not a scale
function dolly(A, B, u) {
  const z = A.z * Math.pow(B.z / A.z, u), w = (1 / A.z - 1 / z) / (1 / A.z - 1 / B.z);
  return C.cam(lerp(A.x, B.x, w), lerp(A.y, B.y, w), z);
}
function camAct1(t) {
  if (t < b(3.55)) return C.cam(CAM1.x + 4 * t, CAM1.y, CAM1.z);                  // 2.5 px/s truck: under the 4 px/s reading limit
  const A = { x: CAM1.x + 4 * b(3.55), y: CAM1.y, z: CAM1.z };
  if (t < b(4)) return dolly(A, CAM2, massy(invLerp(b(3.55), b(4), t)));
  const creep = 1 + 0.012 * ease.inOutCubic(invLerp(b(4), b(5.5), t));           // the hold breathes in by 1.2%
  if (t < b(5.5)) return C.cam(CAM2.x, CAM2.y, CAM2.z * creep);
  const B = { x: CAM2.x, y: CAM2.y, z: CAM2.z * 1.012 };
  if (t < b(5.96)) return dolly(B, RHYME, massy(invLerp(b(5.5), b(5.96), t)));
  return C.cam(RHYME.x, RHYME.y, RHYME.z);                                         // dead still from here (and in S15)
}

// ---------------------------------------------------------------- light schedule (Act I): overcast day → time-lapse → blue hour → moon
const ob = (t) => C.obAt(t);
function ramp(list, o) {
  if (o <= list[0][0]) return list[0][1];
  for (let i = 1; i < list.length; i++) if (o <= list[i][0]) return C.mixHex(list[i - 1][1], list[i][1], (o - list[i - 1][0]) / (list[i][0] - list[i - 1][0]));
  return list[list.length - 1][1];
}
const AMB = [[4.75, '#f2f1ec'], [5.1, '#e2dfd6'], [5.5, '#9aa3ad'], [6.0, '#363d45'], [7.0, '#2a3036'], [8.0, '#1b1f24'], [8.5, '#101215']];
const AMB_LO = [[4.75, '#d6d5cf'], [5.1, '#c9c6bd'], [5.5, '#87909a'], [6.0, '#2b3238'], [7.0, '#20262b'], [8.0, '#15191d'], [8.5, '#0d0f12']];
const dayK = (t) => 1 - ease.inOutCubic(invLerp(b(4.8), b(5.95), t));
const lum = (hex) => { const n = parseInt(hex.slice(1), 16); return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255; };
// time-lapse exposure flicker (a real interval sequence never holds exposure perfectly)
const lapseFlicker = (t) => (t > b(4.75) && t < b(5.75) ? 1 + 0.035 * (C.hash01(Math.floor(t * 30) + 311) - 0.5) : 1);

// fluorescent start: a blink, a dropout, then on; a 2-frame blue flash when it is switched off, then the phosphor's tail
function tube(t, on, off) {
  if (t < on) return 0;
  const f = Math.floor((t - on) * 60), start = [0.7, 0.12, 0.05, 0.85, 0.6, 1.0];
  let v = f < start.length ? start[f] : 1;
  if (off != null && t >= off) { const g = Math.floor((t - off) * 60); v = g < 2 ? 1.3 : 0.2 * Math.exp(-(t - off - 2 / 60) / 0.05); }
  return v;
}
const flashAt = (t, off) => (off != null && t >= off && t < off + 2 / 60 ? 1 : 0);

// ---------------------------------------------------------------- the real coin cards (Act I, colourless)
// Explore examples, verbatim from capture/js/shared-*.js; placeholders keep the fragment's own default copy.
const EX = { noodle: ['Noodle', 'NOODLE', 'zero thoughts. maximum noodle.'], void: ['Void', 'VOID', 'some things are better left unexplained.'],
  moss: ['Moss', 'MOSS', 'touch grass. we are the grass.'], orbit: ['Orbit', 'ORBIT', 'not a moon mission. a whole new orbit.'] };
// f/c window, (x, y) window-local top-left in world px, s scale, rot lean (°), tape: [u, v, angle] in card-local px
const CARDS = [
  { ev: 'card-1', f: 1, c: 0, x: 66, y: 40, s: 0.42, rot: -0.9, kind: null, tape: [196, -2, -3] },
  { ev: 'card-2', f: 0, c: 1, x: 352, y: 40, s: 0.56, rot: 0.6, kind: 'noodle', tape: [196, -2, 2] },
  { ev: 'card-3', f: 0, c: 0, x: 120, y: 128, s: 0.5, rot: -0.5, kind: null, tape: [196, -2, -1] },
  { ev: 'card-4', f: 1, c: 3, x: 372, y: 44, s: 0.4, rot: 1.1, kind: 'void', tape: [196, -2, 4] },
  { ev: 'card-5', f: 0, c: 0, x: 380, y: 60, s: 0.46, rot: 0.8, kind: 'moss', tape: [196, -2, -2] },
  { ev: 'card-6', f: 1, c: 3, x: 70, y: 36, s: 0.42, rot: -0.6, kind: null, tape: [196, -2, 1] },
  { ev: 'card-7', f: 1, c: 0, x: 330, y: 58, s: 0.38, rot: 0.4, kind: null, tape: [196, -2, 3] },
  { ev: 'card-8', f: 0, c: 1, x: 66, y: 124, s: 0.5, rot: -1.0, kind: null, tape: [196, -2, -2] },
  { ev: 'card-orbit', f: 0, c: 2, x: 14, y: 160, s: 0.52, rot: 0.8, kind: 'orbit', tape: [26, 20, -44], corner: true },
];
const CARD_W = 392;          // poster sheet: the 360 px preview + 16 px margins
let ORBIT = null;

// ---------------------------------------------------------------- window dressing (fixed; "the building has history")
// roll: roller blind pulled down to this fraction (Hopper's blinds); tone: blind fabric; objs: furniture masses in the room.
const BLINDS = ['#d3cfc2', '#c3c6ba', '#d9d6cb', '#cbc9c1'];
const DRESS = {};
(() => {
  const r = C.rng(1431);
  for (let f = 0; f <= 3; f++) for (let c = -2; c <= 5; c++) {
    const k = `${f},${c}`;
    DRESS[k] = { roll: [0.08, 0.22, 0.4, 0.62, 0.15][Math.floor(r() * 5)], fabric: BLINDS[Math.floor(r() * 4)], wall: 0.8 + r() * 0.4, objs: [], cord: r() < 0.6 };
    const n = Math.floor(r() * 3);
    for (let i = 0; i < n; i++) DRESS[k].objs.push({ x: 0.08 + r() * 0.7, w: 0.1 + r() * 0.22, h: 0.14 + r() * 0.3 });
  }
  for (let c = 0; c <= 3; c++) Object.assign(DRESS[`2,${c}`], { roll: 0.06 });       // the sentence's windows: blinds up, dark glass behind the vinyl
  Object.assign(DRESS['0,2'], { roll: 0, venetian: true, objs: [] });              // Orbit G·14: venetians, slats open
  Object.assign(DRESS['0,3'], { roll: 0, venetian: true, objs: [] });
  Object.assign(DRESS['1,3'], { roll: 1.0 });                                     // one blind fully down
  Object.assign(DRESS['0,0'], { crack: true, roll: 0.5 });                        // one window open a crack
  Object.assign(DRESS['1,2'], { oldSign: [0.16, 0.2, 0.52, 0.46], roll: 0.1 });    // pale rectangle of an old tenant's sign
  Object.assign(DRESS['1,1'], { residue: true, roll: 0.1 });
  Object.assign(DRESS['0,1'], { roll: 0.34 });                                    // G·12
  Object.assign(DRESS['1,0'], { roll: 0.24 });
})();

// ---------------------------------------------------------------- vinyl (S1): one word per window along the floor-2 ribbon, peeled on 8ths
// Applied on the outside of the glass (shopfront practice for lettering read from the street): no reflection over it.
const VINYL = [
  { ev: 'word-1', str: 'Launching', c: 0, col: '#efeee8', rot: -0.22, dy: 2 },
  { ev: 'word-2', str: 'a coin', c: 1, col: '#efeee8', rot: 0.18, dy: -2 },
  { ev: 'word-3', str: 'takes', c: 2, col: '#8f8f89', rot: -0.12, dy: 3 },
  { ev: 'word-4', str: 'seconds.', c: 3, col: '#8f8f89', rot: 0.25, dy: 0 },
];
const VFONT = 155;            // world px → 96.9 px on screen at zoom 0.625
const PEEL = 7 / 60;
function peel(t, i) {
  if (i === 0) return clamp(0.6 + (0.4 * t) / 0.12);     // already 60% peeled on frame 0, done by 0.12 s
  return clamp((t - EV[VINYL[i].ev]) / PEEL);
}

// ---------------------------------------------------------------- light-type (S3, S15): opal-faced channel letters hung behind the glass
// Screen-space sprites at the locked rhyme camera (104 px), so S3 and S15 draw identical glyph pixels.
const LT = 104;
function ltSprite(str, { fill = '#f5f5ef', hot = null, ox = 0, oy = 0, pad = 56 } = {}) {
  const font = `660 ${LT}px "Bricolage Grotesque"`;
  const set = (g) => { g.font = font; g.fontStretch = 'semi-condensed'; g.letterSpacing = `${(-0.04 * LT).toFixed(2)}px`; g.textBaseline = 'alphabetic'; };
  const m = C.canvas(8, 8), mg = C.ctx2(m); set(mg);
  const tm = mg.measureText(str);
  const asc = Math.ceil(tm.actualBoundingBoxAscent), desc = Math.ceil(tm.actualBoundingBoxDescent);
  const c = C.canvas(Math.ceil(tm.width + pad * 2), asc + desc + pad * 2), g = C.ctx2(c); set(g);
  if (hot) { const gr = g.createLinearGradient(0, pad, 0, pad + asc); gr.addColorStop(0, hot); gr.addColorStop(1, fill); g.fillStyle = gr; } else g.fillStyle = fill;
  g.fillText(str, pad + ox, pad + asc + oy);
  c.base = pad + asc; c.pad = pad; c.adv = tm.width;
  return c;
}
// LED modules behind an opal face are never perfectly even: faint hot spots, fixed per letter
function mottle(c, seed) {
  const g = C.ctx2(c), r = C.rng(seed);
  g.globalCompositeOperation = 'source-atop';
  for (let x = c.pad; x < c.width - c.pad; x += 26 + r() * 14) {
    const y = c.base - 20 - r() * 40, gr = g.createRadialGradient(x, y, 0, x, y, 30);
    gr.addColorStop(0, 'rgba(255,255,255,0.10)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(x - 30, y - 30, 60, 60);
  }
  g.globalCompositeOperation = 'source-over';
  return c;
}
function tint(src, color) { const c = C.canvas(src.width, src.height), g = C.ctx2(c); g.drawImage(src, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = color; g.fillRect(0, 0, c.width, c.height); return c; }
function ltPack(core) { return { core, halo: C.blurred(core, 6), bloom: C.blurred(core, 22), face: tint(core, '#8d908e'), ret: tint(core, '#050505') }; }
function crop(src, x0, x1) { const c = C.canvas(src.width, src.height), g = C.ctx2(c); g.drawImage(src, 0, 0); g.clearRect(0, 0, x0, c.height); g.clearRect(x1, 0, c.width - x1, c.height); return c; }
// screen positions (locked camera): baselines chosen for the rhyme composition
const LTPOS = { then: [336, 152], itgoes: [944, 152], now: [944, 152], isa: [1540, 466], choice: [1540, 562] };

// ---------------------------------------------------------------- init
export async function init() {
  T.vinyl = VINYL.map((v) => C.textSprite(v.str, { size: VFONT, weight: 660, stretch: 'semi-condensed', color: v.col, tracking: -0.04, pad: 10 }));
  // "quiet." — find its full stop's centroid, then re-set the word so that centroid lands on a pixel centre (P).
  const q0 = ltSprite('quiet.', { fill: '#8a8a84' }), qn = ltSprite('quiet', { fill: '#8a8a84' });
  const dotC = (a, nd) => {
    const w = a.width, h = a.height, A = C.ctx2(a).getImageData(0, 0, w, h).data, B = C.ctx2(nd).getImageData(0, 0, nd.width, h).data;
    let sx = 0, sy = 0, s = 0, minx = w;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const d = A[(y * w + x) * 4 + 3] - (x < nd.width ? B[(y * nd.width + x) * 4 + 3] : 0); if (d > 8) { sx += x * d; sy += y * d; s += d; minx = Math.min(minx, x); } }
    return [sx / s, sy / s, minx];
  };
  const [cx0, cy0] = dotC(q0, qn);
  const ox = 0.5 - (cx0 - Math.floor(cx0)), oy = 0.5 - (cy0 - Math.floor(cy0));
  const q1 = ltSprite('quiet.', { fill: '#8a8a84', ox, oy }), q1n = ltSprite('quiet', { fill: '#8a8a84', ox, oy });
  const [cx1, cy1, dotX] = dotC(q1, q1n);
  T.quietXY = [Math.round(RHYME_P[0] + 0.5 - cx1), Math.round(RHYME_P[1] + 0.5 - cy1)];   // sprite top-left on screen
  T.quietDot = [cx1, cy1];
  T.qwire = { pad: q1.pad, adv: (dotX - q1.pad) * 0.92, base: q1.base };
  mottle(q1, 31);
  T.quiet = ltPack(crop(q1, 0, dotX - 2));        // the letters (identical pixels in S3 and S15)
  T.stop = ltPack(crop(q1, dotX - 2, q1.width));  // the full stop alone (S3 only)
  T.then = ltPack(mottle(ltSprite('Then', { hot: '#ffffff' }), 11));
  T.itgoes = ltPack(mottle(ltSprite('it goes', { hot: '#ffffff' }), 12));
  T.now = ltPack(mottle(ltSprite('Now', { hot: '#ffffff' }), 13));
  T.isa = ltPack(mottle(ltSprite('is a', { fill: '#c3ea3a', hot: '#e3ff96' }), 14));
  T.choice = ltPack(mottle(ltSprite('choice.', { fill: '#c3ea3a', hot: '#e3ff96' }), 15));
  // stencils / engraving
  T.g12 = C.textSprite('G·12', { mono: true, size: 28, weight: 500, color: '#5d5d59', tracking: 0.16, pad: 6 });
  T.g14lit = C.textSprite('G·14', { mono: true, size: 28, weight: 500, color: '#c9c9c2', tracking: 0.16, pad: 6 });
  const ID = '$ORBIT · @orbitonsolana · GPT-6 LUNA · CT NATIVE';
  T.ident = C.textSprite(ID, { mono: true, size: 22, weight: 500, color: '#ffffff', tracking: 0.14, pad: 6 });
  T.identDark = C.textSprite(ID, { mono: true, size: 22, weight: 500, color: '#000000', tracking: 0.14, pad: 6 });
  // glass, concrete detail
  T.wear = [0, 1, 2, 3, 4, 5].map((i) => glassWear({ w: WIN, h: 430, seed: 1452 + i, specks: 300 + i * 20, rings: 40 + i * 4 }));
  T.fp = fingerprint(17, 22);
  buildReflections(); buildPost(); buildTape(); buildWeather(); buildMicro(); buildFabric();
  // the cards: the real launch-preview, colourless, printed on dark poster stock
  injectStyle();
  const paper = paperURL();
  for (const cd of CARDS) {
    const el = await C.fragment('launch-preview', { className: 'colourless act1-card' });
    el.style.cssText += `width:${CARD_W}px;box-sizing:border-box;padding:16px 16px 12px;border-radius:5px;background:#0e0e11 url(${paper});`;
    if (cd.kind) {
      const [name, tick, desc] = EX[cd.kind];
      el.querySelector('.preview-type').textContent = tick;
      el.querySelector('.coin-avatar').textContent = name[0];
      el.querySelector('.preview-info h2').textContent = name;
      el.querySelector('.preview-ticker').textContent = '$' + tick;
      el.querySelector('.preview-info p').textContent = desc;
    }
    cd.el = el; cd.h = el.offsetHeight;
    if (cd.kind === 'orbit') { ORBIT = cd; cd.dot = el.querySelector('.preview-live i'); }
  }
  buildSign();
}

function injectStyle() {
  // film2.css's .colourless override misses two hard-coded volt values in the preview: the banner radial and the glow token.
  // Mapped through the same colourless values, scoped to these cards (reported to the lead to fold into film2.css).
  const st = document.createElement('style');
  st.textContent = `.act1-card{--volt-glow:#bdbdb640;--volt-08:#bdbdb614;--volt-14:#bdbdb624;--volt-24:#bdbdb63d}
.act1-card .preview-banner{background:radial-gradient(120% 120% at 20% 0,#bdbdb659,#0000 55%),radial-gradient(90% 90% at 100% 100%,#9aa0a333,#0000 60%),linear-gradient(140deg,#1b1c1d,#0b0c0d)}
.act1-card .launch-preview{position:relative;top:0}`;
  document.head.appendChild(st);
}
function paperURL() {
  const c = C.canvas(256, 256), g = C.ctx2(c), img = g.createImageData(256, 256), d = img.data, n = valueNoise(1461, 64);
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
    const v = 14 + (n(x / 1.3, y / 4) - 0.5) * 7 + (n(x / 9, y / 9) - 0.5) * 4, i = (y * 256 + x) * 4;
    d[i] = v; d[i + 1] = v; d[i + 2] = v + 2; d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return c.toDataURL('image/png');
}

// ---- the reflected world: overcast sky and the low block across the street (with its unlit rooftop billboard frame) and
// the lamp post on our side, at depth 1.8 (it moves less than the façade, as a mirror image of distant things does)
const RP = { X0: -5000, Y0: -4600, PW: 14000, PH: 5600, S: 0.2, ROOF: -1017 };
function buildReflections() {
  const make = (mode) => {
    const c = C.canvas(RP.PW * RP.S, RP.PH * RP.S), g = C.ctx2(c), r = C.rng(1471);
    g.scale(RP.S, RP.S); g.translate(-RP.X0, -RP.Y0);
    const day = mode === 'day';
    const sk = g.createLinearGradient(0, RP.Y0, 0, RP.ROOF);
    sk.addColorStop(0, day ? '#f7f7f4' : '#6e7c8a'); sk.addColorStop(0.7, day ? '#eceeec' : '#58646f'); sk.addColorStop(1, day ? '#dfe1e0' : '#47525c');
    g.fillStyle = sk; g.fillRect(RP.X0, RP.Y0, RP.PW, RP.ROOF - RP.Y0);
    g.fillStyle = day ? '#6f6e68' : '#23282d'; g.fillRect(RP.X0, RP.ROOF, RP.PW, RP.PH);
    g.fillStyle = day ? '#9a9890' : '#323940'; g.fillRect(RP.X0, RP.ROOF, RP.PW, 26);
    for (let row = 0; row < 2; row++) for (let x = RP.X0 + 120; x < RP.X0 + RP.PW; x += 700) {
      const y = RP.ROOF + 140 + row * 420, w = 460 + r() * 40, lit = !day && r() < 0.28;
      g.fillStyle = day ? '#34342f' : lit ? '#8d9aa2' : '#15191c'; g.fillRect(x + r() * 10, y, w, 250);
      if (day && r() < 0.6) { g.fillStyle = '#6a6862'; g.fillRect(x + 10, y, w - 20, 250 * (0.2 + r() * 0.6)); }
      g.fillStyle = day ? '#4b4a45' : '#1b1f22'; g.fillRect(x + w / 2, y, 8, 250);
    }
    g.fillStyle = day ? '#46453f' : '#191d20';
    g.fillRect(1450, RP.ROOF - 520, 1200, 22); g.fillRect(1450, RP.ROOF - 520, 22, 520); g.fillRect(2628, RP.ROOF - 520, 22, 520); g.fillRect(1450, RP.ROOF - 150, 1200, 18);
    g.fillStyle = day ? '#2c2c29' : '#0d0f11'; g.fillRect(RP.X0, -60, RP.PW, 2000);   // street
    // the lamp post on our pavement, mirrored: a dark pole and its head
    g.fillStyle = day ? '#2b2c2b' : '#0b0c0d'; g.fillRect(1880, -1500, 46, 1500); g.fillRect(1840, -1520, 180, 40);
    return c;
  };
  T.reflDay = C.blurred(make('day'), 2); T.reflDusk = C.blurred(make('dusk'), 2);
  const cw = 2400, ch = 700, c = C.canvas(cw, ch), g = C.ctx2(c), img = g.createImageData(cw, ch), d = img.data, n = valueNoise(1473, 64);
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
    const v = fbm(n, x / 150, y / 70, 4), a = clamp((v - 0.48) * 3.2) * (0.5 + 0.5 * (y / ch)), i = (y * cw + x) * 4;
    d[i] = 255; d[i + 1] = 255; d[i + 2] = 255; d[i + 3] = a * 255;
  }
  g.putImageData(img, 0, 0);
  T.clouds = C.blurred(c, 3);
}
// ---- the unlit street-lamp post on our side of the street (foreground wipe, far out of focus)
function buildPost() {
  const c = C.canvas(420, 1500), g = C.ctx2(c);
  const gr = g.createLinearGradient(110, 0, 310, 0);
  gr.addColorStop(0, '#55585a'); gr.addColorStop(0.22, '#3d4041'); gr.addColorStop(0.7, '#202223'); gr.addColorStop(1, '#141516');
  g.fillStyle = gr; g.fillRect(110, -10, 200, 1520);
  g.fillStyle = '#2a2c2d'; g.fillRect(96, 980, 228, 60);           // a collar
  T.post = C.blurred(c, 26);
}
// ---- tape: matte, frosty, torn ends
function buildTape() {
  const w = 140, h = 44, c = C.canvas(w, h), g = C.ctx2(c), r = C.rng(1481);
  g.beginPath(); g.moveTo(4, 3);
  for (let x = 4; x <= w - 4; x += 8) g.lineTo(x, 2 + r() * 2);
  for (let y = 4; y <= h - 3; y += 4) g.lineTo(w - 4 - r() * 4, y);
  for (let x = w - 4; x >= 4; x -= 8) g.lineTo(x, h - 2 - r() * 2);
  for (let y = h - 4; y >= 4; y -= 4) g.lineTo(3 + r() * 4, y);
  g.closePath(); g.fillStyle = 'rgba(255,255,255,0.5)'; g.fill();
  g.globalCompositeOperation = 'source-atop';
  for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(255,255,255,${(r() * 0.25).toFixed(3)})`; g.fillRect(r() * w, r() * h, 1, 1); }
  g.fillStyle = 'rgba(255,255,255,0.3)'; g.fillRect(0, 2, w, 2); g.fillRect(0, h - 4, w, 2);
  T.tape = c;
}
// ---- weathering over the board-formed concrete (multiply, world space at ¼ res): stains, sill-end drips, a splash zone
const WX0 = -1520, WY0 = -2900, WW = 6080, WH = 2900;
function buildWeather() {
  const S = 0.25, w = WW * S, h = WH * S, c = C.canvas(w, h), g = C.ctx2(c), img = g.createImageData(w, h), d = img.data;
  const n = valueNoise(1491, 64), n2 = valueNoise(1492, 64);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const wy = y / S + WY0;
    let v = 1 - 0.09 * clamp((fbm(n, x / 90, y / 60, 4) - 0.42) * 3) - 0.05 * clamp((n2(x / 14, y / 140) - 0.55) * 4);
    v -= 0.06 * clamp((wy + 420) / 420);                      // splash zone above the plinth
    const i = (y * w + x) * 4, k = Math.round(255 * clamp(v));
    d[i] = k; d[i + 1] = k; d[i + 2] = Math.round(k * 0.99); d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  // drips from the ends of every sill
  g.scale(S, S); g.translate(-WX0, -WY0);
  const r = C.rng(1493);
  for (let f = 0; f < FLOORS.length; f++) for (let col = -2; col <= 5; col++) {
    const rr = winRect(f, col);
    for (const ex of [rr.x - 10, rr.x + rr.w + 6]) {
      const len = 160 + r() * 260, gr = g.createLinearGradient(0, rr.y + rr.h + 18, 0, rr.y + rr.h + 18 + len);
      gr.addColorStop(0, 'rgba(60,58,52,0.22)'); gr.addColorStop(1, 'rgba(60,58,52,0)');
      g.fillStyle = gr; g.fillRect(ex, rr.y + rr.h + 18, 8 + r() * 6, len);
    }
  }
  T.weather = C.blurred(c, 1);
}
// ---- micro grain for close-ups (the façade texture is 5 mm per pixel; at 3× it needs fresh tooth)
function buildMicro() {
  const s = 256, c = C.canvas(s, s), g = C.ctx2(c), img = g.createImageData(s, s), d = img.data, n = valueNoise(1495, 128), r = C.rng(1496);
  for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
    const v = 236 + (n(x / 1.6, y / 1.6) - 0.5) * 30 + (r() - 0.5) * 14, i = (y * s + x) * 4;
    d[i] = v; d[i + 1] = v; d[i + 2] = v; d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  T.micro = c;
}
// ---- blind fabric: vertical weave, faint horizontal creases from being rolled
function buildFabric() {
  const s = 256, c = C.canvas(s, s), g = C.ctx2(c), img = g.createImageData(s, s), d = img.data, n = valueNoise(1497, 128);
  for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
    const v = 242 + (n(x / 0.9, y / 6) - 0.5) * 16 + (n(x / 30, y / 2.5) - 0.5) * 10, i = (y * s + x) * 4;
    d[i] = v; d[i + 1] = v; d[i + 2] = v; d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  T.fabric = c;
}

// ---------------------------------------------------------------- the sign for S15 (same real chip as S12's hung card, RUNNING)
let sign = null;
function buildSign() {
  const el = document.createElement('div');
  el.className = 'ui-item film-sign';
  el.innerHTML = `
    <div class="sign-card" style="width:420px;padding:22px 24px 20px;border-radius:18px;background:rgba(14,15,17,0.92);border:1px solid rgba(255,255,255,0.10);box-shadow:inset 0 1px 0 rgba(255,255,255,0.06)">
      <div class="sign-chips" style="position:relative;height:40px">
        <span class="badge green" style="position:absolute;left:0;top:4px"><i></i>Running · Approval Mode</span>
      </div>
      <p style="margin:14px 0 0;font:500 15px/1.35 'Geist Mono',monospace;letter-spacing:0.02em;color:#c2c2ba">Your manager is active. Its launch hour has started.</p>
    </div>`;
  C.UI.appendChild(el);
  sign = { el, dot: el.querySelector('.badge i') };
}

// ---------------------------------------------------------------- shared drawing
const IRR = (() => { const c = C.canvas(W / 2, H / 2); return { c, g: C.ctx2(c) }; })();
function irrBegin(stops) {
  const irr = IRR.g;
  irr.setTransform(0.5, 0, 0, 0.5, 0, 0); irr.globalCompositeOperation = 'source-over'; irr.globalAlpha = 1; irr.filter = 'none';
  const y0 = stops[0][0], y1 = stops[stops.length - 1][0], gr = irr.createLinearGradient(0, y0, 0, y1);
  for (const [y, col] of stops) gr.addColorStop(clamp((y - y0) / (y1 - y0 || 1)), col);
  irr.fillStyle = gr; irr.fillRect(0, 0, W, H);
  irr.globalCompositeOperation = 'lighter';
  return irr;
}
function irrApply(g) { g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'multiply'; g.drawImage(IRR.c, 0, 0, W, H); g.globalCompositeOperation = 'source-over'; }
const scr = (cam, r) => { const [x0, y0] = C.toScreen(cam, r.x, r.y), [x1, y1] = C.toScreen(cam, r.x + r.w, r.y + r.h); return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 }; };
const onScreen = (s, m = 0) => s.x1 > -m && s.x0 < W + m && s.y1 > -m && s.y0 < H + m;
// light on the ground plane between façade distances v0 (far) and v1 (near), world x0..x1 (the same projection as S12)
function groundQuad(g, cam, gm, x0, x1, v0, v1, color) {
  const yAt = (v) => gm.horizon + (gm.f * gm.hcam) / (gm.D - v), sx = (x, v) => W / 2 + (x - cam.x) * (gm.f / (gm.D - v));
  const ya = yAt(v0), yb = yAt(v1);
  g.fillStyle = color; g.beginPath(); g.moveTo(sx(x0, v0), ya); g.lineTo(sx(x1, v0), ya); g.lineTo(sx(x1, v1), yb); g.lineTo(sx(x0, v1), yb); g.closePath(); g.fill();
}
// overhang shade (sky occlusion) under every sill and inside every window head; drawn into the irradiance with 'multiply'
function skyOcclusion(irr, cam, k) {
  if (k <= 0) return;
  irr.globalCompositeOperation = 'multiply';
  for (let f = 0; f < FLOORS.length; f++) for (let c = -2; c <= 5; c++) {
    const s = scr(cam, winRect(f, c)); if (!onScreen(s, 200)) continue;
    const z = cam.zoom, y = s.y1 + 18 * z, gr = irr.createLinearGradient(0, y, 0, y + 70 * z);
    gr.addColorStop(0, C.mixHex('#ffffff', '#b9b7b2', k)); gr.addColorStop(1, '#ffffff');
    irr.fillStyle = gr; irr.fillRect(s.x0 - 14 * z, y, s.w + 28 * z, 70 * z);
  }
  irr.globalCompositeOperation = 'lighter';
}
const shadeRGBA = (k) => C.rgba('#000000', clamp(k));

// The room behind a window: soft light falling across a back wall (no drawn geometry: rooms seen through glass are tone, not lines),
// a side-wall falloff, furniture masses, then a roller blind (or Orbit's venetians) right behind the glass.
// env: { day: daylight inside, tube: cold tube level, flash, roll (override) }
function room(g, cam, f, c, env) {
  const r = winRect(f, c), s = scr(cam, r), d = DRESS[`${f},${c}`];
  if (!onScreen(s, 40)) return;
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.beginPath(); g.rect(s.x0, s.y0, s.w, s.h); g.clip();
  const dl = env.day * 0.2 * d.wall, tb = env.tube || 0, fl = env.flash ? 1 : 0;
  const warm = '#8c8a83', cold = fl ? '#cfe0ff' : '#dfe7ea';
  const col = (v) => C.mixHex('#050607', tb > dl * 1.2 ? cold : warm, clamp(v));
  // back wall: by day dark under the ceiling, lighter low down (floor bounce); under a tube, bright at the top
  const bw = g.createLinearGradient(0, s.y0, 0, s.y1);
  bw.addColorStop(0, col(dl * 0.5 + tb * 0.95)); bw.addColorStop(0.35, col(dl * 0.85 + tb * 0.68)); bw.addColorStop(1, col(dl * 1.05 + tb * 0.45));
  g.fillStyle = bw; g.fillRect(s.x0, s.y0, s.w, s.h);
  // side-wall falloff toward the far side from the lens axis
  const away = s.x0 + s.w / 2 < W / 2 ? 1 : -1, sg = g.createLinearGradient(s.x0, 0, s.x1, 0);
  sg.addColorStop(away > 0 ? 0 : 1, 'rgba(255,255,255,0.05)'); sg.addColorStop(0.5, 'rgba(0,0,0,0)'); sg.addColorStop(away > 0 ? 1 : 0, 'rgba(0,0,0,0.28)');
  g.fillStyle = sg; g.fillRect(s.x0, s.y0, s.w, s.h);
  // furniture masses (soft-edged), standing on an unseen floor
  for (const o of d.objs) {
    const ox = lerp(s.x0, s.x1, o.x), ow = s.w * o.w, oh = s.h * o.h, oy = s.y1 - s.h * 0.04;
    const og = g.createLinearGradient(0, oy - oh, 0, oy);
    og.addColorStop(0, C.rgba('#000000', 0.18 + 0.2 * (dl + tb))); og.addColorStop(1, C.rgba('#000000', 0.4));
    g.fillStyle = og; roundRect(g, ox, oy - oh, ow, oh, 4 * cam.zoom); g.fill();
  }
  if (d.venetian) orbitRoom(g, cam, s, env, dl);
  const roll = env.roll ?? d.roll;
  if (roll > 0) rollerBlind(g, cam, s, d, roll, env, dl, tb);
  if (d.crack) { // the top hopper is tipped open: a dark gap under the head and a pane that mirrors something else
    g.fillStyle = 'rgba(0,0,0,0.75)'; g.fillRect(s.x0, s.y0, s.w, 7 * cam.zoom);
    g.fillStyle = 'rgba(255,255,255,0.05)'; g.fillRect(s.x0, s.y0 + 7 * cam.zoom, s.w, 1);
  }
  g.restore();
}
// a roller blind: fabric front-lit by day (pale), backlit by a tube at night (it glows); bottom rail, cord and ring
function rollerBlind(g, cam, s, d, roll, env, dl, tb) {
  const z = cam.zoom, hgt = s.h * roll;
  const lit = env.day * 0.66;                                   // the fabric faces the sky through the glass
  const glow = tb * 0.62;                                       // ... or is lit through from behind
  const v = Math.max(lit, glow);
  const fab = glow > lit ? C.mixHex('#dfe7ea', d.fabric, 0.35) : d.fabric;
  g.fillStyle = C.mixHex('#060708', fab, clamp(v)); g.fillRect(s.x0, s.y0, s.w, hgt);
  // weave + creases (multiply)
  g.save(); g.beginPath(); g.rect(s.x0, s.y0, s.w, hgt); g.clip(); g.globalCompositeOperation = 'multiply';
  const pat = g.createPattern(T.fabric, 'repeat'); pat.setTransform(new DOMMatrix([z, 0, 0, z, s.x0, s.y0]));
  g.fillStyle = pat; g.fillRect(s.x0, s.y0, s.w, hgt);
  // gentle vertical waves where the fabric hangs, darker at the head roll
  const wg = g.createLinearGradient(s.x0, 0, s.x1, 0);
  for (let i = 0; i <= 6; i++) wg.addColorStop(i / 6, i % 2 ? '#ffffff' : '#ecebe8');
  g.fillStyle = wg; g.fillRect(s.x0, s.y0, s.w, hgt);
  const hg = g.createLinearGradient(0, s.y0, 0, s.y0 + 24 * z); hg.addColorStop(0, '#8d8c88'); hg.addColorStop(1, '#ffffff');
  g.fillStyle = hg; g.fillRect(s.x0, s.y0, s.w, 24 * z);
  g.restore();
  // bottom rail and its shadow on the room
  g.fillStyle = C.mixHex('#050505', '#9c9a93', clamp(v * 0.9)); g.fillRect(s.x0, s.y0 + hgt - 5 * z, s.w, 6 * z);
  g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(s.x0, s.y0 + hgt + 1 * z, s.w, 3 * z);
  if (d.cord && roll < 0.95) { const cx = s.x1 - 40 * z; g.strokeStyle = C.rgba('#2a2a27', 0.7); g.lineWidth = Math.max(1, 1.2 * z); g.beginPath(); g.moveTo(cx, s.y0 + hgt); g.lineTo(cx, s.y0 + hgt + 46 * z); g.stroke(); g.beginPath(); g.arc(cx, s.y0 + hgt + 52 * z, 5 * z, 0, 7); g.stroke(); }
}
// Orbit's empty unit: the door far back right (where S12's room has it) and its venetians, open (8°): thin lines with ladder tapes.
function orbitRoom(g, cam, s, env, dl) {
  const z = cam.zoom, par = (cam.x - (s.x0 + s.x1) / 2) * 0;
  g.fillStyle = C.rgba('#000000', 0.45); g.fillRect(s.x0 + s.w * 0.79 + par, s.y0 + s.h * 0.1, s.w * 0.14, s.h * 0.9);
  g.fillStyle = C.rgba('#ffffff', 0.05 * clamp(dl * 4)); g.fillRect(s.x0 + s.w * 0.79, s.y0 + s.h * 0.1, Math.max(1, 1.5 * z), s.h * 0.9);
  const p = s.h / 16;
  for (let i = 0; i < 16; i++) {
    const y = s.y0 + (i + 0.62) * p, th = Math.max(1, p * 0.14), sag = 1.5 * z;
    const lit = clamp(env.day * 0.55 + 0.03);
    g.fillStyle = C.rgba('#d2d0c8', lit * 0.75); g.beginPath(); g.moveTo(s.x0, y); g.quadraticCurveTo((s.x0 + s.x1) / 2, y + sag, s.x1, y); g.lineTo(s.x1, y + th); g.quadraticCurveTo((s.x0 + s.x1) / 2, y + th + sag, s.x0, y + th); g.fill();
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(s.x0, y + th, s.w, Math.max(1, th * 0.6));
  }
  g.fillStyle = C.rgba('#2a2a26', 0.35);
  for (const fx of [0.12, 0.5, 0.88]) g.fillRect(s.x0 + s.w * fx, s.y0, Math.max(1, 1.6 * z), s.h);
  // the head rail
  g.fillStyle = C.mixHex('#050505', '#8a8882', clamp(env.day * 0.7 + 0.04)); g.fillRect(s.x0, s.y0, s.w, 9 * z);
}

// glass by day and at dusk: the mirrored street (sky, the low block opposite, the lamp post), drifting overcast, wear in the light.
// A slap on the glass flexes the pane: the reflection shivers for a few frames.
function dayGlass(ad, cam, f, c, t, k) {
  const r = winRect(f, c), s = scr(cam, r), d = DRESS[`${f},${c}`];
  if (!onScreen(s, 10)) return;
  ad.save(); ad.setTransform(1, 0, 0, 1, 0, 0); ad.beginPath(); ad.rect(s.x0, s.y0, s.w, s.h); ad.clip();
  let flex = 0;
  for (const cd of CARDS) if (cd.f === f && cd.c === c) { const dt = t - EV[cd.ev]; if (dt > 0 && dt < 0.25) flex += 4 * Math.exp(-dt / 0.05) * Math.sin(dt * 95); }
  C.apply(ad, cam, 1.8); ad.translate(0, flex / (cam.zoom / 1.8));
  if (d.crack) ad.translate(0, -60);   // the tipped pane mirrors a different slice
  if (k.day > 0) { ad.globalAlpha = 0.34 * k.day; ad.drawImage(T.reflDay, RP.X0, RP.Y0, RP.PW, RP.PH); }
  if (k.dusk > 0) { ad.globalAlpha = 0.36 * k.dusk; ad.drawImage(T.reflDusk, RP.X0, RP.Y0, RP.PW, RP.PH); }
  // clouds, only in the mirrored sky (above the opposite roof), drifting 12 px/s at 1.6× the façade's parallax
  ad.beginPath(); ad.rect(RP.X0, RP.Y0, RP.PW, RP.ROOF - RP.Y0); ad.clip();
  C.apply(ad, cam, 2.6);
  const cw = 9600, chh = 2800, drift = (t * 12 * 2.6) / cam.zoom, cy = RP.ROOF - chh;
  ad.globalAlpha = 0.14 * k.day;
  for (let x = -4000 + (drift % cw); x < 8000; x += cw) { ad.drawImage(T.clouds, x - cw, cy, cw, chh); ad.drawImage(T.clouds, x, cy, cw, chh); }
  ad.restore();
  // wear: dust, rings, a drip, a print — where light grazes it; an old sign's cleaner ghost; tape residue
  C.apply(ad, cam);
  ad.save(); ad.beginPath(); ad.rect(r.x, r.y, r.w, r.h); ad.clip();
  ad.globalAlpha = clamp(k.wear); ad.drawImage(T.wear[(f * 7 + c + 12) % 6], r.x, r.y, r.w, r.h);
  if (d.oldSign) { const [u, v, w, h] = d.oldSign; ad.globalAlpha = 0.16 * k.day; ad.strokeStyle = '#ffffff'; ad.lineWidth = 2; ad.strokeRect(r.x + u * r.w, r.y + v * r.h, w * r.w, h * r.h); ad.globalAlpha = 0.05 * k.day; ad.fillStyle = '#ffffff'; ad.fillRect(r.x + u * r.w, r.y + v * r.h, w * r.w, h * r.h); }
  if (d.residue) { ad.fillStyle = '#ffffff'; ad.globalAlpha = 0.14 * k.day; for (const [u, v] of [[0.2, 0.12], [0.62, 0.1], [0.24, 0.7], [0.66, 0.74]]) ad.fillRect(r.x + u * r.w, r.y + v * r.h, 44, 14); }
  ad.restore(); ad.globalAlpha = 1;
}
// a window's frame (graphite mullion) over everything inside it
function frame(g, cam, f, c) {
  const r = winRect(f, c); C.apply(g, cam);
  g.strokeStyle = '#111214'; g.lineWidth = 9; g.strokeRect(r.x + 4.5, r.y + 4.5, r.w - 9, r.h - 9);
  g.fillStyle = 'rgba(255,255,255,0.05)'; g.fillRect(r.x, r.y, r.w, 1);
}
// the window head's shade on everything behind the glass (overcast light comes from above; the recess is 20 cm deep)
function headShade(ml, cam, f, c, k) {
  if (k <= 0.01) return;
  const s = scr(cam, winRect(f, c)); if (!onScreen(s)) return;
  ml.save(); ml.setTransform(1, 0, 0, 1, 0, 0); ml.globalCompositeOperation = 'multiply';
  const gr = ml.createLinearGradient(0, s.y0, 0, s.y0 + s.h * 0.4);
  gr.addColorStop(0, C.mixHex('#ffffff', '#9a9893', k)); gr.addColorStop(1, '#ffffff');
  ml.fillStyle = gr; ml.fillRect(s.x0, s.y0, s.w, s.h * 0.4);
  ml.restore();
}

// ---------------------------------------------------------------- cards (DOM) — placement, slam, shadow, light, tape
function cardPose(cd, t) {
  const r = winRect(cd.f, cd.c), dt = t - EV[cd.ev];
  let rot = cd.rot, sc = cd.s, dx = 0, dy = 0;
  if (dt < 2 / 60) { sc *= 1.028; dx = -3; dy = -4; } else if (dt < 3 / 60) { sc *= 1.009; dx = -1; dy = -1; }     // slam, 2-frame settle
  if (cd === ORBIT && t > EV['tape-lift']) rot = lerp(cd.rot, 2.0, C.spring(t - EV['tape-lift'], { k: 90, c: 9 }));  // the card sags 0.8° → 2.0°
  return { x: r.x + cd.x + dx, y: r.y + cd.y + dy, rot, s: sc, w: CARD_W * sc, h: cd.h * sc, dt };
}
function cardQuad(cam, p) {
  const a = (p.rot * Math.PI) / 180, ca = Math.cos(a), sa = Math.sin(a);
  return [[0, 0], [p.w, 0], [p.w, p.h], [0, p.h]].map(([u, v]) => C.toScreen(cam, p.x + u * ca - v * sa, p.y + u * sa + v * ca));
}
const poly = (g, q) => { g.beginPath(); q.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); };
const visibleCards = (t) => CARDS.filter((cd) => t >= EV[cd.ev]);
// the card's shadow falls on a blind or slats a few centimetres behind the glass (nothing visible on a deep dark room)
function cardShadow(g, cam, cd, p, k, roll) {
  const r = winRect(cd.f, cd.c), s = scr(cam, r), d = DRESS[`${cd.f},${cd.c}`];
  const behind = d.venetian ? s.h : s.h * roll;
  if (behind <= 0 || k <= 0.01) return;
  const slam = p.dt < 3 / 60 ? 1.8 : 1, z = cam.zoom;
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.beginPath(); g.rect(s.x0, s.y0, s.w, behind); g.clip();
  g.filter = `blur(${Math.max(1, 2.5 * z * slam).toFixed(1)}px)`;
  g.translate(2.5 * z * slam, 5 * z * slam);
  poly(g, cardQuad(cam, p)); g.fillStyle = shadeRGBA((d.venetian ? 0.3 : 0.4) * k); g.fill();
  g.restore();
}
function placeCard(cd, cam, p) { C.place(cd.el, cam, p.x, p.y, 1, `rotate(${p.rot.toFixed(3)}deg) scale(${p.s.toFixed(5)})`); }
// light on the card face (mul): the window light at the glass; extra() adds the time-lapse sun
function cardLight(ml, cam, p, col, extra) {
  ml.save(); ml.setTransform(1, 0, 0, 1, 0, 0); poly(ml, cardQuad(cam, p)); ml.clip();
  ml.fillStyle = col; ml.fillRect(0, 0, W, H);
  if (extra) extra(ml);
  ml.restore();
}
// tape over the card's top edge (or diagonal over its corner), frosty on 'add', its edge shadow on 'mul'; clipped to the glass
function tapeStrip(ad, ml, cam, cd, p, light, t) {
  const a = (p.rot * Math.PI) / 180, [u, v, ang] = cd.tape;
  const lx = u * p.s, ly = v * p.s;
  const wx = p.x + lx * Math.cos(a) - ly * Math.sin(a), wy = p.y + lx * Math.sin(a) + ly * Math.cos(a);
  const tw = cd.corner ? 104 : 92, th = 30;
  const flut = p.dt < 1.5 / 60 ? 7 : p.dt < 3 / 60 ? 3 : 0;                 // the free corner flutters for 1–2 frames after the slap
  const lift = cd === ORBIT && t > EV['tape-lift'] ? 6 * C.spring(t - EV['tape-lift'], { k: 220, c: 12 }) : 0;   // and Orbit's lifts 6°
  const r = winRect(cd.f, cd.c);
  for (const [g, mode] of [[ml, 'mul'], [ad, 'add']]) {
    C.apply(g, cam); g.save(); g.beginPath(); g.rect(r.x + 9, r.y + 9, r.w - 18, r.h - 18); g.clip();
    g.translate(wx, wy); g.rotate(a + (ang * Math.PI) / 180);
    if (mode === 'mul') { g.fillStyle = shadeRGBA(0.12 * light); g.fillRect(-tw / 2, th / 2 - 1, tw, 2); }
    else {
      g.globalAlpha = clamp(0.5 * light); g.drawImage(T.tape, -tw / 2, -th / 2, tw, th);
      if (flut || lift) {
        g.save(); g.translate(tw / 2, 0); g.rotate((-lift * Math.PI) / 180);
        g.globalAlpha = clamp(0.4 * light); g.fillStyle = '#ffffff'; g.fillRect(-16, -th / 2 - flut, 16, th);
        g.restore();
      }
      if (cd === ORBIT) { g.globalAlpha = clamp(0.6 * light); g.drawImage(T.fp, -24, -16, 38, 38); }   // a fingerprint on the tape
    }
    g.restore(); g.globalAlpha = 1;
  }
}

// ---------------------------------------------------------------- vinyl (S1), on the front layer (outside the glass)
function drawVinyl(fr, cam, t) {
  for (let i = 0; i < VINYL.length; i++) {
    const v = VINYL[i], p = peel(t, i);
    if (p <= 0) continue;
    const r = winRect(2, v.c), sp = T.vinyl[i];
    const x = r.x + 36 - sp.pad, y = r.y + 204 + v.dy - sp.baseline, tw = sp.textW + 2;
    C.apply(fr, cam); fr.save(); fr.translate(x + sp.pad, y + sp.baseline); fr.rotate((v.rot * Math.PI) / 180); fr.translate(-sp.pad, -sp.baseline);
    fr.save(); fr.beginPath(); fr.rect(0, 0, sp.pad + tw * p, sp.height); fr.clip(); fr.drawImage(sp, 0, 0); fr.restore();
    // transfer tape: a milky film laid left→right with the letters (7 frames), then its backing peels away from the right
    const tEnd = i === 0 ? 0.12 : EV[v.ev] + PEEL, back = clamp(1 - (t - tEnd) / 0.12);
    if (back > 0) {
      const top = sp.baseline - sp.asc - 22, hh = sp.asc + sp.desc + 44, x0 = sp.pad - 14, full = tw + 28;
      const edge = p < 1 ? x0 + full * p : x0 + full * back;
      fr.fillStyle = C.rgba('#ffffff', 0.12); fr.fillRect(x0, top, Math.max(0, edge - x0), hh);
      const gr = fr.createLinearGradient(edge - 18, 0, edge + 8, 0);
      gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.6, 'rgba(255,255,255,0.22)'); gr.addColorStop(0.78, 'rgba(255,255,255,0.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      fr.fillStyle = gr; fr.fillRect(edge - 18, top - 4, 26, hh + 8);
      fr.fillStyle = 'rgba(0,0,0,0.10)'; fr.fillRect(edge + 8, top - 4, 3, hh + 8);
    }
    fr.restore();
  }
}

// ---------------------------------------------------------------- light-type (S3, S15), screen space at the locked camera
// level 0..1 lit; amb = ambient luminance for the unlit opal faces; clipS = the window rect on screen.
function drawLT(g, ad, pk, x, y, level, amb, clipS, bloom = 0.12) {
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.beginPath(); g.rect(clipS.x0 + 5, clipS.y0 + 5, clipS.w - 10, clipS.h - 10); g.clip();
  g.globalAlpha = 0.4; g.drawImage(pk.ret, x + 1.5, y + 2);                                   // the returns (metal sides), below-right
  g.globalAlpha = clamp(amb * 0.9 * (1 - level)); g.drawImage(pk.face, x, y);              // unlit opal faces catch a little ambient
  if (level > 0.002) {
    g.globalCompositeOperation = 'lighter'; g.globalAlpha = clamp(0.3 * level); g.drawImage(pk.halo, x, y);
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = clamp(level); g.drawImage(pk.core, x, y);
  }
  g.restore(); g.globalAlpha = 1;
  if (level > 0.002) { ad.save(); ad.setTransform(1, 0, 0, 1, 0, 0); ad.globalAlpha = clamp(bloom * level); ad.drawImage(pk.bloom, x, y); ad.restore(); }
}
// two hanging wires from the window head to the sign (nothing floats)
function wires(g, clipS, x, y, pk, level, amb) {
  const top = clipS.y0 + 5, yb = y + pk.base - 74;
  if (yb <= top) return;
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  for (const fx of [0.18, 0.82]) {
    const wx = Math.round(x + pk.pad + pk.adv * fx) + 0.5, gr = g.createLinearGradient(0, top, 0, yb);
    gr.addColorStop(0, C.rgba('#9aa0a2', 0.08 + amb * 0.3)); gr.addColorStop(1, C.rgba('#c9cdcd', 0.08 + 0.3 * level + amb * 0.3));
    g.strokeStyle = gr; g.lineWidth = 1; g.beginPath(); g.moveTo(wx, top); g.lineTo(wx, yb); g.stroke();
  }
  g.restore();
}

// ---------------------------------------------------------------- the foreground lamp post (S1 → S2 wipe)
function post(t) {
  const u = invLerp(b(3.66), b(4.14), t);
  if (u <= 0 || u >= 1) return;
  const fr = C.L.front; fr.setTransform(1, 0, 0, 1, 0, 0);
  const x = lerp(2250, -620, ease.inOutCubic(u)), w = 600;
  fr.globalAlpha = 1; fr.drawImage(T.post, x - w / 2, -500, w, 2100);
}

// ---------------------------------------------------------------- ACT I renderer (S1 → S3 is one continuous world)
const UNITS = { g12: [0, 1], then: [1, 1], itgoes: [1, 2] };
function act1Lights(t) {
  const o = ob(t);
  const amb = o < 4.75 ? AMB[0][1] : ramp(AMB, o), ambLo = o < 4.75 ? AMB_LO[0][1] : ramp(AMB_LO, o);
  const tubes = { g12: tube(t, EV['tube-1'], EV['g12-dies']), then: tube(t, EV['tube-2'], EV['then-off']), itgoes: tube(t, EV['tube-3'], EV['itgoes-off']) };
  const flash = { g12: flashAt(t, EV['g12-dies']), then: flashAt(t, EV['then-off']), itgoes: flashAt(t, EV['itgoes-off']) };
  // channel letters: on together at the low E5 (quiet-lit), off with their units
  const on = (t0, rise = 0.05) => C.bulb(t, [[t0, 1]], rise, 0.12);
  const lt = {
    then: C.bulb(t, [[EV['quiet-lit'], 1], [EV['then-off'], 0]], 0.05, 0.09),
    itgoes: C.bulb(t, [[EV['quiet-lit'], 1], [EV['itgoes-off'], 0]], 0.06, 0.09),
  };
  // "quiet." flickers twice and its letters decay over 0.35 s; the full stop holds an afterglow alone until stop-dies
  const tq = EV['quiet-dies'], fq = Math.floor((t - tq) * 60), FL = [0.22, 0.95, 0.12, 0.08, 0.9, 0.7];
  let q = on(EV['quiet-lit'], 0.07), dot = q;
  if (t >= tq) {
    if (fq < FL.length) { q = FL[fq]; dot = FL[fq]; }
    else {
      const u = t - tq - FL.length / 60;
      q = 0.7 * Math.exp(-u / 0.09) * (1 - clamp(u / 0.3));
      dot = t < EV['stop-dies'] ? lerp(0.7, 0.34, ease.outCubic(clamp(u / 0.2))) * (1 + 0.04 * Math.sin(u * 37)) : 0.34 * Math.exp(-(t - EV['stop-dies']) / 0.035);
    }
  }
  return { o, day: dayK(t), amb, ambLo, tubes, flash, lt, q, dot };
}

function renderAct1(t) {
  const g = C.L.world, ml = C.L.mul, ad = C.L.add, fr = C.L.front;
  const cam = camAct1(t), L = act1Lights(t), o = L.o, zoom = cam.zoom, base = C.toScreen(cam, 0, 0)[1];
  const flick = lapseFlicker(t);
  const amb = C.mixHex('#000000', L.amb, clamp(flick)), ambLo = C.mixHex('#000000', L.ambLo, clamp(flick)), ambL = lum(L.amb);

  // ---------- albedo: the Block, its weathering, close-up tooth, the G·12 stencil, the pavement
  drawBlockAlbedo(g, cam);
  C.apply(g, cam); g.globalCompositeOperation = 'multiply'; g.drawImage(T.weather, WX0, WY0, WW, WH);
  if (zoom > 1.2) {
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = clamp((zoom - 1.2) / 0.8);
    const pat = g.createPattern(T.micro, 'repeat'), k = zoom * 0.45, [ox0, oy0] = C.toScreen(cam, 0, 0);
    pat.setTransform(new DOMMatrix([k, 0, 0, k, ox0, oy0])); g.fillStyle = pat; g.fillRect(0, 0, W, H); g.globalAlpha = 1;
  }
  g.globalCompositeOperation = 'source-over';
  C.apply(g, cam); g.globalAlpha = 0.85; g.drawImage(T.g12, winX(1) + 18, PLINTH.top + 26); g.globalAlpha = 1;
  const gm = base < H ? groundModel(cam, base - 203 * zoom / 0.9, base) : null;
  if (gm) drawGround(g, cam, gm);

  // ---------- irradiance: sky (overcast → dusk ramp), a soft key from upper left, overhang shade, the lapse sun, the tubes' spill
  const [, yTop] = C.toScreen(cam, 0, -2200), [, yBot] = C.toScreen(cam, 0, 0);
  const irr = irrBegin([[yTop, amb], [yBot, ambLo]]);
  if (L.day > 0.02) {
    const kg = irr.createLinearGradient(0, 0, W, H);
    kg.addColorStop(0, C.rgba('#fbf6ec', 0.06 * L.day)); kg.addColorStop(1, 'rgba(0,0,0,0)');
    irr.fillStyle = kg; irr.fillRect(0, 0, W, H);
  }
  skyOcclusion(irr, cam, 0.8 * clamp(L.day + 0.3));
  const sun = sunPatch(t);
  if (sun.k > 0) { irr.fillStyle = sun.grad(irr); irr.fillRect(0, 0, W, H); }
  for (const [key, [f, c]] of Object.entries(UNITS)) {
    const v = L.tubes[key] * (key === 'g12' ? 1 : 0.55); if (v <= 0.003) continue;
    const s = scr(cam, winRect(f, c)), col = L.flash[key] ? '#c8dcff' : '#b9cdd4';
    C.falloff(irr, (s.x0 + s.x1) / 2, s.y1 + 6 * zoom, 120 * zoom, col, 0.4 * v, 4);
    C.falloff(irr, s.x0 - 4, (s.y0 + s.y1) / 2, 60 * zoom, '#a9bcc3', 0.18 * v, 3);
    C.falloff(irr, s.x1 + 4, (s.y0 + s.y1) / 2, 60 * zoom, '#a9bcc3', 0.18 * v, 3);
    if (f === 0 && gm) { irr.filter = `blur(${(10 * zoom).toFixed(1)}px)`; groundQuad(irr, cam, gm, winRect(f, c).x + 30, winRect(f, c).x + WIN - 30, 0, 400, C.rgba('#a9bcc4', 0.2 * v)); irr.filter = 'none'; }
  }
  if (o > 5.9) {   // the letters light their sills a little
    for (const [f, c, v, col] of [[1, 1, L.lt.then, '#f5f5ef'], [1, 2, L.lt.itgoes, '#f5f5ef'], [0, 2, Math.max(L.q, L.dot * 0.4), '#8a8a84']]) {
      if (v > 0.01) { const s = scr(cam, winRect(f, c)); C.falloff(irr, (s.x0 + s.x1) / 2 + 60, s.y1 + 6, 90 * zoom, col, 0.16 * v, 3); }
    }
  }
  irrApply(g);

  // ---------- windows (emissive pass: interiors carry their own light)
  const env = (f, c) => {
    const key = Object.keys(UNITS).find((k) => UNITS[k][0] === f && UNITS[k][1] === c);
    return { day: L.day * flick, tube: key ? L.tubes[key] * (key === 'g12' ? 1 : 0.38) : 0, flash: key ? L.flash[key] : 0 };
  };
  for (let f = 0; f <= 3; f++) for (let c = -1; c <= 4; c++) room(g, cam, f, c, env(f, c));
  const inWin = clamp(L.day + 0.12);                     // light at the glass, relative to the open façade
  for (const cd of visibleCards(t)) cardShadow(g, cam, cd, cardPose(cd, t), inWin, DRESS[`${cd.f},${cd.c}`].roll);
  // light-type (S3) — the locked camera only
  if (t >= b(5.96)) {
    const sThen = scr(cam, winRect(1, 1)), sIt = scr(cam, winRect(1, 2)), sQ = scr(cam, winRect(0, 2)), unlit = ambL * 0.35;
    const P = (pk, pos) => [pos[0] - pk.core.pad, pos[1] - pk.core.base];
    const [tx, ty] = P(T.then, LTPOS.then), [ix, iy] = P(T.itgoes, LTPOS.itgoes), [qx, qy] = T.quietXY;
    wires(g, sThen, tx, ty, T.then.core, L.lt.then, unlit); drawLT(g, ad, T.then, tx, ty, L.lt.then, unlit, sThen);
    wires(g, sIt, ix, iy, T.itgoes.core, L.lt.itgoes, unlit); drawLT(g, ad, T.itgoes, ix, iy, L.lt.itgoes, unlit, sIt);
    wires(g, sQ, qx, qy, T.qwire, Math.max(L.q, L.dot * 0.3), unlit);
    drawLT(g, ad, T.quiet, qx, qy, L.q, unlit, sQ);
    drawLT(g, ad, T.stop, qx, qy, L.dot, unlit, sQ, 0.2);
  }
  for (let f = 0; f <= 3; f++) for (let c = -1; c <= 4; c++) frame(g, cam, f, c);

  // ---------- UI: the real cards, lit by the window light (mul); glass, tape (add); the head's shade over all of it (mul)
  const glassK = { day: L.day, dusk: clamp(1 - L.day) * clamp(invLerp(8.6, 6.0, o)), wear: 0.14 + 0.3 * L.day };
  const cardCol = C.mixHex('#000000', C.mixHex(ambLo, amb, 0.5), 0.92 * lerp(0.45, 1, L.day));
  for (const cd of visibleCards(t)) {
    const p = cardPose(cd, t), q = cardQuad(cam, p);
    if (q.every(([x]) => x < -50) || q.every(([x]) => x > W + 50) || q.every(([, y]) => y > H + 50) || q.every(([, y]) => y < -50)) continue;
    placeCard(cd, cam, p);
    cardLight(ml, cam, p, cardCol, sun.k > 0 ? (m) => { m.globalCompositeOperation = 'lighter'; m.fillStyle = sun.grad(m, 1); m.fillRect(0, 0, W, H); } : null);
    tapeStrip(ad, ml, cam, cd, p, clamp(0.08 + 0.92 * L.day) * (0.3 + 0.7 * clamp(ambL * 1.2)), t);
  }
  if (ORBIT) { const dl = t - EV['live-dies']; ORBIT.dot.style.opacity = dl < 0 ? '1' : dl < 3 / 60 ? '0' : dl < 6 / 60 ? '1' : '0'; }  // LIVE blinks once, dies
  for (let f = 0; f <= 3; f++) for (let c = -1; c <= 4; c++) {
    headShade(ml, cam, f, c, 0.85 * L.day);
    if (glassK.day + glassK.dusk > 0.01) dayGlass(ad, cam, f, c, t, glassK);
    if (L.day < 0.5) drawGlass(ad, cam, f, c, 0.06 + (f === 0 && c === 1 ? 0.12 * L.tubes.g12 : 0), f * 5 + c + 8);
  }
  if (o < 4.2) drawVinyl(fr, cam, t);
  post(t);
  return { grain: lerp(0.05, 0.04, L.day), vignette: lerp(0.11, 0.06, L.day) };
}

// The time-lapse sun: a low warm-neutral patch on the façade, its edge (the opposite tower's shadow) sweeping right → left.
function sunPatch(t) {
  const u = invLerp(b(4.8), b(5.42), t), k = clamp(invLerp(b(4.75), b(4.86), t)) * (u < 1 ? 1 : 0);
  if (k <= 0) return { k: 0 };
  const ex = lerp(2300, -700, ease.inOutCubic(u)), nx = 0.91, ny = -0.41;
  const grad = (g, mul = 1) => {
    const gr = g.createLinearGradient(ex - nx * 200, 540 - ny * 200, ex + nx * 200, 540 + ny * 200);
    gr.addColorStop(0, C.rgba('#fff3e2', 0.42 * k * mul)); gr.addColorStop(1, 'rgba(0,0,0,0)');
    return gr;
  };
  return { k, grad };
}

C.shot('s01-launch', (t) => renderAct1(t));
C.shot('s02-exists', (t) => renderAct1(t));
C.shot('s03-quiet', (t) => renderAct1(t));

// ---------------------------------------------------------------- S15 · "Now quiet is a choice."  (the rhyme frame, at night)
// Orbit's bays glow as thin seams through nearly shut slats (72°): quiet, but home. The words light on 8ths with the switch.
function shutWindow(g, cam, c, I) {
  const r = winRect(0, c), s = scr(cam, r), z = cam.zoom;
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.beginPath(); g.rect(s.x0, s.y0, s.w, s.h); g.clip();
  g.fillStyle = '#060706'; g.fillRect(s.x0, s.y0, s.w, s.h);
  const lamp = c === 2 ? [0.36, 0.40] : [-0.42, 0.40];
  const lampAt = (x, y) => I / (1 + ((x - s.w * lamp[0]) ** 2 + (y - s.h * lamp[1]) ** 2) / ((190 * z) ** 2));
  const p = s.h / 16;
  for (let i = 0; i < 16; i++) {
    const y0 = s.y0 + i * p;
    // slat face: the outside of a translucent slat, faintly warmed from behind near the lamp; moonlight along its curve
    const gr = g.createLinearGradient(s.x0, 0, s.x1, 0);
    for (let k = 0; k <= 8; k++) { const L = lampAt((k / 8) * s.w, (i + 0.5) * p); gr.addColorStop(k / 8, C.mixHex('#121516', '#3c4a16', clamp(L * 0.5))); }
    g.fillStyle = gr; g.fillRect(s.x0, y0, s.w, p);
    g.fillStyle = 'rgba(150,170,180,0.06)'; g.fillRect(s.x0, y0, s.w, 1);
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(s.x0, y0 + p * 0.55, s.w, p * 0.45);
    // the seam under each slat: light escaping, hot near the lamp, olive where it has travelled
    const sg = g.createLinearGradient(s.x0, 0, s.x1, 0);
    for (let k = 0; k <= 10; k++) {
      const L = lampAt((k / 10) * s.w, (i + 1) * p);
      sg.addColorStop(k / 10, L > 0.6 ? C.mixHex('#b9e23a', '#f3ffc4', (L - 0.6) / 0.5) : L > 0.15 ? C.mixHex('#5d7120', '#a6c832', (L - 0.15) / 0.45) : C.mixHex('#101208', '#5d7120', L / 0.15));
    }
    const bent = c === 2 && i === 5;
    g.fillStyle = sg; g.fillRect(s.x0, y0 + p - 1.2, s.w, bent ? 2.4 : 1.2);
    if (bent) { g.fillStyle = C.rgba('#f3ffc4', 0.3 * I); g.beginPath(); g.moveTo(s.x0 + 300 * z, y0 + p - 2); g.lineTo(s.x0 + 470 * z, y0 + p - 1); g.lineTo(s.x0 + 440 * z, y0 + p + 3); g.lineTo(s.x0 + 330 * z, y0 + p + 2); g.fill(); }
  }
  g.fillStyle = 'rgba(8,8,7,0.55)'; for (const fx of [0.12, 0.5, 0.88]) g.fillRect(s.x0 + s.w * fx, s.y0, 1.2, s.h);
  if (c === 3) { g.strokeStyle = 'rgba(20,20,18,0.95)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(s.x1 - 21, s.y0); g.lineTo(s.x1 - 21, s.y0 + s.h * 0.72); g.stroke(); g.fillStyle = '#20201d'; g.fillRect(s.x1 - 24, s.y0 + s.h * 0.72, 6, 13); }
  g.restore();
}
function engrave(g, cam, x, y, light) {
  if (light <= 0.005) return;
  C.apply(g, cam);
  g.globalAlpha = clamp(light) * 0.55; g.globalCompositeOperation = 'multiply'; g.drawImage(T.identDark, x + 1.5, y + 1.5);
  g.globalAlpha = clamp(light) * 0.45; g.globalCompositeOperation = 'screen'; g.drawImage(T.ident, x - 1, y - 1);
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
}
// the neighbours, lit cold, blinds at other heights than in S3 — the block lives differently now
const NEIGH = [[0, 0, 0.55, 0.2], [0, 1, 0.7, 0.72], [1, 0, 0.5, 0.55], [1, 1, 0.62, 0.18], [1, 2, 0.24, 0.06]];
C.shot('s15-choice', (t) => {
  const g = C.L.world, ml = C.L.mul, ad = C.L.add, cam = C.cam(RHYME.x, RHYME.y, RHYME.z), zoom = cam.zoom;
  const br = C.breath(t), I = br;
  const base = C.toScreen(cam, 0, 0)[1], gm = groundModel(cam, base - 203 * zoom / 0.9, base);
  const lit = {
    quiet: C.bulb(t, [[EV['silence-2'], 1]], 0.05, 0.1),
    now: C.bulb(t, [[EV['now-lit'], 1]], 0.05, 0.1),
    choice: C.bulb(t, [[EV['choice-lit'], 1]], 0.05, 0.1) * br,
    far: tube(t, b(40.5), null),
  };
  const leak = I * (0.18 + 0.82 * 0.05);
  // ---------- albedo
  drawBlockAlbedo(g, cam);
  C.apply(g, cam); g.globalCompositeOperation = 'multiply'; g.drawImage(T.weather, WX0, WY0, WW, WH); g.globalCompositeOperation = 'source-over';
  g.globalAlpha = 0.85; g.drawImage(T.g12, winX(1) + 18, PLINTH.top + 26); g.globalAlpha = 1;
  drawGround(g, cam, gm);
  // ---------- irradiance: moon + Orbit's leak + neighbours + the letters
  const irr = irrBegin([[0, '#1d2429'], [H * 0.7, '#1a2025'], [H, '#151a1e']]);
  skyOcclusion(irr, cam, 0.5);
  for (const c of [2, 3]) {
    const s = scr(cam, winRect(0, c)), cx = (s.x0 + s.x1) / 2;
    C.falloff(irr, cx, s.y1 + 8 * zoom, 120 * zoom, '#b8dd3a', 0.75 * leak, 4);
    C.falloff(irr, s.x0 - 4, (s.y0 + s.y1) / 2, 60 * zoom, '#a6c832', 0.35 * leak, 3);
    C.falloff(irr, s.x1 + 4, (s.y0 + s.y1) / 2, 60 * zoom, '#a6c832', 0.35 * leak, 3);
    const pg = irr.createLinearGradient(0, s.y1, 0, s.y1 + 130 * zoom);
    pg.addColorStop(0, C.rgba('#b2d63a', 0.42 * leak)); pg.addColorStop(1, C.rgba('#b2d63a', 0));
    irr.fillStyle = pg; irr.fillRect(s.x0 - 20 * zoom, s.y1, s.w + 40 * zoom, 130 * zoom);
    // sixteen thin seams reach the pavement as faint lines (the S12 bands, nearly closed)
    const r = winRect(0, c);
    for (let i = 0; i < 16; i++) { const vc = 30 + (15 - i) * 62, fall = 1 / (1 + (vc / 700) ** 2); groundQuad(irr, cam, gm, r.x + 6, r.x + r.w - 6, vc - 3, vc + 3, C.rgba('#b9dc40', 0.16 * I * fall)); }
  }
  irr.filter = 'blur(6px)';
  for (const [f, c, v] of NEIGH) { const s = scr(cam, winRect(f, c)); C.falloff(irr, (s.x0 + s.x1) / 2, s.y1 + 10, 110 * zoom, '#b9d3dc', 0.28 * v, 4); if (f === 0) groundQuad(irr, cam, gm, winRect(f, c).x + 30, winRect(f, c).x + WIN - 30, 0, 360, C.rgba('#9fb6bf', 0.16 * v)); }
  irr.filter = 'none';
  if (lit.far > 0) { const s = scr(cam, winRect(1, 3)); C.falloff(irr, (s.x0 + s.x1) / 2, s.y1 + 10, 110 * zoom, '#b9d3dc', 0.18 * lit.far, 4); }
  { const s = scr(cam, winRect(0, 3)); C.falloff(irr, LTPOS.isa[0] + 140, s.y1 + 6, 110 * zoom, '#c6ef3a', 0.24 * lit.choice, 3); }
  { const s = scr(cam, winRect(1, 2)); C.falloff(irr, LTPOS.now[0] + 90, s.y1 + 6, 90 * zoom, '#f5f5ef', 0.12 * lit.now, 3); }
  irrApply(g);
  // ---------- windows
  for (let f = 0; f <= 1; f++) for (let c = -1; c <= 4; c++) {
    if (f === 0 && (c === 2 || c === 3)) continue;
    const n = NEIGH.find(([nf, nc]) => nf === f && nc === c);
    room(g, cam, f, c, { day: 0, tube: n ? n[2] : f === 1 && c === 3 ? 0.5 * lit.far : 0, roll: n ? n[3] : f === 1 && c === 3 ? 0.3 : 0.5 });
  }
  for (const c of [2, 3]) shutWindow(g, cam, c, I);
  for (let f = 0; f <= 1; f++) for (let c = -1; c <= 4; c++) frame(g, cam, f, c);
  // plinth: G·14 lit, the identity line faintly legible in the spill
  const plinthLight = clamp(leak * 1.6) * 0.55;
  engrave(g, cam, winX(2) + 150, PLINTH.top + 52, plinthLight);
  C.apply(g, cam); g.globalAlpha = 0.25 + 0.6 * plinthLight; g.globalCompositeOperation = 'screen'; g.drawImage(T.g14lit, winX(2) + 18, PLINTH.top + 26); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  // ---------- the sign, small in c3's lower right: plumb (the manager is precise), its dot breathing
  const sr = winRect(0, 3), sx = sr.x + 118, sy = sr.y + 254;
  sign.el.style.visibility = 'visible'; sign.el.style.transform = C.domTransform(cam, sx, sy, 1, '');
  sign.dot.style.opacity = clamp(0.82 + 6 * (br - 1)).toFixed(3);
  C.apply(g, cam); g.strokeStyle = 'rgba(20,20,19,0.95)'; g.lineWidth = 2; g.beginPath(); g.moveTo(sx + 210, sr.y); g.lineTo(sx + 210, sy); g.stroke();
  C.apply(ml, cam); ml.fillStyle = C.rgba('#5a6470', 0.5); roundRect(ml, sx, sy, 420, 134, 18); ml.fill();
  C.apply(ad, cam); ad.strokeStyle = C.rgba('#d4ff3f', 0.2 * I); ad.lineWidth = 2.5; ad.filter = 'blur(2px)'; roundRect(ad, sx - 1, sy - 1, 422, 136, 19); ad.stroke(); ad.filter = 'none';
  // ---------- the words (channel letters behind the glass), one switch click per group on 8ths
  const sQ = scr(cam, winRect(0, 2)), sNow = scr(cam, winRect(1, 2)), sC = scr(cam, winRect(0, 3)), unlit = 0.06;
  const [qx, qy] = T.quietXY;
  wires(g, sQ, qx, qy, T.qwire, lit.quiet, unlit);
  drawLT(g, ad, T.quiet, qx, qy, lit.quiet, unlit, sQ);
  const nx = LTPOS.now[0] - T.now.core.pad, ny = LTPOS.now[1] - T.now.core.base;
  wires(g, sNow, nx, ny, T.now.core, lit.now, unlit);
  drawLT(g, ad, T.now, nx, ny, lit.now, unlit, sNow);
  const ix = LTPOS.isa[0] - T.isa.core.pad, iy = LTPOS.isa[1] - T.isa.core.base, chx = LTPOS.choice[0] - T.choice.core.pad, chy = LTPOS.choice[1] - T.choice.core.base;
  wires(g, sC, ix, iy, T.isa.core, lit.choice, unlit);
  if (lit.choice > 0) { // the volt letters light the slats right behind them
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.beginPath(); g.rect(sC.x0, sC.y0, sC.w, sC.h); g.clip();
    g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.16 * lit.choice; g.drawImage(T.isa.bloom, ix, iy); g.drawImage(T.choice.bloom, chx, chy); g.restore();
  }
  drawLT(g, ad, T.isa, ix, iy, lit.choice, unlit, sC, 0.08);
  drawLT(g, ad, T.choice, chx, chy, lit.choice, unlit, sC, 0.08);
  for (let f = 0; f <= 1; f++) for (let c = -1; c <= 4; c++) drawGlass(ad, cam, f, c, f === 0 && (c === 2 || c === 3) ? 0.3 : 0.1, f * 5 + c + 8);
  { const [hx, hy] = C.toScreen(cam, winX(2) + WIN * 0.36, GROUND.top + 430 * 0.4); C.falloff(ad, hx, hy, 60 * zoom, '#d4ff3f', 0.05 * I, 5); }
  return { grain: 0.05, vignette: 0.11 };
});
