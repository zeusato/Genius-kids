// Lớp 4 — Hình bình hành, hình thoi & diện tích (g4_geometry_2d): nhận biết hình bình hành, hình thoi;
// chu vi, diện tích hình chữ nhật, hình vuông, hình ghép. (Diện tích hình bình hành/thoi: topic Nâng cao.)
// Giữ createRectSVG / createSquareSVG / createCompositeSVG: mathEngine dùng cho câu hỏi AI.
import { tpl, fromTemplates, single, choices, yesNo, rint, pickOne, chance, shuffle } from '../kit';
import { rectSVG, squareSVG } from '../svg';
import type { Template } from '../../study/types';


// Dùng BỘ SVG DÙNG CHUNG (tỉ lệ đúng, nhãn rõ). Giữ chữ ký cũ cho mathEngine.
export const createRectSVG = (w: number, h: number, _labelW?: string, _labelH?: string) => rectSVG(w, h, { color: 'yellow' });

export const createSquareSVG = (side: number, _label?: string) => squareSVG(side, { color: 'green' });

export const createCompositeSVG = (hA: number, wA: number, hB: number, wB: number) => {
    const svgW = 400;
    const svgH = 250;

    const totalW = wA + wB;
    const maxH = hA;

    // Reduce maxBoxW to ensure plenty of horizontal space for labels
    const maxBoxW = 280;
    const maxBoxH = 180;
    const scale = Math.min(maxBoxW / totalW, maxBoxH / maxH);

    const drawHA = hA * scale;
    const drawWA = wA * scale;
    const drawHB = hB * scale;
    const drawWB = wB * scale;

    const startX = (svgW - (drawWA + drawWB)) / 2;
    const startY = (svgH - drawHA) / 2 + 10;

    // Path points
    const p1 = { x: startX, y: startY };
    const p2 = { x: startX + drawWA, y: startY };
    const p3 = { x: startX + drawWA, y: startY + (drawHA - drawHB) };
    const p4 = { x: startX + drawWA + drawWB, y: startY + (drawHA - drawHB) };
    const p5 = { x: startX + drawWA + drawWB, y: startY + drawHA };
    const p6 = { x: startX, y: startY + drawHA };

    const outline = `
        M ${p1.x} ${p1.y} 
        L ${p2.x} ${p2.y} 
        L ${p2.x} ${p3.y} 
        L ${p4.x} ${p4.y} 
        L ${p5.x} ${p5.y} 
        L ${p6.x} ${p6.y} 
        Z
    `;

    const separator = `M ${p2.x} ${p3.y} L ${p2.x} ${p5.y}`;

    return `
      <svg width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}" xmlns="http://www.w3.org/2000/svg">
        <path d="${outline}" fill="#e0f2fe" stroke="#0284c7" stroke-width="3" />
        <path d="${separator}" stroke="#0284c7" stroke-width="2" stroke-dasharray="5,5" />
        
        <!-- Labels -->
        <text x="${startX - 15}" y="${startY + drawHA / 2}" text-anchor="end" font-family="sans-serif" font-size="16">${hA}cm</text>
        <text x="${startX + drawWA / 2}" y="${startY - 10}" text-anchor="middle" font-family="sans-serif" font-size="16">${wA}cm</text>
        <text x="${startX + drawWA + drawWB / 2}" y="${p3.y - 10}" text-anchor="middle" font-family="sans-serif" font-size="16">${wB}cm</text>
        <text x="${p5.x + 10}" y="${p5.y - drawHB / 2}" text-anchor="start" font-family="sans-serif" font-size="16">${hB}cm</text>
      </svg>
    `;
};

const m = (x: number) => `${x} m`, m2 = (x: number) => `${x} m²`, cm2 = (x: number) => `${x} cm²`;
const FACTS: [string, boolean][] = [
    ['Hình bình hành có hai cặp cạnh đối diện song song và bằng nhau.', true], ['Hình thoi có bốn cạnh bằng nhau.', true],
    ['Hình thoi có hai cặp cạnh đối diện song song.', true], ['Hình bình hành có bốn góc vuông.', false],
    ['Hình thoi có hai đường chéo vuông góc với nhau.', true], ['Hình bình hành có bốn cạnh luôn bằng nhau.', false],
    ['Hình chữ nhật cũng là hình bình hành.', true], ['Hình thoi chỉ có một cặp cạnh song song.', false],
];

export const templates: Template[] = [
    tpl('g4.para_rhombus_id', 1, () => {
        const kind = pickOne(['para', 'rhombus', 'rect', 'trapezoid'] as const);
        const name = { para: 'Hình bình hành', rhombus: 'Hình thoi', rect: 'Hình chữ nhật', trapezoid: 'Hình thang' }[kind];
        const visual = kind === 'para' ? { fn: 'parallelogramSVG', args: [rint(6, 10), rint(3, 5), { unit: '' }] } : kind === 'rhombus' ? { fn: 'rhombusSVG', args: [rint(6, 10), rint(4, 7), { unit: '' }] } : kind === 'rect' ? { fn: 'rectSVG', args: [rint(6, 10), rint(3, 5)] } : { fn: 'trapezoidSVG', args: [rint(3, 5), rint(7, 10), rint(3, 5)] };
        return choices({ q: 'Hình vẽ là hình gì?', visual, options: shuffle(['Hình bình hành', 'Hình thoi', 'Hình chữ nhật', 'Hình thang']), correct: name,
            explanation: { para: 'Hình bình hành có hai cặp cạnh đối diện song song và bằng nhau.', rhombus: 'Hình thoi có bốn cạnh bằng nhau, hai cặp cạnh đối song song.', rect: 'Hình chữ nhật có bốn góc vuông.', trapezoid: 'Hình thang chỉ có một cặp cạnh đối diện song song.' }[kind] });
    }),
    tpl('g4.para_rhombus_id', 2, () => {
        const [s, t] = pickOne(FACTS);
        return yesNo({ q: `Đúng hay sai: ${s}`, yes: t, explanation: t ? `Đúng. ${s}` : 'Sai. Hình bình hành: hai cặp cạnh đối song song và bằng nhau; hình thoi: bốn cạnh bằng nhau, hai cặp cạnh đối song song.' });
    }),
    tpl('g4.rect_word', 2, () => {
        if (chance(0.5)) { const a = rint(5, 40); return single({ q: `Một mảnh đất hình vuông có cạnh ${a} m. Tính diện tích mảnh đất.`, visual: { fn: 'squareSVG', args: [a, { unit: 'm' }] }, correct: a * a, wrong: [4 * a === a * a ? 2 * a : 4 * a, a * 2, a * a + a, a * a - a], format: m2, min: 1, explanation: `Diện tích hình vuông = cạnh × cạnh = ${a} × ${a} = ${a * a} (m²).` }); }
        const w = rint(4, 20), l = w + rint(3, 25), P = 2 * (l + w);
        return single({ q: `Một hình chữ nhật có chu vi ${P} m, chiều rộng ${w} m. Tính chiều dài.`, correct: l, wrong: [P / 2, P - w, l + w, P / 2 + w], format: m, min: 1,
            explanation: `Nửa chu vi: ${P} : 2 = ${P / 2} (m). Chiều dài: ${P / 2} - ${w} = ${l} (m).`, steps: [`Nửa chu vi: ${P} : 2 = ${P / 2} (m)`, `Chiều dài: ${P / 2} - ${w} = ${l} (m)`], hint: 'Chiều dài + chiều rộng = nửa chu vi.' });
    }),
    tpl('g4.rect_word', 3, () => {
        const hA = rint(6, 10), wA = rint(3, 6), hB = rint(2, hA - 2), wB = rint(3, 7), S = hA * wA + hB * wB;
        if (chance(0.5)) return single({ q: `Hình bên được ghép từ hai hình chữ nhật: hình lớn cao ${hA} cm, rộng ${wA} cm; hình nhỏ cao ${hB} cm, rộng ${wB} cm. Tính diện tích cả hình.`, visualSvg: createCompositeSVG(hA, wA, hB, wB),
            correct: S, wrong: [hA * wA, (hA + hB) * (wA + wB), hA * (wA + wB), S + wB], format: cm2, min: 1,
            explanation: `${hA} × ${wA} = ${hA * wA} (cm²); ${hB} × ${wB} = ${hB * wB} (cm²). Cả hình: ${hA * wA} + ${hB * wB} = ${S} (cm²).`,
            steps: [`Diện tích hình lớn: ${hA} × ${wA} = ${hA * wA} (cm²)`, `Diện tích hình nhỏ: ${hB} × ${wB} = ${hB * wB} (cm²)`, `Cả hình: ${hA * wA} + ${hB * wB} = ${S} (cm²)`], hint: 'Chia hình thành hai hình chữ nhật rồi cộng diện tích.' });
        const w = rint(5, 20), l = w * rint(2, 3);
        return single({ q: `Một thửa ruộng hình chữ nhật dài ${l} m, rộng ${w} m. Cứ 1 m² thu được 2 kg thóc. Hỏi cả thửa ruộng thu được bao nhiêu ki-lô-gam thóc?`, correct: l * w * 2, wrong: [l * w, 2 * (l + w) * 2, l * w * 2 + w, (l + w) * 2], format: x => `${x} kg`, min: 1,
            explanation: `Diện tích: ${l} × ${w} = ${l * w} (m²). Số thóc: ${l * w} × 2 = ${l * w * 2} (kg).`, steps: [`Diện tích: ${l} × ${w} = ${l * w} (m²)`, `Số thóc: ${l * w} × 2 = ${l * w * 2} (kg)`] });
    }),
];

export const generateGeometryG4 = fromTemplates(templates);
