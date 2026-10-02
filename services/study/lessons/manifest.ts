// Danh mục bài học (nhẹ, không kéo nội dung vào bundle chính). Test khoá khớp với content/gN.ts.
import { Grade } from '../../../types';
import { SKILL_MAP } from '../catalog';

export const LESSON_INDEX: Record<Grade, string[]> = {
    [Grade.Preschool]: [],
    [Grade.Grade1]: [],
    [Grade.Grade2]: [],
    [Grade.Grade3]: ['g3.div_1digit'],
    [Grade.Grade4]: [],
    [Grade.Grade5]: ['g5.sum_diff_ratio'],
};

/** Lớp đã duyệt, hiện cho trẻ. Bản dev hiện mọi lớp có bài (nhãn "Bản nháp"). */
export const PUBLISHED_GRADES: Grade[] = [];

const ALL = new Set(Object.values(LESSON_INDEX).flat());
const dev = (): boolean => { try { return !!import.meta.env?.DEV; } catch { return false; } };

export const isPublished = (grade: Grade): boolean => PUBLISHED_GRADES.includes(grade);
export const gradeVisible = (grade: Grade, includeDraft = dev()): boolean => isPublished(grade) || (includeDraft && LESSON_INDEX[grade].length > 0);

export function hasLesson(skillId: string, includeDraft = dev()): boolean {
    const s = SKILL_MAP.get(skillId);
    return !!s && ALL.has(skillId) && gradeVisible(s.grade, includeDraft);
}

/** Kỹ năng có bài học của một chủ đề, theo thứ tự catalog. */
export const topicLessonIds = (skillIds: string[], includeDraft = dev()): string[] => skillIds.filter(id => hasLesson(id, includeDraft));
