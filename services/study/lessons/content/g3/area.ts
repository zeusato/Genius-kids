// Lớp 3 — Chu vi & diện tích (g3_area).
import { explore, form, know, lesson, mistake, picCap, rule, step, text, vis, widget, worked } from '../../build';
import type { LessonBook } from '../../types';

export default {
    'g3.perimeter': lesson('g3.perimeter', {
        v: 1,
        goal: 'tính được chu vi hình tam giác, hình tứ giác, hình chữ nhật, hình vuông.',
        hook: { md: 'Bố muốn rào quanh mảnh vườn hình chữ nhật dài 8 m, rộng 5 m. Cần hàng rào dài bao nhiêu mét?', answer: 'Hàng rào dài: (8 + 5) × 2 = 26 (m).' },
        know: [
            know('Chu vi là gì',
                text('**Chu vi** của một hình là tổng độ dài các cạnh của hình đó.'),
                rule('Chu vi hình tam giác (hình tứ giác) bằng tổng độ dài các cạnh.'),
                picCap('Chu vi: 4 + 7 + 5 = 16 (cm)', 'triangleSVG', { sides: [4, 7, 5] }),
            ),
            know('Chu vi hình chữ nhật, hình vuông',
                rule('Muốn tính chu vi hình chữ nhật, ta lấy chiều dài cộng chiều rộng (cùng đơn vị đo) rồi nhân với 2.', 'Chu vi = ({dài} + {rộng}) × 2'),
                rule('Muốn tính chu vi hình vuông, ta lấy độ dài một cạnh nhân với 4.', 'Chu vi = {cạnh} × 4'),
                widget(explore({
                    title: 'Đổi chiều dài, chiều rộng',
                    controls: {
                        w: { label: 'Chiều dài', min: 2, max: 12, init: 6, unit: 'cm' },
                        h: { label: 'Chiều rộng', min: 1, max: 8, init: 4, unit: 'cm' },
                    },
                    valid: v => (v.w >= v.h ? null : 'Chiều dài không được bé hơn chiều rộng.'),
                    visual: v => vis('rectSVG', v.w, v.h),
                    caption: v => `Chu vi: (${v.w} + ${v.h}) × 2 = ${2 * (v.w + v.h)} (cm).`,
                })),
            ),
        ],
        forms: [
            form({
                id: 'hcn-hv', title: 'Dạng 1: Chu vi hình chữ nhật, hình vuông', level: 1,
                cue: 'Đề cho chiều dài, chiều rộng của hình chữ nhật hoặc cạnh của hình vuông.',
                steps: ['Kiểm tra các số đo cùng đơn vị.', 'Hình chữ nhật: (dài + rộng) × 2. Hình vuông: cạnh × 4.', 'Viết đáp số kèm đơn vị độ dài.'],
                example: worked({
                    problem: 'Tính chu vi hình chữ nhật có chiều dài 13 cm, chiều rộng 11 cm.',
                    visual: vis('rectSVG', 13, 11),
                    steps: [step('Chu vi hình chữ nhật là:', '(13 + 11) × 2 = 48 (cm)')],
                    answer: 'Đáp số: 48 cm.',
                }),
            }),
            form({
                id: 'tam-giac', title: 'Dạng 2: Chu vi hình tam giác, tứ giác', level: 2,
                cue: 'Đề cho độ dài từng cạnh của hình tam giác hoặc tứ giác.',
                steps: ['Liệt kê độ dài các cạnh.', 'Cộng tất cả độ dài lại.', 'Viết đáp số kèm đơn vị.'],
                example: worked({
                    problem: 'Tính chu vi hình tứ giác có độ dài các cạnh là 6 cm, 11 cm, 10 cm, 10 cm.',
                    visual: vis('quadSidesSVG', 6, 11, 10, 10),
                    steps: [step('Chu vi hình tứ giác là:', '6 + 11 + 10 + 10 = 37 (cm)')],
                    answer: 'Đáp số: 37 cm.',
                }),
            }),
            form({
                id: 'nguoc', title: 'Dạng 3: Biết chu vi tìm cạnh; bài toán thực tế', level: 3,
                cue: 'Đề cho chu vi và hỏi độ dài cạnh, hoặc hỏi độ dài hàng rào, đường viền quanh một hình.',
                steps: ['Xác định đó là hình gì.', 'Hình vuông: cạnh = chu vi : 4.', 'Bài thực tế "quanh", "xung quanh" là tính chu vi.'],
                example: worked({
                    problem: 'Một hình vuông có chu vi 36 cm. Tính độ dài cạnh hình vuông.',
                    steps: [step('Chu vi bằng cạnh nhân 4, nên cạnh bằng chu vi chia 4. Độ dài cạnh hình vuông là:', '36 : 4 = 9 (cm)')],
                    answer: 'Đáp số: 9 cm.',
                }),
            }),
        ],
        mistakes: [
            mistake('Hình chữ nhật dài 13 cm, rộng 11 cm. Bạn Bi tính chu vi: 13 + 11 = 24 (cm).', '(13 + 11) × 2 = 48 (cm).',
                'Hình chữ nhật có hai chiều dài và hai chiều rộng. 13 + 11 mới là nửa chu vi.'),
            mistake('Dài 2 m, rộng 50 cm, bạn Bi tính: (2 + 50) × 2 = 104.', 'Đổi 2 m = 200 cm, rồi tính (200 + 50) × 2 = 500 (cm).',
                'Phải đổi các số đo về cùng đơn vị trước khi cộng.'),
        ],
        remember: [
            'Chu vi là tổng độ dài các cạnh.',
            'Hình chữ nhật: chu vi = (dài + rộng) × 2.',
            'Hình vuông: chu vi = cạnh × 4; cạnh = chu vi : 4.',
            'Các số đo phải cùng đơn vị.',
        ],
    }),
    'g3.area_cm2': lesson('g3.area_cm2', {
        v: 1,
        goal: 'hiểu diện tích, đơn vị xăng-ti-mét vuông và tính được diện tích hình chữ nhật, hình vuông.',
        hook: { md: 'Tấm thiệp hình chữ nhật dài 8 cm, rộng 5 cm. Phủ kín tấm thiệp cần bao nhiêu ô vuông cạnh 1 cm?', answer: 'Cần 8 × 5 = 40 (ô vuông), tức là diện tích tấm thiệp là 40 cm².' },
        needs: ['g3.perimeter'],
        know: [
            know('Diện tích và xăng-ti-mét vuông',
                text('**Diện tích** cho biết một hình rộng bao nhiêu trên mặt phẳng. Hình vuông cạnh 1 cm có diện tích **1 xăng-ti-mét vuông**, viết là **1 cm²**.'),
                widget(explore({
                    title: 'Đổi chiều dài, chiều rộng (mỗi ô là 1 cm²)',
                    controls: {
                        c: { label: 'Chiều dài', min: 1, max: 10, init: 6, unit: 'cm' },
                        r: { label: 'Chiều rộng', min: 1, max: 8, init: 4, unit: 'cm' },
                    },
                    valid: v => (v.c >= v.r ? null : 'Chiều dài không được bé hơn chiều rộng.'),
                    visual: v => vis('gridAreaSVG', v.c, v.r, 'all'),
                    caption: v => `Có ${v.r} hàng, mỗi hàng ${v.c} ô: ${v.c} × ${v.r} = ${v.c * v.r} (ô). Diện tích là ${v.c * v.r} cm². Chu vi là (${v.c} + ${v.r}) × 2 = ${2 * (v.c + v.r)} (cm).`,
                })),
            ),
            know('Công thức tính diện tích',
                rule('Muốn tính diện tích hình chữ nhật, ta lấy chiều dài nhân với chiều rộng (cùng đơn vị đo).', 'Diện tích = {dài} × {rộng}'),
                rule('Muốn tính diện tích hình vuông, ta lấy độ dài một cạnh nhân với chính nó.', 'Diện tích = {cạnh} × {cạnh}'),
            ),
        ],
        forms: [
            form({
                id: 'dem-o', title: 'Dạng 1: Đếm ô vuông', level: 1,
                cue: 'Đề cho hình vẽ trên lưới ô vuông 1 cm².',
                steps: ['Đếm số ô vuông được tô màu.', 'Mỗi ô là 1 cm², nên diện tích bằng số ô.'],
                example: worked({
                    layout: 'calc', problem: 'Mỗi ô vuông có diện tích 1 cm². Hình tô màu có diện tích bao nhiêu xăng-ti-mét vuông?',
                    visual: vis('gridAreaSVG', 4, 3, [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [0, 2]]),
                    steps: [step('Đếm số ô vuông được tô màu: 6 ô.'), step('Mỗi ô là 1 cm² nên diện tích là 6 cm².')],
                    answer: 'Diện tích hình tô màu là 6 cm².',
                }),
            }),
            form({
                id: 'cong-thuc', title: 'Dạng 2: Dùng công thức', level: 2,
                cue: 'Đề cho chiều dài, chiều rộng (hoặc cạnh hình vuông) và hỏi diện tích.',
                steps: ['Kiểm tra cùng đơn vị đo.', 'Hình chữ nhật: dài × rộng. Hình vuông: cạnh × cạnh.', 'Đơn vị là cm².'],
                example: worked({
                    problem: 'Tính diện tích hình chữ nhật có chiều dài 15 cm, chiều rộng 8 cm.',
                    visual: vis('rectSVG', 15, 8),
                    steps: [step('Diện tích hình chữ nhật là:', '15 × 8 = 120 (cm²)')],
                    answer: 'Đáp số: 120 cm².',
                }),
            }),
            form({
                id: 'hai-buoc', title: 'Dạng 3: Tìm cạnh còn thiếu rồi tính diện tích', level: 3,
                cue: 'Đề chưa cho đủ chiều dài, chiều rộng; phải tìm trước một cạnh.',
                steps: ['Tìm cạnh còn thiếu (thường bằng phép nhân hoặc chia).', 'Tính diện tích.', 'Viết đáp số kèm cm².'],
                example: worked({
                    problem: 'Một hình chữ nhật có chiều rộng 5 cm, chiều dài gấp 3 lần chiều rộng. Tính diện tích hình chữ nhật đó.',
                    steps: [step('Chiều dài hình chữ nhật là:', '5 × 3 = 15 (cm)'), step('Diện tích hình chữ nhật là:', '15 × 5 = 75 (cm²)')],
                    answer: 'Đáp số: 75 cm².',
                }),
            }),
        ],
        mistakes: [
            mistake('Hình chữ nhật dài 15 cm, rộng 8 cm. Bạn Bi tính diện tích: (15 + 8) × 2 = 46 (cm²).', 'Diện tích: 15 × 8 = 120 (cm²).',
                'Bi tính chu vi. Diện tích là chiều dài nhân chiều rộng.'),
            mistake('Bạn Bi viết đáp số: diện tích là 120 cm.', 'Diện tích là 120 cm².', 'Đơn vị của diện tích là xăng-ti-mét vuông (cm²); cm là đơn vị đo độ dài.'),
        ],
        remember: [
            'Diện tích đo bằng số ô vuông 1 cm² phủ kín hình.',
            'Hình chữ nhật: diện tích = dài × rộng.',
            'Hình vuông: diện tích = cạnh × cạnh.',
            'Diện tích dùng cm², chu vi dùng cm.',
        ],
    }),
} satisfies LessonBook;
