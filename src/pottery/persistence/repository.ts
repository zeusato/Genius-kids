import { clone, type ArtworkDoc, type ArtworkSummary, type Scope } from '../model';
import { validateArtwork } from '../engine/document';
export const DATABASE = 'pottery-studio-v1';
let connection: Promise<IDBDatabase> | undefined;
export function database(): Promise<IDBDatabase> {
  return connection ||= new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => {
      for (const name of ['artworks', 'checkpoints', 'thumbnails']) {
        const store = request.result.createObjectStore(name, { keyPath: ['account', 'student', 'id'] });
        store.createIndex('owner', ['account', 'student']);
      }
    };
    request.onsuccess = () => { const db = request.result; db.onversionchange = () => { db.close(); connection = undefined; }; resolve(db); };
    request.onerror = () => { connection = undefined; reject(request.error); };
    request.onblocked = () => { connection = undefined; reject(Error('Đóng tab Xưởng Gốm cũ rồi thử lại.')); };
  });
}
export async function closeDatabase() { const db = await connection; db?.close(); connection = undefined; }
const key = (scope: Scope, id: string): IDBValidKey => [scope.account, scope.student, id];
export async function readArtwork(scope: Scope, id: string): Promise<ArtworkDoc | undefined> {
  const db = await database();
  return new Promise((resolve, reject) => { const req = db.transaction('artworks').objectStore('artworks').get(key(scope,id)); req.onerror = () => reject(req.error); req.onsuccess = () => { try { resolve(req.result ? validateArtwork(req.result) : undefined); } catch (e) { reject(e); } }; });
}
export async function saveArtwork(art: ArtworkDoc, expected: number, checkpoint = false): Promise<number> {
  validateArtwork(art); const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(checkpoint ? ['artworks','checkpoints'] : ['artworks'], 'readwrite'), store = tx.objectStore('artworks');
    let error: Error | undefined;
    const request = store.get(key(art, art.id));
    request.onsuccess = () => {
      if ((request.result?.revision ?? 0) !== expected) { error = Error('Tác phẩm đã đổi ở tab khác. Hãy xuất bản sao hoặc lưu thành bản mới để giữ phần đang làm.'); tx.abort(); return; }
      const record = { ...clone(art), revision: expected + 1, updatedAt: new Date().toISOString() };
      store.put(record);
      if (checkpoint) tx.objectStore('checkpoints').put(record);
    };
    tx.oncomplete = () => resolve(expected + 1);
    tx.onabort = () => reject(error || tx.error || Error('Chưa lưu được tác phẩm.'));
    tx.onerror = () => {};
  });
}
export async function listArtworks(scope: Scope): Promise<ArtworkSummary[]> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['artworks','thumbnails']), range = IDBKeyRange.only([scope.account, scope.student]);
    const arts = tx.objectStore('artworks').index('owner').getAll(range), thumbs = tx.objectStore('thumbnails').index('owner').getAll(range);
    tx.oncomplete = () => resolve(arts.result.map((a: ArtworkDoc) => ({ id: a.id, name: a.name, stage: a.stage, revision: a.revision, updatedAt: a.updatedAt, thumb: thumbs.result.find(t => t.id === a.id)?.blob })).sort((a,b) => b.updatedAt.localeCompare(a.updatedAt)));
    tx.onabort = () => reject(tx.error); tx.onerror = () => {};
  });
}
export async function saveThumbnail(art: ArtworkDoc, blob: Blob) {
  const db = await database();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(['artworks','thumbnails'], 'readwrite'), req = tx.objectStore('artworks').get(key(art, art.id));
    req.onsuccess = () => { if (req.result?.revision === art.revision) tx.objectStore('thumbnails').put({ account: art.account, student: art.student, id: art.id, revision: art.revision, blob }); };
    tx.oncomplete = () => resolve(); tx.onabort = () => reject(tx.error); tx.onerror = () => {};
  });
}
export async function removeArtwork(scope: Scope, id: string) {
  const db = await database(); return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(['artworks','checkpoints','thumbnails'], 'readwrite');
    for (const name of ['artworks','checkpoints','thumbnails']) tx.objectStore(name).delete(key(scope,id));
    tx.oncomplete = () => resolve(); tx.onabort = () => reject(tx.error); tx.onerror = () => {};
  });
}
export async function clearPotteryData(scope: Scope) {
  const db = await database(); return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(['artworks','checkpoints','thumbnails'], 'readwrite');
    for (const name of ['artworks','checkpoints','thumbnails']) {
      const store = tx.objectStore(name), req = store.index('owner').openKeyCursor(IDBKeyRange.only([scope.account, scope.student]));
      req.onsuccess = () => { const cursor = req.result; if (cursor) { store.delete(cursor.primaryKey); cursor.continue(); } };
    }
    tx.oncomplete = () => resolve(); tx.onabort = () => reject(tx.error); tx.onerror = () => {};
  });
}
export function activeAccountScope() { try { return localStorage.getItem('genius-profile-owner-v1') || 'guest'; } catch { return 'guest'; } }
