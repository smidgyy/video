# Reference study — grammar, not content

All four films were fetched from their public X posts (video URLs resolved through the public fxtwitter API) and analysed frame by frame: scene-cut detection (`ffmpeg select=gt(scene,…)`) and timestamped contact sheets at 1.5–3 fps. The files stay in `capture/refs/` locally for study only and are **not** committed or reused.

| Ref | Post | Length | Measured cuts |
|---|---|---|---|
| **ElevenLabs — Reception** (primary) | x.com/ElevenLabs/status/2100262886916358361 | 32.9 s, 1080p30 | ~1.2–1.7 s A/B alternation in the first 13 s, then long continuous morph sequences |
| Sheng Kun Ye — Jev × Monid | x.com/shengkunye/status/2102112693041938825 | 32.3 s | effectively **one cut** (29.6 s): a single continuous canvas |
| Steve Lauda — Zingage showreel | x.com/stevelauda_/status/2101855047412031533 | 84.4 s, 4K | 2 hard cuts; everything else is camera moves through real UI |
| 0xDesigner — MCP | x.com/0xDesigner/status/2105028261558493219 | 12.1 s | no hard cuts |

## ElevenLabs — why it works (and what we took)
1. **Frame 0 is a word.** The film opens mid-sentence ("Some…"), so the first frame already reads. → Our frame 0 shows "Launching a coin" settling, with the product card already moving.
2. **A/B rhythm.** A kinetic-type beat (~1.3 s) alternates with a hero-object beat (~1.7 s), three times, each a variation of the last (appointment → job → meeting). Repetition makes it learnable; variation keeps it moving. → Our configuration act is an anaphora: *Give it the mic / a brain / a character / boundaries / a budget*: one persistent line, one rolling word, one UI action per beat.
3. **The turn.** "But nobody's around to pick up." is followed by a colour rupture and a two-word pivot ("Until now."). → Our turn is sonic and graphic: the music *dies*, the timeline goes flat, then the line gets a heartbeat and becomes the logo.
4. **Product as an entity before it is a UI.** An orb on black, then chat UI over a soft field. → Our entity is the pulse line, and the UI comes after.
5. **Restraint.** Small type, huge negative space, one accent colour, no clutter. → One accent (Voice volt), grey second lines, void background.
6. **A closing morph chain:** frame → card → three cards → bar → line → logo. → Ours runs feed rows → lines → one line → pulse → mark → lockup, bookending the opening flatline.

What we did **not** take: the pixel-mosaic transition, the colour palette, the orb, the receptionist scenario, the triplet wording, the logo treatment.

## Sheng Kun Ye — continuity
One canvas: the headline reflows into a grid, one cell pushes in to become the next scene, a selection bracket filters 2,000 rows to one, and an odometer lands on "12 worth calling." → Our wizard board persists across seven steps (stepper, eyebrow and title roll; only the panel content morphs), and our decision checklist filters "Read new mentions → One worth answering" (Voice's own home-page copy).

## Steve Lauda — real UI, shot like an object
Real web UI in steep perspective with macro push-ins on buttons, layered cards separated in depth, and pull-backs to reveal the whole page. → Every Voice UI shot is the real stylesheet rendered in 3D perspective (≤ 12° while reading), with focus pushes (Luna card), a depth-of-field moment (decision card in front of the blurred control room) and a pull-back over the decisions feed.

## 0xDesigner — micro grammar
Per-word masked rise with a touch of blur, one phrase in the accent colour, status pills that morph state, a real cursor with a click. → Our captions use per-word masks with spring settle, second line in grey or the volt gradient, PAUSED → RUNNING pill morph, cursor clicks with a ring.

## Pacing we measured vs. ours
- ElevenLabs: something new every 0.33–0.66 s in the opening, a hard visual event about every 1.5 s. Ours: an event every 0.25–1.0 s in the configuration act, never more than 2 s without a state change (verified in `review/*/metrics.json → holds_over_0_8s`).
- All four references end on a logo hold of 2–4 s. Ours holds ≤ 2.0 s (brief requirement) and keeps a slow push-in so the end card never freezes.
