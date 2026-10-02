// Lớp 3 — Đo lường (g3_measurements).
import { explore, form, know, lesson, mistake, note, pic, step, table, text, vis, widget, worked } from '../../build';
import type { LessonBook } from '../../types';

export default {
    'g3.small_units': lesson('g3.small_units', {
        v: 1,
        goal: 'đổi được các đơn vị mi-li-mét, gam, mi-li-lít và giải bài toán có đơn vị đo.',
        hook: { md: 'Chai nước ghi 500 ml. Hai chai như thế được bao nhiêu mi-li-lít? Có bằng 1 lít không?', answer: 'Hai chai: 500 × 2 = 1000 (ml). Vì 1 l = 1000 ml nên đúng bằng 1 lít.' },
        know: [
            know('Các đơn vị nhỏ',
                table(['Đơn vị', 'Bằng'], [['1 cm', '10 mm'], ['1 m', '1000 mm'], ['1 kg', '1000 g'], ['1 l', '1000 ml']]),
                widget({ w: 'unit-ladder', kind: 'length', value: 3, from: 'm', to: 'mm' }),
            ),
            know('Số đo có hai tên đơn vị',
                text('Muốn đổi 3 l 158 ml ra mi-li-lít, em đổi 3 l ra mi-li-lít rồi cộng thêm 158 ml.'),
                text('3 l = 3000 ml, nên 3 l 158 ml = 3158 ml.'),
                widget({ w: 'unit-ladder', kind: 'capacity', value: 3, from: 'l', to: 'ml' }),
            ),
        ],
        forms: [
            form({
                id: 'doi', title: 'Dạng 1: Đổi đơn vị đo', level: 1,
                cue: 'Đề cho số đo một tên đơn vị và hỏi bằng bao nhiêu đơn vị khác.',
                steps: ['Nhớ: 1 m = 1000 mm, 1 kg = 1000 g, 1 l = 1000 ml.', 'Đổi từ đơn vị lớn ra đơn vị bé thì nhân.', 'Đổi từ đơn vị bé ra đơn vị lớn thì chia.'],
                example: worked({
                    layout: 'calc', problem: '9 m = ? mm',
                    steps: [step('Vì 1 m = 1000 mm, nên 9 m gấp 9 lần 1000 mm:', '1000 × 9 = 9000')],
                    answer: 'Vậy 9 m = 9000 mm.',
                }),
            }),
            form({
                id: 'hai-ten', title: 'Dạng 2: Số đo có hai tên đơn vị', level: 2,
                cue: 'Đề cho số đo như 3 l 158 ml hoặc 4 m 794 mm và hỏi bằng bao nhiêu đơn vị bé.',
                steps: ['Đổi phần đơn vị lớn ra đơn vị bé.', 'Cộng với phần đơn vị bé.'],
                example: worked({
                    layout: 'calc', problem: '3 l 158 ml = ? ml',
                    steps: [step('Đổi 3 l ra mi-li-lít:', '1000 × 3 = 3000'), step('Cộng thêm 158 ml:', '3000 + 158 = 3158')],
                    answer: 'Vậy 3 l 158 ml = 3158 ml.',
                }),
            }),
            form({
                id: 'loi-van', title: 'Dạng 3: Bài toán có đơn vị đo', level: 3,
                cue: 'Bài toán có số đo mi-li-mét, gam, mi-li-lít (có thể khác tên đơn vị).',
                steps: ['Đổi các số đo về cùng một đơn vị.', 'Làm phép tính.', 'Viết đáp số kèm đơn vị.'],
                example: worked({
                    problem: 'Bình có 1 l nước. Nam rót ra 400 ml. Hỏi bình còn lại bao nhiêu mi-li-lít nước?',
                    steps: [step('Đổi 1 l = 1000 ml. Số nước còn lại trong bình là:', '1000 − 400 = 600 (ml)')],
                    answer: 'Đáp số: 600 ml.',
                }),
            }),
        ],
        mistakes: [
            mistake('Bạn Bi đổi: 3 m = 300 mm.', '3 m = 3000 mm.', 'Vì 1 m = 1000 mm. Bi nhầm với cách đổi mét ra xăng-ti-mét (1 m = 100 cm).'),
            mistake('Bình có 1 l nước, rót ra 400 ml. Bạn Bi tính 1 − 400.', 'Đổi 1 l = 1000 ml rồi tính: 1000 − 400 = 600 (ml).', 'Hai số đo phải cùng đơn vị mới trừ được.'),
        ],
        remember: [
            '1 cm = 10 mm; 1 m = 1000 mm.',
            '1 kg = 1000 g; 1 l = 1000 ml.',
            'Đổi về cùng đơn vị trước khi tính.',
        ],
    }),
    'g3.temperature': lesson('g3.temperature', {
        v: 1,
        goal: 'đọc được nhiệt độ trên nhiệt kế và so sánh nhiệt độ.',
        hook: { md: 'Hôm nay Hà Nội 38°C, Đà Lạt 28°C. Nơi nào nóng hơn và nóng hơn bao nhiêu độ?', answer: 'Hà Nội nóng hơn: 38 − 28 = 10 (°C).' },
        know: [
            know('Nhiệt kế và độ C',
                text('Nhiệt độ đo bằng **nhiệt kế**, đơn vị là **độ C**, viết là °C.'),
                pic('thermometerSVG', 20, 50),
                text('Đỉnh cột màu đỏ ngang vạch nào thì nhiệt độ là bấy nhiêu.'),
                note('Nhiệt độ cơ thể người khoẻ mạnh khoảng 37°C. Nước đá tan ở 0°C.'),
            ),
            know('Kéo để quan sát',
                widget(explore({
                    title: 'Đổi nhiệt độ',
                    controls: { t: { label: 'Nhiệt độ', min: 0, max: 50, step: 5, init: 25, unit: '°C' } },
                    visual: v => vis('thermometerSVG', v.t, 50),
                    caption: v => `Nhiệt kế chỉ ${v.t}°C.`,
                })),
            ),
        ],
        forms: [
            form({
                id: 'doc', title: 'Dạng 1: Đọc nhiệt kế', level: 1,
                cue: 'Đề cho hình nhiệt kế và hỏi chỉ bao nhiêu độ C.',
                steps: ['Tìm đỉnh cột màu đỏ.', 'Xem đỉnh cột ngang vạch số nào.', 'Đọc số đó kèm đơn vị °C.'],
                example: worked({
                    layout: 'calc', problem: 'Nhiệt kế chỉ bao nhiêu độ C?',
                    visual: vis('thermometerSVG', 30, 50),
                    steps: [step('Đỉnh cột đỏ ngang vạch 30.')],
                    answer: 'Nhiệt kế chỉ 30°C.',
                }),
            }),
            form({
                id: 'so-sanh', title: 'Dạng 2: So sánh nhiệt độ', level: 1,
                cue: 'Đề cho nhiệt độ hai nơi (hai lúc) và hỏi nơi nào nóng hơn, hơn bao nhiêu.',
                steps: ['Nhiệt độ cao hơn thì nóng hơn.', 'Lấy nhiệt độ cao trừ nhiệt độ thấp.', 'Viết kết quả kèm °C.'],
                example: worked({
                    layout: 'calc', problem: 'Nhiệt độ ở Đà Lạt là 28°C, ở Hà Nội là 38°C. Nơi nào nóng hơn và nóng hơn bao nhiêu độ C?',
                    steps: [step('38°C cao hơn 28°C nên Hà Nội nóng hơn.'), step('Hà Nội nóng hơn số độ là:', '38 − 28 = 10 (°C)')],
                    answer: 'Hà Nội nóng hơn Đà Lạt 10°C.',
                }),
            }),
        ],
        mistakes: [
            mistake('Cột đỏ ở giữa vạch 20 và vạch 30, bạn Bi đọc là 20°C.', 'Đếm các vạch nhỏ để đọc chính xác, ví dụ 25°C.', 'Giữa hai vạch số còn có vạch nhỏ. Phải xem đỉnh cột đỏ ngang vạch nào.'),
        ],
        remember: [
            'Nhiệt độ có đơn vị là độ C (°C).',
            'Đọc số ở vạch ngang với đỉnh cột đỏ.',
            'Nhiệt độ cao hơn thì nóng hơn.',
        ],
    }),
} satisfies LessonBook;
