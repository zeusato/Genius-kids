// ============================================================================
//  Định dạng / đọc / so giá trị số theo SGK Toán (GDPT 2018).
//  - Nhóm 3 chữ số bằng khoảng trắng KHÔNG NGẮT ( ): "12 345", "10 000 đồng".
//  - Dấu phẩy thập phân: "0,125". Không bao giờ dùng "," hay "." để nhóm nghìn.
//  - Số có ít hơn GROUP_MIN_DIGITS chữ số viết liền ("2417").
// ============================================================================

export const NBSP = ' ';
/** Số chữ số tối thiểu (phần nguyên) để bắt đầu nhóm nghìn. Đổi 1 chỗ này nếu SGK khác. */
export const GROUP_MIN_DIGITS = 5;

const groupInt = (digits: string): string => {
    if (digits.length < GROUP_MIN_DIGITS) return digits;
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
};

/** Định dạng số theo SGK. `decimals`: số chữ số thập phân tối đa (mặc định 6, bỏ số 0 thừa). */
export function fmt(n: number, opts: { decimals?: number; fixed?: boolean } = {}): string {
    if (!Number.isFinite(n)) return String(n);
    const d = opts.decimals ?? 6;
    let s = Math.abs(n).toFixed(d);
    if (!opts.fixed && s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
    const [int, frac] = s.split('.');
    const neg = n < 0 && /[1-9]/.test(s);
    return (neg ? '-' : '') + groupInt(int) + (frac ? ',' + frac : '');
}

export const fmtMoney = (n: number): string => `${fmt(n)} đồng`;

// ---------------------------------------------------------------------------
//  Đọc số bằng chữ
// ---------------------------------------------------------------------------
const ONES = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

function readTriple(n: number, full: boolean): string {
    const h = Math.floor(n / 100), t = Math.floor((n % 100) / 10), u = n % 10;
    const parts: string[] = [];
    if (h > 0 || full) parts.push(ONES[h] + ' trăm');
    if (t === 0) {
        if (u > 0) { if (h > 0 || full) parts.push('linh'); parts.push(ONES[u]); }
    } else if (t === 1) {
        parts.push('mười');
        if (u > 0) parts.push(u === 5 ? 'lăm' : ONES[u]);
    } else {
        parts.push(ONES[t] + ' mươi');
        if (u > 0) parts.push(u === 1 ? 'mốt' : u === 4 ? 'tư' : u === 5 ? 'lăm' : ONES[u]);
    }
    return parts.join(' ');
}

/** Đọc số tự nhiên (hoặc số thập phân) bằng chữ, theo SGK. */
export function readNumberVN(n: number): string {
    if (!Number.isFinite(n)) return '';
    if (!Number.isInteger(n)) {
        const s = fmt(n).replace(/ /g, '');
        const [i, f] = s.split(',');
        const lead = f.match(/^0*/)![0].length;
        const rest = f.slice(lead);
        return `${readNumberVN(Number(i))} phẩy ${[...Array(lead)].map(() => 'không').concat(rest ? [readNumberVN(Number(rest))] : []).join(' ')}`;
    }
    if (n < 0) return 'âm ' + readNumberVN(-n);
    if (n === 0) return 'không';
    const units = ['', ' nghìn', ' triệu', ' tỉ'];
    const groups: number[] = [];
    let x = n;
    while (x > 0) { groups.push(x % 1000); x = Math.floor(x / 1000); }
    const out: string[] = [];
    for (let i = groups.length - 1; i >= 0; i--) {
        const g = groups[i];
        if (g === 0) continue; // lớp toàn chữ số 0: bỏ qua
        out.push(readTriple(g, i < groups.length - 1) + units[i % 4 === 0 && i > 0 ? 3 : i % 4]);
    }
    return out.join(' ').replace(/\s+/g, ' ').trim();
}

// ---------------------------------------------------------------------------
//  Đọc giá trị từ chuỗi (đáp án, lựa chọn, ô nhập)
// ---------------------------------------------------------------------------
export const normalizeText = (s: string): string =>
    s.normalize('NFC').toLowerCase().replace(/[\s  ]+/g, ' ').trim();

function parseNumberPart(p: string): number | null {
    let s = p.trim().replace(/[  ]/g, ' ').replace(/−/g, '-');
    if (!s) return null;
    // hỗn số "2 3/4"
    const mixed = s.match(/^(\d+)\s+(\d+)\/(\d+)$/);
    if (mixed) return Number(mixed[3]) === 0 ? null : Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
    const frac = s.match(/^(-?\d+)\s*\/\s*(\d+)$/);
    if (frac) return Number(frac[2]) === 0 ? null : Number(frac[1]) / Number(frac[2]);
    // nhóm nghìn bằng khoảng trắng
    if (/^-?\d{1,3}( \d{3})+([.,]\d+)?$/.test(s)) s = s.replace(/ /g, '');
    if (/\s/.test(s)) return null;
    if (s.includes(',')) {
        // "," là dấu thập phân; "." (nếu có) là nhóm nghìn
        s = s.replace(/\./g, '').replace(',', '.');
    } else if (/^-?\d{1,3}(\.\d{3})+$/.test(s) && !/^-?0\./.test(s)) {
        s = s.replace(/\./g, ''); // "12.345" → 12345
    }
    return /^-?\d+(\.\d+)?$/.test(s) ? Number(s) : null;
}

/** Giá trị số của một chuỗi đáp án ("12 345", "0,5", "3/4", "2 3/4", "36cm²", "15 000 đồng"); null nếu không phải 1 số. */
export function parseValue(text: string | number | undefined | null): number | null {
    if (text === undefined || text === null) return null;
    if (typeof text === 'number') return Number.isFinite(text) ? text : null;
    const s = text.normalize('NFC').trim();
    const m = s.match(/^(-?[\d\s  .,/−]*\d)\s*([^\d]*)$/);
    if (!m) return null;
    const tail = m[2].trim();
    // đuôi chỉ được là đơn vị (chữ, ², ³, %, °), không có dấu phép tính
    if (tail && !/^[\p{L}²³%°.\s]+$/u.test(tail)) return null;
    return parseNumberPart(m[1]);
}

/** Đơn vị đi sau số ("cm²", "giờ sáng", "đồng"); '' nếu không có / không phải 1 số. */
export function unitOf(text: string | number | undefined | null): string {
    if (typeof text !== 'string') return '';
    const m = text.normalize('NFC').trim().match(/^(-?[\d\s  .,/−]*\d)\s*([^\d]*)$/);
    return m ? normalizeText(m[2]) : '';
}

/** Hai chuỗi có cùng giá trị? (số: so theo giá trị VÀ đơn vị; còn lại: so chữ đã chuẩn hoá) */
export function sameValue(a: string | number | undefined | null, b: string | number | undefined | null): boolean {
    const va = parseValue(a), vb = parseValue(b);
    if (va !== null && vb !== null) {
        const ua = unitOf(a), ub = unitOf(b);
        if (ua && ub && ua !== ub) return false; // "3 m" ≠ "3 km"; "9 giờ sáng" ≠ "9 giờ tối"
        return Math.abs(va - vb) < 1e-9;
    }
    if (a === undefined || a === null || b === undefined || b === null) return false;
    return normalizeText(String(a)) === normalizeText(String(b));
}
