// Lớp 3 — Bài toán giải bằng hai bước tính (g3_word_problems). Tổng – hiệu là "Nâng cao" (Lớp 4).
import { tpl, fromTemplates, single, rint, pickOne } from '../kit';
import { KIDS } from './common';
import type { Template } from '../../study/types';

export const templates: Template[] = [
    tpl('g3.word_2step', 2, () => {
        const kind = rint(0, 2), k = pickOne(KIDS);
        if (kind === 0) {
            const a = rint(12, 40), more = rint(5, 20), total = a + (a + more);
            return single({ q: `Ngăn trên có ${a} quyển sách, ngăn dưới nhiều hơn ngăn trên ${more} quyển. Hỏi cả hai ngăn có bao nhiêu quyển sách?`, correct: total, wrong: [a + more, a * 2, total + more, total - more], min: 0,
                explanation: `Ngăn dưới: ${a} + ${more} = ${a + more} (quyển). Cả hai ngăn: ${a} + ${a + more} = ${total} (quyển).`,
                steps: [`Số sách ngăn dưới: ${a} + ${more} = ${a + more} (quyển)`, `Cả hai ngăn: ${a} + ${a + more} = ${total} (quyển)`, `Đáp số: ${total} quyển sách`], hint: 'Tìm số sách ngăn dưới trước.' });
        }
        if (kind === 1) {
            const n = rint(3, 8), each = rint(4, 9), eaten = rint(2, n * each - 2);
            return single({ q: `${k} có ${n} hộp bánh, mỗi hộp ${each} cái. ${k} đã cho bạn ${eaten} cái. Hỏi ${k} còn lại bao nhiêu cái bánh?`, correct: n * each - eaten, wrong: [n * each, n + each - eaten > 0 ? n + each - eaten : n * each + eaten, n * each - eaten + each, n * each + eaten], min: 0,
                explanation: `Có tất cả: ${n} × ${each} = ${n * each} (cái). Còn lại: ${n * each} - ${eaten} = ${n * each - eaten} (cái).`,
                steps: [`Số bánh có: ${n} × ${each} = ${n * each} (cái)`, `Còn lại: ${n * each} - ${eaten} = ${n * each - eaten} (cái)`, `Đáp số: ${n * each - eaten} cái bánh`] });
        }
        const t = rint(3, 9), q = rint(4, 12), total = t * q, gave = rint(1, q - 1);
        return single({ q: `Có ${total} quả cam xếp đều vào ${t} giỏ. Mẹ lấy ra ${gave} quả từ một giỏ. Hỏi giỏ đó còn lại bao nhiêu quả cam?`, correct: q - gave, wrong: [total - gave, q, q + gave, t], min: 0,
            explanation: `Mỗi giỏ: ${total} : ${t} = ${q} (quả). Giỏ đó còn: ${q} - ${gave} = ${q - gave} (quả).`, steps: [`Mỗi giỏ có: ${total} : ${t} = ${q} (quả)`, `Giỏ đó còn lại: ${q} - ${gave} = ${q - gave} (quả)`, `Đáp số: ${q - gave} quả cam`] });
    }, { weight: 2 }),
    tpl('g3.word_2step', 3, () => {
        const kind = rint(0, 1), k = pickOne(KIDS);
        if (kind === 0) {
            const a = rint(5, 15), times = rint(2, 5), b = a * times;
            return single({ q: `${k} gấp được ${a} ngôi sao. Bạn ${pickOne(KIDS.filter(x => x !== k))} gấp được số ngôi sao gấp ${times} lần của ${k}. Hỏi cả hai bạn gấp được bao nhiêu ngôi sao?`, correct: a + b, wrong: [b, a + times, a * (times - 1), a + b + a], min: 0,
                explanation: `Bạn kia gấp: ${a} × ${times} = ${b} (ngôi sao). Cả hai: ${a} + ${b} = ${a + b} (ngôi sao).`, steps: [`Số sao bạn kia gấp: ${a} × ${times} = ${b}`, `Cả hai bạn: ${a} + ${b} = ${a + b}`, `Đáp số: ${a + b} ngôi sao`], hint: '"Gấp mấy lần" là nhân, khác với "nhiều hơn".' });
        }
        const price = pickOne([4000, 5000, 6000, 8000]) / 1000, n = rint(3, 6), unit = price * n;
        return single({ q: `Mua ${n} quyển vở hết ${unit} nghìn đồng. Hỏi mua 2 quyển vở như thế hết bao nhiêu nghìn đồng?`, correct: price * 2, wrong: [unit * 2, unit - 2, price, price * 3], format: x => `${x} nghìn đồng`, min: 0,
            explanation: `Một quyển: ${unit} : ${n} = ${price} (nghìn đồng). Hai quyển: ${price} × 2 = ${price * 2} (nghìn đồng).`, steps: [`Giá một quyển: ${unit} : ${n} = ${price} (nghìn đồng)`, `Giá hai quyển: ${price} × 2 = ${price * 2} (nghìn đồng)`], hint: 'Tìm giá một quyển trước (rút về đơn vị).' });
    }),
    tpl('g3.sum_diff', 3, () => {
        const small = rint(10, 60), diff = rint(4, 30), big = small + diff, sum = small + big;
        return single({ q: `Tổng của hai số là ${sum}, hiệu của hai số là ${diff}. Tìm số lớn.`, correct: big, wrong: [small, sum - diff, (sum + diff), big + 1], min: 0,
            explanation: `Số lớn = (tổng + hiệu) : 2 = (${sum} + ${diff}) : 2 = ${big}.`, steps: [`Số lớn: (${sum} + ${diff}) : 2 = ${big}`, `Số bé: ${big} - ${diff} = ${small}`] });
    }),
];

export const generateG3WordProblems = fromTemplates(templates);
