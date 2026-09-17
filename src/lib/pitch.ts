/** Autocorrelation pitch detect — basic “chấm gần đúng”. */

export type PitchVerdict = 'match' | 'near' | 'miss' | 'silent' | 'idle';

const SILENCE_RMS = 0.01;
const MATCH_CENTS = 40;
const NEAR_CENTS = 100;

export function freqToCents(freq: number, target: number): number {
  if (freq <= 0 || target <= 0) return 9999;
  return 1200 * Math.log2(freq / target);
}

export function verdictFromFreq(
  freq: number | null,
  targetHz: number | null,
  rms: number
): PitchVerdict {
  if (targetHz == null || targetHz <= 0) return 'idle';
  if (rms < SILENCE_RMS || freq == null || freq <= 0) return 'silent';
  const cents = Math.abs(freqToCents(freq, targetHz));
  if (cents <= MATCH_CENTS) return 'match';
  if (cents <= NEAR_CENTS) return 'near';
  return 'miss';
}

export function verdictLabelVi(v: PitchVerdict): string {
  switch (v) {
    case 'match':
      return 'Gần đúng';
    case 'near':
      return 'Hơi lệch';
    case 'miss':
      return 'Lệch xa';
    case 'silent':
      return 'Chưa nghe thấy';
    default:
      return 'Chưa bật mic';
  }
}

export function bufferRms(buf: Float32Array): number {
  let s = 0;
  for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i];
  return Math.sqrt(s / buf.length);
}

export function detectPitchHz(
  buf: Float32Array,
  sampleRate: number,
  minHz = 80,
  maxHz = 900
): number | null {
  const size = buf.length;
  if (size < 64) return null;
  if (bufferRms(buf) < SILENCE_RMS) return null;

  const minLag = Math.floor(sampleRate / maxHz);
  const maxLag = Math.min(Math.floor(sampleRate / minHz), size - 1);
  if (maxLag <= minLag) return null;

  let bestLag = -1;
  let bestCorr = -1;
  for (let lag = minLag; lag <= maxLag; lag++) {
    let corr = 0;
    for (let i = 0; i < size - lag; i++) corr += buf[i] * buf[i + lag];
    if (corr > bestCorr) {
      bestCorr = corr;
      bestLag = lag;
    }
  }
  if (bestLag < 0 || bestCorr <= 0) return null;

  const corrAt = (lag: number) => {
    let corr = 0;
    for (let i = 0; i < size - lag; i++) corr += buf[i] * buf[i + lag];
    return corr;
  };
  const y0 = bestLag > minLag ? corrAt(bestLag - 1) : bestCorr;
  const y1 = bestCorr;
  const y2 = bestLag < maxLag ? corrAt(bestLag + 1) : bestCorr;
  const denom = 2 * (2 * y1 - y0 - y2);
  let refined = bestLag;
  if (denom !== 0) refined = bestLag + (y0 - y2) / denom;
  const hz = sampleRate / refined;
  if (hz < minHz || hz > maxHz) return null;
  return hz;
}
