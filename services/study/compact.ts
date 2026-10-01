// Nén câu hỏi / kết quả trước khi lưu vào localStorage (math_profiles).
// visualSvg có thể nặng hàng chục KB/câu → KHÔNG BAO GIỜ lưu; chỉ giữ `visual` (dữ liệu nhỏ).
import type { Question, TestResult } from '../../types';

export type CompactQuestion = Omit<Question, 'visualSvg'>;

const MAX_EXPLANATION = 300;
const MAX_STEPS = 6;
/** Số bài gần nhất được giữ chi tiết từng câu; bài cũ hơn chỉ còn tóm tắt. */
export const KEEP_DETAILED_RESULTS = 50;

export function compactQuestion(q: Question): CompactQuestion {
    const { visualSvg: _drop, ...rest } = q;
    const out: CompactQuestion = { ...rest, explanation: (q.explanation || '').slice(0, MAX_EXPLANATION) };
    if (q.steps) out.steps = q.steps.slice(0, MAX_STEPS).map(s => s.slice(0, 200));
    return out;
}

export const compactResult = (r: TestResult): TestResult => ({ ...r, questions: (r.questions || []).map(compactQuestion) });

/** Nén toàn bộ lịch sử: bỏ visualSvg; chỉ `keepDetailed` bài gần nhất giữ chi tiết câu. */
export function migrateHistory(history: TestResult[] | undefined, keepDetailed = KEEP_DETAILED_RESULTS): TestResult[] {
    if (!Array.isArray(history)) return [];
    const cut = history.length - keepDetailed;
    return history.map((r, i) => (i < cut ? { ...r, questions: [] } : compactResult(r)));
}

export const historyNeedsCompaction = (history: TestResult[] | undefined): boolean =>
    Array.isArray(history) && (history.length > KEEP_DETAILED_RESULTS && history[history.length - KEEP_DETAILED_RESULTS - 1]?.questions?.length > 0
        || history.some(r => r.questions?.some(q => q.visualSvg)));
