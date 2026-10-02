// Thuật toán đặt tính chia theo SGK (thuần, có test). Lời đọc từng bước đúng cách nói của SGK Việt Nam.
// Số bị chia có thể là số thập phân; số chia là số tự nhiên (chia cho số thập phân: nhân cả hai số trước).
import { fmt } from '@/services/study/value';

export interface DivStep {
    /** chỉ số chữ số cuối của số bị chia đã dùng tới lượt này (không tính dấu phẩy) */ at: number;
    cur: number; q: number; prod: number; rem: number;
    /** số viết ở dòng dưới sau lượt này (số dư ghép chữ số hạ xuống), null nếu là lượt cuối */ next: string | null;
    say: string;
}
export interface DivResult {
    digits: string[];
    /** số chữ số phần nguyên của số bị chia (vị trí dấu phẩy) */ intLen: number;
    quotient: number; remainder: number; steps: DivStep[];
    /** số chữ số của thương đứng trước dấu phẩy (-1: thương không có phần thập phân) */ qComma: number;
    first: number;
}

const decLen = (x: number) => (String(x).split('.')[1] ?? '').length;

/** Chia a (số tự nhiên hoặc số thập phân) cho số tự nhiên b — đặt tính rút gọn kiểu SGK. */
export function longDivision(a: number, b: number): DivResult {
    if (!Number.isFinite(a) || !Number.isInteger(b) || a < 0 || b <= 0) throw new Error('Số không hợp lệ');
    const [ip, fp = ''] = String(a).split('.');
    const digits = (ip + fp).split('');
    const intLen = ip.length;
    const steps: DivStep[] = [];
    let cur = 0, i = 0;
    // lượt đầu: lấy đủ chữ số phần nguyên để chia được (trừ khi đã hết phần nguyên)
    while (i < intLen - 1 && cur * 10 + Number(digits[i]) < b) { cur = cur * 10 + Number(digits[i]); i++; }
    const first = i;
    let qs = '', qComma = -1;
    for (; i < digits.length; i++) {
        cur = cur * 10 + Number(digits[i]);
        const q = Math.floor(cur / b), prod = q * b, rem = cur - prod;
        qs += String(q);
        const nextDigit = digits[i + 1];
        const next = nextDigit === undefined ? null : `${rem}${nextDigit}`;
        const lead = steps.length === 0 && first > 0 ? `${digits.slice(0, first).join('')} bé hơn ${b} nên lấy ${cur}. ` : '';
        // sắp hạ chữ số đầu tiên của phần thập phân: viết dấu phẩy vào thương trước
        const comma = i + 1 === intLen && fp.length > 0;
        if (comma) qComma = qs.length;
        const qText = qComma >= 0 && comma ? fmt(Number(qs)) : '';
        const tail = next ? `${comma ? ` Viết dấu phẩy vào bên phải ${qText} ở thương.` : ''} Hạ ${nextDigit}, được ${Number(next)}.` : '';
        const say = q === 0
            ? `${lead}${cur} bé hơn ${b} nên viết 0 vào thương.${tail}`
            : `${lead}${cur} chia ${b} được ${q}, viết ${q}. ${q} nhân ${b} bằng ${prod}; ${cur} trừ ${prod} bằng ${rem}.${tail}`;
        steps.push({ at: i, cur, q, prod, rem, next, say });
        cur = rem;
    }
    const quotient = qComma >= 0 ? Number(`${qs.slice(0, qComma)}.${qs.slice(qComma)}`) : Number(qs);
    // phần dư với số bị chia thập phân tính theo hàng cuối cùng
    const remainder = fp.length ? cur / 10 ** decLen(a) : cur;
    return { digits, intLen, quotient, remainder, steps, qComma, first };
}

/** Thương đã hiện đến lượt k (có dấu phẩy khi đã qua phần nguyên). */
export function quotientText(r: DivResult, k: number): string {
    const qs = r.steps.slice(0, k).map(s => s.q).join('');
    return r.qComma >= 0 && qs.length > r.qComma ? `${qs.slice(0, r.qComma)},${qs.slice(r.qComma)}` : qs;
}

export const divisionSummary = (a: number, b: number, r: DivResult) =>
    r.remainder && r.qComma < 0 ? `${fmt(a)} : ${fmt(b)} = ${fmt(r.quotient)} (dư ${r.remainder})` : `${fmt(a)} : ${fmt(b)} = ${fmt(r.quotient)}`;
