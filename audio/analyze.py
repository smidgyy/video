"""Objective audio checks: BS.1770-4 loudness (integrated, short-term per bar), true peak,
crest factor, band balance and click/discontinuity detection.
Usage: python3 -I audio/analyze.py audio/out/mix.wav [--json out.json]
"""
import json, sys
import numpy as np
from scipy import signal
from scipy.io import wavfile

def load(p):
    sr, raw = wavfile.read(p)
    x = raw.astype(np.float64)
    if raw.dtype == np.int16: x /= 32768.0
    elif raw.dtype == np.int32: x /= 2147483648.0
    if x.ndim == 1:
        x = x[:, None]
    return sr, x

def k_weight(x, sr):
    # BS.1770 pre-filter (high shelf) + RLB high-pass, coefficients via bilinear design at sr
    f0, G, Q = 1681.974450955533, 3.999843853973347, 0.7071752369554196
    K = np.tan(np.pi * f0 / sr); Vh = 10 ** (G / 20); Vb = Vh ** 0.4996667741545416
    a0 = 1 + K / Q + K * K
    b1 = [(Vh + Vb * K / Q + K * K) / a0, 2 * (K * K - Vh) / a0, (Vh - Vb * K / Q + K * K) / a0]
    a1 = [1, 2 * (K * K - 1) / a0, (1 - K / Q + K * K) / a0]
    f0, Q = 38.13547087602444, 0.5003270373238773
    K = np.tan(np.pi * f0 / sr)
    a2 = [1, 2 * (K * K - 1) / (1 + K / Q + K * K), (1 - K / Q + K * K) / (1 + K / Q + K * K)]
    b2 = [1, -2, 1]
    y = signal.lfilter(b1, a1, x, axis=0)
    return signal.lfilter(b2, a2, y, axis=0)

def loudness_blocks(x, sr, win=0.4, hop=0.1):
    y = k_weight(x, sr)
    n, h = int(win * sr), int(hop * sr)
    ms = []
    for i in range(0, max(1, len(y) - n + 1), h):
        ms.append(np.mean(y[i:i + n] ** 2, axis=0).sum())
    return np.array(ms)

def lufs(ms):
    return -0.691 + 10 * np.log10(np.maximum(ms, 1e-12))

def integrated(x, sr):
    ms = loudness_blocks(x, sr)
    l = lufs(ms)
    g = ms[l > -70]
    if not len(g): return -70.0
    rel = -0.691 + 10 * np.log10(g.mean()) - 10
    g2 = ms[(l > -70) & (l > rel)]
    return float(-0.691 + 10 * np.log10(g2.mean()))

def true_peak(x):
    up = signal.resample_poly(x, 4, 1, axis=0)
    return float(20 * np.log10(np.max(np.abs(up)) + 1e-12))

def short_term(x, sr, t0, t1):
    seg = x[int(t0 * sr):int(t1 * sr)]
    if len(seg) < int(0.4 * sr): return -70.0
    ms = loudness_blocks(seg, sr)
    return float(lufs(ms.mean()))

def bands(x, sr):
    m = x.mean(axis=1)
    f, P = signal.welch(m, sr, nperseg=8192)
    out = {}
    for name, lo, hi in [('sub 20-60', 20, 60), ('bass 60-250', 60, 250), ('lowmid 250-800', 250, 800), ('mid 0.8-3k', 800, 3000), ('presence 3-8k', 3000, 8000), ('air 8-16k', 8000, 16000)]:
        sel = (f >= lo) & (f < hi)
        out[name] = float(10 * np.log10(P[sel].sum() + 1e-20))
    ref = out['mid 0.8-3k']
    return {k: round(v - ref, 1) for k, v in out.items()}

def clicks(x, sr, thresh=0.35):
    d = np.abs(np.diff(x, axis=0)).max(axis=1)
    idx = np.where(d > thresh)[0]
    return [round(i / sr, 3) for i in idx[:20]]

if __name__ == '__main__':
    p = sys.argv[1]
    sr, x = load(p)
    dur = len(x) / sr
    rep = dict(file=p, sr=sr, duration=round(dur, 3), integrated_lufs=round(integrated(x, sr), 2), true_peak_dbtp=round(true_peak(x), 2),
               sample_peak_dbfs=round(float(20 * np.log10(np.abs(x).max() + 1e-12)), 2))
    bars = []
    for b in range(int(np.ceil(dur / 2.0))):
        t0, t1 = b * 2.0, min(dur, b * 2.0 + 2.0)
        seg = x[int(t0 * sr):int(t1 * sr)]
        rms = np.sqrt(np.mean(seg ** 2)) + 1e-12
        bars.append(dict(bar=b + 1, t=f'{t0:.0f}-{t1:.0f}', lufs=round(short_term(x, sr, t0, t1), 1), crest_db=round(float(20 * np.log10(np.abs(seg).max() / rms + 1e-12)), 1)))
    rep['bars'] = bars
    rep['band_balance_rel_mid_db'] = bands(x, sr)
    rep['edge_start_abs'] = round(float(np.abs(x[:8]).max()), 4)
    rep['edge_end_abs'] = round(float(np.abs(x[-8:]).max()), 4)
    rep['discontinuities'] = clicks(x, sr)
    if '--json' in sys.argv:
        json.dump(rep, open(sys.argv[sys.argv.index('--json') + 1], 'w'), indent=1)
    print(json.dumps(rep, indent=1))
