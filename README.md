# Voice — flagship film

**`renders/16x9.mp4`**: 24.0 s, 1920×1080, 60 fps, H.264 High CRF 16, BT.709, AAC 320k 48 kHz, −14 LUFS / −1.2 dBTP.

*One coin. A voice of its own.* An original score with no voiceover, built entirely from tryvoice.fun's real stylesheet, DOM, fonts and copy.

| Read | |
|---|---|
| `brief.md` | what the film must say, and the honesty rules it follows |
| `docs/shotlist.md` | every beat: time, measured beat, visual, exact text, motion, sound |
| `docs/style_guide.md` | palette, type and motion tokens (measured from the site) |
| `docs/review_log.md` | 5 critique rounds plus the final, with scores and fixes |
| `docs/references.md` | what was learned from the four reference films |
| `docs/product_capture.md` | what is real UI, what was reconstructed and why |
| `docs/pipeline.md` | how to rebuild, verify and render |
| `timeline.json` | single source of truth for shots and events (beats resolved against the measured grid) |
| `review/final/` | contact sheet, phone sheets, swap and motion strips, loop seam, sync report, metrics |

```
npm install
python3 -I audio/compose.py && python3 -I audio/analyze_beats.py && node scripts/resolve-timeline.mjs
python3 -I audio/sfx.py && python3 -I audio/mix.py
node scripts/render.mjs --verify --all
node scripts/render.mjs --sync --format 16x9
node scripts/render.mjs --all
```
Requires Node 22, Python 3 with numpy + scipy, ffmpeg, ImageMagick, and Playwright's Chromium.
