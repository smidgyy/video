// FAÇADE — "the Block". One board-formed concrete slab, ground floor + 4 storeys, bay pitch 760 world px.
// Orbit = unit G·14 = ground-floor bays c2 + c3. World units: 1 px ≈ 5 mm; y grows downward, ground line y = 0.
// Shots here: S12 (the wake). S1–S3 and S15 reuse drawBlock() with their own window states.
import * as C from '../core.js';
import { concrete, glassWear, asphalt, pavement, fingerprint, valueNoise } from '../materials.js';
const { clamp, lerp, invLerp, ease, spring, b, W, H } = C;

export const BAY = 760, WIN = 600, PIER = 160;
export const GROUND = { top: -570, bot: -140 };            // ground-floor windows 600×430
export const PLINTH = { top: -140, bot: 0 };
export const FLOORS = [GROUND, { top: -1090, bot: -790 }, { top: -1610, bot: -1310 }, { top: -2130, bot: -1830 }, { top: -2650, bot: -2350 }];
export const winX = (c) => c * BAY + (BAY - WIN) / 2;
export const winRect = (f, c) => ({ x: winX(c), y: FLOORS[f].top, w: WIN, h: FLOORS[f].bot - FLOORS[f].top });
const FX0 = -760 * 2, FX1 = 760 * 6, FY0 = -2900;               // façade texture extent (bays c-2 … c5)

const VOLT = '#d4ff3f', CORE = '#f3ffc4', ICE = '#a8e9ff';
let TEX = {};

// The voice mark's pulse path, in its 32×32 box (exact path from the site's logo).
const PULSE = [[6.5, 16], [9.5, 16], [11.7, 10.5], [15.3, 22.5], [18.7, 7.5], [21.7, 18.5], [23.5, 16], [25.5, 16]];
const INSTR = ['', 'You are the anonymous admin of this coin.', '', 'You are extremely online, funny, short-form,', 'and naturally confident.', '',
  'Never sound like a corporate social media manager.', '', 'Don’t overexplain.', '', 'Don’t force jokes.', '', 'Build recurring lore.', '',
  'Only post when you have something worth saying.', ''];
const IDENTITY = '$ORBIT · @orbitonsolana · GPT-6 LUNA · CT NATIVE';

export async function init() {
  const sills = [];
  for (let f = 0; f < FLOORS.length; f++) for (let c = -2; c <= 5; c++) sills.push({ x: winX(c) - FX0 + 4, y: FLOORS[f].bot - FY0 + 14, w: WIN - 8 });
  TEX.conc = concrete({ w: FX1 - FX0, h: -FY0 - 140, seed: 1401, tone: '#c4c2ba', sills });
  TEX.plinth = concrete({ w: FX1 - FX0, h: 140, seed: 1403, tone: '#aeaca5', board: 140, tie: [380, 280], crack: false });
  TEX.pave = pavement({ w: 4096, h: 640, seed: 1418, tone: '#7c7d7f', slab: 120 });
  TEX.asph = asphalt({ w: 4096, h: 1024, seed: 1408, tone: '#3c3f42', damp: 0.7 });
  TEX.wear = [0, 1, 2, 3].map((i) => glassWear({ w: WIN, h: 430, seed: 1402 + i, bubble: i === 1 }));
  TEX.print = INSTR.map((s) => s ? C.textSprite(s, { mono: true, size: 17, weight: 400, color: '#0b0f02', tracking: 0, pad: 4 }) : null);
  TEX.g14 = C.textSprite('G·14', { mono: true, size: 28, weight: 500, color: '#5d5d59', tracking: 0.16, pad: 6 });
  TEX.ident = C.textSprite(IDENTITY, { mono: true, size: 22, weight: 500, color: '#ffffff', tracking: 0.14, pad: 6 });
  TEX.identDark = C.textSprite(IDENTITY, { mono: true, size: 22, weight: 500, color: '#000000', tracking: 0.14, pad: 6 });
  TEX.fp = fingerprint(7);
  // ground: one wide strip texture: pavement 0–600 (3 m), granite kerb 600–640, asphalt beyond
  const gw = 4096, gh = 2600, gt = C.canvas(gw, gh), gg = C.ctx2(gt);
  for (let y = 0; y < 1000; y += 640) gg.drawImage(TEX.pave, 0, y);
  gg.fillStyle = '#8d8e8f'; gg.fillRect(0, 1000, gw, 40); gg.fillStyle = 'rgba(255,255,255,0.18)'; gg.fillRect(0, 1001, gw, 2); gg.fillStyle = 'rgba(0,0,0,0.35)'; gg.fillRect(0, 1038, gw, 2);
  for (let y = 1040; y < gh; y += 1024) gg.drawImage(TEX.asph, 0, y);
  TEX.ground = gt;
  TEX.slatShadow = null;
  buildSign();
}

// ---------------------------------------------------------------- the sign (real UI chips on a hung card)
let signEl, chipPaused, chipRunning, signNote;
function buildSign() {
  signEl = document.createElement('div');
  signEl.className = 'ui-item film-sign';
  signEl.innerHTML = `
    <div class="sign-card" style="width:420px;padding:22px 24px 20px;border-radius:18px;background:rgba(14,15,17,0.92);border:1px solid rgba(255,255,255,0.10);box-shadow:inset 0 1px 0 rgba(255,255,255,0.06)">
      <div class="sign-chips" style="position:relative;height:40px">
        <div class="float-chip" id="signPaused" style="position:absolute;left:0;top:0;position:absolute"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pause" aria-hidden="true"><rect x="14" y="3" width="5" height="18" rx="1"></rect><rect x="5" y="3" width="5" height="18" rx="1"></rect></svg> Paused until you say go</div>
        <span class="badge green" id="signRunning" style="position:absolute;left:0;top:4px"><i></i>Running · Approval Mode</span>
      </div>
      <p id="signNote" style="margin:14px 0 0;font:500 15px/1.35 'Geist Mono',monospace;letter-spacing:0.02em;color:#c2c2ba"></p>
    </div>`;
  C.UI.appendChild(signEl);
  chipPaused = signEl.querySelector('#signPaused');
  chipRunning = signEl.querySelector('#signRunning');
  signNote = signEl.querySelector('#signNote');
  const fc = chipPaused; fc.style.animation = 'none';
}
const NOTE = 'Your manager is active. Its launch hour has started.';

// ---------------------------------------------------------------- drawing the block (albedo)
export function drawBlockAlbedo(g, cam) {
  C.apply(g, cam);
  g.drawImage(TEX.conc, FX0, FY0);
  g.drawImage(TEX.plinth, FX0, PLINTH.top);
  // sills: concrete ledges, 18 px, top face catches sky/moon (lighter), underside dark
  for (let f = 0; f < FLOORS.length; f++) for (let c = -2; c <= 5; c++) {
    const r = winRect(f, c);
    g.fillStyle = '#d2d0c8'; g.fillRect(r.x - 14, r.y + r.h, r.w + 28, 6);
    g.fillStyle = '#9a988f'; g.fillRect(r.x - 14, r.y + r.h + 6, r.w + 28, 12);
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(r.x - 10, r.y + r.h + 18, r.w + 20, 5);
    // reveal: the window is set back 40 px into the wall — inner reveal faces
    g.fillStyle = '#8f8d86'; g.fillRect(r.x - 6, r.y - 6, r.w + 12, 6); g.fillRect(r.x - 6, r.y, 6, r.h); g.fillRect(r.x + r.w, r.y, 6, r.h);
  }
  // stencil under bay c2
  g.globalAlpha = 0.9; g.drawImage(TEX.g14, winX(2) + 18, PLINTH.top + 26); g.globalAlpha = 1;
}

// Ground plane, one-point perspective seen from across the street. Screen row y → distance d; s = f/d px per world px.
export function groundModel(cam, horizon = 560, base = 763) {
  const hcam = 225, D = 2000, f = ((base - horizon) * D) / hcam;
  return { horizon, base, hcam, D, f, sAt: (y) => (y - horizon) / hcam, vAt: (y) => D - (f * hcam) / (y - horizon) };
}
export function drawGround(g, cam, gm) {
  g.setTransform(1, 0, 0, 1, 0, 0);
  const tw = TEX.ground.width;
  for (let y = Math.floor(gm.base); y < H; y++) {
    const s = gm.sAt(y + 0.5);                      // horizontal scale at this row (includes zoom)
    const v = gm.vAt(y + 0.5);                      // distance from the façade line (world px)
    if (v < 0 || v >= TEX.ground.height) continue;
    const wx0 = cam.x - W / 2 / s;                  // world x at screen left
    let sx = ((wx0 % tw) + tw) % tw;
    const sw = W / s;
    if (sx + sw <= tw) g.drawImage(TEX.ground, sx, v, sw, 1, 0, y, W, 1);
    else { const a = tw - sx; g.drawImage(TEX.ground, sx, v, a, 1, 0, y, a * s, 1); g.drawImage(TEX.ground, 0, v, sw - a, 1, a * s, y, W - a * s, 1); }
  }
}

// ---------------------------------------------------------------- windows (emissive pass)
// st: { I: lamp 0..1, lamp: [lx, ly] in window-local fractions, slats: [deg ×16] | null, print, room: 0..1, cold: 0..1, bent }
export const slatFace = (a) => Math.abs(Math.sin((a * Math.PI) / 180));
// light from the lamp reaching a point (window-local px), inverse-square-ish, r0 ≈ 1 m behind the slats
const lampAt = (st, r, x, y) => st.I / (1 + ((x - r.w * st.lamp[0]) ** 2 + (y - r.h * st.lamp[1]) ** 2) / (230 * 230));

export function drawWindow(g, cam, f, c, st, t) {
  const r = winRect(f, c);
  C.apply(g, cam);
  g.save();
  g.beginPath(); g.rect(r.x, r.y, r.w, r.h); g.clip();
  g.fillStyle = '#050607'; g.fillRect(r.x, r.y, r.w, r.h);
  if (st.cold) { // another tenant's cold tube light: colourless, flat, slightly blue
    const gr = g.createLinearGradient(r.x, r.y, r.x, r.y + r.h);
    gr.addColorStop(0, C.rgba('#e9f0f3', 0.9 * st.cold)); gr.addColorStop(1, C.rgba('#b9c6cc', 0.75 * st.cold));
    g.fillStyle = gr; g.fillRect(r.x, r.y, r.w, r.h);
    if (st.blind != null) { g.fillStyle = C.rgba('#d8dfe2', 0.95 * st.cold); g.fillRect(r.x, r.y, r.w, r.h * st.blind); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(r.x, r.y + r.h * st.blind - 2, r.w, 2); }
  }
  if (st.I > 0 || st.room > 0) drawRoom(g, cam, r, st);
  if (st.slats) {
    const p = r.h / 16;
    for (let i = 0; i < 16; i++) {
      const a = st.slats[i], k = slatFace(a), face = p * 1.1 * k + 1.6, yc = r.y + (i + 0.5) * p;
      // backlit translucent slat: per-row horizontal gradient from the lamp's falloff
      const gr = g.createLinearGradient(r.x, 0, r.x + r.w, 0);
      for (let s = 0; s <= 8; s++) {
        const L = lampAt(st, r, (s / 8) * r.w, (i + 0.5) * p) * k;
        gr.addColorStop(s / 8, C.mixHex('#18191a', L > 0.6 ? C.mixHex('#b9e23a', '#f3ffc4', (L - 0.6) / 0.5) : C.mixHex('#18191a', '#a9cf30', L / 0.6), clamp(L * 1.25)));
      }
      g.fillStyle = gr; g.fillRect(r.x, yc - face / 2, r.w, face);
      g.fillStyle = `rgba(255,255,255,${(0.05 + 0.05 * (1 - k)).toFixed(3)})`; g.fillRect(r.x, yc - face / 2, r.w, 1);
      g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(r.x, yc + face / 2 - 1, r.w, 1);
      if (st.print && TEX.print[i] && k > 0.3) {   // the instructions, read in silhouette against the backlight
        const sp = TEX.print[i];
        const L = lampAt(st, r, 200, (i + 0.5) * p);
        g.globalAlpha = clamp((L - 0.08) * 3) * 0.82 * clamp((k - 0.3) / 0.4);
        g.drawImage(sp, r.x + 30, yc - sp.baseline * k + 6 * k, sp.width, sp.height * k);
        g.globalAlpha = 1;
      }
    }
    if (st.bent && st.I > 0) { const yc = r.y + 5.5 * p; g.fillStyle = C.rgba(CORE, 0.3 * st.I); g.beginPath(); g.moveTo(r.x + 300, yc - 2); g.lineTo(r.x + 470, yc - 1); g.lineTo(r.x + 440, yc + 4); g.lineTo(r.x + 330, yc + 3); g.fill(); }
    // pull cord at the right of the window
    if (st.cord != null) { g.strokeStyle = 'rgba(30,30,28,0.9)'; g.lineWidth = 2; g.beginPath(); g.moveTo(r.x + r.w - 26, r.y); g.lineTo(r.x + r.w - 26 + st.cord * 6, r.y + r.h * 0.72); g.stroke(); g.fillStyle = '#2a2a27'; g.fillRect(r.x + r.w - 30 + st.cord * 6, r.y + r.h * 0.72, 8, 16); }
  }
  g.restore();
  // frame: graphite mullion, a highlight on its top edge
  g.strokeStyle = '#111214'; g.lineWidth = 9; g.strokeRect(r.x + 4.5, r.y + 4.5, r.w - 9, r.h - 9);
  g.fillStyle = 'rgba(255,255,255,0.05)'; g.fillRect(r.x, r.y, r.w, 1);
}

// The room behind the glass: a plaster wall at depth 1.8, the lamp (the logo tile as a frosted lightbox on a cord),
// two dark plaques under it, the door far back. Lit only by the lamp (falloff), nothing glows without a source.
function drawRoom(g, cam, r, st) {
  const par = (cam.x - 2280) * (1 - 1 / 1.8) * 0.4;
  const lx = r.x + r.w * st.lamp[0] + par, ly = r.y + r.h * st.lamp[1];
  // plaster wall, lit by the lamp
  g.fillStyle = '#0b0c09'; g.fillRect(r.x, r.y, r.w, r.h);
  C.falloff(g, lx, ly + 20, 200, '#8fae2a', 0.85 * st.I, 5);
  C.falloff(g, lx, ly, 70, '#d9f56a', 0.6 * st.I, 3);
  // floor line + door (far back, right)
  g.fillStyle = C.rgba('#000000', 0.55); g.fillRect(r.x, r.y + r.h * 0.86, r.w, r.h);
  g.fillStyle = C.rgba('#050604', 0.85); g.fillRect(r.x + r.w * 0.80 + par * 1.6, r.y + r.h * 0.12, 96, r.h);
  g.fillStyle = C.rgba('#a6c832', 0.08 * st.I); g.fillRect(r.x + r.w * 0.80 + par * 1.6, r.y + r.h * 0.12, 2, r.h);
  // plaques: dark acrylic with lit top edges
  for (const [dy, w] of [[150, 150], [240, 150]]) {
    const px = lx - 75 + 10, py = ly + dy;
    g.fillStyle = '#0d0e0b'; g.fillRect(px, py, w, 64);
    g.fillStyle = C.rgba('#d4ff3f', 0.35 * st.I); g.fillRect(px, py, w, 1.5);
    g.fillStyle = C.rgba('#d4ff3f', 0.08 * st.I); g.fillRect(px + 12, py + 18, w * 0.6, 3); g.fillRect(px + 12, py + 30, w * 0.45, 3);
  }
  // cord
  g.strokeStyle = 'rgba(20,20,18,0.9)'; g.lineWidth = 2; g.beginPath(); g.moveTo(lx, r.y); g.lineTo(lx, ly - 62); g.stroke();
  // the lamp: frosted tile (the mark's gradient), filament = the pulse path, hot core
  const s = 124, x0 = lx - s / 2, y0 = ly - s / 2, I = st.I;
  if (I > 0.01) {
    const gr = g.createLinearGradient(x0, y0, x0 + s, y0 + s);
    gr.addColorStop(0, C.mixHex('#20240c', '#f2ffbf', clamp(I))); gr.addColorStop(0.55, C.mixHex('#1a1e08', '#d4ff3f', clamp(I))); gr.addColorStop(1, C.mixHex('#14170a', '#a9e62a', clamp(I)));
    g.fillStyle = gr; roundRect(g, x0, y0, s, s, s * 0.31); g.fill();
    // filament seen through the diffuser: soft bright core line, dims the tile around it slightly (the mark's pulse)
    g.save(); roundRect(g, x0, y0, s, s, s * 0.31); g.clip();
    g.lineCap = 'round'; g.lineJoin = 'round';
    const sc = s / 32;
    g.strokeStyle = C.rgba('#0b0f02', 0.55 * clamp(I)); g.lineWidth = 2.6 * sc;
    g.beginPath(); PULSE.forEach(([x, y], i) => (i ? g.lineTo(x0 + x * sc, y0 + y * sc) : g.moveTo(x0 + x * sc, y0 + y * sc))); g.stroke();
    g.strokeStyle = C.rgba('#fbffe6', clamp(I - 0.2)); g.lineWidth = 0.8 * sc;
    g.beginPath(); PULSE.forEach(([x, y], i) => (i ? g.lineTo(x0 + x * sc, y0 + y * sc + 1) : g.moveTo(x0 + x * sc, y0 + y * sc + 1))); g.stroke();
    g.restore();
  } else {
    g.fillStyle = '#121310'; roundRect(g, x0, y0, s, s, s * 0.31); g.fill();
  }
}
export function roundRect(g, x, y, w, h, rad) { g.beginPath(); g.moveTo(x + rad, y); g.arcTo(x + w, y, x + w, y + h, rad); g.arcTo(x + w, y + h, x, y + h, rad); g.arcTo(x, y + h, x, y, rad); g.arcTo(x, y, x + w, y, rad); g.closePath(); }

// Glass over everything inside the window (after UI): faint sky/street reflection + wear that shows where light grazes it.
export function drawGlass(gAdd, cam, f, c, light = 0.3, seed = 0) {
  const r = winRect(f, c);
  C.apply(gAdd, cam);
  const gr = gAdd.createLinearGradient(r.x, r.y, r.x + r.w * 0.5, r.y + r.h);
  gr.addColorStop(0, C.rgba('#8fa3ad', 0.07)); gr.addColorStop(0.45, C.rgba('#8fa3ad', 0.015)); gr.addColorStop(0.62, C.rgba('#8fa3ad', 0.05)); gr.addColorStop(1, C.rgba('#8fa3ad', 0.01));
  gAdd.fillStyle = gr; gAdd.fillRect(r.x, r.y, r.w, r.h);
  gAdd.globalAlpha = clamp(0.12 + light * 0.45); gAdd.drawImage(TEX.wear[seed % 4], r.x, r.y, r.w, r.h); gAdd.globalAlpha = 1;
}

// Engraved line on the plinth: shadow/highlight pair offset along the light → text vector; opacity ∝ local light.
function engrave(g, cam, spr, sprDark, x, y, light) {
  if (light <= 0.005) return;
  C.apply(g, cam);
  g.globalAlpha = clamp(light) * 0.55; g.globalCompositeOperation = 'multiply'; g.drawImage(sprDark, x + 1.5, y + 1.5);
  g.globalAlpha = clamp(light) * 0.45; g.globalCompositeOperation = 'screen'; g.drawImage(spr, x - 1, y - 1);
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
}

// ---------------------------------------------------------------- S12 · THE MANAGER WAKES UP
function slatAngles12(t) {
  // closed (82°) → wave open from the drop: slat i starts at b(25) + i·0.031 s, spring to 6° with an overshoot ≈ −4° and chatter;
  // the look (b 28): tilt +6° → −14° in 0.3 s, top-to-bottom ripple.
  const A = [];
  for (let i = 0; i < 16; i++) {
    const t0 = b(25) + i * 0.031;
    let a = 82;
    if (t >= t0) a = lerp(82, 6, spring(t - t0, { k: 520, c: 17 }));
    const tl = b(28) + i * 0.012;
    if (t >= tl) a = lerp(a, -14, ease.inOutCubic(clamp((t - tl) / 0.3)));
    A.push(a);
  }
  return A;
}
const FLICK = [0.35, 0.55, 0.20, 0.28, 0.70, 0.86, 0.97, 1.03, 1.00];
function filament12(t) {
  if (t < b(23.75)) return 0;
  if (t < b(24)) return t - b(23.75) < 2 / 60 ? 0.05 : 0;          // the 2-frame ember
  const fi = Math.floor((t - b(24)) * 60);
  return (fi < FLICK.length ? FLICK[fi] : 1) * C.breath(t);
}
function signAngle12(t) {
  // swinging ±1.5° decaying at the cut-in; the slats' air pushes it 4° at the drop; settles to exactly 0.00° at b(26).
  if (t >= b(26)) return 0;
  let a = 1.5 * Math.exp(-(t - b(23.5)) / 1.4) * Math.sin(2 * Math.PI * 0.9 * (t - b(23.5)));
  if (t > b(25)) { const u = t - b(25); a += 4 * Math.exp(-u / 0.25) * Math.sin(2 * Math.PI * 1.1 * u); }
  return a * (1 - ease.inCubic(invLerp(b(25.5), b(26), t)));
}
// ground distance (world px from the façade) of the light band thrown through slat gap i
const bandV = (i, tilt) => 30 + (15 - i) * 62 * (1 + 0.35 * tilt);

C.shot('s12-wake', (t) => {
  const g = C.L.world;
  const push = ease.inOutCubic(invLerp(b(24), b(28.6), t));
  let zoom = lerp(0.9, 1.06, push);
  if (t > b(28.6)) zoom = lerp(1.06, 1.3, ease.inCubic(invLerp(b(28.6), b(29), t)));
  const cy = -248 - 40 * ease.voiceInOut(invLerp(b(24), b(26.5), t));
  const cam = C.cam(2280, cy, zoom);
  const base = C.toScreen(cam, 0, 0)[1];
  const gm = groundModel(cam, base - 203 * zoom / 0.9, base);

  const I = filament12(t);
  const lamp = clamp(I);
  const ang = slatAngles12(t);
  const openness = 1 - ang.reduce((s, a) => s + slatFace(a), 0) / 16;
  const tilt = clamp(invLerp(b(28), b(28.4), t));
  const nb = [[b(27), 0, 0, 0.55], [b(27.25), 1, 1, 0.3], [b(27.75), 1, 4, 0.0]].map(([tt, f, c, bl]) => ({ f, c, bl, v: C.bulb(t, [[tt, 1]]) }));
  const st = (c) => ({ I: lamp, lamp: c === 2 ? [0.36, 0.40] : [-0.42, 0.40], slats: ang, print: c === 2, room: lamp, bent: c === 2, cord: c === 3 ? Math.sin((t - b(25)) * 5.6) * Math.exp(-Math.max(0, t - b(25)) / 1.2) * (t > b(25)) : null });

  // ---------- albedo
  drawBlockAlbedo(g, cam);
  drawGround(g, cam, gm);

  // ---------- irradiance (moon ambient + the manager's light), then multiply
  const irr = IRR.g;
  irr.setTransform(0.5, 0, 0, 0.5, 0, 0); irr.globalCompositeOperation = 'source-over';
  const sky = irr.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#1d2429'); sky.addColorStop(0.7, '#1a2025'); sky.addColorStop(1, '#151a1e');
  irr.fillStyle = sky; irr.fillRect(0, 0, W, H);
  irr.globalCompositeOperation = 'lighter';
  const leak = lamp * (0.18 + 0.82 * openness);
  for (const c of [2, 3]) {
    const r = winRect(0, c);
    const [x0, y0] = C.toScreen(cam, r.x, r.y), [x1, y1] = C.toScreen(cam, r.x + r.w, r.y + r.h);
    const cx = (x0 + x1) / 2, w = x1 - x0;
    // reveals and sill catch the light leaving the glass; the wall around falls off fast
    C.falloff(irr, cx, y1 + 8 * zoom, 120 * zoom, '#b8dd3a', 0.75 * leak, 4);
    C.falloff(irr, x0 - 4, (y0 + y1) / 2, 60 * zoom, '#a6c832', 0.35 * leak, 3);
    C.falloff(irr, x1 + 4, (y0 + y1) / 2, 60 * zoom, '#a6c832', 0.35 * leak, 3);
    // plinth wash directly under the window
    const pg = irr.createLinearGradient(0, y1, 0, y1 + 130 * zoom);
    pg.addColorStop(0, C.rgba('#b2d63a', 0.42 * leak)); pg.addColorStop(1, C.rgba('#b2d63a', 0));
    irr.fillStyle = pg; irr.fillRect(x0 - 20 * zoom, y1, w + 40 * zoom, 130 * zoom);
    // bands on the pavement: one per open gap, each sliding from the façade toward the lens over 0.2 s
    for (let i = 0; i < 16; i++) {
      const t0 = b(25) + i * 0.031; if (t < t0) continue;
      const gap = 1 - slatFace(ang[i]); if (gap <= 0.03) continue;
      const slide = ease.outCubic(clamp((t - t0) / 0.2));
      const vc = bandV(i, tilt) * slide, th = 26 * gap * (1 + vc / 900);
      const fall = 1 / (1 + (vc / 900) ** 2);
      stripe(irr, cam, gm, r.x + 6, r.x + r.w - 6, Math.max(0, vc - th / 2), vc + th / 2, C.rgba('#cdf247', 0.95 * gap * lamp * fall));
    }
  }
  // the dim leak under closed slats before the drop (lines of light at the slat seams on the sill)
  for (const n of nb) if (n.v > 0) {
    const r = winRect(n.f, n.c); const [nx, ny] = C.toScreen(cam, r.x + r.w / 2, r.y + r.h);
    C.falloff(irr, nx, ny + 10, 110 * zoom, '#b9d3dc', 0.32 * n.v, 4);
  }
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'multiply'; g.drawImage(IRR.c, 0, 0, W, H); g.globalCompositeOperation = 'source-over';

  // ---------- emissive: windows
  for (let f = 0; f <= 1; f++) for (let c = -1; c <= 6; c++) {
    if (f === 0 && (c === 2 || c === 3)) continue;
    const n = nb.find((n) => n.f === f && n.c === c);
    drawWindow(g, cam, f, c, { I: 0, room: 0, cold: n ? n.v * 0.85 : (f === 1 && c === 6 ? 0.55 : 0), blind: n ? n.bl : null, slats: null }, t);
  }
  for (const c of [2, 3]) drawWindow(g, cam, 0, c, st(c), t);
  // plinth: G·14 stencil and the engraved identity line, legible only in the manager's light
  const plinthLight = clamp(invLerp(b(24.2), b(24.9), t)) * clamp(leak * 1.6);
  engrave(g, cam, TEX.ident, TEX.identDark, winX(2) + 150, PLINTH.top + 52, plinthLight);
  C.apply(g, cam); g.globalAlpha = 0.25 + 0.6 * plinthLight; g.globalCompositeOperation = 'screen'; g.drawImage(TEX.g14, winX(2) + 18, PLINTH.top + 26); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';

  // ---------- the sign: real chips on a hung card, between slats and glass, bay c3 lower right
  const sr = winRect(0, 3), sa = signAngle12(t);
  const run = clamp(invLerp(b(25.25), b(25.55), t));
  chipPaused.style.opacity = (1 - run).toFixed(3); chipRunning.style.opacity = run.toFixed(3);
  const words = NOTE.split(' ');
  const nw = t < b(26.25) ? 0 : Math.min(words.length, 1 + Math.floor(((t - b(26.25)) / (b(26.75) - b(26.25))) * words.length));
  signNote.innerHTML = words.map((w, i) => `<span style="opacity:${i < nw ? 1 : 0}">${w}</span>`).join(' ');
  const sx = sr.x + 150, sy = sr.y + 210;
  signEl.style.visibility = 'visible';
  signEl.style.transform = C.domTransform(cam, sx, sy, 1, `rotate(${sa.toFixed(3)}deg)`);
  // cord from the head of the window to the card
  C.apply(g, cam); g.strokeStyle = 'rgba(20,20,19,0.95)'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(sx + 210, sr.y); g.lineTo(sx + 210 + Math.sin((sa * Math.PI) / 180) * -40, sy); g.stroke();
  // the card is lit from behind by the lamp: rim light on its edge (add), moonlit face before the wake (mul)
  const ml = C.L.mul; C.apply(ml, cam); ml.save(); ml.translate(sx, sy); ml.rotate((sa * Math.PI) / 180);
  ml.fillStyle = C.rgba('#4a5560', clamp(0.75 - lamp * 0.75)); roundRect(ml, 0, 0, 420, 134, 18); ml.fill(); ml.restore();
  const ad = C.L.add; C.apply(ad, cam); ad.save(); ad.translate(sx, sy); ad.rotate((sa * Math.PI) / 180);
  ad.strokeStyle = C.rgba('#d4ff3f', 0.35 * lamp); ad.lineWidth = 2.5; ad.filter = 'blur(2px)'; roundRect(ad, -1, -1, 422, 136, 19); ad.stroke(); ad.filter = 'none'; ad.restore();

  // ---------- glass, halation, lens
  for (let c = -1; c <= 6; c++) drawGlass(ad, cam, 0, c, c === 2 || c === 3 ? lamp * (0.3 + openness) : 0.1, c + 4);
  if (lamp > 0) {
    ad.setTransform(1, 0, 0, 1, 0, 0);
    const [hx, hy] = C.toScreen(cam, winX(2) + WIN * 0.36, GROUND.top + 430 * 0.4);
    C.falloff(ad, hx, hy, 70 * zoom, '#d4ff3f', 0.18 * I * (0.35 + 0.65 * openness), 6);
    const [wx, wy] = C.toScreen(cam, 2280, -355);
    C.falloff(ad, wx, wy, 420 * zoom, '#6f9a10', 0.10 * lamp * (0.3 + openness), 3);
  }
  if (t >= b(28.5) && t < b(28.5) + 5 / 60) { ad.setTransform(1, 0, 0, 1, 0, 0); ad.fillStyle = 'rgba(214,255,90,0.07)'; ad.fillRect(0, 0, W, H); }
  if (t > b(28.7)) { // the push into the slats: two slats pass the lens as soft foreground bars
    const k = ease.inCubic(invLerp(b(28.7), b(29), t)), fr = C.L.front; fr.setTransform(1, 0, 0, 1, 0, 0);
    fr.filter = `blur(${(10 + 16 * k).toFixed(1)}px)`; fr.fillStyle = C.rgba('#0c0d0b', 0.94);
    fr.fillRect(-60, lerp(-300, 180, k), W + 120, 240 * (0.5 + k)); fr.fillRect(-60, lerp(1320, 660, k), W + 120, 280 * (0.5 + k));
    fr.filter = 'none';
  }
  return { grain: 0.05, vignette: 0.12 };
});

// screen-space trapezoid of light on the ground between façade distances v0 (far) and v1 (near), world x0..x1
function stripe(g, cam, gm, x0, x1, v0, v1, color) {
  const yAt = (v) => gm.horizon + (gm.f * gm.hcam) / (gm.D - v);
  const sx = (x, v) => W / 2 + (x - cam.x) * (gm.f / (gm.D - v));
  const y0 = yAt(v0), y1 = yAt(v1);
  g.fillStyle = color;
  g.beginPath(); g.moveTo(sx(x0, v0), y0); g.lineTo(sx(x1, v0), y0); g.lineTo(sx(x1, v1), y1); g.lineTo(sx(x0, v1), y1); g.closePath(); g.fill();
}

const IRR = (() => { const c = C.canvas(W / 2, H / 2); return { c, g: C.ctx2(c) }; })();
