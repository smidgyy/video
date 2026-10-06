// Voice — flagship film. Every frame is a pure function of t (window.seek). See docs/shotlist.md.
import { clamp, lerp, invLerp, ease, spring, springs, kf, prog, hash01, noise1, typed, css, show } from '../engine/motion.js';

const TL = await (await fetch('../timeline.json')).json();
const ICONS = await (await fetch('../assets/brand/lucide.json')).json();
const T = Object.fromEntries(TL.events.map((e) => [e.id, e.t]));
const SH = Object.fromEntries(TL.shots.map((s) => [s.id, s]));
const at = (id) => SH[id].start;
const $ = (s) => document.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

// real lucide icons, inlined once
for (const el of $$('i[data-icon]')) {
  const inner = ICONS[el.dataset.icon];
  if (inner) el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
  el.style.display = 'inline-grid';
}

// ---------------------------------------------------------------- times
const H = {
  hook: at('s01-hook'), quiet: at('s02-quiet'), reveal: at('s03-reveal'), create: at('s04-create'),
  mic: at('s05-mic'), brain: at('s06-brain'), character: at('s07-character'), bounds: at('s08-boundaries'),
  budget: at('s09-budget'), launch: at('s10-launch'), wake: at('s11-wake'), reply: at('s12-reply'),
  learn: at('s13-learn'), choice: at('s14-choice'), collapse: at('s15-collapse'), end: at('s16-end'), out: TL.duration,
};

// ---------------------------------------------------------------- captions
const capCache = new Map();
function words(el) { if (!capCache.has(el)) capCache.set(el, $$('.wi', el)); return capCache.get(el); }
function fitCaption(el, maxW) {
  el.style.display = 'block';
  let fs = parseFloat(getComputedStyle(el).fontSize);
  for (let i = 0; i < 12 && el.scrollWidth > maxW; i++) { fs *= 0.96; el.style.fontSize = fs + 'px'; }
  const h = el.offsetHeight;
  el.style.display = 'none';
  return h;
}
const CAP_MAX_W = { capHook: 1080, capQuiet: 1200, capRoll: 9999, capThinks: 720, capLearns: 720, capQuietChoice: 720 };
const capLayout = {};
for (const el of $$('.cap')) {
  const h = el.classList.contains('center') ? (el.style.display = 'block', el.offsetHeight) : fitCaption(el, CAP_MAX_W[el.id] || 720);
  el.style.display = 'none';
  capLayout[el.id] = h;
}
function placeCap(el, cy) { el.style.top = (cy - capLayout[el.id] / 2).toFixed(1) + 'px'; }

// Masked per-word rise. inAt: number (staggered) or array per word. Exits upward through the same mask.
function caption(el, t, { inAt, stagger = 0.06, outAt = 1e9, outDur = 0.13, outStagger = 0.012, preset = springs.type, blur = 9 }) {
  const ws = words(el);
  const t0 = Array.isArray(inAt) ? inAt[0] : inAt;
  const tEnd = outAt + outDur + outStagger * ws.length;
  const vis = t >= t0 - 1e-6 && t < tEnd;
  show(el, vis);
  if (!vis) return;
  ws.forEach((w, i) => {
    const ti = Array.isArray(inAt) ? inAt[i] : inAt + i * stagger;
    const s = t < ti ? 0 : spring(t - ti, preset);
    const k = ease.inCubic(invLerp(outAt + i * outStagger, outAt + i * outStagger + outDur, t));
    const y = (1 - s) * 112 - k * 112;
    const b = (1 - clamp(s)) * blur + k * 5;
    w.style.transform = `translate(0px, ${y.toFixed(2)}%)`;
    w.style.filter = b > 0.04 ? `blur(${b.toFixed(2)}px)` : 'none';
    w.style.opacity = (t < ti ? 0 : clamp(s * 1.8)).toFixed(3);
  });
}

// Odometer slot: items[i] owns [times[i], times[i+1]). Rolls up through a fixed mask.
function slot(el, t, times, endAt, preset = springs.snap, firstIn = 0.0) {
  const its = $$('.it', el);
  its.forEach((it, i) => {
    const a = times[i], b = i + 1 < times.length ? times[i + 1] : endAt;
    // outgoing word clears the mask fast; the incoming one follows 45 ms later, so they never share the slot
    const ai = i === 0 ? a : a + 0.045;
    const sin = t < ai ? 0 : i === 0 && firstIn ? spring(t - ai, springs.type) : spring(t - ai, preset);
    const sout = t < b ? 0 : (i + 1 < times.length ? ease.outCubic(invLerp(b, b + 0.1, t)) : ease.inCubic(invLerp(b, b + 0.13, t)));
    const y = (1 - sin) * 112 - sout * 112;
    const vis = t >= ai && (t < b + 0.45) && y > -110 && y < 110;
    it.style.display = vis ? 'block' : 'none';
    if (!vis) return;
    const bl = Math.abs(y) / 112 * 7;
    it.style.transform = `translate(0px, ${y.toFixed(2)}%)`;
    it.style.filter = bl > 0.05 ? `blur(${bl.toFixed(2)}px)` : 'none';
  });
}

// ---------------------------------------------------------------- the line / pulse / mark
const MARK = [[6.5, 16], [9.5, 16], [11.7, 10.5], [15.3, 22.5], [18.7, 7.5], [21.7, 18.5], [23.5, 16], [25.5, 16]];
const pl = $('#pl');
const tile = $('#tile');
const wordmark = $('#wordmark');
function setLine(pts, width, color, dash = null) {
  pl.setAttribute('points', pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' '));
  pl.style.strokeWidth = width.toFixed(2) + 'px';
  pl.style.stroke = color;
  if (dash) { pl.style.strokeDasharray = `${dash[0].toFixed(1)} 100000`; pl.style.strokeDashoffset = '0'; }
  else { pl.style.strokeDasharray = 'none'; }
}
function markPoints(cx, cy, u, amp, xL, xR) {
  const pts = [];
  if (xL !== null) pts.push([xL, cy]);
  for (const [px, py] of MARK) pts.push([cx + (px - 16) * u, cy + (py - 16) * u * amp]);
  if (xR !== null) pts.push([xR, cy]);
  return pts;
}
const mixHex = (a, b, k) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(lerp(v, pb[i], clamp(k)))).join(',')})`;
};
const GRAY = '#5d5d59', LIME = '#d4ff3f', INK = '#0b0f02';
const TILE = 168;
const LINE_Y = 820, NODE_X = 200;
const DAY_X = [308, 758, 1208, 1658];

function heartbeat(t) {
  const s1 = T['spike-1'], s2 = T['spike-2'];
  const pulse = (tt, t0, a) => (tt < t0 ? 0 : a * Math.min(1, (tt - t0) / 0.028) * Math.exp(-Math.max(0, tt - t0 - 0.028) / 0.09));
  return pulse(t, s1, 1) + pulse(t, s2, 0.62);
}

// lockup geometry (reveal + end)
const LOCK = { reveal: { cy: 326, size: 168, wm: 150, gap: 46 }, end: { cy: 292, size: 192, wm: 172, gap: 52 } };
let wmWidth = {};
function measureWordmark() {
  wordmark.style.display = 'block';
  for (const k of Object.keys(LOCK)) { wordmark.style.fontSize = LOCK[k].wm + 'px'; wmWidth[k] = wordmark.scrollWidth; }
  wordmark.style.display = 'none';
}
measureWordmark();
function lockupPos(k) {
  const L = LOCK[k];
  const total = L.size + L.gap + wmWidth[k];
  const tileCx = 960 - total / 2 + L.size / 2;
  return { tileCx, cy: L.cy, wmLeft: tileCx + L.size / 2 + L.gap, size: L.size, wm: L.wm };
}

const WM_LETTERS = $$('#wordmark .l');
function wordmarkLetters(t, t0, out = 0) {
  WM_LETTERS.forEach((l, i) => {
    const s = t < t0 + i * 0.035 ? 0 : spring(t - t0 - i * 0.035, springs.type);
    l.style.transform = `translate(0px, ${((1 - s) * 105 - out * 105).toFixed(2)}%)`;
    l.style.opacity = (t < t0 + i * 0.035 ? 0 : 1).toFixed(3);
    const b = (1 - clamp(s)) * 6 + out * 4;
    l.style.filter = b > 0.04 ? `blur(${b.toFixed(2)}px)` : 'none';
  });
}
function drawTile(cx, cy, size, scale, op = 1, rot = 0) {
  show(tile, scale > 0.002 && op > 0.002);
  tile.style.filter = 'none';
  tile.style.transform = `translate(${cx.toFixed(2)}px, ${cy.toFixed(2)}px) rotate(${rot.toFixed(2)}deg) scale(${(scale * size / TILE).toFixed(4)})`;
  tile.style.opacity = op.toFixed(3);
}

function lineScene(t) {
  const q = H.quiet, sp1 = T['spike-1'], con = T['pulse-contract'], hit = T['logo-hit'];
  // the timeline draws at constant speed through the silence; its head passes each DAY marker on a clock tick
  const SPEED = 900, head = (tt) => NODE_X + (tt - (T['day-1'] - (DAY_X[0] - NODE_X) / SPEED)) * SPEED;
  const drawA = T['day-1'] - (DAY_X[0] - NODE_X) / SPEED;
  // flat timeline + pulse + contraction (reveal)
  if (t >= drawA && t < hit) {
    show(pl, true);
    const R = lockupPos('reveal');
    let cx = 960, cy = LINE_Y, u = 26, amp = heartbeat(t), xL = NODE_X, xR = 1990, w = 3, col = GRAY;
    if (t >= sp1) col = mixHex(GRAY, LIME, invLerp(sp1, sp1 + 0.03, t));
    if (t >= con) {
      const p = ease.inOutCubic(invLerp(con, hit, t));
      amp = lerp(amp, 1, ease.outCubic(invLerp(con, con + 0.12, t)));
      u = lerp(26, TILE / 32, p);
      cy = lerp(LINE_Y, R.cy, p);
      xL = lerp(NODE_X, cx + (6.5 - 16) * u, ease.inCubic(p));
      xR = lerp(1990, cx + (25.5 - 16) * u, ease.inCubic(p));
      w = lerp(3, 2.4 * TILE / 32, p);
    }
    const len = head(t) - NODE_X;
    const dash = len < 1990 - NODE_X && t < sp1 ? [Math.max(0, len)] : null;
    setLine(markPoints(cx, cy, u, amp, xL, xR), w, col, dash);
    // quiet-section opacity of the flat line
    pl.style.opacity = t < sp1 ? '0.9' : '1';
  }
  // playhead: time passing, nothing happening
  const ph = $('#playhead');
  const phOn = t >= drawA && t < sp1 - 0.02;
  ph.style.display = phOn ? 'block' : 'none';
  if (phOn) { const hx = Math.min(1990, head(t)); ph.setAttribute('cx', hx.toFixed(2)); ph.setAttribute('r', (5 + 1.5 * Math.sin(t * 9)).toFixed(2)); ph.style.opacity = (hx >= 1990 ? 0 : 1).toFixed(3); }
  // node + day markers
  const node = $('#node');
  const nOn = window1(t, q + 0.36, T['spike-1'] + 0.15, 0.12, 0.15);
  node.style.opacity = nOn.toFixed(3);
  node.setAttribute('r', (9 * (0.4 + 0.6 * spring(t - (q + 0.36), springs.snap))).toFixed(2));
  ['day-1', 'day-2', 'day-3', 'day-4'].forEach((id, i) => {
    const g = $('#day' + (i + 1));
    const s = t < T[id] ? 0 : spring(t - T[id], springs.snap);
    const out = invLerp(T['spike-1'], T['spike-1'] + 0.22, t);
    g.style.opacity = (clamp(s) * (1 - out)).toFixed(3);
    g.style.transform = `translate(0px, ${((1 - s) * 14).toFixed(2)}px)`;
  });
}
function window1(t, a, b, rin, rout) { return Math.min(ease.voice(invLerp(a, a + rin, t)), 1 - ease.inCubic(invLerp(b - rout, b, t))) * (t >= a && t <= b ? 1 : 0); }

function revealScene(t) {
  const hit = T['logo-hit'];
  const R = lockupPos('reveal');
  if (t < hit || t >= H.create + 0.25) return;
  // tile springs in at centre, then slides left to the lockup while the wordmark is drawn out from behind it
  const s = spring(t - hit + 0.012, springs.heavy);
  const slide = ease.inOutCubic(invLerp(hit + 0.05, hit + 0.32, t));
  let cx = lerp(960, R.tileCx, slide), cy = R.cy, size = R.size, scale = s, op = 1;
  // fly into the coin avatar slot (create)
  const f0 = T['tile-fly'], f1 = H.create + 0.18;
  let rot = 0;
  if (t >= f0) {
    const av = $('#pvAvatar').getBoundingClientRect();
    const p = ease.inOutCubic(invLerp(f0, f1, t));
    cx = lerp(cx, av.left + av.width / 2, p);
    cy = lerp(cy, av.top + av.height / 2, p) - Math.sin(p * Math.PI) * 60;
    size = lerp(size, av.width, p);
    rot = Math.sin(p * Math.PI) * -8;
    op = 1 - ease.inCubic(invLerp(f1 - 0.03, f1, t));
  }
  drawTile(cx, cy, size, scale, op, rot);
  tile.style.filter = t >= f0 ? `blur(${(Math.sin(clamp((t - f0) / (f1 - f0)) * Math.PI) * 5).toFixed(2)}px)` : 'none';
  // the mark stroke stays at full mark size; the tile blooms behind it
  const u = size / 32;
  const ink = mixHex(LIME, INK, invLerp(0.45, 0.9, s));
  show(pl, op > 0.01);
  pl.style.opacity = (op * (1 - invLerp(f0 + 0.05, f0 + 0.2, t))).toFixed(3);
  // rotate the stroke with the tile
  const rad = rot * Math.PI / 180;
  const pts = markPoints(0, 0, u, 1, null, null).map(([x, y]) => [cx + x * Math.cos(rad) - y * Math.sin(rad), cy + x * Math.sin(rad) + y * Math.cos(rad)]);
  setLine(pts, 2.4 * u, ink);
  // wordmark wipe
  const wv = t < f0 + 0.05;
  show(wordmark, wv);
  if (wv) {
    wordmark.style.fontSize = R.wm + 'px';
    const out = ease.inCubic(invLerp(T['tile-fly'] - 0.1, T['tile-fly'] + 0.05, t));
    wordmark.style.transform = `translate(${R.wmLeft.toFixed(2)}px, ${(R.cy - R.wm * 0.62).toFixed(2)}px)`;
    wordmark.style.clipPath = 'none';
    wordmark.style.opacity = '1';
    wordmark.firstElementChild.style.transform = 'none';
    wordmarkLetters(t, hit + 0.26, out);
  }
}

// ---------------------------------------------------------------- camera helpers
function camera(el, { FX, FY, SX, SY, s, ry = 0, rx = 0, op = 1, blur = 0 }) {
  el.style.transform = `translate(${SX.toFixed(2)}px, ${SY.toFixed(2)}px) rotateY(${ry.toFixed(3)}deg) rotateX(${rx.toFixed(3)}deg) scale(${s.toFixed(4)}) translate(${(-FX).toFixed(2)}px, ${(-FY).toFixed(2)}px)`;
  el.style.opacity = op.toFixed(3);
  el.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : 'none';
}
const lerpPose = (a, b, k) => Object.fromEntries(Object.keys(a).map((key) => [key, lerp(a[key], b[key] ?? a[key], k)]));
function poseSpeed(t, keys) {
  const a = poseTrack(t, keys), b = poseTrack(t + 1 / 120, keys);
  const dx = (b.SX - b.FX * b.s) - (a.SX - a.FX * a.s), dy = (b.SY - b.FY * b.s) - (a.SY - a.FY * a.s);
  return Math.hypot(dx, dy) + Math.abs(b.s - a.s) * 900 + Math.abs((b.ry || 0) - (a.ry || 0)) * 40;
}
function poseTrack(t, keys) {
  if (t <= keys[0][0]) return { ...keys[0][1] };
  for (let i = 1; i < keys.length; i++) {
    const [t1, p1, e] = keys[i], [t0, p0] = keys[i - 1];
    if (t <= t1) return lerpPose(p0, p1, (e || ease.voiceInOut)(invLerp(t0, t1, t)));
  }
  return { ...keys[keys.length - 1][1] };
}

// ---------------------------------------------------------------- coin preview card
const previewCam = $('#previewCam');
const preview = $('#preview');
const PV_W = 360;
let PV_H = 0;
const pv = { name: $('#pvName'), letter: $('#pvLetter'), ticker: $('#pvTicker'), story: $('#pvStory'), type: $('#pvType'), live: $('#pvLive'), sheen: $('.preview-sheen'), x: $('#pvX') };
const NAME = 'Orbit', TICKER = 'ORBIT', STORY = 'The tiny satellite that refuses to come back down.';
const typeSpan = (id) => [T[id], TL.events.find((e) => e.id === id).len];
function typedAt(str, t, id) { const [a, len] = typeSpan(id); return t < a ? '' : str.slice(0, clamp(Math.floor(((t - a) / len) * str.length + 0.0001) + 1, 0, str.length)); }

function previewScene(t) {
  const hookOn = t < H.quiet + 0.42;
  const createOn = t >= T['tile-fly'] - 0.02 && t < H.mic + 0.35;
  show(previewCam, hookOn || createOn);
  if (!(hookOn || createOn)) return;
  if (!PV_H) { show(previewCam, true); }
  // content
  const nm = t >= H.create ? typedAt(NAME, t, 'type-name') : '';
  const tk = t >= H.create ? typedAt(TICKER, t, 'type-ticker') : '';
  const st = t >= H.create ? typedAt(STORY, t, 'type-story') : '';
  pv.name.textContent = nm || 'Your next big idea';
  pv.letter.textContent = nm ? nm[0] : 'V';
  pv.ticker.textContent = '$' + (tk || 'TICKER');
  pv.story.textContent = st || 'Every coin has a story. This one is yours to tell.';
  pv.type.textContent = nm ? NAME.toUpperCase().slice(0, Math.max(nm.length, 1)) : 'YOUR COIN';
  let pose, filt = 'none';
  if (hookOn) {
    // enters already in motion at frame 0; launch gleam at card-pop; LIVE pill at live-pill
    const s = spring(t + 0.34, springs.heavy);
    const punch = t >= T['card-pop'] ? Math.exp(-(t - T['card-pop']) / 0.09) * Math.sin(clamp((t - T['card-pop']) / 0.12) * Math.PI) : 0;
    pose = { x: lerp(1720, 1452, s) - t * 8, y: 540 + (1 - s) * 60, s: lerp(1.05, 1.56, s) * (1 + punch * 0.05), ry: lerp(-42, -16, s) + t * 1.4, rx: lerp(10, 4, s), op: clamp(s * 2) };
    filt = `blur(${((1 - clamp(s)) * 7).toFixed(2)}px)`;
    // quiet: life drains, card falls into the node at the start of the timeline
    if (t >= H.quiet) {
      const d = ease.voice(invLerp(H.quiet, H.quiet + 0.25, t));
      const f = ease.inCubic(invLerp(H.quiet + 0.08, H.quiet + 0.4, t));
      filt = `grayscale(${d.toFixed(3)}) brightness(${(1 - 0.45 * d).toFixed(3)}) blur(${(f * 4).toFixed(2)}px)`;
      pose.x = lerp(pose.x, NODE_X, f); pose.y = lerp(pose.y, LINE_Y, f);
      pose.s = lerp(pose.s, 0.02, f); pose.ry = lerp(pose.ry, 0, f); pose.op = 1 - ease.inQuart(invLerp(H.quiet + 0.3, H.quiet + 0.4, t));
    }
    const sheenP = invLerp(T['card-pop'], T['card-pop'] + 0.55, t);
    pv.sheen.style.setProperty('--sheen-x', `${lerp(-40, 140, ease.inOutCubic(sheenP)).toFixed(2)}%`);
    pv.sheen.style.opacity = sheenP > 0 && sheenP < 1 ? '1' : '0';
    const ls = t < T['live-pill'] ? 0 : spring(t - T['live-pill'], springs.snap);
    pv.live.style.opacity = t >= T['live-pill'] ? '1' : '0';
    pv.live.style.transform = `scale(${lerp(0.6, 1, ls).toFixed(4)})`;
  } else {
    const s = spring(t - (T['tile-fly'] - 0.02), springs.heavy);
    pose = { x: lerp(1960, 1688, s), y: 600, s: lerp(1.0, 1.16, s), ry: lerp(-34, -12, s) + (t - H.create) * 0.8, rx: 3, op: clamp(s * 2.2) };
    const ex = ease.inCubic(invLerp(H.mic, H.mic + 0.32, t));
    pose.x += ex * 620; pose.ry -= ex * 24; pose.op *= 1 - ex;
    pv.sheen.style.opacity = '0';
    pv.live.style.opacity = '1'; pv.live.style.transform = 'none';
  }
  previewCam.style.transform = `translate(${pose.x.toFixed(2)}px, ${pose.y.toFixed(2)}px) rotateY(${pose.ry.toFixed(3)}deg) rotateX(${pose.rx.toFixed(3)}deg) scale(${pose.s.toFixed(4)}) translate(${(-PV_W / 2).toFixed(2)}px, ${(-PV_H / 2).toFixed(2)}px)`;
  previewCam.style.opacity = pose.op.toFixed(3);
  preview.style.filter = filt;
  // avatar is revealed when the flying logo tile lands in it
  const av = $('#pvAvatar');
  av.style.opacity = createOn ? clamp(invLerp(H.create + 0.15, H.create + 0.19, t)).toFixed(3) : '1';
}

// ---------------------------------------------------------------- wizard board
const BOARD_POSES = () => [
  [H.create, { FX: 260, FY: 420, SX: 1046, SY: 640, s: 1.42, ry: -11, rx: 4.5 }],
  [T['click-continue'] - 0.35, { FX: 260, FY: 440, SX: 1046, SY: 632, s: 1.46, ry: -10.5, rx: 4.5 }],
  [H.mic + 0.12, { FX: 440, FY: 420, SX: 1358, SY: 640, s: 1.45, ry: -10.5, rx: 4 }],
  [H.brain + 0.15, { FX: 440, FY: 420, SX: 1358, SY: 640, s: 1.45, ry: -10, rx: 4 }],
  [H.brain + 0.5, { FX: 320, FY: 450, SX: 1230, SY: 640, s: 1.55, ry: -10, rx: 4 }],
  [H.character + 0.15, { FX: 440, FY: 420, SX: 1358, SY: 640, s: 1.45, ry: -9.5, rx: 4 }],
  [H.bounds + 0.15, { FX: 440, FY: 420, SX: 1358, SY: 640, s: 1.46, ry: -9.5, rx: 4 }],
  [H.budget + 0.15, { FX: 440, FY: 420, SX: 1358, SY: 640, s: 1.47, ry: -9, rx: 4 }],
  [H.launch + 0.15, { FX: 440, FY: 420, SX: 1358, SY: 640, s: 1.47, ry: -8.5, rx: 4 }],
  [T['signed'], { FX: 400, FY: 480, SX: 1320, SY: 630, s: 1.52, ry: -8, rx: 3.5 }],
];
const boardCam = $('#boardCam');
const board = $('#board');
const PAGES = [
  ['#pgIdentity', H.create, H.mic], ['#pgX', H.mic, H.brain], ['#pgBrain', H.brain, H.character], ['#pgPersonality', H.character, H.bounds],
  ['#pgPerms', H.bounds, H.budget], ['#pgBudget', H.budget, H.launch], ['#pgReview', H.launch, H.wake + 0.2],
];
const TITLES = [
  [H.create, 'Identity', 1], [T['substep-2'], 'Story & links', 2], [H.mic, 'Connect Official X', 4], [H.brain, 'Choose Brain / Model', 5],
  [H.character, 'Personality', 8], [H.bounds, 'X Action Permissions', 11], [H.budget, 'Budget / Funding', 12], [H.launch, 'Review Coin + X Manager', 13],
  [T['click-sign'] + 0.03, 'Prepare launch transaction', 14], [T['click-sign'] + 0.16, 'Wallet sign', 15],
];
function currentTitle(t) { let i = 0; for (let k = 0; k < TITLES.length; k++) if (t >= TITLES[k][0]) i = k; return i; }

function pageAnim(el, t, a, b) {
  const vis = t >= a && t < b + 0.12;
  el.style.display = 'block';
  el.style.visibility = vis ? 'visible' : 'hidden';
  if (!vis) { el.style.opacity = '0'; el.style.transform = 'none'; el.style.filter = 'none'; return; }
  const s = spring(t - a + 1 / 60, springs.soft);
  const k = ease.inCubic(invLerp(b, b + 0.1, t));
  const y = (1 - s) * 34 - k * 26;
  el.style.transform = `translate(0px, ${y.toFixed(2)}px)`;
  el.style.opacity = (clamp(s * 1.7) * (1 - k)).toFixed(3);
  const bl = (1 - clamp(s)) * 6 + k * 4;
  el.style.filter = bl > 0.05 ? `blur(${bl.toFixed(2)}px)` : 'none';
}

const stepBtns = $$('#stepList button');
const stepList = $('#stepList');
let stepOffsets = null;
function stepScene(t) {
  const ti = currentTitle(t);
  const step = TITLES[ti][2];
  stepBtns.forEach((b) => {
    const n = Number(b.dataset.step);
    b.className = n === step ? 'active' : n < step ? 'complete' : '';
    if (n > step) b.setAttribute('disabled', ''); else b.removeAttribute('disabled');
  });
  const prev = ti > 0 ? TITLES[ti - 1][2] : step;
  const tgt = (n) => Math.max(0, stepOffsets[n - 1] - 120);
  const s = spring(t - TITLES[ti][0], springs.firm);
  stepList.style.transform = `translate(${(-lerp(tgt(prev), tgt(step), s)).toFixed(2)}px, 0px)`;
  // phases
  const part = t < H.mic - 0.08 ? 1 : t < H.launch ? 2 : 3;
  ['#ph1', '#ph2', '#ph3'].forEach((id, i) => { $(id).className = i + 1 === part ? 'active' : i + 1 < part ? 'complete' : ''; });
  // eyebrow + title roll
  const label = part === 1 ? 'PART 1 · CREATE YOUR COIN' : part === 2 ? 'PART 2 · GIVE IT A VOICE' : 'FINAL · LAUNCH';
  $('#wizEyebrow').textContent = `${label} · STEP ${step} OF 16`;
  const A = $('#wizTitleA'), B = $('#wizTitleB');
  const ts = spring(t - TITLES[ti][0], springs.snap);
  B.textContent = TITLES[ti][1];
  A.textContent = ti > 0 ? TITLES[ti - 1][1] : '';
  B.style.transform = `translate(0px, ${((1 - ts) * 46).toFixed(2)}px)`;
  A.style.transform = `translate(0px, ${(-ts * 46).toFixed(2)}px)`;
  A.style.opacity = (1 - clamp(ts)).toFixed(3);
  B.style.opacity = clamp(ts * 1.5).toFixed(3);
}

function field(el, t, str, id, focusA, focusB) {
  const s = t >= T[id] ? typedAt(str, t, id) : '';
  el.querySelector('.tx').textContent = s;
  const focus = t >= focusA && t < focusB;
  el.classList.toggle('focus', focus);
  const [a, len] = typeSpan(id);
  const typing = t >= a && t <= a + len;
  el.querySelector('.caret').style.opacity = focus && (typing || (t * 2.4) % 1 < 0.62) ? '1' : '0';
}

function boardScene(t) {
  const on = t >= T['tile-fly'] && t < H.wake + 0.12;
  show(boardCam, on);
  if (!on) return;
  // camera
  const enter = spring(t - T['tile-fly'], springs.heavy);
  // panel left edge sits just right of the caption column (~x 720); the stepper stays in frame
  const pushK = ease.inExpo(invLerp(H.wake - 0.26, H.wake + 0.04, t));
  const vb = Math.min(3, poseSpeed(t, BOARD_POSES()) * 0.12);
  const base = poseTrack(t, BOARD_POSES());
  camera(boardCam, {
    ...base,
    SX: base.SX + (1 - enter) * 260, s: base.s * lerp(0.86, 1, enter) * (1 + pushK * 1.9),
    ry: base.ry - (1 - enter) * 18, op: clamp(enter * 2.4) * (1 - ease.inCubic(invLerp(H.wake - 0.1, H.wake + 0.03, t))),
    blur: pushK * 6 + vb,
  });
  stepScene(t);
  for (const [sel, a, b] of PAGES) pageAnim($(sel), t, a, b);
  // identity + story
  field($('#inName'), t, NAME, 'type-name', H.create + 0.2, T['type-ticker'] - 0.06);
  field($('#inTicker'), t, TICKER, 'type-ticker', T['type-ticker'] - 0.06, T['substep-2']);
  field($('#inStory'), t, STORY, 'type-story', T['substep-2'] + 0.02, T['click-continue'] - 0.1);
  const sf = $('#storyField');
  const ss = t < T['substep-2'] ? 0 : spring(t - T['substep-2'], springs.soft);
  sf.style.opacity = clamp(ss * 1.6).toFixed(3);
  sf.style.transform = `translate(0px, ${((1 - ss) * 24).toFixed(2)}px)`;
  press($('#btnContinue'), t, T['click-continue']);
  // X
  press($('#btnConnect'), t, T['click-connect']);
  $('#btnConnectTx').textContent = t >= T['click-connect'] + 0.03 ? 'Connecting…' : 'Connect Official X';
  const xs = t < T['x-connected'] ? 0 : spring(t - T['x-connected'], springs.snap);
  const xc = $('#xConnected');
  xc.style.opacity = t >= T['x-connected'] ? '1' : '0';
  xc.style.transform = `translate(0px, ${((1 - xs) * 18).toFixed(2)}px) scale(${lerp(0.96, 1, xs).toFixed(4)})`;
  $('#btnConnect').style.opacity = (1 - 0.65 * clamp(xs)).toFixed(3);
  // brain
  const cards = $$('#pgBrain .model-card');
  cards.forEach((c, i) => {
    const s = spring(t - H.brain - 0.04 - i * 0.05, springs.soft);
    const pk = i === 0 ? pressK(t, T['click-luna'], 0.985)[0] : 1;
    c.style.transform = `translate(0px, ${((1 - s) * 40).toFixed(2)}px) scale(${(lerp(0.94, 1, s) * pk).toFixed(4)})`;
    c.style.opacity = clamp(s * 1.6).toFixed(3);
  });
  const lunaOn = t >= T['click-luna'];
  $('#mcLuna').classList.toggle('selected', lunaOn);
  const lc = lunaOn ? spring(t - T['click-luna'], springs.snap) : 0;
  $('#lunaCheck').style.opacity = clamp(lc).toFixed(3);
  $('#lunaCheck').style.transform = `scale(${lerp(0.4, 1, lc).toFixed(4)})`;
  // personality
  const ctOn = t >= T['click-ctnative'];
  $('#presetCT').classList.toggle('selected', ctOn);
  $('#presetCT .preset-check').style.opacity = ctOn ? clamp(spring(t - T['click-ctnative'], springs.snap)).toFixed(3) : '0';
  press($('#presetCT'), t, T['click-ctnative'], 0.97);
  [['slider-1', '#sl1', '#sv1', 34, 85], ['slider-2', '#sl2', '#sv2', 30, 60], ['slider-3', '#sl3', '#sv3', 18, 50]].forEach(([id, sl, sv, a, b]) => {
    const s = t < T[id] ? 0 : spring(t - T[id], springs.soft);
    const v = Math.round(lerp(a, b, s));
    const el = $(sl);
    el.value = String(v);
    el.style.setProperty('--voice-level', `${v}%`);
    $(sv).innerHTML = `${v}<small>/100</small>`;
  });
  // permissions
  [['toggle-1', '#pc1'], ['toggle-2', '#pc2'], ['toggle-3', '#pc3']].forEach(([id, pc]) => {
    const card = $(pc), sw = card.querySelector('.permission-switch'), knob = card.querySelector('.toggle-track > span');
    const on = t >= T[id];
    card.classList.toggle('enabled', on);
    sw.setAttribute('aria-checked', on ? 'true' : 'false');
    card.querySelector('.permission-status').textContent = on ? 'ON' : 'OFF';
    const k = on ? spring(t - T[id], springs.snap) : 0;
    knob.style.transform = `translate(${(20 * k).toFixed(2)}px, 0px)`;
    knob.querySelector('svg').style.opacity = clamp(k).toFixed(3);
  });
  const apOn = t >= T['click-approval'];
  $('#chApproval').classList.toggle('selected', apOn);
  $('#chApproval .choice-check').style.opacity = apOn ? clamp(spring(t - T['click-approval'], springs.snap)).toFixed(3) : '0';
  press($('#chApproval'), t, T['click-approval'], 0.985);
  // budget
  press($('#btnDeposit'), t, T['click-deposit']);
  const [ca, cl] = [T['count'], TL.events.find((e) => e.id === 'count').len];
  const bal = lerp(0, 25, ease.outCubic(invLerp(ca, ca + cl, t)));
  $('#balVal').textContent = '$' + bal.toFixed(2);
  const land = t >= ca + cl ? Math.exp(-(t - ca - cl) / 0.35) : 0;
  $('#statBal').style.borderColor = `rgba(212,255,63,${(0.15 + 0.55 * land + 0.25 * clamp(invLerp(ca, ca + 0.1, t))).toFixed(3)})`;
  // review + sign
  $$('#pgReview .rv').forEach((r, i) => {
    const s = spring(t - H.launch - 0.06 - i * 0.04, springs.soft);
    r.style.opacity = clamp(s * 1.6).toFixed(3);
    r.style.transform = `translate(0px, ${((1 - s) * 22).toFixed(2)}px)`;
  });
  press($('#btnSign'), t, T['click-sign']);
  const sg = t < T['signed'] ? 0 : spring(t - T['signed'], springs.snap);
  $('#signState').style.opacity = t >= T['signed'] ? '1' : '0';
  $('#signState').style.transform = `translate(${((1 - sg) * -10).toFixed(2)}px, 0px)`;
}

function pressK(t, tc, depth = 0.955) {
  const d = t >= tc - 0.02 && t < tc + 0.22 ? Math.sin(clamp((t - tc + 0.02) / 0.2) * Math.PI) : 0;
  return [1 - (1 - depth) * d, d];
}
function press(el, t, tc, depth = 0.955) {
  if (!el) return;
  const [sc, d] = pressK(t, tc, depth);
  el.style.transform = d > 0 ? `scale(${sc.toFixed(4)})` : 'none';
  el.classList.toggle('pressed', d > 0.3);
}

// ---------------------------------------------------------------- control room
const ROOM_POSES = () => [
  [H.wake, { FX: 430, FY: 175, SX: 1305, SY: 470, s: 1.36, ry: -10, rx: 4 }],
  [H.reply - 0.05, { FX: 430, FY: 185, SX: 1305, SY: 478, s: 1.38, ry: -10, rx: 4 }],
  [H.reply + 0.5, { FX: 880, FY: 600, SX: 1300, SY: 560, s: 1.7, ry: -9, rx: 3 }],
  [H.learn, { FX: 880, FY: 640, SX: 1300, SY: 560, s: 1.7, ry: -8.5, rx: 3 }],
  [H.learn + 0.35, { FX: 880, FY: 720, SX: 1300, SY: 560, s: 1.7, ry: -8.5, rx: 3 }],
  [H.choice, { FX: 880, FY: 730, SX: 1300, SY: 560, s: 1.72, ry: -8.5, rx: 3 }],
  [H.collapse - 0.02, { FX: 880, FY: 730, SX: 1300, SY: 560, s: 1.74, ry: -8.5, rx: 3 }],
  [H.collapse + 0.32, { FX: 590, FY: 520, SX: 1300, SY: 560, s: 0.78, ry: -7, rx: 2 }, ease.outCubic],
];
const roomCam = $('#roomCam');
function roomScene(t) {
  const on = t >= H.wake - 0.02 && t < H.end;
  show(roomCam, on);
  if (!on) return;
  const arrive = spring(t - H.wake, { k: 240, c: 31 });
  const poses = ROOM_POSES();
  const pose = poseTrack(t, poses);
  const fade = 1 - ease.inCubic(invLerp(T['collapse'] + 0.28, T['collapse'] + 0.42, t));
  const dof = window1(t, T['notice'] - 0.1, H.reply - 0.05, 0.25, 0.2) * 2.6;
  const vb = Math.min(3, poseSpeed(t, poses) * 0.12);
  camera(roomCam, { ...pose, s: pose.s * lerp(1.3, 1, arrive), op: clamp(invLerp(H.wake - 0.02, H.wake + 0.05, t)) * fade, blur: (1 - clamp(arrive)) * 5 + dof + vb });
  // status: PAUSED -> RUNNING · APPROVAL MODE
  const rs = t < T['activate'] ? 0 : spring(t - T['activate'] - 0.04, springs.snap);
  $('#bRunning').style.opacity = clamp(rs * 1.5).toFixed(3);
  $('#bRunning').style.transform = `scale(${lerp(0.7, 1, rs).toFixed(4)})`;
  $('#bPaused').style.opacity = (1 - clamp(rs * 2)).toFixed(3);
  const ns = t < T['notice'] ? 0 : spring(t - T['notice'], springs.soft);
  $('#deckNotice').style.opacity = clamp(ns * 1.5).toFixed(3);
  $('#deckNotice').style.transform = `translate(0px, ${((1 - ns) * -14).toFixed(2)}px)`;
  // feed rows (newest on top): read mentions arrives with dec-1, reply when published, choice after the solo moment
  const rows = [['#rowRead', T['dec-1']], ['#rowReply', T['published']], ['#rowChoice', H.collapse + 0.18], ['#rowPost', -1]];
  for (const [sel, ta] of rows) {
    const r = $(sel);
    const vis = ta < 0 || t >= ta;
    r.style.display = vis ? '' : 'none';
    if (!vis) continue;
    const s = ta < 0 ? 1 : spring(t - ta, springs.soft);
    r.style.opacity = clamp(s * 1.6).toFixed(3);
    r.style.transform = `translate(0px, ${((1 - s) * -18).toFixed(2)}px)`;
  }
  // draft: typing, approval, published, feedback
  const dt = $('#draftText');
  const DRAFT = "still up here. reentry is for coins with somewhere to be. you've been here since day one, so you get a wave every lap.";
  const [da, dl] = [T['type-draft'], TL.events.find((e) => e.id === 'type-draft').len];
  dt.querySelector('.tx').textContent = t < da ? '' : DRAFT.slice(0, clamp(Math.floor(((t - da) / dl) * DRAFT.length + 0.0001) + 1, 0, DRAFT.length));
  const typing = t >= da && t < da + dl;
  dt.querySelector('.caret').style.opacity = typing || (t >= da + dl && t < T['click-approve'] - 0.1 && (t * 2.4) % 1 < 0.62) ? '1' : '0';
  const ws = t < da + dl ? 0 : spring(t - da - dl - 0.05, springs.soft);
  $('#draftWhy').style.opacity = clamp(ws * 1.4).toFixed(3);
  press($('#btnApprove'), t, T['click-approve']);
  const ps = t < T['published'] ? 0 : spring(t - T['published'], springs.snap);
  $('#draftActions').style.opacity = (1 - clamp(ps * 2)).toFixed(3);
  $('#draftActions').style.display = ps > 0.5 ? 'none' : 'flex';
  const dp = $('#draftPublished');
  dp.style.height = ps > 0 ? `${(40 * clamp(ps)).toFixed(2)}px` : '0px';
  dp.style.opacity = clamp(ps * 1.4).toFixed(3);
  $('#queueCount').textContent = t >= T['published'] ? '0' : '1';
  const moreOn = t >= T['click-more'];
  $('#btnMore').classList.toggle('on', moreOn);
  press($('#btnMore'), t, T['click-more'], 0.94);
  const sv = t < T['saved-more'] ? 0 : spring(t - T['saved-more'], springs.soft);
  $('#savedNotice').style.opacity = t >= T['saved-more'] ? clamp(0.55 + sv).toFixed(3) : '0';
  $('#savedNotice').style.transform = `translate(0px, ${((1 - sv) * 16).toFixed(2)}px)`;
}

// floating cards: manager decision (home hero), memory, chosen silence
function floatScene(t) {
  // decision checklist
  const dcam = $('#decisionCam');
  const don = t >= T['notice'] - 0.1 && t < H.reply + 0.06;
  show(dcam, don);
  if (don) {
    const s = spring(t - (T['notice'] - 0.1), springs.heavy);
    const ex = ease.inCubic(invLerp(H.reply - 0.22, H.reply + 0.04, t));
    dcam.style.transform = `translate(${(lerp(1900, 1590, s) + ex * 420).toFixed(2)}px, ${lerp(860, 818, s).toFixed(2)}px) rotateY(${(lerp(-30, -9, s) - ex * 20).toFixed(3)}deg) rotateX(3deg) scale(1.78) translate(-150px, -110px)`;
    dcam.style.opacity = (clamp(s * 2) * (1 - ex)).toFixed(3);
    ['dec-1', 'dec-2', 'dec-3', 'dec-4'].forEach((id, i) => {
      const li = $('#d' + (i + 1));
      const k = t < T[id] ? 0 : spring(t - T[id], springs.snap);
      li.style.opacity = t >= T[id] ? '1' : '0';
      li.style.transform = `translate(${((1 - k) * -12).toFixed(2)}px, 0px) scale(${lerp(0.9, 1, k).toFixed(4)})`;
      const ic = li.querySelector('svg');
      if (ic) ic.style.transform = `scale(${lerp(0.3, 1, k).toFixed(4)})`;
    });
  }
  // memory chip: recalled when the manager reads the mention
  const mcam = $('#memoryCam');
  const mon = t >= T['memory'] - 0.02 && t < H.reply + 0.06;
  show(mcam, mon);
  if (mon) {
    const s = spring(t - T['memory'], springs.soft);
    const ex = ease.inCubic(invLerp(H.reply - 0.24, H.reply + 0.04, t));
    mcam.style.transform = `translate(${(lerp(940, 1018, s) - ex * 260).toFixed(2)}px, ${(lerp(808, 790, s)).toFixed(2)}px) rotateY(${lerp(-20, -9, s).toFixed(3)}deg) rotateX(3deg) scale(${lerp(1.3, 1.45, s).toFixed(4)}) translate(-150px, -60px)`;
    mcam.style.opacity = ((t >= T['memory'] ? 1 : 0) * (1 - ex)).toFixed(3);
  }
  // chosen silence: one row, in focus, landing with no overshoot on the dead stop
  const ccam = $('#choiceCam');
  const con = t >= H.choice && t < H.collapse + 0.3;
  show(ccam, con);
  if (con) {
    const s = spring(t - H.choice, springs.firm);
    const tgt = $('#rowChoice');
    let x = 1290, y = lerp(590, 560, s), sc = lerp(1.88, 1.95, s) + (t - H.choice) * 0.025, op = clamp(s * 2.2), ry = -6;
    if (t >= H.collapse) {
      const r = tgt.getBoundingClientRect();
      const p = ease.inOutCubic(invLerp(H.collapse, H.collapse + 0.26, t));
      x = lerp(x, r.left + r.width / 2, p); y = lerp(y, r.top + r.height / 2, p);
      sc = lerp(sc, r.width / 560, p); ry = lerp(ry, -7, p);
      op = 1 - ease.inCubic(invLerp(H.collapse + 0.18, H.collapse + 0.26, t));
    }
    ccam.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) rotateY(${ry.toFixed(3)}deg) scale(${sc.toFixed(4)}) translate(-280px, -60px)`;
    ccam.style.opacity = op.toFixed(3);
  }
}

// ---------------------------------------------------------------- collapse -> pulse -> end
const collapseG = $('#collapseLines');
function collapseScene(t) {
  const c0 = T['collapse'] + 0.3, c1 = H.end;
  if (t < c0 || t >= c1) { collapseG.innerHTML = ''; return; }
  // the visible rows of the room become lines, then one line, then the pulse
  const els = ['.example-banner', '#deck', '#deckNotice', '.workspace-tabs', '#rowChoice', '#rowReply', '#rowRead', '#rowPost', '#draft'].map((s) => $(s)).filter((e) => e && e.offsetParent !== null);
  const merge = ease.inOutCubic(invLerp(c0 + 0.05, c0 + 0.38, t));
  const pulseT = c0 + 0.4;
  let html = '';
  els.forEach((e, i) => {
    const r = e.getBoundingClientRect();
    const sq = ease.outCubic(invLerp(c0 + i * 0.012, c0 + 0.1 + i * 0.012, t));
    const y = lerp(r.top + r.height / 2, 540, merge);
    const x1 = lerp(r.left, 160, merge), x2 = lerp(r.right, 1760, merge);
    const w = lerp(Math.max(2, r.height * (1 - sq)), 3, sq);
    const col = mixHex('#8a8a84', '#d4ff3f', merge);
    const op = t < pulseT ? 1 : 0;
    html += `<line x1="${x1.toFixed(1)}" y1="${y.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${col}" stroke-opacity="${(op * lerp(0.55, 1, merge)).toFixed(3)}" stroke-width="${w.toFixed(2)}"/>`;
  });
  collapseG.innerHTML = html;
  // single line pulses, then contracts into the end-card mark
  if (t >= pulseT) {
    const E = lockupPos('end');
    const p = ease.inOutCubic(invLerp(pulseT + 0.06, c1, t));
    const beat = Math.min(1, (t - pulseT) / 0.03) * Math.exp(-Math.max(0, t - pulseT - 0.03) / 0.12);
    const amp = lerp(beat, 1, ease.outCubic(invLerp(pulseT + 0.06, pulseT + 0.14, t)));
    const u = lerp(26, E.size / 32, p);
    const cx = lerp(960, E.tileCx, p), cy = lerp(540, E.cy, p);
    show(pl, true); pl.style.opacity = '1';
    setLine(markPoints(cx, cy, u, amp, lerp(160, cx + (6.5 - 16) * u, ease.inCubic(p)), lerp(1760, cx + (25.5 - 16) * u, ease.inCubic(p))), lerp(3, 2.4 * E.size / 32, p), LIME);
  }
}

function endScene(t) {
  if (t < H.end) { show($('#cta'), false); return; }
  const E = lockupPos('end');
  const s = spring(t - H.end + 0.012, springs.heavy);
  const drift = 1 + (t - H.end) * 0.011;
  // whole lockup breathes in very slightly toward the end
  const cx = 960 + (E.tileCx - 960) * drift, cy = 540 + (E.cy - 540) * drift;
  drawTile(cx, cy, E.size * drift, s, 1, 0);
  const u = E.size * drift / 32;
  show(pl, true); pl.style.opacity = '1';
  setLine(markPoints(cx, cy, u, 1, null, null), 2.4 * u, mixHex(LIME, INK, invLerp(0.45, 0.9, s)));
  show(wordmark, true);
  wordmark.style.fontSize = (E.wm * drift).toFixed(2) + 'px';
  wordmark.style.transform = `translate(${(960 + (E.wmLeft - 960) * drift).toFixed(2)}px, ${(cy - E.wm * drift * 0.62).toFixed(2)}px)`;
  wordmark.style.clipPath = 'none';
  wordmark.style.opacity = '1';
  wordmark.firstElementChild.style.transform = 'none';
  wordmarkLetters(t, H.end + 0.1);
  // CTA pill
  const cta = $('#cta');
  show(cta, t >= T['cta']);
  const cs = t < T['cta'] ? 0 : spring(t - T['cta'], springs.snap);
  cta.style.top = (540 + 262 * drift).toFixed(1) + 'px';
  cta.style.opacity = clamp(cs * 1.8).toFixed(3);
  cta.style.transform = `translate(0px, ${((1 - cs) * 26).toFixed(2)}px) scale(${(lerp(0.9, 1, cs) * drift).toFixed(4)})`;
}

// ---------------------------------------------------------------- cursor
const cursor = $('#cursor');
const ring = $('#ring');
const centerOf = (sel, dx = 0, dy = 0) => () => { const r = $(sel).getBoundingClientRect(); return [r.left + r.width * 0.5 + dx, r.top + r.height * 0.5 + dy]; };
const knobOf = (sel) => () => { const r = $(sel + ' .toggle-track').getBoundingClientRect(); return [r.left + r.width * 0.55, r.top + r.height * 0.55]; };
const PATHS = [
  // [tStart, tEnd, waypoints [time, target]] — cursor glides between targets with the site's in-out ease
  [T['click-continue'] - 0.42, H.mic + 0.02, [[T['click-continue'] - 0.42, () => [1500, 1130]], [T['click-continue'] - 0.04, centerOf('#btnContinue', -60, 6)]]],
  [H.mic + 0.03, T['click-sign'] + 0.25, [
    [H.mic + 0.03, () => [1460, 1120]], [T['click-connect'] - 0.04, centerOf('#btnConnect', -40, 4)],
    [T['click-connect'] + 0.3, centerOf('#btnConnect', 30, 60)], [T['click-luna'] - 0.05, centerOf('#mcLuna h3', -10, 6)],
    [T['click-ctnative'] - 0.05, centerOf('#presetCT strong', 0, 4)], [T['slider-3'] + 0.2, centerOf('#presetCT', 40, 90)],
    [T['toggle-1'] - 0.03, knobOf('#pc1')], [T['toggle-2'] - 0.03, knobOf('#pc2')], [T['toggle-3'] - 0.03, knobOf('#pc3')],
    [T['click-approval'] - 0.04, centerOf('#chApproval h3', 0, 6)], [T['click-deposit'] - 0.05, centerOf('#btnDeposit', -20, 4)],
    [T['count'] + 0.5, centerOf('#btnDeposit', 50, 70)], [T['click-sign'] - 0.05, centerOf('#btnSign', -30, 4)],
  ]],
  [T['click-approve'] - 0.42, T['click-more'] + 0.4, [
    [T['click-approve'] - 0.42, () => [1720, 1130]], [T['click-approve'] - 0.04, centerOf('#btnApprove', -20, 4)],
    [T['click-approve'] + 0.5, centerOf('#btnApprove', 30, 50)], [T['click-more'] - 0.05, centerOf('#btnMore', -10, 4)],
  ]],
];
const CLICKS = ['click-continue', 'click-connect', 'click-luna', 'click-ctnative', 'toggle-1', 'toggle-2', 'toggle-3', 'click-approval', 'click-deposit', 'click-sign', 'click-approve', 'click-more'].map((id) => T[id]);
function cursorScene(t) {
  const path = PATHS.find(([a, b]) => t >= a && t < b);
  show(cursor, !!path);
  if (!path) return;
  const wps = path[2];
  let pos;
  if (t <= wps[0][0]) pos = wps[0][1]();
  else if (t >= wps[wps.length - 1][0]) pos = wps[wps.length - 1][1]();
  else {
    for (let i = 1; i < wps.length; i++) {
      if (t <= wps[i][0]) {
        const k = ease.voiceInOut(invLerp(wps[i - 1][0], wps[i][0], t));
        const a = wps[i - 1][1](), b = wps[i][1]();
        pos = [lerp(a[0], b[0], k), lerp(a[1], b[1], k) - Math.sin(k * Math.PI) * 18];
        break;
      }
    }
  }
  // exit: glide away at the end of a path
  const out = ease.inCubic(invLerp(path[1] - 0.18, path[1], t));
  pos = [pos[0] + out * 260, pos[1] + out * 200];
  let dip = 0, ringK = -1;
  for (const c of CLICKS) {
    if (t >= c - 0.03 && t < c + 0.14) dip = Math.max(dip, Math.sin(clamp((t - c + 0.03) / 0.17) * Math.PI));
    if (t >= c && t < c + 0.36) ringK = (t - c) / 0.36;
  }
  cursor.style.transform = `translate(${pos[0].toFixed(2)}px, ${pos[1].toFixed(2)}px) scale(${(1 - dip * 0.14).toFixed(4)})`;
  ring.style.opacity = ringK >= 0 ? ((1 - ringK) * 0.85).toFixed(3) : '0';
  ring.style.transform = `scale(${(ringK >= 0 ? lerp(0.35, 1.5, ease.outCubic(ringK)) : 0.35).toFixed(4)})`;
}

// ---------------------------------------------------------------- atmosphere
function atmosphere(t) {
  const dead = window1(t, H.quiet + 0.1, T['spike-1'] + 0.1, 0.3, 0.1);
  css($('#ambient'), { transform: `translate(${(noise1(t * 0.18, 3) * 50 - t * 4).toFixed(2)}px, ${(noise1(t * 0.15, 7) * 30).toFixed(2)}px)`, opacity: (1 - 0.65 * dead).toFixed(3) });
  // key light follows the hero object of each act
  const kl = poseTrack(t, [
    [0, { x: 1450, y: 560, o: 0.5 }], [T['card-pop'] - 0.02, { x: 1450, y: 560, o: 0.55 }], [T['card-pop'] + 0.08, { x: 1450, y: 540, o: 1 }], [H.quiet, { x: 1450, y: 560, o: 0.6 }], [H.quiet + 0.4, { x: 600, y: 760, o: 0 }],
    [T['spike-1'], { x: 960, y: 760, o: 0 }], [T['logo-hit'], { x: 960, y: 420, o: 1 }], [H.create - 0.1, { x: 960, y: 420, o: 0.7 }],
    [H.create + 0.3, { x: 1500, y: 560, o: 0.55 }], [H.wake, { x: 1300, y: 520, o: 0.5 }], [H.wake + 0.15, { x: 1300, y: 480, o: 0.85 }],
    [H.reply + 0.5, { x: 1300, y: 520, o: 0.55 }], [H.choice, { x: 1300, y: 560, o: 0.3 }], [H.collapse + 0.4, { x: 960, y: 540, o: 0.2 }],
    [H.end, { x: 960, y: 420, o: 1 }], [H.out, { x: 960, y: 440, o: 0.75 }],
  ]);
  css($('#keylight'), { transform: `translate(${kl.x.toFixed(2)}px, ${kl.y.toFixed(2)}px)`, opacity: kl.o.toFixed(3) });
  const scr = Math.max(window1(t, T['tile-fly'] + 0.05, H.wake + 0.05, 0.3, 0.12), window1(t, H.wake + 0.05, T['collapse'] + 0.3, 0.2, 0.25));
  $('#scrim').style.opacity = scr.toFixed(3);
  // dim everything but the one decision for the chosen-silence moment
  $('#dim').style.opacity = (window1(t, H.choice, H.collapse + 0.2, 0.1, 0.25) * 0.78).toFixed(3);
  const g = Math.floor(t * 24);
  $('#grain').style.backgroundPosition = `${Math.floor(hash01(g * 7 + 1) * 160)}px ${Math.floor(hash01(g * 13 + 5) * 160)}px`;
}

// ---------------------------------------------------------------- captions schedule
const cy = 540;
function captions(t) {
  const hook = $('#capHook'); placeCap(hook, 520);
  caption(hook, t, { inAt: [-0.34, -0.29, -0.24, T['card-pop'] - 0.5, T['card-pop'] - 0.25], outAt: H.quiet - 0.005, outDur: 0.12 });
  const q = $('#capQuiet'); placeCap(q, 478 - clamp(t - H.quiet, 0, 2.6) * 9);
  caption(q, t, { inAt: H.quiet + 0.14, stagger: 0.11, outAt: T['spike-1'] - 0.22, preset: springs.firm, blur: 12 });
  const rv = $('#capReveal'); rv.style.top = '492px';
  caption(rv, t, { inAt: [T['line-one-coin'], T['line-one-coin'] + 0.05, T['line-x-manager'], T['line-x-manager'] + 0.05, T['line-x-manager'] + 0.1], outAt: T['tile-fly'] - 0.08 });
  // persistent rolling caption across creation + configuration + launch
  const roll = $('#capRoll'); placeCap(roll, cy);
  const rollEnd = H.wake - 0.2;
  const ron = t >= H.create && t < rollEnd + 0.4;
  show(roll, ron);
  if (ron) {
    slot($('#slotA'), t, [H.create + 0.02, H.mic, H.launch], rollEnd, springs.snap, 1);
    slot($('#slotB'), t, [H.create + 0.1, H.mic, H.brain, H.character, H.bounds, H.budget, H.launch], rollEnd, springs.snap, 1);
  }
  const th = $('#capThinks'); placeCap(th, cy);
  caption(th, t, { inAt: H.wake + 0.22, stagger: 0.07, outAt: H.learn - 0.16 });
  const le = $('#capLearns'); placeCap(le, cy);
  caption(le, t, { inAt: H.learn + 0.02, stagger: 0.07, outAt: H.choice - 0.17 });
  const qc = $('#capQuietChoice'); placeCap(qc, cy);
  caption(qc, t, { inAt: [H.choice, H.choice + 0.06, H.choice + 0.24, H.choice + 0.29, H.choice + 0.34], outAt: T['collapse'] + 0.26, preset: springs.firm });
  const en = $('#capEnd'); en.style.top = '438px';
  const drift = 1 + Math.max(0, t - H.end) * 0.011;
  en.style.transform = `translate(0px, ${((drift - 1) * 40).toFixed(2)}px) scale(${drift.toFixed(4)})`;
  caption(en, t, { inAt: [T['end-line-1'], T['end-line-1'] + 0.05, T['end-line-2'], T['end-line-2'] + 0.04, T['end-line-2'] + 0.08, T['end-line-2'] + 0.12, T['end-line-2'] + 0.16] });
}

// ---------------------------------------------------------------- seek
function seek(t) {
  t = clamp(t, 0, TL.duration - 1e-6);
  // shared drawables start every frame hidden; scenes switch on what they own (no carried state)
  show(pl, false); show(tile, false); show(wordmark, false);
  atmosphere(t);
  previewScene(t);
  boardScene(t);
  roomScene(t);
  floatScene(t);
  lineScene(t);
  revealScene(t);
  collapseScene(t);
  endScene(t);
  captions(t);
  cursorScene(t);
  // Fresh render: re-attach the stage so Chromium rebuilds its layers and rasters each frame at the ideal
  // scale for *this* state. Without it, compositor raster caches (layer raster scale, re-used gradient tiles)
  // make pixels depend on seek history by 1-2 LSB — caught by `render.mjs --verify`.
  const parent = stage.parentNode, next = stage.nextSibling;
  parent.removeChild(stage);
  parent.insertBefore(stage, next);
}
const stage = $('#stage');
window.seek = seek;
window.__duration = TL.duration;
await Promise.all([
  document.fonts.load('740 124px "Bricolage Grotesque"'), document.fonts.load('700 34px "Bricolage Grotesque"'),
  document.fonts.load('400 16px Geist'), document.fonts.load('600 16px Geist'), document.fonts.load('500 16px "Geist Mono"'),
]);
await document.fonts.ready;
// layout constants measured once, with default content, independent of any seek order
measureWordmark();
seek(0);
PV_H = preview.offsetHeight;
boardCam.style.display = 'block';
stepBtns.forEach((b) => { b.className = ''; });
stepOffsets = stepBtns.map((b) => b.offsetLeft);
boardCam.style.display = 'none';
for (const el of $$('.cap')) { el.style.fontSize = ''; }
for (const el of $$('.cap')) { capLayout[el.id] = el.classList.contains('center') ? (el.style.display = 'block', el.offsetHeight) : fitCaption(el, CAP_MAX_W[el.id] || 720); el.style.display = 'none'; }
seek(0);
window.__ready = Promise.resolve(true);
