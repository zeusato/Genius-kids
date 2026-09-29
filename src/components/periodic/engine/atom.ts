// Nguyên tử: lớp electron (Bohr kiểu SGK) và hạt nhân xếp khít tất định. TS thuần.
import { ISOTOPES } from '../../../data/periodic/isotopes';

/** RNG có seed (LCG) — không dùng Math.random để mô hình giống nhau mỗi lần mở. */
export function rng(seed: number): () => number {
    let s = (seed >>> 0) || 1;
    return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
}

export function nucleonCounts(z: number): { protons: number; neutrons: number; A: number } {
    const A = ISOTOPES[z]?.A ?? z * 2;
    return { protons: z, neutrons: A - z, A };
}

const cache = new Map<string, Float32Array>();

/**
 * Xếp A quả cầu bán kính r thành khối gần cầu: rải ngẫu nhiên (seed) trong cầu bán kính r·1,25·∛A·1,6,
 * rồi lặp đẩy nhau + kéo về tâm. Trả về xyz (A×3). Hạt 0..Z-1 là proton (đã trộn thứ tự để proton/nơtron
 * xen kẽ), dùng `protonMask` để tô màu.
 */
export function nucleusPack(Z: number, A: number, r = 1): Float32Array {
    const key = `${Z}/${A}/${r}`;
    const hit = cache.get(key);
    if (hit) return hit;
    const R = rng(Z * 1000 + A);
    const P = new Float32Array(A * 3);
    const rad = r * 1.25 * Math.cbrt(A) * 1.6;
    for (let i = 0; i < A; i++) {
        const u = R() * 2 - 1, t = R() * Math.PI * 2, rr = Math.cbrt(R()) * rad, s = Math.sqrt(1 - u * u);
        P[i * 3] = Math.cos(t) * s * rr; P[i * 3 + 1] = Math.sin(t) * s * rr; P[i * 3 + 2] = u * rr;
    }
    const d2 = (2 * r) * (2 * r);
    const iters = A > 150 ? 70 : 90;
    for (let it = 0; it < iters; it++) {
        for (let i = 0; i < A; i++) {
            for (let j = i + 1; j < A; j++) {
                const dx = P[i * 3] - P[j * 3], dy = P[i * 3 + 1] - P[j * 3 + 1], dz = P[i * 3 + 2] - P[j * 3 + 2];
                const q = dx * dx + dy * dy + dz * dz;
                if (q < d2) {
                    const L = Math.sqrt(q) + 1e-6, k = (2 * r - L) / L * 0.5;
                    P[i * 3] += dx * k; P[i * 3 + 1] += dy * k; P[i * 3 + 2] += dz * k;
                    P[j * 3] -= dx * k; P[j * 3 + 1] -= dy * k; P[j * 3 + 2] -= dz * k;
                }
            }
        }
        const pull = it < iters - 10 ? 0.985 : 1;
        for (let i = 0; i < A * 3; i++) P[i] *= pull;
    }
    cache.set(key, P);
    return P;
}

/** true = proton. Tất định, trộn đều để hai loại hạt xen kẽ. */
export function protonMask(Z: number, A: number): Uint8Array {
    const R = rng(Z * 7919 + A);
    const idx = Array.from({ length: A }, (_, i) => i);
    for (let i = A - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
    const m = new Uint8Array(A);
    for (let k = 0; k < Z; k++) m[idx[k]] = 1;
    return m;
}

/** Điền electron vào lớp theo quy tắc đơn giản cho Xưởng nguyên tử (2, 8, 8, 18…) — chỉ dùng khi e ≤ 20. */
export function simpleShells(e: number): number[] {
    const caps = [2, 8, 8, 18];
    const out: number[] = [];
    let left = e;
    for (const c of caps) { if (left <= 0) break; out.push(Math.min(c, left)); left -= c; }
    return out;
}
