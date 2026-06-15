// ============================================================================
//  Dựng ĐỒ THỊ kết nối tường minh từ bố cục.
//  - Cạnh ăn khớp răng (mesh): tự suy từ hình học, sign = -1 (đảo chiều).
//  - Cạnh dây đai (belt): tường minh từ layout.belts; thẳng = +1, chéo = -1.
//  Tách hẳn bước "dựng đồ thị" khỏi bước "giải" (simulate) — đồ thị chỉ đổi khi
//  bố cục đổi, không dựng lại mỗi khung hình như code cũ (O(N^2) mỗi tick).
// ============================================================================

import { MESH_TOL_MIN, MESH_TOL_RATIO } from './constants';
import { GearLayout, GearSpec } from './types';

export type EdgeKind = 'mesh' | 'belt' | 'belt-crossed';

export interface Edge {
    to: string;
    sign: -1 | 1; // chiều: -1 đảo, +1 giữ nguyên so với đỉnh nguồn
    kind: EdgeKind;
}

export interface Graph {
    gears: Map<string, GearSpec>;
    adj: Map<string, Edge[]>;
}

export const distance = (a: { x: number; y: number }, b: { x: number; y: number }): number =>
    Math.hypot(a.x - b.x, a.y - b.y);

/** Hai bánh răng có ăn khớp không — dung sai TƯƠNG ĐỐI theo kích thước. */
export const areMeshing = (g1: GearSpec, g2: GearSpec): boolean => {
    const ideal = g1.radius + g2.radius;
    const tol = Math.max(MESH_TOL_MIN, ideal * MESH_TOL_RATIO);
    return Math.abs(distance(g1, g2) - ideal) <= tol;
};

export const buildGraph = (layout: GearLayout): Graph => {
    const gears = new Map(layout.gears.map((g) => [g.id, g]));
    const adj = new Map<string, Edge[]>();
    for (const g of layout.gears) adj.set(g.id, []);

    const addEdge = (a: string, b: string, sign: -1 | 1, kind: EdgeKind) => {
        adj.get(a)?.push({ to: b, sign, kind });
        adj.get(b)?.push({ to: a, sign, kind });
    };

    // Cạnh ăn khớp răng — tự suy, duyệt từng cặp một lần.
    const arr = layout.gears;
    for (let i = 0; i < arr.length; i++) {
        for (let j = i + 1; j < arr.length; j++) {
            if (areMeshing(arr[i], arr[j])) addEdge(arr[i].id, arr[j].id, -1, 'mesh');
        }
    }

    // Cạnh dây đai — tường minh.
    for (const belt of layout.belts) {
        if (!gears.has(belt.a) || !gears.has(belt.b)) continue;
        addEdge(belt.a, belt.b, belt.kind === 'belt-crossed' ? -1 : 1, belt.kind);
    }

    return { gears, adj };
};
