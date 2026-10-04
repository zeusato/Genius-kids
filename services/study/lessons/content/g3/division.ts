// Lớp 3 — Phép chia (g3_division). Chuẩn soạn: docs/study-learn-plan.md mục 3, 5.4, 9.1.
import { explore, form, know, lesson, mistake, pic, rule, step, table, text, vis, widget, worked } from '../../build';
import type { LessonBook } from '../../types';

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
    'g3.div_tables': lesson('g3.div_tables', {
        v: 1,
        goal: 'thuộc bảng chia 3, 4, 6, 7, 8, 9 và dùng bảng chia để chia đều.',
        hook: { md: 'Có 24 cái kẹo chia đều cho 6 bạn. Mỗi bạn được mấy cái kẹo?', answer: 'Mỗi bạn được: 24 : 6 = 4 (cái kẹo).' },
        needs: ['g3.mul_tables'],
        know: [
            know('Chia là phép ngược của nhân',
                text('Từ một phép nhân, em viết được hai phép chia.'),
                rule('Lấy tích chia cho thừa số này thì được thừa số kia.', '6 × 4 = 24 → 24 : 6 = 4 và 24 : 4 = 6'),
                text('Muốn nhẩm 56 : 7, em nghĩ: 7 nhân mấy bằng 56? Vì 7 × 8 = 56 nên 56 : 7 = 8.'),
            ),
            know('Kéo để chia đều',
                widget(explore({
                    title: 'Chia đều kẹo vào các nhóm',
                    controls: {
                        n: { label: 'Số nhóm', min: 2, max: 9, init: 6 },
                        k: { label: 'Số kẹo mỗi nhóm', min: 1, max: 9, init: 4 },
                    },
                    visual: v => vis('countingSVG', '🍬', v.n * v.k, { perRow: v.k }),
                    caption: v => `Có ${v.n * v.k} cái kẹo chia đều thành ${v.n} nhóm, mỗi nhóm ${v.k} cái: ${v.n * v.k} : ${v.n} = ${v.k}.`,
                })),
            ),
        ],
        forms: [
            form({
                id: 'tinh', title: 'Dạng 1: Tính theo bảng chia', level: 1,
                cue: 'Đề cho phép chia trong bảng, ví dụ 54 : 6 = ?',
                steps: ['Nghĩ: số chia nhân mấy thì bằng số bị chia?', 'Số tìm được chính là thương.', 'Thử lại bằng phép nhân.'],
                example: worked({
                    layout: 'calc', problem: 'Tính: 54 : 6 = ?',
                    steps: [step('Nghĩ: 6 nhân mấy bằng 54?', '6 × 9 = 54'), step('Vậy thương là 9.', '54 : 6 = 9')],
                    answer: 'Vậy 54 : 6 = 9.',
                }),
            }),
            form({
                id: 'tim-so-chia', title: 'Dạng 2: Tìm số chia', level: 2,
                cue: 'Ô trống ở vị trí số chia, ví dụ 60 : ? = 10.',
                steps: ['Gọi tên: 60 là số bị chia, 10 là thương.', 'Muốn tìm số chia, lấy số bị chia chia cho thương.', 'Thử lại bằng phép chia.'],
                example: worked({
                    layout: 'calc', problem: 'Điền số thích hợp: 60 : ? = 10',
                    steps: [step('Số chia là:', '60 : 10 = 6')],
                    answer: 'Số cần điền là 6.', check: 'Thử lại: 60 : 6 = 10.',
                }),
            }),
            form({
                id: 'chia-deu', title: 'Dạng 3: Bài toán chia đều', level: 2,
                cue: 'Đề có các chữ "chia đều", "xếp đều", "mỗi … được mấy".',
                steps: ['Tìm tổng số đồ vật.', 'Tìm số phần (số nhóm, số hàng, số bạn).', 'Lấy tổng số chia cho số phần.', 'Viết đáp số kèm đơn vị.'],
                example: worked({
                    problem: 'Có 45 học sinh xếp đều thành 9 hàng. Hỏi mỗi hàng có bao nhiêu học sinh?',
                    steps: [step('Số học sinh mỗi hàng là:', '45 : 9 = 5 (học sinh)')],
                    answer: 'Đáp số: 5 học sinh.',
                }),
            }),
        ],
        mistakes: [
            mistake('Tìm số chia trong 60 : ? = 10, bạn Bi tính: 60 × 10 = 600.', '60 : 10 = 6.',
                'Nếu số chia là 600 thì 60 : 600 không bằng 10. Muốn tìm số chia, ta lấy số bị chia chia cho thương.'),
            mistake('Bạn Bi nhẩm: 63 : 9 = 8.', '63 : 9 = 7.', 'Thử lại: 9 × 8 = 72, không bằng 63. Còn 9 × 7 = 63 nên thương là 7.'),
        ],
        remember: [
            'Chia là phép ngược của nhân: 6 × 9 = 54 nên 54 : 6 = 9.',
            'Nhẩm: số chia nhân mấy thì bằng số bị chia.',
            'Muốn tìm số chia, lấy số bị chia chia cho thương.',
            '"Chia đều", "mỗi … được mấy" là phép chia.',
        ],
    }),
    'g3.times_less': lesson('g3.times_less', {
        v: 1,
        goal: 'giảm được một số đi nhiều lần và phân biệt "giảm đi … lần" với "bớt đi …".',
        hook: { md: 'Nam có 15 viên bi. Số bi của em Nam giảm đi 3 lần so với số bi của Nam. Em Nam có mấy viên bi?', answer: 'Em Nam có: 15 : 3 = 5 (viên bi).' },
        needs: ['g3.div_tables'],
        know: [
            know('Giảm đi nhiều lần',
                text('Giảm 15 đi 3 lần nghĩa là chia 15 thành 3 phần bằng nhau rồi lấy một phần.'),
                pic('segmentDiagramSVG', [{ label: 'Nam', parts: [5, 5, 5], labels: ['5', '5', '5'] }, { label: 'Em Nam', parts: [5], labels: ['?'] }], 'Nam: 15 viên'),
                rule('Muốn giảm một số đi nhiều lần, ta chia số đó cho số lần.'),
            ),
            know('Đừng nhầm bốn cách nói',
                table(['Cách nói', 'Phép tính', 'Ví dụ'], [
                    ['Giảm 12 đi 3 lần', 'Phép chia', '12 : 3 = 4'],
                    ['Bớt 12 đi 3', 'Phép trừ', '12 − 3 = 9'],
                    ['Gấp 12 lên 3 lần', 'Phép nhân', '12 × 3 = 36'],
                    ['Thêm 3 vào 12', 'Phép cộng', '12 + 3 = 15'],
                ]),
            ),
        ],
        forms: [
            form({
                id: 'giam-so', title: 'Dạng 1: Giảm một số đi nhiều lần', level: 2,
                cue: 'Đề hỏi "Giảm a đi n lần được bao nhiêu?"',
                steps: ['Xác định số cần giảm và số lần.', 'Lấy số đó chia cho số lần.'],
                example: worked({
                    layout: 'calc', problem: 'Giảm 42 đi 6 lần được bao nhiêu?',
                    steps: [step('Giảm 42 đi 6 lần là lấy 42 chia cho 6:', '42 : 6 = 7')],
                    answer: 'Vậy giảm 42 đi 6 lần được 7.',
                }),
            }),
            form({
                id: 'loi-van', title: 'Dạng 2: Bài toán "giảm đi … lần"', level: 3,
                cue: 'Đề có câu "… **giảm đi** n lần so với …" và hỏi số bé hơn.',
                steps: ['Tìm số đã biết.', 'Lấy số đó chia cho số lần.', 'Viết câu trả lời và đáp số kèm đơn vị.'],
                example: worked({
                    problem: 'Một bao gạo nặng 16 kg. Lan mang về số gạo bằng bao gạo giảm đi 2 lần. Hỏi Lan mang về bao nhiêu ki-lô-gam gạo?',
                    steps: [step('Số gạo Lan mang về là:', '16 : 2 = 8 (kg)')],
                    answer: 'Đáp số: 8 kg gạo.',
                }),
            }),
        ],
        mistakes: [
            mistake('Giảm 12 đi 3 lần, bạn Bi tính: 12 − 3 = 9.', '12 : 3 = 4.', '"Giảm đi 3 lần" là chia cho 3. "Bớt đi 3" mới là trừ đi 3.'),
        ],
        remember: [
            'Giảm một số đi nhiều lần: lấy số đó chia cho số lần.',
            'Gấp lên dùng phép nhân, giảm đi dùng phép chia.',
            'Thêm dùng phép cộng, bớt dùng phép trừ.',
        ],
    }),
    'g3.how_many_times': lesson('g3.how_many_times', {
        v: 1,
        goal: 'tìm được số lớn gấp mấy lần số bé, và số bé bằng một phần mấy số lớn.',
        hook: { md: 'An có 12 viên bi, Bình có 4 viên bi. Số bi của An gấp mấy lần số bi của Bình?', answer: 'Số bi của An gấp số bi của Bình: 12 : 4 = 3 (lần).' },
        needs: ['g3.times_more'],
        know: [
            know('Gấp mấy lần',
                pic('segmentDiagramSVG', [{ label: 'An', parts: [4, 4, 4], labels: ['4', '4', '4'] }, { label: 'Bình', parts: [4], labels: ['4'] }]),
                text('Đoạn của An gồm 3 đoạn bằng đoạn của Bình, nên số bi của An gấp 3 lần số bi của Bình.'),
                rule('Muốn tìm số lớn gấp mấy lần số bé, ta lấy số lớn chia cho số bé.'),
            ),
            know('Số bé bằng một phần mấy số lớn',
                text('Số lớn gấp 3 lần số bé thì số bé bằng **1/3** số lớn.'),
                widget(explore({
                    title: 'Đổi số bé và số lần',
                    controls: {
                        b: { label: 'Số bé', min: 2, max: 9, init: 4 },
                        n: { label: 'Số lớn gấp số bé', min: 2, max: 6, init: 3, unit: 'lần' },
                    },
                    visual: v => vis('segmentDiagramSVG', [{ label: 'Số lớn', parts: Array(v.n).fill(v.b), labels: Array(v.n).fill(String(v.b)) }, { label: 'Số bé', parts: [v.b], labels: [String(v.b)] }]),
                    caption: v => `Số lớn là ${v.b * v.n}, số bé là ${v.b}: ${v.b * v.n} : ${v.b} = ${v.n}. Số lớn gấp ${v.n} lần số bé; số bé bằng 1/${v.n} số lớn.`,
                })),
            ),
        ],
        forms: [
            form({
                id: 'gap-may-lan', title: 'Dạng 1: Số lớn gấp mấy lần số bé', level: 2,
                cue: 'Đề cho hai số và hỏi "số lớn **gấp mấy lần** số bé?"',
                steps: ['Tìm số lớn và số bé.', 'Lấy số lớn chia cho số bé.', 'Trả lời: số lớn gấp … lần số bé.'],
                example: worked({
                    layout: 'calc', problem: 'Số lớn là 30, số bé là 6. Số lớn gấp mấy lần số bé?',
                    steps: [step('Lấy số lớn chia cho số bé:', '30 : 6 = 5')],
                    answer: 'Số lớn gấp 5 lần số bé.',
                }),
            }),
            form({
                id: 'mot-phan-may', title: 'Dạng 2: Số bé bằng một phần mấy số lớn', level: 2,
                cue: 'Đề hỏi "số bé bằng **một phần mấy** số lớn?"',
                steps: ['Tìm xem số lớn gấp mấy lần số bé.', 'Số lớn gấp n lần thì số bé bằng 1/n số lớn.'],
                example: worked({
                    layout: 'calc', problem: 'Số bé là 7, số lớn là 28. Số bé bằng một phần mấy số lớn?',
                    steps: [step('Số lớn gấp số bé số lần là:', '28 : 7 = 4 (lần)'), step('Số lớn gấp 4 lần số bé nên số bé bằng 1/4 số lớn.')],
                    answer: 'Số bé bằng 1/4 số lớn.',
                }),
            }),
            form({
                id: 'loi-van', title: 'Dạng 3: Bài toán gấp mấy lần', level: 3,
                cue: 'Bài toán có lời văn hỏi "… gấp mấy lần …?"',
                steps: ['Tìm hai số cần so sánh.', 'Lấy số lớn chia cho số bé.', 'Đơn vị của đáp số là "lần".'],
                example: worked({
                    problem: 'An có 36 viên bi, Hoa có 9 viên bi. Hỏi số bi của An gấp mấy lần số bi của Hoa?',
                    steps: [step('Số bi của An gấp số bi của Hoa số lần là:', '36 : 9 = 4 (lần)')],
                    answer: 'Đáp số: 4 lần.',
                }),
            }),
        ],
        mistakes: [
            mistake('An có 36 viên bi, Hoa có 9 viên bi. Bạn Bi tính: 36 − 9 = 27 (lần).', '36 : 9 = 4 (lần).',
                'Hỏi "gấp mấy lần" thì dùng phép chia. Phép trừ chỉ cho biết An có nhiều hơn Hoa bao nhiêu viên.'),
        ],
        remember: [
            'Số lớn gấp mấy lần số bé: lấy số lớn chia cho số bé.',
            'Số lớn gấp n lần số bé thì số bé bằng 1/n số lớn.',
            '"Gấp mấy lần" dùng phép chia, "nhiều hơn bao nhiêu" dùng phép trừ.',
        ],
    }),
} satisfies LessonBook;
