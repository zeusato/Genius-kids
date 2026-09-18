import { ASSETS, type AssetId, type BuildingId } from './catalog';
import { homeLevel, homeSpec, type Cost } from './progression';
import type { FarmState } from './types';

// Early producers use raw materials. Later buildings use goods unlocked earlier.
const materials: Record<BuildingId, Cost['items']> = {
    home: { wood: 8, stone: 6 }, warehouse: { wood: 8, stone: 4 },
    mill: { wood: 6, stone: 4 }, coop: { wood: 8, stone: 2 },
    bakery: { wood: 6, stone: 10 }, sawmill: { wood: 10, stone: 4 }, quarry: { wood: 6, stone: 8 },
    barn: { wood: 10, stone: 6, plank: 4 }, dairy: { wood: 6, stone: 8, plank: 4 }, iron_mine: { wood: 10, stone: 8, plank: 4 },
    smelter: { stone: 16, plank: 6 }, sheepfold: { wood: 12, stone: 6, plank: 6 }, loom: { wood: 8, stone: 4, plank: 8 },
    orchard: { wood: 10, plank: 8, iron: 2 }, apiary: { wood: 8, plank: 6, iron: 2 },
    pottery: { stone: 16, plank: 8, iron: 3 }, workshop: { plank: 12, stone: 12, iron: 6 },
    press: { plank: 10, brick: 8, iron: 4 }, greenhouse: { plank: 10, iron: 6, glass: 8 },
    fishpond: { stone: 20, brick: 10, tools: 2 }, fishing_pier: { plank: 18, iron: 6, tools: 2 },
    kitchen: { brick: 14, plank: 10, iron: 6 }, preserves: { brick: 12, iron: 6, glass: 10 },
    tailor: { plank: 14, brick: 12, cloth: 8 }, fairground: { plank: 18, brick: 14, cloth: 10 },
    icecream: { brick: 16, iron: 10, glass: 10 }, herb_garden: { plank: 16, brick: 12, tools: 3 },
    dyehouse: { brick: 18, iron: 10, glass: 8 }, tea_house: { plank: 20, brick: 16, glass: 12, cloth: 8 },
};

export function buildPrice(id: AssetId): Cost {
    return { coins: ASSETS[id].price, items: ASSETS[id].kind === 'building' ? { ...materials[id as BuildingId] } : {} };
}
export const buildingCount = (s: FarmState, id: AssetId) => s.entities.filter(e => e.asset === id).length;
export const buildingLimit = (id: AssetId) => ASSETS[id].kind === 'building' ? 1 : null;
export function buildRequirements(s: FarmState, id: AssetId): string[] {
    const errors: string[] = [], asset = ASSETS[id], limit = buildingLimit(id), cost = buildPrice(id);
    if (homeLevel(s) < asset.level) errors.push(`Cần Nhà chính cấp ${asset.level}.`);
    if (limit !== null && buildingCount(s, id) >= limit) errors.push(`Đã đủ ${limit}/${limit} ${asset.name.toLowerCase()}.`);
    if (s.entities.length >= 300) errors.push('Đã đạt 300 công trình và trang trí.');
    if (asset.kind === 'building' && s.entities.filter(e => e.construction).length >= homeSpec(s).builderSlots) errors.push('Chưa có đội thợ rảnh.');
    if (s.coins < cost.coins || Object.entries(cost.items).some(([item, n]) => s.inventory[item as keyof typeof s.inventory] < n!)) errors.push('Chưa đủ xu hoặc vật liệu xây dựng.');
    return errors;
}
