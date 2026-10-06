"""v2 master: the Runaway edit (music2.wav) + the sound design (sfx2.wav) -> mix2.wav
48 kHz stereo 24-bit, -14 LUFS integrated (BS.1770), true peak <= -1 dBTP (4x-oversampled lookahead limiter).
The composed silences stay digitally silent. Run after edit_song.py and sfx2.py.
"""
import json, os, sys
import numpy as np
import soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import importlib.util
spec = importlib.util.spec_from_file_location('v1mix_limiter', os.path.join(HERE, 'mix.py'))
from analyze import integrated, true_peak  # noqa: E402

TARGET, TP_MAX = -14.0, -1.0
SR = 48000
music, sr = sf.read(os.path.join(HERE, 'out', 'music2.wav'), always_2d=True)
sfx, _ = sf.read(os.path.join(HERE, 'out', 'sfx2.wav'), always_2d=True)
TL = json.load(open(os.path.join(ROOT, 'timeline2.json')))
n = int(round(TL['duration'] * SR))
def fit(x): y = np.zeros((n, 2)); m = min(n, len(x)); y[:m] = x[:m]; return y
music, sfx = fit(music), fit(sfx)
# Phone-speaker legibility: lift everything before the drop by +4 dB (ramping back to unity in the 30 ms before it),
# so the intro piano reads on small speakers while the drop still lands ~12 dB harder.
P0, T00 = json.load(open(os.path.join(ROOT, 'timeline2.json')))['grid']['P'], json.load(open(os.path.join(ROOT, 'timeline2.json')))['grid']['T0']
drop = T00 + 25 * P0
g = np.ones(n); i1 = int((drop - 0.03) * SR); i2 = int((drop - 0.012) * SR)
g[:i1] = 10 ** (4 / 20); g[i1:i2] = np.linspace(10 ** (4 / 20), 1, i2 - i1)
mix = (music + sfx) * g[:, None]

from scipy import signal
from scipy.ndimage import minimum_filter1d, uniform_filter1d
def limiter(x, ceiling_db, look=0.003, release=0.08):
    ceil = 10 ** (ceiling_db / 20)
    up = signal.resample_poly(x, 4, 1, axis=0)
    peak = np.abs(up).max(axis=1).reshape(-1, 4).max(axis=1)[: len(x)]
    need = np.minimum(1.0, ceil / np.maximum(peak, 1e-9))
    L = max(1, int(look * SR))
    g = minimum_filter1d(need, size=2 * L + 1, origin=0)
    g = uniform_filter1d(g, size=L)
    a = np.exp(-1 / (release * SR))
    rel = signal.lfilter([1 - a], [1, -a], g - 1, zi=[0.0])[0] + 1
    g = np.minimum(g, np.maximum(rel, g))
    return x * g[:, None]

silent = np.all(mix == 0, axis=1)          # keep composed silences exactly zero
y = mix.copy()
for it in range(8):
    y = y * 10 ** ((TARGET - integrated(y, SR)) / 20)
    y = limiter(y, TP_MAX - 0.4)
    y[silent] = 0
    if abs(integrated(y, SR) - TARGET) < 0.1 and true_peak(y) <= TP_MAX: break
y[-int(0.02 * SR):] *= np.linspace(1, 0, int(0.02 * SR))[:, None]
sf.write(os.path.join(HERE, 'out', 'mix2.wav'), np.clip(y, -1, 1).astype(np.float32), SR, subtype='PCM_24')
P, T0 = TL['grid']['P'], TL['grid']['T0']
def seg_db(a, b_):
    s = y[int(a * SR):int(b_ * SR)]
    return round(20 * np.log10(np.sqrt((s ** 2).mean()) + 1e-12), 1) if len(s) else None
rep = dict(integrated_lufs=round(integrated(y, SR), 2), true_peak_dbtp=round(true_peak(y), 2), iterations=it + 1, sr=SR,
           duration=round(len(y) / SR, 4), silence_absence_rms_db=seg_db(T0 + 8.3 * P, T0 + 8.9 * P), silence_choice_rms_db=seg_db(T0 + 39.1 * P, T0 + 39.9 * P),
           act1_rms_db=seg_db(0, T0 + 8 * P), act2_rms_db=seg_db(T0 + 10 * P, T0 + 25 * P), groove_rms_db=seg_db(T0 + 25 * P, T0 + 38 * P), payoff_rms_db=seg_db(T0 + 41 * P, T0 + 49 * P))
json.dump(rep, open(os.path.join(HERE, 'out', 'mix2_report.json'), 'w'), indent=1)
print(rep)
