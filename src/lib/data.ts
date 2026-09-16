import type { AfterTemplate, TieuCatalog, TieuMap, TieuPiece } from '../types/tieu';

const BASE = '/data';

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}/${path}`);
  if (!res.ok) throw new Error(`Không tải được ${path}: ${res.status}`);
  return res.json() as Promise<T>;
}

export function loadCatalog(): Promise<TieuCatalog> {
  return fetchJson('catalog.json');
}

export function loadMap(): Promise<TieuMap> {
  return fetchJson('xiao_g_8.map.json');
}

export function loadAfterTemplate(): Promise<AfterTemplate> {
  return fetchJson('after-template.json');
}

export function loadLesson(file: string): Promise<TieuPiece> {
  // catalog uses "lessons/L01.json" — strip leading if needed
  const p = file.replace(/^\.?\/?/, '');
  return fetchJson(p.startsWith('lessons/') ? p : `lessons/${p}`);
}

export function loadDemoPiece(): Promise<TieuPiece> {
  return fetchJson('jobs/job_demo_01.exported.json');
}

/** Sequential unlock: lesson at index i unlocked if i===0 or previous is completed */
export function isLessonUnlocked(
  lessonIds: string[],
  lessonId: string,
  completedIds: string[]
): boolean {
  const i = lessonIds.indexOf(lessonId);
  if (i < 0) return false;
  if (i === 0) return true;
  return completedIds.includes(lessonIds[i - 1]);
}

export function nextLessonId(
  lessonIds: string[],
  currentId: string
): string | null {
  const i = lessonIds.indexOf(currentId);
  if (i < 0 || i >= lessonIds.length - 1) return null;
  return lessonIds[i + 1];
}

export function keyLabelVi(key: string): string {
  const map: Record<string, string> = {
    rest: 'Hơi',
    blow: 'Thổi',
    Re: 'Rê',
    Mi: 'Mi',
    Fi: 'Fi',
    Sol: 'Sol',
    La: 'La',
    Si: 'Si',
    Re2: "Rê'",
  };
  return map[key] ?? key;
}
