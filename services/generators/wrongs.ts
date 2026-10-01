// ============================================================================
//  Đáp án nhiễu dựa trên LỖI SAI THƯỜNG GẶP của học sinh (thay cho ±n ngẫu nhiên).
//  Mỗi hàm trả danh sách ứng viên; kit.single() tự lọc trùng / âm / ngoài biên.
// ============================================================================
import { rint } from './kit';

/** Số lân cận: n±1..spread (bỏ n). */
export function nearby(n: number, spread = 3): number[] {
    const out: number[] = [];
    for (let d = 1; d <= spread; d++) out.push(n + d, n - d);
    return out;
}

const digits = (n: number) => String(Math.abs(Math.trunc(n))).split('').map(Number);
const fromDigits = (ds: number[]) => Number(ds.join(''));

/** Cộng/trừ theo cột nhưng QUÊN NHỚ / QUÊN MƯỢN. */
export function carryError(a: number, b: number, op: '+' | '-'): number[] {
    const A = digits(a).reverse(), B = digits(b).reverse();
    const len = Math.max(A.length, B.length);
    const noCarry: number[] = [];
    const absDiff: number[] = [];
    for (let i = 0; i < len; i++) {
        const x = A[i] ?? 0, y = B[i] ?? 0;
        noCarry.push(op === '+' ? (x + y) % 10 : (x - y + 10) % 10);
        absDiff.push(Math.abs(x - y)); // trừ "số lớn trừ số bé" ở từng cột
    }
    const res = [fromDigits(noCarry.reverse())];
    if (op === '-') res.push(fromDigits(absDiff.reverse()));
    const exact = op === '+' ? a + b : a - b;
    res.push(exact + (op === '+' ? 10 : -10), exact + (op === '+' ? -10 : 10)); // nhớ thừa / nhớ thiếu 1 chục
    return res;
}

/** Sai hàng: ×10, :10, lệch 1 ở hàng chục/trăm. */
export function placeError(n: number): number[] {
    const out = [n * 10];
    if (n % 10 === 0) out.push(n / 10);
    out.push(n + 10, n - 10);
    if (Math.abs(n) >= 100) out.push(n + 100, n - 100);
    if (Math.abs(n) >= 1000) out.push(n + 1000, n - 1000);
    return out;
}

/** Đảo chữ số (45 ↔ 54, 312 → 321…). */
export function swapDigits(n: number): number[] {
    const ds = digits(n);
    const out: number[] = [];
    for (let i = 0; i < ds.length - 1; i++) {
        const c = [...ds];
        [c[i], c[i + 1]] = [c[i + 1], c[i]];
        if (c[0] !== 0) out.push(fromDigits(c));
    }
    return out;
}

/** Nhầm phép tính. */
export function opError(a: number, b: number, op: '+' | '-' | '×' | ':'): number[] {
    const all = { '+': a + b, '-': a - b, '×': a * b, ':': b ? a / b : NaN };
    return Object.entries(all).filter(([k, v]) => k !== op && Number.isInteger(v) && v >= 0).map(([, v]) => v);
}

/** Lệch 1 đơn vị (đếm thiếu/thừa). */
export const offByOne = (n: number): number[] => [n + 1, n - 1];

/** Quên đổi đơn vị / đổi sai bậc. */
export const unitError = (value: number, factor: number): number[] =>
    [value, value * factor * 10, value * factor / 10, value * factor + factor].filter(v => Number.isFinite(v));

/** Bảng nhân: tích lân cận trong bảng (a×(b±1), (a±1)×b). */
export const tableNeighbors = (a: number, b: number): number[] => [a * (b + 1), a * (b - 1), (a + 1) * b, (a - 1) * b, a + b];

/** Thương & số dư sai nhưng LUÔN có số dư < số chia. */
export function remainderError(q: number, r: number, d: number): [number, number][] {
    const out: [number, number][] = [[q + 1, r], [q - 1, r], [q, (r + 1) % d], [q, Math.max(0, r - 1)]];
    if (d > 2) out.push([q, rint(0, d - 1)]);
    return out.filter(([qq, rr]) => qq >= 0 && rr < d && !(qq === q && rr === r));
}

/** Lỗi phân số khi cộng: cộng cả tử lẫn mẫu (a+c)/(b+d), giữ tử nhân… trả về [tử, mẫu]. */
export function fractionErrors(a: number, b: number, c: number, d: number, op: '+' | '-'): [number, number][] {
    const out: [number, number][] = [];
    if (op === '+') out.push([a + c, b + d], [a + c, b], [a * d + c * b, b + d]);
    else out.push([Math.abs(a - c), Math.abs(b - d) || b], [Math.abs(a - c), b * d]);
    return out.filter(([x, y]) => y > 0 && x >= 0);
}
