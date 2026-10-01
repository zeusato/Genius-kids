// Lớp 2 — Các số đến 1000 (g2_numbers_1000): trăm – chục – đơn vị, số tròn trăm, tia số, so sánh, sắp xếp.
import { tpl, fromTemplates, single, compare, choices, input, order, rint, chance, shuffle, sample } from '../kit';
import { around, swapDigits, placeError } from '../wrongs';
import { readNumberVN } from '../../study/value';
import type { Template } from '../../study/types';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const parts = (n: number) => [Math.floor(n / 100), Math.floor((n % 100) / 10), n % 10];

export const templates: Template[] = [
    tpl('g2.numbers1000', 1, () => {
        const n = rint(101, 999), [h, t, u] = parts(n);
        return single({ q: 'Hình vẽ biểu diễn số nào?', speech: 'Mỗi tấm vuông là một trăm, mỗi thanh là một chục, mỗi ô nhỏ là một đơn vị. Hình vẽ biểu diễn số nào?',
            visual: { fn: 'placeValueSVG', args: [n] }, correct: n, wrong: [...swapDigits(n), h * 100 + u * 10 + t, ...placeError(n).slice(2)], min: 100, max: 999,
            explanation: `${h} trăm, ${t} chục và ${u} đơn vị là ${n}.`, hint: 'Đếm số tấm trăm, số thanh chục, số ô đơn vị.' });
    }),
    tpl('g2.numbers1000', 1, () => {
        const n = rint(101, 999);
        return chance(0.5)
            ? choices({ q: `Số ${n} đọc là:`, speech: `Chọn cách đọc đúng của số ${n}.`, correct: cap(readNumberVN(n)),
                options: shuffle([...new Set([n, ...swapDigits(n).slice(0, 2), n + 10 <= 999 ? n + 10 : n - 10].map(x => cap(readNumberVN(x))))]),
                explanation: `Đọc từ hàng trăm đến hàng đơn vị: ${readNumberVN(n)}.` })
            : input({ q: `Viết số: ${readNumberVN(n)}`, speech: `Viết số ${readNumberVN(n)}.`, correct: n, explanation: `${cap(readNumberVN(n))} viết là ${n}.` });
    }),
    tpl('g2.numbers1000', 2, () => {
        const n = rint(101, 999), [h, t, u] = parts(n);
        if (chance(0.4)) {
            const start = rint(1, 6) * 100, k = rint(1, 3), seq = [0, 1, 2, 3].map(i => start + i * 100);
            return single({ q: `Điền số tròn trăm còn thiếu: ${seq.map((x, i) => (i === k ? '__' : x)).join(', ')}`, speech: `Điền số tròn trăm còn thiếu: ${seq.map((x, i) => (i === k ? 'ô trống' : x)).join(', ')}`,
                correct: seq[k], wrong: [seq[k] + 10, seq[k] - 10, ...around(seq[k], { step: 100, min: 100, max: 1000 })], min: 100, max: 1000, explanation: `Các số tròn trăm hơn kém nhau 100: ${seq.join(', ')}.` });
        }
        return single({ q: `Số gồm ${h} trăm, ${t} chục và ${u} đơn vị là:`, speech: `Số gồm ${h} trăm, ${t} chục và ${u} đơn vị là số nào?`,
            correct: n, wrong: [h * 100 + u * 10 + t, u * 100 + t * 10 + h, h * 10 + t + u * 100, ...swapDigits(n)], min: 100, max: 999,
            explanation: `Viết lần lượt chữ số hàng trăm, hàng chục, hàng đơn vị: ${n}.` });
    }),
    tpl('g2.compare1000', 1, () => {
        const a = rint(100, 999), b = chance(0.5) ? Math.floor(a / 100) * 100 + rint(0, 99) : rint(100, 999);
        return compare({ q: `Điền dấu >, <, =: ${a} ... ${b}`, speech: `So sánh ${a} và ${b}.`, left: a, right: b,
            explanation: a === b ? 'Hai số giống hệt nhau nên điền dấu =.' : `So sánh lần lượt hàng trăm, hàng chục, hàng đơn vị: ${a} ${a > b ? '>' : '<'} ${b}.`, hint: 'So sánh hàng trăm trước; bằng nhau thì so hàng chục.' });
    }),
    tpl('g2.compare1000', 2, () => {
        const h = rint(1, 9) * 100, nums = sample(Array.from({ length: 100 }, (_, i) => h + i), 4).sort((x, y) => x - y), asc = chance(0.5);
        if (chance(0.5)) {
            const big = chance(0.5), ans = big ? Math.max(...nums) : Math.min(...nums);
            return single({ q: `Số nào ${big ? 'lớn nhất' : 'bé nhất'}: ${shuffle(nums).join('; ')}?`, speech: `Trong các số ${nums.join(', ')}, số nào ${big ? 'lớn nhất' : 'bé nhất'}?`,
                correct: ans, wrong: nums.filter(x => x !== ans), closed: true, explanation: `Các số cùng ${h / 100} trăm, so sánh hàng chục rồi hàng đơn vị: ${ans} ${big ? 'lớn nhất' : 'bé nhất'}.` });
        }
        const list = asc ? nums : [...nums].reverse();
        return order({ q: `Sắp xếp các số theo thứ tự từ ${asc ? 'bé đến lớn' : 'lớn đến bé'}.`, speech: `Sắp xếp các số theo thứ tự từ ${asc ? 'bé đến lớn' : 'lớn đến bé'}.`, items: list.map(String), explanation: `Thứ tự đúng: ${list.join(', ')}.` });
    }, { noRankCheck: true }),
];

export const generateG2Numbers1000 = fromTemplates(templates);
