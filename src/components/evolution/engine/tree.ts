// Cây làm phẳng (DFS, gốc = 0) + các phép toán họ hàng. TS thuần — không import react/three.
import type { EvolutionNode } from '../../../data/evolution/types';
import { SECTOR_ROOTS, SectorId, TRUNK_IDS } from '../../../data/evolution/sectors';
import { EXTINCT } from '../../../data/evolution/times';

export interface FlatNode {
    i: number;
    id: string;
    data: EvolutionNode;
    parent: number;          // -1 ở gốc
    children: number[];
    depth: number;
    leafCount: number;
    sector: SectorId;
    isLeaf: boolean;
    extinct: boolean;
}

export interface EvoTree {
    nodes: FlatNode[];
    byId: Map<string, number>;
    leaves: number[];        // theo thứ tự DFS (trái → phải trên quạt)
}

export function buildTree(root: EvolutionNode): EvoTree {
    const nodes: FlatNode[] = [];
    const byId = new Map<string, number>();
    const visit = (n: EvolutionNode, parent: number, depth: number, sector: SectorId): number => {
        const i = nodes.length;
        if (byId.has(n.id)) throw new Error(`Trùng id node: ${n.id}`);
        const own: SectorId = TRUNK_IDS.has(n.id) ? 'trunk' : (SECTOR_ROOTS[n.id] ?? sector);
        const f: FlatNode = {
            i, id: n.id, data: n, parent, children: [], depth, leafCount: 0,
            sector: own, isLeaf: !(n.children && n.children.length), extinct: !!EXTINCT[n.id],
        };
        nodes.push(f);
        byId.set(n.id, i);
        // Hậu duệ của node trunk thừa kế sector gần nhất phía trên (trunk thì không truyền xuống)
        const pass: SectorId = own === 'trunk' ? sector : own;
        for (const c of n.children ?? []) f.children.push(visit(c, i, depth + 1, pass));
        f.leafCount = f.isLeaf ? 1 : f.children.reduce((s, c) => s + nodes[c].leafCount, 0);
        return i;
    };
    visit(root, -1, 0, 'trunk');
    return { nodes, byId, leaves: nodes.filter(n => n.isLeaf).map(n => n.i) };
}

export function idx(t: EvoTree, id: string): number {
    const i = t.byId.get(id);
    if (i === undefined) throw new Error(`Không có node ${id}`);
    return i;
}

/** [i, cha, …, 0] */
export function pathToRoot(t: EvoTree, i: number): number[] {
    const out: number[] = [];
    for (let c = i; c >= 0; c = t.nodes[c].parent) out.push(c);
    return out;
}

export function isAncestor(t: EvoTree, anc: number, desc: number): boolean {
    for (let c = desc; c >= 0; c = t.nodes[c].parent) if (c === anc) return true;
    return false;
}

export function mrca(t: EvoTree, a: number, b: number): number {
    const pa = new Set(pathToRoot(t, a));
    for (let c = b; c >= 0; c = t.nodes[c].parent) if (pa.has(c)) return c;
    return 0;
}

export function siblingsOf(t: EvoTree, i: number): number[] {
    const p = t.nodes[i].parent;
    return p < 0 ? [] : t.nodes[p].children.filter(c => c !== i);
}

export function leavesOf(t: EvoTree, i: number): number[] {
    const out: number[] = [];
    const walk = (c: number) => { const n = t.nodes[c]; if (n.isLeaf) out.push(c); else n.children.forEach(walk); };
    walk(i);
    return out;
}

/** Dàn ý kiểu target-tree.txt (2 dấu cách mỗi cấp, `*` bỏ qua) — dùng cho test đối chiếu. */
export function outline(t: EvoTree): string[] {
    return t.nodes.map(n => `${'  '.repeat(n.depth)}${n.id}`);
}
