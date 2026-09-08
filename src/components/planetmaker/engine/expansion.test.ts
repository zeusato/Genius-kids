import { describe, expect, it } from 'vitest';
import { brush, BUILDINGS, cloneRegion, createRegion, DEFAULT_LIMITS, FLOOR_LIMITS, GraphicsQuality, limitsOf, placeBuilding, RegionHistory, roadCount, roadLine, simulate, validateRegion } from './region';
import { vehicleRoutes, routePosition } from './traffic';
import { vehicleParts } from '../rendering/vehicleModels';
import { environmentInstances } from '../rendering/environment';
import { buildingInstances, Shape } from '../rendering/architecture';
import { shapeGeometry } from '../rendering/Instances';
import { regenerateTown } from './town';

const flat = () => { const r = createRegion('meadow', 42); r.height.fill(1); r.trees = []; return r; };
describe('expanded town catalog and configurable limits', () => {
    it('supports all new types with floors, styles, placement and validation', () => {
        for (const type of ['hospital', 'library', 'market', 'firestation', 'cafe', 'wind'] as const) {
            const r = flat(), b = placeBuilding(r, { type, x: 10, z: 10, yaw: 1, floors: FLOOR_LIMITS[type], style: 2, roof: 0, color: BUILDINGS[type].color })!;
            expect(b).toBeTruthy(); expect(Object.values(buildingInstances(b)).flat().length).toBeGreaterThan(5); validateRegion(r);
        }
    });
    it('wind power serves the connected road network', () => {
        const r = flat(); placeBuilding(r, { type: 'wind', x: 10, z: 10, yaw: 0, roof: 0, color: '#c9e0d9' }); roadLine(r, 11, 13, 15, 13);
        expect(simulate(r).networks[0].power).toBe(18);
    });
    it('reads legacy defaults, preserves existing objects when lowering limits, and blocks new additions', () => {
        const r = flat(); expect(limitsOf(r)).toEqual(DEFAULT_LIMITS); roadLine(r, 1, 1, 10, 1);
        r.limits = { trees: 0, roads: 4, vehicles: 0 }; roadLine(r, 10, 1, 20, 1); brush(r, 'forest', 20, 20, 3, .2, 1, 20);
        expect(roadCount(r)).toBe(10); expect(r.trees).toHaveLength(0); validateRegion(r);
        roadLine(r, 1, 1, 8, 1, true); roadLine(r, 11, 1, 20, 1); expect(roadCount(r)).toBe(4);
    });
    it('enforces an exact road cap across one drag and a tree cap across brush samples', () => {
        const r = flat(); r.limits = { trees: 5, roads: 7, vehicles: 6 }; roadLine(r, 0, 0, 63, 63);
        for (let i = 0; i < 10; i++) brush(r, 'forest', 20, 20, 4, .2, 1, i);
        expect(roadCount(r)).toBe(7); expect(r.trees).toHaveLength(5);
    });
    it('undoes newly introduced settings and clones limits independently', () => {
        const r = flat(), h = new RegionHistory(); h.begin(r); r.limits = { trees: 3000, roads: 500, vehicles: 24 }; r.graphics = 'detailed'; h.commit(r, 'limits');
        const copy = cloneRegion(r); copy.limits!.trees = 0; expect(r.limits.trees).toBe(3000);
        h.travel(r); expect(r.limits).toBeUndefined(); expect(r.graphics).toBeUndefined(); h.travel(r, true); expect(r.limits?.trees).toBe(3000); expect(r.graphics).toBe('detailed');
    });
    it('rejects invalid persisted limits and quality', () => {
        for (const limits of [{ trees: 5001, roads: 20, vehicles: 8 }, { trees: 20, roads: 4097, vehicles: 8 }, { trees: 20, roads: 20, vehicles: 25 }, { trees: -1, roads: 0, vehicles: 0 }]) { const r = flat(); r.limits = limits; expect(() => validateRegion(r)).toThrow(); }
        const r = flat(); r.graphics = 'ultra' as GraphicsQuality; expect(() => validateRegion(r)).toThrow();
    });
    it('regeneration respects limits and keeps generated IDs valid when the old town had fewer trees', () => {
        const r = flat(); r.nextId = 1; r.limits = { trees: 12, roads: 50, vehicles: 6 }; r.graphics = 'detailed';
        const next = regenerateTown(r, createRegion('meadow', 77), true); expect(next.trees.length).toBeLessThanOrEqual(12); expect(next.graphics).toBe('detailed'); validateRegion(next);
    });
    it('provides six distinct vehicle models and respects traffic caps on dry connected roads', () => {
        expect(new Set(Array.from({ length: 6 }, (_, i) => JSON.stringify(vehicleParts(i)))).size).toBe(6);
        const r = flat(); placeBuilding(r, { type: 'home', x: 10, z: 10, yaw: 0, roof: 0, color: '#f2a879' }); roadLine(r, 11, 12, 25, 12);
        r.limits = { trees: 5000, roads: 4096, vehicles: 24 }; const routes = vehicleRoutes(r); expect(routes).toHaveLength(24);
        for (const route of routes) for (let t = 0; t < 60; t += .3) { const p = routePosition(route, t, .12); expect(r.roads[Math.floor(p.z) * 64 + Math.floor(p.x)]).toBe(1); }
        r.limits.vehicles = 0; expect(vehicleRoutes(r)).toHaveLength(0); r.limits.vehicles = 8; r.seaLevel = 2; expect(vehicleRoutes(r)).toHaveLength(0);
    });
    it('quantifies geometry budgets at each quality without changing terrain resolution', () => {
        const r = flat(); r.roads.fill(1, 0, 300); r.trees = Array.from({ length: 1000 }, (_, i) => ({ id: i + 1, x: i % 50 + .5, z: Math.floor(i / 50) + 10, scale: 1 }));
        const report: Record<string, unknown> = {}; const triangles: Record<string, number> = {};
        for (const quality of ['light', 'balanced', 'detailed'] as const) {
            const parts = environmentInstances(r, quality); let count = 0;
            for (const [shape, items] of Object.entries(parts)) { const geo = shapeGeometry(shape as Shape); count += items.length * (geo.index ? geo.index.count : geo.getAttribute('position').count) / 3; geo.dispose(); }
            triangles[quality] = count; report[quality] = { instances: Object.values(parts).flat().length, triangles: count, batches: Object.values(parts).filter(v => v.length).length };
        }
        expect(triangles.light).toBeLessThan(triangles.balanced); expect(triangles.balanced).toBeLessThan(triangles.detailed);
        if (process.env.PLANET_BUDGET) console.log('ENVIRONMENT_BUDGET_1000_TREES_300_ROADS', JSON.stringify(report));
    });
});
