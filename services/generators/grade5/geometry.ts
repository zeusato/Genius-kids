// Lớp 5 — Hình học (g5_geometry): diện tích tam giác, hình thang; hình tròn (đường kính, chu vi, diện tích);
// diện tích xung quanh, toàn phần; thể tích hình hộp chữ nhật, hình lập phương; hình khai triển.
// Diện tích hình bình hành là "Nâng cao". Giữ createCircleSVG: mathEngine dùng cho câu hỏi AI.
import { tpl, fromTemplates, single, rint, pickOne, chance, shuffle } from '../kit';
import { circleSVG } from '../svg';
import { fmt } from '../../study/value';
import { fix } from './common';
import type { Template } from '../../study/types';

export const createCircleSVG = (radius: number) => circleSVG(radius);

const u2 = (x: number) => `${fmt(fix(x))} cm²`, u3 = (x: number) => `${fmt(fix(x))} cm³`, u1 = (x: number) => `${fmt(fix(x))} cm`;
// 4 hình 6 ô: 1 hình khai triển đúng của hình lập phương + 3 hình không gấp được.
const NETS: [number, number][][] = [
    [[1, 0], [0, 1], [1, 1], [2, 1], [3, 1], [1, 2]], // chữ thập
    [[0, 0], [0, 1], [1, 1], [2, 1], [3, 1], [3, 2]],
    [[1, 0], [1, 1], [0, 1], [2, 1], [3, 1], [3, 2]],
    [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2], [3, 2]], // bậc thang
];
const BAD: [number, number][][] = [
    [[0, 0], [1, 0], [2, 0], [3, 0], [0, 1], [3, 1]],
    [[0, 0], [1, 0], [0, 1], [1, 1], [2, 1], [3, 1]],
    [[0, 0], [1, 0], [2, 0], [3, 0], [1, 1], [2, 1]],
    [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1]],
];

export const templates: Template[] = [
    tpl('g5.triangle_area', 1, () => {
        const a = rint(3, 20), h = rint(2, 16), S = a * h / 2;
        return single({ q: `Tính diện tích hình tam giác có độ dài đáy ${a} cm và chiều cao ${h} cm.`, visual: { fn: 'triangleSVG', args: [{ base: a, height: h }] }, correct: S, wrong: [a * h, a + h, (a + h) * 2, S + a], format: u2, min: 0,
            explanation: `Diện tích tam giác = (đáy × chiều cao) : 2 = (${a} × ${h}) : 2 = ${fmt(S)} (cm²).`, hint: 'Đừng quên chia cho 2.' });
    }, { decimal: true }),
    tpl('g5.triangle_area', 2, () => {
        const a = rint(4, 20), h = rint(2, 15), S = a * h / 2;
        return single({ q: `Hình tam giác có diện tích ${fmt(S)} cm², độ dài đáy ${a} cm. Tính chiều cao.`, correct: h, wrong: [fix(S / a), h * 2, S - a > 0 ? fix(S - a) : h + 3, h + 1], format: u1, min: 0,
            explanation: `Chiều cao = diện tích × 2 : đáy = ${fmt(S)} × 2 : ${a} = ${h} (cm).`, hint: 'Diện tích × 2 rồi chia cho đáy.' });
    }, { decimal: true }),
    tpl('g5.trapezoid_area', 1, () => {
        const a = rint(3, 12), b = a + rint(2, 10), h = rint(2, 12), S = (a + b) * h / 2;
        return single({ q: `Tính diện tích hình thang có đáy bé ${a} cm, đáy lớn ${b} cm và chiều cao ${h} cm.`, visual: { fn: 'trapezoidSVG', args: [a, b, h] }, correct: S, wrong: [(a + b) * h, a * b * h / 2, (a + b) / 2 + h, S + h], format: u2, min: 0,
            explanation: `Diện tích hình thang = (đáy lớn + đáy bé) × chiều cao : 2 = (${b} + ${a}) × ${h} : 2 = ${fmt(S)} (cm²).` });
    }, { decimal: true }),
    tpl('g5.trapezoid_area', 2, () => {
        const a = rint(3, 12), b = a + rint(2, 10), h = rint(2, 12), S = (a + b) * h / 2;
        return single({ q: `Hình thang có diện tích ${fmt(S)} cm², tổng hai đáy ${a + b} cm. Tính chiều cao.`, correct: h, wrong: [fix(S / (a + b)), h * 2, h + 1, h + 2], format: u1, min: 0,
            explanation: `Chiều cao = diện tích × 2 : (tổng hai đáy) = ${fmt(S)} × 2 : ${a + b} = ${h} (cm).` });
    }, { decimal: true }),
    tpl('g5.circle', 1, () => {
        const r = rint(1, 15), askD = chance(0.5);
        if (askD) return single({ q: `Hình tròn có bán kính ${r} cm. Đường kính của hình tròn là:`, visual: { fn: 'circleSVG', args: [r] }, correct: 2 * r, wrong: [r, r + 2, 4 * r], format: u1, min: 0, explanation: `Đường kính = bán kính × 2 = ${r} × 2 = ${2 * r} (cm).` });
        const C = fix(2 * r * 3.14);
        return single({ q: `Tính chu vi hình tròn có bán kính ${r} cm.`, visual: { fn: 'circleSVG', args: [r] }, correct: C, wrong: [fix(r * 3.14), fix(r * r * 3.14), fix(4 * r * 3.14), fix(C + 1)], format: u1, min: 0,
            explanation: `Chu vi = bán kính × 2 × 3,14 = ${r} × 2 × 3,14 = ${fmt(C)} (cm).`, hint: 'C = r × 2 × 3,14 (hoặc d × 3,14).' });
    }, { decimal: true }),
    tpl('g5.circle', 2, () => {
        const r = rint(1, 12), S = fix(r * r * 3.14);
        return single({ q: `Tính diện tích hình tròn có bán kính ${r} cm.`, visual: { fn: 'circleSVG', args: [r] }, correct: S, wrong: [fix(2 * r * 3.14), fix(r * 3.14), fix(4 * r * r * 3.14), fix(S + 1)], format: u2, min: 0,
            explanation: `Diện tích = bán kính × bán kính × 3,14 = ${r} × ${r} × 3,14 = ${fmt(S)} (cm²).`, hint: 'S = r × r × 3,14' });
    }, { decimal: true }),
    tpl('g5.circle', 3, () => {
        const d = rint(2, 20), C = fix(d * 3.14);
        return single({ q: `Bánh xe có đường kính ${d} dm. Bánh xe lăn được 1 vòng thì đi được quãng đường dài bao nhiêu đề-xi-mét?`, correct: C, wrong: [fix(d / 2 * 3.14), fix(d * d * 3.14), fix(2 * d * 3.14), d], format: x => `${fmt(x)} dm`, min: 0,
            explanation: `Một vòng lăn bằng chu vi bánh xe: ${d} × 3,14 = ${fmt(C)} (dm).`, hint: 'Lăn một vòng = chu vi.' });
    }, { decimal: true }),
    tpl('g5.solid_area', 2, () => {
        const cube = chance(0.5);
        if (cube) { const a = rint(2, 12), xq = 4 * a * a, tp = 6 * a * a, askTp = chance(0.5); return single({ q: `Hình lập phương có cạnh ${a} cm. Tính diện tích ${askTp ? 'toàn phần' : 'xung quanh'}.`, visual: { fn: 'cubeSVG', args: [a] }, correct: askTp ? tp : xq, wrong: askTp ? [xq, a * a * a, a * a * 6 + a, 4 * a * a + 1] : [tp, a * a * a, a * a, 4 * a], format: u2, min: 0,
            explanation: askTp ? `Diện tích toàn phần = diện tích một mặt × 6 = ${a} × ${a} × 6 = ${tp} (cm²).` : `Diện tích xung quanh = diện tích một mặt × 4 = ${a} × ${a} × 4 = ${xq} (cm²).` }); }
        const l = rint(4, 15), w = rint(2, l - 1), h = rint(2, 10), xq = 2 * (l + w) * h, tp = xq + 2 * l * w, askTp = chance(0.5);
        return single({ q: `Hình hộp chữ nhật có chiều dài ${l} cm, chiều rộng ${w} cm, chiều cao ${h} cm. Tính diện tích ${askTp ? 'toàn phần' : 'xung quanh'}.`, visual: { fn: 'box3dSVG', args: [l, w, h] }, correct: askTp ? tp : xq, wrong: askTp ? [xq, l * w * h, xq + l * w] : [tp, l * w * h, (l + w) * h], format: u2, min: 0,
            explanation: `Diện tích xung quanh = chu vi đáy × chiều cao = (${l} + ${w}) × 2 × ${h} = ${xq} (cm²).${askTp ? ` Toàn phần = xung quanh + 2 mặt đáy = ${xq} + ${l} × ${w} × 2 = ${tp} (cm²).` : ''}` });
    }),
    tpl('g5.solid_area', 3, () => {
        const l = rint(5, 12), w = rint(3, l - 1), h = rint(3, 8), paint = 2 * (l + w) * h + l * w; // không có nắp
        return single({ q: `Một cái hộp hình hộp chữ nhật không có nắp, dài ${l} dm, rộng ${w} dm, cao ${h} dm. Tính diện tích cần sơn mặt ngoài.`, correct: paint, wrong: [paint + l * w, 2 * (l + w) * h, l * w * h], format: x => `${x} dm²`, min: 0,
            explanation: `Diện tích xung quanh: (${l} + ${w}) × 2 × ${h} = ${2 * (l + w) * h} (dm²); thêm một đáy: ${l} × ${w} = ${l * w} (dm²). Tổng: ${paint} dm².`, hint: 'Không có nắp: chỉ cộng một mặt đáy.' });
    }),
    tpl('g5.volume', 1, () => {
        const cube = chance(0.5);
        if (cube) { const a = rint(2, 12); return single({ q: `Tính thể tích hình lập phương có cạnh ${a} cm.`, visual: { fn: 'cubeSVG', args: [a] }, correct: a ** 3, wrong: [a * a * 6, a * a * 4, a * 3, a * a], format: u3, min: 0, explanation: `Thể tích = cạnh × cạnh × cạnh = ${a} × ${a} × ${a} = ${a ** 3} (cm³).` }); }
        const l = rint(3, 15), w = rint(2, l), h = rint(2, 10);
        return single({ q: `Tính thể tích hình hộp chữ nhật có chiều dài ${l} cm, chiều rộng ${w} cm, chiều cao ${h} cm.`, visual: { fn: 'box3dSVG', args: [l, w, h] }, correct: l * w * h, wrong: [l + w + h, 2 * (l + w) * h, l * w, l * w * h + l], format: u3, min: 0,
            explanation: `Thể tích = dài × rộng × cao = ${l} × ${w} × ${h} = ${l * w * h} (cm³).` });
    }),
    tpl('g5.volume', 2, () => {
        const l = rint(3, 12), w = rint(2, 8), h = rint(2, 10), V = l * w * h;
        return single({ q: `Hình hộp chữ nhật có thể tích ${V} cm³, chiều dài ${l} cm, chiều rộng ${w} cm. Tính chiều cao.`, correct: h, wrong: [V / l, h + 1, h * 2, l + w].filter(x => Number.isInteger(x)), format: u1, min: 0,
            explanation: `Chiều cao = thể tích : (dài × rộng) = ${V} : (${l} × ${w}) = ${h} (cm).` });
    }),
    tpl('g5.volume', 3, () => {
        const l = rint(5, 20), w = rint(4, 15), h = rint(5, 12), liters = l * w * h / 1000;
        return single({ q: `Một bể cá hình hộp chữ nhật dài ${l} dm, rộng ${w} dm, cao ${h} dm. Bể chứa đầy nước thì được bao nhiêu lít nước? (1 dm³ = 1 l)`, correct: l * w * h, wrong: [l * w * h * 10, l * w, 2 * (l + w) * h, fix(liters)], format: x => `${fmt(x)} l`, min: 0,
            explanation: `Thể tích bể: ${l} × ${w} × ${h} = ${l * w * h} (dm³) = ${l * w * h} l.` });
    }, { decimal: true }),
    tpl('g5.nets', 1, () => {
        const good = pickOne(NETS), items = shuffle([good, ...shuffle(BAD).slice(0, 3)]);
        return single({ q: 'Hình nào là hình khai triển của hình lập phương?', visual: { fn: 'netsRowSVG', args: [items] }, correct: items.indexOf(good) + 1, wrong: [1, 2, 3, 4], keepOrder: true, format: x => `Hình ${x}`,
            explanation: `Hình ${items.indexOf(good) + 1} gấp lại được thành hình lập phương (6 mặt không chồng lên nhau).`, hint: 'Tưởng tượng gấp các ô vuông lại: có ô nào bị chồng lên nhau không?' });
    }, { noRankCheck: true }),
    tpl('g5.para_area', 2, () => {
        const a = rint(4, 20), h = rint(3, 15);
        return single({ q: `Tính diện tích hình bình hành có độ dài đáy ${a} cm, chiều cao ${h} cm.`, visual: { fn: 'parallelogramSVG', args: [a, h] }, correct: a * h, wrong: [a * h / 2 % 1 ? a * h + h : a * h / 2, 2 * (a + h), a + h], format: u2, min: 0,
            explanation: `Diện tích hình bình hành = đáy × chiều cao = ${a} × ${h} = ${a * h} (cm²).` });
    }),
];

export const generateG5Geometry = fromTemplates(templates);
