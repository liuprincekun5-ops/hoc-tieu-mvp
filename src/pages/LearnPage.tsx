import { useEffect, useState } from 'react';
import { FluteLed } from '../components/FluteLed';
import { isLessonUnlocked, keyLabelVi, loadLesson } from '../lib/data';
import { markLessonComplete, setLastLesson } from '../lib/storage';
import type { ProgressState, TieuCatalog, TieuMap, TieuPiece } from '../types/tieu';
import './pages.css';

interface Props {
  catalog: TieuCatalog;
  map: TieuMap;
  progress: ProgressState;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onProgress: (p: ProgressState) => void;
  onPlayInLed: (piece: TieuPiece) => void;
  onGoAfter: (lessonId: string) => void;
}

export function LearnPage({
  catalog,
  map,
  progress,
  selectedId,
  onSelect,
  onProgress,
  onPlayInLed,
  onGoAfter,
}: Props) {
  const ids = catalog.lessons.map((l) => l.id);
  const activeId =
    selectedId && isLessonUnlocked(ids, selectedId, progress.completedIds)
      ? selectedId
      : ids.find((id) => isLessonUnlocked(ids, id, progress.completedIds)) ??
        ids[0];

  const [piece, setPiece] = useState<TieuPiece | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewKey, setPreviewKey] = useState('Re');

  useEffect(() => {
    let cancelled = false;
    const ref = catalog.lessons.find((l) => l.id === activeId);
    if (!ref) return;
    setLoading(true);
    setErr(null);
    loadLesson(ref.file)
      .then((p) => {
        if (!cancelled) {
          setPiece(p);
          const first = p.keysAllowed?.[0] ?? p.events[0]?.key ?? 'Re';
          setPreviewKey(first);
          onProgress(setLastLesson(activeId));
        }
      })
      .catch((e: Error) => {
        if (!cancelled) setErr(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  const previewHoles = map.taughtIn16[previewKey]?.holes ?? null;
  const entry = map.taughtIn16[previewKey];
  const pickKeys = piece
    ? [...new Set(piece.keysAllowed ?? piece.events.map((e) => e.key))]
    : [];

  return (
    <div className="page">
      <header className="page-head">
        <h1>Học</h1>
        <span className="badge">Mở tuần tự</span>
      </header>

      <label className="field">
        <span>Chọn bài</span>
        <select
          value={activeId}
          onChange={(e) => onSelect(e.target.value)}
          className="lesson-bar"
        >
          {catalog.lessons.map((l) => {
            const unlocked = isLessonUnlocked(ids, l.id, progress.completedIds);
            return (
              <option key={l.id} value={l.id} disabled={!unlocked}>
                {l.id} · {l.title}
                {!unlocked
                  ? ' (khoá)'
                  : progress.completedIds.includes(l.id)
                    ? ' ✓'
                    : ''}
              </option>
            );
          })}
        </select>
      </label>

      {loading && <p className="muted">Đang tải bài…</p>}
      {err && <p className="error">{err}</p>}

      {piece && (
        <>
          <div className="card">
            <h2>{piece.title}</h2>
            {piece.goal && <p className="goal">{piece.goal}</p>}
            <p className="muted">
              BPM gốc {piece.bpm} · {piece.beatsPerEvent ?? 2} beat/nốt · Cầm
              trái trên
            </p>
          </div>

          <div className="card">
            <h3>Ngón · {keyLabelVi(previewKey)}</h3>
            <div className="keys pick">
              {pickKeys.map((k) => (
                <button
                  key={k}
                  type="button"
                  className={`chip${k === previewKey ? ' on' : ''}`}
                  onClick={() => setPreviewKey(k)}
                >
                  {keyLabelVi(k)}
                </button>
              ))}
            </div>
            <FluteLed
              map={map}
              holes={previewHoles}
              blowing={previewKey !== 'rest'}
            />
            <p className="flute-hint">
              Vàng = đậy kín. Xanh = nhấc. holes[8…1] · 1=bịt · 0=mở.
            </p>
            <div className="legend">
              <span>
                <i className="dot c" />
                Bịt
              </span>
              <span>
                <i className="dot o" />
                Mở
              </span>
            </div>
            {entry && (
              <p className="muted">
                {entry.jianpu != null && <>Số nhạc: {entry.jianpu} · </>}
                {entry.pitch && <>Cao độ: {entry.pitch} · </>}
                Hơi: {entry.embouchure ?? '—'}
              </p>
            )}
          </div>

          <div className="card">
            <h3>Chuỗi nốt</h3>
            <div className="seq-preview">
              {piece.events.map((ev, i) => (
                <span key={`${ev.tBeat}-${i}`} className="chip static">
                  {keyLabelVi(ev.key)}
                </span>
              ))}
            </div>
          </div>

          <div className="btn-row">
            <button
              type="button"
              className="primary"
              onClick={() => onPlayInLed(piece)}
            >
              Xem mẫu LED
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => {
                onProgress(markLessonComplete(piece.pieceId));
                onGoAfter(piece.pieceId);
              }}
            >
              Tôi đã thổi
            </button>
          </div>
        </>
      )}
    </div>
  );
}
