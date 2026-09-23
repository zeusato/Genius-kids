import type { Level } from '../data/english/schema';

export interface LibraryEntry {
  studentId: string;
  id: string;
  level: Level;
  page?: string;
  version?: string;
  saved?: boolean;
  status?: 'learning' | 'remembered';
}
// Reading and self-reported word familiarity never change exam mastery or rewards.
async function transaction<T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore, done: (value: T) => void) => void): Promise<T> {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('genius-english-library-v1', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('entries', { keyPath: ['studentId', 'id'] }).createIndex('owner', 'studentId');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Đóng trang sách cũ rồi thử lại.'));
  });
  return new Promise((resolve, reject) => {
    const tx = db.transaction('entries', mode);
    let value: T;
    tx.oncomplete = () => { db.close(); resolve(value); };
    tx.onabort = tx.onerror = () => { db.close(); reject(tx.error || new Error('Chưa lưu được sổ học.')); };
    operation(tx.objectStore('entries'), result => { value = result; });
  });
}
export const listLibrary = (owner: string) => transaction<LibraryEntry[]>('readonly', (store, done) => {
  const request = store.index('owner').getAll(owner);
  request.onsuccess = () => done(request.result);
});
export const saveLibraryEntry = (entry: LibraryEntry) => transaction<void>('readwrite', (store, done) => { store.put(entry); done(undefined); });
export const clearLibrary = (owner: string) => transaction<void>('readwrite', (store, done) => {
  const request = store.index('owner').openCursor(IDBKeyRange.only(owner));
  request.onsuccess = () => { if (request.result) { request.result.delete(); request.result.continue(); } else done(undefined); };
});
