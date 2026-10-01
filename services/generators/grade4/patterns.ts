// Lớp 4 — Dãy số theo quy luật (g4_patterns): cộng đều, nhân, xen kẽ, quy luật tăng dần khoảng cách.
import { tpl, fromTemplates, input, rint, pickOne } from '../kit';
import type { Template } from '../../study/types';

function make(kind: number): { seq: number[]; rule: string } {
    if (kind === 0) { const a = rint(10, 200), d = rint(3, 50); return { seq: Array.from({ length: 6 }, (_, i) => a + i * d), rule: `mỗi số hơn số liền trước ${d} đơn vị` }; }
    if (kind === 1) { const a = rint(400, 900), d = rint(3, 40); return { seq: Array.from({ length: 6 }, (_, i) => a - i * d), rule: `mỗi số kém số liền trước ${d} đơn vị` }; }
    if (kind === 2) { const a = rint(1, 5), k = pickOne([2, 3]); return { seq: Array.from({ length: 6 }, (_, i) => a * k ** i), rule: `mỗi số gấp ${k} lần số liền trước` }; }
    const a = rint(1, 20), d = rint(1, 4); const seq = [a]; for (let i = 1; i < 6; i++) seq.push(seq[i - 1] + d * i);
    return { seq, rule: `khoảng cách giữa hai số liền nhau tăng dần: ${d}, ${2 * d}, ${3 * d}, …` };
}

export const templates: Template[] = [
    tpl('g4.sequence', 2, () => {
        const { seq, rule } = make(rint(0, 1)), k = rint(2, 5);
        return input({ q: `Tìm số thích hợp điền vào chỗ trống: ${seq.map((x, i) => (i === k ? '…' : x)).join(', ')}`, correct: seq[k], explanation: `Quy luật: ${rule}. Số cần điền là ${seq[k]}.`, hint: 'Tìm hiệu giữa hai số liền nhau.' });
    }),
    tpl('g4.sequence', 3, () => {
        const { seq, rule } = make(rint(2, 3)), k = rint(4, 5); // ≥ 4 số mới đủ xác định quy luật (2, 4, 8 → 16 hay 14?)
        return input({ q: `Tìm số thích hợp điền vào chỗ trống: ${seq.slice(0, k).join(', ')}, …`, correct: seq[k], explanation: `Quy luật: ${rule}. Số tiếp theo là ${seq[k]}.`, hint: 'Thử so sánh hai số liền nhau: hơn bao nhiêu? gấp mấy lần?' });
    }),
];

export const generateG4Patterns = fromTemplates(templates);
