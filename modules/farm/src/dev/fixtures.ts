import { ASSETS, CROPS, ITEMS, type AssetId, type ItemId } from '../core/catalog';
import { createFarm, dimensions, placementError } from '../core/engine';

/** Development showcase only. Never modifies or loads the player's garden. */
export function showcaseFarm(level: number, now: number) {
    const s = createFarm(now, 20260917);
    s.entities.forEach(e => e.level = level);
    if (level === 1) return s;
    s.coins = 1000000; s.legacyStorageCap = 100000;
    s.clock = Math.max(...Object.values(CROPS).map(c => c.seconds)) * 1000 + 600000;
    for (const id of Object.keys(ITEMS)) s.inventory[id as ItemId] = 500;
    s.world.owned = Array.from({ length: 36 }, (_, i) => i); s.stats.explore = 36;
    s.world.bridges.forEach(b => b.built = true);
    // A deliberately cleared exhibition district; this is not the start-state generator.
    s.world.obstacles.forEach(o => { if (o.x < 46 && o.z < 33) { o.cleared = true; o.claimed = true; } });
    s.plots = [];
    const crops = Object.keys(CROPS) as (keyof typeof CROPS)[];
    for (const [ox, oz] of [[3, 14], [11, 14], [3, 21], [11, 21]])
        for (let z = oz; z < oz + 5; z++) for (let x = ox; x < ox + 6; x++) {
            const crop = crops[Math.floor(s.plots.length / Math.max(1, Math.floor(120 / crops.length))) % crops.length];
            s.plots.push({ id: `plot-${s.nextId++}`, x, z, crop, plantedAt: s.clock - CROPS[crop].seconds * 1000, readyAt: s.clock - 1, watered: false });
        }
    const padFree = (x: number, z: number, w: number, d: number) =>
        !s.entities.some(e => { const [ew, ed] = dimensions(e.asset, e.rotation); return !e.stored && x - 1 < e.x + ew && x + w + 1 > e.x && z - 1 < e.z + ed && z + d + 1 > e.z; }) &&
        !s.plots.some(p => x - 1 < p.x + 1 && x + w + 1 > p.x && z - 1 < p.z + 1 && z + d + 1 > p.z);
    for (const [id, spec] of Object.entries(ASSETS)) {
        if (spec.kind !== 'building' || id === 'home' || id === 'warehouse' || id === 'fishing_pier') continue;
        const asset = id as AssetId, [w, d] = dimensions(asset, 0);
        let placed = false;
        for (let z = 2; z <= 32 && !placed; z += 6) for (let x = 2; x <= 44 && !placed; x += 6) {
            if (!padFree(x, z, w, d) || placementError(s, x, z, w, d, undefined, asset)) continue;
            s.entities.push({ id: `entity-${s.nextId++}`, asset, x, z, rotation: 0, level, queue: [], output: {} }); placed = true;
        }
        if (!placed) throw new Error(`Showcase layout has no reserved site for ${asset}`);
    }
    s.entities.push({ id: `entity-${s.nextId++}`, asset: 'fishing_pier', x: 24, z: 37, rotation: 0, level, queue: [], output: {} });
    // Connecting paths stay outside plots and buildings. Repeated decor carries no gameplay state.
    for (const z of [6, 12, 19, 26, 32]) for (let x = 1; x <= 44; x++) if (!placementError(s, x, z, 1, 1, undefined, 'path'))
        s.entities.push({ id: `entity-${s.nextId++}`, asset: 'path', x, z, rotation: 0, level: 1, queue: [], output: {} });
    return s;
}
