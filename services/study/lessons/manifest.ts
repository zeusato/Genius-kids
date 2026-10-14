// Danh mục bài học (nhẹ, không kéo nội dung vào bundle chính). Test khoá khớp với content/gN.ts.
import { Grade } from '../../../types';
import { SKILL_MAP } from '../catalog';

export const LESSON_INDEX: Record<Grade, string[]> = {
    [Grade.Preschool]: ['mn.ordinal', 'mn.combine', 'mn.pattern', 'mn.shapes3d', 'mn.position', 'mn.daytime'],
    [Grade.Grade1]: [
        'g1.count5', 'g1.compare5', 'g1.order5', 'g1.count10',
        'g1.compare10', 'g1.split10', 'g1.add10', 'g1.add10_missing',
        'g1.add10_compare', 'g1.sub10', 'g1.sub10_missing', 'g1.chain10',
        'g1.write_eq', 'g1.shapes2d', 'g1.shapes3d', 'g1.position',
        'g1.numbers20', 'g1.numbers100', 'g1.compare100', 'g1.neighbors100',
        'g1.addsub100', 'g1.addsub20', 'g1.carry20', 'g1.length_cm',
        'g1.length_compare', 'g1.length_ops', 'g1.clock', 'g1.weekday',
        'g1.calendar_day', 'g1.daytime', 'g1.word10', 'g1.word100',
    ],
    [Grade.Grade2]: [
        'g2.addsub20', 'g2.addsub100_nc', 'g2.addsub100_c', 'g2.chain',
        'g2.terms', 'g2.missing', 'g2.compare_expr', 'g2.word_more_less',
        'g2.kg', 'g2.liter', 'g2.length', 'g2.clock',
        'g2.hours_day', 'g2.calendar_month', 'g2.points_lines', 'g2.polyline',
        'g2.quadrilateral', 'g2.shapes3d', 'g2.mul_meaning', 'g2.mul_table',
        'g2.mul_table34', 'g2.div_meaning', 'g2.div_table', 'g2.div_table34',
        'g2.numbers1000', 'g2.compare1000', 'g2.addsub1000', 'g2.money',
        'g2.money_big', 'g2.tally', 'g2.pictograph', 'g2.chance',
    ],
    [Grade.Grade3]: [
        'g3.mul_tables', 'g3.mul_1digit', 'g3.times_more', 'g3.mul_2digit',
        'g3.div_tables', 'g3.div_1digit', 'g3.times_less', 'g3.how_many_times',
        'g3.expression', 'g3.missing', 'g3.unit_fraction', 'g3.fraction_of', 'g3.fraction_ab', 'g3.word_2step', 'g3.sum_diff',
        'g3.numbers10000', 'g3.numbers100000', 'g3.compare', 'g3.round', 'g3.roman', 'g3.addsub100000', 'g3.muldiv_big',
        'g3.midpoint', 'g3.circle', 'g3.right_angle', 'g3.polygon', 'g3.rect_square', 'g3.solids', 'g3.perimeter', 'g3.area_cm2', 'g3.small_units', 'g3.temperature',
        'g3.clock_minute', 'g3.month_year', 'g3.duration', 'g3.money', 'g3.data_table', 'g3.bar_chart', 'g3.chance',
    ],
    [Grade.Grade4]: [
        'g4.read_write', 'g4.place_class', 'g4.compare', 'g4.round',
        'g4.even_odd', 'g4.addsub', 'g4.properties_add', 'g4.letter_expr',
        'g4.angle_types', 'g4.angle_measure', 'g4.angle_compare', 'g4.perp_parallel',
        'g4.mass', 'g4.area_units', 'g4.time_units', 'g4.mul',
        'g4.mul10', 'g4.properties_mul', 'g4.div', 'g4.div10',
        'g4.expr', 'g4.average', 'g4.sum_diff', 'g4.unit_rate',
        'g4.word_multi', 'g4.fraction_concept', 'g4.fraction_equiv', 'g4.fraction_common',
        'g4.fraction_compare', 'g4.frac_addsub', 'g4.frac_mul', 'g4.frac_div',
        'g4.fraction_of', 'g4.frac_addsub_any', 'g4.para_rhombus_id', 'g4.rect_word',
        'g4.para_area', 'g4.data_series', 'g4.bar_chart', 'g4.events',
        'g4.sequence', 'g4.divisibility',
    ],
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
export const PUBLISHED_GRADES: Grade[] = [Grade.Preschool, Grade.Grade1, Grade.Grade2, Grade.Grade3, Grade.Grade4, Grade.Grade5];

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
