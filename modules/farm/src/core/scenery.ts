import { heightAt, isWater, type Obstacle, type World } from './world';

/** Natural resources are fixed-view art. Rotatable sprite assets must supply ALL four views. */
export type SpriteViews = { rotation: 'fixed'; front: string } | { rotation: 'quarter-turn'; views: Record<0 | 1 | 2 | 3, string> };
export const NATURAL_VARIANTS = {
    oak: { label: 'Sồi tán rộng', file: 'oak-v1.png', tree: true, width: 2.8 },
    birch: { label: 'Bạch dương', file: 'birch-v2.png', tree: true, width: 2.2 },
    pine: { label: 'Thông vùng cao', file: 'pine-v1.png', tree: true, width: 2.5 },
    bamboo: { label: 'Bụi tre', file: 'bamboo-v1.png', tree: true, width: 2.3 },
    banana: { label: 'Chuối lá rộng', file: 'banana-v1.png', tree: true, width: 2.4 },
    maple: { label: 'Phong lá vàng', file: 'maple-v1.png', tree: true, width: 2.7 },
    blossom: { label: 'Mận hoa', file: 'blossom-v1.png', tree: true, width: 2.3 },
    stone: { label: 'Đá phủ rêu', file: 'stone-v1.png', tree: false, width: 1.3 },
    granite: { label: 'Đá granite', file: 'granite-v1.png', tree: false, width: 1.4 },
    sandstone: { label: 'Đá sa thạch', file: 'sandstone-v1.png', tree: false, width: 1.6 },
    slate: { label: 'Đá phiến', file: 'slate-v1.png', tree: false, width: 1.3 },
    limestone: { label: 'Đá vôi', file: 'limestone-v1.png', tree: false, width: 1.25 },
    riverstone: { label: 'Đá cuội ven nước', file: 'riverstone-v1.png', tree: false, width: 1.4 },
    iron: { label: 'Vỉa quặng sắt', file: 'iron-v1.png', tree: false, width: 1.5 },
} as const;
export type NaturalVariant = keyof typeof NATURAL_VARIANTS;

/** Use the rendered variant's name consistently in picking, menus and dialogs. */
export const obstacleName = (world: World, obstacle: Obstacle) => NATURAL_VARIANTS[obstacleVariant(world, obstacle)].label;

export function obstacleVariant(w: World, o: Obstacle): NaturalVariant {
    const n = ((Math.imul(o.x + 1, 73856093) ^ Math.imul(o.z + 1, 19349663) ^ w.seed) >>> 0);
    const high = heightAt(w, o.x, o.z) > 1;
    const shore = [[-2, 0], [2, 0], [0, -2], [0, 2]].some(([dx, dz]) => o.x + dx >= 0 && o.x + dx < 96 && o.z + dz >= 0 && o.z + dz < 96 && isWater(w, o.x + dx, o.z + dz));
    if (o.kind === 'ore') return 'iron';
    if (o.kind === 'rock') {
        if (shore) return n % 2 ? 'riverstone' : 'limestone';
        return (['stone', 'granite', 'sandstone', 'slate', 'limestone', 'riverstone'] as const)[n % 6];
    }
    if (high) return n % 3 ? 'pine' : 'birch';
    if (shore) return n % 3 ? 'bamboo' : 'banana';
    // Seasonal and flowering specimens are accents, not a random rainbow over every forest.
    return (['oak', 'oak', 'birch', 'oak', 'bamboo', 'birch', 'banana', 'maple', 'blossom', 'pine'] as const)[n % 10];
}
