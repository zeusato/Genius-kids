// ============================================================================
//  Bộ dựng câu hỏi dùng chung cho generator dạng template (Ôn Luyện 2026-10).
//  Luật: ĐÚNG 1 đáp án đúng, lựa chọn không trùng THEO GIÁ TRỊ, không số âm,
//  xáo trộn đều. Ngẫu nhiên chỉ qua generatorRandom (MathRacing sinh theo seed).
// ============================================================================
import { QuestionType } from '../../types';
import { generatorRandom } from './random';
import { fmt, parseValue, sameValue } from '../study/value';
import type { Generated, GenOpts, Level, Template } from '../study/types';
import { skillById } from '../study/catalog';
import { renderVisual, type VisualSpec } from './svg/render';

export const rint = (min: number, max: number): number => Math.floor(generatorRandom() * (max - min + 1)) + min;
export const pickOne = <T,>(arr: readonly T[]): T => arr[Math.floor(generatorRandom() * arr.length)];
export const chance = (p: number): boolean => generatorRandom() < p;
export function shuffle<T>(arr: readonly T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(generatorRandom() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
}
/** Chọn k phần tử khác nhau. */
export const sample = <T,>(arr: readonly T[], k: number): T[] => shuffle(arr).slice(0, k);

interface Common {
    /** Đề bài */ q: string;
    explanation: string;
    steps?: string[];
    hint?: string;
    speech?: string;
    visual?: VisualSpec;
    /** SVG dựng sẵn (generator cũ). Ưu tiên `visual`. */
    visualSvg?: string;
}
const base = (c: Common): Omit<Generated, 'type'> => {
    const out: Omit<Generated, 'type'> = { questionText: c.q, explanation: c.explanation };
    if (c.steps?.length) out.steps = c.steps;
    if (c.hint) out.hint = c.hint;
    if (c.speech) out.speech = c.speech;
    if (c.visual) { out.visual = c.visual as Generated['visual']; out.visualSvg = renderVisual(c.visual); }
    else if (c.visualSvg) out.visualSvg = c.visualSvg;
    return out;
};

type Val = number | string;
export interface SingleOpts extends Common {
    correct: Val;
    wrong: Val[];
    /** Định dạng số → chuỗi (mặc định fmt). Áp cho cả đáp án đúng và sai là số. */
    format?: (n: number) => string;
    /** Số lựa chọn mong muốn (2–4, mặc định 4). */
    count?: number;
    min?: number;
    max?: number;
    /** Chỉ nhận số nguyên khi bù lựa chọn. */
    integer?: boolean;
    /** Giữ nguyên thứ tự lựa chọn (không xáo). */
    keepOrder?: boolean;
}

/** Trắc nghiệm 1 đáp án: lọc trùng theo giá trị, bù bằng số lân cận, xáo trộn. */
export function single(o: SingleOpts): Generated {
    const f = o.format ?? ((n: number) => fmt(n));
    const show = (v: Val) => (typeof v === 'number' ? f(v) : v);
    const count = Math.max(2, Math.min(4, o.count ?? 4));
    const correctText = show(o.correct);
    const correctNum = typeof o.correct === 'number' ? o.correct : parseValue(o.correct);
    const ok = (v: Val) => {
        const n = typeof v === 'number' ? v : parseValue(v);
        if (n !== null) {
            if (!Number.isFinite(n) || n < 0) return false;
            if (o.min !== undefined && n < o.min) return false;
            if (o.max !== undefined && n > o.max) return false;
            if (o.integer && !Number.isInteger(n)) return false;
        }
        return true;
    };
    const opts: string[] = [correctText];
    const push = (v: Val) => {
        if (opts.length >= count || !ok(v)) return;
        const t = show(v);
        if (opts.some(x => sameValue(x, t))) return;
        opts.push(t);
    };
    for (const w of shuffle(o.wrong)) push(w);
    if (opts.length < count && correctNum !== null && typeof o.correct === 'number') {
        const step = Number.isInteger(correctNum) ? Math.max(1, Math.round(Math.abs(correctNum) / 20)) : 0.1;
        for (let d = 1; opts.length < count && d < 60; d++) {
            push(Number((correctNum + d * step).toFixed(6)));
            push(Number((correctNum - d * step).toFixed(6)));
        }
    }
    return {
        type: QuestionType.SingleChoice,
        ...base(o),
        // keepOrder: lựa chọn là số thứ tự (Hình 1, Ô số 2…) → xếp tăng dần, đáp án nằm đúng vị trí của nó
        options: o.keepOrder ? [...opts].sort((x, y) => (parseValue(x) ?? 0) - (parseValue(y) ?? 0)) : shuffle(opts),
        correctAnswer: correctText,
    };
}

/** So sánh: 3 lựa chọn cố định > < = (UI vẽ nút ký hiệu). */
export function compare(o: Common & { left: number; right: number }): Generated {
    const sign = Math.abs(o.left - o.right) < 1e-9 ? '=' : o.left > o.right ? '>' : '<';
    return { type: QuestionType.SingleChoice, ...base(o), options: ['>', '<', '='], correctAnswer: sign };
}

/** Câu Đúng/Sai hoặc Có/Không. */
export function yesNo(o: Common & { yes: boolean; labels?: [string, string] }): Generated {
    const [y, n] = o.labels ?? ['Đúng', 'Sai'];
    return { type: QuestionType.SingleChoice, ...base(o), options: [y, n], correctAnswer: o.yes ? y : n };
}

/** Lựa chọn chữ cố định (vd "nhiều hơn / ít hơn / bằng nhau"), giữ thứ tự. */
export function choices(o: Common & { options: string[]; correct: string; shuffle?: boolean }): Generated {
    return { type: QuestionType.SingleChoice, ...base(o), options: o.shuffle ? shuffle(o.options) : [...o.options], correctAnswer: o.correct };
}

/** Tự nhập đáp án. */
export function input(o: Common & { correct: Val; accept?: Val[]; answerKind?: 'number' | 'text'; format?: (n: number) => string }): Generated {
    const f = o.format ?? ((n: number) => fmt(n));
    const show = (v: Val) => (typeof v === 'number' ? f(v) : v);
    const out: Generated = { type: QuestionType.ManualInput, ...base(o), correctAnswer: show(o.correct), answerKind: o.answerKind ?? (typeof o.correct === 'number' || parseValue(String(o.correct)) !== null ? 'number' : 'text') };
    if (o.accept?.length) out.accept = o.accept.map(show);
    return out;
}

/** Chọn nhiều đáp án. */
export function multi(o: Common & { correct: string[]; wrong: string[] }): Generated {
    const all: string[] = [];
    for (const x of [...o.correct, ...o.wrong]) if (!all.some(y => sameValue(y, x))) all.push(x);
    return { type: QuestionType.MultipleSelect, ...base(o), options: shuffle(all), correctAnswers: o.correct.filter(c => all.includes(c)) };
}

/** Sắp xếp: `items` theo THỨ TỰ ĐÚNG; hiển thị xáo trộn (không trùng thứ tự đúng). */
export function order(o: Common & { items: string[] }): Generated {
    let shown = shuffle(o.items);
    for (let i = 0; i < 5 && shown.every((x, k) => x === o.items[k]); i++) shown = shuffle(o.items);
    return { type: QuestionType.Order, ...base(o), options: shown, correctAnswers: [...o.items] };
}

/** Chọn đáp án SAI (3 đúng + 1 sai). */
export function selectWrong(o: Common & { rights: string[]; wrong: string }): Generated {
    return { type: QuestionType.SelectWrong, ...base(o), questionText: o.q, options: shuffle([...o.rights.slice(0, 3), o.wrong]), correctAnswer: o.wrong };
}

// ---------------------------------------------------------------------------
//  Template
// ---------------------------------------------------------------------------
export const tpl = (skillId: string, level: Level, make: () => Generated, extra: Partial<Omit<Template, 'skillId' | 'level' | 'make'>> = {}): Template =>
    ({ skillId, level, make, ...extra });

/** Gắn skillId / level / advanced / ops từ catalog vào câu. */
export function stamp(t: Template, q: Generated): Generated {
    const s = skillById(t.skillId);
    const out: Generated = { ...q, skillId: t.skillId, level: t.level };
    if (s?.advanced) out.advanced = true;
    if (s?.ops?.length) out.ops = s.ops;
    return out;
}

function pickWeighted(ts: Template[]): Template {
    const total = ts.reduce((n, t) => n + (t.weight ?? 1), 0);
    let r = generatorRandom() * total;
    for (const t of ts) { r -= t.weight ?? 1; if (r < 0) return t; }
    return ts[ts.length - 1];
}

/** Chọn template theo kỹ năng / mức. Không có opts → ngẫu nhiên theo weight (hành vi cũ). */
export function chooseTemplate(templates: Template[], opts: GenOpts = {}): Template {
    let pool = opts.skillId ? templates.filter(t => t.skillId === opts.skillId) : templates;
    if (!pool.length) pool = templates;
    if (opts.level) {
        const exact = pool.filter(t => t.level === opts.level);
        if (exact.length) pool = exact;
        else {
            const best = Math.min(...pool.map(t => Math.abs(t.level - opts.level!)));
            pool = pool.filter(t => Math.abs(t.level - opts.level!) === best);
        }
    }
    return pickWeighted(pool);
}

/** Tạo hàm generator từ danh sách template (giữ tương thích tên export cũ). */
export const fromTemplates = (templates: Template[]) => (opts?: GenOpts): Generated => {
    const t = chooseTemplate(templates, opts);
    return stamp(t, t.make());
};
