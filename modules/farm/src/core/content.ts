import { ASSETS as OLD_ASSETS, CROPS as OLD_CROPS, QUESTS as OLD_QUESTS } from './legacy/catalog';
export const CONTENT_VERSION = 2;
export type CropId = keyof typeof OLD_CROPS | 'soy' | 'cotton' | 'sunflower' | 'strawberry' | 'tomato' | 'rice' | 'lavender' | 'tea';
export type CropSpec = {
    name: string;
    icon: string;
    color: string;
    seed: number;
    sell: number;
    seconds: number;
    yield: number;
    xp: number;
    level: number;
};
const cropRows: [
    CropId,
    string,
    number,
    number,
    number,
    number,
    number,
    string
][] = [
    ['soy', 'Đậu tương', 4, 14, 14, 180, 4, '#8dac53'], ['cotton', 'Bông', 5, 20, 22, 300, 3, '#e8e1cf'], ['sunflower', 'Hướng dương', 7, 24, 26, 450, 3, '#e4b83f'], ['strawberry', 'Dâu tây', 9, 35, 36, 900, 4, '#c66062'], ['tomato', 'Cà chua', 10, 40, 40, 1200, 4, '#c96745'], ['rice', 'Lúa', 12, 30, 28, 7200, 6, '#b9b063'], ['lavender', 'Oải hương', 17, 55, 60, 14400, 5, '#9b83b8'], ['tea', 'Trà', 20, 65, 65, 28800, 6, '#57855a'],
];
export const CROPS = { ...OLD_CROPS, ...Object.fromEntries(cropRows.map(([id, name, level, seed, sell, seconds, yieldCount, color]) => [id, { name, level, seed, sell, seconds, yield: yieldCount, color, icon: 'leaf', xp: level * 3 + 5 }])) } as Record<CropId, CropSpec>;
export const GOODS = {
    wood: ['Gỗ', 4, '#977151'], stone: ['Đá', 5, '#9e9c8f'], clay: ['Đất sét', 7, '#b18464'], sand: ['Cát', 6, '#d6c998'], ore: ['Quặng sắt', 12, '#827b79'], plank: ['Ván', 24, '#a9855b'], brick: ['Gạch', 30, '#b57359'], iron: ['Thỏi sắt', 42, '#9fa5a3'], nails: ['Đinh', 28, '#979fa2'], glass: ['Kính', 30, '#aed3ce'], tools: ['Dụng cụ', 120, '#8e9a96'],
    flour: ['Bột mì', 18, '#d9c7a2'], bread: ['Bánh mì', 48, '#bb8248'], milk: ['Sữa tươi', 25, '#f0e9da'], cake: ['Bánh bí đỏ', 108, '#d69562'], eggs: ['Trứng', 16, '#f0dbc0'], feed: ['Thức ăn', 30, '#b8a36e'], butter: ['Bơ', 60, '#ead599'], cheese: ['Phô mai', 110, '#dbbc6b'], wool: ['Len', 40, '#ebe2d1'], cloth: ['Vải', 95, '#d6cab0'], apple: ['Táo', 25, '#b65f48'], honey: ['Mật ong', 65, '#d4a94c'],
    pottery: ['Gốm', 65, '#b97657'], oil: ['Dầu', 80, '#d6c476'], juice: ['Nước quả', 90, '#d39f55'], flowers: ['Hoa nhà kính', 100, '#cf8e9a'], fish: ['Cá', 60, '#8db6b7'], soup: ['Súp', 180, '#c08c56'], jam: ['Mứt', 180, '#b9717d'], cherry: ['Anh đào', 45, '#a65368'], garment: ['Áo vải', 240, '#87a69e'], gift: ['Giỏ đặc sản', 450, '#c79b60'], icecream: ['Kem', 240, '#e4c4ab'], herbs: ['Thảo mộc', 70, '#6c9b79'], dye: ['Thuốc nhuộm', 180, '#9b7da6'], pear: ['Lê', 65, '#bcc075'], teapot: ['Ấm trà', 350, '#8ea697'], bouquet: ['Bó hoa', 340, '#d093a4'], feast: ['Tiệc mùa gặt', 1000, '#dcab61'], monument: ['Phù điêu', 1300, '#b8ad8e'],
} as const;
export type ItemId = CropId | keyof typeof GOODS;
export const ITEMS = Object.fromEntries([...Object.entries(CROPS).map(([id, c]) => [id, { name: c.name, sell: c.sell, color: c.color }]), ...Object.entries(GOODS).map(([id, [name, sell, color]]) => [id, { name, sell, color }])]) as Record<ItemId, {
    name: string;
    sell: number;
    color: string;
}>;
export const emptyInventory = () => Object.fromEntries(Object.keys(ITEMS).map(id => [id, 0])) as Record<ItemId, number>;
export type BuildingId = 'home' | 'warehouse' | 'mill' | 'coop' | 'bakery' | 'sawmill' | 'quarry' | 'barn' | 'dairy' | 'iron_mine' | 'smelter' | 'sheepfold' | 'loom' | 'orchard' | 'apiary' | 'pottery' | 'workshop' | 'press' | 'greenhouse' | 'fishpond' | 'fishing_pier' | 'kitchen' | 'preserves' | 'tailor' | 'fairground' | 'icecream' | 'herb_garden' | 'dyehouse' | 'tea_house';
export type DecorId = 'bench' | 'fence' | 'flowers' | 'lantern' | 'arch' | 'well' | 'crates' | 'birdhouse' | 'path' | 'statue';
export type AssetId = BuildingId | DecorId;
export type AssetSpec = {
    name: string;
    description: string;
    width: number;
    depth: number;
    price: number;
    level: number;
    kind: 'building' | 'decor';
    color: string;
};
const buildingRows: [
    BuildingId,
    string,
    number,
    number,
    number,
    number,
    string
][] = [
    ['home', 'Nhà chính', 1, 0, 4, 4, 'Mở giống, nghề, đất và đội thợ.'], ['warehouse', 'Kho hàng', 1, 70, 3, 3, 'Mỗi cấp tăng sức chứa nguyên liệu.'], ['mill', 'Cối xay gió', 2, 100, 3, 3, 'Xay bột và trộn thức ăn.'], ['coop', 'Chuồng gà', 2, 90, 3, 2, 'Cho gà ăn lúa mì để nhận trứng.'], ['bakery', 'Lò bánh', 3, 180, 3, 3, 'Bánh mì và bánh đặc sản.'], ['sawmill', 'Xưởng gỗ', 3, 120, 3, 3, 'Cưa gỗ thành ván.'], ['quarry', 'Trạm đá', 3, 120, 3, 3, 'Thu gom đá, đất sét và cát.'], ['barn', 'Chuồng bò', 4, 220, 4, 3, 'Ngô và thức ăn trở thành sữa.'], ['dairy', 'Xưởng sữa', 4, 240, 3, 3, 'Chế biến bơ và phô mai.'], ['iron_mine', 'Trạm quặng', 4, 250, 3, 3, 'Khảo sát từng lô quặng.'], ['smelter', 'Lò luyện', 5, 300, 3, 3, 'Luyện thỏi sắt, kính và đinh.'], ['sheepfold', 'Chuồng cừu', 5, 260, 4, 3, 'Thức ăn cho đàn cừu, len cho xưởng dệt.'], ['loom', 'Xưởng dệt', 5, 300, 3, 3, 'Dệt bông và len thành vải.'], ['orchard', 'Vườn cây ăn quả', 6, 320, 4, 4, 'Chăm táo, anh đào và lê.'], ['apiary', 'Trại ong', 6, 280, 3, 2, 'Mật ong từ những vụ cây.'], ['pottery', 'Xưởng gốm', 7, 350, 3, 3, 'Đất sét thành gạch và đồ gốm.'], ['workshop', 'Xưởng dụng cụ', 8, 420, 3, 3, 'Dụng cụ khai phá và phù điêu.'], ['press', 'Xưởng ép', 9, 420, 3, 3, 'Dầu hạt và nước quả.'], ['greenhouse', 'Nhà kính', 10, 500, 4, 3, 'Hoa và giống cần chăm sóc.'], ['fishpond', 'Ao nuôi cá', 11, 550, 4, 3, 'Nuôi cá bằng thức ăn.'], ['fishing_pier', 'Cầu cảng', 11, 500, 3, 4, 'Chân bờ trên đất, sàn vươn ra nước.'], ['kitchen', 'Nhà bếp', 12, 600, 3, 3, 'Kết hợp cá và rau thành món ăn.'], ['preserves', 'Xưởng mứt', 13, 650, 3, 3, 'Giữ hương vị trái cây trong lọ mứt.'], ['tailor', 'Xưởng may', 14, 700, 3, 3, 'May áo và quà thủ công.'], ['fairground', 'Nhà hội chợ', 15, 800, 4, 4, 'Giỏ đặc sản, tiệc và hợp đồng.'], ['icecream', 'Xưởng kem', 16, 850, 3, 3, 'Kem sữa và quả.'], ['herb_garden', 'Vườn thảo mộc', 17, 800, 3, 3, 'Thu hái hương thơm.'], ['dyehouse', 'Xưởng nhuộm', 18, 950, 3, 3, 'Màu tự nhiên từ thảo mộc.'], ['tea_house', 'Nhà trà', 20, 1100, 4, 3, 'Trà, gốm và mật cho buổi gặp gỡ.'],
];
export const ASSETS = { ...OLD_ASSETS, ...Object.fromEntries(buildingRows.map(([id, name, level, price, width, depth, description]) => [id, { name, level, price, width, depth, description, kind: 'building', color: '#a88860' }])), path: { name: 'Lối đá', description: 'Một bước chân qua vườn.', width: 1, depth: 1, price: 5, level: 1, kind: 'decor', color: '#b9b295' }, statue: { name: 'Cột mùa gặt', description: 'Dấu mốc nông trại trưởng thành.', width: 2, depth: 2, price: 1500, level: 21, kind: 'decor', color: '#b7b09c' } } as Record<AssetId, AssetSpec>;
export type RecipeSpec = {
    name: string;
    building: BuildingId;
    buildingLevel: number;
    home: number;
    inputs: Partial<Record<ItemId, number>>;
    output: ItemId;
    quantity: number;
    seconds: number;
    xp: number;
};
function r(name: string, building: BuildingId, home: number, buildingLevel: number, inputs: RecipeSpec['inputs'], output: ItemId, quantity: number, seconds: number): RecipeSpec { return { name, building, home, buildingLevel, inputs, output, quantity, seconds, xp: 8 + home * 3 }; }
export const RECIPES = {
    flour: r('Xay bột mì', 'mill', 2, 1, { wheat: 2 }, 'flour', 1, 30), feed: r('Trộn thức ăn', 'mill', 4, 2, { corn: 2, soy: 1 }, 'feed', 2, 120), eggs: r('Cho gà ăn', 'coop', 2, 1, { wheat: 2 }, 'eggs', 2, 90), bread: r('Nướng bánh mì', 'bakery', 3, 1, { flour: 2 }, 'bread', 1, 50), cake: r('Bánh bí đỏ', 'bakery', 4, 2, { flour: 1, pumpkin: 1, milk: 1 }, 'cake', 1, 90), plank: r('Cưa ván', 'sawmill', 3, 1, { wood: 3 }, 'plank', 2, 90), stone: r('Thu gom đá', 'quarry', 3, 1, {}, 'stone', 5, 180), clay: r('Sàng đất sét', 'quarry', 3, 2, { stone: 2 }, 'clay', 3, 180), sand: r('Sàng cát', 'quarry', 5, 3, { stone: 2 }, 'sand', 4, 180), milk: r('Cho Mây ăn ngô', 'barn', 4, 1, { corn: 2 }, 'milk', 2, 65), butter: r('Đánh bơ', 'dairy', 4, 1, { milk: 2 }, 'butter', 1, 180), cheese: r('Ủ phô mai', 'dairy', 6, 3, { milk: 3 }, 'cheese', 1, 600), ore: r('Khảo sát quặng', 'iron_mine', 4, 1, { wood: 2 }, 'ore', 4, 240), iron: r('Luyện thỏi sắt', 'smelter', 5, 1, { ore: 3, wood: 1 }, 'iron', 2, 300), nails: r('Rèn đinh', 'smelter', 5, 2, { iron: 1 }, 'nails', 2, 150), glass: r('Nung kính', 'smelter', 7, 4, { sand: 3, wood: 1 }, 'glass', 2, 300), wool: r('Chăm cừu', 'sheepfold', 5, 1, { feed: 1 }, 'wool', 2, 300), cloth: r('Dệt vải bông', 'loom', 5, 1, { cotton: 3 }, 'cloth', 1, 360), woolcloth: r('Dệt vải len', 'loom', 7, 3, { wool: 2 }, 'cloth', 1, 240), apple: r('Chăm vườn táo', 'orchard', 6, 1, { wheat: 2 }, 'apple', 4, 900), cherry: r('Chăm anh đào', 'orchard', 13, 6, { wheat: 3 }, 'cherry', 4, 1800), pear: r('Chăm vườn lê', 'orchard', 19, 12, { wheat: 4 }, 'pear', 4, 3600), honey: r('Chăm đàn ong', 'apiary', 6, 1, { carrot: 2 }, 'honey', 1, 600), brick: r('Nung gạch', 'pottery', 7, 1, { clay: 3, wood: 1 }, 'brick', 2, 240), pottery: r('Nặn gốm', 'pottery', 7, 2, { clay: 4, wood: 2 }, 'pottery', 1, 480), tools: r('Làm dụng cụ', 'workshop', 8, 1, { iron: 2, plank: 1 }, 'tools', 1, 600), oil: r('Ép dầu hạt', 'press', 9, 1, { sunflower: 2 }, 'oil', 1, 480), juice: r('Ép nước quả', 'press', 9, 2, { apple: 3 }, 'juice', 1, 360), flowers: r('Chăm hoa nhà kính', 'greenhouse', 10, 1, { sunflower: 2 }, 'flowers', 1, 900), bouquet: r('Bó hoa', 'greenhouse', 22, 19, { flowers: 2, cloth: 1 }, 'bouquet', 1, 1200), fish: r('Nuôi cá ao', 'fishpond', 11, 1, { feed: 1 }, 'fish', 2, 1200), fishing: r('Thả lưới', 'fishing_pier', 11, 1, { wheat: 3 }, 'fish', 2, 1800), soup: r('Nấu súp cá', 'kitchen', 12, 1, { fish: 1, carrot: 2, oil: 1 }, 'soup', 1, 600), jam: r('Sên mứt quả', 'preserves', 13, 1, { strawberry: 2, honey: 1 }, 'jam', 1, 900), garment: r('May áo', 'tailor', 14, 1, { cloth: 2 }, 'garment', 1, 1200), gift: r('Đóng giỏ đặc sản', 'fairground', 15, 1, { jam: 1, juice: 1, bread: 2 }, 'gift', 1, 1800), icecream: r('Làm kem quả', 'icecream', 16, 1, { milk: 2, strawberry: 2, honey: 1 }, 'icecream', 1, 1200), herbs: r('Thu hái thảo mộc', 'herb_garden', 17, 1, { lavender: 1 }, 'herbs', 2, 1800), dye: r('Chiết màu tự nhiên', 'dyehouse', 18, 1, { herbs: 2, clay: 1 }, 'dye', 1, 900), teapot: r('Pha ấm trà', 'tea_house', 20, 1, { tea: 2, pottery: 1, honey: 1 }, 'teapot', 1, 1200), feast: r('Tiệc mùa gặt', 'fairground', 23, 16, { soup: 2, cake: 2, juice: 2 }, 'feast', 1, 3600), monument: r('Chạm phù điêu', 'workshop', 24, 21, { stone: 20, tools: 2, dye: 2 }, 'monument', 1, 7200),
};
export type RecipeId = keyof typeof RECIPES;
export { LEVEL_XP, levelOf } from './legacy/catalog';
export type Stats = {
    harvest: number;
    plant: number;
    produce: number;
    earn: number;
    decorate: number;
    upgrade: number;
    deliver: number;
    clear: number;
    explore: number;
    fish: number;
};
export const QUESTS: {
    id: string;
    name: string;
    description: string;
    stat: keyof Stats;
    target: number;
    coins: number;
    xp: number;
}[] = [...OLD_QUESTS, ...(['harvest', 'produce', 'deliver', 'clear', 'explore', 'decorate'] as const).flatMap((stat, i) => [10, 50, 200].map((target, tier) => ({ id: `achievement:${stat}:${tier}`, name: `${['Mùa vàng', 'Bàn tay thợ', 'Bạn của làng', 'Người khai phá', 'Chân trời mới', 'Vườn của mình'][i]} ${tier + 1}`, description: `Đạt ${stat === 'explore' ? [6, 16, 36][tier] : target} ${['lượt thu hoạch', 'mẻ sản phẩm', 'đơn hàng', 'vật cản đã dọn', 'khu đất', 'món trang trí'][i]}.`, stat, target: stat === 'explore' ? [6, 16, 36][tier] : target, coins: 100 * (tier + 1), xp: 20 * (tier + 1) })))];
export const SPEEDUPS = [5, 10, 30, 60] as const;
export type Speedup = typeof SPEEDUPS[number];
