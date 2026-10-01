// Lớp 5 — Thống kê & xác suất (g5_statistics): biểu đồ hình quạt tròn; đọc biểu đồ cột (tiêu đề, đơn vị);
// tỉ số mô tả số lần lặp lại của một khả năng.
import { tpl, fromTemplates, single, choices, rint, pickOne, sample, chance, shuffle } from '../kit';
import { around } from '../wrongs';
import { fmt } from '../../study/value';
import { gcd } from '../fractions';
import type { Template } from '../../study/types';

const PIE: { title: string; labels: string[] }[] = [
    { title: 'Tỉ lệ học sinh tham gia các môn thể thao', labels: ['Bóng đá', 'Cầu lông', 'Bơi', 'Cờ vua'] },
    { title: 'Tỉ lệ các loại cây trong vườn', labels: ['Cam', 'Bưởi', 'Xoài', 'Nhãn'] },
    { title: 'Tỉ lệ phương tiện học sinh đến trường', labels: ['Đi bộ', 'Xe đạp', 'Bố mẹ đưa', 'Xe buýt'] },
];
const pctSet = () => pickOne([[50, 25, 15, 10], [40, 30, 20, 10], [35, 25, 25, 15], [45, 25, 20, 10], [30, 30, 25, 15]]);

export const templates: Template[] = [
    tpl('g5.pie_chart', 1, () => {
        const s = pickOne(PIE), ps = shuffle(pctSet()), k = rint(0, 3);
        return single({ q: `Biểu đồ "${s.title}". Phần "${s.labels[k]}" chiếm bao nhiêu phần trăm?`, visual: { fn: 'pieChartSVG', args: [s.labels.map((l, i) => ({ label: `${l} ${ps[i]}%`, value: ps[i] }))] }, correct: ps[k], wrong: ps.filter((_, i) => i !== k), closed: true, format: x => `${x}%`,
            explanation: `Đọc nhãn trên biểu đồ: ${s.labels[k]} chiếm ${ps[k]}%.` });
    }, { noRankCheck: true }),
    tpl('g5.pie_chart', 2, () => {
        const s = pickOne(PIE), ps = shuffle(pctSet()), k = rint(0, 3), total = pickOne([200, 400, 500, 800, 1000]), n = total * ps[k] / 100;
        return single({ q: `Biểu đồ "${s.title}" khảo sát ${total} học sinh. Có bao nhiêu học sinh chọn "${s.labels[k]}"?`, visual: { fn: 'pieChartSVG', args: [s.labels.map((l, i) => ({ label: `${l} ${ps[i]}%`, value: ps[i] }))] }, correct: n, wrong: [ps[k], total - n, n * 2, ...around(n, { min: 1, step: 10 })], min: 0,
            explanation: `${ps[k]}% của ${total}: ${total} × ${ps[k]} : 100 = ${n} (học sinh).`, hint: 'Tìm tỉ số phần trăm của một số.' });
    }),
    tpl('g5.bar_read', 1, () => {
        const labels = ['Lớp 5A', 'Lớp 5B', 'Lớp 5C', 'Lớp 5D'], vals = sample(Array.from({ length: 30 }, (_, i) => (i + 2) * 5), 4), k = rint(0, 3);
        return single({ q: `Biểu đồ: Số ki-lô-gam giấy vụn các lớp thu được. ${labels[k]} thu được bao nhiêu ki-lô-gam?`, visual: { fn: 'barChartSVG', args: [labels.map((l, i) => ({ label: l, value: vals[i] }))] }, correct: vals[k], wrong: around(vals[k], { min: 5, step: 5 }), format: x => `${x} kg`, min: 0,
            explanation: `Cột ${labels[k]} cao đến vạch ${vals[k]}: ${vals[k]} kg.` });
    }),
    tpl('g5.bar_read', 2, () => {
        const labels = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4'], vals = sample(Array.from({ length: 20 }, (_, i) => (i + 4) * 10), 4), total = vals.reduce((a, b) => a + b, 0);
        if (chance(0.5) && total % 4 === 0) return single({ q: 'Biểu đồ: Số sách thư viện mua thêm mỗi tháng. Trung bình mỗi tháng thư viện mua bao nhiêu quyển?', visual: { fn: 'barChartSVG', args: [labels.map((l, i) => ({ label: l, value: vals[i] }))] }, correct: total / 4, wrong: [total, ...around(total / 4, { min: 1, step: 5 })], min: 0, explanation: `(${vals.join(' + ')}) : 4 = ${total} : 4 = ${total / 4} (quyển).` });
        return single({ q: 'Biểu đồ: Số sách thư viện mua thêm mỗi tháng. Cả bốn tháng thư viện mua bao nhiêu quyển?', visual: { fn: 'barChartSVG', args: [labels.map((l, i) => ({ label: l, value: vals[i] }))] }, correct: total, wrong: around(total, { min: 1, step: 10 }), min: 0, explanation: `${vals.join(' + ')} = ${fmt(total)} (quyển).` });
    }),
    tpl('g5.chance_ratio', 2, () => {
        const n = pickOne([10, 20, 25, 30, 40, 50]), k = rint(1, n - 1), what = pickOne(['mặt sấp khi tung đồng xu', 'mặt 6 chấm khi gieo xúc xắc', 'bóng đỏ khi lấy bóng từ hộp']), g = gcd(k, n);
        const right = `${k / g}/${n / g}`;
        return choices({ q: `Thực hiện ${n} lần, có ${k} lần xuất hiện ${what}. Tỉ số của số lần xuất hiện ${what.split(' khi')[0]} và tổng số lần là:`, options: shuffle([...new Set([right, `${n / g}/${k / g}`, `${(n - k) / gcd(n - k, n)}/${n / gcd(n - k, n)}`, `${k}/${n - k}`])]), correct: right,
            explanation: `Tỉ số = ${k} : ${n} = ${right}.`, hint: 'Lấy số lần xuất hiện chia cho tổng số lần thực hiện.' });
    }, { noRankCheck: true }),
];

export const generateG5Statistics = fromTemplates(templates);
