# Style guide — Voice film

Everything here is measured from tryvoice.fun (`capture/site/*.json`, vendored stylesheet `assets/vendor/voice-site.css`). The film adds camera, light, depth and time, never new brand.

## Palette (CSS custom properties on the live site)
| Token | Value | Film use |
|---|---|---|
| `--void` | `#040405` | Background. Every frame starts from it. |
| `--ink-1…4` | `#0a0a0c` `#101013` `#17171b` `#1f1f24` | Panel fills (via the site's own `.panel` glass) |
| `--text` | `#f5f5ef` | Primary type |
| `--text-2` | `#c2c2ba` | UI body |
| `--text-3` | `#8a8a84` | Second line of two-tone headlines, eyebrows |
| `--text-4` | `#5d5d59` | The flat "quiet" timeline |
| `--volt` | `#d4ff3f` | **The one accent.** Pulse, logo tile, primary buttons, live states |
| `--volt-2` / `--volt-deep` / `--volt-ink` | `#b9f22b` / `#6f9a10` / `#0b0f02` | Gradients, text on lime |
| `--ice` | `#a8e9ff` | Secondary UI only (treasury eyebrow, info pills, approval-mode pill). Never a hero colour. |
| `--danger` | `#ff6d5e` | Only where the real UI shows it (Emergency stop) |
| Ambient | `radial(#d4ff3f17)` top-left, `radial(#a8e9ff0e)` top-right, `radial(#d4ff3f0b)` bottom | The site's `body:before` lighting, re-used as the film's room light |
| Grain | SVG fractal noise at 4.5% | The site's `body:after` texture, static (deterministic) |

Not used: purple, cyan glows, rainbow gradients, particles, light leaks.

## Type
| Role | Font | Settings |
|---|---|---|
| Display / captions | Bricolage Grotesque (variable, opsz 12–96) | weight 740, tracking −0.052em, leading 0.92 — exactly the site's `h1` (`109px / 740 / −5.69px`) |
| Accent phrase | Bricolage, `.hero-accent` gradient | `linear-gradient(100deg, #f3ffc4, #d4ff3f 38%, #b7f22a 70%, #e8ffa3)` clipped to text |
| Second line | Bricolage, `--text-3` | The site's two-tone headline device ("Three moves. / One living coin.") |
| Eyebrows | Geist Mono 500 | uppercase, tracking 0.16em, `--text-3` or `--volt` |
| UI | Geist 300–700 | as the product renders it |
| Wordmark | Bricolage 700, tracking −0.06em, "voice" + lime "." | site `.brand` |

Caption sizes (1920×1080): 112–132 px display, 24–26 px eyebrows. Phone check: the 16:9 film viewed 360 px wide in the X mobile timeline is scaled ×0.1875, so key copy is set ≥ 96 px (≥ 18 px on phone) and focal UI text ≥ 56 px (≥ 10.5 px on phone).

Copy rules: max 2 lines, max ~6 words per line, one accent phrase per caption, sentence case with a full stop (the site's voice).

## Logo
`voice-mark`: 32×32 rounded square (rx 10) with gradient `#f2ffbf → #d4ff3f 55% → #a9e62a`, pulse path `M6.5 16h3l2.2-5.5 3.6 12 3.4-15 3 11 1.8-2.5h2` stroked `#0b0f02` 2.4, round caps/joins. The pulse path is the film's transition device: flatline → pulse → mark.

## Surfaces & depth
- Panels are the site's own `.panel` glass: `--glass-1` + `--glass-fill`, 1 px `--line`, `--shadow-2/3`, backdrop blur 22 px.
- Depth comes from perspective (camera 1600–2200 px), layer separation (caption plane / UI plane / far ambient plane), real shadows (`--shadow-3`), and parallax. Glow is only used where the product uses it (lime buttons, coin avatar).
- Max tilt while text must be read: 14° Y, 8° X. Steeper only during transitions.

## Motion
- Clock: `window.seek(t)` only. Springs are closed-form (no integration state).
- Spring presets (`engine/motion.js`): `snap` (UI controls), `soft` (panels), `heavy` (cards/camera), `type` (masked word rise), `firm` (no overshoot).
- Easing: site tokens `--ease (.2,.8,.2,1)` and `--ease-in-out (.65,0,.35,1)`.
- Type: per-word masked rise with 6–10 px blur-to-sharp, 40–70 ms stagger, landing on the beat. Word swaps roll vertically inside a fixed mask (odometer).
- Transitions are physical: the logo tile becomes the coin avatar; the wizard panel persists while its content morphs; the decision feed collapses into the pulse line that becomes the logo.
- Motion blur: velocity-proportional blur on the moving element itself (captions, pages, tile flight) and on camera moves (computed analytically from the pose track at t and t+1/120 s). Frame blending was tried in round 1 and removed: two-sample blending ghosted fast type into double exposures.
- Forbidden: fades as the only move, slide-from-left everything, bouncy UI, spins, glitch, light leaks, particle bursts.

## Sound
Original score (`audio/compose.py`, D minor, 120 BPM). Formant "ah/oo/eh" voice pad = the Voice motif. Two silences carry meaning: bar 2 (the coin goes quiet — the music dies) and bar 11 (the manager *chooses* quiet — the music stops dead). UI SFX are synthesised per event from `timeline.json` (click, tick, pop, whoosh, thump, shutter), never stacked more than two at once.

## Format
16:9 only (1920×1080, 60 fps) — composed for desktop, X and website embeds. Default blocking: caption plane left (x 128–860), product plane right with perspective turned toward the caption; full-width centred compositions for the hook, reveal and end card.
