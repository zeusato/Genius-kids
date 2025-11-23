import { StudentProfile, Grade, GameResult, TestResult } from '../types';
import { getDefaultAvatarId } from './avatarService';
import { getDefaultThemeId } from './themeService';
import { initializeShopDailyPhotos } from './shopService';

const STORAGE_KEY = 'math_profiles';

// Load all profiles from localStorage
export const getAllProfiles = (): StudentProfile[] => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];

    try {
        const profiles = JSON.parse(saved);
        return profiles.map((p: any) => migrateProfile(p));
    } catch (e) {
        console.error('Error loading profiles:', e);
        return [];
    }
};

// Save all profiles to localStorage
export const saveProfiles = (profiles: StudentProfile[]): void => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
};

// Create new profile with defaults
export const createProfile = (name: string, grade: Grade): StudentProfile => {
    const defaultAvatarId = 'avatar_01'; // Default to puppy
    const defaultThemeId = getDefaultThemeId();

    return {
        id: Date.now().toString(),
        name,
        age: grade + 6, // Rough estimate
        grade,
        avatarId: 0, // deprecated
        currentAvatarId: defaultAvatarId,
        currentThemeId: defaultThemeId,
        stars: 0,
        ownedAvatarIds: [defaultAvatarId], // Start with one free avatar
        ownedThemeIds: [defaultThemeId], // Start with free classic theme
        ownedImageIds: [],
        history: [],
        gameHistory: [],
        shopDailyPhotos: initializeShopDailyPhotos(),
    };
};

// Update profile
export const updateProfile = (profile: StudentProfile): StudentProfile[] => {
    const profiles = getAllProfiles();
    const index = profiles.findIndex(p => p.id === profile.id);

    if (index >= 0) {
        profiles[index] = profile;
    } else {
        profiles.push(profile);
    }

    saveProfiles(profiles);
    return profiles;
};

// Delete profile
export const deleteProfile = (profileId: string): StudentProfile[] => {
    const profiles = getAllProfiles().filter(p => p.id !== profileId);
    saveProfiles(profiles);
    return profiles;
};

// Get profile by ID
export const getProfileById = (profileId: string): StudentProfile | undefined => {
    return getAllProfiles().find(p => p.id === profileId);
};

// Migrate old profile format to new format
export const migrateProfile = (oldProfile: any): StudentProfile => {
    // Check if already migrated
    if (oldProfile.currentAvatarId && oldProfile.stars !== undefined) {
        return oldProfile as StudentProfile;
    }

    // Old format - migrate
    const defaultAvatarId = 'avatar_01';
    const defaultThemeId = getDefaultThemeId();

    return {
        id: oldProfile.id || Date.now().toString(),
        name: oldProfile.name || 'Student',
        age: oldProfile.age || 8,
        grade: oldProfile.grade || Grade.Grade2,
        avatarId: oldProfile.avatarId || 0, // keep for compatibility
        currentAvatarId: defaultAvatarId,
        currentThemeId: defaultThemeId,
        stars: 0, // Start with 0 stars
        ownedAvatarIds: [defaultAvatarId],
        ownedThemeIds: [defaultThemeId],
        ownedImageIds: [],
        history: oldProfile.history || [],
        gameHistory: oldProfile.gameHistory || [],
        shopDailyPhotos: [],
    };
};

// Get statistics for profile
export interface ProfileStats {
    totalTests: number;
    averageTestScore: number;
    totalGames: number;
    averageGameScore: number;
    gamesByType: Record<string, { count: number; avgScore: number; avgStars: number }>;
    totalStarsEarned: number;
    totalImagesCollected: number;
}

export const getProfileStats = (profile: StudentProfile): ProfileStats => {
    const totalTests = profile.history.length;
    const averageTestScore = totalTests > 0
        ? Math.round(profile.history.reduce((acc, test) => acc + ((test.score / test.totalQuestions) * 100), 0) / totalTests)
        : 0;

    const totalGames = profile.gameHistory.length;
    const averageGameScore = totalGames > 0
        ? Math.round(profile.gameHistory.reduce((acc, game) => acc + ((game.score / game.maxScore) * 100), 0) / totalGames)
        : 0;

    // Group by game type
    const gamesByType: Record<string, { count: number; avgScore: number; avgStars: number }> = {};
    profile.gameHistory.forEach(game => {
        if (!gamesByType[game.gameType]) {
            gamesByType[game.gameType] = { count: 0, avgScore: 0, avgStars: 0 };
        }
        gamesByType[game.gameType].count++;
        gamesByType[game.gameType].avgScore += (game.score / game.maxScore) * 100;
        gamesByType[game.gameType].avgStars += game.starsEarned;
    });

    // Calculate averages for each game type
    Object.keys(gamesByType).forEach(type => {
        const count = gamesByType[type].count;
        gamesByType[type].avgScore = Math.round(gamesByType[type].avgScore / count);
        gamesByType[type].avgStars = Math.round((gamesByType[type].avgStars / count) * 10) / 10;
    });

    // Calculate total stars earned from history
    const starsFromTests = profile.history.reduce((acc, test) => acc + (test.starsEarned || 0), 0);
    const starsFromGames = profile.gameHistory.reduce((acc, game) => acc + game.starsEarned, 0);
    const totalStarsEarned = starsFromTests + starsFromGames;

    return {
        totalTests,
        averageTestScore,
        totalGames,
        averageGameScore,
        gamesByType,
        totalStarsEarned,
        totalImagesCollected: profile.ownedImageIds.length,
    };
};

// Get stars earned today
export const getDailyStarsEarned = (profile: StudentProfile): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    const todayTimestamp = today.getTime();

    // Stars from tests today
    const testStars = profile.history
        .filter(test => new Date(test.date).getTime() >= todayTimestamp)
        .reduce((acc, test) => acc + (test.starsEarned || 0), 0);

    // Stars from games today
    const gameStars = profile.gameHistory
        .filter(game => new Date(game.date).getTime() >= todayTimestamp)
        .reduce((acc, game) => acc + game.starsEarned, 0);

    return testStars + gameStars;
};
