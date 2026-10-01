// Dùng chung cho generator Lớp 2.
import { rint } from '../kit';

export const KIDS = ['Lan', 'Minh', 'An', 'Hoa', 'Nam', 'Mai', 'Bình', 'Linh', 'Hùng', 'Thảo'];
export const opWord = (op: string) => (op === '+' ? 'cộng' : op === '-' ? 'trừ' : op === '×' ? 'nhân' : 'chia');
export const say = (a: number, op: string, b: number) => `${a} ${opWord(op)} ${b} bằng bao nhiêu?`;

/** Cộng/trừ theo cột: mô tả từng hàng (có nhớ / mượn). */
export function columnSteps(a: number, b: number, op: '+' | '-'): string[] {
    const da = String(a).split('').reverse().map(Number), db = String(b).split('').reverse().map(Number);
    const names = ['đơn vị', 'chục', 'trăm', 'nghìn'];
    const out: string[] = [];
    let carry = 0;
    for (let i = 0; i < Math.max(da.length, db.length); i++) {
        const x = da[i] ?? 0, y = db[i] ?? 0;
        if (op === '+') {
            const s = x + y + carry;
            out.push(`Hàng ${names[i]}: ${x} + ${y}${carry ? ' + 1 (nhớ)' : ''} = ${s}${s >= 10 ? `, viết ${s % 10} nhớ 1` : ''}`);
            carry = s >= 10 ? 1 : 0;
        } else {
            let top = x - carry;
            const borrow = top < y;
            if (borrow) top += 10;
            out.push(`Hàng ${names[i]}: ${borrow ? `${x}${carry ? ' − 1' : ''} không trừ được ${y}, mượn 1 thành ${top}` : `${x}${carry ? ' − 1 (đã mượn)' : ''}`}; ${top} − ${y} = ${top - y}`);
            carry = borrow ? 1 : 0;
        }
    }
    if (op === '+' && carry) out.push('Viết 1 (nhớ) sang hàng tiếp theo');
    out.push(`Kết quả: ${op === '+' ? a + b : a - b}`);
    return out;
}

/** Hai số có nhớ (cộng) / có mượn (trừ) ở hàng đơn vị, kết quả trong [lo, hi]. */
export function withCarry(op: '+' | '-', aRange: [number, number], bRange: [number, number], hi = 100): [number, number] {
    for (;;) {
        const a = rint(...aRange), b = rint(...bRange);
        if (op === '+' && a % 10 + b % 10 >= 10 && a + b <= hi) return [a, b];
        if (op === '-' && a % 10 < b % 10 && a > b) return [a, b];
    }
}
export function noCarry(op: '+' | '-', aRange: [number, number], bRange: [number, number], hi = 100): [number, number] {
    for (;;) {
        const a = rint(...aRange), b = rint(...bRange);
        const sa = String(a).split('').reverse().map(Number), sb = String(b).split('').reverse().map(Number);
        const ok = op === '+' ? sa.every((x, i) => x + (sb[i] ?? 0) < 10) && a + b <= hi : a >= b && sb.every((y, i) => (sa[i] ?? 0) >= y);
        if (ok) return [a, b];
    }
}
