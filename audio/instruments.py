"""Synthesised instruments for the v2 score (numpy/scipy, seeded, sample-free).
Physical/organic models where possible: Karplus-Strong strings, modal mallets, FM electric piano,
breath-noise whistle, layered drums. Every function returns a mono float64 array at SR.
"""
import numpy as np
from scipy import signal

SR = 48000
_rng = np.random.default_rng(777)

def seed(s):
    global _rng
    _rng = np.random.default_rng(s)

def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)

def note(name):
    """'C4' / 'F#3' / 'Bb2' -> midi"""
    names = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}
    n = names[name[0].upper()]
    i = 1
    while i < len(name) and name[i] in '#b':
        n += 1 if name[i] == '#' else -1
        i += 1
    return n + 12 * (int(name[i:]) + 1)

def _t(n):
    return np.arange(n) / SR

def env_exp(n, attack=0.002, tau=0.3):
    t = _t(n)
    return np.clip(t / max(attack, 1e-5), 0, 1) * np.exp(-np.maximum(0, t - attack) / tau)

def adsr(n, a=0.01, d=0.1, s=0.7, r=0.2):
    t = _t(n)
    hold = n / SR - r
    e = np.where(t < a, t / max(a, 1e-6), 1.0)
    e = np.where((t >= a) & (t < a + d), 1 - (1 - s) * (t - a) / max(d, 1e-6), e)
    e = np.where((t >= a + d) & (t < hold), s, e)
    e = np.where(t >= hold, s * np.clip(1 - (t - hold) / max(r, 1e-6), 0, 1), e)
    return e

def lp(x, fc, order=2):
    return signal.sosfilt(signal.butter(order, min(fc, SR * 0.45), 'low', fs=SR, output='sos'), x)

def hp(x, fc, order=2):
    return signal.sosfilt(signal.butter(order, fc, 'high', fs=SR, output='sos'), x)

def bp(x, lo, hi, order=2):
    return signal.sosfilt(signal.butter(order, [lo, min(hi, SR * 0.45)], 'band', fs=SR, output='sos'), x)

# ---------------------------------------------------------------- strings (Karplus-Strong)
def pluck(m, dur=1.2, bright=0.6, damp=0.996, pick=0.13, mute=0.0):
    """Extended Karplus-Strong via lfilter: y[n] = x[n] + g*(a*y[n-N] + (1-a)*y[n-N-1]).
    bright: excitation brightness, damp: loop gain, pick: pick position (comb on excitation), mute: palm mute 0..1"""
    f = mtof(m)
    N = SR / f
    Ni = int(np.floor(N - 0.5))
    fr = N - 0.5 - Ni                      # averaging filter adds 0.5 sample; the rest is linear interpolation
    n = int(dur * SR)
    # physical pluck: triangular string displacement peaking at the pick point, plus a little noise for texture
    L = Ni + 2
    k = np.arange(L)
    pk = max(2, int(pick * L))
    tri = np.where(k < pk, k / pk, (L - k) / (L - pk))
    exc = tri - tri.mean() + lp(_rng.standard_normal(L), 600 + 9000 * bright, 1) * (0.08 + 0.25 * bright)
    exc = lp(exc, 1500 + 10000 * bright, 1)
    x = np.zeros(n)
    x[:len(exc)] = exc
    g = damp * (1 - 0.006 * mute)
    den = np.zeros(Ni + 3)
    den[0] = 1
    den[Ni] = -g * 0.5 * (1 - fr)
    den[Ni + 1] = -g * 0.5
    den[Ni + 2] = -g * 0.5 * fr
    y = signal.lfilter([1.0], den, x)
    if mute > 0:
        y = lp(y, 2600 - 2000 * mute, 2)
    y *= adsr(n, a=0.001, d=0.02, s=1.0, r=min(0.08, dur * 0.3))
    return y / (np.max(np.abs(y)) + 1e-9) * 0.5

def bass_pluck(m, dur=0.6, tone=0.45):
    """Round electric-bass-like pluck: KS string + sine fundamental reinforcement."""
    s = pluck(m, dur, bright=tone, damp=0.9985, pick=0.18)
    n = len(s)
    f = mtof(m)
    fund = np.sin(2 * np.pi * f * _t(n)) * env_exp(n, 0.004, 0.45)
    y = lp(s * 0.8 + fund * 0.55, 1800)
    return np.tanh(y * 1.4) * 0.6

# ---------------------------------------------------------------- keys & mallets
def epiano(m, dur=1.6, vel=0.8):
    """2-operator FM electric piano (tine + bark), velocity-sensitive index."""
    n = int(dur * SR)
    t = _t(n)
    f = mtof(m)
    idx = (0.35 + 1.1 * vel) * np.exp(-t / 0.3) + 0.12
    mod = np.sin(2 * np.pi * f * 14.0 * t) * 0.18 * np.exp(-t / 0.02) * vel  # tine attack
    car = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * t) + mod)
    tremolo = 1 + 0.08 * np.sin(2 * np.pi * 4.6 * t)
    e = env_exp(n, 0.002, 0.9 + 0.6 * (60 - min(m, 80)) / 30) * adsr(n, 0.001, 0.0, 1.0, 0.12)
    return car * e * tremolo * 0.35 * vel

def mallet(m, dur=1.2, vel=0.8, kind='marimba'):
    """Modal synthesis. marimba: partials 1, 3.93, 9.2 ; vibes: 1, 4.0, 10.1 with tremolo."""
    n = int(dur * SR)
    t = _t(n)
    f = mtof(m)
    ratios, amps, taus = ((1, 3.93, 9.2), (1, 0.35, 0.12), (0.55, 0.12, 0.04)) if kind == 'marimba' else ((1, 4.0, 10.1), (1, 0.25, 0.08), (1.6, 0.3, 0.08))
    y = np.zeros(n)
    for r_, a_, tau in zip(ratios, amps, taus):
        if f * r_ < SR * 0.45:
            y += a_ * np.sin(2 * np.pi * f * r_ * t) * np.exp(-t / tau)
    click = bp(_rng.standard_normal(n), 1500, 6000) * np.exp(-t / 0.002) * 0.15
    trem = 1 + (0.25 * np.sin(2 * np.pi * 5.5 * t) if kind == 'vibes' else 0)
    return (y * trem + click) * np.clip(t / 0.0015, 0, 1) * 0.4 * vel

def whistle(m, dur, vel=0.8, vib=5.6, glide_from=None, glide=0.06):
    """Human whistle: sine with breath noise, delayed vibrato, slight pitch scoop."""
    n = int(dur * SR)
    t = _t(n)
    f = mtof(m)
    f0 = mtof(glide_from) if glide_from is not None else f * 0.985
    fcurve = f + (f0 - f) * np.exp(-t / glide)
    vibd = np.clip((t - 0.12) / 0.25, 0, 1) * 0.008
    fcurve = fcurve * (1 + vibd * np.sin(2 * np.pi * vib * t))
    ph = 2 * np.pi * np.cumsum(fcurve) / SR
    tone = np.sin(ph) + 0.06 * np.sin(2 * ph)
    breath = bp(_rng.standard_normal(n), f * 0.8, f * 1.4) * 0.25 + hp(_rng.standard_normal(n), 3000) * 0.02
    e = adsr(n, 0.025, 0.08, 0.85, min(0.09, dur * 0.4))
    return (tone + breath) * e * 0.32 * vel

def pad(notes, dur, bright=1200, attack=0.6, release=1.0):
    n = int(dur * SR)
    t = _t(n)
    y = np.zeros(n)
    for m in notes:
        for d in (-7, 0, 7):
            f = mtof(m) * 2 ** (d / 1200)
            ph = _rng.random()
            saw = 2 * ((f * t + ph) % 1) - 1
            y += saw
    y = lp(y / (3 * len(notes)), bright, 2)
    return y * adsr(n, attack, 0.3, 0.85, release) * 0.3

def vocal_ooh(notes, dur, vowel='oo', attack=0.15):
    """Formant-filtered choir 'ooh/aah' (soft background vocal)."""
    n = int(dur * SR)
    t = _t(n)
    src = np.zeros(n)
    for i, m in enumerate(notes):
        f = mtof(m) * (1 + 0.004 * np.sin(2 * np.pi * (5 + i * 0.3) * t + i))
        ph = np.cumsum(f) / SR
        src += 2 * (ph % 1) - 1
    F = {'oo': [(330, 80, 1.0), (850, 110, 0.35), (2300, 180, 0.12)], 'ah': [(730, 90, 1.0), (1090, 110, 0.5), (2440, 170, 0.25)], 'mm': [(250, 60, 1.0), (1700, 150, 0.08)]}[vowel]
    y = np.zeros(n)
    for fc, bw, g in F:
        r = np.exp(-np.pi * bw / SR)
        th = 2 * np.pi * fc / SR
        y += g * signal.lfilter([1 - r], [1, -2 * r * np.cos(th), r * r], src)
    y += bp(_rng.standard_normal(n), 1500, 6000) * 0.02
    return hp(y, 180) * adsr(n, attack, 0.2, 0.9, 0.4) / max(1, len(notes)) * 0.8

# ---------------------------------------------------------------- drums & percussion
def kick(vel=1.0, tone=52, punch=1.0, length=0.5):
    n = int(length * SR)
    t = _t(n)
    f = tone + 95 * punch * np.exp(-t / 0.03) + 25 * np.exp(-t / 0.004)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.22)
    y = np.tanh(y * 1.6) / np.tanh(1.6)
    click = hp(_rng.standard_normal(n), 3000) * np.exp(-t / 0.0025) * 0.25
    return (y + click) * vel * 0.9

def snare(vel=1.0, body=190, snappy=0.7, length=0.35):
    n = int(length * SR)
    t = _t(n)
    shell = (np.sin(2 * np.pi * body * t) + 0.5 * np.sin(2 * np.pi * body * 1.6 * t)) * np.exp(-t / 0.05)
    wires = bp(_rng.standard_normal(n), 1800, 9000) * np.exp(-t / (0.08 + 0.1 * snappy))
    return (shell * 0.7 + wires * snappy) * vel * 0.6

def clap(vel=1.0, spread=0.011, layers=4):
    n = int(0.45 * SR)
    y = np.zeros(n)
    for k in range(layers):
        i = int((k * spread + _rng.uniform(0, 0.003)) * SR)
        seg = _rng.standard_normal(n - i) * np.exp(-_t(n - i) / (0.007 if k < layers - 1 else 0.11))
        y[i:] += seg
    return bp(y, 900, 3200) * vel * 0.7

def snap(vel=1.0):
    n = int(0.12 * SR)
    t = _t(n)
    y = bp(_rng.standard_normal(n), 2200, 7000) * np.exp(-t / 0.012) + np.sin(2 * np.pi * 2600 * t) * np.exp(-t / 0.006) * 0.4
    return y * vel * 0.6

def rim(vel=1.0):
    n = int(0.08 * SR)
    t = _t(n)
    return (np.sin(2 * np.pi * 1650 * t) * np.exp(-t / 0.012) + bp(_rng.standard_normal(n), 2000, 6000) * np.exp(-t / 0.004)) * vel * 0.45

def hat(vel=1.0, open_=False):
    n = int((0.35 if open_ else 0.07) * SR)
    t = _t(n)
    metal = sum(np.sign(np.sin(2 * np.pi * f * t + _rng.random() * 6)) for f in (5340, 6890, 8120, 9930, 7350)) * 0.12
    y = hp(_rng.standard_normal(n) * 0.7 + metal, 7200, 4)
    return y * np.exp(-t / (0.12 if open_ else 0.02)) * vel * 0.35

def shaker(vel=1.0, length=0.1):
    n = int(length * SR)
    t = _t(n)
    e = np.clip(t / 0.012, 0, 1) * np.exp(-np.maximum(0, t - 0.012) / 0.03)
    return bp(_rng.standard_normal(n), 4000, 11000) * e * vel * 0.3

def brush(vel=1.0, length=0.25):
    n = int(length * SR)
    t = _t(n)
    e = np.clip(t / 0.03, 0, 1) * np.exp(-np.maximum(0, t - 0.03) / 0.08)
    return bp(_rng.standard_normal(n), 2500, 9000) * e * vel * 0.25

def tom(m=45, vel=1.0):
    n = int(0.6 * SR)
    t = _t(n)
    f = mtof(m) * (1 + 0.6 * np.exp(-t / 0.04))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.25) * vel * 0.6

def sub_boom(length=2.0, f0=60, f1=34):
    n = int(length * SR)
    t = _t(n)
    f = f1 + (f0 - f1) * np.exp(-t / 0.3)
    return np.tanh(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.8) * 1.4)

def reverse_swell(x, length):
    n = int(length * SR)
    y = x[:n][::-1].copy()
    return y * np.linspace(0, 1, len(y)) ** 2

# ---------------------------------------------------------------- humanisation
def human(t, amount=0.006):
    """Seeded micro-timing offset in seconds."""
    return t + _rng.uniform(-amount, amount)

def vel(v, amount=0.12):
    return max(0.05, v * (1 + _rng.uniform(-amount, amount)))

def layer(*xs):
    """Sum mono signals of different lengths (zero-padded)."""
    n = max(len(x) for x in xs)
    y = np.zeros(n)
    for x in xs:
        y[:len(x)] += x
    return y
