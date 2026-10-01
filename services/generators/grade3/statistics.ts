// Lớp 3 — Bảng số liệu (g3_statistics): đọc, so sánh, tính tổng. Biểu đồ cột là "Nâng cao" (Lớp 4).
// Bảng số liệu viết bằng bảng Markdown trong đề (màn làm bài hiển thị bảng).
import { tpl, fromTemplates, single, choices, rint, pickOne, sample, chance } from '../kit';
import { around } from '../wrongs';
import type { Template } from '../../study/types';

const SETS: { title: string; unit: string; col: string; labels: string[] }[] = [
    { title: 'Số cây trồng được của các lớp', unit: 'cây', col: 'Lớp', labels: ['3A', '3B', '3C', '3D'] },
    { title: 'Số học sinh tham gia câu lạc bộ', unit: 'học sinh', col: 'Câu lạc bộ', labels: ['Bóng đá', 'Cờ vua', 'Vẽ', 'Múa'] },
    { title: 'Số quyển sách thư viện cho mượn', unit: 'quyển', col: 'Ngày', labels: ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm'] },
    { title: 'Số ki-lô-gam giấy vụn thu được', unit: 'kg', col: 'Tổ', labels: ['Tổ 1', 'Tổ 2', 'Tổ 3', 'Tổ 4'] },
];
const table = (s: typeof SETS[number], labels: string[], vals: number[]) =>
    `**${s.title}**\n\n| ${s.col} | ${labels.join(' | ')} |\n|${' :-: |'.repeat(labels.length + 1)}\n| Số ${s.unit} | ${vals.join(' | ')} |`;
/** "Tổ 2", "Thứ Ba", "Lớp 3A", "Câu lạc bộ Vẽ" (không lặp "Tổ Tổ 2"); giữ thứ tự tự nhiên của cột */
const nameOf = (s: typeof SETS[number], label: string) => (label.startsWith(s.col) || s.col === 'Ngày' ? label : `${s.col} ${label}`);
const distinct = (k: number, lo: number, hi: number) => sample(Array.from({ length: hi - lo + 1 }, (_, i) => lo + i), k);

export const templates: Template[] = [
    tpl('g3.data_table', 1, () => {
        const s = pickOne(SETS), labels = [...s.labels], vals = distinct(4, 10, 60), k = rint(0, 3);
        return single({ q: `${table(s, labels, vals)}\n\n${nameOf(s, labels[k])} có bao nhiêu ${s.unit}?`, correct: vals[k], wrong: vals.filter((_, i) => i !== k), closed: true, min: 0,
            explanation: `Tìm cột "${labels[k]}" trong bảng: ${vals[k]} ${s.unit}.` });
    }, { noRankCheck: true }),
    tpl('g3.data_table', 2, () => {
        const s = pickOne(SETS), labels = [...s.labels], vals = distinct(4, 10, 60), kind = rint(0, 2);
        const q = table(s, labels, vals);
        if (kind === 0) { const most = chance(0.5), v = most ? Math.max(...vals) : Math.min(...vals), ans = labels[vals.indexOf(v)]; return choices({ q: `${q}\n\n${s.col} nào có ${most ? 'nhiều' : 'ít'} ${s.unit} nhất?`, options: labels, correct: ans, explanation: `So sánh các số ${vals.join(', ')}: ${v} là ${most ? 'lớn' : 'bé'} nhất, thuộc về ${ans}.` }); }
        if (kind === 1) { const [i, j] = sample([0, 1, 2, 3], 2), [hi, lo] = vals[i] > vals[j] ? [i, j] : [j, i]; return single({ q: `${q}\n\n${nameOf(s, labels[hi])} nhiều hơn ${nameOf(s, labels[lo])} bao nhiêu ${s.unit}?`, correct: vals[hi] - vals[lo], wrong: [vals[hi] + vals[lo], ...around(vals[hi] - vals[lo], { min: 0 })], min: 0, explanation: `${vals[hi]} - ${vals[lo]} = ${vals[hi] - vals[lo]} (${s.unit}).` }); }
        const total = vals.reduce((a, b) => a + b, 0);
        return single({ q: `${q}\n\nCả bốn ${s.col.toLowerCase()} có tất cả bao nhiêu ${s.unit}?`, correct: total, wrong: around(total, { min: 0, step: chance(0.5) ? 1 : 10 }), min: 0, explanation: `${vals.join(' + ')} = ${total} (${s.unit}).` });
    }),
    tpl('g3.bar_chart', 2, () => {
        const s = pickOne(SETS), labels = [...s.labels], vals = distinct(4, 2, 12), k = rint(0, 3);
        return single({ q: `Theo biểu đồ, ${nameOf(s, labels[k])} có bao nhiêu ${s.unit}?`, visual: { fn: 'barChartSVG', args: [labels.map((l, i) => ({ label: l, value: vals[i] }))] }, correct: vals[k], wrong: around(vals[k], { min: 0 }), min: 0,
            explanation: `Cột ${labels[k]} cao đến vạch ${vals[k]}.` });
    }),
];

export const generateG3Statistics = fromTemplates(templates);
