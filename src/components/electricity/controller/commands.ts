import { Circuit, cloneCircuit, key, Part, PostRef, validateCircuit, Wire } from '../engine/circuit';
import { fits, routeAll } from '../engine/route';
import { applyCircuit, Simulation } from '../engine/simulation';
export type Command = {
    type: 'add';
    part: Part;
} | {
    type: 'patch';
    id: string;
    patch: Partial<Part>;
    electrical?: boolean;
} | {
    type: 'wire';
    wire: Wire;
} | {
    type: 'remove';
    id: string;
} | {
    type: 'replace';
    circuit: Circuit;
} | {
    type: 'repair';
    id: string;
};
export interface History {
    past: Simulation[];
    future: Simulation[];
}
export const emptyHistory = (): History => ({ past: [], future: [] });
export function command(sim: Simulation, action: Command): {
    ok: true;
    sim: Simulation;
} | {
    ok: false;
    message: string;
} {
    const c = cloneCircuit(sim.circuit);
    let electrical = true;
    switch (action.type) {
        case 'replace': {
            const errors = validateCircuit(action.circuit);
            if (errors.length)
                return { ok: false, message: errors[0] };
            return { ok: true, sim: applyCircuit(sim, action.circuit) };
        }
        case 'add':
            if (!fits(c, action.part))
                return { ok: false, message: 'Chừa một ô trống cho linh kiện nhé.' };
            c.parts.push(action.part);
            break;
        case 'patch': {
            const p = c.parts.find(p => p.id === action.id);
            if (!p)
                return { ok: false, message: 'Không tìm thấy linh kiện.' };
            Object.assign(p, action.patch);
            electrical = action.electrical !== false;
            if (!electrical && !fits(c, p))
                return { ok: false, message: 'Vị trí này đã có linh kiện.' };
            break;
        }
        case 'wire': {
            const w = action.wire;
            if (key(w.a) === key(w.b))
                return { ok: false, message: 'Chọn hai cọc khác nhau nhé.' };
            const pair = [key(w.a), key(w.b)].sort().join('|');
            if (c.wires.some(v => [key(v.a), key(v.b)].sort().join('|') === pair))
                return { ok: false, message: 'Hai cọc này đã nối rồi.' };
            c.wires.push(w);
            break;
        }
        case 'remove':
            c.parts = c.parts.filter(p => p.id !== action.id);
            c.wires = c.wires.filter(w => w.id !== action.id && w.a.partId !== action.id && w.b.partId !== action.id);
            break;
        case 'repair': {
            const p = c.parts.find(p => p.id === action.id);
            if (p) {
                p.broken = false;
                p.loose = false;
                if (p.cells)
                    p.cells = p.cells.map(cell => ({ ...cell, charge01: 1 }));
            }
            else {
                const w = c.wires.find(w => w.id === action.id);
                if (w)
                    w.broken = false;
            }
            break;
        }
    }
    const errors = validateCircuit(c);
    if (errors.length)
        return { ok: false, message: errors[0] };
    if (['add', 'wire'].includes(action.type) || !electrical) {
        if (routeAll(c).size !== c.wires.length)
            return { ok: false, message: 'Chừa một lối cho dây nhé.' };
    }
    const next = applyCircuit(sim, c, electrical);
    if (action.type === 'repair') {
        delete next.runtime.damage[action.id];
        delete next.runtime.timers[action.id];
        delete next.runtime.bellOpen[action.id];
        delete next.runtime.bellPhase[action.id];
    }
    return { ok: true, sim: next };
}
export function record(history: History, before: Simulation): History { return { past: [...history.past.slice(-49), structuredClone(before)], future: [] }; }
export function travel(history: History, current: Simulation, redo = false): {
    history: History;
    sim: Simulation;
} | null { const from = redo ? history.future : history.past; if (!from.length)
    return null; const next = structuredClone(from[from.length - 1]); next.runtime.editRevision = current.runtime.editRevision + 1; next.runtime.solveRevision = current.runtime.solveRevision + 1; const restored = applyCircuit(next, next.circuit); return { sim: restored, history: redo ? { past: [...history.past, structuredClone(current)], future: from.slice(0, -1) } : { past: from.slice(0, -1), future: [...history.future, structuredClone(current)] } }; }
