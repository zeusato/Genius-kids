// Lớp 5 — Số thập phân (g5_numbers): đọc, viết, hàng; so sánh, sắp xếp; làm tròn; viết số đo dưới dạng số thập phân.
import { tpl, fromTemplates, single, compare, choices, input, order, rint, pickOne, chance, shuffle } from '../kit';
import { readNumberVN } from '../../study/value';
import { dec, fix, fd } from './common';
import type { Template } from '../../study/types';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const PLACES = ['phần mười', 'phần trăm', 'phần nghìn'];

export const templates: Template[] = [
    tpl('g5.decimal_read', 1, () => {
        const x = dec(1, 999, rint(1, 3));
        if (chance(0.5)) return choices({ q: `Số thập phân ${fd(x)} đọc là:`, options: shuffle([...new Set([x, fix(x * 10), fix(x / 10), fix(x + 0.1)].map(v => cap(readNumberVN(v))))]), correct: cap(readNumberVN(x)),
            explanation: `Đọc phần nguyên, đọc "phẩy", rồi đọc phần thập phân: ${readNumberVN(x)}.` });
        return input({ q: `Viết số thập phân: ${readNumberVN(x)}`, correct: fd(x), answerKind: 'number', explanation: `${cap(readNumberVN(x))} viết là ${fd(x)}.`, hint: 'Phần nguyên viết trước dấu phẩy.' });
    }, { decimal: true }),
    tpl('g5.decimal_read', 2, () => {
        const x = dec(1, 99, 3), s = fd(x).split(',')[1] ?? '', k = rint(0, Math.max(0, s.length - 1)), d = s[k];
        if (!d) return single({ q: `Số ${fd(x)} có phần nguyên là:`, correct: Math.floor(x), wrong: [Math.floor(x) + 1, Math.floor(x * 10), Math.round(x * 100) % 100 || 3], explanation: `Phần nguyên là phần đứng trước dấu phẩy: ${Math.floor(x)}.` });
        return choices({ q: `Trong số ${fd(x)}, chữ số ${d} (thứ ${k + 1} sau dấu phẩy) thuộc hàng nào?`, options: shuffle([PLACES[k], ...PLACES.filter(p => p !== PLACES[k]), 'đơn vị']).slice(0, 4), correct: PLACES[k],
            explanation: `Sau dấu phẩy lần lượt là hàng phần mười, phần trăm, phần nghìn: chữ số thứ ${k + 1} thuộc hàng ${PLACES[k]}.` });
    }, { decimal: true }),
    tpl('g5.decimal_compare', 1, () => {
        const a = dec(1, 30, rint(1, 2)), b = chance(0.5) ? fix(Math.floor(a) + dec(0, 0.99, rint(1, 3))) : dec(1, 30, rint(1, 3));
        return compare({ q: `Điền dấu >, <, =: ${fd(a)} ... ${fd(b)}`, left: a, right: b,
            explanation: Math.floor(a) !== Math.floor(b) ? `So sánh phần nguyên trước: ${Math.floor(a)} ${a > b ? '>' : '<'} ${Math.floor(b)}.` : a === b ? 'Hai số bằng nhau.' : `Phần nguyên bằng nhau, so sánh lần lượt từng hàng của phần thập phân: ${fd(a)} ${a > b ? '>' : '<'} ${fd(b)}.`,
            hint: 'Số thập phân có nhiều chữ số hơn chưa chắc đã lớn hơn.' });
    }, { decimal: true }),
    tpl('g5.decimal_compare', 2, () => {
        const base = rint(1, 9), nums = [...new Set(Array.from({ length: 8 }, () => fix(base + dec(0, 0.99, rint(1, 3)))))].slice(0, 4), asc = chance(0.5);
        if (nums.length < 4) nums.push(fix(base + 0.5), fix(base + 0.05));
        const four = nums.slice(0, 4), sorted = [...four].sort((x, y) => (asc ? x - y : y - x));
        return order({ q: `Sắp xếp các số theo thứ tự từ ${asc ? 'bé đến lớn' : 'lớn đến bé'}.`, items: sorted.map(fd), explanation: `So sánh phần thập phân từng hàng: ${sorted.map(fd).join('; ')}.` });
    }, { decimal: true }),
    tpl('g5.decimal_round', 2, () => {
        const x = dec(1, 99, 3), place = pickOne([0, 1, 2]), p = 10 ** place, r = Math.round(x * p) / p;
        const name = ['số tự nhiên gần nhất', 'hàng phần mười', 'hàng phần trăm'][place];
        return single({ q: `Làm tròn số ${fd(x)} đến ${name}:`, correct: r, wrong: [fix(Math.floor(x * p) / p === r ? Math.ceil(x * p) / p : Math.floor(x * p) / p), fix(r + 1 / p), fix(r - 1 / p)].filter(v => v !== r && v >= 0), closed: true,
            explanation: `Xét chữ số ngay bên phải: ${Number(fd(x).replace(',', '.').split('.')[1]?.[place] ?? 0) >= 5 ? 'từ 5 trở lên → làm tròn lên' : 'bé hơn 5 → làm tròn xuống'}: ${fd(r)}.` });
    }, { decimal: true, noRankCheck: true }),
    tpl('g5.measure_decimal', 2, () => {
        const kind = pickOne([['m', 'cm', 100], ['kg', 'g', 1000], ['km', 'm', 1000], ['tấn', 'kg', 1000], ['m', 'dm', 10]] as const);
        const [big, small, f] = kind, a = rint(1, 20), b = rint(1, f - 1), r = fix(a + b / f);
        return single({ q: `${a} ${big} ${b} ${small} = ? ${big}`, correct: r, wrong: [fix(a + b / (f * 10)), fix(a + b / (f / 10)), fix(a + b / 100 === r ? a + b / 1000 : a + b / 100)].filter(v => v !== r), format: v => `${fd(v)} ${big}`, min: 0,
            explanation: `${b} ${small} = ${fd(fix(b / f))} ${big}, nên ${a} ${big} ${b} ${small} = ${fd(r)} ${big}.`, hint: `1 ${small} = ${fd(1 / f)} ${big}.` });
    }, { decimal: true }),
];

export const generateG5Numbers = fromTemplates(templates);
