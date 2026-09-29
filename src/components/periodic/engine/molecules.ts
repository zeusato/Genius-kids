// Bếp phân tử: ghép nguyên tử theo số lượng → nhận ra phân tử quen thuộc. TS thuần.

export type Atom = 'H' | 'C' | 'N' | 'O' | 'Na' | 'Cl';
export const ATOMS: { id: Atom; z: number; color: string; name: string; valence: number }[] = [
    { id: 'H', z: 1, color: '#f8fafc', name: 'Hydrogen', valence: 1 },
    { id: 'C', z: 6, color: '#3f3f46', name: 'Carbon', valence: 4 },
    { id: 'N', z: 7, color: '#3b82f6', name: 'Nitơ', valence: 3 },
    { id: 'O', z: 8, color: '#ef4444', name: 'Oxygen', valence: 2 },
    { id: 'Na', z: 11, color: '#a855f7', name: 'Natri', valence: 1 },
    { id: 'Cl', z: 17, color: '#22c55e', name: 'Chlorine', valence: 1 },
];

export type Counts = Partial<Record<Atom, number>>;

export interface Recipe {
    id: string; formula: string; name: string; emoji: string; use: string;
    counts: Counts;
    atoms: [Atom, number, number, number][];      // nguyên tử + tọa độ (đơn vị ~ Å/1,2)
    bonds: [number, number, number][];            // [i, j, bậc liên kết]
    ionic?: boolean;
}

const r = (a: Atom, x: number, y: number, z = 0): [Atom, number, number, number] => [a, x, y, z];

export const RECIPES: Recipe[] = [
    { id: 'h2', formula: 'H₂', name: 'Khí hydrogen', emoji: '🚀', use: 'Nhiên liệu tên lửa, nhẹ nhất trong các khí.', counts: { H: 2 }, atoms: [r('H', -0.37, 0), r('H', 0.37, 0)], bonds: [[0, 1, 1]] },
    { id: 'o2', formula: 'O₂', name: 'Khí oxygen', emoji: '🫁', use: 'Khí em hít thở mỗi ngày.', counts: { O: 2 }, atoms: [r('O', -0.6, 0), r('O', 0.6, 0)], bonds: [[0, 1, 2]] },
    { id: 'n2', formula: 'N₂', name: 'Khí nitơ', emoji: '💨', use: 'Chiếm gần 4/5 không khí.', counts: { N: 2 }, atoms: [r('N', -0.55, 0), r('N', 0.55, 0)], bonds: [[0, 1, 3]] },
    { id: 'cl2', formula: 'Cl₂', name: 'Khí chlorine', emoji: '🏊', use: 'Khử trùng nước bể bơi (rất độc khi hít phải).', counts: { Cl: 2 }, atoms: [r('Cl', -0.8, 0), r('Cl', 0.8, 0)], bonds: [[0, 1, 1]] },
    { id: 'h2o', formula: 'H₂O', name: 'Nước', emoji: '💧', use: 'Mọi sinh vật đều cần nước.', counts: { H: 2, O: 1 }, atoms: [r('O', 0, 0.2), r('H', -0.76, -0.4), r('H', 0.76, -0.4)], bonds: [[0, 1, 1], [0, 2, 1]] },
    { id: 'h2o2', formula: 'H₂O₂', name: 'Nước oxy già', emoji: '🩹', use: 'Sát trùng vết thương nhỏ.', counts: { H: 2, O: 2 }, atoms: [r('O', -0.6, 0.1, 0), r('O', 0.6, -0.1, 0), r('H', -1.0, -0.6, 0.5), r('H', 1.0, 0.6, 0.5)], bonds: [[0, 1, 1], [0, 2, 1], [1, 3, 1]] },
    { id: 'co2', formula: 'CO₂', name: 'Khí carbon dioxide', emoji: '🥤', use: 'Làm nước ngọt sủi bọt; cây xanh hút vào để lớn.', counts: { C: 1, O: 2 }, atoms: [r('C', 0, 0), r('O', -1.16, 0), r('O', 1.16, 0)], bonds: [[0, 1, 2], [0, 2, 2]] },
    { id: 'co', formula: 'CO', name: 'Khí carbon monoxide', emoji: '⚠️', use: 'Khí độc không màu khi than cháy thiếu không khí — phải mở cửa thông gió!', counts: { C: 1, O: 1 }, atoms: [r('C', -0.56, 0), r('O', 0.56, 0)], bonds: [[0, 1, 3]] },
    { id: 'ch4', formula: 'CH₄', name: 'Khí methane', emoji: '🔥', use: 'Khí đốt nấu ăn, có trong khí biogas.', counts: { C: 1, H: 4 }, atoms: [r('C', 0, 0, 0), r('H', 0.63, 0.63, 0.63), r('H', -0.63, -0.63, 0.63), r('H', -0.63, 0.63, -0.63), r('H', 0.63, -0.63, -0.63)], bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]] },
    { id: 'nh3', formula: 'NH₃', name: 'Khí ammonia', emoji: '🌱', use: 'Làm phân bón đạm cho cây.', counts: { N: 1, H: 3 }, atoms: [r('N', 0, 0.3, 0), r('H', 0.94, -0.1, 0), r('H', -0.47, -0.1, 0.81), r('H', -0.47, -0.1, -0.81)], bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1]] },
    { id: 'hcl', formula: 'HCl', name: 'Hydrogen chloride', emoji: '🧪', use: 'Tan trong nước thành acid, có trong dịch dạ dày giúp tiêu hóa.', counts: { H: 1, Cl: 1 }, atoms: [r('H', -0.64, 0), r('Cl', 0.64, 0)], bonds: [[0, 1, 1]] },
    { id: 'o3', formula: 'O₃', name: 'Khí ozone', emoji: '🛡️', use: 'Tầng ozone trên cao che tia cực tím cho Trái Đất.', counts: { O: 3 }, atoms: [r('O', 0, 0.35), r('O', -1.08, -0.3), r('O', 1.08, -0.3)], bonds: [[0, 1, 2], [0, 2, 1]] },
    { id: 'nacl', formula: 'NaCl', name: 'Muối ăn', emoji: '🧂', use: 'Hạt muối là những khối lập phương: Na⁺ và Cl⁻ xếp xen kẽ.', counts: { Na: 1, Cl: 1 }, ionic: true, atoms: [], bonds: [] },
];

export function matchRecipe(c: Counts): Recipe | null {
    const norm = (x: Counts) => ATOMS.map(a => x[a.id] ?? 0).join(',');
    const k = norm(c);
    return RECIPES.find(rc => norm(rc.counts) === k) ?? null;
}

/** Gợi ý khi chưa khớp: công thức gần nhất (ít chênh nguyên tử nhất). */
export function nearestRecipe(c: Counts): Recipe {
    let best = RECIPES[0], bd = Infinity;
    for (const rc of RECIPES) {
        const d = ATOMS.reduce((s, a) => s + Math.abs((rc.counts[a.id] ?? 0) - (c[a.id] ?? 0)), 0);
        if (d < bd) { bd = d; best = rc; }
    }
    return best;
}
