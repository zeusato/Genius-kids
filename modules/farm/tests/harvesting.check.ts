import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { createFarm, execute, advanceTime } from '../src/core/engine';
import { ENERGY_POINT_MS, REGROWTH_SLOT_MS, RESOURCE_TIERS, energyCapacity, resourceReward, resourceTier } from '../src/core/harvesting';
import { parseBackup, serializeBackup, validateSnapshot } from '../src/core/validation';
import { ownedAt, isWater, worldErrors, canWorkTile, type Obstacle } from '../src/core/world';
import { storageCap } from '../src/core/progression';
import { harvestMember } from '../src/render/Family';
import { LocalFarmGateway } from '../src/adapters/local';
import type { FarmState } from '../src/core/types';

const now = 1800000000000;
function fixture(kind: Obstacle['kind'] = 'tree', tier: 1 | 2 | 3 | 4 = 1) {
    const s = createFarm(now, 20260917);
    const o: Obstacle = { id: 'o-25-9', x: 25, z: 9, kind, tier, cleared: false };
    s.world.obstacles = s.world.obstacles.filter(v => Math.abs(v.x - o.x) + Math.abs(v.z - o.z) > 2);
    s.world.obstacles.push(o);
    return { s, o };
}
function clear(s: FarmState, o: Obstacle) { return execute(s, { type: 'clear', obstacleId: o.id, generation: o.generation ?? 0 }); }

describe('instant tiered harvesting', () => {
    it('spends only energy and receives bounded goods immediately, once', () => {
        const { s, o } = fixture(), before = structuredClone(s), reward = resourceReward(s.world, o);
        const r = clear(s, o);
        expect(r.ok, r.message).toBe(true);
        expect(r.state.coins).toBe(s.coins);
        expect(r.state.energy.value).toBe(88);
        expect(r.state.inventory.wood).toBe(reward.items.wood);
        expect(r.state.world.obstacles.find(v => v.id === o.id)).toMatchObject({ cleared: true, claimed: true });
        expect(r.state.world.obstacles.find(v => v.id === o.id)?.readyAt).toBeUndefined();
        expect(r.harvest?.items).toEqual(reward.items);
        expect(clear(r.state, o).ok).toBe(false);
        expect(s).toEqual(before);
        validateSnapshot(r.state);
    });
    it.each([1, 2, 3, 4] as const)('gates tier %i by Home and consumes the tier tool cost instead of energy', tier => {
        const { s, o } = fixture('rock', tier), spec = RESOURCE_TIERS[tier];
        s.inventory.tools = 10;
        if (tier > 1) expect(clear(s, o).ok).toBe(false);
        s.entities[0].level = spec.home;
        s.energy.value = 0;
        const r = clear(s, o);
        expect(r.ok, r.message).toBe(true);
        expect(r.state.energy.value).toBe(0);
        expect(r.state.inventory.tools).toBe(10 - spec.tools);
        expect(r.state.inventory.stone).toBeGreaterThanOrEqual(spec.min);
        expect(r.state.inventory.stone).toBeLessThanOrEqual(spec.max);
        expect(r.state.inventory.clay).toBe(tier);
    });
    it('does not charge anything when energy, tools, access or warehouse space is insufficient', () => {
        for (const problem of ['energy', 'warehouse', 'land', 'generation'] as const) {
            const { s, o } = fixture();
            if (problem === 'energy') s.energy.value = 11;
            if (problem === 'warehouse') { s.inventory.wood = storageCap(s); s.inventory.tools = 2; }
            if (problem === 'land') s.world.owned = [0];
            if (problem === 'generation') o.generation = 2;
            const before = structuredClone(s);
            const r = execute(s, { type: 'clear', obstacleId: o.id });
            expect(r.ok).toBe(false); expect(r.state).toBe(s); expect(s).toEqual(before);
        }
    });
    it('keeps the random reward across reloads, and varies it over resources', () => {
        const values = new Set<number>();
        for (let seed = 0; seed < 35; seed++) {
            const { s, o } = fixture(); s.world.seed = seed;
            const reward = resourceReward(s.world, o);
            expect(resourceReward(parseBackup(serializeBackup(s)).world, o)).toEqual(reward);
            values.add(reward.items.wood!);
        }
        expect([...values].sort()).toEqual([4, 5, 6]);
    });
    it('uses the warehouse slot freed by a consumed tool in the same transaction', () => {
        const { s, o } = fixture(), quantity = resourceReward(s.world, o).items.wood!;
        s.inventory.tools = 1; s.inventory.wood = storageCap(s) - quantity;
        const r = clear(s, o);
        expect(r.ok, r.message).toBe(true);
        expect(r.state.inventory.tools).toBe(0); expect(r.state.inventory.wood).toBe(storageCap(s));
        expect(r.state.energy.value).toBe(100);
    });
    it('does not replay costs, inventory or cosmetic rewards for an acknowledged request', () => {
        const { s, o } = fixture();
        const command = { type: 'clear' as const, obstacleId: o.id, requestId: 'clear-once' };
        const result = execute(s, command), repeated = execute(parseBackup(serializeBackup(result.state)), command);
        expect(repeated.ok).toBe(true); expect(repeated.state).toEqual(result.state); expect(repeated.harvest).toBeUndefined();
    });
    it('rejects retired gathering and the old paid coin path', () => {
        const { s, o } = fixture();
        expect(execute(s, { type: 'gather', item: 'wood' }).ok).toBe(false);
        expect(execute(s, { type: 'collect-gather' }).ok).toBe(false);
        expect(execute(s, { type: 'collect-obstacle', obstacleId: o.id }).ok).toBe(false);
        expect(execute(s, { type: 'clear', obstacleId: o.id, pay: 'coins' } as never).ok).toBe(false);
    });
});

describe('energy and berries', () => {
    it('recovers exactly one point per three minutes, carries fractions and clamps at capacity', () => {
        const { s, o } = fixture(); let state = clear(s, o).state;
        state = advanceTime(state, now + ENERGY_POINT_MS - 1); expect(state.energy.value).toBe(88);
        state = advanceTime(state, now + ENERGY_POINT_MS); expect(state.energy.value).toBe(89);
        expect(advanceTime(state, now + ENERGY_POINT_MS).energy).toEqual(state.energy);
        expect(advanceTime(state, now - 100).energy).toEqual(state.energy);
        state = advanceTime(state, now + 30 * ENERGY_POINT_MS); expect(state.energy.value).toBe(100);
        const again = fixture(); again.s.energy = state.energy; again.s.clock = state.clock; again.s.lastWallTime = state.lastWallTime;
        const spent = clear(again.s, again.o).state;
        expect(advanceTime(spent, state.lastWallTime + 1000).energy.value).toBe(88);
    });
    it('adds 5 capacity per completed Home level without filling the whole bar', () => {
        const { s } = fixture(); s.energy.value = 20;
        s.entities[0].level = 5;
        const next = advanceTime(s, now);
        expect(next.energy).toMatchObject({ value: 40, capacity: 120 });
        expect(energyCapacity({ ...s, entities: s.entities.map(e => e.asset === 'home' ? { ...e, level: 25 } : e) })).toBe(220);
    });
    it('berries grant 5–10 energy without consuming tools, money or energy, and preserve full-bar bushes', () => {
        const { s, o } = fixture('berry'); s.inventory.tools = 4;
        expect(clear(s, o).ok).toBe(false);
        s.energy.value = 40;
        const r = clear(s, o);
        expect(r.ok).toBe(true);
        expect(r.state.energy.value).toBeGreaterThanOrEqual(45); expect(r.state.energy.value).toBeLessThanOrEqual(50);
        expect(r.state.inventory).toEqual(s.inventory); expect(r.state.coins).toBe(s.coins);
        s.energy.value = 99; expect(clear(s, o).state.energy.value).toBe(100);
    });
    it('assigns trees/rocks to parents and berries only to mother or children', () => {
        const people = new Set<string>();
        for (let x = 24; x < 36; x++) {
            const { s, o } = fixture(); o.x = x;
            expect(['father', 'mother']).toContain(harvestMember({ obstacle: o, ...resourceReward(s.world, o) }));
            o.kind = 'berry'; const who = harvestMember({ obstacle: o, ...resourceReward(s.world, o) });
            expect(['mother', 'son', 'daughter']).toContain(who); people.add(who);
        }
        expect(people.size).toBe(3);
    });
});

describe('bounded deterministic regrowth and save migration', () => {
    it('gets the same regrowth for batched catch-up and individual slots within a day', () => {
        const initial = createFarm(now, 20260917);
        let stepped = initial;
        for (let slot = 1; slot < 5; slot++) stepped = advanceTime(stepped, now + slot * REGROWTH_SLOT_MS);
        const batched = advanceTime(initial, now + 4 * REGROWTH_SLOT_MS);
        expect(stepped.world).toEqual(batched.world);
        expect(stepped.regrowth).toEqual(batched.regrowth);
    });
    it('spawns no more than five of each class per day on open, dry, accessible tiles', () => {
        let s = createFarm(now, 20260917); const initial = structuredClone(s);
        const resourceIds = new Set(s.world.obstacles.map(o => o.id));
        s = advanceTime(s, now + 86400000 - initial.clock - 1);
        const added = s.world.obstacles.filter(o => !resourceIds.has(o.id));
        expect(added.filter(o => o.kind !== 'berry').length).toBeLessThanOrEqual(5);
        expect(s.world.obstacles.filter(o => o.kind === 'berry').length).toBeLessThanOrEqual(5);
        expect(added.length).toBeGreaterThan(0);
        for (const o of added) { expect(resourceTier(s.world, o)).toBe(1); expect(ownedAt(s.world, o.x, o.z)).toBe(true); expect(isWater(s.world, o.x, o.z)).toBe(false); expect(canWorkTile(s.world, o.x, o.z)).toBe(true); }
        expect(worldErrors(s.world)).toEqual([]); validateSnapshot(s);
        expect(advanceTime(parseBackup(serializeBackup(s)), s.lastWallTime)).toEqual(s);
        expect(initial.world.obstacles.length).toBe(resourceIds.size);
    });
    it('does not accumulate a month of missed spawns or reset quotas on clock rollback', () => {
        const s = createFarm(now, 7), before = structuredClone(s);
        const later = advanceTime(s, now + 30 * 86400000 + 4 * REGROWTH_SLOT_MS);
        expect(later.world.obstacles.length - s.world.obstacles.length).toBeLessThanOrEqual(10);
        expect(advanceTime(later, now).regrowth).toEqual(later.regrowth);
        expect(s).toEqual(before);
    });
    it('settles paid old clearing/gather once without losing inventory at a full warehouse', () => {
        const { s, o } = fixture('rock'); const old = structuredClone(s) as any;
        delete old.harvestingVersion; delete old.energy; delete old.regrowth;
        old.world.obstacles.find((v: Obstacle) => v.id === o.id).readyAt = old.clock + 60000;
        old.inventory.wood = storageCap(s); old.gather = { item: 'wood', readyAt: old.clock + 30000 };
        const original = structuredClone(old), migrated = validateSnapshot(old);
        expect(migrated.inventory.stone).toBe(12); expect(migrated.inventory.clay).toBe(2);
        expect(migrated.inventory.wood).toBeGreaterThan(old.inventory.wood);
        expect(migrated.world.obstacles.find(v => v.id === o.id)?.cleared).toBe(true);
        expect(migrated.gather).toBeUndefined(); expect(migrated.energy.value).toBe(100);
        expect(validateSnapshot(migrated)).toEqual(migrated); expect(old).toEqual(original);
    });
    it('rejects malformed energy, future quotas, resource tiers and noninstant jobs', () => {
        const { s, o } = fixture();
        for (const edit of [(n: FarmState) => n.energy.value = 101, (n: FarmState) => n.energy.updatedAt = n.clock + 1, (n: FarmState) => n.regrowth.slot = 999, (n: FarmState) => n.world.obstacles.find(v => v.id === o.id)!.readyAt = n.clock + 1]) {
            const bad = structuredClone(s); edit(bad); expect(() => validateSnapshot(bad)).toThrow();
        }
    });
    it('does not expose a harvest reward when repository save fails', async () => {
        const { s, o } = fixture();
        const gateway = await LocalFarmGateway.open({ load: async () => structuredClone(s), save: async () => { throw new Error('disk full'); } }, () => now);
        await expect(gateway.execute({ type: 'clear', obstacleId: o.id })).rejects.toThrow('disk full');
        expect(gateway.getSnapshot().inventory).toEqual(s.inventory);
        expect(gateway.getSnapshot().energy).toEqual(s.energy);
        await gateway.close();
    });
});
