import { describe, expect, it } from 'vitest';
import { activeQuestion, answerNow, chooseLane, createSession, step, validSession } from './engine';
import { APPROACH, GATE, PACES, SEGMENT, normalizeConfig } from './model';
import { RaceMotion } from './motion';

function atQuestion(pace: 'relaxed' | 'normal' | 'fast' = 'normal', offset = 0) {
    const s = createSession(normalizeConfig({ mode: 'quick', pace }, 2), 411, 'submit', 'p');
    s.phase = 'racing'; s.racers[0].distance = APPROACH + offset;
    return s;
}
describe('Answer now', () => {
    for (const pace of PACES) for (const correct of [true, false]) it(`${pace.id}/${correct}: commits once, arrives within 0.8s and grades normally`, () => {
        const s = atQuestion(pace.id), q = s.questions[0], lane = (q.options.indexOf(q.answer) + (correct ? 0 : 1)) % 3;
        answerNow(s, 0); expect(s.answerRush).toBeUndefined();
        chooseLane(s, lane, 0); answerNow(s, 99); expect(s.answerRush).toBeUndefined();
        answerNow(s, 0); expect(s.racers[0].distance).toBe(APPROACH); expect(s.answers).toHaveLength(0);
        expect(s.racers[0].energy).toBe(0); expect(validSession(s)).toBe(true);
        const committed = structuredClone(s.answerRush);
        chooseLane(s, (lane + 1) % 3, 0); answerNow(s, 0);
        expect(s.answerRush).toEqual(committed); expect(s.racers[0].target).toBe(lane);
        for (let i = 0; i < 48; i++) step(s, 1 / 60);
        expect(s.answers).toEqual([{ question: 0, selected: q.options[lane], correct }]);
        expect(s.answerRush).toBeUndefined(); expect(s.selected).toBe(false); expect(s.nitros).toBe(0);
        expect(s.racers[0].energy).toBe(correct ? 25 : 0); expect(validSession(s)).toBe(true);
        expect(s.racers[0].distance).toBeLessThan(SEGMENT + APPROACH);
        answerNow(s, 0); expect(s.answers).toHaveLength(1); expect(s.answerRush).toBeUndefined();
    });
    it('preserves a partially completed rush through pause and draft restore', () => {
        const s = atQuestion(); chooseLane(s, 0); expect(s.selected).toBe(true); answerNow(s, 0); step(s, .2);
        s.paused = true; const saved = JSON.stringify(s); step(s, .2); answerNow(s, 0); expect(JSON.stringify(s)).toBe(saved);
        const restored = JSON.parse(saved); expect(validSession(restored)).toBe(true); restored.paused = false;
        for (let i = 0; i < 40; i++) step(restored, 1 / 60);
        expect(restored.answers).toHaveLength(1); expect(validSession(restored)).toBe(true);
        expect(validSession({ ...s, answerRush: { ...s.answerRush, lane: 2 } })).toBe(false);
        expect(validSession({ ...s, answerRush: { ...s.answerRush, duration: NaN } })).toBe(false);
    });
    it('handles a last-moment submit, practice waiting and stale actions at the next question', () => {
        const s = atQuestion('fast', GATE - APPROACH - .001); chooseLane(s, 2, 0); answerNow(s, 0); step(s, 1 / 60);
        expect(s.answers).toHaveLength(1); expect(s.answerRush).toBeUndefined();
        s.racers[0].distance = SEGMENT + APPROACH; expect(activeQuestion(s)).toBe(1);
        answerNow(s, 0); expect(s.answerRush).toBeUndefined();
        const practice = atQuestion(); practice.config = normalizeConfig({ ...practice.config, mode: 'practice' }, 2);
        practice.racers[0].distance = GATE - 7; const before = practice.elapsed; step(practice, .2); expect(practice.elapsed).toBe(before);
        chooseLane(practice, 1, 0); answerNow(practice, 0);
        for (let i = 0; i < 48; i++) step(practice, 1 / 60);
        expect(practice.answers).toHaveLength(1);
    });
    for (const hz of [30, 60, 120, 144]) it(`moves continuously without teleporting at ${hz}Hz`, () => {
        const s = atQuestion(), motion = new RaceMotion(); motion.advance(s, 0);
        chooseLane(s, 0, 0); answerNow(s, 0);
        let previous = APPROACH;
        for (let frame = 1; frame <= hz; frame++) {
            const distance = motion.advance(s, frame * 1000 / hz).racers[0].distance;
            expect(distance).toBeGreaterThanOrEqual(previous); expect(distance - previous).toBeLessThan(9);
            previous = distance;
        }
        expect(s.answers).toHaveLength(1); expect(s.answerRush).toBeUndefined();
    });
});
