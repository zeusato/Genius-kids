import type { StudentProfile, GameResult } from '../../../types';
import { checkAchievements, initializeStats, ACHIEVEMENTS } from '../../../services/achievementService';
import { createSession, finishDistance, recordOf, validSession } from './engine';
import { APPROACH, Config, Difficulty, GATE, RacingProgress, SEGMENT, Session, normalizeConfig } from './model';
export function progressOf(profile: StudentProfile): RacingProgress {
    const missions: Record<string, number> = {};
    for (const g of profile.gameHistory) if (g.racing?.version === 2 && g.racing.config.mode === 'campaign') {
        const id = g.racing.config.mission;
        if (Number.isInteger(id) && id >= 0 && id < 12) missions[id] = Math.max(missions[id] || 0, Math.min(3, g.racing.stars));
    }
    return { version: 2, missions };
}
export const bucketOf = (c: Config) => `racing-v2:${c.mode}:${c.mission}:${c.region}:${c.grade}:${c.difficulty}:${c.pace}:${c.waitForChoice}:${c.autoNitro}`;
export function completeRacing(profile: StudentProfile, s: Session) {
    const fail = { ok: false, changed: false, profile, earned: 0, bonusStars: 0, achievementNames: [] as string[] };
    if (profile.id !== s.studentId || !validSession(s) || s.phase !== 'finished') return fail;
    const id = `racing-v2:${s.id}`;
    if (profile.gameHistory.some(g => g.id === id)) return { ...fail, ok: true };
    const progress = progressOf(profile), campaign = s.config.mode === 'campaign', mission = s.config.mission;
    if (campaign && mission > 0 && !progress.missions[mission - 1]) return fail;
    const record = recordOf(s), earned = campaign ? Math.max(0, record.stars - (progress.missions[mission] || 0)) : 0;
    const entry: GameResult = { id, date: new Date().toISOString(), gameType: 'math_racing', score: record.accuracy, maxScore: 100,
        difficulty: s.config.difficulty, durationSeconds: Math.round(s.elapsed), starsEarned: earned, racing: record };
    const stats = structuredClone(profile.stats || initializeStats(profile));
    if (campaign) { stats.totalGamesPlayed++; stats.totalStarsEarned += earned; stats.totalTimeSeconds += entry.durationSeconds;
        stats.gameHighScores[bucketOf(s.config)] = Math.max(stats.gameHighScores[bucketOf(s.config)] || 0, record.accuracy); }
    const updated: StudentProfile = { ...profile, stats, achievements: structuredClone(profile.achievements || []), stars: profile.stars + earned, gameHistory: [...profile.gameHistory, entry] };
    if (!campaign) return { ...fail, ok: true, changed: true, profile: updated };
    const ach = checkAchievements(updated); updated.achievements = ach.updatedAchievements; updated.stars += ach.rewards;
    return { ok: true, changed: true, profile: updated, earned, bonusStars: ach.rewards, achievementNames: ach.unlocked.map(a => ACHIEVEMENTS.find(d => d.id === a.id)?.title || a.id) };
}
export function persistRacing(profiles: StudentProfile[], studentId: string, s: Session, write: (p: StudentProfile[]) => void) {
    const fail = { ok: false, profiles, earned: 0, bonusStars: 0, achievementNames: [] as string[] }, profile = profiles.find(p => p.id === studentId);
    if (!profile) return fail;
    const result = completeRacing(profile, s);
    if (!result.ok) return fail;
    if (!result.changed) return { ...fail, ok: true };
    const next = profiles.map(p => p.id === studentId ? result.profile : p);
    try { write(next); } catch { return fail; }
    return { ok: true, profiles: next, earned: result.earned, bonusStars: result.bonusStars, achievementNames: result.achievementNames };
}
const draftKey = (id: string) => `racing-draft-v2:${id}`;
/** Preserve runs saved during the earlier, longer-track preview. Only recognize
 * its exact generated layout; all other snapshot validation still applies. */
function upgradeTrackDraft(value: unknown): Session | null {
    try {
        const s = value as Session;
        if (!s || s.version !== 2 || !s.config || !Array.isArray(s.objects) || !Array.isArray(s.racers)) return null;
        const reference = createSession(s.config, s.seed, s.id, s.studentId, s.questionVersion ?? 1, s.lengthVersion ?? 1), count = reference.questions.length;
        const legacyObjects: Session['objects'] = [];
        for (let i = 0; i < count; i++) {
            const lane = reference.objects[i].lane;
            if (s.config.mode !== 'practice' && (s.config.mode === 'quick' || s.config.mission >= 2)) legacyObjects.push({ id: i * 2, at: i * 220 + 48, lane, type: 'cone', hit: false });
            legacyObjects.push({ id: i * 2 + 1, at: i * 220 + 78, lane: (lane + 1) % 3, type: 'energy', hit: false });
        }
        if (s.objects.length !== legacyObjects.length || s.objects.some((o, i) => typeof o.hit !== 'boolean' || JSON.stringify({ ...o, hit: false }) !== JSON.stringify(legacyObjects[i]))) return null;
        const oldFinish = count * 220 + 65, oldLastGate = (count - 1) * 220 + 210, newLastGate = (count - 1) * SEGMENT + GATE;
        const mapDistance = (d: number) => {
            if (!Number.isFinite(d) || d < -12 || d > oldFinish) throw new Error('Invalid legacy distance');
            if (d < 0) return d;
            if (d >= oldLastGate) return newLastGate + (d - oldLastGate) / (oldFinish - oldLastGate) * (finishDistance(reference) - newLastGate);
            const i = Math.floor(d / 220), offset = d - i * 220;
            return i * SEGMENT + (offset < 100 ? offset / 100 * APPROACH : offset < 210 ? APPROACH + (offset - 100) : GATE + (offset - 210));
        };
        const racers = s.racers.map(r => ({ ...r, distance: mapDistance(r.distance) }));
        const objects = reference.objects.map((o, i) => ({ ...o, hit: racers[0].distance >= o.at || !!s.objects.find(old => old.id === i * 2 + (o.type === 'energy' ? 1 : 0))?.hit }));
        const upgraded = { ...s, racers, objects };
        return validSession(upgraded) ? upgraded : null;
    } catch { return null; }
}
export function readDraft(id: string): { session: Session | null; corrupt: boolean } {
    try { const raw = localStorage.getItem(draftKey(id)); if (!raw) return { session: null, corrupt: false };
        if (raw.length > 100000) return { session: null, corrupt: true };
        const parsed: unknown = JSON.parse(raw), s = validSession(parsed) ? parsed : upgradeTrackDraft(parsed);
        return validSession(s) && s.studentId === id ? { session: { ...s, paused: s.phase === 'racing' }, corrupt: false } : { session: null, corrupt: true };
    } catch { return { session: null, corrupt: true }; }
}
export function saveDraft(s: Session) { try { localStorage.setItem(draftKey(s.studentId), JSON.stringify(s)); return true; } catch { return false; } }
export function clearDraft(id: string) { try { localStorage.removeItem(draftKey(id)); } catch { /* Result already persisted. */ } }
export function readConfig(id: string, grade: number, incoming?: Difficulty): Config {
    try { const saved = JSON.parse(localStorage.getItem(`racing-prefs-v2:${id}`) || '{}'); return normalizeConfig({ ...saved, ...(incoming ? { difficulty: incoming } : {}) }, grade); }
    catch { return normalizeConfig({ difficulty: incoming }, grade); }
}
export function saveConfig(id: string, config: Config) { try { localStorage.setItem(`racing-prefs-v2:${id}`, JSON.stringify(config)); } catch { /* Still usable for this visit. */ } }
export function readDisplay(id: string) { try { const p = JSON.parse(localStorage.getItem(`racing-display-v2:${id}`) || '{}'); return { flat: p.flat === true, low: p.low === true, reduced: typeof p.reduced === 'boolean' ? p.reduced : null }; } catch { return { flat: false, low: false, reduced: null }; } }
export function clearRacingData(id: string) { for (const key of [draftKey(id), `racing-prefs-v2:${id}`, `racing-display-v2:${id}`]) try { localStorage.removeItem(key); } catch {} }
