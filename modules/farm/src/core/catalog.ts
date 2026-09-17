export const CONTENT_VERSION = 1;
export const CROPS = {
  wheat: { name: 'Lúa mì', icon: 'wheat', color: '#d8b459', seed: 3, sell: 6, seconds: 35, yield: 3, xp: 5, level: 1 },
  carrot: { name: 'Cà rốt', icon: 'carrot', color: '#dc8646', seed: 5, sell: 10, seconds: 55, yield: 3, xp: 7, level: 1 },
  corn: { name: 'Ngô', icon: 'corn', color: '#e7ba4a', seed: 8, sell: 15, seconds: 80, yield: 3, xp: 10, level: 2 },
  pumpkin: { name: 'Bí đỏ', icon: 'pumpkin', color: '#cb713c', seed: 12, sell: 24, seconds: 120, yield: 2, xp: 14, level: 3 },
} as const;
export type CropId = keyof typeof CROPS;
export const ITEMS = {
  ...Object.fromEntries(Object.entries(CROPS).map(([id, c]) => [id, { name: c.name, sell: c.sell, color: c.color }])),
  flour: { name: 'Bột mì', sell: 18, color: '#d9c7a2' },
  bread: { name: 'Bánh mì', sell: 48, color: '#bb8248' },
  milk: { name: 'Sữa tươi', sell: 25, color: '#f0e9da' },
  cake: { name: 'Bánh bí đỏ', sell: 108, color: '#d69562' },
} as Record<ItemId, { name: string; sell: number; color: string }>;
export type ItemId = CropId | 'flour' | 'bread' | 'milk' | 'cake';
export type BuildingId = 'mill' | 'bakery' | 'barn';
export type DecorId = 'bench' | 'fence' | 'flowers' | 'lantern' | 'arch' | 'well' | 'crates' | 'birdhouse';
export type AssetId = BuildingId | DecorId;
export type AssetSpec = { name: string; description: string; width: number; depth: number; price: number; level: number; kind: 'building' | 'decor'; color: string };
export const ASSETS: Record<AssetId, AssetSpec> = {
  mill: { name: 'Cối xay gió', description: 'Xay lúa mì thành bột. Cánh quạt quay khi đang làm.', width: 3, depth: 3, price: 160, level: 1, kind: 'building', color: '#d5b78a' },
  bakery: { name: 'Lò bánh', description: 'Một chiếc lò ấm và những mẻ bánh thơm.', width: 3, depth: 3, price: 220, level: 2, kind: 'building', color: '#c57b5b' },
  barn: { name: 'Chuồng bò', description: 'Cho Mây ăn ngô để nhận sữa tươi.', width: 4, depth: 3, price: 250, level: 2, kind: 'building', color: '#9b6446' },
  bench: { name: 'Ghế vườn', description: 'Một chỗ ngồi dưới bóng cây.', width: 2, depth: 1, price: 25, level: 1, kind: 'decor', color: '#ab8151' },
  fence: { name: 'Hàng rào gỗ', description: 'Chia những góc nhỏ trong khu vườn.', width: 2, depth: 1, price: 12, level: 1, kind: 'decor', color: '#b99b6e' },
  flowers: { name: 'Chậu cúc', description: 'Một chút sắc hoa trước hiên nhà.', width: 1, depth: 1, price: 15, level: 1, kind: 'decor', color: '#d3938e' },
  lantern: { name: 'Đèn sân vườn', description: 'Ánh sáng ấm cạnh lối đi.', width: 1, depth: 1, price: 30, level: 2, kind: 'decor', color: '#e7c981' },
  arch: { name: 'Cổng hoa', description: 'Một chiếc cổng phủ đầy hoa hồng.', width: 3, depth: 1, price: 80, level: 3, kind: 'decor', color: '#b47885' },
  well: { name: 'Giếng nhỏ', description: 'Giếng đá với mái gỗ mộc mạc.', width: 2, depth: 2, price: 65, level: 2, kind: 'decor', color: '#b4ada0' },
  crates: { name: 'Góc thu hoạch', description: 'Thùng gỗ và giỏ nông sản.', width: 1, depth: 1, price: 20, level: 1, kind: 'decor', color: '#bc9863' },
  birdhouse: { name: 'Nhà chim', description: 'Một mái nhà nhỏ cho những vị khách.', width: 1, depth: 1, price: 35, level: 2, kind: 'decor', color: '#7f9b8b' },
};
export const RECIPES = {
  flour: { name: 'Xay bột mì', building: 'mill', buildingLevel: 1, inputs: { wheat: 2 }, output: 'flour', quantity: 1, seconds: 30, xp: 8 },
  bread: { name: 'Nướng bánh mì', building: 'bakery', buildingLevel: 1, inputs: { flour: 2 }, output: 'bread', quantity: 1, seconds: 50, xp: 15 },
  milk: { name: 'Cho Mây ăn', building: 'barn', buildingLevel: 1, inputs: { corn: 2 }, output: 'milk', quantity: 2, seconds: 65, xp: 12 },
  cake: { name: 'Bánh bí đỏ', building: 'bakery', buildingLevel: 2, inputs: { flour: 1, pumpkin: 1, milk: 1 }, output: 'cake', quantity: 1, seconds: 90, xp: 25 },
} satisfies Record<string, { name: string; building: BuildingId; buildingLevel: number; inputs: Partial<Record<ItemId, number>>; output: ItemId; quantity: number; seconds: number; xp: number }>;
export type RecipeId = keyof typeof RECIPES;
export const LEVEL_XP = [0, 35, 100, 210, 380, 620, 950, 1400];
export const levelOf = (xp: number) => Math.min(LEVEL_XP.length, LEVEL_XP.filter(n => xp >= n).length);
export type Stats = { harvest: number; plant: number; produce: number; earn: number; decorate: number; upgrade: number; deliver: number };
export const QUESTS: { id: string; name: string; description: string; stat: keyof Stats; target: number; coins: number; xp: number }[] = [
  { id: 'first-harvest', name: 'Giỏ đầu mùa', description: 'Thu hoạch 3 luống cây.', stat: 'harvest', target: 3, coins: 40, xp: 15 },
  { id: 'new-seeds', name: 'Gieo một ngày mới', description: 'Gieo hạt vào 6 luống.', stat: 'plant', target: 6, coins: 35, xp: 15 },
  { id: 'kitchen', name: 'Xưởng nhỏ thức giấc', description: 'Nhận 3 mẻ sản phẩm.', stat: 'produce', target: 3, coins: 60, xp: 25 },
  { id: 'home', name: 'Góc vườn của mình', description: 'Mua 3 món trang trí.', stat: 'decorate', target: 3, coins: 45, xp: 20 },
  { id: 'builder', name: 'Thêm một mái hiên', description: 'Nâng cấp một công trình.', stat: 'upgrade', target: 1, coins: 70, xp: 30 },
  { id: 'neighbor', name: 'Người hàng xóm tốt bụng', description: 'Giao đủ 3 đơn hàng.', stat: 'deliver', target: 3, coins: 90, xp: 35 },
];
export const ORDERS: { name: string; person: string; need: Partial<Record<ItemId, number>>; coins: number; xp: number }[] = [
  { name: 'Bữa súp của bà', person: 'Bà An', need: { carrot: 3 }, coins: 38, xp: 12 },
  { name: 'Bột cho buổi chợ', person: 'Chú Nam', need: { flour: 2 }, coins: 46, xp: 16 },
  { name: 'Giỏ bánh thơm', person: 'Cô Hạ', need: { bread: 1, milk: 1 }, coins: 88, xp: 22 },
  { name: 'Mùa vàng về rồi', person: 'Bà An', need: { corn: 3, wheat: 3 }, coins: 78, xp: 18 },
  { name: 'Chiều bên hiên nhà', person: 'Cô Hạ', need: { cake: 1 }, coins: 130, xp: 30 },
];
