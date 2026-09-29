import { Circuit, Part, postPosition, Wire } from './circuit';
export type Point = [
    number,
    number
];
const distance = (a: Point, b: Point) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
export function fits(c: Circuit, p: Part) { const w = p.rot % 180 === 0 ? 1.05 : 0.65, d = p.rot % 180 === 0 ? 0.65 : 1.05; return p.x - w >= 0.5 && p.x + w <= 13.5 && p.z - d >= 0.5 && p.z + d <= 7.5 && !c.parts.some(o => o.id !== p.id && Math.abs(p.x - o.x) < w + (o.rot % 180 === 0 ? 1.05 : 0.65) && Math.abs(p.z - o.z) < d + (o.rot % 180 === 0 ? 0.65 : 1.05)); }
export function freeSpot(c: Circuit, p: Part): Part | null { const candidates: Part[] = []; for (let x = 2; x <= 12; x++)
    for (let z = 1; z <= 7; z++) {
        const next = { ...p, x, z };
        if (fits(c, next))
            candidates.push(next);
    } return candidates.sort((a, b) => distance([a.x, a.z], [p.x, p.z]) - distance([b.x, b.z], [p.x, p.z]) || a.z - b.z || a.x - b.x)[0] ?? null; }
const dirs: Point[] = [[1, 0], [0, 1], [-1, 0], [0, -1]];
/** Deterministic half-cell router. Routes are presentation data, never solver input. */
export function route(c: Circuit, w: Wire, occupied = new Set<string>()): Point[] | null {
    const pa = c.parts.find(p => p.id === w.a.partId), pb = c.parts.find(p => p.id === w.b.partId);
    if (!pa || !pb)
        return null;
    const a = postPosition(pa, w.a.postId), b = postPosition(pb, w.b.postId);
    const lead = (p: Part, v: Point): Point => { const dx = v[0] - p.x, dz = v[1] - p.z; return [Math.round((v[0] + Math.sign(dx) * 0.55) * 2), Math.round((v[1] + Math.sign(dz) * 0.55) * 2)]; };
    const start = lead(pa, a), end = lead(pb, b), corridor = c.presentationHints?.branchCorridors?.[w.id];
    const blocked = (x: number, z: number) => c.parts.some(p => Math.abs(x / 2 - p.x) < (p.rot % 180 === 0 ? 1.15 : 0.7) && Math.abs(z / 2 - p.z) < (p.rot % 180 === 0 ? 0.7 : 1.15));
    const sk = (x: number, z: number, h: number) => `${x},${z},${h}`;
    type State = {
        x: number;
        z: number;
        h: number;
        g: number;
        f: number;
        previous?: State;
    };
    const queue: State[] = [{ x: start[0], z: start[1], h: 4, g: 0, f: distance(start, end) }], cost = new Map<string, number>();
    let count = 0;
    while (queue.length && count++ < 10000) {
        queue.sort((a, b) => a.f - b.f || a.g - b.g || a.z - b.z || a.x - b.x || a.h - b.h);
        const s = queue.shift()!;
        if (s.x === end[0] && s.z === end[1]) {
            const points: Point[] = [];
            let v: State | undefined = s;
            while (v) {
                points.unshift([v.x / 2, v.z / 2]);
                v = v.previous;
            }
            return [a, ...points, b].filter((p, i, all) => i === 0 || i === all.length - 1 || (p[0] - all[i - 1][0]) * (all[i + 1][1] - p[1]) !== (p[1] - all[i - 1][1]) * (all[i + 1][0] - p[0]));
        }
        for (let h = 0; h < 4; h++) {
            const x = s.x + dirs[h][0], z = s.z + dirs[h][1];
            if (x < 0 || x > 28 || z < 0 || z > 16 || blocked(x, z))
                continue;
            if (corridor === 'upper' && z > 8 || corridor === 'lower' && z < 8)
                continue;
            const g = s.g + 1 + (h !== s.h && s.h !== 4 ? 2 : 0) + (occupied.has(`${x},${z}`) ? 8 : 0), k = sk(x, z, h);
            if (g >= (cost.get(k) ?? Infinity))
                continue;
            cost.set(k, g);
            queue.push({ x, z, h, g, f: g + distance([x, z], end), previous: s });
        }
    }
    return null;
}
export function routeAll(c: Circuit): Map<string, Point[]> { const paths = new Map<string, Point[]>(), occupied = new Set<string>(); for (const w of [...c.wires].sort((a, b) => a.id.localeCompare(b.id))) {
    const path = route(c, w, occupied);
    if (path) {
        paths.set(w.id, path);
        for (let i = 1; i < path.length; i++) {
            const a = path[i - 1], b = path[i], steps = Math.ceil(distance(a, b) * 2);
            for (let n = 0; n <= steps; n++)
                occupied.add(`${Math.round((a[0] + (b[0] - a[0]) * n / Math.max(1, steps)) * 2)},${Math.round((a[1] + (b[1] - a[1]) * n / Math.max(1, steps)) * 2)}`);
        }
    }
} return paths; }
