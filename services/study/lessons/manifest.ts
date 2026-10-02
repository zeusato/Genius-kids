// Danh mục bài học (nhẹ, không kéo nội dung vào bundle chính). Test khoá khớp với content/gN.ts.
import { Grade } from '../../../types';
import { SKILL_MAP } from '../catalog';

export const LESSON_INDEX: Record<Grade, string[]> = {
    [Grade.Preschool]: [],
    [Grade.Grade1]: [],
    [Grade.Grade2]: [],
    [Grade.Grade3]: [
        'g3.mul_tables', 'g3.mul_1digit', 'g3.times_more', 'g3.mul_2digit',
        'g3.div_tables', 'g3.div_1digit', 'g3.times_less', 'g3.how_many_times',
        'g3.expression', 'g3.missing', 'g3.unit_fraction', 'g3.fraction_of', 'g3.fraction_ab', 'g3.word_2step', 'g3.sum_diff',
        'g3.numbers10000', 'g3.numbers100000', 'g3.compare', 'g3.round', 'g3.roman', 'g3.addsub100000', 'g3.muldiv_big',
        'g3.midpoint', 'g3.circle', 'g3.right_angle', 'g3.polygon', 'g3.rect_square', 'g3.solids', 'g3.perimeter', 'g3.area_cm2', 'g3.small_units', 'g3.temperature',
        'g3.clock_minute', 'g3.month_year', 'g3.duration', 'g3.money', 'g3.data_table', 'g3.bar_chart', 'g3.chance',
    ],
    [Grade.Grade4]: [],
    [Grade.Grade5]: [
        'g5.decimal_fraction', 'g5.mixed_number', 'g5.frac_addsub', 'g5.frac_muldiv', 'g5.frac_compare',
        'g5.decimal_read', 'g5.decimal_compare', 'g5.decimal_round', 'g5.measure_decimal', 'g5.dec_addsub', 'g5.dec_mul', 'g5.dec_div', 'g5.dec_shift',
        'g5.ratio', 'g5.percent', 'g5.map_scale', 'g5.sum_diff_ratio', 'g5.interest',
        'g5.expr', 'g5.motion', 'g5.motion_two', 'g5.work_together', 'g5.stream',
        'g5.triangle_area', 'g5.trapezoid_area', 'g5.circle', 'g5.solid_area', 'g5.volume', 'g5.nets', 'g5.para_area',
        'g5.area_units_big', 'g5.volume_units', 'g5.time_addsub', 'g5.time_muldiv', 'g5.pie_chart', 'g5.bar_read', 'g5.chance_ratio',
    ],
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
