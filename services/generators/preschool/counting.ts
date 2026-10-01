// Mầm non — Đếm và số (mn_counting): đếm ≤ 10, nhận biết số, nhiều – ít, số thứ tự, gộp – tách, quy luật.
// Đề do TTS dẫn: `speech` đọc đủ yêu cầu (và các lựa chọn bằng chữ nếu có).
import { tpl, fromTemplates, single, choices, rint, pickOne, sample, chance } from '../kit';
import { around } from '../wrongs';
import { readNumberVN } from '../../study/value';
import type { Template } from '../../study/types';

/** Đồ vật + tên gọi (có loại từ). */
export const THINGS: { e: string; name: string }[] = [
    { e: '🍎', name: 'quả táo' }, { e: '⭐', name: 'ngôi sao' }, { e: '🐶', name: 'chú chó' }, { e: '🌸', name: 'bông hoa' },
    { e: '🚗', name: 'chiếc ô tô' }, { e: '🍓', name: 'quả dâu' }, { e: '🦋', name: 'con bướm' }, { e: '🎈', name: 'quả bóng bay' },
    { e: '🐟', name: 'con cá' }, { e: '🐤', name: 'chú gà con' }, { e: '🍌', name: 'quả chuối' }, { e: '🐱', name: 'chú mèo' },
];
const ANIMALS = ['🐶', '🐱', '🐰', '🐻', '🐼', '🐸', '🐷', '🐤', '🦊', '🐮'];
const ANIMAL_NAME: Record<string, string> = { '🐶': 'chú chó', '🐱': 'chú mèo', '🐰': 'bạn thỏ', '🐻': 'bạn gấu', '🐼': 'bạn gấu trúc', '🐸': 'chú ếch', '🐷': 'chú lợn', '🐤': 'chú gà con', '🦊': 'bạn cáo', '🐮': 'bạn bò' };
const word = (n: number) => readNumberVN(n);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const templates: Template[] = [
    // --- Đếm ---
    tpl('mn.count', 1, () => {
        const t = pickOne(THINGS), n = rint(1, 10);
        return single({
            q: `Có mấy ${t.name}?`, speech: `Bé đếm xem có mấy ${t.name}?`,
            visual: { fn: 'countingSVG', args: [t.e, n] },
            correct: n, wrong: around(n, { min: 1, max: 10 }), min: 1, max: 10,
            explanation: `Bé đếm lần lượt từng ${t.name}: có tất cả ${word(n)} ${t.name}.`,
            hint: 'Bé chỉ tay vào từng hình và đếm to: một, hai, ba…',
        });
    }, { weight: 3 }),
    // --- Nhận biết số ---
    tpl('mn.numeral', 1, () => {
        const n = rint(0, 10);
        return single({
            q: `Đâu là số ${word(n)}?`, speech: `Bé hãy tìm số ${word(n)}.`,
            correct: n, wrong: sample([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].filter(x => x !== n), 3),
            explanation: `Số ${word(n)} viết là ${n}.`,
        });
    }),
    tpl('mn.numeral', 1, () => {
        const t = pickOne(THINGS), n = rint(1, 9);
        return single({
            q: `Nhóm này có bao nhiêu ${t.name}? Chọn số đúng.`, speech: `Nhóm này có bao nhiêu ${t.name}? Bé chọn số đúng nhé.`,
            visual: { fn: 'groupsSVG', args: [[{ emoji: t.e, n, label: '' }]] },
            correct: n, wrong: around(n, { min: 0, max: 10 }), min: 0, max: 10,
            explanation: `Có ${word(n)} ${t.name}, ta chọn số ${n}.`,
        });
    }),
    // --- Nhiều hơn / ít hơn / bằng nhau ---
    tpl('mn.more_less', 1, () => {
        const [t1, t2] = sample(THINGS, 2);
        const eq = chance(0.2), a = rint(1, 7), b = eq ? a : pickOne([1, 2, 3, 4, 5, 6, 7, 8].filter(x => Math.abs(x - a) >= 2));
        const askMore = chance(0.5);
        const correct = a === b ? 'Bằng nhau' : (a > b) === askMore ? 'Nhóm 1' : 'Nhóm 2';
        return choices({
            q: `Nhóm nào ${askMore ? 'nhiều hơn' : 'ít hơn'}?`, speech: `Nhóm nào ${askMore ? 'nhiều hơn' : 'ít hơn'}? Nhóm một, nhóm hai, hay hai nhóm bằng nhau?`,
            visual: { fn: 'groupsSVG', args: [[{ emoji: t1.e, n: a }, { emoji: t2.e, n: b }]] },
            options: ['Nhóm 1', 'Nhóm 2', 'Bằng nhau'], correct,
            explanation: a === b ? `Hai nhóm đều có ${word(a)}, nên bằng nhau.` : `Nhóm 1 có ${word(a)}, nhóm 2 có ${word(b)}.`,
            hint: 'Bé đếm từng nhóm rồi so sánh nhé.',
        });
    }),
    tpl('mn.more_less', 2, () => {
        const t = pickOne(THINGS), a = rint(3, 9), b = chance(0.5) ? a + 1 : a - 1;
        const askMore = chance(0.5);
        return choices({
            q: `Nhóm nào ${askMore ? 'nhiều hơn' : 'ít hơn'}?`, speech: `Nhóm nào ${askMore ? 'nhiều hơn' : 'ít hơn'}? Nhóm một, nhóm hai, hay hai nhóm bằng nhau?`,
            visual: { fn: 'groupsSVG', args: [[{ emoji: t.e, n: a }, { emoji: t.e, n: b }]] },
            options: ['Nhóm 1', 'Nhóm 2', 'Bằng nhau'], correct: (a > b) === askMore ? 'Nhóm 1' : 'Nhóm 2',
            explanation: `Nhóm 1 có ${word(a)}, nhóm 2 có ${word(b)}: ${a > b ? 'nhóm 1' : 'nhóm 2'} nhiều hơn một.`,
            hint: 'Hai nhóm chỉ hơn kém nhau một chút — bé đếm thật cẩn thận.',
        });
    }),
    // --- Số thứ tự ---
    tpl('mn.ordinal', 2, () => {
        const row = sample(ANIMALS, 5), k = rint(0, 4);
        return single({
            q: `Tính từ lá cờ, ${ANIMAL_NAME[row[k]]} đứng thứ mấy?`, speech: `Tính từ lá cờ, ${ANIMAL_NAME[row[k]]} đứng thứ mấy?`,
            visual: { fn: 'rowSVG', args: [row, { flag: true }] },
            correct: k + 1, wrong: [1, 2, 3, 4, 5].filter(x => x !== k + 1), count: 4, closed: true,
            explanation: `Đếm từ lá cờ: ${ANIMAL_NAME[row[k]]} đứng thứ ${k === 0 ? 'nhất' : k === 3 ? 'tư' : word(k + 1)}.`,
        });
    }),
    // --- Gộp / tách ---
    tpl('mn.combine', 2, () => {
        const t = pickOne(THINGS), a = rint(1, 5), b = rint(1, 10 - a);
        return single({
            q: `Gộp hai nhóm lại thì có tất cả mấy ${t.name}?`, speech: `Gộp hai nhóm lại thì có tất cả mấy ${t.name}?`,
            visual: { fn: 'groupsSVG', args: [[{ emoji: t.e, n: a }, { emoji: t.e, n: b }]] },
            correct: a + b, wrong: around(a + b, { min: 1, max: 10 }), min: 1, max: 10,
            explanation: `${cap(word(a))} ${t.name} và ${word(b)} ${t.name}, gộp lại được ${word(a + b)} ${t.name}.`,
            hint: 'Bé đếm tiếp sang nhóm thứ hai.',
        });
    }),
    tpl('mn.combine', 2, () => {
        const t = pickOne(THINGS), total = rint(3, 10), a = rint(1, total - 1);
        return single({
            q: `Có ${total} ${t.name}. Trong khung thứ nhất có ${a}. Khung thứ hai có mấy ${t.name}?`,
            speech: `Có ${word(total)} ${t.name}. Trong khung thứ nhất có ${word(a)}. Khung thứ hai có mấy ${t.name}?`,
            visual: { fn: 'groupsSVG', args: [[{ emoji: t.e, n: total, label: `Tất cả: ${total}` }]] },
            correct: total - a, wrong: around(total - a, { min: 0, max: 10 }), min: 0, max: 10,
            explanation: `${cap(word(total))} tách thành ${word(a)} và ${word(total - a)}.`,
        });
    }),
    // --- Quy luật ---
    tpl('mn.pattern', 2, () => {
        const [a, b, c, d] = sample([...THINGS.map(t => t.e)], 4);
        const len = rint(5, 7), seq = Array.from({ length: len }, (_, i) => (i % 2 === 0 ? a : b));
        const ans = len % 2 === 0 ? a : b;
        return single({
            q: 'Hình nào điền vào ô dấu hỏi?', speech: 'Các hình được xếp theo quy luật. Hình nào điền vào ô dấu hỏi?',
            visual: { fn: 'rowSVG', args: [[...seq, null]] },
            correct: ans, wrong: [ans === a ? b : a, c, d],
            explanation: `Hai hình ${a} ${b} lặp lại liên tiếp, nên tiếp theo là ${ans}.`,
            hint: 'Bé xem hai hình đầu tiên được lặp lại thế nào.',
        });
    }),
    tpl('mn.pattern', 3, () => {
        const [a, b, c, d] = sample([...THINGS.map(t => t.e)], 4);
        const unit = chance(0.5) ? [a, a, b] : [a, b, c];
        const len = rint(4, 7), seq = Array.from({ length: len }, (_, i) => unit[i % unit.length]);
        const ans = unit[len % unit.length];
        return single({
            q: 'Hình nào điền vào ô dấu hỏi?', speech: 'Các hình được xếp theo quy luật. Hình nào điền vào ô dấu hỏi?',
            visual: { fn: 'rowSVG', args: [[...seq, null]] },
            correct: ans, wrong: [...new Set([...unit, d])].filter(x => x !== ans),
            explanation: `Nhóm ${unit.join(' ')} được lặp lại, nên hình tiếp theo là ${ans}.`,
            hint: 'Bé tìm nhóm hình được lặp đi lặp lại.',
        });
    }),
];

export const generatePreschoolCounting = fromTemplates(templates);
