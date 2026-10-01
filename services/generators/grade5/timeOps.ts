// Lớp 5 — Số đo thời gian (g5_time_ops): cộng, trừ; nhân, chia số đo thời gian với một số.
import { tpl, fromTemplates, single, rint, chance } from '../kit';
import type { Template } from '../../study/types';

const hm = (m: number) => (m % 60 === 0 ? `${m / 60} giờ` : m < 60 ? `${m} phút` : `${Math.floor(m / 60)} giờ ${m % 60} phút`);
const ms = (s: number) => (s % 60 === 0 ? `${s / 60} phút` : s < 60 ? `${s} giây` : `${Math.floor(s / 60)} phút ${s % 60} giây`);

export const templates: Template[] = [
    tpl('g5.time_addsub', 1, () => {
        const a = rint(1, 5) * 60 + rint(1, 11) * 5, b = rint(0, 3) * 60 + rint(1, 11) * 5, plus = chance(0.5);
        const [x, y] = plus ? [a, b] : [Math.max(a, b) + 60, Math.min(a, b)], r = plus ? x + y : x - y;
        return single({ q: `Tính: ${hm(x)} ${plus ? '+' : '-'} ${hm(y)} = ?`, correct: r, wrong: [r + 60, r - 40 > 0 ? r - 40 : r + 40, r + 10, Math.abs(r - 60) || r + 120], format: hm, min: 1,
            explanation: plus ? `Cộng giờ với giờ, phút với phút; phút từ 60 trở lên thì đổi ra giờ: ${hm(x)} + ${hm(y)} = ${hm(r)}.` : `Trừ phút với phút (không đủ thì đổi 1 giờ = 60 phút), giờ với giờ: ${hm(x)} - ${hm(y)} = ${hm(r)}.`,
            hint: '1 giờ = 60 phút.' });
    }, { noRankCheck: true }),
    tpl('g5.time_addsub', 2, () => {
        const s1 = rint(6, 9) * 60 + rint(0, 11) * 5, dur = rint(1, 3) * 60 + rint(1, 11) * 5;
        return single({ q: `Một chuyến tàu khởi hành lúc ${hm(s1)} và đi hết ${hm(dur)}. Hỏi tàu đến nơi lúc mấy giờ?`, correct: s1 + dur, wrong: [s1 + dur + 60, s1 + dur - 60, s1 + dur + 10, s1 + dur - 5], format: hm, min: 1,
            explanation: `${hm(s1)} + ${hm(dur)} = ${hm(s1 + dur)}.` });
    }, { noRankCheck: true }),
    tpl('g5.time_muldiv', 2, () => {
        const mul = chance(0.5), sec = chance(0.4);
        if (mul) { const a = sec ? rint(1, 4) * 60 + rint(5, 50) : rint(1, 3) * 60 + rint(5, 50), k = rint(2, 5), r = a * k, f = sec ? ms : hm; return single({ q: `Tính: ${f(a)} × ${k} = ?`, correct: r, wrong: [r + 60, r - 60 > 0 ? r - 60 : r + 120, a + k, r + 10], format: f, min: 1, explanation: `Nhân lần lượt từng đơn vị rồi đổi: ${f(a)} × ${k} = ${f(r)}.`, hint: sec ? '60 giây = 1 phút.' : '60 phút = 1 giờ.' }); }
        const k = rint(2, 5), q = rint(1, 3) * 60 + rint(1, 11) * 5, a = q * k;
        return single({ q: `Tính: ${hm(a)} : ${k} = ?`, correct: q, wrong: [q + 60, q + 10, Math.abs(q - 10), q * 2], format: hm, min: 1,
            explanation: `Đổi ra phút: ${a} phút : ${k} = ${q} phút = ${hm(q)}.`, hint: 'Đổi ra phút rồi chia.' });
    }, { noRankCheck: true }),
];

export const generateG5TimeOps = fromTemplates(templates);
