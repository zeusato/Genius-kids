// ============================================================================
//  Sổ đăng ký kỹ năng → template. Topic đã có template thì sinh theo kỹ năng;
//  topic chưa chuyển thì bọc generator cũ thành 1 kỹ năng ẩn "<topicId>.legacy".
// ============================================================================
import { TEMPLATE_SETS } from '../generators/templates';
import { chooseTemplate, stamp } from '../generators/kit';
import type { Generated, Level, SkillDef, Template } from './types';
import { SKILLS, SKILL_MAP, TOPIC_META } from './catalog';
import { Grade } from '../../types';

let legacy: Record<string, () => Generated> = {};
let legacyGrades: Record<string, Grade> = {};
const bySkill = new Map<string, Template[]>();
for (const t of TEMPLATE_SETS.flat()) {
    if (!bySkill.has(t.skillId)) bySkill.set(t.skillId, []);
    bySkill.get(t.skillId)!.push(t);
}

/** mathEngine gọi khi khởi tạo: map topicId → generator cũ (+ lớp của topic). */
export function registerLegacy(map: Record<string, () => Generated>, grades: Record<string, Grade>) {
    legacy = map;
    legacyGrades = grades;
}

export const legacySkillId = (topicId: string) => `${topicId}.legacy`;
const isLegacyId = (id: string) => id.endsWith('.legacy');

/** Topic đã chuyển sang template (ít nhất 1 kỹ năng có template)? */
export const topicConverted = (topicId: string): boolean =>
    SKILLS.some(s => s.topicId === topicId && bySkill.has(s.id));

export function legacySkill(topicId: string): SkillDef {
    const meta = TOPIC_META.find(t => t.id === topicId);
    return {
        id: legacySkillId(topicId), grade: meta?.grade ?? legacyGrades[topicId] ?? Grade.Grade1, topicId,
        strand: meta?.strand ?? 'number', term: 1, title: meta?.title ?? topicId, levels: [1], legacy: true, advanced: meta?.advanced,
    };
}

/** Kỹ năng có nội dung của một topic (đã lọc nâng cao nếu cần). */
export function skillsWithContent(topicId: string, includeAdvanced = false): SkillDef[] {
    if (topicConverted(topicId)) {
        const all = SKILLS.filter(s => s.topicId === topicId && bySkill.has(s.id));
        const basic = all.filter(s => !s.advanced);
        return includeAdvanced || !basic.length ? all : basic;
    }
    return legacy[topicId] ? [legacySkill(topicId)] : [];
}

export const topicHasContent = (topicId: string): boolean => skillsWithContent(topicId, true).length > 0;

export function skillDef(id: string): SkillDef | undefined {
    if (isLegacyId(id)) return legacySkill(id.slice(0, -'.legacy'.length));
    return SKILL_MAP.get(id);
}

/** Các mức có template của kỹ năng (tăng dần). */
export const templateLevels = (skillId: string): Level[] => isLegacyId(skillId) ? [1] : [...new Set((bySkill.get(skillId) || []).map(t => t.level))].sort() as Level[];

export const hasTemplates = (skillId: string): boolean => bySkill.has(skillId) || (isLegacyId(skillId) && !!legacy[skillId.slice(0, -7)]);

/** Mọi kỹ năng có thể sinh câu (gồm legacy). */
export const SKILL_IDS = (): string[] => [
    ...bySkill.keys(),
    ...Object.keys(legacy).filter(t => !topicConverted(t)).map(legacySkillId),
];

/** Sinh 1 câu cho kỹ năng (ở mức gần `level` nhất). */
export function generate(skillId: string, level?: Level): Generated {
    if (isLegacyId(skillId)) {
        const topicId = skillId.slice(0, -'.legacy'.length);
        const q = legacy[topicId]();
        return { ...q, skillId, level: 1 };
    }
    const ts = bySkill.get(skillId);
    if (!ts?.length) throw new Error(`Không có template cho kỹ năng ${skillId}`);
    const t = chooseTemplate(ts, { skillId, level });
    return stamp(t, t.make());
}

/** Toàn bộ template (cho invariants test / dump). */
export const allTemplates = (): Template[] => [...bySkill.values()].flat();
