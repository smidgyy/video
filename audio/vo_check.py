"""Objective VO checks (we cannot listen): ASR transcript vs script (intelligibility) and F0 range (monotone = robotic).
Usage: python3 audio/vo_check.py file.wav [file.wav ...]"""
import sys, numpy as np, soundfile as sf
from scipy import signal
from faster_whisper import WhisperModel
m = WhisperModel('base.en', device='cpu', compute_type='int8', download_root='/home/user/tts/whisper')
def f0_track(x, sr):
    hop = int(0.01 * sr); win = int(0.04 * sr); f0 = []
    for i in range(0, len(x) - win, hop):
        seg = x[i:i + win] * np.hanning(win)
        if np.sqrt(np.mean(seg ** 2)) < 0.02: continue
        ac = np.correlate(seg, seg, 'full')[win - 1:]; lo, hi = int(sr / 400), int(sr / 70)
        k = np.argmax(ac[lo:hi]) + lo
        if ac[k] / ac[0] > 0.45: f0.append(sr / k)
    return np.array(f0)
for f in sys.argv[1:]:
    x, sr = sf.read(f)
    if x.ndim > 1: x = x.mean(axis=1)
    x16 = signal.resample_poly(x, 16000, sr).astype(np.float32)
    segs, _ = m.transcribe(x16, language='en', beam_size=5)
    text = ' '.join(s.text.strip() for s in segs)
    f0 = f0_track(x, sr)
    st = 12 * np.log2(f0 / np.median(f0)) if len(f0) else np.array([0.0])
    print(f.split('/')[-1].ljust(18), f'F0 {np.median(f0):4.0f} Hz  range {np.percentile(st, 95) - np.percentile(st, 5):4.1f} st |', text)
