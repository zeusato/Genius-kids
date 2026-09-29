// Xưởng nguyên tử: (proton, nơtron, electron) → nguyên tố / đồng vị / điện tích / bền? TS thuần.

/** Đồng vị bền của Z = 1..20 (số khối A). Nguồn: NUBASE2020 / CIAAW. */
export const STABLE_ISOTOPES: Record<number, number[]> = {
    1: [1, 2], 2: [3, 4], 3: [6, 7], 4: [9], 5: [10, 11], 6: [12, 13], 7: [14, 15], 8: [16, 17, 18], 9: [19], 10: [20, 21, 22],
    11: [23], 12: [24, 25, 26], 13: [27], 14: [28, 29, 30], 15: [31], 16: [32, 33, 34, 36], 17: [35, 37], 18: [36, 38, 40],
    19: [39, 41], 20: [40, 42, 43, 44, 46],
};
// K-40 (1,25 tỷ năm) và Ca-48 (rất dài) là phóng xạ nhưng có trong tự nhiên; ở đây coi K-40 là không bền.

export interface Identity { z: number; A: number; charge: number; stable: boolean | null; ok: boolean }

export function identify(p: number, n: number, e: number): Identity {
    const A = p + n;
    const list = STABLE_ISOTOPES[p];
    return { z: p, A, charge: p - e, stable: p === 0 ? null : list ? list.includes(A) : null, ok: p > 0 };
}

export function chargeLabel(c: number): string {
    if (c === 0) return 'trung hòa';
    const s = Math.abs(c) === 1 ? '' : String(Math.abs(c));
    return c > 0 ? `ion ${s}+` : `ion ${s}−`;
}

export type BuilderGoal = { id: string; level: 1 | 2 | 3 | 4; z: number; A?: number; charge?: number; text: string };

export const BUILDER_GOALS: BuilderGoal[] = [
    { id: 'H', level: 1, z: 1, text: 'Tạo Hydrogen: chỉ cần 1 hạt proton đỏ!' },
    { id: 'He', level: 1, z: 2, text: 'Tạo Helium: 2 proton.' },
    { id: 'Li', level: 1, z: 3, text: 'Thêm hạt đỏ để có Lithium (3 proton).' },
    { id: 'C', level: 1, z: 6, text: 'Tạo Carbon: 6 proton.' },
    { id: 'Oa', level: 2, z: 8, charge: 0, text: 'Tạo nguyên tử Oxygen trung hòa: số electron bằng số proton.' },
    { id: 'Nea', level: 2, z: 10, charge: 0, text: 'Tạo Neon trung hòa — lớp ngoài cùng đủ 8 electron!' },
    { id: 'He4', level: 3, z: 2, A: 4, charge: 0, text: 'Tạo Helium-4 bền: 2 proton + 2 nơtron + 2 electron.' },
    { id: 'C12', level: 3, z: 6, A: 12, charge: 0, text: 'Tạo Carbon-12 bền.' },
    { id: 'N14', level: 3, z: 7, A: 14, charge: 0, text: 'Tạo Nitơ-14 bền.' },
    { id: 'Na+', level: 4, z: 11, A: 23, charge: 1, text: 'Tạo ion Na⁺: natri mất 1 electron.' },
    { id: 'Cl-', level: 4, z: 17, A: 35, charge: -1, text: 'Tạo ion Cl⁻: chlorine nhận thêm 1 electron.' },
];

export function goalMet(g: BuilderGoal, p: number, n: number, e: number): boolean {
    const id = identify(p, n, e);
    if (id.z !== g.z) return false;
    if (g.A !== undefined && id.A !== g.A) return false;
    if (g.charge !== undefined && id.charge !== g.charge) return false;
    return true;
}
