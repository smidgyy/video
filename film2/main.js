// film2 — "Night Windows". Every frame is a pure function of t (window.seek). See docs/v2/treatment.md, docs/v2/build_guide.md, timeline2.json.
import * as C from './core.js';
import { grainTiles } from '../engine/textures.js';

await document.fonts.ready;
await Promise.all([
  document.fonts.load('660 104px "Bricolage Grotesque"'),
  document.fonts.load('700 100px "Bricolage Grotesque"'),
  document.fonts.load('800 120px "Bricolage Grotesque"'),
  document.fonts.load('400 17px "Geist Mono"'),
  document.fonts.load('500 22px "Geist Mono"'),
  document.fonts.load('500 16px "Geist"'),
]);
// Each set is loaded in isolation: a set that fails to load only loses its own shots (placeholders render instead).
const SET_FILES = ['./sets/facade.js', './sets/facade_act1.js', './sets/unitA.js', './sets/desk.js', './sets/unitB.js', './sets/street.js', './sets/end.js'];
window.__setErrors = {};
for (const f of SET_FILES) {
  try {
    const m = await import(f);
    if (m.init) await m.init();
  } catch (e) {
    window.__setErrors[f] = String(e && e.stack || e);
    console.error(`[film2] set ${f} failed: ${e && e.message}`);
  }
}
C.setGrainTiles(grainTiles({ size: 256, frames: 8, seed: 1, contrast: 1 }));

// Placeholder for any shot that no set registered yet (development only).
for (const s of C.TL.shots) if (!C.shots.find((x) => x.id === s.id)) C.shot(s.id, (t) => {
  const g = C.L.world; g.setTransform(1, 0, 0, 1, 0, 0);
  g.fillStyle = '#16171a'; g.fillRect(0, 0, C.W, C.H);
  g.fillStyle = '#5d5d59'; g.font = '500 28px "Geist Mono"'; g.fillText(`${s.id}  (not built)`, 80, 120);
  g.fillStyle = '#8a8a84'; g.font = '400 22px "Geist Mono"'; g.fillText(s.what, 80, 170);
}, { placeholder: true });
C.shots.sort((a, b) => a.start - b.start);

function seek(t) {
  C.clearLayers();
  for (const el of C.UI.children) el.style.visibility = 'hidden';
  const s = C.activeShot(t);
  const look = s.render(t) || {};
  C.grain(t, look.grain ?? 0.045);
  C.vignette(look.vignette ?? 0.1);
  // fresh raster every seek: detach/reattach the stage so no compositor history leaks between frames
  const parent = C.stage.parentNode, next = C.stage.nextSibling;
  parent.removeChild(C.stage); parent.insertBefore(C.stage, next);
}
window.seek = seek;
window.__duration = C.TL.duration;
window.__shots = C.shots.map((s) => s.id);
window.__ready = Promise.resolve(true);
