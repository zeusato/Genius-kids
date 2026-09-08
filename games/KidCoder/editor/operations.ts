import { ProgramNode } from '../engine/model';
export interface Slot { parent: string | null; branch: 'body' | 'otherwise'; index: number }
export function findNode(nodes: ProgramNode[], id: string): ProgramNode | undefined {
    for (const n of nodes) {
        if (n.id === id) return n;
        if (n.type === 'repeat' || n.type === 'if') { const match = findNode(n.body, id); if (match) return match; }
        if (n.type === 'if') { const match = findNode(n.otherwise, id); if (match) return match; }
    }
}
export function locate(nodes: ProgramNode[], id: string, parent: string | null = null, branch: Slot['branch'] = 'body'): Slot | undefined {
    for (let index = 0; index < nodes.length; index++) {
        const n = nodes[index]; if (n.id === id) return { parent, branch, index };
        if (n.type === 'repeat' || n.type === 'if') { const found = locate(n.body, id, n.id, 'body'); if (found) return found; }
        if (n.type === 'if') { const found = locate(n.otherwise, id, n.id, 'otherwise'); if (found) return found; }
    }
}
export function updateNode(nodes: ProgramNode[], id: string, change: (node: ProgramNode) => ProgramNode | null): ProgramNode[] {
    return nodes.flatMap(n => {
        if (n.id === id) { const updated = change(n); return updated ? [updated] : []; }
        return [n.type === 'repeat' ? { ...n, body: updateNode(n.body, id, change) } : n.type === 'if' ? { ...n, body: updateNode(n.body, id, change), otherwise: updateNode(n.otherwise, id, change) } : n];
    });
}
export function insertNode(nodes: ProgramNode[], slot: Slot, node: ProgramNode): ProgramNode[] {
    const insert = (items: ProgramNode[]) => [...items.slice(0, slot.index), node, ...items.slice(slot.index)];
    if (slot.parent === null) return insert(nodes);
    return updateNode(nodes, slot.parent, parent => parent.type === 'if' ? { ...parent, [slot.branch]: insert(parent[slot.branch]) } : parent.type === 'repeat' && slot.branch === 'body' ? { ...parent, body: insert(parent.body) } : parent);
}
export function moveNode(nodes: ProgramNode[], id: string, target: Slot): ProgramNode[] {
    const node = findNode(nodes, id), origin = locate(nodes, id);
    if (!node || !origin || target.parent === id || (target.parent && findNode([node], target.parent))) return nodes;
    const slot = { ...target };
    if (origin.parent === slot.parent && origin.branch === slot.branch && origin.index < slot.index) slot.index--;
    return insertNode(updateNode(nodes, id, () => null), slot, node);
}
