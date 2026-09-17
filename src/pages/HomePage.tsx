import { LessonRail, getContinueLessonId } from '../components/LessonRail';
import type { ProgressState, TieuCatalog } from '../types/tieu';
import './pages.css';

interface Props {
  catalog: TieuCatalog;
  progress: ProgressState;
  lessonId?: string | null;
  onOpenLesson: (lessonId: string) => void;
  onGoLed: () => void;
  onGoAnalyze?: () => void;
}

export function HomePage({
  catalog,
  progress,
  lessonId,
  onOpenLesson,
  onGoLed,
  onGoAnalyze,
}: Props) {
  const continueId = getContinueLessonId(catalog, progress, lessonId);
  const continueLesson = catalog.lessons.find((l) => l.id === continueId);
  const done = progress.completedIds.length;
  const total = catalog.lessons.length;

  return (
    <div className="page">
      <header className="page-head">
        <h1>{catalog.title}</h1>
        <span className="badge">Hơi G · 8 lỗ · trái trên</span>
      </header>

      {/* Desktop: welcome / overview (lesson list lives in left rail) */}
      <div className="welcome-desktop hide-on-mobile">
        <div className="card welcome-card">
          <h2>Chào mừng trở lại</h2>
          <p className="muted">
            {done === 0
              ? 'Bạn đang ở đầu lộ trình 16 bài. Chọn bài bên trái hoặc tiếp tục từ L01.'
              : done >= total
                ? 'Bạn đã hoàn thành cả 16 bài — luyện lại bất kỳ bài nào bên trái.'
                : `Đã xong ${done}/${total} bài. Danh sách bên trái luôn sẵn sàng; bấm tiếp tục để vào bài đang học.`}
          </p>
          {continueLesson && (
            <p className="welcome-next">
              <strong>{continueLesson.id}</strong>
              <span>{continueLesson.title}</span>
            </p>
          )}
          <div className="btn-row">
            <button
              type="button"
              className="primary"
              disabled={!continueId}
              onClick={() => continueId && onOpenLesson(continueId)}
            >
              Tiếp tục học
            </button>
            <button type="button" className="secondary" onClick={onGoLed}>
              Phòng LED
            </button>
          </div>
          {onGoAnalyze && (
            <button type="button" className="linkish" onClick={onGoAnalyze}>
              Phân tích file audio →
            </button>
          )}
          <p className="muted tiny welcome-tip">
            Mẹo: hoàn thành bài để mở khóa tuần tự. Mic chỉ là trợ giúp “chấm gần đúng” (tùy chọn).
          </p>
        </div>
      </div>

      {/* Mobile: full progress + lesson list (unchanged spirit) */}
      <div className="home-mobile-rail hide-on-desktop">
        <LessonRail
          catalog={catalog}
          progress={progress}
          onOpenLesson={onOpenLesson}
          activeId={lessonId}
        />

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
    </div>
  );
}
