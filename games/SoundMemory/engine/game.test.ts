import { describe, expect, it } from 'vitest';
import { SOUND_MISSIONS, phraseFor } from '../content/missions';
import { judgeRhythm, newSession, phraseOf, reduceSound, soundResult, validSession } from './game';
export function win(index = 0, guided = false, visual = false) {
    let s = newSession(SOUND_MISSIONS[index].id, 42, true, `test-${index}`);
    for (let i = 0; i < 3; i++) {
        s = reduceSound(s, { type: 'demo', guided, visual, slow: false, quality: 'output-clock' });
        s = reduceSound(s, { type: 'input' });
        const p = phraseOf(s);
        if (p.kind === 'rhythm' && !guided) s = reduceSound(s, { type: 'rhythm', accuracy: 1 });
        else for (const note of p.notes) s = reduceSound(s, { type: 'note', note });
        s = reduceSound(s, { type: 'next' });
    }
    return s;
}
describe('musical curriculum and round state', () => {
    it.each([0, 1, 42, 235, 4294967295])('validates every authored phrase with seed %i', seed => {
        expect(SOUND_MISSIONS).toHaveLength(24);
        for (const m of SOUND_MISSIONS) for (let i = 0; i < 3; i++) {
            const p = phraseFor(m, i, seed);
            expect(p.notes.length).toBeGreaterThanOrEqual(2); expect(p.notes.length).toBeLessThanOrEqual(8);
            expect(p.beats.length).toBe(p.notes.length); expect(p.beats[0]).toBe(0);
            expect(p.notes.every(n => Number.isInteger(n) && n >= 0 && n < (p.kind === 'melody' ? m.pads : 2))).toBe(true);
            expect(p.beats.every((b, j) => b < p.length && (!j || b > p.beats[j - 1]))).toBe(true);
            expect(phraseFor(m, i, seed)).toEqual(p);
        }
    });
    it('all 24 missions complete with 3 phrases, including alternating final chapters', () => {
        SOUND_MISSIONS.forEach((m, i) => { const s = win(i); expect(validSession(s), m.id).toBe(true); expect(s.phase).toBe('complete'); expect(soundResult(s).stars).toBe(3); expect(s.attempts).toBe(3); });
    });
    it('distinct repeated taps are legal; wrong note keeps the phrase and never removes prior work', () => {
        let s = newSession('band-2', 0, true, 'a');
        s = reduceSound(s, { type: 'demo', guided: false, visual: false, slow: false, quality: 'output-clock' }); s = reduceSound(s, { type: 'input' });
        s = reduceSound(s, { type: 'note', note: 1 }); expect(s.failed).toBe(true); expect(s.index).toBe(0); expect(s.phraseAttempts).toBe(1);
        s = reduceSound(s, { type: 'replay' }); s = reduceSound(s, { type: 'demo', guided: false, visual: false, slow: true, quality: 'output-clock' }); s = reduceSound(s, { type: 'input' });
        s = reduceSound(s, { type: 'note', note: 0 }); expect(s.phase).toBe('input'); s = reduceSound(s, { type: 'note', note: 0 });
        expect(s.failed).toBe(false); expect(s.outcomes[0].first).toBe(false); expect(s.outcomes[0].assisted).toBe(false);
    });
    it('ignores disabled input, resumes the current demo safely and keeps completed phrases', () => {
        let s = newSession('band-1', 0, true, 'a'); expect(reduceSound(s, { type: 'note', note: 0 })).toBe(s);
        s = reduceSound(s, { type: 'demo', guided: false, visual: false, slow: false, quality: 'output-clock' }); s = reduceSound(s, { type: 'input' });
        s = reduceSound(s, { type: 'note', note: 0 }); s = reduceSound(s, { type: 'pause' });
        expect(reduceSound(s, { type: 'note', note: 2 })).toBe(s); s = reduceSound(s, { type: 'resume' }); expect(s.phase).toBe('ready'); expect(s.entered).toEqual([]); expect(s.attempts).toBe(0);
        s = reduceSound(s, { type: 'demo', guided: false, visual: false, slow: false, quality: 'output-clock' }); s = reduceSound(s, { type: 'input' });
        for (const note of phraseOf(s).notes) s = reduceSound(s, { type: 'note', note });
        expect(s.outcomes[0].first).toBe(true); s = reduceSound(s, { type: 'next' }); s = reduceSound(s, { type: 'pause' }); s = reduceSound(s, { type: 'resume' });
        expect(s.index).toBe(1); expect(s.outcomes).toHaveLength(1); expect(validSession(s)).toBe(true);
    });
    it('assisted and visual outcomes earn completion without masquerading as independent listening', () => {
        expect(soundResult(win(2, true)).stars).toBe(1); expect(soundResult(win(12, true, true)).record.visual).toBe(true);
        const s = win(12); s.outcomes[0].quality = 'estimated'; expect(validSession(s)).toBe(false);
    });
    it('rejects corrupt snapshots and incomplete completion claims', () => {
        const s = win(); for (const patch of [{ index: 8 }, { seed: NaN }, { entered: null }, { attempts: -1 }, { phase: 'oops' }, { outcomes: [] }, { missionId: 'fake' }]) expect(validSession({ ...s, ...patch })).toBe(false);
        expect(validSession(null)).toBe(false); expect(validSession({ ...s, outcomes: [...s.outcomes.slice(0, 2), { ...s.outcomes[2], accuracy: Infinity }] })).toBe(false);
    });
    it('records slow practice in any completed phrase, even if the final phrase is normal speed', () => { const s = win(); s.outcomes[0].slow = true; s.slow = false; expect(soundResult(s).record.slow).toBe(true); expect(soundResult(s).stars).toBe(3); });
});
describe('rhythm matching', () => {
    const p = SOUND_MISSIONS[14].phrases[0];
    it('matches each tap at most once and penalizes extra taps', () => {
        const taps = p.notes.map((note, i) => ({ note, at: p.beats[i] * .75 }));
        expect(judgeRhythm(p, taps, .75).accuracy).toBe(1);
        expect(judgeRhythm(p, [...taps, ...taps], .75)).toMatchObject({ hits: 4, extra: 4, accuracy: .5 });
        expect(judgeRhythm(p, [], .75)).toMatchObject({ missed: 4, accuracy: 0 });
    });
    it('accepts the boundary but rejects a later hit, wrong instrument and early spam', () => {
        expect(judgeRhythm(p, [{ at: .18, note: 0 }], .75).hits).toBe(1);
        expect(judgeRhythm(p, [{ at: .181, note: 0 }], .75).hits).toBe(0);
        expect(judgeRhythm(p, [{ at: 0, note: 1 }], .75).hits).toBe(0);
        expect(judgeRhythm(p, Array.from({ length: 100 }, () => ({ at: -.4, note: 0 })), .75).accuracy).toBe(0);
    });
    it('shrinks timing windows so adjacent half-beat targets never overlap', () => {
        const p = SOUND_MISSIONS[16].phrases[0]; expect(judgeRhythm(p, [], .6).window).toBeCloseTo(.135);
        expect(judgeRhythm(p, [{ at: .75, note: 0 }], .6).hits).toBe(0);
    });
});
