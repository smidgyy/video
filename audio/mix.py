"""Final mix: music + SFX -> 48 kHz stereo, -14 LUFS integrated, true peak <= -1 dBTP.
Lookahead true-peak limiter (4x oversampled detection) + iterative gain to the loudness target.
Run: python3 -I audio/mix.py -> audio/out/mix.wav + audio/out/mix_report.json
"""
import json, os, sys
import numpy as np
from scipy import signal
from scipy.io import wavfile
from scipy.ndimage import minimum_filter1d, uniform_filter1d
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from analyze import integrated, true_peak, load  # noqa: E402

TARGET, TP_MAX = -14.0, -1.0
sr, music = load(os.path.join(HERE, 'out', 'music.wav'))
_, sfx = load(os.path.join(HERE, 'out', 'sfx.wav'))
n = min(len(music), len(sfx))
music, sfx = music[:n], sfx[:n]

# SFX sit on top of the score but under its peaks: duck music by 2 dB around each UI hit
env = uniform_filter1d(np.abs(sfx).max(axis=1), int(0.03 * sr))
duck = 1 - 0.2 * np.clip(env / (env.max() + 1e-9) * 3, 0, 1)
mix = music * duck[:, None] + sfx * 0.8

def limiter(x, ceiling_db, look=0.003, release=0.08):
    ceil = 10 ** (ceiling_db / 20)
    up = signal.resample_poly(x, 4, 1, axis=0)
    peak = np.abs(up).max(axis=1).reshape(-1, 4).max(axis=1)[: len(x)]
    need = np.minimum(1.0, ceil / np.maximum(peak, 1e-9))
    L = max(1, int(look * sr))
    g = minimum_filter1d(need, size=2 * L + 1, origin=0)
    g = uniform_filter1d(g, size=L)  # smooth attack inside the lookahead window
    # release: one-pole toward 1 when the need relaxes (never above the required gain)
    a = np.exp(-1 / (release * sr))
    rel = signal.lfilter([1 - a], [1, -a], g - 1, zi=[0.0])[0] + 1
    g = np.minimum(g, np.maximum(rel, g))
    return x * g[:, None]

y = mix.copy()
for it in range(6):
    lufs = integrated(y, sr)
    y = y * 10 ** ((TARGET - lufs) / 20)
    y = limiter(y, TP_MAX - 0.35)
    tp = true_peak(y)
    lufs = integrated(y, sr)
    if abs(lufs - TARGET) < 0.15 and tp <= TP_MAX:
        break
y[-int(0.02 * sr):] *= np.linspace(1, 0, int(0.02 * sr))[:, None]
wavfile.write(os.path.join(HERE, 'out', 'mix.wav'), sr, (np.clip(y, -1, 1) * 8388607).astype(np.int32) << 8)
rep = dict(integrated_lufs=round(integrated(y, sr), 2), true_peak_dbtp=round(true_peak(y), 2), iterations=it + 1, sr=sr, duration=round(len(y) / sr, 3))
json.dump(rep, open(os.path.join(HERE, 'out', 'mix_report.json'), 'w'), indent=1)
print(rep)
