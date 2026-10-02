// Lớp 3 — Một phần mấy (g3_fractions).
import { explore, form, know, lesson, mistake, pic, rule, step, text, vis, widget, worked } from '../../build';
import type { LessonBook } from '../../types';

const NAME = ['', '', 'hai', 'ba', 'tư', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

export default {
    'g3.unit_fraction': lesson('g3.unit_fraction', {
        v: 1,
        goal: 'nhận biết một phần hai, một phần ba, …, một phần chín của một hình.',
        hook: { md: 'Chia cái bánh thành 4 phần bằng nhau, em ăn 1 phần. Em đã ăn một phần mấy cái bánh?', answer: 'Em đã ăn 1/4 cái bánh (một phần tư).' },
        know: [
            know('Một phần mấy',
                text('Chia hình tròn thành 4 **phần bằng nhau**, tô màu 1 phần: đã tô **1/4** hình, đọc là "một phần tư".'),
                pic('fractionPieSVG', 1, 4),
                rule('Chia hình thành mấy phần bằng nhau, lấy 1 phần, ta được "một phần" bấy nhiêu của hình.'),
            ),
            know('Kéo để quan sát',
                widget(explore({
                    title: 'Đổi số phần bằng nhau',
                    controls: { n: { label: 'Số phần bằng nhau', min: 2, max: 9, init: 3 } },
                    visual: v => vis('fractionPieSVG', 1, v.n),
                    caption: v => `Hình chia thành ${v.n} phần bằng nhau, tô 1 phần: đã tô 1/${v.n} hình, đọc là "một phần ${NAME[v.n]}".`,
                })),
            ),
        ],
        forms: [
            form({
                id: 'nhan-biet', title: 'Dạng 1: Đã tô màu một phần mấy?', level: 1,
                cue: 'Đề cho hình đã chia thành các phần bằng nhau và tô màu 1 phần.',
                steps: ['Kiểm tra các phần có bằng nhau không.', 'Đếm xem hình được chia thành mấy phần.', 'Tô 1 phần thì đã tô "một phần" bấy nhiêu.'],
                example: worked({
                    problem: 'Hình tròn được chia thành 6 phần bằng nhau, tô màu 1 phần. Đã tô màu một phần mấy của hình?',
                    visual: vis('fractionPieSVG', 1, 6),
                    layout: 'calc',
                    steps: [step('Đếm số phần bằng nhau: 6 phần.'), step('Tô màu 1 phần nên đã tô 1/6 hình.')],
                    answer: 'Đã tô màu 1/6 hình (một phần sáu).',
                }),
            }),
        ],
        mistakes: [
            mistake('Hình chia thành 4 phần **không bằng nhau**, tô 1 phần. Bạn Bi nói đã tô 1/4 hình.', 'Chưa nói được là 1/4 hình.',
                'Chỉ khi 4 phần **bằng nhau** thì 1 phần mới là 1/4 hình.'),
        ],
        remember: [
            'Chia hình thành n phần bằng nhau, lấy 1 phần: được một phần n của hình.',
            'Các phần phải bằng nhau.',
            '1/2 đọc là "một phần hai", 1/4 đọc là "một phần tư".',
        ],
    }),
    'g3.fraction_of': lesson('g3.fraction_of', {
        v: 1,
        goal: 'tìm được một phần mấy của một số và giải bài toán có liên quan.',
        hook: { md: 'Mẹ có 12 quả cam, mẹ biếu bà 1/3 số cam. Mẹ biếu bà mấy quả cam?', answer: 'Mẹ biếu bà: 12 : 3 = 4 (quả cam).' },
        needs: ['g3.unit_fraction', 'g3.div_tables'],
        know: [
            know('Tìm một phần mấy của một số',
                text('Tìm 1/3 của 12 quả cam: chia 12 quả thành 3 phần bằng nhau, mỗi phần là 1/3 số cam.'),
                pic('countingSVG', '🍊', 12, { perRow: 4 }),
                rule('Muốn tìm một phần mấy của một số, ta lấy số đó chia cho số phần.', '1/3 của 12 là 12 : 3 = 4'),
            ),
            know('Kéo để quan sát',
                widget(explore({
                    title: 'Đổi số phần và số cam mỗi phần',
                    controls: {
                        n: { label: 'Chia thành mấy phần', min: 2, max: 6, init: 3 },
                        k: { label: 'Số cam mỗi phần', min: 2, max: 6, init: 4 },
                    },
                    visual: v => vis('countingSVG', '🍊', v.n * v.k, { perRow: v.k }),
                    caption: v => `Mỗi hàng là 1/${v.n} số cam. 1/${v.n} của ${v.n * v.k} là: ${v.n * v.k} : ${v.n} = ${v.k}.`,
                })),
            ),
        ],
        forms: [
            form({
                id: 'tim', title: 'Dạng 1: Tìm một phần mấy của một số', level: 2,
                cue: 'Đề hỏi "1/n của a là bao nhiêu?"',
                steps: ['Xác định số a và số phần n.', 'Lấy a chia cho n.', 'Viết đáp số kèm đơn vị.'],
                example: worked({
                    problem: '1/3 của 30 quả cam là bao nhiêu quả cam?',
                    steps: [step('1/3 của 30 quả cam là:', '30 : 3 = 10 (quả cam)')],
                    answer: 'Đáp số: 10 quả cam.',
                }),
            }),
            form({
                id: 'con-lai', title: 'Dạng 2: Cho đi một phần, hỏi còn lại', level: 3,
                cue: 'Đề cho số ban đầu, cho đi (hoặc dùng) một phần mấy, rồi hỏi **còn lại** bao nhiêu.',
                steps: ['Tìm phần đã cho đi: lấy số ban đầu chia cho số phần.', 'Tìm phần còn lại: lấy số ban đầu trừ phần đã cho đi.', 'Viết đáp số.'],
                example: worked({
                    problem: 'Minh có 72 nhãn vở, Minh cho bạn 1/6 số nhãn vở đó. Hỏi Minh còn lại bao nhiêu nhãn vở?',
                    steps: [step('Số nhãn vở Minh cho bạn là:', '72 : 6 = 12 (nhãn vở)'), step('Số nhãn vở Minh còn lại là:', '72 − 12 = 60 (nhãn vở)')],
                    answer: 'Đáp số: 60 nhãn vở.',
                }),
            }),
        ],
        mistakes: [
            mistake('Tìm 1/3 của 30, bạn Bi tính: 30 × 3 = 90.', '1/3 của 30 là 30 : 3 = 10.', 'Một phần của số đó phải bé hơn số đó. Tìm 1/3 là chia cho 3.'),
            mistake('Minh có 72 nhãn vở, cho bạn 1/6. Bạn Bi trả lời Minh còn 12 nhãn vở.', 'Minh cho bạn 12 nhãn vở, còn lại 72 − 12 = 60 nhãn vở.', 'Đề hỏi số còn lại nên cần thêm bước trừ.'),
        ],
        remember: [
            'Tìm 1/n của một số: lấy số đó chia cho n.',
            'Hỏi "còn lại" thì lấy số ban đầu trừ đi phần đã cho.',
        ],
    }),
    'g3.fraction_ab': lesson('g3.fraction_ab', {
        v: 1,
        goal: 'đọc, viết được phân số từ hình vẽ.',
        hook: { md: 'Thanh sô-cô-la có 5 miếng bằng nhau, em ăn 2 miếng. Em đã ăn bao nhiêu phần thanh sô-cô-la?', answer: 'Em đã ăn 2/5 thanh sô-cô-la (hai phần năm).' },
        needs: ['g3.unit_fraction'],
        know: [
            know('Phân số',
                text('Chia hình thành 5 phần bằng nhau, tô màu 2 phần: ta có phân số **2/5**, đọc là "hai phần năm".'),
                pic('fractionBarSVG', 2, 5),
                rule('Mẫu số là số phần bằng nhau của cả hình; tử số là số phần được tô màu.', 'Phân số = {số phần tô màu} trên {số phần bằng nhau}'),
            ),
            know('Kéo để quan sát',
                widget(explore({
                    title: 'Đổi tử số và mẫu số',
                    controls: {
                        b: { label: 'Mẫu số', min: 2, max: 9, init: 5 },
                        a: { label: 'Tử số', min: 1, max: 9, init: 2 },
                    },
                    valid: v => (v.a <= v.b ? null : 'Trong bài này, tử số không lớn hơn mẫu số.'),
                    visual: v => vis('fractionBarSVG', v.a, v.b),
                    caption: v => `Chia thành ${v.b} phần bằng nhau, tô ${v.a} phần: phân số ${v.a}/${v.b}.`,
                })),
            ),
        ],
        forms: [
            form({
                id: 'doc-hinh', title: 'Dạng 1: Viết phân số chỉ phần tô màu', level: 2,
                cue: 'Đề cho hình chia thành các phần bằng nhau, tô màu một số phần.',
                steps: ['Đếm số phần bằng nhau của cả hình: đó là mẫu số.', 'Đếm số phần được tô màu: đó là tử số.', 'Viết tử số ở trên, mẫu số ở dưới.'],
                example: worked({
                    problem: 'Phần tô màu biểu thị phân số nào?',
                    visual: vis('fractionBarSVG', 3, 7),
                    layout: 'calc',
                    steps: [step('Hình được chia thành 7 phần bằng nhau: mẫu số là 7.'), step('Có 3 phần được tô màu: tử số là 3.')],
                    answer: 'Phần tô màu biểu thị phân số 3/7.',
                }),
            }),
        ],
        mistakes: [
            mistake('Hình có 5 phần bằng nhau, tô 2 phần. Bạn Bi viết 2/3.', 'Phân số là 2/5.', 'Bi lấy số phần không tô làm mẫu số. Mẫu số phải là số phần của cả hình, tức là 5.'),
        ],
        remember: [
            'Mẫu số: hình được chia thành mấy phần bằng nhau.',
            'Tử số: có mấy phần được tô màu.',
        ],
    }),
} satisfies LessonBook;
