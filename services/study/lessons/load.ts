// Tải lười nội dung bài học theo lớp (mỗi lớp một chunk, PWA precache như mọi JS).
import { Grade } from '../../../types';
import type { LessonBook } from './types';

const LOADERS: Record<Grade, () => Promise<{ default: LessonBook }>> = {
    [Grade.Preschool]: () => import('./content/mn'),
    [Grade.Grade1]: () => import('./content/g1'),
    [Grade.Grade2]: () => import('./content/g2'),
    [Grade.Grade3]: () => import('./content/g3'),
    [Grade.Grade4]: () => import('./content/g4'),
    [Grade.Grade5]: () => import('./content/g5'),
};
const cache = new Map<Grade, Promise<LessonBook>>();

export function loadLessonBook(grade: Grade): Promise<LessonBook> {
    if (!cache.has(grade)) cache.set(grade, LOADERS[grade]().then(m => m.default).catch(e => { cache.delete(grade); throw e; }));
    return cache.get(grade)!;
}

export const gradeOfSkill = (skillId: string): Grade => {
    const m = skillId.match(/^g(\d)\./);
    return m ? (Number(m[1]) as Grade) : Grade.Preschool;
};
