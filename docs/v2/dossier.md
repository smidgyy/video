# Voice film v2 — design dossier (input for art direction)

Repository root: `/home/user/video`. Read this whole file before proposing anything.


## 0. CLIENT ADDITION (mid-brief, binding): MATCH THE WEBSITE'S THEME
The client added: **"Of course match the theme of the website too."** The film's world must feel like it belongs to tryvoice.fun:
- deep graphite / near-black surfaces (`--void #040405`, `--ink-1…4`);
- frosted glass panels;
- **volt lime `#d4ff3f` as the single accent of life**, with icy-blue `#a8e9ff` secondary;
- the site's soft ambient lime/ice room light and fine grain;
- Bricolage Grotesque display type with its two-tone headlines (white line, then grey or lime line);
- Geist Mono eyebrows;
- the pulse-mark logo and the waveform bars.

This is **not** a licence to return to flat black + floating cards. It is the palette and material language that the new tactile, cinematic, art-directed world must be built *from*: graphite with texture, light falloff, depth, physical surfaces and environment, rather than empty black. A light/paper or colour-field passage is only acceptable if it serves the story (for example, the colourless "before Voice" world) and the film resolves firmly into the website's theme once Voice appears.

## 1. The client's verdict on v1
v1 (`renders/16x9.mp4`, contact sheet `review/final/contact.jpg`) is polished but **looks AI-generated / AI-directed**. It relies too much on:
black backgrounds · floating UI cards · generic gradients/glows · straightforward screenshot reveals · predictable kinetic typography · a repetitive UI → text → UI structure · clean SaaS motion language.

## 2. The new target
An **art-directed, cinematic, editorial product film** that feels human-made, obsessive, tactile, surprising and visually memorable.
The standard: **"this looks so good that someone has to ask who made it."**

- **Primary creative reference:** the ElevenLabs "Reception" film (`capture/refs/eleven_upload/ref.mp4`). Study it for pacing, visual density, composition, typography integration, unexpected ideas, transitions, the music/picture relationship, restraint, polish, tiny details, atmosphere and emotional progression.
  - **Never copy** its scenes, assets, characters, branding, wording or exact shots.
  - Full-res frames are in `capture/refs/eleven_upload/frames/*.png`, a 4 fps contact sheet is `capture/refs/eleven_upload/contact_4fps.jpg`, and earlier notes are in `docs/references.md`.
- **Real Voice UI must still appear,** treated as a *cinematic visual element* rather than the whole film.
- **Every shot needs intentional micro-detail:** depth, texture, lighting, environment, secondary motion, subtle imperfection, layered typography, thoughtful transitions, physicality, visual metaphor, meaningful camera movement and composed negative space.
- **Forbidden:** generic "AI visuals", generic crypto imagery, futuristic holograms, random glowing particles, stock-looking 3D objects, everything floating.
- **Build an actual visual world around Voice.**
- **The film must become progressively more alive** once Voice appears.
- **The audience must feel** that Voice is not another dashboard or bot. It is **a living social operator with a distinct identity**.

### Story (required beats, in order)
"Launching a coin takes seconds." → the coin exists → "Then it goes quiet." → silence / absence / tension → Voice appears → "One coin. One X Manager." → give it a brain → a character → boundaries → a budget → launch → **the manager wakes up (the visual centerpiece of the whole film)** → observes → thinks → drafts → interacts → learns → chooses when NOT to act → "Now quiet is a choice." → "One coin. A voice of its own." → tryvoice.fun.

Voice's own X account is **@tryvoice** (use it on the end card). The demo coin in the product's own example control room is **Orbit $ORBIT, @orbitonsolana**.

### Music (the client's words)
"A genuinely memorable pop-culture-adjacent soundtrack with a calm, followable rhythm. Clear arc: calm / intriguing opening → subtle rhythmic development → increasing momentum → brief tension / silence → satisfying emotional payoff → elegant ending. Like a great modern commercial / film / music-driven product launch, NOT generic corporate background music."

### Sound design
Quality over quantity; every sound has a reason. Subtle UI sounds, physical sounds, movement textures, notification details, low-end accents, transitions, silence. Music and sound design should feel like one piece.

### Format
16:9 only, 1920×1080, 60 fps. Length is the director's call: v1 was 24 s; the reference is 33 s. Pick what the story needs, likely 28–32 s, and don't pad.

## 3. Product truth (do not invent capabilities)
- A Solana coin launchpad where **one coin gets one persistent X Manager**. The manager has an identity, personality, lore / creative bible, memory, learned preferences, creator teaching, community context, a brain (model), permissions, an operating budget, and the coin's official X account.
- **Loop:** observe → understand context → decide → act or wait → observe the outcome → learn. It is not "timer → AI → tweet".
- **Approval Mode** (default; the creator approves, edits or rejects, and can mark "More like this" / "Less like this") vs **Autonomous Mode** (bounded by permissions, budget, quality checks and the emergency stop).
- **Brains:** the live site lists GPT-6 Luna (the only one marked **Verified · ready**), GPT-6.1 Sol and GPT-6 Astra. Change the brain, keep the soul.
- **Funding:** the creator deposits USDC into the manager's operating balance, which is separate from creator fees. Daily limit and per-action maximum are set by the creator.
- **Launch hour:** up to 15 actions; "A ceiling, never a quota."
- **Real product copy worth using:** "It thinks before it speaks." · "Act — or wait" · "Silence is a valid decision." · "Doing nothing is a valid decision." · "Say something worth hearing." · "Starts paused" · "Approval first" · "Your wallet signs every transaction" · "Change the brain. Keep the soul." · "Your manager is active. Its launch hour has started." · "Saved as 'more like this'. It now guides this manager's voice." · "Chose to do nothing — Trend was unrelated to Orbit. Chose to stay silent." · "Read new mentions → One worth answering → Reply drafted in your voice → Waiting for your approval".
- **Don't show:** image/video generation as live, research as configured, creator-fee replenishment, on-chain confirmation as real, follower counts / metrics, real people's accounts.

## 4. Real assets available (the only visual raw material)
There is **no photography, stock or 3D** available, and we must not use any. Everything is built from:
- **The real Voice UI:** the site's production stylesheet (`assets/vendor/voice-site.css`) and its real DOM components, rendered live with real state changes. Fragments are in `capture/fragments/*.html` with matching `.png` previews. Full-page captures are in `capture/site/*.jpg` and `capture/site/tabs/*.jpg`. Components available:
  - coin preview card, launch stepper (16 real steps), brain cards, voice-style presets + personality sliders;
  - permission switches, Approval/Autonomous mode choices, treasury funding + stats;
  - control-room command deck (status pill PAUSED → RUNNING · APPROVAL MODE), tab bar;
  - decisions feed rows, approval-queue reply draft (with "Replying to …", "Why this action?", Approve & publish, More/Less like this), memory known-account row;
  - the home page's "Manager decision" checklist card, the rail waveform signature, the example banner.
- **The brand:**
  - Palette (`docs/style_guide.md`): void `#040405`, volt `#d4ff3f`, ice `#a8e9ff`, text `#f5f5ef`, greys `#c2c2ba` / `#8a8a84` / `#5d5d59`.
  - Fonts: Bricolage Grotesque (variable; opsz 12–96 and wght 200–800 are vendored; a width axis wdth 75–100 exists on Google Fonts if we re-download), Geist, Geist Mono.
  - The logo mark: a lime rounded tile with a pulse path. The rail "waveform" bars. The wordmark "voice."
- **Procedural, deterministic generation** in the browser: CSS (gradients, masks, blend modes, filters, 3D transforms), SVG (paths, filters such as feTurbulence / displacement), Canvas 2D drawn from seeded RNG (paper fibre, halftone, print misregistration, grain, dot-matrix, dust, ink). Textures can be precomputed once at load.
- **System fonts** are also installed (Inter, DejaVu, Liberation, FreeSerif, IPAGothic). Google Fonts can be fetched if a typeface is truly justified, but brand fonts come first.

## 5. Engine constraints (hard)
- Every frame is a pure function of t through `window.seek(t)`, rendered in headless Chromium and captured as PNG. No timers, rAF, Date, Math.random (only seeded RNG), CSS transitions/animations, `will-change` or `translate3d`.
- The render pipeline captures at about 7 frames/s on 4 cores, and heavy per-frame filters slow it down. A 30 s, 60 fps film is 1,800 frames, roughly 4–6 minutes per render. Fine, but avoid huge per-frame blur stacks.
- WebGL is possible but untested for determinism here, so prefer CSS/SVG/Canvas 2D.
- The existing code is reusable: `engine/motion.js` (closed-form springs, easing, seeded noise), `scripts/render.mjs` (render / verify / sync), and the audio pipeline (`audio/compose.py` procedural synthesis in numpy/scipy, `analyze_beats.py` measured beat grid, `sfx.py`, `mix.py`). The music is synthesised in Python (no samples), so any instrument must be synthesisable: drums, plucks, FM keys/Rhodes, mallets, bass, pads, formant vocal chops, whistles, risers, foley-like noise sounds.

## 6. What we learned from the reference at full resolution (starting notes; look yourself)
- **The human world is light:** warm off-white paper with a faint graph grid. Type is regular-weight grotesk at varied sizes, scattered across grid cells and assembled word by word, interleaved with tiled studio "objects" and small icons in a dense collage that keeps negative space.
- **Hero beats:** a real object over a dot-matrix/LED rendering of a defocused landscape that ripples, with a tiny glass UI pill ("INCOMING CALL") attached as a label.
- **The rupture:** a hot red field broken into halftone-dotted pixel blocks.
- **The product:** an entity (orb + hairline rings) on black, then glass chat bubbles on a lush defocused colour field.
- **End:** small type on black, plus a hairline frame that morphs card → cards → bar → line → logo.
- **Music:** calm, steady groove at about 104 BPM with narration and a phone-ring motif. Energy stays fairly even, the rhythm never stops, and accents land on picture changes.
