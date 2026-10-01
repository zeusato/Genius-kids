// ============================================================================
//  Dựng phiên học: chia câu theo topic → kỹ năng → mức; chống trùng (gồm cả hình);
//  không vứt âm thầm câu 2–3 lựa chọn; báo thiếu câu qua `shortBy`.
// ============================================================================
import { Question, QuestionType } from '../../types';
import { generatorRandom } from '../generators/random';
import { sameValue } from './value';
import { generate, skillDef, skillsWithContent } from './registry';
import type { Generated, Level } from './types';

export interface SessionSlot { skillId: string; level?: Level }
export interface SessionSpec {
    topicIds?: string[];
    /** Danh sách kỹ năng cụ thể (vd "Ôn hôm nay"); `count` câu mỗi mục. */
    picks?: { skillId: string; level?: Level; count: number }[];
    count: number;
    includeAdvanced?: boolean;
    /** Mức gợi ý theo tiến độ (thích ứng). */
    levelFor?: (skillId: string) => Level | undefined;
    /** Giữ thứ tự slot (không xáo câu). */
    keepOrder?: boolean;
}
export interface Session { questions: Question[]; shortBy: number }

const rnd = (n: number) => Math.floor(generatorRandom() * n);
const shuffled = <T,>(a: T[]): T[] => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = rnd(i + 1); [b[i], b[j]] = [b[j], b[i]]; } return b; };

function hash(s: string): string {
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36);
}

/** Khoá chống trùng: kỹ năng + đề + lựa chọn + đáp án + hình. */
export function questionKey(q: Generated): string {
    const visual = q.visual ? JSON.stringify(q.visual) : q.visualSvg ? hash(q.visualSvg) : '';
    const correct = q.correctAnswer ?? (q.correctAnswers || []).join('|');
    return `${q.skillId}|${q.questionText}|${[...(q.options || [])].sort().join('|')}|${correct}|${visual}`;
}

/** Chuẩn hoá câu (chủ yếu cho generator cũ): bỏ lựa chọn trùng theo giá trị; trả null nếu câu hỏng. */
export function sanitize(q: Generated): Generated | null {
    if (!q || !q.questionText) return null;
    if (q.type === QuestionType.SingleChoice || q.type === QuestionType.SelectWrong) {
        if (!q.options || q.correctAnswer === undefined || !q.options.includes(q.correctAnswer)) return null;
        const opts: string[] = [];
        // giữ đáp án đúng, bỏ lựa chọn khác trùng giá trị với nó hoặc với nhau
        for (const o of q.options) {
            if (o === q.correctAnswer) { if (!opts.includes(o)) opts.push(o); continue; }
            if (sameValue(o, q.correctAnswer) || opts.some(x => sameValue(x, o))) continue;
            opts.push(o);
        }
        if (opts.length < 2) return null;
        return { ...q, options: opts.slice(0, 4).includes(q.correctAnswer) ? opts.slice(0, 4) : [q.correctAnswer, ...opts.filter(o => o !== q.correctAnswer).slice(0, 3)] };
    }
    if (q.type === QuestionType.MultipleSelect) {
        if (!q.options || !q.correctAnswers?.length) return null;
        const opts = [...new Set(q.options)];
        if (!q.correctAnswers.every(c => opts.includes(c)) || opts.length < q.correctAnswers.length + 1) return null;
        return { ...q, options: opts };
    }
    if (q.type === QuestionType.ManualInput) return q.correctAnswer ? q : null;
    return q;
}

const newId = () => Math.random().toString(36).slice(2, 10);

export function buildSession(spec: SessionSpec): Session {
    const slots: SessionSlot[] = [];
    const levelOf = (skillId: string): Level | undefined => {
        const fixed = spec.levelFor?.(skillId);
        if (fixed) return fixed;
        const s = skillDef(skillId);
        return s ? s.levels[rnd(s.levels.length)] : undefined;
    };
    if (spec.picks?.length) {
        for (const p of spec.picks) for (let i = 0; i < p.count; i++) slots.push({ skillId: p.skillId, level: p.level ?? levelOf(p.skillId) });
    } else {
        const topics = (spec.topicIds || []).filter(t => skillsWithContent(t, spec.includeAdvanced).length);
        if (topics.length) {
            const per = Math.floor(spec.count / topics.length), extra = spec.count % topics.length;
            shuffled(topics).forEach((t, i) => {
                const skills = shuffled(skillsWithContent(t, spec.includeAdvanced));
                const n = per + (i < extra ? 1 : 0);
                for (let k = 0; k < n; k++) { const s = skills[k % skills.length]; slots.push({ skillId: s.id, level: levelOf(s.id) }); }
            });
        }
    }

    const seen = new Set<string>();
    const questions: Question[] = [];
    let shortBy = 0;
    const tryMake = (skillId: string, level: Level | undefined): Question | null => {
        for (let attempt = 0; attempt < 25; attempt++) {
            let raw: Generated;
            try { raw = generate(skillId, level); } catch { return null; }
            const q = sanitize(raw);
            if (!q) continue;
            const key = questionKey(q);
            if (seen.has(key)) continue;
            seen.add(key);
            const def = skillDef(skillId);
            return { ...q, id: newId(), topicId: def?.topicId ?? skillId.split('.')[0] };
        }
        return null;
    };
    for (const slot of slots) {
        let q = tryMake(slot.skillId, slot.level);
        if (!q) {
            // kỹ năng đã cạn câu khác nhau → mượn kỹ năng khác cùng topic
            const def = skillDef(slot.skillId);
            for (const alt of shuffled(def ? skillsWithContent(def.topicId, spec.includeAdvanced) : [])) {
                if (alt.id === slot.skillId) continue;
                q = tryMake(alt.id, levelOf(alt.id));
                if (q) break;
            }
        }
        if (q) questions.push(q); else shortBy++;
    }
    return { questions: spec.keepOrder ? questions : shuffled(questions), shortBy };
}
