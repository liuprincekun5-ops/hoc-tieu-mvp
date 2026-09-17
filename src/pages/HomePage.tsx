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
        <div className="bar">
          <div className="bar-fill" style={{ width: `${pct}%` }} />
        </div>
        <p className="muted">
          {done === 0 ? 'Bắt đầu từ L01 — hoàn thành để mở bài tiếp.' : 'Mở khóa tuần tự. Luyện lại bài đã mở bất cứ lúc nào.'}
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
                  >
                    <span className="lid">{lid}</span>
                    <span className="ltitle">{ref.title}</span>
                    <span className="lstate">
                      {!unlocked ? '🔒' : completed ? '✓' : '→'}
                    </span>
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
        Chỉ tiêu 8 lỗ hơi G. Mic chỉ là trợ giúp “chấm gần đúng” (tùy chọn). Không nửa cung trong 16 bài đầu.
      </p>
    </div>
  );
}
