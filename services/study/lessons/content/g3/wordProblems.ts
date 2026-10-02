// Lớp 3 — Bài toán hai bước (g3_word_problems).
import { explore, form, know, lesson, mistake, pic, rule, step, text, vis, widget, worked } from '../../build';
import type { LessonBook } from '../../types';

export default {
    'g3.word_2step': lesson('g3.word_2step', {
        v: 1,
        goal: 'giải được bài toán có lời văn cần hai bước tính và trình bày bài giải.',
        hook: { md: 'Mỗi hộp có 4 cái bánh. Minh có 5 hộp và đã cho bạn 6 cái. Minh còn bao nhiêu cái bánh?', answer: 'Minh có: 4 × 5 = 20 (cái). Minh còn: 20 − 6 = 14 (cái bánh).' },
        needs: ['g3.mul_tables', 'g3.div_tables'],
        know: [
            know('Bốn bước giải toán',
                rule('Đọc kĩ đề, tóm tắt, tìm cái cần tìm trước, rồi trình bày bài giải và thử lại.', '{Đọc đề} → {Tóm tắt} → {Tìm từng bước} → {Đáp số}'),
                text('Bài toán hai bước có một **cái chưa biết ở giữa**. Em tìm nó ở bước 1, rồi mới trả lời câu hỏi ở bước 2.'),
            ),
            know('Trình bày bài giải',
                text('Mỗi phép tính có một **câu lời giải** ở trên. Phép tính có đơn vị trong ngoặc ở cuối. Dòng cuối là **Đáp số**.'),
                text('Bài giải\n\nSố bánh Minh có là:\n\n4 × 5 = 20 (cái)\n\nSố bánh Minh còn lại là:\n\n20 − 6 = 14 (cái)\n\nĐáp số: 14 cái bánh.'),
            ),
        ],
        forms: [
            form({
                id: 'chia-roi-bot', title: 'Dạng 1: Chia đều rồi thêm, bớt', level: 2,
                cue: 'Bước 1 phải chia đều để tìm số của một nhóm, bước 2 mới thêm hoặc bớt.',
                steps: ['Tìm số đồ vật của một nhóm bằng phép chia.', 'Thêm hoặc bớt theo câu hỏi.', 'Viết đáp số.'],
                example: worked({
                    problem: 'Có 44 quả cam xếp đều vào 4 giỏ. Mẹ lấy ra 6 quả từ một giỏ. Hỏi giỏ đó còn lại bao nhiêu quả cam?',
                    steps: [step('Số cam trong mỗi giỏ là:', '44 : 4 = 11 (quả)'), step('Số cam còn lại trong giỏ đó là:', '11 − 6 = 5 (quả)')],
                    answer: 'Đáp số: 5 quả cam.',
                }),
            }),
            form({
                id: 'gap-roi-cong', title: 'Dạng 2: Gấp lên rồi tính tổng', level: 3,
                cue: 'Đề có "gấp n lần" rồi hỏi **cả hai** có bao nhiêu.',
                steps: ['Tìm số gấp lên bằng phép nhân.', 'Cộng hai số để được cả hai.', 'Viết đáp số.'],
                example: worked({
                    problem: 'Nam gấp được 7 ngôi sao. Số ngôi sao Bình gấp được gấp 5 lần số ngôi sao của Nam. Hỏi cả hai bạn gấp được bao nhiêu ngôi sao?',
                    visual: vis('segmentDiagramSVG', [{ label: 'Nam', parts: [1], labels: ['7'] }, { label: 'Bình', parts: [1, 1, 1, 1, 1], labels: ['', '', '?', '', ''] }], 'Cả hai: ?'),
                    steps: [step('Số ngôi sao Bình gấp được là:', '7 × 5 = 35 (ngôi sao)'), step('Cả hai bạn gấp được là:', '7 + 35 = 42 (ngôi sao)')],
                    answer: 'Đáp số: 42 ngôi sao.',
                }),
            }),
            form({
                id: 'rut-ve-don-vi', title: 'Dạng 3: Rút về đơn vị', level: 3,
                cue: 'Đề cho giá tiền hay số lượng của **nhiều** vật như nhau, hỏi của một số vật khác.',
                steps: ['Bước 1 tìm giá trị của **một** vật (phép chia).', 'Bước 2 tìm giá trị của số vật cần hỏi (phép nhân).', 'Viết đáp số.'],
                example: worked({
                    problem: 'Mua 4 quyển vở hết 16 nghìn đồng. Hỏi mua 2 quyển vở như thế hết bao nhiêu nghìn đồng?',
                    steps: [step('Giá tiền một quyển vở là:', '16 : 4 = 4 (nghìn đồng)'), step('Mua 2 quyển vở hết số tiền là:', '4 × 2 = 8 (nghìn đồng)')],
                    answer: 'Đáp số: 8 nghìn đồng.',
                }),
            }),
        ],
        mistakes: [
            mistake('Bài cam ở Dạng 1: bạn Bi chỉ tính 44 : 4 = 11 rồi viết đáp số 11 quả.', 'Còn bước 2: 11 − 6 = 5 (quả).',
                'Đề hỏi giỏ đó còn lại bao nhiêu quả, không hỏi mỗi giỏ có bao nhiêu. Đọc lại câu hỏi trước khi viết đáp số.'),
        ],
        remember: [
            'Bài toán hai bước: tìm "cái chưa biết ở giữa" trước.',
            'Mỗi phép tính có câu lời giải và đơn vị.',
            'Đọc lại câu hỏi trước khi viết đáp số.',
        ],
    }),
    'g3.sum_diff': lesson('g3.sum_diff', {
        v: 1,
        goal: 'tìm được hai số khi biết tổng và hiệu của hai số đó.',
        hook: { md: 'An và Bình có tất cả 20 viên bi. An nhiều hơn Bình 4 viên. Mỗi bạn có mấy viên bi?', answer: 'An có: (20 + 4) : 2 = 12 (viên). Bình có: 12 − 4 = 8 (viên).' },
        needs: ['g3.word_2step'],
        know: [
            know('Sơ đồ tổng và hiệu',
                pic('segmentDiagramSVG', [{ label: 'Số bé', parts: [8], labels: ['?'] }, { label: 'Số lớn', parts: [8, 4], labels: ['?', '4'] }], 'Tổng: 20'),
                text('Bớt phần hơn 4 ở số lớn thì hai số bằng nhau. Khi đó tổng còn 20 − 4 = 16, mỗi số là 16 : 2 = 8.'),
                rule('Số lớn bằng tổng cộng hiệu rồi chia cho 2. Số bé bằng tổng trừ hiệu rồi chia cho 2.', 'Số lớn = ({Tổng} + {Hiệu}) : 2'),
            ),
            know('Kéo để quan sát',
                widget(explore({
                    title: 'Đổi số bé và hiệu',
                    controls: {
                        s: { label: 'Số bé', min: 5, max: 30, init: 8 },
                        d: { label: 'Hiệu (số lớn hơn số bé)', min: 1, max: 15, init: 4 },
                    },
                    visual: v => vis('segmentDiagramSVG', [{ label: 'Số bé', parts: [v.s], labels: [String(v.s)] }, { label: 'Số lớn', parts: [v.s, v.d], labels: [String(v.s + v.d), String(v.d)] }], `Tổng: ${2 * v.s + v.d}`),
                    caption: v => `Tổng ${2 * v.s + v.d}, hiệu ${v.d}: số lớn = (${2 * v.s + v.d} + ${v.d}) : 2 = ${v.s + v.d}; số bé = (${2 * v.s + v.d} − ${v.d}) : 2 = ${v.s}.`,
                })),
            ),
        ],
        forms: [
            form({
                id: 'tong-hieu', title: 'Dạng 1: Biết tổng và hiệu', level: 3,
                cue: 'Đề cho **tổng** của hai số và cho biết số này **hơn** số kia bao nhiêu (hiệu).',
                steps: ['Vẽ sơ đồ hai đoạn thẳng.', 'Tìm số lớn: (tổng + hiệu) : 2.', 'Tìm số bé: số lớn − hiệu.', 'Viết đáp số và thử lại.'],
                example: worked({
                    problem: 'Tổng của hai số là 72, hiệu của hai số là 22. Tìm hai số đó.',
                    visual: vis('segmentDiagramSVG', [{ label: 'Số bé', parts: [25], labels: ['?'] }, { label: 'Số lớn', parts: [25, 22], labels: ['?', '22'] }], 'Tổng: 72'),
                    steps: [step('Số lớn là:', '(72 + 22) : 2 = 47'), step('Số bé là:', '47 − 22 = 25')],
                    answer: 'Đáp số: Số lớn: 47; Số bé: 25.',
                    check: 'Thử lại: 47 + 25 = 72 và 47 − 25 = 22.',
                }),
            }),
        ],
        mistakes: [
            mistake('Tổng là 72, hiệu là 22. Bạn Bi tính số lớn: 72 : 2 = 36.', 'Số lớn: (72 + 22) : 2 = 47.',
                'Chia đôi tổng chỉ đúng khi hai số bằng nhau. Số lớn hơn số bé 22 nên phải cộng hiệu vào tổng rồi mới chia đôi.'),
        ],
        remember: [
            'Số lớn = (tổng + hiệu) : 2.',
            'Số bé = (tổng − hiệu) : 2, hoặc lấy số lớn trừ hiệu.',
            'Vẽ sơ đồ hai đoạn thẳng trước khi tính.',
        ],
    }),
} satisfies LessonBook;
