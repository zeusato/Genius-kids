import { describe, expect, it } from 'vitest';
import { FAULTS, LESSONS, MISSIONS } from '../../../data/electricity/content';
import { cloneCircuit } from './circuit';
import { preset, wire } from './fixtures';
import { createRun, earnedTier, predicate } from './evidence';
import { seededOrder } from './shuffle';
import { startSimulation } from './simulation';

// Hồi quy các lỗi tìm được khi rà soát 30/09/2026: tiêu chí dựa vào ID cứng, dấu dòng điện của bóng
// không cực, "sửa" bằng dây đi tắt, pin chanh bị nối tắt, sao cho nhiệm vụ chưa làm.
const spec = (id: string) => [...LESSONS, ...MISSIONS, ...FAULTS].find(s => s.id === id)!;
const atStep = (id: string, stepId: string, c = preset(spec(id).initialCircuitId)) => {
    const s = spec(id), run = createRun('qa', s, c);
    run.step = s.steps.findIndex(v => v.id === stepId);
    return { s, run };
};

describe('evidence uses roles instead of fixed part IDs', () => {
    it('smart room still passes after the child re-adds a switch with a new ID', () => {
        const c = preset('smartRoom');
        const k1 = c.parts.find(p => p.id === 'K1')!;
        k1.id = 'K7';
        c.wires = c.wires.map(w => ({ ...w, a: w.a.partId === 'K1' ? { ...w.a, partId: 'K7' } : w.a, b: w.b.partId === 'K1' ? { ...w.b, partId: 'K7' } : w.b }));
        c.parts.filter(p => p.kind === 'switch').forEach(p => { p.closed = true; });
        const { s, run } = atStep('smartRoom', 'room-11', c);
        expect(predicate(s, run, startSimulation(c))).toBe(true);
    });
    it('stairs works with two-way switches that received new IDs', () => {
        const c = preset('stairs'), rename = { K1: 'K', K2: 'K3' } as Record<string, string>;
        c.parts.forEach(p => { if (rename[p.id]) p.id = rename[p.id]; });
        c.wires = c.wires.map(w => ({ ...w, a: { ...w.a, partId: rename[w.a.partId] ?? w.a.partId }, b: { ...w.b, partId: rename[w.b.partId] ?? w.b.partId } }));
        const { s, run } = atStep('stairs', 'stairs00', c);
        expect(predicate(s, run, startSimulation(c))).toBe(true);
    });
    it('reversed cell lights a bulb whichever post the child wired to (+)', () => {
        const c = preset('single');
        c.parts[0].cells![0].polarity = -1;
        c.wires = [wire('x', 'B', 'plus', 'L1', 'b'), wire('y', 'L1', 'a', 'B', 'minus')];
        const { s, run } = atStep('L06-twoContacts', 'reverse', c);
        expect(predicate(s, run, startSimulation(c))).toBe(true);
    });
});

describe('fault repair and lemon cell cannot be faked', () => {
    it('a bypass wire around the insulating clip is not a repair', () => {
        const c = preset('insulatedClip'), { s, run } = atStep('insulatedClip', 'insulatedClip-repair', c);
        run.observed = c.parts.map(p => p.id);
        const x = c.parts.find(p => p.id === 'X')!, bypass = cloneCircuit(c);
        bypass.wires.push(wire('bypass', 'X', 'a', 'X', 'b'));
        expect(predicate(s, run, startSimulation(bypass))).toBe(false);
        const fixed = cloneCircuit(c); fixed.parts.find(p => p.id === x.id)!.resistance = 0.05;
        expect(predicate(s, run, startSimulation(fixed))).toBe(true);
    });
    it('one lemon with a short across it does not count as trying the LED', () => {
        const c = preset('lemonLight'), { s, run } = atStep('lemonLight', 'lemon-one', c);
        expect(predicate(s, run, startSimulation(c))).toBe(true);
        const shorted = cloneCircuit(c); shorted.wires.push(wire('short', 'B', 'plus', 'B', 'minus'));
        expect(predicate(s, run, startSimulation(shorted))).toBe(false);
    });
});

describe('rewards need finished work', () => {
    it('an unfinished mission earns no star, a pre-wired one caps at 2', () => {
        const flash = spec('flashlight'), r = createRun('qa', flash, preset('flashlight'));
        r.milestones = [{ id: flash.steps[0].id, editRevision: 1, solveRevision: 1, time: 1, circuit: preset('flashlight'), power: {} }];
        expect(earnedTier(flash, r)).toBe(0);
        const traffic = spec('trafficLight'), t = createRun('qa', traffic, preset('trafficLight'));
        t.milestones = traffic.steps.map(v => ({ id: v.id, editRevision: 1, solveRevision: 1, time: 1, circuit: preset('trafficLight'), power: {} })); t.done = true;
        expect(earnedTier(traffic, t)).toBe(2);
    });
    it('traffic light starts with every switch open, so the first step needs an action', () => {
        const c = preset('trafficLight'), { s, run } = atStep('trafficLight', 'traffic-red', c);
        expect(c.parts.filter(p => p.kind === 'switch').every(p => !p.closed)).toBe(true);
        expect(predicate(s, run, startSimulation(c))).toBe(false);
    });
    it('fault diagnoses offer plausible distractors, shuffled per run', () => {
        for (const f of FAULTS) {
            const opts = f.steps.find(v => v.predicate === 'choice')!.choice!.options;
            expect(new Set(opts).size).toBe(3);
            expect(opts.some(o => o.includes('thêm nhiều pin'))).toBe(false);
        }
        const order = seededOrder(3, 'run-a:step');
        expect([...order].sort()).toEqual([0, 1, 2]);
        expect(seededOrder(3, 'run-a:step')).toEqual(order);
        const firsts = new Set(Array.from({ length: 40 }, (_, i) => seededOrder(3, `run-${i}`)[0]));
        expect(firsts.size).toBe(3);
    });
});
