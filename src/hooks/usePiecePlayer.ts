import { useCallback, useEffect, useRef, useState } from 'react';
import { ensureAudio, playTone, stopTone } from '../lib/audio';
import type { HoleState, TieuMap, TieuPiece } from '../types/tieu';

export interface PlayerState {
  playing: boolean;
  eventIndex: number;
  bpm: number;
  currentKey: string | null;
  holes: HoleState[] | null;
  finished: boolean;
}

function holesForKey(map: TieuMap, key: string): HoleState[] | null {
  const entry = map.taughtIn16[key];
  return entry?.holes ?? null;
}

function freqForKey(map: TieuMap, key: string): number | null {
  const entry = map.taughtIn16[key];
  return entry?.freqHz ?? null;
}

/**
 * Play a tieu.piece.v1 by scheduling on tBeat differences.
 * Default duration of each note = beatsPerEvent (or gap to next event).
 */
export function usePiecePlayer(piece: TieuPiece | null, map: TieuMap | null) {
  const [bpm, setBpm] = useState(piece?.bpm ?? 52);
  const [playing, setPlaying] = useState(false);
  const [eventIndex, setEventIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const timerRef = useRef<number | null>(null);
  const idxRef = useRef(0);
  const bpmRef = useRef(bpm);
  bpmRef.current = bpm;

  useEffect(() => {
    if (piece) {
      setBpm(piece.bpm);
      setEventIndex(0);
      setFinished(false);
      setPlaying(false);
      idxRef.current = 0;
      stopTone();
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [piece?.pieceId]);

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

  const scheduleNext = useCallback(() => {
    if (!piece || !map) return;
    const i = idxRef.current;
    const events = piece.events;
    if (i >= events.length - 1) {
      setPlaying(false);
      setFinished(true);
      stopTone();
      clearTimer();
      return;
    }
    const cur = events[i];
    const next = events[i + 1];
    const beats =
      next.tBeat - cur.tBeat || piece.beatsPerEvent || 2;
    const ms = Math.max(80, (beats * 60000) / bpmRef.current);
    timerRef.current = window.setTimeout(() => {
      const nextI = i + 1;
      applyEvent(nextI, true);
      if (nextI >= events.length - 1) {
        // hold last note then finish
        const holdBeats = piece.beatsPerEvent || 2;
        const holdMs = (holdBeats * 60000) / bpmRef.current;
        timerRef.current = window.setTimeout(() => {
          setPlaying(false);
          setFinished(true);
          stopTone();
        }, holdMs);
      } else {
        scheduleNext();
      }
    }, ms);
  }, [piece, map, applyEvent]);

  const stop = useCallback(() => {
    setPlaying(false);
    clearTimer();
    stopTone();
  }, []);

  const play = useCallback(() => {
    if (!piece || !map || piece.events.length === 0) return;
    ensureAudio();
    setFinished(false);
    clearTimer();
    // restart from beginning
    idxRef.current = 0;
    setPlaying(true);
    applyEvent(0, true);
    if (piece.events.length === 1) {
      const holdBeats = piece.beatsPerEvent || 2;
      const holdMs = (holdBeats * 60000) / bpmRef.current;
      timerRef.current = window.setTimeout(() => {
        setPlaying(false);
        setFinished(true);
        stopTone();
      }, holdMs);
    } else {
      scheduleNext();
    }
  }, [piece, map, applyEvent, scheduleNext]);

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
        // restart schedule with new bpm from current index
        stop();
        // slight defer so state settles
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

  useEffect(() => () => {
    clearTimer();
    stopTone();
  }, []);

  const currentKey =
    piece && piece.events[eventIndex] ? piece.events[eventIndex].key : null;
  const holes =
    map && currentKey ? holesForKey(map, currentKey) : null;

  return {
    playing,
    eventIndex,
    bpm,
    currentKey,
    holes,
    finished,
    play,
    stop,
    toggle,
    changeBpm,
    setEventIndex: (i: number) => {
      stop();
      applyEvent(i, false);
      setFinished(false);
    },
  };
}
