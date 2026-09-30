import { Circuit, key } from '../engine/circuit';
import type { Solution } from '../engine/solver';

export type WireTone = 'coral' | 'teal';
const SOURCES = new Set(['battery', 'lemon', 'potato', 'generator']);

/**
 * Màu dây chỉ để nhận diện (như dây đỏ/đen của bộ đồ chơi): dây chạm trực tiếp cụm cọc (+) của nguồn
 * là san hô, cụm cọc (−) là xanh ngọc; dây ở giữa mạch theo điện thế so với trung điểm nguồn.
 * Không đổi kết quả điện, không gán cực cho tải.
 */
export function wireTones(c: Circuit, s: Solution): Map<string, WireTone> {
    const parent = new Map<string, string>();
    const find = (x: string): string => { let r = x; while (parent.has(r) && parent.get(r) !== r) r = parent.get(r)!; parent.set(x, r); return r; };
    const union = (a: string, b: string) => { const ra = find(a), rb = find(b); if (ra !== rb) parent.set(ra, rb); };
    for (const w of c.wires) { parent.set(key(w.a), parent.get(key(w.a)) ?? key(w.a)); parent.set(key(w.b), parent.get(key(w.b)) ?? key(w.b)); union(key(w.a), key(w.b)); }
    const tone = new Map<string, WireTone>(); // theo gốc cụm
    let mid: number | null = null, island: string | null = null;
    for (const p of c.parts.filter(p => SOURCES.has(p.kind))) {
        const plus = find(`${p.id}:plus`), minus = find(`${p.id}:minus`);
        if (!tone.has(plus)) tone.set(plus, 'coral');
        if (!tone.has(minus)) tone.set(minus, 'teal');
        if (mid === null && s.ok) {
            const vp = s.nodes.get(`${p.id}:plus`), vm = s.nodes.get(`${p.id}:minus`);
            if (vp && vm) { mid = (vp.volts + vm.volts) / 2; island = vp.islandId; }
        }
    }
    const out = new Map<string, WireTone>();
    c.wires.forEach((w, i) => {
        const root = find(key(w.a));
        let t = tone.get(root);
        if (!t && s.ok && mid !== null) {
            const v = s.nodes.get(key(w.a));
            if (v && v.islandId === island) t = v.volts >= mid ? 'coral' : 'teal';
        }
        out.set(w.id, t ?? (i % 2 ? 'teal' : 'coral'));
    });
    return out;
}
