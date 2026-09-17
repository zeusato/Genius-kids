import type { BuildingId, ItemId, RecipeId } from './catalog';
import { RECIPES } from './catalog';
import type { FarmState } from './types';
export const PROFESSIONS = {
    food: { name: 'Bếp làng', buildings: ['bakery', 'dairy', 'kitchen', 'preserves', 'icecream', 'tea_house', 'fairground'], items: [{ bread: 5, butter: 3 }, { soup: 4, jam: 3 }, { feast: 2, teapot: 3 }] },
    materials: { name: 'Thợ xây', buildings: ['sawmill', 'quarry', 'iron_mine', 'smelter', 'pottery', 'workshop'], items: [{ plank: 10, brick: 5 }, { tools: 5, glass: 10 }, { monument: 1, iron: 20 }] },
    craft: { name: 'Nghệ nhân', buildings: ['loom', 'tailor', 'dyehouse', 'greenhouse'], items: [{ cloth: 4, flowers: 3 }, { garment: 4, dye: 3 }, { bouquet: 3, gift: 2 }] },
} satisfies Record<string, {
    name: string;
    buildings: BuildingId[];
    items: Partial<Record<ItemId, number>>[];
}>;
export type Profession = keyof typeof PROFESSIONS;
export const professionRank = (s: FarmState, id: Profession) => [1, 2, 3].filter(n => s.claimed.includes(`profession:${id}:${n}`)).length;
export function professionFactor(s: FarmState, recipe: RecipeId) { const id = (Object.keys(PROFESSIONS) as Profession[]).find(id => (PROFESSIONS[id].buildings as string[]).includes(RECIPES[recipe].building)); return id ? 1 - professionRank(s, id) * .05 : 1; }
export const PROJECTS = [
    { name: 'Lối vào có hoa', home: 3, need: { wood: 15, stone: 10 }, reward: 'flowers' },
    { name: 'Khoảng nghỉ dưới giàn', home: 10, need: { plank: 15, brick: 10, flowers: 3 }, reward: 'arch' },
    { name: 'Dấu ấn mùa gặt', home: 24, need: { monument: 1, bouquet: 3, gift: 2 }, reward: 'statue' },
] as const;
// A continuous serpentine pipe crosses every tile, from the left to the right.
// Directions: north/east/south/west. Elbows start east+south; straights east+west.
export const PIPE_SHAPES = ['straight', 'straight', 'elbow', 'elbow', 'straight', 'elbow', 'elbow', 'straight', 'straight'] as const;
export const PIPE_SOLUTION = [0, 0, 1, 0, 0, 2, 3, 0, 0];
export const pipePorts = (index: number, rotation: number) => (PIPE_SHAPES[index] === 'straight' ? [1, 3] : [1, 2]).map(n => (n + rotation) % 4);
export function validPipes(rotations: number[]): boolean {
    if (rotations.length !== 9 || rotations.some(n => !Number.isInteger(n) || n < 0 || n > 3))
        return false;
    let tile = 0, inlet = 3;
    const seen = new Set<number>();
    while (!seen.has(tile)) {
        seen.add(tile);
        const ports = pipePorts(tile, rotations[tile]);
        if (!ports.includes(inlet))
            return false;
        const out = ports.find(n => n !== inlet)!;
        if (tile === 8 && out === 1)
            return seen.size === 9;
        const x = tile % 3 + [0, 1, 0, -1][out], y = Math.floor(tile / 3) + [-1, 0, 1, 0][out];
        if (x < 0 || x > 2 || y < 0 || y > 2)
            return false;
        tile = y * 3 + x;
        inlet = (out + 2) % 4;
    }
    return false;
}
