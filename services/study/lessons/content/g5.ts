// Bài học — Lớp 5. Chuẩn soạn: docs/study-learn-plan.md mục 3, 5.4, 9.2.
import { explore, form, know, lesson, mistake, pic, rule, step, text, vis, widget, worked } from '../build';
import type { LessonBook } from '../types';

const bars = (n: number) => ({ parts: Array(n).fill(1), labels: Array(n).fill('') });

export default {
    'g5.sum_diff_ratio': lesson('g5.sum_diff_ratio', {
        v: 1,
        goal: 'giải được bài toán tìm hai số khi biết tổng và tỉ số, hoặc biết hiệu và tỉ số của hai số đó.',
        hook: {
            md: 'Lớp em có 35 bạn. Số bạn nam bằng 2/3 số bạn nữ. Không cần điểm danh, làm sao biết lớp có bao nhiêu bạn nam?',
            answer: 'Tổng số phần: 2 + 3 = 5. Một phần: 35 : 5 = 7. Số bạn nam: 7 × 2 = 14 (bạn).',
        },
        needs: ['g5.ratio'],
        know: [
            know('Tỉ số và những phần bằng nhau',
                text('"Số bạn nam bằng 2/3 số bạn nữ" nghĩa là: số bạn nữ gồm **3 phần bằng nhau** thì số bạn nam gồm **2 phần** như thế.'),
                pic('segmentDiagramSVG', [{ label: 'Nam', ...bars(2) }, { label: 'Nữ', ...bars(3) }], 'Tổng: 35 bạn'),
                rule('Tử số chỉ số phần của đại lượng đứng trước chữ "bằng"; mẫu số chỉ số phần của đại lượng đứng sau.'),
            ),
            know('Kéo để quan sát',
                widget(explore({
                    title: 'Đổi số phần và giá trị một phần',
                    controls: {
                        a: { label: 'Số phần của số bé', min: 1, max: 5, init: 2 },
                        b: { label: 'Số phần của số lớn', min: 2, max: 9, init: 3 },
                        k: { label: 'Giá trị một phần', min: 2, max: 20, init: 7 },
                    },
                    valid: v => (v.a < v.b ? null : 'Số bé phải có ít phần hơn số lớn.'),
                    visual: v => vis('segmentDiagramSVG', [{ label: 'Số bé', ...bars(v.a) }, { label: 'Số lớn', ...bars(v.b) }], `Tổng: ${v.k * (v.a + v.b)}`),
                    caption: v => `Tổng số phần: ${v.a} + ${v.b} = ${v.a + v.b}. Tổng: ${v.k} × ${v.a + v.b} = ${v.k * (v.a + v.b)}. Số bé: ${v.k} × ${v.a} = ${v.k * v.a}; số lớn: ${v.k} × ${v.b} = ${v.k * v.b}.`,
                })),
            ),
        ],
        forms: [
            form({
                id: 'tong-ti', title: 'Dạng 1: Biết tổng và tỉ số', level: 3,
                cue: 'Đề cho **tổng** của hai số và **tỉ số** của chúng (hoặc "số này bằng a/b số kia").',
                steps: [
                    'Vẽ sơ đồ: số bé mấy phần, số lớn mấy phần.',
                    'Tìm tổng số phần bằng nhau.',
                    'Tìm giá trị một phần: lấy tổng chia cho tổng số phần.',
                    'Tìm số bé, rồi tìm số lớn.',
                    'Viết đáp số và thử lại.',
                ],
                example: worked({
                    problem: 'Tổng của hai số là 96. Tỉ số của hai số là 3/5. Tìm hai số đó.',
                    visual: vis('segmentDiagramSVG', [{ label: 'Số bé', ...bars(3) }, { label: 'Số lớn', ...bars(5) }], 'Tổng: 96'),
                    steps: [
                        step('Tổng số phần bằng nhau là:', '3 + 5 = 8 (phần)'),
                        step('Giá trị một phần là:', '96 : 8 = 12'),
                        step('Số bé là:', '12 × 3 = 36'),
                        step('Số lớn là:', '96 − 36 = 60'),
                    ],
                    answer: 'Đáp số: Số bé: 36; Số lớn: 60.',
                    check: 'Thử lại: 36 + 60 = 96 và 36 : 60 = 3/5.',
                }),
            }),
            form({
                id: 'hieu-ti', title: 'Dạng 2: Biết hiệu và tỉ số', level: 3,
                cue: 'Đề cho **hiệu** của hai số (số này hơn số kia bao nhiêu) và **tỉ số**, kể cả cách nói "số lớn gấp n lần số bé".',
                steps: [
                    'Vẽ sơ đồ: số bé mấy phần, số lớn mấy phần.',
                    'Tìm hiệu số phần bằng nhau.',
                    'Tìm giá trị một phần: lấy hiệu chia cho hiệu số phần.',
                    'Tìm số bé, rồi tìm số lớn.',
                    'Viết đáp số và thử lại.',
                ],
                example: worked({
                    problem: 'Hiệu của hai số là 30. Số lớn gấp 4 lần số bé. Tìm hai số đó.',
                    visual: vis('segmentDiagramSVG', [{ label: 'Số bé', parts: [1], labels: ['?'] }, { label: 'Số lớn', parts: [1, 3], labels: ['', '30'] }]),
                    steps: [
                        step('Số lớn gấp 4 lần số bé nên số bé là 1 phần, số lớn là 4 phần. Hiệu số phần bằng nhau là:', '4 − 1 = 3 (phần)'),
                        step('Giá trị một phần, cũng là số bé:', '30 : 3 = 10'),
                        step('Số lớn là:', '10 + 30 = 40'),
                    ],
                    answer: 'Đáp số: Số bé: 10; Số lớn: 40.',
                    check: 'Thử lại: 40 − 10 = 30 và 40 : 10 = 4.',
                }),
            }),
        ],
        mistakes: [
            mistake('Tổng là 96, tỉ số 3/5. Bạn Bi tính một phần: 96 : 3 = 32.',
                'Một phần: 96 : (3 + 5) = 12.',
                'Tổng 96 gồm cả 3 phần của số bé và 5 phần của số lớn, tất cả là 8 phần. Phải chia cho tổng số phần.'),
            mistake('Hiệu là 30, số lớn gấp 4 lần số bé. Bạn Bi tính: 30 : (4 + 1) = 6.',
                'Một phần: 30 : (4 − 1) = 10.',
                'Hiệu là phần số lớn hơn số bé, đúng bằng 4 − 1 = 3 phần.'),
            mistake('"Số bạn nam bằng 2/3 số bạn nữ", bạn Bi vẽ: nam 3 phần, nữ 2 phần.',
                'Nam 2 phần, nữ 3 phần.',
                'Tử số 2 ứng với đại lượng đứng trước chữ "bằng", tức là số bạn nam.'),
        ],
        remember: [
            'Luôn vẽ sơ đồ đoạn thẳng trước khi tính.',
            'Tổng – tỉ: một phần = tổng : tổng số phần.',
            'Hiệu – tỉ: một phần = hiệu : hiệu số phần.',
            '"Số lớn gấp n lần số bé": số bé 1 phần, số lớn n phần.',
            'Thử lại: cộng (hoặc trừ) hai số rồi kiểm tra tỉ số.',
        ],
    }),
} satisfies LessonBook;
