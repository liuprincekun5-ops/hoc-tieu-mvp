import { useCallback, useEffect, useRef, useState } from 'react';
import {
  bufferRms,
  detectPitchHz,
  freqToCents,
  verdictFromFreq,
  type PitchVerdict,
} from '../lib/pitch';

export interface PitchCheckState {
  active: boolean;
  permission: 'unknown' | 'granted' | 'denied' | 'unavailable';
  freqHz: number | null;
  rms: number;
  verdict: PitchVerdict;
  cents: number | null;
  error: string | null;
}

const initial: PitchCheckState = {
  active: false,
  permission: 'unknown',
  freqHz: null,
  rms: 0,
  verdict: 'idle',
  cents: null,
  error: null,
};

/**
 * Mic pitch helper — optional permission, graceful deny.
 * Not a full grader: "chấm gần đúng" vs targetHz from map.
 */
export function usePitchCheck(targetHz: number | null | undefined) {
  const [state, setState] = useState<PitchCheckState>(initial);
  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const targetRef = useRef(targetHz ?? null);
  targetRef.current = targetHz ?? null;

  const stop = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (ctxRef.current) {
      void ctxRef.current.close().catch(() => undefined);
      ctxRef.current = null;
    }
    analyserRef.current = null;
    setState((s) => ({
      ...s,
      active: false,
      freqHz: null,
      rms: 0,
      verdict: 'idle',
      cents: null,
    }));
  }, []);

  const tick = useCallback(() => {
    const analyser = analyserRef.current;
    const ctx = ctxRef.current;
    if (!analyser || !ctx) return;
    const buf = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(buf);
    const rms = bufferRms(buf);
    const freq = detectPitchHz(buf, ctx.sampleRate);
    const target = targetRef.current;
    const verdict = verdictFromFreq(freq, target, rms);
    const cents =
      freq != null && target != null && target > 0
        ? freqToCents(freq, target)
        : null;
    setState((s) => ({
      ...s,
      freqHz: freq,
      rms,
      verdict,
      cents,
    }));
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setState((s) => ({
        ...s,
        permission: 'unavailable',
        error: 'Trình duyệt không hỗ trợ micro.',
        active: false,
      }));
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
      streamRef.current = stream;
      const ctx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();
      if (ctx.state === 'suspended') await ctx.resume();
      ctxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;
      setState((s) => ({
        ...s,
        active: true,
        permission: 'granted',
        error: null,
      }));
      rafRef.current = requestAnimationFrame(tick);
    } catch (e) {
      const msg =
        e instanceof DOMException && e.name === 'NotAllowedError'
          ? 'Bạn đã từ chối quyền micro — vẫn học bình thường không cần mic.'
          : e instanceof Error
            ? e.message
            : 'Không mở được micro.';
      setState((s) => ({
        ...s,
        active: false,
        permission: 'denied',
        error: msg,
      }));
    }
  }, [tick]);

  useEffect(() => () => stop(), [stop]);

  return { ...state, start, stop };
}
