// "Em thử": 3 câu sinh từ template của kỹ năng (luôn đúng, mỗi lần một số khác).
import type { Question } from '../../../types';
import type { Level } from '../types';
import { templateLevels } from '../registry';
import { buildSession } from '../session';
import type { Lesson } from './types';

export const TRY_COUNT = 3;

/** Mức của 3 câu: tryLevels → mức các dạng → bù các mức có template, từ thấp đến cao. */
export function tryLevels(lesson: Lesson): Level[] {
    const avail = templateLevels(lesson.skillId);
    if (!avail.length) return [];
    const ok = (l: Level) => avail.includes(l);
    const base = (lesson.tryLevels?.length ? lesson.tryLevels : lesson.forms.map(f => f.level).filter((l): l is Level => !!l)).filter(ok);
    const out = base.slice(0, TRY_COUNT);
    for (let i = 0; out.length < TRY_COUNT; i++) out.push(avail[i % avail.length]);
    return out.sort((a, b) => a - b);
}

export function buildTry(lesson: Lesson): Question[] {
    const levels = tryLevels(lesson);
    const picks = [...new Set(levels)].map(level => ({ skillId: lesson.skillId, level, count: levels.filter(l => l === level).length }));
    if (!picks.length) return [];
    const s = buildSession({ picks, count: levels.length, keepOrder: true, includeAdvanced: true });
    return s.questions;
}
