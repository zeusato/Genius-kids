// Lớp 1 — Độ dài (g1_length): đo bằng thước (cm), dài hơn – ngắn hơn, cộng trừ số đo.
import { tpl, fromTemplates, single, choices, rint, pickOne, chance } from '../kit';
import { around } from '../wrongs';
import type { Template } from '../../study/types';

const cm = (n: number) => `${n} cm`;
const THINGS = ['bút chì', 'cái bút', 'cục tẩy dài', 'chiếc lá', 'que kem'];
const COLORS = [['đỏ', 'red'], ['xanh', 'blue'], ['vàng', 'yellow'], ['tím', 'purple']] as const;

export const templates: Template[] = [
    tpl('g1.length_cm', 1, () => {
        const len = rint(2, 12), t = pickOne(THINGS);
        return single({ q: `${t[0].toUpperCase() + t.slice(1)} dài bao nhiêu xăng-ti-mét?`, speech: `Đầu vật đặt ở vạch số 0. Vật dài bao nhiêu xăng-ti-mét?`,
            visual: { fn: 'rulerSVG', args: [len, { max: len <= 8 ? 10 : 15 }] }, correct: len, wrong: around(len, { min: 1, max: 15 }), format: cm, min: 1, max: 15,
            explanation: `Đầu vật ở vạch 0, cuối vật ở vạch ${len}: vật dài ${len} cm.`, hint: 'Xem cuối vật thẳng với vạch số mấy.' });
    }),
    tpl('g1.length_cm', 2, () => {
        const from = rint(1, 4), len = rint(2, 9);
        return single({ q: `Vật được đặt bắt đầu từ vạch ${from}. Vật dài bao nhiêu xăng-ti-mét?`, speech: `Vật được đặt bắt đầu từ vạch số ${from}. Vật dài bao nhiêu xăng-ti-mét?`,
            visual: { fn: 'rulerSVG', args: [len, { from, max: 15 }] }, correct: len, wrong: [from + len, ...around(len, { min: 1, max: 15 })], format: cm, min: 1, max: 15,
            explanation: `Cuối vật ở vạch ${from + len}, đầu vật ở vạch ${from}: ${from + len} - ${from} = ${len} cm.`, hint: 'Vật không đặt từ vạch 0 — phải lấy vạch cuối trừ vạch đầu.' });
    }),
    tpl('g1.length_compare', 1, () => {
        const [c1, c2] = pickOne([[COLORS[0], COLORS[1]], [COLORS[2], COLORS[3]], [COLORS[1], COLORS[2]]] as const);
        const a = rint(3, 15), b = pickOne([3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].filter(x => x !== a)), longer = chance(0.5);
        const ans = (a > b) === longer ? `Băng giấy màu ${c1[0]}` : `Băng giấy màu ${c2[0]}`;
        return choices({ q: `Băng giấy màu ${c1[0]} dài ${a} cm, băng giấy màu ${c2[0]} dài ${b} cm. Băng giấy nào ${longer ? 'dài hơn' : 'ngắn hơn'}?`,
            speech: `Băng giấy màu ${c1[0]} dài ${a} xăng-ti-mét, băng giấy màu ${c2[0]} dài ${b} xăng-ti-mét. Băng giấy nào ${longer ? 'dài hơn' : 'ngắn hơn'}?`,
            options: [`Băng giấy màu ${c1[0]}`, `Băng giấy màu ${c2[0]}`], correct: ans,
            explanation: `${Math.max(a, b)} cm dài hơn ${Math.min(a, b)} cm.` });
    }),
    tpl('g1.length_ops', 2, () => {
        const op = chance(0.5) ? '+' : '-', u = rint(3, 8), a = rint(1, 6) * 10 + u, b = op === '+' ? rint(1, 9 - u) : rint(1, u);
        const r = op === '+' ? a + b : a - b;
        return single({ q: `Tính: ${a} cm ${op} ${b} cm = ?`, speech: `${a} xăng-ti-mét ${op === '+' ? 'cộng' : 'trừ'} ${b} xăng-ti-mét bằng bao nhiêu?`,
            correct: r, wrong: around(r, { min: 0, max: 99 }), format: cm, min: 0, max: 99,
            explanation: `Tính như với số rồi viết thêm đơn vị: ${a} ${op} ${b} = ${r}, vậy ${a} cm ${op} ${b} cm = ${r} cm.` });
    }),
];

export const generateLength = fromTemplates(templates);
