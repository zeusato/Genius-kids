import { AlbumCollection, AlbumImage, Rarity } from '../types';

// Animal collection based on files in public/Album/Animal
const ANIMAL_COLLECTION: AlbumCollection = {
    id: 'animal',
    name: 'Thế Giới Động Vật',
    description: 'Bộ sưu tập các loài động vật đáng yêu',
    thumbnailPath: '/Genius-kids/Album/Animal/A-common1.png',
    images: [
        // Common (3 images)
        { id: 'animal_common_1', collectionId: 'animal', name: 'Động vật 1', imagePath: '/Genius-kids/Album/Animal/A-common1.png', rarity: Rarity.Common },
        { id: 'animal_common_2', collectionId: 'animal', name: 'Động vật 2', imagePath: '/Genius-kids/Album/Animal/A-common2.png', rarity: Rarity.Common },
        { id: 'animal_common_3', collectionId: 'animal', name: 'Động vật 3', imagePath: '/Genius-kids/Album/Animal/A-common3.png', rarity: Rarity.Common },

        // Uncommon (3 images)
        { id: 'animal_uncommon_1', collectionId: 'animal', name: 'Động vật hiếm 1', imagePath: '/Genius-kids/Album/Animal/A-uncommon1.png', rarity: Rarity.Uncommon },
        { id: 'animal_uncommon_2', collectionId: 'animal', name: 'Động vật hiếm 2', imagePath: '/Genius-kids/Album/Animal/A-uncommon2.png', rarity: Rarity.Uncommon },
        { id: 'animal_uncommon_3', collectionId: 'animal', name: 'Động vật hiếm 3', imagePath: '/Genius-kids/Album/Animal/A-uncommon3.png', rarity: Rarity.Uncommon },

        // Rare (3 images)
        { id: 'animal_rare_1', collectionId: 'animal', name: 'Động vật quý 1', imagePath: '/Genius-kids/Album/Animal/A-rare1.png', rarity: Rarity.Rare },
        { id: 'animal_rare_2', collectionId: 'animal', name: 'Động vật quý 2', imagePath: '/Genius-kids/Album/Animal/A-rare2.png', rarity: Rarity.Rare },
        { id: 'animal_rare_3', collectionId: 'animal', name: 'Động vật quý 3', imagePath: '/Genius-kids/Album/Animal/A-rare3.png', rarity: Rarity.Rare },

        // Epic (2 images)
        { id: 'animal_epic_1', collectionId: 'animal', name: 'Động vật sử thi 1', imagePath: '/Genius-kids/Album/Animal/A-epic1.png', rarity: Rarity.Epic },
        { id: 'animal_epic_2', collectionId: 'animal', name: 'Động vật sử thi 2', imagePath: '/Genius-kids/Album/Animal/A-epic2.png', rarity: Rarity.Epic },

        // Legendary (1 image)
        { id: 'animal_legendary', collectionId: 'animal', name: 'Động vật huyền thoại', imagePath: '/Genius-kids/Album/Animal/A-legendary.png', rarity: Rarity.Legendary },
    ],
};

// Zodiac collection based on files in public/Album/Zodiac
const ZODIAC_COLLECTION: AlbumCollection = {
    id: 'zodiac',
    name: 'Cung Hoàng Đạo',
    description: 'Bộ sưu tập 12 con giáp phương Đông',
    thumbnailPath: '/Genius-kids/Album/Zodiac/Z-Dragon-legendary.png',
    images: [
        // Common (4 images)
        { id: 'zodiac_mouse', collectionId: 'zodiac', name: 'Chuột', imagePath: '/Genius-kids/Album/Zodiac/Z-Mouse-common.png', rarity: Rarity.Common },
        { id: 'zodiac_dog', collectionId: 'zodiac', name: 'Chó', imagePath: '/Genius-kids/Album/Zodiac/Z-Dog-common.png', rarity: Rarity.Common },
        { id: 'zodiac_goat', collectionId: 'zodiac', name: 'Dê', imagePath: '/Genius-kids/Album/Zodiac/Z-Goat-common.png', rarity: Rarity.Common },
        { id: 'zodiac_pig', collectionId: 'zodiac', name: 'Heo', imagePath: '/Genius-kids/Album/Zodiac/Z-Pig-common.png', rarity: Rarity.Common },

        // Uncommon (3 images)
        { id: 'zodiac_chicken', collectionId: 'zodiac', name: 'Gà', imagePath: '/Genius-kids/Album/Zodiac/Z-Chicken-uncommon.png', rarity: Rarity.Uncommon },
        { id: 'zodiac_ox', collectionId: 'zodiac', name: 'Trâu', imagePath: '/Genius-kids/Album/Zodiac/Z-Ox-uncommon.png', rarity: Rarity.Uncommon },
        { id: 'zodiac_rabbit', collectionId: 'zodiac', name: 'Thỏ', imagePath: '/Genius-kids/Album/Zodiac/Z-Rabbit-uncommon.png', rarity: Rarity.Uncommon },

        // Rare (2 images)
        { id: 'zodiac_monkey', collectionId: 'zodiac', name: 'Khỉ', imagePath: '/Genius-kids/Album/Zodiac/Z-Monkey-rare.png', rarity: Rarity.Rare },
        { id: 'zodiac_snake', collectionId: 'zodiac', name: 'Rắn', imagePath: '/Genius-kids/Album/Zodiac/Z-Snake-rare.png', rarity: Rarity.Rare },

        // Epic (2 images)
        { id: 'zodiac_horse', collectionId: 'zodiac', name: 'Ngựa', imagePath: '/Genius-kids/Album/Zodiac/Z-Horse-epic.png', rarity: Rarity.Epic },
        { id: 'zodiac_tiger', collectionId: 'zodiac', name: 'Hổ', imagePath: '/Genius-kids/Album/Zodiac/Z-Tiger-epic.png', rarity: Rarity.Epic },

        // Legendary (1 image)
        { id: 'zodiac_dragon', collectionId: 'zodiac', name: 'Rồng', imagePath: '/Genius-kids/Album/Zodiac/Z-Dragon-legendary.png', rarity: Rarity.Legendary },
    ],
};

// Kimetsu no Yaiba collection based on files in public/Album/Kimesu-No-Yaiba
const KIMETSU_COLLECTION: AlbumCollection = {
    id: 'kimetsu',
    name: 'Kimetsu no Yaiba',
    description: 'Bộ sưu tập nhân vật và kỹ năng từ thế giới Diệt Quỷ',
    thumbnailPath: '/Genius-kids/Album/Kimesu-No-Yaiba/demon_slayers_bond-Legendary.png',
    images: [
        // Common (4 images)
        { id: 'kimetsu_inosukes_mask', collectionId: 'kimetsu', name: "Inosuke's Mask", imagePath: '/Genius-kids/Album/Kimesu-No-Yaiba/inosukes_mask-Common.png', rarity: Rarity.Common },
        { id: 'kimetsu_nezukos_slumber', collectionId: 'kimetsu', name: "Nezuko's Slumber", imagePath: '/Genius-kids/Album/Kimesu-No-Yaiba/nezukos_slumber-Common.png', rarity: Rarity.Common },
        { id: 'kimetsu_tanjiros_resolve', collectionId: 'kimetsu', name: "Tanjiro's Resolve", imagePath: '/Genius-kids/Album/Kimesu-No-Yaiba/tanjiros_resolve-Common.png', rarity: Rarity.Common },
        { id: 'kimetsu_zenitsus_nap', collectionId: 'kimetsu', name: "Zenitsu's Nap", imagePath: '/Genius-kids/Album/Kimesu-No-Yaiba/zenitsus_nap-Common.png', rarity: Rarity.Common },

        // Uncommon (3 images)
        { id: 'kimetsu_giyu_tomioka', collectionId: 'kimetsu', name: 'Giyu Tomioka', imagePath: '/Genius-kids/Album/Kimesu-No-Yaiba/giyu_tomioka-Uncommon.png', rarity: Rarity.Uncommon },
        { id: 'kimetsu_rengokus_spirit', collectionId: 'kimetsu', name: "Rengoku's Spirit", imagePath: '/Genius-kids/Album/Kimesu-No-Yaiba/rengokus_spirit-Uncommon.png', rarity: Rarity.Uncommon },
        { id: 'kimetsu_shinobu_kocho', collectionId: 'kimetsu', name: 'Shinobu Kocho', imagePath: '/Genius-kids/Album/Kimesu-No-Yaiba/shinobu_kocho-Uncommon.png', rarity: Rarity.Uncommon },

        // Rare (2 images)
        { id: 'kimetsu_thunderclap_flash', collectionId: 'kimetsu', name: 'Thunderclap Flash', imagePath: '/Genius-kids/Album/Kimesu-No-Yaiba/thunderclap_flash-Rare.png', rarity: Rarity.Rare },
        { id: 'kimetsu_water_wheel', collectionId: 'kimetsu', name: 'Water Wheel', imagePath: '/Genius-kids/Album/Kimesu-No-Yaiba/water_wheel-Rare.png', rarity: Rarity.Rare },

        // Epic (2 images)
        { id: 'kimetsu_flame_hashiras_roar', collectionId: 'kimetsu', name: "Flame Hashira's Roar", imagePath: '/Genius-kids/Album/Kimesu-No-Yaiba/flame_hashiras_roar-Epic.png', rarity: Rarity.Epic },
        { id: 'kimetsu_hinokami_kagura', collectionId: 'kimetsu', name: 'Hinokami Kagura', imagePath: '/Genius-kids/Album/Kimesu-No-Yaiba/hinokami_kagura-Epic.png', rarity: Rarity.Epic },

        // Legendary (1 image)
        { id: 'kimetsu_demon_slayers_bond', collectionId: 'kimetsu', name: "Demon Slayers' Bond", imagePath: '/Genius-kids/Album/Kimesu-No-Yaiba/demon_slayers_bond-Legendary.png', rarity: Rarity.Legendary },
    ],
};

// Dragon Ball collection based on files in public/Album/Dragon ball
const DRAGONBALL_COLLECTION: AlbumCollection = {
    id: 'dragonball',
    name: 'Dragon Ball',
    description: 'Bộ sưu tập nhân vật và trận chiến từ thế giới Dragon Ball',
    thumbnailPath: '/Genius-kids/Album/Dragon ball/Super Saiyan 3_Legendary.png',
    images: [
        // Common (4 images)
        { id: 'dragonball_goku', collectionId: 'dragonball', name: 'Goku', imagePath: '/Genius-kids/Album/Dragon ball/Goku-Common.png', rarity: Rarity.Common },
        { id: 'dragonball_kid_goku', collectionId: 'dragonball', name: 'Kid Goku', imagePath: '/Genius-kids/Album/Dragon ball/kid_goku-Common.png', rarity: Rarity.Common },
        { id: 'dragonball_krillins_disc', collectionId: 'dragonball', name: "Krillin's Disc", imagePath: '/Genius-kids/Album/Dragon ball/krillins_disc-Common.png', rarity: Rarity.Common },
        { id: 'dragonball_master_roshi', collectionId: 'dragonball', name: 'Master Roshi', imagePath: '/Genius-kids/Album/Dragon ball/master_roshi-Common.png', rarity: Rarity.Common },

        // Uncommon (3 images)
        { id: 'dragonball_piccolos_stance', collectionId: 'dragonball', name: "Piccolo's Stance", imagePath: '/Genius-kids/Album/Dragon ball/piccolos_stance-Uncommon.png', rarity: Rarity.Uncommon },
        { id: 'dragonball_vegetas_pride', collectionId: 'dragonball', name: "Vegeta's Pride", imagePath: '/Genius-kids/Album/Dragon ball/vegetas_pride-Uncommon.png', rarity: Rarity.Uncommon },
        { id: 'dragonball_young_gohan', collectionId: 'dragonball', name: 'Young Gohan', imagePath: '/Genius-kids/Album/Dragon ball/young_gohan-Uncommon.png', rarity: Rarity.Uncommon },

        // Rare (2 images)
        { id: 'dragonball_perfect_cell', collectionId: 'dragonball', name: 'Perfect Cell', imagePath: '/Genius-kids/Album/Dragon ball/perfect_cell-Rare.png', rarity: Rarity.Rare },
        { id: 'dragonball_super_saiyan_goku', collectionId: 'dragonball', name: 'Super Saiyan Goku', imagePath: '/Genius-kids/Album/Dragon ball/super_saiyan_goku-Rare.png', rarity: Rarity.Rare },

        // Epic (2 images)
        { id: 'dragonball_gohan_vs_cell', collectionId: 'dragonball', name: 'Gohan vs Cell', imagePath: '/Genius-kids/Album/Dragon ball/Gohan vs Cell-Epic.png', rarity: Rarity.Epic },
        { id: 'dragonball_goku_vs_frieza', collectionId: 'dragonball', name: 'Goku vs Frieza', imagePath: '/Genius-kids/Album/Dragon ball/goku_vs_frieza-Epic.png', rarity: Rarity.Epic },

        // Legendary (1 image)
        { id: 'dragonball_super_saiyan_3', collectionId: 'dragonball', name: 'Super Saiyan 3', imagePath: '/Genius-kids/Album/Dragon ball/Super Saiyan 3_Legendary.png', rarity: Rarity.Legendary },
    ],
};

const ALL_COLLECTIONS = [ANIMAL_COLLECTION, ZODIAC_COLLECTION, KIMETSU_COLLECTION, DRAGONBALL_COLLECTION];

export const getAllCollections = (): AlbumCollection[] => {
    return ALL_COLLECTIONS;
};

export const getCollectionById = (id: string): AlbumCollection | undefined => {
    return ALL_COLLECTIONS.find(c => c.id === id);
};

export const getAllImages = (): AlbumImage[] => {
    return ALL_COLLECTIONS.flatMap(c => c.images);
};

export const getImageById = (id: string): AlbumImage | undefined => {
    return getAllImages().find(img => img.id === id);
};

// Gacha system - returns random image based on rarity probabilities
// Can return duplicates as per user request
export const gachaImage = (ownedImageIds: string[] = []): { image: AlbumImage, isNew: boolean } | null => {
    const allImages = getAllImages();

    if (allImages.length === 0) {
        return null;
    }

    // Rarity probabilities
    const rarityWeights: Record<Rarity, number> = {
        [Rarity.Common]: 44,
        [Rarity.Uncommon]: 30,
        [Rarity.Rare]: 20,
        [Rarity.Epic]: 5,
        [Rarity.Legendary]: 1,
    };

    // Roll for rarity
    const totalWeight = Object.values(rarityWeights).reduce((a, b) => a + b, 0);
    let roll = Math.random() * totalWeight;
    let selectedRarity: Rarity = Rarity.Common;

    for (const [rarity, weight] of Object.entries(rarityWeights)) {
        roll -= weight;
        if (roll <= 0) {
            selectedRarity = rarity as Rarity;
            break;
        }
    }

    // Get images of selected rarity (can include owned images)
    let candidateImages = allImages.filter(img => img.rarity === selectedRarity);

    // If no images of that rarity exist, try next higher rarity
    const rarityOrder = [Rarity.Common, Rarity.Uncommon, Rarity.Rare, Rarity.Epic, Rarity.Legendary];
    let rarityIndex = rarityOrder.indexOf(selectedRarity);

    while (candidateImages.length === 0 && rarityIndex < rarityOrder.length) {
        rarityIndex++;
        if (rarityIndex < rarityOrder.length) {
            candidateImages = allImages.filter(img => img.rarity === rarityOrder[rarityIndex]);
        }
    }

    // If still no candidates, try lower rarities
    if (candidateImages.length === 0) {
        rarityIndex = rarityOrder.indexOf(selectedRarity) - 1;
        while (candidateImages.length === 0 && rarityIndex >= 0) {
            candidateImages = allImages.filter(img => img.rarity === rarityOrder[rarityIndex]);
            rarityIndex--;
        }
    }

    // Random select from candidates
    if (candidateImages.length > 0) {
        const selectedImage = candidateImages[Math.floor(Math.random() * candidateImages.length)];
        const isNew = !ownedImageIds.includes(selectedImage.id);
        return { image: selectedImage, isNew };
    }

    return null;
};

// Check if should receive image (50% chance)
export const shouldReceiveImage = (): boolean => {
    return Math.random() < 0.5;
};

// Get rarity color for UI
export const getRarityColor = (rarity: Rarity): string => {
    const colors: Record<Rarity, string> = {
        [Rarity.Common]: '#9CA3AF', // gray
        [Rarity.Uncommon]: '#10B981', // green
        [Rarity.Rare]: '#3B82F6', // blue
        [Rarity.Epic]: '#8B5CF6', // purple
        [Rarity.Legendary]: '#F59E0B', // gold
    };
    return colors[rarity];
};

// Get rarity name in Vietnamese
export const getRarityName = (rarity: Rarity): string => {
    const names: Record<Rarity, string> = {
        [Rarity.Common]: 'Phổ thông',
        [Rarity.Uncommon]: 'Không phổ biến',
        [Rarity.Rare]: 'Hiếm',
        [Rarity.Epic]: 'Sử thi',
        [Rarity.Legendary]: 'Huyền thoại',
    };
    return names[rarity];
};
