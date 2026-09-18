import type { Entity } from './types';
import { heightAt, type World } from './world';

/** World directions: north=-z, east=+x, south=+z, west=-x. Rotation is irrelevant. */
export const ROAD_DIRECTIONS = [{ bit: 1, dx: 0, dz: -1 }, { bit: 2, dx: 1, dz: 0 }, { bit: 4, dx: 0, dz: 1 }, { bit: 8, dx: -1, dz: 0 }] as const;
export function roadConnections(entities: Pick<Entity, 'id' | 'asset' | 'x' | 'z' | 'stored'>[], world: World) {
    const roads = entities.filter(e => e.asset === 'path' && !e.stored);
    const cells = new Map(roads.map(e => [`${e.x}:${e.z}`, e]));
    return roads.map(e => ({ ...e, mask: ROAD_DIRECTIONS.reduce((mask, d) => {
        const neighbor = cells.get(`${e.x + d.dx}:${e.z + d.dz}`);
        return neighbor && heightAt(world, neighbor.x, neighbor.z) === heightAt(world, e.x, e.z) ? mask | d.bit : mask;
    }, 0) }));
}
