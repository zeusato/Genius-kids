// Lớp 3 — Thời gian (g3_time) — MỚI: xem đồng hồ chính xác đến phút; tháng – năm; khoảng thời gian.
import { tpl, fromTemplates, single, choices, rint, pickOne, chance, shuffle } from '../kit';
import type { Template } from '../../study/types';

const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const DAYS = ['Chủ nhật', 'thứ Hai', 'thứ Ba', 'thứ Tư', 'thứ Năm', 'thứ Sáu', 'thứ Bảy'];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const read = (h: number, m: number) => (m === 0 ? `${h} giờ` : `${h} giờ ${m} phút`);
const toMin = (h: number, m: number) => h * 60 + m;

export const templates: Template[] = [
    tpl('g3.clock_minute', 1, () => {
        const h = rint(1, 12), m = rint(1, 11) * 5;
        const opts = [...new Set([read(h, m), read(h, (m + 5) % 60 || 5), read(h === 12 ? 1 : h + 1, m), read(h, m >= 30 ? m - 15 : m + 15)])];
        return choices({ q: 'Đồng hồ chỉ mấy giờ?', visual: { fn: 'clockSVG', args: [h, m] }, options: shuffle(opts), correct: read(h, m),
            explanation: `Kim ngắn chỉ quá số ${h}, kim dài chỉ số ${m / 5}: ${m / 5} × 5 = ${m} phút. Đồng hồ chỉ ${read(h, m)}.`, hint: 'Mỗi số trên mặt đồng hồ ứng với 5 phút.' });
    }, { weight: 2 }),
    tpl('g3.clock_minute', 2, () => {
        const h = rint(1, 11), m = pickOne([35, 40, 45, 50, 55]), left = 60 - m;
        if (chance(0.5)) return choices({ q: `Đồng hồ chỉ ${read(h, m)}. Còn gọi là:`, options: shuffle([`${h + 1} giờ kém ${left} phút`, `${h} giờ kém ${left} phút`, `${h + 1} giờ kém ${m} phút`, `${h + 1} giờ ${left} phút`]), correct: `${h + 1} giờ kém ${left} phút`,
            explanation: `Còn ${left} phút nữa là ${h + 1} giờ, nên ${read(h, m)} còn gọi là ${h + 1} giờ kém ${left} phút.` });
        const mm = rint(1, 59);
        return choices({ q: 'Đồng hồ chỉ mấy giờ?', visual: { fn: 'clockSVG', args: [h, mm] }, options: shuffle([...new Set([read(h, mm), read(h, (mm + 10) % 60 || 10), read(h + 1, mm), read(h, Math.abs(mm - 5) || 1)])]), correct: read(h, mm),
            explanation: `Kim dài chỉ ${mm} phút (đếm từng vạch nhỏ), kim ngắn ở giữa số ${h} và ${h + 1}: ${read(h, mm)}.` });
    }),
    tpl('g3.month_year', 1, () => {
        if (chance(0.3)) return single({ q: 'Một năm có bao nhiêu tháng?', correct: 12, wrong: [10, 11, 7, 30, 52], explanation: 'Một năm có 12 tháng: từ tháng Một đến tháng Mười Hai.' });
        const mo = pickOne([1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]), d = MONTH_DAYS[mo - 1];
        return single({ q: `Tháng ${mo} có bao nhiêu ngày?`, correct: d, wrong: [28, 29, 30, 31].filter(x => x !== d), closed: true, format: x => `${x} ngày`,
            explanation: `Tháng ${mo} có ${d} ngày.`, hint: 'Nắm tay đếm khớp: tháng ở chỗ lồi có 31 ngày, chỗ lõm có 30 ngày (trừ tháng Hai).' });
    }, { noRankCheck: true }),
    tpl('g3.month_year', 2, () => {
        const mo = rint(1, 11), days = MONTH_DAYS[mo - 1], d = rint(days - 6, days), wd = rint(0, 6), k = rint(3, 10);
        const target = d + k, nextMonth = target > days, dd = nextMonth ? target - days : target, ans = DAYS[(wd + k) % 7];
        return choices({ q: `Ngày ${d} tháng ${mo} là ${DAYS[wd]}. Hỏi ngày ${dd} tháng ${nextMonth ? mo + 1 : mo} là thứ mấy?`, options: shuffle([ans, ...DAYS.filter(x => x !== ans).slice(0, 3)]).map(cap), correct: cap(ans),
            explanation: `Tháng ${mo} có ${days} ngày. Từ ngày ${d}/${mo} đến ngày ${dd}/${nextMonth ? mo + 1 : mo} là ${k} ngày; đếm tiếp ${k} ngày từ ${DAYS[wd]} được ${ans}.`, hint: 'Nhớ xem tháng đó có bao nhiêu ngày.' });
    }),
    tpl('g3.duration', 2, () => {
        const h1 = rint(6, 15), m1 = pickOne([0, 15, 30]), dur = pickOne([30, 45, 60, 75, 90, 120]), e = toMin(h1, m1) + dur;
        const fmtDur = (x: number) => (x < 60 ? `${x} phút` : x % 60 === 0 ? `${x / 60} giờ` : `${Math.floor(x / 60)} giờ ${x % 60} phút`);
        return single({ q: `Bộ phim bắt đầu lúc ${read(h1, m1)} và kết thúc lúc ${read(Math.floor(e / 60), e % 60)}. Bộ phim dài bao lâu?`, correct: dur, wrong: [dur + 15, dur - 15, dur + 30, dur + 60].filter(x => x > 0), format: fmtDur, min: 1,
            explanation: `Từ ${read(h1, m1)} đến ${read(Math.floor(e / 60), e % 60)} là ${fmtDur(dur)}.`, hint: 'Đếm thêm từng giờ, rồi từng phút.' });
    }),
    tpl('g3.duration', 3, () => {
        const h1 = rint(6, 9), m1 = pickOne([0, 15, 30, 45]), dur = pickOne([20, 25, 35, 40, 50]), e = toMin(h1, m1) + dur;
        const end = read(Math.floor(e / 60), e % 60);
        return choices({ q: `Em bắt đầu làm bài lúc ${read(h1, m1)}. Em làm bài hết ${dur} phút. Hỏi em làm xong lúc mấy giờ?`, options: shuffle([...new Set([end, read(Math.floor((e + 10) / 60), (e + 10) % 60), read(h1 + 1, m1), read(Math.floor((e - 5) / 60), (e - 5) % 60)])]), correct: end,
            explanation: `${read(h1, m1)} thêm ${dur} phút là ${end}.`, hint: '60 phút bằng 1 giờ.' });
    }),
];

export const generateG3Time = fromTemplates(templates);
