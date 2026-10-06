# Voice — flagship product film · brief

## One sentence
Voice gives every coin its own persistent X Manager — a social intelligence with an identity, a brain, a character, boundaries and a budget — so a launch becomes a living presence instead of a dead account.

## What the viewer must leave with
1. **The problem:** launching a coin takes seconds; then the account goes quiet.
2. **The category:** *one coin, one X Manager.* Not a chatbot, not a trading bot, not a timer that tweets.
3. **How:** create the coin → give it the mic (official X) → a brain → a character → boundaries → a budget → launch them together.
4. **What it does:** observes, remembers, decides, writes, asks for approval, learns from feedback — and chooses silence when nothing is worth saying.
5. **The result:** one coin, a voice of its own. → tryvoice.fun

## Story spine (24.0 s, 120 BPM, 12 bars)
| Act | Bars | Beat |
|---|---|---|
| Silence | 1–2 | Launch is loud → then it goes quiet (the music literally dies; a flat timeline ticks by) |
| Voice | 3 | The flatline gets a pulse → the line becomes the Voice mark → **One coin. One X Manager.** |
| Creation | 4 | Real launch flow: the coin preview fills in live — Orbit, $ORBIT, its story |
| Configuration | 5–7 | One evolving wizard: *Give it* the mic · a brain · a character · boundaries · a budget |
| Launch | 7 | Review & sign in wallet → *Launch them together.* |
| Activity | 8–9 | Control room powers on — *It thinks before it speaks.* Mention → memory → draft → approve → published |
| Learning | 10 | More like this → *It learns your voice.* |
| Identity | 11 | Dead stop in the music: **Chose To Do Nothing** — *Now quiet is a choice.* (callback to Act 1) |
| End | 12 | Feed collapses to a line → pulse → logo. **One coin. A voice of its own.** tryvoice.fun |

## Tone
Confident, minimal, slightly mysterious, internet-native. Copy is short and declarative; the product's own phrasing is preferred where it exists ("It thinks before it speaks", "Launch them together", "Give it a voice", "One coin. A voice of its own.").

## Hard rules honoured
- Real UI only: every interface element is rebuilt from tryvoice.fun's own production stylesheet and captured DOM (see `docs/product_capture.md`). No invented screens, no invented capabilities.
- Demo content is labelled the way the product labels it (`Example` tags; Orbit is Voice's own example coin and control room).
- Only GPT-6 Luna is shown as selected because it is the only brain the live site marks **Verified · Ready**. No image/video generation, research or autonomous posting is shown as live. Approval Mode is the selected mode (the product default: "Starts paused", "Approval first").
- Creator-fee replenishment is **not** shown: no live UI exists for it yet and the product context says it depends on settlement infrastructure.
- No crypto-shill language. No "trained", no fake progress bars. Learning is shown with the product's real feedback copy.
- Wizard order follows the real product (Connect Official X is step 4 of 16, before brain and budget) — so every `STEP n OF 16` label on screen is true.

## Deliverables
`renders/16x9.mp4` only (format override from the client: 16:9 flagship, no vertical or square variants) — H.264 High, 60 fps, yuv420p, CRF 16, BT.709, AAC 320k 48 kHz, faststart, −14 LUFS integrated, ≤ −1 dBTP.

## Voiceover decision
No VO. The environment has no TTS engine installed; open-source local TTS (e.g. Piper) is below the quality bar for a flagship film, and no paid service was authorised. The film is written to work silently (autoplay on X is muted) with kinetic captions carrying the narrative and the score carrying the emotion.

## Production note
The motion-reel-kit referenced in the request was not present in this repository (it was empty at session start). The pipeline here re-implements the kit's stated contract: `window.seek(t)` deterministic frames, seeded randomness only, no timers/rAF/Date/CSS transitions, `node scripts/render.mjs --verify --all`, measured beat grid, critique loop with contact sheets / strips / phone / loop tests, and the requested export spec. See `docs/pipeline.md`.
