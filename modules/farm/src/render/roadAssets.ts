import { visualLevel } from './buildingAssets';
const files = import.meta.glob('../assets/roads/*.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
export const ROAD_NAMES = { 1: 'Đường đất', 5: 'Đường đất rải sỏi', 10: 'Đường gạch nung', 15: 'Đường đá cuội', 20: 'Lối đá lát', 25: 'Lối đá trang viên' } as const;
export const roadName = (level: number) => ROAD_NAMES[visualLevel(level)];
export const roadAssetUrl = (level: number) => files[`../assets/roads/road-${visualLevel(level)}.webp`];
