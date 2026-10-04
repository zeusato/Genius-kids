// Lớp 3 — Phép nhân (g3_multiplication). Chuẩn soạn: docs/study-learn-plan.md mục 3, 5.4, 9.1.
import { explore, form, know, lesson, mistake, note, pic, rule, step, table, text, vis, widget, worked } from '../../build';
import type { LessonBook } from '../../types';

const TABLES = [3, 4, 6, 7, 8, 9];

export default {
    'g3.mul_tables': lesson('g3.mul_tables', {
        v: 1,
        goal: 'thuộc và dùng được bảng nhân 3, 4, 6, 7, 8, 9 để tính nhanh và giải bài toán.',
        hook: { md: 'Mỗi hộp có 6 cái bánh. Mẹ mua 4 hộp. Không cần đếm từng cái, làm sao biết có bao nhiêu cái bánh?', answer: 'Số bánh là: 6 × 4 = 24 (cái bánh).' },
        needs: ['g2.mul_table'],
        know: [
            know('Phép nhân là cộng nhiều số giống nhau',
                text('6 được lấy 4 lần, ta viết **6 × 4** và đọc là "sáu nhân bốn".'),
                text('6 × 4 = 6 + 6 + 6 + 6 = 24'),
                widget(explore({
                    title: 'Đổi số bánh mỗi hàng và số hàng',
                    controls: {
                        a: { label: 'Số bánh mỗi hàng', min: 3, max: 9, init: 6 },
                        b: { label: 'Số hàng', min: 1, max: 6, init: 4 },
                    },
                    visual: v => vis('countingSVG', '🍪', v.a * v.b, { perRow: v.a }),
                    caption: v => `${v.a} được lấy ${v.b} lần: ${v.a} × ${v.b} = ${v.a * v.b}.`,
                })),
            ),
            know('Mẹo nhớ bảng nhân',
                rule('Đổi chỗ các thừa số thì tích không thay đổi.', '{a} × {b} = {b} × {a}'),
                text('Ví dụ: 7 × 3 = 3 × 7 = 21. Thuộc bảng nhân 3 là em đã biết 7 × 3.'),
                note('Trong bảng nhân 6, mỗi kết quả hơn kết quả liền trước 6 đơn vị: 6, 12, 18, 24, …'),
            ),
            know('Bảng nhân 3, 4, 6, 7, 8, 9',
                table(['Bảng', ...Array.from({ length: 10 }, (_, i) => `× ${i + 1}`)], TABLES.map(t => [`Bảng ${t}`, ...Array.from({ length: 10 }, (_, i) => String(t * (i + 1)))])),
            ),
        ],
        forms: [
            form({
                id: 'tinh', title: 'Dạng 1: Tính theo bảng nhân', level: 1,
                cue: 'Đề cho phép nhân hai số trong bảng, ví dụ 7 × 9 = ?',
                steps: ['Thừa số thứ nhất cho biết dùng bảng nhân nào.', 'Tìm dòng có thừa số thứ hai trong bảng đó.', 'Nếu quên, lấy kết quả liền trước rồi cộng thêm thừa số thứ nhất.'],
                example: worked({
                    layout: 'calc', problem: 'Tính: 7 × 9 = ?',
                    steps: [step('Em nhớ trong bảng nhân 7:', '7 × 8 = 56'), step('7 × 9 là thêm một lần 7 nữa:', '56 + 7 = 63')],
                    answer: 'Vậy 7 × 9 = 63.',
                }),
            }),
            form({
                id: 'tim-thua-so', title: 'Dạng 2: Tìm thừa số trong bảng', level: 2,
                cue: 'Đề có ô trống ở một thừa số, ví dụ 9 × ? = 81.',
                steps: ['Đọc bảng nhân của thừa số đã biết.', 'Tìm dòng có kết quả bằng tích đã cho.', 'Hoặc lấy tích chia cho thừa số đã biết.', 'Thử lại bằng phép nhân.'],
                example: worked({
                    layout: 'calc', problem: 'Điền số thích hợp: 9 × ? = 81',
                    steps: [step('Đọc bảng nhân 9:', '9 × 8 = 72; 9 × 9 = 81'), step('Hoặc lấy tích chia cho thừa số đã biết:', '81 : 9 = 9')],
                    answer: 'Số cần điền là 9.', check: 'Thử lại: 9 × 9 = 81.',
                }),
            }),
            form({
                id: 'loi-van', title: 'Dạng 3: Bài toán "mỗi … có …"', level: 2,
                cue: 'Đề cho số đồ vật trong **mỗi** nhóm và hỏi **mấy nhóm như thế** có bao nhiêu.',
                steps: ['Tìm số đồ vật trong một nhóm.', 'Tìm số nhóm.', 'Lấy số đồ vật một nhóm nhân với số nhóm.', 'Viết câu trả lời và đáp số.'],
                example: worked({
                    problem: 'Mỗi hộp có 9 cái bánh. Hỏi 8 hộp như thế có bao nhiêu cái bánh?',
                    steps: [step('Số bánh trong 8 hộp là:', '9 × 8 = 72 (cái bánh)')],
                    answer: 'Đáp số: 72 cái bánh.',
                }),
            }),
        ],
        mistakes: [
            mistake('Bạn Bi tính: 3 × 4 = 7.', '3 × 4 = 12.', 'Bi đã cộng 3 với 4. Phép nhân là 3 được lấy 4 lần: 3 + 3 + 3 + 3 = 12.'),
            mistake('Bạn Bi nhẩm: 7 × 8 = 54.', '7 × 8 = 56.', 'Kiểm tra bằng cách cộng thêm: 7 × 7 = 49 và 49 + 7 = 56. Những phép hay nhầm như 7 × 8, 6 × 9 cần đọc lại nhiều lần.'),
        ],
        remember: [
            'Phép nhân là cộng nhiều số giống nhau: 6 × 4 = 6 + 6 + 6 + 6.',
            'Đổi chỗ các thừa số thì tích không thay đổi.',
            'Muốn tìm thừa số, lấy tích chia cho thừa số kia.',
            'Bài toán "mỗi … có …, mấy … như thế" dùng phép nhân.',
        ],
    }),
    'g3.mul_1digit': lesson('g3.mul_1digit', {
        v: 1,
        goal: 'đặt tính và nhân được số có hai, ba chữ số với số có một chữ số, có nhớ và không nhớ.',
        hook: { md: 'Mỗi thùng có 125 quyển vở. Hỏi 3 thùng như thế có bao nhiêu quyển vở?', answer: 'Số vở là: 125 × 3 = 375 (quyển vở).' },
        needs: ['g3.mul_tables'],
        know: [
            know('Đặt tính nhân',
                text('Viết thừa số có nhiều chữ số ở trên, số có một chữ số ở dưới, thẳng cột với hàng đơn vị. Kẻ vạch ngang.'),
                rule('Nhân lần lượt từ phải sang trái: hàng đơn vị, rồi hàng chục, rồi hàng trăm.'),
                widget({ w: 'column', op: '×', a: 243, b: 2 }),
            ),
            know('Nhân có nhớ',
                text('Khi tích ở một hàng từ 10 trở lên, em viết chữ số hàng đơn vị và **nhớ** chữ số hàng chục sang hàng bên trái.'),
                note('Nhớ bao nhiêu thì ở hàng sau phải **thêm** bấy nhiêu vào tích.'),
                widget({ w: 'column', op: '×', a: 47, b: 3 }),
            ),
        ],
        forms: [
            form({
                id: 'hai-chu-so', title: 'Dạng 1: Nhân số có hai chữ số', level: 1,
                cue: 'Số có hai chữ số nhân với số có một chữ số, ví dụ 27 × 3.',
                steps: ['Đặt tính thẳng cột.', 'Nhân hàng đơn vị; được từ 10 trở lên thì viết chữ số đơn vị, nhớ chữ số chục.', 'Nhân hàng chục rồi thêm số nhớ (nếu có).'],
                example: worked({
                    layout: 'calc', problem: 'Đặt tính rồi tính: 27 × 3',
                    steps: [step('3 nhân 7 bằng 21, viết 1 nhớ 2.'), step('3 nhân 2 bằng 6, thêm 2 bằng 8, viết 8.')],
                    answer: 'Vậy 27 × 3 = 81.',
                    replay: { w: 'column', op: '×', a: 27, b: 3 },
                }),
            }),
            form({
                id: 'ba-chu-so', title: 'Dạng 2: Nhân số có ba chữ số', level: 2,
                cue: 'Số có ba chữ số nhân với số có một chữ số, ví dụ 218 × 3.',
                steps: ['Đặt tính thẳng cột.', 'Nhân hàng đơn vị; từ 10 trở lên thì viết chữ số đơn vị, nhớ chữ số chục.', 'Nhân hàng tiếp theo rồi thêm số nhớ.', 'Hàng cuối cùng viết cả kết quả.'],
                example: worked({
                    layout: 'calc', problem: 'Đặt tính rồi tính: 218 × 3',
                    steps: [
                        step('3 nhân 8 bằng 24, viết 4 nhớ 2.'),
                        step('3 nhân 1 bằng 3, thêm 2 bằng 5, viết 5.'),
                        step('3 nhân 2 bằng 6, viết 6.'),
                    ],
                    answer: 'Vậy 218 × 3 = 654.',
                    replay: { w: 'column', op: '×', a: 218, b: 3 },
                }),
            }),
            form({
                id: 'loi-van', title: 'Dạng 3: Bài toán có phép nhân', level: 3,
                cue: 'Đề cho một nhóm có bao nhiêu và hỏi nhiều nhóm như thế có tất cả bao nhiêu.',
                steps: ['Tìm số lượng của một nhóm.', 'Tìm số nhóm.', 'Đặt tính nhân.', 'Viết câu lời giải và đáp số.'],
                example: worked({
                    problem: 'Mỗi thùng có 200 quyển sách. Hoa chuyển 7 thùng như thế lên thư viện. Hỏi Hoa chuyển bao nhiêu quyển sách?',
                    steps: [step('Số sách Hoa chuyển là:', '200 × 7 = 1400 (quyển sách)')],
                    answer: 'Đáp số: 1400 quyển sách.',
                }),
            }),
        ],
        mistakes: [
            mistake('Bạn Bi tính: 47 × 3 = 121.', '47 × 3 = 141.', 'Bi quên thêm số nhớ. 3 nhân 7 bằng 21, viết 1 nhớ 2; 3 nhân 4 bằng 12, thêm 2 bằng 14.'),
            mistake('Bạn Bi đặt tính 243 × 3 nhưng viết số 3 thẳng cột với chữ số 2 ở hàng trăm.', 'Số 3 phải thẳng cột với chữ số 3 ở hàng đơn vị.', 'Đặt sai cột thì nhân nhầm hàng. Luôn viết thẳng cột từ hàng đơn vị.'),
        ],
        remember: [
            'Đặt tính thẳng cột, nhân từ phải sang trái.',
            'Tích ở một hàng từ 10 trở lên: viết chữ số đơn vị, nhớ chữ số chục.',
            'Nhân hàng sau xong phải thêm số nhớ.',
            'Hàng cuối cùng viết cả kết quả.',
        ],
    }),
    'g3.times_more': lesson('g3.times_more', {
        v: 1,
        goal: 'gấp được một số lên nhiều lần và giải bài toán "gấp lên".',
        hook: { md: 'Lan có 4 bông hoa. Số hoa của Mai gấp 3 lần số hoa của Lan. Mai có bao nhiêu bông hoa?', answer: 'Mai có: 4 × 3 = 12 (bông hoa).' },
        needs: ['g3.mul_tables'],
        know: [
            know('Gấp lên nhiều lần',
                text('Gấp 4 lên 3 lần nghĩa là lấy 4 ba lần: 4 + 4 + 4 = 12.'),
                pic('segmentDiagramSVG', [{ label: 'Lan', parts: [4], labels: ['4'] }, { label: 'Mai', parts: [4, 4, 4], labels: ['4', '4', '4'] }], 'Mai gấp 3 lần Lan'),
                rule('Muốn gấp một số lên nhiều lần, ta lấy số đó nhân với số lần.'),
            ),
            know('Kéo để quan sát',
                widget(explore({
                    title: 'Đổi số ban đầu và số lần gấp',
                    controls: {
                        a: { label: 'Số ban đầu', min: 2, max: 9, init: 4 },
                        n: { label: 'Số lần', min: 2, max: 6, init: 3 },
                    },
                    visual: v => vis('segmentDiagramSVG', [{ label: 'Số ban đầu', parts: [v.a], labels: [String(v.a)] }, { label: 'Sau khi gấp', parts: Array(v.n).fill(v.a), labels: Array(v.n).fill(String(v.a)) }]),
                    caption: v => `Gấp ${v.a} lên ${v.n} lần: ${v.a} × ${v.n} = ${v.a * v.n}.`,
                })),
            ),
        ],
        forms: [
            form({
                id: 'gap-so', title: 'Dạng 1: Gấp một số lên nhiều lần', level: 2,
                cue: 'Đề hỏi "Gấp a lên n lần được bao nhiêu?"',
                steps: ['Xác định số cần gấp và số lần.', 'Lấy số đó nhân với số lần.'],
                example: worked({
                    layout: 'calc', problem: 'Gấp 7 lên 8 lần được bao nhiêu?',
                    steps: [step('Gấp 7 lên 8 lần là lấy 7 nhân với 8:', '7 × 8 = 56')],
                    answer: 'Vậy gấp 7 lên 8 lần được 56.',
                }),
            }),
            form({
                id: 'loi-van', title: 'Dạng 2: Bài toán "gấp … lần"', level: 3,
                cue: 'Đề có câu "số … **gấp** n lần số …" và hỏi số lớn hơn.',
                steps: ['Tìm số đã biết (số được gấp lên).', 'Lấy số đó nhân với số lần.', 'Viết câu trả lời và đáp số kèm đơn vị.'],
                example: worked({
                    problem: 'Lan có 3 nhãn vở. Số nhãn vở của Nam gấp 6 lần số nhãn vở của Lan. Hỏi Nam có bao nhiêu nhãn vở?',
                    visual: vis('segmentDiagramSVG', [{ label: 'Lan', parts: [1], labels: ['3'] }, { label: 'Nam', parts: [1, 1, 1, 1, 1, 1], labels: ['3', '3', '3', '3', '3', '3'] }], 'Nam: ? nhãn vở'),
                    steps: [step('Số nhãn vở của Nam là:', '3 × 6 = 18 (nhãn vở)')],
                    answer: 'Đáp số: 18 nhãn vở.',
                }),
            }),
        ],
        mistakes: [
            mistake('Gấp 5 lên 3 lần, bạn Bi tính: 5 + 3 = 8.', 'Gấp 5 lên 3 lần: 5 × 3 = 15.', '"Gấp lên 3 lần" là lấy 5 ba lần nên dùng phép nhân. "Thêm 3" mới là phép cộng.'),
        ],
        remember: [
            'Gấp một số lên nhiều lần: lấy số đó nhân với số lần.',
            '"Gấp lên 3 lần" khác "thêm 3".',
            'Vẽ sơ đồ đoạn thẳng giúp em thấy rõ số lần.',
        ],
    }),
    'g3.mul_2digit': lesson('g3.mul_2digit', {
        v: 1,
        goal: 'nhân được một số với số có hai chữ số bằng cách đặt tính có hai tích riêng.',
        hook: { md: 'Một hộp có 24 cái bút chì. Hỏi 12 hộp như thế có bao nhiêu cái bút chì?', answer: 'Số bút chì là: 24 × 12 = 288 (cái bút chì).' },
        needs: ['g3.mul_1digit'],
        know: [
            know('Hai tích riêng',
                text('Nhân với số có hai chữ số, em nhân lần lượt với chữ số hàng đơn vị rồi với chữ số hàng chục.'),
                rule('Tích riêng thứ hai viết lùi sang trái một cột so với tích riêng thứ nhất, rồi cộng hai tích riêng.'),
                widget({ w: 'column', op: '×', a: 24, b: 12 }),
            ),
        ],
        forms: [
            form({
                id: 'hai-tich-rieng', title: 'Dạng 1: Đặt tính nhân với số có hai chữ số', level: 2,
                cue: 'Thừa số thứ hai có hai chữ số, ví dụ 34 × 21.',
                steps: ['Nhân với chữ số hàng đơn vị được tích riêng thứ nhất.', 'Nhân với chữ số hàng chục được tích riêng thứ hai, viết lùi sang trái một cột.', 'Cộng hai tích riêng.'],
                example: worked({
                    layout: 'calc', problem: 'Đặt tính rồi tính: 34 × 21',
                    steps: [
                        step('Lấy 1 nhân với 34: 1 nhân 4 bằng 4, viết 4.'),
                        step('1 nhân 3 bằng 3, viết 3.'),
                        step('Lấy 2 nhân với 34, viết tích riêng lùi sang trái một cột: 2 nhân 4 bằng 8, viết 8.'),
                        step('2 nhân 3 bằng 6, viết 6.'),
                        step('Cộng các tích riêng: hạ 4, viết 4.'),
                        step('3 cộng 8 bằng 11, viết 1 nhớ 1.'),
                        step('6 thêm 1 bằng 7, viết 7.'),
                    ],
                    answer: 'Vậy 34 × 21 = 714.',
                    replay: { w: 'column', op: '×', a: 34, b: 21 },
                }),
            }),
        ],
        mistakes: [
            mistake('Bạn Bi viết tích riêng thứ hai 24 thẳng cột với tích riêng thứ nhất 48 rồi cộng: 48 + 24 = 72.', '24 × 12 = 288.',
                'Tích riêng thứ hai là 24 chục nên phải viết lùi sang trái một cột: 48 + 240 = 288.'),
        ],
        remember: [
            'Nhân với chữ số hàng đơn vị trước, rồi đến chữ số hàng chục.',
            'Tích riêng thứ hai viết lùi sang trái một cột.',
            'Cộng hai tích riêng được tích.',
        ],
    }),
} satisfies LessonBook;
