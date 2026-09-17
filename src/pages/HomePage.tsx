import type { ProgressState, TieuCatalog } from '../types/tieu';
import { isLessonUnlocked } from '../lib/data';
import './pages.css';

interface Props {
  catalog: TieuCatalog;
  progress: ProgressState;
  onOpenLesson: (lessonId: string) => void;
  onGoLed: () => void;
  onGoAnalyze?: () => void;
}

function LessonState({ unlocked, completed }: { unlocked: boolean; completed: boolean }) {
  if (!unlocked) {
    return (
      <span className="lstate lstate-locked" title="Chưa mở khóa" aria-label="Chưa mở khóa">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </svg>
      </span>
    );
  }
  if (completed) {
    return (
      <span className="lstate lstate-done" title="Đã hoàn thành" aria-label="Đã hoàn thành">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 13l4 4L19 7" />
        </svg>
      </span>
    );
  }
  return (
    <span className="lstate lstate-open" title="Sẵn sàng học" aria-label="Sẵn sàng học">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 12h14" />
        <path d="M13 6l6 6-6 6" />
      </svg>
    </span>
  );
}

export function HomePage({ catalog, progress, onOpenLesson, onGoLed, onGoAnalyze }: Props) {
  const ids = catalog.lessons.map((l) => l.id);
  const done = progress.completedIds.length;
  const total = catalog.lessons.length;
  const pct = Math.round((done / total) * 100);

  return (
    <div className="page">
      <header className="page-head">
        <h1>{catalog.title}</h1>
        <span className="badge">Hơi G · 8 lỗ · trái trên</span>
      </header>

      <div className="card progress-card">
        <div className="progress-row">
          <strong>
            Tiến độ: {done}/{total} bài
          </strong>
          <span>{pct}%</span>
        </div>
        <div className="bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="bar-fill" style={{ width: `${pct}%` }} />
        </div>
        <p className="muted">
          {done === 0
            ? 'Bắt đầu từ L01 — hoàn thành để mở bài tiếp.'
            : 'Mở khóa tuần tự. Luyện lại bài đã mở bất cứ lúc nào.'}
        </p>
      </div>

      {catalog.tiers.map((tier) => (
        <section key={tier.id} className="tier">
          <h2>
            Tầng {tier.id} · {tier.name}
          </h2>
          <ul className="lesson-list">
            {tier.lessons.map((lid) => {
              const ref = catalog.lessons.find((l) => l.id === lid);
              if (!ref) return null;
              const unlocked = isLessonUnlocked(ids, lid, progress.completedIds);
              const completed = progress.completedIds.includes(lid);
              return (
                <li key={lid}>
                  <button
                    type="button"
                    className={`lesson-row${unlocked ? '' : ' locked'}${completed ? ' done' : ''}`}
                    disabled={!unlocked}
                    onClick={() => onOpenLesson(lid)}
                    aria-label={`${lid}: ${ref.title}${!unlocked ? ' (chưa mở)' : completed ? ' (đã xong)' : ''}`}
                  >
                    <span className="lid">{lid}</span>
                    <span className="ltitle">{ref.title}</span>
                    <LessonState unlocked={unlocked} completed={completed} />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <div className="btn-row">
        <button type="button" className="primary" onClick={onGoLed}>
          Phòng LED
        </button>
        {onGoAnalyze && (
          <button type="button" className="secondary" onClick={onGoAnalyze}>
            Phân tích file
          </button>
        )}
      </div>

      <p className="muted center tiny">
        Chỉ tiêu 8 lỗ hơi G. Mic chỉ là trợ giúp “chấm gần đúng” (tùy chọn). Không nửa cung trong 16
        bài đầu.
      </p>
    </div>
  );
}
