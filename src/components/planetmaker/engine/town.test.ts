import { describe, expect, it } from 'vitest';
import { cloneRegion, createRegion, placeBuilding, Region, RegionHistory, STRIDE, validateRegion } from './region';
import { regenerateTown, TownHistory } from './town';
import { EditTimeline } from './timeline';

function town() {
    const r = createRegion('meadow', 42); r.height.fill(1); r.name = 'Nhà của em'; r.marker = [1, 0, 0];
    placeBuilding(r, { type: 'school', x: 10, z: 10, yaw: 1, roof: 0, color: '#f2a879', floors: 4, style: 2 });
    r.roads[14 * 64 + 11] = 1; return r;
}
describe('town regeneration and lifecycle', () => {
    it('keeps buildings, roads, identity and foundations while changing terrain', () => {
        const current = town(), before = cloneRegion(current), generated = createRegion('ice', 63);
        generated.trees.push({ id: 9999, x: 11, z: 11, scale: 1 });
        const next = regenerateTown(current, generated, true);
        expect(next).toMatchObject({ name: current.name, marker: current.marker, preset: 'ice', seed: 63, buildings: current.buildings, nextId: current.nextId });
        expect(next.roads).toEqual(current.roads); expect(next.height[21 * STRIDE + 21]).toBe(1);
        expect(next.height[0]).toBe(generated.height[0]); expect(next.trees.some(t => t.id === 9999)).toBe(false);
        expect(current).toEqual(before); expect(next.height).not.toBe(current.height); validateRegion(next);
    });
    it('can start fresh without keeping construction and undo restores exact old terrain', () => {
        const current = town(), before = cloneRegion(current), h = new RegionHistory(); h.begin(current);
        Object.assign(current, regenerateTown(current, createRegion('desert', 71), false)); h.commit(current, 'regenerate');
        expect(current.buildings).toHaveLength(0); expect(current.roads.some(Boolean)).toBe(false);
        expect(current.preset).toBe('desert'); h.travel(current); expect(current).toEqual(before);
        h.travel(current, true); expect(current.preset).toBe('desert'); validateRegion(current);
    });
    it('undoes edits, deletion and recreation in chronological order without applying old diffs to a new town', () => {
        let r: Region | null = town(); const before = cloneRegion(r), h = new RegionHistory(), life = new TownHistory(), timeline = new EditTimeline();
        const record = (scope: 'region' | 'town') => timeline.record(scope, { region: h.undoStack.length, town: life.undoStack.length });
        h.begin(r); r.name = 'Tên mới'; h.commit(r, 'rename'); record('region');
        life.record(r); r = null; record('town'); life.record(null); r = createRegion('coast', 90); record('town');
        const travel = (redo = false) => { const scope = timeline.travel(redo); if (scope === 'town') r = life.travel(r, redo)!; else if (scope === 'region') h.travel(r!, redo); };
        travel(); expect(r).toBeNull(); travel(); expect(r!.name).toBe('Tên mới'); travel(); expect(r).toEqual(before);
        travel(true); travel(true); expect(r).toBeNull(); travel(true); expect(r!.preset).toBe('coast');
    });
    it('bounds snapshots and removes timeline entries before an evicted town boundary', () => {
        const h = new TownHistory(), timeline = new EditTimeline();
        timeline.record('region', { region: 1 });
        for (let i = 0; i < 9; i++) { h.record(i % 2 ? null : town()); timeline.record('town', { town: h.undoStack.length, region: 1 }); }
        expect(h.undoStack).toHaveLength(8); expect(timeline.undo).toEqual(Array(8).fill('town'));
    });
});
