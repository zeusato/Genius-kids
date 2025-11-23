import { StudentProfile, Rarity, ShopDailyPhoto } from '../types';
import { getAllImages } from './albumService';
import { getAllAvatars } from './avatarService';
import { getAllThemes } from './themeService';

// Get all avatars for shop (show all, user decides what to buy)
export const getShopAvatars = () => {
    return getAllAvatars();
};

// Get all themes for shop (show all, user decides what to buy)
export const getShopThemes = () => {
    return getAllThemes();
};

// Get daily photos for shop
export const getDailyPhotos = (profile: StudentProfile): ShopDailyPhoto[] => {
    // Check if refresh needed
    const refreshed = refreshDailyPhotosIfNeeded(profile);
    return refreshed ? refreshed.shopDailyPhotos : profile.shopDailyPhotos;
};

// Check if we need to refresh (at midnight each day)
export const needsRefresh = (lastRefreshDate: string): boolean => {
    if (!lastRefreshDate) return true;

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return lastRefreshDate !== today;
};

// Refresh daily photos if it's a new day
export const refreshDailyPhotosIfNeeded = (profile: StudentProfile): StudentProfile | null => {
    // Check if already have photos and they're fresh
    if (profile.shopDailyPhotos.length > 0) {
        const lastRefresh = profile.shopDailyPhotos[0]?.lastRefreshDate;
        if (lastRefresh && !needsRefresh(lastRefresh)) {
            return null; // No refresh needed
        }
    }

    // Generate new daily photos
    const today = new Date().toISOString().split('T')[0];
    const allImages = getAllImages();

    // Separate by rarity (show all images, not filtered by ownership)
    const common = allImages.filter(img => img.rarity === Rarity.Common);
    const uncommon = allImages.filter(img => img.rarity === Rarity.Uncommon);
    const rare = allImages.filter(img => img.rarity === Rarity.Rare);

    const dailyPhotos: ShopDailyPhoto[] = [];

    // Pick 2 common
    const selectedCommon = getRandomItems(common, Math.min(2, common.length));
    selectedCommon.forEach(img => {
        dailyPhotos.push({
            imageId: img.id,
            rarity: Rarity.Common,
            lastRefreshDate: today,
        });
    });

    // Pick 2 uncommon
    const selectedUncommon = getRandomItems(uncommon, Math.min(2, uncommon.length));
    selectedUncommon.forEach(img => {
        dailyPhotos.push({
            imageId: img.id,
            rarity: Rarity.Uncommon,
            lastRefreshDate: today,
        });
    });

    // Pick 1 rare
    const selectedRare = getRandomItems(rare, Math.min(1, rare.length));
    selectedRare.forEach(img => {
        dailyPhotos.push({
            imageId: img.id,
            rarity: Rarity.Rare,
            lastRefreshDate: today,
        });
    });

    // If not enough images of specified rarity, fill with any available
    const allAvailable = allImages.filter(img =>
        !dailyPhotos.some(dp => dp.imageId === img.id)
    );
    while (dailyPhotos.length < 5 && allAvailable.length > 0) {
        const picked = allAvailable[Math.floor(Math.random() * allAvailable.length)];
        dailyPhotos.push({
            imageId: picked.id,
            rarity: picked.rarity,
            lastRefreshDate: today,
        });
        allAvailable.splice(allAvailable.indexOf(picked), 1);
    }

    return {
        ...profile,
        shopDailyPhotos: dailyPhotos,
    };
};

// Helper to get random items from array
const getRandomItems = <T,>(array: T[], count: number): T[] => {
    const shuffled = [...array].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
};

// Get price for daily photo
export const getPhotoPrice = (rarity: Rarity): number => {
    const prices: Record<Rarity, number> = {
        [Rarity.Common]: 20,
        [Rarity.Uncommon]: 30,
        [Rarity.Rare]: 40,
        [Rarity.Epic]: 50,
        [Rarity.Legendary]: 100,
    };
    return prices[rarity];
};

// Purchase item
export const purchaseAvatar = (profile: StudentProfile, avatarId: string, cost: number): StudentProfile | null => {
    if (profile.stars < cost) return null; // Not enough stars
    if (profile.ownedAvatarIds.includes(avatarId)) return null; // Already owned

    return {
        ...profile,
        stars: profile.stars - cost,
        ownedAvatarIds: [...profile.ownedAvatarIds, avatarId],
    };
};

export const purchaseTheme = (profile: StudentProfile, themeId: string, cost: number): StudentProfile | null => {
    if (profile.stars < cost) return null;
    if (profile.ownedThemeIds.includes(themeId)) return null;

    return {
        ...profile,
        stars: profile.stars - cost,
        ownedThemeIds: [...profile.ownedThemeIds, themeId],
    };
};

export const purchasePhoto = (profile: StudentProfile, imageId: string, rarity: Rarity): StudentProfile | null => {
    const cost = getPhotoPrice(rarity);
    if (profile.stars < cost) return null;
    if (profile.ownedImageIds.includes(imageId)) return null;

    // Remove from daily photos
    const updatedDailyPhotos = profile.shopDailyPhotos.filter(dp => dp.imageId !== imageId);

    return {
        ...profile,
        stars: profile.stars - cost,
        ownedImageIds: [...profile.ownedImageIds, imageId],
        shopDailyPhotos: updatedDailyPhotos,
    };
};

export const canPurchase = (profile: StudentProfile, cost: number): boolean => {
    return profile.stars >= cost;
};

// Initialize daily photos for new profile
export const initializeShopDailyPhotos = (): ShopDailyPhoto[] => {
    const today = new Date().toISOString().split('T')[0];
    const allImages = getAllImages();

    // Separate by rarity
    const common = allImages.filter(img => img.rarity === Rarity.Common);
    const uncommon = allImages.filter(img => img.rarity === Rarity.Uncommon);
    const rare = allImages.filter(img => img.rarity === Rarity.Rare);

    const dailyPhotos: ShopDailyPhoto[] = [];

    // Pick 2 common
    const selectedCommon = getRandomItems(common, Math.min(2, common.length));
    selectedCommon.forEach(img => {
        dailyPhotos.push({
            imageId: img.id,
            rarity: Rarity.Common,
            lastRefreshDate: today,
        });
    });

    // Pick 2 uncommon
    const selectedUncommon = getRandomItems(uncommon, Math.min(2, uncommon.length));
    selectedUncommon.forEach(img => {
        dailyPhotos.push({
            imageId: img.id,
            rarity: Rarity.Uncommon,
            lastRefreshDate: today,
        });
    });

    // Pick 1 rare
    const selectedRare = getRandomItems(rare, Math.min(1, rare.length));
    selectedRare.forEach(img => {
        dailyPhotos.push({
            imageId: img.id,
            rarity: Rarity.Rare,
            lastRefreshDate: today,
        });
    });

    return dailyPhotos;
};
