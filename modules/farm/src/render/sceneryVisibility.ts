import { explorationDistance } from '../core/landcover';

// Fog fades out by 9 world units. Keep a generous extra band for billboard
// overhang, raised ground and the next adjoining region's reveal animation.
export const SCENERY_REVEAL_MARGIN = 24;
export function sceneryVisible(owned: readonly number[], x: number, z: number): boolean {
    return owned.length === 36 || explorationDistance(owned, x, z) <= SCENERY_REVEAL_MARGIN;
}
