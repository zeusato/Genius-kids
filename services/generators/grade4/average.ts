// Lớp 4 — Số trung bình cộng (g4_average).
// Giữ mẫu "Trung bình cộng của các số a, b là …" và "Trung bình cộng của k số là m. Biết … Tìm số còn lại." (MathRacing).
import { tpl, fromTemplates, single, rint, pickOne, chance } from '../kit';
import { around } from '../wrongs';
import type { Template } from '../../study/types';

const COUNT = ['', '', 'Hai', 'Ba', 'Bốn'];
/** [đề theo số lượng k và dãy số, đơn vị, câu hỏi] */
const CTX: [(k: number, list: string) => string, string, string][] = [
    [(k, l) => `${COUNT[k]} tổ của lớp 4A trồng được lần lượt ${l} cây.`, 'cây', 'Hỏi trung bình mỗi tổ trồng được bao nhiêu cây?'],
    [(k, l) => `${COUNT[k]} lớp khối Bốn quyên góp được lần lượt ${l} quyển sách.`, 'quyển sách', 'Hỏi trung bình mỗi lớp quyên góp được bao nhiêu quyển sách?'],
    [(k, l) => `Bạn An đọc một quyển truyện trong ${k} ngày, lần lượt được ${l} trang.`, 'trang', 'Hỏi trung bình mỗi ngày An đọc được bao nhiêu trang?'],
];

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
        const [say, unit, ask] = pickOne(CTX), k = rint(3, 4), avg = rint(20, 50);
        let vals: number[], last: number;
        do { vals = Array.from({ length: k - 1 }, () => rint(avg - 10, avg + 10)); last = avg * k - vals.reduce((a, b) => a + b, 0); } while (last < avg - 15 || last > avg + 15); // số cuối cũng hợp lí, không âm
        const all = [...vals, last];
        return single({ q: `${say(k, all.join(', '))} ${ask}`, correct: avg, wrong: [avg * k, ...around(avg, { min: 1 })], min: 0,
            explanation: `(${all.join(' + ')}) : ${k} = ${avg * k} : ${k} = ${avg} (${unit}).`, steps: [`Tổng: ${all.join(' + ')} = ${avg * k} (${unit})`, `Trung bình: ${avg * k} : ${k} = ${avg} (${unit})`] });
    }),
];

export const generateG4Average = fromTemplates(templates);
