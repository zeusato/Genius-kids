import type { StudentProfile, GameResult } from '../../../types';
import { ACHIEVEMENTS, checkAchievements, initializeStats, updateStats } from '../../../services/achievementService';
import { SOUND_MISSIONS } from '../content/missions';
import { SoundSession, SoundRecord, soundResult, validSession } from '../engine/game';
import { Composition, CompositionAction, editLibrary, validComposition } from '../studio/model';
export interface SoundProgress { version: 2; missions: Record<string, { stars: number; completedAt: string; best: Partial<Record<'solo' | 'guided' | 'visual', number>> }>; practiceBest: Record<string, number>; compositions: Composition[] }
export function readSoundProgress(value: unknown): SoundProgress {
    const clean: SoundProgress = { version: 2, missions: {}, practiceBest: {}, compositions: [] };
    if (!value || typeof value !== 'object' || !('version' in value) || value.version !== 2) return clean;
    const p = value as SoundProgress;
    for (const [id, m] of Object.entries(p.missions || {})) if (SOUND_MISSIONS.some(item => item.id === id) && m && [1, 2, 3].includes(m.stars)) {
        clean.missions[id] = { stars: m.stars, completedAt: typeof m.completedAt === 'string' ? m.completedAt : '', best: Object.fromEntries(Object.entries(m.best || {}).filter(([k, n]) => ['solo', 'guided', 'visual'].includes(k) && Number.isFinite(n) && n >= 0 && n <= 1000)) };
    }
    clean.practiceBest = Object.fromEntries(Object.entries(p.practiceBest || {}).filter(([k, n]) => /^band-\d+:(solo|guided|visual)$/.test(k) && Number.isFinite(n) && n >= 0 && n <= 1000).slice(-72));
    clean.compositions = Array.isArray(p.compositions) ? p.compositions.filter(validComposition).filter((c, i, a) => a.findIndex(item => item.id === c.id) === i).slice(0, 12) : [];
    return clean;
}
export const recordMode = (r: SoundRecord) => r.visual ? 'visual' : r.assisted ? 'guided' : 'solo';
export function completeSound(profile: StudentProfile, s: SoundSession) {
    const fail = { accepted: false, changed: false, profile, earned: 0, bonusStars: 0, achievementNames: [] as string[] };
    if (!validSession(s) || s.phase !== 'complete') return fail;
    const p = readSoundProgress(profile.soundMemory), r = soundResult(s), mode = recordMode(r.record);
    if (!s.campaign) {
        const key = `${s.missionId}:${mode}`;
        if ((p.practiceBest[key] ?? -1) >= r.score) return { ...fail, accepted: true };
        p.practiceBest[key] = r.score;
        return { ...fail, accepted: true, changed: true, profile: { ...profile, soundMemory: p } };
    }
    const index = SOUND_MISSIONS.findIndex(m => m.id === s.missionId), old = p.missions[s.missionId];
    if (index < 0 || (!old && index > 0 && !p.missions[SOUND_MISSIONS[index - 1].id])) return fail;
    const stars = Math.max(old?.stars || 0, r.stars), earned = stars - (old?.stars || 0);
    if (old && earned === 0 && (old.best[mode] ?? -1) >= r.score) return { ...fail, accepted: true };
    const now = new Date().toISOString(), date = old?.completedAt || now;
    p.missions[s.missionId] = { stars, completedAt: date, best: { ...old?.best, [mode]: Math.max(old?.best[mode] || 0, r.score) } };
    const id = `sound-v2:${profile.id}:${s.missionId}`, prev = profile.gameHistory.find(g => g.id === id);
    // Keep all attempt metadata together. Independent achievements outrank assisted ones.
    const previousRank = !prev?.sound ? 0 : prev.sound.assisted ? 1 : Array.isArray(prev.sound.outcomes) && prev.sound.outcomes.every(o => o.kind === 'rhythm' ? o.accuracy >= .9 : o.first) ? 3 : 2;
    const retain = prev?.sound && (previousRank > r.stars || (previousRank === r.stars && prev.score >= r.score));
    const entry: GameResult = { id, date, gameType: 'sound-memory', difficulty: index < 8 ? 'easy' : index < 16 ? 'medium' : 'hard', score: retain ? prev.score : r.score, maxScore: 1000, durationSeconds: retain ? prev.durationSeconds : s.seconds, starsEarned: stars, sound: retain ? prev.sound : r.record, starAwards: [...(prev?.starAwards || (old ? [{ date, amount: old.stars }] : [])), ...(earned ? [{ date: now, amount: earned }] : [])] };
    const before = structuredClone(profile.stats || initializeStats(profile));
    const stats = old ? { ...before, totalStarsEarned: before.totalStarsEarned + earned } : updateStats(before, { type: 'GAME_COMPLETE', gameResult: { ...entry, starsEarned: earned } });
    const updated = { ...profile, soundMemory: p, stars: profile.stars + earned, stats, gameHistory: [...profile.gameHistory.filter(g => g.id !== id), entry] };
    const awards = checkAchievements(updated); updated.achievements = awards.updatedAchievements; updated.stars += awards.rewards;
    return { accepted: true, changed: true, profile: updated, earned, bonusStars: awards.rewards, achievementNames: awards.unlocked.map(a => ACHIEVEMENTS.find(item => item.id === a.id)?.title || a.id) };
}
export function persistSound(profiles: StudentProfile[], studentId: string, s: SoundSession, write: (p: StudentProfile[]) => void) {
    const p = profiles.find(item => item.id === studentId), fail = { ok: false, profiles, earned: 0, bonusStars: 0, achievementNames: [] as string[] };
    if (!p) return fail;
    const r = completeSound(p, s); if (!r.accepted) return fail; if (!r.changed) return { ...fail, ok: true };
    const next = profiles.map(p => p.id === studentId ? r.profile : p);
    try { write(next); } catch { return fail; }
    return { ok: true, profiles: next, earned: r.earned, bonusStars: r.bonusStars, achievementNames: r.achievementNames };
}
export function persistComposition(profiles: StudentProfile[], studentId: string, action: CompositionAction, write: (p: StudentProfile[]) => void) {
    const profile = profiles.find(p => p.id === studentId), fail = { ok: false, profiles, error: 'Chưa lưu được. Hãy thử lại.' };
    if (!profile) return fail;
    const p = readSoundProgress(profile.soundMemory), r = editLibrary(p.compositions, action);
    if (!r.ok) return { ...fail, error: r.error };
    const next = profiles.map(item => item.id === studentId ? { ...profile, soundMemory: { ...p, compositions: r.library } } : item);
    try { write(next); } catch { return fail; }
    return { ok: true, profiles: next, error: undefined as string | undefined };
}
export function readSoundDraft(id: string): { session: SoundSession | null; corrupt: boolean } {
    try { const raw = localStorage.getItem(`sound-draft:${id}`); if (!raw) return { session: null, corrupt: false }; const s = JSON.parse(raw); return validSession(s) ? { session: { ...s, paused: s.phase !== 'complete' }, corrupt: false } : { session: null, corrupt: true }; } catch { return { session: null, corrupt: true }; }
}
export function saveSoundDraft(id: string, s: SoundSession) { try { localStorage.setItem(`sound-draft:${id}`, JSON.stringify(s)); return true; } catch { return false; } }
export function clearSoundDraft(id: string) { try { localStorage.removeItem(`sound-draft:${id}`); return true; } catch { return false; } }
export function clearSoundProfileData(id: string) { for (const prefix of ['sound-draft:', 'sound-studio-draft:', 'sound-prefs:']) { try { localStorage.removeItem(prefix + id); } catch { /* Profile deletion can still proceed when local storage is unavailable. */ } } }
