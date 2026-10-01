// Lớp 2 — Hình học (g2_geometry_basic): điểm, đoạn thẳng, đường thẳng, đường cong, ba điểm thẳng hàng;
// đường gấp khúc và độ dài; hình tứ giác; khối trụ, khối cầu.
import { tpl, fromTemplates, single, choices, rint, pickOne, shuffle } from '../kit';
import { around } from '../wrongs';
import type { Template } from '../../study/types';

const NAMES = ['AB', 'MN', 'CD', 'PQ', 'EG', 'HK'];
const NAMES3 = ['ABC', 'MNP', 'DEG', 'HIK', 'OPQ', 'XYZ'];

export const templates: Template[] = [
    tpl('g2.points_lines', 1, () => {
        const kind = pickOne(['segment', 'line', 'curve'] as const), nm = pickOne(NAMES);
        const LINE_NAME = { segment: `Đoạn thẳng ${nm}`, line: `Đường thẳng ${nm}`, curve: 'Đường cong' };
        return choices({ q: 'Hình vẽ là gì?', speech: 'Hình vẽ là gì: đoạn thẳng, đường thẳng hay đường cong?', visual: { fn: 'linesSVG', args: [kind, nm] },
            options: Object.values(LINE_NAME), correct: LINE_NAME[kind],
            explanation: kind === 'segment' ? 'Đoạn thẳng có hai đầu là hai điểm A và B.' : kind === 'line' ? 'Đường thẳng kéo dài mãi về hai phía, không có điểm đầu, điểm cuối.' : 'Đường cong không thẳng, bị uốn cong.' });
    }),
    tpl('g2.points_lines', 2, () => {
        const yes = rint(0, 1) === 1, nm = pickOne(NAMES3), list = nm.split('').join(', ');
        return choices({ q: `Ba điểm ${list} có thẳng hàng không?`, speech: `Ba điểm ${list} có thẳng hàng không?`, visual: { fn: 'linesSVG', args: [yes ? 'collinear' : 'notCollinear', nm] },
            options: ['Thẳng hàng', 'Không thẳng hàng'], correct: yes ? 'Thẳng hàng' : 'Không thẳng hàng',
            explanation: yes ? 'Ba điểm cùng nằm trên một đường thẳng nên thẳng hàng.' : 'Không kẻ được một đường thẳng đi qua cả ba điểm nên chúng không thẳng hàng.', hint: 'Đặt thước thử: thước có đi qua cả ba điểm không?' });
    }),
    tpl('g2.polyline', 1, () => {
        const n = rint(2, 4), ls = Array.from({ length: n }, () => rint(2, 9)), total = ls.reduce((s, x) => s + x, 0);
        return single({ q: `Tính độ dài đường gấp khúc ${'ABCDE'.slice(0, n + 1)}.`, speech: `Tính độ dài đường gấp khúc ${'ABCDE'.slice(0, n + 1).split('').join(' ')}.`,
            visual: { fn: 'polylineSVG', args: [ls] }, correct: total, wrong: [total - ls[0], total + ls[n - 1], ...around(total, { min: 1, max: 50 })], format: x => `${x} cm`, min: 1, max: 50,
            explanation: `Độ dài đường gấp khúc là tổng độ dài các đoạn: ${ls.join(' + ')} = ${total} (cm).`, hint: 'Cộng độ dài tất cả các đoạn thẳng.' });
    }),
    tpl('g2.polyline', 2, () => {
        const n = rint(2, 3), ls = Array.from({ length: n }, () => rint(2, 9));
        return single({ q: `Đường gấp khúc ${'ABCD'.slice(0, n + 1)} có mấy đoạn thẳng?`, speech: `Đường gấp khúc ${'ABCD'.slice(0, n + 1).split('').join(' ')} có mấy đoạn thẳng?`, visual: { fn: 'polylineSVG', args: [ls] },
            correct: n, wrong: [n + 1, n - 1, n + 2], min: 1, max: 6, explanation: `Các đoạn thẳng: ${Array.from({ length: n }, (_, i) => 'ABCD'[i] + 'ABCD'[i + 1]).join(', ')} — có ${n} đoạn.` });
    }, { noRankCheck: true }),
    tpl('g2.quadrilateral', 1, () => {
        const items = shuffle(['quad', 'triangle', 'pentagon', 'circle'] as const);
        return single({ q: 'Hình số mấy là hình tứ giác?', speech: 'Hình số mấy là hình tứ giác?', visual: { fn: 'polygonsRowSVG', args: [items] },
            correct: items.indexOf('quad') + 1, wrong: [1, 2, 3, 4], keepOrder: true, explanation: 'Hình tứ giác có 4 cạnh và 4 đỉnh.' });
    }, { noRankCheck: true }),
    tpl('g2.quadrilateral', 2, () => {
        const items = shuffle(['quad', 'square', 'rect', 'triangle', 'pentagon'] as const).slice(0, 4);
        const n = items.filter(k => k === 'quad' || k === 'square' || k === 'rect').length;
        return single({ q: 'Có bao nhiêu hình tứ giác?', speech: 'Trong các hình được đánh số, có bao nhiêu hình tứ giác?', visual: { fn: 'polygonsRowSVG', args: [items] },
            correct: n, wrong: [1, 2, 3, 4, 0], min: 0, max: 4, explanation: 'Hình vuông, hình chữ nhật cũng là hình tứ giác vì có 4 cạnh.', hint: 'Đếm các hình có đúng 4 cạnh.' });
    }, { noRankCheck: true }),
    tpl('g2.shapes3d', 1, () => {
        const items = [['cylinder', 'Khối trụ', '🥫', 'Lon sữa'], ['sphere', 'Khối cầu', '⚽', 'Quả bóng'], ['cylinder', 'Khối trụ', '🥁', 'Cái trống'], ['sphere', 'Khối cầu', '🌍', 'Quả địa cầu'], ['cube', 'Khối lập phương', '🎲', 'Con xúc xắc'], ['box', 'Khối hộp chữ nhật', '📦', 'Thùng giấy'], ['cylinder', 'Khối trụ', '🕯️', 'Cây nến'], ['sphere', 'Khối cầu', '🍊', 'Quả cam'], ['box', 'Khối hộp chữ nhật', '🧱', 'Viên gạch'], ['cylinder', 'Khối trụ', '🧻', 'Cuộn giấy'], ['sphere', 'Khối cầu', '🏀', 'Quả bóng rổ'], ['box', 'Khối hộp chữ nhật', '🎁', 'Hộp quà']] as const;
        const [kind, name, e, obj] = pickOne(items), showObj = rint(0, 1) === 1;
        return choices({ q: showObj ? `${obj} có dạng khối gì?` : 'Đây là khối gì?', speech: showObj ? `${obj} có dạng khối gì?` : 'Đây là khối gì?',
            visual: showObj ? { fn: 'bigEmojiSVG', args: [e] } : { fn: 'solidSVG', args: [kind, 'orange'] },
            options: ['Khối trụ', 'Khối cầu', 'Khối lập phương', 'Khối hộp chữ nhật'], shuffle: true, correct: name,
            explanation: kind === 'cylinder' ? 'Khối trụ có hai mặt đáy là hình tròn.' : kind === 'sphere' ? 'Khối cầu tròn đều, lăn được mọi phía.' : kind === 'cube' ? 'Khối lập phương có 6 mặt là hình vuông.' : 'Khối hộp chữ nhật có các mặt là hình chữ nhật.' });
    }),
];

export const generateG2Geometry = fromTemplates(templates);
