// Lớp 3 — Bảng số liệu, biểu đồ cột (g3_statistics) và khả năng xảy ra (g3_probability).
import { explore, form, know, lesson, mistake, pic, rule, step, table, text, vis, widget, worked } from '../../build';
import type { LessonBook } from '../../types';

const TABLE_MD = '**Số quyển sách thư viện cho mượn**\n\n| Ngày | Thứ Hai | Thứ Ba | Thứ Tư | Thứ Năm |\n| :-: | :-: | :-: | :-: | :-: |\n| Số quyển | 13 | 27 | 28 | 26 |';
const CLUBS = [{ label: 'Bóng đá', value: 30 }, { label: 'Cờ vua', value: 15 }, { label: 'Vẽ', value: 25 }, { label: 'Múa', value: 10 }];
const word = (n: number, m: number) => (n === 0 ? 'không thể' : m === 0 ? 'chắc chắn' : 'có thể');

export default {
    'g3.data_table': lesson('g3.data_table', {
        v: 1,
        goal: 'đọc được bảng số liệu, trả lời câu hỏi, tính tổng và so sánh các số liệu.',
        hook: { md: 'Thư viện ghi số sách cho mượn mỗi ngày vào một bảng. Làm sao biết ngày nào cho mượn nhiều nhất?', answer: 'Nhìn hàng "Số quyển", tìm số lớn nhất rồi đọc tên ngày ở cột của số đó.' },
        know: [
            know('Đọc bảng số liệu',
                text('Bảng số liệu có **tên bảng**, các **hàng** và các **cột**. Mỗi ô cho biết một số liệu.'),
                table(['Ngày', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm'], [['Số quyển', '13', '27', '28', '26']], 'Số quyển sách thư viện cho mượn'),
                text('Muốn biết thứ Ba cho mượn bao nhiêu quyển, em tìm cột "Thứ Ba" rồi đọc ô ở hàng "Số quyển": 27 quyển.'),
            ),
            know('So sánh và tính tổng',
                rule('Muốn so sánh, em đọc các số liệu cần so sánh rồi so sánh các số. Muốn tính tổng, em cộng các số liệu lại.'),
            ),
        ],
        forms: [
            form({
                id: 'doc', title: 'Dạng 1: Đọc một số liệu', level: 1,
                cue: 'Đề hỏi số liệu của một mục trong bảng.',
                steps: ['Tìm cột (hoặc hàng) có tên mục đề hỏi.', 'Đọc ô số liệu ở chỗ gặp nhau.', 'Trả lời kèm đơn vị.'],
                example: worked({
                    layout: 'calc', problem: `${TABLE_MD}\n\nThứ Năm thư viện cho mượn bao nhiêu quyển sách?`,
                    steps: [step('Tìm cột "Thứ Năm".'), step('Đọc ô ở hàng "Số quyển": 26.')],
                    answer: 'Thứ Năm thư viện cho mượn 26 quyển sách.',
                }),
            }),
            form({
                id: 'tinh', title: 'Dạng 2: Tính tổng, so sánh', level: 2,
                cue: 'Đề hỏi cả mấy mục có bao nhiêu, mục nào nhiều nhất, ít nhất, hơn kém bao nhiêu.',
                steps: ['Đọc các số liệu cần dùng.', 'Cộng (để tính tổng) hoặc so sánh, trừ (để tìm hơn kém).', 'Trả lời câu hỏi.'],
                example: worked({
                    layout: 'calc', problem: `${TABLE_MD}\n\nCả bốn ngày thư viện cho mượn bao nhiêu quyển sách? Ngày nào cho mượn nhiều nhất?`,
                    steps: [step('Cộng số quyển của bốn ngày:', '13 + 27 + 28 + 26 = 94 (quyển)'), step('So sánh: 28 là số lớn nhất, ở cột thứ Tư.')],
                    answer: 'Cả bốn ngày cho mượn 94 quyển; thứ Tư cho mượn nhiều nhất.',
                }),
            }),
        ],
        mistakes: [
            mistake('Hỏi thứ Ba, bạn Bi đọc nhầm sang ô bên cạnh: 28 quyển.', 'Thứ Ba cho mượn 27 quyển.', 'Dò thẳng cột "Thứ Ba", không nhìn chéo sang cột bên cạnh.'),
        ],
        remember: [
            'Đọc tên bảng, tên hàng, tên cột trước.',
            'Số liệu nằm ở ô gặp nhau của hàng và cột.',
            'Tính tổng thì cộng; tìm hơn kém thì trừ.',
        ],
    }),
    'g3.bar_chart': lesson('g3.bar_chart', {
        v: 1,
        goal: 'đọc được số liệu trên biểu đồ cột.',
        hook: { md: 'Biểu đồ cột cho biết số học sinh của mỗi câu lạc bộ. Làm sao biết câu lạc bộ nào đông nhất?', answer: 'Cột cao nhất ứng với câu lạc bộ đông nhất; số ghi trên đầu cột là số học sinh.' },
        needs: ['g3.data_table'],
        know: [
            know('Đọc biểu đồ cột',
                pic('barChartSVG', CLUBS),
                text('Mỗi cột ứng với một câu lạc bộ. Cột càng cao thì số học sinh càng nhiều. Số ghi trên đầu cột là số học sinh của câu lạc bộ đó.'),
            ),
        ],
        forms: [
            form({
                id: 'doc-cot', title: 'Dạng 1: Đọc và so sánh các cột', level: 2,
                cue: 'Đề cho biểu đồ cột và hỏi số liệu của một cột, hoặc cột nào cao nhất, thấp nhất.',
                steps: ['Tìm cột có tên đề hỏi ở dưới chân cột.', 'Đọc số ghi trên đầu cột.', 'So sánh độ cao hoặc so sánh các số.'],
                example: worked({
                    layout: 'calc', problem: 'Theo biểu đồ, câu lạc bộ Vẽ có bao nhiêu học sinh? Câu lạc bộ nào đông nhất?',
                    visual: vis('barChartSVG', CLUBS),
                    steps: [step('Tìm cột có tên "Vẽ", số trên đầu cột là 25.'), step('Cột cao nhất là cột "Bóng đá" với 30 học sinh.')],
                    answer: 'Câu lạc bộ Vẽ có 25 học sinh; câu lạc bộ Bóng đá đông nhất.',
                }),
            }),
        ],
        mistakes: [
            mistake('Hỏi câu lạc bộ Vẽ, bạn Bi đọc số trên cột bên cạnh.', 'Đọc đúng cột có tên "Vẽ" ở chân cột: 25 học sinh.', 'Tên mỗi cột ghi ở chân cột. Dò từ tên lên đến đầu cột để đọc số.'),
        ],
        remember: [
            'Tên cột ở chân cột, số liệu ở đầu cột.',
            'Cột cao hơn thì số liệu lớn hơn.',
        ],
    }),
    'g3.chance': lesson('g3.chance', {
        v: 1,
        goal: 'mô tả được khả năng xảy ra của một sự kiện bằng các từ chắc chắn, có thể, không thể.',
        hook: { md: 'Trong hộp chỉ có bóng đỏ. Em nhắm mắt lấy 1 quả. Em có thể lấy được bóng xanh không?', answer: 'Không thể, vì trong hộp không có bóng xanh. Em chắc chắn lấy được bóng đỏ.' },
        know: [
            know('Chắc chắn, có thể, không thể',
                table(['Từ', 'Nghĩa', 'Ví dụ khi gieo xúc xắc'], [
                    ['Chắc chắn', 'Luôn luôn xảy ra', 'Mặt có số chấm bé hơn 7'],
                    ['Có thể', 'Có lúc xảy ra, có lúc không', 'Mặt 6 chấm'],
                    ['Không thể', 'Không bao giờ xảy ra', 'Mặt 7 chấm'],
                ]),
            ),
            know('Kéo để quan sát',
                widget(explore({
                    title: 'Đổi số bóng trong hộp, rồi lấy 1 quả',
                    controls: {
                        r: { label: 'Số bóng đỏ', min: 0, max: 6, init: 3 },
                        b: { label: 'Số bóng xanh dương', min: 0, max: 6, init: 0 },
                    },
                    valid: v => (v.r + v.b > 0 ? null : 'Hộp cần có ít nhất 1 quả bóng.'),
                    visual: v => vis('bagSVG', [{ color: 'red', n: v.r }, { color: 'blue', n: v.b }]),
                    caption: v => `Lấy 1 quả bóng: lấy được bóng đỏ là ${word(v.r, v.b)} xảy ra; lấy được bóng xanh dương là ${word(v.b, v.r)} xảy ra.`,
                })),
            ),
        ],
        forms: [
            form({
                id: 'xuc-xac', title: 'Dạng 1: Sự kiện khi gieo xúc xắc', level: 1,
                cue: 'Đề nói về một sự kiện khi gieo xúc xắc và hỏi chắc chắn, có thể hay không thể.',
                steps: ['Liệt kê các mặt có thể xuất hiện: từ 1 đến 6 chấm.', 'Xem có bao nhiêu mặt thỏa mãn sự kiện.', 'Tất cả: chắc chắn; một vài: có thể; không mặt nào: không thể.'],
                example: worked({
                    layout: 'calc', problem: 'Sự kiện "Gieo một con xúc xắc, mặt xuất hiện có số chấm bé hơn 7" là chắc chắn, có thể hay không thể?',
                    steps: [step('Xúc xắc có các mặt từ 1 đến 6 chấm.'), step('Mặt nào cũng có số chấm bé hơn 7.')],
                    answer: 'Đó là sự kiện chắc chắn xảy ra.',
                }),
            }),
            form({
                id: 'hop-bong', title: 'Dạng 2: Lấy bóng trong hộp', level: 2,
                cue: 'Đề cho số bóng mỗi màu trong hộp và hỏi khả năng lấy được một màu.',
                steps: ['Hộp không có màu đó: không thể.', 'Mọi quả bóng trong hộp đều có màu đề nêu: chắc chắn.', 'Hộp có màu đó và cả màu khác: có thể.', 'Lấy nhiều quả hơn số bóng trong hộp: không thể.'],
                example: worked({
                    layout: 'calc', problem: 'Trong hộp có 5 quả bóng vàng và 3 quả bóng đỏ. Sự kiện "lấy 1 quả bóng được bóng đỏ" là chắc chắn, có thể hay không thể?',
                    visual: vis('bagSVG', [{ color: 'yellow', n: 5 }, { color: 'red', n: 3 }]),
                    steps: [step('Trong hộp có bóng đỏ nên có thể lấy được bóng đỏ.'), step('Trong hộp còn bóng vàng nên không chắc chắn lấy được bóng đỏ.')],
                    answer: 'Đó là sự kiện có thể xảy ra.',
                }),
            }),
        ],
        mistakes: [
            mistake('Hộp có 5 bóng vàng, 3 bóng đỏ. Bạn Bi nói: chắc chắn lấy được bóng vàng vì bóng vàng nhiều hơn.', 'Chỉ là "có thể" lấy được bóng vàng.',
                'Vẫn có thể lấy trúng bóng đỏ. "Chắc chắn" chỉ dùng khi trong hộp toàn bóng vàng.'),
        ],
        remember: [
            'Chắc chắn: luôn xảy ra.',
            'Có thể: có lúc xảy ra, có lúc không.',
            'Không thể: không bao giờ xảy ra.',
        ],
    }),
} satisfies LessonBook;
