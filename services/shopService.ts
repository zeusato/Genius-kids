import { StudentProfile, Rarity, ShopDailyPhoto, AlbumImage } from '../types';
import { getAllImages, gachaImage } from './albumService';
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

    // Generate new daily photos - ONLY show images the user doesn't own
    const today = new Date().toISOString().split('T')[0];
    const allImages = getAllImages();

    // Filter out images the user already owns
    const unownedImages = allImages.filter(img => !profile.ownedImageIds.includes(img.id));

    // If user owns everything, return empty shop
    if (unownedImages.length === 0) {
        return {
            ...profile,
            shopDailyPhotos: [],
        };
    }

    // Separate unowned images by rarity
    const common = unownedImages.filter(img => img.rarity === Rarity.Common);
    const uncommon = unownedImages.filter(img => img.rarity === Rarity.Uncommon);
    const rare = unownedImages.filter(img => img.rarity === Rarity.Rare);
    const epic = unownedImages.filter(img => img.rarity === Rarity.Epic);
    const legendary = unownedImages.filter(img => img.rarity === Rarity.Legendary);

    const dailyPhotos: ShopDailyPhoto[] = [];

    // Pick 2 common (if available)
    const selectedCommon = getRandomItems(common, Math.min(2, common.length));
    selectedCommon.forEach(img => {
        dailyPhotos.push({
            imageId: img.id,
            rarity: img.rarity,
            lastRefreshDate: today,
        });
    });

    // Pick 2 uncommon (if available)
    const selectedUncommon = getRandomItems(uncommon, Math.min(2, uncommon.length));
    selectedUncommon.forEach(img => {
        dailyPhotos.push({
            imageId: img.id,
            rarity: img.rarity,
            lastRefreshDate: today,
        });
    });

    // Pick 1 rare (if available)
    const selectedRare = getRandomItems(rare, Math.min(1, rare.length));
    selectedRare.forEach(img => {
        dailyPhotos.push({
            imageId: img.id,
            rarity: img.rarity,
            lastRefreshDate: today,
        });
    });

    // If not enough images of specified rarity, fill with higher rarities
    if (dailyPhotos.length < 5) {
        const alreadySelected = new Set(dailyPhotos.map(dp => dp.imageId));
        const remaining = unownedImages.filter(img => !alreadySelected.has(img.id));

        // Prioritize epic and legendary for remaining slots
        const priorityOrder = [...epic, ...legendary, ...rare, ...uncommon, ...common];
        const uniquePriority = priorityOrder.filter(img => !alreadySelected.has(img.id));

        const additionalPicks = getRandomItems(uniquePriority, Math.min(5 - dailyPhotos.length, uniquePriority.length));
        additionalPicks.forEach(img => {
            dailyPhotos.push({
                imageId: img.id,
                rarity: img.rarity,
                lastRefreshDate: today,
            });
        });
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

// Purchase gacha spin - 50 stars per spin
export const purchaseGachaSpin = (profile: StudentProfile): {
    updatedProfile: StudentProfile;
    gachaResult: { image: AlbumImage; isNew: boolean }
} | null => {
    const GACHA_COST = 50;
    const DUPLICATE_REFUND = 10;

    // Check if user has enough stars
    if (profile.stars < GACHA_COST) {
        return null;
    }

    // Spin the gacha
    const result = gachaImage(profile.ownedImageIds);

    if (!result) {
        return null; // No images available
    }

    const { image, isNew } = result;

    // Calculate final cost and update profile
    if (isNew) {
        // New card - deduct full cost and add to collection
        return {
            updatedProfile: {
                ...profile,
                stars: profile.stars - GACHA_COST,
                ownedImageIds: [...profile.ownedImageIds, image.id],
            },
            gachaResult: result,
        };
    } else {
        // Duplicate card - deduct cost but refund 10 stars
        return {
            updatedProfile: {
                ...profile,
                stars: profile.stars - GACHA_COST + DUPLICATE_REFUND,
            },
            gachaResult: result,
        };
    }
};

// Preview gacha spin (free, doesn't update profile)
export const previewGachaSpin = (): { image: AlbumImage; isNew: boolean } | null => {
    // Just call gachaImage with empty owned list to get a random card
    // We don't check ownership since it's just a preview
    const result = gachaImage([]);
    return result;
};

export const canPurchase = (profile: StudentProfile, cost: number): boolean => {
    return profile.stars >= cost;
};

// Initialize daily photos for new profile (only unowned)
export const initializeShopDailyPhotos = (ownedImageIds: string[] = []): ShopDailyPhoto[] => {
    const today = new Date().toISOString().split('T')[0];
    const allImages = getAllImages();

    // Filter out owned images
    const unownedImages = allImages.filter(img => !ownedImageIds.includes(img.id));

    if (unownedImages.length === 0) {
        return [];
    }

    // Separate by rarity
    const common = unownedImages.filter(img => img.rarity === Rarity.Common);
    const uncommon = unownedImages.filter(img => img.rarity === Rarity.Uncommon);
    const rare = unownedImages.filter(img => img.rarity === Rarity.Rare);

    const dailyPhotos: ShopDailyPhoto[] = [];

    // Pick 2 common
    const selectedCommon = getRandomItems(common, Math.min(2, common.length));
    selectedCommon.forEach(img => {
        dailyPhotos.push({
            imageId: img.id,
            rarity: img.rarity,
            lastRefreshDate: today,
        });
    });

    // Pick 2 uncommon
    const selectedUncommon = getRandomItems(uncommon, Math.min(2, uncommon.length));
    selectedUncommon.forEach(img => {
        dailyPhotos.push({
            imageId: img.id,
            rarity: img.rarity,
            lastRefreshDate: today,
        });
    });

    // Pick 1 rare
    const selectedRare = getRandomItems(rare, Math.min(1, rare.length));
    selectedRare.forEach(img => {
        dailyPhotos.push({
            imageId: img.id,
            rarity: img.rarity,
            lastRefreshDate: today,
        });
    });

    // If not enough, fill with any unowned
    if (dailyPhotos.length < 5) {
        const alreadySelected = new Set(dailyPhotos.map(dp => dp.imageId));
        const remaining = unownedImages.filter(img => !alreadySelected.has(img.id));
        const additional = getRandomItems(remaining, Math.min(5 - dailyPhotos.length, remaining.length));
        additional.forEach(img => {
            dailyPhotos.push({
                imageId: img.id,
                rarity: img.rarity,
                lastRefreshDate: today,
            });
        });
    }

    return dailyPhotos;
};
