// Kiểm chuẩn nội dung bài học (docs/study-learn-plan.md mục 6):
//  mathLint     — phép tính "… = …" trong chữ phải đúng (tính bằng phân số hữu tỉ, BigInt)
//  notationLint — ký hiệu theo SGK (×, :, dấu phẩy thập phân, nhóm nghìn NBSP…)
//  lengthLint   — độ dài / số lượng theo lớp
import { Grade } from '../../../types';
import type { Lesson } from './types';
import { MAX_PAGES, lessonPages } from './pages';

// ---------------------------------------------------------------------------
//  Số hữu tỉ
// ---------------------------------------------------------------------------
interface Q { n: bigint; d: bigint }
const babs = (a: bigint) => (a < 0n ? -a : a);
const gcd = (a: bigint, b: bigint): bigint => { a = babs(a); b = babs(b); while (b) [a, b] = [b, a % b]; return a || 1n; };
const q = (n: bigint, d: bigint = 1n): Q => { if (d === 0n) throw new Error('chia 0'); if (d < 0n) { n = -n; d = -d; } const g = gcd(n, d); return { n: n / g, d: d / g }; };
const add = (a: Q, b: Q) => q(a.n * b.d + b.n * a.d, a.d * b.d);
const sub = (a: Q, b: Q) => q(a.n * b.d - b.n * a.d, a.d * b.d);
const mul = (a: Q, b: Q) => q(a.n * b.n, a.d * b.d);
const div = (a: Q, b: Q) => q(a.n * b.d, a.d * b.n);
const eq = (a: Q, b: Q) => a.n === b.n && a.d === b.d;

/** "12 345" | "56,52" → Q */
function decimal(s: string): Q {
    const t = s.replace(/[  ]/g, '');
    const [i, f = ''] = t.split(',');
    return q(BigInt(i + f), 10n ** BigInt(f.length));
}

// ---------------------------------------------------------------------------
//  Phân tích biểu thức: + − - × : ( ), số thập phân, phân số a/b, hỗn số "2 1/4"
// ---------------------------------------------------------------------------
type Tok = { k: 'num'; v: Q } | { k: 'op'; v: string };
const NUM = /^\d+(?: \d{3})*(?:,\d+)?/;

function tokenize(s: string): Tok[] | null {
    const out: Tok[] = [];
    let i = 0;
    while (i < s.length) {
        const c = s[i];
        if (c === ' ') { i++; continue; }
        const m = s.slice(i).match(NUM);
        if (m) {
            i += m[0].length;
            let v = decimal(m[0]);
            if (s[i] === '/') { // phân số a/b (không khoảng trắng)
                const m2 = s.slice(i + 1).match(/^\d+/);
                if (!m2 || m[0].includes(',')) return null;
                v = div(v, q(BigInt(m2[0])));
                i += 1 + m2[0].length;
                const prev = out[out.length - 1];
                if (prev?.k === 'num') { out[out.length - 1] = { k: 'num', v: add(prev.v, v) }; continue; } // hỗn số
            }
            if (out[out.length - 1]?.k === 'num') return null; // hai số đứng cạnh nhau, không phải biểu thức
            out.push({ k: 'num', v });
            continue;
        }
        if ('+-−×:()'.includes(c)) { out.push({ k: 'op', v: c === '−' ? '-' : c }); i++; continue; }
        return null;
    }
    return out;
}

function evaluate(s: string): Q | null {
    const t = tokenize(s);
    if (!t || !t.length) return null;
    let p = 0;
    const peek = () => t[p];
    const factor = (): Q => {
        const x = t[p++];
        if (!x) throw new Error('hết');
        if (x.k === 'num') return x.v;
        if (x.v === '(') { const v = expr(); if (t[p++]?.v !== ')') throw new Error(')'); return v; }
        throw new Error('dấu thừa');
    };
    const term = (): Q => { let v = factor(); while (peek()?.k === 'op' && (peek().v === '×' || peek().v === ':')) { const o = t[p++].v; const r = factor(); v = o === '×' ? mul(v, r) : div(v, r); } return v; };
    const expr = (): Q => { let v = term(); while (peek()?.k === 'op' && (peek().v === '+' || peek().v === '-')) { const o = t[p++].v; const r = term(); v = o === '+' ? add(v, r) : sub(v, r); } return v; };
    try { const v = expr(); return p === t.length ? v : null; } catch { return null; }
}

const fmtQ = (x: Q) => (x.d === 1n ? `${x.n}` : `${x.n}/${x.d}`);

/** Trả danh sách lỗi phép tính trong một đoạn chữ. */
export function mathLint(text: string): string[] {
    const errs: string[] = [];
    let s = text.replace(/\*\*/g, '');
    // phép chia có dư: a : b = q dư r  /  a : b = q (dư r)
    s = s.replace(/(\d[\d\u00a0]*(?:,\d+)?) : (\d[\d\u00a0]*) = (\d[\d\u00a0]*) \(?dư (\d[\d\u00a0]*)\)?/g, (all, a, b, qq, r) => {
        const [A, B, QQ, R] = [a, b, qq, r].map(decimal);
        if (!eq(A, add(mul(B, QQ), R)) || !(R.n * B.d < B.n * R.d)) errs.push(`Sai: ${all}`);
        return ' ¦ ';
    });
    // ranh giới: dấu ":" dính chữ phía trước (nhãn "Bước 1:"), dấu phẩy + cách, chấm phẩy
    s = s.replace(/(?<=\S):/g, ' ¦ ').replace(/,(?=\s)/g, ' ¦ ').replace(/;/g, ' ¦ ');
    for (const m of s.matchAll(/[\d(][\d  ,/+\-−×:()=]*[\d)]/g)) {
        const run = m[0];
        if (!run.includes('=')) continue;
        // biểu thức bị cắt (có ô trống / chữ cái dính phép tính ở hai đầu) → không kiểm
        const before = s.slice(0, m.index).trimEnd().slice(-1), after = s.slice((m.index ?? 0) + run.length).trimStart()[0] ?? '';
        if ('?□…+-−×:=/'.includes(before) && before || '?□…+-−×:=/'.includes(after) && after) continue;
        const sides = run.split('=').map(x => x.trim());
        if (sides.some(x => !x)) continue;
        const vals = sides.map(evaluate);
        if (vals.some(v => v === null)) continue; // không phải biểu thức thuần số → bỏ qua
        for (let i = 1; i < vals.length; i++) if (!eq(vals[0]!, vals[i]!)) { errs.push(`Sai: ${run.trim()} (${sides[0]} = ${fmtQ(vals[0]!)})`); break; }
    }
    return errs;
}

// ---------------------------------------------------------------------------
//  Ký hiệu
// ---------------------------------------------------------------------------
const NOTATION: [RegExp, string][] = [
    [/÷/, 'Dùng ":" cho phép chia, không dùng "÷"'],
    [/\d\s*\*\s*\d/, 'Dùng "×" cho phép nhân, không dùng "*"'],
    [/\d\s*[xX]\s*\d/, 'Dùng "×" cho phép nhân, không dùng chữ x'],
    [/[Tt]ìm [xy]\b/, 'Không viết "Tìm x" — dùng "?" hoặc "□"'],
    [/\d\.\d/, 'Dùng dấu phẩy thập phân / không dùng dấu chấm trong số'],
    [/(?<![\d, ])\d{5,}/, 'Số từ 5 chữ số phải nhóm nghìn: "12 345"'],
    [/(?<![\d ,])\d \d{3}(?![\d ])/, 'Số 4 chữ số viết liền: "2417"'],
    [/\d – \d/, 'Dấu trừ là "−" (hoặc "-"), không dùng gạch "–"'],
    [/thối/i, 'Dùng "trả lại", không dùng "thối"'],
    [/\d\s?L\b/, 'Lít viết thường: "l"'],
];
export function notationLint(text: string): string[] {
    return NOTATION.filter(([re]) => re.test(text)).map(([, msg]) => `${msg}: "${text.slice(0, 60)}"`);
}

// ---------------------------------------------------------------------------
//  Độ dài & số lượng
// ---------------------------------------------------------------------------
const words = (s: string) => s.replace(/[*_#>|`]/g, ' ').split(/\s+/).filter(w => /[\p{L}\d]/u.test(w)).length;
const PAGE_WORDS: Record<Grade, number> = { [Grade.Preschool]: 30, [Grade.Grade1]: 40, [Grade.Grade2]: 40, [Grade.Grade3]: 70, [Grade.Grade4]: 90, [Grade.Grade5]: 90 };
const SENTENCE_WORDS = (g: Grade) => (g <= Grade.Grade2 ? 18 : 30);

export function lengthLint(lesson: Lesson, grade: Grade): string[] {
    const e: string[] = [];
    const id = lesson.skillId;
    const sentences = (s: string, where: string) => {
        for (const sen of s.split(/(?<=[.!?;])\s+|\n+/)) if (words(sen) > SENTENCE_WORDS(grade)) e.push(`${id} ${where}: câu quá dài (${words(sen)} chữ)`);
    };
    if (lesson.know.length < 1 || lesson.know.length > 3) e.push(`${id}: cần 1–3 trang Em cần biết`);
    lesson.know.forEach((k, i) => {
        if (k.blocks.length < 1 || k.blocks.length > 4) e.push(`${id} know-${i}: cần 1–4 khối`);
        let n = 0;
        for (const b of k.blocks) {
            if (b.t === 'text' || b.t === 'note') { n += words(b.md); sentences(b.md, `know-${i}`); }
            if (b.t === 'rule') { n += words(b.say) + words(b.formula ?? ''); sentences(b.say, `know-${i}`); }
            if (b.t === 'table') n += words([...b.head, ...b.rows.flat()].join(' ')) / 2;
        }
        if (n > PAGE_WORDS[grade]) e.push(`${id} know-${i}: ${Math.round(n)} chữ > ${PAGE_WORDS[grade]}`);
    });
    if (grade === Grade.Preschool ? lesson.forms.length > 0 : lesson.forms.length < 1 || lesson.forms.length > 3) e.push(`${id}: số dạng không hợp lệ (${lesson.forms.length})`);
    for (const f of lesson.forms) {
        if (f.steps.length < 2 || f.steps.length > 6) e.push(`${id} ${f.id}: cách làm cần 2–6 bước`);
        if (f.example.steps.length < 1 || f.example.steps.length > 6) e.push(`${id} ${f.id}: ví dụ cần 1–6 bước`);
        if (f.title.length > 60) e.push(`${id} ${f.id}: tên dạng quá dài`);
        sentences(f.cue, f.id);
    }
    if (lesson.mistakes.length > 3 || (grade >= Grade.Grade3 && lesson.mistakes.length < 1)) e.push(`${id}: số chỗ dễ nhầm không hợp lệ`);
    lesson.mistakes.forEach((m, i) => sentences(m.why, `mistake-${i}`));
    if (lesson.remember.length < (grade === Grade.Preschool ? 1 : 2) || lesson.remember.length > 5) e.push(`${id}: Ghi nhớ cần 2–5 dòng`);
    const pages = lessonPages(lesson);
    if (pages.length > MAX_PAGES) e.push(`${id}: ${pages.length} trang > ${MAX_PAGES}`);
    if (new Set(pages.map(p => p.id)).size !== pages.length) e.push(`${id}: trùng id trang`);
    for (const p of pages) if (p.title.length > 60) e.push(`${id} ${p.id}: tiêu đề quá dài`);
    return e;
}

/** Mọi chuỗi chữ của bài (kèm nhãn vị trí); `wrong` của chỗ dễ nhầm được đánh dấu để bỏ qua mathLint. */
export function lessonStrings(lesson: Lesson): { where: string; text: string; wrong?: boolean }[] {
    const out: { where: string; text: string; wrong?: boolean }[] = [];
    const push = (where: string, text?: string, wrong = false) => { if (text) out.push({ where, text, wrong }); };
    push('goal', lesson.goal); push('hook', lesson.hook?.md); push('hook.answer', lesson.hook?.answer);
    lesson.know.forEach((k, i) => {
        push(`know-${i}.title`, k.title);
        k.blocks.forEach((b, j) => {
            const w = `know-${i}.${j}`;
            if (b.t === 'text' || b.t === 'note') push(w, b.md);
            if (b.t === 'rule') { push(w, b.say); push(w, b.formula); push(w, b.title); }
            if (b.t === 'pic') push(w, b.caption);
            if (b.t === 'table') { [...b.head, ...b.rows.flat()].forEach(c => push(w, c)); push(w, b.caption); }
        });
    });
    for (const f of lesson.forms) {
        push(`${f.id}.title`, f.title); push(`${f.id}.cue`, f.cue); f.steps.forEach(s => push(`${f.id}.steps`, s));
        const x = f.example;
        push(`${f.id}.problem`, x.problem); push(`${f.id}.answer`, x.answer); push(`${f.id}.check`, x.check);
        x.steps.forEach((s, i) => { push(`${f.id}.ex${i}`, s.say); push(`${f.id}.ex${i}`, s.math); });
    }
    lesson.mistakes.forEach((m, i) => { push(`mistake-${i}.wrong`, m.wrong, true); push(`mistake-${i}.right`, m.right); push(`mistake-${i}.why`, m.why); });
    lesson.remember.forEach((r, i) => push(`remember-${i}`, r));
    return out;
}
