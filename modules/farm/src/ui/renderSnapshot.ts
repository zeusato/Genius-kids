import type { FarmState } from '../core/types';

function equalFields(a: object, b: object): boolean {
    const keys = Object.keys(a) as (keyof typeof a)[];
    return keys.length === Object.keys(b).length && keys.every(key => Object.is(a[key], b[key]));
}

function reuseArray<T>(previous: T[], next: T[], equal: (a: T, b: T) => boolean = Object.is): T[] {
    return previous.length === next.length && previous.every((value, i) => equal(value, next[i])) ? previous : next;
}

/** UI-only structural sharing. Gateway snapshots remain detached from their saved state.
 * Compare contents so imports with the same seed still invalidate changed geometry.
 */
export function renderSnapshot(previous: FarmState | null, next: FarmState): FarmState {
    if (!previous) return next;
    const a = previous.world, b = next.world;
    const world = {
        ...b,
        heights: reuseArray(a.heights, b.heights),
        water: reuseArray(a.water, b.water),
        owned: reuseArray(a.owned, b.owned),
        obstacles: reuseArray(a.obstacles, b.obstacles, equalFields),
        bridges: reuseArray(a.bridges, b.bridges, equalFields),
    };
    return { ...next, world: equalFields(a, world) ? a : world };
}
