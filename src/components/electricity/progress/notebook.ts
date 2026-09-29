import { Circuit, LIMITS, validateCircuit } from '../engine/circuit';
import type { Run } from '../engine/evidence';
export interface CircuitDocument {
    schema: 1;
    id: string;
    ownerId: string;
    revision: number;
    title: string;
    createdAt: string;
    updatedAt: string;
    circuit: Circuit;
    view: {
        mode: 'bench' | 'schematic';
        night: boolean;
    };
    source?: {
        type: 'sandbox' | 'lesson' | 'mission';
        id: string;
    };
    thumbnailKey?: string;
    run?: Run;
}
const DB = 'electricity-notebook-v1';
function openDB(): Promise<IDBDatabase> { return new Promise((resolve, reject) => { const req = indexedDB.open(DB, 1); req.onupgradeneeded = () => { for (const name of ['documents', 'drafts', 'thumbnails']) {
    const store = req.result.createObjectStore(name, { keyPath: 'id' });
    store.createIndex('ownerId', 'ownerId');
} }; req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); }); }
export function parseDocument(raw: string): CircuitDocument { if (new TextEncoder().encode(raw).length > LIMITS.bytes)
    throw new Error('Bản lưu vượt 128 KiB.'); let doc: CircuitDocument; try {
    doc = JSON.parse(raw);
}
catch {
    throw new Error('File JSON không đọc được.');
} if (doc?.schema !== 1)
    throw new Error('Bản lưu cần phiên bản mới hơn hoặc không được hỗ trợ.'); if (!doc.view || !['bench', 'schematic'].includes(doc.view.mode) || typeof doc.view.night !== 'boolean' || !Number.isFinite(Date.parse(doc.createdAt)) || !Number.isFinite(Date.parse(doc.updatedAt)))
    throw new Error('Góc nhìn hoặc ngày lưu không hợp lệ.'); const errors = validateCircuit(doc.circuit); if (errors.length)
    throw new Error(errors[0]); if (typeof doc.title !== 'string' || !doc.title.trim() || [...doc.title.trim()].length > 40 || typeof doc.id !== 'string' || typeof doc.ownerId !== 'string' || !Number.isInteger(doc.revision))
    throw new Error('Thông tin bản lưu không hợp lệ.'); return doc; }
export async function listDocuments(owner: string, store = 'documents'): Promise<CircuitDocument[]> { const db = await openDB(); return new Promise((resolve, reject) => { const tx = db.transaction(store), req = tx.objectStore(store).index('ownerId').getAll(owner); req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); tx.oncomplete = () => db.close(); }); }
export async function saveDocument(doc: CircuitDocument, draft = false): Promise<CircuitDocument> { parseDocument(JSON.stringify(doc)); const db = await openDB(), store = draft ? 'drafts' : 'documents'; return new Promise((resolve, reject) => { const tx = db.transaction(store, 'readwrite'), s = tx.objectStore(store), get = s.get(doc.id); let saved = doc; get.onsuccess = () => { const current = get.result as CircuitDocument | undefined; if (current && current.ownerId !== doc.ownerId) {
    tx.abort();
    return;
} if (current && current.revision >= doc.revision && !draft) {
    saved = { ...doc, id: crypto.randomUUID(), title: [...`${doc.title} · Bản sao từ tab khác`].slice(0, 40).join(''), revision: 1 };
} const count = s.index('ownerId').count(doc.ownerId); count.onsuccess = () => { if (!draft && (!current || saved.id !== doc.id) && count.result >= 12) {
    tx.abort();
    return;
} s.put(saved); }; }; tx.oncomplete = () => { db.close(); resolve(saved); }; tx.onerror = tx.onabort = () => { db.close(); reject(new Error('Chưa lưu được. Sổ tối đa 12 mạch; có thể tải JSON để giữ bản này.')); }; }); }
export async function deleteDocument(id: string, owner: string) { const db = await openDB(); return new Promise<void>((resolve, reject) => { const tx = db.transaction(['documents', 'thumbnails'], 'readwrite'), s = tx.objectStore('documents'), q = s.get(id); q.onsuccess = () => { if (q.result?.ownerId === owner) {
    s.delete(id);
    tx.objectStore('thumbnails').delete(id);
} }; tx.oncomplete = () => { db.close(); resolve(); }; tx.onerror = () => reject(tx.error); }); }
export async function clearElectricityData(owner: string) { const db = await openDB(); return new Promise<void>((resolve, reject) => { const tx = db.transaction(['documents', 'drafts', 'thumbnails'], 'readwrite'); for (const name of ['documents', 'drafts', 'thumbnails']) {
    const s = tx.objectStore(name), q = s.index('ownerId').openKeyCursor(IDBKeyRange.only(owner));
    q.onsuccess = () => { const cur = q.result; if (cur) {
        s.delete(cur.primaryKey);
        cur.continue();
    } };
} tx.oncomplete = () => { db.close(); resolve(); }; tx.onerror = () => reject(tx.error); }); }
export function createDocument(owner: string, circuit: Circuit, title: string, mode: 'bench' | 'schematic', night: boolean): CircuitDocument { const now = new Date().toISOString(); return { schema: 1, id: crypto.randomUUID(), ownerId: owner, revision: 1, title: [...title.trim()].slice(0, 40).join('') || 'Sáng chế của mình', createdAt: now, updatedAt: now, circuit: structuredClone(circuit), view: { mode, night } }; }
export function downloadDocument(doc: CircuitDocument) { const url = URL.createObjectURL(new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' })), a = document.createElement('a'); a.href = url; a.download = 'sang-che-mach-dien.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
export async function cacheThumbnail(doc: CircuitDocument, blob: Blob) { if (blob.size > 40 * 1024)
    return; const db = await openDB(); return new Promise<void>((resolve, reject) => { const tx = db.transaction('thumbnails', 'readwrite'); tx.objectStore('thumbnails').put({ id: doc.id, ownerId: doc.ownerId, revision: doc.revision, blob }); tx.oncomplete = () => { db.close(); resolve(); }; tx.onerror = () => { db.close(); reject(tx.error); }; }); }
