/** IndexedDB — metadata + ArrayBuffer, local only (no cloud). */

const DB_NAME = 'tieu.analyze.local.v1';
const STORE = 'audio';
const DB_VER = 1;

export interface StoredAudioMeta {
  id: string;
  filename: string;
  mime: string;
  size: number;
  durationMs: number;
  createdAt: string;
}

export interface StoredAudio extends StoredAudioMeta {
  buffer: ArrayBuffer;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IDB open failed'));
  });
}

export async function saveAudioBlob(
  id: string,
  file: File,
  durationMs: number
): Promise<StoredAudioMeta> {
  const buffer = await file.arrayBuffer();
  const row: StoredAudio = {
    id,
    filename: file.name,
    mime: file.type || 'application/octet-stream',
    size: file.size,
    durationMs,
    createdAt: new Date().toISOString(),
    buffer,
  };
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(row);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('IDB put failed'));
  });
  db.close();
  return {
    id: row.id,
    filename: row.filename,
    mime: row.mime,
    size: row.size,
    durationMs: row.durationMs,
    createdAt: row.createdAt,
  };
}

export async function loadAudio(id: string): Promise<StoredAudio | null> {
  const db = await openDb();
  const row = await new Promise<StoredAudio | null>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => resolve((req.result as StoredAudio) ?? null);
    req.onerror = () => reject(req.error ?? new Error('IDB get failed'));
  });
  db.close();
  return row;
}

export async function deleteAudio(id: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('IDB delete failed'));
  });
  db.close();
}

export async function probeDurationMs(file: File): Promise<number> {
  try {
    const ctx = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext)();
    const buf = await file.arrayBuffer();
    const audio = await ctx.decodeAudioData(buf.slice(0));
    const ms = Math.round(audio.duration * 1000);
    await ctx.close();
    return Math.max(1000, ms);
  } catch {
    return 30000;
  }
}
