# Voice v2 — FINAL TREATMENT: "NIGHT WINDOWS"

**16:9 · 1920×1080 · 60 fps · 32.40 s = 1,944 frames · 100 BPM · C major · 13 bars + a 2-beat ring-out · no voice-over**

This is the build document. It supersedes the four competing treatments (presence, signal, wildcard, print). Nothing from them is implied unless it is written here. Read `docs/v2/dossier.md` first; this document assumes it.

---

## 0. The director's call

**Base concept:** *presence* ("Night Windows"). It has the strongest centerpiece and memorability, and it is the only one that fully satisfies the binding client addition: the "before Voice" world is colourless, and from Voice onward the film lives in the website's own materials. Graphite concrete and plaster stand in for `--ink`, frosted glass for `.panel`, volt `#d4ff3f` is the occupant's light, and ice `#a8e9ff` is moonlight and the community.

**Grafted in:**

| From | Idea |
|---|---|
| wildcard | The coin's music box dies one note short; Voice's first sound is that missing note. The tonic chord is withheld until the wake. The manager is *tempted* by the trend before it chooses not to act. Fingerprints persist where presses happened. Grain runs on a 24 fps cadence over 60 fps motion. Prototype the three hardest frames before anything else. |
| signal | "Quiet" stays the same word, in the same window, at the same pixels, in "Then it goes quiet." and "Now quiet is a choice." A 2-frame ember before ignition, then a flicker curve with a dip. The façade is revealed by inverse-square falloff. An identity line is legible only under the manager's light. The picture is driven by audio stems (`drive.json`, hash-checked). Act I is heard through glass; the room opens to full fidelity at the wake. Camera moves are silent; only objects make sound. The review protocol. |
| print | The imperfection ladder, with the first perfect register at the wake. The RUNNING dot breathes from the wake to the last frame. The one inhale before the payoff. The single notification sound is built from the hook's own interval. Hook design is "one rhythm, two directions". The 2D-affine camera rule: no 3D contexts where blend modes matter. |

**Fixed (truth and logic):**
- The chosen brain is **GPT-6 Luna**, the only "Verified · ready" brain. Sol and Astra are shown with their real "Needs verification" rows, and nothing is hidden by occlusion.
- The state changes to RUNNING **at the wake**, not at launch.
- The habits act uses only real example data: the real approval-queue post and the real decisions rows, with their Example tags. No invented mention text.
- **@cosmicdegen does not appear anywhere.** It may be a real person, and the dossier forbids real people's accounts. The community is anonymous: windows across the street.

**Re-engineered for buildability (the judges' scope worry):**
- No CSS-3D rooms. Every set is a set of **flat orthographic elevations with multiplane parallax** (Hopper, Ware and Wes Anderson frontality), built in Canvas2D plus DOM, with one 2D affine camera.
- The world is **one Block of concrete units on a street**. Orbit is a **ground-floor unit, G·14**, with two window bays facing the street. That puts the street physically right outside the window (stripes of light on the pavement are plausible). It also makes the status sign a natural object: a shop-window sign hung behind the glass.
- Sets:
  1. FAÇADE: one generator, two seeds (our block, and the low block opposite).
  2. UNIT G·14, elevation A: the door wall.
  3. UNIT G·14, elevation B: the window wall.
  4. DESK: a top-down plate.
  5. STREET: a top-down plan.

**Cut:**
- From signal: the radio, the meters and the skeuomorphic desk hardware.
- From wildcard: the pin field. It is too close to the reference's dot-matrix ripple and to the generic "AI voice" dot wave.
- From print: the paper world, which is off-theme.
- From presence: the CSS-3D box room, the glossy wet street, the low-angle road paint (illegible), the puddle reflection that quantises into a waveform, and the door-hanger flip at launch.
- **The animated rail waveform bars are deliberately not used.** Animated bars are the stock "voice AI visualiser". The line the site prints under them, "One coin. A voice of its own.", is the film's payoff line instead, set in the world.

---

## 1. Core idea

**Every coin is a window in one long concrete block.**

1. **Launch.** Launching a coin is taping a sign in a window, and it takes seconds. Coins appear in windows across the whole Block on 16th notes.
2. **Quiet.** Then the light changes, the units go dark, and mentions slide under a door nobody opens. The coin's music box runs down and never plays its last note.
3. **Voice.** Voice arrives as a silhouette of the logo behind frosted glass, and as a whistle that sings exactly the note the music box couldn't reach.
4. **Setup.** The creator furnishes the unit by hand: a brain, a character, boundaries and a budget, each labelled with a Dymo strip. Then they sign, hang the PAUSED sign, and the room closes its eyes.
5. **The wake (the centerpiece).** The creator says go (a light switch, heard from outside). A pulse-shaped filament ignites behind closed blinds that carry the manager's real voice instructions, printed one sentence per slat. The slats open in a wave. Stripes of volt light rake across the pavement toward us. The sign turns RUNNING and settles plumb. The neighbours' windows answer. Then the blinds tilt down: **the manager looks at us.**
6. **Habits.** We cut to its side of the glass and watch habits, not features. It watches the windows across the street, recalls its own lore, drafts, publishes, gets a wave back from across the street, and pins up what it learned.
7. **Restraint.** A garish rooftop screen flares with a trend. The blinds start to open toward it, the lamp brightens, a whistle begins. Then it chooses: the slats tilt shut. It stays lit. Quiet, but home.
8. **Payoff.** The same frame as "Then it goes quiet." now reads "Now quiet is a choice." From above, its light falls across the street onto the words *A voice of its own.* The lit window becomes the logo.

**Governing metaphor:** a dark window becomes a lit one. **The blinds are the manager's eyelids.** Shut and dark means paused. Open means engaged. Nearly shut but lit from inside means quiet by choice.

**References (authored, not "AI aesthetics"):**
- Edward Hopper, *Night Windows* (1928) and *Early Sunday Morning* (1930): an inhabited interior seen from outside, and frontal façades.
- Saul Leiter: soft foregrounds over sharp subjects, and lettering on glass.
- Chris Ware: buildings as cross-sections that tell stories.
- The classic frosted-glass office door with a silhouette behind it.

### Rules of the world (the bible)
1. **Nobody is ever seen.** Presence is inferred from light, handled objects and sound.
2. **Every light has a source, and every surface receives it.** There are no decorative glows.
3. **Nothing floats.** Things lean, hang, lie, are taped, pinned, mounted or propped, and every one has a contact shadow.
4. **Type lives on surfaces** (glass, tape, concrete, slats, asphalt). It appears only when it is lit, peeled on, slapped on, typed by the real UI, or painted. It never appears through a mask-rise, a blur-in or a tracking animation.
5. **Volt is life.** Before 7.00 s there are zero volt pixels. After that, volt is Voice's light, the manager's light, the creator's Dymo nouns, and the real UI's own accents. It is never decoration.
6. **Three depths in almost every frame** (Leiter layering): a soft foreground, a sharp subject, a soft world.
7. **The creator is imperfect; the manager is precise.** Everything hand-placed before the wake is crooked. The manager's own things settle square.

### Aliveness ladder (measured on every render)

| Act | Time | Light sources visible | Things moving with a cause | Music layers | Volt pixels |
|---|---|---|---|---|---|
| I · day → dusk | 0.00–5.40 | sky, sun shadow, cold tubes going out | cards, tape, reflections, shadow | music box (through glass) | 0% |
| I · absence | 5.40–7.20 | moon only | 1 paper slip | room tone, then digital zero | 0%, then 1 px at 7.00 |
| II · moving in | 7.20–15.60 | + Voice's hall light | door, panes, knob, switches, drums, sign | whistle, snaps, bass, pluck, Rhodes, kick | 1–6% |
| III · wake | 15.60–19.20 | + filament, lamp, 3 neighbours, light on the pavement | 16 slats, sign, drip, stripes, gaze | full groove, full fidelity | 8–15% |
| IV · habits | 19.20–25.20 | + 8–12 windows opposite, the trend screen | typing, plaques, waves back, slats | full groove, then the trend | 10–18% |
| V · choice → payoff | 25.20–32.40 | window, neighbours, street light, logo | light on the road, drip ring, logo breath | silence, then the full chorus with voices | 6–12% |

---

## 2. Beat grid and master shot table

**Grid:**
- 100 BPM. One beat = 0.600 s = 36 frames. 8th = 0.300 s = 18 frames. 16th = 0.150 s = 9 frames. 32nd = 0.075 s (4.5 frames, so a 32nd is used for sound only, never as a cut).
- Bar *n* starts at 2.4·(n−1). Notation `b.n` means bar.beat; `&` is the 8th after a beat and `a` is the last 16th of a beat.
- **Every cut and every hero event falls on a 16th** (a multiple of 0.15 s, so a multiple of 9 frames).

| # | Time (s) | Bar.beat | Frames | Story beat | Set / framing | Out |
|---|---|---|---|---|---|---|
| S1 | 0.00–1.80 | 1.1–1.4 | 0–108 | "Launching a coin takes seconds." | FAÇADE, day, wide elevation | dolly; lamp-post wipe |
| S2 | 1.80–3.60 | 1.4–2.3 | 108–216 | the coin exists | FAÇADE, Orbit's window MCU; time-lapse to blue hour | pull-back into S3 |
| S3 | 3.60–5.40 | 2.3–3.2 | 216–324 | "Then it goes quiet." | FAÇADE, **the rhyme frame** (locked) | hidden cut in the dark |
| S4 | 5.40–7.20 | 3.2–4.1 | 324–432 | silence / absence / tension | UNIT A (door wall), moonlight | continuous |
| S5 | 7.20–8.40 | 4.1–4.3 | 432–504 | Voice appears | UNIT A, door glass | continuous push |
| S6 | 8.40–9.60 | 4.3–5.1 | 504–576 | "One coin. One X Manager." | UNIT A, door glass | whip pan right |
| S7 | 9.60–10.80 | 5.1–5.3 | 576–648 | give it a brain | UNIT A, leaning panes | whip-tilt down |
| S8 | 10.80–12.00 | 5.3–6.1 | 648–720 | give it a character | DESK, top-down | whip-tilt up |
| S9 | 12.00–13.20 | 6.1–6.3 | 720–792 | give it boundaries | UNIT A, wall plate | tilt up |
| S10 | 13.20–14.25 | 6.3–6.4a | 792–855 | give it a budget | UNIT A, the meter | whip-tilt down |
| S11 | 14.25–15.60 | 6.4a–7.3 | 855–936 | launch | DESK (sign), then UNIT B (window), then exterior | continuous into S12 |
| **S12** | **15.60–19.20** | **7.3–9.1** | **936–1152** | **the manager wakes up** | **exterior, street level, Orbit's two bays** | slat wipe, reverse angle |
| S13 | 19.20–24.00 | 9.1–11.1 | 1152–1440 | observes · thinks · drafts · interacts · learns | UNIT B (window wall), one continuous take | same take |
| S14 | 24.00–25.20 | 11.1–11.3 | 1440–1512 | chooses when NOT to act | UNIT B, same take | match cut on the slats |
| S15 | 25.20–26.40 | 11.3–12.1 | 1512–1584 | "Now quiet is a choice." | FAÇADE, the S3 frame exactly, at night | hard cut on the downbeat |
| S16 | 26.40–28.80 | 12.1–13.1 | 1584–1728 | "One coin. A voice of its own." | STREET, top-down plan | match cut: light bands to slats |
| S17 | 28.80–32.40 | 13.1–14.3 | 1728–1944 | tryvoice.fun · @tryvoice | Orbit's window, then the logo, then the lockup | end |

Sub-beats inside S13 are: observes 19.20–20.10 · thinks 20.10–21.00 · drafts 21.00–21.90 · interacts 21.90–22.80 · learns 22.80–24.00.

---

## 3. The world (sets, built once at load)

All sets are orthographic. Depth comes from multiplane parallax (each plane has a depth *z*; screen offset = (world − camera)·zoom/*z*), cast and contact shadows, pre-blurred focus planes and light falloff. There is never a 3D rendering context.

**FAÇADE: "the Block"** (generator `world/facade.js`, seed 1401)
- A 1950s board-formed concrete slab: ground floor plus 4 storeys, bay pitch 760 world px.
- Each bay has a 600-px window and a 160-px pier. Ground-floor windows are 600×430 on a 140-px plinth. Upper ribbon windows are 600×300 with 220-px spandrels.
- **Orbit = unit G·14:** ground floor, bays c2 and c3, two windows separated by a normal pier. Stencil "G·14" sits on the plinth under bay c2.
- Each window is a sub-object with: glass (dark `#22262a`, sky and opposite-block reflections), blinds (16 slats, seeded height and tilt), interior light value, and optional lettering or taped card.
- **The opposite block** is the same generator with seed 1411: a lower, two-storey row with a rooftop LED billboard frame. It appears only as a far plate through Orbit's window.

**UNIT G·14, elevation A** (the back wall, seen from the window side)
- Left to right: the **door** (frosted upper glass) → the **light switch** → the **permissions wall plate**, with the **meter box** mounted above it → **three leaning glass panes**.
- The floor is a foreshortened band (the bottom 12–18% of frame), drawn per row so it parallaxes correctly under lateral trucks.
- The street window is behind the camera. Its moonlight falls on this wall.

**UNIT G·14, elevation B** (the window wall, seen from the door side)
- Left third: a plaster pier with the **manager's lamp** (the logo tile as a frosted lightbox, 220 px, the pulse path as its filament, hanging on a cord) and the **memory plaques**.
- Centre-right: the two-bay **window**, with its blinds, the hanging **sign** behind the glass, and the opposite block beyond.
- The inside sill carries the **stencilled loop** (real home-page copy).
- Bottom: the **desk**, with two propped frosted panes on it.

**DESK** (top-down plate)
- A graphite slab with scratches and a broken mug-ring stain.
- A bevelled glass desk pad with one chipped corner. Dust sits on top of the glass and parallaxes against what lies under it (12 px of parallax per 100 px of camera move).

**STREET** (top-down plan, god's-eye)
- The Block's roof edge and façade line across the top, the pavement (0.6 m slabs, granite kerb), and the asphalt with road paint, one drain grate and one shallow puddle under Orbit's sill.

---

## 4. Palette, light and texture

### 4.1 Colour tokens (site tokens from `docs/style_guide.md`; world tokens added)

| Token | Hex | Use |
|---|---|---|
| void | `#040405` | Only unlit gaps: the door crack, unlit window interiors. **Never a full-frame background.** |
| ink-1…4 | `#0a0a0c` `#101013` `#17171b` `#1f1f24` | Night concrete shadow → base; desk slab; door; roof |
| text / -2 / -3 / -4 | `#f5f5ef` `#c2c2ba` `#8a8a84` `#5d5d59` | Lit lettering; UI body; grey second tone; stencils and unlit labels |
| **volt** | `#d4ff3f` | Voice's light, the manager's light, Dymo noun tape, "is a choice.", the logo |
| volt core | `#f3ffc4` | Filament core and hottest highlights (the site's `.hero-accent` start) |
| volt-2 / -deep / -ink | `#b9f22b` `#6f9a10` `#0b0f02` | Lit edges; falloff; letters on volt |
| volt on graphite (falloff) | `#a6c832` → `#5d7120` → `#232a0d` → ink | Volt light on plaster or concrete at 40% / 15% / 5%. Lit, never neon. |
| ice | `#a8e9ff` | Moonlight (applied as `#8fa3ad` at 8–14% screen); the community's windows (`#5b7e8a`…`#a8e9ff`); the real Approval-mode pill |
| day concrete | `#cfcdc5` lit · `#b8b6ae` mid · `#9c9a93` seams · `#5e5d58` tie holes | Act I only |
| overcast sky | `#e9eae6` → `#d7dbdb` | Act I only (in glass reflections) |
| dusk ramp (ambient multiply) | `#ffffff` → `#9aa3ad` → `#2b3036` → `#0e1013` | 3.00–5.40 |
| cold tube light | `#e6ecef` | Other units' interiors before Voice: colourless |
| night concrete | base `#17181b`, moonlit `#23282c` | Exterior night |
| asphalt | `#0c0d0f`, damp `#08090a`, aggregate highlights `#2a2e31` | Pavement band and street plan |
| paper | `#e9e6dd`, ink `#2a2a28` | Mention slips (Act I only) |
| trend white | `#eef3ff` | The antagonist's light only |
| danger | `#ff6d5e` | Only if a real component renders it. In practice it is never in frame. |

**The colourless rule (Act I):** the real coin-preview cards are de-volted with a **token override, not a filter**:
```css
.colourless { --volt:#bdbdb6; --volt-2:#a9a9a2; --volt-deep:#7d7d77; --ice:#9aa0a3; --coin:#bdbdb6; }
```
The real UI therefore remains the real UI.

### 4.2 Lighting script (every photon has a cause)

| Shots | Key | Fill | Practicals | Meaning |
|---|---|---|---|---|
| S1–S2 | overcast sky, upper left, soft | ground bounce | none | Launch day: flat and public |
| S2 tail–S3 | the opposite tower's sun shadow sweeping across | blue-hour sky | cold tubes inside units | Time passes; the tenants leave |
| S4 | moon through the open slats behind camera: a striped parallelogram | none | none | Absence |
| S5–S10 | Voice's hall light: through the frosted door, then as a wedge from the open door | moon | the UI's own volt accents | Voice is at the door; the creator sets up |
| S11 | moon; the slats close | none | the sign (unlit) | The room closes its eyes |
| S12 | **the filament and lamp, from inside** | moon on concrete | 3 neighbour windows; spill on the pavement | The manager wakes |
| S13 | lamp, upper left (= the site's `body:before` lime radial, top-left) | window ice, upper right (= the site's ice radial, top-right) | desk-edge volt bounce (= the site's bottom radial); windows opposite | Lived-in; the website's own lighting as a room |
| S14 | trend white floods in, then is sliced to 15% by the slats | the lamp regains the room | none | The choice |
| S15–S16 | Orbit's window | moon | neighbours; light on the road | Quiet as a choice; a voice in public |
| S17 | the logo tile is the only source | none | none | The window was the logo |

**Light falloff** is always inverse-square-ish:
```
L(r) = I · 1 / (1 + (r / r0)²)
```
- The lamp in the room uses r0 = 420 px.
- Spill through each slat gap is a soft quad, attenuated the same way.

**Brightness changes** follow incandescent curves: about 120 ms rise and about 200 ms decay. They are never linear fades.

**One shared function, `breath(t)`, drives every manager light from 16.80 to the last frame:** the RUNNING dot, the lamp, the window, the light on the road, and the logo tile.
```
breath(t) = 1 + 0.015 · sin(2π (t − 16.8) / 2.4)
```
That is one breath per bar. Modulation from the whistle and the low end is added on top (§8.7).

### 4.3 Textures (all deterministic; generated once at load with seeded `rng()` from `engine/motion.js`)

| Texture | How it is generated | Seed | Load cost |
|---|---|---|---|
| **Board-formed concrete** (2400×1400 tile) | Canvas2D, layered: 4-octave value noise (amplitude 7). Horizontal board seams every 72 px (1 px dark, 1 px light below, y jitter ±1 px). Wood-grain streaks (noise stretched 12:1 on x). Tie holes on a 288×216 grid (6 px dark cone plus a highlight crescent facing the key). Rain streaks under every sill (vertical noise columns, exponential alpha over 300 px). One hairline crack (random walk, 0.6 px). A separate **high-pass detail layer** is kept for light-reveal masking. | 1401 | ~250 ms |
| **Plaster** | Low-frequency noise plus 40 faint trowel arcs (2% alpha), a door-handle scuff left of the switch plate, and 4 old pin holes on the plaque wall | 1404 | 60 ms |
| **Glass wear** (per window, door and pane) | 300–400 dust specks (1–2 px, 6–18% alpha), 40–60 water-spot rings (6–14 px, 1 px outline at 8%), one dried drip trail, one fingerprint (concentric sine-warped ellipses at 4%), and a vinyl air bubble on the door. **Dust is masked by highlights, so it shows only where light grazes it.** | 1402+i | ~80 ms |
| **Fake frost** (no `backdrop-filter`) | For each pane: a crop of whatever plate is behind it, blurred 18 px with canvas `filter` at load, clipped to the pane, plus the site's `--glass-fill`. Static per shot. | — | 10–30 ms per pane |
| **Fingerprints** (persistent) | SVG `feTurbulence` (baseFrequency 0.02) → `feDisplacementMap` (scale 6) over concentric ellipses, radially masked at 3.5% screen. Rasterised once; stamped where each press happens (Review & sign · Approve & publish · More like this) and **left there**. | 7 | 20 ms |
| **Paper slips** | Fibre noise, warm edge darkening, one crease, Geist Mono print with 0.3 px ink spread | 1406 | 30 ms each |
| **Dymo tape** | Volt or black body with 2 px vertical ridges (±3%); a three-pass emboss (dark +1.5 px, light −1 px, base); a stress-whitening noise mask on the letters; ends cut at 4–7° by clip-path; one end lifting 1.5 px with its shadow | 1407 | 20 ms each |
| **Asphalt and pavement** | Two-scale aggregate speckle; a damp darkening mask (low-frequency noise thresholded at 0.62); 0.6 m slab grid with ±1 px chips; granite kerb with one highlight line | 1408 | 150 ms |
| **Road paint** | Paint mask = text × (1 − wear noise thresholded at 0.3), with aggregate showing through; 0.5 px edge bleed | 1409 | 40 ms |
| **Grain** | `grainTiles` (8 tiles, 256²), 4.5% soft-light (the site's `body:after`). **Tile index = floor(t·24) mod 8**, offset by a seeded jump, so it runs on a 24 fps cadence over 60 fps motion. | 1 | 40 ms |
| **Focus planes** | Far plates pre-blurred at 0 / 6 / 14 px with canvas `filter='blur()'`; rack focus is a crossfade | — | ~120 ms |
| **Halation** | Pre-blurred sprite per light source, added at 12–20% screen. Scaled only, never re-blurred per frame. | — | 30 ms |
| **Lens** | Static vignette: multiply 6% by day, 10% by night. **No chromatic aberration, flares, glitch or light leaks.** | — | 0 |

**Grade by act:**
- Act I: saturation ×0.80, warm-neutral.
- Act II: neutral.
- Acts III–V: "site graphite": blacks lifted to `#0a0a0c`, highlights roll off toward `#f5f5ef`, and volt is never clipped to flat `#d4ff3f` except inside the logo tile.

---

## 5. Typography system

Type is never a caption. It is a material in the world. It inherits its surface's light, focus and motion.

| Material | Face and settings | Where | Two-tone logic |
|---|---|---|---|
| **Window vinyl, day** (applied through transfer tape) | Bricolage Grotesque, opsz 96, **wght 660, wdth 88**, tracking −0.04em, leading 0.92; 104–112 px on screen | S1 | Line 1 is white vinyl `#f5f5ef`. Line 2 is grey vinyl `#8a8a84`. |
| **Window light-type, night** (glowing letters in lit windows) | Same face; 104 px. Core `#f5f5ef` plus a pre-blurred 6 px copy at 30%, clipped to the glass, with the glass reflections composited *over* the letters | S3, S15 | White, grey, and (S15 only) volt |
| **Door glass vinyl** | Same face, wght 700, 100 px. Eyebrow in Geist Mono 500, 22 px, caps, 0.16em. | S5–S6 | "One coin." in opaque `#0b0f02` against the lit frost; "One X Manager." in translucent volt vinyl, which glows brighter |
| **Dymo labels** (the creator labelling the room) | Bricolage **wdth 75**, wght 700, caps, +0.04em, cap height 60 px, tape 104 px tall | S7–S10 | "GIVE IT" on black tape (`#111214`, letters `#e9ecee`). The noun on **volt tape** (`#0b0f02` letters), slapped a 16th later and 2 px out of line. |
| **Stencils** | Geist Mono 500, caps, 0.16em, 20–28 px, `#5d5d59`, volt only when lit | "G·14"; the inside-sill loop | — |
| **Engraving** (light-revealed) | Geist Mono 500, caps, 0.14em, 22–26 px. A highlight/shadow pair offset along the light → text vector; opacity ∝ local light. | the plinth identity line; the meter rail | Invisible by moonlight; legible under the manager's light |
| **Slat print** (the voice instructions) | Geist Mono 400, 17 px, sentence case, `#0b0f02` at 85% | S12 | Read in silhouette against backlit slats |
| **Paper slips** | Geist Mono 400, 24 px, `#2a2a28` | S4 | — |
| **Road paint** | Bricolage wdth 75, wght 800, 120 px font, **scaleY 1.8** (real road lettering is stretched for drivers, so it looks tall from above), cap ≈ 150 px apparent | S16 | Both lines are white paint. **Line 2 lies inside Orbit's light, so it reads volt.** The site's two-tone, made by light. |
| **Real UI** | Geist and Geist Mono exactly as `voice-site.css` renders them. **Never restyled**, except the colourless token override in Act I. | all UI | — |
| **End lockup** | Logo tile 152 px; "voice." in Bricolage 700, −0.06em, 136 px, lime "." (the site's `.brand`); "tryvoice.fun" in Geist Mono 500, 64 px, `#f5f5ef`; "@tryvoice" in Geist Mono 500, 40 px, `#8a8a84`, preceded by a 30 px X glyph drawn as SVG | S17 | — |

**Rules:**
- At most one narrative sentence per frame.
- Narrative type is at least 96 px, so it stays at least 18 px when the film plays 360 px wide on a phone.
- The **focal UI read** of each beat is at least 48 px. Secondary UI text may be smaller; it is texture.
- The camera stays under 4 px/s whenever a sentence must be read.
- Narrative copy totals about 40 words.
- No per-word masks, blur-ins, odometer word swaps or tracking animations.
- Digits that roll do so only inside the real field, as a mechanism.

---

## 6. Shot by shot

Every shot below lists: composition · micro-detail · secondary motion · camera · real UI and its treatment · exact on-screen text · transition out · music · SFX. Screen coordinates are for 1920×1080.

### S1 · 0.00–1.80 · b1.1–1.4 · "Launching a coin takes seconds."

- **Composition:**
  - A frontal orthographic elevation of the Block in flat overcast daylight, zoom 0.62 (bays about 470 px).
  - Rows visible: floor 3 (cropped at the top), floors 2 and 1, the ground floor, and the plinth on the bottom edge.
  - Partial bays bleed off both edges, so nothing is centred.
  - Concrete covers about 45% of the frame; the sky exists only in the glass reflections.
- **Micro-detail:**
  - Rain streaks under every sill and a tie-hole grid.
  - One window carries the pale rectangle of an old tenant's sign (the building has history).
  - One window is open a crack (a dark gap). One blind is fully down; others sit at seeded heights.
  - Tape residue sits on one pane.
- **Secondary motion:**
  - Cloud reflections drift across the glass at 12 px/s, moving at 1.6× the camera's parallax (the glass has depth).
  - Tape corners flutter for 1–2 frames after each slap.
  - Transfer-tape backing curls away from each word.
- **Camera:** a locked elevation trucking right at 24 px/s.
- **Real UI:**
  - Ten real `launch-preview` cards (colourless) are taped into windows on a seeded 16th pattern (`x.xx.x.xx.x`) from 0.15 to 1.35. Each slams in with a 2-frame settle, one tape strip, and a lean of ±0.4–1.1°.
  - Six are the real placeholder: "V · Your next big idea · $TICKER · Every coin has a story. This one is yours to tell."
  - Three are the site's real Explore examples: **Noodle $NOODLE, Void $VOID, Moss $MOSS**.
  - **Orbit $ORBIT** is taped last, at **1.50**, into the ground-floor bay c2 (lower right).
- **On-screen text** (window vinyl, one word per window, peeled on 8ths):

  | Time | Word | Window | Colour |
  |---|---|---|---|
  | 0.00 (already 60% peeled on frame 0; done by 0.12) | "Launching" | floor 2, c1 | white |
  | 0.30 | "a coin" | floor 2, c2 | white |
  | 0.60 | "takes" | floor 1, c1 | grey |
  | 0.90 | "seconds." | floor 1, c2 | grey |

  Each peel takes 7 frames, with a translucent rolling edge.
- **Transition:** at 1.80 the camera dollies toward Orbit's window. At 2.05–2.20 an unlit **street-lamp post** on the camera's side of the street crosses the lens as a soft dark vertical wipe (foreground plane, z = 0.3).
- **Music:** the music box, heard through glass, plays phrase A bar a: E6 at 0.00, E6 0.60, G6 0.90–1.80, then A6 1.80 and G6 2.10. Its comb plays F3–C4–A4 under it (Fmaj7).
- **SFX:**
  - Paper "thups" on the card pattern are the intro percussion, panned by window x.
  - A transfer-tape rasp on each word.
  - Music-box governor ticks on 16ths at −32 dB: the opening pulse.

### S2 · 1.80–3.60 · b1.4–2.3 · the coin exists

- **1.80–2.40:** the dolly in, zoom 0.62 → 1.55, with the lamp-post wipe.
- **2.40–3.00, hold** (the bar-2 downbeat):
  - A medium close-up of Orbit's bay c2.
  - The real coin preview for Orbit sits behind the glass, colourless, taped at its top-left, 0.8° crooked: "COIN PREVIEW · ● LIVE · O · **Orbit** · **$ORBIT** · not a moon mission. a whole new orbit. · ≋ Part 2: give it a voice · Nothing is published or broadcast until you sign in your wallet."
  - "≋ Part 2: give it a voice" sits greyed: an unkept promise. "Orbit" reads at about 52 px.
  - Foreground: water-spot rings, a dried drip, and a fingerprint on the tape. Below, on the plinth: the stencil "G·14".
- **3.00–3.30, time-lapse:**
  - A soft diagonal shadow of the opposite tower sweeps right to left (the sun moving).
  - The sky reflection drains from white to blue-grey.
  - The tape corner lifts 6° and the card sags to 2.0°.
  - The LIVE dot blinks once, then dies.
- **3.30–3.60:** a fast pull-back with mass (zoom 1.55 → 0.80) into the S3 framing at blue hour. Cold tube lights flick on in six units on 32nds between 3.33 and 3.55.
- **Real UI:** `launch-preview` (colourless), populated with Orbit's real Explore data.
- **Music:**
  - Bar 2: E6 at **2.40**, with the comb playing G3–B3–D4 (G).
  - **The spring runs down.** Governor ticks stretch ×1.0 → ×1.6 → ×2.5. **The pitch does not sag**, because a real comb doesn't detune; only the tempo drags.
  - D6 is due at 3.30 and arrives late, at **3.60**.
- **SFX:** a low wind-air swell under the shadow sweep (pink noise, LP sweep 300 → 900 Hz, −40 dB); a tape-lift crackle at 3.15 (6 micro-impulses); six tube "tinks" (3–4 kHz pings, −36 dB).

### S3 · 3.60–5.40 · b2.3–3.2 · "Then it goes quiet." · THE RHYME FRAME

- **Composition** (locked; zoom 0.80; reused exactly in S15):
  - Floor-1 windows run across the top, cropped (y 0–204).
  - Bare spandrel concrete is the negative space (y 204–380).
  - The ground row runs y 380–720:
    - G·12 (c1) at x 292–772, lit cold;
    - **Orbit bay c2** at x 900–1380;
    - Orbit bay c3 from x 1508, cropped at the right edge, dark.
  - Plinth y 720–830, with "G·14" under c2.
  - Pavement band y 830–1080.
  - Concrete is blue-graphite; the pavement is dusk-blue.
- **On-screen text** (night light-type, visible from 3.60):
  - "**Then**" in floor 1, c1, white.
  - "**it goes**" in floor 1, c2, white.
  - "**quiet.**" in Orbit c2, grey `#8a8a84`, **set so that its full stop's centre sits on the rhyme pixel P = (1252, 528)**.
- **Action:**
  - 3.60–4.20: the sentence reads.
  - 4.20: "Then" and its unit click off. 4.50: "it goes" clicks off. 4.65: G·12 dies. Unseen units die in an accelerating cascade (audible, far away).
  - **4.80: "quiet." flickers twice (f288–293) and dies.** The letters decay over 0.35 s, but **the full stop dies last**: its afterglow lingers alone at P until **5.25 (f315)**, the last light in the block.
  - 5.25–5.40: only moonlight on concrete.
- **Micro-detail:** tubes die with a 2-frame blue flash; the glass keeps faint reflections; the pavement shows the first damp patch.
- **Camera:** dead still from 3.60. This is the first motionless frame in the film.
- **Transition:** a hidden cut in darkness at 5.40. Both frames sit at mean luma ≤ 0.06, and the interior fades up only as moonlight over 0.3 s.
- **Music:**
  - D6 (late) rings from 3.60.
  - The mechanism strains with two slow ticks at 4.05 and 4.50.
  - **At 4.80 the switch click falls exactly where C6 should have been.** The phrase is left unfinished.
- **SFX:**
  - Relay clicks plus tube tinks at 4.20, 4.50 and 4.65.
  - **The light switch at 4.80.** This is the film's "switch" sample. It recurs at 15.45 and as the four count-in clicks in S15.
  - Room tone fades in from 4.80: brown noise, LP 250 Hz, −50 dBFS.

### S4 · 5.40–7.20 · b3.2–4.1 · silence / absence / tension

- **Composition:**
  - UNIT A, frontal, locked, camera height 1.2 m. About 62% of the frame is dark plaster and floor.
  - **The door** at x 1080–1500, y 210–960, with a frosted upper half (y 250–610) and a lever handle.
  - The moonlight from the street window behind the camera falls as a **striped parallelogram**: 16 slat shadows, ice `#8fa3ad` at 12% screen, skewed 18° across the floor band and up the wall.
  - Inside it lies the soft shadow of Orbit's taped card, crooked, with its tape strip. **The coin is present only as a shadow.**
- **Micro-detail:**
  - At the foot of the door: four paper slips printed "**@orbitonsolana**" and "**2 d ago**", "**4 d ago**", "**6 d ago**", "**9 d ago**", at seeded rotations, one resting on another and lifted by paper stiffness.
  - Dust shows only where the moonlight grazes the floor.
- **Action:**
  - 6.00: a fifth slip ("**now**") slides in under the door. It moves fast, makes a friction stop at **6.03** (30 ms off the grid: a hand), and turns 3°.
  - 6.00–7.00: stillness. The moonlight breathes ±3% as a cloud passes (6.2–6.9).
  - **7.00 (f420): a 1 px hairline of volt appears under the door.** This is the first volt pixel in the film, and it is silent.
- **Camera:** locked. Only the grain moves.
- **Real UI:** none (the before-Voice world).
- **Sound:**
  - Room tone at −50 dBFS.
  - The dry, close paper slide at 6.00–6.03.
  - **Room tone fades to digital zero at 6.40. 6.40–7.20 is absolute silence.**

### S5 · 7.20–8.40 · b4.1–4.3 · Voice appears

- **Action:**
  - The frosted door glass **blooms volt from behind**: a hall light approaching, rising from the bottom-left over 0.4 s with a small overshoot.
  - On the glass: **the silhouette of a rounded tile crossed by the pulse path, the Voice mark.** Something is standing at the door.
  - **Frosted-glass optics** (true physics): the silhouette *sharpens as it approaches the glass*. Blur radius falls from 38 px at 7.20 to 5 px at 8.30, and the silhouette grows 6%.
  - The backlight also reveals the glass's dust and an air bubble in the vinyl.
  - The under-door line widens from 1 to 6 px.
  - The slips' edges light up and **throw long shadows toward the camera**.
- **Camera:** a continuous push, zoom 1.00 → 1.90 over 7.20–8.40 (`ease.voiceInOut`).
- **Real brand:** the exact mark path `M6.5 16h3l2.2-5.5 3.6 12 3.4-15 3 11 1.8-2.5h2`, rendered as a silhouette: the tile is backlit, the pulse stroke is dark.
- **On-screen text:** none yet. The door lettering stays below the light's threshold.
- **Music:**
  - **The whistle, behind the door, sings C6 from 7.20 to 8.40: exactly the note the music box never reached.** Voice finishes the coin's sentence.
  - A hallway hum on **F2 + C3** fades in (−38 dBFS): the first warmth since 3.60.
  - A soft F1 sub swell at −30 dB.
- **SFX:** none. Let the note be alone.

### S6 · 8.40–9.60 · b4.3–5.1 · "One coin. One X Manager."

- **8.40, the key turns** (two clacks, 8.40 and 8.55). The door shudders 2 px.
- **The silhouette reaches the glass and the bloom peaks**, revealing the lettering that was always on the door:
  - "**One coin.**" in opaque dark vinyl.
  - "**One X Manager.**" in translucent volt vinyl, which glows brighter.
  - At the bottom edge, in Geist Mono 22 px: "**X MANAGER · @orbitonsolana**" (the real command-deck eyebrow and handle).
  - Composition at zoom 1.90: the glass spans x 560–1560 (1,000 px). The silhouette sits in the upper third; the lettering is left-aligned at x 620 with baselines at y 610 and 720, 100 px.
- **8.40–9.00:** hold for reading (camera under 4 px/s).
- **9.00, the door opens inward 22°**, hinged on the right:
  - The glass foreshortens (2D scaleX 1 → 0.93 with Lambert shading, not 3D).
  - A **wedge of volt light** sweeps across the floor toward camera-right.
  - The slips flutter in the draft (a 3-frame lift).
  - **The whistle comes into the room:** its LP filter opens from 1.4 kHz to 12 kHz in 0.25 s.
- **9.30–9.60:** a whip pan right following the wedge (anisotropic blur, σx up to 24 px), passing the wall plate and meter as a blurred preview, and landing on the panes.
- **Music:** the key clacks fall on 16ths. The first finger snap is on **9.00** (beat 4). Whistle pickup G5 at 9.30.
- **SFX:** key in lock (two inharmonic FM pings plus a noise transient), and a hinge "breath" at 9.00 (a very soft resonant creak). The whip itself is silent.

### S7 · 9.60–10.80 · b5.1–5.3 · "GIVE IT A BRAIN."

- **Composition:** three tall frosted panes leaning 4–6° against wall A, each with a contact shadow, an 18% floor reflection broken by an expansion joint, and plaster with trowel arcs behind.
  - **Luna:** the real `model-grid` card at scale 2.2, x 300–980.
  - **Sol:** scale 1.9, x 1040–1600, set 30 cm further back.
  - **Astra:** from x 1660, cropped.
  - Foreground: the open door's edge, soft and dark at the left frame edge, parallaxing at 1.6×.
- **Real UI and honesty:**
  - Luna shows "**● Verified · ready** · Authenticated and completed a real model test call."
  - Sol and Astra show their real "**Needs verification**" rows, legible during the light's pass.
  - **Nothing is occluded.** After the choice they simply fall out of the light.
- **Action:**
  - The wedge's light passes over all three (9.60–9.85) and rests on Luna.
  - **At 9.90 Luna is picked up:** it lifts 6 px, straightens from 5° through −0.6° to 0°, and slides 28 px forward into the light. A specular sweep crosses its "Verified · ready" chip.
  - Sol and Astra fall into shadow and defocus (pre-blurred crossfade, 0 → 6 px).
  - Focal read: "**GPT-6 Luna**" at 52 px or more.
- **On-screen text:**
  - Black Dymo "**GIVE IT**" slaps onto the skirting at lower-left (x 140–560, y 880) at **10.05**.
  - Volt Dymo "**A BRAIN.**" slaps beside it at **10.20**, 2 px high and 0.7° off. Its free end curls, then a thumb-press specular sweep flattens it (10.35).
- **Camera:** a lateral truck right to left over 60 px, with parallax: wall 0.6×, panes 1.0×, door edge 1.6×.
- **Transition:** at 10.80, a vertical whip-tilt down (σy up to 28 px, 4 frames) onto the desk.
- **Music:**
  - Fmaj9. Bass enters on F1 at 9.60.
  - Whistle call cell: E6 9.60, E6 10.20, G6 10.50–11.40.
  - Muted pluck on the off-beat 8ths.
- **SFX:** a glass "tink" at 9.90 (two damped partials tuned E7 / B7). **The Dymo pair is a drum:** "GIVE IT" is the ghost note (10.05); the noun is the backbeat on beat 2 (10.20).

### S8 · 10.80–12.00 · b5.3–6.1 · "GIVE IT A CHARACTER."

- **Composition:** a top-down macro of the desk.
  - A graphite slab with fine scratches and a **broken mug-ring stain** at the top right (someone's habit).
  - The glass desk pad (x 220–1700, bevelled, chipped at the lower-left corner) covers the real **"Tone & character"** group (`voice-group-1`, scale 2.3).
  - The real "**CT Native ✓** · Dry wit and naturally online crypto culture." preset card (`voice-presets`) is tucked under the pad's top-right corner at 3°.
  - Dust on the glass parallaxes against the panel under it, which shows the glass's thickness.
- **Action:**
  - 11.00–11.50: **Humor** drags 50 → 70, hesitates 4 frames, overshoots to 87 and settles at **85**. The real "85 /100" digits roll inside the field.
  - 11.30: **Creative spontaneity** nudges 55 → 60.
  - **Story & lore** stays at 50. These are the real captured values.
- **Light:** a raking warm light from the upper left (the hall wedge reaching the desk). As Humor rises, the pool brightens and warms from `#e6ecef` toward olive-volt `#a6c832` at 20%, and the knobs' shadows lengthen. **Character is the quality of the room's light.**
- **On-screen text:** "**GIVE IT**" at 11.25 and "**A CHARACTER.**" at **11.40** (beat 4), on the desk's front edge (the bottom of the frame) at lower-left, 1.1° off.
- **Camera:** a 3% drift-push.
- **Transition:** at 12.00, a whip-tilt up (4 frames) onto the wall plate.
- **Music:** G6 chord from 10.80, with a Rhodes stab at 11.10.
- **SFX:** knob detent ticks every 5 units (a 32nd ripple from 11.00 to 11.50); the Dymo ghost and accent slaps.

### S9 · 12.00–13.20 · b6.1–6.3 · "GIVE IT BOUNDARIES."

- **Composition:** locked frontal.
  - The real **Permissions** panel (scale 2.0, x 400–1520, y 180–860) is mounted as a wall plate at switch height: frosted pane, four screw heads (one turned 30°), and a 3 px shadow gap from the plaster.
  - At x 220–330 is the room's own **light switch** (a graphite toggle plate). **This is the switch that will say "go" at 15.45.**
  - Beneath, cropped by the bottom edge: the real "**Human control**" card with **Approval Mode** selected ("…you review every draft before anything is posted.").
  - To the left, on the plaster: the scuff where the door handle hits the wall.
- **Action:** the real toggles switch OFF → ON in a 32nd fill: **Read mentions** 12.15, **Community interaction** 12.225, **Relationship memory** 12.30. Each bounces for 2 frames and lights its volt track, throwing a small volt bounce onto the plaster below. Community monitoring, Read X context and Search X are already ON in the real capture.
- **On-screen text:** "**GIVE IT**" at 12.45 and "**BOUNDARIES.**" at **12.60** (beat 2), above the plate, the way people label switch plates.
- **Camera:** a slow push, 1.00 → 1.04.
- **Transition:** at 13.20, a tilt up (4 frames of blur) to the meter mounted above.
- **Music:** Em7. **The kick enters at 12.00** (beats 1 and 3, a ghost on 2&).
- **SFX:** three switch thocks (two-stage click); the Dymo pair.

### S10 · 13.20–14.25 · b6.3–6.4a · "GIVE IT A BUDGET."

- **Composition:**
  - The real **Spending limits** UI (`limits`), cropped to the "**Daily maximum (USD)**" field and the "**Launch-hour activity**" choice with "**Busy · up to 15 actions**" selected.
  - It is mounted in a utility-meter box: a deep graphite frame (x 360–1560, y 120–880) with a glass front, a fingerprint smudge and a water ring.
  - Engraved on the frame's bottom rail, legible under the hall light: "**A CEILING, NEVER A QUOTA.**"
- **Action:** the daily maximum's digits roll **0.00 → 5.00** inside the real field (13.35–13.80, decelerating). One drum lags a frame, as mechanisms do.
- **On-screen text:** "**GIVE IT**" at 13.65 and "**A BUDGET.**" at **13.80** (beat 4), below the meter.
- **Transition:** 14.10–14.25, a whip-tilt down to the desk.
- **Music:** Am9. Shaker 16ths enter at 13.20. The bass walks A1 (13.20) → C2 (13.65) → E2 (13.95), leading into F1 at 14.40.
- **SFX:** an odometer ratchet with falling pitch, landing on 13.80.

### S11 · 14.25–15.60 · b6.4a–7.3 · launch

- **14.25:** arrive top-down on the desk pad. The real launch review component:
  - "**Coin reviewed ✓ · Manager saved · paused ✓ · Transaction simulated ✓**";
  - the volt primary button "**Review & sign in wallet**" (scale 3.0, about 80 px tall);
  - "**Your wallet signs every transaction**" beneath it.
- **14.40 (bar 7 downbeat): the press.** The button sinks 2 px, its inner shadow deepens and its specular dims. **A fingerprint is left, and stays.**
- **14.40–14.85:** hold for reading.
- **14.85:** cut to UNIT B, the window from inside. The slats are open and horizontal; the night street shows through them.
  - **The sign** drops into the space between the slats and the glass on its cord (14.85–15.00), swinging ±7°, sliced by the slat gaps.
  - We see its back: a dark frosted card with a thin rim.
- **15.00: the slats close** in a top-to-bottom ripple over 0.2 s, in front of the swinging sign. **The room closes its eyes.** The frame goes to moon seams.
- **15.15:** a hidden cut in the dark to the exterior (the S12 camera).
  - Orbit's two bays, slats shut.
  - The sign hangs behind the glass in the lower right of bay c3. Its street face shows the real chip "**‖ Paused until you say go**", legible by moonlight, still swinging ±1.5° and decaying.
  - The neighbours are dark; one far upper window is lit cold. This is the inhale.
- **15.45:** inside, the light switch clicks (heard through the glass, LP 2 kHz). **The creator says go, and we hear it rather than see it.** On f927–928, a 2-frame **ember** at 4% shows behind the slats.
- **Music:**
  - **14.40: a stop-time band hit** (Fmaj9 stab: Rhodes, pluck, bass, kick and snap together on the button thock). Then the band cuts dead.
  - 15.15–15.60: exterior night air only.
- **SFX:** the button thock (low, a little rubber); a sign-cord flutter at 14.85; a plastic blinds cascade at 15.00 (16 ticks in 0.2 s); a faint sign creak; the switch at 15.45.

### S12 · 15.60–19.20 · b7.3–9.1 · THE MANAGER WAKES UP

See §7 for the second-by-second specification.

### S13 · 19.20–24.00 · b9.1–11.1 · observes → thinks → drafts → interacts → learns (one continuous take)

- **Composition** (UNIT B from inside; the first frame arrives through the slat wipe):
  - **Left third:**
    - The plaster pier.
    - **The manager's lamp** (the logo tile as a frosted lightbox, 220 px, hanging on a cord) at about x 300, y 250.
    - Below it, two real memory cards as dark acrylic plaques with their pins:
      - **JOKE:** "'A whole new orbit' is the recurring community phrase. Use sparingly." (Importance 95/100), at y 470–600.
      - **LORE:** "Orbit is the tiny satellite that refuses to come back down." (Importance 100/100), at y 630–760.
    - A blank space with four old pin holes, waiting.
  - **Centre-right:**
    - The two-bay window (x 700–1820, y 80–720). The slats are open at 6°, soft foreground stripes with dust on their lit edges.
    - Through them: the low **opposite block** at night (ice-lit windows, a dark rooftop billboard frame, a graphite sky with a faint city glow).
    - The sign's back hangs against bay c3's glass, rimmed by its own glow.
  - **Inside sill (y 720–760):** the stencilled loop, real home-page copy, `#5d5d59` until lit: "**01 OBSERVE · 02 UNDERSTAND · 03 CHECK · 04 ACT — OR WAIT · 05 REMEMBER**".
  - **Bottom (y 760–1080):** the desk, its front edge carrying a volt bounce. Two frosted panes stand propped on small stands and overlap the lower window (layered depth):
    - the real **Decisions** feed (scale 1.5, x 560–1040, y 600–1000);
    - the real **Approval queue** card (scale 1.8, x 1120–1760, y 640–1040).
  - **The light reproduces the website's own ambient composition:** lime top-left (the lamp), ice top-right (the window), lime at the bottom (the desk bounce).
- **Camera:** one continuous dolly right and in: 260 px lateral, zoom 1.00 → 1.10 over 19.20–24.00. **Five motivated focus pulls** (pre-blurred plate crossfades plus CSS blur ≤ 6 px on at most two DOM panes): FAR → NEAR → MID → NEAR → FAR (the last one in S14).

| Sub-beat | Time | Picture | Real UI | Focus | Music and SFX |
|---|---|---|---|---|---|
| **Observes** | 19.20–20.10 | Across the street, 8 windows light on a syncopated 16th pattern (19.20, 19.35, 19.65, 19.80, 19.875, 20.025 …): mentions arriving. "**01 OBSERVE**" lights on the sill at 19.20. | At 19.80 a real row inserts at the top of the Decisions pane: "**Read mentions · Read new mentions. Found one conversation worth joining. · Complete · Example**". It reads soft now and sharp later. | FAR | Far switch clicks as hi-hat accents, panned by window |
| **Thinks** | 20.10–21.00 | The lamp's filament brightens at its left end, so the light pool slides onto the JOKE plaque (20.25), then the LORE plaque (20.55): recall. Across the street (soft) every window dims to 40% **except one**: selection by light. "**02 UNDERSTAND**" lights at 20.25 and "**03 CHECK**" at 20.70. | memory cards | NEAR | The lamp breathes with the bass; the whistle completes the coin's phrase (C6 at 20.40) |
| **Drafts** | 21.00–21.90 | The approval card types its draft **word by word on 32nds** (21.00–21.90): "**not every orbit needs a destination. sometimes the timeline is enough.**" A volt caret blinks twice. | Approval queue: "**Original post · humor**", with Approve & publish · Edit · Reject · More like this · Less like this | MID | Typing ticks on 32nds as a hat roll; Dm9 |
| **Interacts** | 21.90–22.80 | **21.90: Approve & publish** is pressed (the creator approves; the fingerprint stays). "**04 ACT — OR WAIT**" lights. **22.05:** a row inserts: "**Original post · Original post published. The running orbit joke fit the conversation. · Published · Example**". **22.35:** a second row: "**Reply · Replied to a long-time community member. · Published · Example**". At that moment, across the street, the one lit window **flicks twice** (22.35, 22.50) and **its blind lifts a hand's width** (22.50–22.80): a wave back. | Decisions feed, real rows | MID (the wave reads soft in FAR) | **The one notification sound:** glock G6 (22.05) → C7 (22.20), the hook's own leap. Two far clicks panned right. |
| **Learns** | 22.80–24.00 | **22.80: More like this** is pressed. **22.95:** the real toast rises at the card's top edge: "**Saved as "more like this". It now guides this manager's voice.**" **23.25:** the card lifts off its stand. **23.40:** it is pinned to the plaque wall in the waiting space, placed 1.2° crooked and corrected to **0.0°** (the manager's precision). "**05 REMEMBER**" lights. 23.40–24.00 settles: the room at its most lived-in. | teach feedback toast | NEAR | Button click; tape slap at 23.40; a **whistle fill E6–E6–G6–C7** on 16ths (23.40–23.85): it has learned the leap |

### S14 · 24.00–25.20 · b11.1–11.3 · chooses when NOT to act (same take)

- **24.00: the trend.** The rooftop LED screen across the street flares: harsh `#eef3ff` with rolling PWM banding and a scramble of oversized, unreadable glyph fragments (#, ↑, %, ×). It is fictional and unreadable by design.
  - Its light floods the room flat and cold and bleaches the volt; contrast collapses for 6 frames.
  - The camera **flinches** for 4 frames (zoom 1.000 → 1.012 → 1.000).
  - Focus pulls FAR.
- **24.15–24.45: tempted.**
  - The slats begin to tilt *toward the screen* (6° → −12°): the eyes look up at it.
  - The lamp rises 15%.
  - The "ACT" in "04 ACT — OR WAIT" flickers.
  - **The whistle begins an E6 and stops after 90 ms (24.30–24.39).** It almost speaks.
- **24.60: the choice.**
  - The slats tilt **closed** (−12° → 72°) in a top-to-bottom ripple over 0.3 s.
  - The trend's light is sliced into thin cold lines and dies to 15%.
  - The lamp settles back, and the plaques warm again.
  - On the sill, "— OR WAIT" stays lit while "ACT" dims.
- **24.75:** focus returns to MID, and the real row slides into the Decisions pane: "**Chose to do nothing · Trend was unrelated to Orbit. Chose to stay silent. · No action · Example**".
- **24.90–25.20:** stillness. The lamp stays on and the sign's glow edges the closed slats. The room is not asleep; it is choosing. The camera's last push brings the closed slats into the soft foreground.
- **Transition, 25.20:** a match cut on the slats, from inside to outside (S15).
- **Music:**
  - 24.00: Em7, plus **the trend stab: F♯4 + C5 on detuned saws.** It is the only out-of-key sound and the only saw in the score.
  - A 60 Hz LED buzz at −28 dB.
  - 24.60: the band drops out (LP closes over 0.3 s), leaving a heartbeat kick and E1 at 24.60 and 24.75. The last bass note is at 25.05.
- **SFX:** the blinds' plastic ratchet (7 ticks on 32nds, 24.60–24.825).

### S15 · 25.20–26.40 · b11.3–12.1 · "Now quiet is a choice."

- **Composition:** **S3's camera exactly**, verified by frame diff, now at night.
  - Orbit's bays c2 and c3 glow volt as thin bright seams through nearly shut slats (72°).
  - The sign shows small in bay c3's lower right: **● RUNNING · APPROVAL MODE**, its dot breathing.
  - Six neighbours are lit, with blinds at different heights than in S3. The block lives differently now.
  - The plinth's identity line is faintly legible in the spill. "G·14" is lit.
- **On-screen text** (night light-type; one switch click per word group, on 8ths):

  | Time | Text | Window | Colour |
  |---|---|---|---|
  | 25.20 | "**quiet**" | Orbit c2 | grey, **at exactly S3's glyph pixels**, with no full stop: P is dark now |
  | 25.50 | "**Now**" | floor 1, c2 (where "it goes" was) | white |
  | 25.80 | "**is a**" / "**choice.**" | Orbit c3, two lines, left-aligned at x 1540 | volt |
  | 26.10 | (no text) | a far unit, floor 1, c3 | lights: the block |

  It reads: quiet → Now quiet → **Now quiet is a choice.** Same word, same place, new meaning.
- **Camera:** locked. The frame never freezes: the seams breathe with `breath(t)` (±1.5%).
- **Transition:** a hard cut on the downbeat, 26.40.
- **Music:**
  - Near-silence: the manager's lamp hum on C (−40 dBFS).
  - **Four switch clicks on 8ths (25.20, 25.50, 25.80, 26.10): the same switch as 4.80, now a count-in.**
  - **The inhale (26.12–26.36)** is the only body sound in the film: the whistler breathes in before singing.

### S16 · 26.40–28.80 · b12.1–13.1 · "One coin. A voice of its own."

- **Composition** (a straight top-down plan, night):
  - Top 20% (y 0–216): the Block's roof edge, parapet and gravel, ending at the façade line y 216.
  - Along the façade line, units spill light onto the pavement: soft ice trapezoids from the neighbours.
  - **Orbit's spill:** a long skewed trapezoid of **16 volt bands** (one per slat gap) falling down-right across the pavement (slabs, y 216–520), over the granite kerb (y 520), and onto the asphalt.
  - **Road paint**, white:
    - "**One coin.**" at x 140–700, y 600–760, *outside* the light: it reads moon-white.
    - "**A voice of its own.**" at x 520–1780, y 800–960, *inside* the light: it reads volt.
    - **The site's two-tone headline, made by light.**
  - A drain grate at x 300 on the kerb.
  - A shallow puddle under Orbit's sill (x 1300–1420, y 230–300), reflecting a sliver of ice sky.
- **Action:**
  - **26.40: the manager reopens its slats.** The 16 bands bloom across the street one per slat, 0.031 s apart (the wake's strum, echoed), reaching line 2 by 26.90.
  - "One coin." is already readable at 26.40.
  - 27.60: a drip ring in the puddle. The sill is still dripping, as it did at 18.10.
  - 28.20: a neighbour's light switches on (a new ice patch at the left).
- **Micro-detail:** aggregate speckle, restrained damp patches (no gloss), road-paint wear with aggregate showing through, the grate's slots catching light, a chipped slab.
- **Secondary motion:** the bands breathe with the whistle. The slats micro-tilt ±2° from `whistle_env`, which moves band widths ±6%, smoothed over 120 ms. It never bounces.
- **Camera:** a slow descent (zoom 1.00 → 1.04) with a 1° roll correcting to 0°: a crane settling.
- **Transition, 28.80** (bar 13 downbeat): a **match cut** from the 16 light bands to the 16 slats of Orbit's window in elevation, at the same screen y positions.
- **Music:** **the payoff** (§8). Sub boom; the answer phrase leaps for the first time; voices.
- **SFX:** a blinds strum at 26.40 (16 ticks tuned up Fmaj9♯11); a drip plink at 27.60 (G6); a far click at 28.20.

### S17 · 28.80–32.40 · b13.1–14.3 · tryvoice.fun · @tryvoice

- **28.80–29.70** (the window becomes the logo):
  - Bay c2 fills about 70% of the frame. The camera pushes in, zoom 1.00 → 1.35.
  - The slats rotate edge-on and dissolve into **solid lime**: the diffuser saturates to the real mark gradient `#f2ffbf → #d4ff3f 55% → #a9e62a`.
  - The window's corners round (radius → 31%, the logo's 10/32) and its aspect eases to 1:1.
  - The lamp's filament resolves as the mark's dark pulse stroke. **The lit window was the logo.**
  - The façade sinks to a 3–4% ghost of concrete, and a 4% ghost of slat shadows remains.
- **29.70: the lockup settles**, optically centred:
  - Tile, 152 px, at x 650–802, y 404–556.
  - "**voice.**" lights letter by letter as the tile's glow reaches it (29.70–29.95), baseline y 540, **its lime full stop centred on P = (1252, 528): the exact pixel where "quiet."'s full stop died in S3.**
  - **30.00:** "**tryvoice.fun**" lights, centred, at y 690.
  - **30.30:** "**@tryvoice**", with the X glyph, at y 760.
- **Light:** the tile is the only source. It lights the concrete ghost around it (`#232a0d` at 220 px, ink by 600 px). Grain stays live. The tile breathes with `breath(t)`, and at 30.00 the filament takes one brighter breath on the final note.
- **31.80–32.40:** the tile's light dims last, like an exhale (−30%). The frame ends on lit graphite (mean luma about 0.05), never flat black.
- **Music:** Cmaj9. The whistle resolves (G6 28.80 → A6 29.70 → **C7 at 30.00**); the music box sounds **C6 together with it**; a last music-box E6 at 31.20 (the coin's first note, as if beginning again); the ring-out ends with the final 6 frames silent.

---

## 7. THE CENTERPIECE: "the manager wakes up" (15.60–19.20, f936–f1152)

**Camera and frame:**
- Exterior night, from across the street at eye height (about 1.6 m). One-point frontal, zoom 0.90 at 15.60, pushing to 1.06 by 18.60.
- **Orbit's two bays:** x 348–1572, y 250–637. Bay c2 is x 348–888; the pier is 888–1032; bay c3 is 1032–1572. 16 closed slats per bay.
- **Plinth:** y 637–763, carrying "G·14" and the identity line.
- **Pavement and street:** y 763–1080, a foreshortened ground band drawn per row with the horizon at about y 560, and a small puddle under the sill.
- **Partial neighbours:** the ground bay at the left (x 0–204), the ground bay at the right (x 1716–1920), and the bottom strips of the floor-1 windows along the top edge.
- **The 6th slat of bay c2 is bent.** A pull cord hangs at the right of c3.
- **The slat print** (bay c2; real `personality` instructions, verbatim, Geist Mono 17 px):

  | Slat | Text |
  |---|---|
  | 2 | You are the anonymous admin of this coin. |
  | 4 | You are extremely online, funny, short-form, |
  | 5 | and naturally confident. |
  | 7 | Never sound like a corporate social media manager. |
  | 9 | Don’t overexplain. |
  | 11 | Don’t force jokes. |
  | 13 | Build recurring lore. |
  | 15 | Only post when you have something worth saying. |

- **Plinth identity line** (engraved; invisible by moonlight): "**$ORBIT · @orbitonsolana · GPT-6 LUNA · CT NATIVE**". These are the command-deck's real fields, set to the brain and voice the creator chose.

**Poster frame: f1032 (17.20).**
- Slats 1–14 of both bays are open: horizontal lines of volt light.
- Slats 15–16 are still shut, and "**Only post when you have something worth saying.**" reads in silhouette on slat 15.
- Sixteen stripes of light are racing across the pavement toward us.
- The sign is mid-swing, already reading RUNNING.

| Time | Frames | Picture | Sound and music |
|---|---|---|---|
| 15.45 | 927–928 | **Ember:** 4% luminance in the centre of c2, behind the slats, for 2 frames. Anticipation. | The switch (inside, LP 2 kHz) |
| **15.60 · Ignition** | 936–944 | **A filament in the shape of the pulse path** (300 px, from the lamp hanging inside) ignites behind the closed slats. It is visible only through the gaps, so the slats slice it into dashes. Intensity by frame: f936 0.35 · f937 0.55 · **f938 0.20 (dip)** · f939 0.28 · f940 0.70 · f941 0.86 · f942 0.97 · f943 1.03 · f944 1.00. Colour ramps from `#3a4210` to volt to the `#f3ffc4` core over 10 frames. | **A tungsten tink tuned to C7.** The manager's first sound is the home note. **The lamp hum begins** (C2 + G2 + C3, beating at 0.3 Hz, −34 dBFS). The tonic *pitch* arrives here; the tonic *chord* is still withheld. |
| 15.60–16.20 · Warm | 936–972 | The diffuser behind the slats warms and the slats turn translucent, brightest near the filament. **The façade is revealed by physics:** the concrete's detail layer is masked by `smoothstep(0.02, 0.15, L)`, where L = I(t)·1/(1+(r/420)²), so board seams and tie holes appear in a ring expanding from the window rather than fading in. The bent slat leaks a brighter wedge. Spill reaches the plinth: "**G·14**" is legible at 15.90; the identity line at 16.05–16.20. The camera starts a 40 px crane up and pushes 0.90 → 0.96. The sign is silhouetted. | Hum +10 dB over 0.6 s. A thermal slat creak at 15.90. |
| **16.20–16.80 · The reading** | 972–1008 | The backlight crosses the level where **the printed instructions read in silhouette**, one sentence per slat. **The character is written on its eyelids.** The camera almost stops (under 4 px/s). The first sentence (slat 2) and the last (slat 15) are the anchors; the rest is texture for rewatchers. | **A riser made of the blinds:** filtered noise plus rising slat creaks, a G1 bass swell (V pedal), and a reversed whistle E6 swelling into the downbeat. |
| **16.80 · The opening** (bar 8 downbeat) | 1008–1044 | **The slats open in a wave from top to bottom**, both bays together. Slat *i* (1–16) starts at **16.80 + (i−1)·0.031 s**, about 1.9 frames apart. Each one is a spring: 82° → 6°, overshoots to −4°, then chatters through 2 cycles in 0.12 s. **Each opened slat throws a stripe of volt onto the pavement.** Each stripe appears at the façade base and slides toward camera over 0.2 s, so **the stripes race toward the lens**. The pull cord swings (0.9 Hz). | **The first tonic chord in the film: Cmaj9.** Kick and sub boom (C1 → C0). **The blinds strum:** 16 pitched plastic ticks, one per slat at its exact frame, climbing C4 E4 G4 B4 D5 E5 G5 B5 C6 D6 E6 G6 B6 C7 D7 E7. **The whistle enters, present and in the room:** phrase A (E6 at 16.80). **The music bus opens:** width 0.40 → 1.00, HP 90 → 25 Hz, LP 10 → 18 kHz over 0.25 s. The music now lives in the room. |
| 16.95–17.40 · The sign | 1017–1044 | The air pushed by the slats swings the sign 4°. **The real pill changes state** (16.95–17.15): "‖ Paused until you say go" → "**● Running · Approval Mode**", with a width spring, a text crossfade, and the volt dot filling from behind. **The dot starts to breathe and never stops** (`breath(t)`, through every silence, to the last frame). **At 17.40 the sign settles at exactly 0.00°: the first perfect register in the film.** | A felt "tik" for the dot at 17.10 (−30 dB) |
| 17.40–18.00 · The room | 1044–1080 | Through the open slats the interior shows in parallax (the room plane sits at z 1.8 behind the façade): the lamp tile at full glow, the two plaques, the door far back. **The sign's notice line lights word by word as the room's light reaches it** (17.55–17.85): "**Your manager is active. Its launch hour has started.**" **Its first words are written in its own light.** A 2% haze shows in the beams, with no motes. | Full groove: E6 at 17.40, G6 17.70–18.60 |
| 18.00–18.60 · The block answers | 1080–1116 | Three neighbouring windows switch on in cool ice-white: left ground at **18.00**, top-left floor-1 at **18.15**, top-right floor-1 at **18.45**. One raises its blind (18.30–18.55). **A drip** falls from Orbit's sill (18.10) into the puddle, where its ring disturbs the reflection of the stripes. | Am9. Three far switch clicks on 16ths, panned left, left-high and right-high. The drip plink is tuned G6. |
| **18.60–19.20 · The look** | 1116–1152 | **The slats tilt from +6° to −14°** in 0.3 s with a top-to-bottom ripple: **the eyes lower to the street.** The stripes sweep across the pavement toward the camera. **At f1134 (18.90) a stripe crosses the lens:** exposure +10% for 5 frames. **The manager is looking at us.** The push continues into the slats, and from f1140 two slats pass the lens as soft foreground bars. Under that wipe, at 19.20, we cut to the reverse angle: its side of the glass (S13). | A slat-tilt ratchet (7 ticks on 32nds). Whistle A6 at 18.60, G6 at 18.90. A slat swish at 19.05 (the objects passing, not the camera). |

**Why this is the most memorable image, and why it reads as a living operator:**
- It is the only moment the light comes from *inside*. Every earlier light came from outside: sky, sun, moon, the hall.
- It **introduces itself before it acts:** a name engraved in its plinth, a character printed on its eyelids, a state on its sign, first words in its own light.
- Its light physically reaches the viewer.
- The neighbourhood answers.
- Its first act is to **look**, not to post.

---

## 8. Music: cue "Window Song"

### 8.1 Basics
- **100.000 BPM, 4/4, C major** (A-minor colours). 13 bars plus a 2-beat ring-out = 32.40 s.
- 16th swing of 54% on the shaker, typing and hats only. Everything else is straight.
- Seeded humanisation of ±6 ms and ±10% velocity on secondary parts. Hero hits are locked to the grid.
- **Feel references (feel only; copy no melody):**
  - an indie whistle-pop hook (the "Young Folks" lineage);
  - The xx's palm-muted minimalism;
  - the stop-start silences of the best Apple spots.
- **The idea:** a whistled hook is the most human, pop-recognisable "voice without words". **The whistle is the manager.**

### 8.2 The hook: "one rhythm, two directions" (whistle register E6–C7)

Grid is 8ths. `—` holds the previous note. `·` is a rest.

**Phrase A, "the call" (falls home):**

| Bar a | 1 | 1& | 2 | 2& | 3 | 3& | 4 | 4& |
|---|---|---|---|---|---|---|---|---|
| | **E6** | · | **E6** | **G6** | — | — | **A6** | **G6** |

| Bar b | 1 | 1& | 2 | 2& | 3 | 3& | 4 | 4& |
|---|---|---|---|---|---|---|---|---|
| | **E6** | — | — | **D6** | **C6** | — | — | — |

As offsets from the phrase start T: E6 T+0.0 (0.30) · E6 T+0.6 (0.30) · G6 T+0.9 (0.90) · A6 T+1.8 (0.30) · G6 T+2.1 (0.30) · E6 T+2.4 (0.90) · D6 T+3.3 (0.30) · **C6 T+3.6 (1.20)**.

**Phrase B, "the answer"** (same rhythm; **leaps up** where A stepped):

| Bar a′ | 1 | 1& | 2 | 2& | 3 | 3& | 4 | 4& |
|---|---|---|---|---|---|---|---|---|
| | **E6** | · | **E6** | **G6** | — | — | **C7** | **B6** |

| Bar b′ | 1 | 1& | 2 | 2& | 3 | 3& | 4 | 4& |
|---|---|---|---|---|---|---|---|---|
| | **G6** | — | — | **A6** | **C7** | — | — | — |

- It sings as "da · da DAA— · da da | DAAA— da DAA".
- The contour is C-major pentatonic (memorable and universal). B6 appears only at the leap.
- **Phrase A ends low on C6:** the coin's sentence. **Phrase B leaps G6 → C7 and ends on C7, an octave higher:** a voice of its own.

**Where each note lives:**

| Who | Time | What |
|---|---|---|
| Music box (the coin), through glass | 0.00–3.60 | E6 0.00 · E6 0.60 · G6 0.90 · A6 1.80 · G6 2.10 · E6 2.40 · **D6 3.60 (late)** · **C6 never comes: the switch takes its place at 4.80** |
| Whistle, behind the door | 7.20–8.40 | **C6, the missing note** |
| Whistle | 9.30–11.40 | pickup G5 9.30 → E6 9.60 · E6 10.20 · G6 10.50–11.40 (the call cell) |
| Pluck riff (muted guitar) | 12.00–14.10 | the call cell twice an octave down: E4 12.00 · E4 12.60 · G4 12.90 · E4 13.20 · E4 13.80 · G4 14.10 |
| **Whistle, phrase A in full (the wake)** | 16.80–21.60 | E6 16.80 · E6 17.40 · G6 17.70 · A6 18.60 · G6 18.90 · E6 19.20 · D6 20.10 · **C6 20.40–21.60**: the coin's sentence, sung complete for the first time |
| Rhodes (soft) | 21.60–22.50 | call cell echo: E5 21.60 · E5 22.20 · G5 22.50 |
| Glock (the one notification) | 22.05 / 22.20 | **G6 → C7: the leap interval, heard before the voice sings it** |
| Whistle fill (learns) | 23.40–23.85 | E6 · E6 · G6 · **C7** on 16ths |
| Whistle (tempted) | 24.30 | an E6 intake, cut at 24.39 |
| **Whistle, phrase B (payoff)** | 26.40–31.50 | E6 26.40 · E6 27.00 · G6 27.30–28.20 · **C7 28.20** · B6 28.50 · G6 28.80–29.70 · A6 29.70 · **C7 30.00–31.50** |
| Music box (now in the room) | 30.00 / 31.20 | C6 together with the whistle's C7; a last E6 at 31.20, left ringing |

### 8.3 Chords per bar (two per bar; Rhodes voicings, bass separate)

| Bar | Start | Beats 1–2 | Beats 3–4 | Function and notes |
|---|---|---|---|---|
| 1 | 0.00 | **Fmaj7** (box comb F3 C4 A4) | — | IV. Calm and intriguing. |
| 2 | 2.40 | **G** (box comb G3 B3 D4) | (wind-down) | V, never resolving |
| 3 | 4.80 | — | — | Absence (room tone, then zero) |
| 4 | 7.20 | **F pedal** (hall hum F2 + C3) | F pedal | Voice's C6 is the 5th of F: open, warm, unresolved |
| 5 | 9.60 | **Fmaj9**: A3 C4 E4 G4 / F1 | **G6**: B3 D4 E4 G4 / G1 | IV–V (royal road, first half) |
| 6 | 12.00 | **Em7**: G3 B3 D4 E4 / E1 | **Am9**: C4 E4 G4 B4 / A1 | iii–vi |
| 7 | 14.40 | **Fmaj9 stab** at 14.40, then N.C. | C hum from 15.60 · G1 swell from 16.20 | Stop. Breath. The tonic pitch comes before the tonic chord. |
| 8 | 16.80 | **Cmaj9**: E3 G3 B3 D4 / C2 | **Am9** / A1 | **The first I chord of the film, at the wake** |
| 9 | 19.20 | **Fmaj9** / F1 | **C/E**: G3 C4 E4 / E1 | The whistle's C6 lands on C/E: home, but still moving |
| 10 | 21.60 | **Dm9**: F3 A3 C4 E4 / D2 | **G13sus4** (F3 A3 C4 E4 / G1) → **G13** (F3 B3 E4) at 23.40 | ii–V |
| 11 | 24.00 | **Em7**, plus the trend's **F♯4 + C5** stab | N.C.; C hum only | The only out-of-key notes in the score |
| 12 | 26.40 | **Fmaj9(♯11)**: A3 B3 E4 G4 / F1 | **G6**: B3 D4 E4 G4 / G1 | **The payoff.** The Lydian ♯11 is the brightest colour in the key. |
| 13 | 28.80 | **Cmaj9** rolled over 120 ms (C2 · G2 E3 B3 D4 E4) | held | **The melodic resolution: B6 → C7 at 30.00** |
| 14 | 31.20 | ring-out | end (32.40) | The last music-box E6 rings |

**The two delayed resolutions carry the story:**
- **Harmonic:** IV–V from frame 0 reaches I only when the manager wakes (16.80).
- **Melodic:** the voice's own phrase (B) hangs on B6 and reaches C7 only on the end card (30.00).

The coin's phrase (A) is finished by Voice twice: as a single note at 7.20, and as a whole sentence at 20.40.

### 8.4 Instruments (all synthesisable; extend `audio/instruments.py` and `compose.py`)

The synthesised recipe is the master. A sampled alternative is listed where `audio/sampler.py` already provides one; A/B them by ear in round 1 and keep whichever sounds more human. Everything is deterministic.

| Part | Synthesis recipe | Sampled A/B option |
|---|---|---|
| **Whistle** (lead) | Sine at f, plus a 2nd harmonic at −30 dB. Each note scoops in from −60 cents over 40 ms. Vibrato 5.4 Hz, ±16 cents, faded in after a 150 ms delay. Seeded slow pitch drift ±5 cents. Breath: white noise band-passed at f (Q 8), −22 dB, following the note envelope with +8 dB in the first 30 ms. Air hiss: HP 4 kHz at −32 dB. Amplitude jitter ±1 dB. 30 ms legato glides. A 2 ms lip click at −30 dB on accented notes. Attack 18 ms, release 60 ms. Small-room reverb (RT60 0.45 s, 15% wet) plus a dotted-8th tape echo (450 ms, 18% feedback, LP 3.2 kHz). **Behind the door (7.20–9.00):** LP 1.4 kHz plus hallway reverb (RT60 1.1 s, 35% wet). The filter opens to 12 kHz over 0.25 s at 9.00. | GM 78 "Whistle" via FluidSynth, as a test only |
| **Music box** (the coin) | **Cantilever-tine partials 1 : 6.27 : 17.55** (amplitudes 1, 0.18, 0.05; decays 1.8 s, 0.4 s, 0.12 s). A 1.5 ms pluck click. A wooden box body: BP 400–900 Hz at −14 dB. Governor ticks on 16ths at −32 dB. **Wind-down:** tempo drags (×1.0 → ×1.6 → ×2.5), and the pitch is **constant**. **Through glass:** mono, BP 350–4500 Hz, a −6 dB shelf above 3 kHz, small room 0.35 s, −20 dB below the payoff level. **At 30.00 and 31.20 it is in the room:** stereo, full band. | GM 10 "Music Box" |
| **Muted pluck** | Karplus–Strong (`pluck(mute=0.6, bright=0.45)`), two strings detuned ±4 cents and panned ±30, soft clip. Off-beat 8ths on chord tones (3rd, 5th, 7th, 9th cycling); the bar-6 riff as listed. | Real acoustic-guitar samples (`stringstudio-acoustic-guitar`), palm-muted by envelope |
| **Rhodes** | `epiano`: FM 1:1, index 2.0 → 0.35 over 0.7 s, plus a 14:1 tine partial for 60 ms, stereo tremolo 4.6 Hz ±10%. Chords on beat 1 of each half-bar, with a short re-strike on the "&" of the second beat. | GM 4 "Electric Piano 1" |
| **Bass** | `bass_pluck`: sine plus 2nd harmonic at −9 dB, 6 ms attack, 0.35 s decay, soft clip, 40 ms slides into new roots. Per half-bar: root (dotted 8th) · root on the "&" of the 2nd beat · a semitone approach on the last 16th. | `stringstudio-bass` samples |
| **Kick / snaps / clap / shaker** | Kick: 52 Hz with soft punch, 0.38 s, plus a felt-beater click. Snaps: noise BP 1.7–4 kHz (7 ms) plus a 950 Hz body (22 ms), 6 ms late. Clap: `clap(spread=0.011)`, **payoff only**. Shaker: HP noise, 18–35 ms grains, accents on the "e"s. | `lofi-boom-bap` kit (kick, snap, shaker) |
| **"Ooh" voices** | `voice_pad(vowel='oo')`, three voices, ±7 cents detune, 0.15 s attack. **Bars 12–13 only.** | — |
| **Glock** | FM bell, ratio 3.5, index 2.2 → 0, 0.9 s decay. **Used for exactly two notes (22.05, 22.20).** | `drumstudio-mallet` glock |
| **Hall hum** | F2 + C3 sines with a 2nd harmonic at −12 dB, 7.20–9.60 | — |
| **Lamp hum** (the manager) | C2 65.41 + G2 98.0 + C3 130.81 Hz at 0 / −8 / −14 dB, with two partials detuned 0.3 Hz so it beats. 15.60 to the end. −40 dBFS under the band; audible alone in S15 and the tail. | — |
| **Trend stab** | Two polyBLEP saws per note (F♯4, C5) detuned ±18 cents, LP 3 kHz, 0.45 s decay, plus a 60 Hz square buzz (LP 400 Hz, −28 dB) with 120 Hz PWM flutter | — |
| **Blinds strum** | 16 short heavily damped Karplus plucks plus a 3 ms plastic click (noise, BP 2–5 kHz). Pitches are listed in §7 (wake) and S16 (Fmaj9♯11: F4 A4 C5 E5 G5 B5 C6 E6 F6 G6 A6 B6 C7 E7 F7 G7). | — |
| **Inhale** | Breath noise BP 500–3000 Hz with a formant sweep from "h" to "a", 0.24 s crescendo, −24 dBFS | — |

### 8.5 Section map (dynamics are short-term LUFS)

| Bars | Time | Section (the client's arc) | What plays | Level |
|---|---|---|---|---|
| 1–2 | 0.00–4.80 | **Calm / intriguing** | Music box through glass, card thups as percussion, governor ticks, the wind-down | −30 → −36 |
| 3 | 4.80–7.20 | (absence) | Switch at 4.80, room tone, **digital zero 6.40–7.20** | −48, then silence |
| 4 | 7.20–9.60 | Voice enters | Whistle C6 behind the door, hall hum, F1 swell; key clacks; snap at 9.00; filter opens | −30 → −26 |
| 5 | 9.60–12.00 | **Subtle rhythmic development** | Bass, muted pluck, snaps on 2 and 4, Rhodes, the whistle's call cell, Dymo slaps as backbeat. **Bus: width 0.40, HP 90 Hz, LP 10 kHz (intimate).** | −22 |
| 6–7.1 | 12.00–14.40 | **Increasing momentum** | Kick from 12.00, shaker 16ths from 13.20, the pluck riff (the call cell), bass walk A–C–E | −18 |
| 7 | 14.40–16.80 | **Brief tension / silence** | Stop-time hit at 14.40, then nothing; exterior air from 15.15; switch at 15.45; filament tink and hum at 15.60; blinds riser and G1 swell from 16.20 | −14 momentary → −40 → −24 |
| 8–10 | 16.80–24.00 | Momentum peak (wake and habits) | Full groove: kick (1, 2&, 3, 4& ghost), snap and light clap on 2 and 4, swung shaker, bass, Rhodes, pluck, whistle phrase A. **Bus opens to full width and range at 16.80.** Bar 10 is lighter: typing ticks as hats, glock, the learned fill. | −14 |
| 11 | 24.00–26.40 | **Tension → the chosen silence** | Trend stab and buzz, the tempted intake, blinds ratchet, drop-out at 24.60, heartbeat to 25.05; then only the C hum, four clicks, and the inhale | −13 → −26 → −38 |
| 12 | 26.40–28.80 | **Satisfying emotional payoff** | Sub boom on C1 → F1; **phrase B** on the whistle; **"ooh" voices** (A4 C5 E5 → B4 D5 G5); clap plus snap; bass octaves; Rhodes Fmaj9♯11 → G6; pluck; blinds strum | **−12 (the loudest point of the film)** |
| 13–14 | 28.80–32.40 | **Elegant ending** | Kick and clap on 28.80 only, then the drums stop. Rolled Cmaj9, voices G4 C5 E5, C1 sustain, whistle G6 → A6 → **C7 (30.00)** with fading vibrato, music box C6 in unison, a last box E6 at 31.20, the hum and tail to −60 dB, **the final 6 frames silent** | −16 → −24 → −60 |

**Mix:**
- Integrated loudness about **−16 LUFS**. The quiet passages pull it down; do not normalise them up.
- Short-term maximum −11 LUFS. True peak −1 dBTP.
- **Silences are composed.** 6.40–7.20 is exact digital zero. 15.15–15.60 and 25.20–26.40 are near-silence (air and hum only).
- One shared small-room IR (RT60 0.45 s) for music and SFX, so they sit in one room. Act I alone uses the through-glass chain.
- The kick sidechains the Rhodes and voices by 2–3 dB.

### 8.6 How the SFX sit inside the music

- **The percussion comes from the world:** card thups are the intro beat, Dymo slaps are the backbeat, switch thocks are the fill, typing is the hat roll, the blinds strum is the downbeat flourish, and the neighbour clicks are hat accents.
- **Tuned sounds:**
  - filament tink = C7 (the tonic);
  - lamp hum = C;
  - hall hum = F;
  - drip = G6;
  - glass tink = E7 / B7;
  - publish glock = G6 → C7 (the hook's leap);
  - blinds strum = an arpeggio of the chord.
- **One switch sample, four meanings:**
  - kills the coin's song (4.80);
  - says go (15.45);
  - counts in the payoff (25.20 / 25.50 / 25.80 / 26.10);
  - and the neighbours' clicks are its distant cousins.
- **The trend is the only dissonance.**
- Everything is quantised to the 16th grid, **except one deliberate human miss:** the slip's stop at 6.03.
- **Camera moves are silent. No whooshes, no braams, no risers except the 0.6 s blinds riser.**

### 8.7 Stems and picture drive

`audio/drive.py` writes `audio/out/drive.json`. It is tagged with the SHA-256 of `mix.wav`, and `render.mjs verify` refuses a mismatch. It holds per-frame values (60 fps):

| Key | Source | Drives |
|---|---|---|
| `whistle_env` | RMS over 20 ms, smoothed over 120 ms | Lamp and filament intensity ±6% (from 16.80); the slat micro-tilt and band width in S16 |
| `low_env` | content below 120 Hz | The lamp's breath ±2% on kicks; a 0.6 px camera tremor on the two sub booms only |
| `incoming` | event list (opposite-window clicks, mentions) | Which windows across the street light, and when (S13) |
| `events` | every timed SFX from `timeline2.json` | Sync check: every onset within ±2 frames |

**The same `timeline2.json` beat grid feeds both `compose.py` and the page, so picture and music cannot drift.**

---

## 9. Sound design palette (each sound has one reason)

| Sound | When | Built from | Why it exists |
|---|---|---|---|
| Card "thup" plus tape flutter | S1 16ths | Noise burst BP 300–2 kHz (25 ms) plus an 8 ms HF flutter | Launching is fast and cheap; it is also the intro groove |
| Transfer-tape rasp | 0.00 / 0.30 / 0.60 / 0.90 | Sparse impulses through BP 2–6 kHz | A hand puts the words up |
| Governor ticks | 0.00–4.50 | 1 ms clicks, stretching | The coin's mechanism, running down |
| Wind-air | 3.00–3.30 | Pink noise, LP sweep | Time passing with the shadow |
| Tape-lift crackle | 3.15 | 6 micro-impulses | Neglect, audible |
| Relay and tube tink | 4.20 / 4.50 / 4.65 | Thud plus tick; a 3 kHz damped ping | Lights going out = going quiet |
| **The switch** | 4.80 · 15.45 · 25.20–26.10 | A two-stage plastic toggle (a 6 ms tick plus a 120 Hz thud) | Kills the song → says go → counts in |
| Room tone | 4.80–6.40 | Brown noise LP 250 Hz, −50 dBFS | Silence that is not yet zero |
| Paper slide | 6.00–6.03 | Friction noise with a decaying envelope | Unanswered mentions |
| Key in lock | 8.40 / 8.55 | Two inharmonic FM pings plus a noise transient | Arrival |
| Hinge breath | 9.00 | Very soft resonant creak | The door opens; the filter opens |
| Glass tink | 9.90 | Partials at E7 and B7 | The brain chosen and lifted |
| Dymo pair | 10.05/10.20 · 11.25/11.40 · 12.45/12.60 · 13.65/13.80 | Plastic slap (ghost) plus slap with a thumb squeak (accent) | The creator labels the room; also the backbeat |
| Knob detents | 11.00–11.50 | 32nd micro-ticks | Character dialled in by hand |
| Switch thocks | 12.15 / 12.225 / 12.30 | Two-stage click | Boundaries are physical |
| Odometer ratchet | 13.35–13.80 | Tick train with falling pitch | A limit landing on a number |
| Button thock | 14.40 | A low "thock" with a little rubber | The signature (and the stop-time hit) |
| Sign-cord flutter | 14.85 | Card tick plus air | The sign is hung |
| Blinds cascade | 15.00 | 16 plastic ticks in 0.2 s | The room closes its eyes |
| Night air | 15.15–15.60 | Pink noise LP 300 Hz, −50 dBFS | Outside, waiting |
| Filament tink plus lamp hum | 15.60 → end | A C7 ping; the tuned hum | The manager's first breath, on the home note |
| Blinds riser | 16.20–16.80 | Filtered noise plus rising creaks | Eyelids straining open |
| **Blinds strum** | 16.80 · 26.40 | 16 pitched ticks | The eyes open, as music |
| Sub boom | 16.80 · 26.40 | Existing `boom` | Weight on the two big downbeats only |
| Dot "tik" | 17.10 | 3 ms C7 sine at −30 dB | RUNNING |
| Neighbour clicks | 18.00 / 18.15 / 18.45 · 22.35 / 22.50 · 28.20 | Distant, panned switch clicks | The block answers |
| Drip plink | 18.10 · 27.60 | A G6 sine blip with a pitch drop | The window's reflection disturbed; continuity |
| Typing ticks | 21.00–21.90 | Soft keys on 32nds | Drafting in time with the groove |
| Approve / More-like-this | 21.90 · 22.80 | Real-UI-weight clicks | The creator is in the loop |
| Publish glock | 22.05 / 22.20 | G6 → C7 | The one notification, built from the hook |
| Tape slap (plaque) | 23.40 | Tape plus a soft wall thud | Learning leaves a trace |
| Trend stab plus LED buzz | 24.00 | Detuned saws plus a 60 Hz square | Temptation is literally out of key |
| Blinds ratchet | 24.60 | 7 plastic ticks on 32nds | The choice, audible |
| Inhale | 26.12–26.36 | Formant breath | Alive, inside the chosen silence |

**Rules:**
- No more than 3 foreground sounds at once.
- Many visual events are deliberately silent (the first volt pixel, the RUNNING dot's breath, the camera).
- Nothing makes a sound without an on-screen or implied physical cause.

---

## 10. Engine plan (deterministic HTML: `window.seek(t)`)

**Location:** `film2/`. It reuses `engine/motion.js` (springs, eases, `rng`, `hash01`, `noise1`, `typed`), `engine/textures.js` (`grainTiles`, `graphite`, `dustLayer`) and `scripts/render.mjs` (render, verify, sync).

**Architecture:**
- **Camera:** one 2D affine camera per set (x, y, zoom, roll).
- **Planes:** each set is a list of planes with depth *z*. Each plane gets `translate((p − cam)·zoom/z) scale(zoom/z)`.
- **No `preserve-3d`, no 3D contexts, no `translate3d`.** Blend modes therefore always work.
- **Slats are drawn in Canvas2D:** each slat is a rect of height h·|cos θ|, with shading by angle and backlight, and its printed text drawn with `drawImage` from a pre-rendered strip, scaled by cos θ.
- **Door swing, sign swing and pane lean** are 2D (scaleX/skew plus Lambert shading, or rotation about a pivot).
- **Real UI:** the captured fragments, rendered live with `assets/vendor/voice-site.css`. State is set per frame through the real classes and attributes (selected, aria-pressed, slider `left` and value, toggle `on`, pill text and class, `typed()` substring, toast, pressed). There are three film overrides:
  - `.film .panel { backdrop-filter:none }`, with fake frost underneath instead;
  - lime glows are off, except where the light rig says a light exists;
  - `.colourless` in Act I.
- **Light:** each set has a light layer. Ambient is multiplied. Each source is a radial gradient or a pre-rendered light map composited with `screen` or `soft-light`. Spill through slats is canvas quads. The light-reveal uses a radial-gradient `mask-image` whose stops are computed per frame.
- **Ground band** (S4, S12): drawn per row (about 200 rows of `drawImage` strips from the asphalt or floor tile, offset per row by camera x/z), so a lateral camera move parallaxes correctly.

**Per-frame cost** (budget about 140 ms per frame at the measured ~7 fps):

| Element | Method | Cost per frame |
|---|---|---|
| Façade or wall plates | Pre-rendered canvases, transforms only | 2–4 ms |
| Window states (about 40 windows) | One canvas: rect fills, light-type sprites, blinds | 3–6 ms |
| Light layers (4–8 sources) | Gradients and pre-rendered maps with blend modes | 4–8 ms |
| Light-reveal mask | Per-frame radial `mask-image` stops on the detail layer | 1–2 ms |
| Slats (32) | Canvas rects plus text strips | 2–3 ms |
| Ground band plus stripes | ~200 row strips plus quads | 4–7 ms |
| Real UI panes (1–3 visible) | Live DOM, no backdrop-filter | 5–20 ms |
| Focus | Pre-blurred crossfade, plus CSS `blur()` ≤ 6 px on at most 2 panes | 1–15 ms |
| Halation sprites | Screen-blended, scaled | ~1 ms |
| Grain and vignette | Tile on a 24 fps cadence; static vignette | ~1 ms |
| Whip pans and tilts (~36 frames total) | SVG `feGaussianBlur` with anisotropic `stdDeviation` (σ×0 or 0×σ), on the world container only during those frames | 150–300 ms |

**Typical frame 40–90 ms; peak about 300 ms. 1,944 frames ≈ 5–6 minutes per render.**

**Determinism:**
- Await `document.fonts.ready` and explicitly `document.fonts.load('660 104px "Bricolage Grotesque"')` with `font-stretch: 88%` and 75%. Assert glyph widths.
- All randomness comes from seeded `rng`.
- No timers, CSS transitions or animations, and no `will-change`.
- Canvases are fully redrawn from t on every seek, with no accumulated state.
- The new helper is `handled(t, t0, from, to, {hesitate, overshoot, correct, seed})`: `spring()` plus a hesitation key, with per-object durations varying ±8–15% and offsets of 1–3 frames (seeded), while hero events stay locked to the grid.
- Hand-placed micro-motion (tape curl, thumb press) is quantised on twos: `tq = Math.floor(t*30)/30`.

**Risks and fallbacks:**

| Risk | Fallback |
|---|---|
| Procedural architecture looks like cheap CG | Keep everything orthographic, matte and textured. No specular gloss on concrete. Read it at 50% scale against Hopper and Leiter references in every review. |
| The night street reads as a Midjourney cliché | No rain, no neon, no glossy sheen. Damp patches only. The trend is the only neon-like light. |
| Slat text unreadable | It is texture plus two anchors. Slat 15's sentence holds until 17.23 and is the one that must read. |
| UI text shimmers under transforms | Reading moments use near-zero camera velocity and integer-ish scale. Author at final pixel size. |
| Whip blur too slow | Fall back to 3 offset copies at 33% for at most 6 frames. |
| The whistle sounds like a sine beep | Breath, scoops and lip clicks are mandatory. A/B against GM 78. Double it with the voices an octave down in the payoff. |

---

## 11. Product truth and exact copy

**Guardrails (production must hold all of these):**
- The brain is **GPT-6 Luna** ("Verified · ready"). Sol and Astra are shown honestly with "Needs verification". The identity line reads GPT-6 LUNA · CT NATIVE because those are what the creator chose. **Nothing in the film claims Sol or Astra is verified.**
- **Approval Mode:** every publish follows a creator press ("Approve & publish"). The manager never publishes on its own in frame.
- **PAUSED → RUNNING happens at the wake**, after "Review & sign in wallet" and the creator's "go".
- **Real example data only.** The draft is the real queue item ("Original post · humor", "not every orbit needs a destination. sometimes the timeline is enough."). The rows are the real Decisions rows, with their **Example** tags kept. Memory plaques are the real JOKE and LORE cards. **No invented mentions, no @cosmicdegen, no other handles** except @orbitonsolana (the product's own example coin) and @tryvoice.
- The approval card's timestamp is generated by the bundle's own relative-time formatter (`Q()` in `capture/js/launch-phase-*.js`) for a created time one minute ago. If that is not feasible, keep the captured text out of the focal plane. **Never hand-write UI copy.**
- **Never shown:** balances implying real funds, deposit confirmations, "Verified on Solana", follower counts or metrics, image or video generation, research as configured, creator-fee replenishment.
- **The budget** is a ceiling: Daily maximum 5.00, Busy · up to 15 actions, "A ceiling, never a quota."
- The trend is fictional and unreadable.

**Every narrative or world string in the film, verbatim:**

| Shot | Text |
|---|---|
| S1 | Launching · a coin · takes · seconds. |
| S2 (UI) | COIN PREVIEW · LIVE · Orbit · $ORBIT · not a moon mission. a whole new orbit. · Part 2: give it a voice · Nothing is published or broadcast until you sign in your wallet. |
| S3 | Then · it goes · quiet. |
| S4 | @orbitonsolana · 2 d ago · 4 d ago · 6 d ago · 9 d ago · now |
| S6 | One coin. · One X Manager. · X MANAGER · @orbitonsolana |
| S7–S10 | GIVE IT · A BRAIN. · A CHARACTER. · BOUNDARIES. · A BUDGET. · A CEILING, NEVER A QUOTA. |
| S11 (UI) | Coin reviewed · Manager saved · paused · Transaction simulated · Review & sign in wallet · Your wallet signs every transaction · Paused until you say go |
| S12 | The 7 instruction sentences (§7) · G·14 · $ORBIT · @orbitonsolana · GPT-6 LUNA · CT NATIVE · Running · Approval Mode · Your manager is active. Its launch hour has started. |
| S13–S14 | 01 OBSERVE · 02 UNDERSTAND · 03 CHECK · 04 ACT — OR WAIT · 05 REMEMBER, plus the real UI rows, card, toast and plaques listed above |
| S15 | quiet · Now · is a · choice. |
| S16 | One coin. · A voice of its own. |
| S17 | voice. · tryvoice.fun · @tryvoice |

---

## 12. Anti-AI checklist

| Trap | How this film avoids it |
|---|---|
| UI cards floating on black | Every pane leans, hangs, lies, is propped, mounted or taped, has a contact shadow, and receives the shot's light. It is revealed by light or placed by a hand, never faded in. |
| Black-void backgrounds | Night is moonlit graphite concrete and plaster. Mean luma ≥ 0.06 per shot (the S4 and S11 tails are the exception, where luma standard deviation ≥ 0.015 must prove texture is visible). The end frame is lit graphite. |
| Decorative gradients and glows | Every gradient is the falloff of a named source (§4.2). Bloom only on real sources, ≤ 20%. 2% haze in the S12 beams only. |
| Random particles | None. Dust is static on glass and shows only in highlights. The only small movers are paper slips and one drip, each with a cause. |
| Holograms, orbs, neural nets, robots, brains, circuits | None. The AI is a light in a room. The brain is a pane chosen by light. Identity is shown by traces: instructions on the blinds, plaques, an engraved plinth, habits. |
| Crypto clichés (gold coins, candles, charts, rockets, moons) | None, despite the name Orbit. A coin is a window in a building. The only number is a $5.00 daily limit. |
| Stock 3D objects | No modelled objects at all. Only flat materials that CSS and canvas render honestly: concrete, plaster, glass, paper, tape, light, paint. |
| Predictable kinetic type | No masked rises, blur-ins or tracking. Type is peeled vinyl, lit window letters, door vinyl, Dymo, stencil, engraving, slat print, road paint, or the UI's own typing. |
| UI → caption → UI repetition | Each act has its own grammar: collage (I), locked absence (I), arrival (II), a hand-labelling anaphora where every gift uses a different mounting, camera move and tape location (II), ignition (III), one continuous take with focus pulls (IV), rhyme (V), plan view (V), morph (end). |
| Clean SaaS motion (everything ease-out) | Motion follows the material: paper friction, glass weight and overshoot, switch snap, slat spring and chatter, sign pendulum, a lagging odometer drum, a hesitating knob, a camera with mass, a flinch. Seeded per-object variation. |
| Over-perfect render | Seeded imperfection everywhere before the wake: crooked cards, lifted tape, a vinyl bubble, a bent slat, water spots, fingerprints, a mug ring, a turned screw, a handle scuff, misaligned Dymo. **The first perfect register is saved for the wake (the sign at 0.00°, 17.40).** |
| Uniform timing | Grain on a 24 fps cadence; hand micro-motion on twos; one deliberate off-grid sound (6.03); hero events on the grid. |
| Corporate bed music | A whistled hook with a story (unfinished → finished → leaping), a music box that runs down, tuned SFX, a reharmonised payoff, three composed silences with three different meanings. |
| Mickey-mousing | At most 3 foreground sounds. Many events are silent. The camera is always silent. |
| Over-explaining | About 40 words of narrative copy. The habits act has no headlines; it runs on real UI states, stencils and pictures. |
| Logo slam, shine sweep | The logo is discovered: the window becomes the mark. No punch-zoom, no gloss sweep. |
| Lens flares, chromatic aberration, glitch transitions | None. The one digital artefact (LED banding) belongs to the antagonist. |
| "Becomes alive" stated, not shown | A measured ladder (§1): light sources, moving things, music layers and volt coverage all rise act by act. |

---

## 13. Review protocol (run on every rendered MP4, every round)

Watch the full film at 1×, then at 0.5×, then muted, then with eyes closed, then at 360 px wide. Then run:

1. **Poster test:** 8 random frames must each work as a still, with an identifiable light source and one focal point.
2. **Cause audit:** for every moving thing, name its physical cause. "It's an animation" means cut it.
3. **Volt budget:** zero volt pixels before f420. After that, volt only from the sources in §1 rule 5.
4. **Mute test:** the story reads from picture alone.
5. **Eyes-closed test:** the story reads from sound alone: music box → runs down → switch → silence → whistle (the missing note) → key → Dymo rhythm → stop → switch → tink → strum → groove → typing → glock → trend → ratchet → clicks → inhale → payoff → resolution.
6. **Silence test:** the WAV is exactly 0 between 6.40 and 7.20; below −45 dBFS from 15.15 to 15.60 except the switch; the hum, clicks and inhale only from 25.20 to 26.40.
7. **Rhyme diff:** S3 against S15 at matching frames. Only light, the words and blind heights may differ. **P = (1252, 528):** the last lit pixel of S3 (f314) and the centre of the "voice." lime dot (f1800+) must coincide within 1 px.
8. **First perfect register:** the sign's angle is exactly 0.00° from f1044 on.
9. **Sync:** every event in `timeline2.json` lands within ±2 frames of its audio onset; the `drive.json` hash matches `mix.wav`.
10. **Legibility at 360 px:** narrative ≥ 18 px, focal UI ≥ 9 px, URL ≥ 12 px.
11. **Luma floor:** mean luma ≥ 0.06 per shot, with the exceptions in §12.
12. **Truth check:** walk §11 line by line.
13. **Critique as five people** (commercial director, motion designer, editor, sound designer, brand designer). Log every note in `docs/review_log.md`, and fix anything that feels template-like, too clean, too empty, too repetitive, too predictable, too SaaS or under-detailed before the next round. **Minimum three rounds.**

---

## 14. Build order, prototype gate, and what to protect

1. **Audio first.** Write `timeline2.json` (the beat grid and every event), the `compose.py` cue, the stems, `drive.json`, and a beat-grid verify.
2. **Prototype gate: three frames to final quality before anything else.**
   - **f1032, the S12 poster frame:** slats opening, slat text, stripes on the pavement, sign.
   - **f390, the S4 moonlit absence:** slat shadows, coin shadow, slips.
   - **f1650, the S16 plan view:** road paint lit by the bands.

   If any of the three reads as cheap CG or AI imagery, fix the material system before building more.
3. S12 in full, at final quality.
4. Act I (S1–S4), including the S3 rhyme frame and calibrating P.
5. Act II (S5–S11).
6. S13–S14 (the one take).
7. S15–S17, with the rhyme diff and P check.
8. Critique rounds (§13).

**Protect at all costs:**
- S12;
- the S3/S15 rhyme and P;
- the missing note at 7.20;
- the whistle's quality;
- S16's two-tone-by-light;
- the S17 window → logo morph.

**Simplify first if time runs short:**
- S10 becomes a static insert (keep the digit roll).
- S13's five focus pulls become two (FAR → MID).
- S2's sun-shadow sweep becomes a cut-free luminance change.
- Drop the door's foreshortening at 9.00 (light wedge only).

---

## Appendix: if the music is ever a supplied track

The picture is authored in **bars and beats**, not seconds:
```
t(bar, beat) = phase + ((bar − 1)·4 + (beat − 1)) · period
```
If production licenses a pop track (for example the upload `audio/in/runaway.mp3`, measured at 87.161 BPM and period 0.68838 s), set `period` and `phase` from `audio/out/song_analysis.json`. The 54-beat structure then runs 37.2 s, so remove 6 beats to stay near 33 s:
- S2: −1 beat;
- S4: −1 beat;
- S13: −2 beats (merge "thinks" into "observes");
- S17: −2 beats.

The edit must still honour:
- the absence at bar 3;
- the stop at 7.1 with near-silence before the wake;
- the wake on a downbeat (8.1);
- the chosen quiet at 11.3–12.1 with a count-in;
- the payoff on a downbeat (12.1).

**A commercial track needs a licence.** The synthesised "Window Song" is the claims-free master, and it is the only score this treatment fully specifies.
