import type { ScreenId } from '../types/tieu';
import './Nav.css';

const ITEMS: { id: ScreenId; label: string }[] = [
  { id: 'home', label: 'Nhà' },
  { id: 'learn', label: 'Học' },
  { id: 'led', label: 'LED' },
  { id: 'analyze', label: 'Phân tích' },
  { id: 'after', label: 'Sau bài' },
];

interface Props {
  current: ScreenId;
  onChange: (id: ScreenId) => void;
}

export function Nav({ current, onChange }: Props) {
  return (
    <nav className="bottom-nav" aria-label="Điều hướng chính">
      {ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          className={current === item.id ? 'on' : ''}
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
