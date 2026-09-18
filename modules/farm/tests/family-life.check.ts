import { describe, expect, it } from 'vitest';
import { createFarm } from '../src/core/engine';
import { tileIndex } from '../src/core/world';
import { createWalker, familyGarden, planWalk, relocateWalker, stepWalker } from '../src/render/familyLife';

function fixture() {
    const s = createFarm(1800000000000, 3);
    s.world.heights.fill(0); s.world.water.fill(0); s.world.obstacles = []; s.world.bridges = [];
    s.world.owned = [0]; s.entities = [s.entities[0]]; s.plots = [];
    return s;
}
describe('cosmetic family life', () => {
    it('blocks buildings, crops, obstacles, water and unopened land, but allows paths', () => {
        const s = fixture();
        s.world.water[tileIndex(2, 2)] = 1;
        s.world.obstacles.push({ id: 'o-3-3', kind: 'tree', x: 3, z: 3, cleared: false });
        s.plots = [{ id: 'p', x: 4, z: 4 }];
        s.entities.push({ ...s.entities[0], id: 'path', asset: 'path', x: 5, z: 5 });
        const g = familyGarden(s);
        for (const [x, z] of [[2, 2], [3, 3], [4, 4], [10, 2], [17, 2]]) expect(g.open[tileIndex(x, z)]).toBe(0);
        expect(g.open[tileIndex(5, 5)]).toBe(1);
    });
    it('finds routes around buildings and visits their edges without mutating the farm', () => {
        const s = fixture(), before = structuredClone(s), g = familyGarden(s), w = createWalker(g, 8.5, 4.5, 73);
        const activities = new Set<string>();
        for (let n = 0; n < 80; n++) {
            planWalk(w, g); activities.add(w.activity);
            let previous = tileIndex(Math.floor(w.x), Math.floor(w.z));
            for (const tile of w.path) { expect(g.open[tile]).toBe(1); expect(Math.abs(tile % 96 - previous % 96) + Math.abs(Math.floor(tile / 96) - Math.floor(previous / 96))).toBe(1); previous = tile; }
            if (w.path.length) relocateWalker(w, g, previous % 96 + .5, Math.floor(previous / 96) + .5);
        }
        expect(activities.has('knock')).toBe(true); expect(activities.has('look')).toBe(true);
        expect(s).toEqual(before);
    });
    it('never crosses a water barrier without a completed bridge', () => {
        const s = fixture(); s.entities = [];
        for (let z = 0; z < 16; z++) for (let x = 5; x <= 8; x++) s.world.water[tileIndex(x, z)] = 1;
        let g = familyGarden(s), w = createWalker(g, 2.5, 7.5, 5);
        for (let i = 0; i < 30; i++) { planWalk(w, g); expect(w.path.every(t => t % 96 < 5)).toBe(true); }
        s.world.bridges = [{ id: 'b', x: 4, z: 7, built: true }]; g = familyGarden(s);
        let crosses = false;
        for (let i = 0; i < 40; i++) { planWalk(w, g); crosses ||= w.path.some(t => t % 96 > 8); }
        expect(crosses).toBe(true); expect(g.heights[tileIndex(6, 7)]).toBeCloseTo(.15);
    });
    it('avoids cliff edges and reserved destinations', () => {
        const s = fixture(); s.entities = [];
        for (let z = 0; z < 16; z++) for (let x = 8; x < 16; x++) s.world.heights[tileIndex(x, z)] = 2;
        const g = familyGarden(s), w = createWalker(g, 2.5, 7.5, 1), reserved = new Set(g.tiles.filter(t => t % 96 >= 4));
        for (let i = 0; i < 30; i++) { planWalk(w, g, reserved); expect(w.path.every(t => t % 96 < 8)).toBe(true); expect(reserved.has(w.path.at(-1)!)).toBe(false); }
    });
    it('moves continuously, pauses to interact and caps suspended-tab elapsed time', () => {
        const s = fixture(), g = familyGarden(s), w = createWalker(g, 8.5, 4.5, 73);
        planWalk(w, g); const x = w.x, z = w.z;
        stepWalker(w, g, 3600);
        expect(Math.hypot(w.x - x, w.z - z)).toBeLessThanOrEqual(.10001);
        for (let n = 0; n < 600 && w.walking; n++) stepWalker(w, g, .1);
        expect(w.walking).toBe(false); expect(w.pause).toBeGreaterThan(0);
        const end = [w.x, w.z]; stepWalker(w, g, .1); expect([w.x, w.z]).toEqual(end);
    });
    it('repairs position after a layout change and safely hides on a completely blocked map', () => {
        const s = fixture(), g = familyGarden(s), w = createWalker(g, 6.5, 6.5, 1);
        s.world.obstacles.push({ id: 'o-6-6', kind: 'rock', x: 6, z: 6, cleared: false });
        const changed = familyGarden(s); relocateWalker(w, changed);
        expect(changed.open[tileIndex(Math.floor(w.x), Math.floor(w.z))]).toBe(1);
        expect([w.x, w.z]).not.toEqual([6.5, 6.5]);
        s.world.owned = []; relocateWalker(w, familyGarden(s)); expect(w.visible).toBe(false);
    });
});
