import draft from '../../docs/progression-draft.json';
import {RECIPES as LEGACY_RECIPES} from './legacy/catalog';
import { ASSETS, ITEMS, RECIPES, type BuildingId, type ItemId, type RecipeId } from './catalog';
import type { Entity, FarmState } from './types';
export const HOME_LEVELS = draft.homeLevels;
export const homeLevel = (s: FarmState) => s.entities.find(e => e.asset === 'home')?.level ?? 1;
export const homeSpec = (s: FarmState) => HOME_LEVELS[homeLevel(s) - 1];
export const plotCap = (s: FarmState) => Math.max(s.legacyPlotCap, homeSpec(s).plotCap);
export const regionCap = (s: FarmState) => [4, 4, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 22, 24, 26, 29, 32, 36][homeLevel(s) - 1];
export const storageCap = (s: FarmState) => Math.max(s.legacyStorageCap, 200 + (s.entities.find(e => e.asset === 'warehouse')?.level ?? 1) * 80);
export const usedStorage = (s: FarmState) => Object.values(s.inventory).reduce((a, b) => a + b, 0);
export const queueCap = (e: Entity) => Math.min(8, 1 + Math.floor(e.level / 4));
export const outputCap = (e: Entity) => 8 + e.level * 2;
export const productionFactor = (e: Entity) => 1 - Math.min(.36, (e.level - 1) * .015);
export type Cost = {
    coins: number;
    items: Partial<Record<ItemId, number>>;
};
// Costs intentionally use only inputs whose source predates the target level.
export function upgradePrice(e: Entity): Cost {
    const n = e.level + 1, home = e.asset === 'home';
    if (!home && n >= 4)
        return { coins: 35 * n + ASSETS[e.asset].price, items: { wood: Math.ceil(n / 3), stone: Math.ceil(n / 4), ...(n >= 5 ? { plank: Math.ceil(n / 5) } : {}), ...(n >= 6 ? { iron: Math.ceil(n / 8) } : {}), ...(n >= 9 ? { brick: Math.ceil(n / 5) } : {}), ...(n >= 12 ? { glass: Math.ceil(n / 10) } : {}), ...(n >= 16 ? { cloth: Math.ceil(n / 10) } : {}), ...(n >= 21 ? { tools: 1 } : {}) } };
    return { coins: home ? [0, 0, 90, 180, 300, 450, 620, 800, 1000, 1200, 1500, 1800, 2200, 2600, 3000, 3500, 4000, 4500, 5000, 5600, 6200, 7000, 8000, 9000, 10000, 12000][n] : 35 * n + ASSETS[e.asset].price,
        items: n <= 3 ? { wood: home ? n * 4 : n * 2, stone: home ? n * 3 : n } : { wood: n * 3, stone: n * 2, ...(n >= 5 ? { plank: n } : {}), ...(n >= 6 ? { iron: Math.ceil(n / 2) } : {}), ...(n >= 9 ? { brick: n } : {}), ...(n >= 12 ? { glass: Math.ceil(n / 2) } : {}), ...(n >= 16 ? { cloth: Math.ceil(n / 3) } : {}), ...(n >= 21 ? { tools: Math.ceil(n / 5) } : {}) } };
}
export function upgradeMs(e: Entity) { return e.asset === 'home' ? HOME_LEVELS[e.level].upgradeMinutes * 60000 : [0, 0, 1, 3, 5, 10, 20, 40, 60, 90, 120, 180, 240, 360, 480, 600, 720, 900, 1080, 1260, 1440, 1800, 2160, 2520, 3240, 4320][e.level + 1] * 60000; }
export const buildMs = (id: BuildingId) => Math.min(1800, 30 * ASSETS[id].level) * 1000;
export function upgradeRequirements(s: FarmState, e: Entity): string[] {
    if (e.level >= 25)
        return ['Đã đạt cấp 25.'];
    const errors: string[] = [];
    if (e.construction)
        errors.push('Công trình đã có lịch thi công.');
    if (e.asset === 'home')
        for (const req of HOME_LEVELS[e.level].requires) {
            if (!s.entities.some(v => v.asset === req.building && v.level >= req.level && !v.construction?.newBuilding))
                errors.push(`${ASSETS[req.building as BuildingId].name} cấp ${req.level}`);
        }
    else if (e.level >= homeLevel(s))
        errors.push(`Nhà chính hoàn thành cấp ${e.level + 1}`);
    if (s.entities.filter(v => v.construction).length >= homeSpec(s).builderSlots)
        errors.push('Chưa có đội thợ rảnh');
    return errors;
}
export const CHAPTER_TITLES = ['Mảnh đất đầu tiên', 'Cánh xay đầu mùa', 'Ngọn lửa trong lò', 'Dòng sữa buổi sáng', 'Sợi vải đầu tiên', 'Hương táo và mật', 'Đất biết kể chuyện', 'Bàn tay người thợ', 'Giọt nắng trong chai', 'Một mái nhà bằng kính', 'Gió từ mặt hồ', 'Bữa cơm của làng', 'Giữ mùa trong lọ', 'Áo mới ngày hội', 'Phiên chợ đông vui', 'Vị mát ngày hè', 'Khu vườn hương thơm', 'Màu từ lá', 'Mùa lê chín', 'Ấm trà bên hiên', 'Lối đi rợp bóng', 'Hoa nở trong kính', 'Bữa tiệc mùa gặt', 'Dấu ấn người thợ', 'Trang trại của những mùa vui'];
export const CHAPTER_PRODUCTS: (ItemId | null)[] = [null, 'flour', 'plank', 'butter', 'cloth', 'honey', 'pottery', 'tools', 'juice', 'flowers', 'fish', 'soup', 'jam', 'garment', 'gift', 'icecream', 'herbs', 'dye', 'pear', 'teapot', 'gift', 'bouquet', 'feast', 'monument', 'feast'];
export function chapterReady(s: FarmState, n: number) { return homeLevel(s) >= n && s.stats.harvest >= n * 3 && (CHAPTER_PRODUCTS[n - 1] === null || (s.produced[CHAPTER_PRODUCTS[n - 1]!] ?? 0) > 0) && (n === 1 || s.claimed.includes(`chapter:${n - 1}`)); }
export function costText(cost: Cost) { return `${cost.coins} xu${Object.entries(cost.items).map(([id, n]) => ` · ${n} ${ITEMS[id as ItemId].name.toLowerCase()}`).join('')}`; }
export function recipeAllowed(s: FarmState, e: Entity, id: RecipeId) { const r = RECIPES[id]; return e.asset === r.building && e.level >= r.buildingLevel && (homeLevel(s) >= r.home || !!e.legacy && id in LEGACY_RECIPES) && !e.construction; }
export function orderFor(s: FarmState, offset = 0) {
    const available = (Object.keys(ITEMS) as ItemId[]).filter(id => s.discovered.includes(id) && (s.inventory[id] > 0 || (s.produced[id] ?? 0) > 0));
    const items = available.length ? available : ['wheat' as ItemId, 'carrot' as ItemId];
    const index = s.orderIndex + offset, item = items[(index * 7) % items.length], quantity = 2 + index % 4;
    const need: Partial<Record<ItemId, number>> = { [item]: quantity };
    return { id: index, person: ['Bà An', 'Chú Nam', 'Cô Hạ', 'Bác Mộc'][index % 4], name: ['Giỏ hàng sáng', 'Chuyến chợ nhỏ', 'Bữa cơm gia đình', 'Món quà trong làng'][index % 4], need, coins: Math.ceil(ITEMS[item].sell * quantity * 1.3), xp: 15 + homeLevel(s) * 2 };
}

