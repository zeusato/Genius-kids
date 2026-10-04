import type { ProfileSnapshot } from './snapshot';
export interface PendingUpload { id: string; revision: number; snapshot: ProfileSnapshot; hash: string }
export interface AccountCache { owner: string; snapshot: ProfileSnapshot; revision: number; syncedHash?: string; pending?: PendingUpload; backup?: ProfileSnapshot }
export async function vault<T>(fn: (store: IDBObjectStore, done: (value: T) => void) => void, mode: IDBTransactionMode = 'readonly'): Promise<T> {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const r = indexedDB.open('genius-profile-cloud-v1', 1);
        r.onupgradeneeded = () => r.result.createObjectStore('accounts', { keyPath: 'owner' });
        r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error);
    });
    return new Promise((resolve, reject) => {
        const tx = db.transaction('accounts', mode); let value: T;
        tx.oncomplete = () => { db.close(); resolve(value); }; tx.onabort = tx.onerror = () => { db.close(); reject(tx.error); };
        fn(tx.objectStore('accounts'), v => { value = v; });
    });
}
export const readCache = (owner: string) => vault<AccountCache | undefined>((s, done) => { const r = s.get(owner); r.onsuccess = () => done(r.result); });
export const writeCache = (cache: AccountCache) => vault<void>(s => { s.put(cache); }, 'readwrite');
