import { ContentSpec } from '../../../data/electricity/content';
import { HAZARDS, POWER_OBJECTS, SAMPLES } from '../../../data/electricity/labs';
import { analyze, controls, loadKinds, powered, topology } from './analysis';
import { Circuit, cloneCircuit } from './circuit';
import { reading } from './solver';
import { Simulation } from './simulation';
export interface Milestone {
    id: string;
    editRevision: number;
    solveRevision: number;
    time: number;
    circuit: Circuit;
    power: Record<string, number>;
}
export interface Run {
    id: string;
    ownerId: string;
    contentId: string;
    step: number;
    stable: number;
    windowEdit: number;
    milestones: Milestone[];
    observed: string[];
    contacts: string[];
    choices: Record<string, number>;
    activity: Record<string, unknown>;
    view: 'bench' | 'schematic';
    done: boolean;
    initial: Circuit;
}
export function createRun(ownerId: string, spec: ContentSpec, c: Circuit): Run { return { id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`, ownerId, contentId: spec.id, step: 0, stable: 0, windowEdit: -1, milestones: [], observed: [], contacts: [], choices: {}, activity: {}, view: 'bench', done: false, initial: cloneCircuit(c) }; }
const switched = (c: Circuit) => c.parts.filter(p => ['switch', 'button', 'spdt'].includes(p.kind));
function activityPass(spec: ContentSpec, r: Run) {
    if (spec.activity === 'sorting') {
        const answers = r.activity.sort as Record<string, string> | undefined;
        return POWER_OBJECTS.every(([name, group]) => answers?.[name] === group);
    }
    if (spec.activity === 'safety') {
        const safe = r.activity.safe as string[] | undefined;
        return HAZARDS.slice(0, 5).every(h => safe?.includes(h.id));
    }
    if (spec.activity === 'conductors') {
        const tested = r.activity.tested as string[] | undefined, classified = r.activity.classified as Record<string, boolean> | undefined;
        return SAMPLES.filter(s => s.core).every(s => tested?.includes(s.id) && classified?.[s.id] === (s.resistance !== null));
    }
    if (spec.activity === 'house') {
        const off = r.activity.off as string[] | undefined;
        return ['lamp1', 'lamp2', 'lamp3', 'lamp4', 'tv', 'fan'].every(id => off?.includes(id)) && !off?.includes('lamp0') && !off?.includes('fridge') && r.activity.ledCount === 5 && r.activity.houseReason === true;
    }
    if (spec.activity === 'journey')
        return r.activity.sequence === 'source,transmission,distribution,house' && r.activity.matched === 4 && r.activity.night === true && ['storage', 'hydro', 'wind', 'thermal'].includes(String(r.activity.backup));
    return false;
}
function observedFault(spec: ContentSpec, r: Run) { const target: Record<string, string[]> = { missingWire: ['w0', 'w1', 'B', 'L1'], looseBulb: ['L1'], openSwitch: ['K'], reversedLed: ['L1', 'B'], brokenFilament: ['L1'], emptyBattery: ['B'], hiddenWireBreak: ['w0'], brokenSwitch: ['K'], shortedLoad: ['short'], blownFuse: ['F'], insulatedClip: ['X'], opposedCells: ['B'] }; const ids = target[spec.id] ?? []; return ids.every(id => r.observed.includes(id)) || (spec.id === 'missingWire' && r.observed.includes('L1')); }
export function predicate(spec: ContentSpec, run: Run, sim: Simulation): boolean {
    const step = spec.steps[run.step];
    if (!step)
        return false;
    if (step.predicate === 'choice')
        return run.choices[step.id] === step.choice?.answer;
    if (step.predicate === 'activity')
        return activityPass(spec, run);
    if (step.predicate === 'inspect')
        return run.observed.length > 0;
    if (step.predicate === 'contacts')
        return run.contacts.includes('L1:a') && run.contacts.includes('L1:b') && run.observed.includes('L1');
    if (step.predicate === 'fault-observe')
        return observedFault(spec, run);
    const { circuit: c, solution: s, runtime: rt } = sim;
    if (!s.ok || s.solveRevision !== rt.solveRevision)
        return false;
    const analysis = analyze(c, s, rt.strikes, rt.time), on = (id: string) => powered(c, s, id, rt.strikes, rt.time), off = (id: string) => { const p = c.parts.find(p => p.id === id); return p?.kind === 'bulb' ? reading(s, id).Pabsorbed / 0.75 < .005 : p?.kind === 'bell' ? !rt.strikes.some(e => e.id === id && e.time > (run.milestones.at(-1)?.time ?? 0)) : Math.abs(reading(s, id).Iab) < 1e-7; };
    const loads = c.parts.filter(p => loadKinds.includes(p.kind)), bulbs = c.parts.filter(p => p.kind === 'bulb'), cells = c.parts.filter(p => p.kind === 'battery').flatMap(p => p.cells ?? []), healthy = analysis.healthy && !Object.values(rt.heat).some(h => h >= 1);
    const hasControl = (id: string) => switched(c).some(k => controls(c, k.id, id));
    const prev = run.milestones.find(m => ['one-cell', 'baseline'].includes(m.id));
    if (step.predicate.startsWith('legacy-')) {
        const code = step.predicate.slice(7), all = (kind: string) => loads.filter(p => p.kind === kind), works = (kind: string) => all(kind).some(p => on(p.id)), controlled = (kind: string) => all(kind).some(p => on(p.id) && hasControl(p.id));
        if (!healthy)
            return false;
        switch (code) {
            case 'e1': return works('bulb');
            case 'e2': return controlled('bulb');
            case 'e3': return controlled('bell');
            case 'e4': return works('buzzer');
            case 'e5': return works('motor');
            case 'm1': return bulbs.length === 2 && topology(c) === 'series' && bulbs.every(p => on(p.id) && hasControl(p.id));
            case 'm2': return bulbs.length === 2 && topology(c) === 'parallel' && bulbs.every(p => on(p.id));
            case 'm3':
            case 'm4': return controlled('motor');
            case 'm5': return works('bulb') && works('bell');
            case 'm6': return bulbs.length === 3 && topology(c) === 'series' && bulbs.every(p => Math.abs(reading(s, p.id).Iab) > 1e-7);
            case 'h1':
            case 'h3': return loads.length === 2 && loads.every(p => on(p.id)) && switched(c).filter(k => controls(c, k.id, loads[0].id) && !controls(c, k.id, loads[1].id)).length > 0 && switched(c).filter(k => controls(c, k.id, loads[1].id) && !controls(c, k.id, loads[0].id)).length > 0;
            case 'h2': return controlled('bell') && controlled('buzzer');
            case 'h4': return works('bulb') && works('motor') && works('bell') && switched(c).some(k => loads.every(p => controls(c, k.id, p.id)));
        }
    }
    switch (step.predicate) {
        case 'light': return on('L1') && healthy;
        case 'off': return off('L1');
        case 'control-on': return on('L1') && healthy && hasControl('L1');
        case 'control-off': return loads.length > 0 && loads.every(l => off(l.id)) && loads.every(l => hasControl(l.id));
        case 'reversed-light': return cells.length === 1 && cells[0].polarity === -1 && on('L1') && healthy && reading(s, 'L1').Iab < 0;
        case 'schematic-light': return run.view === 'schematic' && on('L1') && healthy;
        case 'schematic-control': return run.view === 'schematic' && on('L1') && healthy && hasControl('L1');
        case 'schematic-bell': return run.view === 'schematic' && loads.some(l => l.kind === 'bell' && on(l.id) && c.parts.some(k => k.kind === 'button' && controls(c, k.id, l.id))) && healthy;
        case 'one-cell': return cells.length === 1 && cells[0].polarity === 1 && bulbs.length === 1 && on('L1') && healthy;
        case 'more-power': return cells.length === 2 && cells.every(v => v.polarity === 1 && v.present) && !!prev && reading(s, 'L1').Pabsorbed > prev.power.L1 && healthy && sameExceptBattery(prev.circuit, c);
        case 'opposed': return cells.length === 2 && cells[0].polarity !== cells[1].polarity && off('L1') && !!prev && sameExceptBattery(prev.circuit, c);
        case 'series': return bulbs.length === 2 && topology(c) === 'series' && bulbs.every(l => on(l.id)) && healthy && reading(s, bulbs[0].id).Pabsorbed < (prev?.power.L1 ?? 0.2551);
        case 'parallel': return bulbs.length === 2 && topology(c) === 'parallel' && bulbs.every(l => on(l.id)) && healthy;
        case 'series-loose': return !!c.parts.find(p => p.id === 'L1')?.loose && bulbs.length === 2 && bulbs.every(l => off(l.id)) && run.milestones.some(m => m.id === 'series');
        case 'parallel-loose': return !!c.parts.find(p => p.id === 'L1')?.loose && off('L1') && on('L2') && run.milestones.some(m => m.id === 'parallel');
        case 'button-bell': return c.parts.some(k => k.kind === 'button' && k.closed && controls(c, k.id, 'L1')) && on('L1') && healthy;
        case 'bell-stopped': return c.parts.some(k => k.kind === 'button' && !k.closed) && off('L1') && hasControl('L1');
        case 'safe-led': return loads.some(l => l.kind === 'led' && reading(s, l.id).Iab >= .0005 && reading(s, l.id).Iab <= .02 && hasControl(l.id)) && healthy;
        case 'motor': return loads.some(l => l.kind === 'motor' && on(l.id) && hasControl(l.id)) && healthy;
        case 'bright-parallel': return bulbs.length === 2 && topology(c) === 'parallel' && bulbs.every(l => reading(s, l.id).Pabsorbed / .75 >= .25) && healthy;
        case 'one-lemon': return c.parts.filter(p => p.kind === 'lemon').length === 1 && !c.parts.some(p => ['battery', 'generator'].includes(p.kind)) && loads.some(l => l.kind === 'led' && reading(s, l.id).Iab < .0005) && c.wires.length >= 2;
        case 'lemon-led': return c.parts.filter(p => p.kind === 'lemon').length >= 3 && !c.parts.some(p => ['battery', 'generator'].includes(p.kind)) && loads.some(l => l.kind === 'led' && reading(s, l.id).Iab >= .0005 && reading(s, l.id).Iab <= .02) && healthy;
        case 'lemon-bulb': return c.parts.filter(p => p.kind === 'lemon').length >= 3 && bulbs.length === 1 && reading(s, bulbs[0].id).Iab > 1e-7 && reading(s, bulbs[0].id).Pabsorbed / .75 < .005;
        case 'three-series': return bulbs.length === 3 && topology(c) === 'series' && bulbs.every(l => reading(s, l.id).Iab > 0) && healthy;
        case 'three-parallel': return bulbs.length === 3 && topology(c) === 'parallel' && bulbs.every(l => on(l.id)) && healthy;
        case 'three-loose': return bulbs.length === 3 && !!bulbs.find(p => p.id === 'L1')?.loose && on('L2') && on('L3');
        case 'door-on': return c.parts.some(p => p.actuator === 'doorContact' && !p.doorClosed) && on('L1') && on('L2') && healthy;
        case 'door-off': return c.parts.some(p => p.actuator === 'doorContact' && p.doorClosed) && off('L1') && off('L2');
        case 'fuse-normal': return c.parts.some(p => p.kind === 'fuse' && !p.broken) && on('L1') && healthy;
        case 'fuse-open': return !!c.parts.find(p => p.id === 'F')?.broken && rt.events.some(e => e.id === 'F' && e.kind === 'fused') && Math.abs(reading(s, 'B').Iab) < 1e-7;
        case 'fuse-repaired': return !!c.parts.find(p => p.id === 'F') && !c.parts.find(p => p.id === 'F')?.broken && on('L1') && healthy && !c.wires.some(w => w.id === 'fault');
        case 'fault-repaired': {
            const sameParts = run.initial.parts.every(o => c.parts.some(p => o.id === p.id && o.kind === p.kind)) && c.parts.every(p => run.initial.parts.some(o => o.id === p.id) || ['ammeter', 'voltmeter'].includes(p.kind));
            return sameParts && observedFault(spec, run) && on('L1') && healthy && (spec.id !== 'reversedLed' || reading(s, 'L1').Iab <= .02);
        }
    }
    if (step.predicate.startsWith('independent-')) {
        const state = step.predicate.slice(-2);
        return healthy && on('L1') === (state[0] === '1') && on('L2') === (state[1] === '1') && controls(c, 'K1', 'L1') && !controls(c, 'K1', 'L2') && controls(c, 'K2', 'L2') && !controls(c, 'K2', 'L1');
    }
    if (step.predicate.startsWith('stairs-')) {
        const state = step.predicate.slice(-2);
        return (c.parts.find(p => p.id === 'K1')?.position ?? 0) === (Number(state[0]) as 0 | 1) && (c.parts.find(p => p.id === 'K2')?.position ?? 0) === (Number(state[1]) as 0 | 1) && controls(c, 'K1', 'L1') && controls(c, 'K2', 'L1') && healthy;
    }
    if (step.predicate.startsWith('traffic-')) {
        const color = step.predicate.slice(8);
        return loads.filter(p => p.kind === 'led').length === 3 && loads.every(l => l.color === color ? reading(s, l.id).Iab >= .0005 && reading(s, l.id).Iab <= .02 : off(l.id)) && healthy;
    }
    return false;
}
function sameExceptBattery(a: Circuit, b: Circuit) { const strip = (c: Circuit) => JSON.stringify({ parts: c.parts.map(p => ({ ...p, x: 0, z: 0, rot: 0, cells: undefined })), wires: c.wires }); return strip(a) === strip(b); }
export function sampleEvidence(spec: ContentSpec, run: Run, sim: Simulation, dt: number): Run {
    if (run.done)
        return run;
    let stable = run.windowEdit === sim.runtime.editRevision ? run.stable : 0;
    if (!predicate(spec, run, sim))
        return { ...run, stable: 0, windowEdit: sim.runtime.editRevision };
    stable += dt;
    const step = spec.steps[run.step];
    if (stable + 1e-9 < (step.duration ?? .25))
        return { ...run, stable, windowEdit: sim.runtime.editRevision };
    const milestone: Milestone = { id: step.id, editRevision: sim.runtime.editRevision, solveRevision: sim.runtime.solveRevision, time: sim.runtime.time, circuit: cloneCircuit(sim.circuit), power: Object.fromEntries(sim.circuit.parts.map(p => [p.id, reading(sim.solution, p.id).Pabsorbed])) };
    return { ...run, stable: 0, windowEdit: -1, step: run.step + 1, milestones: [...run.milestones, milestone], done: run.step + 1 === spec.steps.length };
}
export function earnedTier(spec: ContentSpec, r: Run): 0 | 1 | 2 | 3 {
    if (!r.milestones.length)
        return 0;
    if (spec.kind !== 'mission')
        return r.done ? 1 : 0;
    if (!r.done)
        return 1;
    const c = r.milestones[0].circuit, cells = c.parts.filter(p => p.kind === 'battery').flatMap(p => p.cells ?? []).length;
    const perfect = spec.id === 'flashlight' ? cells === 1 && c.parts.length === 3 : spec.id === 'batterySaver' ? cells === 1 : spec.id === 'lantern' ? cells === 2 : spec.id === 'smartRoom' ? switched(c).length === 2 : spec.id === 'candleFan' ? cells <= 2 : spec.id === 'stairs' ? c.parts.filter(p => p.kind === 'spdt').length === 2 : spec.id === 'trafficLight' ? c.parts.filter(p => p.kind === 'resistor' && p.resistance === 220).length === 3 : true;
    return perfect ? 3 : 2;
}
