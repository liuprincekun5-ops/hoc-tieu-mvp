import { useEffect, useMemo, useState } from 'react';
import { FluteLed } from '../components/FluteLed';
import { usePiecePlayer } from '../hooks/usePiecePlayer';
import { keyLabelVi, loadDemoPiece, loadLesson } from '../lib/data';
import type { TieuCatalog, TieuMap, TieuPiece } from '../types/tieu';
import './pages.css';

interface Props {
  catalog: TieuCatalog;
  map: TieuMap;
  /** Piece handed from Học / Sau bài */
  injected: TieuPiece | null;
  onClearInjected: () => void;
  onFinished: (piece: TieuPiece) => void;
}

type SourceKind = 'demo' | 'lesson' | 'injected';

export function LedPage({
  catalog,
  map,
  injected,
  onClearInjected,
  onFinished,
}: Props) {
  const [source, setSource] = useState<SourceKind>(injected ? 'injected' : 'lesson');
  const [lessonId, setLessonId] = useState(
    injected?.pieceId && catalog.lessons.some((l) => l.id === injected.pieceId)
      ? injected.pieceId
      : 'L01'
  );
  const [piece, setPiece] = useState<TieuPiece | null>(injected);
  const [err, setErr] = useState<string | null>(null);

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
              if (v !== 'injected') onClearInjected();
            }}
          >
            <option value="lesson">Bài học L01–L16</option>
            <option value="demo">Demo job_demo_01</option>
            {injected && <option value="injected">Từ màn Học</option>}
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
        Vàng = đậy kín bằng thịt ngón. Xanh = nhấc ngón. Trắng trên đỉnh = lỗ
        thổi.
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

      <div className="controls">
        <button
          type="button"
          className="icon"
          onClick={player.toggle}
          disabled={!piece}
        >
          {player.playing ? 'Dừng' : 'Phát'}
        </button>
        <button
          type="button"
          className="icon"
          onClick={() => player.changeBpm(-4)}
        >
          −
        </button>
        <button
          type="button"
          className="icon"
          onClick={() => player.changeBpm(4)}
        >
          +
        </button>
        <button
          type="button"
          className="primary"
          disabled={!piece}
          onClick={() => {
            player.stop();
            if (piece) onFinished(piece);
          }}
        >
          Tôi đã thổi
        </button>
      </div>
      <div className="toast">
        Tốc độ: {player.bpm} BPM
        {player.finished ? ' · Hết mẫu — xem Sau bài' : ''}
      </div>

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
            </div>
          ))}
        </div>
      )}

      <div className="card stub muted">
        <strong>Phân tích file (chưa làm)</strong>
        <p>
          Upload / AMT bị tắt trong MVP này theo ranh giới bản đầu. Chỉ phát
          piece đã khoá sẵn.
        </p>
      </div>
    </div>
  );
}
