// Lớp 3 — Hình học (g3_geometry): trung điểm, hình tròn (tâm, bán kính, đường kính), góc vuông,
// tam giác – tứ giác (đỉnh, cạnh, góc), hình chữ nhật – hình vuông, khối lập phương – khối hộp chữ nhật.
import { tpl, fromTemplates, single, choices, yesNo, rint, pickOne, chance, shuffle } from '../kit';
import type { Template } from '../../study/types';

const SEG = ['AMB', 'CID', 'EOG', 'PKQ'];
const TRI = ['ABC', 'MNP', 'DEG', 'HIK'];
const QUAD = ['ABCD', 'MNPQ', 'EGHK'];
const CIRC = ['OAB', 'IMN', 'OCD'];
const RECT_FACTS: [string, boolean][] = [
    ['Hình chữ nhật có 4 góc vuông.', true], ['Hình chữ nhật có hai cạnh dài bằng nhau và hai cạnh ngắn bằng nhau.', true], ['Hình vuông có 4 cạnh dài bằng nhau.', true],
    ['Hình vuông có 4 góc vuông.', true], ['Hình chữ nhật có 4 cạnh dài bằng nhau.', false], ['Hình vuông có 3 góc vuông.', false],
    ['Hình chữ nhật có 3 cạnh.', false], ['Hình tam giác có 4 đỉnh.', false], ['Hình tứ giác có 4 cạnh và 4 góc.', true], ['Hình tam giác có 3 cạnh, 3 đỉnh, 3 góc.', true],
    ['Hình vuông có hai cạnh dài, hai cạnh ngắn.', false], ['Mọi góc của hình tam giác đều là góc vuông.', false],
];

export const templates: Template[] = [
    tpl('g3.midpoint', 1, () => {
        const len = pickOne([6, 8, 10, 12]), exact = chance(0.5), at = exact ? len / 2 : pickOne([len / 2 - 1, len / 2 + 1, len / 2 - 2].filter(x => x > 0)), nm = pickOne(SEG);
        return yesNo({ q: `Điểm ${nm[1]} có phải là trung điểm của đoạn thẳng ${nm[0]}${nm[2]} không?`, visual: { fn: 'midpointSVG', args: [len, at, nm] }, yes: exact, labels: ['Có', 'Không'],
            explanation: exact ? `${nm[1]} nằm giữa ${nm[0]} và ${nm[2]}, và ${nm[0]}${nm[1]} = ${nm[1]}${nm[2]} = ${len / 2} vạch, nên ${nm[1]} là trung điểm.` : `${nm[0]}${nm[1]} = ${at} vạch, ${nm[1]}${nm[2]} = ${len - at} vạch: không bằng nhau nên ${nm[1]} không phải trung điểm.`,
            hint: 'Trung điểm chia đoạn thẳng thành hai phần dài bằng nhau.' });
    }),
    tpl('g3.midpoint', 2, () => {
        const len = rint(3, 15) * 2, nm = pickOne(SEG);
        return single({ q: `Đoạn thẳng ${nm[0]}${nm[2]} dài ${len} cm, ${nm[1]} là trung điểm của ${nm[0]}${nm[2]}. Độ dài đoạn thẳng ${nm[0]}${nm[1]} là:`, correct: len / 2, wrong: [len, len * 2, len / 2 + 1, len / 2 - 1], format: x => `${x} cm`, min: 1,
            explanation: `Trung điểm chia đôi đoạn thẳng: ${len} : 2 = ${len / 2} (cm).` });
    }),
    tpl('g3.circle', 1, () => {
        const nm = pickOne(CIRC), show = pickOne(['radius', 'diameter'] as const);
        const seg = show === 'radius' ? `${nm[0]}${nm[1]}` : `${nm[1]}${nm[2]}`;
        return choices({ q: `Trong hình tròn tâm ${nm[0]}, đoạn thẳng ${seg} là gì?`, visual: { fn: 'circlePartsSVG', args: [show, nm] }, options: ['Bán kính', 'Đường kính', 'Tâm'], correct: show === 'radius' ? 'Bán kính' : 'Đường kính',
            explanation: show === 'radius' ? `${seg} nối tâm ${nm[0]} với một điểm trên đường tròn: đó là bán kính.` : `${seg} đi qua tâm ${nm[0]} và nối hai điểm trên đường tròn: đó là đường kính.` });
    }),
    tpl('g3.circle', 2, () => {
        const r = rint(2, 15), askD = chance(0.5);
        return single({ q: askD ? `Hình tròn có bán kính ${r} cm. Đường kính của hình tròn là:` : `Hình tròn có đường kính ${2 * r} cm. Bán kính của hình tròn là:`, correct: askD ? 2 * r : r, wrong: askD ? [r, r + 2, 4 * r, 2 * r + 1] : [2 * r, 4 * r, r + 1, r - 1], format: x => `${x} cm`, min: 1,
            explanation: `Đường kính dài gấp 2 lần bán kính: ${askD ? `${r} × 2 = ${2 * r}` : `${2 * r} : 2 = ${r}`} (cm).`, hint: 'Đường kính gấp đôi bán kính.' });
    }),
    tpl('g3.right_angle', 1, () => {
        const deg = pickOne([90, 90, 60, 120, 45, 135, 75, 105]), nm = pickOne(['AOB', 'MON', 'CID']);
        return yesNo({ q: `Góc đỉnh ${nm[1]} có phải là góc vuông không?`, visual: { fn: 'angleShapeSVG', args: [deg, { names: nm, noMark: true }] }, yes: deg === 90, labels: ['Có', 'Không'],
            explanation: deg === 90 ? 'Đặt ê-ke: hai cạnh của góc trùng khít với hai cạnh góc vuông của ê-ke, nên đây là góc vuông.' : 'Đặt ê-ke: hai cạnh của góc không trùng khít với góc vuông của ê-ke, nên đây là góc không vuông.',
            hint: 'Dùng ê-ke để kiểm tra góc vuông.' });
    }),
    tpl('g3.polygon', 1, () => {
        const tri = chance(0.5), nm = tri ? pickOne(TRI) : pickOne(QUAD), n = tri ? 3 : 4, what = pickOne(['đỉnh', 'cạnh', 'góc']);
        return single({ q: `Hình ${tri ? 'tam giác' : 'tứ giác'} ${nm} có mấy ${what}?`, visual: { fn: 'namedPolygonSVG', args: [n, nm] }, correct: n, wrong: [n === 3 ? 4 : 3, 2, 5, 6], min: 1, max: 6,
            explanation: `Hình ${tri ? 'tam giác' : 'tứ giác'} có ${n} đỉnh, ${n} cạnh và ${n} góc.` });
    }, { noRankCheck: true }),
    tpl('g3.polygon', 2, () => {
        if (chance(0.5)) {
            const nm = pickOne(QUAD), v = nm.split(''), sides = v.map((x, i) => x + v[(i + 1) % 4]), diag = pickOne([v[0] + v[2], v[1] + v[3]]);
            return choices({ q: `Đoạn thẳng nào KHÔNG phải là cạnh của hình tứ giác ${nm}?`, visual: { fn: 'namedPolygonSVG', args: [4, nm] }, options: shuffle([...sides.slice(0, 3), diag]), correct: diag,
                explanation: `Các cạnh của ${nm} là ${sides.join(', ')}. ${diag} nối hai đỉnh không liền nhau (đường chéo), không phải cạnh.`, hint: 'Cạnh nối hai đỉnh đứng liền nhau.' });
        }
        const nm = pickOne(TRI), [A, B, C] = nm.split('');
        return choices({ q: `Góc đỉnh ${A} của hình tam giác ${nm} được tạo bởi hai cạnh nào?`, visual: { fn: 'namedPolygonSVG', args: [3, nm] },
            options: shuffle([`${A}${B} và ${A}${C}`, `${A}${B} và ${B}${C}`, `${B}${C} và ${C}${A}`]), correct: `${A}${B} và ${A}${C}`,
            explanation: `Góc đỉnh ${A} có hai cạnh đi ra từ ${A}: ${A}${B} và ${A}${C}.` });
    }),
    tpl('g3.rect_square', 1, () => {
        const [s, t] = pickOne(RECT_FACTS);
        return yesNo({ q: `Đúng hay sai: ${s}`, yes: t, explanation: t ? `Đúng. ${s}` : 'Sai. Hình chữ nhật có 4 góc vuông, 2 cạnh dài bằng nhau, 2 cạnh ngắn bằng nhau; hình vuông có 4 góc vuông và 4 cạnh bằng nhau.' });
    }),
    tpl('g3.solids', 1, () => {
        const cube = chance(0.5);
        return choices({ q: `Đây là khối gì?`, visual: { fn: 'solidSVG', args: [cube ? 'cube' : 'box', pickOne(['blue', 'green', 'orange'])] }, options: ['Khối lập phương', 'Khối hộp chữ nhật', 'Khối trụ', 'Khối cầu'], shuffle: true, correct: cube ? 'Khối lập phương' : 'Khối hộp chữ nhật',
            explanation: cube ? 'Khối lập phương có 6 mặt đều là hình vuông bằng nhau.' : 'Khối hộp chữ nhật có 6 mặt là hình chữ nhật.' });
    }),
    tpl('g3.solids', 2, () => {
        const cube = chance(0.5), what = pickOne(['mặt', 'đỉnh', 'cạnh'] as const), n = { 'mặt': 6, 'đỉnh': 8, 'cạnh': 12 }[what];
        return single({ q: `${cube ? 'Khối lập phương' : 'Khối hộp chữ nhật'} có bao nhiêu ${what}?`, visual: { fn: 'solidSVG', args: [cube ? 'cube' : 'box', 'purple'] }, correct: n, wrong: [6, 8, 12, 4, 10].filter(x => x !== n),
            explanation: `${cube ? 'Khối lập phương' : 'Khối hộp chữ nhật'} có 6 mặt, 8 đỉnh, 12 cạnh.`, hint: 'Đếm cả những mặt, đỉnh, cạnh bị khuất phía sau.' });
    }, { noRankCheck: true }),
];

export const generateG3Geometry = fromTemplates(templates);
