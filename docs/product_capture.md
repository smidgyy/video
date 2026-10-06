# Product capture — what is real, what is reconstructed

Source of truth: https://tryvoice.fun, captured 2026-10-06 with Playwright (Chromium, 1440×900 @2x).

## Captured (`capture/`)
| What | How | Where |
|---|---|---|
| Full pages: home, /launch, /dashboard, /model-selection, /treasury, /explore, /token/* | full-page screenshots + DOM + CSS tokens | `capture/site/*.png|html|json` |
| Example control room `/agent/orbit`, every tab (Coin overview, Teach Manager, Live activity, Performance, Memory, Personality, Change Brain, Treasury, X account, Settings) | clicked through, screenshots + `main` DOM + text | `capture/site/tabs/` |
| Production stylesheet `index.DVedYikm.css` | downloaded, sanitised (transitions/animations removed, vw/vh frozen to 1440×900) | `assets/vendor/voice-site.css` |
| Fonts: Bricolage Grotesque, Geist, Geist Mono (OFL, Google Fonts — exactly as the site loads them) | vendored woff2 | `assets/fonts/` |
| Logo (`voice-mark` SVG: gradient tile + pulse path) and wordmark | from DOM | used in `film/` |
| Lucide icons used by the product | extracted from DOM | `assets/brand/lucide.json` |
| Component fragments (stepper, coin preview, brain cards, presets, sliders, permission switches, mode choices, treasury stats, command deck, decisions, approval queue, memory, home "Manager decision" card) | outerHTML from captured pages | `capture/fragments/` |
| Product copy (wizard steps, statuses, toasts, feedback strings) | string literals from the shipped JS bundles | `capture/js/` |

## How the film uses it
The film does **not** animate screenshots. It renders the product's own markup with the product's own stylesheet and fonts, so the UI is pixel-faithful and sharp at any camera distance, and its controls can genuinely change state (fields type, toggles flip, sliders move, pills change).

## Reconstructed (and why)
| Element | Why | Faithfulness |
|---|---|---|
| Wizard Part 1 Identity / Story fields | `/launch` is wallet-gated; the step content cannot be captured without a wallet | Built from the site's own `.field` / `.input` styles, the real step names (bundle: `Identity`, `Story & links`), real validation copy ("Describe your coin in at least 10 characters.") and the real button text "Continue to Part 2 · Give it a voice". |
| Wizard Part 2 pages (Connect Official X, Choose Brain / Model, Personality, X Action Permissions, Budget / Funding, Review) | same (wallet-gated) | Each page reuses the real component that the control room shows for the same setting (brain cards, voice presets + sliders, permission cards, Human control choices, treasury funding + stats). All titles/labels/descriptions are real strings from the bundle. Eyebrow format copied from Part 1 (`PART 1 · CREATE YOUR COIN · STEP 1 OF 16`); Part 2 label "GIVE IT A VOICE" comes from the product's own "Continue to Part 2 · Give it a voice". |
| "Connected X account" row | OAuth flow not capturable | Built from the X-account tab card (`𝕏 @orbitonsolana`) + the real strings "Connecting…", "Connected X account", "You'll authorize Voice on X. Only the permissions granted there become available to your agent." |
| Review sheet | wallet-gated | Real strings: "Review Coin + X Manager", "Review your coin and its saved voice before launch.", "Review & sign in wallet", "Prepare launch transaction", "Wallet sign". |
| Approval-queue reply draft | the example queue shows an original post | Real `.draft-card` structure for replies from the bundle: `draft-head` ("Reply · community"), `blockquote.draft-context` ("Replying to …"), `draft-text`, `draft-why` ("Why this action?"), real action buttons and feedback chips. The mention text, the reply and the reason are **demo content written for the film**. |
| Decision feed rows | real example rows | Real copy from the example control room, with "Example" tags kept. Time stamps changed to "now / 1 min ago / 4 min ago / 12 min ago" so they read as the launch hour. |
| Control room meta line | the example uses GPT-6.1 Sol / CT Degen | Shows what this film's creator configured: GPT-6 Luna (the only brain the live site marks Verified · Ready) and CT Native (the current personality preset name). |

## Deliberately not shown
- Creator-fee replenishment of the operating balance (no live UI yet; depends on settlement infrastructure).
- Image / video generation, external research (exist as permissions in the bundle, not shown as configured on the example manager).
- Autonomous Mode in action: the film selects Approval Mode, the product default ("Starts paused", "Approval first").
- On-chain confirmation: the launch beat ends at "Your signed transaction has been submitted.". The live state is shown inside the product's own **Example control room**, whose banner reads "activity is illustrative and it holds no funds".
- Brains from other providers: the bundle contains a Claude Sonnet 5.5 card, but the live model page only lists OpenAI models, so only those appear.
- Real X accounts or metrics: `@orbitonsolana` and `@cosmicdegen` are the product's own example handles; no follower counts or engagement numbers are shown.
