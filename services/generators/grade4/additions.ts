// Lớp 4 — Phép cộng, phép trừ (g4_add_sub): số có nhiều chữ số; tính chất giao hoán, kết hợp; biểu thức chứa chữ.
import { tpl, fromTemplates, single, compare, input, rint, pickOne, chance } from '../kit';
import { carryError } from '../wrongs';
import { generateWrongAnswersWithSameUnits as sameUnits } from '../distractors';
import { fmt } from '../../study/value';
import { columnSteps } from '../grade2/common';
import type { Template } from '../../study/types';

export const templates: Template[] = [
    tpl('g4.addsub', 1, () => {
        const op = chance(0.5) ? '+' : '-', a = rint(10000, 99999), b = op === '+' ? rint(1000, 99999) : rint(1000, a - 1), r = op === '+' ? a + b : a - b;
        return single({ q: `${fmt(a)} ${op} ${fmt(b)} = ?`, correct: r, wrong: [...carryError(a, b, op), ...sameUnits(r, 3, 1000)], min: 0,
            explanation: `Đặt tính thẳng hàng, tính từ phải sang trái: ${fmt(a)} ${op} ${fmt(b)} = ${fmt(r)}.`, steps: columnSteps(a, b, op), hint: 'Nhớ / mượn 1 khi cần.' });
    }, { weight: 2 }),
    tpl('g4.addsub', 2, () => {
        const op = chance(0.5) ? '+' : '-', a = rint(100000, 999999), b = op === '+' ? rint(10000, 999999) : rint(10000, a - 1), r = op === '+' ? a + b : a - b;
        if (chance(0.5)) return input({ q: `Đặt tính rồi tính: ${fmt(a)} ${op} ${fmt(b)}`, visual: { fn: 'columnArithSVG', args: [a, b, op] }, correct: r, explanation: `Đặt tính thẳng hàng: ${fmt(a)} ${op} ${fmt(b)} = ${fmt(r)}.`, steps: columnSteps(a, b, op) });
        const kind = rint(0, 1);
        return input({ q: kind ? `Tìm số thích hợp: ? + ${fmt(b)} = ${fmt(a + b)}` : `Tìm số thích hợp: ? - ${fmt(b)} = ${fmt(a)}`, correct: kind ? a : a + b,
            explanation: kind ? `Muốn tìm số hạng, lấy tổng trừ số hạng kia: ${fmt(a + b)} - ${fmt(b)} = ${fmt(a)}.` : `Muốn tìm số bị trừ, lấy hiệu cộng số trừ: ${fmt(a)} + ${fmt(b)} = ${fmt(a + b)}.` });
    }),
    tpl('g4.addsub', 3, () => {
        const a = rint(1000, 9000) * 10, b = rint(500, 4000) * 10, c = rint(300, Math.floor(a / 20)) * 10, r = a + b - c;
        const place = pickOne(['Một nhà máy', 'Một cửa hàng', 'Một trang trại']);
        return single({ q: `${place} tháng trước sản xuất được ${fmt(a)} sản phẩm, tháng này nhiều hơn tháng trước ${fmt(b)} sản phẩm nhưng có ${fmt(c)} sản phẩm bị lỗi. Hỏi tháng này có bao nhiêu sản phẩm đạt?`,
            correct: r, wrong: [a + b, a - c, a + b + c, ...sameUnits(r, 2, 1000)], min: 0,
            explanation: `Tháng này sản xuất: ${fmt(a)} + ${fmt(b)} = ${fmt(a + b)}. Sản phẩm đạt: ${fmt(a + b)} - ${fmt(c)} = ${fmt(r)}.`,
            steps: [`Tháng này sản xuất: ${fmt(a)} + ${fmt(b)} = ${fmt(a + b)} (sản phẩm)`, `Sản phẩm đạt: ${fmt(a + b)} - ${fmt(c)} = ${fmt(r)} (sản phẩm)`, `Đáp số: ${fmt(r)} sản phẩm`] });
    }),
    tpl('g4.properties_add', 2, () => {
        const p = rint(101, 899), q = 1000 - p, a = rint(1000, 9000);
        return single({ q: `Tính bằng cách thuận tiện: ${fmt(p)} + ${fmt(a)} + ${fmt(q)} = ?`, correct: p + a + q, wrong: [a + 100, a + p, ...sameUnits(p + a + q, 3, 100)], min: 0,
            explanation: `Đổi chỗ và nhóm: (${fmt(p)} + ${fmt(q)}) + ${fmt(a)} = 1000 + ${fmt(a)} = ${fmt(p + a + q)}.`, steps: [`${fmt(p)} + ${fmt(q)} = 1000`, `1000 + ${fmt(a)} = ${fmt(p + a + q)}`], hint: 'Tìm hai số cộng lại tròn nghìn.' });
    }),
    tpl('g4.properties_add', 3, () => {
        const a = rint(10000, 50000), b = rint(1000, 50000), same = chance(0.5), right = same ? a : a + rint(1, 9000) * pickOne([1, -1]);
        return compare({ q: `Không tính, điền dấu >, <, =: ${fmt(a)} + ${fmt(b)} ... ${fmt(b)} + ${fmt(right)}`, left: a + b, right: b + right,
            explanation: same ? 'Tính chất giao hoán: đổi chỗ các số hạng thì tổng không đổi, nên điền dấu =.' : `Hai tổng có chung số hạng ${fmt(b)}; so sánh ${fmt(a)} với ${fmt(right)}: ${a > right ? 'điền dấu >' : 'điền dấu <'}.`,
            hint: 'Đổi chỗ các số hạng trong một tổng thì tổng không thay đổi.' });
    }),
    tpl('g4.letter_expr', 2, () => {
        const a = rint(10, 999), b = rint(10, 999), kind = rint(0, 2);
        if (kind === 0) return single({ q: `Tính giá trị của biểu thức a + b với a = ${fmt(a)}, b = ${fmt(b)}.`, correct: a + b, wrong: [Math.abs(a - b), a * 10 + b, a + b + 10, a + b - 10], min: 0, explanation: `Thay chữ bằng số: a + b = ${fmt(a)} + ${fmt(b)} = ${fmt(a + b)}.` });
        if (kind === 1) { const [x, y] = a > b ? [a, b] : [b, a]; return single({ q: `Tính giá trị của biểu thức a - b với a = ${fmt(x)}, b = ${fmt(y)}.`, correct: x - y, wrong: [x + y, x - y + 10, x - y - 10, y], min: 0, explanation: `a - b = ${fmt(x)} - ${fmt(y)} = ${fmt(x - y)}.` }); }
        const k = rint(2, 9), m = rint(5, 99);
        return single({ q: `Tính giá trị của biểu thức ${k} × n + ${m} với n = ${a % 100 + 1}.`, correct: k * (a % 100 + 1) + m, wrong: [k * ((a % 100 + 1) + m), k + (a % 100 + 1) + m, k * (a % 100 + 1), k * (a % 100 + 1) + m + k], min: 0,
            explanation: `Thay n = ${a % 100 + 1}: ${k} × ${a % 100 + 1} + ${m} = ${k * (a % 100 + 1)} + ${m} = ${k * (a % 100 + 1) + m}.`, hint: 'Nhân trước, cộng sau.' });
    }),
];

export const generateAddSub = fromTemplates(templates);
