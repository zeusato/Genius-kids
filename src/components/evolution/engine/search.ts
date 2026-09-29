// Tìm sinh vật: không phân biệt dấu, có tên gọi quen (KID.aliases).
import { KID } from '../../../data/evolution/kid';
import type { EvoTree } from './tree';

import { normalizeVi } from '../../../utils/text';
export { normalizeVi };

interface Entry { i: number; texts: string[] }
const cache = new WeakMap<EvoTree, Entry[]>();

function index(t: EvoTree): Entry[] {
    let e = cache.get(t);
    if (!e) {
        e = t.nodes.map(n => ({
            i: n.i,
            texts: [n.data.label, n.data.englishLabel ?? '', ...(KID[n.id]?.aliases ?? [])].map(normalizeVi).filter(Boolean),
        }));
        cache.set(t, e);
    }
    return e;
}

function score(text: string, q: string): number {
    if (text === q) return 100;
    if (text.startsWith(q)) return 80;
    if (text.split(' ').some(w => w.startsWith(q)) || text.includes(' ' + q)) return 60;
    if (text.includes(q)) return 40;
    return 0;
}

export function searchNodes(t: EvoTree, query: string, limit = 8): number[] {
    const q = normalizeVi(query);
    if (!q) return [];
    return index(t)
        .map(e => ({ i: e.i, s: Math.max(...e.texts.map(x => score(x, q))) }))
        .filter(r => r.s > 0)
        .sort((a, b) => b.s - a.s || t.nodes[a.i].depth - t.nodes[b.i].depth)
        .slice(0, limit)
        .map(r => r.i);
}
