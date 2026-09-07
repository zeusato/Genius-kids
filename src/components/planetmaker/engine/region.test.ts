import { describe, expect, it } from 'vitest';
import { brush, BUILDINGS, cloneRegion, createRegion, heightAt, markTiles, placement, placeBuilding, port, RegionHistory, roadLine, simulate, STRIDE, validateRegion } from './region';
import { exportWorld, importWorld, packTile, unpackTiles, validateWorld, World } from '../persistence/repository';
import { createTerrain, deserializeTerrain, makeSnap, randomizeTerrain, serializeTerrain } from '../terrainOps';
import { DEFAULT_COSMETICS } from '../planetStore';

const flat = () => { const r = createRegion('meadow', 42); r.height.fill(1); r.trees = []; return r; };
const building = (r: ReturnType<typeof flat>, type: keyof typeof BUILDINGS, x: number, z: number, yaw = 0) => placeBuilding(r, { type, x, z, yaw, color: BUILDINGS[type].color, roof: 0 })!;
function world(): World {
    const t = createTerrain(); randomizeTerrain(t, 42, .02);
    return { schema: 2, studentId: 'student-a', revision: 1, seed: 42, globe: makeSnap(t), doc: { version: 1, name: 'Thế giới', ...serializeTerrain(t), cosmetics: { ...DEFAULT_COSMETICS }, seaLevel: .02, showInSolar: true, updatedAt: new Date().toISOString() }, region: flat() };
}
describe('independent terrain', () => {
    it('repeats a preset and seed without depending on the globe', () => { const a = createRegion('coast', 912), b = createRegion('coast', 912); expect(a).toEqual(b); expect(createRegion('coast', 913).height).not.toEqual(a.height); });
    it('interpolates the actual triangle surface', () => { const r = flat(); r.height[0] = 0; r.height[1] = 2; r.height[STRIDE] = 4; r.height[STRIDE + 1] = 8; expect(heightAt(r, .125, .125)).toBe(1.5); expect(heightAt(r, .375, .375)).toBe(5.5); });
    it('protects foundations while sculpting surrounding ground', () => { const r = flat(); building(r, 'home', 30, 30); brush(r, 'lower', 30, 30, 5, .4, 0, 1); expect(heightAt(r, 31, 31)).toBe(1); expect(heightAt(r, 29, 29)).toBeLessThan(1); });
    it('keeps brushes bounded and deterministic', () => { const a = flat(), b = flat(); for (const r of [a, b]) { brush(r, 'forest', 10, 10, 3, .2, 1, 22); for (let n = 0; n < 100; n++) brush(r, 'raise', 12, 12, 4, .4, 1, n); } expect(a).toEqual(b); expect(Math.max(...a.height)).toBe(8); validateRegion(a); });
    it('marks neighboring tiles when shared border samples change', () => { const dirty = new Set<number>(); markTiles(16, 16, .5, dirty); expect([...dirty].sort()).toEqual([0, 1, 4, 5]); });
});
describe('placement and commands', () => {
    it('rejects overlapping, flooded, steep, road and out-of-map footprints', () => {
        const r = flat(); building(r, 'home', 10, 10); expect(placement(r, 'home', 11, 11, 0).ok).toBe(false); expect(placement(r, 'home', 0, 0, 0).ok).toBe(false); expect(placement(r, 'home', NaN, 20, 0).ok).toBe(false);
        r.height[40 * STRIDE + 40] = 3; expect(placement(r, 'home', 20, 20, 0).reason).toContain('dốc'); r.height.fill(1); r.seaLevel = 1; expect(placement(r, 'home', 20, 20, 0).reason).toContain('ngập'); r.seaLevel = 0; roadLine(r, 20, 20, 22, 20); expect(placement(r, 'home', 20, 20, 0).reason).toContain('đường');
    });
    it('rotates footprint and its road port together', () => { const r = flat(); const b = building(r, 'school', 10, 10, 1); expect(port(b)).toEqual([13, 12]); expect(placement(r, 'home', 13, 10, 0).ok).toBe(true); });
    it('does not persist preview operation metadata when moving a building', () => { const r = flat(), b = building(r, 'home', 10, 10); const draft = { ...b, x: 20, movingId: b.id }; const moved = placeBuilding(r, draft, b.id)!; expect(moved.id).toBe(b.id); expect(moved).not.toHaveProperty('movingId'); const { id, foundation, ...copy } = moved; const duplicate = placeBuilding(r, { ...copy, x: 25 })!; expect(duplicate.id).not.toBe(b.id); expect(r.buildings).toHaveLength(2); });
    it('undoes and redoes a building, its flattening and removed trees as one command', () => {
        const r = flat(); r.height[60 * STRIDE + 60] = 1.5; r.trees = [{ id: r.nextId++, x: 31, z: 31, scale: 1 }]; const before = cloneRegion(r), h = new RegionHistory(); h.begin(r); building(r, 'home', 30, 30); h.commit(r, 'build'); const after = cloneRegion(r); expect(r.trees).toHaveLength(0); h.travel(r); expect(r).toEqual(before); h.travel(r, true); expect(r).toEqual(after);
    });
    it('restores a mixed command sequence exactly', () => {
        const r = flat(), before = cloneRegion(r), h = new RegionHistory(); const actions = [() => brush(r, 'raise', 4, 4, 3, .3, 0, 1), () => brush(r, 'forest', 20, 20, 3, .2, 0, 42), () => building(r, 'home', 30, 30), () => roadLine(r, 20, 32, 40, 32), () => { r.seaLevel = 2; }];
        for (const fn of actions) { h.begin(r); fn(); h.commit(r, 'edit'); } const after = cloneRegion(r); for (const _ of actions) h.travel(r); expect(r).toEqual(before); for (const _ of actions) h.travel(r, true); expect(r).toEqual(after);
    });
    it('cancels a provisional stroke without adding history', () => { const r = flat(), before = cloneRegion(r), h = new RegionHistory(); h.begin(r); brush(r, 'crater', 8, 8, 4, .3, 1, 1); h.cancel(r); expect(r).toEqual(before); expect(h.undoStack).toHaveLength(0); });
    it('clears redo on a new branch and enforces history byte budget', () => { const r = flat(), h = new RegionHistory(10000); for (let n = 0; n < 30; n++) { h.begin(r); r.seaLevel = n / 10; h.commit(r, 'water'); } expect(h.undoStack.reduce((sum, c) => sum + c.bytes, 0)).toBeLessThanOrEqual(10000); h.travel(r); h.begin(r); r.seaLevel = -1; h.commit(r, 'water'); expect(h.redoStack).toHaveLength(0); });
});
describe('roads, resources and flood experiment', () => {
    it('delivers resources only through a connected dry network', () => {
        const r = flat(); const home = building(r, 'home', 10, 10), solar = building(r, 'solar', 15, 10), water = building(r, 'water', 20, 10);
        roadLine(r, 11, 12, 21, 12); expect(simulate(r).residents).toBe(4); expect(simulate(r).status[home.id].watered).toBe(true);
        roadLine(r, 18, 12, 18, 12, true); expect(simulate(r).residents).toBe(0); roadLine(r, 18, 12, 18, 12); r.seaLevel = 1.1; expect(simulate(r).flooded).toBe(3); expect(simulate(r).residents).toBe(0); expect(solar).toBeTruthy(); expect(water).toBeTruthy();
    });
    it('requires sufficient total supply and isolates disconnected grids', () => { const r = flat(); const home = building(r, 'home', 10, 10); building(r, 'solar', 30, 30); building(r, 'water', 35, 30); roadLine(r, 31, 32, 36, 32); roadLine(r, 11, 12, 12, 12); expect(simulate(r).status[home.id].powered).toBe(false); });
    it('completes all three missions on a connected town', () => { const r = flat(); for (let i = 0; i < 5; i++) building(r, 'home', 5 + i * 3, 10); building(r, 'solar', 22, 10); building(r, 'water', 27, 10); building(r, 'school', 32, 9); building(r, 'park', 38, 9); roadLine(r, 6, 12, 40, 12); expect(simulate(r).missions).toEqual([true, true, true]); });
});
describe('persistence integrity', () => {
    it('round-trips typed arrays and rebinds imported ownership', () => { const w = world(); w.region!.height[200] = .123456; const copy = importWorld(exportWorld(w), 'student-b', 10); expect(copy.studentId).toBe('student-b'); expect(copy.revision).toBe(10); expect(copy.globe).toEqual(w.globe); expect(copy.region).toEqual(w.region); });
    it('reassembles all sixteen tiles without seams or precision loss', () => { const r = createRegion('hills', 119), { height, biome, ...meta } = r; const tiles = Array.from({ length: 16 }, (_, i) => packTile('a', r, i)); expect(unpackTiles({ ...meta, studentId: 'a' }, tiles)).toEqual(r); tiles[1].height[0] += .1; expect(() => unpackTiles({ ...meta, studentId: 'a' }, tiles)).toThrow('khớp'); });
    it('rejects missing tiles and malformed biome values', () => { const r = flat(), { height, biome, ...meta } = r; expect(() => unpackTiles({ ...meta, studentId: 'a' }, [])).toThrow(); r.biome[0] = 7; expect(() => validateRegion(r)).toThrow(); });
    it('rejects truncated legacy terrain atomically', () => { const t = createTerrain(); randomizeTerrain(t, 42, .02); const before = makeSnap(t), serialized = serializeTerrain(t); expect(deserializeTerrain(t, { ...serialized, paint: 'AA==' })).toBe(false); expect(makeSnap(t)).toEqual(before); });
    it('preserves the complete legacy globe during migration decoding', () => { const t = createTerrain(); randomizeTerrain(t, 42, .02); const doc = serializeTerrain(t), restored = createTerrain(); expect(deserializeTerrain(restored, doc)).toBe(true); expect(restored.paint).toEqual(t.paint); expect(restored.trees).toEqual(t.trees); expect(Math.max(...restored.elevation.map((h, i) => Math.abs(h - t.elevation[i])))).toBeLessThan(.0008); });
    it('rejects unsupported backups, oversized inputs and array coercion', () => { expect(() => importWorld('{"version":99}', 'a', 1)).toThrow(); expect(() => importWorld('x'.repeat(5_000_001), 'a', 1)).toThrow(); const w = world(); const raw = exportWorld(w).replace('"type":"Uint8Array","data":[', '"type":"Uint8Array","data":[256,'); expect(() => importWorld(raw, 'a', 1)).toThrow(); });
    it('rejects bad trees and non-finite heights', () => { const w = world(); w.globe.trees = [70000]; expect(() => validateWorld(w)).toThrow(); w.globe.trees = []; w.region!.height[0] = NaN; expect(() => validateWorld(w)).toThrow(); });
});
