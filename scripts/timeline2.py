"""Build timeline2.json for film2 from the music edit's measured grid (audio/out/music2.json).

Everything is authored in OUTPUT BEATS (ob) of the Runaway edit (87.0 BPM, beat = 0.6897 s).
t(ob) = T0_out + ob * P. Shot boundaries snap to the nearest 60 fps frame; events keep exact times.
Riff notes (piano) fall on even ob 0..24 except the silence at 8-9; the drop is ob 25; bars of the groove start at ob 25, 29, 33, 37.
"""
import json, os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
M = json.load(open(os.path.join(ROOT, 'audio', 'out', 'music2.json')))
T0, P, FPS = M['T0_out'], M['P'], 60

def t(ob): return round(T0 + ob * P, 4)
def frame(ob): return round(round((T0 + ob * P) * FPS) / FPS, 4)

# --- shots (ob start, ob end) ------------------------------------------------------------------------------------------------
SHOTS = [
    ('s01-launch',    0.0,  4.0,  'FAÇADE day · "Launching a coin takes seconds."'),
    ('s02-exists',    4.0,  6.0,  'FAÇADE · Orbit window MCU · time-lapse to blue hour'),
    ('s03-quiet',     6.0,  8.5,  'FAÇADE rhyme frame · "Then it goes quiet."'),
    ('s04-absence',   8.5,  10.0, 'UNIT A · moonlight · slips · first volt pixel'),
    ('s05-voice',     10.0, 12.0, 'UNIT A · door glass · Voice silhouette'),
    ('s06-oneone',    12.0, 14.0, 'UNIT A · "One coin. One X Manager." · door opens'),
    ('s07-brain',     14.0, 16.0, 'UNIT A · leaning panes · GIVE IT A BRAIN.'),
    ('s08-character', 16.0, 18.0, 'DESK · GIVE IT A CHARACTER.'),
    ('s09-bounds',    18.0, 20.0, 'UNIT A · wall plate · GIVE IT BOUNDARIES.'),
    ('s10-budget',    20.0, 22.0, 'UNIT A · meter · GIVE IT A BUDGET.'),
    ('s11-launch',    22.0, 23.5, 'DESK press → UNIT B sign + slats close'),
    ('s12-wake',      23.5, 29.0, 'EXTERIOR · THE MANAGER WAKES UP'),
    ('s13-habits',    29.0, 37.0, 'UNIT B one take · observe · think · draft · interact · learn'),
    ('s14-restraint', 37.0, 39.0, 'UNIT B · the trend · chooses not to act'),
    ('s15-choice',    39.0, 41.0, 'FAÇADE rhyme frame · "Now quiet is a choice."'),
    ('s16-voice',     41.0, 45.0, 'STREET plan · "One coin. A voice of its own."'),
    ('s17-end',       45.0, 52.0, 'window → logo · tryvoice.fun · @tryvoice'),
]

# --- events: (id, ob, sfx or None, what, target selector or None) --------------------------------------------------------------
E = []
def ev(i, ob, sfx=None, what='', target=None, **kw):
    E.append(dict(id=i, ob=ob, t=t(ob), sfx=sfx, what=what, target=target, **kw))

# Act I — the riff's E group (piano on ob 0, 2, 4, 6)
for n, (o, pan) in enumerate([(0.25, -0.6), (0.5, 0.3), (1.0, -0.2), (1.25, 0.7), (1.75, -0.8), (2.25, 0.5), (2.5, -0.4), (3.0, 0.1)]):
    ev(f'card-{n + 1}', o, 'card_thup', 'coin card taped into a window', pan=pan)
ev('card-orbit', 3.5, 'card_thup', 'Orbit $ORBIT taped last, ground floor c2', pan=0.35, accent=True)
for n, (o, w) in enumerate([(0.0, 'Launching'), (0.5, 'a coin'), (1.0, 'takes'), (1.5, 'seconds.')]):
    ev(f'word-{n + 1}', o, 'tape_rasp', f'window vinyl "{w}" peeled on')
ev('orbit-mcu', 4.0, None, 'dolly lands on Orbit window (piano E6)')
ev('tape-lift', 5.25, 'crackle', 'tape corner lifts, card sags')
ev('live-dies', 5.5, None, 'LIVE dot blinks once and dies')
for n, o in enumerate([5.75, 5.875, 5.9375]):
    ev(f'tube-{n + 1}', o, 'tube_tink', 'cold tube lights flick on')
ev('quiet-lit', 6.0, None, '"Then it goes quiet." lit (piano low E5)')
ev('then-off', 7.0, 'relay', '"Then" and its unit click off')
ev('itgoes-off', 7.5, 'relay', '"it goes" clicks off')
ev('g12-dies', 7.75, 'relay', 'G·12 dies')
ev('quiet-dies', 8.0, None, '"quiet." flickers and dies — silence begins')
ev('stop-dies', 8.4, None, 'the full stop of "quiet." dies last (P)')
ev('slip-now', 9.0, 'paper_slide', 'slip "now" slides under the door (stops 30 ms late)')
ev('first-volt', 9.85, None, 'first volt pixel: 1 px line under the door')
# Act II — Voice; riff resumes at C#6 (ob 10, 12, 14), C#5 (16), A5 (18, 20), G#5 (22), E6 pickup (24)
ev('voice-door', 10.0, None, 'door glass blooms; logo silhouette (piano C#6)')
ev('oneone-lit', 12.0, None, '"One coin. One X Manager." revealed at bloom peak (piano C#6)')
ev('key-1', 12.5, 'key', 'key turns'); ev('key-2', 12.75, 'key', 'key turns')
ev('door-open', 13.5, 'hinge', 'door opens; volt wedge sweeps the floor')
ev('luna-pick', 14.0, 'glass_tink', 'GPT-6 Luna pane lifted into the light (piano C#6)')
ev('dymo-brain-a', 14.5, 'dymo_ghost', '"GIVE IT"'); ev('dymo-brain-b', 15.0, 'dymo_slap', '"A BRAIN."')
ev('humor-drag', 16.25, 'detents', 'Humor 50 → 87 → 85 (piano C#5)', dur=0.65)
ev('dymo-char-a', 16.5, 'dymo_ghost', '"GIVE IT"'); ev('dymo-char-b', 17.0, 'dymo_slap', '"A CHARACTER."')
for n, o in enumerate([18.25, 18.375, 18.5]):
    ev(f'toggle-{n + 1}', o, 'switch_thock', ['Read mentions', 'Community interaction', 'Relationship memory'][n] + ' OFF → ON')
ev('dymo-bound-a', 18.75, 'dymo_ghost', '"GIVE IT"'); ev('dymo-bound-b', 19.0, 'dymo_slap', '"BOUNDARIES."')
ev('odometer', 20.25, 'ratchet', 'Daily maximum 0.00 → 5.00', dur=0.5)
ev('dymo-budget-a', 20.5, 'dymo_ghost', '"GIVE IT"'); ev('dymo-budget-b', 21.0, 'dymo_slap', '"A BUDGET."')
ev('sign-press', 22.0, 'button_thock', 'Review & sign in wallet pressed (piano G#5); fingerprint stays')
ev('sign-hang', 22.75, 'cord', 'PAUSED sign drops behind the glass')
ev('slats-close', 23.25, 'blinds_cascade', 'slats close top-to-bottom: the room closes its eyes')
ev('switch-go', 23.75, 'switch', 'light switch inside: the creator says go; ember')
# Act III — the wake
ev('ignition', 24.0, 'tungsten', 'pulse filament ignites behind closed slats (piano E6 pickup)')
ev('slat-creak', 24.5, 'creak', 'thermal slat creak; slat instructions read in silhouette')
ev('drop', 25.0, 'strum', 'THE DROP: slats open in a wave, stripes race to the lens')
ev('running', 25.25, 'dot_tik', 'pill: Paused until you say go → Running · Approval Mode')
ev('sign-plumb', 26.0, None, 'sign settles at exactly 0.00° (first perfect register)')
ev('first-words', 26.25, None, '"Your manager is active. Its launch hour has started." lights')
for n, (o, pan) in enumerate([(27.0, -0.7), (27.25, -0.4), (27.75, 0.6)]):
    ev(f'neighbour-{n + 1}', o, 'far_click', 'neighbour window answers', pan=pan)
ev('drip-1', 27.1, 'drip', 'drip from the sill into the puddle')
ev('the-look', 28.0, 'ratchet_small', 'slats tilt down: it looks at us')
ev('lens-stripe', 28.5, None, 'a stripe crosses the lens (+10% exposure, 5 frames)')
# Act IV — habits (one take)
for n, (o, pan) in enumerate([(29.0, 0.5), (29.25, 0.2), (29.75, 0.7), (30.0, 0.35), (30.125, 0.6), (30.375, 0.1)]):
    ev(f'mention-{n + 1}', o, 'far_click', 'window across the street lights: a mention', pan=pan)
ev('row-read', 30.0, None, 'Decisions: Read mentions · Complete · Example')
ev('recall-joke', 30.75, None, 'lamp pool slides to JOKE plaque')
ev('recall-lore', 31.25, None, 'lamp pool slides to LORE plaque')
ev('draft-type', 32.0, 'typing', 'approval card types its draft word by word', dur=1.35)
ev('approve', 33.5, 'ui_click', 'Approve & publish pressed')
ev('published', 34.0, 'publish', 'row: Original post · Published · Example')
ev('reply', 34.25, None, 'row: Reply · Published · Example')
ev('wave-back', 34.5, 'far_click', 'one window across the street flicks twice; its blind lifts', pan=0.75)
ev('more-like', 35.0, 'ui_click', 'More like this pressed')
ev('toast', 35.25, None, 'toast: Saved as "more like this"…')
ev('pin', 36.0, 'tape_slap', 'card pinned to the plaque wall, corrected to 0.0°')
# Act V — restraint, choice, payoff
ev('trend', 37.0, 'trend', 'rooftop LED trend flares (the only out-of-key sound)')
ev('tempted', 37.25, None, 'slats tilt toward the screen; lamp rises 15%')
ev('choice', 38.0, 'blinds_ratchet', 'it chooses: slats tilt shut; band filter closes')
ev('row-nothing', 38.5, None, 'row: Chose to do nothing · No action · Example')
ev('silence-2', 39.0, None, 'the band is gone: chosen quiet (cut to S15)')
ev('now-lit', 39.5, None, '"Now" lights')
ev('choice-lit', 40.0, None, '"is a choice." lights volt (piano E6, the song\'s own ending)')
ev('payoff', 41.0, 'strum', 'PAYOFF: vocoder outro; 16 light bands bloom across the street')
ev('drip-2', 43.0, 'drip', 'drip ring in the puddle')
ev('neighbour-4', 44.0, 'far_click', 'a neighbour switches on', pan=-0.6)
ev('logo-morph', 45.0, None, 'window becomes the logo')
ev('lockup', 46.25, None, 'voice. lights letter by letter; lime dot on P')
ev('url', 46.75, None, 'tryvoice.fun')
ev('handle', 47.25, None, '@tryvoice')
ev('band-stop', 49.0, None, 'band stops; the final piano E rings (the song\'s last note)')
ev('exhale', 50.5, None, 'tile light dims last (−30%)')

TL = dict(
    title='Voice — One coin. A voice of its own.',
    page='film2/index.html',
    fps=FPS,
    duration=round(round(M['duration'] * FPS) / FPS, 4),
    motionBlurSubframes=1,
    audio=dict(music='audio/out/music2.wav', grid='audio/out/music2.json', sfx='audio/out/sfx2.wav', mix='audio/out/mix2.wav',
               song='Kanye West feat. Pusha T — "Runaway" (user-supplied; licence is the client\'s responsibility)',
               bpm=M['bpm'], targetLufs=-14, truePeakMax=-1),
    grid=dict(T0=T0, P=P, beats=M['beats']),
    formats={'16x9': dict(w=1920, h=1080, ship=True)},
    shots=[dict(id=i, ob=[a, b], start=0.0 if a == 0 else frame(a), end=frame(b), what=w) for i, a, b, w in SHOTS],
    events=E,
)
out = os.path.join(ROOT, 'timeline2.json')
json.dump(TL, open(out, 'w'), indent=1, ensure_ascii=False)
print(f"timeline2.json: {TL['duration']} s, {len(SHOTS)} shots, {len(E)} events")
for s in TL['shots']:
    print(f"  {s['id']:14s} {s['start']:7.3f}–{s['end']:7.3f}  ({s['end'] - s['start']:.2f} s)")
