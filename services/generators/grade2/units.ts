// Lớp 2 — Khối lượng, dung tích, độ dài (g2_units_measure): kg, lít, dm – m – km.
import { tpl, fromTemplates, single, choices, input, rint, pickOne, chance } from '../kit';
import { around } from '../wrongs';
import type { Template } from '../../study/types';

const OBJ: [string, string][] = [['🍉', 'Quả dưa'], ['🎃', 'Quả bí'], ['🍍', 'Quả dứa'], ['🎒', 'Cái cặp'], ['📦', 'Thùng hàng'], ['🧸', 'Gấu bông']];

export const templates: Template[] = [
    tpl('g2.kg', 1, () => {
        const [a, b] = [OBJ[rint(0, 2)], OBJ[rint(3, 5)]], wa = rint(1, 9), wb = pickOne([1, 2, 3, 4, 5, 6, 7, 8, 9].filter(x => x !== wa)), heavier = chance(0.5);
        const correct = (wa > wb) === heavier ? a[1] : b[1];
        return choices({ q: `Vật nào ${heavier ? 'nặng hơn' : 'nhẹ hơn'}?`, speech: `Quan sát cân. Vật nào ${heavier ? 'nặng hơn' : 'nhẹ hơn'}: ${a[1]} hay ${b[1]}?`,
            visual: { fn: 'balanceSVG', args: [{ e: a[0], w: wa }, { e: b[0], w: wb }] }, options: [a[1], b[1]], correct,
            explanation: 'Đĩa cân bên nào thấp xuống thì vật bên đó nặng hơn.' });
    }),
    tpl('g2.kg', 2, () => {
        const op = chance(0.5) ? '+' : '-', a = rint(20, 60), b = rint(5, op === '+' ? 35 : a - 5), r = op === '+' ? a + b : a - b;
        if (chance(0.5)) return single({ q: `Tính: ${a} kg ${op} ${b} kg = ?`, speech: `${a} ki-lô-gam ${op === '+' ? 'cộng' : 'trừ'} ${b} ki-lô-gam bằng bao nhiêu?`,
            correct: r, wrong: around(r, { min: 0, max: 100 }), format: x => `${x} kg`, min: 0, max: 100, explanation: `Tính như với số rồi ghi đơn vị kg: ${a} ${op} ${b} = ${r}, vậy ${r} kg.` });
        return single({ q: `Bao gạo thứ nhất nặng ${a} kg, bao thứ hai nặng hơn bao thứ nhất ${b} kg. Hỏi bao thứ hai nặng bao nhiêu ki-lô-gam?`, speech: `Bao gạo thứ nhất nặng ${a} ki-lô-gam, bao thứ hai nặng hơn ${b} ki-lô-gam. Hỏi bao thứ hai nặng bao nhiêu ki-lô-gam?`,
            correct: a + b, wrong: [Math.abs(a - b), ...around(a + b, { min: 0, max: 100 })], format: x => `${x} kg`, min: 0, max: 100,
            explanation: `Nặng hơn thì cộng: ${a} + ${b} = ${a + b} (kg).` });
    }),
    tpl('g2.liter', 1, () => {
        const a = rint(2, 9), b = rint(2, 9);
        return single({ q: `Can thứ nhất có ${a} l nước, can thứ hai có ${b} l nước. Cả hai can có bao nhiêu lít nước?`, speech: `Can thứ nhất có ${a} lít nước, can thứ hai có ${b} lít nước. Cả hai can có bao nhiêu lít nước?`,
            correct: a + b, wrong: [Math.abs(a - b), ...around(a + b, { min: 0, max: 30 })], format: x => `${x} l`, min: 0, max: 30, explanation: `Gộp lại: ${a} + ${b} = ${a + b} (l).` });
    }),
    tpl('g2.liter', 2, () => {
        const total = rint(10, 40), used = rint(2, total - 2);
        return single({ q: `Thùng có ${total} l nước. Mẹ dùng ${used} l để tưới cây. Hỏi thùng còn lại bao nhiêu lít nước?`, speech: `Thùng có ${total} lít nước. Mẹ dùng ${used} lít để tưới cây. Hỏi thùng còn lại bao nhiêu lít nước?`,
            correct: total - used, wrong: [total + used, ...around(total - used, { min: 0, max: 50 })], format: x => `${x} l`, min: 0, max: 80, explanation: `Bớt đi: ${total} - ${used} = ${total - used} (l).` });
    }),
    tpl('g2.length', 1, () => {
        const kind = pickOne([['m', 'dm', 10], ['dm', 'cm', 10], ['m', 'cm', 100]] as const), n = rint(2, 9), [big, small, f] = kind;
        return chance(0.5)
            ? input({ q: `Điền số: ${n} ${big} = ? ${small}`, speech: `${n} ${big === 'm' ? 'mét' : 'đề-xi-mét'} bằng bao nhiêu ${small === 'cm' ? 'xăng-ti-mét' : 'đề-xi-mét'}?`, correct: n * f, explanation: `1 ${big} = ${f} ${small}, nên ${n} ${big} = ${n * f} ${small}.`, hint: `Nhớ: 1 ${big} = ${f} ${small}.` })
            : single({ q: `${n} ${big} = ? ${small}`, speech: `${n} ${big === 'm' ? 'mét' : 'đề-xi-mét'} bằng bao nhiêu ${small === 'cm' ? 'xăng-ti-mét' : 'đề-xi-mét'}?`, correct: n * f, wrong: [n, n * f * 10, n * f / 10 >= 1 ? n * f / 10 : n + f, n + f], format: x => `${x} ${small}`, min: 1, max: 1000, explanation: `1 ${big} = ${f} ${small}, nên ${n} ${big} = ${n * f} ${small}.` });
    }),
    tpl('g2.length', 2, () => {
        const items: [string, string, string[]][] = [['Chiều dài cái bút chì', '15 cm', ['15 m', '15 km', '15 dm']], ['Chiều cao của cửa ra vào', '2 m', ['2 cm', '2 km', '2 dm']], ['Quãng đường từ Hà Nội đến Hải Phòng', '120 km', ['120 m', '120 cm', '120 dm']], ['Chiều dài gang tay của em', '1 dm', ['1 km', '1 m', '10 m']], ['Chiều dài bảng lớp học', '3 m', ['3 cm', '3 km', '30 dm']]];
        const [what, right, wrong] = pickOne(items);
        return choices({ q: `${what} khoảng bao nhiêu?`, speech: `${what} khoảng bao nhiêu?`, options: [right, ...wrong.filter(w => w !== '30 dm')].slice(0, 4), shuffle: true, correct: right,
            explanation: `${what} khoảng ${right}.`, hint: 'Hãy tưởng tượng vật thật: dùng cm, dm, m hay km cho hợp lí?' });
    }, { noRankCheck: true }),
];

export const generateG2Units = fromTemplates(templates);
