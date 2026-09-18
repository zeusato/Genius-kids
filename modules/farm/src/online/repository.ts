import { LocalFarmRepository, RevisionConflict } from '../adapters/local';
import { validateSnapshot } from '../core/validation';
import type { FarmState } from '../core/types';
import type { CloudSave, PendingUpload, SyncMeta } from './types';

/** Account-scoped cache. The farm and durable outbox are committed in one IDB transaction. */
export class CloudCache extends LocalFarmRepository {
    constructor(readonly ownerId: string, name = `lang-mam-account-v1-${ownerId}`) { super(name); }
    private initial(): SyncMeta { return { ownerId: this.ownerId, linked: false, revision: null, change: 0, dirty: true }; }
    protected afterSave(store: IDBObjectStore, _next: FarmState, reason?: 'command' | 'checkpoint' | 'import') {
        const request = store.get('cloud-meta');
        request.onsuccess = () => {
            const meta = (request.result ?? this.initial()) as SyncMeta;
            if (meta.ownerId !== this.ownerId) { store.transaction.abort(); return; }
            if (reason !== 'checkpoint') { meta.change++; meta.dirty = true; }
            store.put(meta, 'cloud-meta');
        };
    }
    private async transaction<T>(work: (store: IDBObjectStore, finish: (value: T) => void, fail: (error: Error) => void) => void): Promise<T> {
        const db = await this.db;
        return new Promise((resolve, reject) => {
            const tx = db.transaction('snapshots', 'readwrite'); let result: T, error: Error | undefined;
            tx.oncomplete = () => resolve(result); tx.onerror = () => {}; tx.onabort = () => reject(error ?? tx.error ?? new Error('Không lưu được trạng thái đồng bộ.'));
            work(tx.objectStore('snapshots'), value => { result = value; }, e => { error = e; tx.abort(); });
        });
    }
    async metadata(): Promise<SyncMeta> {
        return this.transaction((store, finish, fail) => { const r = store.get('cloud-meta'); r.onsuccess = () => { const m = r.result ?? this.initial(); if (m.ownerId !== this.ownerId) { fail(new Error('Bản lưu thuộc tài khoản khác.')); return; } finish(m); }; });
    }
    async prepare(): Promise<PendingUpload | null> {
        return this.transaction((store, finish, fail) => {
            const r = store.get('cloud-meta'); r.onsuccess = () => {
                const m: SyncMeta = r.result ?? this.initial();
                if (m.ownerId !== this.ownerId) { fail(new Error('Sai tài khoản đồng bộ.')); return; }
                if (!m.linked || !m.dirty) { finish(null); return; }
                if (m.pending) { finish(m.pending); return; }
                const state = store.get('main'); state.onsuccess = () => {
                    if (!state.result) { fail(new Error('Không tìm thấy nông trại để đồng bộ.')); return; }
                    m.pending = { requestId: crypto.randomUUID(), expectedRevision: m.revision, change: m.change, state: state.result };
                    store.put(m, 'cloud-meta'); finish(m.pending);
                };
            };
        });
    }
    async acknowledge(pending: PendingUpload, remote: CloudSave) {
        return this.transaction<void>((store, finish, fail) => {
            const r = store.get('cloud-meta'); r.onsuccess = () => {
                const m: SyncMeta = r.result;
                if (remote.owner_id !== this.ownerId || m.ownerId !== this.ownerId) { fail(new Error('Sai tài khoản đồng bộ.')); return; }
                if (m.pending?.requestId === pending.requestId) {
                    m.revision = remote.revision; m.syncedAt = remote.updated_at; m.dirty = m.change !== pending.change; delete m.pending; store.put(m, 'cloud-meta');
                }
                finish();
            };
        });
    }
    /** Only called after an explicit local/cloud choice, or a clean-cache remote refresh. */
    async adopt(remote: CloudSave, expectedLocalRevision: number) {
        if (remote.owner_id !== this.ownerId) throw new Error('Bản online thuộc tài khoản khác.');
        const next = structuredClone(validateSnapshot(remote.state));
        return this.transaction<void>((store, finish, fail) => {
            const r = store.get('main'); r.onsuccess = () => {
                if (r.result?.revision !== expectedLocalRevision) { fail(new RevisionConflict()); return; }
                store.put(r.result, 'before-cloud-replace');
                next.revision = expectedLocalRevision + 1;
                store.put(next, 'main'); store.put({ ownerId: this.ownerId, linked: true, revision: remote.revision, change: 0, dirty: false, syncedAt: remote.updated_at } satisfies SyncMeta, 'cloud-meta'); finish();
            };
        });
    }
    async chooseLocal(remote: CloudSave | null) {
        if (remote && remote.owner_id !== this.ownerId) throw new Error('Sai tài khoản đồng bộ.');
        return this.transaction<void>((store, finish, fail) => {
            const r = store.get('cloud-meta'); r.onsuccess = () => {
                const m: SyncMeta = r.result ?? this.initial();
                if (m.ownerId !== this.ownerId) { fail(new Error('Sai tài khoản đồng bộ.')); return; }
                if (remote) store.put(remote.state, 'before-cloud-replace');
                m.linked = true; m.revision = remote?.revision ?? null; m.dirty = true; m.change++; delete m.pending;
                store.put(m, 'cloud-meta'); finish();
            };
        });
    }
    async recovery(): Promise<FarmState | null> {
        return this.transaction((store, finish, fail) => {
            const r = store.get('before-cloud-replace');
            r.onsuccess = () => {
                try { finish(r.result ? validateSnapshot(r.result) : null); }
                catch (e) { fail(e instanceof Error ? e : new Error('Bản phục hồi không hợp lệ.')); }
            };
        });
    }
}
