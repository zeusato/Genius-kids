import { describe, expect, it, vi } from 'vitest';
import type { StudentProfile } from '../../../types';
import { activeQuestion, chooseLane, createSession, step } from './engine';
import { APPROACH, normalizeConfig } from './model';
import { bucketOf, completeRacing, persistRacing, progressOf, readConfig, readDraft, saveConfig, saveDraft } from './progress';
const profile = (): StudentProfile => ({ id: 'p', name: 'Racing', grade: 2, age: 8, avatarId: 0, currentAvatarId: 'avatar_01', currentThemeId: 'default', stars: 42, ownedAvatarIds: [], ownedThemeIds: [], ownedImageIds: [], history: [], gameHistory: [{ id: 'legacy', date: '2026-01-01', gameType: 'math_racing', difficulty: 'easy', score: 150, maxScore: 100, durationSeconds: 0, starsEarned: 3 }], shopDailyPhotos: [], achievements: [] });
function win(mission = 0, correct = true, mode: 'campaign' | 'quick' | 'practice' = 'campaign') {
    const s = createSession(normalizeConfig({ mission, mode }, 2), 83, `s-${mission}-${correct}-${mode}`, 'p'); s.phase = 'racing';
    for (let i = 0; i < 20000 && s.phase === 'racing'; i++) { const q = activeQuestion(s); if (q >= 0) chooseLane(s, (s.questions[q].options.indexOf(s.questions[q].answer) + (correct ? 0 : 1)) % 3, q); step(s, .1); } return s;
}
describe('Racing durable progress and configuration', () => {
    it('grants only improved stars, preserves legacy, does not mutate input or other profiles', () => {
        const p = profile(), before = structuredClone(p), s = win(), a = completeRacing(p, win(0, false)), b = completeRacing(a.profile, s), again = completeRacing(b.profile, s);
        expect(a.earned).toBe(1); expect(b.earned).toBe(2); expect(again.earned).toBe(0); expect(again.changed).toBe(false);
        expect(p).toEqual(before); expect(b.profile.gameHistory[0]).toEqual(before.gameHistory[0]); expect(b.profile.gameHistory.at(-1)).toMatchObject({ difficulty: 'easy', score: 100, maxScore: 100 });
        expect(b.profile.gameHistory.at(-1)!.durationSeconds).toBe(Math.round(s.elapsed));
        expect(b.profile.gameHistory.at(-1)!.durationSeconds).toBeGreaterThan(32); expect(progressOf(b.profile).missions[0]).toBe(3);
    });
    it('retries failed writes with the same completion and pays exactly once', () => {
        const ps = [profile(), { ...profile(), id: 'other' }], before = structuredClone(ps), s = win(), write = vi.fn();
        const bad = persistRacing(ps, 'p', s, () => { throw new Error('quota'); }); expect(bad.ok).toBe(false); expect(ps).toEqual(before);
        const a = persistRacing(ps, 'p', s, write), b = persistRacing(a.profiles, 'p', s, write); expect(a.earned).toBe(3); expect(b.earned).toBe(0); expect(write).toHaveBeenCalledTimes(1); expect(a.profiles[1]).toBe(ps[1]);
        expect(persistRacing(ps, 'other', s, write).ok).toBe(false);
    });
    it('unlocks all 12 missions in order with a 36-star cap, rejects locked results', () => {
        let p = profile(), stars = 0; expect(completeRacing(p, win(1)).ok).toBe(false);
        for (let i = 0; i < 12; i++) { const result = completeRacing(p, win(i)); expect(result.ok).toBe(true); stars += result.earned; p = result.profile; }
        expect(stars).toBe(36); expect(Object.keys(progressOf(p).missions)).toHaveLength(12);
        for (let i = 0; i < 12; i++) { const s = win(i); s.id += '-replay'; const result = completeRacing(p, s); expect(result.earned).toBe(0); p = result.profile; }
        expect(p.stats!.gameHighScores.math_racing).toBeUndefined();
    });
    it('practice and quick races cannot award campaign progress or currency', () => {
        for (const mode of ['quick', 'practice'] as const) { const result = completeRacing(profile(), win(8, true, mode)); expect(result.ok).toBe(true); expect(result.earned).toBe(0); expect(result.bonusStars).toBe(0); expect(progressOf(result.profile).missions).toEqual({}); expect(result.profile.stars).toBe(42); }
    });
    it('persists difficulty and pace independently; explicit URL level takes precedence', () => {
        const values = new Map<string, string>(); vi.stubGlobal('localStorage', { getItem: (k: string) => values.get(k) || null, setItem: (k: string, v: string) => values.set(k, v) });
        try { const c = normalizeConfig({ difficulty: 'hard', pace: 'relaxed' }, 2); saveConfig('p', c);
            expect(readConfig('p', 2)).toMatchObject({ difficulty: 'hard', pace: 'relaxed' }); expect(readConfig('p', 2, 'easy')).toMatchObject({ difficulty: 'easy', pace: 'relaxed' });
            expect(readConfig('other', 2).difficulty).toBe('easy'); expect(readConfig('p', 5).grade).toBe(5);
            expect(bucketOf(c)).not.toBe(bucketOf({ ...c, difficulty: 'easy' })); expect(bucketOf(c)).not.toBe(bucketOf({ ...c, pace: 'fast' }));
            const s = win(); saveDraft(s); expect(readDraft('p').session?.config).toEqual(s.config); expect(readDraft('other').session).toBeNull();
            values.set('racing-draft-v2:p', '{'); expect(readDraft('p').corrupt).toBe(true);
        } finally { vi.unstubAllGlobals(); }
    });
    it('resumes drafts from the longer preview track without changing math, time or energy', () => {
        const s = createSession(normalizeConfig({ difficulty: 'hard', pace: 'relaxed' }, 2), 41, 'old-track', 'p');
        s.phase = 'racing'; s.elapsed = 6; s.racers.forEach((r, i) => { r.distance = 130 - i * 4; r.energy = 25; });
        s.objects = s.objects.map((o, i) => ({ id: i * 2 + 1, at: i * 220 + 78, lane: (o.lane + 1) % 3, type: 'energy', hit: i === 0 }));
        let raw = JSON.stringify(s); vi.stubGlobal('localStorage', { getItem: () => raw });
        try {
            const restored = readDraft('p'); expect(restored.corrupt).toBe(false); expect(restored.session?.paused).toBe(true);
            expect(restored.session?.config).toEqual(s.config); expect(restored.session?.questions).toEqual(s.questions);
            expect(restored.session?.elapsed).toBe(6); expect(restored.session?.racers[0]).toMatchObject({ distance: APPROACH + 30, energy: 25 });
            expect(restored.session?.objects[0].hit).toBe(true); expect(readDraft('other').session).toBeNull();
            s.questions[0].answer = 999; raw = JSON.stringify(s); expect(readDraft('p').corrupt).toBe(true);
        } finally { vi.unstubAllGlobals(); }
    });
});
