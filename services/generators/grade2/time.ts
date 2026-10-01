// Lớp 2 — Thời gian & lịch (g2_time_calendar): đồng hồ (kim phút chỉ 3, 6), ngày – giờ, lịch tháng.
import { tpl, fromTemplates, single, choices, rint, pickOne, chance, shuffle, sample } from '../kit';
import type { Template } from '../../study/types';

const DAYS = ['Chủ nhật', 'thứ Hai', 'thứ Ba', 'thứ Tư', 'thứ Năm', 'thứ Sáu', 'thứ Bảy'];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const read = (h: number, m: number) => (m === 0 ? `${h} giờ` : m === 30 ? `${h} giờ 30 phút` : `${h} giờ ${m} phút`);

export const templates: Template[] = [
    tpl('g2.clock', 1, () => {
        const h = rint(1, 12), m = pickOne([0, 15, 30]);
        const opts = shuffle([...new Set([read(h, m), read(h, m === 15 ? 30 : 15), read(h === 12 ? 1 : h + 1, m), read(h, m === 0 ? 30 : 0)])]);
        return choices({ q: 'Đồng hồ chỉ mấy giờ?', speech: 'Đồng hồ chỉ mấy giờ?', visual: { fn: 'clockSVG', args: [h, m] }, options: opts, correct: read(h, m),
            explanation: m === 0 ? `Kim ngắn chỉ số ${h}, kim dài chỉ số 12: ${h} giờ.` : `Kim ngắn chỉ qua số ${h}, kim dài chỉ số ${m === 15 ? 3 : 6}: ${read(h, m)}.`, hint: 'Kim dài chỉ số 3 là 15 phút, chỉ số 6 là 30 phút.' });
    }, { weight: 2 }),
    tpl('g2.clock', 2, () => {
        const h = rint(7, 9), m = pickOne([0, 15, 30]), add = pickOne([1, 2]);
        return choices({ q: `Em bắt đầu học bài lúc ${read(h, m)}, học trong ${add} giờ. Em học xong lúc mấy giờ?`, speech: `Em bắt đầu học bài lúc ${read(h, m)}, học trong ${add} giờ. Em học xong lúc mấy giờ?`,
            options: shuffle([...new Set([read(h + add, m), read(h + add - 1, m), read(h + add + 1, m), read(h + add, m === 30 ? 0 : 30)])]), correct: read(h + add, m),
            explanation: `${read(h, m)} thêm ${add} giờ là ${read(h + add, m)}.` });
    }),
    tpl('g2.hours_day', 1, () => {
        if (chance(0.4)) return single({ q: 'Một ngày có bao nhiêu giờ?', speech: 'Một ngày có bao nhiêu giờ?', correct: 24, wrong: [12, 60, 30, 20], explanation: 'Một ngày có 24 giờ, tính từ 12 giờ đêm hôm trước đến 12 giờ đêm hôm sau.' });
        const h = rint(13, 23);
        return choices({ q: `${h} giờ còn gọi là mấy giờ?`, speech: `${h} giờ còn gọi là mấy giờ?`, options: shuffle([`${h - 12} giờ ${h < 18 ? 'chiều' : 'tối'}`, `${h - 10} giờ ${h < 18 ? 'chiều' : 'tối'}`, `${h - 12} giờ sáng`, `${h - 11} giờ ${h < 18 ? 'chiều' : 'tối'}`]),
            correct: `${h - 12} giờ ${h < 18 ? 'chiều' : 'tối'}`, explanation: `Sau 12 giờ trưa, ta bớt 12: ${h} - 12 = ${h - 12}, nên ${h} giờ là ${h - 12} giờ ${h < 18 ? 'chiều' : 'tối'}.` });
    }, { noRankCheck: true }),
    tpl('g2.hours_day', 2, () => {
        const h = rint(1, 3) * 60;
        return chance(0.5)
            ? single({ q: `${h / 60} giờ = ? phút`, speech: `${h / 60} giờ bằng bao nhiêu phút?`, correct: h, wrong: [h / 60 * 100, h / 60 * 10, h + 60, h - 30], format: x => `${x} phút`, min: 1, max: 400, explanation: `1 giờ = 60 phút, nên ${h / 60} giờ = ${h} phút.` })
            : single({ q: 'Một giờ có bao nhiêu phút?', speech: 'Một giờ có bao nhiêu phút?', correct: 60, wrong: [100, 24, 30, 12], format: x => `${x} phút`, explanation: '1 giờ = 60 phút.' });
    }),
    tpl('g2.calendar_month', 1, () => {
        const month = rint(1, 12), start = rint(0, 6), days = MONTH_DAYS[month - 1], d = rint(1, days);
        const wd = (start + d - 1) % 7, ans = DAYS[wd];
        return choices({ q: `Xem tờ lịch tháng ${month}. Ngày ${d} tháng ${month} là thứ mấy?`, speech: `Xem tờ lịch tháng ${month}. Ngày ${d} là thứ mấy?`, visual: { fn: 'calendarMonthSVG', args: [month, start, days, d] },
            options: shuffle([ans, ...sample(DAYS.filter(x => x !== ans), 3)]).map(cap), correct: cap(ans), explanation: `Ngày ${d} (được khoanh tròn) nằm ở cột ${ans}.`, hint: 'Dóng thẳng ngày được khoanh lên hàng tên các thứ.' });
    }),
    tpl('g2.calendar_month', 2, () => {
        const month = rint(1, 12), start = rint(0, 6), days = MONTH_DAYS[month - 1];
        if (chance(0.5)) return single({ q: `Tháng ${month} có bao nhiêu ngày?`, speech: `Tháng ${month} có bao nhiêu ngày?`, visual: { fn: 'calendarMonthSVG', args: [month, start, days] },
            correct: days, wrong: [28, 29, 30, 31].filter(x => x !== days), closed: true, explanation: `Ngày cuối cùng của tháng ${month} trên tờ lịch là ngày ${days}.` });
        const d = rint(1, days - 7), wd = (start + d - 1) % 7;
        return single({ q: `Ngày ${d} tháng ${month} là ${DAYS[wd]}. ${DAYS[wd][0].toUpperCase() + DAYS[wd].slice(1)} tuần sau là ngày bao nhiêu?`, speech: `Ngày ${d} tháng ${month} là ${DAYS[wd]}. ${DAYS[wd]} tuần sau là ngày bao nhiêu?`,
            visual: { fn: 'calendarMonthSVG', args: [month, start, days, d] }, correct: d + 7, wrong: [d + 6, d + 8, d + 1, d + 14 <= days ? d + 14 : d + 5], min: 1, max: days, format: x => `Ngày ${x}`,
            explanation: `Một tuần có 7 ngày: ${d} + 7 = ${d + 7}.`, hint: 'Cùng một thứ ở tuần sau thì cộng thêm 7 ngày.' });
    }, { noRankCheck: true }),
];

export const generateG2Time = fromTemplates(templates);
