import type { StudentProfile, GameResult } from '../../../../types';
import { processGameReward } from '../../../../services/rewardService';
import { checkAchievements, initializeStats, updateStats } from '../../../../services/achievementService';
import { completePracticeSession, readAlphabetPractice } from './progress';
import type { AlphabetSession } from './types';

const gameType = (session: AlphabetSession) => session.activity === 'word' ? 'preschool-word' : 'preschool-alphabet';
const difficulty = (session: AlphabetSession) => session.level === 'intro' ? 'easy' : session.level === 'practice' ? 'medium' : 'hard';

export function completeAlphabetPractice(profile: StudentProfile, session: AlphabetSession) {
    const fail = { accepted: false, changed: false, profile, earned: 0, gachaImage: undefined as any, achievementNames: [] as string[] };
    if (session.version !== 1 || session.phase !== 'complete' || session.ownerId !== profile.id || !['word','match','pick'].includes(session.activity) || session.outcomes.length !== session.total || session.total < 1 || new Set(session.outcomes.map(o => o.roundId)).size !== session.outcomes.length) return fail;
    const resultId = `alphabet-v1:${profile.id}:${session.id}`;
    if (profile.gameHistory.some(result => result.id === resultId) || readAlphabetPractice(profile.alphabetPractice).completedSessions.includes(session.id)) return { ...fail, accepted: true };
    const score = session.outcomes.filter(o => o.correct && o.firstTry && !o.assisted).length;
    const medal = score / session.total >= .9 ? 'gold' : score / session.total >= .6 ? 'silver' : score > 0 ? 'bronze' : null;
    const rewardResult = processGameReward(profile, medal), now = new Date().toISOString();
    const record: GameResult = {
        id: resultId, date: now, gameType: gameType(session), score, maxScore: session.total,
        durationSeconds: Math.max(0, Math.floor(session.seconds)), starsEarned: rewardResult.reward.stars,
        difficulty: difficulty(session), alphabet: { version: 1, activity: session.activity, level: session.level, assisted: session.outcomes.filter(o => o.assisted).length },
    };
    let updated: StudentProfile = {
        ...rewardResult.updatedProfile,
        alphabetPractice: completePracticeSession(profile.alphabetPractice, session.activity, session.level, session.id, session.outcomes, String(Math.abs(session.seed) % 3)),
        gameHistory: [...profile.gameHistory, record],
    };
    updated.stats = updateStats(updated.stats || initializeStats(updated), { type: 'GAME_COMPLETE', gameResult: record });
    if (rewardResult.reward.image && !profile.ownedImageIds.includes(rewardResult.reward.image.id)) updated.stats = updateStats(updated.stats, { type: 'GAIN_CARD', isLegendary: rewardResult.reward.image.rarity === 'legendary', isNew: true, totalCards: updated.ownedImageIds.length });
    const achievements = checkAchievements(updated); updated.achievements = achievements.updatedAchievements; updated.stars += achievements.rewards;
    return { accepted: true, changed: true, profile: updated, earned: rewardResult.reward.stars, gachaImage: rewardResult.reward.image || undefined, achievementNames: achievements.unlocked.map(item => item.id) };
}

export function persistAlphabetPractice(profiles: StudentProfile[], ownerId: string, session: AlphabetSession, write: (profiles: StudentProfile[]) => void) {
    const profile = profiles.find(item => item.id === ownerId), fail = { ok: false, profiles, earned: 0, gachaImage: undefined as any, achievementNames: [] as string[] };
    if (!profile) return fail; const result = completeAlphabetPractice(profile, session); if (!result.accepted) return fail; if (!result.changed) return { ...fail, ok: true };
    const next = profiles.map(item => item.id === ownerId ? result.profile : item); try { write(next); } catch { return fail; }
    return { ok: true, profiles: next, earned: result.earned, gachaImage: result.gachaImage, achievementNames: result.achievementNames };
}
