// Nâng cao (Lớp 6 theo GDPT 2018) — Diện tích hình bình hành, hình thoi (g4_para_rhombus).
import { tpl, fromTemplates, single, rint } from '../kit';
import type { Template } from '../../study/types';

const cm2 = (x: number) => `${x} cm²`, cm = (x: number) => `${x} cm`;

export const templates: Template[] = [
    tpl('g4.para_area', 2, () => {
        const kind = rint(0, 2);
        if (kind === 0) { const a = rint(4, 20), h = rint(3, 15); return single({ q: `Tính diện tích hình bình hành có độ dài đáy ${a} cm, chiều cao ${h} cm.`, visual: { fn: 'parallelogramSVG', args: [a, h] }, correct: a * h, wrong: [a + h, (a * h) / 2 % 1 === 0 ? (a * h) / 2 : a * h + a, 2 * (a + h), a * h + h], format: cm2, min: 1, explanation: `Diện tích hình bình hành = đáy × chiều cao = ${a} × ${h} = ${a * h} (cm²).` }); }
        if (kind === 1) { const d1 = rint(2, 10) * 2, d2 = rint(3, 15); return single({ q: `Tính diện tích hình thoi có độ dài hai đường chéo là ${d1} cm và ${d2} cm.`, visual: { fn: 'rhombusSVG', args: [d1, d2] }, correct: d1 * d2 / 2, wrong: [d1 * d2, d1 + d2, (d1 + d2) * 2, d1 * d2 / 2 + d2], format: cm2, min: 1, explanation: `Diện tích hình thoi = (đường chéo × đường chéo) : 2 = (${d1} × ${d2}) : 2 = ${d1 * d2 / 2} (cm²).`, hint: 'Đừng quên chia cho 2.' }); }
        const a = rint(4, 15), h = rint(3, 12), S = a * h;
        return single({ q: `Hình bình hành có diện tích ${S} cm², độ dài đáy ${a} cm. Tính chiều cao.`, correct: h, wrong: [S - a, a, h + 2, h * 2], format: cm, min: 1, explanation: `Chiều cao = diện tích : đáy = ${S} : ${a} = ${h} (cm).` });
    }),
];

export const generateG4ParaRhombus = fromTemplates(templates);
