"""UI sound design, synthesised per event from timeline.json (same times the picture uses).
Kinds: click, tick, pop, roll, check, whoosh, thump, shutter, type, count.
Run: python3 -I audio/sfx.py -> audio/out/sfx.wav
"""
import json, os
import numpy as np
from scipy import signal
from scipy.io import wavfile

SR = 48000
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
tl = json.load(open(os.path.join(ROOT, 'timeline.json')))
N = int(tl['duration'] * SR)
rng = np.random.default_rng(424242)
out = np.zeros((N + SR, 2))

def env(n, a, tau):
    t = np.arange(n) / SR
    return np.clip(t / max(a, 1e-5), 0, 1) * np.exp(-np.maximum(0, t - a) / tau)

def bp(x, lo, hi, order=2):
    return signal.sosfilt(signal.butter(order, [lo, hi], 'band', fs=SR, output='sos'), x)

def place(t, x, gain=1.0, pan=0.0):
    i = int(round(t * SR))
    if x.ndim == 1:
        l, r = np.cos((pan + 1) * np.pi / 4) * 1.414, np.sin((pan + 1) * np.pi / 4) * 1.414
        x = np.stack([x * l, x * r], 1)
    j = min(i + len(x), len(out))
    out[i:j] += x[: j - i] * gain

def click(strength=1.0):
    n = int(0.05 * SR); t = np.arange(n) / SR
    body = np.sin(2 * np.pi * 1900 * t) * env(n, 0.0004, 0.006)
    snap = bp(rng.standard_normal(n), 2500, 9000) * env(n, 0.0002, 0.0025) * 0.8
    low = np.sin(2 * np.pi * 180 * t) * env(n, 0.001, 0.012) * 0.6
    return (body * 0.5 + snap + low) * strength * 0.55

def tick(strength=1.0, f=3200):
    n = int(0.03 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * t) * env(n, 0.0003, 0.004) + bp(rng.standard_normal(n), 4000, 12000) * env(n, 0.0001, 0.0015) * 0.5) * strength * 0.4

def pop(strength=1.0, f0=900, f1=520):
    n = int(0.12 * SR); t = np.arange(n) / SR
    f = f1 + (f0 - f1) * np.exp(-t / 0.018)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, 0.035) * strength * 0.5

def roll(strength=1.0):
    # soft mechanical flip for the odometer word roll
    n = int(0.07 * SR)
    x = bp(rng.standard_normal(n), 1200, 5200) * env(n, 0.001, 0.01)
    t = np.arange(n) / SR
    return (x * 0.5 + np.sin(2 * np.pi * 660 * t) * env(n, 0.001, 0.02) * 0.35) * strength * 0.5

def check(i):
    # rising three-note confirmation (D minor pentatonic): A5, C6, D6
    f = [880.0, 1046.5, 1174.7][min(i, 2)]
    n = int(0.16 * SR); t = np.arange(n) / SR
    x = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t / 0.02)
    return x * env(n, 0.002, 0.05) * 0.28

def whoosh(length=0.35, strength=1.0):
    n = int(length * SR); t = np.arange(n) / SR
    k = t / length
    shape = np.sin(np.pi * np.clip(k, 0, 1)) ** 2 * (1 - k * 0.3)
    nz = rng.standard_normal(n)
    out_ = np.zeros(n)
    blk = 256
    zi = None
    for s in range(0, n, blk):
        fc = 500 + 5500 * np.sin(np.pi * min(1, (s / n))) ** 1.5
        sos = signal.butter(2, [fc * 0.5, min(fc * 1.6, 20000)], 'band', fs=SR, output='sos')
        if zi is None: zi = np.zeros((sos.shape[0], 2))
        out_[s:s + blk], zi = signal.sosfilt(sos, nz[s:s + blk], zi=zi)
    return out_ * shape * strength * 0.5

def thump(strength=1.0):
    n = int(0.35 * SR); t = np.arange(n) / SR
    f = 48 + 70 * np.exp(-t / 0.03)
    return np.tanh(np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, 0.11) * 2) * strength * 0.6

def shutter():
    a = click(0.8); b = click(0.6)
    n = int(0.12 * SR)
    x = np.zeros(n); x[:len(a)] += a; x[int(0.045 * SR):int(0.045 * SR) + len(b)] += b
    x += bp(rng.standard_normal(n), 3000, 9000) * env(n, 0.002, 0.03) * 0.12
    return x

def type_burst(length, strength=1.0):
    # soft key ticks, ~22 per second, randomised but seeded
    n = int(length * SR); x = np.zeros(n + SR // 10)
    times = np.arange(0, length, 1 / 22.0) + rng.uniform(-0.008, 0.008, int(np.ceil(length * 22)))[: len(np.arange(0, length, 1 / 22.0))]
    for k, tt in enumerate(times):
        i = int(max(0, tt) * SR)
        c = tick(0.5 + 0.25 * rng.random(), f=2200 + 900 * rng.random())
        x[i:i + len(c)] += c
    return x * strength

def count(length):
    # accelerating soft ticks for a number counting up, decelerating into the landing (outCubic)
    x = np.zeros(int((length + 0.1) * SR))
    for k in range(14):
        p = 1 - (1 - k / 13) ** (1 / 3)  # inverse of outCubic -> when each step lands
        i = int(p * length * SR)
        c = tick(0.35, f=2600 + 60 * k)
        x[i:i + len(c)] += c
    return x

checks = 0
log = []
for e in tl['events']:
    kind, t = e.get('sfx'), e['t']
    if not kind: continue
    if kind == 'click': place(t, click(), 0.9, 0.12)
    elif kind == 'tick': place(t, tick(), 0.8, -0.1)
    elif kind == 'pop': place(t, pop(), 0.85)
    elif kind == 'roll': place(t, roll(), 0.8)
    elif kind == 'check': place(t, check(checks), 1.0); checks += 1
    elif kind == 'whoosh':
        L = e.get('len', 0.35); place(t + e.get('peak', 0.0) - 0.585 * L, whoosh(L * 1.3), 0.7)  # swell peak (0.45 of 1.3L) lands on the motion's fastest frames
    elif kind == 'thump': place(t, thump(), 0.9)
    elif kind == 'shutter': place(t, shutter(), 0.8)
    elif kind == 'type': place(t, type_burst(e.get('len', 0.3)), 0.7)
    elif kind == 'count': place(t, count(e.get('len', 0.45)), 0.8)
    log.append((round(t, 3), kind, e['id']))

y = out[:N]
y[-int(0.3 * SR):] *= np.linspace(1, 0, int(0.3 * SR))[:, None]
wavfile.write(os.path.join(HERE, 'out', 'sfx.wav'), SR, (np.clip(y, -1, 1) * 32767).astype(np.int16))
json.dump(log, open(os.path.join(HERE, 'out', 'sfx_events.json'), 'w'))
print(f'sfx.wav: {len(log)} events, peak {np.max(np.abs(y)):.3f}')
