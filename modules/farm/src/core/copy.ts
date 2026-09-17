import type { FarmState } from './types';
/** Terrain is immutable after generation/migration. Copy mutable gameplay data only.
 * Adapter boundaries still deep-copy snapshots before exposing them to callers. */
export function copyFarm(state: FarmState, copyWorld = false): FarmState {
    if (!copyWorld) {
        const { world, ...rest } = state;
        return { ...structuredClone(rest), world };
    }
    const { heights, water, ...world } = state.world;
    const copy = structuredClone({ ...state, world });
    return { ...copy, world: { ...copy.world, heights, water } };
}
