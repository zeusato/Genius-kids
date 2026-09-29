import { describe, it, expect } from 'vitest';
import { LESSONS, MISSIONS } from '../../../data/electricity/content';
import { cloneCircuit, newPart, postIds, ref } from './circuit';
import { preset, wire } from './fixtures';
import { createRun, sampleEvidence, Run } from './evidence';
import { applyCircuit, startSimulation, tick, Simulation } from './simulation';
function fruit(count: number, bulb = false) { const c = preset('lemonLight'); c.parts[1] = newPart(bulb ? 'bulb' : 'led', 'L1', 10, 4); for (let i = 1; i < count; i++)
    c.parts.push(newPart('lemon', `B${i}`, 2 + i * 3, 6)); c.wires = []; let prev = 'B', post = 'plus'; for (let i = 1; i < count; i++) {
    c.wires.push(wire(`fruit${i}`, prev, post, `B${i}`, 'minus'));
    prev = `B${i}`;
} c.wires.push(wire('to-load', prev, 'plus', 'L1', bulb ? 'a' : 'anode'), wire('return', 'L1', bulb ? 'b' : 'cathode', 'B', 'minus')); return c; }
describe('every electrical mission and lesson is achievable using actual runtime', () => {
    it.each([...LESSONS.filter(s => !s.activity), ...MISSIONS].map(s => s.id))('%s has a complete action replay', id => {
        const spec = [...LESSONS, ...MISSIONS].find(s => s.id === id)!;
        let sim = startSimulation(preset(spec.initialCircuitId)), run = createRun('qa', spec, sim.circuit);
        const replace = (name: string) => { sim = applyCircuit(sim, preset(name)); };
        for (let index = 0; index < spec.steps.length; index++) {
            expect(run.step, `${id} before ${spec.steps[index].id}`).toBe(index);
            const step = spec.steps[index];
            const p = step.predicate;
            if (p === 'choice')
                run.choices[step.id] = step.choice!.answer;
            else if (p === 'inspect')
                run.observed = ['L1'];
            else if (p === 'contacts') {
                run.observed = ['L1'];
                run.contacts = ['L1:a', 'L1:b'];
            }
            else if (p === 'light') {
                replace('single');
            }
            else if (p === 'off') {
                const c = cloneCircuit(sim.circuit);
                c.wires.pop();
                sim = applyCircuit(sim, c);
            }
            else if (p === 'control-on') {
                replace('flashlight');
            }
            else if (p === 'control-off' || p === 'bell-stopped') {
                const c = cloneCircuit(sim.circuit);
                c.parts.filter(p => ['button', 'switch'].includes(p.kind)).forEach(p => p.closed = false);
                sim = applyCircuit(sim, c);
            }
            else if (p === 'reversed-light') {
                replace('single');
                const c = cloneCircuit(sim.circuit);
                c.parts[0].cells![0].polarity = -1;
                sim = applyCircuit(sim, c);
            }
            else if (p === 'schematic-light') {
                replace('single');
                run.view = 'schematic';
            }
            else if (p === 'schematic-control') {
                replace('flashlight');
                run.view = 'schematic';
            }
            else if (p === 'schematic-bell' || p === 'button-bell') {
                replace('doorbell');
                const c = cloneCircuit(sim.circuit);
                c.parts.find(p => p.id === 'K')!.closed = true;
                sim = applyCircuit(sim, c);
                run.view = 'schematic';
            }
            else if (p === 'one-cell') {
                replace('single');
            }
            else if (p === 'more-power') {
                const c = cloneCircuit(sim.circuit);
                c.parts[0].cells!.push({ polarity: 1, charge01: 1, present: true });
                sim = applyCircuit(sim, c);
            }
            else if (p === 'opposed') {
                const c = cloneCircuit(sim.circuit);
                c.parts[0].cells![1].polarity = -1;
                sim = applyCircuit(sim, c);
            }
            else if (p === 'series' || p === 'parallel') {
                replace(p);
            }
            else if (p === 'series-loose' || p === 'parallel-loose') {
                const c = cloneCircuit(sim.circuit);
                c.parts[1].loose = true;
                sim = applyCircuit(sim, c);
            }
            else if (p === 'safe-led') {
                replace('lantern');
            }
            else if (p === 'motor') {
                replace('candleFan');
            }
            else if (p === 'bright-parallel') {
                replace('parallel');
            }
            else if (p === 'one-lemon')
                sim = applyCircuit(sim, fruit(1));
            else if (p === 'lemon-led')
                sim = applyCircuit(sim, fruit(3));
            else if (p === 'lemon-bulb')
                sim = applyCircuit(sim, fruit(3, true));
            else if (p === 'three-series')
                replace('tetLights');
            else if (p === 'three-parallel') {
                replace('tetLights');
                const c = cloneCircuit(sim.circuit);
                c.wires = [];
                for (let n = 1; n <= 3; n++)
                    c.wires.push(wire(`a${n}`, 'B', 'plus', `L${n}`, 'a'), wire(`b${n}`, `L${n}`, 'b', 'B', 'minus'));
                sim = applyCircuit(sim, c);
            }
            else if (p === 'three-loose') {
                const c = cloneCircuit(sim.circuit);
                c.parts[1].loose = true;
                sim = applyCircuit(sim, c);
            }
            else if (p.startsWith('independent-')) {
                replace('smartRoom');
                const c = cloneCircuit(sim.circuit), states = p.slice(-2);
                c.parts.find(p => p.id === 'K1')!.closed = states[0] === '1';
                c.parts.find(p => p.id === 'K2')!.closed = states[1] === '1';
                sim = applyCircuit(sim, c);
            }
            else if (p.startsWith('traffic-')) {
                replace('trafficLight');
                const c = cloneCircuit(sim.circuit), color = p.slice(8), n = color === 'red' ? 1 : color === 'green' ? 2 : 3;
                for (let i = 1; i <= 3; i++)
                    c.parts.find(p => p.id === `K${i}`)!.closed = i === n;
                sim = applyCircuit(sim, c);
            }
            else if (p.startsWith('stairs-')) {
                replace('stairs');
                const c = cloneCircuit(sim.circuit), states = p.slice(-2);
                c.parts.find(p => p.id === 'K1')!.position = Number(states[0]) as 0 | 1;
                c.parts.find(p => p.id === 'K2')!.position = Number(states[1]) as 0 | 1;
                sim = applyCircuit(sim, c);
            }
            else if (p === 'door-on' || p === 'door-off') {
                const c = cloneCircuit(sim.circuit);
                c.parts.find(p => p.id === 'K1')!.doorClosed = p === 'door-off';
                sim = applyCircuit(sim, c);
            }
            else if (p === 'fuse-open') {
                const c = cloneCircuit(sim.circuit);
                c.wires.push(wire('fault', 'L1', 'a', 'L1', 'b'));
                sim = applyCircuit(sim, c);
            }
            else if (p === 'fuse-repaired') {
                const c = cloneCircuit(sim.circuit);
                c.wires = c.wires.filter(w => w.id !== 'fault');
                c.parts.find(p => p.id === 'F')!.broken = false;
                sim.runtime.damage.F = 0;
                sim = applyCircuit(sim, c);
            }
            for (let i = 0; i < 200 && run.step === index; i++) {
                sim = tick(sim);
                run = sampleEvidence(spec, run, sim, .02);
            }
            expect(run.step, `${id}: ${p} did not complete`).toBe(index + 1);
        }
        expect(run.done).toBe(true);
    });
});
