"""Original music bed for the Voice film. Fully procedural, seeded, 48 kHz stereo.

Structure (120 BPM, 4/4, bar = 2.0 s, 12 bars = 24.0 s):
  bar 1  0-2   HOOK    launch is loud: kick, sub, bright pluck arp, Dm9
  bar 2  2-4   QUIET   music cut; dark tail decays; faint clock ticks; thin flatline tone
  bar 3  4-6   REVEAL  heartbeat thump @4.5 -> reverse swell -> HIT @5.0 (Bbmaj9 + voice pad)
  bar 4-6 6-12 BUILD   groove adds layers bar by bar (Fmaj9, C/E, Dm9)
  bar 7 12-14  RISE    Bbmaj9, riser, drums drop @13.5 -> HIT @14.0
  bar 8-10 14-20 ALIVE full groove, formant vocal chops (the 'voice' motif)
  bar 11 20-22 CHOICE  dead stop 20-21 (chosen silence), swell 21-22
  bar 12 22-24 END     final Fmaj9(13) hit, decays to silence before 24.0
Run: python3 -I audio/compose.py  -> audio/out/music.wav, audio/out/score.json
"""
import json, os, sys
import numpy as np
from scipy import signal
from scipy.io import wavfile

SR = 48000
BPM = 120.0
BEAT = 60.0 / BPM
BAR = 4 * BEAT
DUR = 24.0
N = int(DUR * SR)
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out')
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(20261006)

def b2t(bar, beat=0.0):
    """bar is 1-based, beat 0-based (fractional allowed)."""
    return (bar - 1) * BAR + beat * BEAT

def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)

def stereo(x, pan=0.0):
    l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
    return np.stack([x * l * 1.4142, x * r * 1.4142], axis=1)

class Bus:
    def __init__(self):
        self.buf = np.zeros((N + SR * 4, 2))
    def add(self, t, x, gain=1.0, pan=0.0):
        if x.ndim == 1:
            x = stereo(x, pan)
        i = int(round(t * SR))
        if i < 0:
            x = x[-i:]; i = 0
        j = min(i + len(x), len(self.buf))
        self.buf[i:j] += x[: j - i] * gain
    def out(self):
        return self.buf[:N]

# ---------------- oscillators ----------------
def polyblep_saw(freq, n, phase0=0.0):
    f = np.broadcast_to(np.asarray(freq, dtype=float), (n,))
    dt = f / SR
    ph = (phase0 + np.cumsum(dt)) % 1.0
    y = 2 * ph - 1
    m1 = ph < dt
    x = ph[m1] / dt[m1]; y[m1] -= x + x - x * x - 1
    m2 = ph > 1 - dt
    x = (ph[m2] - 1) / dt[m2]; y[m2] -= x * x + x + x + 1
    return y

def sine(freq, n, phase0=0.0):
    f = np.broadcast_to(np.asarray(freq, dtype=float), (n,))
    return np.sin(2 * np.pi * (phase0 + np.cumsum(f / SR)))

def env_adsr(n, a=0.005, d=0.1, s=0.7, r=0.2, hold=None):
    t = np.arange(n) / SR
    hold = (n / SR - r) if hold is None else hold
    e = np.where(t < a, t / max(a, 1e-6), 1.0)
    e = np.where((t >= a) & (t < a + d), 1 - (1 - s) * (t - a) / max(d, 1e-6), e)
    e = np.where((t >= a + d) & (t < hold), s, e)
    e = np.where(t >= hold, s * np.clip(1 - (t - hold) / max(r, 1e-6), 0, 1), e)
    return e

def exp_env(n, tau):
    return np.exp(-np.arange(n) / SR / tau)

# ---------------- filters ----------------
def sos_lp(fc, order=2): return signal.butter(order, min(fc, SR * 0.45), 'low', fs=SR, output='sos')
def sos_hp(fc, order=2): return signal.butter(order, fc, 'high', fs=SR, output='sos')
def sos_bp(lo, hi, order=2): return signal.butter(order, [lo, min(hi, SR * 0.45)], 'band', fs=SR, output='sos')

def sweep_lp(x, fc_curve, block=256, order=2):
    """Time-varying low-pass by block processing with carried state (offline, deterministic)."""
    y = np.zeros_like(x)
    zi = None
    for i in range(0, len(x), block):
        sos = sos_lp(float(fc_curve[min(i, len(fc_curve) - 1)]), order)
        if zi is None:
            zi = np.zeros((sos.shape[0], 2))
        y[i:i + block], zi = signal.sosfilt(sos, x[i:i + block], zi=zi)
    return y

def resonator_bank(x, formants):
    """Parallel 2-pole resonators: formants = [(freq, bw, gain)]"""
    y = np.zeros_like(x)
    for f, bw, g in formants:
        r = np.exp(-np.pi * bw / SR)
        th = 2 * np.pi * f / SR
        b = [1 - r]
        a = [1, -2 * r * np.cos(th), r * r]
        y += g * signal.lfilter(b, a, x)
    return y

def rbj(kind, f0, gain_db=0.0, q=0.707):
    A = 10 ** (gain_db / 40); w = 2 * np.pi * f0 / SR; c = np.cos(w); al = np.sin(w) / (2 * q)
    if kind == 'peak':
        b = [1 + al * A, -2 * c, 1 - al * A]; a = [1 + al / A, -2 * c, 1 - al / A]
    elif kind == 'lowshelf':
        sq = 2 * np.sqrt(A) * al
        b = [A * ((A + 1) - (A - 1) * c + sq), 2 * A * ((A - 1) - (A + 1) * c), A * ((A + 1) - (A - 1) * c - sq)]
        a = [(A + 1) + (A - 1) * c + sq, -2 * ((A - 1) + (A + 1) * c), (A + 1) + (A - 1) * c - sq]
    else:  # highshelf
        sq = 2 * np.sqrt(A) * al
        b = [A * ((A + 1) + (A - 1) * c + sq), -2 * A * ((A - 1) + (A + 1) * c), A * ((A + 1) + (A - 1) * c - sq)]
        a = [(A + 1) - (A - 1) * c + sq, 2 * ((A - 1) - (A + 1) * c), (A + 1) - (A - 1) * c - sq]
    return np.array(b) / a[0], np.array(a) / a[0]

def eq(x, bands_):
    for kind, f0, g, q in bands_:
        b, a = rbj(kind, f0, g, q)
        x = signal.lfilter(b, a, x, axis=0)
    return x

# ---------------- reverb ----------------
def make_ir(rt60=2.2, length=3.0, predelay=0.018, bright=7000, seed=7):
    r = np.random.default_rng(seed)
    n = int(length * SR)
    t = np.arange(n) / SR
    decay = np.exp(-6.91 * t / rt60)
    ir = np.zeros((n, 2))
    for c in range(2):
        nz = r.standard_normal(n)
        lo = signal.sosfilt(sos_lp(bright, 1), nz)
        dark = signal.sosfilt(sos_lp(1800, 1), nz)
        k = np.clip(t / length, 0, 1)
        ir[:, c] = (lo * (1 - k) + dark * k) * decay
    pd = int(predelay * SR)
    ir = np.concatenate([np.zeros((pd, 2)), ir])[:n]
    for c in range(2):  # early reflections
        for d, g in [(0.011, 0.5), (0.019, 0.35), (0.027, 0.28), (0.041, 0.2)]:
            ir[int((d + c * 0.003) * SR), c] += g
    return ir / np.sqrt((ir ** 2).sum(axis=0, keepdims=True))

IR_HALL = make_ir(2.4, 3.2, 0.022, 6500, 11)
IR_ROOM = make_ir(0.7, 1.0, 0.008, 9000, 12)

def reverb(x, ir, wet=0.3):
    if x.ndim == 1:
        x = stereo(x)
    y = np.stack([signal.fftconvolve(x[:, c], ir[:, c])[: len(x)] for c in range(2)], axis=1)
    return y * wet

# ---------------- instruments ----------------
def kick(strength=1.0, length=0.45):
    n = int(length * SR)
    t = np.arange(n) / SR
    f = 46 + 120 * np.exp(-t / 0.035) + 30 * np.exp(-t / 0.006)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.16)
    body = np.tanh(body * 1.8) / np.tanh(1.8)
    click = signal.sosfilt(sos_hp(2500), rng.standard_normal(n)) * np.exp(-t / 0.004) * 0.35
    return (body * 0.72 + click * 1.3) * strength

def boom(length=2.4, f0=58, f1=31):
    n = int(length * SR)
    t = np.arange(n) / SR
    f = f1 + (f0 - f1) * np.exp(-t / 0.25)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.7)
    x = np.tanh(x * 1.5)
    nz = signal.sosfilt(sos_lp(3000), rng.standard_normal(n)) * np.exp(-t / 0.05) * 0.4
    return x + nz

def heartbeat():
    n = int(0.5 * SR)
    t = np.arange(n) / SR
    f = 40 + 60 * np.exp(-t / 0.03)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.09)
    return np.tanh(x * 2.2) * 0.9

def hat(open_=False, strength=1.0):
    n = int((0.32 if open_ else 0.06) * SR)
    t = np.arange(n) / SR
    nz = rng.standard_normal(n)
    # metallic: sum of square-ish partials + noise
    metal = sum(np.sign(np.sin(2 * np.pi * f * t)) for f in (5340, 6890, 8120, 9930)) * 0.18
    x = signal.sosfilt(sos_hp(7000, 4), nz * 0.8 + metal)
    return x * np.exp(-t / (0.11 if open_ else 0.018)) * strength * 0.4

def clap(strength=1.0):
    n = int(0.4 * SR)
    t = np.arange(n) / SR
    x = np.zeros(n)
    for k, d in enumerate([0.0, 0.009, 0.018, 0.026]):
        i = int(d * SR)
        seg = rng.standard_normal(n - i) * np.exp(-np.arange(n - i) / SR / (0.006 if k < 3 else 0.09))
        x[i:] += seg
    x = signal.sosfilt(sos_bp(900, 2600), x)
    return x * strength * 0.9

def tick(strength=1.0):
    n = int(0.05 * SR)
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * 2900 * t) * np.exp(-t / 0.005) + signal.sosfilt(sos_hp(4000), rng.standard_normal(n)) * np.exp(-t / 0.002) * 0.4
    return x * strength

def pluck(m, length=0.5, bright=1.0, decay=0.32):
    f = mtof(m)
    n = int(length * SR)
    t = np.arange(n) / SR
    y = np.zeros(n)
    kmax = int(min(40, 9000 / f))
    for k in range(1, kmax + 1):
        amp = (1.0 / k) * (0.6 + 0.4 * np.cos(k * 0.9))
        y += amp * np.sin(2 * np.pi * f * k * t + k * 0.3) * np.exp(-t * (1 / decay + 7.5 * (k - 1) / bright))
    a = np.clip(t / 0.002, 0, 1)
    return y * a * 0.5

def supersaw_chord(notes, length, voices=5, detune=12.0, cutoff=2400, attack=0.4, release=0.8, cutoff_curve=None):
    n = int(length * SR)
    y = np.zeros(n)
    for m in notes:
        for v in range(voices):
            cents = (v - (voices - 1) / 2) / ((voices - 1) / 2) * detune
            y += polyblep_saw(mtof(m) * 2 ** (cents / 1200), n, phase0=rng.random()) / voices
    y /= max(1, len(notes)) ** 0.5
    if cutoff_curve is not None:
        y = sweep_lp(y, cutoff_curve)
    else:
        y = signal.sosfilt(sos_lp(cutoff, 2), y)
    e = env_adsr(n, a=attack, d=0.3, s=0.85, r=release)
    y = signal.sosfilt(sos_hp(190, 2), y)
    return y * e * 0.32

def voice_pad(notes, length, vowel='ah', attack=0.25, release=0.9, vib=5.2):
    """Formant-filtered saw chord: the film's 'voice' motif."""
    n = int(length * SR)
    t = np.arange(n) / SR
    src = np.zeros(n)
    for i, m in enumerate(notes):
        vibrato = 1 + 0.0035 * np.sin(2 * np.pi * vib * t + i) * np.clip(t / 0.4, 0, 1)
        src += polyblep_saw(mtof(m) * vibrato, n, phase0=rng.random())
        src += polyblep_saw(mtof(m) * vibrato * 1.004, n, phase0=rng.random()) * 0.7
    src += signal.sosfilt(sos_bp(1200, 5000), rng.standard_normal(n)) * 0.05  # breath
    F = {'ah': [(730, 90, 1.0), (1090, 110, 0.55), (2440, 170, 0.28), (3400, 250, 0.12)],
         'oo': [(300, 70, 1.0), (870, 100, 0.4), (2240, 160, 0.15), (3300, 250, 0.06)],
         'eh': [(530, 80, 1.0), (1840, 120, 0.5), (2480, 170, 0.3), (3500, 250, 0.12)]}[vowel]
    y = resonator_bank(src, F)
    y = signal.sosfilt(sos_hp(260, 2), y)
    e = env_adsr(n, a=attack, d=0.2, s=0.9, r=release)
    return y * e / max(1, len(notes)) * 0.9

def sub_bass(m, length, attack=0.01, release=0.08):
    n = int(length * SR)
    f = mtof(m)
    x = sine(f, n) + 0.25 * sine(2 * f, n) + 0.08 * sine(3 * f, n)
    x = np.tanh(x * 1.6) / np.tanh(1.6)
    return x * env_adsr(n, a=attack, d=0.05, s=1.0, r=release) * 0.27

def riser(length, f0=200, f1=4200, strength=1.0):
    n = int(length * SR)
    t = np.arange(n) / SR
    k = t / length
    nz = rng.standard_normal(n)
    curve = f0 * (f1 / f0) ** (k ** 1.6)
    y = sweep_lp(nz, curve, order=2) - sweep_lp(nz, curve * 0.35, order=2)
    tone = sine(mtof(57) * 2 ** (k * 1.0), n) * 0.12
    tail = np.clip((length - t) / 0.012, 0, 1)
    return (y * 0.7 + tone) * (k ** 2.2) * tail * strength

def reverse_swell(notes, length):
    pad = supersaw_chord(notes, length + 1.2, cutoff=3000, attack=0.01, release=0.5)
    wet = reverb(pad, IR_HALL, 1.0)
    rev = wet[: int(length * SR)][::-1]
    k = np.linspace(0, 1, len(rev))[:, None]
    return rev * k ** 1.5

# ---------------- score ----------------
CH = {
    'Dm9':    dict(pad=[50, 53, 57, 60, 64], bass=38, arp=[62, 65, 69, 72, 76, 69, 72, 65]),
    'Bbmaj9': dict(pad=[46, 50, 53, 57, 60], bass=34, arp=[58, 62, 65, 69, 72, 65, 69, 62]),
    'Fmaj9':  dict(pad=[53, 57, 60, 64, 67], bass=41, arp=[65, 69, 72, 76, 79, 72, 76, 69]),
    'C/E':    dict(pad=[52, 55, 60, 62, 67], bass=40, arp=[64, 67, 72, 74, 79, 72, 74, 67]),
    'Fmaj13': dict(pad=[53, 57, 60, 64, 67, 74], bass=41, arp=[65, 69, 72, 76, 79, 81, 76, 72]),
}
PLAN = {1: 'Dm9', 3: 'Bbmaj9', 4: 'Fmaj9', 5: 'C/E', 6: 'Dm9', 7: 'Bbmaj9', 8: 'Fmaj9', 9: 'C/E', 10: 'Dm9', 11: 'Bbmaj9', 12: 'Fmaj13'}

drums, bass, keys, pads, vox, fx = Bus(), Bus(), Bus(), Bus(), Bus(), Bus()
kicks = []
events = []  # musical hits for the score report

def K(t, s=1.0):
    drums.add(t, kick(s), 0.95); kicks.append(t)

# BAR 1 — hook, loud launch
K(0.0, 1.05)
for b in range(4):
    if b: K(b2t(1, b))
    drums.add(b2t(1, b + 0.5), hat(True, 0.7), 0.55, 0.15)
    for s in (0.25, 0.75):
        drums.add(b2t(1, b + s), hat(False, 0.6), 0.5, -0.2)
drums.add(b2t(1, 1), clap(0.9), 0.45); drums.add(b2t(1, 3), clap(0.9), 0.45)
bass.add(0.0, sub_bass(CH['Dm9']['bass'], BAR - 0.02), 1.0)
pads.add(0.0, supersaw_chord(CH['Dm9']['pad'], BAR, attack=0.004, cutoff=4200, release=0.25), 0.9)
for i in range(16):
    m = CH['Dm9']['arp'][i % 8] + (12 if i in (6, 14) else 0)
    keys.add(b2t(1, i * 0.25), pluck(m, 0.45, bright=1.3), 0.75 if i % 4 else 0.95, 0.3 * np.sin(i))
events.append(dict(t=0.0, name='hook-downbeat'))

# BAR 2 — quiet: cut at 2.0, faint ticks, thin flatline tone 2.45 -> 4.5
for tt, s in ((2.5, 0.25), (3.0, 0.3), (3.5, 0.28), (4.0, 0.32)):
    fx.add(tt, tick(s), 0.5, 0.25)
fl_len = 4.5 - 2.45
n = int(fl_len * SR)
tt_ = np.arange(n) / SR
flat = sine(mtof(81), n) * np.clip(tt_ / 0.6, 0, 1) * np.clip((fl_len - tt_) / 0.02, 0, 1)
fx.add(2.45, signal.sosfilt(sos_lp(2400), flat) * 0.012, 1.0, 0.0)
events.append(dict(t=2.0, name='cut-to-quiet'))

# BAR 3 — heartbeat @4.5, swell, HIT @5.0
fx.add(4.5, heartbeat(), 0.9); fx.add(4.72, heartbeat() * 0.55, 0.9)
pads.add(4.0, reverse_swell(CH['Bbmaj9']['pad'], 1.0), 0.55)
fx.add(4.25, riser(0.75, 300, 6000, 0.6), 0.5)
K(5.0, 1.15); fx.add(5.0, boom(2.2), 0.7)
pads.add(5.0, supersaw_chord(CH['Bbmaj9']['pad'], 1.0, attack=0.003, cutoff=5200, release=0.3), 1.0)
vox.add(5.0, voice_pad(CH['Bbmaj9']['pad'][1:], 1.05, 'ah', attack=0.02, release=0.4), 0.9)
bass.add(5.0, sub_bass(CH['Bbmaj9']['bass'], 1.0), 1.0)
for i in range(4):
    keys.add(5.0 + i * BEAT / 2, pluck(CH['Bbmaj9']['arp'][i * 2], 0.5, 1.4), 0.7, (-0.3, 0.3)[i % 2])
K(5.5, 0.8); drums.add(5.75, hat(True, 0.6), 0.45)
events.append(dict(t=4.5, name='heartbeat')); events.append(dict(t=5.0, name='reveal-hit'))

# BARS 4-6 — build
for bar in (4, 5, 6):
    ch = CH[PLAN[bar]]
    t0 = b2t(bar)
    for b in range(4):
        K(t0 + b * BEAT, 1.0 if b == 0 else 0.92)
        drums.add(t0 + (b + 0.5) * BEAT, hat(True, 0.55 + 0.1 * (bar - 4)), 0.5, 0.15)
        if bar >= 5:
            for s in (0.25, 0.75):
                drums.add(t0 + (b + s) * BEAT, hat(False, 0.5), 0.45, -0.2)
    if bar >= 5:
        drums.add(t0 + BEAT, clap(), 0.5); drums.add(t0 + 3 * BEAT, clap(), 0.5)
    bass.add(t0, sub_bass(ch['bass'], BAR - 0.02), 1.0)
    pads.add(t0, supersaw_chord(ch['pad'], BAR + 0.6, attack=0.08, cutoff=1500 + 600 * (bar - 4), release=0.6), 0.6)
    step = 0.5 if bar == 4 else 0.25
    for i in range(int(4 / step)):
        m = ch['arp'][i % 8]
        keys.add(t0 + i * step * BEAT, pluck(m, 0.4, bright=0.8 + 0.25 * (bar - 4)), 0.65, 0.35 * np.sin(i * 1.7))

# BAR 7 — rise; drums drop at 13.5; HIT 14.0
ch = CH['Bbmaj9']; t0 = b2t(7)
for b in range(3):
    K(t0 + b * BEAT)
    for s in (0.25, 0.5, 0.75):
        drums.add(t0 + (b + s) * BEAT, hat(s == 0.5, 0.55), 0.45, 0.1)
drums.add(t0 + BEAT, clap(), 0.5)
for i in range(4):  # snare-ish clap build in the last beat before the drop
    drums.add(t0 + (2 + i * 0.25) * BEAT, clap(0.4 + 0.15 * i), 0.35)
bass.add(t0, sub_bass(ch['bass'], 1.48), 1.0)
pads.add(t0, supersaw_chord(ch['pad'], 1.5, attack=0.05, cutoff=2600, release=0.1), 0.65)
for i in range(12):
    keys.add(t0 + i * 0.25 * BEAT, pluck(ch['arp'][i % 8] + (12 if i >= 8 else 0), 0.35, 1.2), 0.6, 0.3 * np.sin(i))
fx.add(12.0, riser(2.0, 180, 7000, 1.0), 0.55)
pads.add(13.0, reverse_swell(CH['Fmaj9']['pad'], 1.0), 0.5)
events.append(dict(t=13.5, name='drop-out')); events.append(dict(t=14.0, name='activation-hit'))

# BARS 8-10 — alive
for bar in (8, 9, 10):
    ch = CH[PLAN[bar]]
    t0 = b2t(bar)
    for b in range(4):
        tb = t0 + b * BEAT
        if not (bar == 10 and b == 3):
            K(tb, 1.1 if (bar == 8 and b == 0) else 1.0)
        drums.add(tb + 0.5 * BEAT, hat(True, 0.65), 0.5, 0.15)
        for s in (0.25, 0.75):
            drums.add(tb + s * BEAT, hat(False, 0.55), 0.45, -0.2)
    drums.add(t0 + BEAT, clap(), 0.55); drums.add(t0 + 3 * BEAT, clap(), 0.55)
    bass.add(t0, sub_bass(ch['bass'], BAR - 0.02), 1.05)
    pads.add(t0, supersaw_chord(ch['pad'], BAR + 0.5, attack=0.02, cutoff=3000, release=0.5), 0.6)
    for i in range(16):
        keys.add(t0 + i * 0.25 * BEAT, pluck(ch['arp'][i % 8] + (12 if i % 8 == 4 else 0), 0.4, 1.3), 0.6, 0.4 * np.sin(i * 1.3))
    # vocal chops: offbeat 'ah' stabs + a held 'oo' under the bar
    for k, (beat, vw) in enumerate([(0.5, 'ah'), (1.5, 'eh'), (2.5, 'ah'), (3.25, 'oo')]):
        vox.add(t0 + beat * BEAT, voice_pad(ch['pad'][2:], 0.22, vw, attack=0.006, release=0.1), 0.55, (-0.35, 0.35)[k % 2])
    vox.add(t0, voice_pad(ch['pad'][1:4], BAR, 'oo', attack=0.3, release=0.5), 0.14)
fx.add(14.0, boom(2.0, 62, 32), 0.75)
pads.add(14.0, supersaw_chord(CH['Fmaj9']['pad'], 0.6, attack=0.002, cutoff=6000, release=0.3), 0.6)
vox.add(14.0, voice_pad(CH['Fmaj9']['pad'][1:], 0.9, 'ah', attack=0.01, release=0.5), 0.8)
fx.add(19.0, riser(1.0, 600, 6000, 0.5), 0.35)

# BAR 11 — chosen silence 20.0-21.0, then swell
fx.add(20.0, tick(0.45), 0.6)
pads.add(21.0, reverse_swell(CH['Fmaj13']['pad'], 1.0), 0.75)
vox.add(21.0, voice_pad(CH['Bbmaj9']['pad'][2:], 1.0, 'oo', attack=0.8, release=0.05), 0.45)
for i in range(4):
    drums.add(21.5 + i * 0.125, clap(0.35 + 0.15 * i), 0.3)
fx.add(21.0, riser(1.0, 400, 8000, 0.7), 0.45)
events.append(dict(t=20.0, name='chosen-silence')); events.append(dict(t=21.0, name='swell'))

# BAR 12 — resolve
ch = CH['Fmaj13']
K(22.0, 1.1); fx.add(22.0, boom(2.0, 55, 30), 0.65)
pads.add(22.0, supersaw_chord(ch['pad'], 2.0, attack=0.003, cutoff=4200, release=1.4), 0.85)
vox.add(22.0, voice_pad(ch['pad'][1:], 2.0, 'ah', attack=0.02, release=1.5), 0.6)
bass.add(22.0, sub_bass(ch['bass'], 1.6, release=0.8), 1.0)
for i, m in enumerate([72, 76, 79, 81, 84]):
    keys.add(22.0 + i * 0.125, pluck(m, 1.2, 1.5, decay=0.6), 0.55, 0.4 * np.sin(i * 2))
events.append(dict(t=22.0, name='end-hit'))

# ---------------- mix ----------------
def sidechain(kick_times, depth=0.55, rel=0.16):
    g = np.ones(N)
    t = np.arange(N) / SR
    for kt in kick_times:
        i = int(kt * SR)
        seg = t[i:i + int(0.5 * SR)] - kt
        if not len(seg): continue
        att = np.clip(seg / 0.004, 0, 1)
        g[i:i + len(seg)] = np.minimum(g[i:i + len(seg)], 1 - depth * att * np.exp(-seg / rel))
    return g[:, None]

sc = sidechain(kicks)
body = np.zeros((N, 2))
body += drums.out() * 0.9
body += bass.out() * sc * 0.95
body += keys.out() * (0.6 + 0.4 * sc) * 0.8
body += pads.out() * sc * 0.75
body += vox.out() * (0.5 + 0.5 * sc) * 0.7
body += reverb(keys.out() * 0.8 + pads.out() * 0.4 + vox.out() * 0.6, IR_HALL, 0.22) * sc
body += reverb(drums.out() * 0.5, IR_ROOM, 0.12)
fxb = fx.out() * 0.9

# silences are compositional
t = np.arange(N) / SR
q = (t >= 2.0) & (t < 4.0)                       # bar 2: the music dies away and darkens
dark = np.stack([signal.sosfilt(sos_lp(500), body[:, c]) for c in range(2)], axis=1)
w = (np.clip((t - 2.0) / 0.3, 0, 1) * q)[:, None]
body = body * (1 - w) + dark * w
g = np.ones(N)
g[q] = np.exp(-(t[q] - 2.0) / 0.22)
s = (t >= 20.0) & (t < 21.0)                     # bar 11: chosen silence, dead stop in 12 ms
g[s] = np.clip(1 - (t[s] - 20.0) / 0.012, 0, 1)
# energy automation (dB per bar): hook strong, build climbs, alive section is the peak
E = {1: -2.0, 2: -2.0, 3: -1.0, 4: -6.0, 5: -4.5, 6: -3.0, 7: -1.8, 8: 0.0, 9: 0.0, 10: 0.0, 11: -1.0, 12: -0.5}
edb = np.array([E[min(12, int(tt // 2.0) + 1)] for tt in t[::480]])
edb = np.repeat(edb, 480)[:N]
edb = signal.lfilter([1 - 0.995], [1, -0.995], edb, zi=[edb[0] * 0.995])[0]
mix = body * g[:, None] * (10 ** (edb / 20))[:, None] + fxb
# master: HP, gentle glue saturation, end fade, no click at either edge
mix = np.stack([signal.sosfilt(sos_hp(28, 2), mix[:, c]) for c in range(2)], axis=1)
mix = eq(mix, [('lowshelf', 110, -3.5, 0.7), ('peak', 380, -3.0, 0.8), ('peak', 2600, 2.0, 0.9), ('highshelf', 4200, 2.5, 0.7), ('highshelf', 11000, -2.0, 0.7)])
mix = np.tanh(mix * 0.9) / 0.9
fade = np.clip((DUR - t) / 0.35, 0, 1) ** 1.5
mix *= fade[:, None]
mix[:48] *= np.linspace(0.6, 1, 48)[:, None]
mix /= np.max(np.abs(mix)) / 0.89

wavfile.write(os.path.join(OUT, 'music.wav'), SR, (mix * 32767).astype(np.int16))
json.dump(dict(bpm=BPM, beat=BEAT, bar=BAR, duration=DUR, sr=SR, plan=PLAN, events=events, kicks=sorted(kicks)),
          open(os.path.join(OUT, 'score.json'), 'w'), indent=1)
print('music.wav written', mix.shape, 'peak', float(np.max(np.abs(mix))))
