import { useMemo, useState } from 'react';
import {
  MAX_RERUN,
  adoptDemoAnalyze,
  canLockSong,
  canRerun,
  enterNoteOnBlank,
  lockSegment,
  lockSong,
  rerunSegment,
  selectSegment,
  skipSegment,
  statusLabelVi,
  stubAnalyzeFromDuration,
} from '../lib/analyze';
import { keyLabelVi, loadDemoAnalyze } from '../lib/data';
import { probeDurationMs, saveAudioBlob } from '../lib/idbAudio';
import type { TieuAnalyze, TieuMap, TieuPiece } from '../types/tieu';
import './pages.css';

interface Props {
  map: TieuMap;
  onOpenInLed: (piece: TieuPiece) => void;
}

const NOTE_CHOICES = ['Re', 'Mi', 'Fi', 'Sol', 'La', 'Si', 'Re2', 'rest'] as const;

export function AnalyzePage({ map, onOpenInLed }: Props) {
  const [job, setJob] = useState<TieuAnalyze | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [pickKey, setPickKey] = useState('Re');

  const active = useMemo(() => {
    if (!job) return null;
    const id = job.loop.activeSegmentId;
    return job.segments.find((s) => s.id === id) ?? job.segments[0] ?? null;
  }, [job]);

  const startFromFile = async (file: File | null) => {
    if (!file) return;
    setBusy(true);
    setMsg(null);
    try {
      const durationMs = await probeDurationMs(file);
      const audioId = `audio_${Date.now()}`;
      await saveAudioBlob(audioId, file, durationMs);
      setJob(stubAnalyzeFromDuration(file.name, durationMs, map, audioId));
      setMsg('Stub đã tạo đoạn từ độ dài file — không phải nhận dạng thật.');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Không đọc được file.');
    } finally {
      setBusy(false);
    }
  };

  const startFromDemo = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const raw = await loadDemoAnalyze();
      setJob(adoptDemoAnalyze(raw));
      setMsg('Đã nạp job demo gói giấy (stub).');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Không tải demo.');
    } finally {
      setBusy(false);
    }
  };

  const doRerun = () => {
    if (!job || !active) return;
    const res = rerunSegment(job, active.id, map);
    if (!res.ok) {
      setMsg(
        res.error === 'max_rerun'
          ? `Hết ${MAX_RERUN} lần chạy lại.`
          : `Lỗi: ${res.error}`
      );
      return;
    }
    setJob(res.job);
    setMsg('Đã chạy lại đoạn (stub).');
  };

  const doEnter = () => {
    if (!job || !active) return;
    const blank = active.notes.find((n) => n.key == null);
    const onset = blank?.onsetMs ?? active.startMs;
    setJob(enterNoteOnBlank(job, active.id, onset, pickKey, map));
    setMsg(`Đã nhập ${keyLabelVi(pickKey)} vào ô trống.`);
  };

  const doLockSeg = () => {
    if (!job || !active) return;
    const res = lockSegment(job, active.id);
    if (!res.ok) {
      setMsg(
        res.error === 'blank_notes' ? 'Còn nốt trống.' : `Lỗi: ${res.error}`
      );
      return;
    }
    setJob(res.job);
    setMsg('Đã khóa đoạn.');
  };

  const doSkip = () => {
    if (!job || !active) return;
    setJob(skipSegment(job, active.id));
    setMsg('Đã bỏ đoạn (nghỉ).');
  };

  const doLockSong = () => {
    if (!job) return;
    const res = lockSong(job);
    if (!res.ok) {
      setMsg('Còn đoạn empty/unsure — chưa khóa bài được.');
      return;
    }
    setJob(res.job);
    setMsg('Đã khóa bài → mở Phòng LED.');
    onOpenInLed(res.piece);
  };

  return (
    <div className="page">
      <header className="page-head">
        <h1>Phân tích file</h1>
        <span className="badge">stub · chỉ local</span>
      </header>

      <div className="card stub">
        <strong>Thử nghiệm / stub</strong>
        <p className="muted">
          Không có engine nhận dạng thật. Audio chỉ lưu trên máy (IndexedDB).
          Chỉ tiêu 8 lỗ hơi G — không nửa cung, không nhạc phim.
        </p>
      </div>

      <div className="card">
        <h3>1. Chọn file bạn sở hữu</h3>
        <input
          type="file"
          accept="audio/*,.wav,.mp3,.m4a,.ogg"
          disabled={busy}
          onChange={(e) => void startFromFile(e.target.files?.[0] ?? null)}
        />
        <div className="btn-row" style={{ marginTop: 8 }}>
          <button
            type="button"
            className="secondary"
            disabled={busy}
            onClick={() => void startFromDemo()}
          >
            Nạp demo gói giấy
          </button>
        </div>
        {msg && <p className="muted tiny">{msg}</p>}
      </div>

      {!job && (
        <div className="card">
          <p className="muted">
            Chưa có job. Chọn file hoặc nạp demo để bắt đầu vòng locked / unsure /
            empty.
          </p>
        </div>
      )}

      {job && (
        <>
          <div className="card">
            <h3>Job · {job.job.source.filename}</h3>
            <p className="muted">
              {Math.round(job.job.source.durationMs / 1000)}s · chấp nhận{' '}
              {job.job.progress.percentAccepted}% · vòng {job.loop.round}
            </p>
            <div className="bar">
              <div
                className="bar-fill"
                style={{ width: `${job.job.progress.percentAccepted}%` }}
              />
            </div>
            {job.stubLabel && <p className="muted tiny">{job.stubLabel}</p>}
          </div>

          <div className="card">
            <h3>Đoạn</h3>
            <ul className="lesson-list">
              {job.segments.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    className={`lesson-row${s.id === active?.id ? ' done' : ''}`}
                    onClick={() => setJob(selectSegment(job, s.id))}
                  >
                    <span className="lid">{s.id}</span>
                    <span className="ltitle">
                      {(s.startMs / 1000).toFixed(1)}s–
                      {(s.endMs / 1000).toFixed(1)}s · {statusLabelVi(s.status)} ·
                      rerun {s.autoPasses}/{MAX_RERUN}
                    </span>
                    <span className="lstate">
                      {s.status === 'locked' || s.status === 'skipped'
                        ? '✓'
                        : s.status === 'empty'
                          ? '○'
                          : '?'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {active && (
            <div className="card">
              <h3>
                Đoạn đang chọn · {active.id} · {statusLabelVi(active.status)}
              </h3>
              <div className="seq-preview">
                {active.notes.length === 0 && (
                  <span className="muted">Chưa có nốt (empty).</span>
                )}
                {active.notes.map((n, i) => (
                  <span
                    key={`${n.onsetMs}-${i}`}
                    className={`chip static${n.key == null ? ' on' : ''}`}
                  >
                    {n.key ? keyLabelVi(n.key) : '□'}
                  </span>
                ))}
              </div>
              <div className="btn-row" style={{ marginTop: 10 }}>
                <button
                  type="button"
                  className="secondary"
                  disabled={!canRerun(active)}
                  onClick={doRerun}
                >
                  Chạy lại đoạn ({active.autoPasses}/{MAX_RERUN})
                </button>
                <button type="button" className="secondary" onClick={doSkip}>
                  Bỏ đoạn
                </button>
                <button type="button" className="primary" onClick={doLockSeg}>
                  Khóa đoạn
                </button>
              </div>
              <div className="btn-row" style={{ marginTop: 8 }}>
                <select
                  value={pickKey}
                  onChange={(e) => setPickKey(e.target.value)}
                  className="lesson-bar"
                >
                  {NOTE_CHOICES.map((k) => (
                    <option key={k} value={k}>
                      {keyLabelVi(k)}
                    </option>
                  ))}
                </select>
                <button type="button" className="secondary" onClick={doEnter}>
                  Nhập nốt vào ô trống
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            className="primary block"
            disabled={!canLockSong(job)}
            onClick={doLockSong}
          >
            Khóa bài → Phòng LED
          </button>
          {!canLockSong(job) && (
            <p className="muted tiny center">
              lock_song chỉ bật khi hết empty và unsure.
            </p>
          )}
        </>
      )}
    </div>
  );
}
