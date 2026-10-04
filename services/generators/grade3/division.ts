// Lớp 3 — Phép chia (g3_division): bảng chia 3, 4, 6, 7, 8, 9; chia cho số có một chữ số, chia có dư;
// giảm một số đi nhiều lần; số lớn gấp mấy lần số bé, số bé bằng một phần mấy số lớn.
// Giữ mẫu "a : b = ?" (MathRacing lọc theo mẫu này).
import { tpl, fromTemplates, single, choices, input, rint, pickOne, chance, shuffle, sample } from '../kit';
import { remainderError } from '../wrongs';
import { KIDS, TABLES } from './common';
import type { Template } from '../../study/types';

const qr = (q: number, r: number) => (r ? `${q} dư ${r}` : `${q}`);

export const templates: Template[] = [
    tpl('g3.div_tables', 1, () => {
        const b = pickOne(TABLES), q = rint(1, 10);
        return single({ q: `${b * q} : ${b} = ?`, correct: q, wrong: [q + 1, q - 1, b * q - b, q + 2], min: 0, max: 20,
            explanation: `Vì ${b} × ${q} = ${b * q} nên ${b * q} : ${b} = ${q}.`, hint: `${b} nhân mấy bằng ${b * q}?` });
    }, { weight: 2 }),
    tpl('g3.div_tables', 2, () => {
        const b = pickOne(TABLES), q = rint(2, 10);
        return chance(0.5)
            ? input({ q: `${b * q} : ? = ${q}`, correct: b, explanation: `Muốn tìm số chia, lấy số bị chia chia cho thương: ${b * q} : ${q} = ${b}.`, hint: 'Lấy số bị chia chia cho thương.' })
            : single({ q: `Có ${b * q} học sinh xếp đều thành ${b} hàng. Hỏi mỗi hàng có bao nhiêu học sinh?`, correct: q, wrong: [q + 1, q - 1, b * q - b, b], min: 0, max: 30,
                explanation: `Chia đều thành ${b} hàng: ${b * q} : ${b} = ${q} (học sinh).` });
    }),
    tpl('g3.div_1digit', 1, () => {
        const b = rint(2, 6), q = rint(11, Math.floor(99 / b));
        return single({ q: `${b * q} : ${b} = ?`, correct: q, wrong: [q + 1, q - 1, q + 10, q - 10], min: 0,
            explanation: `Chia lần lượt từ hàng chục đến hàng đơn vị: ${b * q} : ${b} = ${q} (thử lại: ${q} × ${b} = ${b * q}).`, hint: 'Chia từ trái sang phải.' });
    }, { weight: 2 }),
    tpl('g3.div_1digit', 2, () => {
        const b = rint(2, 9), q = rint(Math.ceil(100 / b), Math.floor(999 / b));
        return single({ q: `${b * q} : ${b} = ?`, correct: q, wrong: [q + 10, q - 10, q + 1, q - 1, Math.floor(q / 10)], min: 0,
            explanation: `Đặt tính và chia từ hàng trăm: ${b * q} : ${b} = ${q} (thử lại: ${q} × ${b} = ${b * q}).` });
    }),
    tpl('g3.div_1digit', 3, () => {
        const b = rint(3, 9), q = rint(5, 60), r = rint(1, b - 1), a = b * q + r;
        const wrongs = remainderError(q, r, b).map(([x, y]) => qr(x, y));
        const opts = shuffle([...new Set([qr(q, r), ...wrongs])].slice(0, 4));
        if (!opts.includes(qr(q, r))) opts[0] = qr(q, r);
        return choices({ q: `${a} : ${b} = ?`, options: shuffle(opts), correct: qr(q, r),
            explanation: `${b} × ${q} = ${b * q}; ${a} - ${b * q} = ${r}. Vậy ${a} : ${b} = ${q} dư ${r} (số dư ${r} bé hơn số chia ${b}).`,
            hint: 'Số dư luôn bé hơn số chia.' });
    }, { check: q => { const m = q.correctAnswer?.match(/dư (\d+)/); const d = Number(q.questionText.match(/: (\d+) =/)?.[1]); return m && Number(m[1]) >= d ? 'số dư ≥ số chia' : (q.options || []).some(o => { const mm = o.match(/dư (\d+)/); return mm && Number(mm[1]) >= d; }) ? 'lựa chọn có số dư ≥ số chia' : null; } }),
    tpl('g3.div_1digit', 2, () => {
        const q = rint(1, 4) * 100 + rint(1, 9), b = rint(2, Math.min(9, Math.floor(999 / q)));
        return single({ q: `${b * q} : ${b} = ?`, correct: q, wrong: [Number(String(q).replace('0', '')), q + 10, q + 1, q - 1], min: 0,
            explanation: `Chia từ hàng trăm. Đến hàng chục, số đang chia bé hơn ${b}, viết 0 vào thương rồi hạ hàng đơn vị. ${b * q} : ${b} = ${q}. Thử lại: ${q} × ${b} = ${b * q}.`,
            hint: 'Không bỏ chữ số 0 ở giữa thương.' });
    }),
    tpl('g3.times_less', 2, () => {
        const k = rint(2, 9), q = rint(2, 12), a = k * q;
        return single({ q: `Giảm ${a} đi ${k} lần được bao nhiêu?`, correct: q, wrong: [a - k, q + 1, q - 1, a * k > 200 ? q + 2 : a * k], min: 0,
            explanation: `Muốn giảm một số đi nhiều lần, ta chia số đó cho số lần: ${a} : ${k} = ${q}.`, hint: '"Giảm đi mấy lần" là phép chia, khác với "bớt đi mấy".' });
    }),
    tpl('g3.times_less', 3, () => {
        const k = rint(2, 6), q = rint(4, 15), a = k * q, kid = pickOne(KIDS);
        return single({ q: `Bao gạo nặng ${a} kg. Chia đều số gạo đó thành ${k} phần. ${kid} mang về một phần. Hỏi ${kid} mang về bao nhiêu ki-lô-gam gạo?`,
            correct: q, wrong: [a - k, q + k, q * 2, q + 1], format: x => `${x} kg`, min: 0,
            explanation: `Giảm ${k} lần: ${a} : ${k} = ${q} (kg).`, steps: [`Số gạo mang về: ${a} : ${k} = ${q} (kg)`, `Đáp số: ${q} kg`] });
    }),
    tpl('g3.how_many_times', 2, () => {
        const small = rint(2, 9), k = rint(2, 9), big = small * k;
        return chance(0.5)
            ? single({ q: `Số lớn là ${big}, số bé là ${small}. Số lớn gấp mấy lần số bé?`, correct: k, wrong: [big - small, k + 1, k - 1, small], format: x => `${x} lần`, min: 1,
                explanation: `Muốn biết số lớn gấp mấy lần số bé, lấy số lớn chia cho số bé: ${big} : ${small} = ${k} (lần).`, hint: 'Lấy số lớn chia cho số bé.' })
            : choices({ q: `Số bé là ${small}, số lớn là ${big}. Số bé bằng một phần mấy số lớn?`, options: shuffle([`1/${k}`, ...sample([2, 3, 4, 5, 6, 7, 8, 9, 10].filter(x => x !== k), 3).map(x => `1/${x}`)]), correct: `1/${k}`,
                explanation: `${big} : ${small} = ${k}, nên số bé bằng 1/${k} số lớn.`, hint: 'Tìm số lớn gấp mấy lần số bé trước.' });
    }),
    tpl('g3.how_many_times', 3, () => {
        const small = rint(3, 9), k = rint(2, 8), big = small * k, [a, b] = shuffle(KIDS).slice(0, 2);
        return single({ q: `${a} có ${big} viên bi, ${b} có ${small} viên bi. Hỏi số bi của ${a} gấp mấy lần số bi của ${b}?`, correct: k, wrong: [big - small, k + 1, k - 1, big + small], format: x => `${x} lần`, min: 1,
            explanation: `${big} : ${small} = ${k} (lần).`, steps: [`Số bi của ${a} gấp số bi của ${b}: ${big} : ${small} = ${k} (lần)`, `Đáp số: ${k} lần`] });
    }),
];

export const generateG3Division = fromTemplates(templates);
