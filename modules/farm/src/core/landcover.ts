import { heightAt, isWater, type World } from './world';
export const LANDCOVER = {
    meadow: '#859d63', yard: '#b7a078', woodland: '#667751', upland: '#a5a38c', dry: '#b3a477', marsh: '#718d73', trail: '#bea77c',
} as const;
export type Landcover = keyof typeof LANDCOVER;
/** Visual ground cover only: never alters persisted height, water or placement rules. */
export function landcoverAt(world: World, x: number, z: number): Landcover {
    const xx = Math.max(0, Math.min(95, Math.floor(x))), zz = Math.max(0, Math.min(95, Math.floor(z)));
    const ripple = Math.sin(x * .43 + Math.cos(z * .3)) * .07 + Math.cos(z * .51) * .06;
    if (heightAt(world, xx, zz) > .5) return 'upland';
    if (x > 0 && x < 20 && z > 0 && z < 27 && Math.abs(x - 14 - Math.sin(z * .24) * 1.7) < 1.05) return 'trail';
    if (((x - 10) / 16) ** 2 + ((z - 8) / 14) ** 2 < .8 + ripple) return 'yard';
    if ([[3, 0], [-3, 0], [0, 3], [0, -3]].some(([dx, dz]) => xx + dx >= 0 && xx + dx < 96 && zz + dz >= 0 && zz + dz < 96 && isWater(world, xx + dx, zz + dz))) return 'marsh';
    for (const [cx, cz, rx, rz] of [[12, 37, 11, 10], [13, 59, 14, 15], [36, 77, 16, 13], [65, 80, 14, 13], [87, 58, 10, 13]])
        if (((x - cx) / rx) ** 2 + ((z - cz) / rz) ** 2 < .85 + ripple) return 'woodland';
    if (((x - 78) / 20) ** 2 + ((z - 76) / 25) ** 2 < 1 + ripple) return 'dry';
    return 'meadow';
}

/** Distance from the revealed territory, used by exploration fog and regression checks. */
export function explorationDistance(owned: readonly number[], x: number, z: number): number {
    let distance = Infinity;
    for (const id of owned) {
        const cx = id % 6 * 16 + 8, cz = Math.floor(id / 6) * 16 + 8;
        distance = Math.min(distance, Math.hypot(Math.max(0, Math.abs(x - cx) - 8), Math.max(0, Math.abs(z - cz) - 8)));
    }
    return distance;
}
