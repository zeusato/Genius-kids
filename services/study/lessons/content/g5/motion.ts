// Lớp 5 — Biểu thức (g5_parentheses) và Chuyển động đều, làm chung, dòng nước (g5_word_problems).
import { explore, form, know, lesson, mistake, note, pic, rule, step, table, text, vis, widget, worked } from '../../build';
import type { LessonBook } from '../../types';

export default {
    'g5.expr': lesson('g5.expr', {
        v: 1,
        goal: 'tính được giá trị biểu thức có dấu ngoặc, kể cả với số thập phân, và so sánh hai biểu thức.',
        hook: { md: '(14 + 28) × 7 và 14 + 28 × 7 có bằng nhau không?', answer: 'Không bằng nhau: (14 + 28) × 7 = 294, còn 14 + 28 × 7 = 210.' },
        needs: ['g3.expression'],
        know: [
            know('Thứ tự thực hiện',
                rule('Trong ngoặc trước. Ngoài ngoặc: nhân, chia trước; cộng, trừ sau. Cùng loại phép tính thì làm từ trái sang phải.', '{( )} → {× :} → {+ −}'),
                text('Ví dụ: (17,6 + 8) × 6 = 25,6 × 6 = 153,6.'),
            ),
            know('Nhân một tổng với một số',
                text('Nhân một tổng với một số, ta có thể nhân từng số hạng với số đó rồi cộng các kết quả.'),
                text('Ví dụ: (28 + 22) × 4 = 28 × 4 + 22 × 4 = 200.'),
            ),
        ],
        forms: [
            form({
                id: 'tinh', title: 'Dạng 1: Tính giá trị biểu thức có ngoặc', level: 2,
                cue: 'Biểu thức có dấu ngoặc và có thể có số thập phân.',
                steps: ['Tính trong ngoặc trước.', 'Tính nhân, chia rồi đến cộng, trừ.', 'Viết kết quả.'],
                example: worked({
                    layout: 'calc', problem: 'Tính: (3500 − 858) : 2',
                    steps: [step('Tính trong ngoặc trước:', '3500 − 858 = 2642'), step('Rồi chia:', '2642 : 2 = 1321')],
                    answer: 'Vậy (3500 − 858) : 2 = 1321.',
                }),
            }),
            form({
                id: 'so-sanh', title: 'Dạng 2: So sánh hai biểu thức', level: 3,
                cue: 'Đề cho hai biểu thức (một có ngoặc, một không) và yêu cầu điền dấu.',
                steps: ['Tính giá trị từng biểu thức theo đúng thứ tự.', 'So sánh hai kết quả.', 'Điền dấu.'],
                example: worked({
                    layout: 'calc', problem: 'Điền dấu >, <, =: 14 + 28 × 7 … (14 + 28) × 7',
                    steps: [step('Biểu thức thứ nhất, nhân trước:', '14 + 28 × 7 = 14 + 196 = 210'), step('Biểu thức thứ hai, trong ngoặc trước:', '(14 + 28) × 7 = 42 × 7 = 294'), step('So sánh: 210 < 294.')],
                    answer: 'Vậy 14 + 28 × 7 < (14 + 28) × 7.',
                }),
            }),
        ],
        mistakes: [
            mistake('Bạn Bi tính: (28 + 22) × 4 = 28 + 88 = 116.', '(28 + 22) × 4 = 50 × 4 = 200.', 'Bi chỉ nhân 22 với 4. Có ngoặc thì phải tính tổng trong ngoặc trước, hoặc nhân cả hai số hạng với 4.'),
        ],
        remember: [
            'Trong ngoặc trước.',
            'Nhân, chia trước; cộng, trừ sau.',
            'Cùng loại phép tính: từ trái sang phải.',
        ],
    }),
    'g5.motion': lesson('g5.motion', {
        v: 1,
        goal: 'tính được quãng đường, vận tốc và thời gian của một chuyển động đều.',
        hook: { md: 'Xe máy mỗi giờ đi được 40 km. Đi trong 3 giờ thì được bao nhiêu ki-lô-mét?', answer: 'Đi được 40 × 3 = 120 (km).' },
        needs: ['g5.time_addsub'],
        know: [
            know('Vận tốc và quãng đường',
                text('**Vận tốc** cho biết mỗi giờ (mỗi phút, mỗi giây) đi được bao nhiêu. Đơn vị thường gặp: km/giờ, m/phút, m/giây.'),
                rule('Quãng đường bằng vận tốc nhân với thời gian.', 's = {v} × {t}'),
                widget(explore({
                    title: 'Đổi vận tốc và thời gian',
                    controls: {
                        v: { label: 'Vận tốc', min: 20, max: 60, step: 5, init: 40, unit: 'km/giờ' },
                        t: { label: 'Thời gian', min: 1, max: 5, init: 3, unit: 'giờ' },
                    },
                    visual: v => vis('segmentDiagramSVG', [{ label: 'Quãng đường', parts: Array(v.t).fill(v.v), labels: Array(v.t).fill(`${v.v} km`) }], `Mỗi đoạn là 1 giờ`),
                    caption: v => `Mỗi giờ đi ${v.v} km, đi trong ${v.t} giờ: ${v.v} × ${v.t} = ${v.v * v.t} (km).`,
                })),
            ),
            know('Ba công thức',
                table(['Cần tìm', 'Công thức'], [['Quãng đường', 's = v × t'], ['Vận tốc', 'v = s : t'], ['Thời gian', 't = s : v']]),
                note('Các đại lượng phải khớp đơn vị: vận tốc km/giờ đi với thời gian tính bằng giờ. Đổi phút ra giờ trước khi tính, ví dụ 45 phút = 0,75 giờ.'),
            ),
        ],
        forms: [
            form({
                id: 'quang-duong', title: 'Dạng 1: Tính quãng đường', level: 1,
                cue: 'Đề cho vận tốc và thời gian, hỏi quãng đường.',
                steps: ['Kiểm tra đơn vị của vận tốc và thời gian.', 'Quãng đường = vận tốc × thời gian.', 'Viết đáp số kèm đơn vị độ dài.'],
                example: worked({
                    problem: 'Một xe máy đi với vận tốc 44 km/giờ trong 4 giờ. Tính quãng đường xe máy đi được.',
                    steps: [step('Quãng đường xe máy đi được là:', '44 × 4 = 176 (km)')],
                    answer: 'Đáp số: 176 km.',
                }),
            }),
            form({
                id: 'van-toc', title: 'Dạng 2: Tính vận tốc hoặc thời gian', level: 2,
                cue: 'Đề cho quãng đường và thời gian (hỏi vận tốc), hoặc quãng đường và vận tốc (hỏi thời gian).',
                steps: ['Vận tốc = quãng đường : thời gian.', 'Thời gian = quãng đường : vận tốc.', 'Ghi đơn vị đúng: km/giờ hoặc giờ.'],
                example: worked({
                    problem: 'Một ô tô đi quãng đường 228 km hết 4 giờ. Tính vận tốc của ô tô.',
                    steps: [step('Vận tốc của ô tô là:', '228 : 4 = 57 (km/giờ)')],
                    answer: 'Đáp số: 57 km/giờ.',
                }),
            }),
            form({
                id: 'gio-khoi-hanh', title: 'Dạng 3: Có giờ khởi hành và giờ đến', level: 3,
                cue: 'Đề cho giờ xuất phát, giờ đến nơi và vận tốc.',
                steps: ['Thời gian đi = giờ đến − giờ xuất phát.', 'Tính quãng đường (hoặc vận tốc) bằng công thức.', 'Viết đáp số.'],
                example: worked({
                    problem: 'Một ô tô khởi hành lúc 6 giờ 30 phút và đến nơi lúc 10 giờ 30 phút, đi với vận tốc 55 km/giờ. Tính quãng đường ô tô đã đi.',
                    steps: [step('Thời gian ô tô đi là: 10 giờ 30 phút − 6 giờ 30 phút = 4 giờ.'), step('Quãng đường ô tô đã đi là:', '55 × 4 = 220 (km)')],
                    answer: 'Đáp số: 220 km.',
                }),
            }),
        ],
        mistakes: [
            mistake('Ô tô đi 45 phút với vận tốc 60 km/giờ, bạn Bi tính: 60 × 45 = 2700 (km).', 'Đổi 45 phút = 0,75 giờ, rồi tính 60 × 0,75 = 45 (km).', 'Vận tốc tính theo giờ thì thời gian cũng phải đổi ra giờ.'),
        ],
        remember: [
            's = v × t; v = s : t; t = s : v.',
            'Đơn vị phải khớp: km/giờ với giờ và km.',
            'Thời gian đi = giờ đến − giờ xuất phát.',
        ],
    }),
    'g5.motion_two': lesson('g5.motion_two', {
        v: 1,
        goal: 'giải được bài toán hai chuyển động ngược chiều gặp nhau và cùng chiều đuổi kịp nhau.',
        hook: { md: 'Hai bạn ở hai đầu một con đường, cùng đi về phía nhau. Mỗi phút hai bạn lại gần nhau thêm bao nhiêu?', answer: 'Mỗi phút hai bạn gần nhau thêm đúng bằng tổng quãng đường hai bạn đi được trong 1 phút.' },
        needs: ['g5.motion'],
        know: [
            know('Ngược chiều, gặp nhau',
                text('Hai xe đi ngược chiều về phía nhau: mỗi giờ khoảng cách giữa hai xe ngắn lại bằng **tổng hai vận tốc**.'),
                rule('Thời gian để gặp nhau bằng quãng đường chia cho tổng hai vận tốc.'),
            ),
            know('Cùng chiều, đuổi kịp',
                text('Xe nhanh đuổi theo xe chậm: mỗi giờ khoảng cách ngắn lại bằng **hiệu hai vận tốc**.'),
                rule('Thời gian để đuổi kịp bằng khoảng cách ban đầu chia cho hiệu hai vận tốc.'),
                pic('segmentDiagramSVG', [{ label: 'Khoảng cách', parts: [45], labels: ['45 km'] }], 'Ô tô ở sau, xe đạp ở trước'),
            ),
        ],
        forms: [
            form({
                id: 'gap-nhau', title: 'Dạng 1: Hai xe đi ngược chiều gặp nhau', level: 3,
                cue: 'Hai xe xuất phát cùng lúc từ hai nơi, đi **ngược chiều** về phía nhau.',
                steps: ['Tính tổng hai vận tốc.', 'Thời gian gặp nhau = quãng đường : tổng hai vận tốc.', 'Viết đáp số.'],
                example: worked({
                    problem: 'Hai ô tô xuất phát cùng lúc từ hai tỉnh cách nhau 234 km, đi ngược chiều nhau. Ô tô thứ nhất đi 43 km/giờ, ô tô thứ hai đi 35 km/giờ. Sau bao lâu hai ô tô gặp nhau?',
                    steps: [step('Sau mỗi giờ, hai ô tô gần nhau thêm:', '43 + 35 = 78 (km)'), step('Thời gian để hai ô tô gặp nhau là:', '234 : 78 = 3 (giờ)')],
                    answer: 'Đáp số: 3 giờ.',
                }),
            }),
            form({
                id: 'duoi-kip', title: 'Dạng 2: Hai xe đi cùng chiều, đuổi kịp', level: 3,
                cue: 'Xe chậm đi trước, xe nhanh đi sau, **cùng chiều**; hỏi bao lâu thì đuổi kịp.',
                steps: ['Tính hiệu hai vận tốc.', 'Thời gian đuổi kịp = khoảng cách ban đầu : hiệu hai vận tốc.', 'Viết đáp số.'],
                example: worked({
                    problem: 'Một xe đạp đi trước một ô tô 45 km, cùng chiều. Xe đạp đi 14 km/giờ, ô tô đi 29 km/giờ. Sau bao lâu ô tô đuổi kịp xe đạp?',
                    steps: [step('Sau mỗi giờ, ô tô gần xe đạp thêm:', '29 − 14 = 15 (km)'), step('Thời gian để ô tô đuổi kịp xe đạp là:', '45 : 15 = 3 (giờ)')],
                    answer: 'Đáp số: 3 giờ.',
                }),
            }),
        ],
        mistakes: [
            mistake('Bài đuổi kịp, bạn Bi tính: 45 : (29 + 14).', 'Thời gian đuổi kịp: 45 : (29 − 14) = 3 (giờ).', 'Đi cùng chiều thì mỗi giờ khoảng cách chỉ ngắn lại bằng hiệu hai vận tốc, không phải tổng.'),
        ],
        remember: [
            'Ngược chiều: thời gian gặp nhau = quãng đường : tổng hai vận tốc.',
            'Cùng chiều: thời gian đuổi kịp = khoảng cách : hiệu hai vận tốc.',
        ],
    }),
    'g5.work_together': lesson('g5.work_together', {
        v: 1,
        goal: 'giải được bài toán hai người cùng làm chung một công việc.',
        hook: { md: 'Một vòi nước chảy đầy bể trong 4 giờ. Mỗi giờ vòi chảy được bao nhiêu phần bể?', answer: 'Mỗi giờ vòi chảy được 1/4 bể.' },
        needs: ['g5.frac_addsub', 'g5.frac_muldiv'],
        know: [
            know('Coi cả công việc là 1',
                text('Một người làm xong việc trong 12 ngày thì mỗi ngày làm được **1/12** công việc.'),
                rule('Hai người cùng làm thì mỗi ngày làm được tổng hai phần việc. Thời gian làm xong bằng 1 chia cho phần việc làm chung trong một ngày.'),
            ),
        ],
        forms: [
            form({
                id: 'lam-chung', title: 'Dạng 1: Hai người làm chung', level: 3,
                cue: 'Đề cho thời gian mỗi người làm một mình xong việc, hỏi hai người cùng làm thì bao lâu xong.',
                steps: ['Tìm phần việc mỗi người làm trong một ngày.', 'Cộng hai phần việc (quy đồng mẫu số).', 'Lấy 1 chia cho phần việc làm chung.'],
                example: worked({
                    problem: 'Người thứ nhất đào xong một đoạn mương trong 12 ngày, người thứ hai đào xong trong 24 ngày. Nếu hai người cùng làm thì bao nhiêu ngày xong?',
                    steps: [
                        step('Mỗi ngày người thứ nhất làm được 1/12 công việc, người thứ hai làm được 1/24 công việc.'),
                        step('Mỗi ngày cả hai người làm được:', '1/12 + 1/24 = 2/24 + 1/24 = 3/24 = 1/8 (công việc)'),
                        step('Thời gian hai người làm xong là:', '1 : 1/8 = 8 (ngày)'),
                    ],
                    answer: 'Đáp số: 8 ngày.',
                }),
            }),
        ],
        mistakes: [
            mistake('Bạn Bi cộng số ngày: 12 + 24 = 36 (ngày).', 'Hai người cùng làm hết 8 ngày.', 'Hai người cùng làm thì xong nhanh hơn mỗi người làm một mình, nên số ngày phải ít hơn 12 ngày.'),
        ],
        remember: [
            'Coi cả công việc là 1.',
            'Làm xong trong n ngày thì mỗi ngày làm được 1/n công việc.',
            'Thời gian làm chung = 1 : (tổng phần việc mỗi ngày).',
        ],
    }),
    'g5.stream': lesson('g5.stream', {
        v: 1,
        goal: 'tính được vận tốc xuôi dòng, ngược dòng và quãng đường đi trên dòng nước.',
        hook: { md: 'Vì sao thuyền đi xuôi dòng nhanh hơn đi ngược dòng?', answer: 'Đi xuôi dòng, nước đẩy thuyền đi thêm; đi ngược dòng, nước cản lại.' },
        needs: ['g5.motion'],
        know: [
            know('Xuôi dòng và ngược dòng',
                rule('Vận tốc xuôi dòng bằng vận tốc khi nước lặng cộng vận tốc dòng nước.'),
                rule('Vận tốc ngược dòng bằng vận tốc khi nước lặng trừ vận tốc dòng nước.'),
            ),
        ],
        forms: [
            form({
                id: 'xuoi', title: 'Dạng 1: Đi xuôi dòng', level: 3,
                cue: 'Đề cho vận tốc khi nước lặng, vận tốc dòng nước và hỏi khi đi **xuôi dòng**.',
                steps: ['Vận tốc xuôi dòng = vận tốc nước lặng + vận tốc dòng nước.', 'Tính quãng đường (hoặc thời gian) bằng công thức chuyển động.'],
                example: worked({
                    problem: 'Một ca nô có vận tốc khi nước lặng là 27 km/giờ, vận tốc dòng nước là 3 km/giờ. Ca nô đi xuôi dòng trong 4 giờ được bao nhiêu ki-lô-mét?',
                    steps: [step('Vận tốc xuôi dòng là:', '27 + 3 = 30 (km/giờ)'), step('Quãng đường ca nô đi được là:', '30 × 4 = 120 (km)')],
                    answer: 'Đáp số: 120 km.',
                }),
            }),
            form({
                id: 'nguoc', title: 'Dạng 2: Đi ngược dòng', level: 3,
                cue: 'Đề hỏi khi ca nô, thuyền đi **ngược dòng**.',
                steps: ['Vận tốc ngược dòng = vận tốc nước lặng − vận tốc dòng nước.', 'Tính quãng đường (hoặc thời gian).'],
                example: worked({
                    problem: 'Một ca nô có vận tốc khi nước lặng là 29 km/giờ, vận tốc dòng nước là 4 km/giờ. Ca nô đi ngược dòng trong 3 giờ được bao nhiêu ki-lô-mét?',
                    steps: [step('Vận tốc ngược dòng là:', '29 − 4 = 25 (km/giờ)'), step('Quãng đường ca nô đi được là:', '25 × 3 = 75 (km)')],
                    answer: 'Đáp số: 75 km.',
                }),
            }),
        ],
        mistakes: [
            mistake('Đi ngược dòng, bạn Bi tính vận tốc: 29 + 4 = 33 (km/giờ).', 'Vận tốc ngược dòng: 29 − 4 = 25 (km/giờ).', 'Ngược dòng thì nước cản lại, nên phải trừ vận tốc dòng nước.'),
        ],
        remember: [
            'Xuôi dòng: cộng vận tốc dòng nước.',
            'Ngược dòng: trừ vận tốc dòng nước.',
        ],
    }),
} satisfies LessonBook;
