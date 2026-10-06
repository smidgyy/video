"""Cut a supplied song to the film.

  python3 audio/song.py analyze <file>             beat grid + per-bar map (energy, brightness, low end, onsets, novelty)
  python3 audio/song.py edit <file> <edl.json>     assemble the edit -> audio/out/song_edit.wav + audio/out/song_edit.json

EDL (all positions are SOURCE bars/beats from `analyze`, 1-based bars, 0-based beats):
  {"segments": [
     {"from": [9, 0], "beats": 16},                   copy 16 beats starting at bar 9 beat 0
     {"silence": 1},                                  1 beat of true digital silence
     {"from": [25, 0], "beats": 8, "gain_db": 0},
     {"ring": [33, 0], "seconds": 3.2}                the hit at bar 33 beat 0, let ring (reverb freeze + fade)
   ],
   "xfade_ms": 18, "preroll_ms": 6, "fade_in_ms": 0}
Splices land a few ms BEFORE the incoming beat's transient so attacks stay intact; equal-power crossfades.
The output grid (beats/downbeats in output time) is written alongside, for timeline.json.
"""
import json, os, subprocess, sys, tempfile
import numpy as np
from scipy import signal

HERE = os.path.dirname(os.path.abspath(__file__))
SR = 48000

def decode(path):
    with tempfile.TemporaryDirectory() as td:
        out = os.path.join(td, 'x.wav')
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', path, '-vn', '-ac', '2', '-ar', str(SR), '-c:a', 'pcm_f32le', out], check=True)
        import soundfile as sf
        x, _ = sf.read(out, always_2d=True)
    return x.astype(np.float64)

def onset_env(sig, hop):
    f, tt, Z = signal.stft(sig, SR, nperseg=2048, noverlap=2048 - hop, boundary=None, padded=False)
    mag = np.log1p(1000 * np.abs(Z))
    return f, tt[1:], np.maximum(0, np.diff(mag, axis=1)), np.abs(Z)

def latency(hop):
    cal = np.zeros(int(6 * SR)); known = np.arange(0.5, 5.6, 0.5); rc = np.random.default_rng(1)
    for k in known:
        i = int(k * SR); n = int(0.2 * SR); tk = np.arange(n) / SR
        cal[i:i + n] += np.sin(2 * np.pi * (50 + 100 * np.exp(-tk / 0.03)) * tk) * np.exp(-tk / 0.12) + rc.standard_normal(n) * np.exp(-tk / 0.004) * 0.3
    _, ct, cflux, _ = onset_env(cal, hop)
    cenv = cflux.sum(axis=0)
    cpk, _ = signal.find_peaks(cenv, height=cenv.max() * 0.3, distance=int(0.2 / (hop / SR)))
    return float(np.mean([ct[p] - known[np.argmin(np.abs(known - ct[p]))] for p in cpk]))

def analyze(x, bpm_range=(80, 135)):
    m = x.mean(axis=1)
    hop = int(0.005 * SR); fr = SR / hop
    f, times, flux, mag = onset_env(m, hop)
    times = times - latency(hop)
    onset = flux.sum(axis=0); onset /= onset.max() + 1e-9
    low = flux[(f >= 30) & (f < 160)].sum(axis=0); low /= low.max() + 1e-9
    env = np.maximum(onset - signal.medfilt(onset, 41), 0)
    ac = np.correlate(env, env, 'full')[len(env) - 1:]
    lags = np.arange(len(ac)) / fr
    sel = (lags >= 60 / bpm_range[1]) & (lags <= 60 / bpm_range[0])
    i = np.where(sel)[0][np.argmax(ac[sel])]
    a, b, c = ac[i - 1], ac[i], ac[i + 1]
    period = (i + 0.5 * (a - c) / (a - 2 * b + c)) / fr
    dur = len(m) / SR
    # local phase tracking: fit the grid in 8-beat windows so slow drift (live playing) is followed
    best, phase = -1, 0
    for ph in np.arange(0, period, 0.001):
        g = np.arange(ph, dur, period)
        idx = np.clip(np.round((g - times[0]) * fr).astype(int), 0, len(env) - 1)
        s = (env[idx] + 0.5 * low[idx]).sum()
        if s > best: best, phase = s, ph
    grid = np.arange(phase, dur - 1e-6, period)
    beats = []
    for g in grid:
        lo, hi = np.searchsorted(times, g - 0.03), np.searchsorted(times, g + 0.03)
        if hi > lo and env[lo:hi].max() > 0.06:
            k = lo + np.argmax(env[lo:hi]); beats.append([float(times[k]), float(g), float(env[k]), True])
        else:
            beats.append([float(g), float(g), 0.0, False])
    # downbeat: phase of 4 maximising low-band + novelty on beat 1
    sc = []
    for o in range(4):
        s = 0
        for bt in beats[o::4]:
            k = int(np.clip(round((bt[0] - times[0]) * fr), 0, len(low) - 1)); s += low[k] + 0.5 * env[k]
        sc.append(s)
    db0 = int(np.argmax(sc))
    out = []
    for n, bt in enumerate(beats):
        out.append(dict(i=n, t=round(bt[0], 4), grid=round(bt[1], 4), strength=round(bt[2], 3), measured=bt[3], bar=(n - db0) // 4 + 1, beat=(n - db0) % 4))
    # per-bar descriptors
    bars = {}
    spec_t = times
    cen = (f[:, None] * mag[:, 1:]).sum(0) / (mag[:, 1:].sum(0) + 1e-9)
    lowE = (mag[(f >= 30) & (f < 150), 1:] ** 2).sum(0)
    allE = (mag[:, 1:] ** 2).sum(0)
    for bt in out:
        bars.setdefault(bt['bar'], []).append(bt['t'])
    rows = []
    feats = []
    for bar, ts in sorted(bars.items()):
        t0 = ts[0]; t1 = t0 + 4 * period
        s0, s1 = int(max(0, t0) * SR), int(min(dur, t1) * SR)
        if s1 - s0 < SR * 0.2: continue
        seg = m[s0:s1]
        rms = 20 * np.log10(np.sqrt((seg ** 2).mean()) + 1e-9)
        sl = (spec_t >= t0) & (spec_t < t1)
        rows.append(dict(bar=bar, t=round(t0, 3), rms_db=round(rms, 1), centroid=int(np.median(cen[sl])) if sl.any() else 0,
                         low_pct=round(100 * lowE[sl].sum() / (allE[sl].sum() + 1e-9), 1), onsets=int((env[sl] > 0.15).sum() // 3)))
        v = np.log1p(mag[:, 1:][:, sl].mean(1)); feats.append(v[: 400])
    F = np.array(feats); F = (F - F.mean(0)) / (F.std(0) + 1e-9)
    for k in range(len(rows)):
        prev = F[max(0, k - 2):k].mean(0) if k else F[0]
        rows[k]['novelty'] = round(float(np.linalg.norm(F[k] - prev) / np.sqrt(F.shape[1])), 2)
    return dict(bpm=round(60 / period, 3), period=round(period, 5), phase=round(phase, 4), downbeat_offset=db0, duration=round(dur, 3),
                beats=out, bars=rows)

def beat_time(an, bar, beat):
    for b in an['beats']:
        if b['bar'] == bar and b['beat'] == int(beat):
            return b['t'] + (beat - int(beat)) * an['period']
    raise KeyError((bar, beat))

def assemble(x, an, edl):
    P = an['period']; xf = edl.get('xfade_ms', 18) / 1000; pre = edl.get('preroll_ms', 6) / 1000
    out = np.zeros((0, 2)); grid = []; srcmap = []
    def append(seg, xfade):
        nonlocal out
        n = int(xfade * SR)
        if len(out) and n:
            w = np.linspace(0, np.pi / 2, n)[:, None]
            head = seg[:n]
            out[-n:] = out[-n:] * np.cos(w) + head * np.sin(w)
            out = np.concatenate([out, seg[n:]])
        else:
            out = np.concatenate([out, seg])
    for s in edl['segments']:
        tout = len(out) / SR
        if 'silence' in s:
            n = int(s['silence'] * P * SR)
            out = np.concatenate([out, np.zeros((n, 2))])
            grid += [dict(t=round(tout + pre + k * P, 4), kind='silence') for k in range(int(s['silence']))]
            continue
        if 'ring' in s:
            t0 = beat_time(an, *s['ring']) - pre
            L = int(s.get('seconds', 3.0) * SR)
            seg = x[int(t0 * SR): int(t0 * SR) + L].copy()
            # damp anything after the first beat so only the hit rings, then freeze it with a long reverb
            k1 = int((pre + P * s.get('hold_beats', 1)) * SR)
            gate = np.ones(len(seg)); gate[k1:] = np.exp(-np.arange(len(seg) - k1) / SR / 0.08)
            dry = seg * gate[:, None]
            import seq
            ir = seq.make_ir(rt60=s.get('rt60', 3.2), length=4.0, predelay=0.015, bright=5200, seed=11)
            wet = seq.convolve(np.concatenate([dry, np.zeros((len(seg), 2))]), ir, wet=1.0)[:len(seg)]
            wet *= np.sqrt((dry ** 2).mean() / ((wet ** 2).mean() + 1e-12)) * s.get('wet', 0.55)
            y = dry + wet
            fl = int(s.get('fade', 1.6) * SR); y[-fl:] *= np.cos(np.linspace(0, np.pi / 2, fl))[:, None] ** 2
            append(y * 10 ** (s.get('gain_db', 0) / 20), xf)
            grid.append(dict(t=round(tout + pre, 4), kind='ring', src=round(t0 + pre, 4)))
            continue
        bar, beat = s['from']
        t0 = beat_time(an, bar, beat) - pre
        n = int(round(s['beats'] * P * SR))
        seg = x[int(t0 * SR): int(t0 * SR) + n + int(xf * SR)].copy()
        if s.get('fade_in_ms'):
            k = int(s['fade_in_ms'] / 1000 * SR); seg[:k] *= np.sin(np.linspace(0, np.pi / 2, k))[:, None] ** 2
        seg *= 10 ** (s.get('gain_db', 0) / 20)
        if len(out):
            append(seg, xf)
            out = out[: int((tout + s['beats'] * P) * SR)]
        else:
            out = seg[:n]
        for k in range(int(s['beats'])):
            src_t = beat_time(an, bar, beat + 0) + k * P
            grid.append(dict(t=round(tout + pre + k * P, 4), kind='music', src=round(src_t, 4)))
        srcmap.append(dict(out=round(tout, 4), src=round(t0, 4), seconds=round(n / SR, 4)))
    return out, grid, srcmap

if __name__ == '__main__':
    cmd, path = sys.argv[1], sys.argv[2]
    x = decode(path)
    an = analyze(x)
    if cmd == 'analyze':
        json.dump(an, open(os.path.join(HERE, 'out', 'song_analysis.json'), 'w'), indent=1)
        print(f"bpm {an['bpm']}  period {an['period']}s  bar {4 * an['period']:.3f}s  duration {an['duration']}s  downbeat offset {an['downbeat_offset']}")
        meas = [b for b in an['beats'] if b['measured']]
        dev = [abs(b['t'] - b['grid']) * 1000 for b in meas]
        print(f"beats {len(an['beats'])} measured {len(meas)}  grid dev mean {np.mean(dev):.1f} ms  max {np.max(dev):.1f} ms")
        print(' bar      t    rms  centroid  low%  onsets  novelty')
        for r in an['bars']:
            print(f"{r['bar']:4d} {r['t']:7.2f} {r['rms_db']:6.1f} {r['centroid']:8d} {r['low_pct']:5.1f} {r['onsets']:6d} {r['novelty']:7.2f}  " + '#' * int(max(0, r['rms_db'] + 40)))
    elif cmd == 'edit':
        edl = json.load(open(sys.argv[3]))
        y, grid, srcmap = assemble(x, an, edl)
        import soundfile as sf
        sf.write(os.path.join(HERE, 'out', 'song_edit.wav'), y.astype(np.float32), SR, subtype='FLOAT')
        json.dump(dict(source=os.path.basename(path), bpm=an['bpm'], period=an['period'], duration=round(len(y) / SR, 4), grid=grid, map=srcmap),
                  open(os.path.join(HERE, 'out', 'song_edit.json'), 'w'), indent=1)
        print(f"edit {len(y) / SR:.3f}s  beats {len(grid)}")
