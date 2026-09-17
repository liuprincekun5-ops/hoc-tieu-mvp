/** Web Audio synth */

let audioCtx: AudioContext | null = null;
let osc: OscillatorNode | null = null;
let gain: GainNode | null = null;

export function ensureAudio(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') void audioCtx.resume();
  return audioCtx;
}

export function stopTone(): void {
  if (!audioCtx) return;
  if (gain) {
    try {
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.05);
    } catch {
      /* ignore */
    }
  }
  if (osc) {
    try {
      osc.stop(audioCtx.currentTime + 0.08);
    } catch {
      /* ignore */
    }
  }
  osc = null;
  gain = null;
}

export function playTone(freqHz: number | null | undefined): void {
  stopTone();
  if (!freqHz) return;
  const ctx = ensureAudio();
  osc = ctx.createOscillator();
  gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 1400;
  osc.type = 'sine';
  osc.frequency.value = freqHz;
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.04);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
}
