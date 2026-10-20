// Sổ Cắt Giấy trên thiết bị (plan mục 10): IndexedDB theo tài khoản + hồ sơ, kiểm revision khi lưu
// để tab cũ không ghi đè; ảnh thu nhỏ để riêng và chỉ ghi khi revision còn khớp (khuôn của Xưởng Gốm).
import type { ArtworkSummary, Op, PapercutArtwork, Scope } from '../model';

export const DATABASE = 'papercut-studio-v1';
export const MAX_ARTWORKS = 200;
let connection: Promise<IDBDatabase> | undefined;

function database(): Promise<IDBDatabase> {
  return connection ||= new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => {
      for (const name of ['artworks', 'thumbnails']) {
        const store = request.result.createObjectStore(name, { keyPath: ['account', 'student', 'id'] });
        store.createIndex('owner', ['account', 'student']);
      }
    };
    request.onsuccess = () => { const db = request.result; db.onversionchange = () => { db.close(); connection = undefined; }; resolve(db); };
    request.onerror = () => { connection = undefined; reject(request.error); };
    request.onblocked = () => { connection = undefined; reject(Error('Đóng tab Xưởng Cắt Giấy cũ rồi thử lại.')); };
  });
}
export async function closeDatabase() { const db = await connection; db?.close(); connection = undefined; }

const key = (s: Scope, id: string): IDBValidKey => [s.account, s.student, id];
const finite = (n: unknown) => typeof n === 'number' && Number.isFinite(n) && Math.abs(n) < 1e4;
const vec = (p: unknown) => !!p && finite((p as { x: unknown }).x) && finite((p as { y: unknown }).y);
const ring = (r: unknown) => Array.isArray(r) && r.length < 20000 && r.every(vec);

function validOp(o: Op): boolean {
  switch (o?.kind) {
    case 'fold': return vec(o.p) && vec(o.n) && typeof o.valley === 'boolean';
    case 'flip': return vec(o.p) && vec(o.n);
    case 'unfold': return true;
    case 'cut': return Array.isArray(o.region) && o.region.length < 2000 && o.region.every(ring) && (o.stroke === undefined || ring(o.stroke));
    default: return false;
  }
}

export function validateArtwork(a: PapercutArtwork): PapercutArtwork {
  const ok = a && typeof a.id === 'string' && typeof a.name === 'string' && a.spec && finite(a.spec.w) && finite(a.spec.h)
    && /^#[0-9a-f]{6}$/i.test(a.spec.front) && /^#[0-9a-f]{6}$/i.test(a.spec.back)
    && Array.isArray(a.ops) && a.ops.length <= 2000 && a.ops.every(validOp);
  if (!ok) throw Error('Bản lưu không hợp lệ.');
  return a;
}

export async function readArtwork(scope: Scope, id: string): Promise<PapercutArtwork | undefined> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const req = db.transaction('artworks').objectStore('artworks').get(key(scope, id));
    req.onerror = () => reject(req.error);
    req.onsuccess = () => { try { resolve(req.result ? validateArtwork(req.result) : undefined); } catch (e) { reject(e); } };
  });
}

/** Lưu với kiểm revision: `expected` là revision đang có (0 = tác phẩm mới). Trả revision mới. */
export async function saveArtwork(art: PapercutArtwork, expected: number): Promise<number> {
  validateArtwork(art);
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('artworks', 'readwrite'), store = tx.objectStore('artworks');
    let error: Error | undefined;
    const req = store.get(key(art, art.id));
    req.onsuccess = () => {
      if ((req.result?.revision ?? 0) !== expected) { error = Error('Tác phẩm đã đổi ở tab khác.'); tx.abort(); return; }
      const put = () => store.put({ ...structuredClone(art), revision: expected + 1, updatedAt: new Date().toISOString() });
      if (req.result) { put(); return; }
      const count = store.index('owner').count(IDBKeyRange.only([art.account, art.student]));
      count.onsuccess = () => { if (count.result >= MAX_ARTWORKS) { error = Error(`Sổ đã có ${MAX_ARTWORKS} tác phẩm. Hãy xoá bớt để cất bài mới.`); tx.abort(); } else put(); };
    };
    tx.oncomplete = () => resolve(expected + 1);
    tx.onabort = () => reject(error || tx.error || Error('Chưa lưu được tác phẩm.'));
    tx.onerror = () => {};
  });
}

export async function saveThumbnail(scope: Scope, id: string, revision: number, blob: Blob) {
  const db = await database();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(['artworks', 'thumbnails'], 'readwrite'), req = tx.objectStore('artworks').get(key(scope, id));
    req.onsuccess = () => { if (req.result?.revision === revision) tx.objectStore('thumbnails').put({ account: scope.account, student: scope.student, id, revision, blob }); };
    tx.oncomplete = () => resolve(); tx.onabort = () => reject(tx.error); tx.onerror = () => {};
  });
}

export async function listArtworks(scope: Scope): Promise<ArtworkSummary[]> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['artworks', 'thumbnails']), range = IDBKeyRange.only([scope.account, scope.student]);
    const arts = tx.objectStore('artworks').index('owner').getAll(range), thumbs = tx.objectStore('thumbnails').index('owner').getAll(range);
    tx.oncomplete = () => resolve(arts.result.map((a: PapercutArtwork) => ({ id: a.id, name: a.name, revision: a.revision, updatedAt: a.updatedAt, thumb: thumbs.result.find(t => t.id === a.id)?.blob })).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
    tx.onabort = () => reject(tx.error); tx.onerror = () => {};
  });
}

export async function removeArtwork(scope: Scope, id: string) {
  const db = await database();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(['artworks', 'thumbnails'], 'readwrite');
    tx.objectStore('artworks').delete(key(scope, id)); tx.objectStore('thumbnails').delete(key(scope, id));
    tx.oncomplete = () => resolve(); tx.onabort = () => reject(tx.error);
  });
}

/** Xoá mọi tác phẩm của một hồ sơ (khi xoá hồ sơ). */
export async function clearPapercutData(scope: Scope) {
  const db = await database();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(['artworks', 'thumbnails'], 'readwrite'), range = IDBKeyRange.only([scope.account, scope.student]);
    for (const name of ['artworks', 'thumbnails']) {
      const store = tx.objectStore(name), cur = store.index('owner').openKeyCursor(range);
      cur.onsuccess = () => { const c = cur.result; if (c) { store.delete(c.primaryKey); c.continue(); } };
    }
    tx.oncomplete = () => resolve(); tx.onabort = () => reject(tx.error);
  });
}
