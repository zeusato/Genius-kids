// Lớp 4 — Số có nhiều chữ số (g4_large_numbers): đọc, viết đến lớp triệu; hàng – lớp; so sánh;
// làm tròn đến hàng trăm nghìn; số chẵn, số lẻ.
import { tpl, fromTemplates, single, compare, choices, input, multi, rint, pickOne, chance, shuffle, sample } from '../kit';
import { swapDigits } from '../wrongs';
import { fmt, readNumberVN } from '../../study/value';
import type { Template } from '../../study/types';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const PLACE = ['đơn vị', 'chục', 'trăm', 'nghìn', 'chục nghìn', 'trăm nghìn', 'triệu', 'chục triệu', 'trăm triệu'];
/** Số có `d` chữ số, không có lớp nghìn toàn chữ số 0 (cách đọc chưa thống nhất). */
const big = (d: number) => { for (;;) { const n = rint(10 ** (d - 1), 10 ** d - 1); if (d < 7 || Math.floor(n / 1000) % 1000 !== 0) return n; } };

export const templates: Template[] = [
    tpl('g4.read_write', 1, () => {
        const n = big(rint(6, 7));
        if (chance(0.5)) return choices({ q: `Số ${fmt(n)} đọc là:`, options: shuffle([...new Set([n, ...swapDigits(n).slice(0, 2), n + 10000].map(x => cap(readNumberVN(x))))]).slice(0, 4), correct: cap(readNumberVN(n)),
            explanation: `Tách thành các lớp rồi đọc từ trái sang phải: ${readNumberVN(n)}.`, hint: 'Đọc từng lớp (triệu, nghìn, đơn vị) kèm tên lớp.' });
        return input({ q: `Viết số: ${readNumberVN(n)}`, correct: n, explanation: `${cap(readNumberVN(n))} viết là ${fmt(n)}.`, hint: 'Lớp nào thiếu hàng thì viết chữ số 0.' });
    }),
    tpl('g4.read_write', 2, () => {
        const m = rint(1, 99), th = rint(1, 999), u = rint(0, 999), n = m * 1000000 + th * 1000 + u;
        return single({ q: `Số gồm ${m} triệu, ${th} nghìn và ${u} đơn vị là:`, correct: n, wrong: [m * 100000 + th * 1000 + u, m * 1000000 + th * 100 + u, m * 1000000 + th * 1000 + u * 10, m * 1000000 + u * 1000 + th].filter(x => x !== n), min: 0,
            explanation: `${m} triệu = ${fmt(m * 1000000)}; ${th} nghìn = ${fmt(th * 1000)}; cộng thêm ${u}: ${fmt(n)}.` });
    }),
    tpl('g4.place_class', 1, () => {
        const n = big(rint(6, 8)), ds = String(n).split('').map(Number), k = rint(0, ds.length - 1), place = PLACE[ds.length - 1 - k];
        const others = sample(PLACE.slice(0, ds.length).filter(p => p !== place), 3);
        return choices({ q: `Trong số ${fmt(n)}, chữ số ${ds[k]} (thứ ${k + 1} từ trái sang) thuộc hàng nào?`, options: shuffle([place, ...others]), correct: place,
            explanation: `Đếm từ phải sang trái: đơn vị, chục, trăm, nghìn, chục nghìn, trăm nghìn, triệu… Chữ số thứ ${k + 1} từ trái là hàng ${place}.` });
    }),
    tpl('g4.place_class', 2, () => {
        const n = big(7), ds = String(n).split('').map(Number), k = rint(0, 5), v = ds[k] * 10 ** (6 - k);
        if (ds[k] === 0) return single({ q: `Lớp triệu của số ${fmt(n)} gồm những chữ số nào?`, correct: String(ds[0]), wrong: [ds.slice(0, 2).join(''), ds.slice(1, 4).join(''), String(ds[6])].filter(x => x !== String(ds[0])), explanation: `Lớp triệu gồm hàng triệu, chục triệu, trăm triệu: ở đây chỉ có chữ số ${ds[0]}.` });
        return single({ q: `Giá trị của chữ số ${ds[k]} (thứ ${k + 1} từ trái) trong số ${fmt(n)} là:`, correct: v, wrong: [ds[k], v * 10, v / 10 >= 1 ? v / 10 : v * 100, v * 100].filter(x => x !== v), min: 0,
            explanation: `Chữ số ${ds[k]} ở hàng ${PLACE[6 - k]} nên có giá trị ${fmt(v)}.` });
    }),
    tpl('g4.compare', 1, () => {
        const d = rint(6, 8), a = big(d), b = chance(0.6) ? Math.max(10 ** (d - 1), a + pickOne([-1, 1]) * rint(1, 10 ** rint(1, d - 2))) : big(rint(6, 8));
        return compare({ q: `Điền dấu >, <, =: ${fmt(a)} ... ${fmt(b)}`, left: a, right: b,
            explanation: String(a).length !== String(b).length ? `Số nào nhiều chữ số hơn thì lớn hơn: ${fmt(a)} ${a > b ? '>' : '<'} ${fmt(b)}.` : a === b ? 'Hai số giống nhau nên điền dấu =.' : `Cùng ${String(a).length} chữ số: so sánh từng cặp chữ số từ trái sang phải. ${fmt(a)} ${a > b ? '>' : '<'} ${fmt(b)}.` });
    }),
    tpl('g4.compare', 2, () => {
        const d = rint(6, 7), base = rint(1, 9) * 10 ** (d - 1), nums = sample(Array.from({ length: 50 }, () => base + rint(0, 10 ** (d - 1) - 1)), 4), most = chance(0.5);
        const ans = most ? Math.max(...nums) : Math.min(...nums);
        return single({ q: `Số ${most ? 'lớn nhất' : 'bé nhất'} trong các số ${nums.map(fmt).join('; ')} là:`, correct: ans, wrong: nums.filter(x => x !== ans), closed: true, explanation: `So sánh lần lượt từ hàng cao nhất: ${fmt(ans)}.` });
    }, { noRankCheck: true }),
    tpl('g4.round', 2, () => {
        const p = pickOne([1000, 10000, 100000]), n = rint(150000, 9999999), r = Math.round(n / p) * p, pn = { 1000: 'nghìn', 10000: 'chục nghìn', 100000: 'trăm nghìn' }[p];
        const other = Math.floor(n / p) * p === r ? Math.ceil(n / p) * p : Math.floor(n / p) * p;
        return single({ q: `Làm tròn số ${fmt(n)} đến hàng ${pn}, ta được:`, correct: r, wrong: [other, r + p, r - p, Math.round(n / (p * 10)) * p * 10].filter(x => x !== r && x > 0),
            explanation: `Chữ số ngay bên phải hàng ${pn} là ${String(n).split('').reverse()[String(p).length - 2]}: ${Number(String(n).split('').reverse()[String(p).length - 2]) >= 5 ? 'từ 5 trở lên → làm tròn lên' : 'bé hơn 5 → làm tròn xuống'}. Kết quả ${fmt(r)}.` });
    }),
    tpl('g4.even_odd', 1, () => {
        const n = rint(100, 99999), even = n % 2 === 0;
        return choices({ q: `Số ${fmt(n)} là số chẵn hay số lẻ?`, options: ['Số chẵn', 'Số lẻ'], correct: even ? 'Số chẵn' : 'Số lẻ',
            explanation: `Chữ số tận cùng là ${n % 10}${even ? ' (0, 2, 4, 6, 8)' : ' (1, 3, 5, 7, 9)'} nên ${fmt(n)} là số ${even ? 'chẵn' : 'lẻ'}.`, hint: 'Nhìn chữ số hàng đơn vị.' });
    }),
    tpl('g4.even_odd', 2, () => {
        const evenAsk = chance(0.5), nums = Array.from({ length: 5 }, () => rint(100, 9999));
        while (!nums.some(x => (x % 2 === 0) === evenAsk) || nums.every(x => (x % 2 === 0) === evenAsk)) nums[rint(0, 4)] = rint(100, 9999);
        const uniq = [...new Set(nums)];
        return multi({ q: `Chọn tất cả các số ${evenAsk ? 'chẵn' : 'lẻ'}:`, correct: uniq.filter(x => (x % 2 === 0) === evenAsk).map(fmt), wrong: uniq.filter(x => (x % 2 === 0) !== evenAsk).map(fmt),
            explanation: `Số ${evenAsk ? 'chẵn' : 'lẻ'} có chữ số tận cùng là ${evenAsk ? '0, 2, 4, 6, 8' : '1, 3, 5, 7, 9'}.` });
    }),
];

export const generateLargeNumbers = fromTemplates(templates);
