// Lớp 3 — Các số đến 100 000 (g3_numbers).
import { explore, form, know, lesson, mistake, note, rule, step, table, text, vis, widget, worked } from '../../build';
import type { LessonBook } from '../../types';

export default {
    'g3.numbers10000': lesson('g3.numbers10000', {
        v: 1,
        goal: 'đọc, viết và phân tích được các số có bốn chữ số.',
        hook: { md: 'Một số gồm 2 nghìn, 4 trăm, 5 chục và 7 đơn vị. Em viết số đó thế nào?', answer: 'Số đó là 2457, đọc là "hai nghìn bốn trăm năm mươi bảy".' },
        know: [
            know('Hàng nghìn, trăm, chục, đơn vị',
                text('Số 2457 gồm 2 nghìn, 4 trăm, 5 chục và 7 đơn vị.'),
                widget({ w: 'place-value', int: 4, init: 2457 }),
            ),
            know('Đọc số có chữ số 0',
                table(['Số', 'Cách đọc'], [
                    ['3405', 'ba nghìn bốn trăm linh năm'],
                    ['3045', 'ba nghìn không trăm bốn mươi lăm'],
                    ['3450', 'ba nghìn bốn trăm năm mươi'],
                    ['3005', 'ba nghìn không trăm linh năm'],
                ]),
                note('Hàng chục là 0 mà hàng đơn vị khác 0 thì đọc "linh"; hàng trăm là 0 mà hàng chục hoặc hàng đơn vị khác 0 thì đọc "không trăm".'),
            ),
        ],
        forms: [
            form({
                id: 'doc-viet', title: 'Dạng 1: Đọc số, viết số', level: 1,
                cue: 'Đề cho số và hỏi cách đọc, hoặc cho cách đọc và yêu cầu viết số.',
                steps: ['Đọc từ trái sang phải: nghìn, trăm, chục, đơn vị.', 'Khi viết, hàng nào không có thì viết chữ số 0.'],
                example: worked({
                    layout: 'calc', problem: 'Viết số: một nghìn hai trăm năm mươi hai',
                    steps: [step('"Một nghìn": chữ số hàng nghìn là 1.'), step('"Hai trăm": chữ số hàng trăm là 2.'), step('"Năm mươi hai": hàng chục là 5, hàng đơn vị là 2.')],
                    answer: 'Số cần viết là 1252.',
                }),
            }),
            form({
                id: 'hang', title: 'Dạng 2: Hàng của chữ số, viết thành tổng', level: 2,
                cue: 'Đề hỏi chữ số thuộc hàng nào, hoặc yêu cầu viết số thành tổng nghìn, trăm, chục, đơn vị.',
                steps: ['Đếm hàng từ phải sang trái: đơn vị, chục, trăm, nghìn.', 'Viết mỗi chữ số thành giá trị theo hàng của nó.', 'Nối các giá trị bằng dấu cộng.'],
                example: worked({
                    layout: 'calc', problem: 'Viết số 1561 thành tổng các nghìn, trăm, chục, đơn vị.',
                    steps: [step('1561 gồm 1 nghìn, 5 trăm, 6 chục và 1 đơn vị.'), step('Viết thành tổng:', '1561 = 1000 + 500 + 60 + 1')],
                    answer: 'Vậy 1561 = 1000 + 500 + 60 + 1.',
                }),
            }),
        ],
        mistakes: [
            mistake('Viết số "ba nghìn không trăm linh năm", bạn Bi viết 305.', 'Số đó là 3005.',
                'Số có hàng nghìn phải có bốn chữ số. Hàng trăm và hàng chục là 0 thì vẫn phải viết chữ số 0.'),
        ],
        remember: [
            'Số có bốn chữ số gồm các hàng: nghìn, trăm, chục, đơn vị.',
            'Hàng nào không có thì viết chữ số 0.',
            'Chục là 0 (đơn vị khác 0) đọc "linh"; trăm là 0 (sau nó còn chữ số khác 0) đọc "không trăm".',
        ],
    }),
    'g3.numbers100000': lesson('g3.numbers100000', {
        v: 1,
        goal: 'đọc, viết và phân tích được các số có năm chữ số.',
        hook: { md: 'Sân vận động có 45 230 chỗ ngồi. Em đọc số này thế nào?', answer: 'Đọc là "bốn mươi lăm nghìn hai trăm ba mươi".' },
        needs: ['g3.numbers10000'],
        know: [
            know('Hàng chục nghìn',
                text('Số có năm chữ số có thêm hàng **chục nghìn**. Số 72 443 gồm 7 chục nghìn, 2 nghìn, 4 trăm, 4 chục và 3 đơn vị.'),
                note('Viết số có năm chữ số, em để một khoảng trống nhỏ giữa phần nghìn và ba chữ số cuối: 72 443.'),
                widget({ w: 'place-value', int: 5, init: 72443 }),
            ),
            know('Cách đọc',
                text('Đọc phần nghìn trước, rồi đọc ba chữ số cuối như một số có ba chữ số.'),
                table(['Số', 'Cách đọc'], [
                    ['72 443', 'bảy mươi hai nghìn bốn trăm bốn mươi ba'],
                    ['16 880', 'mười sáu nghìn tám trăm tám mươi'],
                    ['50 005', 'năm mươi nghìn không trăm linh năm'],
                ]),
            ),
        ],
        forms: [
            form({
                id: 'doc-viet', title: 'Dạng 1: Đọc số, viết số', level: 1,
                cue: 'Đề cho cách đọc của số có năm chữ số và yêu cầu viết số (hoặc ngược lại).',
                steps: ['Viết phần nghìn trước.', 'Viết ba chữ số cuối; hàng nào không có thì viết 0.', 'Kiểm tra số có đủ năm chữ số.'],
                example: worked({
                    layout: 'calc', problem: 'Viết số: mười sáu nghìn tám trăm tám mươi',
                    steps: [step('"Mười sáu nghìn": viết 16.'), step('"Tám trăm tám mươi": viết 880.')],
                    answer: 'Số cần viết là 16 880.',
                }),
            }),
            form({
                id: 'tong', title: 'Dạng 2: Hàng của chữ số, viết số thành tổng', level: 2,
                cue: 'Đề hỏi chữ số thuộc hàng nào, hoặc yêu cầu viết số thành tổng các chục nghìn, nghìn, trăm, chục, đơn vị.',
                steps: ['Đếm hàng từ phải sang trái: đơn vị, chục, trăm, nghìn, chục nghìn.', 'Viết giá trị của từng chữ số.', 'Nối bằng dấu cộng.'],
                example: worked({
                    layout: 'calc', problem: 'Viết số 65 724 thành tổng.',
                    steps: [step('65 724 gồm 6 chục nghìn, 5 nghìn, 7 trăm, 2 chục và 4 đơn vị.'), step('Viết thành tổng:', '65 724 = 60 000 + 5000 + 700 + 20 + 4')],
                    answer: 'Vậy 65 724 = 60 000 + 5000 + 700 + 20 + 4.',
                }),
            }),
        ],
        mistakes: [
            mistake('Bạn Bi viết "mười sáu nghìn tám trăm tám mươi" thành 1688.', 'Số đó là 16 880.',
                'Bi thiếu chữ số 0 ở hàng đơn vị. "Tám trăm tám mươi" là 880 nên số phải có năm chữ số.'),
        ],
        remember: [
            'Số có năm chữ số có thêm hàng chục nghìn.',
            'Đọc phần nghìn trước, rồi đọc ba chữ số cuối.',
            'Viết xong, đếm lại xem đủ năm chữ số chưa.',
        ],
    }),
    'g3.compare': lesson('g3.compare', {
        v: 1,
        goal: 'so sánh và sắp xếp được các số trong phạm vi 100 000.',
        hook: { md: 'Cửa hàng A bán được 26 808 quyển vở, cửa hàng B bán được 26 880 quyển vở. Cửa hàng nào bán được nhiều hơn?', answer: 'Hai số giống nhau đến hàng trăm; ở hàng chục 0 < 8 nên 26 808 < 26 880. Cửa hàng B bán được nhiều hơn.' },
        needs: ['g3.numbers100000'],
        know: [
            know('Hai quy tắc so sánh',
                rule('Số nào có nhiều chữ số hơn thì lớn hơn.'),
                rule('Hai số có cùng số chữ số thì so sánh từng cặp chữ số ở cùng một hàng, từ trái sang phải.'),
                widget({ w: 'place-value', int: 5, init: 26808, other: 26880, mode: 'compare' }),
            ),
            know('Sắp xếp các số',
                text('Muốn sắp xếp từ bé đến lớn, em tìm số bé nhất trước, rồi tìm số bé nhất trong các số còn lại, cứ thế đến hết.'),
                text('Sắp xếp từ lớn đến bé thì làm ngược lại: tìm số lớn nhất trước.'),
            ),
        ],
        forms: [
            form({
                id: 'dien-dau', title: 'Dạng 1: Điền dấu >, <, =', level: 1,
                cue: 'Đề cho hai số và ô trống ở giữa để điền dấu.',
                steps: ['Đếm số chữ số của mỗi số.', 'Khác số chữ số: số nhiều chữ số hơn thì lớn hơn.', 'Cùng số chữ số: so từng hàng từ trái sang phải.'],
                example: worked({
                    layout: 'calc', problem: 'Điền dấu >, <, =: 5444 … 45 031',
                    steps: [step('5444 có bốn chữ số, 45 031 có năm chữ số.'), step('Số có nhiều chữ số hơn thì lớn hơn.')],
                    answer: 'Vậy 5444 < 45 031.',
                }),
            }),
            form({
                id: 'sap-xep', title: 'Dạng 2: Sắp xếp, tìm số lớn nhất, bé nhất', level: 2,
                cue: 'Đề cho nhiều số và yêu cầu sắp xếp, hoặc tìm số lớn nhất, bé nhất.',
                steps: ['So sánh hàng cao nhất của các số.', 'Số nào cùng hàng cao nhất thì so tiếp hàng bên phải.', 'Viết các số theo thứ tự đề yêu cầu.'],
                example: worked({
                    layout: 'calc', problem: 'Sắp xếp các số 45 262; 48 495; 44 506; 44 624 theo thứ tự từ lớn đến bé.',
                    steps: [step('Các số đều có 4 chục nghìn. So hàng nghìn: 8 > 5 > 4.'), step('Hai số 44 506 và 44 624 cùng hàng nghìn. So hàng trăm: 6 > 5.')],
                    answer: 'Thứ tự từ lớn đến bé: 48 495; 45 262; 44 624; 44 506.',
                }),
            }),
        ],
        mistakes: [
            mistake('Bạn Bi viết 5444 > 45 031 vì 5 > 4.', '5444 < 45 031.',
                'Bi so chữ số đầu khi hai số có số chữ số khác nhau. Phải đếm số chữ số trước: số có nhiều chữ số hơn thì lớn hơn.'),
        ],
        remember: [
            'Nhiều chữ số hơn thì lớn hơn.',
            'Cùng số chữ số: so từng hàng từ trái sang phải.',
            'Sắp xếp: tìm số bé nhất (hoặc lớn nhất) trước.',
        ],
    }),
    'g3.round': lesson('g3.round', {
        v: 1,
        goal: 'làm tròn được số đến hàng chục, trăm, nghìn, chục nghìn.',
        hook: { md: 'Trường em có 1987 học sinh. Nói "trường em có khoảng 2000 học sinh" có đúng không?', answer: 'Đúng: làm tròn 1987 đến hàng nghìn được 2000.' },
        needs: ['g3.compare'],
        know: [
            know('Làm tròn là tìm số tròn gần nhất',
                rule('Làm tròn đến hàng nào thì xét chữ số ngay bên phải hàng đó: bé hơn 5 thì làm tròn xuống, từ 5 trở lên thì làm tròn lên.'),
                widget(explore({
                    title: 'Làm tròn đến hàng chục',
                    controls: {
                        t: { label: 'Số chục', min: 1, max: 9, init: 4 },
                        u: { label: 'Chữ số hàng đơn vị', min: 0, max: 9, init: 7 },
                    },
                    visual: v => vis('numberLineSVG', 10 * v.t, 10 * v.t + 10, 1, [10 * v.t + v.u]),
                    caption: v => v.u === 0 ? `${10 * v.t} là số tròn chục, làm tròn đến hàng chục vẫn được ${10 * v.t}.` : `${10 * v.t + v.u} nằm giữa ${10 * v.t} và ${10 * v.t + 10}. Chữ số hàng đơn vị là ${v.u}, ${v.u < 5 ? 'bé hơn 5 nên làm tròn xuống' : 'từ 5 trở lên nên làm tròn lên'}: được ${v.u < 5 ? 10 * v.t : 10 * v.t + 10}.`,
                })),
            ),
            know('Một số ví dụ',
                table(['Số', 'Làm tròn đến', 'Chữ số xét', 'Kết quả'], [
                    ['9986', 'hàng chục', '6, từ 5 trở lên', '9990'],
                    ['3250', 'hàng trăm', '5, từ 5 trở lên', '3300'],
                    ['11 415', 'hàng nghìn', '4, bé hơn 5', '11 000'],
                    ['47 820', 'hàng chục nghìn', '7, từ 5 trở lên', '50 000'],
                ]),
            ),
        ],
        forms: [
            form({
                id: 'chuc-tram', title: 'Dạng 1: Làm tròn đến hàng chục, hàng trăm', level: 2,
                cue: 'Đề yêu cầu làm tròn đến hàng chục hoặc hàng trăm.',
                steps: ['Tìm chữ số ở hàng cần làm tròn.', 'Xét chữ số ngay bên phải nó.', 'Làm tròn xuống hoặc lên; các chữ số bên phải thành 0.'],
                example: worked({
                    layout: 'calc', problem: 'Làm tròn số 9986 đến hàng chục.',
                    steps: [step('Chữ số hàng chục của 9986 là 8.'), step('Chữ số ngay bên phải là 6, từ 5 trở lên nên làm tròn lên.'), step('8 chục thành 9 chục, hàng đơn vị thành 0.')],
                    answer: 'Làm tròn 9986 đến hàng chục được 9990.',
                }),
            }),
            form({
                id: 'nghin', title: 'Dạng 2: Làm tròn đến hàng nghìn, chục nghìn', level: 2,
                cue: 'Đề yêu cầu làm tròn đến hàng nghìn hoặc chục nghìn.',
                steps: ['Tìm chữ số hàng cần làm tròn.', 'Xét chữ số ngay bên phải (hàng trăm hoặc hàng nghìn).', 'Làm tròn; các chữ số bên phải thành 0.'],
                example: worked({
                    layout: 'calc', problem: 'Làm tròn số 11 415 đến hàng nghìn.',
                    steps: [step('Chữ số hàng nghìn của 11 415 là 1 (chữ số thứ hai từ trái sang).'), step('Chữ số hàng trăm là 4, bé hơn 5 nên làm tròn xuống.'), step('Giữ nguyên hàng nghìn, các chữ số bên phải thành 0.')],
                    answer: 'Làm tròn 11 415 đến hàng nghìn được 11 000.',
                }),
            }),
        ],
        mistakes: [
            mistake('Làm tròn 9986 đến hàng chục, bạn Bi viết 9980.', 'Kết quả đúng là 9990.',
                'Chữ số bên phải hàng chục là 6, từ 5 trở lên nên phải làm tròn lên chứ không làm tròn xuống.'),
        ],
        remember: [
            'Làm tròn đến hàng nào thì xét chữ số ngay bên phải hàng đó.',
            'Bé hơn 5: làm tròn xuống. Từ 5 trở lên: làm tròn lên.',
            'Các chữ số bên phải hàng làm tròn đều thành 0.',
        ],
    }),
    'g3.roman': lesson('g3.roman', {
        v: 1,
        goal: 'đọc và viết được các số từ 1 đến 20 bằng chữ số La Mã.',
        hook: { md: 'Có mặt đồng hồ ghi các số bằng chữ số La Mã: I, II, III, … Số XII là số mấy?', answer: 'XII là 12: X là 10, II là 2.' },
        know: [
            know('Ba chữ số La Mã I, V, X',
                table(['Chữ số La Mã', 'I', 'V', 'X'], [['Giá trị', '1', '5', '10']]),
                rule('Chữ số nhỏ đứng sau chữ số lớn thì cộng vào; đứng trước thì trừ đi.', 'VI là {5 + 1}, IV là {5 − 1}'),
                note('Một chữ số không lặp lại quá ba lần liền nhau: viết IV, không viết IIII.'),
            ),
            know('Các số từ 1 đến 20',
                table(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'], [['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']]),
                table(['11', '12', '13', '14', '15', '16', '17', '18', '19', '20'], [['XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX']]),
            ),
        ],
        forms: [
            form({
                id: 'doc', title: 'Dạng 1: Đọc số La Mã', level: 1,
                cue: 'Đề cho số La Mã và hỏi giá trị.',
                steps: ['Tách số La Mã thành các phần quen thuộc (X, IX, V, IV, I).', 'Đổi từng phần ra số.', 'Cộng các phần lại.'],
                example: worked({
                    layout: 'calc', problem: 'Số La Mã XIV có giá trị là bao nhiêu?',
                    steps: [step('Tách XIV thành X và IV.'), step('X là 10, IV là 4:', '10 + 4 = 14')],
                    answer: 'XIV là 14.',
                }),
            }),
            form({
                id: 'viet', title: 'Dạng 2: Viết số bằng chữ số La Mã', level: 2,
                cue: 'Đề cho số thường và yêu cầu viết bằng chữ số La Mã.',
                steps: ['Tách số thành chục và phần còn lại.', 'Viết từng phần bằng chữ số La Mã.', 'Ghép lại, kiểm tra không lặp quá ba lần.'],
                example: worked({
                    layout: 'calc', problem: 'Viết số 19 bằng chữ số La Mã.',
                    steps: [step('Tách 19 thành 10 và 9:', '19 = 10 + 9'), step('10 viết là X, 9 viết là IX.')],
                    answer: 'Số 19 viết là XIX.',
                }),
            }),
        ],
        mistakes: [
            mistake('Bạn Bi viết số 4 là IIII.', 'Số 4 viết là IV.', 'Không lặp một chữ số quá ba lần. Vì 4 = 5 − 1 nên viết I đứng trước V.'),
        ],
        remember: [
            'I là 1, V là 5, X là 10.',
            'Nhỏ đứng sau lớn thì cộng, nhỏ đứng trước lớn thì trừ.',
            'Không lặp một chữ số quá ba lần.',
        ],
    }),
} satisfies LessonBook;
