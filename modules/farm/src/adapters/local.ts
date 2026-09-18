import { advanceTime, createFarm, execute } from '../core/engine';
import { validateSnapshot } from '../core/validation';
import type { CommandResult, FarmCommand, FarmRepository, FarmSession, FarmState } from '../core/types';
export class RevisionConflict extends Error {
    constructor() { super('Nông trại đã được lưu ở cửa sổ khác. Tải lại để tiếp tục từ bản mới nhất.'); }
}
export class LocalFarmRepository implements FarmRepository {
    protected db: Promise<IDBDatabase>;
    constructor(name = 'lang-mam-independent-lab-v1') {
        this.db = new Promise((resolve, reject) => {
            const request = indexedDB.open(name, 1);
            request.onupgradeneeded = () => request.result.createObjectStore('snapshots');
            request.onsuccess = () => { request.result.onversionchange = () => request.result.close(); resolve(request.result); };
            request.onerror = () => reject(request.error ?? new Error('Không mở được nơi lưu nông trại.'));
            request.onblocked = () => reject(new Error('Đóng cửa sổ Làng Mầm cũ rồi tải lại.'));
        });
    }
    async load(): Promise<FarmState | null> {
        const db = await this.db;
        const raw = await new Promise<unknown>((resolve, reject) => {
            const request = db.transaction('snapshots', 'readonly').objectStore('snapshots').get('main');
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
        return raw === undefined ? null : validateSnapshot(raw);
    }
    protected afterSave(_store: IDBObjectStore, _next: FarmState, _reason?: 'command' | 'checkpoint' | 'import') { }
    async save(next: FarmState, expectedRevision: number | null, reason?: 'command' | 'checkpoint' | 'import') {
        validateSnapshot(next);
        const db = await this.db;
        return new Promise<void>((resolve, reject) => {
            const tx = db.transaction('snapshots', 'readwrite'), store = tx.objectStore('snapshots');
            let problem: Error | null = null;
            tx.oncomplete = () => resolve();
            tx.onabort = () => reject(problem ?? tx.error ?? new Error('Chưa lưu được. Dữ liệu cũ vẫn được giữ.'));
            tx.onerror = () => { };
            const read = store.get('main');
            read.onsuccess = () => {
                const old = read.result as FarmState | undefined;
                if ((old?.revision ?? null) !== expectedRevision) {
                    problem = new RevisionConflict();
                    tx.abort();
                    return;
                }
                if (old) {
                    store.put(old, 'previous');
                    if ((old as unknown as {
                        schema: number;
                    }).schema === 1)
                        store.put(old, 'migration-original-v1');
                }
                store.put(next, 'main');
                this.afterSave(store, next, reason);
            };
        });
    }
    async close() { (await this.db).close(); }
    async exportOriginal(): Promise<string | null> {
        const db = await this.db;
        return new Promise((resolve, reject) => { const r = db.transaction('snapshots', 'readonly').objectStore('snapshots').get('migration-original-v1'); r.onsuccess = () => resolve(r.result ? JSON.stringify({ format: 'lang-mam-lab-backup', state: r.result }, null, 2) : null); r.onerror = () => reject(r.error); });
    }
}
/** Serial commands + IDB compare-and-swap: no lost update between tabs or async UI actions. */
export class LocalFarmGateway implements FarmSession {
    readonly mode = 'local' as const;
    private queue: Promise<unknown> = Promise.resolve();
    private constructor(private state: FarmState, private repository: FarmRepository, private now: () => number) { }
    static async open(repository: FarmRepository, now = Date.now) {
        let state = await repository.load();
        if (!state) {
            state = createFarm(now());
            try {
                await repository.save(state, null);
            }
            catch (e) {
                if (!(e instanceof RevisionConflict))
                    throw e;
                state = await repository.load();
                if (!state)
                    throw e;
            }
        }
        return new LocalFarmGateway(state, repository, now);
    }
    getSnapshot() { return advanceTime(structuredClone(this.state), this.now()); }
    reload() { return this.run(async () => { const state = await this.repository.load(); if (!state) throw new Error('Không tìm thấy bản lưu.'); this.state = state; }); }
    async exportOriginal() { return this.repository instanceof LocalFarmRepository ? this.repository.exportOriginal() : null; }
    async close() { await this.queue; await this.repository.close?.(); }
    private run<T>(job: () => Promise<T>): Promise<T> {
        const next = this.queue.then(job);
        this.queue = next.catch(() => undefined);
        return next;
    }
    execute(command: FarmCommand): Promise<CommandResult> {
        return this.run(async () => {
            const result = execute(this.getSnapshot(), command);
            if (result.ok) {
                await this.repository.save(result.state, this.state.revision, 'command');
                this.state = result.state;
            }
            return result;
        });
    }
    checkpoint(): Promise<void> {
        return this.run(async () => {
            const next = this.getSnapshot();
            if (next.lastWallTime === this.state.lastWallTime)
                return;
            next.revision = this.state.revision + 1;
            await this.repository.save(next, this.state.revision, 'checkpoint');
            this.state = next;
        });
    }
    importSnapshot(imported: FarmState): Promise<void> {
        return this.run(async () => {
            const next = validateSnapshot(imported);
            // An import restores the saved game time, not a second offline reward interval.
            next.lastWallTime = this.now();
            next.revision = this.state.revision + 1;
            await this.repository.save(next, this.state.revision, 'import');
            this.state = next;
        });
    }
}
export async function openLocalFarm(databaseName?: string): Promise<FarmSession> {
    const repository = new LocalFarmRepository(databaseName);
    try {
        return await LocalFarmGateway.open(repository);
    }
    catch (e) {
        await repository.close();
        throw e;
    }
}
