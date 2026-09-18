import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { createFarm, advanceTime } from '../src/core/engine';
import { LocalFarmGateway, LocalFarmRepository } from '../src/adapters/local';
import { renderSnapshot } from '../src/ui/renderSnapshot';
import { sceneryVisible } from '../src/render/sceneryVisibility';
import { readGraphicsQuality, saveGraphicsQuality, GRAPHICS_KEY } from '../src/ui/graphics';
import { vi } from 'vitest';

const now = 1800000000000;
describe('render snapshot stability', () => {
    it('keeps terrain references across clock ticks while timers keep advancing', () => {
        const initial = createFarm(now, 20260917);
        let current = initial;
        for (let second = 1; second <= 60; second++) {
            const snapshot = advanceTime(structuredClone(initial), now + second * 1000);
            current = renderSnapshot(current, snapshot);
            expect(current.world).toBe(initial.world);
            expect(current).toEqual(snapshot);
        }
    });
    it('invalidates only changed world fields, including same-seed imports', () => {
        const previous = createFarm(now, 20260917);
        const next = structuredClone(previous);
        next.world.heights[0] += .25;
        next.world.water[1] = 1 - next.world.water[1];
        next.world.owned.push(1);
        next.world.obstacles[0].cleared = true;
        next.world.bridges[0].built = true;
        const unchanged = structuredClone(previous), input = structuredClone(next);
        const result = renderSnapshot(previous, next);
        expect(result.world).not.toBe(previous.world);
        for (const key of ['heights', 'water', 'owned', 'obstacles', 'bridges'] as const) expect(result.world[key]).not.toBe(previous.world[key]);
        expect(result).toEqual(input);
        expect(previous).toEqual(unchanged);
        expect(next).toEqual(input);
        const changedClock = structuredClone(previous);
        changedClock.world.obstacles[0].readyAt = now + 5000;
        const resource = renderSnapshot(previous, changedClock);
        expect(resource.world.obstacles).not.toBe(previous.world.obstacles);
        expect(resource.world.heights).toBe(previous.world.heights);
        expect(resource.world.owned).toBe(previous.world.owned);
    });
    it('keeps the gateway and persisted save isolated from UI snapshots', async () => {
        const gateway = await LocalFarmGateway.open(new LocalFarmRepository('render-isolation-check'), () => now);
        try {
            const original = gateway.getSnapshot();
            const shared = renderSnapshot(original, gateway.getSnapshot());
            shared.world.heights[0] = 999;
            shared.world.obstacles[0].cleared = !shared.world.obstacles[0].cleared;
            expect(gateway.getSnapshot().world.heights[0]).not.toBe(999);
            expect(gateway.getSnapshot().world.obstacles[0].cleared).not.toBe(shared.world.obstacles[0].cleared);
        } finally { await gateway.close(); }
    });
});

describe('fog scenery visibility', () => {
    it('retains the reveal edge and excludes distant opaque territory without modifying the map', () => {
        expect(sceneryVisible([0], 8, 8)).toBe(true);
        expect(sceneryVisible([0], 24, 8)).toBe(true);
        expect(sceneryVisible([0], 80, 80)).toBe(false);
        const s = createFarm(now, 20260917), before = structuredClone(s.world);
        const all = s.world.obstacles.filter(o => !o.cleared);
        const visible = all.filter(o => sceneryVisible(s.world.owned, o.x + .5, o.z + .5));
        expect(visible.length).toBeLessThan(all.length / 2);
        expect(s.world).toEqual(before);
    });
    it('includes newly opened regions and all scenery once the entire map is open', () => {
        expect(sceneryVisible([0, 35], 90, 90)).toBe(true);
        const owned = Array.from({ length: 36 }, (_, i) => i);
        const s = createFarm(now, 20260917);
        expect(s.world.obstacles.every(o => sceneryVisible(owned, o.x, o.z))).toBe(true);
    });
});

describe('graphics preference', () => {
    it('defaults to soft lighting, remembers light mode and tolerates unavailable storage', () => {
        const values = new Map<string, string>();
        vi.stubGlobal('localStorage', { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) });
        try {
            expect(readGraphicsQuality()).toBe('soft');
            saveGraphicsQuality('light');
            expect(readGraphicsQuality()).toBe('light');
            values.set(GRAPHICS_KEY, 'invalid');
            expect(readGraphicsQuality()).toBe('soft');
            vi.stubGlobal('localStorage', { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } });
            expect(readGraphicsQuality()).toBe('soft');
            expect(() => saveGraphicsQuality('light')).not.toThrow();
        } finally { vi.unstubAllGlobals(); }
    });
});
