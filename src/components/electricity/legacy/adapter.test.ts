import { it, expect } from 'vitest';
import { LEGACY_CONTENT, legacyPreset } from './adapter';
import { createRun, sampleEvidence } from '../engine/evidence';
import { startSimulation, tick } from '../engine/simulation';
import { validateCircuit } from '../engine/circuit';
it.each(LEGACY_CONTENT)('$id preserves an achievable legacy brief', spec => {
    const c = legacyPreset(spec.id);
    c.parts.forEach(p => { if (p.kind === 'button')
        p.closed = true; });
    expect(validateCircuit(c)).toEqual([]);
    let sim = startSimulation(c), run = createRun('qa', spec, c);
    for (let i = 0; i < 100 && !run.done; i++) {
        sim = tick(sim);
        run = sampleEvidence(spec, run, sim, .02);
    }
    expect(run.done).toBe(true);
    const empty = { ...c, wires: [] };
    sim = startSimulation(empty);
    run = createRun('qa', spec, empty);
    for (let i = 0; i < 50; i++) {
        sim = tick(sim);
        run = sampleEvidence(spec, run, sim, .02);
    }
    expect(run.done).toBe(false);
});
