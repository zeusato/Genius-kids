// Lớp 4 — Hai đường thẳng vuông góc, hai đường thẳng song song (g4_lines).
import { tpl, fromTemplates, choices, single, rint, pickOne } from '../kit';
import type { Template } from '../../study/types';

const NAMES = ['ABCD', 'MNPQ', 'EGHK', 'ABMN'];
const REL = { parallel: 'Song song', perpendicular: 'Vuông góc', intersect: 'Cắt nhau nhưng không vuông góc' } as const;

export const templates: Template[] = [
    tpl('g4.perp_parallel', 1, () => {
        const kind = pickOne(['parallel', 'perpendicular', 'intersect'] as const), nm = pickOne(NAMES), tilt = pickOne([0, 0, 15, -20, 30]);
        return choices({ q: `Đường thẳng ${nm.slice(0, 2)} và đường thẳng ${nm.slice(2)} trong hình:`, visual: { fn: 'linePairSVG', args: [kind, nm, tilt] }, options: Object.values(REL), correct: REL[kind],
            explanation: kind === 'parallel' ? 'Hai đường thẳng không bao giờ cắt nhau dù kéo dài mãi: song song.' : kind === 'perpendicular' ? 'Hai đường thẳng cắt nhau tạo thành 4 góc vuông: vuông góc.' : 'Hai đường thẳng cắt nhau nhưng các góc tạo thành không phải góc vuông.',
            hint: 'Dùng ê-ke kiểm tra góc tạo bởi hai đường thẳng.' });
    }),
    tpl('g4.perp_parallel', 2, () => {
        const kind = rint(0, 2);
        if (kind === 0) return single({ q: 'Hình chữ nhật ABCD có mấy cặp cạnh song song?', visual: { fn: 'namedPolygonSVG', args: [4, 'ABCD', 'blue', true] }, correct: 2, wrong: [1, 3, 4, 0], closed: true, explanation: 'AB song song với DC, AD song song với BC: có 2 cặp cạnh song song.' });
        if (kind === 1) return single({ q: 'Hình chữ nhật có mấy cặp cạnh vuông góc với nhau?', correct: 4, wrong: [2, 3, 1, 0], closed: true, explanation: 'Hình chữ nhật có 4 góc vuông, mỗi góc là một cặp cạnh vuông góc: 4 cặp.' });
        return choices({ q: 'Hai đường thẳng cùng vuông góc với một đường thẳng thứ ba thì:', options: ['Song song với nhau', 'Vuông góc với nhau', 'Cắt nhau'], correct: 'Song song với nhau', explanation: 'Chúng cách đều nhau nên không bao giờ cắt nhau: song song.' });
    }, { noRankCheck: true }),
];

export const generateLines = fromTemplates(templates);
