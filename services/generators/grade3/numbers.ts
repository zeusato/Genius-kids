// Lớp 3 — Các số đến 100 000 (g3_numbers): đọc, viết, cấu tạo; so sánh, sắp xếp; làm tròn; chữ số La Mã.
import { tpl, fromTemplates, single, compare, choices, input, order, rint, pickOne, chance, shuffle, sample } from '../kit';
import { swapDigits } from '../wrongs';
import { fmt, readNumberVN } from '../../study/value';
import type { Template } from '../../study/types';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/** Số không có "lớp giữa toàn chữ số 0" (tránh cách đọc chưa thống nhất). */
const nice = (lo: number, hi: number) => { for (;;) { const n = rint(lo, hi); if (n < 1000 || n % 1000 !== 0 || n < 10000) return n; } };
const ROMAN: [number, string][] = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
const toRoman = (n: number) => { let s = ''; for (const [v, r] of ROMAN) while (n >= v) { s += r; n -= v; } return s; };
const PLACE = ['đơn vị', 'chục', 'trăm', 'nghìn', 'chục nghìn'];
const roundTo = (n: number, p: number) => Math.round(n / p) * p;

function readTpl(skill: 'g3.numbers10000' | 'g3.numbers100000', lo: number, hi: number) {
    return [
        tpl(skill, 1, () => {
            const n = nice(lo, hi);
            if (chance(0.5)) return choices({ q: `Số ${fmt(n)} đọc là:`, options: shuffle([...new Set([n, ...swapDigits(n).slice(0, 2), n + (n % 100 < 90 ? 10 : -10)].map(x => cap(readNumberVN(x))))]), correct: cap(readNumberVN(n)),
                explanation: `Đọc từ trái sang phải theo từng hàng: ${readNumberVN(n)}.` });
            return input({ q: `Viết số: ${readNumberVN(n)}`, correct: n, explanation: `${cap(readNumberVN(n))} viết là ${fmt(n)}.`, hint: 'Hàng nào không đọc tới thì viết chữ số 0.' });
        }),
        tpl(skill, 2, () => {
            const n = nice(lo, hi), ds = String(n).split('').map(Number), len = ds.length;
            if (chance(0.5)) {
                // chỉ hỏi chữ số xuất hiện đúng một lần (8348: chữ số 8 vừa ở hàng nghìn vừa ở hàng đơn vị)
                const once = ds.map((d, i) => i).filter(i => ds.filter(d => d === ds[i]).length === 1);
                const k = once.length ? pickOne(once) : 0, place = PLACE[len - 1 - k];
                return single({ q: `Trong số ${fmt(n)}, chữ số ${ds[k]} ở hàng nào?`, correct: place, wrong: PLACE.slice(0, len).filter(p => p !== place),
                    explanation: `Đếm từ phải sang trái: đơn vị, chục, trăm, nghìn${len > 4 ? ', chục nghìn' : ''}. Chữ số ${ds[k]} ở hàng ${place}.` });
            }
            const parts = ds.map((d, i) => d * 10 ** (len - 1 - i)).filter(x => x > 0);
            return choices({ q: `Viết số ${fmt(n)} thành tổng:`, options: shuffle([...new Set([parts.map(fmt).join(' + '), ds.filter(d => d).join(' + '), parts.map((x, i) => fmt(i === 0 ? x / 10 : x)).join(' + '), parts.map((x, i) => fmt(i === parts.length - 1 && x >= 10 ? x / 10 : x * (i === 1 ? 10 : 1))).join(' + ')])]),
                correct: parts.map(fmt).join(' + '), explanation: `${fmt(n)} = ${parts.map(fmt).join(' + ')}.` });
        }),
    ];
}

export const templates: Template[] = [
    ...readTpl('g3.numbers10000', 1001, 9999),
    ...readTpl('g3.numbers100000', 10001, 99999),
    tpl('g3.compare', 1, () => {
        const a = rint(1000, 99999), b = chance(0.5) ? Number(String(a).slice(0, -1) + rint(0, 9)) : rint(1000, 99999);
        return compare({ q: `Điền dấu >, <, =: ${fmt(a)} ... ${fmt(b)}`, left: a, right: b,
            explanation: a === b ? 'Hai số có các chữ số giống hệt nhau nên điền dấu =.' : String(a).length !== String(b).length ? `Số nào có nhiều chữ số hơn thì lớn hơn: ${fmt(a)} ${a > b ? '>' : '<'} ${fmt(b)}.` : `Cùng ${String(a).length} chữ số, so sánh lần lượt từ hàng cao nhất: ${fmt(a)} ${a > b ? '>' : '<'} ${fmt(b)}.`,
            hint: 'So sánh số chữ số trước, rồi so từng hàng từ trái sang phải.' });
    }),
    tpl('g3.compare', 2, () => {
        const base = rint(1, 9) * 10000, nums = sample(Array.from({ length: 9000 }, (_, i) => base + i), 4), big = chance(0.5);
        if (chance(0.5)) { const ans = big ? Math.max(...nums) : Math.min(...nums); return single({ q: `Số ${big ? 'lớn nhất' : 'bé nhất'} trong các số ${nums.map(fmt).join('; ')} là:`, correct: ans, wrong: nums.filter(x => x !== ans), closed: true, explanation: `So sánh lần lượt từng hàng: ${fmt(ans)} là số ${big ? 'lớn nhất' : 'bé nhất'}.` }); }
        const sorted = [...nums].sort((x, y) => (big ? y - x : x - y));
        return order({ q: `Sắp xếp các số theo thứ tự từ ${big ? 'lớn đến bé' : 'bé đến lớn'}.`, items: sorted.map(fmt), explanation: `Thứ tự đúng: ${sorted.map(fmt).join('; ')}.` });
    }, { noRankCheck: true }),
    tpl('g3.round', 2, () => {
        const p = pickOne([10, 100, 1000, 10000]), n = rint(p === 10000 ? 10001 : 1001, 99999), r = roundTo(n, p), pname = { 10: 'chục', 100: 'trăm', 1000: 'nghìn', 10000: 'chục nghìn' }[p];
        const wrong = [r + p, r - p, Math.floor(n / p) * p === r ? Math.ceil(n / p) * p : Math.floor(n / p) * p, r + 2 * p].filter(x => x > 0 && x !== r);
        return single({ q: `Làm tròn số ${fmt(n)} đến hàng ${pname}, ta được số:`, correct: r, wrong, min: 0,
            explanation: `Xét chữ số ngay bên phải hàng ${pname}: ${String(n).split('').reverse()[String(p).length - 2]} ${Number(String(n).split('').reverse()[String(p).length - 2]) >= 5 ? '≥ 5 nên làm tròn lên' : '< 5 nên làm tròn xuống'}: ${fmt(r)}.`,
            hint: 'Chữ số bên phải hàng cần làm tròn từ 5 trở lên thì làm tròn lên.' });
    }),
    tpl('g3.roman', 1, () => {
        const n = rint(1, 20), rn = toRoman(n);
        return single({ q: `Số La Mã ${rn} có giá trị là:`, correct: n, wrong: [n + 1, n - 1, n + 5, n - 5, n + 10].filter(x => x > 0 && x <= 25),
            explanation: `${rn} = ${n} (I = 1, V = 5, X = 10; chữ nhỏ đứng trước chữ lớn thì trừ, đứng sau thì cộng).` });
    }),
    tpl('g3.roman', 2, () => {
        const n = rint(1, 20), rn = toRoman(n);
        const wrongs = [toRoman(n + 1), toRoman(Math.max(1, n - 1)), n === 4 ? 'IIII' : n === 9 ? 'VIIII' : rn.split('').reverse().join(''), n >= 10 ? 'X' + toRoman(n - 9) : 'X' + rn].filter(w => w !== rn);
        return choices({ q: `Số ${n} viết bằng chữ số La Mã là:`, options: shuffle([...new Set([rn, ...wrongs])].slice(0, 4)), correct: rn, explanation: `${n} viết là ${rn}.` });
    }),
];

export const generateG3Numbers = fromTemplates(templates);
