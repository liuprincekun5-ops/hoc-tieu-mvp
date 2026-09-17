import { useMemo, useRef, useState } from 'react';
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
import { keyLabelVi, loadDemoAnalyze, loadUserMp3Analyze, loadUserMp3Piece } from '../lib/data';
import { probeDurationMs, saveAudioBlob } from '../lib/idbAudio';
import type { TieuAnalyze, TieuMap, TieuPiece } from '../types/tieu';
import './pages.css';

interface Props {
  map: TieuMap;
  onOpenInLed: (piece: TieuPiece) => void;
}

const NOTE_CHOICES = ['Re', 'Mi', 'Fi', 'Sol', 'La', 'Si', 'Re2', 'rest'] as const;

function shortFilename(name: string, max = 32): string {
  if (name.length <= max) return name;
  const dot = name.lastIndexOf('.');
  const ext = dot > 0 ? name.slice(dot) : '';
  const base = dot > 0 ? name.slice(0, dot) : name;
  const keep = Math.max(10, max - ext.length - 1);
  return `${base.slice(0, keep)}…${ext}`;
}

function formatDuration(ms: number): string {
  const sec = Math.max(0, Math.round(ms / 1000));
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function statusChipClass(status: string): string {
  switch (status) {
    case 'locked':
      return 'analyze-chip analyze-chip--locked';
    case 'unsure':
    case 'user_edited':
      return 'analyze-chip analyze-chip--unsure';
    case 'empty':
      return 'analyze-chip analyze-chip--empty';
    case 'skipped':
      return 'analyze-chip analyze-chip--skipped';
    default:
      return 'analyze-chip';
  }
}

function chipLabel(status: string): string {
  if (status === 'skipped') return 'Đã bỏ';
  return statusLabelVi(status);
}

export function AnalyzePage({ map, onOpenInLed }: Props) {
  const [job, setJob] = useState<TieuAnalyze | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [pickKey, setPickKey] = useState('Re');
  const [pickedName, setPickedName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const active = useMemo(() => {
    if (!job) return null;
    const id = job.loop.activeSegmentId;
    return job.segments.find((s) => s.id === id) ?? job.segments[0] ?? null;
  }, [job]);

  const step = !job ? 1 : canLockSong(job) ? 3 : 2;

  const startFromFile = async (file: File | null) => {
    if (!file) return;
    setBusy(true);
    setMsg(null);
    setPickedName(file.name);
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
      setPickedName(null);
      setMsg('Đã nạp job demo gói giấy (stub).');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Không tải demo.');
    } finally {
      setBusy(false);
    }
  };

  const startFromUserMp3 = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const raw = await loadUserMp3Analyze();
      setJob(adoptDemoAnalyze(raw));
      setPickedName('MP3 của bạn (mẫu đã phân tích ~90s đầu)');
      setMsg('Đã nạp phân tích mẫu từ file MP3 — có thể Khóa bài → LED hoặc mở phổ sẵn.');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Không tải mẫu MP3.');
    } finally {
      setBusy(false);
    }
  };

  const openUserMp3InLed = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const piece = await loadUserMp3Piece();
      setMsg('Đang mở bài MP3 mẫu trong Phòng LED…');
      onOpenInLed(piece);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Không mở được piece.');
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

  const lockReady = job ? canLockSong(job) : false;

  return (
    <div className="page analyze-page">
      <header className="page-head">
        <h1>Phân tích file</h1>
        <span className="badge">stub · chỉ local</span>
      </header>

      <nav className="analyze-steps" aria-label="Các bước phân tích">
        <span className={`analyze-step${step === 1 ? ' is-current' : step > 1 ? ' is-done' : ''}`}>
          <em>1</em> Chọn file
        </span>
        <span className="analyze-step-sep" aria-hidden>
          ·
        </span>
        <span className={`analyze-step${step === 2 ? ' is-current' : step > 2 ? ' is-done' : ''}`}>
          <em>2</em> Xử lý đoạn
        </span>
        <span className="analyze-step-sep" aria-hidden>
          ·
        </span>
        <span className={`analyze-step${step === 3 ? ' is-current' : ''}`}>
          <em>3</em> Khóa bài
        </span>
      </nav>

      <div className="card stub analyze-stub">
        <strong>Thử nghiệm / stub</strong>
        <p className="muted tiny">
          Không có engine nhận dạng thật. Audio chỉ lưu trên máy (IndexedDB). Chỉ
          tiêu 8 lỗ hơi G — không nửa cung, không nhạc phim.
        </p>
      </div>

      <div className="card analyze-card">
        <h3>1. Chọn file bạn sở hữu</h3>
        <input
          ref={fileRef}
          type="file"
          accept="audio/*,.wav,.mp3,.m4a,.ogg"
          disabled={busy}
          className="analyze-file-native"
          onChange={(e) => void startFromFile(e.target.files?.[0] ?? null)}
        />
        <div className="analyze-file-pick">
          <button
            type="button"
            className="secondary"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
          >
            Chọn file audio…
          </button>
          <button
            type="button"
            className="secondary"
            disabled={busy}
            onClick={() => void startFromDemo()}
          >
            Nạp demo gói giấy
          </button>
          <button
            type="button"
            className="primary"
            disabled={busy}
            onClick={() => void startFromUserMp3()}
          >
            Nạp phân tích từ MP3 của bạn
          </button>
          <button
            type="button"
            className="secondary"
            disabled={busy}
            onClick={() => void openUserMp3InLed()}
          >
            Mở phổ MP3 trong LED
          </button>
        </div>
        {pickedName && (
          <p className="analyze-file-name" title={pickedName}>
            {pickedName}
          </p>
        )}
        {msg && <p className="muted tiny analyze-msg">{msg}</p>}
      </div>

      {!job && (
        <div className="card analyze-card">
          <p className="muted">
            Chưa có job. Chọn file hoặc nạp demo để bắt đầu vòng Đã khóa / Chưa
            chắc / Trống.
          </p>
        </div>
      )}

      {job && (
        <>
          <div className="card analyze-card analyze-job">
            <div className="analyze-job-head">
              <div className="analyze-job-title">
                <span className="analyze-job-label">Job</span>
                <strong
                  className="analyze-job-name"
                  title={job.job.source.filename}
                >
                  {shortFilename(job.job.source.filename)}
                </strong>
              </div>
              <span className="analyze-job-meta">
                {formatDuration(job.job.source.durationMs)} · vòng{' '}
                {job.loop.round}
              </span>
            </div>
            <div className="analyze-progress">
              <div className="analyze-progress-row">
                <span>Đã chấp nhận</span>
                <strong>{job.job.progress.percentAccepted}%</strong>
              </div>
              <div className="bar">
                <div
                  className="bar-fill"
                  style={{ width: `${job.job.progress.percentAccepted}%` }}
                />
              </div>
            </div>
            {job.stubLabel && (
              <p className="analyze-job-stub muted tiny">{job.stubLabel}</p>
            )}
          </div>

          <div className="card analyze-card">
            <h3>2. Xử lý đoạn</h3>
            <ul className="analyze-seg-list">
              {job.segments.map((s) => {
                const selected = s.id === active?.id;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      className={`analyze-seg-row${selected ? ' is-active' : ''}`}
                      onClick={() => setJob(selectSegment(job, s.id))}
                    >
                      <span className="analyze-seg-id">{s.id}</span>
                      <span className="analyze-seg-time">
                        {(s.startMs / 1000).toFixed(1)}s –{' '}
                        {(s.endMs / 1000).toFixed(1)}s
                      </span>
                      <span className={statusChipClass(s.status)}>
                        {chipLabel(s.status)}
                      </span>
                      <span className="analyze-seg-rerun muted tiny">
                        {s.autoPasses}/{MAX_RERUN}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {active && (
            <div className="card analyze-card analyze-active">
              <div className="analyze-active-head">
                <h3>
                  Đoạn đang chọn · {active.id}
                </h3>
                <span className={statusChipClass(active.status)}>
                  {chipLabel(active.status)}
                </span>
              </div>
              <p className="analyze-active-range muted">
                {(active.startMs / 1000).toFixed(1)}s –{' '}
                {(active.endMs / 1000).toFixed(1)}s
              </p>

              <div className="analyze-active-notes">
                <span className="analyze-section-label">Nốt</span>
                <div className="seq-preview">
                  {active.notes.length === 0 && (
                    <span className="muted">Chưa có nốt (trống).</span>
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
              </div>

              <div className="analyze-actions">
                <span className="analyze-section-label">Thao tác đoạn</span>
                <div className="btn-row analyze-actions-row">
                  <button
                    type="button"
                    className="secondary"
                    disabled={!canRerun(active)}
                    onClick={doRerun}
                  >
                    Chạy lại ({active.autoPasses}/{MAX_RERUN})
                  </button>
                  <button type="button" className="secondary" onClick={doSkip}>
                    Bỏ đoạn
                  </button>
                  <button type="button" className="primary" onClick={doLockSeg}>
                    Khóa đoạn
                  </button>
                </div>
              </div>

              <div className="analyze-enter">
                <span className="analyze-section-label">Nhập nốt vào ô trống</span>
                <div className="btn-row analyze-actions-row">
                  <select
                    value={pickKey}
                    onChange={(e) => setPickKey(e.target.value)}
                    className="lesson-bar analyze-note-select"
                    aria-label="Chọn nốt"
                  >
                    {NOTE_CHOICES.map((k) => (
                      <option key={k} value={k}>
                        {keyLabelVi(k)}
                      </option>
                    ))}
                  </select>
                  <button type="button" className="secondary" onClick={doEnter}>
                    Nhập nốt
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="analyze-sticky-cta">
            <button
              type="button"
              className="primary block"
              disabled={!lockReady}
              onClick={doLockSong}
            >
              3. Khóa bài → Phòng LED
            </button>
            <p className="analyze-cta-hint muted tiny center">
              {lockReady
                ? 'Sẵn sàng khóa bài và mở Phòng LED.'
                : 'Chỉ bật khi hết đoạn Trống và Chưa chắc.'}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
