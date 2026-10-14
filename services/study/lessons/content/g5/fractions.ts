// Lớp 5 — Phân số (g5_fractions).
import { explore, form, know, lesson, mistake, note, pic, rule, step, table, text, vis, widget, worked } from '../../build';
import type { LessonBook } from '../../types';

export default {
    'g5.decimal_fraction': lesson('g5.decimal_fraction', {
        v: 1,
        goal: 'nhận biết phân số thập phân, viết được một phân số thành phân số thập phân và thành số thập phân.',
        hook: { md: 'Cái bánh chia thành 10 phần bằng nhau, em ăn 3 phần: em đã ăn 3/10 cái bánh. Viết 3/10 dưới dạng số thập phân thế nào?', answer: '3/10 = 0,3, đọc là "không phẩy ba".' },
        know: [
            know('Phân số thập phân',
                text('Các phân số có mẫu số là 10, 100, 1000, … gọi là **phân số thập phân**, ví dụ 3/10, 47/100, 9/1000.'),
                pic('fractionBarSVG', 3, 10),
                rule('Muốn viết một phân số thành phân số thập phân, ta nhân (hoặc chia) cả tử số và mẫu số với cùng một số. Mẫu số mới là 10, 100, 1000, …'),
                text('Ví dụ: 3/5 = 6/10 vì 3 × 2 = 6 và 5 × 2 = 10.'),
            ),
            know('Phân số thập phân và số thập phân',
                table(['Phân số thập phân', 'Số thập phân', 'Đọc là'], [
                    ['3/10', '0,3', 'không phẩy ba'],
                    ['47/100', '0,47', 'không phẩy bốn mươi bảy'],
                    ['9/1000', '0,009', 'không phẩy không không chín'],
                ]),
                rule('Mẫu số có bao nhiêu chữ số 0 thì phần thập phân có bấy nhiêu chữ số.'),
            ),
        ],
        forms: [
            form({
                id: 'viet-pstp', title: 'Dạng 1: Viết thành phân số thập phân', level: 1,
                cue: 'Đề cho một phân số có mẫu số như 2, 4, 5, 20, 25, 50 và yêu cầu viết thành phân số thập phân.',
                steps: ['Tìm số nhân với mẫu số để được 10, 100 hoặc 1000.', 'Nhân cả tử số và mẫu số với số đó.'],
                example: worked({
                    layout: 'calc', problem: 'Viết 3/5 thành phân số thập phân.',
                    steps: [step('Tìm số nhân với 5 để được 10:', '5 × 2 = 10'), step('Nhân cả tử số và mẫu số với 2:', '3/5 = 6/10')],
                    answer: 'Vậy 3/5 = 6/10.',
                }),
            }),
            form({
                id: 'so-thap-phan', title: 'Dạng 2: Viết thành số thập phân', level: 1,
                cue: 'Đề cho phân số thập phân và yêu cầu viết dưới dạng số thập phân.',
                steps: ['Đếm số chữ số 0 ở mẫu số.', 'Phần thập phân có bấy nhiêu chữ số; thiếu thì viết thêm 0 ngay sau dấu phẩy.'],
                example: worked({
                    layout: 'calc', problem: 'Viết phân số thập phân 4/10 dưới dạng số thập phân.',
                    steps: [step('Mẫu số 10 có một chữ số 0, nên phần thập phân có một chữ số.'), step('Viết tử số 4 sau dấu phẩy:', '4/10 = 0,4')],
                    answer: 'Vậy 4/10 = 0,4.',
                }),
            }),
        ],
        mistakes: [
            mistake('Viết 3/5 thành phân số thập phân, bạn Bi chỉ nhân mẫu số: 3/10.', '3/5 = 6/10.', 'Phải nhân cả tử số và mẫu số với cùng một số thì phân số mới không đổi giá trị.'),
            mistake('Bạn Bi viết: 7/100 = 0,7.', '7/100 = 0,07.', 'Mẫu số 100 có hai chữ số 0, nên phần thập phân phải có hai chữ số.'),
        ],
        remember: [
            'Phân số thập phân có mẫu số là 10, 100, 1000, …',
            'Nhân (hoặc chia) cả tử và mẫu với cùng một số để được mẫu số 10, 100, 1000.',
            'Mẫu số có mấy chữ số 0 thì phần thập phân có mấy chữ số.',
        ],
    }),
    'g5.mixed_number': lesson('g5.mixed_number', {
        v: 1,
        goal: 'hiểu hỗn số, chuyển được hỗn số thành phân số và ngược lại, tính được với hỗn số.',
        hook: { md: 'Mẹ có 2 cái bánh nguyên và 3/4 cái bánh. Viết gọn số bánh của mẹ thế nào?', answer: 'Mẹ có 2 3/4 cái bánh, đọc là "hai và ba phần tư".' },
        needs: ['g5.decimal_fraction'],
        know: [
            know('Hỗn số',
                pic('mixedPiesSVG', 2, 3, 4),
                text('Số 2 3/4 gồm **phần nguyên** 2 và **phần phân số** 3/4, gọi là **hỗn số**, đọc là "hai và ba phần tư".'),
                note('Phần phân số của hỗn số luôn bé hơn 1.'),
            ),
            know('Chuyển hỗn số thành phân số',
                rule('Tử số bằng phần nguyên nhân với mẫu số rồi cộng với tử số ở phần phân số; mẫu số giữ nguyên.'),
                text('Ví dụ: 2 3/4 = 11/4 vì 2 × 4 + 3 = 11.'),
                widget(explore({
                    title: 'Đổi phần nguyên và phần phân số',
                    controls: {
                        w: { label: 'Phần nguyên', min: 1, max: 4, init: 2 },
                        d: { label: 'Mẫu số', min: 2, max: 8, init: 4 },
                        n: { label: 'Tử số', min: 1, max: 7, init: 3 },
                    },
                    valid: v => (v.n < v.d ? null : 'Tử số phải bé hơn mẫu số.'),
                    visual: v => vis('mixedPiesSVG', v.w, v.n, v.d),
                    caption: v => `${v.w} ${v.n}/${v.d} = ${v.w * v.d + v.n}/${v.d} vì ${v.w} × ${v.d} + ${v.n} = ${v.w * v.d + v.n}.`,
                })),
            ),
        ],
        forms: [
            form({
                id: 'ps-ra-hon-so', title: 'Dạng 1: Phân số thành hỗn số', level: 1,
                cue: 'Đề cho phân số lớn hơn 1 (tử số lớn hơn mẫu số) và yêu cầu viết thành hỗn số.',
                steps: ['Chia tử số cho mẫu số.', 'Thương là phần nguyên.', 'Số dư là tử số của phần phân số, mẫu số giữ nguyên.'],
                example: worked({
                    layout: 'calc', problem: 'Viết phân số 21/5 thành hỗn số.',
                    steps: [step('Chia tử số cho mẫu số:', '21 : 5 = 4 dư 1'), step('Thương 4 là phần nguyên; số dư 1 là tử số; mẫu số giữ nguyên là 5.')],
                    answer: 'Vậy 21/5 = 4 1/5.',
                }),
            }),
            form({
                id: 'hon-so-ra-ps', title: 'Dạng 2: Hỗn số thành phân số', level: 1,
                cue: 'Đề cho hỗn số và yêu cầu chuyển thành phân số.',
                steps: ['Nhân phần nguyên với mẫu số.', 'Cộng thêm tử số, được tử số mới.', 'Giữ nguyên mẫu số.'],
                example: worked({
                    layout: 'calc', problem: 'Chuyển hỗn số 6 1/8 thành phân số.',
                    steps: [step('Tử số mới:', '6 × 8 + 1 = 49'), step('Mẫu số giữ nguyên là 8.')],
                    answer: 'Vậy 6 1/8 = 49/8.',
                }),
            }),
            form({
                id: 'cong-tru', title: 'Dạng 3: Cộng, trừ hỗn số', level: 2,
                cue: 'Phép tính có hỗn số, yêu cầu viết kết quả dưới dạng phân số.',
                steps: ['Chuyển các hỗn số thành phân số.', 'Cộng, trừ các phân số (quy đồng nếu khác mẫu).', 'Rút gọn kết quả nếu được.'],
                example: worked({
                    layout: 'calc', problem: 'Tính: 2 1/4 + 4 1/4 (viết kết quả dưới dạng phân số).',
                    steps: [step('Chuyển các hỗn số thành phân số:', '2 1/4 = 9/4; 4 1/4 = 17/4'), step('Cộng hai phân số cùng mẫu số:', '9/4 + 17/4 = 26/4'), step('Rút gọn:', '26/4 = 13/2')],
                    answer: 'Vậy 2 1/4 + 4 1/4 = 13/2.',
                }),
            }),
        ],
        mistakes: [
            mistake('Bạn Bi chuyển: 6 1/8 = 7/8.', '6 1/8 = 49/8.', 'Bi cộng phần nguyên vào tử số. Phải nhân phần nguyên với mẫu số trước: 6 × 8 + 1 = 49.'),
        ],
        remember: [
            'Hỗn số gồm phần nguyên và phần phân số bé hơn 1.',
            'Hỗn số thành phân số: tử số = phần nguyên × mẫu số + tử số.',
            'Phân số thành hỗn số: chia tử số cho mẫu số; thương là phần nguyên, số dư là tử số.',
        ],
    }),
    'g5.frac_addsub': lesson('g5.frac_addsub', {
        v: 1,
        goal: 'cộng, trừ được hai phân số khác mẫu số bằng cách quy đồng mẫu số.',
        hook: { md: 'Buổi sáng em đọc 1/3 cuốn sách, buổi chiều đọc thêm 1/6 cuốn sách. Cả ngày em đọc được bao nhiêu phần cuốn sách?', answer: '1/3 + 1/6 = 2/6 + 1/6 = 3/6 = 1/2 (cuốn sách).' },
        needs: ['g4.fraction_common', 'g4.frac_addsub'],
        know: [
            know('Cộng, trừ phân số khác mẫu số',
                rule('Muốn cộng (trừ) hai phân số khác mẫu số, ta quy đồng mẫu số hai phân số rồi cộng (trừ) hai phân số đã quy đồng.'),
                text('Ví dụ: 1/3 + 5/7 = 7/21 + 15/21 = 22/21.'),
                note('Cộng (trừ) hai phân số cùng mẫu số thì cộng (trừ) hai tử số và giữ nguyên mẫu số. Rút gọn kết quả nếu được.'),
            ),
            know('Chọn mẫu số chung',
                text('Mẫu số chung thường là tích hai mẫu số. Nếu mẫu số lớn chia hết cho mẫu số bé thì lấy luôn mẫu số lớn.'),
                text('Ví dụ: 1/3 + 1/6, vì 6 chia hết cho 3 nên lấy mẫu số chung là 6: 1/3 = 2/6.'),
                text('Số tự nhiên cũng viết được thành phân số: 2 = 8/4 = 18/9.'),
            ),
        ],
        forms: [
            form({
                id: 'hai-phan-so', title: 'Dạng 1: Cộng, trừ hai phân số', level: 1,
                cue: 'Phép cộng hoặc trừ hai phân số có mẫu số khác nhau.',
                steps: ['Tìm mẫu số chung.', 'Quy đồng mẫu số hai phân số.', 'Cộng (trừ) các tử số, giữ nguyên mẫu số chung.', 'Rút gọn nếu được.'],
                example: worked({
                    layout: 'calc', problem: 'Tính: 1/3 + 5/7',
                    steps: [step('Quy đồng mẫu số, mẫu số chung là 21:', '1/3 = 7/21; 5/7 = 15/21'), step('Cộng hai phân số cùng mẫu số:', '7/21 + 15/21 = 22/21')],
                    answer: 'Vậy 1/3 + 5/7 = 22/21.',
                }),
            }),
            form({
                id: 'co-so-tu-nhien', title: 'Dạng 2: Có số tự nhiên hoặc ba phân số', level: 2,
                cue: 'Phép tính có số tự nhiên cùng với phân số, hoặc có ba phân số.',
                steps: ['Viết số tự nhiên thành phân số có mẫu số bằng mẫu số chung.', 'Quy đồng các phân số.', 'Tính lần lượt từ trái sang phải.'],
                example: worked({
                    layout: 'calc', problem: 'Tính: 2 − 3/4',
                    steps: [step('Viết 2 thành phân số có mẫu số 4:', '2 = 8/4'), step('Trừ hai phân số cùng mẫu số:', '8/4 − 3/4 = 5/4')],
                    answer: 'Vậy 2 − 3/4 = 5/4.',
                }),
            }),
        ],
        mistakes: [
            mistake('Bạn Bi tính: 1/3 + 5/7 = 6/10.', '1/3 + 5/7 = 22/21.', 'Không được cộng tử với tử, mẫu với mẫu. Phải quy đồng mẫu số rồi cộng các tử số, giữ nguyên mẫu số chung.'),
        ],
        remember: [
            'Khác mẫu số: quy đồng trước, rồi cộng (trừ) tử số.',
            'Giữ nguyên mẫu số chung; không cộng các mẫu số.',
            'Số tự nhiên viết được thành phân số có mẫu số bất kì: 2 = 8/4.',
            'Rút gọn kết quả nếu được.',
        ],
    }),
    'g5.frac_muldiv': lesson('g5.frac_muldiv', {
        v: 1,
        goal: 'nhân, chia được hai phân số và tìm được phân số của một số.',
        hook: { md: 'Tấm vải dài 3/4 m. May túi hết 2/3 tấm vải. Đã dùng bao nhiêu mét vải?', answer: '3/4 × 2/3 = 6/12 = 1/2 (m).' },
        needs: ['g4.frac_mul', 'g4.frac_div'],
        know: [
            know('Nhân, chia hai phân số',
                rule('Muốn nhân hai phân số, ta lấy tử số nhân tử số, mẫu số nhân mẫu số.'),
                text('Ví dụ: 2/3 × 4/5 = 8/15.'),
                rule('Muốn chia hai phân số, ta lấy phân số thứ nhất nhân với phân số thứ hai đảo ngược.'),
                text('Ví dụ: 4/5 : 2/3 = 4/5 × 3/2 = 12/10 = 6/5.'),
            ),
            know('Phân số của một số',
                rule('Muốn tìm phân số của một số, ta lấy số đó nhân với phân số.'),
                text('Ví dụ: 2/3 của 12 quả cam là: 12 × 2/3 = 8 (quả cam).'),
            ),
        ],
        forms: [
            form({
                id: 'nhan', title: 'Dạng 1: Nhân hai phân số', level: 1,
                cue: 'Phép nhân hai phân số (hoặc phân số với số tự nhiên).',
                steps: ['Nhân tử số với tử số.', 'Nhân mẫu số với mẫu số.', 'Rút gọn kết quả.'],
                example: worked({
                    layout: 'calc', problem: 'Tính: 6/7 × 2/3',
                    steps: [step('Tử nhân tử, mẫu nhân mẫu:', '6/7 × 2/3 = 12/21'), step('Rút gọn (chia cả tử và mẫu cho 3):', '12/21 = 4/7')],
                    answer: 'Vậy 6/7 × 2/3 = 4/7.',
                }),
            }),
            form({
                id: 'chia', title: 'Dạng 2: Chia hai phân số', level: 1,
                cue: 'Phép chia hai phân số.',
                steps: ['Đảo ngược phân số thứ hai (số chia).', 'Nhân phân số thứ nhất với phân số vừa đảo ngược.', 'Rút gọn kết quả.'],
                example: worked({
                    layout: 'calc', problem: 'Tính: 4/5 : 2/5',
                    steps: [step('Đảo ngược phân số thứ hai: 2/5 thành 5/2.'), step('Nhân:', '4/5 × 5/2 = 20/10 = 2')],
                    answer: 'Vậy 4/5 : 2/5 = 2.',
                }),
            }),
            form({
                id: 'cua-mot-so', title: 'Dạng 3: Phân số của một số', level: 2,
                cue: 'Bài toán hỏi "a/b của một số" hoặc "đã dùng a/b …".',
                steps: ['Xác định số cần tìm phân số của nó.', 'Lấy số đó nhân với phân số.', 'Viết đáp số kèm đơn vị.'],
                example: worked({
                    problem: 'Một tấm vải dài 22 m, đã may áo hết 1/2 tấm vải. Hỏi đã dùng bao nhiêu mét vải?',
                    steps: [step('Số mét vải đã dùng là:', '22 × 1/2 = 11 (m)')],
                    answer: 'Đáp số: 11 m.',
                }),
            }),
        ],
        mistakes: [
            mistake('Bạn Bi tính: 4/5 : 2/5 = 5/4 × 2/5.', '4/5 : 2/5 = 4/5 × 5/2 = 2.', 'Chỉ đảo ngược phân số thứ hai (số chia), giữ nguyên phân số thứ nhất.'),
        ],
        remember: [
            'Nhân: tử nhân tử, mẫu nhân mẫu.',
            'Chia: nhân với phân số thứ hai đảo ngược.',
            'Phân số của một số: lấy số đó nhân với phân số.',
        ],
    }),
    'g5.frac_compare': lesson('g5.frac_compare', {
        v: 1,
        goal: 'so sánh được hai phân số và so sánh phân số với 1.',
        hook: { md: 'An ăn 2/3 cái bánh, Bình ăn 3/4 cái bánh như thế. Ai ăn nhiều hơn?', answer: 'Quy đồng: 2/3 = 8/12, 3/4 = 9/12. Vì 8 < 9 nên 2/3 < 3/4: Bình ăn nhiều hơn.' },
        needs: ['g4.fraction_compare'],
        know: [
            know('Hai cách so sánh',
                rule('Hai phân số cùng mẫu số: phân số nào có tử số lớn hơn thì lớn hơn.'),
                rule('Hai phân số khác mẫu số: quy đồng mẫu số rồi so sánh các tử số.'),
                pic('fractionBarSVG', 8, 12),
                pic('fractionBarSVG', 9, 12),
            ),
            know('So sánh phân số với 1',
                table(['Phân số', 'So với 1'], [
                    ['Tử số bé hơn mẫu số, ví dụ 5/6', 'Bé hơn 1'],
                    ['Tử số bằng mẫu số, ví dụ 6/6', 'Bằng 1'],
                    ['Tử số lớn hơn mẫu số, ví dụ 7/6', 'Lớn hơn 1'],
                ]),
            ),
        ],
        forms: [
            form({
                id: 'khac-mau', title: 'Dạng 1: So sánh hai phân số khác mẫu số', level: 1,
                cue: 'Đề cho hai phân số có mẫu số khác nhau và yêu cầu điền dấu.',
                steps: ['Quy đồng mẫu số.', 'So sánh hai tử số.', 'Viết dấu cho hai phân số ban đầu.'],
                example: worked({
                    layout: 'calc', problem: 'Điền dấu >, <, =: 4/7 … 1/9',
                    steps: [step('Quy đồng mẫu số, mẫu số chung là 63:', '4/7 = 36/63; 1/9 = 7/63'), step('So sánh tử số: 36 > 7.')],
                    answer: 'Vậy 4/7 > 1/9.',
                }),
            }),
            form({
                id: 'voi-1', title: 'Dạng 2: So sánh với 1', level: 2,
                cue: 'Đề yêu cầu so sánh một phân số với 1.',
                steps: ['So sánh tử số với mẫu số.', 'Tử bé hơn mẫu: bé hơn 1; bằng mẫu: bằng 1; lớn hơn mẫu: lớn hơn 1.'],
                example: worked({
                    layout: 'calc', problem: 'Điền dấu >, <, =: 5/6 … 1',
                    steps: [step('Tử số 5 bé hơn mẫu số 6.')],
                    answer: 'Vậy 5/6 < 1.',
                }),
            }),
        ],
        mistakes: [
            mistake('Bạn Bi viết 1/9 > 4/7 vì 9 > 7.', '4/7 > 1/9.', 'Mẫu số lớn hơn nghĩa là mỗi phần nhỏ hơn. Phải quy đồng mẫu số rồi mới so sánh tử số.'),
        ],
        remember: [
            'Cùng mẫu số: tử số lớn hơn thì phân số lớn hơn.',
            'Khác mẫu số: quy đồng rồi so sánh tử số.',
            'Tử bé hơn mẫu thì phân số bé hơn 1.',
        ],
    }),
} satisfies LessonBook;
