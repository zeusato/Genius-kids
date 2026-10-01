// Bất biến bắt buộc cho MỌI template (docs/study-wow-plan.md mục 4).
// Chạy THẲNG template — không qua bộ lọc của buildSession — để không lỗi nào bị che.
import { describe, it, expect } from 'vitest';
import '../mathEngine';
import { allTemplates } from '../study/registry';
import { stamp } from './kit';
import { SKILL_MAP } from '../study/catalog';
import { parseValue, sameValue } from '../study/value';
import { isVisualFn, renderVisual } from './svg/render';
import { QuestionType } from '../../types';
import { questionKey } from '../study/session';
import type { Generated, Template } from '../study/types';

const N = 300;
const BAD_TEXT = /undefined|NaN|Infinity|\\n|ai\/cái nào|tấtcả|÷|Tìm x\b|thối/;
const COMMA_GROUP = /\d[,.]\d{3}(?!\d)/;
const NEG_IN_TEXT = /(?:^|[\s(=:,])[-−]\d/;

function problems(t: Template, q: Generated): string[] {
    const p: string[] = [];
    const all = [q.questionText, ...(q.options || []), q.correctAnswer || '', ...(q.correctAnswers || [])];
    if (!q.questionText?.trim()) p.push('đề rỗng');
    for (const s of [...all, q.explanation, ...(q.steps || []), q.hint || '']) if (BAD_TEXT.test(s)) p.push(`chữ cấm: "${s.match(BAD_TEXT)![0]}" trong "${s.slice(0, 60)}"`);
    if (!t.decimal) for (const s of all) if (COMMA_GROUP.test(s)) p.push(`nhóm nghìn bằng dấu phẩy/chấm: "${s.slice(0, 60)}"`);
    for (const s of all) if (NEG_IN_TEXT.test(' ' + s)) p.push(`số âm: "${s.slice(0, 60)}"`);
    if (q.type === QuestionType.SingleChoice || q.type === QuestionType.SelectWrong) {
        const o = q.options || [];
        if (o.length < 2 || o.length > 4) p.push(`số lựa chọn ${o.length}`);
        if (!o.includes(q.correctAnswer!)) p.push('đáp án đúng không có trong lựa chọn');
        for (let i = 0; i < o.length; i++) for (let j = i + 1; j < o.length; j++) if (sameValue(o[i], o[j])) p.push(`trùng giá trị: ${o[i]} / ${o[j]}`);
        if (q.type === QuestionType.SingleChoice && o.filter(x => sameValue(x, q.correctAnswer)).length !== 1) p.push('không đúng 1 đáp án đúng');
    }
    if (q.type === QuestionType.MultipleSelect) {
        if (!q.correctAnswers?.length || !q.correctAnswers.every(c => q.options?.includes(c))) p.push('chọn nhiều: đáp án thiếu');
    }
    if (q.type === QuestionType.Order) {
        if (!q.correctAnswers || q.options?.length !== q.correctAnswers.length) p.push('sắp xếp: thiếu phần tử');
    }
    if (q.type === QuestionType.ManualInput) {
        if (!q.correctAnswer) p.push('nhập: thiếu đáp án');
        else if (q.answerKind !== 'text' && parseValue(q.correctAnswer) === null) p.push(`nhập số nhưng đáp án không phải số: ${q.correctAnswer}`);
    }
    for (const s of [...(q.options || []), q.correctAnswer || '']) { const v = parseValue(s); if (v !== null && v < 0) p.push(`giá trị âm: ${s}`); }
    if (q.visual) {
        if (!isVisualFn(q.visual.fn)) p.push(`hình không hợp lệ: ${q.visual.fn}`);
        const svg = renderVisual(q.visual as never);
        if (!svg || /NaN|undefined/.test(svg)) p.push(`hình lỗi: ${q.visual.fn}`);
    }
    if (q.visualSvg && /NaN|undefined/.test(q.visualSvg)) p.push('SVG có NaN/undefined');
    const skill = SKILL_MAP.get(t.skillId);
    if (!skill) p.push(`kỹ năng ${t.skillId} không có trong catalog`);
    else {
        if (!skill.levels.includes(t.level)) p.push(`mức ${t.level} không thuộc ${skill.levels}`);
        if (skill.grade <= 1 && (q.visual || q.visualSvg) && !q.speech) p.push('lớp ≤ 1 có hình nhưng thiếu speech');
    }
    if ((q.explanation || '').trim().length < 12) p.push(`lời giải quá ngắn: "${q.explanation}"`);
    const c = t.check?.(q);
    if (c) p.push(`check: ${c}`);
    return p;
}

const templates = allTemplates();
const bySkill = new Map<string, Template[]>();
for (const t of templates) { if (!bySkill.has(t.skillId)) bySkill.set(t.skillId, []); bySkill.get(t.skillId)!.push(t); }

describe('Bất biến template', () => {
    it('có template để kiểm (hoặc chưa chuyển lớp nào)', () => expect(templates.length).toBeGreaterThanOrEqual(0));
    for (const [skillId, ts] of bySkill) {
        describe(skillId, () => {
            it('đủ mọi mức trong catalog', () => {
                const skill = SKILL_MAP.get(skillId)!;
                expect(skill, `thiếu catalog ${skillId}`).toBeTruthy();
                for (const l of skill.levels) expect(ts.some(t => t.level === l), `${skillId} thiếu mức M${l}`).toBe(true);
            });
            ts.forEach((t, ti) => it(`template #${ti} (M${t.level})`, () => {
                const errs = new Map<string, string>();
                const rank = [0, 0, 0, 0], pos = [0, 0, 0, 0];
                let rankable = 0, four = 0;
                for (let i = 0; i < N; i++) {
                    const q = stamp(t, t.make());
                    for (const e of problems(t, q)) if (!errs.has(e)) errs.set(e, q.questionText.slice(0, 80));
                    const o = q.options || [];
                    if (q.type === QuestionType.SingleChoice && o.length >= 3) {
                        const vals = o.map(parseValue);
                        if (vals.every(v => v !== null)) {
                            const cv = parseValue(q.correctAnswer)!;
                            rank[Math.min(3, vals.filter(v => v! < cv).length)]++; rankable++;
                        }
                        if (o.length === 4) { pos[o.indexOf(q.correctAnswer!)]++; four++; }
                    }
                }
                expect([...errs].map(([e, s]) => `${e}  ⟵ ${s}`), skillId).toEqual([]);
                if (!t.noRankCheck && rankable > N / 2) {
                    const ranks = rank.slice(0, Math.min(4, 4)).filter((_, i) => i < 4);
                    const max = Math.max(...ranks), min = Math.min(...ranks);
                    expect(min / rankable, `${skillId}: đáp án dồn ở 1 hạng giá trị ${rank.join('/')}`).toBeGreaterThanOrEqual(0.06);
                    expect(max / rankable).toBeLessThan(0.6);
                }
                if (four > N / 2) for (const k of pos) expect(k / four, `${skillId}: vị trí đáp án lệch ${pos.join('/')}`).toBeGreaterThanOrEqual(0.12);
            }));
            it('đủ câu khác nhau', () => {
                const skill = SKILL_MAP.get(skillId)!;
                const keys = new Set<string>();
                for (let i = 0; i < N; i++) { const t = ts[i % ts.length]; keys.add(questionKey(stamp(t, t.make()))); }
                expect(keys.size, `${skillId}: chỉ ${keys.size} câu khác nhau`).toBeGreaterThanOrEqual(skill.grade === 0 ? 6 : 12);
            });
        });
    }
});
