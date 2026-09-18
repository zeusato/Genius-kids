import { describe, it, expect } from 'vitest';
import { ASSETS, RECIPES, type AssetId, type ItemId } from '../src/core/catalog';
import { buildingCount, buildingLimit, buildPrice, buildRequirements } from '../src/core/construction';
import { createFarm, execute, advanceTime, dimensions, placementError } from '../src/core/engine';
import { validateSnapshot, serializeBackup, parseBackup } from '../src/core/validation';
import type { FarmState } from '../src/core/types';
const now = 1800000000000;
function farm() { const s = createFarm(now, 42); s.entities[0].level = 2; s.coins = 10000; s.inventory.wood = 30; s.inventory.stone = 30; return s; }
function site(s: FarmState, asset: AssetId) {
    const [w, d] = dimensions(asset, 0);
    for (let z = 0; z < 24; z++) for (let x = 0; x < 24; x++) if (!placementError(s, x, z, w, d, undefined, asset)) return { x, z, rotation: 0 as const };
    throw new Error('No valid construction site');
}
describe('building materials and functional limits', () => {
    it('uses materials for every functional building and only coins for decoration, with no locked material source', () => {
        for (const [id, asset] of Object.entries(ASSETS)) {
            const cost = buildPrice(id as AssetId);
            expect(cost.coins).toBe(asset.price);
            expect(buildingLimit(id as AssetId)).toBe(asset.kind === 'building' ? 1 : null);
            expect(Object.keys(cost.items).length > 0).toBe(asset.kind === 'building');
            for (const [item, n] of Object.entries(cost.items)) {
                expect(n).toBeGreaterThan(0);
                if (item === 'wood' || item === 'stone') continue;
                expect(Object.values(RECIPES).some(r => r.output === item && r.home < asset.level && ASSETS[r.building].level < asset.level), `${id} needs an earlier source of ${item}`).toBe(true);
            }
        }
    });
    it('rejects insufficient material without spending coins or placing anything', () => {
        const s = farm(); s.inventory.stone = 3; const before = structuredClone(s);
        const r = execute(s, { type: 'build', asset: 'mill', ...site(s, 'mill') });
        expect(r.ok).toBe(false); expect(r.message).toContain('vật liệu'); expect(r.state).toEqual(before); expect(s).toEqual(before);
    });
    it('charges exactly once, persists the material cost, counts construction toward the limit and completes offline', () => {
        const s = farm(), cost = buildPrice('mill');
        const r = execute(s, { type: 'build', asset: 'mill', ...site(s, 'mill') }); expect(r.ok, r.message).toBe(true);
        const built = parseBackup(serializeBackup(r.state)), e = built.entities.find(e => e.asset === 'mill')!;
        expect(built.coins).toBe(s.coins - cost.coins);
        for (const [item, n] of Object.entries(cost.items)) expect(built.inventory[item as ItemId]).toBe(s.inventory[item as ItemId] - n!);
        expect(e.construction?.cost).toEqual(cost); expect(buildingCount(built, 'mill')).toBe(1);
        const twice = execute(built, { type: 'build', asset: 'mill', ...site(built, 'mill') });
        expect(twice.ok).toBe(false); expect(twice.message).toContain('1/1'); expect(twice.state).toEqual(built);
        const done = advanceTime(built, built.lastWallTime + e.construction!.readyAt - built.clock + 1);
        expect(done.entities.find(v => v.id === e.id)!.construction).toBeUndefined(); expect(done.coins).toBe(built.coins); expect(done.inventory).toEqual(built.inventory);
        validateSnapshot(done);
    });
    it('retains free movement and old construction bills after the pricing change', () => {
        const s = farm(), r = execute(s, { type: 'build', asset: 'mill', ...site(s, 'mill') });
        const e = r.state.entities.find(e => e.asset === 'mill')!;
        e.construction!.cost.items = {}; // A job paid under the former coin-only rules.
        const old = validateSnapshot(r.state), done = advanceTime(old, old.lastWallTime + e.construction!.readyAt - old.clock + 1);
        const moved = execute(done, { type: 'move', entityId: e.id, ...site(done, 'mill') });
        expect(moved.ok, moved.message).toBe(true); expect(moved.state.coins).toBe(done.coins); expect(moved.state.inventory).toEqual(done.inventory);
    });
    it('allows repeated decorations without materials or builders', () => {
        let s = farm(); s.inventory.wood = 0; s.inventory.stone = 0; const coins = s.coins;
        for (let i = 0; i < 2; i++) { const r = execute(s, { type: 'build', asset: 'bench', ...site(s, 'bench') }); expect(r.ok, r.message).toBe(true); s = r.state; }
        expect(buildingCount(s, 'bench')).toBe(2); expect(s.coins).toBe(coins - ASSETS.bench.price * 2); expect(s.entities.filter(e => e.asset === 'bench').every(e => !e.construction)).toBe(true);
    });
    it('enforces Home unlocks and occupied builders even with enough materials', () => {
        const s = farm(); s.entities[0].level = 1;
        expect(buildRequirements(s, 'mill').join(' ')).toContain('Nhà chính cấp 2');
        s.entities[0].level = 2;
        const built = execute(s, { type: 'build', asset: 'mill', ...site(s, 'mill') }).state;
        const rejected = execute(built, { type: 'build', asset: 'coop', ...site(built, 'coop') });
        expect(rejected.ok).toBe(false); expect(rejected.message).toContain('đội thợ'); expect(rejected.state).toEqual(built);
    });
});
