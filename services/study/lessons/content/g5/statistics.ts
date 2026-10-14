// Lớp 5 — Thống kê & xác suất (g5_statistics).
import { form, know, lesson, mistake, pic, rule, step, text, vis, worked } from '../../build';
import type { LessonBook } from '../../types';

const PIE = [{ label: 'Đi bộ 25%', value: 25 }, { label: 'Xe đạp 40%', value: 40 }, { label: 'Bố mẹ đưa 35%', value: 35 }];
const BARS = [{ label: '5A', value: 45 }, { label: '5B', value: 30 }, { label: '5C', value: 60 }, { label: '5D', value: 25 }];

export default {
    'g5.pie_chart': lesson('g5.pie_chart', {
        v: 1,
        goal: 'đọc được biểu đồ hình quạt tròn và tính được số lượng từ tỉ số phần trăm.',
        hook: { md: 'Biểu đồ hình quạt cho biết các bạn đến trường bằng gì. Phần "Đi bộ" chiếm 25%. Nếu lớp có 40 bạn thì có bao nhiêu bạn đi bộ?', answer: 'Số bạn đi bộ là: 40 × 25 : 100 = 10 (bạn).' },
        needs: ['g5.percent'],
        know: [
            know('Đọc biểu đồ hình quạt',
                pic('pieChartSVG', PIE),
                text('Cả hình tròn là 100%. Mỗi hình quạt cho biết một phần chiếm bao nhiêu phần trăm của tất cả.'),
            ),
            know('Tính số lượng từ phần trăm',
                rule('Muốn tìm số lượng của một phần, ta lấy tổng số nhân với số phần trăm rồi chia cho 100.'),
            ),
        ],
        forms: [
            form({
                id: 'doc', title: 'Dạng 1: Đọc tỉ số phần trăm', level: 1,
                cue: 'Đề hỏi một phần chiếm bao nhiêu phần trăm.',
                steps: ['Tìm hình quạt có tên đề hỏi.', 'Đọc số phần trăm ghi kèm.'],
                example: worked({
                    layout: 'calc', problem: 'Biểu đồ "Tỉ lệ phương tiện học sinh đến trường". Phần "Đi bộ" chiếm bao nhiêu phần trăm?',
                    visual: vis('pieChartSVG', PIE),
                    steps: [step('Tìm hình quạt có tên "Đi bộ".'), step('Đọc số ghi kèm: 25%.')],
                    answer: 'Phần "Đi bộ" chiếm 25%.',
                }),
            }),
            form({
                id: 'so-luong', title: 'Dạng 2: Từ phần trăm ra số lượng', level: 2,
                cue: 'Đề cho tổng số và hỏi số lượng của một phần trên biểu đồ.',
                steps: ['Đọc số phần trăm của phần đó.', 'Lấy tổng số nhân với số phần trăm rồi chia cho 100.', 'Viết đáp số kèm đơn vị.'],
                example: worked({
                    problem: 'Biểu đồ "Tỉ lệ phương tiện học sinh đến trường" ở trên là của một trường có 800 học sinh. Có bao nhiêu học sinh đi xe đạp?',
                    visual: vis('pieChartSVG', PIE),
                    steps: [step('Phần "Xe đạp" chiếm 40%.'), step('Số học sinh đi xe đạp là:', '800 × 40 : 100 = 320 (học sinh)')],
                    answer: 'Đáp số: 320 học sinh.',
                }),
            }),
        ],
        mistakes: [
            mistake('Trường có 800 học sinh, phần "Xe đạp" chiếm 40%. Bạn Bi trả lời có 40 học sinh đi xe đạp.', 'Số học sinh đi xe đạp: 800 × 40 : 100 = 320 (học sinh).',
                '40% là tỉ số phần trăm, chưa phải số học sinh. Phải tìm 40% của 800.'),
        ],
        remember: [
            'Cả hình tròn là 100%.',
            'Số lượng của một phần = tổng số × số phần trăm : 100.',
        ],
    }),
    'g5.bar_read': lesson('g5.bar_read', {
        v: 1,
        goal: 'đọc, so sánh được số liệu trên biểu đồ cột và tính tổng các số liệu.',
        hook: { md: 'Biểu đồ cột cho biết số ki-lô-gam giấy vụn các lớp thu được. Làm sao biết lớp nào thu nhiều nhất?', answer: 'Lớp có cột cao nhất thu nhiều nhất; số trên đầu cột là số ki-lô-gam.' },
        needs: ['g3.bar_chart'],
        know: [
            know('Đọc biểu đồ cột',
                pic('barChartSVG', BARS),
                text('Mỗi cột ứng với một lớp. Số trên đầu cột là số ki-lô-gam giấy vụn lớp đó thu được. Cột cao hơn là thu được nhiều hơn.'),
            ),
        ],
        forms: [
            form({
                id: 'doc', title: 'Dạng 1: Đọc số liệu một cột', level: 1,
                cue: 'Đề hỏi số liệu của một cột trên biểu đồ.',
                steps: ['Tìm cột có tên đề hỏi ở chân cột.', 'Đọc số trên đầu cột.', 'Trả lời kèm đơn vị.'],
                example: worked({
                    layout: 'calc', problem: 'Biểu đồ: Số ki-lô-gam giấy vụn các lớp thu được. Lớp 5B thu được bao nhiêu ki-lô-gam?',
                    visual: vis('barChartSVG', BARS),
                    steps: [step('Tìm cột "5B".'), step('Số trên đầu cột là 30.')],
                    answer: 'Lớp 5B thu được 30 kg giấy vụn.',
                }),
            }),
            form({
                id: 'tong', title: 'Dạng 2: Tổng, so sánh số liệu', level: 2,
                cue: 'Đề hỏi tổng của nhiều cột, hoặc cột này hơn cột kia bao nhiêu.',
                steps: ['Đọc số liệu các cột cần dùng.', 'Tổng: cộng lại. Hơn kém: trừ.', 'Trả lời câu hỏi.'],
                example: worked({
                    layout: 'calc', problem: 'Theo biểu đồ, cả bốn lớp thu được bao nhiêu ki-lô-gam giấy vụn? Lớp 5C thu nhiều hơn lớp 5D bao nhiêu ki-lô-gam?',
                    visual: vis('barChartSVG', BARS),
                    steps: [step('Cả bốn lớp thu được:', '45 + 30 + 60 + 25 = 160 (kg)'), step('Lớp 5C thu nhiều hơn lớp 5D:', '60 − 25 = 35 (kg)')],
                    answer: 'Cả bốn lớp thu được 160 kg; lớp 5C thu nhiều hơn lớp 5D 35 kg.',
                }),
            }),
        ],
        mistakes: [
            mistake('Hỏi tổng số giấy vụn cả bốn lớp, bạn Bi chỉ đọc cột cao nhất: 60 kg.', 'Cộng cả bốn cột: 45 + 30 + 60 + 25 = 160 (kg).', 'Hỏi "cả bốn lớp" thì phải cộng số liệu của tất cả các cột.'),
        ],
        remember: [
            'Tên cột ở chân cột, số liệu ở đầu cột.',
            'Hỏi tổng thì cộng; hỏi hơn kém thì trừ.',
        ],
    }),
    'g5.chance_ratio': lesson('g5.chance_ratio', {
        v: 1,
        goal: 'viết được tỉ số mô tả số lần lặp lại của một khả năng khi thực hiện nhiều lần.',
        hook: { md: 'Tung đồng xu 10 lần, có 6 lần xuất hiện mặt ngửa. Tỉ số của số lần mặt ngửa và tổng số lần tung là bao nhiêu?', answer: 'Tỉ số là 6 : 10 hay 6/10 = 3/5.' },
        needs: ['g5.ratio'],
        know: [
            know('Tỉ số mô tả khả năng',
                rule('Lấy số lần xuất hiện của khả năng đó chia cho tổng số lần thực hiện.', '{số lần xuất hiện} : {tổng số lần}'),
                text('Ví dụ: gieo xúc xắc 20 lần, có 9 lần xuất hiện mặt 6 chấm. Tỉ số là 9 : 20 hay 9/20.'),
            ),
        ],
        forms: [
            form({
                id: 'ti-so', title: 'Dạng 1: Viết tỉ số số lần xuất hiện', level: 2,
                cue: 'Đề cho tổng số lần thực hiện và số lần một khả năng xuất hiện.',
                steps: ['Tìm số lần xuất hiện của khả năng đề hỏi.', 'Tìm tổng số lần thực hiện.', 'Viết tỉ số: số lần xuất hiện : tổng số lần.'],
                example: worked({
                    layout: 'calc', problem: 'Gieo xúc xắc 20 lần, có 9 lần xuất hiện mặt 6 chấm. Tỉ số của số lần xuất hiện mặt 6 chấm và tổng số lần gieo là bao nhiêu?',
                    steps: [step('Số lần xuất hiện mặt 6 chấm là 9, tổng số lần gieo là 20.'), step('Tỉ số là:', '9 : 20 = 9/20')],
                    answer: 'Tỉ số là 9/20.',
                }),
            }),
        ],
        mistakes: [
            mistake('Tung đồng xu 10 lần, có 6 lần ngửa. Bạn Bi viết tỉ số là 6/4.', 'Tỉ số là 6/10 = 3/5.', 'Mẫu số là tổng số lần thực hiện (10), không phải số lần không xuất hiện (4).'),
        ],
        remember: [
            'Tỉ số = số lần xuất hiện : tổng số lần thực hiện.',
            'Mẫu số là tổng số lần thực hiện.',
        ],
    }),
} satisfies LessonBook;
