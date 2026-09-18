import { LocalFarmGateway, LocalFarmRepository, RevisionConflict } from '../adapters/local';
import type { FarmCommand, FarmSession, FarmState } from '../core/types';
import { CloudCache } from './repository';
import { CloudConflict, type CloudSave, type CloudTransport, type SyncStatus } from './types';

/** Local writes never wait for the network. Cloud revisions are independent of local checkpoints. */
export class CloudFarmSession implements FarmSession {
    readonly mode = 'online' as const;
    status: SyncStatus = { phase: 'checking' };
    private closed = false;
    private queue: Promise<unknown> = Promise.resolve();
    private flight?: Promise<void>;
    private timer?: ReturnType<typeof setTimeout>;
    private due = 0;
    private failures = 0;
    constructor(readonly cache: CloudCache, private local: LocalFarmGateway, private remote: CloudTransport,
        private changed: (status: SyncStatus) => void = () => {}, private automatic = true) { }
    getSnapshot() { return this.local.getSnapshot(); }
    exportOriginal() { return this.local.exportOriginal(); }
    recovery() { return this.cache.recovery(); }
    private run<T>(job: () => Promise<T>) {
        const next = this.queue.then(() => { if (this.closed) throw new Error('Nông trại đã đóng.'); return job(); });
        this.queue = next.catch(() => undefined); return next;
    }
    private emit(status: SyncStatus) { if (!this.closed) { this.status = status; this.changed(status); } }
    private schedule(delay = 3000) {
        if (!this.automatic || this.closed) return;
        if (this.failures) delay = Math.max(delay, Math.min(180000, 30000 * 2 ** Math.min(this.failures, 3)));
        const due = Date.now() + delay;
        // Continuous harvesting must not keep postponing a queued upload forever.
        if (this.timer && this.due <= due) return;
        clearTimeout(this.timer); this.due = due;
        this.timer = setTimeout(() => { this.timer = undefined; void this.sync(); }, delay);
    }
    start() { void this.sync(); }
    execute(command: FarmCommand) { return this.run(async () => {
        const result = await this.local.execute(command);
        if (result.ok) { if (this.status.phase === 'saved') this.emit({ phase: 'pending' }); this.schedule(); }
        return result;
    }); }
    checkpoint() { return this.run(() => this.local.checkpoint()); }
    importSnapshot(state: FarmState) { return this.run(async () => {
        await this.local.importSnapshot(state);
        if (this.status.phase === 'saved') this.emit({ phase: 'pending' }); this.schedule();
    }); }
    sync(): Promise<void> {
        if (this.closed) return Promise.resolve();
        if (this.flight) return this.flight;
        this.flight = this.performSync().catch(e => {
            this.failures++;
            this.emit({ phase: typeof navigator !== 'undefined' && navigator.onLine === false ? 'offline' : 'error', message: e instanceof Error ? e.message : 'Chưa đồng bộ được. Bản trên máy vẫn được giữ.' });
        }).finally(() => {
            this.flight = undefined;
            this.schedule(Math.min(180000, 30000 * Math.max(1, 2 ** Math.min(this.failures, 3))));
        });
        return this.flight;
    }
    private async performSync() {
        if (this.status.phase === 'conflict') return;
        const meta = await this.cache.metadata();
        if (this.closed) return;
        if (!meta.linked) {
            const remote = await this.remote.read();
            this.emit({ phase: 'unlinked', remote }); this.failures = 0; return;
        }
        const pending = await this.cache.prepare();
        if (pending) {
            this.emit({ phase: 'pending' });
            try {
                const result = await this.remote.write(pending);
                if (this.closed) return;
                await this.cache.acknowledge(pending, result);
            } catch (e) {
                if (!(e instanceof CloudConflict)) throw e;
                const remote = await this.remote.read();
                this.emit({ phase: 'conflict', remote }); return;
            }
        } else {
            const remote = await this.remote.read();
            if (this.closed) return;
            await this.run(async () => {
                const latest = await this.cache.metadata();
                if (remote?.revision === latest.revision) return;
                if (!remote || latest.dirty) { this.emit({ phase: 'conflict', remote }); return; }
                // A command in another tab also makes adoption fail rather than overwrite it.
                try { await this.cache.adopt(remote, this.local.getSnapshot().revision); await this.local.reload(); }
                catch (e) { if (!(e instanceof RevisionConflict)) throw e; this.emit({ phase: 'conflict', remote }); }
            });
        }
        if (this.closed || (this.status as SyncStatus).phase === 'conflict') return;
        const latest = await this.cache.metadata();
        this.failures = 0;
        this.emit({ phase: latest.dirty ? 'pending' : 'saved', syncedAt: latest.syncedAt });
    }
    /** Explicit choices are the only way to replace diverged saves. Server CAS still applies. */
    async choose(source: 'local' | 'cloud') {
        await this.flight;
        if (!['unlinked', 'conflict'].includes(this.status.phase)) throw new Error('Hãy kiểm tra bản online trước khi chọn.');
        const selected = this.status.remote;
        if (selected === undefined || (source === 'cloud' && !selected)) throw new Error('Chưa có bản online để khôi phục.');
        await this.run(async () => {
            if (source === 'cloud' && selected) {
                await this.cache.adopt(selected, this.local.getSnapshot().revision); await this.local.reload();
            } else await this.cache.chooseLocal(selected ?? null);
            this.emit({ phase: 'pending' });
        });
        await this.sync();
    }
    async close() {
        // Stop new network writes immediately; durable outbox remains for the next sign-in.
        clearTimeout(this.timer);
        await this.queue; this.closed = true;
        await this.flight; await this.local.close();
    }
}

export async function openAccountFarm(owner: string, transport: CloudTransport, changed: (status: SyncStatus) => void, guestDatabaseName?: string) {
    const cache = new CloudCache(owner);
    try {
        if (!await cache.load()) {
            const guest = new LocalFarmRepository(guestDatabaseName);
            try {
                const seed = await guest.load();
                if (seed) try { await cache.save(seed, null); } catch (e) { if (!(e instanceof RevisionConflict)) throw e; }
            } finally { await guest.close(); }
        }
        const local = await LocalFarmGateway.open(cache);
        return new CloudFarmSession(cache, local, transport, changed);
    } catch (e) { await cache.close(); throw e; }
}
