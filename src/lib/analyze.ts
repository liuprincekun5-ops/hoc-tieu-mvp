import type {
  AnalyzeNote,
  AnalyzeSegment,
  HoleState,
  TieuAnalyze,
  TieuMap,
  TieuPiece,
} from '../types/tieu';

export const MAX_RERUN = 3;
const STUB_KEYS = ['Re', 'Mi', 'Sol', 'La', 'Si', 'rest'] as const;

function nowIso(): string {
  return new Date().toISOString();
}

function holesFor(map: TieuMap, key: string | null): HoleState[] | null {
  if (!key) return null;
  return map.taughtIn16[key]?.holes ?? null;
}

function jianpuFor(map: TieuMap, key: string | null): string | null {
  if (!key) return null;
  return map.taughtIn16[key]?.jianpu ?? null;
}

function recomputeProgress(job: TieuAnalyze): TieuAnalyze {
  let lockedMs = 0;
  let unsureMs = 0;
  let emptyMs = 0;
  let acceptedMs = 0;
  const total = Math.max(1, job.job.source.durationMs);
  for (const s of job.segments) {
    const dur = Math.max(0, s.endMs - s.startMs);
    if (s.status === 'locked' || s.status === 'skipped') {
      lockedMs += dur;
      acceptedMs += dur;
    } else if (s.status === 'unsure' || s.status === 'user_edited') {
      unsureMs += dur;
    } else {
      emptyMs += dur;
    }
  }
  return {
    ...job,
    job: {
      ...job.job,
      progress: {
        lockedMs,
        unsureMs,
        emptyMs,
        percentAccepted: Math.round((acceptedMs / total) * 100),
      },
    },
  };
}

function nextOpenId(segments: AnalyzeSegment[]): string | null {
  return (
    segments.find(
      (s) =>
        s.status === 'empty' ||
        s.status === 'unsure' ||
        s.status === 'user_edited'
    )?.id ?? null
  );
}

/** Stub: slice duration into 3 segments (locked / unsure / empty). */
export function stubAnalyzeFromDuration(
  filename: string,
  durationMs: number,
  map: TieuMap,
  audioId: string
): TieuAnalyze {
  const dur = Math.max(3000, durationMs);
  const aEnd = Math.floor(dur * 0.38);
  const bEnd = Math.floor(dur * 0.62);

  const mkNotes = (
    start: number,
    end: number,
    keys: string[],
    confBase: number
  ): AnalyzeNote[] => {
    const span = end - start;
    const step = Math.max(400, Math.floor(span / Math.max(1, keys.length)));
    return keys.map((key, i) => {
      const onsetMs = Math.min(end - 100, start + i * step + 200);
      return {
        onsetMs,
        durationMs: Math.min(700, step - 50),
        key,
        jianpu: jianpuFor(map, key),
        holes: holesFor(map, key),
        confidence: confBase - i * 0.05,
        breath: key === 'rest',
      };
    });
  };

  const segments: AnalyzeSegment[] = [
    {
      id: 'seg_a',
      startMs: 0,
      endMs: aEnd,
      status: 'locked',
      confidence: 0.88,
      autoPasses: 1,
      chosenBy: 'user',
      notes: mkNotes(0, aEnd, ['Re', 'Mi', 'Sol', 'rest'], 0.9),
    },
    {
      id: 'seg_b',
      startMs: aEnd,
      endMs: bEnd,
      status: 'unsure',
      confidence: 0.6,
      autoPasses: 1,
      chosenBy: 'model',
      notes: [
        ...mkNotes(aEnd, bEnd, ['Sol', 'La'], 0.7),
        {
          onsetMs: aEnd + Math.floor((bEnd - aEnd) * 0.55),
          durationMs: 400,
          key: null,
          jianpu: null,
          holes: null,
          confidence: 0.25,
          flag: 'blank',
        },
      ],
    },
    {
      id: 'seg_c',
      startMs: bEnd,
      endMs: dur,
      status: 'empty',
      confidence: 0.28,
      autoPasses: 0,
      chosenBy: null,
      notes: [],
      gapReason: 'stub_placeholder',
    },
  ];

  return recomputeProgress({
    schema: 'tieu.analyze.v1',
    job: {
      id: `job_local_${Date.now()}`,
      createdAt: nowIso(),
      status: 'waiting_user',
      instrument: { id: 'xiao_g_8', grip: 'left_on_top' },
      source: { filename, durationMs: dur, license: 'user_owned' },
      progress: { lockedMs: 0, unsureMs: 0, emptyMs: 0, percentAccepted: 0 },
    },
    settings: {
      notation: 'jianpu',
      tonicSystem: 'tube_as_5',
      maxAutoPassPerSegment: MAX_RERUN,
      confidenceLock: 0.82,
      confidenceUnsure: 0.55,
    },
    segments,
    loop: {
      round: 1,
      activeSegmentId: 'seg_c',
      waitingAction: 'user_command',
      allowedActions: [
        'listen',
        'rerun_segment',
        'enter_notes',
        'skip_segment',
        'lock_segment',
      ],
      history: [
        {
          round: 1,
          action: 'stub_first_pass',
          actor: 'model',
          result: 'filled_placeholders',
        },
      ],
    },
    localAudioId: audioId,
    stubLabel: 'thử nghiệm / stub — không phải nhận dạng thật',
  });
}

/** Normalize pack demo analyze JSON into runtime shape. */
export function adoptDemoAnalyze(
  raw: unknown,
  audioId?: string
): TieuAnalyze {
  const any = raw as Record<string, unknown>;
  const jobRaw = (any.job ?? {}) as Record<string, unknown>;
  const progressRaw = (jobRaw.progress ?? {}) as Record<string, unknown>;
  const segmentsRaw = (any.segments ?? []) as Record<string, unknown>[];
  const loopRaw = (any.loop ?? {}) as Record<string, unknown>;
  const settingsRaw = (any.settings ?? {}) as Record<string, unknown>;
  const source = (jobRaw.source ?? {}) as Record<string, unknown>;
  const instrument = (jobRaw.instrument ?? {
    id: 'xiao_g_8',
    grip: 'left_on_top',
  }) as { id: string; grip: string };

  const segments: AnalyzeSegment[] = segmentsRaw.map((s) => ({
    id: String(s.id),
    startMs: Number(s.startMs ?? 0),
    endMs: Number(s.endMs ?? 0),
    status: (s.status as AnalyzeSegment['status']) ?? 'empty',
    confidence: Number(s.confidence ?? 0),
    autoPasses: Number(s.autoPasses ?? 0),
    chosenBy: (s.chosenBy ?? null) as AnalyzeSegment['chosenBy'],
    notes: ((s.notes as Record<string, unknown>[]) ?? []).map((n) => ({
      onsetMs: Number(n.onsetMs ?? 0),
      durationMs: Number(n.durationMs ?? 0),
      key: (n.key as string | null) ?? null,
      jianpu: (n.jianpu as string | null) ?? null,
      holes: (n.holes as HoleState[] | null) ?? null,
      confidence: n.confidence != null ? Number(n.confidence) : undefined,
      flag: n.flag as string | undefined,
      breath: Boolean(n.breath),
    })),
    gapReason: s.gapReason as string | undefined,
    lockedAt: s.lockedAt as string | undefined,
  }));

  const historyRaw = (loopRaw.history as Record<string, unknown>[]) ?? [];

  return recomputeProgress({
    schema: 'tieu.analyze.v1',
    job: {
      id: String(jobRaw.id ?? 'job_demo'),
      createdAt: String(jobRaw.createdAt ?? nowIso()),
      status: String(jobRaw.status ?? 'waiting_user'),
      instrument,
      source: {
        filename: String(source.filename ?? 'demo.wav'),
        durationMs: Number(source.durationMs ?? 32000),
        license: String(source.license ?? 'user_owned'),
      },
      progress: {
        lockedMs: Number(progressRaw.lockedMs ?? 0),
        unsureMs: Number(progressRaw.unsureMs ?? 0),
        emptyMs: Number(progressRaw.emptyMs ?? 0),
        percentAccepted: Number(progressRaw.percentAccepted ?? 0),
      },
    },
    settings: {
      notation: String(settingsRaw.notation ?? 'jianpu'),
      tonicSystem: String(settingsRaw.tonicSystem ?? 'tube_as_5'),
      maxAutoPassPerSegment: Number(
        settingsRaw.maxAutoPassPerSegment ?? MAX_RERUN
      ),
      confidenceLock: Number(settingsRaw.confidenceLock ?? 0.82),
      confidenceUnsure: Number(settingsRaw.confidenceUnsure ?? 0.55),
    },
    segments,
    loop: {
      round: Number(loopRaw.round ?? 1),
      activeSegmentId: (loopRaw.activeSegmentId as string | null) ?? null,
      waitingAction: String(loopRaw.waitingAction ?? 'user_command'),
      allowedActions: (loopRaw.allowedActions as string[]) ?? [
        'listen',
        'rerun_segment',
        'enter_notes',
        'skip_segment',
        'lock_segment',
      ],
      history: historyRaw.map((h) => ({
        round: Number(h.round ?? 0),
        action: String(h.action ?? ''),
        actor: String(h.actor ?? ''),
        segmentId: h.segmentId as string | undefined,
        result: h.result as string | undefined,
        passesUsed: h.passesUsed != null ? Number(h.passesUsed) : undefined,
      })),
    },
    localAudioId: audioId,
    stubLabel: 'thử nghiệm / stub — bản demo gói giấy',
  });
}

export function selectSegment(
  job: TieuAnalyze,
  segmentId: string
): TieuAnalyze {
  return {
    ...job,
    loop: {
      ...job.loop,
      activeSegmentId: segmentId,
      waitingAction: 'user_command',
    },
  };
}

export function canRerun(seg: AnalyzeSegment, max = MAX_RERUN): boolean {
  return (
    seg.autoPasses < max &&
    seg.status !== 'locked' &&
    seg.status !== 'skipped'
  );
}

export function rerunSegment(
  job: TieuAnalyze,
  segmentId: string,
  map: TieuMap
): { ok: true; job: TieuAnalyze } | { ok: false; error: string } {
  const seg = job.segments.find((s) => s.id === segmentId);
  if (!seg) return { ok: false, error: 'segment_missing' };
  if (seg.status === 'locked' || seg.status === 'skipped') {
    return { ok: false, error: 'segment_locked' };
  }
  if (seg.autoPasses >= job.settings.maxAutoPassPerSegment) {
    return { ok: false, error: 'max_rerun' };
  }
  const passes = seg.autoPasses + 1;
  const span = seg.endMs - seg.startMs;
  const keys = STUB_KEYS.slice(0, 3);
  const notes: AnalyzeNote[] = keys.map((key, i) => {
    const onsetMs = seg.startMs + Math.floor((span * (i + 0.2)) / 4);
    const leaveBlank = passes < 3 && i === 1;
    if (leaveBlank) {
      return {
        onsetMs,
        durationMs: 400,
        key: null,
        jianpu: null,
        holes: null,
        confidence: 0.22,
        flag: 'blank',
      };
    }
    return {
      onsetMs,
      durationMs: 550,
      key,
      jianpu: jianpuFor(map, key),
      holes: holesFor(map, key),
      confidence: 0.55 + passes * 0.08,
      breath: key === 'rest',
    };
  });
  const stillBlank = notes.some((n) => n.key == null);
  const updated: AnalyzeSegment = {
    ...seg,
    autoPasses: passes,
    chosenBy: 'model',
    notes,
    status: 'unsure',
    confidence: stillBlank ? 0.55 + passes * 0.05 : 0.72,
    gapReason: stillBlank ? 'stub_partial' : undefined,
  };
  const segments = job.segments.map((s) =>
    s.id === segmentId ? updated : s
  );
  const round = job.loop.round + 1;
  return {
    ok: true,
    job: recomputeProgress({
      ...job,
      segments,
      loop: {
        ...job.loop,
        round,
        activeSegmentId: segmentId,
        history: [
          ...job.loop.history,
          {
            round,
            action: 'rerun_segment',
            actor: 'user',
            segmentId,
            passesUsed: passes,
            result: stillBlank ? 'still_unsure' : 'filled_stub',
          },
        ],
      },
    }),
  };
}

export function enterNoteOnBlank(
  job: TieuAnalyze,
  segmentId: string,
  onsetMs: number,
  key: string,
  map: TieuMap
): TieuAnalyze {
  const fill = (n: AnalyzeNote): AnalyzeNote => ({
    ...n,
    key,
    jianpu: jianpuFor(map, key),
    holes: holesFor(map, key),
    confidence: 1,
    flag: undefined,
    breath: key === 'rest',
  });

  const segments = job.segments.map((s) => {
    if (s.id !== segmentId) return s;
    let filled = false;
    const notes = s.notes.map((n) => {
      if (filled) return n;
      if (n.onsetMs === onsetMs && (n.key == null || n.flag === 'blank')) {
        filled = true;
        return fill(n);
      }
      return n;
    });
    if (!filled) {
      const idx = notes.findIndex((n) => n.key == null);
      if (idx >= 0) notes[idx] = fill(notes[idx]);
      else {
        notes.push({
          onsetMs,
          durationMs: 400,
          key,
          jianpu: jianpuFor(map, key),
          holes: holesFor(map, key),
          confidence: 1,
          breath: key === 'rest',
        });
      }
    }
    return {
      ...s,
      notes,
      status: 'user_edited' as const,
      chosenBy: 'user' as const,
      gapReason: undefined,
    };
  });
  const round = job.loop.round + 1;
  return recomputeProgress({
    ...job,
    segments,
    loop: {
      ...job.loop,
      round,
      activeSegmentId: segmentId,
      history: [
        ...job.loop.history,
        {
          round,
          action: 'enter_notes',
          actor: 'user',
          segmentId,
          result: 'ok',
        },
      ],
    },
  });
}

export function lockSegment(
  job: TieuAnalyze,
  segmentId: string
): { ok: true; job: TieuAnalyze } | { ok: false; error: string } {
  const seg = job.segments.find((s) => s.id === segmentId);
  if (!seg) return { ok: false, error: 'segment_missing' };
  if (seg.status === 'empty' && seg.notes.length === 0) {
    return { ok: false, error: 'empty_segment' };
  }
  if (seg.notes.some((n) => n.key == null)) {
    return { ok: false, error: 'blank_notes' };
  }
  if (seg.notes.length === 0) return { ok: false, error: 'empty_segment' };
  const segments = job.segments.map((s) =>
    s.id === segmentId
      ? {
          ...s,
          status: 'locked' as const,
          lockedAt: nowIso(),
          chosenBy: s.chosenBy ?? ('user' as const),
        }
      : s
  );
  const round = job.loop.round + 1;
  return {
    ok: true,
    job: recomputeProgress({
      ...job,
      segments,
      loop: {
        ...job.loop,
        round,
        activeSegmentId: nextOpenId(segments),
        history: [
          ...job.loop.history,
          {
            round,
            action: 'lock_segment',
            actor: 'user',
            segmentId,
            result: 'ok',
          },
        ],
      },
    }),
  };
}

export function skipSegment(job: TieuAnalyze, segmentId: string): TieuAnalyze {
  const segments = job.segments.map((s) =>
    s.id === segmentId
      ? {
          ...s,
          status: 'skipped' as const,
          notes: [
            {
              onsetMs: s.startMs,
              durationMs: s.endMs - s.startMs,
              key: 'rest',
              jianpu: '0',
              holes: [0, 0, 0, 0, 0, 0, 0, 0] as HoleState[],
              breath: true,
              confidence: 1,
            },
          ],
          lockedAt: nowIso(),
          chosenBy: 'user' as const,
          gapReason: undefined,
        }
      : s
  );
  const round = job.loop.round + 1;
  return recomputeProgress({
    ...job,
    segments,
    loop: {
      ...job.loop,
      round,
      activeSegmentId: nextOpenId(segments),
      history: [
        ...job.loop.history,
        {
          round,
          action: 'skip_segment',
          actor: 'user',
          segmentId,
          result: 'rest',
        },
      ],
    },
  });
}

export function canLockSong(job: TieuAnalyze): boolean {
  return job.segments.every(
    (s) => s.status === 'locked' || s.status === 'skipped'
  );
}

export function lockSong(
  job: TieuAnalyze
):
  | { ok: true; job: TieuAnalyze; piece: TieuPiece }
  | { ok: false; error: string } {
  if (!canLockSong(job)) return { ok: false, error: 'segments_open' };
  const bpm = 52;
  const pieceEvents = job.segments
    .flatMap((s) => s.notes)
    .filter((n) => n.key)
    .map((n) => ({
      tBeat: Math.round((n.onsetMs / 1000) * (bpm / 60) * 10) / 10,
      key: n.key as string,
    }))
    .sort((a, b) => a.tBeat - b.tBeat);

  const piece: TieuPiece = {
    schema: 'tieu.piece.v1',
    pieceId: job.job.id,
    title: `Bài khoá · ${job.job.source.filename}`,
    instrument: 'xiao_g_8',
    grip: 'left_on_top',
    tonicSystem: 'tube_as_5',
    bpm,
    beatsPerEvent: 1,
    sourceJob: job.job.id,
    note: 'Xuất sau lock_song (stub phân tích). Không phải phổ gốc.',
    events:
      pieceEvents.length > 0 ? pieceEvents : [{ tBeat: 0, key: 'rest' }],
    after: {
      intro: 'Bản gợi ý từ file của bạn (stub). Chỉ tiêu 8 lỗ hơi G.',
      items: [
        {
          atBeat: pieceEvents[0]?.tBeat ?? 0,
          title: 'Stub',
          text: 'Máy không nhận dạng thật — bạn đã khóa thủ công.',
        },
      ],
    },
  };
  const round = job.loop.round + 1;
  return {
    ok: true,
    piece,
    job: {
      ...job,
      job: { ...job.job, status: 'locked' },
      loop: {
        ...job.loop,
        round,
        waitingAction: 'done',
        history: [
          ...job.loop.history,
          {
            round,
            action: 'lock_song',
            actor: 'user',
            result: 'exported_piece',
          },
        ],
      },
    },
  };
}

export function statusLabelVi(status: string): string {
  switch (status) {
    case 'locked':
      return 'Đã khóa';
    case 'unsure':
      return 'Chưa chắc';
    case 'empty':
      return 'Trống';
    case 'user_edited':
      return 'Bạn đã sửa';
    case 'skipped':
      return 'Đã bỏ';
    default:
      return status;
  }
}
