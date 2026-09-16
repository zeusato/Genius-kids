import { describe, expect, it } from 'vitest';
import { TRACE_LETTERS, advanceTrace, canStartTrace, initialTraceState, traceFinished, type TraceState } from './letterTracingModel';

describe('guided letter tracing', () => {
    it('provides a valid large outline for every A–Z letter', () => {
        expect(Object.keys(TRACE_LETTERS).join('')).toBe('abcdefghijklmnopqrstuvwxyz');
        for (const letter of Object.values(TRACE_LETTERS)) {
            expect(letter.strokes.length).toBeGreaterThan(0);
            for (const stroke of letter.strokes) {
                expect(stroke.points.length).toBeGreaterThan(10);
                for (const [x, y] of stroke.points) {
                    expect(x).toBeGreaterThan(80); expect(x).toBeLessThan(320);
                    expect(y).toBeGreaterThan(60); expect(y).toBeLessThan(345);
                }
            }
        }
    });

    it.each(Object.keys(TRACE_LETTERS))('finishes %s only after following each stroke in order', id => {
        const letter = TRACE_LETTERS[id];
        let state = initialTraceState();
        letter.strokes.forEach((stroke, index) => {
            expect(traceFinished(letter, state)).toBe(false);
            expect(canStartTrace(letter, state, stroke.points[0])).toBe(true);
            let from = stroke.points[0];
            for (let i = 5; i < stroke.points.length + 5; i += 5) {
                const to = stroke.points[Math.min(i, stroke.points.length - 1)];
                state = advanceTrace(letter, state, from, to).state;
                from = to;
                if (state.stroke > index) break;
            }
            expect(state.stroke).toBe(index + 1);
        });
        expect(traceFinished(letter, state)).toBe(true);
    });

    it('does not count a tap, a stationary hold, or starting at the end', () => {
        const letter = TRACE_LETTERS.b, start = letter.strokes[0].points[0], state = initialTraceState();
        expect(canStartTrace(letter, state, [130, 320])).toBe(false);
        for (let i = 0; i < 20; i++) expect(advanceTrace(letter, state, start, start).state).toEqual(state);
        expect(traceFinished(letter, state)).toBe(false);
    });

    it('rejects a straight shortcut through a curved letter', () => {
        const letter = TRACE_LETTERS.c, points = letter.strokes[0].points;
        const result = advanceTrace(letter, initialTraceState(), points[0], points[points.length - 1]);
        expect(result.offPath).toBe(true);
        expect(traceFinished(letter, result.state)).toBe(false);
    });

    it('keeps valid ink when leaving the corridor and allows resuming from its end', () => {
        const letter = TRACE_LETTERS.b, points = letter.strokes[0].points;
        const first = advanceTrace(letter, initialTraceState(), points[0], points[20]).state;
        const escaped = advanceTrace(letter, first, points[20], [320, 150]);
        expect(escaped.offPath).toBe(true);
        expect(escaped.state.point).toBeGreaterThanOrEqual(first.point);
        const resume = points[escaped.state.point];
        expect(canStartTrace(letter, escaped.state, resume)).toBe(true);
        expect(canStartTrace(letter, escaped.state, points[0])).toBe(false);
        expect(advanceTrace(letter, escaped.state, resume, points[points.length - 1]).state.stroke).toBe(1);
    });

    it('a new stroke needs its own start and progress does not run backwards', () => {
        const letter = TRACE_LETTERS.b, points = letter.strokes[0].points;
        const half = advanceTrace(letter, initialTraceState(), points[0], points[20]).state;
        expect(advanceTrace(letter, half, points[20], points[18]).state.point).toBe(half.point);
        const next: TraceState = { stroke: 1, point: 0 };
        expect(canStartTrace(letter, next, [130, 320])).toBe(false);
        expect(canStartTrace(letter, next, [130, 85])).toBe(true);
    });

    it('ignores invalid pointer coordinates and does not grow after completion', () => {
        const letter = TRACE_LETTERS.o, initial = initialTraceState();
        expect(advanceTrace(letter, initial, [NaN, 2], [4, 5]).state).toEqual(initial);
        expect(advanceTrace(letter, initial, [200, 85], [1e8, 1e8]).offPath).toBe(true);
        const done = { stroke: letter.strokes.length, point: 0 };
        expect(advanceTrace(letter, done, [200, 85], [200, 100]).state).toBe(done);
        expect(traceFinished(letter, { stroke: 99, point: 0 })).toBe(false);
    });
});
