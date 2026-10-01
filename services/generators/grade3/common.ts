// Dùng chung cho generator Lớp 3.
import { rint } from '../kit';
import { fmt } from '../../study/value';
export { columnSteps } from '../grade2/common';

export const KIDS = ['Lan', 'Minh', 'An', 'Hoa', 'Nam', 'Mai', 'Bình', 'Linh', 'Hùng', 'Thảo'];
export const TABLES = [3, 4, 6, 7, 8, 9];

/** Số lượt nhớ khi nhân a (nhiều chữ số) với b (1 chữ số). */
export function mulCarries(a: number, b: number): number {
    let carry = 0, n = 0;
    for (const d of String(a).split('').reverse().map(Number)) { const p = d * b + carry; carry = Math.floor(p / 10); if (carry) n++; }
    return n;
}
/** a có `digits` chữ số, a × b nhớ không quá `maxCarry` lượt. */
export function mulOperand(digits: number, b: number, maxCarry = 1): number {
    for (;;) { const a = rint(10 ** (digits - 1), 10 ** digits - 1); if (mulCarries(a, b) <= maxCarry) return a; }
}
/** Các bước nhân theo hàng (số nhiều chữ số × số một chữ số). */
export function mulSteps(a: number, b: number): string[] {
    const names = ['đơn vị', 'chục', 'trăm', 'nghìn', 'chục nghìn'];
    const out: string[] = [];
    let carry = 0;
    String(a).split('').reverse().map(Number).forEach((d, i) => {
        const p = d * b + carry;
        out.push(`Hàng ${names[i]}: ${d} × ${b}${carry ? ` + ${carry} (nhớ)` : ''} = ${p}${p >= 10 && i < String(a).length - 1 ? `, viết ${p % 10} nhớ ${Math.floor(p / 10)}` : ''}`);
        carry = Math.floor(p / 10);
    });
    out.push(`Kết quả: ${fmt(a)} × ${b} = ${fmt(a * b)}`);
    return out;
}
