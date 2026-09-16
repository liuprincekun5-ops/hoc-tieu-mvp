/** Schema types from tieu-pack */

export type HoleState = 0 | 1;

export interface NoteMapEntry {
  jianpu?: string | null;
  jianpuAlt?: string[];
  pitch?: string | null;
  freqHz?: number | null;
  holes: HoleState[] | null;
  embouchure?: string;
  playable: boolean;
  scorePitch?: boolean;
  reason?: string;
}

export interface HoleMeta {
  face: string;
  finger: string;
  labelVi: string;
}

export interface TieuMap {
  schema: 'tieu.map.v1';
  instrumentId: string;
  name: string;
  gripDefault: string;
  tonicSystem: string;
  holeOrder: number[];
  holeMeta: Record<string, HoleMeta>;
  taughtIn16: Record<string, NoteMapEntry>;
  notTaughtIn16: Record<string, NoteMapEntry>;
  jianpuToKey: Record<string, string>;
}

export interface PieceEvent {
  tBeat: number;
  key: string;
}

export interface AfterItem {
  atBeat: number;
  title: string;
  text: string;
}

export interface PieceAfter {
  intro: string;
  items: AfterItem[];
}

export interface TieuPiece {
  schema: 'tieu.piece.v1';
  pieceId: string;
  title: string;
  tier?: number;
  unlocksAfter?: string | null;
  instrument: string;
  grip: string;
  tonicSystem: string;
  bpm: number;
  beatsPerEvent?: number;
  keysAllowed?: string[];
  goal?: string;
  events: PieceEvent[];
  after?: PieceAfter;
  sourceJob?: string;
  note?: string;
}

export interface CatalogLessonRef {
  id: string;
  file: string;
  title: string;
}

export interface CatalogTier {
  id: number;
  name: string;
  lessons: string[];
}

export interface TieuCatalog {
  schema: 'tieu.catalog.v1';
  instrument: string;
  courseId: string;
  title: string;
  unlockRule: 'sequential';
  tiers: CatalogTier[];
  lessons: CatalogLessonRef[];
}

export interface AfterSlot {
  id: string;
  labelVi: string;
  action?: string;
}

export interface AfterTemplate {
  schema: 'tieu.after.v1';
  slots: AfterSlot[];
  rules: string[];
}

export interface UserAfterNote {
  lessonId: string;
  slotId: string;
  atBeat: number | null;
  text: string;
  updatedAt: string;
}

export interface ProgressState {
  /** Highest lesson index completed (0-based). -1 = none. Unlocks next. */
  completedIds: string[];
  /** Last opened lesson */
  lastLessonId: string | null;
}

export type ScreenId = 'home' | 'learn' | 'led' | 'after';
