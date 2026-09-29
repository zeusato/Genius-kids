import { Circuit, validateCircuit } from './circuit';
import { Branch, compile, ElectricalRuntime, MODEL, Netlist } from './parts';
export interface Revisions {
    editRevision: number;
    runtimeRevision: number;
    solveRevision: number;
}
export interface Reading {
    Uab: number;
    Iab: number;
    Pabsorbed: number;
}
export type Solution = ({
    ok: true;
    modelVersion: 1;
    nodes: Map<string, {
        volts: number;
        islandId: string;
    }>;
    branches: Map<string, Reading>;
    sourceHeatW: Map<string, number>;
    diagnostics: {
        iterations: number;
        residualA: number;
        fallbackUsed: boolean;
    };
} | {
    ok: false;
    reason: 'invalid-netlist' | 'limit-exceeded' | 'singular' | 'nonconvergent';
    affectedIds: string[];
    deferred?: boolean;
}) & Revisions;
const ZERO: Revisions = { editRevision: 0, runtimeRevision: 0, solveRevision: 0 };
function gaussian(a: Float64Array[], rhs: Float64Array): Float64Array | null {
    const n = rhs.length;
    for (let i = 0; i < n; i++) {
        const scale = Math.max(...a[i].map(Math.abs));
        if (!scale)
            return null;
        for (let j = 0; j < n; j++)
            a[i][j] /= scale;
        rhs[i] /= scale;
    }
    for (let k = 0; k < n; k++) {
        let pivot = k;
        for (let i = k + 1; i < n; i++)
            if (Math.abs(a[i][k]) > Math.abs(a[pivot][k]))
                pivot = i;
        if (Math.abs(a[pivot][k]) < 1e-14)
            return null;
        [a[k], a[pivot]] = [a[pivot], a[k]];
        [rhs[k], rhs[pivot]] = [rhs[pivot], rhs[k]];
        for (let i = k + 1; i < n; i++) {
            const f = a[i][k] / a[k][k];
            for (let j = k; j < n; j++)
                a[i][j] -= f * a[k][j];
            rhs[i] -= f * rhs[k];
        }
    }
    const x = new Float64Array(n);
    for (let i = n - 1; i >= 0; i--) {
        let v = rhs[i];
        for (let j = i + 1; j < n; j++)
            v -= a[i][j] * x[j];
        x[i] = v / a[i][i];
        if (!Number.isFinite(x[i]))
            return null;
    }
    return x;
}
export function solveNetlist(net: Netlist, rev: Revisions = ZERO, options: {
    maxIterations?: number;
    maxFallback?: number;
    initialLedMask?: number;
    budgetMs?: number;
} = {}): Solution {
    const fail = (reason: 'invalid-netlist' | 'limit-exceeded' | 'singular' | 'nonconvergent'): Solution => ({ ok: false, reason, affectedIds: net.branches.map(b => b.id), ...rev });
    const deadline = performance.now() + (options.budgetMs ?? (typeof document === 'undefined' ? Infinity : 4));
    const deferred = (): Solution => ({ ok: false, reason: 'nonconvergent', affectedIds: net.branches.map(b => b.id), ...rev, deferred: true });
    const nodes = [...net.nodes].sort(), nodeSet = new Set(nodes), ids = new Set<string>(), leds = net.branches.filter(b => b.vf !== undefined);
    if (nodes.length > 192 || net.branches.length > 320 || leds.length > 8)
        return fail('limit-exceeded');
    if (nodeSet.size !== nodes.length || net.branches.some(b => { const bad = ids.has(b.id) || !nodeSet.has(b.a) || !nodeSet.has(b.b) || b.a === b.b || !Number.isFinite(b.R) || b.R <= 0 || (b.E !== undefined && !Number.isFinite(b.E)) || (b.vf !== undefined && (!Number.isFinite(b.vf) || b.vf <= 0)); ids.add(b.id); return bad; }))
        return fail('invalid-netlist');
    const adjacent = new Map(nodes.map(n => [n, [] as string[]]));
    for (const b of net.branches) {
        adjacent.get(b.a)!.push(b.b);
        adjacent.get(b.b)!.push(b.a);
    }
    const islands: string[][] = [], visited = new Set<string>();
    for (const n of nodes) {
        if (visited.has(n))
            continue;
        const island: string[] = [], q = [n];
        visited.add(n);
        while (q.length) {
            const v = q.pop()!;
            island.push(v);
            for (const x of adjacent.get(v)!)
                if (!visited.has(x)) {
                    visited.add(x);
                    q.push(x);
                }
        }
        islands.push(island.sort());
    }
    const attempt = (mask: number): {
        voltages: Map<string, {
            volts: number;
            islandId: string;
        }>;
        readings: Map<string, Reading>;
        residual: number;
        valid: boolean;
    } | null => {
        const voltages = new Map<string, {
            volts: number;
            islandId: string;
        }>();
        for (const island of islands) {
            const ground = island[0], vars = island.slice(1), index = new Map(vars.map((n, i) => [n, i])), members = new Set(island), matrix = vars.map(() => new Float64Array(vars.length)), rhs = new Float64Array(vars.length);
            for (const b of net.branches) {
                if (!members.has(b.a))
                    continue;
                const li = leds.indexOf(b), on = li >= 0 && !!(mask & (1 << li));
                const g = li >= 0 ? MODEL.ledOffG + (on ? 1 / b.R : 0) : 1 / b.R;
                const j = li >= 0 ? (on ? -b.vf! / b.R : 0) : (b.E ?? 0) / b.R;
                const a = index.get(b.a), z = index.get(b.b);
                if (a !== undefined) {
                    matrix[a][a] += g;
                    rhs[a] -= j;
                }
                if (z !== undefined) {
                    matrix[z][z] += g;
                    rhs[z] += j;
                }
                if (a !== undefined && z !== undefined) {
                    matrix[a][z] -= g;
                    matrix[z][a] -= g;
                }
            }
            const solved = vars.length ? gaussian(matrix, rhs) : new Float64Array();
            if (!solved)
                return null;
            voltages.set(ground, { volts: 0, islandId: ground });
            vars.forEach((n, i) => voltages.set(n, { volts: solved[i], islandId: ground }));
        }
        const readings = new Map<string, Reading>(), kcl = new Map(nodes.map(n => [n, { sum: 0, scale: 0 }]));
        let valid = true, residual = 0;
        for (const b of net.branches) {
            const Uab = voltages.get(b.a)!.volts - voltages.get(b.b)!.volts, li = leds.indexOf(b);
            if (li >= 0) {
                const on = !!(mask & (1 << li));
                if (on ? Uab < b.vf! - 1e-7 : Uab > b.vf! + 1e-7)
                    valid = false;
            }
            const Iab = li >= 0 ? MODEL.ledOffG * Uab + Math.max(0, (Uab - b.vf!) / b.R) : (Uab + (b.E ?? 0)) / b.R;
            const Pabsorbed = Uab * Iab;
            if (![Uab, Iab, Pabsorbed].every(Number.isFinite))
                return null;
            readings.set(b.id, { Uab, Iab, Pabsorbed });
            kcl.get(b.a)!.sum += Iab;
            kcl.get(b.b)!.sum -= Iab;
            kcl.get(b.a)!.scale += Math.abs(Iab);
            kcl.get(b.b)!.scale += Math.abs(Iab);
        }
        for (const v of kcl.values()) {
            residual = Math.max(residual, Math.abs(v.sum));
            if (Math.abs(v.sum) > 1e-8 + 1e-6 * v.scale)
                valid = false;
        }
        const power = [...readings.values()].reduce((s, r) => s + r.Pabsorbed, 0), scale = [...readings.values()].reduce((s, r) => s + Math.abs(r.Pabsorbed), 0);
        if (Math.abs(power) > 1e-8 + 1e-6 * scale)
            valid = false;
        return { voltages, readings, residual, valid };
    };
    let mask = options.initialLedMask ?? 0, iterations = 0, fallbackUsed = false, result: ReturnType<typeof attempt> = null;
    const seen = new Set<number>();
    for (let i = 0; i < (options.maxIterations ?? 20); i++) {
        if (i > 0 && performance.now() > deadline)
            return deferred();
        if (seen.has(mask))
            break;
        seen.add(mask);
        iterations++;
        result = attempt(mask);
        if (!result)
            return fail('singular');
        if (result.valid)
            break;
        mask = leds.reduce((m, b, i) => m | ((result!.readings.get(b.id)!.Uab > b.vf! ? 1 : 0) << i), 0);
    }
    if (!result?.valid) {
        fallbackUsed = true;
        for (let m = 0; m < Math.min(1 << leds.length, options.maxFallback ?? 256); m++) {
            if (performance.now() > deadline)
                return deferred();
            iterations++;
            result = attempt(m);
            if (result?.valid)
                break;
        }
    }
    if (!result?.valid)
        return fail('nonconvergent');
    return { ok: true, modelVersion: 1, ...rev, nodes: result.voltages, branches: result.readings, sourceHeatW: new Map(net.branches.filter(b => b.E !== undefined).map(b => [b.id, result!.readings.get(b.id)!.Iab ** 2 * b.R])), diagnostics: { iterations, residualA: result.residual, fallbackUsed } };
}
export function solve(c: Circuit, rev: Revisions = ZERO, runtime: ElectricalRuntime = {}): Solution {
    const errors = validateCircuit(c, false);
    if (errors.length)
        return { ok: false, ...rev, reason: errors.some(e => e.includes('giới hạn') || e.includes('Quá nhiều')) ? 'limit-exceeded' : 'invalid-netlist', affectedIds: errors };
    return solveNetlist(compile(c, runtime), rev);
}
export const reading = (s: Solution, id: string): Reading => s.ok ? s.branches.get(id) ?? { Uab: 0, Iab: 0, Pabsorbed: 0 } : { Uab: 0, Iab: 0, Pabsorbed: 0 };
