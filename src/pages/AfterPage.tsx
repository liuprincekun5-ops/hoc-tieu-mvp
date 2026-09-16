import { useEffect, useState } from 'react';
import {
  keyLabelVi,
  loadAfterTemplate,
  loadLesson,
} from '../lib/data';
import {
  loadAfterNotes,
  notesForLesson,
  upsertAfterNote,
} from '../lib/storage';
import type {
  AfterTemplate,
  TieuCatalog,
  TieuPiece,
  UserAfterNote,
} from '../types/tieu';
import './pages.css';

interface Props {
  catalog: TieuCatalog;
  lessonId: string | null;
  onSelectLesson: (id: string) => void;
  onReplay: (piece: TieuPiece, atBeat?: number) => void;
}

export function AfterPage({
  catalog,
  lessonId,
  onSelectLesson,
  onReplay,
}: Props) {
  const activeId = lessonId ?? catalog.lessons[0]?.id ?? 'L01';
  const [template, setTemplate] = useState<AfterTemplate | null>(null);
  const [piece, setPiece] = useState<TieuPiece | null>(null);
  const [notes, setNotes] = useState<UserAfterNote[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    loadAfterTemplate().then(setTemplate).catch(console.error);
  }, []);

  useEffect(() => {
    const ref = catalog.lessons.find((l) => l.id === activeId);
    if (!ref) return;
    loadLesson(ref.file)
      .then((p) => {
        setPiece(p);
        const existing = notesForLesson(activeId);
        setNotes(existing);
        const d: Record<string, string> = {};
        existing.forEach((n) => {
          d[n.slotId] = n.text;
        });
        // seed from piece.after if no user note yet
        if (p.after && existing.length === 0) {
          p.after.items.slice(0, 4).forEach((it, i) => {
            const slot = ['finger', 'breath', 'common_error', 'replay'][i];
            if (slot && !d[slot]) d[slot] = it.text;
          });
        }
        setDrafts(d);
      })
      .catch(console.error);
  }, [activeId, catalog.lessons]);

  const saveSlot = (slotId: string, atBeat: number | null) => {
    const text = (drafts[slotId] ?? '').trim();
    const updated = upsertAfterNote({
      lessonId: activeId,
      slotId,
      atBeat,
      text,
      updatedAt: new Date().toISOString(),
    });
    setNotes(notesForLesson(activeId));
    void updated;
  };

  return (
    <div className="page">
      <header className="page-head">
        <h1>Sau bài</h1>
        <span className="badge">tieu.after.v1</span>
      </header>

      <label className="field">
        <span>Bài</span>
        <select
          className="lesson-bar"
          value={activeId}
          onChange={(e) => onSelectLesson(e.target.value)}
        >
          {catalog.lessons.map((l) => (
            <option key={l.id} value={l.id}>
              {l.id} · {l.title}
            </option>
          ))}
        </select>
      </label>

      {piece?.after && (
        <div className="card">
          <h2>{piece.title}</h2>
          <p>{piece.after.intro}</p>
          <ul className="pack-after">
            {piece.after.items.map((it, i) => (
              <li key={i}>
                <strong>
                  {it.title} · beat {it.atBeat}
                </strong>
                <br />
                {it.text}
                <button
                  type="button"
                  className="linkish"
                  onClick={() => onReplay(piece, it.atBeat)}
                >
                  Xem lại quanh beat {it.atBeat}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {template && (
        <div className="card">
          <h3>Ghi chú của bạn (localStorage)</h3>
          <p className="muted tiny">{template.rules.join(' · ')}</p>
          {template.slots.map((slot) => {
            const packItem = piece?.after?.items.find(
              (_, i) =>
                ['finger', 'breath', 'common_error', 'replay'][i] === slot.id
            );
            const atBeat = packItem?.atBeat ?? null;
            return (
              <div key={slot.id} className="slot">
                <label>
                  {slot.labelVi}
                  {atBeat != null && (
                    <span className="muted"> · beat {atBeat}</span>
                  )}
                </label>
                <textarea
                  rows={2}
                  value={drafts[slot.id] ?? ''}
                  onChange={(e) =>
                    setDrafts((d) => ({ ...d, [slot.id]: e.target.value }))
                  }
                  placeholder="Viết ngắn…"
                />
                <div className="btn-row tight">
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => saveSlot(slot.id, atBeat)}
                  >
                    Lưu
                  </button>
                  {slot.action === 'replay_beats' && piece && (
                    <button
                      type="button"
                      className="icon"
                      onClick={() => onReplay(piece, atBeat ?? undefined)}
                    >
                      Phát 2–4 beat
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {notes.length > 0 && (
        <p className="muted tiny center">
          Đã lưu {notes.length} mảnh · tổng máy:{' '}
          {loadAfterNotes().length} ghi chú
        </p>
      )}

      {piece && (
        <button
          type="button"
          className="primary block"
          onClick={() => onReplay(piece)}
        >
          Luyện lại LED · {keyLabelVi(piece.events[0]?.key ?? 'Re')}…
        </button>
      )}
    </div>
  );
}
