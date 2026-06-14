// Circuit simulation engine
// ----------------------------------------------------------------------------
// Models the board as a graph of TERMINALS (each component contributes an
// `input` and an `output` node). Current must flow THROUGH a component
// (in one terminal, out the other), so a load only lights when it sits on a
// real closed loop that passes through the battery — not merely when it can
// "reach" both battery poles. This fixes the dangling-lead / single-port
// false positives of the old BFS model and lets us classify topology
// (series vs parallel) by a tear-down test that mirrors the lesson concept.

import { CircuitComponentData, WireData, ComponentType } from '@/src/data/electricityData';

const LOAD_TYPES: ComponentType[] = ['bulb', 'bell', 'fan', 'buzzer'];
export const isLoadType = (t: ComponentType) => LOAD_TYPES.includes(t);

export type LoadConnection = 'none' | 'single' | 'series' | 'parallel' | 'mixed';

// Status surfaced to parent components (Playground / Lesson pages).
export interface CircuitStatus {
    isComplete: boolean;        // a load is actually lit (kept for backward compat)
    isPowered: boolean;
    hasClosedLoop: boolean;     // a real closed loop exists (may be a short)
    hasShortCircuit: boolean;   // battery (+)→(−) closes through no load
    loadConnection: LoadConnection;
    litLoadCount: number;
}

export interface CircuitAnalysis {
    activeIds: Set<string>;     // components carrying current (loads, conducting switches, battery)
    litLoadIds: Set<string>;    // loads that are lit
    wireStates: Map<string, { isActive: boolean; isReverse: boolean }>;
    hasClosedLoop: boolean;
    hasShortCircuit: boolean;
    loadConnection: LoadConnection;
    controllingSwitches: Map<string, string[]>; // loadId -> switches whose OFF state kills it
}

const EMPTY_ANALYSIS = (): CircuitAnalysis => ({
    activeIds: new Set(),
    litLoadIds: new Set(),
    wireStates: new Map(),
    hasClosedLoop: false,
    hasShortCircuit: false,
    loadConnection: 'none',
    controllingSwitches: new Map(),
});

// Terminal node ids
const nIn = (id: string) => `${id}|in`;
const nOut = (id: string) => `${id}|out`;
const portNode = (id: string, port: 'input' | 'output') =>
    port === 'input' ? nIn(id) : nOut(id);

type Adj = Map<string, string[]>;

interface AdjOptions {
    disabledComps?: Set<string>;   // treat these components' internal edge as cut
    disabledWires?: Set<string>;   // remove these wires
    excludeLoadsInternal?: boolean; // drop load internal edges (for short detection)
}

// Build an undirected adjacency over terminal nodes.
// NOTE: the battery's own internal edge is intentionally omitted — the battery
// is the source, so a "closed loop" means the external network reconnects its
// two poles.
function buildAdj(
    comps: CircuitComponentData[],
    wires: WireData[],
    opts: AdjOptions = {}
): Adj {
    const adj: Adj = new Map();
    const add = (a: string, b: string) => {
        (adj.get(a) ?? adj.set(a, []).get(a)!).push(b);
        (adj.get(b) ?? adj.set(b, []).get(b)!).push(a);
    };

    for (const c of comps) {
        if (c.type === 'battery' || c.type === 'candle') continue; // source / no ports
        if (opts.disabledComps?.has(c.id)) continue;
        if (c.type === 'switch' && c.state !== 'on') continue;      // open switch breaks the path
        if (opts.excludeLoadsInternal && isLoadType(c.type)) continue;
        add(nIn(c.id), nOut(c.id));
    }

    for (const w of wires) {
        if (opts.disabledWires?.has(w.id)) continue;
        add(portNode(w.fromId, w.fromPort), portNode(w.toId, w.toPort));
    }

    return adj;
}

function reach(adj: Adj, start: string): Set<string> {
    const seen = new Set<string>([start]);
    const queue = [start];
    let head = 0;
    while (head < queue.length) {
        const u = queue[head++];
        for (const v of adj.get(u) ?? []) {
            if (!seen.has(v)) { seen.add(v); queue.push(v); }
        }
    }
    return seen;
}

function bfsDist(adj: Adj, start: string): Map<string, number> {
    const dist = new Map<string, number>([[start, 0]]);
    const queue = [start];
    let head = 0;
    while (head < queue.length) {
        const u = queue[head++];
        const du = dist.get(u)!;
        for (const v of adj.get(u) ?? []) {
            if (!dist.has(v)) { dist.set(v, du + 1); queue.push(v); }
        }
    }
    return dist;
}

// An edge (a,b) carries current iff the rest of the network bridges one of its
// endpoints to the (−) pole and the other to the (+) pole — i.e. adding the
// edge back closes a loop through the battery.
function edgeOnLoop(a: string, b: string, negReach: Set<string>, posReach: Set<string>): boolean {
    return (negReach.has(a) && posReach.has(b)) || (negReach.has(b) && posReach.has(a));
}

export function analyzeCircuit(
    comps: CircuitComponentData[],
    wires: WireData[]
): CircuitAnalysis {
    const battery = comps.find(c => c.type === 'battery');
    if (!battery) return EMPTY_ANALYSIS();

    const neg = nIn(battery.id);   // (−) pole — electron source
    const pos = nOut(battery.id);  // (+) pole — electron sink

    const full = buildAdj(comps, wires);
    const hasClosedLoop = reach(full, neg).has(pos);
    if (!hasClosedLoop) return { ...EMPTY_ANALYSIS(), hasClosedLoop: false };

    // Short circuit: poles reconnect through only wires/switches (no load).
    const noLoadAdj = buildAdj(comps, wires, { excludeLoadsInternal: true });
    const hasShortCircuit = reach(noLoadAdj, neg).has(pos);

    // Does a component carry current? Cut ITS OWN internal edge (so a dead stub
    // can't appear "connected" through its own body) plus any extra components
    // we want to pretend are removed, then test whether its two terminals land
    // on opposite poles of what remains.
    const carries = (compId: string, alsoDisabled?: Set<string>): boolean => {
        const disabled = new Set<string>(alsoDisabled);
        disabled.add(compId);
        const g = buildAdj(comps, wires, { disabledComps: disabled });
        return edgeOnLoop(nIn(compId), nOut(compId), reach(g, neg), reach(g, pos));
    };

    const activeIds = new Set<string>();
    const litLoadIds = new Set<string>();
    for (const c of comps) {
        if (c.type === 'battery' || c.type === 'candle') continue;
        if (c.type === 'switch' && c.state !== 'on') continue;
        if (carries(c.id)) {
            activeIds.add(c.id);
            if (isLoadType(c.type)) litLoadIds.add(c.id);
        }
    }
    if (litLoadIds.size > 0) activeIds.add(battery.id);

    // Wire activity + electron-flow direction (− → +).
    const distFromNeg = bfsDist(full, neg);
    const wireStates = new Map<string, { isActive: boolean; isReverse: boolean }>();
    for (const w of wires) {
        const a = portNode(w.fromId, w.fromPort);
        const b = portNode(w.toId, w.toPort);
        const g = buildAdj(comps, wires, { disabledWires: new Set([w.id]) });
        const isActive = edgeOnLoop(a, b, reach(g, neg), reach(g, pos));
        // Animation is drawn from→to by default; reverse it when electrons run
        // from the endpoint nearer (+) toward (−) in draw order.
        const isReverse = isActive && (distFromNeg.get(a) ?? Infinity) > (distFromNeg.get(b) ?? Infinity);
        wireStates.set(w.id, { isActive, isReverse });
    }

    // Topology classification by tear-down (mirrors the pedagogy):
    //   series  → removing ANY lit load kills ALL the others ("1 đứt, cả dãy tắt")
    //   parallel→ removing ANY lit load leaves the others on ("đèn khác vẫn sáng")
    const loads = [...litLoadIds];
    let loadConnection: LoadConnection = 'none';
    if (loads.length === 1) {
        loadConnection = 'single';
    } else if (loads.length >= 2) {
        let removalKillsAll = true;   // series signature
        let removalKillsNone = true;  // parallel signature
        for (const target of loads) {
            const without = new Set([target]);
            for (const other of loads) {
                if (other === target) continue;
                if (carries(other, without)) removalKillsAll = false;
                else removalKillsNone = false;
            }
        }
        loadConnection = removalKillsAll ? 'series' : removalKillsNone ? 'parallel' : 'mixed';
    }

    // Which switches control which load (turning the switch off kills the load).
    const controllingSwitches = new Map<string, string[]>();
    const liveSwitches = comps.filter(
        c => c.type === 'switch' && c.state === 'on' && activeIds.has(c.id)
    );
    for (const loadId of litLoadIds) {
        const ctrl: string[] = [];
        for (const sw of liveSwitches) {
            if (!carries(loadId, new Set([sw.id]))) ctrl.push(sw.id);
        }
        controllingSwitches.set(loadId, ctrl);
    }

    return {
        activeIds,
        litLoadIds,
        wireStates,
        hasClosedLoop,
        hasShortCircuit,
        loadConnection,
        controllingSwitches,
    };
}

export function statusFromAnalysis(a: CircuitAnalysis, isPowered: boolean): CircuitStatus {
    return {
        isComplete: a.litLoadIds.size > 0,
        isPowered,
        hasClosedLoop: a.hasClosedLoop,
        hasShortCircuit: a.hasShortCircuit,
        loadConnection: a.loadConnection,
        litLoadCount: a.litLoadIds.size,
    };
}

export const POWERED_OFF_STATUS: CircuitStatus = {
    isComplete: false,
    isPowered: false,
    hasClosedLoop: false,
    hasShortCircuit: false,
    loadConnection: 'none',
    litLoadCount: 0,
};
