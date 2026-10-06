#!/usr/bin/env node
// Resolve timeline.json beat positions to seconds using the MEASURED beat grid (audio/out/beats.json).
// Shot starts are quantised to output-frame boundaries (1/fps) so hard cuts never straddle sub-frames.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tlPath = path.join(ROOT, 'timeline.json');
const tl = JSON.parse(fs.readFileSync(tlPath, 'utf8'));
const beats = JSON.parse(fs.readFileSync(path.join(ROOT, tl.audio.beats), 'utf8'));
const bt = beats.beats.map((b) => b.t);
const period = beats.period;

function beatToTime(b) {
  const i = Math.floor(b), f = b - i;
  const t0 = i < bt.length ? bt[i] : bt[bt.length - 1] + (i - bt.length + 1) * period;
  const t1 = i + 1 < bt.length ? bt[i + 1] : t0 + period;
  return t0 + f * (t1 - t0);
}
const q = (t) => Math.max(0, Math.round(t * tl.fps) / tl.fps);

tl.shots.forEach((s, i) => {
  s.start = q(beatToTime(s.beat));
});
tl.shots.forEach((s, i) => {
  s.end = i + 1 < tl.shots.length ? tl.shots[i + 1].start : tl.duration;
});
tl.events.forEach((e) => { e.t = Number(beatToTime(e.beat).toFixed(4)); });
tl.beatGrid = { source: tl.audio.beats, bpm: beats.bpm, phase: beats.phase, measured: beats.n_measured, total: beats.n_beats, devMs: beats.grid_dev_ms };
fs.writeFileSync(tlPath, JSON.stringify(tl, null, 2) + '\n');
for (const s of tl.shots) console.log(`${s.id.padEnd(16)} beat ${String(s.beat).padStart(3)}  ${s.start.toFixed(3)} - ${s.end.toFixed(3)} s`);
console.log(`${tl.events.length} events resolved against measured grid (${beats.bpm} BPM)`);
