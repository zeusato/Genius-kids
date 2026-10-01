// Dùng chung cho generator Lớp 2.
import { fmt } from '../../study/value';
import { rint } from '../kit';

export const KIDS = ['Lan', 'Minh', 'An', 'Hoa', 'Nam', 'Mai', 'Bình', 'Linh', 'Hùng', 'Thảo'];
export const opWord = (op: string) => (op === '+' ? 'cộng' : op === '-' ? 'trừ' : op === '×' ? 'nhân' : 'chia');
export const say = (a: number, op: string, b: number) => `${a} ${opWord(op)} ${b} bằng bao nhiêu?`;

/** Cộng/trừ theo cột, lời giải kiểu SGK: "6 không trừ được 9, lấy 16 trừ 9 bằng 7, viết 7, nhớ 1; …". */
export function columnSteps(a: number, b: number, op: '+' | '-'): string[] {
    const da = String(a).split('').reverse().map(Number), db = String(b).split('').reverse().map(Number);
    const out: string[] = [];
    let carry = 0;
    for (let i = 0; i < Math.max(da.length, db.length); i++) {
        const x = da[i] ?? 0, hasY = i < db.length, y0 = db[i] ?? 0;
        if (op === '+') {
            const s = x + y0 + carry;
            const what = hasY ? `${x} cộng ${y0} bằng ${x + y0}${carry ? `, thêm 1 bằng ${s}` : ''}` : carry ? `${x} thêm 1 bằng ${s}` : `hạ ${x}`;
            out.push(`${what}${hasY || carry ? `, viết ${s % 10}${s >= 10 ? ' nhớ 1' : ''}` : ''}`);
            carry = s >= 10 ? 1 : 0;
        } else {
            const y = y0 + carry;
            const pre = carry ? (hasY ? `${y0} thêm 1 bằng ${y}; ` : '') : '';
            if (!hasY && !carry) { out.push(`hạ ${x}`); continue; }
            if (x < y) { out.push(`${pre}${x} không trừ được ${y}, lấy ${x + 10} trừ ${y} bằng ${x + 10 - y}, viết ${x + 10 - y}, nhớ 1`); carry = 1; }
            else { out.push(`${pre}${x} trừ ${y} bằng ${x - y}, viết ${x - y}`); carry = 0; }
        }
    }
    if (op === '+' && carry) out.push('viết 1');
    out[0] = out[0].charAt(0).toUpperCase() + out[0].slice(1);
    out.push(`Vậy ${fmt(a)} ${op} ${fmt(b)} = ${fmt(op === '+' ? a + b : a - b)}`);
    return out;
}

/** Hai số có nhớ (cộng) / có mượn (trừ) ở hàng đơn vị, kết quả trong [lo, hi]. */
export function withCarry(op: '+' | '-', aRange: [number, number], bRange: [number, number], hi = 100): [number, number] {
    for (;;) {
        const a = rint(...aRange), b = rint(...bRange);
        if (op === '+' && a % 10 + b % 10 >= 10 && a + b < hi) return [a, b];
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
