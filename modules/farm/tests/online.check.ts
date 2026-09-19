import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { LocalFarmGateway, RevisionConflict } from '../src/adapters/local';
import { createFarm } from '../src/core/engine';
import { CloudCache } from '../src/online/repository';
import { CloudFarmSession } from '../src/online/session';
import { CloudConflict, type CloudSave, type CloudTransport, type PendingUpload } from '../src/online/types';

class Server implements CloudTransport {
    value: CloudSave | null = null;
    receipts = new Map<string, CloudSave>();
    calls: PendingUpload[] = [];
    failAfterCommit = false;
    offline = false;
    async read() { if (this.offline) throw new Error('offline'); return structuredClone(this.value); }
    async write(p: PendingUpload) {
        this.calls.push(structuredClone(p));
        if (this.offline) throw new Error('offline');
        const old = this.receipts.get(p.requestId); if (old) return structuredClone(old);
        if ((this.value?.revision ?? null) !== p.expectedRevision) throw new CloudConflict();
        this.value = { owner_id: 'a', state: structuredClone(p.state), revision: (this.value?.revision ?? 0) + 1, updated_at: new Date(1000).toISOString() };
        this.receipts.set(p.requestId, structuredClone(this.value));
        if (this.failAfterCommit) { this.failAfterCommit = false; throw new Error('response lost'); }
        return structuredClone(this.value);
    }
}
async function device(server = new Server(), name = crypto.randomUUID(), owner = 'a', now = () => 1000) {
    const cache = new CloudCache(owner, name), local = await LocalFarmGateway.open(cache, now);
    return { cache, local, server, name, session: new CloudFarmSession(cache, local, server, () => {}, false) };
}
async function link(d: Awaited<ReturnType<typeof device>>) { await d.session.sync(); await d.session.choose('local'); }

describe('account cloud storage and durable outbox', () => {
    it('requires cloud-first review again after sign-in, even for a linked dirty cache', async () => {
        const d = await device(); await link(d);
        await d.session.execute({ type: 'harvest', plotId: 'plot-1' }); await d.session.close();
        const cache = new CloudCache('a', d.name), local = await LocalFarmGateway.open(cache, () => 1000);
        const session = new CloudFarmSession(cache, local, d.server, () => {}, false, true);
        await session.sync(); await session.sync();
        expect(session.status.phase).toBe('unlinked'); expect(session.status.remote?.state.inventory.wheat).toBe(0);
        expect(d.server.calls).toHaveLength(1); expect(session.getSnapshot().inventory.wheat).toBe(3);
        await session.choose('cloud');
        expect(session.getSnapshot().inventory.wheat).toBe(0); expect((await session.recovery())?.inventory.wheat).toBe(3);
        expect(d.server.calls).toHaveLength(1); await session.close();
    });
    it('never uploads a guest copy before explicit linking', async () => {
        const d = await device(); await d.session.sync();
        expect(d.session.status.phase).toBe('unlinked'); expect(d.server.calls).toHaveLength(0);
        await d.session.execute({ type: 'harvest', plotId: 'plot-1' }); await d.session.sync();
        expect(d.server.calls).toHaveLength(0); await d.session.choose('local');
        expect(d.server.value!.state.inventory.wheat).toBe(3); await d.session.close();
    });
    it('checkpoints advance local time without creating false cloud conflicts', async () => {
        let now = 1000; const d = await device(undefined, undefined, 'a', () => now); await link(d);
        now += 45000; await d.session.checkpoint(); await d.session.sync();
        expect(d.server.calls).toHaveLength(1); expect((await d.cache.metadata()).dirty).toBe(false);
        expect(d.session.getSnapshot().lastWallTime).toBe(now); await d.session.close();
    });
    it('retries an acknowledged-but-lost response using the same durable request after restart', async () => {
        const d = await device(); d.server.failAfterCommit = true; await link(d);
        expect(d.session.status.phase).toBe('error'); const pending = await d.cache.prepare();
        await d.session.close(); const reopened = await device(d.server, d.name); await reopened.session.sync();
        expect(d.server.calls[1].requestId).toBe(pending!.requestId); expect(d.server.value!.revision).toBe(1);
        expect(reopened.session.status.phase).toBe('saved'); await reopened.session.close();
    });
    it('keeps a new local command dirty when an older in-flight upload is acknowledged', async () => {
        const d = await device(); await link(d);
        await d.session.execute({ type: 'harvest', plotId: 'plot-1' }); const p = (await d.cache.prepare())!;
        await d.session.execute({ type: 'harvest', plotId: 'plot-2' }); await d.cache.acknowledge(p, await d.server.write(p));
        expect((await d.cache.metadata()).dirty).toBe(true); await d.session.sync();
        expect(d.server.value!.state.inventory.wheat).toBe(6); expect(d.server.value!.revision).toBe(3); await d.session.close();
    });
    it('keeps all offline commands locally and uploads after reconnect', async () => {
        const d = await device(); await link(d); d.server.offline = true;
        await d.session.execute({ type: 'harvest', plotId: 'plot-1' }); await d.session.sync();
        expect((await d.cache.load())!.inventory.wheat).toBe(3); expect(d.session.status.phase).toBe('error');
        d.server.offline = false; await d.session.sync(); expect(d.server.value!.state.inventory.wheat).toBe(3); await d.session.close();
    });
    it('detects two-device divergence without overwriting either farm and preserves a recovery copy', async () => {
        const a = await device(); await link(a); const b = await device(a.server); await b.session.sync(); await b.session.choose('cloud');
        await a.session.execute({ type: 'harvest', plotId: 'plot-1' }); await a.session.sync();
        await b.session.execute({ type: 'harvest', plotId: 'plot-2' }); await b.session.sync();
        expect(b.session.status.phase).toBe('conflict'); expect(a.server.value!.state.plots[1].crop).toBe('wheat');
        await b.session.choose('cloud'); expect(b.session.getSnapshot().plots[1].crop).toBe('wheat');
        expect((await b.session.recovery())!.plots[1].crop).toBeUndefined(); await a.session.close(); await b.session.close();
    });
    it('local conflict choice still uses CAS if remote changes again before confirmation', async () => {
        const a = await device(); await link(a); const b = await device(a.server); await b.session.sync();
        await a.session.execute({ type: 'harvest', plotId: 'plot-1' }); await a.session.sync();
        await b.session.choose('local'); expect(b.session.status.phase).toBe('conflict');
        expect(a.server.value!.revision).toBe(2); await a.session.close(); await b.session.close();
    });
    it('refreshes an unchanged second device from cloud without inventing extra coins', async () => {
        const a = await device(); await link(a); const b = await device(a.server); await b.session.sync(); await b.session.choose('cloud');
        await a.session.execute({ type: 'harvest', plotId: 'plot-1' }); await a.session.sync(); await b.session.sync();
        expect(b.session.getSnapshot().inventory).toEqual(a.session.getSnapshot().inventory);
        expect(b.session.status.phase).toBe('saved'); await a.session.close(); await b.session.close();
    });
    it('isolates account databases and rejects a mismatched cloud owner', async () => {
        const a = await device(), b = await device(undefined, undefined, 'b'); await link(a);
        await a.session.execute({ type: 'harvest', plotId: 'plot-1' });
        expect(b.session.getSnapshot().inventory.wheat).toBe(0);
        await expect(b.cache.adopt(a.server.value!, b.session.getSnapshot().revision)).rejects.toThrow('tài khoản khác');
        await a.session.close(); await b.session.close();
    });
    it('cannot adopt over a command committed by another local tab', async () => {
        const a = await device(); await link(a); const tab = await device(a.server, a.name);
        await tab.session.execute({ type: 'harvest', plotId: 'plot-1' });
        await expect(a.cache.adopt(a.server.value!, a.session.getSnapshot().revision)).rejects.toBeInstanceOf(RevisionConflict);
        expect((await a.cache.load())!.inventory.wheat).toBe(3); await a.session.close(); await tab.session.close();
    });
    it('backs up the displaced remote farm when explicitly choosing local', async () => {
        const d = await device(); await link(d); const b = await device(d.server);
        await b.session.execute({ type: 'harvest', plotId: 'plot-1' }); await b.session.sync(); await b.session.choose('local');
        expect((await b.session.recovery())!.inventory.wheat).toBe(0); expect(d.server.value!.state.inventory.wheat).toBe(3);
        await d.session.close(); await b.session.close();
    });
    it('rejects corrupted remote snapshots while preserving local progress', async () => {
        const d = await device(); const bad = createFarm(1000); bad.coins = -5;
        await expect(d.cache.adopt({owner_id:'a',revision:1,state:bad,updated_at:new Date().toISOString()},d.session.getSnapshot().revision)).rejects.toThrow();
        expect(d.session.getSnapshot().coins).toBeGreaterThanOrEqual(0); await d.session.close();
    });
});
