import type { ProgressState, UserAfterNote } from '../types/tieu';

const PROGRESS_KEY = 'tieu.progress.v1';
const AFTER_KEY = 'tieu.afterNotes.v1';

const defaultProgress = (): ProgressState => ({
  completedIds: [],
  lastLessonId: null,
});

export function loadProgress(): ProgressState {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return defaultProgress();
    const parsed = JSON.parse(raw) as ProgressState;
    return {
      completedIds: Array.isArray(parsed.completedIds) ? parsed.completedIds : [],
      lastLessonId: parsed.lastLessonId ?? null,
    };
  } catch {
    return defaultProgress();
  }
}

export function saveProgress(state: ProgressState): void {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(state));
}

export function markLessonComplete(lessonId: string): ProgressState {
  const p = loadProgress();
  if (!p.completedIds.includes(lessonId)) {
    p.completedIds = [...p.completedIds, lessonId];
  }
  p.lastLessonId = lessonId;
  saveProgress(p);
  return p;
}

export function setLastLesson(lessonId: string): ProgressState {
  const p = loadProgress();
  p.lastLessonId = lessonId;
  saveProgress(p);
  return p;
}

export function loadAfterNotes(): UserAfterNote[] {
  try {
    const raw = localStorage.getItem(AFTER_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveAfterNotes(notes: UserAfterNote[]): void {
  localStorage.setItem(AFTER_KEY, JSON.stringify(notes));
}

export function upsertAfterNote(note: UserAfterNote): UserAfterNote[] {
  const notes = loadAfterNotes();
  const idx = notes.findIndex(
    (n) => n.lessonId === note.lessonId && n.slotId === note.slotId
  );
  if (idx >= 0) notes[idx] = note;
  else notes.push(note);
  saveAfterNotes(notes);
  return notes;
}

export function notesForLesson(lessonId: string): UserAfterNote[] {
  return loadAfterNotes().filter((n) => n.lessonId === lessonId);
}
