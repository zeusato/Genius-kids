import type { GameResult, StudentProfile } from '../../../types';
import { ACHIEVEMENTS, checkAchievements, initializeStats } from '../../../services/achievementService';
import { recordOf, validSession } from './engine';
import type { Config, Session } from './model';
export function completeArcade(profile: StudentProfile, s: Session) {
    const fail = { ok: false, changed: false, profile, earned: 0, bonusStars: 0, achievementNames: [] as string[] };
    if (profile.id !== s.studentId || !validSession(s) || s.phase !== 'finished')
        return fail;
    const id = `speed-v1:${s.id}`, previous = profile.gameHistory.find(r => r.id === id);
    if (previous)
        return { ...fail, ok: true, earned: previous.starsEarned };
    const record = recordOf(s), earned = record.medal === 'gold' ? 3 : record.medal === 'silver' ? 2 : record.medal === 'bronze' ? 1 : 0;
    const entry: GameResult = { id, date: new Date().toISOString(), gameType: 'speed-math', score: s.rounds.reduce((n, r) => n + r.points, 0), maxScore: s.rounds.length * 200, starsEarned: earned, durationSeconds: Math.round(s.rounds.reduce((n, r) => n + r.elapsedMs, 0) / 1000), difficulty: s.config.difficulty, speed: record };
    const stats = structuredClone(profile.stats || initializeStats(profile));
    stats.totalGamesPlayed++;
    stats.totalStarsEarned += earned;
    if (earned) {
        stats.gameWins['speed-math'] = (stats.gameWins['speed-math'] || 0) + 1;
        stats.gameWins[`speed-math_${s.config.difficulty}`] = (stats.gameWins[`speed-math_${s.config.difficulty}`] || 0) + 1;
    }
    const bucket = `speed-arcade-v1:${s.config.mode}:${s.config.topic}:${s.config.grade}:${s.config.difficulty}:${s.config.pace}`;
    stats.gameHighScores[bucket] = Math.max(stats.gameHighScores[bucket] || 0, entry.score);
    // Achievement evaluation mutates tier arrays; isolate them until persistence succeeds.
    const updated: StudentProfile = { ...profile, achievements: structuredClone(profile.achievements || []), stats, stars: profile.stars + earned, gameHistory: [...profile.gameHistory, entry] };
    const ach = checkAchievements(updated);
    updated.achievements = ach.updatedAchievements;
    updated.stars += ach.rewards;
    return { ok: true, changed: true, profile: updated, earned, bonusStars: ach.rewards, achievementNames: ach.unlocked.map(a => ACHIEVEMENTS.find(x => x.id === a.id)?.title || a.id) };
}
export function persistArcade(profiles: StudentProfile[], studentId: string, s: Session, write: (p: StudentProfile[]) => void) {
    const fail = { ok: false, profiles, earned: 0, bonusStars: 0, achievementNames: [] as string[] }, profile = profiles.find(p => p.id === studentId);
    if (!profile)
        return fail;
    const result = completeArcade(profile, s);
    if (!result.ok)
        return fail;
    if (!result.changed)
        return { ...fail, ok: true, earned: result.earned };
    const next = profiles.map(p => p.id === studentId ? result.profile : p);
    try {
        write(next);
    }
    catch {
        return fail;
    }
    return { ok: true, profiles: next, earned: result.earned, bonusStars: result.bonusStars, achievementNames: result.achievementNames };
}
const draftKey = (id: string) => `speed-draft-v1:${id}`;
export function readDraft(id: string): {
    session: Session | null;
    corrupt: boolean;
} {
    try {
        const raw = localStorage.getItem(draftKey(id));
        if (!raw)
            return { session: null, corrupt: false };
        if (raw.length > 150000)
            return { session: null, corrupt: true };
        const s: unknown = JSON.parse(raw);
        return validSession(s) && s.studentId === id ? { session: { ...s, paused: s.phase !== 'finished', listening: false, clockAt: 0 }, corrupt: false } : { session: null, corrupt: true };
    }
    catch {
        return { session: null, corrupt: true };
    }
}
export function saveDraft(s: Session) { try {
    localStorage.setItem(draftKey(s.studentId), JSON.stringify(s));
    return true;
}
catch {
    return false;
} }
export function clearDraft(id: string) { try {
    localStorage.removeItem(draftKey(id));
}
catch { } }
export function bestFor(profile: StudentProfile, c: Config) { return Math.max(0, ...profile.gameHistory.filter(r => r.speed && r.speed.config.mode === c.mode && r.speed.config.topic === c.topic && r.speed.config.grade === c.grade && r.speed.config.pace === c.pace && r.speed.config.difficulty === c.difficulty).map(r => r.score)); }
