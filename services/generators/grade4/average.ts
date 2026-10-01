// Lớp 4 — Số trung bình cộng (g4_average).
// Giữ mẫu "Trung bình cộng của các số a, b là …" và "Trung bình cộng của k số là m. Biết … Tìm số còn lại." (MathRacing).
import { tpl, fromTemplates, single, rint, pickOne, chance } from '../kit';
import { around } from '../wrongs';
import type { Template } from '../../study/types';

const CTX: [string, string, string][] = [['Tổ Một trồng được', 'cây', 'tổ'], ['Lớp 4A quyên góp được', 'quyển sách', 'lớp'], ['Bạn An đọc được', 'trang sách', 'ngày']];

export const templates: Template[] = [
    tpl('g4.average', 2, () => {
        const k = rint(2, 4), avg = rint(15, 90);
        const nums = Array.from({ length: k - 1 }, () => rint(Math.max(1, avg - 30), avg + 30));
        const last = avg * k - nums.reduce((a, b) => a + b, 0);
        if (last <= 0) return single({ q: `Trung bình cộng của các số ${avg - 5}, ${avg + 5} là bao nhiêu?`, correct: avg, wrong: [2 * avg, avg + 5, avg - 5], explanation: `(${avg - 5} + ${avg + 5}) : 2 = ${avg}.` });
        const all = [...nums, last];
        return single({ q: `Trung bình cộng của các số ${all.join(', ')} là bao nhiêu?`, correct: avg, wrong: [avg * k, ...around(avg, { min: 1 })], min: 0,
            explanation: `Tổng các số chia cho ${k}: (${all.join(' + ')}) : ${k} = ${avg * k} : ${k} = ${avg}.`, steps: [`Tổng: ${all.join(' + ')} = ${avg * k}`, `Trung bình cộng: ${avg * k} : ${k} = ${avg}`], hint: 'Cộng tất cả rồi chia cho số các số hạng.' });
    }, { weight: 2 }),
    tpl('g4.average', 3, () => {
        if (chance(0.5)) {
            const k = rint(3, 4), avg = rint(20, 60);
            const known = Array.from({ length: k - 1 }, () => rint(Math.max(1, avg - 15), avg + 15));
            const rest = avg * k - known.reduce((a, b) => a + b, 0);
            if (rest <= 0) return single({ q: `Trung bình cộng của 2 số là ${avg}. Biết 1 số là ${avg - 3}. Tìm số còn lại.`, correct: avg + 3, wrong: [avg, avg - 3, 2 * avg], explanation: `Tổng 2 số: ${avg} × 2 = ${2 * avg}; số còn lại: ${2 * avg} - ${avg - 3} = ${avg + 3}.` });
            return single({ q: `Trung bình cộng của ${k} số là ${avg}. Biết ${k - 1} số là ${known.join(', ')}. Tìm số còn lại.`, correct: rest, wrong: [avg, avg * k, ...around(rest, { min: 0 })], min: 0,
                explanation: `Tổng ${k} số: ${avg} × ${k} = ${avg * k}. Số còn lại: ${avg * k} - (${known.join(' + ')}) = ${rest}.`, steps: [`Tổng ${k} số: ${avg} × ${k} = ${avg * k}`, `Số còn lại: ${avg * k} - ${known.reduce((a, b) => a + b, 0)} = ${rest}`], hint: 'Tìm tổng các số trước.' });
        }
        const [what, unit, per] = pickOne(CTX), k = rint(3, 4), avg = rint(20, 50), vals = Array.from({ length: k - 1 }, () => rint(avg - 10, avg + 10));
        const last = avg * k - vals.reduce((a, b) => a + b, 0), all = [...vals, last];
        return single({ q: `${what} ${all.join(', ')} ${unit} trong ${k} ${per} liên tiếp. Hỏi trung bình mỗi ${per} được bao nhiêu ${unit}?`, correct: avg, wrong: [avg * k, ...around(avg, { min: 1 })], min: 0,
            explanation: `(${all.join(' + ')}) : ${k} = ${avg * k} : ${k} = ${avg} (${unit}).` });
    }),
];

export const generateG4Average = fromTemplates(templates);
