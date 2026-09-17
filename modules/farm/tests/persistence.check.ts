import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { LocalFarmGateway, LocalFarmRepository, RevisionConflict } from '../src/adapters/local';
import { createFarm } from '../src/core/engine';
import type { FarmRepository } from '../src/core/types';

describe('isolated persistence adapter', () => {
  it('handles simultaneous first openings without creating or replacing two farms', async () => {
    const name = `farm-test-${crypto.randomUUID()}`, aRepo = new LocalFarmRepository(name), bRepo = new LocalFarmRepository(name);
    const [a, b] = await Promise.all([LocalFarmGateway.open(aRepo, () => 1000), LocalFarmGateway.open(bRepo, () => 1000)]);
    expect(a.getSnapshot()).toEqual(b.getSnapshot()); await a.close(); await b.close();
  });
  it('does not expose mutable references to durable inventory through snapshots', async () => {
    const repo = new LocalFarmRepository(`farm-test-${crypto.randomUUID()}`), g = await LocalFarmGateway.open(repo, () => 1000);
    g.getSnapshot().inventory.wheat = 999;
    expect(g.getSnapshot().inventory.wheat).toBe(0); await g.close();
  });
  it('durably saves each command, advances offline time and serializes double collection', async () => {
    let now = 1000000;
    const repo = new LocalFarmRepository(`farm-test-${crypto.randomUUID()}`), g = await LocalFarmGateway.open(repo, () => now);
    const outcomes = await Promise.all([g.execute({ type: 'harvest', plotId: 'plot-1' }), g.execute({ type: 'harvest', plotId: 'plot-1' })]);
    expect(outcomes.map(r => r.ok)).toEqual([true, false]); expect((await repo.load())!.inventory.wheat).toBe(3);
    await g.execute({ type: 'plant', plotId: 'plot-1', crop: 'wheat' }); now += 50000;
    const reopened = await LocalFarmGateway.open(repo, () => now); expect(reopened.getSnapshot().clock).toBe(650000);
    expect((await reopened.execute({ type: 'harvest', plotId: 'plot-1' })).ok).toBe(true);
    await repo.close();
  });
  it('rejects a stale tab write without overwriting the winner', async () => {
    const repo = new LocalFarmRepository(`farm-test-${crypto.randomUUID()}`);
    const a = await LocalFarmGateway.open(repo, () => 1000), b = await LocalFarmGateway.open(repo, () => 1000);
    await a.execute({ type: 'harvest', plotId: 'plot-1' });
    await expect(b.execute({ type: 'harvest', plotId: 'plot-2' })).rejects.toBeInstanceOf(RevisionConflict);
    expect((await repo.load())!.plots[1].crop).toBe('wheat'); expect((await repo.load())!.inventory.wheat).toBe(3); await repo.close();
  });
  it('does not commit visible gameplay when the disk write fails', async () => {
    const old = createFarm(1000);
    const repo: FarmRepository = { load: async () => structuredClone(old), save: async () => { throw new Error('Quota exceeded'); } };
    const g = await LocalFarmGateway.open(repo, () => 1000);
    await expect(g.execute({ type: 'harvest', plotId: 'plot-1' })).rejects.toThrow('Quota exceeded'); expect(g.getSnapshot()).toEqual(old);
  });
  it('restores a validated local backup with a fresh revision, preserving local-only status', async () => {
    let now = 1000; const repo = new LocalFarmRepository(`farm-test-${crypto.randomUUID()}`), g = await LocalFarmGateway.open(repo, () => now);
    await g.execute({ type: 'harvest', plotId: 'plot-1' }); const oldRevision = g.getSnapshot().revision;
    const imported = createFarm(500); imported.coins = 222; now = 9000;
    await g.importSnapshot(imported);
    expect(g.getSnapshot()).toMatchObject({ revision: oldRevision + 1, coins: 222, clock: imported.clock, lastWallTime: now, economy: 'local-unverified' }); await repo.close();
  });
  it('never silently creates a fresh farm after a corrupt existing load', async () => {
    let saved = false;
    const repo: FarmRepository = { load: async () => { throw new Error('Corrupt save'); }, save: async () => { saved = true; } };
    await expect(LocalFarmGateway.open(repo)).rejects.toThrow('Corrupt save'); expect(saved).toBe(false);
  });
});
