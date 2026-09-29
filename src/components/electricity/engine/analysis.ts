import { Circuit, cloneCircuit, key, postIds, ref } from './circuit';
import { compile, source } from './parts';
import { reading, Solution, solve } from './solver';
import { startSimulation, tick } from './simulation';
export type Topology = 'none' | 'single' | 'series' | 'parallel' | 'mixed';
export const loadKinds = ['bulb', 'led', 'motor', 'bell', 'buzzer', 'electromagnet'];
export function powered(c: Circuit, s: Solution, id: string, strikes: {
    id: string;
    time: number;
}[] = [], time = 0) {
    if (!s.ok)
        return false;
    const p = c.parts.find(p => p.id === id);
    if (!p || p.broken || p.loose)
        return false;
    const r = reading(s, id), i = Math.abs(r.Iab);
    switch (p.kind) {
        case 'bulb': return r.Pabsorbed / 0.75 >= 0.05;
        case 'led': return r.Iab >= 0.0005;
        case 'motor': return i >= 0.05;
        case 'bell': return strikes.some(e => e.id === id && time - e.time <= 0.5);
        case 'buzzer': return i >= 0.004;
        case 'electromagnet': return i >= 0.005;
        default: return false;
    }
}
export function topology(c: Circuit, targets = c.parts.filter(p => loadKinds.includes(p.kind)).map(p => p.id)): Topology {
    const net = compile(c), parent = new Map(net.nodes.map(n => [n, n]));
    const root = (n: string): string => { let p = parent.get(n)!; while (p !== parent.get(p))
        p = parent.get(p)!; return p; };
    const collapsed = ['wire', 'switch', 'button', 'spdt', 'fuse', 'ammeter'];
    for (const b of net.branches)
        if (collapsed.includes(b.kind))
            parent.set(root(b.a), root(b.b));
    const branches = net.branches.filter(b => !collapsed.includes(b.kind) && b.kind !== 'voltmeter').map(b => ({ ...b, a: root(b.a), b: root(b.b) }));
    const sources = branches.filter(b => b.E !== undefined);
    if (sources.length !== 1)
        return sources.length ? 'mixed' : 'none';
    const battery = sources[0], loads = branches.filter(b => targets.includes(b.id));
    if (!loads.length)
        return 'none';
    const adj = new Map<string, string[]>();
    for (const b of branches) {
        adj.set(b.a, [...(adj.get(b.a) ?? []), b.b]);
        adj.set(b.b, [...(adj.get(b.b) ?? []), b.a]);
    }
    const reachable = new Set<string>(), q = [battery.a];
    while (q.length) {
        const n = q.pop()!;
        if (reachable.has(n))
            continue;
        reachable.add(n);
        q.push(...(adj.get(n) ?? []).filter(n => !reachable.has(n)));
    }
    if (loads.some(b => !reachable.has(b.a) || !reachable.has(b.b) || b.a === b.b))
        return 'none';
    const pair = (a: string, b: string) => [a, b].sort().join('|');
    if (loads.length === 1)
        return 'single';
    if (loads.every(b => pair(b.a, b.b) === pair(loads[0].a, loads[0].b)))
        return 'parallel';
    // Remove dangling, non-target branches before checking the single path through every load.
    let edges = branches.filter(b => b.id !== battery.id), changed = true;
    while (changed) {
        changed = false;
        const degree = new Map<string, number>();
        for (const b of edges) {
            degree.set(b.a, (degree.get(b.a) ?? 0) + 1);
            degree.set(b.b, (degree.get(b.b) ?? 0) + 1);
        }
        edges = edges.filter(b => { const leaf = [b.a, b.b].some(n => degree.get(n) === 1 && n !== battery.a && n !== battery.b); if (leaf && !targets.includes(b.id)) {
            changed = true;
            return false;
        } return true; });
    }
    const degrees = new Map<string, number>();
    for (const b of edges) {
        degrees.set(b.a, (degrees.get(b.a) ?? 0) + 1);
        degrees.set(b.b, (degrees.get(b.b) ?? 0) + 1);
    }
    if (degrees.get(battery.a) === 1 && degrees.get(battery.b) === 1 && [...degrees].every(([n, d]) => d === (n === battery.a || n === battery.b ? 1 : 2)))
        return 'series';
    return 'mixed';
}
export function analyze(c: Circuit, s: Solution, strikes: {
    id: string;
    time: number;
}[] = [], time = 0) {
    const net = compile(c), shortPaths: string[][] = [];
    const pass = net.branches.filter(b => ['wire', 'switch', 'button', 'spdt', 'fuse', 'ammeter'].includes(b.kind));
    for (const b of net.branches.filter(b => b.E !== undefined)) {
        const seen = new Set([b.a]), q: [
            string,
            string[]
        ][] = [[b.a, []]];
        while (q.length) {
            const [n, path] = q.shift()!;
            if (n === b.b) {
                shortPaths.push(path);
                break;
            }
            for (const edge of pass) {
                const other = edge.a === n ? edge.b : edge.b === n ? edge.a : null;
                if (other && !seen.has(other)) {
                    seen.add(other);
                    q.push([other, [...path, edge.id]]);
                }
            }
        }
    }
    const overload = c.parts.filter(p => { const r = reading(s, p.id); return p.kind === 'bulb' ? r.Pabsorbed / 0.75 > 2.8 : p.kind === 'led' ? r.Iab > 0.04 || r.Uab < -5 : p.kind === 'fuse' ? Math.abs(r.Iab) > (p.rating ?? 0.5) : false; }).map(p => p.id);
    const gaps = c.parts.filter(p => p.broken || p.loose || (['switch', 'button'].includes(p.kind) && !p.closed) || (p.kind === 'battery' && p.cells?.some(c => !c.present))).map(p => ({ id: p.id, reason: p.broken ? 'Linh kiện đã hỏng' : p.loose ? 'Tiếp điểm đang lỏng' : p.kind === 'battery' ? 'Ngăn pin còn trống' : 'Công tắc đang mở', confidence: 'certain' }));
    const reverseSources = c.parts.filter(p => p.kind === 'battery' && p.cells?.some(cell => cell.charge01 > 0 && cell.polarity * 1.5 * reading(s, p.id).Iab < -1e-6)).map(p => p.id);
    return { poweredLoadIds: c.parts.filter(p => powered(c, s, p.id, strikes, time)).map(p => p.id), conductingBranchIds: s.ok ? [...s.branches].filter(([, r]) => Math.abs(r.Iab) > 1e-7).map(([id]) => id) : [], shortPaths, overload, gaps, reverseSources, healthy: s.ok && !shortPaths.length && !overload.length && !reverseSources.length && !c.parts.some(p => p.broken), topology: topology(c) };
}
/** Counterfactual is isolated and never writes runtime, rewards, or the live circuit. */
const controlCache = new Map<string, boolean>();
export function controls(c: Circuit, switchId: string, loadId: string): boolean {
    // Geometry and fractional discharge do not change a control relationship.
    const cacheKey = JSON.stringify([switchId, loadId, c.parts.map(({ x, z, rot, ...p }) => ({ ...p, cells: p.cells?.map(cell => ({ ...cell, charge01: cell.charge01 > 0 ? 1 : 0 })) })), c.wires.map(({ id, a, b, broken }) => ({ id, a, b, broken }))]);
    const cached = controlCache.get(cacheKey);
    if (cached !== undefined)
        return cached;
    const copy = cloneCircuit(c), p = copy.parts.find(p => p.id === switchId), load = copy.parts.find(p => p.id === loadId);
    if (!p || !load || !['switch', 'button', 'spdt'].includes(p.kind))
        return false;
    const observe = (state: boolean) => { if (p.kind === 'spdt')
        p.position = state ? 1 : 0;
    else if (p.actuator === 'doorContact')
        p.doorClosed = !state;
    else
        p.closed = state; if (load.kind === 'bell') {
        let sim = startSimulation(copy);
        for (let i = 0; i < 25; i++)
            sim = tick(sim);
        return sim.runtime.strikes.some(e => e.id === loadId);
    } return powered(copy, solve(copy), loadId); };
    const a = observe(false), b = observe(true), result = p.kind === 'spdt' ? a !== b : !a && b;
    if (controlCache.size > 128)
        controlCache.clear();
    controlCache.set(cacheKey, result);
    return result;
}
