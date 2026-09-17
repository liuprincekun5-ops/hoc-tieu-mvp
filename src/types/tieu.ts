/** Schema types aligned with tieu-pack JSON */

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
  completedIds: string[];
  lastLessonId: string | null;
}

export type ScreenId = 'home' | 'learn' | 'led' | 'after' | 'analyze';

/** Replay events in [atBeat - before, atBeat + after] (~2–4 beats). */
export interface ReplayWindow {
  atBeat: number;
  before?: number;
  after?: number;
}

export interface LedInject {
  piece: TieuPiece;
  replay?: ReplayWindow | null;
}

/* —— tieu.analyze.v1 —— */

export type SegmentStatus =
  | 'locked'
  | 'unsure'
  | 'empty'
  | 'user_edited'
  | 'skipped';

export interface AnalyzeNote {
  onsetMs: number;
  durationMs: number;
  key: string | null;
  jianpu?: string | null;
  holes?: HoleState[] | null;
  confidence?: number;
  flag?: string;
  breath?: boolean;
}

export interface AnalyzeSegment {
  id: string;
  startMs: number;
  endMs: number;
  status: SegmentStatus;
  confidence: number;
  autoPasses: number;
  chosenBy: 'user' | 'model' | null;
  notes: AnalyzeNote[];
  gapReason?: string;
  lockedAt?: string;
}

export interface AnalyzeLoopHistory {
  round: number;
  action: string;
  actor: string;
  segmentId?: string;
  result?: string;
  passesUsed?: number;
}

export interface AnalyzeJobMeta {
  id: string;
  createdAt: string;
  status: string;
  instrument: { id: string; grip: string };
  source: {
    filename: string;
    durationMs: number;
    license: string;
  };
  progress: {
    lockedMs: number;
    unsureMs: number;
    emptyMs: number;
    percentAccepted: number;
  };
}

export interface AnalyzeSettings {
  notation: string;
  tonicSystem: string;
  maxAutoPassPerSegment: number;
  confidenceLock: number;
  confidenceUnsure: number;
}

export interface AnalyzeLoop {
  round: number;
  activeSegmentId: string | null;
  waitingAction: string;
  allowedActions: string[];
  history: AnalyzeLoopHistory[];
}

export interface TieuAnalyze {
  schema: 'tieu.analyze.v1';
  job: AnalyzeJobMeta;
  settings: AnalyzeSettings;
  segments: AnalyzeSegment[];
  loop: AnalyzeLoop;
  localAudioId?: string;
  stubLabel?: string;
}

export type PitchMatch = 'match' | 'near' | 'miss' | 'silent' | 'idle';
