// Nâng cao (Lớp 6 theo GDPT 2018) — Dấu hiệu chia hết cho 2, 3, 5, 9 (g4_divisibility).
// Câu nhập chữ số: `accept` liệt kê ĐỦ mọi chữ số hợp lệ.
import { tpl, fromTemplates, input, multi, choices, rint, pickOne } from '../kit';
import type { Template } from '../../study/types';

const RULE: Record<number, string> = { 2: 'chữ số tận cùng là 0, 2, 4, 6, 8', 5: 'chữ số tận cùng là 0 hoặc 5', 3: 'tổng các chữ số chia hết cho 3', 9: 'tổng các chữ số chia hết cho 9' };

export const templates: Template[] = [
    tpl('g4.divisibility', 2, () => {
        const d = pickOne([2, 3, 5, 9]), kind = rint(0, 2);
        if (kind === 0) {
            const nums = new Set<number>(); while (nums.size < 6) nums.add(rint(10, 999));
            const arr = [...nums], right = arr.filter(x => x % d === 0), wrong = arr.filter(x => x % d !== 0);
            if (!right.length) { arr[0] = d * rint(4, 99); right.push(arr[0]); wrong.splice(wrong.indexOf(arr[0]), 1); }
            return multi({ q: `Chọn tất cả các số chia hết cho ${d}:`, correct: right.map(String), wrong: wrong.map(String), explanation: `Số chia hết cho ${d} khi ${RULE[d]}.` });
        }
        if (kind === 1) {
            const prefix = rint(10, 99), valid = Array.from({ length: 10 }, (_, i) => i).filter(i => (prefix * 10 + i) % d === 0);
            return input({ q: `Điền một chữ số vào ô trống để số ${prefix}□ chia hết cho ${d}.`, correct: valid[0], accept: valid.slice(1), answerKind: 'number',
                explanation: `Số chia hết cho ${d} khi ${RULE[d]}. Các chữ số điền được: ${valid.join(', ')}.` });
        }
        const n = rint(100, 9999), yes = n % d === 0;
        return choices({ q: `Số ${n} có chia hết cho ${d} không?`, options: ['Có', 'Không'], correct: yes ? 'Có' : 'Không',
            explanation: `${d === 3 || d === 9 ? `Tổng các chữ số: ${String(n).split('').join(' + ')} = ${String(n).split('').reduce((a, b) => a + Number(b), 0)}. ` : ''}Số chia hết cho ${d} khi ${RULE[d]}, nên ${n} ${yes ? '' : 'không '}chia hết cho ${d}.` });
    }),
];

export const generateG4Divisibility = fromTemplates(templates);
