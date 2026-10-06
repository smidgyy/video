# Review log

Every round is judged on the **rendered MP4** with `scripts/review.py` (contact sheet, swap strips, motion strips, phone sheets at 360 px, loop strip, metrics). Assets per round live in `review/rN/`.

Scale: 1–10 per criterion. Ship rule: every score ≥ 8 and at least 3 rounds.

---

## Round 1 — `review/r1/16x9.mp4`
Render: 60 fps, 2-subframe motion blur, CRF 16. 24.000 s. −14.0 LUFS / −1.3 dBTP. BT.709 tags OK.

| Hook | Readability | Motion | Variety/Pacing | Brand accuracy | Composition | Sound sync | Polish |
|---|---|---|---|---|---|---|---|
| 6 | 6 | 6 | 7 | 9 | 6 | 7 | 5 |

What works: the story reads end to end without VO. The flatline → pulse → logo reveal and the feed → line → logo ending are strong bookends. The configuration anaphora ("Give it … a brain / a character / boundaries / a budget") with the persistent wizard reads as one evolving system. Real UI looks premium in perspective. Brand is exact.

**The three worst problems**
1. **Double exposures and blink dips.** `swaps.jpg` shows the 2-subframe blend ghosting fast type ("Give it" over "Create" at +1 frame; caption exits leaving doubled fragments). At 5.00 s and 22.00 s the logo stroke is scaled by the tile's spring, so the mark collapses to a dot for about 4 frames: an almost-empty frame, read as a blink.
2. **Scale.** The configuration board sits small and far right, with dead space between caption and UI. The climactic "Chose to do nothing" row is a small card. The end-card lockup, lines and CTA are compact and a long way from the frame edges. The reveal lockup crowds "One coin.". Hook type is not dominant enough to stop a scroll.
3. **Static or messy zones.** 2.72–4.34 s is a 1.6 s near-static hold with illegible 20 px day labels (`metrics.json → holds_over_0_8s`). The push-through 13.75–14.15 is a smear: the room arrives out of focus for about 10 frames. The pan at 15.5 s drags the decision card across the panels, and the memory chip covers the "Approval queue" header.

Also noted: the SFX-sync heuristic (global motion peak within ±6 frames) is too crude because camera moves dominate it. It will be replaced by a per-event state-change check.

**Fixes for round 2**
1. Drop frame blending (render 1 sample per frame). Keep motion blur as velocity-proportional blur on the moving elements themselves (captions, pages, tile flight, camera transitions). The mark stroke stays at full size while the tile grows behind it.
2. Bigger product: the board moves left and gets 1.5× scale, the choice row ≈ 2×, the end card is enlarged (tile 190, lines 132 px, CTA 72 px), the reveal is re-spaced, and the hook type is enlarged.
3. The quiet act gets a slow push-in, 28 px day labels and a drifting caption. Push-through is shorter with less blur and a firmer arrival. The decision card exits before the pan, and the memory chip moves clear of the header.

---

## Round 2 — `review/r2/16x9.mp4`
Render: 60 fps, one sample per frame (frame blending removed), velocity blur on moving elements and camera moves. −14.0 LUFS / −1.3 dBTP.

| Hook | Readability | Motion | Variety/Pacing | Brand accuracy | Composition | Sound sync | Polish |
|---|---|---|---|---|---|---|---|
| 7 | 7 | 8 | 8 | 9 | 7 | 7 | 7 |

Round-1 fixes confirmed on the MP4:
- `swaps.jpg` shows no ghosted type.
- The mark keeps full size through 5.00 s and 22.00 s.
- The product reads about 1.45× larger, and the end card is about 1.3× larger.
- The quiet act's static hold dropped from 1.62 s to 0.93 s, and that remaining stretch is the timeline still drawing.
- The room now arrives crisp.

**The three worst problems**
1. **Memory is invisible.** One of the product's core differentiators appears only as a small chip at the frame edge during drafting. A viewer would not register "it remembers people".
2. **The hook doesn't stop a scroll.** The first second is a calm dark frame with a smallish card, and the launch beat at 1.0 s barely registers.
3. **Sync was unproven, and the reveal has a polish bug.** At 5.0 s the wordmark wipes *over* the blooming tile ("ʌce."). Sync had only been asserted by construction, never measured on pixels.

**Fixes for round 3**
1. Memory moves into the wake beat. A large, in-focus Memory card (`@cosmicdegen · supporter · Early community member.`) pops between "Read new mentions" and "One worth answering", with the room behind thrown out of focus. The beat now reads observe → recall → decide → draft → wait for approval.
2. Hook card is about 1.15× larger and enters from depth with velocity blur. At 1.0 s the launch beat gets a scale punch, a sheen sweep and a key-light flare. The LIVE pill pops on 1.5 s.
3. The wordmark now slides out from *behind* the tile, clipped at the tile's current edge and starting only once the tile has bloomed (reveal and end card). New `render.mjs --sync` renders ±4 frames clipped to every event's target element and measures the visual onset against the pre-event baseline. That exposed real timing bugs:
   - the first typed character was 2.4 frames late;
   - the caption roll and page had 30–40 ms delays;
   - fades were too soft to land on their frame;
   - whoosh peaks were misplaced.

   After fixing them, **45/45 events land within ±2 frames**.

---

## Round 3 — `review/r3/16x9.mp4`
−14.0 LUFS / −1.3 dBTP. Sync: 45/45 events within ±2 frames (`render.mjs --sync`).

| Hook | Readability | Motion | Variety/Pacing | Brand accuracy | Composition | Sound sync | Polish |
|---|---|---|---|---|---|---|---|
| 8 | 8 | 8 | 8 | 9 | 8 | 9 | 7 |

Round-2 fixes confirmed:
- Frame 0 reads "Launching a coin" over a large real coin card.
- The memory card is legible in the wake beat, in focus over the soft room.
- The wordmark no longer wipes over the tile.
- Sync is measured, not asserted.

**The three worst problems**
1. **Memory and decision cards collide.** The memory card's right edge tucks under the checklist in the most important "agent feels real" beat.
2. **The wordmark emerging from behind the tile reads as fragments.** "e.", "ice.", "oice." for about 6 frames at 5.0 s and 22.0 s.
3. **The quiet act is still too subtle.** A thin 3 px line is the only moving thing for about 1.6 s (`holds_over_0_8s`).

**Fixes for round 4**
1. The memory card moved 80 px left and was scaled 1.45×, with a clear gap to the checklist.
2. The wordmark is now six letter spans that rise in reading order through the wordmark mask (the film's own type language). The reveal tile finishes its slide before the letters start.
3. A playhead dot (with a subtle breathing radius) rides the head of the timeline, and the DAY markers are brighter.

---

## Round 4 — `review/r4/16x9.mp4`
−14.0 LUFS / −1.3 dBTP. Holds: quiet act 0.87 s (was 1.58 s).

| Hook | Readability | Motion | Variety/Pacing | Brand accuracy | Composition | Sound sync | Polish |
|---|---|---|---|---|---|---|---|
| 8 | 8 | 8 | 8 | 9 | 8 | 9 | 8 |

Every score was ≥ 8 after four rounds, which met the ship rule. I did not ship, because one visible artefact remained and the mix had not been re-inspected with the SFX in:
1. **Odometer roll stacking.** On each rolling-caption change (8, 9, 10, 11, 12, 13 s), outgoing and incoming words shared the mask for 2–3 frames, producing stacked partial glyphs (`swaps.jpg`, row 4 onward).
2. **The flatline tone in the quiet bar is more present than intended** (spectrogram of `audio/out/mix.wav`).
3. **The final creative test was still outstanding.**

**Fixes for round 5**
1. The outgoing word clears the mask in 100 ms. The incoming word starts 45 ms later, so the two never share the slot.
2. The flatline tone is 3.5 dB lower with a softer low-pass, and the full audio pipeline was re-run (compose → measured beat grid → resolve → SFX → mix).

---

## Round 5 — release candidate `renders/16x9.mp4`

| Hook | Readability | Motion | Variety/Pacing | Brand accuracy | Composition | Sound sync | Polish |
|---|---|---|---|---|---|---|---|
| 8 | 8 | 8.5 | 8 | 9 | 8 | 9 | 8.5 |

- The roll is clean (crop strips around 8.0, 9.0 and 13.0 s show no shared frames).
- The loop seam is void-to-void with no black flash, and the audio goes from −68 dB into the hook downbeat.

### Determinism failure found and fixed
`node scripts/render.mjs --verify --all` **failed** on this candidate: 24 frame mismatches, with errors of at most 1–2/255 per channel. `scripts/tools/detdiag.mjs` isolated two Chromium compositor effects:
1. **Re-used raster of moving gradient layers.** The ambient and key-light layers produced history-dependent pixels after scrubbing; hiding them removed every after-scrub difference.
2. **Raster-scale hysteresis on 3D-transformed layers.** The same t captured twice in a row differed in the coin card's blended banner.

Neither command-line flags (`--disable-gpu`, `--num-raster-threads=1`, `--disable-partial-raster`, `--disable-gpu-compositing`) nor anything else short of a fresh layer tree removed them.

**Fix.** `seek(t)` now detaches and re-attaches `#stage` after writing the frame state. Chromium rebuilds the layer tree and rasters every layer at its ideal scale for that state alone. The result is bit-identical frames regardless of seek history: **VERIFY: PASS, 58/58 probe frames, 0 mismatches.**

### Sync re-check after the change
41/45 events passed after the change. The four misses came from round 5's own roll easing, not from the reattach: an ease-in exit didn't move for 2 frames. Switching it to ease-out fixed that. The whoosh windows were also too short for long motions; each whoosh's swell peak is now set from its **measured** fastest-motion frame (+4 … +13 frames). Result: **45/45 within ±2 frames, whooshes at 0.**

---

## Final — `renders/16x9.mp4` (`review/final/`)

| Hook | Readability | Motion | Variety/Pacing | Brand accuracy | Composition | Sound sync | Polish |
|---|---|---|---|---|---|---|---|
| **8** | **8** | **8.5** | **8** | **9** | **8** | **9** | **8.5** |

**Export:**
- 24.000 s, 1440 frames, 1920×1080, 60 fps.
- H.264 High, CRF 16, yuv420p, BT.709 primaries/transfer/matrix, TV range.
- AAC 48 kHz stereo, 320k setting (310 kbps measured), faststart (moov before mdat).
- **−14.0 LUFS integrated, −1.2 dBTP** (measured on the encoded AAC), LRA 7.4 LU.

**Verification:**
- `render.mjs --verify --all`: PASS.
- `render.mjs --sync`: 45/45.
- Lint: PASS.

### Final creative test
- *Would I stop scrolling?* Frame 0 is a full, readable statement over the real product; by 2 s the music dies on screen. Yes.
- *Would I understand Voice without reading a paragraph?* "One coin. One X Manager.", then five "Give it …" beats over the real setup, then the manager working. Yes.
- *Does the manager feel like a living product?* It wakes, recalls a supporter from memory, decides, drafts in character, explains why, waits for approval, learns from "More like this", and chooses silence. Yes.
- *Differentiated?* The film's thesis, that silence is a choice, is something no timer-bot can claim. Yes.
- *Does the product look real?* It is the product's own CSS, DOM and copy. Yes.
- *Does it escalate?* Sound −20 → −10.9 LUFS into the activation hit; picture goes from a single card to the full wizard, the full control room and the full feed. Yes.
- *Does the ending send you to tryvoice.fun?* The 72 px lime CTA, legible at 360 px wide. Yes.
