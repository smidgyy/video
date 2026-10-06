"""Tiny deterministic sequencer + mixer for the v2 score.
Place rendered notes on named buses at musical positions (bar, beat), then mix with sends, sidechain and master.
"""
import numpy as np
from scipy import signal
import instruments as I

SR = I.SR

class Grid:
    def __init__(self, bpm, beats_per_bar=4, offset=0.0):
        self.bpm, self.bpb, self.offset = bpm, beats_per_bar, offset
        self.beat = 60.0 / bpm
        self.bar = self.beat * beats_per_bar
    def t(self, bar, beat=0.0):
        """bar is 1-based, beat 0-based (fractions allowed)."""
        return self.offset + (bar - 1) * self.bar + beat * self.beat

def stereo(x, pan=0.0, width=0.0):
    l = np.cos((pan + 1) * np.pi / 4) * 1.4142
    r = np.sin((pan + 1) * np.pi / 4) * 1.4142
    y = np.stack([x * l, x * r], axis=1)
    if width:
        d = int(0.011 * SR)
        y[d:, 1] = y[d:, 1] * (1 - width) + x[:-d] * r * width
    return y

class Bus:
    def __init__(self, n):
        self.buf = np.zeros((n + SR * 6, 2))
        self.n = n
    def add(self, t, x, gain=1.0, pan=0.0, width=0.0):
        if x.ndim == 1:
            x = stereo(x, pan, width)
        i = int(round(t * SR))
        if i < 0:
            x = x[-i:]; i = 0
        j = min(i + len(x), len(self.buf))
        if j > i:
            self.buf[i:j] += x[: j - i] * gain
    def out(self):
        return self.buf[: self.n]

def make_ir(rt60=2.0, length=3.0, predelay=0.02, bright=6500, seed=1, er=True):
    r = np.random.default_rng(seed)
    n = int(length * SR)
    t = np.arange(n) / SR
    decay = np.exp(-6.91 * t / rt60)
    ir = np.zeros((n, 2))
    for c in range(2):
        nz = r.standard_normal(n)
        hi = I.lp(nz, bright, 1)
        lo = I.lp(nz, 1600, 1)
        k = np.clip(t / length, 0, 1)
        ir[:, c] = (hi * (1 - k) + lo * k) * decay
    pd = int(predelay * SR)
    ir = np.concatenate([np.zeros((pd, 2)), ir])[:n]
    if er:
        for c in range(2):
            for d, g in [(0.009, 0.55), (0.017, 0.4), (0.023, 0.3), (0.037, 0.22), (0.051, 0.16)]:
                ir[int((d + c * 0.0027) * SR), c] += g
    return ir / np.sqrt((ir ** 2).sum(axis=0, keepdims=True))

def convolve(x, ir, wet=0.3):
    return np.stack([signal.fftconvolve(x[:, c], ir[:, c])[: len(x)] for c in range(2)], axis=1) * wet

def sidechain(n, times, depth=0.5, rel=0.18, attack=0.004):
    g = np.ones(n)
    for kt in times:
        i = int(kt * SR)
        L = min(int(0.6 * SR), n - i)
        if L <= 0: continue
        s = np.arange(L) / SR
        g[i:i + L] = np.minimum(g[i:i + L], 1 - depth * np.clip(s / attack, 0, 1) * np.exp(-s / rel))
    return g[:, None]

def rbj(kind, f0, gain_db=0.0, q=0.707):
    A = 10 ** (gain_db / 40); w = 2 * np.pi * f0 / SR; c = np.cos(w); al = np.sin(w) / (2 * q)
    if kind == 'peak':
        b = [1 + al * A, -2 * c, 1 - al * A]; a = [1 + al / A, -2 * c, 1 - al / A]
    elif kind == 'lowshelf':
        sq = 2 * np.sqrt(A) * al
        b = [A * ((A + 1) - (A - 1) * c + sq), 2 * A * ((A - 1) - (A + 1) * c), A * ((A + 1) - (A - 1) * c - sq)]
        a = [(A + 1) + (A - 1) * c + sq, -2 * ((A - 1) + (A + 1) * c), (A + 1) + (A - 1) * c - sq]
    else:
        sq = 2 * np.sqrt(A) * al
        b = [A * ((A + 1) + (A - 1) * c + sq), -2 * A * ((A - 1) + (A + 1) * c), A * ((A + 1) + (A - 1) * c - sq)]
        a = [(A + 1) - (A - 1) * c + sq, 2 * ((A - 1) - (A + 1) * c), (A + 1) - (A - 1) * c - sq]
    return np.array(b) / a[0], np.array(a) / a[0]

def eq(x, bands):
    for kind, f0, g, q in bands:
        b, a = rbj(kind, f0, g, q)
        x = signal.lfilter(b, a, x, axis=0)
    return x

def tape(x, drive=1.2):
    """Gentle asymmetric saturation (warmth), level-preserving for small signals."""
    return np.tanh(x * drive + 0.03 * x ** 2) / drive

def automation(n, points, block=480):
    """Piecewise-linear gain automation in dB: points = [(t, db), ...]."""
    ts = np.arange(n) / SR
    pts = sorted(points)
    tt = np.array([p[0] for p in pts]); dd = np.array([p[1] for p in pts])
    db = np.interp(ts, tt, dd)
    return (10 ** (db / 20))[:, None]
