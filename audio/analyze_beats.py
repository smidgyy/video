"""Measure the beat grid of the rendered music bed (not the composed one).

Onset strength = half-wave-rectified spectral flux on a log-magnitude STFT (hop 5 ms).
Tempo        = autocorrelation peak of the onset envelope within 70-180 BPM.
Phase        = grid offset maximising onset energy at beat positions (kick band weighted).
Each beat    = refined to the strongest onset within +-25 ms (if one exists), else the grid.
Downbeats    = bar phase maximising low-band (kick) energy on beat 1.
Hits         = strong broadband onsets (top percentile) — candidate cut points.
Output: audio/out/beats.json
"""
import json, os, sys
import numpy as np
from scipy import signal
from scipy.io import wavfile

HERE = os.path.dirname(os.path.abspath(__file__))
src = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'out', 'music.wav')
sr, raw = wavfile.read(src)
x = raw.astype(np.float64) / (32768.0 if raw.dtype == np.int16 else 1.0)
x = x.mean(axis=1) if x.ndim > 1 else x
hop = int(0.005 * sr)

def onset_env(sig):
    f, tt, Z = signal.stft(sig, sr, nperseg=2048, noverlap=2048 - hop, boundary=None, padded=False)
    mag = np.log1p(1000 * np.abs(Z))
    flux = np.maximum(0, np.diff(mag, axis=1))
    return f, tt[1:], flux

# Detector latency calibration: transients at known times through the same detector.
cal = np.zeros(int(6 * sr))
known = np.arange(0.5, 5.6, 0.5)
rc = np.random.default_rng(1)
for k in known:
    i = int(k * sr); n = int(0.2 * sr); tk = np.arange(n) / sr
    cal[i:i + n] += np.sin(2 * np.pi * (50 + 100 * np.exp(-tk / 0.03)) * tk) * np.exp(-tk / 0.12) + rc.standard_normal(n) * np.exp(-tk / 0.004) * 0.3
_, ct, cflux = onset_env(cal)
cenv = cflux.sum(axis=0)
cpk, _ = signal.find_peaks(cenv, height=cenv.max() * 0.3, distance=int(0.2 / (hop / sr)))
latency = float(np.mean([ct[p] - known[np.argmin(np.abs(known - ct[p]))] for p in cpk]))

f, times, flux = onset_env(x)
times = times - latency
onset = flux.sum(axis=0)
low = flux[(f >= 30) & (f < 160)].sum(axis=0)
onset = onset / (onset.max() + 1e-9)
low = low / (low.max() + 1e-9)
fr = 1.0 / (hop / sr)

# tempo
env = onset - signal.medfilt(onset, 41)
env = np.maximum(env, 0)
ac = np.correlate(env, env, 'full')[len(env) - 1:]
lags = np.arange(len(ac)) / fr
sel = (lags >= 60 / 180) & (lags <= 60 / 70)
lag = lags[sel][np.argmax(ac[sel])]
# parabolic refinement
i = np.where(sel)[0][np.argmax(ac[sel])]
if 0 < i < len(ac) - 1:
    a, b, c = ac[i - 1], ac[i], ac[i + 1]
    lag = (i + 0.5 * (a - c) / (a - 2 * b + c)) / fr
bpm = 60 / lag
period = lag

# phase
dur = len(x) / sr
best, phase = -1, 0
for ph in np.arange(-0.02, period - 0.02, 0.001):
    grid = np.arange(ph, dur, period)
    idx = np.clip(np.round((grid - times[0]) * fr).astype(int), 0, len(env) - 1)
    score = (env[idx] + 0.5 * low[idx]).sum()
    if score > best:
        best, phase = score, ph
grid = np.arange(phase, dur - 1e-6, period)
grid = grid[grid >= -0.01]

beats = []
for g in grid:
    lo, hi = np.searchsorted(times, g - 0.025), np.searchsorted(times, g + 0.025)
    if hi > lo and env[lo:hi].max() > 0.08:
        k = lo + np.argmax(env[lo:hi])
        beats.append(dict(t=round(float(times[k]), 4), grid=round(float(g), 4), strength=round(float(env[k]), 3), measured=True))
    else:
        beats.append(dict(t=round(float(g), 4), grid=round(float(g), 4), strength=0.0, measured=False))

# downbeat phase (which of 4)
scores = [sum(low[np.clip(int(round((b['t'] - times[0]) * fr)), 0, len(low) - 1)] for b in beats[o::4]) for o in range(4)]
db0 = int(np.argmax(scores))
for i, b in enumerate(beats):
    b['i'] = i
    b['bar'] = (i - db0) // 4 + 1
    b['beat'] = (i - db0) % 4 + 1

# strong hits
pk, _ = signal.find_peaks(onset, height=np.percentile(onset, 99.3), distance=int(0.2 * fr))
hits = [dict(t=round(float(times[p]), 4), strength=round(float(onset[p]), 3)) for p in pk]

# per-frame energy (60 fps) for picture/sound sync checks
rms = np.sqrt(np.maximum(0, signal.convolve(x ** 2, np.ones(sr // 60) / (sr // 60), mode='same')))
energy60 = [round(float(v), 4) for v in rms[:: sr // 60]]

measured = [b for b in beats if b['measured']]
err = [abs(b['t'] - b['grid']) for b in measured]
out = dict(detector_latency_ms=round(latency * 1000, 2), source=os.path.relpath(src, os.path.dirname(HERE)), bpm=round(bpm, 3), period=round(period, 5), phase=round(phase, 4),
           downbeat_offset=db0, n_beats=len(beats), n_measured=len(measured),
           grid_dev_ms=dict(mean=round(1000 * float(np.mean(err)), 2), max=round(1000 * float(np.max(err)), 2)),
           beats=beats, downbeats=[b['t'] for b in beats if b['beat'] == 1], hits=hits, energy60=energy60)
json.dump(out, open(os.path.join(HERE, 'out', 'beats.json'), 'w'), indent=1)
print(f"bpm {bpm:.3f}  phase {phase*1000:.1f} ms  beats {len(beats)} ({len(measured)} measured, unmeasured = silence)  grid dev mean {out['grid_dev_ms']['mean']} ms max {out['grid_dev_ms']['max']} ms")
print('downbeats', [round(b, 3) for b in out['downbeats']])
print('hits', [h['t'] for h in hits])
