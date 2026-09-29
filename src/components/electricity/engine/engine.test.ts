import { describe, it, expect } from 'vitest';
import { preset, wire } from './fixtures';
import { cloneCircuit, newPart, validateCircuit, displayPoint, boardPoint } from './circuit';
import { solve, reading, solveNetlist } from './solver';
import { compile } from './parts';
import { analyze, controls, topology } from './analysis';
import { startSimulation, tick, FixedClock } from './simulation';
import { command } from '../controller/commands';
const near = (actual: number, expected: number) => expect(Math.abs(actual - expected)).toBeLessThanOrEqual(Math.max(1e-8, 1e-6 * Math.abs(expected)));
describe('production DC oracle', () => {
    it.each([1, 2, 3, 4])('%s cells obey independent Ohm calculation', n => { const c = preset(); c.parts[0].cells = Array.from({ length: n }, () => ({ polarity: 1 as const, charge01: 1, present: true })); const s = solve(c); expect(s.ok).toBe(true); const i = 1.5 * n / (0.2 * n + 0.04 + 25 / 3); near(reading(s, 'L1').Iab, i); near(reading(s, 'L1').Pabsorbed, i * i * 25 / 3); expect(reading(s, 'B').Pabsorbed).toBeLessThan(0); });
    it.each(['series', 'parallel'])('%s uses real per-wire resistance', name => { const c = preset(name), s = solve(c), i = name === 'series' ? 1.5 / (0.2 + 0.06 + 50 / 3) : 1.5 / (0.4 + 0.04 + 25 / 3); near(reading(s, 'L1').Iab, i); near(reading(s, 'L2').Iab, i); expect(topology(c)).toBe(name); });
    it('opposed sources and disconnected islands have no ghost flow', () => { const c = preset('opposedCells'); near(reading(solve(c), 'L1').Iab, 0); const x = preset(); x.wires = []; const s = solve(x); near(reading(s, 'L1').Iab, 0); expect(s.ok && new Set([...s.nodes.values()].map(v => v.islandId)).size).toBe(2); });
    it('retains signed current and does not mutate inputs', () => { const c = preset(), before = JSON.stringify(c); c.wires[0] = { ...c.wires[0], a: c.wires[0].b, b: c.wires[0].a }; const s = solve(c); expect(reading(s, 'w0').Iab).toBeLessThan(0); expect(JSON.stringify(preset())).toBe(before); const frozen = JSON.stringify(c); solve(c); expect(JSON.stringify(c)).toBe(frozen); });
    it('LED is piecewise, signed, and independent of initial active set', () => { const c = preset('lantern'), net = compile(c); const expected = (3 - 1.8) / (0.4 + 0.08 + 0.02 + 100 + 15); for (const initialLedMask of [0, 1]) {
        const s = solveNetlist(net, undefined, { initialLedMask });
        expect(s.ok).toBe(true);
        expect(Math.abs(reading(s, 'L1').Iab - expected)).toBeLessThan(1e-7);
    } expect(reading(solve(preset('reversedLed')), 'L1').Iab).toBeLessThan(0); });
    it('deterministic fallback is tested separately from normal convergence', () => { const net = compile(preset('lantern')); const s = solveNetlist(net, undefined, { maxIterations: 0 }); expect(s.ok && s.diagnostics.fallbackUsed).toBe(true); expect(solveNetlist(net, undefined, { maxIterations: 0, maxFallback: 0 }).ok).toBe(false); });
    it('balanced bridge middle branch is dark despite connected endpoints', () => { const branches = [{ id: 'B', partId: 'B', a: '0', b: '1', R: .2, E: 1.5, kind: 'battery' as const }, ...([['a', '1', '2'], ['b', '2', '0'], ['c', '1', '3'], ['d', '3', '0'], ['middle', '2', '3']]).map(([id, a, b]) => ({ id, partId: id, a, b, R: 100, kind: 'resistor' as const }))]; const s = solveNetlist({ nodes: ['0', '1', '2', '3'], branches }); near(reading(s, 'middle').Iab, 0); });
    it('conserves power and ordering across independent powered islands', () => { const a = compile(preset()), b = compile(preset('parallel')); const net = { nodes: [...a.nodes, ...b.nodes.map(n => 'x' + n)], branches: [...a.branches, ...b.branches.map(v => ({ ...v, id: 'x' + v.id, a: 'x' + v.a, b: 'x' + v.b }))] }; const s = solveNetlist(net), reverse = solveNetlist({ nodes: [...net.nodes].reverse(), branches: [...net.branches].reverse() }); expect(s.ok).toBe(true); if (s.ok) {
        near([...s.branches.values()].reduce((t, r) => t + r.Pabsorbed, 0), 0);
        for (const [id, r] of s.branches)
            near(reading(reverse, id).Iab, r.Iab);
    } });
    it('meters load the circuit and preserve probe sign', () => { const c = preset(); c.parts.push(newPart('voltmeter', 'V', 7, 6)); c.wires.push(wire('va', 'V', 'a', 'B', 'plus'), wire('vb', 'V', 'b', 'B', 'minus')); const s = solve(c); expect(reading(s, 'V').Uab).toBeGreaterThan(1.4); expect(reading(s, 'V').Iab).toBeLessThan(1e-6); c.parts.find(p => p.id === 'V')!.kind = 'ammeter'; expect(analyze(c, solve(c)).shortPaths.length).toBe(1); });
    it('bypass switch cannot earn control evidence', () => { const c = preset('flashlight'); expect(controls(c, 'K', 'L1')).toBe(true); c.wires.push(wire('bypass', 'K', 'a', 'K', 'b')); expect(controls(c, 'K', 'L1')).toBe(false); });
    it('SPDT controls at both ends in all four combinations', () => { const c = preset('stairs'); for (const a of [0, 1] as const)
        for (const b of [0, 1] as const) {
            c.parts.find(p => p.id === 'K1')!.position = a;
            c.parts.find(p => p.id === 'K2')!.position = b;
            expect(reading(solve(c), 'L1').Pabsorbed > 0.03).toBe(a === b);
            expect(controls(c, 'K1', 'L1')).toBe(true);
            expect(controls(c, 'K2', 'L1')).toBe(true);
        } });
    it('rejects invalid netlist, NaN, duplicates and absent endpoints', () => { const net = compile(preset()); for (const bad of [{ ...net, branches: [{ ...net.branches[0], R: NaN }] }, { ...net, nodes: ['same', 'same'] }, { ...net, branches: [{ ...net.branches[0], b: 'missing' }] }])
        expect(solveNetlist(bad).ok).toBe(false); });
    it('editor rejects reverse duplicate wires while raw solver permits parallel branches', () => { const c = preset(); c.wires.push({ ...c.wires[0], id: 'duplicate', a: c.wires[0].b, b: c.wires[0].a }); expect(validateCircuit(c).length).toBeGreaterThan(0); expect(solve(c).ok).toBe(true); });
    it('portrait transforms never touch model', () => { const c = preset('parallel'), before = JSON.stringify(c); for (const p of c.parts)
        expect(boardPoint(...displayPoint(p.x, p.z, true), true)).toEqual([p.x, p.z]); expect(JSON.stringify(c)).toBe(before); });
});
describe('fixed electrical runtime', () => {
    it('broken bulb opens electrical branch after 300 ms', () => { const c = preset(); c.parts[0].cells = Array.from({ length: 4 }, () => ({ polarity: 1 as const, charge01: 1, present: true })); let sim = startSimulation(c); for (let i = 0; i < 15; i++)
        sim = tick(sim); expect(sim.circuit.parts[1].broken).toBe(true); near(reading(sim.solution, 'B').Iab, 0); });
    it('fuse cuts fault current and replacement is a command', () => { const c = preset('fuseRescue'); c.wires.push(wire('fault', 'L1', 'a', 'L1', 'b')); let sim = startSimulation(c); for (let i = 0; i < 10; i++)
        sim = tick(sim); expect(sim.circuit.parts.find(p => p.id === 'F')!.broken).toBe(true); near(reading(sim.solution, 'B').Iab, 0); expect(command(sim, { type: 'repair', id: 'F' }).ok).toBe(true); });
    it('exhausted cell changes source immediately', () => { const c = preset(); c.parts[0].cells![0].charge01 = 1e-10; const sim = tick(startSimulation(c)); expect(sim.circuit.parts[0].cells![0].charge01).toBe(0); near(reading(sim.solution, 'B').Iab, 0); });
    it('bell has real contact oscillation and stops on open circuit', () => { const c = preset('doorbell'); c.parts.find(p => p.id === 'K')!.closed = true; let sim = startSimulation(c); for (let i = 0; i < 25; i++)
        sim = tick(sim); expect(sim.runtime.strikes.length).toBeGreaterThan(1); expect(sim.runtime.solveRevision).toBeGreaterThan(1); const result = command(sim, { type: 'patch', id: 'K', patch: { closed: false } }); if (result.ok)
        sim = result.sim; for (let i = 0; i < 30; i++)
        sim = tick(sim); expect(sim.runtime.strikes).toHaveLength(0); });
    it.each([30, 60, 120])('same clock at %s fps and no background backlog', fps => { const clock = new FixedClock(); let steps = 0; for (let i = 0; i <= fps * 2; i++)
        clock.advance(i * 1000 / fps, () => steps++); expect(steps).toBe(100); clock.advance(90000, () => steps++); expect(steps).toBe(100); });
});
