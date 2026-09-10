import { describe, expect, it } from 'vitest';
import { APPROACH, GATE, LEVELS, MISSIONS, PACES, SEGMENT, Session, normalizeConfig } from './model';
import { activeQuestion, chooseLane, createSession, finishDistance, readSeconds, recordOf, step, useNitro, validSession } from './engine';
import { questionsFor, syllabus } from './questions';
import { answerKey, numericValue } from './questionValues';
// Independent test oracle: only numeric tokens and arithmetic operators from
// generated content are accepted. Production uses a separate recursive parser.
function calculate(text: string): number {
    const code = text.replace(/(?<=\d) (?=\d{3}(?:\D|$))/g, '').replaceAll(',', '.').replace(/(\d+)\/(\d+)/g, '($1/$2)').replaceAll('×', '*').replaceAll('÷', '/').replaceAll(':', '/').replaceAll('−', '-');
    if (!/^[\d.\s()+*/-]+$/.test(code)) throw new Error(`Not arithmetic: ${text}`);
    return Function(`"use strict"; return (${code})`)() as number;
}
function verifyQuestion(q: ReturnType<typeof questionsFor>[number]) {
    const text = q.text, answer = String(q.answer), n = numericValue(answer);
    if (text.endsWith(' = ?')) expect(n, text).toBeCloseTo(calculate(text.slice(0, -4)), 7);
    else if (text.includes('=') && text.includes('?')) {
        const [left, right] = text.replace('?', answer).split('='); expect(calculate(left), text).toBeCloseTo(calculate(right), 7);
    } else if (text.startsWith('Điền số tròn chục')) {
        const xs = (text.match(/\d+/g) || []).map(Number); expect(n).toBe((xs[0] + xs[1]) / 2);
    } else if (text.startsWith('Trung bình cộng của các số')) {
        const xs = (text.match(/\d+/g) || []).map(Number); expect(n).toBeCloseTo(xs.reduce((a, b) => a + b, 0) / xs.length, 7);
    } else if (text.includes('Tìm số còn lại')) {
        const xs = (text.match(/\d+/g) || []).map(Number); expect(n).toBe(xs[0] * xs[1] - xs.slice(3).reduce((a, b) => a + b, 0));
    } else if (text.includes('chu vi hình chữ nhật')) {
        const xs = (text.match(/\d+/g) || []).map(Number); expect(answer).toBe(`${2 * (xs[0] + xs[1])}cm`);
    } else if (text.includes('là bao nhiêu phần trăm')) {
        const xs = (text.match(/\d+(?:\.\d+)?/g) || []).map(Number); expect(Number(answer.replace('%', ''))).toBeCloseTo(xs[0] / xs[1] * 100, 7);
    } else if (text.includes('giá sau khi giảm')) {
        const xs = (text.replace(/(?<=\d) (?=\d{3}(?:\D|$))/g, '').match(/\d+/g) || []).map(Number); expect(n).toBe(xs[0] * (100 - xs[1]) / 100);
    } else throw new Error(`Missing independent check: ${text}`);
}
export function finish(s: Session, correct = true) {
    s.phase = 'racing'; s.paused = false;
    for (let i = 0; i < 120000 && s.phase === 'racing'; i++) {
        const q = activeQuestion(s); if (q >= 0) chooseLane(s, (s.questions[q].options.indexOf(s.questions[q].answer) + (correct ? 0 : 1)) % 3, q);
        step(s, 1 / 30);
    }
    return s;
}
describe('Racing difficulty and question contracts', () => {
    for (let grade = 1; grade <= 5; grade++) for (const l of LEVELS) it(`grade ${grade}, ${l.id}: correct arithmetic, unique choices, valid range`, () => {
        for (let seed = 1; seed <= 100; seed++) {
            const c = normalizeConfig({ difficulty: l.id }, grade), questions = questionsFor(c, seed, 10);
            for (const q of questions) {
                verifyQuestion(q);
                expect(q.source?.topic.startsWith(`g${grade}_`)).toBe(true);
                expect(new Set(q.options.map(answerKey)).size).toBe(3); expect(q.options.filter(v => answerKey(v) === answerKey(q.answer))).toHaveLength(1);
                expect(q.text.length).toBeLessThanOrEqual(135); expect(q.readBonus).toBeGreaterThanOrEqual(0);
                if (grade === 1) expect(numericValue(String(q.answer))).toBeLessThanOrEqual(l.id === 'easy' ? 10 : l.id === 'medium' ? 20 : 100);
                if (grade === 2) expect(numericValue(String(q.answer))).toBeLessThanOrEqual(100);
            }
            expect(new Set(questions.map(q => q.text)).size).toBe(10);
            expect(questionsFor(c, seed, 10)).toEqual(questions);
            if (seed <= 5) for (const pace of PACES) expect(questionsFor({ ...c, pace: pace.id }, seed, 10)).toEqual(questions);
        }
    });
    it('each difficulty describes and generates a distinct syllabus, including saved invalid settings', () => {
        for (let grade = 1; grade <= 5; grade++) { expect(new Set(LEVELS.map(l => syllabus(grade, l.id))).size).toBe(3);
            const sets = LEVELS.map(l => JSON.stringify(questionsFor(normalizeConfig({ difficulty: l.id }, grade), 818, 10))); expect(new Set(sets).size).toBe(3); }
        expect(normalizeConfig({ difficulty: 'impossible' as never, pace: 'turbo' as never }, 0)).toMatchObject({ difficulty: 'easy', pace: 'normal', grade: 1 });
    });
});
describe('Racing simulation', () => {
    it('finishes all missions without eliminating children for wrong answers', () => {
        for (const m of MISSIONS) for (const correct of [true, false]) {
            const s = finish(createSession(normalizeConfig({ mission: m.id }, 2), 41, 'run', 'p'), correct);
            expect(s.phase).toBe('finished'); expect(s.answers).toHaveLength(m.gates); expect(validSession(s)).toBe(true);
            expect(recordOf(s).accuracy).toBe(correct ? 100 : 0); expect(recordOf(s).stars).toBe(correct ? 3 : 1); expect(s.elapsed).toBeGreaterThan(m.gates * 8);
        }
    });
    it('keeps math pace safe during nitro, queues boost, rejects old gate actions', () => {
        const s = createSession(normalizeConfig({}, 3), 1, 'a', 'p'); s.phase = 'racing'; s.racers[0].distance = APPROACH + 1; s.racers[0].energy = 100;
        expect(activeQuestion(s)).toBe(0); useNitro(s); expect(s.queuedBoost).toBe(true); expect(s.racers[0].boost).toBe(0);
        chooseLane(s, 2, 99); expect(s.racers[0].target).toBe(1);
        const previous = s.racers[0].distance; step(s, .25); expect(s.racers[0].distance - previous).toBeCloseTo(110 / readSeconds(s, 0) * .25, 4);
        s.racers[0].distance = GATE - .01; step(s, .25); expect(s.answers).toHaveLength(1); expect(s.nitros).toBe(1);
        step(s, .25); expect(s.answers).toHaveLength(1);
    });
    it('pause and waiting for choice stop all racers and the race clock', () => {
        const s = createSession(normalizeConfig({ waitForChoice: true }), 1, 'a', 'p'); s.phase = 'racing'; s.racers[0].distance = GATE - 7;
        const before = structuredClone(s); step(s, .2); expect(s).toEqual(before);
        chooseLane(s, 2, 0); step(s, .2); expect(s.elapsed).toBeGreaterThan(0);
        s.paused = true; const paused = structuredClone(s); chooseLane(s, 0); useNitro(s); step(s, .2); expect(s).toEqual(paused);
    });
    it('does not skip collision on a long frame, and keeps obstacle generation safe', () => {
        const s = createSession(normalizeConfig({ mission: 3, pace: 'fast' }), 19, 'a', 'p'); s.phase = 'racing'; const cone = s.objects.find(o => o.type === 'cone')!;
        s.racers[0].distance = cone.at - .01; s.racers[0].target = cone.lane; step(s, 2); expect(s.collisions).toBe(1); expect(s.elapsed).toBeLessThan(.251); step(s, .2); expect(s.collisions).toBe(1);
        for (const o of s.objects) expect(o.at % SEGMENT).toBeLessThan(APPROACH);
        expect(s.objects[0].type).toBe('energy'); expect(s.objects).toHaveLength(s.questions.length);
    });
    it('replays the exact missed questions with a fresh score', () => {
        const old = finish(createSession(normalizeConfig({ mode: 'quick', difficulty: 'hard' }, 3), 731, 'a', 'p'), false);
        const s = createSession(normalizeConfig({ ...old.config, mode: 'practice', review: [2, 5, 7] }, 3), old.seed, 'b', 'p');
        expect(s.questions).toEqual([old.questions[2], old.questions[5], old.questions[7]]); expect(s.answers).toHaveLength(0); expect(validSession(s)).toBe(true);
    });
    it('rejects corrupt snapshots and false completions', () => {
        const s = createSession(normalizeConfig({}), 1, 'a', 'p'); expect(validSession(s)).toBe(true);
        expect(validSession({ ...s, phase: 'finished' })).toBe(false);
        expect(validSession({ ...s, elapsed: NaN })).toBe(false);
        expect(validSession({ ...s, config: { ...s.config, difficulty: 'unknown' } })).toBe(false);
        s.questions[0].options[0] = 998; expect(validSession(s)).toBe(false);
    });
    it('records consistent outcomes at 30, 60 and 120 fps', () => {
        const run = (hz: number) => { const s = createSession(normalizeConfig({ autoNitro: true }), 921, 'a', 'p'); s.phase = 'racing';
            for (let i = 0; i < 120000 && s.phase === 'racing'; i++) { const q = activeQuestion(s); if (q >= 0) chooseLane(s, s.questions[q].options.indexOf(s.questions[q].answer), q); step(s, 1 / hz); } return s; };
        const base = run(60); for (const hz of [30, 120]) { const s = run(hz); expect(recordOf(s)).toEqual(recordOf(base)); expect(Math.abs(s.elapsed - base.elapsed)).toBeLessThan(.2); expect(s.racers[0].distance).toBe(finishDistance(s)); }
    });
    for (const pace of PACES) it(`${pace.id}: short transitions preserve the full answer window`, () => {
        for (const outcome of ['correct', 'wrong', 'nitro']) {
            const s = createSession(normalizeConfig({ pace: pace.id, mode: 'quick', difficulty: 'hard' }, 2), 511, 'pace', 'p'); s.phase = 'racing';
            let shownAt = -1, answeredAt = -1, nextAt = -1;
            for (let i = 0; i < 2000; i++) {
                const q = activeQuestion(s);
                if (q === 0) {
                    if (shownAt < 0) shownAt = s.elapsed;
                    chooseLane(s, (s.questions[0].options.indexOf(s.questions[0].answer) + (outcome === 'wrong' ? 1 : 0)) % 3, q);
                }
                if (s.answers.length === 1 && answeredAt < 0) {
                    answeredAt = s.elapsed;
                    // Avoid the driving obstacle so this measures the question
                    // transition, with wrong-answer slowdown tested separately.
                    chooseLane(s, (s.objects[1].lane + 1) % 3);
                    if (outcome === 'nitro') { s.racers[0].energy = 100; useNitro(s); }
                }
                if (q === 1) { nextAt = s.elapsed; break; }
                step(s, 1 / 60);
            }
            expect(shownAt).toBeGreaterThan(1); expect(shownAt).toBeLessThan(1.8);
            expect(answeredAt - shownAt).toBeCloseTo(readSeconds(s, 0), 1);
            expect(nextAt).toBeGreaterThan(answeredAt);
            expect(nextAt - answeredAt).toBeLessThan(outcome === 'wrong' ? 2.6 : 2.22);
            expect(nextAt - answeredAt).toBeGreaterThan(.8);
            expect(readSeconds(s, 1)).toBeGreaterThanOrEqual(pace.seconds);
        }
    });
});
