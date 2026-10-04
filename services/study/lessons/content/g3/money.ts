// Lớp 3 — Tiền Việt Nam (g3_money).
import { explore, form, know, lesson, mistake, pic, rule, step, text, vis, widget, worked } from '../../build';
import { fmt } from '../../../value';
import type { LessonBook } from '../../types';

const NOTES = [50000, 20000, 10000, 5000, 2000, 1000];
const change = (x: number) => { const out: number[] = []; for (const n of NOTES) while (x >= n) { out.push(n); x -= n; } return out; };

export default {
    'g3.money': lesson('g3.money', {
        v: 1,
        goal: 'nhận biết tiền Việt Nam đến 100 000 đồng, tính tổng số tiền và tiền trả lại.',
        hook: { md: 'Em mua cuốn truyện giá 18 000 đồng, đưa cô bán hàng tờ 20 000 đồng. Cô trả lại em bao nhiêu tiền?', answer: 'Cô trả lại em: 20 000 − 18 000 = 2000 (đồng).' },
        needs: ['g2.money'],
        know: [
            know('Các tờ tiền',
                pic('notesSVG', [1000, 2000, 5000, 10000, 20000, 50000, 100000]),
                text('Các tờ tiền thường gặp: 1000, 2000, 5000, 10 000, 20 000, 50 000 và 100 000 đồng.'),
            ),
            know('Tiền trả lại',
                rule('Tiền trả lại bằng số tiền đưa cho người bán trừ đi số tiền phải trả.', 'Tiền trả lại = {tiền đưa} − {tiền hàng}'),
                widget(explore({
                    title: 'Đưa tờ 20 000 đồng, mua món hàng giá bao nhiêu?',
                    controls: { p: { label: 'Giá món hàng (nghìn đồng)', min: 1, max: 19, init: 18 } },
                    visual: v => vis('notesSVG', change(20000 - v.p * 1000)),
                    caption: v => `Tiền trả lại: 20 000 − ${fmt(v.p * 1000)} = ${fmt(20000 - v.p * 1000)} (đồng).`,
                })),
            ),
        ],
        forms: [
            form({
                id: 'dem-tien', title: 'Dạng 1: Có tất cả bao nhiêu tiền?', level: 1,
                cue: 'Đề cho hình các tờ tiền và hỏi có tất cả bao nhiêu.',
                steps: ['Đọc mệnh giá từng tờ.', 'Cộng các mệnh giá lại.', 'Viết kết quả kèm chữ "đồng".'],
                example: worked({
                    layout: 'calc', problem: 'Có tất cả bao nhiêu tiền?',
                    visual: vis('notesSVG', [20000, 1000]),
                    steps: [step('Cộng hai tờ tiền:', '20 000 + 1000 = 21 000 (đồng)')],
                    answer: 'Có tất cả 21 000 đồng.',
                }),
            }),
            form({
                id: 'tra-lai', title: 'Dạng 2: Tiền trả lại', level: 2,
                cue: 'Đề cho giá món hàng và số tiền đưa cho người bán.',
                steps: ['Tìm số tiền đưa và số tiền phải trả.', 'Lấy tiền đưa trừ tiền phải trả.', 'Viết đáp số kèm "đồng".'],
                example: worked({
                    problem: 'Em mua một hộp bút màu giá 28 000 đồng và đưa cô bán hàng 50 000 đồng. Cô bán hàng trả lại em bao nhiêu tiền?',
                    steps: [step('Số tiền cô bán hàng trả lại em là:', '50 000 − 28 000 = 22 000 (đồng)')],
                    answer: 'Đáp số: 22 000 đồng.',
                }),
            }),
            form({
                id: 'nhieu-mon', title: 'Dạng 3: Mua nhiều món rồi tính tiền trả lại', level: 3,
                cue: 'Đề cho giá một món, số món mua và số tiền đưa.',
                steps: ['Tính tiền mua tất cả các món (phép nhân).', 'Tính tiền trả lại (phép trừ).', 'Viết đáp số.'],
                example: worked({
                    problem: 'Mẹ mua 3 quả bóng, mỗi quả giá 30 000 đồng. Mẹ đưa cô bán hàng 100 000 đồng. Cô bán hàng trả lại mẹ bao nhiêu tiền?',
                    steps: [step('Số tiền mua 3 quả bóng là:', '30 000 × 3 = 90 000 (đồng)'), step('Số tiền cô bán hàng trả lại mẹ là:', '100 000 − 90 000 = 10 000 (đồng)')],
                    answer: 'Đáp số: 10 000 đồng.',
                }),
            }),
        ],
        mistakes: [
            mistake('Mẹ mua 3 quả bóng, mỗi quả 30 000 đồng, đưa 100 000 đồng. Bạn Bi tính: 100 000 − 30 000 = 70 000 (đồng).',
                'Tiền 3 quả: 30 000 × 3 = 90 000 (đồng). Trả lại: 100 000 − 90 000 = 10 000 (đồng).', 'Bi quên nhân giá một quả với số quả bóng.'),
        ],
        remember: [
            'Tiền trả lại = tiền đưa − tiền phải trả.',
            'Mua nhiều món giống nhau: lấy giá một món nhân với số món.',
            'Viết số tiền kèm chữ "đồng".',
        ],
    }),
} satisfies LessonBook;
