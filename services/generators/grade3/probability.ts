// Lớp 3 — Khả năng xảy ra của một sự kiện (g3_probability) — MỚI theo GDPT 2018.
import { tpl, fromTemplates, choices, rint, pickOne, sample, shuffle } from '../kit';
import type { Template } from '../../study/types';
import type { ColorKey } from '../svg';

const OPTS = ['Chắc chắn', 'Có thể', 'Không thể'];
const NAME: Partial<Record<ColorKey, string>> = { red: 'đỏ', blue: 'xanh dương', yellow: 'vàng', green: 'xanh lá' };

export const templates: Template[] = [
    tpl('g3.chance', 1, () => {
        const kind = rint(0, 2), n = rint(1, 6);
        const ev = [`Gieo một con xúc xắc, mặt xuất hiện có số chấm bé hơn 7`, `Gieo một con xúc xắc, xuất hiện mặt ${n} chấm`, `Gieo một con xúc xắc, xuất hiện mặt ${n + 6} chấm`][kind];
        return choices({ q: `Sự kiện "${ev}" là:`, options: OPTS, correct: OPTS[kind],
            explanation: ['Xúc xắc có các mặt từ 1 đến 6 chấm, đều bé hơn 7: chắc chắn xảy ra.', `Mặt ${n} chấm có thể xuất hiện, cũng có thể không.`, `Xúc xắc không có mặt ${n + 6} chấm: không thể xảy ra.`][kind] });
    }),
    tpl('g3.chance', 2, () => {
        const [c1, c2, c3] = sample(['red', 'blue', 'yellow', 'green'] as ColorKey[], 3), a = rint(2, 6), b = rint(1, 5);
        const balls = [{ color: c1, n: a }, { color: c2, n: b }];
        const q = pickOne([
            [`Lấy 1 quả bóng: lấy được bóng ${NAME[c1]} hoặc ${NAME[c2]}`, 'Chắc chắn'],
            [`Lấy 1 quả bóng: lấy được bóng ${NAME[c2]}`, 'Có thể'],
            [`Lấy 1 quả bóng: lấy được bóng ${NAME[c3]}`, 'Không thể'],
            [`Lấy ${a + b + 1} quả bóng cùng lúc từ hộp`, 'Không thể'],
        ] as const);
        return choices({ q: `Trong hộp có ${a} quả bóng ${NAME[c1]} và ${b} quả bóng ${NAME[c2]}. Sự kiện "${q[0]}" là:`, visual: { fn: 'bagSVG', args: [balls] }, options: shuffle(OPTS), correct: q[1],
            explanation: q[1] === 'Chắc chắn' ? 'Mọi quả bóng trong hộp đều thuộc hai màu đó.' : q[1] === 'Có thể' ? 'Hộp có bóng màu này nhưng cũng có màu khác.' : 'Điều đó không thể xảy ra với số bóng và màu bóng trong hộp.' });
    }),
];

export const generateG3Probability = fromTemplates(templates);
