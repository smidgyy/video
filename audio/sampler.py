"""Real-instrument sampler for the v2 score.

- Piano: Salamander Grand Piano (Yamaha C5), Alexander Holm, CC-BY 3.0
  ("Accurate" edition; per-file sample rates encode tuning, so files are resampled from their declared rate).
- Drums: CC0 kits from tidalcycles/Dirt-Samples (via AEmotionStudio drumstudio packs).
- Everything else: MuseScore General soundfont (MIT) rendered with FluidSynth from MIDI.
All deterministic: no randomness except seeded humanisation chosen by the caller.
"""
import glob, json, os, subprocess, tempfile
from fractions import Fraction
import numpy as np
import soundfile as sf
from scipy import signal

SR = 48000
SAMPLES = os.environ.get('VOICE_SAMPLES', '/home/user/samples')
SF3 = '/usr/share/sounds/sf3/MuseScore_General_Full.sf3'

def _load(path, mono=False):
    x, sr = sf.read(path, always_2d=True)
    x = x.astype(np.float64)
    if sr != SR:
        fr = Fraction(SR, sr).limit_denominator(2000)
        x = signal.resample_poly(x, fr.numerator, fr.denominator, axis=0)
    if mono:
        x = x.mean(axis=1)
    elif x.shape[1] == 1:
        x = np.repeat(x, 2, axis=1)
    return x

# ---------------------------------------------------------------- piano
class Piano:
    LAYERS = {5: 0.25, 9: 0.5, 12: 0.75, 15: 1.0}  # salamander velocity layer -> nominal velocity
    def __init__(self, max_len=8.0):
        self.cache = {}
        self.notes = {}
        for f in glob.glob(os.path.join(SAMPLES, 'salamander', '*.wav')):
            b = os.path.basename(f)
            midi = int(b[:3]); layer = int(b[-6:-4])
            self.notes.setdefault(midi, {})[layer] = f
        self.keys = sorted(self.notes)
        self.max_len = max_len
    def _sample(self, midi, layer):
        k = (midi, layer)
        if k not in self.cache:
            x = _load(self.notes[midi][layer])
            self.cache[k] = x[: int(self.max_len * SR)]
        return self.cache[k]
    def play(self, m, vel=0.7, dur=1.0, release=0.35, pedal=False):
        """Returns stereo array. dur = key-down time; release = damper fade after key-up (unless pedal)."""
        src = min(self.keys, key=lambda k: abs(k - m))
        layers = sorted(self.notes[src])
        # pick the two nearest layers and crossfade by velocity for smooth dynamics
        lv = [self.LAYERS.get(l, l / 15) for l in layers]
        i = int(np.clip(np.searchsorted(lv, vel), 1, len(lv) - 1))
        a, b = layers[i - 1], layers[i]
        w = float(np.clip((vel - lv[i - 1]) / (lv[i] - lv[i - 1]), 0, 1))
        xa, xb = self._sample(src, a), self._sample(src, b)
        n = min(len(xa), len(xb))
        x = xa[:n] * (1 - w) + xb[:n] * w
        st = m - src
        if st:
            ratio = 2 ** (st / 12)
            fr = Fraction(ratio).limit_denominator(400)
            x = signal.resample_poly(x, fr.denominator, fr.numerator, axis=0)
        L = int((dur + (2.5 if pedal else release)) * SR)
        x = x[:L].copy()
        if not pedal:
            k0 = int(dur * SR)
            if k0 < len(x):
                r = len(x) - k0
                x[k0:] *= np.exp(-np.arange(r) / SR / (release / 4.5))[:, None]
        else:
            x[-int(0.3 * SR):] *= np.linspace(1, 0, int(0.3 * SR))[:, None]
        gain = 0.35 + 0.65 * vel  # layers already carry timbre; scale level gently
        return x * gain

# ---------------------------------------------------------------- drums
class Kit:
    def __init__(self, name):
        d = os.path.join(SAMPLES, 'drums', name)
        man = json.load(open(os.path.join(d, 'manifest.json')))
        self.pads = {}
        for p in man['pads']:
            zones = []
            for f in sorted(glob.glob(os.path.join(d, 'samples', f"slot{p['slot']}_v*.wav"))):
                lo, hi = os.path.basename(f).split('_v')[1].split('_')[0].split('-')
                zones.append((int(lo), int(hi), _load(f, mono=True)))
            self.pads[p['label']] = zones
    def hit(self, label, vel=0.8, tune=0.0, length=None):
        zones = self.pads[label]
        v127 = int(np.clip(vel * 127, 1, 127))
        x = next((z[2] for z in zones if z[0] <= v127 <= z[1]), zones[-1][2])
        if tune:
            fr = Fraction(2 ** (tune / 12)).limit_denominator(400)
            x = signal.resample_poly(x, fr.denominator, fr.numerator)
        if length:
            x = x[: int(length * SR)].copy()
            x[-int(0.01 * SR):] *= np.linspace(1, 0, int(0.01 * SR))
        return x * (0.3 + 0.7 * vel)

# ---------------------------------------------------------------- soundfont stems (FluidSynth)
GM = {'acoustic_bass': 32, 'fingered_bass': 33, 'picked_bass': 34, 'fretless_bass': 35, 'nylon_guitar': 24, 'steel_guitar': 25,
      'jazz_guitar': 26, 'clean_guitar': 27, 'muted_guitar': 28, 'epiano1': 4, 'epiano2': 5, 'celesta': 8, 'glockenspiel': 9,
      'music_box': 10, 'vibraphone': 11, 'marimba': 12, 'strings': 48, 'slow_strings': 49, 'pizzicato': 45, 'choir_aahs': 52,
      'voice_oohs': 53, 'synth_voice': 54, 'flute': 73, 'whistle': 78, 'ocarina': 79, 'warm_pad': 89, 'halo_pad': 94,
      'cello': 42, 'contrabass': 43, 'harp': 46, 'trumpet_mute': 59, 'french_horn': 60, 'brass_section': 61, 'kalimba': 108}

def render_stem(notes, program, length, gain=1.0, cc=None):
    """notes: list of (t_start_sec, dur_sec, midi, vel 0..1). program: GM name or number. Returns stereo array (length sec)."""
    import mido
    prog = GM.get(program, program)
    mid = mido.MidiFile(ticks_per_beat=960)
    tr = mido.MidiTrack(); mid.tracks.append(tr)
    tempo = 500000  # 120 bpm; ticks are converted from seconds directly
    tr.append(mido.MetaMessage('set_tempo', tempo=tempo, time=0))
    tr.append(mido.Message('program_change', program=prog, channel=0, time=0))
    tr.append(mido.Message('control_change', control=91, value=0, channel=0, time=0))  # reverb send off
    tr.append(mido.Message('control_change', control=93, value=0, channel=0, time=0))  # chorus off
    for c, v in (cc or []):
        tr.append(mido.Message('control_change', control=c, value=v, channel=0, time=0))
    ev = []
    for (t0, d, m, v) in notes:
        ev.append((t0, 1, mido.Message('note_on', note=int(m), velocity=int(np.clip(v * 127, 1, 127)), channel=0)))
        ev.append((t0 + d, 0, mido.Message('note_off', note=int(m), velocity=0, channel=0)))
    ev.sort(key=lambda e: (e[0], e[1]))
    tps = 960 / (tempo / 1e6)
    last = 0
    for t, _, msg in ev:
        tick = int(round(t * tps))
        msg.time = max(0, tick - last); last = tick
        tr.append(msg)
    with tempfile.TemporaryDirectory() as td:
        mp, wp = os.path.join(td, 's.mid'), os.path.join(td, 's.wav')
        mid.save(mp)
        subprocess.run(['fluidsynth', '-ni', '-q', '-R', '0', '-C', '0', '-g', '0.6', '-r', str(SR), '-F', wp, SF3, mp], check=True, capture_output=True)
        x = _load(wp)
    n = int(length * SR)
    out = np.zeros((n, 2))
    m = min(n, len(x))
    out[:m] = x[:m]
    return out * gain
