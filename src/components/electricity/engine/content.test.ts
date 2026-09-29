import { describe, it, expect } from 'vitest';
import { CONTENT, LESSONS, MISSIONS, FAULTS, ContentSpec } from '../../../data/electricity/content';
import { dailyEnergy, earthHourEnergy, HAZARDS, POWER_OBJECTS, SAMPLES } from '../../../data/electricity/labs';
import { cloneCircuit, newPart, postIds, ref, validateCircuit } from './circuit';
import { preset, wire } from './fixtures';
import { createRun, predicate, sampleEvidence } from './evidence';
import { applyCircuit, startSimulation, tick } from './simulation';
import { reading, solve } from './solver';
import { routeAll } from './route';
function repaired(id: string) { const c = preset(id); for (const p of c.parts) {
    p.broken = false;
    p.loose = false;
    if (p.kind === 'switch')
        p.closed = true;
    if (p.kind === 'sample')
        p.resistance = .05;
    if (p.cells)
        p.cells = p.cells.map(v => ({ ...v, charge01: 1, polarity: 1 }));
} for (const w of c.wires)
    w.broken = false; if (id === 'missingWire')
    c.wires.push(wire('return', 'L1', 'b', 'B', 'minus')); if (id === 'shortedLoad')
    c.wires = c.wires.filter(w => w.id !== 'short'); if (id === 'reversedLed')
    c.wires = c.wires.map(w => ({ ...w, a: w.a.partId === 'L1' ? ref('L1', w.a.postId === 'anode' ? 'cathode' : 'anode') : w.a, b: w.b.partId === 'L1' ? ref('L1', w.b.postId === 'anode' ? 'cathode' : 'anode') : w.b })); return c; }
describe('content contracts', () => {
    it('contains every agreed ID and source metadata', () => { expect(LESSONS).toHaveLength(13); expect(MISSIONS).toHaveLength(12); expect(FAULTS).toHaveLength(12); expect(SAMPLES).toHaveLength(16); expect(HAZARDS).toHaveLength(6); expect(new Set(CONTENT.map(s => s.id)).size).toBe(37); for (const s of CONTENT) {
        expect(s.sourceIds.length).toBeGreaterThan(0);
        expect(s.hintRules).toHaveLength(3);
        expect(s.steps.every(s => !!s.audioKey && !!s.predicate)).toBe(true);
        expect(validateCircuit(preset(s.initialCircuitId))).toEqual([]);
    } });
    it.each([...new Set(CONTENT.filter(c => !c.activity).map(c => c.initialCircuitId))])('routes all wires in %s deterministically', id => { const c = preset(id), routes = routeAll(c); expect(routes.size, id).toBe(c.wires.length); expect([...routeAll(c)]).toEqual([...routes]); });
    it('parallel teaching preset has four direct wires, separate corridors and no electrical changes when routing', () => { const c = preset('parallel'); expect(c.wires).toHaveLength(4); expect(c.wires.every(w => w.a.partId === 'B' || w.b.partId === 'B')).toBe(true); const before = JSON.stringify(c); routeAll(c); expect(JSON.stringify(c)).toBe(before); expect(reading(solve(c), 'L1').Pabsorbed / .75).toBeCloseTo(.32479606, 7); });
    it('classification requires experiments as well as correct answers', () => { const spec = LESSONS[6], sim = startSimulation(preset('intro')), r = createRun('a', spec, sim.circuit); r.activity.classified = Object.fromEntries(SAMPLES.map(s => [s.id, s.resistance !== null])); expect(predicate(spec, r, sim)).toBe(false); r.activity.tested = SAMPLES.filter(s => s.core).map(s => s.id); expect(predicate(spec, r, sim)).toBe(true); });
    it('safety and power sorting need every individual correct choice', () => { for (const spec of LESSONS.slice(0, 2)) {
        const sim = startSimulation(preset()), r = createRun('a', spec, sim.circuit);
        expect(predicate(spec, r, sim)).toBe(false);
        r.activity = spec.activity === 'sorting' ? { sort: Object.fromEntries(POWER_OBJECTS) } : { safe: HAZARDS.slice(0, 5).map(h => h.id) };
        expect(predicate(spec, r, sim)).toBe(true);
    } });
    it.each(FAULTS.map(s => s.id))('%s needs observation, diagnosis, and actual repair', id => { const spec = FAULTS.find(s => s.id === id)!, initial = preset(id), r = createRun('a', spec, initial), sim = startSimulation(initial); expect(predicate(spec, r, sim)).toBe(false); r.observed = [...initial.parts.map(p => p.id), ...initial.wires.map(w => w.id)]; expect(predicate(spec, r, sim)).toBe(true); r.step = 1; r.choices[spec.steps[1].id] = 2; expect(predicate(spec, r, sim)).toBe(false); r.choices[spec.steps[1].id] = 0; expect(predicate(spec, r, sim)).toBe(true); r.step = 2; expect(predicate(spec, r, sim)).toBe(false); expect(predicate(spec, r, startSimulation(repaired(id)))).toBe(true); for (const mutate of [(c: typeof initial) => { c.wires = []; }, (c: typeof initial) => { c.parts.find(p => p.id === 'L1')!.broken = true; }, (c: typeof initial) => { c.parts.find(p => p.id === 'B')!.cells?.forEach(v => v.charge01 = 0); }]) {
        const bad = repaired(id);
        mutate(bad);
        expect(predicate(spec, r, startSimulation(bad))).toBe(false);
    } });
    it('bell evidence survives runtime revisions and stale solutions never accumulate', () => { const spec = MISSIONS.find(s => s.id === 'doorbell')!, c = preset('doorbell'); c.parts.find(p => p.id === 'K')!.closed = true; let sim = startSimulation(c), r = createRun('a', spec, c); for (let i = 0; i < 30; i++) {
        sim = tick(sim);
        r = sampleEvidence(spec, r, sim, .02);
    } expect(r.step).toBe(1); const stale = { ...sim, solution: { ...sim.solution, solveRevision: -1 } }; const start = createRun('a', spec, c); expect(sampleEvidence(spec, start, stale, 1).step).toBe(0); });
    it('overload cannot get a 250 ms light award before breaking at 300 ms', () => { const spec = LESSONS[2], c = preset(); c.parts[0].cells = Array.from({ length: 4 }, () => ({ polarity: 1 as const, charge01: 1, present: true })); let sim = startSimulation(c), r = createRun('a', spec, c); for (let i = 0; i < 20; i++) {
        sim = tick(sim);
        r = sampleEvidence(spec, r, sim, .02);
    } expect(r.done).toBe(false); expect(sim.circuit.parts[1].broken).toBe(true); });
    it('editing restarts stable observation but geometry does not', () => { const spec = LESSONS[2], c = preset(); let sim = startSimulation(c), r = createRun('a', spec, c); for (let i = 0; i < 10; i++)
        r = sampleEvidence(spec, r, sim, .02); sim = applyCircuit(sim, c); r = sampleEvidence(spec, r, sim, .02); expect(r.stable).toBe(.02); sim = applyCircuit(sim, c, false); r = sampleEvidence(spec, r, sim, .02); expect(r.stable).toBe(.04); });
    it('house energy matches independent daily and hourly arithmetic', () => { expect(dailyEnergy()).toBeCloseTo(7.7752, 8); expect(dailyEnergy(5)).toBeCloseTo(6.7552, 8); expect(earthHourEnergy(0, 3600)).toBeCloseTo(.4646666667, 8); expect(earthHourEnergy(0, 3600, ['lamp1', 'lamp2', 'lamp3', 'lamp4', 'tv', 'fan'])).toBeCloseTo(.0946666667, 8); });
    it.each([30, 60, 120])('energy integration at %s fps respects refrigerator boundary', fps => { let sum = 0; for (let frame = 0; frame < fps * 6; frame++)
        sum += earthHourEnergy(frame * 600 / fps, (frame + 1) * 600 / fps); expect(sum).toBeCloseTo(.4646666667, 8); });
});
