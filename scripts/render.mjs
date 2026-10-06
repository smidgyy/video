#!/usr/bin/env node
// Deterministic frame renderer for the Voice film.
//
//   node scripts/render.mjs --format 16x9            final render (60 fps, 2-subframe motion blur)
//   node scripts/render.mjs --all                    every format listed in timeline.json
//   node scripts/render.mjs --format 9x16 --draft    fast preview (30 fps, no blur, CRF 23)
//   node scripts/render.mjs --stills 0,5.2,12 --format 16x9   PNG stills
//   node scripts/render.mjs --verify --all           determinism + purity verification (no encode)
//
// Each frame is produced by window.seek(t) on a fresh layout; nothing depends on wall-clock time.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const timeline = JSON.parse(fs.readFileSync(path.join(ROOT, 'timeline.json'), 'utf8'));
const FORMATS = timeline.formats;

// ---------- args ----------
const argv = process.argv.slice(2);
const flag = (n) => argv.includes(`--${n}`);
const opt = (n, d) => { const i = argv.indexOf(`--${n}`); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : d; };
const draft = flag('draft');
const fps = Number(opt('fps', draft ? 30 : timeline.fps));
const mb = Number(opt('mb', draft ? 1 : timeline.motionBlurSubframes));
const scale = Number(opt('scale', draft ? 0.5 : 1));
const workers = Number(opt('workers', 4));
const crf = Number(opt('crf', draft ? 23 : 16));
const formats = flag('all') ? Object.keys(FORMATS).filter((f) => FORMATS[f].ship !== false) : [opt('format', '16x9')];
const outDir = path.resolve(ROOT, opt('out', draft ? 'renders/draft' : 'renders'));
const audioPath = path.resolve(ROOT, opt('audio', 'audio/out/mix.wav'));
const t0Arg = Number(opt('from', 0));
const t1Arg = opt('to', null);

// ---------- static server ----------
function serve() {
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' };
  const server = http.createServer((req, res) => {
    const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const file = path.join(ROOT, p);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((r) => server.listen(0, '127.0.0.1', () => r(server)));
}

const CHROME_ARGS = ['--force-color-profile=srgb', '--font-render-hinting=none', '--disable-lcd-text', '--hide-scrollbars', '--disable-font-subpixel-positioning'];

// Purity probe: records any use of clocks / schedulers / randomness after the page reports ready.
const PURITY_PROBE = `(() => {
  const hits = window.__purity = [];
  const wrap = (obj, key, label) => { const orig = obj[key]; if (typeof orig !== 'function') return;
    obj[key] = function (...a) { if (window.__armed) hits.push(label); return orig.apply(this, a); }; };
  wrap(window, 'requestAnimationFrame', 'requestAnimationFrame');
  wrap(window, 'setTimeout', 'setTimeout');
  wrap(window, 'setInterval', 'setInterval');
  wrap(Date, 'now', 'Date.now');
  wrap(performance, 'now', 'performance.now');
  wrap(Math, 'random', 'Math.random');
})();`;

async function openPage(browser, fmt) {
  const { w, h } = FORMATS[fmt];
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: scale, reducedMotion: 'reduce', colorScheme: 'dark' });
  await ctx.addInitScript(PURITY_PROBE);
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.error(`[${fmt}] pageerror:`, e.message));
  page.on('console', (m) => { if (m.type() === 'error') console.error(`[${fmt}] console:`, m.text()); });
  await page.goto(`${BASE}/film/index.html?format=${fmt}`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__ready !== undefined, null, { timeout: 60000 });
  await page.evaluate(() => window.__ready);
  await page.evaluate(() => { window.__armed = true; });
  const cdp = await ctx.newCDPSession(page);
  return { ctx, page, cdp };
}

async function grab(p, t) {
  await p.page.evaluate((tt) => window.seek(tt), t);
  const { data } = await p.cdp.send('Page.captureScreenshot', { format: 'png', optimizeForSpeed: true, captureBeyondViewport: false });
  return Buffer.from(data, 'base64');
}

// Frame k of the output at fps with mb subframes -> times k/fps + j/(fps*mb), j < mb.
// Subframes never straddle a multiple of 1/fps, so hard cuts placed on frame boundaries stay clean.
function frameTimes(k) { return Array.from({ length: mb }, (_, j) => (k * mb + j) / (fps * mb)); }

let BASE;
async function renderFormat(browser, fmt) {
  const duration = timeline.duration;
  const k0 = Math.round(t0Arg * fps);
  const k1 = t1Arg !== null ? Math.round(Number(t1Arg) * fps) : Math.round(duration * fps);
  const nFrames = k1 - k0;
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `${fmt}${t1Arg !== null || t0Arg ? `_${t0Arg}-${t1Arg}` : ''}.mp4`);
  const { w, h } = FORMATS[fmt];
  const inFps = fps * mb;
  const vf = [];
  if (mb > 1) vf.push(`tmix=frames=${mb}:weights='${Array(mb).fill(1).join(' ')}'`, `select='eq(mod(n\\,${mb})\\,${mb - 1})'`, `setpts=N/(${fps}*TB)`);
  vf.push(`scale=${w}:${h}:flags=lanczos:out_color_matrix=bt709:out_range=tv`, 'format=yuv420p');
  const hasAudio = fs.existsSync(audioPath) && !flag('no-audio');
  const args = ['-hide_banner', '-loglevel', 'error', '-y',
    '-f', 'image2pipe', '-framerate', String(inFps), '-c:v', 'png', '-i', '-',
    ...(hasAudio ? ['-ss', String(k0 / fps), '-t', String(nFrames / fps), '-i', audioPath] : []),
    '-vf', vf.join(','), '-r', String(fps),
    '-c:v', 'libx264', '-preset', draft ? 'veryfast' : 'slow', '-crf', String(crf), '-profile:v', 'high', '-pix_fmt', 'yuv420p',
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
    ...(hasAudio ? ['-c:a', 'aac', '-b:a', '320k', '-ar', '48000', '-shortest'] : ['-an']),
    '-movflags', '+faststart', outFile];
  const ff = spawn('ffmpeg', args, { stdio: ['pipe', 'inherit', 'inherit'] });
  const ffDone = new Promise((r, j) => ff.on('close', (c) => (c === 0 ? r() : j(new Error('ffmpeg exit ' + c)))));

  const pages = await Promise.all(Array.from({ length: workers }, () => openPage(browser, fmt)));
  const BLOCK = 12;
  const nBlocks = Math.ceil(nFrames / BLOCK);
  const results = new Map();
  let nextBlock = 0, written = 0;
  const started = process.hrtime.bigint();
  const waiters = [];
  const notify = () => { while (waiters.length) waiters.shift()(); };
  const write = (buf) => new Promise((r) => (ff.stdin.write(buf) ? r() : ff.stdin.once('drain', r)));

  async function worker(p) {
    for (;;) {
      const b = nextBlock++;
      if (b >= nBlocks) return;
      while (b - written / BLOCK > workers * 3) await new Promise((r) => waiters.push(r));
      const bufs = [];
      for (let k = k0 + b * BLOCK; k < Math.min(k0 + (b + 1) * BLOCK, k1); k++) for (const t of frameTimes(k)) bufs.push(await grab(p, t));
      results.set(b, bufs);
      notify();
    }
  }
  async function writer() {
    for (let b = 0; b < nBlocks; b++) {
      while (!results.has(b)) await new Promise((r) => waiters.push(r));
      for (const buf of results.get(b)) await write(buf);
      results.delete(b);
      written += BLOCK;
      notify();
      if (b % 10 === 0) {
        const el = Number(process.hrtime.bigint() - started) / 1e9;
        process.stdout.write(`\r[${fmt}] ${Math.min(written, nFrames)}/${nFrames} frames  ${(Math.min(written, nFrames) / el).toFixed(1)} fps   `);
      }
    }
    ff.stdin.end();
  }
  await Promise.all([...pages.map(worker), writer()]);
  await ffDone;
  await Promise.all(pages.map((p) => p.ctx.close()));
  const el = Number(process.hrtime.bigint() - started) / 1e9;
  console.log(`\r[${fmt}] wrote ${path.relative(ROOT, outFile)}  (${nFrames} frames, ${el.toFixed(1)}s)          `);
}

async function stills(browser, fmt, times) {
  const p = await openPage(browser, fmt);
  const dir = path.resolve(ROOT, opt('stills-dir', `review/stills/${fmt}`));
  fs.mkdirSync(dir, { recursive: true });
  for (const t of times) {
    const buf = await grab(p, t);
    const f = path.join(dir, `${fmt}_t${t.toFixed(2).padStart(6, '0')}.png`);
    fs.writeFileSync(f, buf);
    console.log(path.relative(ROOT, f));
  }
  await p.ctx.close();
}

// ---------- verification ----------
async function verify(browser, fmt) {
  const problems = [];
  const D = timeline.duration;
  const probes = new Set([0, D - 1 / timeline.fps]);
  for (let i = 1; i < 24; i++) probes.add(Math.round((i * D) / 24 * timeline.fps) / timeline.fps);
  for (const s of timeline.shots) { probes.add(s.start); probes.add(Math.max(0, s.start - 1 / timeline.fps)); probes.add(s.start + 0.25); }
  const times = [...probes].filter((t) => t >= 0 && t < D).sort((a, b) => a - b);
  const hash = (b) => crypto.createHash('sha256').update(b).digest('hex').slice(0, 16);

  // Pass A: forward order in one page.
  const A = await openPage(browser, fmt);
  const ha = {};
  for (const t of times) ha[t] = hash(await grab(A, t));
  // Pass B: fresh page, reverse order, with an unrelated seek before each probe (catches carried state).
  const B = await openPage(browser, fmt);
  const r = (() => { let s = 7; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
  let mismatches = 0;
  for (const t of [...times].reverse()) {
    await B.page.evaluate((tt) => window.seek(tt), r() * D);
    const hb = hash(await grab(B, t));
    if (hb !== ha[t]) { mismatches++; problems.push(`frame mismatch at t=${t.toFixed(3)}s`); }
  }
  // Pass C: same page A, repeat a probe after scrubbing far away.
  for (const t of times.filter((_, i) => i % 5 === 0)) {
    await A.page.evaluate((tt) => window.seek(tt), D - t);
    const hc = hash(await grab(A, t));
    if (hc !== ha[t]) { mismatches++; problems.push(`re-seek mismatch at t=${t.toFixed(3)}s`); }
  }
  // Runtime purity.
  for (const p of [A, B]) {
    const info = await p.page.evaluate(() => ({ purity: [...new Set(window.__purity)], anims: document.getAnimations().length,
      transitions: [...document.querySelectorAll('*')].filter((e) => { const cs = getComputedStyle(e); return cs.transitionDuration.split(',').some((d) => parseFloat(d) > 0) || (cs.animationName && cs.animationName !== 'none'); }).length,
      willChange: [...document.querySelectorAll('*')].filter((e) => getComputedStyle(e).willChange !== 'auto').length,
      fonts: [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family).filter((v, i, a) => a.indexOf(v) === i),
      imgs: [...document.images].filter((i) => !i.complete || !i.naturalWidth).length }));
    if (info.purity.length) problems.push(`runtime used: ${info.purity.join(', ')}`);
    if (info.anims) problems.push(`${info.anims} active Web Animations`);
    if (info.transitions) problems.push(`${info.transitions} elements with CSS transitions/animations`);
    if (info.willChange) problems.push(`${info.willChange} elements with will-change`);
    if (info.imgs) problems.push(`${info.imgs} images not loaded`);
    for (const f of ['Bricolage Grotesque', 'Geist', 'Geist Mono']) if (!info.fonts.includes(f)) problems.push(`font not loaded: ${f}`);
  }
  await A.ctx.close(); await B.ctx.close();
  const uniq = [...new Set(problems)];
  console.log(`[verify ${fmt}] ${times.length} probe frames, ${mismatches} mismatches, ${uniq.length ? 'FAIL' : 'PASS'}`);
  uniq.forEach((p) => console.log('   - ' + p));
  return uniq.length === 0;
}

// ---------- picture/sound sync ----------
// For every SFX event: render frames k-4..k+4 clipped to the event's target element and find where the
// picture actually changes (ImageMagick MAE between consecutive frames). Sound starts on frame k.
async function syncCheck(browser, fmt) {
  const { execFileSync } = await import('node:child_process');
  const dir = path.resolve(ROOT, opt('sync-dir', 'review/sync'));
  fs.mkdirSync(dir, { recursive: true });
  const p = await openPage(browser, fmt);
  const F = timeline.fps;
  const rows = [];
  for (const e of timeline.events.filter((x) => x.sfx)) {
    const k = Math.round(e.t * F);
    const rect = await p.page.evaluate(({ sel, ts }) => {
      let u = null;
      for (const tt of ts) {
        window.seek(tt);
        const el = sel && document.querySelector(sel);
        const r = el ? el.getBoundingClientRect() : null;
        if (!r || r.width < 2 || r.height < 2) continue;
        u = u ? { l: Math.min(u.l, r.left), t: Math.min(u.t, r.top), r: Math.max(u.r, r.right), b: Math.max(u.b, r.bottom) } : { l: r.left, t: r.top, r: r.right, b: r.bottom };
      }
      return u;
    }, { sel: e.target, ts: [e.t - 0.05, e.t + 0.08, e.t + 0.2] });
    const W = FORMATS[fmt].w, Hh = FORMATS[fmt].h;
    const clip = rect ? { x: Math.max(0, rect.l - 16), y: Math.max(0, rect.t - 16) } : { x: 0, y: 0 };
    if (rect) { clip.width = Math.min(W, rect.r + 16) - clip.x; clip.height = Math.min(Hh, rect.b + 16) - clip.y; } else { clip.width = W; clip.height = Hh; }
    const files = [];
    const dMax = e.sfx === 'whoosh' ? 14 : 4;   // a whoosh is matched to the motion's fastest frame, which can be later
    for (let d = -4; d <= dMax; d++) {
      await p.page.evaluate((tt) => { window.seek(tt); for (const id of ['#cursor', '#grain']) { const c = document.querySelector(id); if (c) c.style.visibility = 'hidden'; } }, (k + d) / F);
      const { data } = await p.cdp.send('Page.captureScreenshot', { format: 'png', clip: { ...clip, scale: 1 } });
      const f = path.join(dir, `${e.id}_${d + 4}.png`);
      fs.writeFileSync(f, Buffer.from(data, 'base64'));
      files.push(f);
    }
    const ch = [];
    for (let i = 1; i < files.length; i++) {
      let out = '';
      try { execFileSync('compare', ['-metric', 'MAE', files[i - 1], files[i], 'null:'], { stdio: ['ignore', 'ignore', 'pipe'] }); out = '0 (0)'; }
      catch (err) { out = String(err.stderr || ''); }
      const m = out.match(/\(([\d.e-]+)\)/);
      ch.push(m ? Number(m[1]) : 0);
    }
    // change ch[i] is between frame (k-4+i-1) and (k-4+i): it is "at" frame offset i-4
    const max = Math.max(...ch);
    const base = Math.min(ch[0], ch[1]);   // change already present before the event (camera drift)
    const thr = base + 0.5 * (max - base);  // half-height onset above that baseline
    const oi = ch.findIndex((c, i) => i >= 1 && c >= thr);
    const onset = max > 0.002 && oi >= 0 ? oi - 3 : null;
    const peak = max > 0.002 ? ch.indexOf(max) - 3 : null;
    // a whoosh is heard at its swell peak (timeline event.peak, used by audio/sfx.py too)
    const soundAt = e.sfx === 'whoosh' ? Math.round((e.peak ?? 0) * F) : 0;
    const off = e.sfx === 'whoosh' ? (peak === null ? null : peak - soundAt) : onset;
    rows.push({ id: e.id, sfx: e.sfx, t: e.t, target: e.target || null, ch: ch.map((c) => Number(c.toFixed(4))), onsetFrames: onset, peakFrames: peak, offsetFrames: off, maxChange: Number(max.toFixed(4)), ok: off !== null && Math.abs(off) <= 2 });
    files.forEach((f) => fs.unlinkSync(f));
  }
  await p.ctx.close();
  fs.writeFileSync(path.join(dir, `sync_${fmt}.json`), JSON.stringify(rows, null, 1));
  const bad = rows.filter((r) => !r.ok);
  rows.forEach((r) => console.log(`${r.ok ? 'ok  ' : 'FAIL'} ${r.id.padEnd(16)} ${r.sfx.padEnd(8)} t=${r.t.toFixed(3)}  offset ${r.offsetFrames} fr  (change ${r.maxChange})`));
  console.log(`[sync ${fmt}] ${rows.length - bad.length}/${rows.length} events within ±2 frames (±33 ms)`);
  return bad.length === 0;
}

// ---------- main ----------
const server = await serve();
BASE = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ args: CHROME_ARGS });
let ok = true;
try {
  if (flag('verify')) {
    const { execFileSync } = await import('node:child_process');
    try { execFileSync('node', [path.join(ROOT, 'scripts/lint.mjs')], { stdio: 'inherit' }); } catch { ok = false; }
    for (const f of formats) ok = (await verify(browser, f)) && ok;
    console.log(ok ? 'VERIFY: PASS' : 'VERIFY: FAIL');
  } else if (flag('sync')) {
    for (const f of formats) ok = (await syncCheck(browser, f)) && ok;
  } else if (opt('stills', null)) {
    const times = opt('stills').split(',').map(Number);
    for (const f of formats) await stills(browser, f, times);
  } else {
    for (const f of formats) await renderFormat(browser, f);
  }
} finally {
  await browser.close();
  server.close();
}
process.exit(ok ? 0 : 1);
