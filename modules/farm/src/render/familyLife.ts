import { ASSETS } from '../core/catalog';
import type { FarmState } from '../core/types';
import { bridgeAt, heightAt, isWater, ownedAt, random, tileIndex, WORLD_SIZE } from '../core/world';

export type Pastime = 'look' | 'tend' | 'wave' | 'rest' | 'knock';
type Visit = { tile: number; x: number; z: number; activity: Pastime };
export type Garden = { open: Uint8Array; heights: Float32Array; visits: Visit[]; tiles: number[] };
export type Walker = {
    x: number; z: number; y: number; heading: number; facing: number; time: number;
    path: number[]; cursor: number; pause: number; activity: Pastime; visit?: Visit;
    rng: () => number; visible: boolean; walking: boolean; greeting: number;
};
const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const center = (tile: number) => ({ x: tile % WORLD_SIZE + .5, z: Math.floor(tile / WORLD_SIZE) + .5 });

/** Built only when layout changes, never on the per-second game clock. */
export function familyGarden(s: FarmState): Garden {
    const open = new Uint8Array(WORLD_SIZE ** 2), heights = new Float32Array(open.length), visits: Visit[] = [];
    for (const chunk of s.world.owned) {
        const x0 = chunk % 6 * 16, z0 = Math.floor(chunk / 6) * 16;
        for (let z = z0; z < z0 + 16; z++) for (let x = x0; x < x0 + 16; x++) {
            const i = tileIndex(x, z), bridge = bridgeAt(s.world, x, z);
            open[i] = Number(!isWater(s.world, x, z) || bridge);
            heights[i] = bridge ? .15 : heightAt(s.world, x, z);
        }
    }
    for (const o of s.world.obstacles) if (!o.cleared) open[tileIndex(o.x, o.z)] = 0;
    for (const p of s.plots) open[tileIndex(p.x, p.z)] = 0;
    for (const e of s.entities) if (!e.stored && e.asset !== 'path') {
        const a = ASSETS[e.asset], w = e.rotation % 2 ? a.depth : a.width, d = e.rotation % 2 ? a.width : a.depth;
        for (let z = e.z; z < e.z + d; z++) for (let x = e.x; x < e.x + w; x++) open[tileIndex(x, z)] = 0;
    }
    const visit = (x: number, z: number, w: number, d: number, activity: Pastime) => {
        for (let pz = z - 1; pz <= z + d; pz++) for (let px = x - 1; px <= x + w; px++) {
            if (px >= x && px < x + w && pz >= z && pz < z + d || !ownedAt(s.world, px, pz)) continue;
            if (px < x || px >= x + w) { if (pz < z || pz >= z + d) continue; }
            const tile = tileIndex(px, pz);
            if (open[tile]) visits.push({ tile, x: x + w / 2, z: z + d / 2, activity });
        }
    };
    for (const e of s.entities) if (!e.stored && e.asset !== 'path') {
        const a = ASSETS[e.asset];
        visit(e.x, e.z, e.rotation % 2 ? a.depth : a.width, e.rotation % 2 ? a.width : a.depth, e.asset === 'bench' ? 'rest' : a.kind === 'decor' ? 'look' : 'knock');
    }
    for (const p of s.plots) visit(p.x, p.z, 1, 1, 'tend');
    for (const o of s.world.obstacles) if (!o.cleared && ownedAt(s.world, o.x, o.z)) visit(o.x, o.z, 1, 1, o.kind === 'berry' || o.kind === 'tree' ? 'tend' : 'look');
    return { open, heights, visits, tiles: [...open.keys()].filter(i => open[i]) };
}

/** Layout edits can occupy a villager's former tile. Relocate only then. */
export function relocateWalker(w: Walker, garden: Garden, x = w.x, z = w.z) {
    const old = tileIndex(Math.floor(x), Math.floor(z));
    let tile = garden.open[old] && x >= 0 && z >= 0 && x < 96 && z < 96 ? old : -1;
    if (tile < 0) {
        let distance = Infinity;
        for (const candidate of garden.tiles) { const p = center(candidate), d = (p.x - x) ** 2 + (p.z - z) ** 2; if (d < distance) { distance = d; tile = candidate; } }
    }
    w.visible = tile >= 0; w.path = []; w.cursor = 0; w.walking = false; w.visit = undefined;
    w.pause = .5 + w.rng(); w.activity = 'look';
    if (tile >= 0) { const p = center(tile); w.x = p.x; w.z = p.z; w.y = garden.heights[tile]; }
}
export function createWalker(garden: Garden, x: number, z: number, seed: number): Walker {
    const w: Walker = { x, z, y: 0, heading: .5, facing: .5, time: 0, path: [], cursor: 0, pause: 0, activity: 'look', rng: random(seed), visible: false, walking: false, greeting: 0 };
    relocateWalker(w, garden); w.pause = 1 + w.rng() * 4;
    return w;
}

/** Bounded flood-fill selects a visit AND a valid path. No straight-line movement
 * through scenery, closed fog, water, crops, buildings or cliff edges. */
export function planWalk(w: Walker, garden: Garden, reserved: Set<number> = new Set()) {
    const start = tileIndex(Math.floor(w.x), Math.floor(w.z));
    if (!w.visible || !garden.open[start]) return;
    const parents = new Map<number, number>([[start, -1]]), queue = [start];
    for (let n = 0; n < queue.length && queue.length < 600; n++) {
        const tile = queue[n], x = tile % 96, z = Math.floor(tile / 96);
        for (const [dx, dz] of directions) {
            const nx = x + dx, nz = z + dz, next = tileIndex(nx, nz);
            if (nx < 0 || nz < 0 || nx >= 96 || nz >= 96 || !garden.open[next] || parents.has(next) || Math.abs(garden.heights[next] - garden.heights[tile]) > .26) continue;
            parents.set(next, tile); queue.push(next);
        }
    }
    const visits = garden.visits.filter(v => v.tile !== start && parents.has(v.tile) && !reserved.has(v.tile));
    const visit = visits.length && w.rng() < .8 ? visits[Math.floor(w.rng() * visits.length)] : undefined;
    const possible = queue.filter(tile => tile !== start && !reserved.has(tile));
    const goal = visit?.tile ?? possible[Math.floor(w.rng() * possible.length)];
    w.pause = 4 + w.rng() * 6;
    if (goal === undefined) return;
    const path: number[] = [];
    for (let tile = goal; tile !== start; tile = parents.get(tile)!) path.push(tile);
    w.path = path.reverse(); w.cursor = 0; w.visit = visit; w.activity = visit?.activity ?? 'look';
    w.walking = true;
}

/** Delta is animation time, not game time: tab suspension does not fast-forward
 * a route. Ambient activity never executes economy commands or changes saves. */
export function stepWalker(w: Walker, garden: Garden, seconds: number, reserved: Set<number> = new Set(), speed = 1) {
    if (!w.visible) return;
    const dt = Math.max(0, Math.min(.1, seconds));
    w.time += dt; w.greeting = Math.max(0, w.greeting - dt);
    if (w.cursor >= w.path.length) {
        w.walking = false; w.pause -= dt;
        if (w.pause <= 0) planWalk(w, garden, reserved);
    }
    if (w.cursor < w.path.length) {
        const tile = w.path[w.cursor];
        if (!garden.open[tile]) { relocateWalker(w, garden); return; }
        const target = center(tile), dx = target.x - w.x, dz = target.z - w.z, distance = Math.hypot(dx, dz), step = Math.min(distance, dt * speed);
        w.facing = Math.atan2(dx, dz);
        if (distance > .0001) { w.x += dx / distance * step; w.z += dz / distance * step; w.y += (garden.heights[tile] - w.y) * step / distance; }
        if (distance <= step + .0001) {
            w.x = target.x; w.z = target.z; w.y = garden.heights[tile]; w.cursor++;
            if (w.cursor >= w.path.length) { w.walking = false; if (w.visit) w.facing = Math.atan2(w.visit.x - w.x, w.visit.z - w.z); }
        }
    }
    const turn = Math.atan2(Math.sin(w.facing - w.heading), Math.cos(w.facing - w.heading));
    w.heading += Math.max(-dt * 5, Math.min(dt * 5, turn));
}
