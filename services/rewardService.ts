import { StudentProfile } from '../types';
import { gachaImage, shouldReceiveImage } from './albumService';

// Calculate stars earned from test results
export const calculateTestStars = (score: number, totalQuestions: number): number => {
    const percentage = (score / totalQuestions) * 100;

    if (percentage >= 100) return 5;
    if (percentage >= 90) return 4;
    if (percentage >= 80) return 3;
    if (percentage >= 70) return 2;
    if (percentage >= 60) return 1;
    return 0;
};

// Calculate stars earned from game medal
export const calculateGameStars = (medal: 'bronze' | 'silver' | 'gold' | null): number => {
    if (medal === 'gold') return 3;
    if (medal === 'silver') return 2;
    if (medal === 'bronze') return 1;
    return 0;
};

// Award stars to profile
export const awardStars = (profile: StudentProfile, stars: number): StudentProfile => {
    return {
        ...profile,
        stars: profile.stars + stars,
    };
};

// Award image to profile (called when gacha succeeds)
export const awardImage = (profile: StudentProfile, imageId: string): StudentProfile => {
    if (profile.ownedImageIds.includes(imageId)) {
        return profile; // Already owned, no change
    }

    return {
        ...profile,
        ownedImageIds: [...profile.ownedImageIds, imageId],
    };
};

// Complete reward flow after test
export interface TestReward {
    stars: number;
    image: { id: string; name: string; imagePath: string; rarity: string } | null;
}

export const processTestReward = (
    profile: StudentProfile,
    score: number,
    totalQuestions: number
): { updatedProfile: StudentProfile; reward: TestReward } => {
    let updatedProfile = { ...profile };
    const stars = calculateTestStars(score, totalQuestions);

    // Award stars
    updatedProfile = awardStars(updatedProfile, stars);

    // Try gacha for image (30% chance)
    let gachaResult = null;
    if (shouldReceiveImage()) {
        const gachaRes = gachaImage(updatedProfile.ownedImageIds);
        if (gachaRes) {
            const { image } = gachaRes;
            updatedProfile = awardImage(updatedProfile, image.id);
            gachaResult = {
                id: image.id,
                name: image.name,
                imagePath: image.imagePath,
                rarity: image.rarity,
            };
        }
    }

    return {
        updatedProfile,
        reward: {
            stars,
            image: gachaResult,
        },
    };
};

// Complete reward flow after game
export const processGameReward = (
    profile: StudentProfile,
    medal: 'bronze' | 'silver' | 'gold' | null
): { updatedProfile: StudentProfile; reward: TestReward } => {
    let updatedProfile = { ...profile };
    const stars = calculateGameStars(medal);

    // Award stars
    updatedProfile = awardStars(updatedProfile, stars);

    // Try gacha for image (30% chance)
    let gachaResult = null;
    if (shouldReceiveImage()) {
        const gachaRes = gachaImage(updatedProfile.ownedImageIds);
        if (gachaRes) {
            const { image } = gachaRes;
            updatedProfile = awardImage(updatedProfile, image.id);
            gachaResult = {
                id: image.id,
                name: image.name,
                imagePath: image.imagePath,
                rarity: image.rarity,
            };
        }
    }

    return {
        updatedProfile,
        reward: {
            stars,
            image: gachaResult,
        },
    };
};
