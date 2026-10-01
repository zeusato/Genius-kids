// Lớp 1 — Ngày trong tuần, xem lịch tờ, buổi trong ngày (g1_time).
import { tpl, fromTemplates, choices, single, rint, pickOne, shuffle, sample } from '../kit';
import type { Template } from '../../study/types';

/** 0 = Chủ nhật (khớp Date.getDay). Viết theo SGK: "thứ Hai", "Chủ nhật". */
export const DAYS = ['Chủ nhật', 'thứ Hai', 'thứ Ba', 'thứ Tư', 'thứ Năm', 'thứ Sáu', 'thứ Bảy'];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const PARTS = [['morning', 'Buổi sáng'], ['noon', 'Buổi trưa'], ['afternoon', 'Buổi chiều'], ['night', 'Buổi tối']] as const;
const ACTS: [string, string][] = [['Em đánh răng, rửa mặt sau khi ngủ dậy', 'Buổi sáng'], ['Em ngủ trưa', 'Buổi trưa'], ['Em tập thể dục cùng ông lúc trời vừa sáng', 'Buổi sáng'], ['Em ra sân đá bóng sau giờ học, trước bữa tối', 'Buổi chiều'], ['Em đi ngủ', 'Buổi tối'], ['Trên trời có trăng và sao', 'Buổi tối'], ['Em ăn sáng rồi đến trường', 'Buổi sáng'], ['Em ăn cơm trưa ở trường', 'Buổi trưa'], ['Em tan học về nhà', 'Buổi chiều'], ['Cả nhà ăn cơm tối, xem ti vi', 'Buổi tối'], ['Mặt trời mọc', 'Buổi sáng'], ['Mặt trời lặn', 'Buổi chiều']];

const dayOpts = (ans: string) => shuffle([ans, ...sample(DAYS.filter(d => d !== ans), 3)]).map(cap);

export const templates: Template[] = [
    tpl('g1.weekday', 1, () => {
        const d = rint(0, 6), next = pickOne([true, false]);
        const ans = DAYS[(d + (next ? 1 : 6)) % 7];
        return choices({ q: `Hôm nay là ${DAYS[d]}. ${next ? 'Ngày mai' : 'Hôm qua'} là thứ mấy?`, speech: `Hôm nay là ${DAYS[d]}. ${next ? 'Ngày mai' : 'Hôm qua'} là thứ mấy?`,
            options: dayOpts(ans), correct: cap(ans), explanation: `${next ? 'Sau' : 'Trước'} ${DAYS[d]} là ${ans}.`, hint: 'Thứ tự trong tuần: thứ Hai, thứ Ba, … thứ Bảy, Chủ nhật.' });
    }),
    tpl('g1.weekday', 2, () => {
        const d = rint(0, 6), k = rint(2, 4), ans = DAYS[(d + k) % 7];
        if (rint(0, 3) === 0) return single({ q: 'Một tuần lễ có mấy ngày?', speech: 'Một tuần lễ có mấy ngày?', correct: 7, wrong: [5, 6, 8, 10], explanation: 'Một tuần có 7 ngày: thứ Hai, thứ Ba, thứ Tư, thứ Năm, thứ Sáu, thứ Bảy, Chủ nhật.' });
        return choices({ q: `Hôm nay là ${DAYS[d]}. ${k} ngày nữa là thứ mấy?`, speech: `Hôm nay là ${DAYS[d]}. ${k} ngày nữa là thứ mấy?`,
            options: dayOpts(ans), correct: cap(ans), explanation: `Đếm tiếp ${k} ngày từ ${DAYS[d]}: ${Array.from({ length: k }, (_, i) => DAYS[(d + i + 1) % 7]).join(', ')}.` });
    }),
    tpl('g1.calendar_day', 1, () => {
        const day = rint(1, 30), month = rint(1, 12), wd = rint(0, 6), ask = pickOne(['wd', 'day', 'month'] as const);
        const visual = { fn: 'calendarDaySVG', args: [day, month, wd] };
        if (ask === 'wd') return choices({ q: 'Tờ lịch cho biết hôm nay là thứ mấy?', speech: 'Tờ lịch cho biết hôm nay là thứ mấy?', visual, options: dayOpts(DAYS[wd]), correct: cap(DAYS[wd]), explanation: `Dòng chữ dưới số ngày ghi ${DAYS[wd]}.` });
        if (ask === 'day') return single({ q: 'Tờ lịch cho biết hôm nay là ngày bao nhiêu?', speech: 'Tờ lịch cho biết hôm nay là ngày bao nhiêu?', visual, correct: day, wrong: [day + 1, day - 1, month, day + 10].filter(x => x !== day), min: 1, max: 31, format: n => `Ngày ${n}`, explanation: `Số to ở giữa tờ lịch là ngày: ngày ${day}.` });
        return single({ q: 'Tờ lịch cho biết đang là tháng mấy?', speech: 'Tờ lịch cho biết đang là tháng mấy?', visual, correct: month, wrong: [month + 1, month - 1, day <= 12 ? day : (month + 5) % 12 + 1], min: 1, max: 12, format: n => `Tháng ${n}`, explanation: `Dòng trên cùng của tờ lịch ghi tháng ${month}.` });
    }, { noRankCheck: true }),
    tpl('g1.daytime', 1, () => {
        if (rint(0, 1)) {
            const [kind, name] = pickOne(PARTS);
            return choices({ q: 'Bức tranh vẽ buổi nào trong ngày?', speech: 'Bức tranh vẽ buổi nào trong ngày?', visual: { fn: 'dayPartSVG', args: [kind] }, options: PARTS.map(p => p[1]), correct: name,
                explanation: kind === 'night' ? 'Trời tối, có trăng sao: buổi tối.' : kind === 'noon' ? 'Mặt trời lên cao nhất: buổi trưa.' : kind === 'morning' ? 'Mặt trời vừa mọc: buổi sáng.' : 'Mặt trời sắp lặn: buổi chiều.' });
        }
        const [act, part] = pickOne(ACTS);
        return choices({ q: `"${act}" thường vào buổi nào?`, speech: `${act} thường vào buổi nào?`, options: PARTS.map(p => p[1]), correct: part, explanation: `${act} thường vào ${part.toLowerCase()}.` });
    }),
];

export const generateTime = fromTemplates(templates);
