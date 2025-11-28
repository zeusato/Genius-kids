import { StudentProfile, Rarity } from '../types';
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
    image: { id: string; collectionId: string; name: string; imagePath: string; rarity: Rarity } | null;
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
                collectionId: image.collectionId,
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
    medal: 'bronze' | 'silver' | 'gold' | null,
    customStars?: number
): { updatedProfile: StudentProfile; reward: TestReward } => {
    let updatedProfile = { ...profile };
    const stars = customStars !== undefined ? customStars : calculateGameStars(medal);

    // Award stars
    updatedProfile = awardStars(updatedProfile, stars);

    // Try gacha for image (30% chance) - ONLY if medal is earned (Win)
    let gachaResult = null;
    if (medal && shouldReceiveImage()) {
        const gachaRes = gachaImage(updatedProfile.ownedImageIds);
        if (gachaRes) {
            const { image } = gachaRes;
            updatedProfile = awardImage(updatedProfile, image.id);
            gachaResult = {
                id: image.id,
                collectionId: image.collectionId,
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

// ===== Sphinx Riddle Rewards =====

import { RiddleDifficulty, SphinxReward, PenaltyType } from '../types';
import { hasPenalty, clearPenalty, setPenalty } from './sphinxRiddleService';

// Calculate stars based on difficulty
export const calculateSphinxStars = (difficulty: RiddleDifficulty): number => {
    switch (difficulty) {
        case RiddleDifficulty.EASY:
            return 1;
        case RiddleDifficulty.MEDIUM:
            return 2;
        case RiddleDifficulty.HARD:
            return 3;
        default:
            return 0;
    }
};

// Calculate gacha chance based on difficulty
export const getSphinxGachaChance = (difficulty: RiddleDifficulty): number => {
    switch (difficulty) {
        case RiddleDifficulty.EASY:
            return 0.20; // 20%
        case RiddleDifficulty.MEDIUM:
            return 0.30; // 30%
        case RiddleDifficulty.HARD:
            return 0.50; // 50%
        default:
            return 0;
    }
};

// Random penalty selection
export const getRandomPenalty = (): PenaltyType => {
    return Math.random() < 0.5 ? PenaltyType.LOSE_STAR : PenaltyType.SKIP_NEXT_REWARD;
};

// Process Sphinx reward after correct answer
export const processSphinxReward = (
    profile: StudentProfile,
    difficulty: RiddleDifficulty,
    studentId: string
): { updatedProfile: StudentProfile; reward: SphinxReward } => {
    // First check if there's an active penalty
    const penaltyCheck = checkAndConsumePenalty(profile, studentId);

    if (penaltyCheck.shouldSkipReward) {
        // Penalty is active, skip all rewards
        return {
            updatedProfile: penaltyCheck.updatedProfile,
            reward: {
                stars: 0,
                cardWon: false,
                card: undefined,
            },
        };
    }

    let updatedProfile = { ...profile };
    const stars = calculateSphinxStars(difficulty);

    // Award stars
    updatedProfile = awardStars(updatedProfile, stars);

    // Try gacha based on difficulty
    const gachaChance = getSphinxGachaChance(difficulty);
    let cardWon = false;
    let cardData = undefined;

    if (Math.random() < gachaChance) {
        const gachaRes = gachaImage(updatedProfile.ownedImageIds);
        if (gachaRes) {
            const { image } = gachaRes;
            updatedProfile = awardImage(updatedProfile, image.id);
            cardWon = true;
            cardData = {
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
            cardWon,
            card: cardData,
        },
    };
};

// Process Sphinx penalty after wrong answer
export const processSphinxPenalty = (
    profile: StudentProfile,
    studentId: string
): { updatedProfile: StudentProfile; penaltyType: PenaltyType } => {
    let updatedProfile = { ...profile };
    const penaltyType = getRandomPenalty();

    if (penaltyType === PenaltyType.LOSE_STAR) {
        // Deduct 1 star (minimum 0)
        updatedProfile = {
            ...updatedProfile,
            stars: Math.max(0, updatedProfile.stars - 1),
        };
    } else {
        // Mark penalty active for next reward
        setPenalty(studentId);
    }

    return {
        updatedProfile,
        penaltyType,
    };
};

// Check and consume penalty for any reward-giving activity
export const checkAndConsumePenalty = (
    profile: StudentProfile,
    studentId: string
): { shouldSkipReward: boolean; updatedProfile: StudentProfile } => {
    if (hasPenalty(studentId)) {
        // Clear the penalty
        clearPenalty(studentId);

        // Return indication to skip reward
        return {
            shouldSkipReward: true,
            updatedProfile: profile,
        };
    }

    return {
        shouldSkipReward: false,
        updatedProfile: profile,
    };
};

// Updated processTestReward to check penalty
export const processTestRewardWithPenalty = (
    profile: StudentProfile,
    studentId: string,
    score: number,
    totalQuestions: number
): { updatedProfile: StudentProfile; reward: TestReward; rewardSkipped: boolean } => {
    // Check for active penalty
    const penaltyCheck = checkAndConsumePenalty(profile, studentId);

    if (penaltyCheck.shouldSkipReward) {
        return {
            updatedProfile: penaltyCheck.updatedProfile,
            reward: { stars: 0, image: null },
            rewardSkipped: true,
        };
    }

    // Process reward normally
    const result = processTestReward(profile, score, totalQuestions);
    return {
        ...result,
        rewardSkipped: false,
    };
};

// Updated processGameReward to check penalty
export const processGameRewardWithPenalty = (
    profile: StudentProfile,
    studentId: string,
    medal: 'bronze' | 'silver' | 'gold' | null
): { updatedProfile: StudentProfile; reward: TestReward; rewardSkipped: boolean } => {
    // Check for active penalty
    const penaltyCheck = checkAndConsumePenalty(profile, studentId);

    if (penaltyCheck.shouldSkipReward) {
        return {
            updatedProfile: penaltyCheck.updatedProfile,
            reward: { stars: 0, image: null },
            rewardSkipped: true,
        };
    }

    // Process reward normally
    const result = processGameReward(profile, medal);
    return {
        ...result,
        rewardSkipped: false,
    };
};

