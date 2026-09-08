import 'fake-indexeddb/auto';
import { IDBObjectStore } from 'fake-indexeddb';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cloneWorld, ConflictError, exportWorld, importWorld, loadPublishedPlanet, loadWorld, publish, recoveryBackup, restoreCheckpoint, saveWorld } from './repository';
import { createTerrain, randomizeTerrain, serializeTerrain } from '../terrainOps';
import { DEFAULT_COSMETICS } from '../planetStore';
import { createRegion, markTiles, placeBuilding, STRIDE } from '../engine/region';
import { StrokeSampler } from '../engine/stroke';
import { EditTimeline } from '../engine/timeline';
const storage = new Map<string, string>();
beforeAll(() => { vi.stubGlobal('localStorage', { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, v: string) => storage.set(key, v) }); });
afterEach(() => vi.restoreAllMocks());
describe('transactional world repository', () => {
    it('round-trips expanded buildings, limits and graphics through save and backup', async () => {
        const w = await loadWorld('expanded-save', 'A'); w.region = createRegion('meadow', 42); w.region.height.fill(1);
        w.region.limits = { trees: 5000, roads: 1234, vehicles: 24 }; w.region.graphics = 'detailed';
        placeBuilding(w.region, { type: 'hospital', x: 10, z: 10, yaw: 1, roof: 0, color: '#e8e0cf', floors: 6, style: 2 });
        w.revision = await saveWorld(w); const restored = await loadWorld('expanded-save', 'A'), imported = importWorld(exportWorld(restored), 'expanded-copy', 0);
        expect(restored.region?.limits).toEqual(w.region.limits); expect(imported.region?.graphics).toBe('detailed'); expect(imported.region?.buildings).toEqual(w.region.buildings);
    });
    it('deletes town metadata and tiles, preserves the planet, and can restore the full town', async () => {
        const w = await loadWorld('delete-town', 'A'), terrain = createTerrain();
        w.region = createRegion('hills', 34); publish(w, terrain); w.revision = await saveWorld(w);
        const before = cloneWorld(w); w.region = null; publish(w, terrain); w.revision = await saveWorld(w);
        const loaded = await loadWorld('delete-town', 'A'); expect(loaded.region).toBeNull(); expect(loaded.doc.settlement).toBeUndefined();
        expect(loaded.globe).toEqual(before.globe); expect(loaded.doc.name).toBe(before.doc.name);
        const raw = JSON.parse(await recoveryBackup('delete-town')); expect(raw.records[1]).toEqual([]); expect(raw.records[2]).toEqual([]);
        const restored = await restoreCheckpoint('delete-town'); expect(restored.region).toEqual(before.region);
        expect(restored.doc.settlement).toEqual(before.doc.settlement);
    });
    it('persists and exports floors and architectural style without changing legacy defaults', async () => { const w = await loadWorld('floors-save', 'A'); w.region = createRegion('meadow', 42); w.region.height.fill(1); placeBuilding(w.region, { type: 'home', x: 10, z: 10, yaw: 1, roof: 0, color: '#f2a879', floors: 6, style: 2 }); w.revision = await saveWorld(w); const restored = await loadWorld('floors-save', 'A'); const imported = importWorld(exportWorld(restored), 'floors-copy', 0); expect(restored.region?.buildings[0]).toMatchObject({ floors: 6, style: 2, yaw: 1 }); expect(imported.region?.buildings).toEqual(restored.region?.buildings); });
    it('migrates V1 once, preserves its raw backup and all authored fields', async () => {
        const t = createTerrain(); randomizeTerrain(t, 99, .02); const d = { version: 1, name: 'Hành tinh cũ', ...serializeTerrain(t), seaLevel: .02, cosmetics: { ...DEFAULT_COSMETICS, rings: true }, showInSolar: false, updatedAt: '2026-01-01' }, raw = JSON.stringify(d); storage.set('planet_maker_v1_legacy-a', raw);
        const w = await loadWorld('legacy-a', 'A'); expect(w.doc).toEqual(d); expect(w.globe.trees).toEqual(t.trees); expect(w.revision).toBe(1); expect((await loadWorld('legacy-a', 'A')).revision).toBe(1); expect(storage.get('planet_maker_v1_legacy-a')).toBe(raw); expect(await recoveryBackup('legacy-a')).toContain('Hành tinh cũ');
    });
    it('handles two initial loaders (including StrictMode) without duplicating migration', async () => { const [a, b] = await Promise.all([loadWorld('double-load', 'A'), loadWorld('double-load', 'A')]); expect(a).toEqual(b); expect(a.revision).toBe(1); });
    it('refuses stale revision writes while keeping the winning world', async () => { const a = await loadWorld('conflict-a', 'A'), b = cloneWorld(a); a.doc.name = 'Winner'; a.revision = await saveWorld(a); b.doc.name = 'Stale'; await expect(saveWorld(b)).rejects.toBeInstanceOf(ConflictError); expect((await loadWorld('conflict-a', 'A')).doc.name).toBe('Winner'); });
    it('persists changed tiles, including shared boundaries, and leaves others unchanged', async () => { const w = await loadWorld('tiles-a', 'A'); w.region = createRegion('meadow', 42); w.revision = await saveWorld(w); w.region.height[32 * STRIDE + 32] += .2; const dirty = new Set<number>(); markTiles(16, 16, .5, dirty); w.revision = await saveWorld(w, dirty); expect((await loadWorld('tiles-a', 'A')).region).toEqual(w.region); });
    it('rolls back all stores when an object-store write fails', async () => { const w = await loadWorld('quota-a', 'A'), before = cloneWorld(w); w.region = createRegion('coast', 42); w.doc.name = 'Not committed'; const original = IDBObjectStore.prototype.put; vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(function (this: IDBObjectStore, value, key) { if (this.name === 'tiles') throw new DOMException('Test quota', 'QuotaExceededError'); return original.call(this, value, key); }); await expect(saveWorld(w)).rejects.toThrow('Test quota'); vi.restoreAllMocks(); expect(await loadWorld('quota-a', 'A')).toEqual(before); });
    it('restores the previous committed world from a bounded checkpoint', async () => { const w = await loadWorld('checkpoint-a', 'A'); w.region = createRegion('hills', 50); w.revision = await saveWorld(w); const before = cloneWorld(w); w.region.height.fill(5); w.doc.name = 'Latest'; w.revision = await saveWorld(w); const restored = await restoreCheckpoint('checkpoint-a'); expect(restored.doc).toEqual(before.doc); expect(restored.region).toEqual(before.region); expect(restored.revision).toBe(w.revision + 1); });
    it('does not replace corrupt V1 with a generated planet', async () => { storage.set('planet_maker_v1_corrupt-a', '{"version":1}'); await expect(loadWorld('corrupt-a', 'A')).rejects.toThrow(); expect(await loadPublishedPlanet('corrupt-a')).toBeNull(); expect(storage.get('planet_maker_v1_corrupt-a')).toBe('{"version":1}'); });
    it('keeps student worlds isolated and publishes only the small header', async () => { const a = await loadWorld('owner-a', 'A'), b = await loadWorld('owner-b', 'B'); a.doc.name = 'Only A'; a.revision = await saveWorld(a); expect((await loadWorld('owner-b', 'B')).doc).toEqual(b.doc); expect((await loadPublishedPlanet('owner-a'))?.name).toBe('Only A'); });
});
describe('stroke spacing', () => {
    it('produces the same samples for sparse and dense pointer events', () => { const sparse = new StrokeSampler(), dense = new StrokeSampler(); const a = [...sparse.sample([0, 0, 0], .5), ...sparse.sample([10, 0, 0], .5)]; const b = dense.sample([0, 0, 0], .5); for (let i = 1; i <= 100; i++) b.push(...dense.sample([i / 10, 0, 0], .5)); expect(b.length).toBe(a.length); for (let i = 0; i < a.length; i++) expect(b[i][0]).toBeCloseTo(a[i][0], 10); });
});
describe('shared edit timeline', () => {
    it('undoes interleaved globe and town edits in chronological order', () => { const t = new EditTimeline(); t.record('globe', { globe: 1, region: 0 }); t.record('region', { globe: 1, region: 1 }); t.record('globe', { globe: 2, region: 1 }); expect([t.travel(), t.travel(), t.travel()]).toEqual(['globe', 'region', 'globe']); expect([t.travel(true), t.travel(true), t.travel(true)]).toEqual(['globe', 'region', 'globe']); });
    it('removes commands evicted by each engine and clears branches', () => { const t = new EditTimeline(); t.record('globe', { globe: 1, region: 0 }); t.record('region', { globe: 1, region: 1 }); t.record('globe', { globe: 1, region: 1 }); expect(t.undo).toEqual(['region', 'globe']); t.travel(); t.record('region', { globe: 0, region: 2 }); expect(t.redo).toHaveLength(0); expect(t.undo).toEqual(['region', 'region']); });
});
