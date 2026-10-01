// Lớp 4 — Thống kê & xác suất (g4_statistics): dãy số liệu; biểu đồ cột; số lần xuất hiện của một sự kiện.
// Giữ createBarChartSVG: mathEngine dùng cho câu hỏi AI.
import { tpl, fromTemplates, single, choices, rint, pickOne, sample, chance, shuffle } from '../kit';
import { around } from '../wrongs';
import { barChartSVG } from '../svg';
import type { Template } from '../../study/types';

export const createBarChartSVG = (data: { label: string; value: number }[]) => barChartSVG(data);

const SETS: { title: string; unit: string; labels: string[] }[] = [
    { title: 'Số cây trồng được', unit: 'cây', labels: ['Lớp 4A', 'Lớp 4B', 'Lớp 4C', 'Lớp 4D'] },
    { title: 'Số học sinh đạt giải', unit: 'học sinh', labels: ['Toán', 'Tiếng Việt', 'Tiếng Anh', 'Tin học'] },
    { title: 'Số sách thư viện cho mượn', unit: 'quyển', labels: ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm'] },
    { title: 'Số ki-lô-gam giấy vụn', unit: 'kg', labels: ['Tổ 1', 'Tổ 2', 'Tổ 3', 'Tổ 4'] },
];
const distinct = (k: number, lo: number, hi: number) => sample(Array.from({ length: hi - lo + 1 }, (_, i) => lo + i), k);

export const templates: Template[] = [
    tpl('g4.data_series', 1, () => {
        const vals = Array.from({ length: rint(5, 7) }, () => rint(120, 160)), k = rint(1, vals.length);
        return single({ q: `Số đo chiều cao (cm) của một nhóm bạn là: ${vals.join('; ')}. Số thứ ${k} của dãy số liệu là:`, correct: vals[k - 1], wrong: vals.filter((_, i) => i !== k - 1), closed: true, min: 0,
            explanation: `Đếm từ trái sang phải, số thứ ${k} là ${vals[k - 1]}.` });
    }, { noRankCheck: true }),
    tpl('g4.data_series', 2, () => {
        const vals = distinct(rint(5, 6), 120, 160), most = chance(0.5), ans = most ? Math.max(...vals) : Math.min(...vals);
        if (chance(0.5)) return single({ q: `Số đo chiều cao (cm): ${vals.join('; ')}. Bạn ${most ? 'cao nhất' : 'thấp nhất'} cao bao nhiêu xăng-ti-mét?`, correct: ans, wrong: vals.filter(x => x !== ans), closed: true, format: x => `${x} cm`, explanation: `So sánh các số trong dãy: ${ans} là số ${most ? 'lớn' : 'bé'} nhất.` });
        return single({ q: `Dãy số liệu: ${vals.join('; ')} có bao nhiêu số?`, correct: vals.length, wrong: [vals.length + 1, vals.length - 1, vals.length + 2], explanation: `Đếm các số trong dãy: có ${vals.length} số.` });
    }, { noRankCheck: true }),
    tpl('g4.bar_chart', 1, () => {
        const s = pickOne(SETS), vals = distinct(4, 10, 60), k = rint(0, 3);
        return single({ q: `Biểu đồ "${s.title}". ${s.labels[k]} có bao nhiêu ${s.unit}?`, visual: { fn: 'barChartSVG', args: [s.labels.map((l, i) => ({ label: l, value: vals[i] }))] }, correct: vals[k], wrong: around(vals[k], { min: 0, step: chance(0.5) ? 1 : 5 }), min: 0,
            explanation: `Cột "${s.labels[k]}" ứng với ${vals[k]} ${s.unit}.` });
    }),
    tpl('g4.bar_chart', 2, () => {
        const s = pickOne(SETS), vals = distinct(4, 10, 60), most = chance(0.5), v = most ? Math.max(...vals) : Math.min(...vals);
        return choices({ q: `Biểu đồ "${s.title}". Cột nào có ${most ? 'nhiều' : 'ít'} ${s.unit} nhất?`, visual: { fn: 'barChartSVG', args: [s.labels.map((l, i) => ({ label: l, value: vals[i] }))] }, options: shuffle(s.labels), correct: s.labels[vals.indexOf(v)],
            explanation: `Cột ${most ? 'cao' : 'thấp'} nhất là ${s.labels[vals.indexOf(v)]} (${v} ${s.unit}).` });
    }),
    tpl('g4.bar_chart', 3, () => {
        const s = pickOne(SETS), vals = distinct(4, 10, 60), [i, j] = sample([0, 1, 2, 3], 2), total = vals.reduce((a, b) => a + b, 0);
        if (chance(0.5)) { const [hi, lo] = vals[i] > vals[j] ? [i, j] : [j, i]; return single({ q: `Biểu đồ "${s.title}". ${s.labels[hi]} nhiều hơn ${s.labels[lo]} bao nhiêu ${s.unit}?`, visual: { fn: 'barChartSVG', args: [s.labels.map((l, k) => ({ label: l, value: vals[k] }))] }, correct: vals[hi] - vals[lo], wrong: [vals[hi] + vals[lo], ...around(vals[hi] - vals[lo], { min: 1 })], min: 0, explanation: `${vals[hi]} - ${vals[lo]} = ${vals[hi] - vals[lo]} (${s.unit}).` }); }
        return single({ q: `Biểu đồ "${s.title}". Tổng số ${s.unit} của cả bốn cột là bao nhiêu?`, visual: { fn: 'barChartSVG', args: [s.labels.map((l, k) => ({ label: l, value: vals[k] }))] }, correct: total, wrong: around(total, { min: 1, step: 10 }), min: 0, explanation: `${vals.join(' + ')} = ${total} (${s.unit}).` });
    }),
    tpl('g4.events', 1, () => {
        const n = rint(20, 40), heads = rint(5, n - 5);
        return single({ q: `Tung một đồng xu ${n} lần, có ${heads} lần xuất hiện mặt sấp. Hỏi mặt ngửa xuất hiện bao nhiêu lần?`, correct: n - heads, wrong: [heads, n, n - heads + 1, n - heads - 1], min: 0,
            explanation: `Mỗi lần tung xuất hiện mặt sấp hoặc mặt ngửa: ${n} - ${heads} = ${n - heads} (lần).` });
    }),
    tpl('g4.events', 2, () => {
        const colors = ['đỏ', 'xanh', 'vàng'], counts = distinct(3, 3, 15), most = chance(0.5), v = most ? Math.max(...counts) : Math.min(...counts);
        return choices({ q: `Lấy bóng từ hộp ${counts.reduce((a, b) => a + b, 0)} lần (lấy xong lại trả vào), kết quả: đỏ ${counts[0]} lần, xanh ${counts[1]} lần, vàng ${counts[2]} lần. Màu nào xuất hiện ${most ? 'nhiều' : 'ít'} lần nhất?`,
            options: colors.map(c => `Màu ${c}`), correct: `Màu ${colors[counts.indexOf(v)]}`, explanation: `So sánh số lần: ${counts.join(', ')}. Màu ${colors[counts.indexOf(v)]} xuất hiện ${v} lần — ${most ? 'nhiều' : 'ít'} nhất.` });
    }),
];

export const generateStatistics = fromTemplates(templates);
