"""Critique kit for a RENDERED film (never the code). Usage:
    python3 -I scripts/review.py renders/16x9.mp4 review/r1
Produces in the output dir:
  contact.jpg          2 fps contact sheet with timecodes
  phone_contact.jpg    the same at 360 px wide (X mobile timeline size)
  phone_keys.jpg       key frames at 360 px
  motion_strips.jpg    consecutive 60 fps frames around the 4 fastest-motion moments
  swaps.jpg            frames straddling every shot change (caption swaps / double exposure check)
  loop.jpg             last 0.5 s -> first 0.5 s
  first_frame.png, end_card.png
  metrics.json         stream, loudness, holds, black frames, motion, sync
"""
import json, os, subprocess, sys
import numpy as np

src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
tl = json.load(open(os.path.join(ROOT, 'timeline.json')))

def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True)

def ff(*a):
    r = run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', *a])
    if r.returncode: print(r.stderr[-800:])

probe = json.loads(run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', src]).stdout)
v = next(s for s in probe['streams'] if s['codec_type'] == 'video')
a = next((s for s in probe['streams'] if s['codec_type'] == 'audio'), None)
W, H = v['width'], v['height']
fps = eval(v['r_frame_rate'])
dur = float(probe['format']['duration'])

# ---------- sheets ----------
lab = "drawtext=text='%{pts\\:hms}':x=6:y=6:fontsize=18:fontcolor=white:box=1:boxcolor=black@0.55"
ff('-i', src, '-vf', f'fps=2,scale=480:-1,{lab},tile=6x8:padding=4:color=0x222222', '-frames:v', '1', f'{out}/contact.jpg')
ff('-i', src, '-vf', 'fps=2,scale=360:-1:flags=area,tile=6x8:padding=3:color=0x222222', '-frames:v', '1', f'{out}/phone_contact.jpg')
keys = sorted(set([0.0] + [s['start'] + 0.6 for s in tl['shots']] + [dur - 0.05]))
sel = '+'.join(f'between(t\\,{k:.3f}\\,{k + 0.5 / fps:.3f})' for k in keys)
ff('-i', src, '-vf', f"select='{sel}',scale=360:-1:flags=area,tile=4x5:padding=3:color=0x222222", '-vsync', '0', '-frames:v', '1', f'{out}/phone_keys.jpg')
ff('-ss', '0', '-i', src, '-frames:v', '1', f'{out}/first_frame.png')
ff('-ss', f'{dur - 0.05:.3f}', '-i', src, '-frames:v', '1', f'{out}/end_card.png')

# ---------- motion analysis on 160x90 greyscale ----------
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-vf', 'scale=160:90,format=gray', '-f', 'rawvideo', '-'], capture_output=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, 90, 160).astype(np.float32)
diff = np.abs(np.diff(fr, axis=0)).mean(axis=(1, 2))
times = (np.arange(len(diff)) + 1) / fps
# holds: runs of near-zero change longer than 0.8 s (excluding the deliberate end-card settle)
still = diff < 0.35
holds, run_start = [], None
for i, s in enumerate(still):
    if s and run_start is None: run_start = i
    if (not s or i == len(still) - 1) and run_start is not None:
        L = (i - run_start) / fps
        if L >= 0.8: holds.append([round(times[run_start], 2), round(L, 2)])
        run_start = None
# fastest motion moments (peaks separated by >= 1 s)
order = np.argsort(-diff)
peaks = []
for i in order:
    if all(abs(i - p) > fps for p in peaks): peaks.append(int(i))
    if len(peaks) == 4: break
peaks.sort()
strip_sel = '+'.join(f'eq(n\\,{p + d})' for p in peaks for d in range(-3, 5))
ff('-i', src, '-vf', f"select='{strip_sel}',scale=384:-1,tile=8x4:padding=3:color=0x222222", '-vsync', '0', '-frames:v', '1', f'{out}/motion_strips.jpg')
# shot-change strips (frames -6,-3,-1,0,+1,+3,+6,+10 around each start)
starts = [s['start'] for s in tl['shots'][1:]]
swap_frames = [max(0, int(round(s * fps)) + d) for s in starts for d in (-6, -3, -1, 0, 1, 3, 6, 10)]
ff('-i', src, '-vf', f"select='{'+'.join(f'eq(n\\,{f})' for f in swap_frames)}',scale=320:-1,tile=8x{len(starts)}:padding=3:color=0x222222", '-vsync', '0', '-frames:v', '1', f'{out}/swaps.jpg')
# loop seam: last 0.5 s then first 0.5 s
nlast = int(round(dur * fps))
lf = [nlast - k for k in (30, 20, 10, 4, 2, 1)]
ff('-i', src, '-vf', f"select='{'+'.join(f'eq(n\\,{f})' for f in lf)}',scale=320:-1,tile=6x1:padding=3", '-vsync', '0', '-frames:v', '1', f'{out}/loop_end.jpg')
ff('-i', src, '-vf', "select='eq(n\\,0)+eq(n\\,1)+eq(n\\,2)+eq(n\\,6)+eq(n\\,15)+eq(n\\,30)',scale=320:-1,tile=6x1:padding=3", '-vsync', '0', '-frames:v', '1', f'{out}/loop_start.jpg')
run(['convert', f'{out}/loop_end.jpg', f'{out}/loop_start.jpg', '-append', f'{out}/loop.jpg'])
for f in ('loop_end.jpg', 'loop_start.jpg'):
    if os.path.exists(f'{out}/{f}'): os.remove(f'{out}/{f}')

# ---------- audio ----------
loud = {}
if a:
    r = run(['ffmpeg', '-hide_banner', '-nostats', '-i', src, '-af', 'ebur128=peak=true', '-f', 'null', '-'])
    txt = r.stderr[r.stderr.rfind('Summary'):]
    import re
    m = re.search(r'I:\s*(-?[\d.]+) LUFS', txt); loud['integrated_lufs'] = float(m.group(1)) if m else None
    m = re.search(r'LRA:\s*([\d.]+) LU', txt); loud['lra'] = float(m.group(1)) if m else None
    m = re.search(r'True peak:\s*Peak:\s*(-?[\d.]+)', txt, re.S); loud['true_peak_dbtp'] = float(m.group(1)) if m else None
    pcm = subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-f', 'f32le', '-ac', '2', '-ar', '48000', '-'], capture_output=True).stdout
    au = np.frombuffer(pcm, np.float32).reshape(-1, 2)
    loud['seam_last_ms_rms_db'] = round(float(20 * np.log10(np.sqrt((au[-2400:] ** 2).mean()) + 1e-9)), 1)
    loud['seam_first_ms_rms_db'] = round(float(20 * np.log10(np.sqrt((au[:2400] ** 2).mean()) + 1e-9)), 1)
    loud['seam_jump'] = round(float(np.abs(au[0] - au[-1]).max()), 4)

# ---------- picture/sound sync: every SFX event should coincide with a visual change ----------
sync = []
for e in tl['events']:
    if not e.get('sfx'): continue
    i = int(round(e['t'] * fps))
    win = diff[max(0, i - 6): i + 7]
    if not len(win): continue
    k = int(np.argmax(win)) - min(6, i)
    sync.append(dict(id=e['id'], t=e['t'], visual_peak_offset_frames=k, change=round(float(win.max()), 2)))
# visual sync sheet: for every SFX event, the frame 2 before and 4 after (picture must change on the sound)
ev = [e for e in tl['events'] if e.get('sfx')]
pairs = [max(0, int(round(e['t'] * fps)) + d) for e in ev for d in (-2, 4)]
ff('-i', src, '-vf', f"select='{'+'.join(f'eq(n\\,{f})' for f in sorted(set(pairs)))}',scale=240:-1,tile=10x{(len(set(pairs)) + 9) // 10}:padding=2:color=0x333333", '-vsync', '0', '-frames:v', '1', f'{out}/sync_pairs.jpg')
late = [s for s in sync if abs(s['visual_peak_offset_frames']) > 4 and s['change'] > 0.5]
weak = [s for s in sync if s['change'] <= 0.5]

metrics = dict(file=src, width=W, height=H, fps=fps, duration=round(dur, 3), codec=v['codec_name'], profile=v.get('profile'), pix_fmt=v['pix_fmt'],
               color=dict(space=v.get('color_space'), primaries=v.get('color_primaries'), transfer=v.get('color_transfer'), range=v.get('color_range')),
               bitrate_kbps=round(int(probe['format']['bit_rate']) / 1000), audio=dict(codec=a['codec_name'], sr=a['sample_rate'], kbps=round(int(a.get('bit_rate', 0)) / 1000)) if a else None,
               loudness=loud, holds_over_0_8s=holds, fastest_motion_t=[round(times[p], 3) for p in peaks],
               mean_motion_per_second=[round(float(diff[int(s * fps):int((s + 1) * fps)].mean()), 2) for s in range(int(dur))],
               first_frame_mean_luma=round(float(fr[0].mean()), 1), sync_checked=len(sync), sync_off_by_more_than_4_frames=late, sync_no_visual_change=weak)
json.dump(metrics, open(f'{out}/metrics.json', 'w'), indent=1)
print(json.dumps({k: metrics[k] for k in ('duration', 'fps', 'pix_fmt', 'color', 'bitrate_kbps', 'audio', 'loudness', 'holds_over_0_8s', 'fastest_motion_t', 'first_frame_mean_luma')}, indent=1))
print('motion/s', metrics['mean_motion_per_second'])
print('sync late:', [(s['id'], s['visual_peak_offset_frames']) for s in late])
print('sync weak:', [s['id'] for s in weak])
