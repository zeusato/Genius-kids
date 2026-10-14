// Kho mô hình (plan mục 10.2): IndexedDB `brick-studio-v1` — store `models` + `thumbs`, khoá [ownerId, id].
// Hai store này được liệt kê NGUYÊN VẸN trong services/account/snapshot.ts (bẫy: thiếu store thì DB tạo thiếu).
import { LIMITS, validateModel, type BrickModel } from '../engine/model';

export const DB_NAME = 'brick-studio-v1';
export interface ModelSummary { id: string; name: string; updated: number; count: number; revision: number; thumb?: Blob; idea?: string }
interface ThumbRow { ownerId: string; id: string; revision: number; blob: Blob }

let connection: Promise<IDBDatabase> | undefined;
function db(): Promise<IDBDatabase> {
  return connection ||= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      for (const name of ['models', 'thumbs']) if (!req.result.objectStoreNames.contains(name)) {
        const s = req.result.createObjectStore(name, { keyPath: ['ownerId', 'id'] });
        s.createIndex('ownerId', 'ownerId');
      }
    };
    req.onsuccess = () => { req.result.onversionchange = () => { req.result.close(); connection = undefined; }; resolve(req.result); };
    req.onerror = () => { connection = undefined; reject(req.error); };
    req.onblocked = () => { connection = undefined; reject(Error('Đóng tab Xưởng Lắp Ghép cũ để lưu mô hình.')); };
  });
}
const done = (tx: IDBTransaction) => new Promise<void>((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onabort = () => reject(tx.error || Error('Không lưu được mô hình')); tx.onerror = () => {}; });

export async function readModel(ownerId: string, id: string): Promise<BrickModel | undefined> {
  const d = await db();
  return new Promise((resolve, reject) => {
    const r = d.transaction('models').objectStore('models').get([ownerId, id]);
    r.onsuccess = () => { try { resolve(r.result ? validateModel(r.result as BrickModel) : undefined); } catch (e) { reject(e); } };
    r.onerror = () => reject(r.error);
  });
}

export async function listModels(ownerId: string): Promise<ModelSummary[]> {
  const d = await db(), tx = d.transaction(['models', 'thumbs']);
  const models = tx.objectStore('models').index('ownerId').getAll(ownerId), thumbs = tx.objectStore('thumbs').index('ownerId').getAll(ownerId);
  await done(tx);
  const th = new Map((thumbs.result as ThumbRow[]).map(t => [t.id, t]));
  return (models.result as BrickModel[]).map(m => ({ id: m.id, name: m.name, updated: m.updated, count: m.stats?.count ?? m.b.length / 6, revision: m.revision, idea: m.idea, thumb: th.get(m.id)?.blob }))
    .sort((a, b) => b.updated - a.updated);
}

/** Ghi có kiểm revision: tab khác đã lưu bản mới hơn thì từ chối (không đè). Trả về revision mới. */
export async function saveModel(model: BrickModel, expected: number): Promise<number> {
  validateModel(model);
  const d = await db(), tx = d.transaction('models', 'readwrite'), store = tx.objectStore('models');
  let error: Error | undefined;
  const r = store.get([model.ownerId, model.id]);
  r.onsuccess = () => {
    if ((r.result?.revision || 0) !== expected) { error = Error('Mô hình vừa được lưu ở tab khác. Mở lại từ Tủ Mô Hình để tiếp tục.'); tx.abort(); return; }
    if (!r.result) {
      const count = store.index('ownerId').count(model.ownerId);
      count.onsuccess = () => {
        if (count.result >= LIMITS.models) { error = Error(`Tủ đã có ${LIMITS.models} mô hình. Hãy xoá bớt mô hình cũ.`); tx.abort(); }
        else store.put({ ...model, revision: expected + 1 });
      };
    } else store.put({ ...model, revision: expected + 1 });
  };
  try { await done(tx); } catch (e) { throw error || e; }
  return expected + 1;
}

/** Ảnh thu nhỏ đến muộn không được đè lên bản mới hơn. */
export async function saveThumb(ownerId: string, id: string, revision: number, blob: Blob) {
  const d = await db(), tx = d.transaction(['models', 'thumbs'], 'readwrite');
  const r = tx.objectStore('models').get([ownerId, id]);
  r.onsuccess = () => { if (r.result?.revision === revision) tx.objectStore('thumbs').put({ ownerId, id, revision, blob } satisfies ThumbRow); };
  await done(tx);
}

export async function removeModel(ownerId: string, id: string) {
  const d = await db(), tx = d.transaction(['models', 'thumbs'], 'readwrite');
  tx.objectStore('models').delete([ownerId, id]); tx.objectStore('thumbs').delete([ownerId, id]);
  await done(tx);
}

export function newModel(ownerId: string, name: string, idea?: string): BrickModel {
  const now = Date.now();
  return { v: 1, ownerId, id: crypto.randomUUID(), name, created: now, updated: now, revision: 0, parts: [], colors: [], b: [], stats: { count: 0, size: [0, 0, 0] }, ...(idea ? { idea } : {}) };
}

export async function clearBricksData(ownerId: string) {
  const d = await db(), tx = d.transaction(['models', 'thumbs'], 'readwrite');
  for (const name of ['models', 'thumbs']) {
    const r = tx.objectStore(name).index('ownerId').openCursor(IDBKeyRange.only(ownerId));
    r.onsuccess = () => { const c = r.result; if (c) { c.delete(); c.continue(); } };
  }
  await done(tx);
}
