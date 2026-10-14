// Lớp 3 — Biểu thức số (g3_expressions).
import { form, know, lesson, mistake, rule, step, table, text, worked } from '../../build';
import type { LessonBook } from '../../types';

export default {
    'g3.expression': lesson('g3.expression', {
        v: 1,
        goal: 'tính đúng giá trị biểu thức theo thứ tự thực hiện các phép tính.',
        hook: { md: 'Bạn An tính 20 + 5 × 2 ra 50, bạn Bình tính ra 30. Bạn nào đúng?', answer: 'Bạn Bình đúng: 20 + 5 × 2 = 20 + 10 = 30.' },
        know: [
            know('Biểu thức và giá trị của biểu thức',
                text('Các số nối với nhau bằng dấu phép tính gọi là **biểu thức**, ví dụ 20 + 5 × 2. Tính ra một số, đó là **giá trị của biểu thức**.'),
                rule('Biểu thức chỉ có cộng, trừ (hoặc chỉ có nhân, chia) thì tính lần lượt từ trái sang phải.'),
                rule('Biểu thức có cả cộng, trừ, nhân, chia thì thực hiện nhân, chia trước; cộng, trừ sau.'),
            ),
            know('Biểu thức có dấu ngoặc',
                rule('Biểu thức có dấu ngoặc thì thực hiện các phép tính trong ngoặc trước.'),
                text('So sánh hai cách viết:\n\n(20 + 5) × 2 = 25 × 2 = 50\n\n20 + 5 × 2 = 20 + 10 = 30'),
                text('Dấu ngoặc làm thay đổi thứ tự tính, nên kết quả có thể khác nhau.'),
            ),
        ],
        forms: [
            form({
                id: 'trai-sang-phai', title: 'Dạng 1: Chỉ có cộng, trừ (hoặc chỉ có nhân, chia)', level: 1,
                cue: 'Biểu thức chỉ có dấu + và −, hoặc chỉ có dấu × và :.',
                steps: ['Tính phép tính đầu tiên bên trái.', 'Lấy kết quả tính tiếp với số bên phải.', 'Làm đến hết biểu thức.'],
                example: worked({
                    layout: 'calc', problem: 'Tính giá trị của biểu thức: 350 + 235 − 390',
                    steps: [step('Chỉ có cộng, trừ nên tính từ trái sang phải:', '350 + 235 = 585'), step('Lấy kết quả trừ tiếp:', '585 − 390 = 195')],
                    answer: 'Vậy 350 + 235 − 390 = 195.',
                }),
            }),
            form({
                id: 'nhan-chia-truoc', title: 'Dạng 2: Có cả cộng, trừ, nhân, chia', level: 2,
                cue: 'Biểu thức vừa có + hoặc −, vừa có × hoặc :.',
                steps: ['Tìm phép nhân, chia và tính trước.', 'Viết lại biểu thức với kết quả vừa tính.', 'Tính cộng, trừ sau.'],
                example: worked({
                    layout: 'calc', problem: 'Tính giá trị của biểu thức: 53 − 8 × 3',
                    steps: [step('Có trừ và nhân, làm phép nhân trước:', '8 × 3 = 24'), step('Rồi làm phép trừ:', '53 − 24 = 29')],
                    answer: 'Vậy 53 − 8 × 3 = 29.',
                }),
            }),
            form({
                id: 'ngoac', title: 'Dạng 3: Có dấu ngoặc', level: 3,
                cue: 'Biểu thức có dấu ngoặc ( ).',
                steps: ['Tính phép tính trong ngoặc trước.', 'Thay ngoặc bằng kết quả vừa tính.', 'Tính tiếp theo thứ tự thông thường.'],
                example: worked({
                    layout: 'calc', problem: 'Tính giá trị của biểu thức: (31 + 20) × 5',
                    steps: [step('Tính trong ngoặc trước:', '31 + 20 = 51'), step('Rồi nhân:', '51 × 5 = 255')],
                    answer: 'Vậy (31 + 20) × 5 = 255.',
                }),
            }),
        ],
        mistakes: [
            mistake('Bạn Bi tính: 53 − 8 × 3 = 45 × 3 = 135.', '53 − 8 × 3 = 53 − 24 = 29.', 'Bi tính từ trái sang phải. Biểu thức có cả trừ và nhân thì phải nhân trước.'),
            mistake('Bạn Bi tính: 48 : 4 × 2 = 48 : 8 = 6.', '48 : 4 × 2 = 12 × 2 = 24.', 'Biểu thức chỉ có nhân, chia thì tính lần lượt từ trái sang phải, không làm phép nhân trước.'),
        ],
        remember: [
            'Chỉ có cộng, trừ (hoặc chỉ có nhân, chia): tính từ trái sang phải.',
            'Có cộng, trừ và nhân, chia: nhân, chia trước; cộng, trừ sau.',
            'Có dấu ngoặc: tính trong ngoặc trước.',
        ],
    }),
    'g3.missing': lesson('g3.missing', {
        v: 1,
        goal: 'tìm được thừa số, số bị chia, số chia chưa biết.',
        hook: { md: 'Một số nhân với 7 thì được 35. Số đó là bao nhiêu?', answer: 'Số đó là: 35 : 7 = 5.' },
        needs: ['g3.div_tables'],
        know: [
            know('Tên gọi các thành phần',
                table(['Phép tính', 'Tên các thành phần'], [
                    ['5 × 7 = 35', '5 và 7 là thừa số; 35 là tích'],
                    ['40 : 8 = 5', '40 là số bị chia; 8 là số chia; 5 là thương'],
                ]),
                rule('Muốn tìm thừa số, ta lấy tích chia cho thừa số kia.'),
            ),
            know('Tìm số bị chia và số chia',
                rule('Muốn tìm số bị chia, ta lấy thương nhân với số chia.'),
                rule('Muốn tìm số chia, ta lấy số bị chia chia cho thương.'),
                text('Tìm xong, em thay số vừa tìm vào phép tính để **thử lại**.'),
            ),
        ],
        forms: [
            form({
                id: 'thua-so', title: 'Dạng 1: Tìm thừa số', level: 2,
                cue: 'Ô trống ở một thừa số của phép nhân, ví dụ ? × 7 = 35.',
                steps: ['Gọi tên: 35 là tích, 7 là thừa số đã biết.', 'Lấy tích chia cho thừa số đã biết.', 'Thử lại bằng phép nhân.'],
                example: worked({
                    layout: 'calc', problem: 'Tìm thừa số: ? × 7 = 35',
                    steps: [step('Thừa số cần tìm là:', '35 : 7 = 5')],
                    answer: 'Số cần điền là 5.', check: 'Thử lại: 5 × 7 = 35.',
                }),
            }),
            form({
                id: 'so-bi-chia', title: 'Dạng 2: Tìm số bị chia', level: 2,
                cue: 'Ô trống ở vị trí số bị chia, ví dụ ? : 9 = 10.',
                steps: ['Gọi tên: 9 là số chia, 10 là thương.', 'Lấy thương nhân với số chia.', 'Thử lại bằng phép chia.'],
                example: worked({
                    layout: 'calc', problem: 'Tìm số bị chia: ? : 9 = 10',
                    steps: [step('Số bị chia là:', '10 × 9 = 90')],
                    answer: 'Số cần điền là 90.', check: 'Thử lại: 90 : 9 = 10.',
                }),
            }),
            form({
                id: 'so-chia', title: 'Dạng 3: Tìm số chia', level: 2,
                cue: 'Ô trống ở vị trí số chia, ví dụ 56 : ? = 8.',
                steps: ['Gọi tên: 56 là số bị chia, 8 là thương.', 'Lấy số bị chia chia cho thương.', 'Thử lại bằng phép chia.'],
                example: worked({
                    layout: 'calc', problem: 'Tìm số chia: 56 : ? = 8',
                    steps: [step('Số chia là:', '56 : 8 = 7')],
                    answer: 'Số cần điền là 7.', check: 'Thử lại: 56 : 7 = 8.',
                }),
            }),
        ],
        mistakes: [
            mistake('Tìm số bị chia trong ? : 9 = 10, bạn Bi lấy 10 chia cho 9.', 'Số bị chia: 10 × 9 = 90.',
                'Số bị chia là số lớn nhất trong phép chia này. Muốn tìm số bị chia, lấy thương nhân với số chia.'),
        ],
        remember: [
            'Tìm thừa số: lấy tích chia cho thừa số kia.',
            'Tìm số bị chia: lấy thương nhân với số chia.',
            'Tìm số chia: lấy số bị chia chia cho thương.',
            'Tìm xong luôn thử lại.',
        ],
    }),
} satisfies LessonBook;
