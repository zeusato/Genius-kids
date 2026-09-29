/** Persisted educational DC model. Geometry never determines electrical connectivity. */
export type PartKind = 'battery' | 'bulb' | 'switch' | 'button' | 'bell' | 'buzzer' | 'motor' | 'led' | 'resistor' | 'rheostat' | 'ammeter' | 'voltmeter' | 'fuse' | 'electromagnet' | 'generator' | 'lemon' | 'potato' | 'sample' | 'spdt' | 'junction';
export interface Cell {
    polarity: 1 | -1;
    charge01: number;
    present: boolean;
}
export interface Part {
    id: string;
    kind: PartKind;
    x: number;
    z: number;
    rot: number;
    closed?: boolean;
    position?: 0 | 1;
    broken?: boolean;
    loose?: boolean;
    cells?: Cell[];
    color?: 'red' | 'yellow' | 'green' | 'blue';
    resistance?: number | null;
    knob01?: number;
    rating?: number;
    turns?: 20 | 40 | 80;
    iron?: boolean;
    speed?: number;
    actuator?: 'doorContact';
    doorClosed?: boolean;
}
export interface PostRef {
    partId: string;
    postId: string;
}
export interface Wire {
    id: string;
    a: PostRef;
    b: PostRef;
    broken?: boolean;
    color?: string;
}
export interface Circuit {
    schema: 1;
    electricalModelVersion: 1;
    id: string;
    board: {
        w: 14;
        d: 8;
    };
    parts: Part[];
    wires: Wire[];
    presentationHints?: {
        branchCorridors: Record<string, 'upper' | 'lower'>;
    };
}
export const LIMITS = { parts: 24, wires: 40, nodes: 192, leds: 8, bytes: 128 * 1024 } as const;
export const key = (p: PostRef) => `${p.partId}:${p.postId}`;
export const ref = (partId: string, postId: string): PostRef => ({ partId, postId });
export const cloneCircuit = (c: Circuit): Circuit => structuredClone(c);
export function emptyCircuit(id = 'workbench'): Circuit { return { schema: 1, electricalModelVersion: 1, id, board: { w: 14, d: 8 }, parts: [], wires: [] }; }
export function postIds(p: Part): string[] { return p.kind === 'junction' ? ['node'] : p.kind === 'spdt' ? ['common', 'throw0', 'throw1'] : p.kind === 'led' ? ['anode', 'cathode'] : ['battery', 'lemon', 'potato', 'generator'].includes(p.kind) ? ['minus', 'plus'] : ['a', 'b']; }
export function postLabel(p: Part, post: string) { return ({ minus: 'Cực −', plus: 'Cực +', a: 'Cọc A', b: 'Cọc B', anode: 'Anôt (+)', cathode: 'Catôt (−)', common: 'Cọc chung', throw0: 'Cọc 1', throw1: 'Cọc 2', node: 'Nút nối' } as Record<string, string>)[post]; }
export function postPosition(p: Part, postId: string): [
    number,
    number
] {
    const ids = postIds(p), i = ids.indexOf(postId);
    const dx = ids.length === 1 ? 0 : i === 0 ? -0.8 : 0.8;
    const dz = ids.length === 3 && i > 0 ? (i === 1 ? -0.45 : 0.45) : 0;
    const r = p.rot * Math.PI / 180;
    return [p.x + dx * Math.cos(r) - dz * Math.sin(r), p.z + dx * Math.sin(r) + dz * Math.cos(r)];
}
export function displayPoint(x: number, z: number, portrait: boolean): [
    number,
    number
] { return portrait ? [z, 14 - x] : [x, z]; }
export function boardPoint(u: number, v: number, portrait: boolean): [
    number,
    number
] { return portrait ? [14 - v, u] : [u, v]; }
export function newPart(kind: PartKind, id: string, x: number, z: number): Part {
    return { id, kind, x, z, rot: 0, ...(kind === 'battery' ? { cells: [{ polarity: 1, charge01: 1, present: true }] } : {}), ...(['switch', 'button'].includes(kind) ? { closed: false } : {}), ...(kind === 'led' ? { color: 'red' as const } : {}), ...(kind === 'resistor' ? { resistance: 100 } : {}), ...(kind === 'fuse' ? { rating: 0.5 } : {}), ...(kind === 'rheostat' ? { knob01: 0.1 } : {}), ...(kind === 'generator' ? { speed: 0 } : {}) };
}
export function validateCircuit(value: unknown, editor = true): string[] {
    const errors: string[] = [];
    if (!value || typeof value !== 'object')
        return ['Bản lưu không phải mạch điện.'];
    const c = value as Circuit;
    if (c.schema !== 1 || c.electricalModelVersion !== 1 || c.board?.w !== 14 || c.board?.d !== 8 || !Array.isArray(c.parts) || !Array.isArray(c.wires))
        return ['Phiên bản hoặc cấu trúc mạch không được hỗ trợ.'];
    if (c.parts.length > (editor ? 24 : 64) || c.wires.length > (editor ? 40 : 128) || c.parts.filter(p => p?.kind === 'led').length > 8)
        errors.push('Mạch vượt giới hạn linh kiện hoặc dây.');
    const kinds: PartKind[] = ['battery', 'bulb', 'switch', 'button', 'bell', 'buzzer', 'motor', 'led', 'resistor', 'rheostat', 'ammeter', 'voltmeter', 'fuse', 'electromagnet', 'generator', 'lemon', 'potato', 'sample', 'spdt', 'junction'];
    const ids = new Set<string>(), nodes = new Set<string>();
    for (const p of c.parts) {
        if (!p || typeof p.id !== 'string' || !p.id || !/^[A-Za-z0-9_-]{1,64}$/.test(p.id) || ['__proto__', 'constructor', 'prototype'].includes(p.id) || ids.has(p.id) || !kinds.includes(p.kind)) {
            errors.push('Linh kiện không hợp lệ hoặc trùng ID.');
            continue;
        }
        ids.add(p.id);
        if (![p.x, p.z, p.rot].every(Number.isFinite) || p.x < 1.3 || p.x > 12.7 || p.z < 1 || p.z > 7 || ![0, 90, 180, 270].includes(p.rot))
            errors.push(`Vị trí không hợp lệ: ${p.id}`);
        if (p.kind === 'battery' && (!Array.isArray(p.cells) || p.cells.length < 1 || p.cells.length > 4 || p.cells.some(v => !v || ![1, -1].includes(v.polarity) || !Number.isFinite(v.charge01) || v.charge01 < 0 || v.charge01 > 1 || typeof v.present !== 'boolean')))
            errors.push(`Pin không hợp lệ: ${p.id}`);
        if (['resistor', 'sample'].includes(p.kind) && !(p.kind === 'sample' && p.resistance === null) && (!Number.isFinite(p.resistance) || p.resistance! <= 0))
            errors.push(`Điện trở không hợp lệ: ${p.id}`);
        if (p.knob01 !== undefined && (!Number.isFinite(p.knob01) || p.knob01 < 0 || p.knob01 > 1))
            errors.push('Biến trở ngoài phạm vi.');
        if (p.speed !== undefined && (!Number.isFinite(p.speed) || Math.abs(p.speed) > 2))
            errors.push('Tốc độ máy phát ngoài phạm vi.');
        if (p.rating !== undefined && ![0.25, 0.5, 1].includes(p.rating))
            errors.push('Định mức cầu chì không hợp lệ.');
        if (p.color !== undefined && !['red', 'yellow', 'green', 'blue'].includes(p.color))
            errors.push('Màu LED không hợp lệ.');
        if (p.position !== undefined && ![0, 1].includes(p.position))
            errors.push('Vị trí công tắc không hợp lệ.');
        for (const field of ['closed', 'broken', 'loose', 'iron', 'doorClosed'] as const)
            if (p[field] !== undefined && typeof p[field] !== 'boolean')
                errors.push('Trạng thái linh kiện không hợp lệ.');
        if (p.turns !== undefined && ![20, 40, 80].includes(p.turns))
            errors.push('Số vòng dây không hợp lệ.');
        if (p.actuator !== undefined && p.actuator !== 'doorContact')
            errors.push('Cơ cấu điều khiển không hợp lệ.');
        for (const post of postIds(p))
            nodes.add(key(ref(p.id, post)));
    }
    if (nodes.size > 192)
        errors.push('Quá nhiều cọc điện.');
    const pairs = new Set<string>();
    for (const w of c.wires) {
        if (!w || !w.a || !w.b) {
            errors.push('Dây thiếu cọc.');
            continue;
        }
        const a = key(w.a), b = key(w.b), pair = [a, b].sort().join('|');
        if (typeof w.id !== 'string' || !w.id || !/^[A-Za-z0-9_-]{1,64}$/.test(w.id) || ['__proto__', 'constructor', 'prototype'].includes(w.id) || ids.has(w.id) || !nodes.has(a) || !nodes.has(b) || a === b || (editor && pairs.has(pair)) || (w.broken !== undefined && typeof w.broken !== 'boolean'))
            errors.push('Dây trùng hoặc nối cọc không tồn tại.');
        ids.add(w.id);
        pairs.add(pair);
    }
    return errors;
}
