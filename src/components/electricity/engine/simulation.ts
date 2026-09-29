import { Circuit, cloneCircuit } from './circuit';
import { source } from './parts';
import { reading, Revisions, Solution, solve } from './solver';
export interface Runtime extends Revisions {
    time: number;
    visual: Record<string, {
        brightness: number;
        motorRps: number;
    }>;
    heat: Record<string, number>;
    timers: Record<string, number>;
    damage: Record<string, number>;
    bellOpen: Record<string, boolean>;
    bellPhase: Record<string, number>;
    strikes: {
        id: string;
        time: number;
    }[];
    events: {
        id: string;
        kind: string;
        time: number;
    }[];
}
export function newRuntime(): Runtime { return { editRevision: 0, runtimeRevision: 0, solveRevision: 0, time: 0, visual: {}, heat: {}, timers: {}, damage: {}, bellOpen: {}, bellPhase: {}, strikes: [], events: [] }; }
export interface Simulation {
    circuit: Circuit;
    runtime: Runtime;
    solution: Solution;
}
export function startSimulation(circuit: Circuit): Simulation { const runtime = newRuntime(); return { circuit: cloneCircuit(circuit), runtime, solution: solve(circuit, runtime, runtime) }; }
export function applyCircuit(sim: Simulation, circuit: Circuit, electrical = true): Simulation { const runtime = structuredClone(sim.runtime); if (electrical) {
    runtime.editRevision++;
    runtime.solveRevision++;
} return { circuit: cloneCircuit(circuit), runtime, solution: electrical ? solve(circuit, runtime, runtime) : sim.solution }; }
export function tick(sim: Simulation, dt = 0.02): Simulation {
    if (!sim.solution.ok || sim.solution.solveRevision !== sim.runtime.solveRevision || !Number.isFinite(dt) || dt <= 0 || dt > 0.020001)
        return sim;
    const c = cloneCircuit(sim.circuit), r = structuredClone(sim.runtime);
    r.time += dt;
    let dirty = false;
    const emit = (id: string, kind: string) => { r.events.push({ id, kind, time: r.time }); dirty = true; };
    for (const p of c.parts) {
        const { Iab: I, Uab: U, Pabsorbed: P } = reading(sim.solution, p.id);
        const before = r.visual[p.id] ?? { brightness: 0, motorRps: 0 }, target = p.broken ? 0 : p.kind === 'bulb' ? bulbBrightness(P) : p.kind === 'led' ? Math.pow(Math.max(0, Math.min(1, I / .02)), .6) : 0, motor = p.broken ? 0 : Math.sign(I) * 12 * Math.max(0, Math.min(1, (Math.abs(I) - .05) / .2));
        r.visual[p.id] = { brightness: before.brightness + (target - before.brightness) * (1 - Math.exp(-dt / .15)), motorRps: before.motorRps + (motor - before.motorRps) * (1 - Math.exp(-dt / .3)) };
        if (p.broken)
            continue;
        if (p.kind === 'bulb' || p.kind === 'led') {
            const overload = p.kind === 'bulb' ? P / 0.75 > 2.8 : I > 0.04 || U < -5;
            r.timers[p.id] = overload ? (r.timers[p.id] ?? 0) + dt : 0;
            if (r.timers[p.id] >= 0.3 - 1e-9) {
                p.broken = true;
                emit(p.id, 'broken');
            }
        }
        if (p.kind === 'fuse') {
            const ratio = Math.abs(I) / (p.rating ?? 0.5);
            r.damage[p.id] = ratio > 1 ? (r.damage[p.id] ?? 0) + dt * (ratio * ratio - 1) / 0.1 : (r.damage[p.id] ?? 0) * Math.exp(-dt / 2);
            if (r.damage[p.id] >= 1) {
                p.broken = true;
                emit(p.id, 'fused');
            }
        }
        if (p.kind === 'battery') {
            const s = source(p);
            r.heat[p.id] = (r.heat[p.id] ?? 0) + (I * I * (s?.R ?? 0) / 0.5 - (r.heat[p.id] ?? 0)) * (1 - Math.exp(-dt / 2));
            for (const cell of p.cells ?? []) {
                if (cell.present && cell.charge01 > 0 && cell.polarity * I > 0) {
                    const before = cell.charge01;
                    cell.charge01 = Math.max(0, before - Math.abs(I) * dt / 7200);
                    if (before > 0 && cell.charge01 === 0)
                        emit(p.id, 'empty');
                }
            }
        }
        if (p.kind === 'bell') {
            if (r.bellOpen[p.id]) {
                r.bellPhase[p.id] = (r.bellPhase[p.id] ?? 0) + dt;
                if (r.bellPhase[p.id] >= 0.08 - 1e-9) {
                    r.bellOpen[p.id] = false;
                    r.bellPhase[p.id] = 0;
                    emit(p.id, 'contact-close');
                }
            }
            else {
                r.bellPhase[p.id] = Math.abs(I) >= 0.08 ? (r.bellPhase[p.id] ?? 0) + dt : 0;
                if (r.bellPhase[p.id] >= 0.08 - 1e-9) {
                    r.strikes.push({ id: p.id, time: r.time });
                    r.bellOpen[p.id] = true;
                    r.bellPhase[p.id] = 0;
                    emit(p.id, 'strike');
                }
            }
        }
    }
    r.strikes = r.strikes.filter(e => r.time - e.time <= 0.5);
    r.events = r.events.slice(-100);
    if (dirty) {
        r.runtimeRevision++;
        r.solveRevision++;
    }
    return { circuit: c, runtime: r, solution: dirty ? solve(c, r, r) : sim.solution };
}
export class FixedClock {
    private previous: number | null = null;
    private remainder = 0;
    reset() { this.previous = null; this.remainder = 0; }
    advance(timestamp: number, step: () => void) { if (this.previous === null) {
        this.previous = timestamp;
        return;
    } const elapsed = (timestamp - this.previous) / 1000; this.previous = timestamp; if (elapsed < 0 || elapsed > 0.5) {
        this.remainder = 0;
        return;
    } this.remainder += Math.min(elapsed, 0.1); let n = 0; while (this.remainder >= 0.02 - 1e-9 && n < 5) {
        step();
        this.remainder -= 0.02;
        n++;
    } }
}
export function bulbBrightness(power: number) { const q = Math.max(0, power / 0.75), t = Math.max(0, Math.min(1, (q - 0.003) / 0.012)); return Math.min(1.3, q ** 0.45 * t * t * (3 - 2 * t)); }
export function driftMmPerSecond(current: number) { return Math.abs(current) / (8.5e28 * 1.602176634e-19 * 1e-6) * 1000; }
