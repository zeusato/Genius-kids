// Lớp 2 — Cộng, trừ trong phạm vi 1000 (g2_add_sub_1000) — MỚI theo GDPT 2018 (nhớ không quá một lượt).
import { tpl, fromTemplates, single, input, rint, chance } from '../kit';
import { around, carryError } from '../wrongs';
import { columnSteps, noCarry, say } from './common';
import type { Template } from '../../study/types';

/** Có nhớ / mượn ĐÚNG một lượt (ở hàng đơn vị hoặc hàng chục). */
function oneCarry(op: '+' | '-'): [number, number] {
    for (;;) {
        const a = rint(100, 899), b = rint(10, 599);
        const da = [a % 10, Math.floor(a / 10) % 10, Math.floor(a / 100)], db = [b % 10, Math.floor(b / 10) % 10, Math.floor(b / 100)];
        if (op === '+') {
            if (a + b > 999) continue;
            let carry = 0, count = 0;
            for (let i = 0; i < 3; i++) { const s = da[i] + db[i] + carry; carry = s >= 10 ? 1 : 0; count += carry; }
            if (count === 1) return [a, b];
        } else {
            if (a <= b) continue;
            let borrow = 0, count = 0;
            for (let i = 0; i < 3; i++) { const t = da[i] - borrow; borrow = t < db[i] ? 1 : 0; count += borrow; }
            if (count === 1) return [a, b];
        }
    }
}

export const templates: Template[] = [
    tpl('g2.addsub1000', 1, () => {
        const op = chance(0.5) ? '+' : '-';
        if (chance(0.5)) { // tròn trăm
            const a = rint(1, 9) * 100, b = rint(1, 9) * 100, [x, y] = op === '+' ? (a + b <= 1000 ? [a, b] : [1000 - b, b]) : [Math.max(a, b), Math.min(a, b)];
            const res = op === '+' ? x + y : x - y;
            return single({ q: `Tính nhẩm: ${x} ${op} ${y} = ?`, speech: say(x, op, y), correct: res, wrong: around(res, { step: 100, min: 0, max: 1000 }), min: 0, max: 1000,
                explanation: `${x / 100} trăm ${op === '+' ? 'cộng' : 'trừ'} ${y / 100} trăm bằng ${res / 100} trăm: ${x} ${op} ${y} = ${res}.`, hint: 'Nhẩm với số trăm.' });
        }
        const [a, b] = noCarry(op, [100, 899], [10, 499], 999), res = op === '+' ? a + b : a - b;
        return single({ q: `Tính: ${a} ${op} ${b} = ?`, speech: say(a, op, b), correct: res, wrong: [...carryError(a, b, op), ...around(res, { min: 0, max: 999, step: chance(0.5) ? 1 : 10 })], min: 0, max: 999,
            explanation: `Cộng (trừ) theo từng hàng, không có nhớ: ${a} ${op} ${b} = ${res}.`, steps: columnSteps(a, b, op) });
    }),
    tpl('g2.addsub1000', 2, () => {
        const op = chance(0.5) ? '+' : '-', [a, b] = oneCarry(op), res = op === '+' ? a + b : a - b;
        return single({ q: `Tính: ${a} ${op} ${b} = ?`, speech: say(a, op, b), correct: res, wrong: [...carryError(a, b, op), ...around(res, { min: 0, max: 999, step: chance(0.5) ? 1 : 10 })], min: 0, max: 999,
            explanation: `Đặt tính thẳng cột, tính từ hàng đơn vị, nhớ (mượn) 1 khi cần: ${a} ${op} ${b} = ${res}.`, steps: columnSteps(a, b, op), hint: 'Có một lần nhớ (mượn) — đừng quên!' });
    }, { weight: 2 }),
    tpl('g2.addsub1000', 3, () => {
        const op = chance(0.5) ? '+' : '-', [a, b] = oneCarry(op), res = op === '+' ? a + b : a - b;
        if (chance(0.5)) return input({ q: `Đặt tính rồi tính: ${a} ${op} ${b}`, speech: `Đặt tính rồi tính ${a} ${op === '+' ? 'cộng' : 'trừ'} ${b}.`, visual: { fn: 'columnArithSVG', args: [a, b, op] }, correct: res,
            explanation: `Đặt tính thẳng cột: ${a} ${op} ${b} = ${res}.`, steps: columnSteps(a, b, op) });
        const places = ['Trường', 'Thư viện', 'Cửa hàng'][rint(0, 2)];
        const q = op === '+' ? `${places} có ${a} quyển sách, mua thêm ${b} quyển sách. Hỏi ${places.toLowerCase()} có tất cả bao nhiêu quyển sách?` : `${places} có ${a} quyển sách, đã cho mượn ${b} quyển. Hỏi ${places.toLowerCase()} còn lại bao nhiêu quyển sách?`;
        return single({ q, speech: q, correct: res, wrong: [...carryError(a, b, op), op === '+' ? Math.abs(a - b) : Math.min(999, a + b)], min: 0, max: 999,
            explanation: `${op === '+' ? 'Thêm vào: phép cộng' : 'Bớt đi: phép trừ'} ${a} ${op} ${b} = ${res} (quyển sách).`, steps: [`Số sách: ${a} ${op} ${b} = ${res} (quyển)`, `Đáp số: ${res} quyển sách`] });
    }),
];

export const generateG2AddSub1000 = fromTemplates(templates);
