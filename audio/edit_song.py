"""Beat-indexed editor for a supplied song (v2 film).

The song's grid is the measured model in audio/song_grid.json: source beat k sits at T0 + k*P.
The EDL (audio/edl_runaway.json) lays segments end to end in OUTPUT beats, so output beat ob sits at OUT0 + ob*P
and the picture can be authored in beats (timeline2.json) with no drift.

Segment fields:
  {"k": 16, "beats": 15}                    copy source beats k .. k+beats
  {"silence": 2}                            exact digital zero for 2 beats
  "src": "mix" | "stem:<a|b>:<names>"       e.g. "stem:a:drums+bass+other" (demucs excerpt a = 0-46 s, b = 300-339 s)
  "gain_db": 0                              static gain
  "lp": [hz_start, hz_end]                  low-pass ramp across the segment (2nd-order, block-wise)
  "width": [w_start, w_end]                 stereo width ramp (1 = original)
  "fade_out_s": 0.6                         fade to zero over the segment's last N seconds (equal-power)
  "tail_beats": 1.5                         let the segment's own audio run on for N extra beats under the next one
                                            (fades out over that span) - for ring-outs under a following silence/segment
Splices: the incoming segment starts PRE seconds before its beat (transient intact) with an XF equal-power crossfade.
Outputs: audio/out/music2.wav (float32 48 kHz stereo, unmastered) + audio/out/music2.json (output beat grid + map).
"""
import json, os, subprocess, sys, tempfile
import numpy as np
import soundfile as sf
from scipy import signal

HERE = os.path.dirname(os.path.abspath(__file__))
SR = 48000
PRE, XF = 0.012, 0.010  # incoming starts 12 ms early and is fully in 2 ms before its transient; outgoing is gone 2 ms before its next one

def decode(path, t0=None, dur=None):
    with tempfile.TemporaryDirectory() as td:
        out = os.path.join(td, 'x.wav')
        cmd = ['ffmpeg', '-v', 'error', '-y']
        if t0 is not None: cmd += ['-ss', str(t0)]
        if dur is not None: cmd += ['-t', str(dur)]
        cmd += ['-i', path, '-vn', '-ac', '2', '-ar', str(SR), '-c:a', 'pcm_f32le', out]
        subprocess.run(cmd, check=True)
        x, _ = sf.read(out, always_2d=True)
    return x.astype(np.float64)

class Sources:
    STEM_OFFSET = {'a': 0.0, 'b': 300.0}
    def __init__(self, song):
        self.mix = decode(song)
        self.stems = {}
    def get(self, src):
        if src == 'mix':
            return self.mix, 0.0
        _, ex, names = src.split(':')
        key = (ex, names)
        if key not in self.stems:
            base = os.path.join(HERE, 'out', 'stems', 'htdemucs_ft', 'rw_' + ex)
            y = sum(decode(os.path.join(base, n + '.wav')) for n in names.split('+'))
            self.stems[key] = y
        return self.stems[key], self.STEM_OFFSET[ex]

def lp_ramp(x, f0, f1, block=1024):
    if f0 >= 20000 and f1 >= 20000: return x
    y = np.empty_like(x); zi = None
    n = len(x)
    for i in range(0, n, block):
        k = (i + block / 2) / max(1, n)
        fc = float(np.exp(np.log(f0) + (np.log(f1) - np.log(f0)) * k))
        sos = signal.butter(2, min(fc, SR * 0.45), 'low', fs=SR, output='sos')
        if zi is None: zi = np.zeros((sos.shape[0], 2, 2))
        for c in range(2):
            y[i:i + block, c], zi[:, :, c] = signal.sosfilt(sos, x[i:i + block, c], zi=zi[:, :, c])
    return y

def width_ramp(x, w0, w1):
    if w0 == 1 and w1 == 1: return x
    w = np.linspace(w0, w1, len(x))[:, None]
    m = (x[:, :1] + x[:, 1:]) / 2; s = (x[:, :1] - x[:, 1:]) / 2
    return np.concatenate([m + s * w, m - s * w], axis=1)

def build(song, edl_path):
    g = json.load(open(os.path.join(HERE, 'song_grid.json')))
    T0, P = g['T0'], g['P']
    edl = json.load(open(edl_path))
    S = Sources(song)
    OUT0 = PRE
    total_beats = sum(s.get('beats', s.get('silence', 0)) for s in edl['segments'])
    n_out = int((OUT0 + (total_beats + edl.get('ring_beats', 0)) * P) * SR) + SR
    out = np.zeros((n_out, 2))
    ob = 0.0
    grid, segmap = [], []
    for s in edl['segments']:
        if 'silence' in s:
            grid += [dict(ob=ob + i, t=round(OUT0 + (ob + i) * P, 4), kind='silence') for i in range(int(s['silence']))]
            ob += s['silence']
            continue
        src, off = S.get(s.get('src', 'mix'))
        k, nb = s['k'], s['beats']
        tail = s.get('tail_beats', 0)
        a = T0 + k * P - PRE - off
        b = T0 + (k + nb + tail) * P - PRE - off + XF
        ia, ib = int(round(a * SR)), int(round(b * SR))
        seg = np.zeros((ib - ia, 2))
        lo, hi = max(0, ia), min(len(src), ib)
        if hi > lo: seg[lo - ia:hi - ia] = src[lo:hi]
        seg = seg * 10 ** (s.get('gain_db', 0) / 20)
        if 'lp' in s: seg = lp_ramp(seg, *s['lp'])
        if 'width' in s: seg = width_ramp(seg, *s['width'])
        body = int(round((nb * P) * SR))
        # equal-power fade-in over XF at the head (crossfade with whatever is already there)
        nx = int(XF * SR)
        seg[:nx] *= np.sin(np.linspace(0, np.pi / 2, nx))[:, None]
        if tail:
            nt = len(seg) - body
            seg[body:] *= np.cos(np.linspace(0, np.pi / 2, nt))[:, None] ** 2
        else:
            seg[body:] *= np.cos(np.linspace(0, np.pi / 2, len(seg) - body))[:, None]
        if s.get('fade_out_s'):
            nf = int(s['fade_out_s'] * SR)
            seg[body - nf:body] *= np.cos(np.linspace(0, np.pi / 2, nf))[:, None] ** 2
            seg[body:] = 0
        i0 = int(round((OUT0 + ob * P - PRE) * SR))
        # outgoing material under the incoming head gets the complementary fade (already faded by its own tail)
        j = min(len(out), i0 + len(seg))
        out[i0:j] += seg[: j - i0]
        grid += [dict(ob=ob + i, t=round(OUT0 + (ob + i) * P, 4), kind='music', k=k + i, src_t=round(T0 + (k + i) * P, 4)) for i in range(int(nb))]
        segmap.append(dict(ob=ob, k=k, beats=nb, src=s.get('src', 'mix'), out_t=round(OUT0 + ob * P, 4), src_t=round(T0 + k * P, 4)))
        ob += nb
    end = int(round((OUT0 + (ob + edl.get('ring_beats', 0)) * P) * SR))
    out = out[:end]
    if edl.get('final_silence_s'):
        nf = int(edl['final_silence_s'] * SR)
        out[-nf:] = 0
    return out, dict(T0_out=OUT0, P=P, bpm=round(60 / P, 3), beats=ob, duration=round(len(out) / SR, 4), grid=grid, segments=segmap)

if __name__ == '__main__':
    song = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'in', 'runaway.mp3')
    edl = sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, 'edl_runaway.json')
    y, meta = build(song, edl)
    sf.write(os.path.join(HERE, 'out', 'music2.wav'), y.astype(np.float32), SR, subtype='FLOAT')
    json.dump(meta, open(os.path.join(HERE, 'out', 'music2.json'), 'w'), indent=1)
    print(f"music2.wav {meta['duration']} s, {meta['beats']} beats, peak {np.abs(y).max():.3f}")
