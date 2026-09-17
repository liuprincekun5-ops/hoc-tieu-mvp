import type { ReactNode } from 'react';
import type { ScreenId } from '../types/tieu';
import './Nav.css';

function IconHome() {
  return (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
      <path d="M9 21v-7h6v7" />
    </svg>
  );
}

function IconLearn() {
  return (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function IconLed() {
  return (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="2" width="6" height="20" rx="3" />
      <circle cx="12" cy="7" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="12" cy="11" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="12" cy="15" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconAnalyze() {
  return (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 3v18h18" />
      <path d="M7 14l3-3 3 2 5-6" />
    </svg>
  );
}

function IconAfter() {
  return (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

const ITEMS: { id: ScreenId; label: string; icon: ReactNode }[] = [
  { id: 'home', label: 'Nhà', icon: <IconHome /> },
  { id: 'learn', label: 'Học', icon: <IconLearn /> },
  { id: 'led', label: 'LED', icon: <IconLed /> },
  { id: 'analyze', label: 'Phân tích', icon: <IconAnalyze /> },
  { id: 'after', label: 'Sau bài', icon: <IconAfter /> },
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
          aria-current={current === item.id ? 'page' : undefined}
          onClick={() => onChange(item.id)}
        >
          {item.icon}
          <span className="nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
