import { ASSETS, type ItemId } from './catalog';
import { homeLevel, usedStorage } from './progression';
import { heightAt, isWater, ownedAt, random, reachableTiles, tileIndex, invalidateReachability, type Obstacle, type World } from './world';
import type { FarmState } from './types';

export const ENERGY_POINT_MS = 180000;
export const REGROWTH_SLOT_MS = 86400000 / 5;
export const RESOURCE_TIERS = {
    1: { name: 'Nhỏ', home: 1, energy: 12, tools: 1, min: 4, max: 6, scale: .65 },
    2: { name: 'Vừa', home: 5, energy: 25, tools: 2, min: 9, max: 12, scale: .9 },
    3: { name: 'To', home: 12, energy: 45, tools: 3, min: 17, max: 22, scale: 1.15 },
    4: { name: 'Lớn', home: 20, energy: 70, tools: 4, min: 29, max: 36, scale: 1.4 },
} as const;
export const energyCapacity = (s: FarmState) => 100 + (homeLevel(s) - 1) * 5;
export function resourceTier(w: World, o: Obstacle): 1 | 2 | 3 | 4 {
    if (o.kind === 'berry') return 1;
    if (o.tier) return o.tier;
    const n = random(w.seed ^ Math.imul(o.x + 1, 73856093) ^ Math.imul(o.z + 1, 19349663))();
    if (o.x < 32 && o.z < 32) return n < .8 ? 1 : 2;
    return n < .45 ? 1 : n < .72 ? 2 : n < .9 ? 3 : 4;
}
export const resourceHome = (w: World, o: Obstacle) => Math.max(o.kind === 'ore' ? 4 : 1, RESOURCE_TIERS[resourceTier(w, o)].home);
export function resourceReward(w: World, o: Obstacle): { items: Partial<Record<ItemId, number>>; energy: number } {
    const rng = random(w.seed ^ Math.imul(o.x + 1, 83492791) ^ Math.imul(o.z + 1, 19349663) ^ Math.imul((o.generation ?? 0) + 1, 2654435761));
    if (o.kind === 'berry') return { items: {}, energy: 5 + Math.floor(rng() * 6) };
    const tier = resourceTier(w, o), spec = RESOURCE_TIERS[tier], quantity = spec.min + Math.floor(rng() * (spec.max - spec.min + 1));
    return { energy: 0, items: o.kind === 'tree' ? { wood: quantity } : o.kind === 'ore' ? { ore: quantity, stone: tier } : { stone: quantity, clay: tier } };
}
export function resourcePayment(s: FarmState, o: Obstacle, pay: 'auto' | 'energy' | 'tools' = 'auto') {
    const spec = RESOURCE_TIERS[resourceTier(s.world, o)];
    const tools = o.kind !== 'berry' && (pay === 'tools' || pay === 'auto' && s.inventory.tools >= spec.tools) ? spec.tools : 0;
    return { tools, energy: o.kind === 'berry' || tools ? 0 : spec.energy };
}
export function recoverEnergy(s: FarmState) {
    const e = s.energy;
    if (e.value >= e.capacity) e.updatedAt = s.clock;
    else {
        const points = Math.floor(Math.max(0, s.clock - e.updatedAt) / ENERGY_POINT_MS);
        e.value = Math.min(e.capacity, e.value + points);
        e.updatedAt = e.value === e.capacity ? s.clock : e.updatedAt + points * ENERGY_POINT_MS;
    }
    const capacity = energyCapacity(s);
    e.value = Math.min(capacity, e.value + Math.max(0, capacity - e.capacity));
    e.capacity = capacity;
}

/** Spawn only on a free, flat, reachable tile; preserve the starter pad and
 * corridors so renewable objects never trap an existing farm or bridge.
 */
function spawnCandidates(s: FarmState) {
    const w = s.world, reachable = reachableTiles(w);
    const blocked = new Set<number>();
    for (const e of s.entities) if (!e.stored) {
        const spec = ASSETS[e.asset], width = e.rotation % 2 ? spec.depth : spec.width, depth = e.rotation % 2 ? spec.width : spec.depth;
        for (let z = e.z - 1; z <= e.z + depth; z++) for (let x = e.x - 1; x <= e.x + width; x++) blocked.add(tileIndex(x, z));
    }
    for (const p of s.plots) for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) blocked.add(tileIndex(p.x + dx, p.z + dz));
    for (const o of w.obstacles) if (!o.cleared) blocked.add(tileIndex(o.x, o.z));
    const candidates: { x: number; z: number }[] = [];
    // Visit only reachable land, in a stable order independent of flood-fill.
    for (const index of [...reachable].sort((a, b) => a - b)) {
        const x = index % 96, z = Math.floor(index / 96);
        if (x < 3 || z < 3 || x >= 93 || z >= 93) continue;
        if (x < 24 && z < 24 || !ownedAt(w, x, z) || isWater(w, x, z) || blocked.has(tileIndex(x, z)) || !reachable.has(tileIndex(x, z))) continue;
        if (x % 16 < 3 || z % 16 < 3 || w.bridges.some(b => Math.abs(z - b.z) < 4) || x >= 22 && x <= 30 && z >= 34 && z <= 43) continue;
        const neighbors = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]];
        if (neighbors.some(([dx, dz]) => !reachable.has(tileIndex(x + dx, z + dz)) || blocked.has(tileIndex(x + dx, z + dz)) || heightAt(w, x + dx, z + dz) !== heightAt(w, x, z))) continue;
        candidates.push({ x, z });
    }
    return candidates;
}
function spawn(s: FarmState, kind: Obstacle['kind'], salt: number, candidates: { x: number; z: number }[]): boolean {
    const w = s.world, rng = random(w.seed ^ Math.imul(salt, 2654435761));
    if (!candidates.length) return false;
    const p = candidates[Math.floor(rng() * candidates.length)], id = `o-${p.x}-${p.z}`;
    const existing = w.obstacles.find(o => o.id === id);
    const next: Obstacle = { id, ...p, kind, tier: 1, generation: (existing?.generation ?? 0) + 1, cleared: false };
    if (existing) Object.assign(existing, next, { claimed: undefined, readyAt: undefined });
    else w.obstacles.push(next);
    // The free eight-neighbor ring guarantees this single blocked tile cannot
    // cut a route. Only its 3×3 neighborhood becomes ineligible for this batch.
    for (let i = candidates.length - 1; i >= 0; i--) if (Math.abs(candidates[i].x - p.x) <= 1 && Math.abs(candidates[i].z - p.z) <= 1) candidates.splice(i, 1);
    invalidateReachability(w);
    return true;
}

/** Five slots per game day, one resource + one berry at most per slot. Offline
 * catch-up is restricted to the current day; reloads never get a fresh quota.
 */
export function regrowResources(s: FarmState) {
    const slot = Math.floor(s.clock / REGROWTH_SLOT_MS);
    if (slot <= s.regrowth.slot) return;
    const first = Math.max(s.regrowth.slot + 1, Math.floor(slot / 5) * 5);
    const candidates = spawnCandidates(s);
    for (let n = first; n <= slot; n++) {
        const rng = random(s.world.seed ^ Math.imul(n + 1, 1597334677));
        const kind = rng() < .5 ? 'tree' : homeLevel(s) >= 4 && rng() < .15 ? 'ore' : 'rock';
        spawn(s, kind, n * 2 + 701, candidates);
        spawn(s, 'berry', n * 2 + 702, candidates);
    }
    s.regrowth.slot = slot;
}

/** Called after validating the old snapshot. Paid legacy work is settled once,
 * with a storage grandfather allowance so no existing entitlement is lost.
 */
export function initializeHarvesting(s: FarmState, legacy = false): FarmState {
    s.harvestingVersion = 1;
    s.energy = { value: energyCapacity(s), capacity: energyCapacity(s), updatedAt: s.clock };
    s.regrowth = { slot: Math.floor(s.clock / REGROWTH_SLOT_MS) };
    if (legacy) {
        for (const o of s.world.obstacles) if (!o.cleared && o.readyAt !== undefined) {
            const goods: Partial<Record<ItemId, number>> = o.kind === 'tree' ? { wood: 12 } : o.kind === 'ore' ? { ore: 8, stone: 4 } : { stone: 12, clay: 2 };
            for (const [id, n] of Object.entries(goods)) { s.inventory[id as ItemId] += n!; if (!s.discovered.includes(id as ItemId)) s.discovered.push(id as ItemId); }
            o.cleared = o.claimed = true; delete o.readyAt; s.stats.clear++;
        }
        if (s.gather) { s.inventory[s.gather.item] += s.world.biome === (s.gather.item === 'wood' ? 'forest' : 'stone') ? 6 : 4; if (!s.discovered.includes(s.gather.item)) s.discovered.push(s.gather.item); delete s.gather; }
        s.legacyStorageCap = Math.max(s.legacyStorageCap, usedStorage(s));
        s.migrationNotes = [...s.migrationNotes.slice(-8), 'Khai phá dùng năng lượng, nhận ngay. Đã giữ hàng từ các lượt dọn/thu gom cũ; không trừ thêm chi phí.'];
    }
    // Starter berries count against today's five-berry quota. The current slot
    // starts used; later slots provide the remaining daily allowance.
    if (!legacy) { const starter = s.world.obstacles.find(o => o.id === 'o-25-9'); if (starter) starter.tier = 1; }
    spawn(s, 'berry', 601, spawnCandidates(s));
    return s;
}
