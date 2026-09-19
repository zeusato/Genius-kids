import { ASSETS, type AssetId } from '../core/catalog';
import type { Rotation } from '../core/types';
export const VISUAL_LEVELS = [1, 5, 10, 15, 20, 25] as const;
export const visualLevel = (level: number) => VISUAL_LEVELS.filter(n => n <= level).at(-1) ?? 1;
const images = import.meta.glob('../assets/buildings/runtime/*.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
export function buildingAssetUrl(asset: AssetId, level = 1, rotation: Rotation = 0) {
    return images[`../assets/buildings/runtime/${asset}-${visualLevel(level)}-${rotation}.webp`];
}
export const isSpriteBuilding = (asset: AssetId) => ASSETS[asset].kind === 'building';
