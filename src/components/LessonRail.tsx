import type { ProgressState, TieuCatalog } from '../types/tieu';
import { isLessonUnlocked } from '../lib/data';
import './LessonRail.css';

interface Props {
  catalog: TieuCatalog;
  progress: ProgressState;
  onOpenLesson: (lessonId: string) => void;
  /** Highlight the lesson currently selected in the app */
  activeId?: string | null;
  /** Optional compact/rail chrome class */
  className?: string;
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

export function LessonRail({ catalog, progress, onOpenLesson, activeId, className }: Props) {
  const ids = catalog.lessons.map((l) => l.id);
  const done = progress.completedIds.length;
  const total = catalog.lessons.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className={`lesson-rail${className ? ` ${className}` : ''}`}>
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
              const active = activeId === lid;
              return (
                <li key={lid}>
                  <button
                    type="button"
                    className={`lesson-row${unlocked ? '' : ' locked'}${completed ? ' done' : ''}${active ? ' active' : ''}`}
                    disabled={!unlocked}
                    onClick={() => onOpenLesson(lid)}
                    aria-current={active ? 'true' : undefined}
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
    </div>
  );
}

/** Pick a sensible “continue” lesson for the welcome CTA. */
export function getContinueLessonId(
  catalog: TieuCatalog,
  progress: ProgressState,
  preferredId?: string | null,
): string {
  const ids = catalog.lessons.map((l) => l.id);
  if (preferredId && isLessonUnlocked(ids, preferredId, progress.completedIds)) {
    return preferredId;
  }
  for (const id of ids) {
    if (isLessonUnlocked(ids, id, progress.completedIds) && !progress.completedIds.includes(id)) {
      return id;
    }
  }
  return preferredId && ids.includes(preferredId) ? preferredId : ids[0] ?? '';
}
