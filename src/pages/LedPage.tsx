import { useEffect, useMemo, useState } from 'react';
import { FluteLed } from '../components/FluteLed';
import { PitchCheck } from '../components/PitchCheck';
import { usePiecePlayer } from '../hooks/usePiecePlayer';
import { keyLabelVi, loadDemoPiece, loadLesson, nextLessonId } from '../lib/data';
import { markLessonComplete } from '../lib/storage';
import type {
  LedInject,
  ProgressState,
  TieuCatalog,
  TieuMap,
  TieuPiece,
} from '../types/tieu';
import './pages.css';

interface Props {
  catalog: TieuCatalog;
  map: TieuMap;
  progress: ProgressState;
  inject: LedInject | null;
  onClearInject: () => void;
  onFinished: (piece: TieuPiece) => void;
  onProgress: (p: ProgressState) => void;
  onGoAfter: (lessonId: string) => void;
}

type SourceKind = 'demo' | 'lesson' | 'injected';

export function LedPage({
  catalog,
  map,
  progress,
  inject,
  onClearInject,
  onFinished,
  onProgress,
  onGoAfter,
}: Props) {
  const injected = inject?.piece ?? null;
  const [source, setSource] = useState<SourceKind>(
    injected ? 'injected' : 'lesson'
  );
  const [lessonId, setLessonId] = useState(
    injected?.pieceId && catalog.lessons.some((l) => l.id === injected.pieceId)
      ? injected.pieceId
      : 'L01'
  );
  const [piece, setPiece] = useState<TieuPiece | null>(injected);
  const [err, setErr] = useState<string | null>(null);
  const [justCompleted, setJustCompleted] = useState(false);

  useEffect(() => {
    if (injected) {
      setPiece(injected);
      setSource('injected');
      if (catalog.lessons.some((l) => l.id === injected.pieceId)) {
        setLessonId(injected.pieceId);
      }
    }
  }, [injected, catalog.lessons]);

  useEffect(() => {
    if (source === 'injected' && injected) {
      setPiece(injected);
      return;
    }
    let cancelled = false;
    setErr(null);
    const loader =
      source === 'demo'
        ? loadDemoPiece()
        : loadLesson(
            catalog.lessons.find((l) => l.id === lessonId)?.file ??
              `lessons/${lessonId}.json`
          );
    loader
      .then((p) => {
        if (!cancelled) {
          if (p.schema !== 'tieu.piece.v1') {
            setErr('Chỉ phát được object tieu.piece.v1');
            setPiece(null);
            return;
          }
          setPiece(p);
        }
      })
      .catch((e: Error) => {
        if (!cancelled) setErr(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [source, lessonId, injected, catalog.lessons]);

  const player = usePiecePlayer(piece, map);

  // Auto-play replay window when inject carries atBeat
  useEffect(() => {
    if (!inject?.replay || !piece) return;
    if (inject.piece.pieceId !== piece.pieceId) return;
    const t = window.setTimeout(() => {
      player.playWindow(inject.replay!);
    }, 80);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inject?.piece.pieceId, inject?.replay?.atBeat, piece?.pieceId]);

  useEffect(() => {
    if (player.finished && piece) onFinished(piece);
  }, [player.finished, piece, onFinished]);

  const explain = useMemo(() => {
    if (!piece || !player.currentKey) return 'Chọn bài rồi bấm Phát.';
    const e = map.taughtIn16[player.currentKey];
    if (!e) return player.currentKey;
    const j = e.jianpu ? ` (số ${e.jianpu})` : '';
    const pitch = e.pitch ? ` · ${e.pitch}` : '';
    return `${keyLabelVi(player.currentKey)}${j}${pitch} · hơi ${e.embouchure ?? '—'}`;
  }, [piece, player.currentKey, map]);

  const ids = catalog.lessons.map((l) => l.id);
  const isLessonPiece = !!piece && ids.includes(piece.pieceId);
  const alreadyDone =
    !!piece && progress.completedIds.includes(piece.pieceId);
  const unlockedNext = piece
    ? nextLessonId(ids, piece.pieceId)
    : null;

  const markComplete = () => {
    if (!piece || !isLessonPiece) return;
    onProgress(markLessonComplete(piece.pieceId));
    setJustCompleted(true);
    onFinished(piece);
  };

  return (
    <div className="page led-page">
      <header className="page-head">
        <h1>{piece?.title ?? 'Phòng LED'}</h1>
        <span className="badge">tieu.piece.v1</span>
      </header>

      <div className="source-row">
        <label>
          Nguồn
          <select
            value={source}
            onChange={(e) => {
              const v = e.target.value as SourceKind;
              setSource(v);
              if (v !== 'injected') onClearInject();
            }}
          >
            <option value="lesson">Bài học L01–L16</option>
            <option value="demo">Demo job_demo_01</option>
            {injected && <option value="injected">Từ Học / Phân tích / Sau bài</option>}
          </select>
        </label>
        {source === 'lesson' && (
          <label>
            Bài
            <select
              value={lessonId}
              onChange={(e) => setLessonId(e.target.value)}
            >
              {catalog.lessons.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.id} · {l.title}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {err && <p className="error">{err}</p>}

      {player.windowLabel && (
        <p className="toast">Đang phát {player.windowLabel}</p>
      )}

      <div className="note-now">
        <div>
          Nốt đang thổi:{' '}
          <strong>
            {player.currentKey ? keyLabelVi(player.currentKey) : '—'}
          </strong>
        </div>
        <p>{explain}</p>
      </div>

      {piece && (
        <div className="seq">
          {piece.events.map((ev, i) => (
            <div
              key={`${ev.tBeat}-${i}`}
              className={
                'chip' +
                (i === player.eventIndex
                  ? ' on'
                  : i === player.eventIndex + 1
                    ? ' next'
                    : '')
              }
            >
              {keyLabelVi(ev.key)}
            </div>
          ))}
        </div>
      )}

      <FluteLed
        map={map}
        holes={player.holes}
        blowing={!!player.currentKey && player.currentKey !== 'rest'}
      />

      <p className="flute-hint">
        Vàng = đậy kín. Xanh = nhấc. Chỉ tiêu 8 lỗ hơi G.
      </p>

      <PitchCheck map={map} targetKey={player.currentKey} compact />

      <div className="controls">
        <button
          type="button"
          className="icon"
          onClick={player.toggle}
          disabled={!piece}
        >
          {player.playing ? 'Dừng' : 'Phát'}
        </button>
        <button type="button" className="icon" onClick={() => player.changeBpm(-4)}>
          −
        </button>
        <button type="button" className="icon" onClick={() => player.changeBpm(4)}>
          +
        </button>
        {isLessonPiece && (
          <button
            type="button"
            className="primary"
            disabled={!piece}
            onClick={markComplete}
          >
            {alreadyDone || justCompleted
              ? 'Đã đánh dấu hoàn thành'
              : 'Đánh dấu hoàn thành bài'}
          </button>
        )}
      </div>
      <div className="toast">
        Tốc độ: {player.bpm} BPM
        {player.finished ? ' · Hết mẫu' : ''}
        {justCompleted && unlockedNext
          ? ` · Đã mở ${unlockedNext}`
          : justCompleted
            ? ' · Đã lưu tiến độ'
            : ''}
      </div>

      {(player.finished || justCompleted) && piece && isLessonPiece && (
        <div className="card">
          <h3>Tiếp theo</h3>
          <div className="btn-row">
            <button
              type="button"
              className="secondary"
              onClick={() => onGoAfter(piece.pieceId)}
            >
              Ghi chú Sau bài
            </button>
            {unlockedNext && (alreadyDone || justCompleted) && (
              <button
                type="button"
                className="primary"
                onClick={() => {
                  setLessonId(unlockedNext);
                  setSource('lesson');
                  onClearInject();
                  setJustCompleted(false);
                }}
              >
                Mở bài tiếp {unlockedNext}
              </button>
            )}
          </div>
        </div>
      )}

      {piece?.after && player.finished && (
        <div className="after show">
          <h2>Sau khi nghe mẫu</h2>
          <p>{piece.after.intro}</p>
          {piece.after.items.map((it, i) => (
            <div key={i}>
              <h3>
                {it.title} · beat {it.atBeat}
              </h3>
              <p>{it.text}</p>
              <button
                type="button"
                className="linkish"
                onClick={() => player.playWindow({ atBeat: it.atBeat })}
              >
                Phát lại quanh beat {it.atBeat}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
