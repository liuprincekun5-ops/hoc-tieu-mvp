import { usePitchCheck } from '../hooks/usePitchCheck';
import { verdictLabelVi } from '../lib/pitch';
import { keyLabelVi } from '../lib/data';
import type { TieuMap } from '../types/tieu';
import './PitchCheck.css';

interface Props {
  map: TieuMap;
  targetKey: string | null;
  compact?: boolean;
}

export function PitchCheck({ map, targetKey, compact }: Props) {
  const targetHz =
    targetKey && targetKey !== 'rest'
      ? (map.taughtIn16[targetKey]?.freqHz ?? null)
      : null;
  const pitch = usePitchCheck(targetHz);

  return (
    <div className={`pitch-check${compact ? ' compact' : ''}`}>
      <div className="pitch-head">
        <strong>Chấm gần đúng (mic)</strong>
        <span className="pitch-badge">tùy chọn · không chấm điểm bài</span>
      </div>
      <p className="muted tiny">
        So sánh cao độ micro với{' '}
        {targetKey ? (
          <>
            <b>{keyLabelVi(targetKey)}</b>
            {targetHz ? ` (~${Math.round(targetHz)} Hz)` : ''}
          </>
        ) : (
          'nốt đang chọn'
        )}
        . Chỉ tiêu 8 lỗ hơi G.
      </p>
      <div className="pitch-row">
        {!pitch.active ? (
          <button type="button" className="secondary" onClick={() => void pitch.start()}>
            Bật micro
          </button>
        ) : (
          <button type="button" className="icon" onClick={pitch.stop}>
            Tắt
          </button>
        )}
        <div className={`pitch-verdict v-${pitch.verdict}`}>
          {verdictLabelVi(pitch.verdict)}
        </div>
      </div>
      {pitch.active && (
        <p className="muted tiny">
          Đọc: {pitch.freqHz ? `${Math.round(pitch.freqHz)} Hz` : '—'}
          {pitch.cents != null && Number.isFinite(pitch.cents)
            ? ` · ${pitch.cents > 0 ? '+' : ''}${Math.round(pitch.cents)} cent`
            : ''}
        </p>
      )}
      {pitch.error && <p className="error tiny">{pitch.error}</p>}
    </div>
  );
}
