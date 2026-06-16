// ============================================================================
//  RNG có hạt giống (seeded) — để map TÁI LẬP được và TEST được.
//  Thay cho Math.random() rải rác (không tất định). Tầng UI cấp seed (vd
//  Date.now() MỘT lần) — đó là code ứng dụng, được phép.
//  (Mượn nguyên pattern mulberry32 của games/GearsGame/engine/rng.ts.)
// ============================================================================

export type Rng = () => number;

/** mulberry32: nhanh, đủ tốt cho game, tất định theo seed. */
export const makeRng = (seed: number): Rng => {
    let s = seed >>> 0;
    return () => {
        s = (s + 0x6d2b79f5) | 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
};

/** Số nguyên trong [min, max). */
export const randInt = (rng: Rng, min: number, max: number): number =>
    Math.floor(rng() * (max - min)) + min;

/** Chọn ngẫu nhiên 1 phần tử. */
export const pick = <T>(rng: Rng, arr: readonly T[]): T => arr[randInt(rng, 0, arr.length)];
