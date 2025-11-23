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

const ALL_COLLECTIONS = [ANIMAL_COLLECTION];

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

// Check if should receive image (30% chance)
export const shouldReceiveImage = (): boolean => {
    return Math.random() < 0.3;
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
