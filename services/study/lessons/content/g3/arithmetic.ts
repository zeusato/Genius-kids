// Lớp 3 — Cộng, trừ, nhân, chia số lớn (g3_arithmetic).
import { form, know, lesson, mistake, rule, step, text, widget, worked } from '../../build';
import type { LessonBook } from '../../types';

export default {
    'g3.addsub100000': lesson('g3.addsub100000', {
        v: 1,
        goal: 'đặt tính và cộng, trừ được các số trong phạm vi 100 000; tính nhanh và giải bài toán.',
        hook: { md: 'Tuần trước nhà máy làm được 12 450 sản phẩm, tuần này làm được 13 270 sản phẩm. Cả hai tuần làm được bao nhiêu sản phẩm?', answer: 'Cả hai tuần: 12 450 + 13 270 = 25 720 (sản phẩm).' },
        needs: ['g3.numbers100000'],
        know: [
            know('Đặt tính cộng, trừ',
                rule('Viết các chữ số cùng hàng thẳng cột với nhau. Tính từ phải sang trái.'),
                widget({ w: 'column', op: '+', a: 4728, b: 2563 }),
            ),
            know('Trừ có nhớ',
                text('Chữ số ở trên bé hơn chữ số ở dưới thì lấy thêm 10 rồi trừ, và **nhớ 1** sang hàng bên trái của số trừ.'),
                widget({ w: 'column', op: '-', a: 6352, b: 2817 }),
            ),
            know('Tính nhanh',
                text('Nhóm hai số có tổng tròn trăm, tròn nghìn để tính nhanh hơn.'),
                text('913 + 399 + 601 = 913 + 1000 = 1913'),
            ),
        ],
        forms: [
            form({
                id: 'dat-tinh', title: 'Dạng 1: Đặt tính rồi tính', level: 1,
                cue: 'Đề yêu cầu tính phép cộng hoặc trừ hai số lớn.',
                steps: ['Viết số thứ hai dưới số thứ nhất, thẳng cột từ hàng đơn vị.', 'Tính từ hàng đơn vị sang trái, nhớ khi cần.', 'Kiểm tra lại bằng phép tính ngược.'],
                example: worked({
                    layout: 'calc', problem: 'Đặt tính rồi tính: 4898 − 3542',
                    steps: [step('8 trừ 2 bằng 6, viết 6.'), step('9 trừ 4 bằng 5, viết 5.'), step('8 trừ 5 bằng 3, viết 3.'), step('4 trừ 3 bằng 1, viết 1.')],
                    answer: 'Vậy 4898 − 3542 = 1356.', check: 'Thử lại: 1356 + 3542 = 4898.',
                    replay: { w: 'column', op: '-', a: 4898, b: 3542 },
                }),
            }),
            form({
                id: 'tinh-nhanh', title: 'Dạng 2: Tính nhanh', level: 3,
                cue: 'Trong phép cộng có hai số cộng lại được số tròn trăm, tròn nghìn.',
                steps: ['Tìm hai số có tổng tròn.', 'Cộng hai số đó trước.', 'Cộng với số còn lại.'],
                example: worked({
                    layout: 'calc', problem: 'Tính nhanh: 522 + 769 + 231',
                    steps: [step('769 và 231 có tổng tròn nghìn:', '769 + 231 = 1000'), step('Cộng với số còn lại:', '522 + 1000 = 1522')],
                    answer: 'Vậy 522 + 769 + 231 = 1522.',
                }),
            }),
            form({
                id: 'loi-van', title: 'Dạng 3: Bài toán thêm rồi bớt', level: 3,
                cue: 'Đề có hai sự việc: thêm vào rồi bớt đi (hoặc ngược lại).',
                steps: ['Tính số lượng sau sự việc thứ nhất.', 'Tính tiếp sau sự việc thứ hai.', 'Viết đáp số.'],
                example: worked({
                    problem: 'Thư viện có 6654 quyển sách. Năm nay mua thêm 425 quyển và thanh lí 718 quyển cũ. Hỏi thư viện còn bao nhiêu quyển sách?',
                    steps: [step('Sau khi mua thêm, thư viện có:', '6654 + 425 = 7079 (quyển)'), step('Sau khi thanh lí, thư viện còn:', '7079 − 718 = 6361 (quyển)')],
                    answer: 'Đáp số: 6361 quyển sách.',
                }),
            }),
        ],
        mistakes: [
            mistake('Đặt tính 61 979 − 5107, bạn Bi viết chữ số 5 thẳng cột với chữ số 6.', 'Viết 5107 sao cho chữ số 7 thẳng cột với chữ số 9 ở hàng đơn vị.',
                'Hai số có số chữ số khác nhau thì phải thẳng cột từ hàng đơn vị, không thẳng từ bên trái.'),
            mistake('Bạn Bi tính: 52 − 27 = 35.', '52 − 27 = 25.', 'Bi lấy 12 trừ 7 bằng 5 nhưng quên nhớ 1. Phải lấy 2 thêm 1 bằng 3, rồi 5 trừ 3 bằng 2.'),
        ],
        remember: [
            'Đặt tính thẳng cột từ hàng đơn vị.',
            'Cộng có nhớ: viết chữ số đơn vị, nhớ 1 sang hàng bên trái.',
            'Trừ có nhớ: lấy thêm 10 rồi trừ, nhớ 1 vào hàng bên trái của số trừ.',
            'Thử lại phép trừ bằng phép cộng.',
        ],
    }),
    'g3.muldiv_big': lesson('g3.muldiv_big', {
        v: 1,
        goal: 'nhân, chia được số có nhiều chữ số với (cho) số có một chữ số.',
        hook: { md: 'Mỗi ngày nhà máy làm được 1250 hộp bánh. Hỏi 4 ngày làm được bao nhiêu hộp bánh?', answer: 'Số hộp bánh là: 1250 × 4 = 5000 (hộp).' },
        needs: ['g3.mul_1digit', 'g3.div_1digit'],
        know: [
            know('Nhân số có nhiều chữ số',
                rule('Đặt tính thẳng cột, nhân từ phải sang trái như với số có ba chữ số.'),
                widget({ w: 'column', op: '×', a: 1234, b: 3 }),
            ),
            know('Chia số có nhiều chữ số',
                rule('Chia từ hàng cao nhất; mỗi lượt: chia, nhân, trừ, hạ.'),
                widget({ w: 'long-division', a: 8256, b: 4 }),
            ),
        ],
        forms: [
            form({
                id: 'nhan', title: 'Dạng 1: Nhân với số có một chữ số', level: 1,
                cue: 'Đề cho số có bốn, năm chữ số nhân với số có một chữ số.',
                steps: ['Đặt tính thẳng cột.', 'Nhân từ hàng đơn vị sang trái, nhớ khi cần.', 'Hàng cuối cùng viết cả kết quả.'],
                example: worked({
                    layout: 'calc', problem: 'Đặt tính rồi tính: 1052 × 4',
                    steps: [step('4 nhân 2 bằng 8, viết 8.'), step('4 nhân 5 bằng 20, viết 0 nhớ 2.'), step('4 nhân 0 bằng 0, thêm 2 bằng 2, viết 2.'), step('4 nhân 1 bằng 4, viết 4.')],
                    answer: 'Vậy 1052 × 4 = 4208.',
                    replay: { w: 'column', op: '×', a: 1052, b: 4 },
                }),
            }),
            form({
                id: 'chia', title: 'Dạng 2: Chia cho số có một chữ số', level: 2,
                cue: 'Đề cho số có bốn, năm chữ số chia cho số có một chữ số.',
                steps: ['Đặt tính chia.', 'Chia từ hàng cao nhất; mỗi lượt: chia, nhân, trừ, hạ.', 'Lượt nào không đủ chia thì viết 0 vào thương.', 'Thử lại bằng phép nhân.'],
                example: worked({
                    layout: 'calc', problem: 'Đặt tính rồi tính: 5895 : 5',
                    steps: [
                        step('5 chia 5 được 1, viết 1. 1 nhân 5 bằng 5; 5 trừ 5 bằng 0. Hạ 8, được 8.'),
                        step('8 chia 5 được 1, viết 1. 1 nhân 5 bằng 5; 8 trừ 5 bằng 3. Hạ 9, được 39.'),
                        step('39 chia 5 được 7, viết 7. 7 nhân 5 bằng 35; 39 trừ 35 bằng 4. Hạ 5, được 45.'),
                        step('45 chia 5 được 9, viết 9. 9 nhân 5 bằng 45; 45 trừ 45 bằng 0.'),
                    ],
                    answer: 'Vậy 5895 : 5 = 1179.', check: 'Thử lại: 1179 × 5 = 5895.',
                    replay: { w: 'long-division', a: 5895, b: 5 },
                }),
            }),
        ],
        mistakes: [
            mistake('Bạn Bi tính: 8256 : 4 = 264.', '8256 : 4 = 2064.', 'Hạ 2 xuống, 2 bé hơn 4 nên phải viết 0 vào thương rồi mới hạ tiếp.'),
        ],
        remember: [
            'Nhân: đặt tính thẳng cột, nhân từ phải sang trái.',
            'Chia: chia từ hàng cao nhất; chia, nhân, trừ, hạ.',
            'Lượt không đủ chia thì viết 0 vào thương.',
            'Thử lại phép chia bằng phép nhân.',
        ],
    }),
} satisfies LessonBook;
