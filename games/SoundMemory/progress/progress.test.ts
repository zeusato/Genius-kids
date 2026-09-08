import { describe, expect, it, vi } from 'vitest';
import { StudentProfile, Grade } from '../../../types';
import { initializeStats } from '../../../services/achievementService';
import { getDailyStarsEarned, migrateProfile } from '../../../services/profileService';
import { newSession, phraseOf, reduceSound, validSession } from '../engine/game';
import { SOUND_MISSIONS } from '../content/missions';
import { blankComposition, editLibrary, validComposition } from '../studio/model';
import { clearSoundProfileData, completeSound, persistComposition, persistSound, readSoundDraft, readSoundProgress, saveSoundDraft } from './progress';
function profile(): StudentProfile {
    const p: StudentProfile = { id: 'music-test', name: 'Music', age: 7, grade: Grade.Grade1, avatarId: 0, currentAvatarId: 'avatar_01', currentThemeId: 'default', stars: 42, ownedAvatarIds: [], ownedThemeIds: [], ownedImageIds: [], history: [], gameHistory: [{ id: 'legacy', date: '2026-01-01', gameType: 'sound-memory', score: 400, maxScore: 500, starsEarned: 2, difficulty: 'easy', durationSeconds: 10 }], shopDailyPhotos: [], achievements: [] }; p.stats = initializeStats(p); return p;
}
function win(index = 0, guided = false, visual = false) {
    let s = newSession(SOUND_MISSIONS[index].id, 42, true, `round-${index}`);
    for (let i = 0; i < 3; i++) {
        s = reduceSound(s, { type: 'demo', guided, visual, slow: false, quality: 'output-clock' }); s = reduceSound(s, { type: 'input' });
        const p = phraseOf(s);
        if (p.kind === 'rhythm' && !guided) s = reduceSound(s, { type: 'rhythm', accuracy: 1 });
        else for (const note of p.notes) s = reduceSound(s, { type: 'note', note });
        s = reduceSound(s, { type: 'next' });
    }
    return s;
}
describe('music rewards and persistence', () => {
    it('persists once, preserves legacy history and round-trips through migration', () => {
        const p = profile(), copy = structuredClone(p), a = completeSound(p, win()); expect(a.earned).toBe(3); expect(p).toEqual(copy);
        const b = migrateProfile(JSON.parse(JSON.stringify(a.profile))); expect(b.soundMemory?.missions['band-1'].stars).toBe(3);
        expect(completeSound(b, win()).changed).toBe(false); expect(b.gameHistory[0]).toEqual(p.gameHistory[0]); expect(b.gameHistory).toHaveLength(2);
    });
    it('failed storage never publishes profile changes and retry awards only once', () => {
        const profiles = [profile(), { ...profile(), id: 'other' }], copy = structuredClone(profiles);
        const failed = persistSound(profiles, 'music-test', win(), () => { throw new Error('quota'); }); expect(failed.ok).toBe(false); expect(failed.profiles).toBe(profiles); expect(profiles).toEqual(copy);
        const write = vi.fn(), retry = persistSound(profiles, 'music-test', win(), write), again = persistSound(retry.profiles, 'music-test', win(), write);
        expect(retry.earned).toBe(3); expect(again.earned).toBe(0); expect(write).toHaveBeenCalledTimes(1); expect(again.profiles[1]).toEqual(copy[1]);
        expect(persistSound(profiles, 'missing', win(), write).ok).toBe(false);
    });
    it('campaign rewards remain capped at 72, with 24 history rows and correct difficulty', () => {
        let p = profile(), sum = 0;
        for (let i = 0; i < 24; i++) { const r = completeSound(p, win(i)); expect(r.accepted, `mission ${i}`).toBe(true); sum += r.earned; p = r.profile; }
        expect(sum).toBe(72); expect(Object.keys(p.soundMemory!.missions)).toHaveLength(24); expect(p.gameHistory.filter(g => g.sound)).toHaveLength(24); expect(p.gameHistory.at(-1).difficulty).toBe('hard');
        for (let i = 0; i < 24; i++) { const r = completeSound(p, win(i)); expect(r.earned).toBe(0); p = r.profile; }
    });
    it('assistance unlocks the next mission, and improving only awards the star delta today', () => {
        vi.useFakeTimers(); try {
            vi.setSystemTime(new Date('2026-09-07T12:00:00+07:00')); const first = completeSound(profile(), win(0, true, true)); expect(first.earned).toBe(1); expect(completeSound(first.profile, win(1)).accepted).toBe(true);
            vi.setSystemTime(new Date('2026-09-08T12:00:00+07:00')); const improved = completeSound(first.profile, win(0)); expect(improved.earned).toBe(2); expect(getDailyStarsEarned(improved.profile)).toBe(2);
            expect(improved.profile.stats!.totalGamesPlayed).toBe(first.profile.stats!.totalGamesPlayed); expect(improved.profile.soundMemory!.missions['band-1'].best).toEqual({ visual: 1000, solo: 1000 });
            expect(improved.profile.gameHistory.at(-1).sound?.assisted).toBe(false);
        } finally { vi.useRealTimers(); }
    });
    it('practice stores separate bests without currency, stats, achievements, or campaign unlocks', () => {
        const p = profile(), s = { ...win(12), campaign: false }, a = completeSound(p, s);
        expect(a.earned).toBe(0); expect(a.profile.stars).toBe(p.stars); expect(a.profile.stats).toEqual(p.stats); expect(a.profile.achievements).toEqual(p.achievements); expect(a.profile.gameHistory).toEqual(p.gameHistory); expect(a.profile.soundMemory!.missions).toEqual({});
        const b = completeSound(a.profile, { ...win(12, true, true), campaign: false }); expect(b.profile.soundMemory!.practiceBest).toEqual({ 'band-13:solo': 1000, 'band-13:visual': 1000 });
    });
    it('rejects locked missions and malformed results', () => { expect(completeSound(profile(), win(1)).accepted).toBe(false); expect(completeSound(profile(), { ...win(), outcomes: [] }).accepted).toBe(false); expect(completeSound(profile(), newSession('band-1', 1, true, 'a')).accepted).toBe(false); });
    it('keeps first-attempt metadata when improving from two to three stars at the same score', () => { const s = win(); s.outcomes[0].first = false; s.attempts++; const first = completeSound(profile(), s); expect(first.earned).toBe(2); const improved = completeSound(first.profile, win()); expect(improved.earned).toBe(1); expect(improved.profile.gameHistory.at(-1).sound?.outcomes.every(o => o.first)).toBe(true); });
    it('drafts validate, survive reload paused and tolerate corrupt or unavailable storage', () => {
        const data = new Map<string, string>(); vi.stubGlobal('localStorage', { getItem: (k: string) => data.get(k), setItem: (k: string, v: string) => data.set(k, v) });
        try {
            expect(saveSoundDraft('a', win())).toBe(true); expect(validSession(readSoundDraft('a').session)).toBe(true); expect(readSoundDraft('b').session).toBe(null);
            data.set('sound-draft:a', '{broken'); expect(readSoundDraft('a').corrupt).toBe(true);
            vi.stubGlobal('localStorage', { getItem: () => { throw Error(); }, setItem: () => { throw Error(); } }); expect(saveSoundDraft('a', win())).toBe(false); expect(readSoundDraft('a').session).toBe(null);
        } finally { vi.unstubAllGlobals(); }
    });
});
describe('composition library', () => {
    it('deleting a profile cleans only its own music drafts and settings', () => { const removeItem = vi.fn(); vi.stubGlobal('localStorage', { removeItem }); try { clearSoundProfileData('removed'); expect(removeItem.mock.calls.map(call => call[0])).toEqual(['sound-draft:removed', 'sound-studio-draft:removed', 'sound-prefs:removed']); } finally { vi.unstubAllGlobals(); } });
    it('stores musical events; invalid data cannot enter the profile', () => {
        const c = blankComposition('a'); expect(validComposition(c)).toBe(true);
        for (const patch of [{ bpm: 500 }, { timbre: 'fake' }, { melody: [0] }, { name: ' ' }, { steps: 20 }, { clap: [] }]) expect(validComposition({ ...c, ...patch })).toBe(false);
        const p = readSoundProgress({ version: 2, compositions: [c, c, { invalid: true }] }); expect(p.compositions).toHaveLength(1);
    });
    it('limits the library to 12 and requires explicit overwrite, without silent deletion', () => {
        const library = Array.from({ length: 12 }, (_, i) => blankComposition(String(i))), next = blankComposition('new');
        expect(editLibrary(library, { type: 'save', composition: next, overwrite: false }).ok).toBe(false);
        expect(editLibrary(library, { type: 'save', composition: { ...next, id: '0' }, overwrite: false }).ok).toBe(false);
        const r = editLibrary(library, { type: 'save', composition: { ...next, id: '0', name: 'Thay bài' }, overwrite: true }); expect(r.ok).toBe(true); expect(r.library).toHaveLength(12); expect(r.library[1]).toEqual(library[1]); expect(r.library[0].name).toBe('Thay bài');
        expect(editLibrary(r.library, { type: 'delete', id: '0' }).library).toHaveLength(11);
    });
    it('composition writes are atomic and isolated to the selected profile', () => {
        const profiles = [profile(), { ...profile(), id: 'other' }], c = blankComposition('a');
        const fail = persistComposition(profiles, 'music-test', { type: 'save', composition: c, overwrite: false }, () => { throw Error(); }); expect(fail.ok).toBe(false); expect(fail.profiles).toBe(profiles);
        const saved = persistComposition(profiles, 'music-test', { type: 'save', composition: c, overwrite: false }, () => {}); expect(saved.ok).toBe(true); expect(saved.profiles[1]).toBe(profiles[1]); expect(saved.profiles[0].stars).toBe(profiles[0].stars); expect(saved.profiles[0].stats).toEqual(profiles[0].stats);
    });
});
