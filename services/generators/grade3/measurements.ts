// Lớp 3 — Đo lường (g3_measurements): mi-li-mét, gam, mi-li-lít trong tình huống; nhiệt độ °C.
import { tpl, fromTemplates, single, input, rint, pickOne, chance } from '../kit';
import { around } from '../wrongs';
import { fmt } from '../../study/value';
import type { Template } from '../../study/types';

const CONV: { big: string; small: string; f: number; bigName: string; smallName: string }[] = [
    { big: 'cm', small: 'mm', f: 10, bigName: 'xăng-ti-mét', smallName: 'mi-li-mét' },
    { big: 'm', small: 'mm', f: 1000, bigName: 'mét', smallName: 'mi-li-mét' },
    { big: 'kg', small: 'g', f: 1000, bigName: 'ki-lô-gam', smallName: 'gam' },
    { big: 'l', small: 'ml', f: 1000, bigName: 'lít', smallName: 'mi-li-lít' },
];

export const templates: Template[] = [
    tpl('g3.small_units', 1, () => {
        const c = pickOne(CONV), n = rint(1, 9);
        return chance(0.5)
            ? single({ q: `${n} ${c.big} = ? ${c.small}`, correct: n * c.f, wrong: [n * c.f * 10, n * c.f / 10, n * 10 === n * c.f ? n * 100 : n * 10, n + c.f], format: x => `${fmt(x)} ${c.small}`, min: 1,
                explanation: `1 ${c.big} = ${fmt(c.f)} ${c.small}, nên ${n} ${c.big} = ${n} × ${fmt(c.f)} = ${fmt(n * c.f)} ${c.small}.`, hint: `Nhớ: 1 ${c.big} = ${c.f} ${c.small}.` })
            : input({ q: `Điền số: ${fmt(n * c.f)} ${c.small} = ? ${c.big}`, correct: n, explanation: `${fmt(c.f)} ${c.small} = 1 ${c.big}, nên ${fmt(n * c.f)} ${c.small} = ${n} ${c.big}.` });
    }),
    tpl('g3.small_units', 2, () => {
        const c = pickOne(CONV.filter(x => x.f === 1000)), a = rint(1, 4), b = rint(50, 950);
        return single({ q: `${a} ${c.big} ${b} ${c.small} = ? ${c.small}`, correct: a * c.f + b, wrong: [a + b, a * 100 + b, a * c.f, a * c.f + b + 100], format: x => `${x} ${c.small}`, min: 1,
            explanation: `${a} ${c.big} = ${a * c.f} ${c.small}; ${a * c.f} + ${b} = ${a * c.f + b} (${c.small}).`, hint: `Đổi ${a} ${c.big} ra ${c.small} trước rồi cộng.` });
    }),
    tpl('g3.small_units', 3, () => {
        const kind = rint(0, 2);
        if (kind === 0) { const bottle = pickOne([250, 300, 330, 500]), n = rint(2, 4); return single({ q: `Mỗi chai nước có ${bottle} ml. ${n} chai như thế có bao nhiêu mi-li-lít nước?`, correct: bottle * n, wrong: [bottle + n, bottle * (n + 1), bottle * n + 100, bottle * n - 50], format: x => `${x} ml`, min: 1, explanation: `${bottle} × ${n} = ${bottle * n} (ml).` }); }
        if (kind === 1) { const pack = pickOne([200, 250, 400, 500]), n = rint(2, 4), total = pack * n; return single({ q: `Mẹ mua ${n} gói đường, mỗi gói nặng ${pack} g. Hỏi mẹ mua tất cả bao nhiêu gam đường?`, correct: total, wrong: [pack + n, total + pack, total - 100, total + 100], format: x => `${x} g`, min: 1, explanation: `${pack} × ${n} = ${total} (g).` }); }
        const total = 1000, used = pickOne([150, 250, 300, 400, 600]);
        return single({ q: `Bình có 1 l nước. Bạn Nam rót ra ${used} ml. Bình còn lại bao nhiêu mi-li-lít nước?`, correct: total - used, wrong: [1 + used, used, total - used + 100, total + used], format: x => `${x} ml`, min: 1,
            explanation: `1 l = 1000 ml; 1000 - ${used} = ${total - used} (ml).`, steps: ['Đổi 1 l = 1000 ml', `1000 - ${used} = ${total - used} (ml)`], hint: 'Đổi lít ra mi-li-lít trước.' });
    }),
    tpl('g3.temperature', 1, () => {
        const t = rint(1, 9) * 5;
        return single({ q: 'Nhiệt kế chỉ bao nhiêu độ C?', visual: { fn: 'thermometerSVG', args: [t] }, correct: t, wrong: around(t, { step: 5, min: 0, max: 50 }), format: x => `${x}°C`, min: 0, max: 50,
            explanation: `Đỉnh cột đỏ ngang vạch ${t}: nhiệt độ là ${t}°C.`, hint: 'Mỗi vạch nhỏ là 5 độ.' });
    }),
    tpl('g3.temperature', 1, () => {
        const a = rint(15, 30), b = rint(a + 2, 39), place = pickOne([['trong phòng', 'ngoài sân', 'Nơi'], ['buổi sáng', 'buổi trưa', 'Lúc'], ['ở Đà Lạt', 'ở Hà Nội', 'Nơi']]);
        return chance(0.5)
            ? single({ q: `Nhiệt độ ${place[0]} là ${a}°C, ${place[1]} là ${b}°C. ${place[2]} nào nóng hơn và hơn bao nhiêu độ?`, correct: b - a, wrong: [a + b, b - a + 1, b - a - 1, b - a + 5], format: x => `${place[1][0].toUpperCase() + place[1].slice(1)} nóng hơn ${x}°C`, min: 0,
                explanation: `${b}°C cao hơn ${a}°C; ${b} - ${a} = ${b - a} (°C).` })
            // lựa chọn sai tránh 36/38 °C (cũng gần thân nhiệt bình thường)
            : single({ q: `Nhiệt độ cơ thể người khoẻ mạnh khoảng bao nhiêu?`, correct: 37, wrong: pickOne([[17, 27, 47], [25, 30, 33], [40, 42, 45], [30, 40, 45]]), closed: true, format: x => `${x}°C`, explanation: 'Thân nhiệt người khoẻ mạnh khoảng 37°C.' });
    }),
];

export const generateG3Measurements = fromTemplates(templates);
