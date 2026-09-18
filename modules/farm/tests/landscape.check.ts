import { describe, expect, it } from 'vitest';
import { landcoverAt, explorationDistance, LANDCOVER } from '../src/core/landcover';
import { createFarm, execute, advanceTime, placementError } from '../src/core/engine';
import { generateWorld, generateLegacyWorld, worldErrors, reachableTiles, tileIndex, heightAt } from '../src/core/world';
import { parseBackup, serializeBackup } from '../src/core/validation';
import { createLandscapeGeometry } from '../src/render/landscapeGeometry';
import { NATURAL_VARIANTS, obstacleVariant } from '../src/core/scenery';
import { readFileSync } from 'node:fs';

describe('authored valley and safe old saves', () => {
    it('keeps a single connected upper shelf across storage chunk boundaries with usable flat land', () => {
        const w = generateWorld(20260917);
        expect(w.version).toBe(2);
        expect(heightAt(w, 80, 29)).toBe(2.5);
        expect(heightAt(w, 79, 29)).toBe(2.5);
        expect(heightAt(w, 81, 29)).toBe(2.5);
        expect(w.heights.filter(h => h === 2.5).length).toBeGreaterThan(800);
        // The old repeated pyramids occupied the foreground; this is now a continuous meadow.
        expect(w.heights.slice(72 * 96 + 64, 72 * 96 + 96).every(h => h === 0)).toBe(true);
        for (let x = 63; x <= 73; x++) expect(heightAt(w, x, 36)).toBe((x - 63) * .25);
    });
    it('round-trips a version-one world without moving terrain, obstacles, jobs or possessions', () => {
        const s = createFarm(1800000000000, 20260917);
        s.world = generateLegacyWorld(20260917);
        const before = structuredClone(s);
        expect(parseBackup(serializeBackup(s))).toEqual(before);
        expect(s).toEqual(before);
    });
    it('rejects water obstacles and broken bridge banks in a new valley', () => {
        const w = generateWorld(4), index = w.water.findIndex(v => v === 1);
        w.obstacles.push({ id: `o-${index % 96}-${Math.floor(index / 96)}`, x: index % 96, z: Math.floor(index / 96), kind: 'tree', cleared: false });
        expect(worldErrors(w)).toContain('obstacle water');
        const b = w.bridges[0]; w.water[tileIndex(b.x, b.z)] = 1;
        expect(worldErrors(w)).toContain('bridge banks');
    });
    it('gates building and clearing across the river until a real bridge job completes', () => {
        let s = createFarm(1800000000000, 20260917);
        s.entities.forEach(e => e.level = 25); s.coins = 100000; s.inventory.plank = 6; s.inventory.stone = 4;
        for (const chunk of [2, 3, 8, 9]) { const r = execute(s, { type: 'expand', chunk }); expect(r.ok, r.message).toBe(true); s = r.state; }
        let target: { x: number; z: number } | undefined;
        for (let z = 0; z < 16 && !target; z++) for (let x = 56; x < 64 && !target; x++)
            if (!placementError(s, x, z, 1, 1, undefined, 'bench', 0, false) && !reachableTiles(s.world).has(tileIndex(x, z))) target = { x, z };
        expect(target).toBeDefined();
        expect(execute(s, { type: 'build', asset: 'bench', ...target!, rotation: 0 }).ok).toBe(false);
        const obstacle = s.world.obstacles.find(o => o.x >= 56 && o.x < 64 && o.z < 32);
        if (obstacle) expect(execute(s, { type: 'clear', obstacleId: obstacle.id, pay: 'auto' }).ok).toBe(false);
        const bridge = execute(s, { type: 'bridge', bridgeId: s.world.bridges[0].id }); expect(bridge.ok, bridge.message).toBe(true);
        s = advanceTime(bridge.state, s.lastWallTime + 300001);
        expect(reachableTiles(s.world).has(tileIndex(target!.x, target!.z))).toBe(true);
        const build = execute(s, { type: 'build', asset: 'bench', ...target!, rotation: 0 }); expect(build.ok, build.message).toBe(true);
    });
});

describe('shore geometry', () => {
    it('builds finite water and closed banks using the exact ground intersections', () => {
        const g = createLandscapeGeometry(generateWorld(20260917));
        const ground = g.land.getAttribute('position'), banks = g.banks.getAttribute('position'), water = g.water.getAttribute('position');
        const groundPoints = new Set<string>();
        for (let i = 0; i < ground.count; i++) groundPoints.add(`${ground.getX(i)},${ground.getZ(i)}`);
        expect(g.shoreSegments).toBeGreaterThan(200);
        for (const geo of [g.land, g.banks, g.water]) expect(Array.from(geo.getAttribute('position').array).every(Number.isFinite)).toBe(true);
        // Aggregate across every vertex without creating tens of thousands of assertion objects.
        const detachedBanks: number[] = [], incorrectWater: number[] = [];
        for (let i = 0; i < banks.count; i++) if (!groundPoints.has(`${banks.getX(i)},${banks.getZ(i)}`)) detachedBanks.push(i);
        for (let i = 0; i < water.count; i++) if (Math.abs(water.getY(i) + .3) >= 1e-5) incorrectWater.push(i);
        expect(detachedBanks).toEqual([]);
        expect(incorrectWater).toEqual([]);
        for (const geo of [g.land, g.water]) {
            const distances = geo.getAttribute('shoreDistance');
            expect(distances.count).toBe(geo.getAttribute('position').count);
            expect(Array.from(distances.array).every(d => Number.isFinite(d) && d >= 0 && d <= 4)).toBe(true);
        }
        // Low banks meet the water plane instead of leaving a visible vertical lip.
        const raisedLip: number[] = [];
        for (let i = 0; i < banks.count; i++) if (banks.getY(i) > -.299 && banks.getY(i) < 0) raisedLip.push(i);
        expect(raisedLip).toEqual([]);
        g.land.dispose(); g.banks.dispose(); g.water.dispose();
    });
    it('preserves logical terrain, bridge sites and saved coastlines when rendering old and new worlds', () => {
        for (const world of [generateLegacyWorld(42), generateWorld(4), generateWorld(8)]) {
            const before = structuredClone(world), meshes = createLandscapeGeometry(world);
            expect(world).toEqual(before);
            const wet = meshes.water.getAttribute('position'), distances = meshes.water.getAttribute('shoreDistance');
            let edge = 0, interior = 0;
            for (let i = 0; i < wet.count; i++) { if (distances.getX(i) < 1e-5) edge++; if (distances.getX(i) > 1) interior++; }
            expect(edge).toBeGreaterThan(100); expect(interior).toBeGreaterThan(100);
            meshes.land.dispose(); meshes.water.dispose(); meshes.banks.dispose();
        }
    });
});

describe('natural resource art', () => {
    it('ships seven distinct trees and seven stones/ores with native alpha', () => {
        const variants = Object.entries(NATURAL_VARIANTS).filter(([id]) => id !== 'berry').map(([, v]) => v);
        expect(variants.filter(v => v.tree)).toHaveLength(7);
        expect(variants.filter(v => !v.tree)).toHaveLength(7);
        expect(new Set(variants.map(v => v.file)).size).toBe(14);
        for (const variant of variants) {
            const png = readFileSync(new URL(`../src/assets/terrain/${variant.file}`, import.meta.url));
            expect(png.subarray(1, 4).toString()).toBe('PNG');
            expect(png[25]).toBe(6); // RGBA: not a fake checkerboard or opaque background.
        }
    });
    it('assigns stable ecological variants without mutating the persisted obstacle', () => {
        const seen = new Set<string>();
        for (let seed = 0; seed < 15; seed++) {
            const w = generateWorld(seed), before = structuredClone(w.obstacles);
            for (const o of w.obstacles) {
                const variant = obstacleVariant(w, o); seen.add(variant);
                expect(obstacleVariant(w, { ...o })).toBe(variant);
                if (o.kind === 'ore') expect(variant).toBe('iron');
            }
            expect(w.obstacles).toEqual(before);
        }
        expect(seen.size).toBe(14);
    });
});

describe('ground cover and exploration visibility', () => {
    it('uses distinct terrain regions without mutating the world', () => {
        const w = generateWorld(20260917), before = structuredClone(w), seen = new Set<string>();
        for (let z = 0; z < 96; z++) for (let x = 0; x < 96; x++) if (!w.water[z * 96 + x]) seen.add(landcoverAt(w, x, z));
        expect([...seen].sort()).toEqual(Object.keys(LANDCOVER).sort());
        expect(w).toEqual(before);
    });
    it('reveals owned regions and never hides land when another region is opened', () => {
        const start = [0, 1, 6, 7], expanded = [...start, 2];
        expect(explorationDistance(start, 10, 10)).toBe(0);
        expect(explorationDistance(start, 85, 85)).toBeGreaterThan(50);
        expect(explorationDistance(start, 40, 8)).toBe(8);
        expect(explorationDistance(expanded, 40, 8)).toBe(0);
        for (let z = 0; z < 96; z += 5) for (let x = 0; x < 96; x += 5) expect(explorationDistance(expanded, x, z)).toBeLessThanOrEqual(explorationDistance(start, x, z));
        expect(explorationDistance(Array.from({length:36},(_,i)=>i),95,95)).toBe(0);
    });
});
