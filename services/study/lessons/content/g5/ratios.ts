// Lớp 5 — Tỉ số & phần trăm (g5_ratios). Chuẩn soạn: docs/study-learn-plan.md mục 3, 5.4, 9.2.
import { explore, form, know, lesson, mistake, note, pic, rule, step, text, vis, widget, worked } from '../../build';
import type { LessonBook } from '../../types';

const bars = (n: number) => ({ parts: Array(n).fill(1), labels: Array(n).fill('') });

export default {
    'g5.ratio': lesson('g5.ratio', {
        v: 1,
        goal: 'viết được tỉ số của hai số và tỉ số của hai đại lượng cùng loại.',
        hook: { md: 'Lớp 5A có 10 bạn nam và 16 bạn nữ. Tỉ số của số bạn nữ và số bạn nam là bao nhiêu?', answer: 'Tỉ số là 16 : 10 hay 16/10 = 8/5.' },
        know: [
            know('Tỉ số của hai số',
                rule('Tỉ số của a và b là a : b hay a/b (b khác 0).'),
                text('Tỉ số của 6 và 8 là 6 : 8 hay 6/8, rút gọn được 3/4.'),
                pic('segmentDiagramSVG', [{ label: 'Số thứ nhất', ...bars(3) }, { label: 'Số thứ hai', ...bars(4) }], 'Tỉ số 3 : 4'),
            ),
            know('Thứ tự và đơn vị',
                note('Thứ tự rất quan trọng: tỉ số của a và b khác tỉ số của b và a.'),
                text('Tỉ số của hai đại lượng phải tính khi chúng cùng đơn vị đo. Ví dụ: 2 m và 50 cm, đổi 2 m thành 200 cm, tỉ số là 200 : 50 = 4.'),
            ),
        ],
        forms: [
            form({
                id: 'hai-so', title: 'Dạng 1: Tỉ số của hai số', level: 1,
                cue: 'Đề yêu cầu viết tỉ số của hai số cho trước.',
                steps: ['Số nêu trước viết trước (hoặc ở tử số).', 'Viết dạng a : b hoặc a/b.', 'Rút gọn nếu được.'],
                example: worked({
                    layout: 'calc', problem: 'Viết tỉ số của 6 và 8.',
                    steps: [step('Số nêu trước là 6, số nêu sau là 8:', '6 : 8 = 6/8'), step('Rút gọn:', '6/8 = 3/4')],
                    answer: 'Tỉ số của 6 và 8 là 6/8 hay 3/4.',
                }),
            }),
            form({
                id: 'tinh-huong', title: 'Dạng 2: Tỉ số trong tình huống', level: 2,
                cue: 'Bài toán có hai đại lượng và hỏi tỉ số của đại lượng này với đại lượng kia.',
                steps: ['Xác định đại lượng nêu trước và nêu sau trong câu hỏi.', 'Đổi về cùng đơn vị nếu cần.', 'Viết tỉ số rồi rút gọn.'],
                example: worked({
                    layout: 'calc', problem: 'Lớp 5A có 10 bạn nam và 16 bạn nữ. Tỉ số của số bạn nữ và số bạn nam là bao nhiêu?',
                    steps: [step('Số bạn nữ nêu trước, số bạn nam nêu sau:', '16 : 10 = 16/10'), step('Rút gọn:', '16/10 = 8/5')],
                    answer: 'Tỉ số của số bạn nữ và số bạn nam là 8/5.',
                }),
            }),
        ],
        mistakes: [
            mistake('Hỏi tỉ số của số bạn nữ và số bạn nam, bạn Bi viết 10/16.', 'Tỉ số là 16/10 = 8/5.', 'Đại lượng nêu trước trong câu hỏi (số bạn nữ) viết ở tử số.'),
        ],
        remember: [
            'Tỉ số của a và b là a : b hay a/b.',
            'Số nêu trước viết ở tử số.',
            'Hai đại lượng phải cùng đơn vị đo.',
        ],
    }),
    'g5.percent': lesson('g5.percent', {
        v: 1,
        goal: 'hiểu tỉ số phần trăm, tìm được tỉ số phần trăm của hai số, phần trăm của một số và giải bài toán giảm giá.',
        hook: { md: 'Lớp em có 40 bạn, 10 bạn đi học bằng xe đạp. Số bạn đi xe đạp chiếm bao nhiêu phần trăm số bạn của lớp?', answer: '10 : 40 = 0,25; 0,25 × 100 = 25. Vậy chiếm 25%.' },
        needs: ['g5.ratio', 'g5.dec_div'],
        know: [
            know('Tỉ số phần trăm',
                text('**Tỉ số phần trăm** cho biết một số bằng bao nhiêu phần trăm của số kia. 25% đọc là "hai mươi lăm phần trăm", nghĩa là 25/100.'),
                widget(explore({
                    title: 'Tô màu số ô trong 100 ô',
                    controls: { p: { label: 'Số ô tô màu', min: 0, max: 100, step: 5, init: 25 } },
                    visual: v => vis('gridAreaSVG', 10, 10, Array.from({ length: v.p }, (_, i) => [i % 10, Math.floor(i / 10)])),
                    caption: v => `Tô ${v.p} ô trong 100 ô: ${v.p}% hay ${v.p}/100.`,
                })),
            ),
            know('Hai quy tắc',
                rule('Muốn tìm tỉ số phần trăm của a và b, ta lấy a chia cho b, nhân thương với 100 rồi viết thêm kí hiệu %.'),
                rule('Muốn tìm p% của một số, ta lấy số đó nhân với p rồi chia cho 100.'),
            ),
        ],
        forms: [
            form({
                id: 'ti-so-pt', title: 'Dạng 1: Tìm tỉ số phần trăm của hai số', level: 1,
                cue: 'Đề hỏi "a là bao nhiêu phần trăm của b?" hoặc "chiếm bao nhiêu phần trăm".',
                steps: ['Lấy a chia cho b.', 'Nhân thương với 100.', 'Viết thêm kí hiệu %.'],
                example: worked({
                    layout: 'calc', problem: '2 là bao nhiêu phần trăm của 20?',
                    steps: [step('Lấy 2 chia cho 20:', '2 : 20 = 0,1'), step('Nhân thương với 100:', '0,1 × 100 = 10')],
                    answer: 'Vậy 2 là 10% của 20.',
                }),
            }),
            form({
                id: 'tim-gia-tri', title: 'Dạng 2: Tìm phần trăm của một số', level: 2,
                cue: 'Đề hỏi "p% của một số là bao nhiêu?"',
                steps: ['Lấy số đó nhân với p.', 'Chia cho 100.'],
                example: worked({
                    layout: 'calc', problem: 'Tìm 20% của 150.',
                    steps: [step('20% của 150 là:', '150 × 20 : 100 = 30')],
                    answer: 'Vậy 20% của 150 là 30.',
                }),
            }),
            form({
                id: 'giam-gia', title: 'Dạng 3: Bài toán giảm giá', level: 3,
                cue: 'Đề cho giá món hàng và giảm (hoặc tăng) bao nhiêu phần trăm.',
                steps: ['Tìm số tiền được giảm: giá × phần trăm : 100.', 'Lấy giá cũ trừ số tiền được giảm.', 'Viết đáp số.'],
                example: worked({
                    problem: 'Một món hàng giá 380 000 đồng, giảm 20%. Hỏi giá sau khi giảm là bao nhiêu?',
                    steps: [step('Số tiền được giảm là:', '380 000 × 20 : 100 = 76 000 (đồng)'), step('Giá sau khi giảm là:', '380 000 − 76 000 = 304 000 (đồng)')],
                    answer: 'Đáp số: 304 000 đồng.',
                }),
            }),
        ],
        mistakes: [
            mistake('Thấy 2 : 20 = 0,1, bạn Bi viết 2 là 0,1% của 20.', 'Tính tiếp 0,1 × 100 = 10, nên 2 là 10% của 20.', 'Thương phải nhân với 100 rồi mới viết kí hiệu %.'),
            mistake('Giảm 20% giá 380 000 đồng, bạn Bi viết giá mới là 380 000 − 20 = 379 980 (đồng).', 'Giá mới: 380 000 − 76 000 = 304 000 (đồng).',
                '20% là 20 phần trăm của giá, phải tính 380 000 × 20 : 100 = 76 000 (đồng) trước.'),
        ],
        remember: [
            'p% nghĩa là p/100.',
            'Tỉ số phần trăm của a và b: a : b × 100, viết thêm %.',
            'p% của một số: số đó × p : 100.',
            'Giảm giá: tìm số tiền giảm rồi lấy giá cũ trừ đi.',
        ],
    }),
    'g5.map_scale': lesson('g5.map_scale', {
        v: 1,
        goal: 'tính được độ dài thật từ bản đồ và độ dài trên bản đồ từ độ dài thật.',
        hook: { md: 'Trên bản đồ tỉ lệ 1 : 1000, chiều dài sân trường là 8 cm. Chiều dài thật của sân là bao nhiêu mét?', answer: '8 × 1000 = 8000 (cm), tức là 80 m.' },
        needs: ['g5.ratio'],
        know: [
            know('Tỉ lệ bản đồ',
                text('Tỉ lệ bản đồ 1 : 1000 nghĩa là 1 cm trên bản đồ ứng với 1000 cm ngoài thực tế.'),
                rule('Độ dài thật bằng độ dài trên bản đồ nhân với mẫu số tỉ lệ. Độ dài trên bản đồ bằng độ dài thật chia cho mẫu số tỉ lệ.'),
                note('Hai độ dài phải cùng đơn vị đo khi tính. Tính xong đổi cho gọn: 100 cm = 1 m; 100 000 cm = 1 km.'),
            ),
        ],
        forms: [
            form({
                id: 'ban-do-ra-that', title: 'Dạng 1: Từ bản đồ ra độ dài thật', level: 2,
                cue: 'Đề cho tỉ lệ bản đồ và độ dài trên bản đồ, hỏi độ dài thật.',
                steps: ['Lấy độ dài trên bản đồ nhân với mẫu số tỉ lệ.', 'Kết quả có cùng đơn vị với độ dài trên bản đồ.', 'Đổi sang đơn vị đề hỏi.'],
                example: worked({
                    problem: 'Trên bản đồ tỉ lệ 1 : 500 000, quãng đường dài 14 cm. Độ dài thật của quãng đường là bao nhiêu ki-lô-mét?',
                    steps: [step('Độ dài thật của quãng đường là:', '14 × 500 000 = 7 000 000 (cm)'), step('Đổi: 7 000 000 cm là 70 km.')],
                    answer: 'Đáp số: 70 km.',
                }),
            }),
            form({
                id: 'that-ra-ban-do', title: 'Dạng 2: Từ độ dài thật ra bản đồ', level: 3,
                cue: 'Đề cho độ dài thật và tỉ lệ bản đồ, hỏi độ dài trên bản đồ.',
                steps: ['Đổi độ dài thật về đơn vị nhỏ (thường là cm).', 'Lấy độ dài thật chia cho mẫu số tỉ lệ.', 'Viết đáp số kèm đơn vị.'],
                example: worked({
                    problem: 'Một mảnh vườn dài 70 m. Trên bản đồ tỉ lệ 1 : 1000, chiều dài mảnh vườn là bao nhiêu xăng-ti-mét?',
                    steps: [step('Đổi 70 m thành 7000 cm.'), step('Chiều dài mảnh vườn trên bản đồ là:', '7000 : 1000 = 7 (cm)')],
                    answer: 'Đáp số: 7 cm.',
                }),
            }),
        ],
        mistakes: [
            mistake('Bạn Bi tính chiều dài trên bản đồ: 70 : 1000 = 0,07 (cm).', 'Đổi 70 m thành 7000 cm trước: 7000 : 1000 = 7 (cm).', 'Độ dài thật phải đổi sang xăng-ti-mét trước khi chia.'),
        ],
        remember: [
            'Tỉ lệ 1 : n nghĩa là 1 cm trên bản đồ ứng với n cm thật.',
            'Độ dài thật = độ dài trên bản đồ × n.',
            'Độ dài trên bản đồ = độ dài thật : n (cùng đơn vị).',
        ],
    }),
    'g5.interest': lesson('g5.interest', {
        v: 1,
        goal: 'tính được tiền lãi tiết kiệm và giá sau khi tăng rồi giảm phần trăm.',
        hook: { md: 'Một món hàng giá 100 000 đồng, tăng giá 10% rồi lại giảm 10%. Giá có quay về 100 000 đồng không?', answer: 'Không. Tăng 10% được 110 000 đồng. Giảm 10% của 110 000 đồng là giảm 11 000 đồng, còn 99 000 đồng.' },
        needs: ['g5.percent'],
        know: [
            know('Tiền lãi',
                rule('Tiền lãi bằng tiền gửi nhân với lãi suất rồi chia cho 100.'),
                text('Ví dụ: gửi 1 000 000 đồng, lãi suất 6% một năm. Lãi một năm là 1 000 000 × 6 : 100 = 60 000 (đồng).'),
            ),
            know('Tăng rồi giảm phần trăm',
                text('Tăng p% thì giá mới bằng giá cũ cộng p% của giá cũ. Giảm p% thì trừ đi p% của giá đang có.'),
                note('Lần giảm tính trên giá MỚI, nên tăng 10% rồi giảm 10% không quay về giá cũ.'),
            ),
        ],
        forms: [
            form({
                id: 'lai', title: 'Dạng 1: Tiền gửi và tiền lãi', level: 3,
                cue: 'Đề cho tiền gửi, lãi suất một năm và hỏi tiền lãi hoặc tổng tiền nhận về.',
                steps: ['Tiền lãi = tiền gửi × lãi suất : 100.', 'Tổng tiền nhận về = tiền gửi + tiền lãi.'],
                example: worked({
                    problem: 'Bác An gửi tiết kiệm 7 000 000 đồng với lãi suất 8% một năm. Sau 1 năm, bác nhận được cả tiền gửi và tiền lãi là bao nhiêu?',
                    steps: [step('Tiền lãi sau 1 năm là:', '7 000 000 × 8 : 100 = 560 000 (đồng)'), step('Cả tiền gửi và tiền lãi là:', '7 000 000 + 560 000 = 7 560 000 (đồng)')],
                    answer: 'Đáp số: 7 560 000 đồng.',
                }),
            }),
            form({
                id: 'tang-giam', title: 'Dạng 2: Tăng rồi giảm phần trăm', level: 3,
                cue: 'Đề cho giá ban đầu, tăng (giảm) phần trăm rồi lại giảm (tăng) phần trăm theo giá mới.',
                steps: ['Tính giá sau lần thay đổi thứ nhất.', 'Tính lần thay đổi thứ hai trên giá vừa tìm được.', 'Viết đáp số.'],
                example: worked({
                    problem: 'Một món hàng giá 210 000 đồng, được tăng giá 10%, sau đó lại giảm 10% so với giá mới. Giá cuối cùng là bao nhiêu?',
                    steps: [step('Giá sau khi tăng là:', '210 000 + 210 000 × 10 : 100 = 231 000 (đồng)'), step('Giá cuối cùng là:', '231 000 − 231 000 × 10 : 100 = 207 900 (đồng)')],
                    answer: 'Đáp số: 207 900 đồng.',
                }),
            }),
        ],
        mistakes: [
            mistake('Tăng 10% rồi giảm 10%, bạn Bi nói giá cuối cùng vẫn là 210 000 đồng.', 'Giá cuối cùng là 207 900 đồng.', 'Lần giảm 10% tính trên giá mới 231 000 đồng, nên số tiền giảm nhiều hơn số tiền tăng.'),
        ],
        remember: [
            'Tiền lãi = tiền gửi × lãi suất : 100.',
            'Lần thay đổi thứ hai tính trên giá mới.',
            'Tăng p% rồi giảm p% không quay về giá cũ.',
        ],
    }),
    'g5.sum_diff_ratio': lesson('g5.sum_diff_ratio', {
        v: 1,
        goal: 'giải được bài toán tìm hai số khi biết tổng và tỉ số, hoặc biết hiệu và tỉ số của hai số đó.',
        hook: {
            md: 'Lớp em có 35 bạn. Số bạn nam bằng 2/3 số bạn nữ. Không cần điểm danh, làm sao biết lớp có bao nhiêu bạn nam?',
            answer: 'Tổng số phần: 2 + 3 = 5. Một phần: 35 : 5 = 7. Số bạn nam: 7 × 2 = 14 (bạn).',
        },
        needs: ['g5.ratio'],
        know: [
            know('Tỉ số và những phần bằng nhau',
                text('"Số bạn nam bằng 2/3 số bạn nữ" nghĩa là: số bạn nữ gồm **3 phần bằng nhau** thì số bạn nam gồm **2 phần** như thế.'),
                pic('segmentDiagramSVG', [{ label: 'Nam', ...bars(2) }, { label: 'Nữ', ...bars(3) }], 'Tổng: 35 bạn'),
                rule('Tử số chỉ số phần của đại lượng đứng trước chữ "bằng"; mẫu số chỉ số phần của đại lượng đứng sau.'),
            ),
            know('Kéo để quan sát',
                widget(explore({
                    title: 'Đổi số phần và giá trị một phần',
                    controls: {
                        a: { label: 'Số phần của số bé', min: 1, max: 5, init: 2 },
                        b: { label: 'Số phần của số lớn', min: 2, max: 9, init: 3 },
                        k: { label: 'Giá trị một phần', min: 2, max: 20, init: 7 },
                    },
                    valid: v => (v.a < v.b ? null : 'Số bé phải có ít phần hơn số lớn.'),
                    visual: v => vis('segmentDiagramSVG', [{ label: 'Số bé', ...bars(v.a) }, { label: 'Số lớn', ...bars(v.b) }], `Tổng: ${v.k * (v.a + v.b)}`),
                    caption: v => `Tổng số phần: ${v.a} + ${v.b} = ${v.a + v.b}. Tổng: ${v.k} × ${v.a + v.b} = ${v.k * (v.a + v.b)}. Số bé: ${v.k} × ${v.a} = ${v.k * v.a}; số lớn: ${v.k} × ${v.b} = ${v.k * v.b}.`,
                })),
            ),
        ],
        forms: [
            form({
                id: 'tong-ti', title: 'Dạng 1: Biết tổng và tỉ số', level: 3,
                cue: 'Đề cho **tổng** của hai số và **tỉ số** của chúng (hoặc "số này bằng a/b số kia").',
                steps: [
                    'Vẽ sơ đồ: số bé mấy phần, số lớn mấy phần.',
                    'Tìm tổng số phần bằng nhau.',
                    'Tìm giá trị một phần: lấy tổng chia cho tổng số phần.',
                    'Tìm số bé, rồi tìm số lớn.',
                    'Viết đáp số và thử lại.',
                ],
                example: worked({
                    problem: 'Tổng của hai số là 96. Tỉ số của hai số là 3/5. Tìm hai số đó.',
                    visual: vis('segmentDiagramSVG', [{ label: 'Số bé', ...bars(3) }, { label: 'Số lớn', ...bars(5) }], 'Tổng: 96'),
                    steps: [
                        step('Tổng số phần bằng nhau là:', '3 + 5 = 8 (phần)'),
                        step('Giá trị một phần là:', '96 : 8 = 12'),
                        step('Số bé là:', '12 × 3 = 36'),
                        step('Số lớn là:', '96 − 36 = 60'),
                    ],
                    answer: 'Đáp số: Số bé: 36; Số lớn: 60.',
                    check: 'Thử lại: 36 + 60 = 96 và 36 : 60 = 3/5.',
                }),
            }),
            form({
                id: 'hieu-ti', title: 'Dạng 2: Biết hiệu và tỉ số', level: 3,
                cue: 'Đề cho **hiệu** của hai số (số này hơn số kia bao nhiêu) và **tỉ số**, kể cả cách nói "số lớn gấp n lần số bé".',
                steps: [
                    'Vẽ sơ đồ: số bé mấy phần, số lớn mấy phần.',
                    'Tìm hiệu số phần bằng nhau.',
                    'Tìm giá trị một phần: lấy hiệu chia cho hiệu số phần.',
                    'Tìm số bé, rồi tìm số lớn.',
                    'Viết đáp số và thử lại.',
                ],
                example: worked({
                    problem: 'Hiệu của hai số là 30. Số lớn gấp 4 lần số bé. Tìm hai số đó.',
                    visual: vis('segmentDiagramSVG', [{ label: 'Số bé', parts: [1], labels: ['?'] }, { label: 'Số lớn', parts: [1, 3], labels: ['', '30'] }]),
                    steps: [
                        step('Số lớn gấp 4 lần số bé nên số bé là 1 phần, số lớn là 4 phần. Hiệu số phần bằng nhau là:', '4 − 1 = 3 (phần)'),
                        step('Giá trị một phần, cũng là số bé:', '30 : 3 = 10'),
                        step('Số lớn là:', '10 + 30 = 40'),
                    ],
                    answer: 'Đáp số: Số bé: 10; Số lớn: 40.',
                    check: 'Thử lại: 40 − 10 = 30 và 40 : 10 = 4.',
                }),
            }),
        ],
        mistakes: [
            mistake('Tổng là 96, tỉ số 3/5. Bạn Bi tính một phần: 96 : 3 = 32.',
                'Một phần: 96 : (3 + 5) = 12.',
                'Tổng 96 gồm cả 3 phần của số bé và 5 phần của số lớn, tất cả là 8 phần. Phải chia cho tổng số phần.'),
            mistake('Hiệu là 30, số lớn gấp 4 lần số bé. Bạn Bi tính: 30 : (4 + 1) = 6.',
                'Một phần: 30 : (4 − 1) = 10.',
                'Hiệu là phần số lớn hơn số bé, đúng bằng 4 − 1 = 3 phần.'),
            mistake('"Số bạn nam bằng 2/3 số bạn nữ", bạn Bi vẽ: nam 3 phần, nữ 2 phần.',
                'Nam 2 phần, nữ 3 phần.',
                'Tử số 2 ứng với đại lượng đứng trước chữ "bằng", tức là số bạn nam.'),
        ],
        remember: [
            'Luôn vẽ sơ đồ đoạn thẳng trước khi tính.',
            'Tổng – tỉ: một phần = tổng : tổng số phần.',
            'Hiệu – tỉ: một phần = hiệu : hiệu số phần.',
            '"Số lớn gấp n lần số bé": số bé 1 phần, số lớn n phần.',
            'Thử lại: cộng (hoặc trừ) hai số rồi kiểm tra tỉ số.',
        ],
    }),
} satisfies LessonBook;
