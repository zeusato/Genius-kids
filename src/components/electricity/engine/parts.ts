import { Circuit, Part, PartKind, key, postIds, ref } from './circuit';
export const MODEL = { version: 1, wireR: 0.02, bulbR: 25 / 3, bulbRatedW: 0.75, cellE: 1.5, cellR: 0.2, capacityC: 7200, ledOffG: 1e-9, ledRon: 15, ledVisibleA: 0.0005 } as const;
export const PARTS: Record<PartKind, {
    name: string;
    symbol: string;
    sourceIds: string[];
    provenance: 'calibrated';
    modelVersion: 1;
    note: string;
}> = Object.fromEntries(Object.entries({ battery: ['Hộp pin', '▰'], bulb: ['Bóng đèn', '⊗'], switch: ['Cầu dao', '⏚'], button: ['Nút nhấn', '⊙'], bell: ['Chuông', '♧'], buzzer: ['Còi', '◖'], motor: ['Quạt điện', '✣'], led: ['LED', '▷'], resistor: ['Điện trở', '▱'], rheostat: ['Biến trở', '↗'], ammeter: ['Ampe kế', 'A'], voltmeter: ['Vôn kế', 'V'], fuse: ['Cầu chì', '━'], electromagnet: ['Nam châm điện', '∩'], generator: ['Máy phát', 'G'], lemon: ['Pin chanh', '◒'], potato: ['Pin khoai', '◓'], sample: ['Kẹp mẫu vật', '⌁'], spdt: ['Công tắc hai chiều', '⑂'], junction: ['Nút nối', '●'] }).map(([k, v]) => [k, { name: v[0], symbol: v[1], sourceIds: ['MODEL-DC'], provenance: 'calibrated', modelVersion: 1, note: 'Thông số mô hình giáo dục v1.' }])) as Record<PartKind, {
    name: string;
    symbol: string;
    sourceIds: string[];
    provenance: 'calibrated';
    modelVersion: 1;
    note: string;
}>;
export interface Branch {
    id: string;
    partId: string;
    a: string;
    b: string;
    R: number;
    E?: number;
    vf?: number;
    kind: PartKind | 'wire';
}
export interface Netlist {
    nodes: string[];
    branches: Branch[];
}
export interface ElectricalRuntime {
    bellOpen?: Record<string, boolean>;
}
export function source(p: Part): {
    E: number;
    R: number;
} | null {
    if (p.kind === 'battery') {
        if (!p.cells?.length || p.cells.some(c => !c.present))
            return null;
        return { E: p.cells.reduce((s, c) => s + (c.charge01 > 0 ? 1.5 * c.polarity : 0), 0), R: p.cells.reduce((s, c) => s + (c.charge01 > 0 ? 0.2 : 10), 0) };
    }
    if (p.kind === 'lemon')
        return { E: 0.95, R: 450 };
    if (p.kind === 'potato')
        return { E: 0.85, R: 700 };
    if (p.kind === 'generator')
        return { E: Math.max(-6, Math.min(6, 3 * (p.speed ?? 0))), R: 2 };
    return null;
}
export function compile(c: Circuit, runtime: ElectricalRuntime = {}): Netlist {
    const nodes = c.parts.flatMap(p => postIds(p).map(id => key(ref(p.id, id))));
    const branches: Branch[] = c.wires.filter(w => !w.broken).map(w => ({ id: w.id, partId: w.id, a: key(w.a), b: key(w.b), R: 0.02, kind: 'wire' }));
    for (const p of c.parts) {
        if (p.broken || p.loose || p.kind === 'junction')
            continue;
        const posts = postIds(p);
        const a = key(ref(p.id, posts[0]));
        let b = key(ref(p.id, posts[1]));
        let R = 0.02, E: number | undefined, vf: number | undefined;
        const s = source(p);
        if (s) {
            R = s.R;
            E = s.E;
        }
        else
            switch (p.kind) {
                case 'battery': continue;
                case 'bulb':
                    R = MODEL.bulbR;
                    break;
                case 'led':
                    R = MODEL.ledRon;
                    vf = ({ red: 1.8, yellow: 2, green: 2.1, blue: 2.8 })[p.color ?? 'red'];
                    break;
                case 'switch':
                case 'button':
                    if (!(p.actuator === 'doorContact' ? !p.doorClosed : p.closed))
                        continue;
                    break;
                case 'spdt':
                    b = key(ref(p.id, p.position ? 'throw1' : 'throw0'));
                    break;
                case 'resistor':
                case 'sample':
                    if (p.resistance === null)
                        continue;
                    R = p.resistance!;
                    break;
                case 'rheostat':
                    R = 1 + 999 * (p.knob01 ?? 0.1);
                    break;
                case 'voltmeter':
                    R = 10e6;
                    break;
                case 'bell':
                    if (runtime.bellOpen?.[p.id])
                        continue;
                    R = 12;
                    break;
                case 'electromagnet':
                    R = 12;
                    break;
                case 'buzzer':
                    R = 150;
                    break;
                case 'motor':
                    R = 6;
                    break;
            }
        branches.push({ id: p.id, partId: p.id, a, b, R, E, vf, kind: p.kind });
    }
    return { nodes, branches };
}
