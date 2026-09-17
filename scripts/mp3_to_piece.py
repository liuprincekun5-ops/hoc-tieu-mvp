#!/usr/bin/env python3
"""Rough pitch→xiao key AMT stub for tieu.piece.v1 sample generation."""
import json, math, os, sys
from pathlib import Path

import librosa
import numpy as np

MAP_PATH = Path('/workspace/hoc-tieu-mvp/public/data/xiao-g-8.json')
AUDIO = Path(sys.argv[1] if len(sys.argv) > 1 else '')
OUT_DIR = Path('/workspace/audio-out')
OUT_DIR.mkdir(parents=True, exist_ok=True)

with MAP_PATH.open() as f:
    tmap = json.load(f)

FREQ = {}
for k, v in tmap['taughtIn16'].items():
    if v.get('freqHz'):
        FREQ[k] = float(v['freqHz'])

# Prefer melodic keys (exclude blow)
KEYS = ['Re', 'Mi', 'Fi', 'Sol', 'La', 'Si', 'Re2']

def nearest_key(hz: float) -> str | None:
    if hz is None or not np.isfinite(hz) or hz < 180 or hz > 700:
        return None
    best, bd = None, 1e9
    for k in KEYS:
        f = FREQ[k]
        # cents distance
        d = abs(1200 * math.log2(hz / f))
        if d < bd:
            bd, best = d, k
    if bd <= 60:  # within 60 cents
        return best
    # try octave fold into range
    for oct_shift in (-1, 1, -2, 2):
        hz2 = hz * (2 ** oct_shift)
        if hz2 < 180 or hz2 > 700:
            continue
        for k in KEYS:
            f = FREQ[k]
            d = abs(1200 * math.log2(hz2 / f))
            if d < bd:
                bd, best = d, k
        if bd <= 55:
            return best
    return None

print('loading', AUDIO)
y, sr = librosa.load(str(AUDIO), sr=22050, mono=True)
dur = len(y) / sr
print(f'duration={dur:.1f}s sr={sr}')

# Focus on first 90s for a playable sample piece (full file can be huge)
MAX_SEC = min(90.0, dur)
y = y[: int(MAX_SEC * sr)]

f0, voiced_flag, voiced_probs = librosa.pyin(
    y,
    fmin=librosa.note_to_hz('A3'),
    fmax=librosa.note_to_hz('E5'),
    sr=sr,
    frame_length=2048,
    hop_length=512,
)
times = librosa.times_like(f0, sr=sr, hop_length=512)
# RMS for rest detection
rms = librosa.feature.rms(y=y, frame_length=2048, hop_length=512)[0]
rms = np.resize(rms, f0.shape)
thr = float(np.percentile(rms[np.isfinite(rms)], 35))

# Quantize to sequence of keys with min duration
raw = []
for t, hz, v, r in zip(times, f0, voiced_flag, rms):
    if (not v) or r < thr or hz is None or not np.isfinite(hz):
        key = 'rest'
    else:
        key = nearest_key(float(hz)) or 'rest'
    raw.append((float(t), key))

# Merge consecutive same keys; drop short rests / short notes
merged = []
for t, key in raw:
    if not merged:
        merged.append([t, key, t])
        continue
    if key == merged[-1][1]:
        merged[-1][2] = t
    else:
        merged.append([t, key, t])

# Filter: keep notes lasting >= 0.18s; absorb short into neighbors
clean = []
for start, key, end in merged:
    if end - start < 0.18:
        continue
    if clean and key == clean[-1][1]:
        clean[-1][2] = end
    else:
        clean.append([start, key, end])

# Estimate BPM from note onsets
onsets = [s for s, k, e in clean if k != 'rest']
bpm = 60
if len(onsets) >= 4:
    gaps = np.diff(onsets)
    gaps = gaps[(gaps > 0.25) & (gaps < 2.5)]
    if len(gaps):
        med = float(np.median(gaps))
        bpm = max(40, min(100, round(60 / med)))

# Build events on beat timeline (tBeat = time * bpm/60)
events = []
for start, key, end in clean:
    tBeat = round(start * bpm / 60.0, 2)
    if events and events[-1]['key'] == key and abs(tBeat - events[-1]['tBeat']) < 0.15:
        continue
    events.append({'tBeat': tBeat, 'key': key})

# Cap events for LED usability
MAX_EV = 80
if len(events) > MAX_EV:
    events = events[:MAX_EV]

stem = AUDIO.stem[:12]
piece_id = 'user_mp3_sample_01'
piece = {
    'schema': 'tieu.piece.v1',
    'pieceId': piece_id,
    'title': 'Bài từ file của bạn (mẫu AMT)',
    'instrument': 'xiao_g_8',
    'grip': 'left_on_top',
    'tonicSystem': 'tube_as_5',
    'bpm': int(bpm),
    'beatsPerEvent': 1,
    'keysAllowed': KEYS + ['rest'],
    'sourceJob': 'job_user_mp3_01',
    'goal': 'Phổ ước lượng từ file upload — kiểm tra tay trên tiêu, không thay bản gốc.',
    'note': f'AMT thô từ MP3 (~{MAX_SEC:.0f}s đầu / {dur:.0f}s). Map vào nốt taughtIn16 (±60 cents). Kết quả chỉ mang tính gợi ý.',
    'events': events,
    'after': {
        'intro': 'Bản phổ máy ước lượng từ file bạn gửi. Hãy nghe LED rồi chỉnh lại nếu lệch.',
        'items': [
            {'atBeat': events[0]['tBeat'] if events else 0, 'title': 'Mở đầu', 'text': 'Nghe vài nốt đầu — chỉnh hơi cho khớp Rê ống.'},
            {'atBeat': events[min(10, len(events)-1)]['tBeat'] if events else 1, 'title': 'Nhịp', 'text': f'BPM ước lượng ~{bpm}. Có thể chậm lại nếu khó theo.'},
            {'atBeat': events[min(25, len(events)-1)]['tBeat'] if len(events) > 5 else 2, 'title': 'Kiểm nốt', 'text': 'Nốt lệch nửa cung đã bị ép về gam 16 bài — kiểm tay.'},
        ],
    },
}

# Simple analyze job companion
segments = []
# 3 chunks of the analyzed window
chunk = MAX_SEC / 3
for i, status in enumerate(['locked', 'locked', 'locked']):
    st = i * chunk
    en = (i + 1) * chunk
    segs_events = [e for e in events if st * bpm / 60 <= e['tBeat'] < en * bpm / 60]
    notes = []
    for e in segs_events:
        onset_ms = int(e['tBeat'] * 60 / bpm * 1000)
        key = e['key']
        entry = tmap['taughtIn16'].get(key, {})
        notes.append({
            'onsetMs': onset_ms,
            'durationMs': 400,
            'key': None if key == 'rest' else key,
            'jianpu': entry.get('jianpu'),
            'holes': entry.get('holes'),
            'confidence': 0.72,
            'breath': key == 'rest',
        })
    segments.append({
        'id': f'seg_{chr(ord("a")+i)}',
        'startMs': int(st * 1000),
        'endMs': int(en * 1000),
        'status': 'locked',
        'confidence': 0.75,
        'autoPasses': 1,
        'chosenBy': 'user',
        'notes': notes,
    })

analyze = {
    'schema': 'tieu.analyze.v1',
    'stubLabel': 'AMT thô (librosa.pyin) — mẫu từ file người dùng; không phải nhận dạng studio.',
    'job': {
        'id': 'job_user_mp3_01',
        'source': {
            'filename': AUDIO.name,
            'durationMs': int(dur * 1000),
            'audioId': 'user_upload_mp3_01',
        },
        'progress': {
            'lockedMs': int(MAX_SEC * 1000),
            'unsureMs': 0,
            'emptyMs': 0,
            'percentAccepted': 100,
        },
    },
    'loop': {'round': 1, 'activeSegmentId': 'seg_a'},
    'segments': segments,
}

piece_path = OUT_DIR / 'user_mp3_sample_01.exported.json'
analyze_path = OUT_DIR / 'job_user_mp3_01.analyze.json'
piece_path.write_text(json.dumps(piece, ensure_ascii=False, indent=2), encoding='utf-8')
analyze_path.write_text(json.dumps(analyze, ensure_ascii=False, indent=2), encoding='utf-8')
print('events', len(events), 'bpm', bpm)
print('keys', {e['key'] for e in events})
print('wrote', piece_path, analyze_path)
print(json.dumps(events[:12], ensure_ascii=False))
