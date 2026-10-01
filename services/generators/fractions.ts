// Tiện ích phân số dùng chung (Lớp 3–5).
import { generatorRandom } from './random';
export const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : Math.abs(a));
export const lcm = (a: number, b: number): number => (a / gcd(a, b)) * b;
/** Rút gọn; trả "a/b" hoặc số nguyên nếu mẫu = 1. */
export function fracText(n: number, d: number, simplify = true): string {
    if (d < 0) { n = -n; d = -d; }
    const g = simplify ? gcd(n, d) || 1 : 1;
    const [p, q] = [n / g, d / g];
    return q === 1 ? String(p) : `${p}/${q}`;
}
/** Phân số tối giản ngẫu nhiên tử ∈ [aLo, aHi], mẫu ∈ [bLo, bHi] (tránh đề "2/4", "8/2"). */
export function randomIrreducible(aLo: number, aHi: number, bLo: number, bHi: number): [number, number] {
    for (let i = 0; ; i++) {
        const a = aLo + Math.floor(generatorRandom() * (aHi - aLo + 1)), b = bLo + Math.floor(generatorRandom() * (bHi - bLo + 1));
        if (gcd(a, b) === 1 && b > 1 || i > 200) return [a, b];
    }
}
export const reduce = (n: number, d: number): [number, number] => { const g = gcd(n, d) || 1; return [n / g, d / g]; };

/** Phân số nhiễu ở CẢ HAI phía của n/d (lỗi thường gặp + lân cận), dạng chuỗi chưa rút gọn. */
export function fracNeighbors(n: number, d: number): string[] {
    const out = [`${n + 1}/${d}`, `${n + 2}/${d}`, `${n}/${d + 1}`, `${n}/${d * 2}`, `${n * 2}/${d}`, `${d}/${n || 1}`];
    if (n > 1) out.push(`${n - 1}/${d}`);
    if (n > 2) out.push(`${n - 2}/${d}`);
    if (d > 2 && d - 1 !== n) out.push(`${n}/${d - 1}`);
    // mẫu 1 viết thành số tự nhiên ("6/1" cạnh đáp án "5" sẽ lộ đáp án)
    return out.filter(f => !/(^0\/|\/0$)/.test(f)).map(f => f.replace(/^(\d+)\/1$/, '$1'));
}
