import { ACTIVE_OWNER, captureSnapshot, restoreSnapshot, emptySnapshot, fingerprint, type ProfileSnapshot } from './snapshot';
import { readCache, writeCache, type AccountCache } from './vault';
import { CloudConflict, type CloudSave, type CloudTransport } from './cloud';

const SWITCH = 'genius-profile-switch-v1';
export const GUEST = 'guest';
export type SyncState = 'local' | 'saved' | 'saving' | 'pending' | 'offline' | 'conflict';
/** The provider serializes all calls and unmounts gameplay before activate/resolve/import. */
export class ProfileCoordinator {
    owner = GUEST;
    state: SyncState = 'local';
    updatedAt?: string;
    constructor(private transport: CloudTransport) {}

    async recover() {
        const interrupted = localStorage.getItem(SWITCH);
        if (interrupted) {
            const cache = await readCache(interrupted);
            if (!cache) throw Error('Không tìm thấy bản khôi phục hồ sơ trên máy.');
            await restoreSnapshot(cache.snapshot);
            localStorage.setItem(ACTIVE_OWNER, interrupted);
            localStorage.removeItem(SWITCH);
        }
    }
    async checkpoint(): Promise<AccountCache> {
        const owner = localStorage.getItem(ACTIVE_OWNER) || GUEST;
        const cache = { ...(await readCache(owner)), owner, snapshot: await captureSnapshot() } as AccountCache;
        cache.revision ??= 0;
        await writeCache(cache);
        return cache;
    }
    private async apply(cache: AccountCache) {
        const previous = await this.checkpoint();
        // Journal survives a closed tab or a quota failure halfway through restoring IDB stores.
        localStorage.setItem(SWITCH, previous.owner);
        try {
            await restoreSnapshot(cache.snapshot);
            await writeCache(cache);
            localStorage.setItem(ACTIVE_OWNER, cache.owner);
            localStorage.removeItem(SWITCH);
            this.owner = cache.owner;
        } catch (error) {
            await restoreSnapshot(previous.snapshot);
            await writeCache(previous);
            localStorage.setItem(ACTIVE_OWNER, previous.owner);
            localStorage.removeItem(SWITCH);
            throw error;
        }
    }
    private async fromRemote(owner: string, remote: CloudSave | null, backup?: ProfileSnapshot): Promise<AccountCache> {
        const snapshot = remote?.snapshot || emptySnapshot();
        return { owner, snapshot, revision: remote?.revision || 0, syncedHash: await fingerprint(snapshot), backup };
    }
    async activate(owner: string) {
        await this.recover();
        if (owner === GUEST && (localStorage.getItem(ACTIVE_OWNER) || GUEST) === GUEST) {
            this.owner = GUEST; this.state = 'local'; this.updatedAt = undefined;
            localStorage.setItem(ACTIVE_OWNER, GUEST);
            return;
        }
        await this.checkpoint();
        let cache = await readCache(owner);
        this.state = owner === GUEST ? 'local' : 'saved';
        if (owner !== GUEST) {
            try {
                const remote = await this.transport.read(owner);
                this.updatedAt = remote?.updatedAt;
                if (cache?.pending && remote?.requestId === cache.pending.id) {
                    cache = { ...cache, revision: remote.revision, syncedHash: cache.pending.hash, pending: undefined };
                }
                const clean = cache && !cache.pending && await fingerprint(cache.snapshot) === cache.syncedHash;
                if (!cache || clean) {
                    const changed = cache && cache.syncedHash !== await fingerprint(remote?.snapshot || emptySnapshot());
                    cache = await this.fromRemote(owner, remote, changed ? cache.snapshot : cache?.backup);
                }
                else this.state = (remote?.revision || 0) !== cache.revision ? 'conflict' : 'pending';
            } catch (error) {
                if (!cache) throw Error('Chưa tải được hồ sơ tài khoản. Kết nối mạng rồi thử lại, hoặc dùng hồ sơ khách.');
                this.state = 'offline';
            }
        }
        cache ??= { owner, snapshot: emptySnapshot(), revision: 0 };
        await this.apply(cache);
        if (this.state === 'pending') await this.sync().catch(() => { /* Local data remains usable while offline. */ });
    }
    async sync() {
        let cache: AccountCache;
        try { cache = await this.checkpoint(); }
        catch (error) { this.state = 'offline'; throw error; }
        if (this.owner === GUEST) { this.state = 'local'; return; }
        if (cache.owner !== this.owner) throw Error('Hồ sơ đang được đổi ở tab khác.');
        if (this.state === 'conflict') return;
        this.state = 'saving';
        try {
            // Retry the exact same request after a lost response before preparing a newer snapshot.
            if (cache.pending) await this.send(cache);
            const hash = await fingerprint(cache.snapshot);
            if (hash !== cache.syncedHash) {
                cache.pending = { id: crypto.randomUUID(), revision: cache.revision, snapshot: cache.snapshot, hash };
                await writeCache(cache);
                await this.send(cache);
            } else {
                const remote = await this.transport.head(this.owner);
                if ((remote?.revision || 0) !== cache.revision) { this.state = 'conflict'; return; }
            }
            this.state = 'saved';
        } catch (error) {
            this.state = error instanceof CloudConflict ? 'conflict' : 'offline';
            if (this.state === 'offline') throw error;
        }
    }
    private async send(cache: AccountCache) {
        const pending = cache.pending!;
        const result = await this.transport.write(this.owner, pending);
        cache.revision = result.revision; cache.syncedHash = pending.hash; cache.pending = undefined;
        this.updatedAt = result.updatedAt;
        await writeCache(cache);
    }
    async resolve(source: 'local' | 'cloud') {
        const cache = await this.checkpoint();
        const remote = await this.transport.read(this.owner);
        if (source === 'cloud') {
            await this.apply(await this.fromRemote(this.owner, remote, cache.snapshot));
        } else {
            await writeCache({ ...cache, revision: remote?.revision || 0, pending: undefined, syncedHash: undefined, backup: remote?.snapshot });
        }
        this.state = 'saved';
        await this.sync().catch(() => { /* Offline after a successful local replacement is recoverable. */ });
    }
    async importGuest() {
        const cache = await this.checkpoint(), guest = await readCache(GUEST);
        if (this.owner === GUEST || cache.snapshot.profiles.length || !guest?.snapshot.profiles.length) throw Error('Chỉ nhập hồ sơ máy khi tài khoản chưa có hồ sơ.');
        await this.apply({ ...cache, snapshot: guest.snapshot, backup: cache.snapshot });
        this.state = 'saved';
        await this.sync().catch(() => { /* Imported profiles are durable on this device; retry later. */ });
    }
}
