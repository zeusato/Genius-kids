// Lớp 5 — Đơn vị đo diện tích, thể tích (g5_measurements) và số đo thời gian (g5_time_ops).
import { form, know, lesson, mistake, note, rule, step, table, text, widget, worked } from '../../build';
import type { LessonBook } from '../../types';

export default {
    'g5.area_units_big': lesson('g5.area_units_big', {
        v: 1,
        goal: 'biết các đơn vị đo diện tích km², ha, m², dm², cm², mm² và đổi được giữa chúng.',
        hook: { md: 'Một khu rừng rộng 3 km². Đổi ra héc-ta được bao nhiêu?', answer: 'Vì 1 km² = 100 ha nên 3 km² = 300 ha.' },
        needs: ['g4.area_units'],
        know: [
            know('Hai đơn vị liền nhau gấp 100 lần',
                rule('Hai đơn vị đo diện tích liền nhau gấp (hoặc kém) nhau 100 lần.'),
                widget({ w: 'unit-ladder', kind: 'area', value: 3, from: 'km²', to: 'ha' }),
                note('Héc-ta (ha) bằng héc-tô-mét vuông: 1 ha = 10 000 m²; 1 km² = 100 ha.'),
            ),
            know('Số đo có hai tên đơn vị',
                text('Mỗi đơn vị đo diện tích ứng với **hai chữ số**. Vì vậy 20 ha = 0,2 km² và 91 m² = 0,000091 km².'),
            ),
        ],
        forms: [
            form({
                id: 'doi', title: 'Dạng 1: Đổi đơn vị đo diện tích', level: 1,
                cue: 'Đề cho số đo một tên đơn vị và hỏi bằng bao nhiêu đơn vị khác.',
                steps: ['Đếm số bậc giữa hai đơn vị trên thang.', 'Mỗi bậc gấp 100 lần.', 'Đơn vị lớn ra đơn vị bé thì nhân, ngược lại thì chia.'],
                example: worked({
                    layout: 'calc', problem: '700 ha = ? km²',
                    steps: [step('Vì 1 km² = 100 ha, đổi từ ha ra km² thì chia cho 100:', '700 : 100 = 7')],
                    answer: 'Vậy 700 ha = 7 km².',
                }),
            }),
            form({
                id: 'hai-ten', title: 'Dạng 2: Số đo hai tên đơn vị thành số thập phân', level: 2,
                cue: 'Đề cho số đo như 3 km² 20 ha và hỏi bằng bao nhiêu km².',
                steps: ['Đổi phần đơn vị bé thành phân số thập phân của đơn vị lớn (mỗi bậc hai chữ số).', 'Viết thành số thập phân.', 'Ghép với phần đơn vị lớn.'],
                example: worked({
                    layout: 'calc', problem: '3 km² 20 ha = ? km²',
                    steps: [step('20 ha là 20/100 km², tức là 0,2 km².'), step('Ghép với 3 km².')],
                    answer: 'Vậy 3 km² 20 ha = 3,2 km².',
                }),
            }),
        ],
        mistakes: [
            mistake('Bạn Bi đổi: 7 dm² = 70 cm².', '7 dm² = 700 cm².', 'Đơn vị đo diện tích liền nhau gấp 100 lần, không phải 10 lần như đơn vị đo độ dài.'),
        ],
        remember: [
            'Hai đơn vị đo diện tích liền nhau gấp 100 lần.',
            '1 km² = 100 ha; 1 ha = 10 000 m².',
            'Mỗi đơn vị ứng với hai chữ số khi viết số thập phân.',
        ],
    }),
    'g5.volume_units': lesson('g5.volume_units', {
        v: 1,
        goal: 'biết xăng-ti-mét khối, đề-xi-mét khối, mét khối và đổi được giữa chúng.',
        hook: { md: 'Một khối gỗ hình lập phương cạnh 1 dm. Khối gỗ có thể tích bao nhiêu xăng-ti-mét khối?', answer: 'Cạnh 1 dm là 10 cm, nên thể tích là 10 × 10 × 10 = 1000 (cm³).' },
        know: [
            know('Hai đơn vị liền nhau gấp 1000 lần',
                rule('Hai đơn vị đo thể tích liền nhau gấp (hoặc kém) nhau 1000 lần.'),
                widget({ w: 'unit-ladder', kind: 'volume', value: 4, from: 'm³', to: 'cm³' }),
                note('1 dm³ = 1 l; 1 cm³ = 1 ml.'),
            ),
            know('Số đo có hai tên đơn vị',
                text('Mỗi đơn vị đo thể tích ứng với **ba chữ số**. Ví dụ: 80 cm³ là 80/1000 dm³, viết là 0,08 dm³.'),
                table(['Số đo', 'Viết bằng đơn vị lớn'], [['1 dm³ 80 cm³', '1,08 dm³'], ['4 l 83 ml', '4,083 l'], ['2 m³ 500 dm³', '2,5 m³']]),
            ),
        ],
        forms: [
            form({
                id: 'doi', title: 'Dạng 1: Đổi đơn vị đo thể tích', level: 1,
                cue: 'Đề cho số đo một tên đơn vị và hỏi bằng bao nhiêu đơn vị khác.',
                steps: ['Đếm số bậc giữa hai đơn vị.', 'Mỗi bậc gấp 1000 lần.', 'Đơn vị lớn ra đơn vị bé thì nhân, ngược lại thì chia.'],
                example: worked({
                    layout: 'calc', problem: '8 m³ = ? dm³',
                    steps: [step('Vì 1 m³ = 1000 dm³:', '1000 × 8 = 8000')],
                    answer: 'Vậy 8 m³ = 8000 dm³.',
                }),
            }),
            form({
                id: 'hai-ten', title: 'Dạng 2: Số đo hai tên đơn vị thành số thập phân', level: 2,
                cue: 'Đề cho số đo như 1 dm³ 80 cm³ hoặc 4 l 83 ml và hỏi bằng bao nhiêu đơn vị lớn.',
                steps: ['Phần đơn vị bé cần ba chữ số sau dấu phẩy.', 'Thiếu chữ số thì viết thêm 0 ngay sau dấu phẩy.', 'Ghép với phần đơn vị lớn.'],
                example: worked({
                    layout: 'calc', problem: '1 dm³ 80 cm³ = ? dm³',
                    steps: [step('80 cm³ là 80/1000 dm³, tức là 0,08 dm³.'), step('Ghép với 1 dm³.')],
                    answer: 'Vậy 1 dm³ 80 cm³ = 1,08 dm³.',
                }),
            }),
        ],
        mistakes: [
            mistake('Bạn Bi đổi: 1 m³ = 100 dm³.', '1 m³ = 1000 dm³.', 'Đơn vị đo thể tích liền nhau gấp 1000 lần.'),
            mistake('Bạn Bi viết: 1 dm³ 80 cm³ = 1,8 dm³.', '1 dm³ 80 cm³ = 1,08 dm³.', '80 cm³ cần ba chữ số sau dấu phẩy: 0,080 dm³, tức là 0,08 dm³.'),
        ],
        remember: [
            'Hai đơn vị đo thể tích liền nhau gấp 1000 lần.',
            '1 dm³ = 1 l; 1 cm³ = 1 ml.',
            'Mỗi đơn vị ứng với ba chữ số khi viết số thập phân.',
        ],
    }),
    'g5.time_addsub': lesson('g5.time_addsub', {
        v: 1,
        goal: 'cộng, trừ được số đo thời gian và tính được giờ đến nơi.',
        hook: { md: 'Tàu khởi hành lúc 7 giờ 55 phút và đi hết 1 giờ 5 phút. Tàu đến nơi lúc mấy giờ?', answer: '7 giờ 55 phút + 1 giờ 5 phút là 8 giờ 60 phút, tức là 9 giờ.' },
        needs: ['g3.duration'],
        know: [
            know('Cộng số đo thời gian',
                table(['Đơn vị', 'Bằng'], [['1 giờ', '60 phút'], ['1 phút', '60 giây'], ['1 ngày', '24 giờ'], ['1 năm', '12 tháng']]),
                rule('Cộng (trừ) các số đo cùng đơn vị với nhau. Số phút (hoặc giây) từ 60 trở lên thì đổi ra giờ (hoặc phút).'),
            ),
            know('Trừ khi không đủ phút',
                text('Nếu số phút ở số bị trừ bé hơn số phút ở số trừ, em đổi 1 giờ thành 60 phút rồi mới trừ.'),
                text('Ví dụ: 3 giờ 15 phút − 1 giờ 40 phút. Đổi 3 giờ 15 phút thành 2 giờ 75 phút, rồi trừ được 1 giờ 35 phút.'),
            ),
        ],
        forms: [
            form({
                id: 'cong', title: 'Dạng 1: Cộng, trừ số đo thời gian', level: 1,
                cue: 'Phép cộng hoặc trừ hai số đo thời gian.',
                steps: ['Cộng (trừ) giờ với giờ, phút với phút.', 'Phút từ 60 trở lên: đổi 60 phút thành 1 giờ.', 'Trừ không đủ phút: đổi 1 giờ thành 60 phút.'],
                example: worked({
                    layout: 'calc', problem: 'Tính: 4 giờ 55 phút + 1 giờ 15 phút',
                    steps: [step('Cộng giờ với giờ, phút với phút: được 5 giờ 70 phút.'), step('70 phút là 1 giờ 10 phút, nên được 6 giờ 10 phút.')],
                    answer: 'Vậy 4 giờ 55 phút + 1 giờ 15 phút = 6 giờ 10 phút.',
                }),
            }),
            form({
                id: 'den-noi', title: 'Dạng 2: Giờ đến nơi', level: 2,
                cue: 'Đề cho giờ khởi hành và thời gian đi, hỏi giờ đến nơi.',
                steps: ['Giờ đến nơi = giờ khởi hành + thời gian đi.', 'Đổi phút thừa ra giờ nếu cần.'],
                example: worked({
                    layout: 'calc', problem: 'Một chuyến tàu khởi hành lúc 7 giờ và đi hết 2 giờ 50 phút. Hỏi tàu đến nơi lúc mấy giờ?',
                    steps: [step('Giờ đến nơi bằng giờ khởi hành cộng thời gian đi.'), step('7 giờ cộng 2 giờ 50 phút được 9 giờ 50 phút.')],
                    answer: 'Tàu đến nơi lúc 9 giờ 50 phút.',
                }),
            }),
        ],
        mistakes: [
            mistake('Bạn Bi viết: 4 giờ 50 phút + 20 phút = 4 giờ 70 phút.', 'Kết quả là 5 giờ 10 phút.', 'Số phút từ 60 trở lên phải đổi 60 phút thành 1 giờ.'),
        ],
        remember: [
            'Cộng, trừ các số đo cùng đơn vị.',
            'Đủ 60 phút thì đổi thành 1 giờ.',
            'Trừ không đủ phút thì đổi 1 giờ thành 60 phút.',
        ],
    }),
    'g5.time_muldiv': lesson('g5.time_muldiv', {
        v: 1,
        goal: 'nhân, chia được số đo thời gian với một số.',
        hook: { md: 'Mỗi tiết học kéo dài 35 phút. 4 tiết học kéo dài bao lâu?', answer: '35 phút × 4 = 140 phút, tức là 2 giờ 20 phút.' },
        needs: ['g5.time_addsub'],
        know: [
            know('Nhân số đo thời gian',
                rule('Nhân từng đơn vị với số đó. Số phút (hoặc giây) từ 60 trở lên thì đổi ra giờ (hoặc phút).'),
                text('Ví dụ: 1 phút 13 giây × 4 = 4 phút 52 giây.'),
            ),
            know('Chia số đo thời gian',
                rule('Chia từng đơn vị từ lớn đến bé. Còn dư thì đổi ra đơn vị bé hơn, cộng vào rồi chia tiếp.'),
            ),
        ],
        forms: [
            form({
                id: 'nhan', title: 'Dạng 1: Nhân số đo thời gian', level: 2,
                cue: 'Phép nhân số đo thời gian với một số tự nhiên.',
                steps: ['Nhân giờ, phút (hoặc phút, giây) với số đó.', 'Đổi phút (giây) thừa ra giờ (phút).'],
                example: worked({
                    layout: 'calc', problem: 'Tính: 2 giờ 25 phút × 3',
                    steps: [step('Nhân từng đơn vị: được 6 giờ 75 phút.'), step('75 phút là 1 giờ 15 phút, nên được 7 giờ 15 phút.')],
                    answer: 'Vậy 2 giờ 25 phút × 3 = 7 giờ 15 phút.',
                }),
            }),
            form({
                id: 'chia', title: 'Dạng 2: Chia số đo thời gian', level: 2,
                cue: 'Phép chia số đo thời gian cho một số tự nhiên.',
                steps: ['Chia số giờ trước.', 'Giờ còn dư thì đổi ra phút, cộng với số phút.', 'Chia tiếp số phút.'],
                example: worked({
                    layout: 'calc', problem: 'Tính: 17 giờ 55 phút : 5',
                    steps: [step('17 giờ chia 5 được 3 giờ, còn dư 2 giờ.'), step('Đổi 2 giờ thành 120 phút, thêm 55 phút được 175 phút.'), step('175 phút chia 5 được 35 phút.')],
                    answer: 'Vậy 17 giờ 55 phút : 5 = 3 giờ 35 phút.',
                }),
            }),
        ],
        mistakes: [
            mistake('Chia 17 giờ 55 phút cho 5, bạn Bi bỏ phần dư 2 giờ và được 3 giờ 11 phút.', 'Kết quả là 3 giờ 35 phút.', 'Phần dư 2 giờ phải đổi thành 120 phút, cộng vào 55 phút rồi mới chia tiếp.'),
        ],
        remember: [
            'Nhân: nhân từng đơn vị, rồi đổi phần thừa.',
            'Chia: chia từ đơn vị lớn; còn dư thì đổi ra đơn vị bé rồi chia tiếp.',
        ],
    }),
} satisfies LessonBook;
