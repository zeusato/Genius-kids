// Lớp 4 — Góc (g4_angles): góc nhọn, vuông, tù, bẹt; đo góc bằng thước đo góc; so sánh góc.
// Hình góc dùng angleShapeSVG (tia quay đúng chiều, KHÔNG in số đo khi hỏi số đo).
import { tpl, fromTemplates, single, choices, compare, rint, pickOne } from '../kit';
import type { Template } from '../../study/types';

const TYPES = ['Góc nhọn', 'Góc vuông', 'Góc tù', 'Góc bẹt'];
const typeOf = (d: number) => (d < 90 ? 'Góc nhọn' : d === 90 ? 'Góc vuông' : d < 180 ? 'Góc tù' : 'Góc bẹt');
const NAMES = ['AOB', 'MON', 'CID', 'PKQ'];

export const templates: Template[] = [
    tpl('g4.angle_types', 1, () => {
        const d = pickOne([30, 40, 45, 50, 60, 70, 90, 90, 110, 120, 135, 150, 180]), nm = pickOne(NAMES);
        return choices({ q: `Góc đỉnh ${nm[1]} trong hình là góc gì?`, visual: { fn: 'angleShapeSVG', args: [d, { names: nm, noMark: true }] }, options: TYPES, shuffle: true, correct: typeOf(d),
            explanation: { 'Góc nhọn': 'Góc nhọn bé hơn góc vuông.', 'Góc vuông': 'Góc vuông bằng 90°.', 'Góc tù': 'Góc tù lớn hơn góc vuông nhưng bé hơn góc bẹt.', 'Góc bẹt': 'Hai cạnh của góc bẹt nằm trên một đường thẳng (180°).' }[typeOf(d)],
            hint: 'Dùng ê-ke so với góc vuông.' });
    }),
    tpl('g4.angle_types', 1, () => {
        const d = pickOne([20, 35, 60, 75, 90, 100, 125, 160, 180]);
        return choices({ q: `Góc có số đo ${d}° là góc gì?`, options: TYPES, shuffle: true, correct: typeOf(d), explanation: `${d}° ${d < 90 ? 'bé hơn 90°' : d === 90 ? 'bằng 90°' : d < 180 ? 'lớn hơn 90° và bé hơn 180°' : 'bằng 180°'}: ${typeOf(d).toLowerCase()}.` });
    }),
    tpl('g4.angle_measure', 2, () => {
        const d = rint(2, 17) * 10, nm = pickOne(NAMES);
        return single({ q: `Đặt thước đo góc như hình. Góc đỉnh ${nm[1]} có số đo bao nhiêu độ?`, visual: { fn: 'angleShapeSVG', args: [d, { names: nm, protractor: true }] },
            correct: d, wrong: [180 - d, d + 10, d - 10, d + 20].filter(x => x > 0 && x < 180 && x !== d), format: x => `${x}°`, min: 0, max: 180,
            explanation: `Một cạnh trùng vạch 0°, cạnh kia đi qua vạch ${d}°: góc có số đo ${d}°.`, hint: 'Đọc số trên vòng chia độ bắt đầu từ vạch 0 trùng với một cạnh của góc.' });
    }),
    tpl('g4.angle_compare', 2, () => {
        const a = rint(2, 17) * 10, b = rint(2, 17) * 10;
        if (rint(0, 1)) return compare({ q: `So sánh góc ${a}° và góc ${b}°: ${a}° ... ${b}°`, left: a, right: b, explanation: a === b ? 'Hai góc bằng nhau.' : `Góc ${Math.max(a, b)}° lớn hơn góc ${Math.min(a, b)}°.` });
        const [p, q] = pickOne([['Góc vuông', 'Góc tù'], ['Góc nhọn', 'Góc vuông'], ['Góc tù', 'Góc bẹt'], ['Góc nhọn', 'Góc tù']] as const);
        const order = ['Góc nhọn', 'Góc vuông', 'Góc tù', 'Góc bẹt'];
        const bigger = order.indexOf(p) > order.indexOf(q) ? p : q;
        return choices({ q: `${p} và ${q.toLowerCase()}, góc nào lớn hơn?`, options: [p, q, 'Bằng nhau'], correct: bigger,
            explanation: 'Thứ tự từ bé đến lớn: góc nhọn < góc vuông (90°) < góc tù < góc bẹt (180°).' });
    }),
];

export const generateAngles = fromTemplates(templates);
