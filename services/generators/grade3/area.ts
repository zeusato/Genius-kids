// Lớp 3 — Chu vi & diện tích (g3_area): chu vi tam giác, tứ giác, hình chữ nhật, hình vuông;
// diện tích: xăng-ti-mét vuông, đếm ô, hình chữ nhật, hình vuông.
// Giữ mẫu "Tính chu vi hình chữ nhật có chiều dài a cm, chiều rộng b cm" (MathRacing kiểm theo mẫu này).
import { tpl, fromTemplates, single, rint, pickOne, chance } from '../kit';
import { around } from '../wrongs';
import type { Template } from '../../study/types';

const cm = (x: number) => `${x} cm`, cm2 = (x: number) => `${x} cm²`;
/** Dài > rộng. */
const lw = (lo = 2, hi = 20): [number, number] => { const w = rint(lo, hi - 1); return [rint(w + 1, hi), w]; };
/** 3 cạnh tạo được tam giác (bất đẳng thức tam giác chặt). */
const triangle = (): [number, number, number] => { for (;;) { const a = rint(3, 15), b = rint(3, 15), c = rint(3, 15); if (a + b > c && a + c > b && b + c > a) return [a, b, c]; } };

export const templates: Template[] = [
    tpl('g3.perimeter', 1, () => {
        if (chance(0.6)) {
            const [l, w] = lw();
            return single({ q: `Tính chu vi hình chữ nhật có chiều dài ${l} cm, chiều rộng ${w} cm.`, visual: { fn: 'rectSVG', args: [l, w] }, correct: 2 * (l + w), wrong: [l + w, l * w, 2 * l + w, 2 * (l + w) + 2], format: cm, min: 1,
                explanation: `Chu vi hình chữ nhật = (dài + rộng) × 2 = (${l} + ${w}) × 2 = ${2 * (l + w)} (cm).`, hint: 'Lấy chiều dài cộng chiều rộng rồi nhân với 2.' });
        }
        const a = rint(2, 25);
        return single({ q: `Tính chu vi hình vuông có cạnh ${a} cm.`, visual: { fn: 'squareSVG', args: [a] }, correct: 4 * a, wrong: [a * a === 4 * a ? 2 * a : a * a, 2 * a, a + 4, 4 * a + 4], format: cm, min: 1,
            explanation: `Chu vi hình vuông = cạnh × 4 = ${a} × 4 = ${4 * a} (cm).`, hint: 'Hình vuông có 4 cạnh bằng nhau.' });
    }, { weight: 2 }),
    tpl('g3.perimeter', 2, () => {
        if (chance(0.5)) {
            const [a, b, c] = triangle();
            return single({ q: `Tính chu vi hình tam giác có độ dài các cạnh là ${a} cm, ${b} cm, ${c} cm.`, visual: { fn: 'triangleSVG', args: [{ sides: [a, b, c] }] }, correct: a + b + c, wrong: [a + b, (a + b + c) * 2, a * b, a + b + c + 1], format: cm, min: 1,
                explanation: `Chu vi tam giác = tổng độ dài ba cạnh: ${a} + ${b} + ${c} = ${a + b + c} (cm).` });
        }
        const s = [rint(3, 12), rint(3, 12), rint(3, 12), rint(3, 12)], p = s.reduce((x, y) => x + y, 0);
        return single({ q: `Tính chu vi hình tứ giác có độ dài các cạnh ${s.join(' cm, ')} cm.`, visual: { fn: 'quadSidesSVG', args: s }, correct: p, wrong: [p - s[3], p + s[0], ...around(p, { min: 1 })], format: cm, min: 1,
            explanation: `Chu vi tứ giác = tổng độ dài bốn cạnh: ${s.join(' + ')} = ${p} (cm).` });
    }),
    tpl('g3.perimeter', 3, () => {
        if (chance(0.5)) { const a = rint(3, 20); return single({ q: `Một hình vuông có chu vi ${4 * a} cm. Độ dài cạnh hình vuông là:`, correct: a, wrong: [4 * a / 2, 4 * a - 4, a + 4, a * 2], format: cm, min: 1, explanation: `Cạnh = chu vi : 4 = ${4 * a} : 4 = ${a} (cm).`, hint: 'Chu vi hình vuông bằng cạnh nhân 4.' }); }
        const [l, w] = lw(3, 30);
        return single({ q: `Một mảnh vườn hình chữ nhật có chiều dài ${l} m, chiều rộng ${w} m. Người ta rào xung quanh vườn. Hỏi hàng rào dài bao nhiêu mét?`, correct: 2 * (l + w), wrong: [l + w, l * w, 2 * l + w, 2 * (l + w) + 2], format: x => `${x} m`, min: 1,
            explanation: `Hàng rào chính là chu vi mảnh vườn: (${l} + ${w}) × 2 = ${2 * (l + w)} (m).`, steps: [`Chu vi mảnh vườn: (${l} + ${w}) × 2 = ${2 * (l + w)} (m)`, `Đáp số: ${2 * (l + w)} m`] });
    }),
    tpl('g3.area_cm2', 1, () => {
        const cols = rint(3, 8), rows = rint(2, 5), shape = chance(0.5);
        const cells: [number, number][] = [];
        if (shape) { const w = rint(2, cols), h = rint(2, rows); for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) cells.push([c, r]); }
        else { for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (chance(0.45)) cells.push([c, r]); if (cells.length < 3) cells.push([0, 0], [1, 0], [0, 1]); }
        const n = new Set(cells.map(x => x.join(','))).size;
        return single({ q: 'Mỗi ô vuông có diện tích 1 cm². Hình tô màu có diện tích bao nhiêu xăng-ti-mét vuông?', visual: { fn: 'gridAreaSVG', args: [cols, rows, cells] }, correct: n, wrong: around(n, { min: 1 }), format: cm2, min: 1,
            explanation: `Đếm được ${n} ô vuông 1 cm² được tô màu: diện tích là ${n} cm².`, hint: 'Đếm số ô được tô màu.' });
    }),
    tpl('g3.area_cm2', 2, () => {
        if (chance(0.5)) { const [l, w] = lw(2, 15); return single({ q: `Tính diện tích hình chữ nhật có chiều dài ${l} cm, chiều rộng ${w} cm.`, visual: { fn: 'rectSVG', args: [l, w] }, correct: l * w, wrong: [2 * (l + w), l + w, l * w + l, l * w - w], format: cm2, min: 1, explanation: `Diện tích hình chữ nhật = dài × rộng = ${l} × ${w} = ${l * w} (cm²).`, hint: 'Diện tích hình chữ nhật: lấy chiều dài nhân chiều rộng (cùng đơn vị).' }); }
        const a = rint(2, 12);
        return single({ q: `Tính diện tích hình vuông có cạnh ${a} cm.`, visual: { fn: 'squareSVG', args: [a] }, correct: a * a, wrong: [4 * a === a * a ? 2 * a : 4 * a, 2 * a, a * a + a, a + a + 1], format: cm2, min: 1,
            explanation: `Diện tích hình vuông = cạnh × cạnh = ${a} × ${a} = ${a * a} (cm²).` });
    }),
    tpl('g3.area_cm2', 3, () => {
        const w = rint(3, 9), l = w * pickOne([2, 3]);
        return single({ q: `Một hình chữ nhật có chiều rộng ${w} cm, chiều dài gấp ${l / w} lần chiều rộng. Tính diện tích hình chữ nhật đó.`, correct: l * w, wrong: [2 * (l + w), l * w + w, w * w * 2 === l * w ? w * w : w * w * 2, l + w], format: cm2, min: 1,
            explanation: `Chiều dài: ${w} × ${l / w} = ${l} (cm). Diện tích: ${l} × ${w} = ${l * w} (cm²).`, steps: [`Chiều dài: ${w} × ${l / w} = ${l} (cm)`, `Diện tích: ${l} × ${w} = ${l * w} (cm²)`, `Đáp số: ${l * w} cm²`], hint: 'Tìm chiều dài trước.' });
    }),
];

export const generateG3Area = fromTemplates(templates);
