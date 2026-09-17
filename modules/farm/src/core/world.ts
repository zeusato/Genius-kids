export const WORLD_SIZE = 96, CHUNK_SIZE = 16;
export const FAMILIES = ['streamside-forest', 'valley-lake', 'ore-hills-lake', 'rocky-terraces', 'river-crossing', 'lakeside-woodland'] as const;
export const BIOMES = ['forest', 'stone', 'ore'] as const;
export type Biome = typeof BIOMES[number];
export type Obstacle = {
    id: string;
    x: number;
    z: number;
    kind: 'tree' | 'rock' | 'ore';
    cleared: boolean;
    readyAt?: number;
    claimed?: boolean;
};
export type World = {
    seed: number;
    version: 1;
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
export function generateWorld(seed: number): World {
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
    return [...new Set(errors)];
}
