// Lớp 2 — Thu thập, kiểm đếm số liệu; biểu đồ tranh (g2_statistics) — MỚI theo GDPT 2018.
import { tpl, fromTemplates, single, choices, rint, pickOne, sample, chance } from '../kit';
import { around } from '../wrongs';
import type { Template } from '../../study/types';

const SETS: { what: string; unit: string; emoji: string; labels: string[] }[] = [
    { what: 'quả', unit: 'quả', emoji: '🍎', labels: ['Táo', 'Cam', 'Chuối', 'Lê'] },
    { what: 'bạn thích môn', unit: 'bạn', emoji: '🙂', labels: ['Bơi', 'Đá bóng', 'Cầu lông', 'Nhảy dây'] },
    { what: 'cây', unit: 'cây', emoji: '🌳', labels: ['Lớp 2A', 'Lớp 2B', 'Lớp 2C', 'Lớp 2D'] },
    { what: 'con vật', unit: 'con', emoji: '🐔', labels: ['Gà', 'Vịt', 'Ngan', 'Ngỗng'] },
];

/** Số liệu khác nhau đôi một (tránh hoà khi hỏi nhiều nhất / ít nhất). */
const distinctCounts = (k: number, lo: number, hi: number) => sample(Array.from({ length: hi - lo + 1 }, (_, i) => lo + i), k);

export const templates: Template[] = [
    tpl('g2.tally', 1, () => {
        const s = pickOne(SETS), labels = sample(s.labels, 3), counts = distinctCounts(3, 2, 12), k = rint(0, 2);
        return single({ q: `Theo bảng kiểm đếm, "${labels[k]}" có bao nhiêu ${s.unit}?`, speech: `Đếm các vạch trong bảng kiểm đếm. ${labels[k]} có bao nhiêu ${s.unit}?`,
            visual: { fn: 'tallySVG', args: [labels.map((l, i) => ({ label: l, n: counts[i] }))] }, correct: counts[k], wrong: around(counts[k], { min: 0, max: 20 }), min: 0, max: 20,
            explanation: `Mỗi bó có 5 vạch (vạch thứ năm gạch chéo). "${labels[k]}" có ${counts[k]} vạch.`, hint: 'Đếm theo từng bó 5 rồi đếm thêm vạch lẻ.' });
    }),
    tpl('g2.tally', 2, () => {
        const s = pickOne(SETS), labels = sample(s.labels, 3), counts = distinctCounts(3, 2, 12), most = chance(0.5);
        const ans = labels[counts.indexOf(most ? Math.max(...counts) : Math.min(...counts))];
        return choices({ q: `Theo bảng kiểm đếm, loại nào có ${most ? 'nhiều' : 'ít'} ${s.unit} nhất?`, speech: `Theo bảng kiểm đếm, loại nào có ${most ? 'nhiều' : 'ít'} nhất?`,
            visual: { fn: 'tallySVG', args: [labels.map((l, i) => ({ label: l, n: counts[i] }))] }, options: labels, correct: ans,
            explanation: `Đếm vạch: ${labels.map((l, i) => `${l} ${counts[i]}`).join(', ')}. ${ans} ${most ? 'nhiều' : 'ít'} nhất.` });
    }),
    tpl('g2.pictograph', 1, () => {
        const s = pickOne(SETS), labels = sample(s.labels, 4), counts = distinctCounts(4, 1, 8), k = rint(0, 3);
        return single({ q: `Theo biểu đồ tranh, "${labels[k]}" có bao nhiêu ${s.unit}?`, speech: `Theo biểu đồ tranh, ${labels[k]} có bao nhiêu ${s.unit}?`,
            visual: { fn: 'pictographSVG', args: [labels.map((l, i) => ({ label: l, n: counts[i] })), s.emoji] }, correct: counts[k], wrong: around(counts[k], { min: 0, max: 10 }), min: 0, max: 10,
            explanation: `Hàng "${labels[k]}" có ${counts[k]} hình, mỗi hình là 1 ${s.unit}.` });
    }),
    tpl('g2.pictograph', 2, () => {
        const s = pickOne(SETS), labels = sample(s.labels, 4), counts = distinctCounts(4, 1, 8), [i, j] = sample([0, 1, 2, 3], 2);
        const [hi, lo] = counts[i] > counts[j] ? [i, j] : [j, i];
        if (chance(0.5)) return single({ q: `Theo biểu đồ tranh, "${labels[hi]}" nhiều hơn "${labels[lo]}" bao nhiêu ${s.unit}?`, speech: `${labels[hi]} nhiều hơn ${labels[lo]} bao nhiêu ${s.unit}?`,
            visual: { fn: 'pictographSVG', args: [labels.map((l, k) => ({ label: l, n: counts[k] })), s.emoji] }, correct: counts[hi] - counts[lo], wrong: [counts[hi] + counts[lo], ...around(counts[hi] - counts[lo], { min: 0, max: 10 })], min: 0, max: 16,
            explanation: `${counts[hi]} - ${counts[lo]} = ${counts[hi] - counts[lo]} (${s.unit}).` });
        const total = counts.reduce((a, b) => a + b, 0);
        return single({ q: `Theo biểu đồ tranh, có tất cả bao nhiêu ${s.unit}?`, speech: `Theo biểu đồ tranh, có tất cả bao nhiêu ${s.unit}?`,
            visual: { fn: 'pictographSVG', args: [labels.map((l, k) => ({ label: l, n: counts[k] })), s.emoji] }, correct: total, wrong: around(total, { min: 0, max: 40 }), min: 0, max: 40,
            explanation: `Cộng các hàng: ${counts.join(' + ')} = ${total}.` });
    }),
];

export const generateG2Statistics = fromTemplates(templates);
