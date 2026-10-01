// Lớp 4 — Giải toán (g4_word_problems): tổng – hiệu; rút về đơn vị; bài toán 2–3 bước.
import { tpl, fromTemplates, single, choices, rint, chance, shuffle } from '../kit';
import { fmt } from '../../study/value';
import type { Template } from '../../study/types';

const KIDS = ['Lan', 'Minh', 'An', 'Hoa', 'Nam', 'Mai', 'Bình', 'Linh'];

export const templates: Template[] = [
    tpl('g4.sum_diff', 2, () => {
        const small = rint(20, 400), diff = rint(10, 200), big = small + diff, sum = big + small, askBig = chance(0.5);
        return single({ q: `Tổng của hai số là ${fmt(sum)}, hiệu của hai số là ${fmt(diff)}. Tìm số ${askBig ? 'lớn' : 'bé'}.`, correct: askBig ? big : small, wrong: [askBig ? small : big, sum - diff, sum + diff, (askBig ? big : small) + 1].filter(x => x !== (askBig ? big : small)), min: 0,
            explanation: askBig ? `Số lớn = (tổng + hiệu) : 2 = (${fmt(sum)} + ${fmt(diff)}) : 2 = ${fmt(big)}.` : `Số bé = (tổng - hiệu) : 2 = (${fmt(sum)} - ${fmt(diff)}) : 2 = ${fmt(small)}.`,
            hint: 'Số lớn = (tổng + hiệu) : 2; số bé = (tổng - hiệu) : 2.' });
    }),
    tpl('g4.sum_diff', 3, () => {
        const [a, b] = shuffle(KIDS).slice(0, 2), small = rint(10, 60), diff = rint(4, 30), big = small + diff;
        return choices({ q: `${a} và ${b} có tất cả ${big + small} viên bi. ${a} có nhiều hơn ${b} ${diff} viên. Hỏi mỗi bạn có bao nhiêu viên bi?`,
            options: shuffle([`${a}: ${big}, ${b}: ${small}`, `${a}: ${small}, ${b}: ${big}`, `${a}: ${big + diff}, ${b}: ${small - diff >= 0 ? small - diff : small + 1}`, `${a}: ${(big + small) / 2 | 0}, ${b}: ${(big + small) - ((big + small) / 2 | 0)}`]), correct: `${a}: ${big}, ${b}: ${small}`,
            explanation: `Số bi của ${a}: (${big + small} + ${diff}) : 2 = ${big}. Số bi của ${b}: ${big} - ${diff} = ${small}.`, steps: [`Số bi của ${a}: (${big + small} + ${diff}) : 2 = ${big} (viên)`, `Số bi của ${b}: ${big} - ${diff} = ${small} (viên)`] });
    }),
    tpl('g4.unit_rate', 2, () => {
        const n = rint(3, 8), each = rint(12, 60), m = rint(2, 12);
        return single({ q: `${n} thùng như nhau chứa ${n * each} chai nước. Hỏi ${m} thùng như thế chứa bao nhiêu chai nước?`, correct: each * m, wrong: [n * each * m, n * each + m, each * m + each, n * each - m], min: 0,
            explanation: `Một thùng: ${n * each} : ${n} = ${each} (chai). ${m} thùng: ${each} × ${m} = ${each * m} (chai).`, steps: [`Một thùng chứa: ${n * each} : ${n} = ${each} (chai)`, `${m} thùng chứa: ${each} × ${m} = ${each * m} (chai)`, `Đáp số: ${each * m} chai nước`], hint: 'Tìm số chai trong một thùng trước (rút về đơn vị).' });
    }),
    tpl('g4.unit_rate', 3, () => {
        const n = rint(3, 6), price = rint(3, 15) * 1000, money = rint(5, 15) * price;
        return single({ q: `Mua ${n} quyển vở hết ${fmt(n * price)} đồng. Hỏi với ${fmt(money)} đồng thì mua được bao nhiêu quyển vở như thế?`, correct: money / price, wrong: [money / price + 1, money / price - 1, n * (money / price), Math.round(money / (n * price))], min: 1,
            explanation: `Giá một quyển: ${fmt(n * price)} : ${n} = ${fmt(price)} (đồng). Số quyển: ${fmt(money)} : ${fmt(price)} = ${money / price} (quyển).`, steps: [`Giá một quyển: ${fmt(n * price)} : ${n} = ${fmt(price)} (đồng)`, `Số vở mua được: ${fmt(money)} : ${fmt(price)} = ${money / price} (quyển)`] });
    }),
    tpl('g4.word_multi', 3, () => {
        const kind = rint(0, 1);
        if (kind === 0) { const crates = rint(12, 40), per = rint(12, 30), extra = rint(5, 40), total = crates * per + extra; return single({ q: `Một cửa hàng có ${crates} thùng, mỗi thùng ${per} hộp sữa, ngoài ra còn ${extra} hộp lẻ. Hỏi cửa hàng có tất cả bao nhiêu hộp sữa?`, correct: total, wrong: [crates * per, crates * (per + extra), total + per, total - extra * 2], min: 0, explanation: `${crates} × ${per} = ${fmt(crates * per)}; ${fmt(crates * per)} + ${extra} = ${fmt(total)} (hộp).`, steps: [`Số hộp trong thùng: ${crates} × ${per} = ${fmt(crates * per)} (hộp)`, `Tất cả: ${fmt(crates * per)} + ${extra} = ${fmt(total)} (hộp)`, `Đáp số: ${fmt(total)} hộp sữa`] }); }
        const day1 = rint(120, 400), more = rint(20, 100);
        let day3 = rint(100, 300);
        day3 += (3 - (day1 + (day1 + more) + day3) % 3) % 3; // tổng chia hết cho 3
        const total = day1 + (day1 + more) + day3, avg = total / 3;
        return single({ q: `Ngày thứ nhất cửa hàng bán được ${day1} kg gạo, ngày thứ hai bán nhiều hơn ngày thứ nhất ${more} kg, ngày thứ ba bán được ${day3} kg. Hỏi trung bình mỗi ngày bán được bao nhiêu ki-lô-gam gạo?`,
            correct: avg, wrong: [total, avg + 10, avg - 10, (day1 + day3) / 2 === avg ? avg + 20 : (day1 + day3) / 2], format: x => `${fmt(x)} kg`, min: 0, integer: true,
            explanation: `Ngày thứ hai: ${day1} + ${more} = ${day1 + more} (kg). Cả ba ngày: ${day1} + ${day1 + more} + ${day3} = ${total} (kg). Trung bình: ${total} : 3 = ${avg} (kg).`,
            steps: [`Ngày thứ hai: ${day1} + ${more} = ${day1 + more} (kg)`, `Cả ba ngày: ${day1} + ${day1 + more} + ${day3} = ${total} (kg)`, `Trung bình mỗi ngày: ${total} : 3 = ${avg} (kg)`, `Đáp số: ${avg} kg`] });
    }),
];

export const generateWordProblems = fromTemplates(templates);
