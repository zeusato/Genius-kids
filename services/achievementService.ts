import { StudentProfile, UserStats, AchievementProgress, GameResult, TestResult } from '../types';
import achievementsData from '../src/data/achievements.json';
import { getAllImages } from './albumService';

// Define the shape of the JSON data
interface AchievementTierConfig {
    tier: 'bronze' | 'silver' | 'gold';
    value: number;
    rewardStars: number;
}

interface AchievementConfig {
    id: string;
    type: string;
    title: string;
    description: string;
    icon: string;
    tiers: AchievementTierConfig[];
    topicId?: string;
    gameType?: string;
    difficulty?: string;
    category?: string;
    rarity?: string;
}

export const ACHIEVEMENTS = achievementsData as AchievementConfig[];

export const initializeStats = (profile: StudentProfile): UserStats => {
    const stats: UserStats = {
        totalTests: 0,
        totalQuestions: 0,
        totalStarsEarned: 0,
        totalTimeSeconds: 0,
        currentCorrectStreak: 0,
        maxCorrectStreak: 0,
        perfectTests: 0,
        topicCorrectCount: {},
        totalGamesPlayed: 0,
        gameWins: {},
        gameHighScores: {}, // Initialize
        totalCards: 0,
        legendaryCards: 0,
        starsSpent: 0,
        avatarsOwned: 0,
        themesOwned: 0,
        riddlesSolved: 0,
        riddlesSolvedByCategory: {},
        riddlesSolvedByDifficulty: {},
        factsRead: 0,
        factsReadByCategory: {},
        maxTypingScore: 0
    };

    // Migrate History
    profile.history.forEach(test => {
        stats.totalTests++;
        stats.totalQuestions += test.totalQuestions;
        stats.totalStarsEarned += test.starsEarned || 0;
        stats.totalTimeSeconds += test.durationSeconds;

        if (test.score === test.totalQuestions) {
            stats.perfectTests++;
        }

        // Topic mastery
        if (test.questions) {
            test.questions.forEach(q => {
                if (q.userAnswer === q.correctAnswer) {
                    stats.topicCorrectCount[q.topicId] = (stats.topicCorrectCount[q.topicId] || 0) + 1;
                }
            });
        }
    });

    // Migrate Game History
    profile.gameHistory.forEach(game => {
        stats.totalGamesPlayed++;
        stats.totalStarsEarned += game.starsEarned;

        // For old games, we don't have difficulty info, so we can't populate gameWins with difficulty keys accurately
        // We will leave gameWins empty for old games to avoid incorrect data
    });

    // Collection
    stats.totalCards = profile.ownedImageIds.length;
    // We can't easily count legendary cards without checking the album data which is not passed here
    // We will leave legendaryCards as 0 for now, it will update on next card gain or we can pass album data later

    stats.avatarsOwned = profile.ownedAvatarIds.length;
    stats.themesOwned = profile.ownedThemeIds.length;

    // Sphinx
    if (profile.sphinxProfile) {
        stats.riddlesSolved = profile.sphinxProfile.answeredRiddleIds.length;
    }

    return stats;
};

export const checkAchievements = (profile: StudentProfile): { unlocked: AchievementProgress[], rewards: number, updatedAchievements: AchievementProgress[] } => {
    if (!profile.stats) return { unlocked: [], rewards: 0, updatedAchievements: [] };

    const stats = profile.stats;
    const newUnlocks: AchievementProgress[] = [];
    let totalReward = 0;

    // Clone existing achievements to avoid mutation issues
    const currentAchievements = profile.achievements ? [...profile.achievements] : [];

    // Calculate derived stats directly from profile to ensure accuracy
    const realAvatarsOwned = profile.ownedAvatarIds.length;
    const realThemesOwned = profile.ownedThemeIds.length;
    const realTotalCards = profile.ownedImageIds.length;

    // Calculate legendary cards
    const allImages = getAllImages();
    const realLegendaryCards = profile.ownedImageIds.filter(id => {
        const img = allImages.find(i => i.id === id);
        return img && img.rarity === 'legendary';
    }).length;

    ACHIEVEMENTS.forEach(ach => {
        // Find existing progress
        let progressIndex = currentAchievements.findIndex(p => p.id === ach.id);
        let progress: AchievementProgress;

        if (progressIndex === -1) {
            progress = { id: ach.id, unlockedTiers: [], currentValue: 0, unlockedAt: new Date().toISOString() };
            currentAchievements.push(progress);
        } else {
            progress = { ...currentAchievements[progressIndex] };
            currentAchievements[progressIndex] = progress;
        }

        let currentValue = 0;

        // Determine current value based on type
        switch (ach.type) {
            case 'total_tests': currentValue = stats.totalTests; break;
            case 'total_questions': currentValue = stats.totalQuestions; break;
            case 'perfect_tests': currentValue = stats.perfectTests; break;
            case 'correct_streak': currentValue = stats.maxCorrectStreak; break;
            case 'topic_mastery':
                if (ach.topicId) currentValue = stats.topicCorrectCount?.[ach.topicId] || 0;
                break;
            case 'total_games': currentValue = stats.totalGamesPlayed; break;
            case 'game_win':
                // key format: gameType or gameType_difficulty
                const key = ach.difficulty ? `${ach.gameType}_${ach.difficulty}` : ach.gameType;
                if (key) currentValue = stats.gameWins?.[key] || 0;
                break;
            case 'game_score':
                // High score for a specific game
                if (ach.gameType) currentValue = stats.gameHighScores?.[ach.gameType] || 0;
                break;
            case 'total_stars_earned': currentValue = stats.totalStarsEarned; break;
            case 'total_cards': currentValue = realTotalCards; break;
            case 'rarity_count':
                if (ach.rarity === 'legendary') currentValue = realLegendaryCards;
                break;
            case 'stars_spent': currentValue = stats.starsSpent; break;
            case 'avatars_owned': currentValue = realAvatarsOwned; break;
            case 'themes_owned': currentValue = realThemesOwned; break;
            case 'riddles_solved': currentValue = stats.riddlesSolved; break;
            case 'riddles_solved_category':
                if (ach.category) currentValue = stats.riddlesSolvedByCategory?.[ach.category] || 0;
                break;
            case 'riddles_solved_difficulty':
                if (ach.difficulty) currentValue = stats.riddlesSolvedByDifficulty?.[ach.difficulty] || 0;
                break;
            case 'facts_read': currentValue = stats.factsRead; break;
            case 'facts_read_category':
                if (ach.category) currentValue = stats.factsReadByCategory?.[ach.category] || 0;
                break;
            case 'typing_score': currentValue = stats.maxTypingScore; break;
        }

        // Update current value
        progress.currentValue = currentValue;

        // Check tiers
        ach.tiers.forEach(tier => {
            if (!progress.unlockedTiers.includes(tier.tier) && currentValue >= tier.value) {
                progress.unlockedTiers.push(tier.tier);
                progress.unlockedAt = new Date().toISOString();

                // Add to new unlocks list
                newUnlocks.push({ ...progress, unlockedTiers: [tier.tier] });
                totalReward += tier.rewardStars;
            }
        });
    });

    return { unlocked: newUnlocks, rewards: totalReward, updatedAchievements: currentAchievements };
};

export type StatUpdateAction =
    | { type: 'TEST_COMPLETE'; testResult: TestResult }
    | { type: 'GAME_COMPLETE'; gameResult: GameResult }
    | { type: 'SPEND_STARS'; amount: number }
    | { type: 'GAIN_CARD'; isLegendary: boolean; isNew: boolean; totalCards?: number }
    | { type: 'BUY_AVATAR'; totalOwned?: number }
    | { type: 'BUY_THEME'; totalOwned?: number }
    | { type: 'READ_FACT'; category: string }
    | { type: 'SOLVE_RIDDLE'; category: string; difficulty: string }
    | { type: 'TYPING_SCORE'; score: number };

export const updateStats = (stats: UserStats, action: StatUpdateAction): UserStats => {
    const newStats = { ...stats };

    // Ensure maps exist if they are undefined (migration safety)
    if (!newStats.topicCorrectCount) newStats.topicCorrectCount = {};
    if (!newStats.gameWins) newStats.gameWins = {};
    if (!newStats.gameHighScores) newStats.gameHighScores = {};
    if (!newStats.riddlesSolvedByCategory) newStats.riddlesSolvedByCategory = {};
    if (!newStats.riddlesSolvedByDifficulty) newStats.riddlesSolvedByDifficulty = {};
    if (!newStats.factsReadByCategory) newStats.factsReadByCategory = {};

    switch (action.type) {
        case 'TEST_COMPLETE':
            newStats.totalTests++;
            newStats.totalQuestions += action.testResult.totalQuestions;
            newStats.totalStarsEarned += action.testResult.starsEarned || 0;
            newStats.totalTimeSeconds += action.testResult.durationSeconds;

            // Calculate correct answers and update topic mastery
            let currentStreak = newStats.currentCorrectStreak;
            let maxStreak = newStats.maxCorrectStreak;

            if (action.testResult.questions) {
                action.testResult.questions.forEach(q => {
                    const isCorrect = q.userAnswer === q.correctAnswer;
                    if (isCorrect) {
                        currentStreak++;
                        // Update topic mastery - ALWAYS update this, even if perfect
                        newStats.topicCorrectCount[q.topicId] = (newStats.topicCorrectCount[q.topicId] || 0) + 1;
                    } else {
                        currentStreak = 0;
                    }
                    if (currentStreak > maxStreak) maxStreak = currentStreak;
                });
            } else if (action.testResult.score === action.testResult.totalQuestions) {
                // Fallback if questions array is missing but we know it's perfect
                currentStreak += action.testResult.totalQuestions;
                if (currentStreak > maxStreak) maxStreak = currentStreak;
            }

            if (action.testResult.score === action.testResult.totalQuestions) {
                newStats.perfectTests++;
            }

            newStats.currentCorrectStreak = currentStreak;
            newStats.maxCorrectStreak = maxStreak;
            break;

        case 'GAME_COMPLETE':
            newStats.totalGamesPlayed++;
            newStats.totalStarsEarned += action.gameResult.starsEarned;

            // Update generic game wins
            newStats.gameWins[action.gameResult.gameType] = (newStats.gameWins[action.gameResult.gameType] || 0) + 1;

            // Update difficulty-specific game wins
            if (action.gameResult.difficulty) {
                const key = `${action.gameResult.gameType}_${action.gameResult.difficulty}`;
                newStats.gameWins[key] = (newStats.gameWins[key] || 0) + 1;
            }

            // Update High Score
            const currentHigh = newStats.gameHighScores[action.gameResult.gameType] || 0;
            if (action.gameResult.score > currentHigh) {
                newStats.gameHighScores[action.gameResult.gameType] = action.gameResult.score;
            }
            break;

        case 'SPEND_STARS':
            newStats.starsSpent += action.amount;
            break;

        case 'GAIN_CARD':
            if (action.isNew) {
                newStats.totalCards = action.totalCards !== undefined ? action.totalCards : newStats.totalCards + 1;
            }
            if (action.isLegendary && action.isNew) newStats.legendaryCards++;
            break;

        case 'BUY_AVATAR':
            newStats.avatarsOwned = action.totalOwned !== undefined ? action.totalOwned : newStats.avatarsOwned + 1;
            break;

        case 'BUY_THEME':
            newStats.themesOwned = action.totalOwned !== undefined ? action.totalOwned : newStats.themesOwned + 1;
            break;

        case 'READ_FACT':
            newStats.factsRead++;
            newStats.factsReadByCategory[action.category] = (newStats.factsReadByCategory[action.category] || 0) + 1;
            break;

        case 'SOLVE_RIDDLE':
            newStats.riddlesSolved++;
            newStats.riddlesSolvedByCategory[action.category] = (newStats.riddlesSolvedByCategory[action.category] || 0) + 1;
            newStats.riddlesSolvedByDifficulty[action.difficulty] = (newStats.riddlesSolvedByDifficulty[action.difficulty] || 0) + 1;
            break;

        case 'TYPING_SCORE':
            if (action.score > newStats.maxTypingScore) {
                newStats.maxTypingScore = action.score;
            }
            break;
    }

    return newStats;
};
