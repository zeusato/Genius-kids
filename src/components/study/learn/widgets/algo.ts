// Thuật toán đặt tính theo SGK (thuần, có test). Lời đọc từng bước đúng cách nói của SGK Việt Nam.
import { fmt } from '@/services/study/value';

export interface DivStep {
    /** chỉ số chữ số cuối của số bị chia đã dùng tới lượt này */ at: number;
    cur: number; q: number; prod: number; rem: number;
    /** số viết ở dòng dưới sau lượt này (số dư ghép chữ số hạ xuống), null nếu là lượt cuối */ next: string | null;
    say: string;
}
export interface DivResult { digits: string[]; quotient: number; remainder: number; steps: DivStep[]; /** chỉ số chữ số bắt đầu lượt đầu (lấy 1 hay 2 chữ số) */ first: number }

/** Chia số tự nhiên a cho số có một (hoặc vài) chữ số b — đặt tính rút gọn kiểu SGK. */
export function longDivision(a: number, b: number): DivResult {
    if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b <= 0) throw new Error('Số không hợp lệ');
    const digits = String(a).split('');
    const steps: DivStep[] = [];
    let cur = 0, i = 0;
    // lượt đầu: lấy đủ chữ số để chia được (trừ khi đã hết chữ số)
    while (i < digits.length - 1 && cur * 10 + Number(digits[i]) < b) { cur = cur * 10 + Number(digits[i]); i++; }
    const first = i;
    let qs = '';
    for (; i < digits.length; i++) {
        cur = cur * 10 + Number(digits[i]);
        const q = Math.floor(cur / b), prod = q * b, rem = cur - prod;
        const nextDigit = digits[i + 1];
        const next = nextDigit === undefined ? null : `${rem}${nextDigit}`;
        const lead = steps.length === 0 && first > 0 ? `${digits.slice(0, first).join('')} bé hơn ${b} nên lấy ${cur}. ` : '';
        const say = q === 0
            ? `${lead}${cur} bé hơn ${b} nên viết 0 vào thương.${next ? ` Hạ ${nextDigit}, được ${Number(next)}.` : ''}`
            : `${lead}${cur} chia ${b} được ${q}, viết ${q}. ${q} nhân ${b} bằng ${prod}; ${cur} trừ ${prod} bằng ${rem}.${next ? ` Hạ ${nextDigit}, được ${Number(next)}.` : ''}`;
        steps.push({ at: i, cur, q, prod, rem, next, say });
        qs += String(q);
        cur = rem;
    }
    const quotient = Number(qs), remainder = cur;
    return { digits, quotient, remainder, steps, first };
}

export const divisionSummary = (a: number, b: number, r: DivResult) =>
    r.remainder ? `${fmt(a)} : ${fmt(b)} = ${fmt(r.quotient)} (dư ${r.remainder})` : `${fmt(a)} : ${fmt(b)} = ${fmt(r.quotient)}`;
