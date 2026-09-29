import { expect, it } from 'vitest';
import { preset } from './fixtures';
import { validateCircuit } from './circuit';
import { compile } from './parts';
import { solveNetlist } from './solver';
import { startSimulation, tick } from './simulation';
it('defers expensive enumeration and never returns an old valid solution', () => { const result = solveNetlist(compile(preset('lantern')), { editRevision: 4, runtimeRevision: 8, solveRevision: 12 }, { maxIterations: 0, budgetMs: -1 }); expect(result.ok).toBe(false); expect('deferred' in result && result.deferred).toBe(true); expect(result.solveRevision).toBe(12); expect(solveNetlist(compile(preset('lantern')), undefined, { maxIterations: 0, budgetMs: Infinity }).ok).toBe(true); });
it('rejects malformed records without crashing and forbids special object keys', () => { for (const value of [null, { ...preset(), parts: [null] }, { ...preset(), parts: [{ ...preset().parts[0], id: '__proto__' }] }, { ...preset(), wires: [{ id: 15 }] }])
    expect(validateCircuit(value).length).toBeGreaterThan(0); });
it('motor inertia respects signed current and lamp warming cannot change electrical power', () => { const c = preset('candleFan'); let sim = startSimulation(c); const power = sim.solution.ok && sim.solution.branches.get('L1')!.Pabsorbed; for (let i = 0; i < 50; i++)
    sim = tick(sim); expect(sim.runtime.visual.L1.motorRps).toBeGreaterThan(0); expect(sim.solution.ok && sim.solution.branches.get('L1')!.Pabsorbed).toBe(power); c.parts[0].cells!.forEach(cell => cell.polarity = -1); sim = startSimulation(c); for (let i = 0; i < 50; i++)
    sim = tick(sim); expect(sim.runtime.visual.L1.motorRps).toBeLessThan(0); });
