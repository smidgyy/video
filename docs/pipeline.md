# Pipeline

The requested motion-reel-kit was not present in this repository (empty at session start), so this pipeline re-implements the kit contract described in the brief. Everything runs locally; no paid services.

```
python3 -I audio/compose.py          # original score  -> audio/out/music.wav (+ score.json)
python3 -I audio/analyze_beats.py    # MEASURED beat grid of the rendered score -> audio/out/beats.json
node scripts/resolve-timeline.mjs    # timeline.json beats -> seconds (measured grid, frame-quantised cuts)
python3 -I audio/sfx.py              # UI sound design from timeline events -> audio/out/sfx.wav
python3 -I audio/mix.py              # -14 LUFS / <= -1 dBTP mix -> audio/out/mix.wav
node scripts/render.mjs --verify --all   # lint + determinism + runtime purity
node scripts/render.mjs --sync --format 16x9   # picture/sound sync of every SFX event, on rendered pixels
node scripts/render.mjs --all            # final export -> renders/16x9.mp4
python3 -I scripts/review.py renders/16x9.mp4 review/rN   # critique kit on the rendered file
```

## Determinism contract (`engine/motion.js`, `film/film.js`)
- `window.seek(t)` is the only clock. Each call writes every animated property from `t` alone.
- Springs are closed-form (analytic damped oscillator); no integration state.
- Randomness: seeded `rng()` / stateless `hash01()` / `noise1()` only.
- No `requestAnimationFrame`, timers, `Date`, `performance.now`, `Math.random`, CSS transitions/animations, Web Animations, `will-change`, `translate3d`, `translateZ(0)`.
- Layout constants (caption heights, wordmark widths, step-pill offsets, preview height) are measured once at load with default content, never lazily.
- **Fresh render per frame:** after writing the state, `seek()` detaches and re-attaches `#stage`, so Chromium rebuilds its layer tree and rasters every layer at the ideal scale for that state. Without this, compositor raster caches (re-used gradient tiles on moving layers, raster-scale hysteresis on 3D-transformed layers) made pixels depend on seek history by 1–2/255. Found by `--verify`, diagnosed with `scripts/tools/detdiag.mjs`.

## Verification (`--verify`)
1. Static lint over `film/`, `engine/`, `assets/vendor/` for every forbidden API/property.
2. Probe frames (24 evenly spaced + every shot boundary ±1 frame + 0.25 s into each shot) rendered **forward in one page**, then **in reverse in a fresh page with a random unrelated seek before each probe**, then **re-seeked after scrubbing** — SHA-256 of every PNG must match.
3. Runtime purity probe: wraps rAF, timers, `Date.now`, `performance.now`, `Math.random` and fails if any is called after load; asserts zero active Web Animations, zero elements with transitions/animations or `will-change`, all images decoded, all three brand fonts loaded.

## Rendering
Playwright Chromium, sRGB forced, dark colour scheme (as the site renders), LCD AA off. Frames captured over CDP as PNG, rendered by 4 parallel pages in ordered blocks and piped to ffmpeg.
Motion blur: velocity blur inside the film (one sample per frame; `--mb N` sub-frame blending exists but is off because it ghosts fast type).
Export: H.264 High, CRF 16, `preset slow`, yuv420p, BT.709 matrix/primaries/transfer, TV range, 60 fps, AAC 320k 48 kHz, `+faststart`.

## Picture/sound sync (`--sync`)
For each SFX event in `timeline.json`, the renderer captures frames k−4 … k+4 (k+14 for whooshes) clipped to the event's `target` element, with the cursor and grain hidden. It then measures frame-to-frame change (ImageMagick MAE). The visual onset is the first frame at half-height above the pre-event baseline. Whooshes are matched by their fastest-motion frame against the swell peak stored in `event.peak`. Pass: |offset| ≤ 2 frames (33 ms). Report: `review/sync/sync_16x9.json`.

## Dev tools
- `scripts/tools/probe.mjs "<js>"`: evaluate inside the film page.
- `scripts/tools/detdiag.mjs <t> <pre-seeks>`: capture t twice and after other seeks, diff pixels and the serialized DOM (`HIDE=sel,…`, `CHROME_EXTRA=flags`, `REATTACH=1`).
- `scripts/tools/sanitize-css.mjs`: re-vendor the site stylesheet.
- `scripts/capture/*.mjs`: product capture.
