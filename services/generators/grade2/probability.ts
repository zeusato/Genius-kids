// Lớp 2 — Làm quen với khả năng xảy ra: chắc chắn, có thể, không thể (g2_probability) — MỚI theo GDPT 2018.
import { tpl, fromTemplates, choices, rint, pickOne, sample } from '../kit';
import type { Template } from '../../study/types';
import type { ColorKey } from '../svg';

const COLOR_NAME: Partial<Record<ColorKey, string>> = { red: 'đỏ', blue: 'xanh', yellow: 'vàng', green: 'xanh lá' };
const OPTIONS = ['Chắc chắn', 'Có thể', 'Không thể'];
const EVENTS: [string, string][] = [
    ['Ngày mai mặt trời mọc ở đằng đông', 'Chắc chắn'], ['Hôm nay trời mưa', 'Có thể'], ['Con mèo biết bay', 'Không thể'],
    ['Tung đồng xu được mặt sấp', 'Có thể'], ['Thứ Hai đến sau Chủ nhật', 'Chắc chắn'], ['Một tuần có 8 ngày', 'Không thể'],
    ['Em gặp bạn ở công viên', 'Có thể'], ['Con cá sống trên cây', 'Không thể'], ['Sau mùa đông là mùa xuân', 'Chắc chắn'],
    ['Gieo xúc xắc được mặt 6 chấm', 'Có thể'], ['Một năm có 12 tháng', 'Chắc chắn'], ['Viên đá nổi trên mặt nước như quả bóng', 'Không thể'],
    ['Chiều nay lớp em được đi tham quan', 'Có thể'], ['Nước đá để ngoài nắng sẽ tan', 'Chắc chắn'], ['Bạn nhỏ cao hơn cái cây cổ thụ', 'Không thể'],
];

export const templates: Template[] = [
    tpl('g2.chance', 1, () => {
        const [ev, ans] = pickOne(EVENTS);
        return choices({ q: `Khả năng xảy ra của sự kiện: "${ev}" là:`, speech: `${ev}. Việc này chắc chắn, có thể hay không thể xảy ra?`, options: OPTIONS, correct: ans,
            explanation: ans === 'Chắc chắn' ? 'Việc này luôn luôn xảy ra.' : ans === 'Có thể' ? 'Việc này lúc xảy ra, lúc không.' : 'Việc này không bao giờ xảy ra.' });
    }),
    tpl('g2.chance', 2, () => {
        const colors = sample(['red', 'blue', 'yellow', 'green'] as ColorKey[], 3), kind = rint(0, 2);
        // 0: hộp chỉ có 1 màu → chắc chắn; 1: hộp 2 màu → có thể; 2: màu không có trong hộp → không thể
        const balls = kind === 0 ? [{ color: colors[0], n: rint(4, 8) }] : [{ color: colors[0], n: rint(2, 5) }, { color: colors[1], n: rint(2, 5) }];
        const asked = kind === 2 ? colors[2] : colors[0];
        const ans = OPTIONS[kind];
        return choices({ q: `Lấy ra 1 viên bi từ hộp. Khả năng lấy được bi màu ${COLOR_NAME[asked]} là:`, speech: `Lấy ra một viên bi từ hộp. Việc lấy được bi màu ${COLOR_NAME[asked]} là chắc chắn, có thể hay không thể?`,
            visual: { fn: 'bagSVG', args: [balls] }, options: OPTIONS, correct: ans,
            explanation: kind === 0 ? `Trong hộp toàn bi màu ${COLOR_NAME[asked]}, nên chắc chắn lấy được bi màu ${COLOR_NAME[asked]}.` : kind === 1 ? `Hộp có bi màu ${COLOR_NAME[colors[0]]} và màu ${COLOR_NAME[colors[1]]}, nên có thể lấy được bi màu ${COLOR_NAME[asked]}.` : `Trong hộp không có bi màu ${COLOR_NAME[asked]}, nên không thể lấy được.`,
            hint: 'Quan sát trong hộp có những màu bi nào.' });
    }),
];

export const generateG2Probability = fromTemplates(templates);
