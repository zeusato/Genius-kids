import { describe, it, expect } from 'vitest';
import { createFarm, execute, advanceTime, placementError, dimensions } from '../src/core/engine';
import { createFarm as oldFarm } from '../src/core/legacy/engine';
import { validateSnapshot, parseBackup, serializeBackup, migrateLegacy } from '../src/core/validation';
import { generateWorld, worldErrors, FAMILIES } from '../src/core/world';
import { ASSETS, ITEMS, RECIPES, type AssetId } from '../src/core/catalog';
import { HOME_LEVELS, homeLevel, upgradeRequirements, upgradeMs, upgradePrice, storageCap, CHAPTER_PRODUCTS } from '../src/core/progression';
import { previewStroke } from '../src/core/interaction';
import type { FarmCommand, FarmState, Entity } from '../src/core/types';
const now = 1800000000000;
function command(s: FarmState, c: FarmCommand) { const r = execute(s, c); expect(r.ok, r.message).toBe(true); validateSnapshot(r.state); return r.state; }
function rich(level = 3) { const s = createFarm(now, 42); s.entities.forEach(e => e.level = level); s.coins = 100000; for (const id of Object.keys(s.inventory))
    s.inventory[id as keyof typeof ITEMS] = 20; s.legacyStorageCap = 10000; return s; }
function building(s: FarmState, asset: AssetId, level = 1): Entity { for (let z = 0; z < 24; z++)
    for (let x = 0; x < 24; x++) {
        const [w, d] = dimensions(asset, 0);
        if (!placementError(s, x, z, w, d)) {
            const e: Entity = { id: `entity-${s.nextId++}`, asset, x, z, rotation: 0, level, queue: [], output: {} };
            s.entities.push(e);
            return e;
        }
    } throw new Error('No space'); }
describe('revamp state and migrations', () => {
    it('creates and round trips a valid world without granting server economy', () => { const s = createFarm(now, 123); expect(validateSnapshot(s)).toEqual(s); expect(parseBackup(serializeBackup(s))).toEqual(s); expect(s.entities.map(e => e.asset)).toEqual(['home', 'warehouse']); });
    it('migrates every old asset, crop, balance and pending job without granting duplicate rewards', () => { const old = oldFarm(now); old.entities[0].level = 3; old.entities[0].job = { recipe: 'flour', startedAt: old.clock - 10000, readyAt: old.clock + 20000 }; old.claimed = ['first-harvest']; old.inventory.bread = 3; const s = validateSnapshot(old); expect(s.coins).toBe(old.coins); expect(s.plots).toEqual(old.plots); expect(s.inventory.bread).toBe(3); expect(homeLevel(s)).toBe(3); expect(s.claimed).toEqual(old.claimed); expect(s.entities.find(e => e.id === 'mill')?.job?.readyAt).toBe(old.entities[0].job.readyAt); expect(old.schema).toBe(1); expect(validateSnapshot(s)).toEqual(s); });
    it('rejects future and malformed economic fields without resetting', () => { const s = createFarm(now, 4); for (const bad of [{ ...s, schema: 3 }, { ...s, coins: -1 }, { ...s, speedups: { 5: 999 } }, { ...s, market: { epoch: 1, bought: {} } }, { ...s, receipts: [{ id: 'x', payload: 1 }] }])
        expect(() => validateSnapshot(bad)).toThrow(); });
    it('rejects impossible queues, duplicated job IDs and bad terrain', () => { const s = rich(), e = building(s, 'mill'); const active = command(s, { type: 'produce', entityId: e.id, recipe: 'flour' }); const copy = structuredClone(active); copy.entities.find(x => x.id === e.id)!.queue.push({ ...copy.entities.find(x => x.id === e.id)!.job! }); expect(() => validateSnapshot(copy)).toThrow(); const world = structuredClone(active); world.world.water[0] = 1; expect(() => validateSnapshot(world)).toThrow(); });
});
describe('transactional tools and deadlines', () => {
    it('previews a stroke once per cell and charges exactly the affordable set', () => { let s = createFarm(now, 1); s = command(s, { type: 'harvest', plotId: 'plot-1' }); s.coins = 5; const p = previewStroke(s, 'plant', 'wheat', ['plot-1', 'plot-1', 'plot-7', 'plot-8']); expect(p.accepted).toEqual(['plot-1']); expect(p.skipped).toHaveLength(2); const n = command(s, { type: 'batch', action: 'plant', crop: 'wheat', plotIds: p.accepted, expectedRevision: s.revision }); expect(n.coins).toBe(2); });
    it('rolls back an entire bad batch and rejects changed revisions', () => { const s = createFarm(now, 1); for (const c of [{ type: 'batch', action: 'harvest', crop: 'wheat', plotIds: ['plot-1', 'plot-7'], expectedRevision: s.revision }, { type: 'batch', action: 'harvest', crop: 'wheat', plotIds: ['plot-1'], expectedRevision: 9 }] as FarmCommand[]) {
        const r = execute(s, c);
        expect(r.ok).toBe(false);
        expect(r.state).toBe(s);
    } });
    it('keeps receipts across reload; same key different payload fails', () => { const s = createFarm(now, 1), c: FarmCommand = { type: 'harvest', plotId: 'plot-1', requestId: 'harvest-a' }; const next = command(s, c); expect(execute(parseBackup(serializeBackup(next)), c).state.inventory.wheat).toBe(3); expect(execute(next, { ...c, plotId: 'plot-2' }).ok).toBe(false); });
    it('does not advance twice after wall-clock rollback', () => { const s = createFarm(now, 1), back = advanceTime(s, now - 100000), next = advanceTime(back, now); expect(next.clock).toBe(s.clock); expect(advanceTime(next, now + 1000).clock).toBe(s.clock + 1000); });
    it('completes a 4-day upgrade after 7 days offline exactly once', () => { let s = rich(24); building(s, 'fairground', 22); s.entities.find(e => e.asset === 'warehouse')!.level = 23; for (const id of Object.keys(s.inventory))
        s.inventory[id as keyof typeof ITEMS] = 200; s = command(s, { type: 'upgrade', entityId: 'home' }); expect(homeLevel(s)).toBe(24); const n = advanceTime(s, now + 7 * 86400000); expect(homeLevel(n)).toBe(25); expect(n.stats.upgrade).toBe(s.stats.upgrade + 1); expect(advanceTime(n, now + 7 * 86400000)).toEqual(n); validateSnapshot(n); });
    it('holds a worker, waits for production, finishes upgrade then resumes reserved queue', () => { let s = rich(5); const e = building(s, 'mill', 4); s = command(s, { type: 'produce', entityId: e.id, recipe: 'flour', quantity: 2 }); s = command(s, { type: 'upgrade', entityId: e.id }); expect(s.entities.find(v => v.id === e.id)!.construction?.waitingFor).toBeTruthy(); const n = advanceTime(s, now + 7 * 86400000), result = n.entities.find(v => v.id === e.id)!; expect(result.level).toBe(5); expect(result.output.flour).toBe(2); expect(result.queue).toHaveLength(0); expect(result.job).toBeUndefined(); validateSnapshot(n); });
    it('does not consume a speedup on an already completed job', () => { let s = rich(2); s.entities.find(e => e.asset === 'warehouse')!.level = 1; s = command(s, { type: 'upgrade', entityId: 'warehouse' }); const id = s.entities.find(e => e.id === 'warehouse')!.construction!.id; const completed = advanceTime(s, now + 86400000); expect(execute(completed, { type: 'speedup', targetId: id, minutes: 5 }).ok).toBe(false); expect(completed.speedups[5]).toBe(s.speedups[5]); });
    it('cancels pending upgrades and queues atomically with refunds', () => { let s = rich(5); const e = building(s, 'mill', 4), before = s.inventory.wheat; s = command(s, { type: 'produce', entityId: e.id, recipe: 'flour', quantity: 2 }); s = command(s, { type: 'cancel-queue', entityId: e.id }); expect(s.inventory.wheat).toBe(before - 2); const coins = s.coins; s = command(s, { type: 'upgrade', entityId: e.id }); s = command(s, { type: 'cancel-upgrade', entityId: e.id }); expect(s.coins).toBe(coins); });
    it('preserves ripe crops and outputs when warehouse is full', () => { const s = createFarm(now, 1); s.inventory.wood = storageCap(s); expect(execute(s, { type: 'harvest', plotId: 'plot-1' }).ok).toBe(false); expect(s.plots[0].crop).toBe('wheat'); });
    it('keeps job and resources intact on move and undo', () => { let s = rich(3); const e = building(s, 'mill'); s = command(s, { type: 'produce', entityId: e.id, recipe: 'flour' }); const job = s.entities.find(v => v.id === e.id)!.job; s = command(s, { type: 'move', entityId: e.id, x: 18, z: 18, rotation: 1 }); s = command(s, { type: 'undo' }); expect(s.entities.find(v => v.id === e.id)!.job).toEqual(job); expect(s.entities.find(v => v.id === e.id)!.x).toBe(e.x); });
    it('blocks no-op layouts without adding revisions', () => { const s = createFarm(now, 1); expect(execute(s, { type: 'move', entityId: 'home', x: 10, z: 2, rotation: 0 }).ok).toBe(false); });
});
describe('world and economy constraints', () => {
    it('validates 6000 seeds with a guaranteed flat start and pier berth', () => { const counts = new Map<string, number>(); for (let seed = 0; seed < 6000; seed++) {
        const w = generateWorld(seed);
        expect(worldErrors(w), `seed ${seed}`).toEqual([]);
        counts.set(w.family, (counts.get(w.family) ?? 0) + 1);
    } expect(counts.size).toBe(FAMILIES.length); }, 90000);
    it('generates exactly the same persisted terrain for a given seed', () => { expect(generateWorld(222)).toEqual(generateWorld(222)); expect(generateWorld(222).water).not.toEqual(generateWorld(223).water); });
    it('does not refresh stock on reload or accumulate missed restocks', () => { let s = rich(4); s = command(s, { type: 'buy', item: 'wood', quantity: 30, epoch: s.market.epoch }); expect(execute(parseBackup(serializeBackup(s)), { type: 'buy', item: 'wood', quantity: 1, epoch: s.market.epoch }).ok).toBe(false); const n = advanceTime(s, now + 7 * 86400000); expect(n.market.bought).toEqual({}); expect(n.coins).toBe(s.coins); });
    it('clears an obstacle immediately and rejects the retired second collection', () => { let s = rich(4); const o = s.world.obstacles.find(o => o.x < 32 && o.z < 32)!; s = command(s, { type: 'clear', obstacleId: o.id, pay: 'auto' });  expect(s.world.obstacles.find(v => v.id === o.id)!.cleared).toBe(true); expect(execute(s, { type: 'collect-obstacle', obstacleId: o.id }).ok).toBe(false); });
    it('retains quantity reserved for a goal during sale or delivery', () => { let s = rich(2); s = command(s, { type: 'reserve', item: 'wheat', quantity: 20 }); expect(execute(s, { type: 'sell', item: 'wheat', quantity: 1 }).ok).toBe(false); });
    it('has achievable non-cyclic building prerequisites and recipes before demand', () => { const visiting = new Set<string>(), done = new Set<string>(); const walk = (id: string, n: number) => { const k = `${id}:${n}`; if (done.has(k))
        return; expect(visiting.has(k), k).toBe(false); visiting.add(k); if (n > 1)
        walk(id, n - 1); if (id === 'home' && n > 1)
        for (const r of HOME_LEVELS[n - 1].requires) {
            expect(ASSETS[r.building as AssetId].level).toBeLessThan(n);
            expect(r.level).toBeLessThan(n);
            walk(r.building, r.level);
        }
    else if (id !== 'home') {
        walk('home', Math.max(n, ASSETS[id as AssetId].level));
    } visiting.delete(k); done.add(k); }; walk('home', 25); expect(HOME_LEVELS).toHaveLength(25); expect(Object.values(ASSETS).filter(a => a.kind === 'building')).toHaveLength(29); for (const r of Object.values(RECIPES)) {
        expect(r.home).toBeGreaterThanOrEqual(ASSETS[r.building].level);
        expect(r.home).toBeGreaterThanOrEqual(r.buildingLevel);
    } for (const item of CHAPTER_PRODUCTS.filter(Boolean))
        expect(Object.values(RECIPES).some(r => r.output === item)).toBe(true); });
});
