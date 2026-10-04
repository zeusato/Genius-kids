// Lớp 5 — Số thập phân (g5_numbers) và phép tính với số thập phân (g5_decimal_ops).
import { explore, form, know, lesson, mistake, note, rule, step, table, text, vis, widget, worked } from '../../build';
import { fmt } from '../../../value';
import type { LessonBook } from '../../types';

export default {
    'g5.decimal_read': lesson('g5.decimal_read', {
        v: 1,
        goal: 'đọc, viết được số thập phân và biết giá trị của mỗi chữ số theo hàng.',
        hook: { md: 'Bạn Nam cao 1,35 m. Số 1,35 đọc thế nào? Chữ số 3 cho biết điều gì?', answer: '1,35 đọc là "một phẩy ba mươi lăm". Chữ số 3 ở hàng phần mười, chỉ 3 phần mười mét.' },
        needs: ['g5.decimal_fraction'],
        know: [
            know('Phần nguyên và phần thập phân',
                text('Số thập phân gồm **phần nguyên** (bên trái dấu phẩy) và **phần thập phân** (bên phải dấu phẩy).'),
                rule('Muốn đọc số thập phân, ta đọc phần nguyên, đọc "phẩy", rồi đọc phần thập phân.'),
                widget({ w: 'place-value', int: 3, dec: 3, init: 709.251 }),
            ),
            know('Các hàng của phần thập phân',
                table(['Hàng', 'Phần mười', 'Phần trăm', 'Phần nghìn'], [['Một đơn vị của hàng', '0,1', '0,01', '0,001']]),
                text('Mỗi đơn vị của một hàng bằng 10 đơn vị của hàng thấp hơn liền sau nó.'),
            ),
        ],
        forms: [
            form({
                id: 'doc', title: 'Dạng 1: Đọc số thập phân', level: 1,
                cue: 'Đề cho số thập phân và hỏi cách đọc.',
                steps: ['Đọc phần nguyên như số tự nhiên.', 'Đọc "phẩy".', 'Đọc phần thập phân như số tự nhiên (chữ số 0 ở đầu đọc là "không").'],
                example: worked({
                    layout: 'calc', problem: 'Đọc số thập phân 709,251.',
                    steps: [step('Phần nguyên 709: bảy trăm linh chín.'), step('Đọc "phẩy".'), step('Phần thập phân 251: hai trăm năm mươi mốt.')],
                    answer: 'Đọc là "bảy trăm linh chín phẩy hai trăm năm mươi mốt".',
                }),
            }),
            form({
                id: 'viet', title: 'Dạng 2: Viết số thập phân', level: 1,
                cue: 'Đề cho cách đọc và yêu cầu viết số thập phân.',
                steps: ['Viết phần nguyên.', 'Viết dấu phẩy.', 'Viết phần thập phân.'],
                example: worked({
                    layout: 'calc', problem: 'Viết số thập phân: hai trăm ba mươi tư phẩy bốn trăm hai mươi tám.',
                    steps: [step('Phần nguyên: 234.'), step('Phần thập phân: 428.')],
                    answer: 'Số đó là 234,428.',
                }),
            }),
            form({
                id: 'hang', title: 'Dạng 3: Chữ số thuộc hàng nào?', level: 2,
                cue: 'Đề hỏi một chữ số ở phần thập phân thuộc hàng nào.',
                steps: ['Đếm từ dấu phẩy sang phải.', 'Lần lượt là hàng phần mười, phần trăm, phần nghìn.'],
                example: worked({
                    layout: 'calc', problem: 'Trong số 73,552, chữ số 5 thứ hai sau dấu phẩy thuộc hàng nào?',
                    steps: [step('Sau dấu phẩy lần lượt là hàng phần mười, phần trăm, phần nghìn.'), step('Chữ số thứ hai sau dấu phẩy thuộc hàng phần trăm.')],
                    answer: 'Chữ số đó thuộc hàng phần trăm.',
                }),
            }),
        ],
        mistakes: [
            mistake('Bạn Bi nói chữ số 5 thứ hai sau dấu phẩy của 73,552 thuộc hàng trăm.', 'Chữ số đó thuộc hàng phần trăm.', 'Các hàng bên phải dấu phẩy đều có chữ "phần": phần mười, phần trăm, phần nghìn.'),
        ],
        remember: [
            'Bên trái dấu phẩy là phần nguyên, bên phải là phần thập phân.',
            'Đọc: phần nguyên, "phẩy", phần thập phân.',
            'Sau dấu phẩy: hàng phần mười, phần trăm, phần nghìn.',
        ],
    }),
    'g5.decimal_compare': lesson('g5.decimal_compare', {
        v: 1,
        goal: 'so sánh và sắp xếp được các số thập phân.',
        hook: { md: 'Lan nhảy xa 2,7 m, Hoa nhảy xa 2,65 m. Bạn nào nhảy xa hơn?', answer: 'Cùng phần nguyên 2. Ở hàng phần mười, 7 > 6 nên 2,7 > 2,65: Lan nhảy xa hơn.' },
        needs: ['g5.decimal_read'],
        know: [
            know('Cách so sánh',
                rule('So sánh phần nguyên trước: phần nguyên lớn hơn thì số đó lớn hơn.'),
                rule('Phần nguyên bằng nhau thì so sánh lần lượt hàng phần mười, phần trăm, phần nghìn.'),
                widget({ w: 'place-value', int: 1, dec: 2, init: 2.7, other: 2.65, mode: 'compare' }),
            ),
            know('Thêm chữ số 0 ở cuối',
                note('Viết thêm chữ số 0 vào bên phải phần thập phân thì giá trị không đổi: 2,7 = 2,70.'),
                text('Vì vậy so sánh 2,7 với 2,65 cũng như so sánh 2,70 với 2,65.'),
            ),
        ],
        forms: [
            form({
                id: 'dien-dau', title: 'Dạng 1: Điền dấu >, <, =', level: 1,
                cue: 'Đề cho hai số thập phân và ô trống để điền dấu.',
                steps: ['So sánh phần nguyên.', 'Nếu bằng nhau, so từng hàng của phần thập phân từ trái sang phải.'],
                example: worked({
                    layout: 'calc', problem: 'Điền dấu >, <, =: 10,5 … 4,8',
                    steps: [step('So sánh phần nguyên: 10 > 4.')],
                    answer: 'Vậy 10,5 > 4,8.',
                }),
            }),
            form({
                id: 'sap-xep', title: 'Dạng 2: Sắp xếp các số thập phân', level: 2,
                cue: 'Đề cho nhiều số thập phân và yêu cầu sắp xếp.',
                steps: ['So phần nguyên trước.', 'Cùng phần nguyên thì so hàng phần mười, rồi phần trăm.', 'Viết theo thứ tự đề yêu cầu.'],
                example: worked({
                    layout: 'calc', problem: 'Sắp xếp các số 7,19; 7,3; 7,1; 7,16 theo thứ tự từ lớn đến bé.',
                    steps: [step('Các số đều có phần nguyên 7. So hàng phần mười: 3 là lớn nhất, nên 7,3 lớn nhất.'), step('Ba số còn lại cùng hàng phần mười là 1. So hàng phần trăm: 9 > 6 > 0 (vì 7,1 cũng là 7,10).')],
                    answer: 'Thứ tự từ lớn đến bé: 7,3; 7,19; 7,16; 7,1.',
                }),
            }),
        ],
        mistakes: [
            mistake('Bạn Bi viết 7,19 > 7,3 vì 19 > 3.', '7,3 > 7,19.', 'Không so sánh phần thập phân như số tự nhiên. So từng hàng: ở hàng phần mười, 3 > 1 nên 7,3 lớn hơn.'),
        ],
        remember: [
            'So phần nguyên trước.',
            'Cùng phần nguyên: so từng hàng phần mười, phần trăm, phần nghìn.',
            'Thêm chữ số 0 ở cuối phần thập phân thì giá trị không đổi.',
        ],
    }),
    'g5.decimal_round': lesson('g5.decimal_round', {
        v: 1,
        goal: 'làm tròn được số thập phân đến số tự nhiên gần nhất, đến hàng phần mười, hàng phần trăm.',
        hook: { md: 'Quả dưa cân nặng 2,68 kg. Nói "quả dưa nặng khoảng 2,7 kg" có đúng không?', answer: 'Đúng: làm tròn 2,68 đến hàng phần mười được 2,7.' },
        needs: ['g5.decimal_compare'],
        know: [
            know('Cách làm tròn',
                rule('Làm tròn đến hàng nào thì xét chữ số ngay bên phải hàng đó. Bé hơn 5 thì giữ nguyên, từ 5 trở lên thì cộng thêm 1 vào hàng đó. Rồi bỏ các chữ số bên phải.'),
                widget(explore({
                    title: 'Làm tròn đến hàng phần mười',
                    controls: {
                        t: { label: 'Chữ số hàng phần mười', min: 0, max: 8, init: 6 },
                        u: { label: 'Chữ số hàng phần trăm', min: 0, max: 9, init: 8 },
                    },
                    visual: v => vis('numberLineSVG', 2 + v.t / 10, 2 + (v.t + 1) / 10, 0.01, [2 + v.t / 10 + v.u / 100]),
                    caption: v => {
                        const x = fmt(2 + v.t / 10 + v.u / 100), lo = fmt(2 + v.t / 10, { decimals: 1, fixed: true }), hi = fmt(2 + (v.t + 1) / 10, { decimals: 1, fixed: true });
                        return v.u === 0 ? `${x} đã tròn đến hàng phần mười.` : `${x} nằm giữa ${lo} và ${hi}. Chữ số hàng phần trăm là ${v.u}, ${v.u < 5 ? 'bé hơn 5' : 'từ 5 trở lên'} nên làm tròn được ${v.u < 5 ? lo : hi}.`;
                    },
                })),
            ),
            know('Một số ví dụ',
                table(['Số', 'Làm tròn đến', 'Kết quả'], [['49,14', 'hàng phần mười', '49,1'], ['47,222', 'số tự nhiên gần nhất', '47'], ['3,456', 'hàng phần trăm', '3,46'], ['8,97', 'hàng phần mười', '9,0']]),
            ),
        ],
        forms: [
            form({
                id: 'phan-muoi', title: 'Dạng 1: Làm tròn đến hàng phần mười, phần trăm', level: 2,
                cue: 'Đề yêu cầu làm tròn đến hàng phần mười hoặc hàng phần trăm.',
                steps: ['Tìm chữ số ở hàng cần làm tròn.', 'Xét chữ số ngay bên phải.', 'Giữ nguyên hoặc cộng thêm 1, rồi bỏ các chữ số bên phải.'],
                example: worked({
                    layout: 'calc', problem: 'Làm tròn số 49,14 đến hàng phần mười.',
                    steps: [step('Chữ số hàng phần mười là 1.'), step('Chữ số ngay bên phải là 4, bé hơn 5, nên giữ nguyên 1 và bỏ chữ số 4.')],
                    answer: 'Làm tròn 49,14 đến hàng phần mười được 49,1.',
                }),
            }),
            form({
                id: 'so-tu-nhien', title: 'Dạng 2: Làm tròn đến số tự nhiên gần nhất', level: 2,
                cue: 'Đề yêu cầu làm tròn đến số tự nhiên (hàng đơn vị).',
                steps: ['Xét chữ số hàng phần mười.', 'Bé hơn 5: giữ phần nguyên; từ 5 trở lên: cộng thêm 1 vào phần nguyên.', 'Bỏ toàn bộ phần thập phân.'],
                example: worked({
                    layout: 'calc', problem: 'Làm tròn số 47,222 đến số tự nhiên gần nhất.',
                    steps: [step('Chữ số hàng phần mười là 2.'), step('2 bé hơn 5 nên giữ nguyên phần nguyên 47.')],
                    answer: 'Làm tròn 47,222 được 47.',
                }),
            }),
        ],
        mistakes: [
            mistake('Làm tròn 2,68 đến hàng phần mười, bạn Bi bỏ chữ số 8 và viết 2,6.', 'Làm tròn được 2,7.', 'Chữ số bị bỏ là 8, từ 5 trở lên, nên phải cộng thêm 1 vào hàng phần mười.'),
        ],
        remember: [
            'Xét chữ số ngay bên phải hàng cần làm tròn.',
            'Bé hơn 5: giữ nguyên. Từ 5 trở lên: cộng thêm 1.',
            'Bỏ các chữ số bên phải hàng làm tròn.',
        ],
    }),
    'g5.measure_decimal': lesson('g5.measure_decimal', {
        v: 1,
        goal: 'viết được số đo độ dài, khối lượng dưới dạng số thập phân.',
        hook: { md: 'Bố cao 1 m 72 cm. Viết chiều cao của bố bằng mét thế nào?', answer: '72 cm là 72/100 m, tức là 0,72 m, nên 1 m 72 cm viết là 1,72 m.' },
        needs: ['g5.decimal_read'],
        know: [
            know('Đổi đơn vị bé ra đơn vị lớn',
                table(['Đơn vị bé', 'Bằng (phân số)', 'Bằng (số thập phân)'], [['1 dm', '1/10 m', '0,1 m'], ['1 cm', '1/100 m', '0,01 m'], ['1 m', '1/1000 km', '0,001 km'], ['1 g', '1/1000 kg', '0,001 kg']]),
                rule('Đổi phần đơn vị bé ra phân số thập phân của đơn vị lớn, rồi viết thành số thập phân.'),
            ),
            know('Thang đơn vị',
                widget({ w: 'unit-ladder', kind: 'length', value: 690, from: 'm', to: 'km' }),
                text('Ví dụ khối lượng: 3 kg 45 g = 3 kg + 45/1000 kg, viết là 3,045 kg.'),
            ),
        ],
        forms: [
            form({
                id: 'do-dai', title: 'Dạng 1: Số đo độ dài', level: 2,
                cue: 'Đề cho số đo hai tên đơn vị như 14 m 7 dm và hỏi bằng bao nhiêu mét.',
                steps: ['Đổi phần đơn vị bé ra phân số thập phân của đơn vị lớn.', 'Viết thành số thập phân.', 'Ghép với phần đơn vị lớn.'],
                example: worked({
                    layout: 'calc', problem: '14 m 7 dm = ? m',
                    steps: [step('7 dm là 7/10 m, tức là 0,7 m.'), step('Ghép với 14 m.')],
                    answer: 'Vậy 14 m 7 dm = 14,7 m.',
                }),
            }),
            form({
                id: 'km', title: 'Dạng 2: Đổi mét ra ki-lô-mét', level: 2,
                cue: 'Đề cho số đo như 4 km 690 m và hỏi bằng bao nhiêu ki-lô-mét.',
                steps: ['1 m là 1/1000 km, nên phần mét cần ba chữ số sau dấu phẩy.', 'Thiếu chữ số thì viết thêm 0 ngay sau dấu phẩy.'],
                example: worked({
                    layout: 'calc', problem: '4 km 690 m = ? km',
                    steps: [step('690 m là 690/1000 km, tức là 0,69 km.'), step('Ghép với 4 km.')],
                    answer: 'Vậy 4 km 690 m = 4,69 km.',
                }),
            }),
        ],
        mistakes: [
            mistake('Bạn Bi viết: 4 km 69 m = 4,69 km.', '4 km 69 m = 4,069 km.', '69 m là 69/1000 km, tức là 0,069 km. Đổi mét ra ki-lô-mét cần ba chữ số sau dấu phẩy.'),
        ],
        remember: [
            '1 dm = 0,1 m; 1 cm = 0,01 m; 1 m = 0,001 km.',
            'Đổi phần đơn vị bé thành phân số thập phân rồi thành số thập phân.',
            'Đủ số chữ số sau dấu phẩy; thiếu thì viết thêm 0.',
        ],
    }),
    'g5.dec_addsub': lesson('g5.dec_addsub', {
        v: 1,
        goal: 'đặt tính và cộng, trừ được các số thập phân.',
        hook: { md: 'Bao gạo thứ nhất nặng 11,7 kg, bao thứ hai nặng 36,92 kg. Cả hai bao nặng bao nhiêu ki-lô-gam?', answer: '11,7 + 36,92 = 48,62 (kg).' },
        needs: ['g5.decimal_read'],
        know: [
            know('Cộng số thập phân',
                rule('Viết số này dưới số kia sao cho các chữ số cùng hàng thẳng cột, dấu phẩy thẳng cột với dấu phẩy.'),
                text('Cộng như cộng các số tự nhiên, rồi viết dấu phẩy ở kết quả thẳng cột với các dấu phẩy.'),
                widget({ w: 'column', op: '+', a: 11.7, b: 36.92 }),
            ),
            know('Trừ số thập phân',
                text('Nếu số bị trừ có ít chữ số ở phần thập phân hơn, em viết thêm chữ số 0 vào bên phải phần thập phân của nó cho đủ.'),
                widget({ w: 'column', op: '-', a: 30.7, b: 2.77 }),
            ),
        ],
        forms: [
            form({
                id: 'hai-so', title: 'Dạng 1: Cộng, trừ hai số thập phân', level: 1,
                cue: 'Đề cho phép cộng hoặc trừ hai số thập phân.',
                steps: ['Đặt tính: dấu phẩy thẳng cột.', 'Phép trừ: thêm chữ số 0 cho đủ hàng nếu cần.', 'Tính như số tự nhiên.', 'Đặt dấu phẩy ở kết quả thẳng cột.'],
                example: worked({
                    layout: 'calc', problem: 'Đặt tính rồi tính: 30,7 − 2,77',
                    steps: [
                        step('Viết thêm chữ số 0 vào bên phải phần thập phân của số bị trừ: 30,7 = 30,70.'),
                        step('0 không trừ được 7, lấy 10 trừ 7 bằng 3, viết 3 nhớ 1.'),
                        step('7 thêm 1 bằng 8; 7 không trừ được 8, lấy 17 trừ 8 bằng 9, viết 9 nhớ 1.'),
                        step('2 thêm 1 bằng 3; 0 không trừ được 3, lấy 10 trừ 3 bằng 7, viết 7 nhớ 1.'),
                        step('3 trừ 1 bằng 2, viết 2.'),
                        step('Đặt dấu phẩy ở kết quả thẳng cột với các dấu phẩy ở trên.'),
                    ],
                    answer: 'Vậy 30,7 − 2,77 = 27,93.', check: 'Thử lại: 27,93 + 2,77 = 30,7.',
                    replay: { w: 'column', op: '-', a: 30.7, b: 2.77 },
                }),
            }),
            form({
                id: 'ba-so', title: 'Dạng 2: Biểu thức có ba số', level: 2,
                cue: 'Biểu thức có ba số thập phân với dấu cộng, trừ.',
                steps: ['Tính lần lượt từ trái sang phải.', 'Mỗi phép tính đặt dấu phẩy thẳng cột.'],
                example: worked({
                    layout: 'calc', problem: 'Tính: 226,58 + 73 − 6,86',
                    steps: [step('Tính từ trái sang phải:', '226,58 + 73 = 299,58'), step('Rồi trừ:', '299,58 − 6,86 = 292,72')],
                    answer: 'Vậy 226,58 + 73 − 6,86 = 292,72.',
                }),
            }),
        ],
        mistakes: [
            mistake('Đặt tính 11,7 + 36,92, bạn Bi viết chữ số 7 thẳng cột với chữ số 2 (thẳng hàng bên phải).', 'Đặt dấu phẩy thẳng cột: chữ số 7 thẳng với chữ số 9 ở hàng phần mười.',
                'Số thập phân phải thẳng cột theo dấu phẩy, không thẳng theo chữ số cuối như số tự nhiên.'),
        ],
        remember: [
            'Dấu phẩy thẳng cột với dấu phẩy.',
            'Tính như số tự nhiên, rồi đặt dấu phẩy ở kết quả.',
            'Phép trừ: thêm chữ số 0 vào số bị trừ cho đủ hàng nếu cần.',
        ],
    }),
    'g5.dec_mul': lesson('g5.dec_mul', {
        v: 1,
        goal: 'nhân được số thập phân với số tự nhiên và với số thập phân.',
        hook: { md: 'Mỗi chai dầu chứa 1,5 l. Hỏi 4 chai như thế chứa bao nhiêu lít dầu?', answer: '1,5 × 4 = 6 (l).' },
        needs: ['g5.dec_addsub'],
        know: [
            know('Quy tắc nhân',
                rule('Nhân như nhân các số tự nhiên. Đếm xem các thừa số có tất cả bao nhiêu chữ số ở phần thập phân. Dùng dấu phẩy tách ở tích ra bấy nhiêu chữ số, kể từ phải sang trái.'),
                widget({ w: 'column', op: '×', a: 2.35, b: 4 }),
            ),
            know('Nhân hai số thập phân',
                text('Ví dụ 10,7 × 8,2: nhân 107 × 82 = 8774. Hai thừa số có tất cả 2 chữ số ở phần thập phân, nên tích là 87,74.'),
                note('Không cần đặt dấu phẩy thẳng cột khi nhân; chỉ đếm chữ số ở phần thập phân.'),
            ),
        ],
        forms: [
            form({
                id: 'stn', title: 'Dạng 1: Nhân số thập phân với số tự nhiên', level: 1,
                cue: 'Một thừa số là số thập phân, thừa số kia là số tự nhiên.',
                steps: ['Nhân như nhân số tự nhiên.', 'Đếm chữ số ở phần thập phân của thừa số thập phân.', 'Tách ở tích bấy nhiêu chữ số kể từ phải sang trái.'],
                example: worked({
                    layout: 'calc', problem: 'Tính: 65,6 × 5',
                    steps: [step('Nhân như số tự nhiên:', '656 × 5 = 3280'), step('Thừa số 65,6 có một chữ số ở phần thập phân, tách một chữ số ở tích: 328,0.')],
                    answer: 'Vậy 65,6 × 5 = 328.',
                }),
            }),
            form({
                id: 'stp', title: 'Dạng 2: Nhân hai số thập phân', level: 2,
                cue: 'Cả hai thừa số đều là số thập phân.',
                steps: ['Nhân như nhân số tự nhiên.', 'Đếm tổng số chữ số ở phần thập phân của cả hai thừa số.', 'Tách ở tích bấy nhiêu chữ số kể từ phải sang trái.'],
                example: worked({
                    layout: 'calc', problem: 'Tính: 10,7 × 8,2',
                    steps: [step('Nhân như số tự nhiên:', '107 × 82 = 8774'), step('Hai thừa số có tất cả 2 chữ số ở phần thập phân, tách 2 chữ số ở tích.')],
                    answer: 'Vậy 10,7 × 8,2 = 87,74.',
                }),
            }),
        ],
        mistakes: [
            mistake('Bạn Bi tính: 10,7 × 8,2 = 877,4.', '10,7 × 8,2 = 87,74.', 'Phải đếm chữ số ở phần thập phân của cả hai thừa số: 1 + 1 = 2 chữ số.'),
        ],
        remember: [
            'Nhân như số tự nhiên.',
            'Đếm tất cả chữ số ở phần thập phân của các thừa số.',
            'Tách ở tích bấy nhiêu chữ số kể từ phải sang trái.',
        ],
    }),
    'g5.dec_div': lesson('g5.dec_div', {
        v: 1,
        goal: 'chia được số thập phân cho số tự nhiên và chia cho số thập phân.',
        hook: { md: 'Sợi dây dài 8,4 m cắt thành 6 đoạn bằng nhau. Mỗi đoạn dài bao nhiêu mét?', answer: '8,4 : 6 = 1,4 (m).' },
        needs: ['g3.div_1digit', 'g5.dec_mul'],
        know: [
            know('Chia số thập phân cho số tự nhiên',
                rule('Chia phần nguyên trước. Trước khi hạ chữ số đầu tiên ở phần thập phân, viết dấu phẩy vào bên phải thương, rồi chia tiếp.'),
                widget({ w: 'long-division', a: 176.4, b: 4 }),
            ),
            know('Chia cho số thập phân',
                rule('Đếm số chữ số ở phần thập phân của số chia. Chuyển dấu phẩy ở cả số bị chia và số chia sang phải bấy nhiêu chữ số. Rồi chia như chia cho số tự nhiên.'),
                text('Ví dụ: 233,7 : 5,7 = 2337 : 57 = 41.'),
            ),
        ],
        forms: [
            form({
                id: 'cho-stn', title: 'Dạng 1: Chia số thập phân cho số tự nhiên', level: 1,
                cue: 'Số bị chia là số thập phân, số chia là số tự nhiên.',
                steps: ['Đặt tính và chia phần nguyên.', 'Viết dấu phẩy vào thương trước khi hạ chữ số đầu tiên ở phần thập phân.', 'Chia tiếp như số tự nhiên.', 'Thử lại bằng phép nhân.'],
                example: worked({
                    layout: 'calc', problem: 'Đặt tính rồi tính: 176,4 : 4',
                    steps: [
                        step('1 bé hơn 4 nên lấy 17. 17 chia 4 được 4, viết 4. 4 nhân 4 bằng 16; 17 trừ 16 bằng 1. Hạ 6, được 16.'),
                        step('16 chia 4 được 4, viết 4. 4 nhân 4 bằng 16; 16 trừ 16 bằng 0. Viết dấu phẩy vào bên phải 44 ở thương. Hạ 4, được 4.'),
                        step('4 chia 4 được 1, viết 1. 1 nhân 4 bằng 4; 4 trừ 4 bằng 0.'),
                    ],
                    answer: 'Vậy 176,4 : 4 = 44,1.', check: 'Thử lại: 44,1 × 4 = 176,4.',
                    replay: { w: 'long-division', a: 176.4, b: 4 },
                }),
            }),
            form({
                id: 'cho-stp', title: 'Dạng 2: Chia cho số thập phân', level: 2,
                cue: 'Số chia là số thập phân.',
                steps: ['Đếm chữ số ở phần thập phân của số chia.', 'Chuyển dấu phẩy ở cả hai số sang phải bấy nhiêu chữ số.', 'Chia như chia cho số tự nhiên.'],
                example: worked({
                    layout: 'calc', problem: 'Tính: 233,7 : 5,7',
                    steps: [
                        step('Số chia 5,7 có một chữ số ở phần thập phân. Chuyển dấu phẩy ở cả hai số sang phải một chữ số:', '233,7 : 5,7 = 2337 : 57'),
                        step('Lấy 233 chia 57 được 4; 4 nhân 57 bằng 228; 233 trừ 228 bằng 5. Hạ 7, được 57; 57 chia 57 được 1.', '2337 : 57 = 41'),
                    ],
                    answer: 'Vậy 233,7 : 5,7 = 41.',
                }),
            }),
        ],
        mistakes: [
            mistake('Chia 233,7 : 5,7, bạn Bi chỉ bỏ dấu phẩy ở số chia: 233,7 : 57.', '233,7 : 5,7 = 2337 : 57 = 41.', 'Phải chuyển dấu phẩy ở cả hai số sang phải cùng một số chữ số thì thương mới không đổi.'),
        ],
        remember: [
            'Chia cho số tự nhiên: viết dấu phẩy vào thương trước khi hạ chữ số đầu tiên ở phần thập phân.',
            'Chia cho số thập phân: chuyển dấu phẩy ở cả hai số sang phải cùng số chữ số.',
            'Thử lại bằng phép nhân.',
        ],
    }),
    'g5.dec_shift': lesson('g5.dec_shift', {
        v: 1,
        goal: 'nhân, chia nhanh số thập phân với 10, 100, 1000 và nhân với 0,1; 0,01; 0,001.',
        hook: { md: 'Một quyển vở giá 5,8 nghìn đồng. 10 quyển vở như thế giá bao nhiêu nghìn đồng?', answer: '5,8 × 10 = 58 (nghìn đồng).' },
        needs: ['g5.dec_mul'],
        know: [
            know('Chuyển dấu phẩy',
                rule('Nhân với 10, 100, 1000: chuyển dấu phẩy sang phải 1, 2, 3 chữ số.'),
                rule('Chia cho 10, 100, 1000: chuyển dấu phẩy sang trái 1, 2, 3 chữ số.'),
                widget({ w: 'place-value', int: 4, dec: 3, init: 5.91, mode: 'shift' }),
            ),
            know('Nhân với 0,1; 0,01; 0,001',
                rule('Nhân với 0,1; 0,01; 0,001 chính là chia cho 10, 100, 1000.'),
                text('Ví dụ: 359 × 0,1 = 359 : 10 = 35,9.'),
                note('Thiếu chữ số để chuyển dấu phẩy thì viết thêm chữ số 0: 4,5 × 100 = 450; 4,5 : 100 = 0,045.'),
            ),
        ],
        forms: [
            form({
                id: 'nhan-chia-10', title: 'Dạng 1: Nhân, chia với 10, 100, 1000', level: 1,
                cue: 'Phép nhân hoặc chia một số thập phân với 10, 100, 1000.',
                steps: ['Đếm số chữ số 0 của 10, 100, 1000.', 'Nhân: chuyển dấu phẩy sang phải bấy nhiêu chữ số. Chia: sang trái.'],
                example: worked({
                    layout: 'calc', problem: 'Tính: 5,91 × 100',
                    steps: [step('Nhân với 100: chuyển dấu phẩy sang phải 2 chữ số.')],
                    answer: 'Vậy 5,91 × 100 = 591.',
                }),
            }),
            form({
                id: 'nhan-0-1', title: 'Dạng 2: Nhân với 0,1; 0,01; 0,001', level: 2,
                cue: 'Phép nhân một số với 0,1; 0,01 hoặc 0,001.',
                steps: ['Đổi thành phép chia cho 10, 100, 1000.', 'Chuyển dấu phẩy sang trái 1, 2, 3 chữ số.'],
                example: worked({
                    layout: 'calc', problem: 'Tính: 181,8 × 0,001',
                    steps: [step('Nhân với 0,001 là chia cho 1000: chuyển dấu phẩy sang trái 3 chữ số.'), step('181,8 chỉ có 3 chữ số ở phần nguyên nên viết thêm chữ số 0 ở bên trái: 0,1818.')],
                    answer: 'Vậy 181,8 × 0,001 = 0,1818.',
                }),
            }),
        ],
        mistakes: [
            mistake('Bạn Bi tính: 68,342 : 10 = 683,42.', '68,342 : 10 = 6,8342.', 'Chia cho 10 thì số bé đi, nên phải chuyển dấu phẩy sang trái một chữ số.'),
        ],
        remember: [
            'Nhân với 10, 100, 1000: dấu phẩy sang phải 1, 2, 3 chữ số.',
            'Chia cho 10, 100, 1000 (hoặc nhân với 0,1; 0,01; 0,001): dấu phẩy sang trái.',
            'Thiếu chữ số thì viết thêm 0.',
        ],
    }),
} satisfies LessonBook;
