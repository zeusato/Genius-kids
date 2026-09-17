import { describe, it, expect } from 'vitest';
import { createFarm, execute, advanceTime, placementError, dimensions } from '../src/core/engine';
import { PIPE_SOLUTION, validPipes, professionFactor } from '../src/core/activities';
import { generateWorld, canReachRegion, isWater, reachableTiles, tileIndex } from '../src/core/world';
import { validateSnapshot } from '../src/core/validation';
import { ITEMS, type ItemId } from '../src/core/catalog';
import type { FarmState, FarmCommand } from '../src/core/types';
function run(s: FarmState, c: FarmCommand) { const r = execute(s, c); expect(r.ok, r.message).toBe(true); validateSnapshot(r.state); return r.state; }
function rich() { const s = createFarm(1800000000000, 3); s.entities.forEach(e => e.level = 25); s.coins = 100000; s.legacyStorageCap = 100000; for (const id of Object.keys(ITEMS) as ItemId[]) {
    s.inventory[id] = 100;
    s.produced[id] = 100;
} return s; }
describe('optional professions, projects and activities', () => {
    it('validates a pipe route and gives one reward per persisted market period', () => { expect(validPipes(PIPE_SOLUTION)).toBe(true); expect(validPipes([1, ...PIPE_SOLUTION.slice(1)])).toBe(false); let s = rich(); const c: FarmCommand = { type: 'irrigation', rotations: PIPE_SOLUTION, epoch: s.market.epoch }; s = run(s, c); const count = s.speedups[5]; s = run(validateSnapshot(s), c); expect(s.speedups[5]).toBe(count); expect(execute(s, { ...c, epoch: 99 }).ok).toBe(false); });
    it('requires self-produced donations and retains independently learned professions', () => { let s = rich(); s.produced.bread = 0; expect(execute(s, { type: 'specialize', profession: 'food' }).ok).toBe(false); s.produced.bread = 100; s = run(s, { type: 'specialize', profession: 'food' }); s = run(s, { type: 'specialize', profession: 'materials' }); expect(professionFactor(s, 'bread')).toBe(.95); expect(professionFactor(s, 'plank')).toBe(.95); expect(s.inventory.bread).toBe(95); });
    it('awards stored decoration once, then requires the next project contribution', () => { let s = rich(); expect(execute(s, { type: 'project', stage: 2 }).ok).toBe(false); s = run(s, { type: 'project', stage: 0 }); expect(s.entities.find(e => e.asset === 'flowers')?.stored).toBe(true); expect(execute(s, { type: 'project', stage: 0 }).ok).toBe(false); });
    it('never mutates the input snapshot while resolving bridges or claiming regions', () => { const s = rich(); s.world.owned.push(2, 3, 8, 9); const b = s.world.bridges[0]; b.readyAt = s.clock + 300000; const original = structuredClone(s); advanceTime(s, s.lastWallTime + 86400000); expect(s).toEqual(original); execute(s, { type: 'expand', chunk: 12 }); expect(s).toEqual(original); });
});
describe('world access and oriented shore placement', () => {
    it('has two dry bridge banks and permits all 36 regions after opening crossings', () => {
        for (let seed = 0; seed < 120; seed++) {
            const w = generateWorld(seed);
            for (const b of w.bridges) {
                expect(isWater(w, b.x, b.z), `bank ${seed}`).toBe(false);
                expect(isWater(w, b.x + 5, b.z)).toBe(false);
                b.built = true;
            }
            // Reachability caches immutable worlds: recompute on a fresh persisted identity.
            let current = { ...w };
            for (let pass = 0; pass < 36; pass++) {
                const next = Array.from({ length: 36 }, (_, i) => i).find(i => !current.owned.includes(i) && canReachRegion(current, i));
                if (next === undefined)
                    break;
                current = { ...current, owned: [...current.owned, next] };
            }
            expect(current.owned.length, `seed ${seed}`).toBe(36);
        }
    }, 30000);
    it('accepts the guaranteed pier berth and rejects inland placement at every orientation', () => { const s = rich(); s.world.owned.push(13); expect(placementError(s, 24, 37, 3, 4, undefined, 'fishing_pier', 0)).toBe(null); for (const r of [0, 1, 2, 3] as const) {
        const [w, d] = dimensions('fishing_pier', r);
        expect(placementError(s, 18, 18, w, d, undefined, 'fishing_pier', r)).toBeTruthy();
    } });
});
