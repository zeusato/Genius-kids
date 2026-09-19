export const WORLD_SIZE = 96, CHUNK_SIZE = 16;
export const FAMILIES = ['streamside-forest', 'valley-lake', 'ore-hills-lake', 'rocky-terraces', 'river-crossing', 'lakeside-woodland'] as const;
export const BIOMES = ['forest', 'stone', 'ore'] as const;
export type Biome = typeof BIOMES[number];
export type Obstacle = {
    id: string;
    x: number;
    z: number;
    kind: 'tree' | 'rock' | 'ore' | 'berry';
    tier?: 1 | 2 | 3 | 4;
    generation?: number;
    cleared: boolean;
    readyAt?: number;
    claimed?: boolean;
};
export type World = {
    seed: number;
    version: 1 | 2;
    templateId?: 'lake-valley-v2';
    family: typeof FAMILIES[number];
    biome: Biome;
    heights: number[];
    water: number[];
    owned: number[];
    obstacles: Obstacle[];
    bridges: {
        id: string;
        x: number;
        z: number;
        built: boolean;
        readyAt?: number;
    }[];
};
export function random(seed: number) { let n = seed >>> 0; return () => { n += 0x6D2B79F5; let t = Math.imul(n ^ n >>> 15, 1 | n); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export const tileIndex = (x: number, z: number) => z * WORLD_SIZE + x;
export const chunkOf = (x: number, z: number) => Math.floor(z / 16) * 6 + Math.floor(x / 16);
export function chunkNeighbors(id: number) { return [id % 6 > 0 ? id - 1 : -1, id % 6 < 5 ? id + 1 : -1, id >= 6 ? id - 6 : -1, id < 30 ? id + 6 : -1].filter(n => n >= 0); }
export const heightAt = (w: World, x: number, z: number) => w.heights[tileIndex(Math.floor(x), Math.floor(z))] ?? 0;
export const isWater = (w: World, x: number, z: number) => w.water[tileIndex(x, z)] === 1;
export const ownedAt = (w: World, x: number, z: number) => x >= 0 && z >= 0 && x < 96 && z < 96 && w.owned.includes(chunkOf(x, z));
export const bridgeAt = (w: World, x: number, z: number) => w.bridges.some(b => b.built && x >= b.x && x < b.x + 6 && z >= b.z && z < b.z + 2);
const reachableCache = new WeakMap<World, Set<number>>();
export function invalidateReachability(w: World) { reachableCache.delete(w); }
/** Topological access on owned terrain, including bridge decks and gentle ramps. */
export function reachableTiles(w: World): Set<number> {
    const cached = reachableCache.get(w);
    if (cached)
        return cached;
    const blocked = new Set(w.obstacles.filter(o => !o.cleared).map(o => tileIndex(o.x, o.z))), seen = new Set<number>([0]), queue = [0];
    for (let k = 0; k < queue.length; k++) {
        const i = queue[k], x = i % 96, z = Math.floor(i / 96);
        for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nx = x + dx, nz = z + dz, n = tileIndex(nx, nz);
            if (seen.has(n) || !ownedAt(w, nx, nz) || blocked.has(n) || isWater(w, nx, nz) && !bridgeAt(w, nx, nz) || Math.abs(heightAt(w, x, z) - heightAt(w, nx, nz)) > .26)
                continue;
            seen.add(n);
            queue.push(n);
        }
    }
    reachableCache.set(w, seen);
    return seen;
}
export function canReachRegion(w: World, id: number): boolean {
    const reachable = reachableTiles(w), x0 = id % 6 * 16, z0 = Math.floor(id / 6) * 16;
    for (let z = z0; z < z0 + 16; z++)
        for (let x = x0; x < x0 + 16; x++) {
            if (isWater(w, x, z))
                continue;
            for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                const nx = x + dx, nz = z + dz;
                if (nx >= 0 && nz >= 0 && nx < 96 && nz < 96 && chunkOf(nx, nz) !== id && reachable.has(tileIndex(nx, nz)) && Math.abs(heightAt(w, x, z) - heightAt(w, nx, nz)) <= .26)
                    return true;
            }
        }
    return false;
}
/** Retained for save compatibility and migration regression fixtures. Never regenerate a saved world. */
export function generateLegacyWorld(seed: number): World {
    const rng = random(seed), family = FAMILIES[Math.floor(rng() * 6)], biome = BIOMES[Math.floor(rng() * 3)], phase = rng() * 6;
    const heights: number[] = [], water: number[] = [], obstacles: Obstacle[] = [];
    const familyIndex = FAMILIES.indexOf(family), river = 50 + Math.floor(rng() * 3), lakeX = 25 + Math.floor(rng() * 5), lakeZ = 42 + Math.floor(rng() * 5);
    for (let z = 0; z < 96; z++)
        for (let x = 0; x < 96; x++) {
            const start = x < 32 && z < 32;
            const bend = Math.min(1, Math.min(Math.abs(z - 20), Math.abs(z - 21), Math.abs(z - 68), Math.abs(z - 69)) / 8);
            const riverX = river + Math.round(Math.sin(z * (.055 + familyIndex * .009) + phase) * (2 + familyIndex * .6) * bend), lake = ((x - lakeX) / (8 + familyIndex % 3)) ** 2 + ((z - lakeZ) / (7 + Math.floor(familyIndex / 2))) ** 2 < 1;
            // Reserved straight bridge crossings and a flat, obstacle-free pier berth.
            const crossing = z >= 20 && z < 22 || z >= 68 && z < 70;
            const stream = !start && x > lakeX && x < riverX && Math.abs(z - (lakeZ + Math.round(Math.sin((x - lakeX) * .24) * 2))) <= 1;
            const wet = !start && (crossing ? x >= river && x < river + 4 : x >= riverX && x < riverX + 3) || lake || stream;
            const plateau = !start && !wet && x > 60 + familyIndex % 3 * 4 && z > 35 + (familyIndex % 2) * 12;
            const edge = Math.min(x % 16, 15 - x % 16, z % 16, 15 - z % 16);
            const h = plateau ? Math.min(1.5, Math.max(0, edge) * .25) : 0;
            heights.push(h);
            water.push(wet ? 1 : 0);
            const lane = x % 16 < 3 || z % 16 < 3 || crossing || x >= lakeX - 5 && x <= lakeX + 5 && z >= lakeZ - 10 && z <= lakeZ - 5;
            if (!wet && !lane && !(x < 24 && z < 24) && rng() < .075) {
                const p = rng();
                const kind = biome === 'forest' ? (p < .65 ? 'tree' : p < .92 ? 'rock' : 'ore') : biome === 'stone' ? (p < .25 ? 'tree' : p < .85 ? 'rock' : 'ore') : (p < .25 ? 'tree' : p < .55 ? 'rock' : 'ore');
                obstacles.push({ id: `o-${x}-${z}`, x, z, kind, cleared: false });
            }
        }
    // A deterministic landing: three land rows, then a straight three-wide water edge.
    for (let z = 36; z < 41; z++)
        for (let x = 24; x < 29; x++) {
            water[tileIndex(x, z)] = z >= 38 ? 1 : 0;
            heights[tileIndex(x, z)] = 0;
        }
    return { seed: seed >>> 0, version: 1, family, biome, heights, water, owned: [0, 1, 6, 7], obstacles: obstacles.filter(o => !(o.x >= 23 && o.x <= 29 && o.z >= 35 && o.z <= 41)), bridges: [{ id: 'bridge-north', x: river - 1, z: 20, built: false }, { id: 'bridge-south', x: river - 1, z: 68, built: false }] };
}
export function worldErrors(w: World): string[] {
    const errors: string[] = [];
    if (w.heights.length !== 9216 || w.water.length !== 9216)
        errors.push('dimensions');
    if (w.water.some(v => v !== 0 && v !== 1) || w.heights.some(v => !Number.isFinite(v) || v < 0 || v > 3))
        errors.push('terrain');
    for (let z = 0; z < 24; z++)
        for (let x = 0; x < 24; x++)
            if (isWater(w, x, z) || heightAt(w, x, z) !== 0)
                errors.push('start');
    if (![24, 25, 26].every(x => !isWater(w, x, 37) && isWater(w, x, 38)))
        errors.push('pier');
    if (new Set(w.obstacles.map(o => o.id)).size !== w.obstacles.length)
        errors.push('obstacle ids');
    if (w.obstacles.some(o => !o.cleared && o.x < 24 && o.z < 24)) errors.push('blocked start');
    if (w.version === 2) {
        if (w.templateId !== 'lake-valley-v2') errors.push('template');
        if (w.obstacles.some(o => isWater(w, o.x, o.z))) errors.push('obstacle water');
        if (new Set(w.bridges.map(b => b.id)).size !== w.bridges.length) errors.push('bridge ids');
        for (const b of w.bridges) {
            for (let dz = 0; dz < 2; dz++) {
                if (isWater(w, b.x, b.z + dz) || isWater(w, b.x + 5, b.z + dz)) errors.push('bridge banks');
                if (heightAt(w, b.x, b.z + dz) !== 0 || heightAt(w, b.x + 5, b.z + dz) !== 0) errors.push('bridge height');
            }
        }
    }
    return [...new Set(errors)];
}

/** One authored valley composition with bounded seed variation; chunks do not shape landforms. */
export function valleyLandAt(x: number, z: number, seed: number): boolean {
    const coastline = ((x - 46) / 65) ** 2 + ((z - 45) / 64) ** 2;
    const edge = 1 + .035 * Math.sin(x * .17 + seed % 17) + .025 * Math.cos(z * .21);
    const homeHeadland = ((x - 14) / 31) ** 2 + ((z - 14) / 31) ** 2 < 1;
    return coastline < edge || homeHeadland;
}
export function valleyShelfHeight(x: number, z: number, phase: number): number {
    const outline = ((x - 81) / 20) ** 2 + ((z - 29) / 25) ** 2;
    const ripple = .06 * Math.sin(z * .38 + phase) + .035 * Math.cos(x * .5);
    let h = outline < 1 + ripple ? 2.5 : 0;
    if (z >= 34 && z <= 39 && x >= 60 && x <= 80) h = Math.min(2.5, Math.max(0, (x - 63) * .25));
    return h;
}
export function generateWorld(seed: number): World {
    const rng = random(seed), family = FAMILIES[Math.floor(rng() * FAMILIES.length)], biome = BIOMES[Math.floor(rng() * BIOMES.length)];
    const phase = rng() * Math.PI * 2, river = 50 + Math.floor(rng() * 3);
    const lakeX = 27 + rng() * 2, lakeZ = 47 + rng() * 2;
    const lakeWidth = 13 + rng() * 3, lakeDepth = 11 + rng() * 2;
    const heights: number[] = [], water: number[] = [], obstacles: Obstacle[] = [];
    const forestCenters = [[12, 37, 10, 9], [13, 59, 13, 14], [36, 77, 15, 12], [65, 80, 13, 12], [87, 58, 9, 12]];
    const density = (x: number, z: number) => {
        let best = 0;
        for (const [cx, cz, rx, rz] of forestCenters) {
            if (Math.abs(x - cx) >= rx || Math.abs(z - cz) >= rz) continue;
            best = Math.max(best, 1 - ((x - cx) / rx) ** 2 - ((z - cz) / rz) ** 2);
        }
        return best;
    };
    for (let z = 0; z < WORLD_SIZE; z++) for (let x = 0; x < WORLD_SIZE; x++) {
        const start = x < 32 && z < 32;
        const crossingDistance = Math.min(Math.abs(z - 20), Math.abs(z - 21), Math.abs(z - 68), Math.abs(z - 69));
        const riverX = river + Math.round(Math.sin(z * .065 + phase) * 4 * Math.min(1, crossingDistance / 9));
        const crossing = z >= 20 && z <= 21 || z >= 68 && z <= 69;
        const lake = ((x - lakeX) / lakeWidth) ** 2 + ((z - lakeZ) / lakeDepth) ** 2 < 1
            || ((x - lakeX - 7) / 10) ** 2 + ((z - lakeZ - 3) / 8) ** 2 < 1;
        const streamZ = lakeZ + Math.sin((x - lakeX) * .18) * 3;
        const stream = x > lakeX && x < riverX && Math.abs(z - streamZ) < 1.6;
        const wet = !start && (!valleyLandAt(x, z, seed) || lake || stream || x >= riverX && x < riverX + (crossing ? 4 : 3));
        // One broad rocky shelf, with a deliberately reserved approach from the western meadow.
        const h = !wet && !start ? valleyShelfHeight(x, z, phase) : 0;
        heights.push(h);
        water.push(wet ? 1 : 0);
    }
    // The permanent landing is kept compatible with the pier rule and existing QA tooling.
    for (let z = 35; z <= 42; z++) for (let x = 23; x <= 29; x++) {
        water[tileIndex(x, z)] = z >= 38 ? 1 : 0;
        heights[tileIndex(x, z)] = 0;
    }
    for (let z = 0; z < WORLD_SIZE; z++) for (let x = 0; x < WORLD_SIZE; x++) {
        const i = tileIndex(x, z), h = heights[i];
        if (water[i] || x < 24 && z < 24) continue;
        const crossing = Math.abs(z - 20.5) < 2 || Math.abs(z - 68.5) < 2;
        const trail = Math.abs(x - (14 + Math.sin(z * .11) * 2)) < 1.6;
        const landing = x >= 22 && x <= 30 && z <= 42;
        const ramp = z >= 33 && z <= 40 && x >= 58 && x <= 84;
        const shelfTrail = h > 0 && Math.abs(x - 81) < 2;
        if (crossing || trail || landing || ramp || shelfTrail) continue;
        // Keep objects rooted on a flat tile and away from the edge of the shelf.
        if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) =>
            x + dx >= 0 && x + dx < 96 && z + dz >= 0 && z + dz < 96 && heights[tileIndex(x + dx, z + dz)] !== h)) continue;
        const cluster = density(x, z), chance = h > 0 ? .19 : .058 + cluster * .43;
        if (rng() > chance) continue;
        const p = rng(), treeChance = h > 0 ? .2 : biome === 'forest' ? .86 : .67;
        const kind = p < treeChance ? 'tree' : p < (biome === 'ore' ? .81 : .95) ? 'rock' : 'ore';
        obstacles.push({ id: `o-${x}-${z}`, x, z, kind, cleared: false });
    }
    // Guaranteed tier-one reserves on two edges of the starter clearing. Leave
    // a free ring around each deposit so every node can be worked immediately.
    // This runs only for NEW worlds; saved layouts are never regenerated.
    const starter: Obstacle[] = [];
    const sites = [3, 6, 9, 12, 15];
    for (const [i, n] of sites.entries()) {
        for (const [x, z, kind] of [
            [25, n, 'tree'], [28, n, i < 3 ? 'tree' : 'ore'],
            [n, 25, 'rock'], [n, 28, i < 3 ? 'rock' : 'ore'],
        ] as const) starter.push({ id: `o-${x}-${z}`, x, z, kind, tier: 1, cleared: false });
    }
    for (let i = obstacles.length - 1; i >= 0; i--)
        if (starter.some(p => Math.abs(p.x - obstacles[i].x) <= 1 && Math.abs(p.z - obstacles[i].z) <= 1)) obstacles.splice(i, 1);
    obstacles.push(...starter);
    return { seed: seed >>> 0, version: 2, templateId: 'lake-valley-v2', family, biome, heights, water, owned: [0, 1, 6, 7], obstacles,
        bridges: [{ id: 'bridge-north', x: river - 1, z: 20, built: false }, { id: 'bridge-south', x: river - 1, z: 68, built: false }] };
}

/** A blocked tile may be worked from an adjacent reachable tile at the same height. */
export function canWorkTile(w: World, x: number, z: number): boolean {
    const reachable = reachableTiles(w);
    if (reachable.has(tileIndex(x, z))) return true;
    return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => {
        const nx = x + dx, nz = z + dz;
        return nx >= 0 && nx < 96 && nz >= 0 && nz < 96 && reachable.has(tileIndex(nx, nz)) && Math.abs(heightAt(w, nx, nz) - heightAt(w, x, z)) <= .26;
    });
}
