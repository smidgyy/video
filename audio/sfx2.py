"""v2 sound design: every SFX is placed from timeline2.json, built from real recordings (CC0: VSCO-2 CE concert
percussion + mallets, Dirt-Samples drum machines and kits) or small physical models, tuned to the song's E major,
and sent through one shared small room so music and SFX sit in the same space. Nothing makes a sound without a cause.
Output: audio/out/sfx2.wav (float32, 48 kHz stereo) + audio/out/sfx2.json (what was placed where).
"""
import json, os, sys
import numpy as np
import soundfile as sf
from fractions import Fraction
from scipy import signal

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import sampler as S
import instruments as I
import seq as Q

SR = 48000
TL = json.load(open(os.path.join(ROOT, 'timeline2.json')))
DUR = TL['duration']
N = int(DUR * SR) + SR
R = np.random.default_rng(2026)   # seeded: deterministic build

ORCH = S.Kit('hf/drumstudio-mallet-samples/orchestral-perc')
MAL = S.Kit('hf/drumstudio-mallet-samples/mallet-studio')
K909 = S.Kit('hf/drumstudio-vintage-samples/vintage-909')
LOFI = S.Kit('lofi-boom-bap')
ACOU = S.Kit('studio-acoustic')

def mtof(m): return 440 * 2 ** ((m - 69) / 12)
def env(n, a=0.002, tau=0.05):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / tau)
def filt(x, kind, f, order=2):
    sos = signal.butter(order, f, kind, fs=SR, output='sos'); return signal.sosfilt(sos, x)
def trim(x, sec, fade=0.01):
    x = x[: int(sec * SR)].copy(); k = min(len(x), int(fade * SR)); x[-k:] *= np.linspace(1, 0, k); return x
def shift(x, st):
    if not st: return x
    fr = Fraction(2 ** (st / 12)).limit_denominator(300); return signal.resample_poly(x, fr.denominator, fr.numerator)
def noise(sec): return R.standard_normal(int(sec * SR))
def sine(f, sec, f1=None):
    n = int(sec * SR); fq = np.full(n, f) if f1 is None else np.geomspace(f, f1, n)
    return np.sin(2 * np.pi * np.cumsum(fq) / SR)
def mix(*parts):
    n = max(len(p) for p in parts); y = np.zeros(n)
    for p in parts: y[: len(p)] += p
    return y
def at(x, sec):   # delay a mono sound by sec
    return np.concatenate([np.zeros(int(sec * SR)), x])

# ---------------------------------------------------------------- sound recipes (mono unless noted)
def card_thup(accent=False):
    b = filt(filt(trim(ACOU.hit('Brush Snare Ghost', 0.5), 0.14), 'low', 2400), 'high', 160)
    flutter = filt(noise(0.012), 'band', [4000, 8000]) * env(int(0.012 * SR), 0.0005, 0.004) * 0.25
    body = sine(140, 0.05) * env(int(0.05 * SR), 0.001, 0.015) * (0.5 if accent else 0.3)
    return mix(b * (1.0 if accent else 0.75), at(flutter, 0.03), body)
def tape_rasp():
    n = int(0.14 * SR); x = np.zeros(n); idx = R.integers(0, n, 70); x[idx] = R.uniform(-1, 1, 70)
    return filt(x, 'band', [2000, 6000]) * np.linspace(0.6, 1, n) * 0.6
def crackle():
    n = int(0.11 * SR); x = np.zeros(n); idx = np.sort(R.integers(0, n, 6)); x[idx] = R.uniform(0.5, 1, 6) * R.choice([-1, 1], 6)
    return filt(x, 'band', [1500, 7000]) * 0.8
def tube_tink():
    t = filt(shift(trim(ORCH.hit('Triangle Sm', 0.35), 0.18, 0.08), 5), 'high', 2500)
    return t * env(len(t), 0.0005, 0.05) * 0.5
def relay():
    return mix(filt(LOFI.hit('DR-55 Rim', 0.6), 'low', 5000) * 0.8, sine(90, 0.04) * env(int(0.04 * SR), 0.001, 0.012) * 0.6)
def paper_slide():
    n = int(0.26 * SR); x = filt(noise(0.26), 'band', [700, 5200]); e = np.sin(np.linspace(0, np.pi * 0.85, n)) ** 1.5
    stop = np.ones(n); k = int(0.215 * SR); stop[k:] = np.exp(-np.arange(n - k) / SR / 0.008)   # the friction stop (30 ms late: a hand)
    return x * e * stop * 0.35
def key():
    r = shift(trim(K909.hit('909 Rim', 0.8), 0.05), 5)
    ring = filt(shift(trim(ORCH.hit('Triangle Sm', 0.3), 0.07, 0.04), 9), 'high', 3000) * 0.35
    return mix(r * 0.7, ring)
def hinge():
    n = int(0.42 * SR); x = noise(0.42); y = np.zeros(n)
    for f0, f1, g in ((420, 520, 1.0), (690, 760, 0.6)):
        fs = np.geomspace(f0, f1, n)
        for i in range(0, n, 512):
            b_, a_ = signal.iirpeak(fs[i], 18, fs=SR); y[i:i + 512] += signal.lfilter(b_, a_, x[i:i + 512]) * g
    return y * np.sin(np.linspace(0, np.pi, n)) ** 2 * 0.25
def glass_tink():
    a = shift(trim(MAL.hit('Glock C7', 0.4), 0.7, 0.2), 1)            # C#7
    b = shift(trim(MAL.hit('Glock G6', 0.3), 0.5, 0.2), 13)           # G#7
    return mix(a * env(len(a), 0.0005, 0.22), b * env(len(b), 0.0005, 0.12) * 0.4) * 0.7
def dymo(accent):
    if not accent:
        return mix(filt(trim(K909.hit('909 Rim', 0.55), 0.05), 'low', 6000) * 0.55, filt(trim(K909.hit('909 Clap', 0.4), 0.08), 'high', 900) * 0.18)
    clap = filt(trim(LOFI.hit('Jazz Clap', 0.7), 0.16), 'high', 300)
    squeak = sine(2200, 0.03, 2650) * env(int(0.03 * SR), 0.004, 0.01) * 0.07
    return mix(clap * 0.75, trim(K909.hit('909 Rim', 0.7), 0.05) * 0.5, at(squeak, 0.06))
def ticks(times, st0=12, st1=None, gain=0.3, hp=2500):
    out = np.zeros(int((max(times) + 0.08) * SR))
    for i, tt in enumerate(times):
        st = st0 if st1 is None else st0 + (st1 - st0) * i / max(1, len(times) - 1)
        tk = filt(shift(trim(K909.hit('909 Rim', 0.6), 0.03), st), 'high', hp) * gain * (0.8 + 0.4 * R.random())
        j = int(tt * SR); out[j:j + len(tk)] += tk[: len(out) - j]
    return out
def switch_thock(far=False):
    tick = shift(trim(K909.hit('909 Rim', 0.8), 0.03), 7) * 0.6
    thud = filt(trim(ORCH.hit('Concert BD Soft', 0.4), 0.12), 'low', 300) * 0.9
    y = mix(tick, at(thud, 0.012), at(tick * 0.35, 0.05))
    return filt(y, 'low', 1500) * 0.5 if far else y
def button_thock():
    bd = filt(trim(ORCH.hit('Concert BD Soft', 0.6), 0.28), 'low', 420)
    rub = filt(noise(0.04), 'low', 900) * env(int(0.04 * SR), 0.001, 0.012) * 0.3
    return mix(bd * 1.0, trim(K909.hit('909 Rim', 0.5), 0.04) * 0.35, rub)
def cord():
    n = int(0.22 * SR); x = filt(noise(0.22), 'low', 3000); am = 0.5 + 0.5 * np.sin(2 * np.pi * 18 * np.arange(n) / SR)
    return x * am * np.sin(np.linspace(0, np.pi, n)) * 0.12
def blinds(n=16, span=0.2, gain=0.28):
    return ticks(list(np.linspace(0, span, n)), 10, 4, gain, 1500)
def light_switch(inside=False):
    tick = shift(trim(K909.hit('909 Rim', 0.9), 0.025), 6)
    thud = sine(120, 0.035) * env(int(0.035 * SR), 0.001, 0.01)
    y = mix(tick * 0.7, at(thud * 0.6, 0.006), at(tick * 0.25, 0.018))
    return filt(y, 'low', 2000) * 0.8 if inside else y
def tungsten():
    g = shift(trim(MAL.hit('Glock C7', 0.3), 0.18, 0.1), 4)       # E7, the home note
    return g * env(len(g), 0.0005, 0.06) * 0.35
def creak():
    n = int(0.32 * SR); x = filt(noise(0.32), 'band', [1000, 1600]); am = (0.5 + 0.5 * np.sin(2 * np.pi * 37 * np.arange(n) / SR)) ** 3
    return x * am * np.sin(np.linspace(0, np.pi, n)) * 0.2
STRUM = [52, 56, 59, 63, 64, 66, 68, 71, 75, 76, 78, 80, 83, 87, 88, 90]   # E major 9 arpeggio, low to high
def strum():
    out = np.zeros(int(1.4 * SR))
    for i, m in enumerate(STRUM):
        p = I.pluck(m, 0.5, bright=0.35, mute=0.75)
        p = p * env(len(p), 0.0005, 0.07)
        click = filt(noise(0.004), 'band', [2000, 5000]) * 0.15
        s_ = mix(p * 0.5, click); j = int(i * 0.031 * SR); out[j:j + len(s_)] += s_[: len(out) - j]
    return filt(out, 'high', 180) * 0.9
def dot_tik(): return sine(mtof(88), 0.004) * env(int(0.004 * SR), 0.0003, 0.002) * 0.25
def drip():
    n = int(0.09 * SR); return sine(mtof(83), 0.09, mtof(78)) * env(n, 0.001, 0.025) * 0.35
def typing(dur):
    times = []; tt = 0.0
    while tt < dur: times.append(tt + R.uniform(-0.004, 0.004)); tt += Q_P / 8   # 32nds of the song
    out = np.zeros(int((dur + 0.1) * SR))
    for k, tt in enumerate(times):
        kb = filt(noise(0.006), 'band', [1800, 6000]) * env(int(0.006 * SR), 0.0003, 0.002) * 0.22
        r = filt(shift(trim(K909.hit('909 Rim', 0.4), 0.025), R.uniform(-2, 2)), 'high', 1200) * 0.12
        s_ = mix(kb, r) * (0.75 + 0.5 * R.random()); j = max(0, int(tt * SR)); out[j:j + len(s_)] += s_[: len(out) - j]
    return out
def ui_click(): return mix(trim(K909.hit('909 Rim', 0.5), 0.03) * 0.4, filt(trim(ORCH.hit('Concert BD Soft', 0.3), 0.08), 'low', 250) * 0.3)
def publish():
    a = shift(trim(MAL.hit('Glock G6', 0.45), 0.9, 0.3), 4)       # B6
    b_ = shift(trim(MAL.hit('Glock C7', 0.5), 1.1, 0.4), 4)       # E7: the leap
    return mix(a * env(len(a), 0.0005, 0.3) * 0.55, at(b_ * env(len(b_), 0.0005, 0.45) * 0.7, Q_P / 4))
def tape_slap():
    tp = filt(noise(0.045), 'band', [1000, 4200]) * env(int(0.045 * SR), 0.001, 0.012) * 0.3
    th = filt(trim(ORCH.hit('Concert BD Soft', 0.35), 0.1), 'low', 220) * 0.5
    return mix(tp, at(th, 0.008))
def trend():
    n = int(0.5 * SR); t_ = np.arange(n) / SR; y = np.zeros(n)
    for m in (65, 72):                                  # F4 + C5: out of E major, the only dissonance
        for dc in (-0.18, 0.18):
            f = mtof(m) * 2 ** (dc / 12); y += 2 * ((t_ * f) % 1) - 1
    y = filt(y, 'low', 3000) * env(n, 0.004, 0.16) * 0.06
    buzz = filt(np.sign(np.sin(2 * np.pi * 60 * np.arange(int(0.7 * SR)) / SR)), 'low', 400) * 0.03 * np.linspace(1, 0, int(0.7 * SR))
    return mix(y, buzz)

Q_P = TL['grid']['P']
SPEC = {   # sfx key -> (builder, gain, reverb send, extra)
    'card_thup': (lambda e: card_thup(e.get('accent', False)), 0.55, 0.10),
    'tape_rasp': (lambda e: tape_rasp(), 0.30, 0.08),
    'crackle': (lambda e: crackle(), 0.30, 0.10),
    'tube_tink': (lambda e: tube_tink(), 0.30, 0.25),
    'relay': (lambda e: relay(), 0.40, 0.25),
    'paper_slide': (lambda e: paper_slide(), 0.55, 0.05),
    'key': (lambda e: key(), 0.45, 0.12),
    'hinge': (lambda e: hinge(), 0.50, 0.20),
    'glass_tink': (lambda e: glass_tink(), 0.45, 0.20),
    'dymo_ghost': (lambda e: dymo(False), 0.45, 0.10),
    'dymo_slap': (lambda e: dymo(True), 0.55, 0.12),
    'detents': (lambda e: ticks(list(np.arange(0, e.get('dur', 0.6), Q_P / 8)), 14, 14, 0.22, 3000), 0.6, 0.06),
    'switch_thock': (lambda e: switch_thock(), 0.45, 0.10),
    'ratchet': (lambda e: ticks(list(np.arange(0, e.get('dur', 0.5), Q_P / 8)), 14, 4, 0.28, 2000), 0.55, 0.08),
    'button_thock': (lambda e: button_thock(), 0.75, 0.12),
    'cord': (lambda e: cord(), 0.5, 0.10),
    'blinds_cascade': (lambda e: blinds(), 0.55, 0.12),
    'switch': (lambda e: light_switch(inside=True), 0.75, 0.25),
    'tungsten': (lambda e: tungsten(), 0.45, 0.30),
    'creak': (lambda e: creak(), 0.40, 0.15),
    'strum': (lambda e: strum(), 0.55, 0.18),
    'dot_tik': (lambda e: dot_tik(), 0.6, 0.10),
    'far_click': (lambda e: switch_thock(far=True), 0.40, 0.55),
    'drip': (lambda e: drip(), 0.40, 0.35),
    'ratchet_small': (lambda e: ticks(list(np.arange(7) * Q_P / 8), 12, 6, 0.22, 2000), 0.5, 0.08),
    'typing': (lambda e: typing(e.get('dur', 1.3)), 0.55, 0.08),
    'ui_click': (lambda e: ui_click(), 0.5, 0.08),
    'publish': (lambda e: publish(), 0.45, 0.25),
    'tape_slap': (lambda e: tape_slap(), 0.6, 0.10),
    'trend': (lambda e: trend(), 0.55, 0.15),
    'blinds_ratchet': (lambda e: ticks(list(np.arange(7) * Q_P / 8), 10, 3, 0.3, 1500), 0.55, 0.10),
}

# Level of each sound relative to the music's local peak (dB below it); ABS = absolute peak (dBFS) used when the
# music around the event is silent (the composed silences) or very quiet.
REL = dict(card_thup=-13, tape_rasp=-19, crackle=-20, tube_tink=-20, relay=-15, paper_slide=-14, key=-12, hinge=-16,
           glass_tink=-9, dymo_ghost=-17, dymo_slap=-11, detents=-16, switch_thock=-12, ratchet=-14, button_thock=-7,
           cord=-18, blinds_cascade=-12, switch=-9, tungsten=-18, creak=-17, strum=-9, dot_tik=-15, far_click=-15,
           drip=-13, ratchet_small=-15, typing=-12, ui_click=-13, publish=-7, tape_slap=-13, trend=-9, blinds_ratchet=-11)
ABS = dict(relay=-34, paper_slide=-27, tube_tink=-34, crackle=-34)
MUSIC = sf.read(os.path.join(HERE, 'out', 'music2.wav'))[0].mean(axis=1)
def music_peak_db(t, w=0.75):
    a, b_ = max(0, int((t - w) * SR)), int((t + w) * SR)
    seg = MUSIC[a:b_]
    return 20 * np.log10(np.abs(seg).max() + 1e-9) if len(seg) else -120

def build():
    dry = Q.Bus(N); send = Q.Bus(N); placed = []
    for e in TL['events']:
        k = e.get('sfx')
        if not k: continue
        fn, _, rv = SPEC[k]
        x = fn(e)
        x = x / (np.abs(x).max() + 1e-12)
        mp = music_peak_db(e['t'])
        target = mp + REL[k]
        if k in ABS and (mp < -20 or target > ABS[k] + 12): target = min(target, ABS[k]) if mp >= -20 else ABS[k]
        gain = 10 ** (target / 20)
        pan = float(e.get('pan', 0.0))
        dry.add(e['t'], x, gain=gain, pan=pan * 0.8, width=0.15)
        send.add(e['t'], x, gain=gain * rv, pan=pan * 0.8, width=0.3)
        placed.append(dict(id=e['id'], sfx=k, t=e['t'], peak_db=round(target, 1), music_local_db=round(mp, 1)))
    # night air under the exterior before the drop (outside, waiting) and a trace of street air in Act I
    air = filt(R.standard_normal(N), 'low', 300) * 10 ** (-58 / 20)
    def window(a, b_, fade=0.25):
        w = np.zeros(N); i0, i1 = int(a * SR), int(b_ * SR); w[i0:i1] = 1
        k = int(fade * SR); w[i0:i0 + k] = np.linspace(0, 1, k); w[i1 - k:i1] = np.linspace(1, 0, k); return w
    T = TL['grid']['T0']; P = Q_P
    bed = air * (window(T, T + 6 * P, 0.4) * 0.7 + window(T + 23.5 * P, T + 25 * P, 0.15))
    out = dry.out() + Q.convolve(send.out(), Q.make_ir(rt60=0.45, length=1.2, predelay=0.008, bright=7000, seed=5), wet=1.0)
    out += np.stack([bed, bed], axis=1)
    # composed silences stay silent: digital zero in the absence (except the paper slip) and in the chosen quiet
    for a, b_ in ((T + 8.15 * P, T + 8.95 * P), (T + 9.4 * P, T + 10 * P - 0.015), (T + 39.05 * P, T + 40 * P - 0.015)):
        out[int(a * SR):int(b_ * SR)] = 0
    return out, placed

if __name__ == '__main__':
    y, placed = build()
    sf.write(os.path.join(HERE, 'out', 'sfx2.wav'), y.astype(np.float32), SR, subtype='FLOAT')
    json.dump(placed, open(os.path.join(HERE, 'out', 'sfx2.json'), 'w'), indent=1)
    print(f'sfx2.wav {len(y) / SR:.2f} s, {len(placed)} sounds, peak {np.abs(y).max():.3f}')
