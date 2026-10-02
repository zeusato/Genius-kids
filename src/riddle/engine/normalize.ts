// Chuẩn hoá câu trả lời để so khớp. KHÔNG dùng để hiển thị: đáp án hiển thị luôn giữ nguyên dấu.

const TONES = /[̣̀́̃̉]/g; // huyền, sắc, ngã, hỏi, nặng
const ALL_MARKS = /[̀-ͯ]/g;

/** Từ chỉ loại chung / mạo từ: luôn bỏ ("con gà" = "gà", "the clock" = "clock"). */
const GENERIC = new Set(['con', 'cái', 'chiếc', 'chú', 'bé', 'the', 'a', 'an']);
/**
 * Từ chỉ loại mang nghĩa: được phép thiếu ("hồng" = "hoa hồng") nhưng không được khác
 * ("quả hồng" ≠ "hoa hồng"). "cặp" không nằm đây: "cặp sách" là một danh từ.
 */
const KIND = new Set(['quả', 'cây', 'củ', 'hoa', 'đôi', 'tấm', 'viên', 'ngọn', 'cục', 'tờ', 'quyển', 'cuốn', 'bức', 'hạt', 'lá', 'bánh']);

/** Từ địa phương / cách gọi khác cho cùng một vật (so theo từng tiếng sau khi chuẩn hoá). */
const REGIONAL: Record<string, string> = {
    'trái': 'quả', 'bắp': 'ngô', 'heo': 'lợn', 'khóm': 'dứa', 'thơm': 'dứa', 'chén': 'bát', 'muỗng': 'thìa',
    'mỳ': 'mì', 'vịt xiêm': 'ngan', 'đậu phộng': 'lạc', 'mãng cầu': 'na', 'bông': 'hoa', 'dĩa': 'đĩa', 'nón': 'mũ',
};

/** Dời dấu thanh về cuối mỗi tiếng để "hoà" = "hòa", "thuỷ" = "thủy" (kiểu bỏ dấu cũ/mới). */
function canonicalTone(word: string): string {
    const d = word.normalize('NFD');
    const tones = d.match(TONES)?.join('') ?? '';
    return (d.replace(TONES, '') + tones).normalize('NFC');
}

export function clean(input: string): string {
    return input.normalize('NFC').toLowerCase()
        .replace(/[.,!?;:"'“”‘’()…\-–_/\\]/g, ' ')
        .replace(/\s+/g, ' ').trim();
}

export function stripMarks(s: string): string {
    return s.normalize('NFD').replace(ALL_MARKS, '').replace(/đ/g, 'd').normalize('NFC');
}

/** Khoá so khớp: chữ thường, bỏ dấu câu, bỏ từ chỉ loại chung, đổi từ địa phương, thống nhất vị trí dấu. */
export function answerKey(input: string, opts: { strip?: boolean } = {}): string {
    let s = clean(input);
    for (const [from, to] of Object.entries(REGIONAL)) s = s.replace(new RegExp(`(^| )${from}(?= |$)`, 'g'), `$1${to}`);
    let words = s.split(' ').filter(Boolean);
    while (words.length > 1 && GENERIC.has(words[0])) words = words.slice(1);
    s = words.map(canonicalTone).join(' ');
    if (opts.strip) s = stripMarks(s);
    return s;
}

const KIND_KEYS = new Set([...KIND].map(canonicalTone));
const KIND_STRIPPED = new Set([...KIND].map(stripMarks));
/** Tách từ chỉ loại mang nghĩa ở đầu khoá: "hoa hồng" → { kind: "hoa", rest: "hồng" }. */
export function splitKind(key: string, strip = false): { kind: string | null; rest: string } {
    const [first, ...rest] = key.split(' ');
    return rest.length && (strip ? KIND_STRIPPED : KIND_KEYS).has(first) ? { kind: first, rest: rest.join(' ') } : { kind: null, rest: key };
}

/** Hai khoá cùng chỉ một thứ: giống hệt, hoặc chỉ một bên có từ chỉ loại ("hồng" ~ "hoa hồng", nhưng "quả hồng" ≁ "hoa hồng"). */
export function sameKey(a: string, b: string, strip = false): boolean {
    if (a === b) return true;
    const x = splitKind(a, strip), y = splitKind(b, strip);
    return (!x.kind || !y.kind) && x.rest === y.rest;
}

/** Có dấu tiếng Việt nào không (để biết bé gõ thiếu dấu). */
export const hasMarks = (s: string) => stripMarks(s) !== s.normalize('NFC');

export function levenshtein(a: string, b: string): number {
    if (a === b) return 0;
    const row = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
        let prev = row[0];
        row[0] = i;
        for (let j = 1; j <= b.length; j++) {
            const tmp = row[j];
            row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
            prev = tmp;
        }
    }
    return row[b.length];
}

/** Đọc số từ chữ số hoặc chữ ("năm", "mười hai") cho câu toán mẹo. */
const UNITS: Record<string, number> = { 'không': 0, 'một': 1, 'mốt': 1, 'hai': 2, 'ba': 3, 'bốn': 4, 'tư': 4, 'năm': 5, 'lăm': 5, 'sáu': 6, 'bảy': 7, 'tám': 8, 'chín': 9 };
export function parseNumber(input: string): number | null {
    const s = clean(input).replace(/\s/g, ' ');
    if (/^\d+$/.test(s.replace(/ /g, ''))) return Number(s.replace(/ /g, ''));
    const w = s.split(' ').filter(Boolean);
    if (!w.length) return null;
    let total = 0, hundreds = 0, cur = 0;
    for (const t of w) {
        if (t in UNITS) cur += UNITS[t];
        else if (t === 'mười') cur += 10;
        else if (t === 'mươi') cur = (cur || 1) * 10;
        else if (t === 'trăm') { hundreds = (cur || 1) * 100; cur = 0; }
        else if (t === 'nghìn' || t === 'ngàn') { total += (hundreds + cur || 1) * 1000; hundreds = 0; cur = 0; }
        else if (t === 'linh' || t === 'lẻ') continue;
        else return null;
    }
    return total + hundreds + cur;
}
