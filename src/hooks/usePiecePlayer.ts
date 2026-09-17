import { useCallback, useEffect, useRef, useState } from 'react';
import { ensureAudio, playTone, stopTone } from '../lib/audio';
import type {
  HoleState,
  ReplayWindow,
  TieuMap,
  TieuPiece,
} from '../types/tieu';

function holesForKey(map: TieuMap, key: string): HoleState[] | null {
  const entry = map.taughtIn16[key];
  return entry?.holes ?? null;
}

function freqForKey(map: TieuMap, key: string): number | null {
  const entry = map.taughtIn16[key];
  return entry?.freqHz ?? null;
}

/** Indices of events whose tBeat falls in [atBeat-before, atBeat+after]. */
export function eventIndicesInWindow(
  piece: TieuPiece,
  win: ReplayWindow
): number[] {
  const before = win.before ?? 1;
  const after = win.after ?? 2;
  const lo = win.atBeat - before;
  const hi = win.atBeat + after;
  const idxs: number[] = [];
  piece.events.forEach((ev, i) => {
    if (ev.tBeat >= lo && ev.tBeat <= hi) idxs.push(i);
  });
  // Nếu không khớp beat (lệch float), lấy gần nhất ± cửa sổ
  if (idxs.length === 0 && piece.events.length > 0) {
    let nearest = 0;
    let best = Math.abs(piece.events[0].tBeat - win.atBeat);
    piece.events.forEach((ev, i) => {
      const d = Math.abs(ev.tBeat - win.atBeat);
      if (d < best) {
        best = d;
        nearest = i;
      }
    });
    const start = Math.max(0, nearest - 1);
    const end = Math.min(piece.events.length - 1, nearest + 2);
    for (let i = start; i <= end; i++) idxs.push(i);
  }
  return idxs;
}

/**
 * Play a tieu.piece.v1 by scheduling on tBeat differences.
 * Optional ReplayWindow limits playback to ~2–4 beats around atBeat.
 */
export function usePiecePlayer(piece: TieuPiece | null, map: TieuMap | null) {
  const [bpm, setBpm] = useState(piece?.bpm ?? 52);
  const [playing, setPlaying] = useState(false);
  const [eventIndex, setEventIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [windowLabel, setWindowLabel] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const idxRef = useRef(0);
  const endIdxRef = useRef<number | null>(null);
  const bpmRef = useRef(bpm);
  bpmRef.current = bpm;

  useEffect(() => {
    if (piece) {
      setBpm(piece.bpm);
      setEventIndex(0);
      setFinished(false);
      setPlaying(false);
      setWindowLabel(null);
      idxRef.current = 0;
      endIdxRef.current = null;
      stopTone();
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [piece?.pieceId, piece]);

  const clearTimer = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const applyEvent = useCallback(
    (i: number, withSound: boolean) => {
      if (!piece || !map) return;
      const ev = piece.events[i];
      if (!ev) return;
      setEventIndex(i);
      idxRef.current = i;
      const freq = freqForKey(map, ev.key);
      if (withSound) playTone(freq);
      else if (ev.key === 'rest') stopTone();
    },
    [piece, map]
  );

  const finishPlay = useCallback(() => {
    setPlaying(false);
    setFinished(true);
    stopTone();
    clearTimer();
  }, []);

  const scheduleNext = useCallback(() => {
    if (!piece || !map) return;
    const i = idxRef.current;
    const events = piece.events;
    const lastAllowed =
      endIdxRef.current != null ? endIdxRef.current : events.length - 1;
    if (i >= lastAllowed) {
      const holdBeats = piece.beatsPerEvent || 2;
      const holdMs = (holdBeats * 60000) / bpmRef.current;
      timerRef.current = window.setTimeout(() => {
        finishPlay();
      }, holdMs);
      return;
    }
    const cur = events[i];
    const next = events[i + 1];
    const beats = next.tBeat - cur.tBeat || piece.beatsPerEvent || 2;
    const ms = Math.max(80, (beats * 60000) / bpmRef.current);
    timerRef.current = window.setTimeout(() => {
      const nextI = i + 1;
      applyEvent(nextI, true);
      scheduleNext();
    }, ms);
  }, [piece, map, applyEvent, finishPlay]);

  const stop = useCallback(() => {
    setPlaying(false);
    clearTimer();
    stopTone();
  }, []);

  const playFromTo = useCallback(
    (startI: number, endI: number, label: string | null) => {
      if (!piece || !map || piece.events.length === 0) return;
      ensureAudio();
      setFinished(false);
      setWindowLabel(label);
      clearTimer();
      const s = Math.max(0, Math.min(startI, piece.events.length - 1));
      const e = Math.max(s, Math.min(endI, piece.events.length - 1));
      endIdxRef.current = e;
      idxRef.current = s;
      setPlaying(true);
      applyEvent(s, true);
      if (s === e) {
        const holdBeats = piece.beatsPerEvent || 2;
        const holdMs = (holdBeats * 60000) / bpmRef.current;
        timerRef.current = window.setTimeout(() => {
          finishPlay();
        }, holdMs);
      } else {
        scheduleNext();
      }
    },
    [piece, map, applyEvent, scheduleNext, finishPlay]
  );

  const play = useCallback(() => {
    if (!piece) return;
    endIdxRef.current = null;
    setWindowLabel(null);
    playFromTo(0, piece.events.length - 1, null);
  }, [piece, playFromTo]);

  /** Phát cửa sổ ~2–4 beat quanh atBeat (mặc định atBeat−1 … atBeat+2). */
  const playWindow = useCallback(
    (win: ReplayWindow) => {
      if (!piece) return;
      const idxs = eventIndicesInWindow(piece, win);
      if (idxs.length === 0) {
        play();
        return;
      }
      const before = win.before ?? 1;
      const after = win.after ?? 2;
      const label = `Cửa sổ beat ${win.atBeat - before}…${win.atBeat + after}`;
      playFromTo(idxs[0], idxs[idxs.length - 1], label);
    },
    [piece, play, playFromTo]
  );

  const toggle = useCallback(() => {
    if (playing) stop();
    else play();
  }, [playing, play, stop]);

  const changeBpm = useCallback(
    (delta: number) => {
      setBpm((b) => {
        const next = Math.min(96, Math.max(36, b + delta));
        bpmRef.current = next;
        return next;
      });
      if (playing) {
        stop();
        window.setTimeout(() => {
          ensureAudio();
          setPlaying(true);
          setFinished(false);
          applyEvent(idxRef.current, true);
          scheduleNext();
        }, 30);
      }
    },
    [playing, stop, applyEvent, scheduleNext]
  );

  useEffect(
    () => () => {
      clearTimer();
      stopTone();
    },
    []
  );

  const currentKey =
    piece && piece.events[eventIndex] ? piece.events[eventIndex].key : null;
  const holes = map && currentKey ? holesForKey(map, currentKey) : null;

  return {
    playing,
    eventIndex,
    bpm,
    currentKey,
    holes,
    finished,
    windowLabel,
    play,
    playWindow,
    stop,
    toggle,
    changeBpm,
    setEventIndex: (i: number) => {
      stop();
      endIdxRef.current = null;
      setWindowLabel(null);
      applyEvent(i, false);
      setFinished(false);
    },
  };
}
