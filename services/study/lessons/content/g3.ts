// Bài học — Lớp 3. Chuẩn soạn: docs/study-learn-plan.md mục 3, 5.4, 9.1.
import { form, know, lesson, mistake, rule, step, text, widget, worked } from '../build';
import type { LessonBook } from '../types';

export default {
    'g3.div_1digit': lesson('g3.div_1digit', {
        v: 1,
        goal: 'đặt tính và chia được số có hai, ba chữ số cho số có một chữ số, kể cả phép chia có dư.',
        hook: {
            md: 'Cô có 96 cái kẹo, chia đều cho 4 bạn. Mỗi bạn được bao nhiêu cái kẹo?',
            answer: 'Mỗi bạn được: 96 : 4 = 24 (cái kẹo).',
        },
        needs: ['g3.div_tables'],
        know: [
            know('Đặt tính chia',
                text('Viết **số bị chia** bên trái, **số chia** bên phải, kẻ vạch ngăn. **Thương** viết dưới số chia.'),
                rule('Chia lần lượt từ hàng cao nhất. Mỗi lượt làm bốn việc: chia, nhân, trừ, hạ.', '{Chia} → {Nhân} → {Trừ} → {Hạ}'),
                widget({ w: 'long-division', a: 948, b: 4, layout: 'short' }),
            ),
            know('Phép chia có dư',
                text('Có lúc chia đến lượt cuối vẫn còn thừa. Số còn thừa gọi là **số dư**.'),
                rule('Số dư luôn bé hơn số chia.'),
                rule('Thương nhân với số chia rồi cộng số dư thì được số bị chia.', '{Thương} × {Số chia} + {Số dư} = {Số bị chia}', 'Thử lại'),
            ),
        ],
        forms: [
            form({
                id: 'hai-chu-so', title: 'Dạng 1: Chia số có hai chữ số', level: 1,
                cue: 'Đề cho số có hai chữ số chia cho số có một chữ số, ví dụ 92 : 2.',
                steps: [
                    'Đặt tính: số bị chia bên trái, số chia bên phải.',
                    'Chia chữ số hàng chục trước, viết kết quả vào thương.',
                    'Nhân ngược lại rồi trừ để tìm số còn thừa.',
                    'Hạ chữ số hàng đơn vị xuống, chia tiếp.',
                    'Thử lại bằng phép nhân.',
                ],
                example: worked({
                    layout: 'calc',
                    problem: 'Đặt tính rồi tính: 92 : 2',
                    steps: [
                        step('9 chia 2 được 4, viết 4. 4 nhân 2 bằng 8; 9 trừ 8 bằng 1.', '4 × 2 = 8; 9 − 8 = 1'),
                        step('Hạ 2, được 12. 12 chia 2 được 6, viết 6. 6 nhân 2 bằng 12; 12 trừ 12 bằng 0.', '6 × 2 = 12; 12 − 12 = 0'),
                    ],
                    answer: 'Vậy 92 : 2 = 46.',
                    check: 'Thử lại: 46 × 2 = 92.',
                    replay: { w: 'long-division', a: 92, b: 2 },
                }),
            }),
            form({
                id: 'ba-chu-so', title: 'Dạng 2: Chia số có ba chữ số', level: 2,
                cue: 'Đề cho số có ba chữ số chia cho số có một chữ số, ví dụ 948 : 4.',
                steps: [
                    'Đặt tính.',
                    'Lấy chữ số hàng trăm chia trước. Nếu chữ số đó bé hơn số chia thì lấy hai chữ số đầu.',
                    'Mỗi lượt: chia, nhân, trừ, hạ.',
                    'Lượt nào không đủ để chia thì viết 0 vào thương.',
                    'Thử lại bằng phép nhân.',
                ],
                example: worked({
                    layout: 'calc',
                    problem: 'Đặt tính rồi tính: 948 : 4',
                    steps: [
                        step('9 chia 4 được 2, viết 2. 2 nhân 4 bằng 8; 9 trừ 8 bằng 1.', '2 × 4 = 8; 9 − 8 = 1'),
                        step('Hạ 4, được 14. 14 chia 4 được 3, viết 3. 3 nhân 4 bằng 12; 14 trừ 12 bằng 2.', '3 × 4 = 12; 14 − 12 = 2'),
                        step('Hạ 8, được 28. 28 chia 4 được 7, viết 7. 7 nhân 4 bằng 28; 28 trừ 28 bằng 0.', '7 × 4 = 28; 28 − 28 = 0'),
                    ],
                    answer: 'Vậy 948 : 4 = 237.',
                    check: 'Thử lại: 237 × 4 = 948.',
                    replay: { w: 'long-division', a: 948, b: 4 },
                }),
            }),
            form({
                id: 'co-du', title: 'Dạng 3: Phép chia có dư', level: 3,
                cue: 'Chia đến lượt cuối mà vẫn còn thừa (khác 0) thì đó là phép chia có dư.',
                steps: [
                    'Đặt tính và chia như phép chia hết.',
                    'Số còn lại ở lượt cuối là số dư.',
                    'Kiểm tra số dư bé hơn số chia.',
                    'Thử lại: thương × số chia + số dư = số bị chia.',
                ],
                example: worked({
                    layout: 'calc',
                    problem: 'Đặt tính rồi tính: 186 : 4',
                    steps: [
                        step('1 bé hơn 4 nên lấy 18. 18 chia 4 được 4, viết 4. 4 nhân 4 bằng 16; 18 trừ 16 bằng 2.', '4 × 4 = 16; 18 − 16 = 2'),
                        step('Hạ 6, được 26. 26 chia 4 được 6, viết 6. 6 nhân 4 bằng 24; 26 trừ 24 bằng 2.', '6 × 4 = 24; 26 − 24 = 2'),
                    ],
                    answer: 'Vậy 186 : 4 = 46 (dư 2).',
                    check: 'Thử lại: 46 × 4 + 2 = 186.',
                    replay: { w: 'long-division', a: 186, b: 4 },
                }),
            }),
        ],
        mistakes: [
            mistake('Bạn Bi tính: 186 : 4 = 45 (dư 6).',
                '186 : 4 = 46 (dư 2).',
                'Số dư 6 lớn hơn số chia 4, nghĩa là còn chia tiếp được. Số dư luôn phải bé hơn số chia.'),
            mistake('Bạn Bi tính: 812 : 4 = 23.',
                '812 : 4 = 203.',
                'Hạ 1 xuống, 1 không chia được cho 4. Phải viết 0 vào thương rồi mới hạ 2.'),
        ],
        remember: [
            'Chia từ hàng cao nhất; mỗi lượt: chia, nhân, trừ, hạ.',
            'Lượt nào không đủ để chia thì viết 0 vào thương.',
            'Số dư luôn bé hơn số chia.',
            'Thử lại: thương × số chia + số dư = số bị chia.',
        ],
    }),
} satisfies LessonBook;
