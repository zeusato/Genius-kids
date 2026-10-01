import { describe, expect, it } from 'vitest';
import { TOPICS } from '../mathEngine';
import { withGeneratorRandom } from '../generators/random';
import { SKILLS, SKILL_MAP } from './catalog';
import { buildSession, questionKey } from './session';
import { hasTemplates } from './registry';
import { dailyPlan, emptyProgress, matrixPlan } from './progress';
import type { Grade } from '../../types';

function seeded() { let n = 1729; return () => ((n = Math.imul(n, 1664525) + 1013904223 >>> 0) / 4294967296); }

describe('Phiên học thực tế', () => {
    it('mọi kỹ năng trong catalog có nội dung', () => {
        expect(SKILLS.filter(s => !s.legacy && !hasTemplates(s.id)).map(s => s.id)).toEqual([]);
    });
    it('mọi chủ đề tạo đủ 20 câu, không trùng', () => withGeneratorRandom(seeded(), () => {
        for (const t of TOPICS.filter(t => !t.id.includes('typing'))) {
            const s = buildSession({ topicIds: [t.id], count: 20, includeAdvanced: true });
            expect(s.shortBy, t.id).toBe(0);
            expect(s.questions, t.id).toHaveLength(20);
            expect(new Set(s.questions.map(questionKey)).size, t.id).toBe(20);
        }
    }), 20000);
    it('ma trận giữ đúng mức sau khi sinh, đủ mạch và đúng học kì', () => withGeneratorRandom(seeded(), () => {
        for (const grade of [1, 2, 3, 4, 5] as Grade[]) for (const term of [1, 2, 'all'] as const) for (const count of [10, 20, 30]) {
            const plan = matrixPlan(grade, term, count, hasTemplates, seeded());
            const s = buildSession({ picks: plan, count, keepOrder: true });
            const label = `L${grade} HK${term} ${count} câu`;
            expect(s.shortBy, label).toBe(0);
            expect([1, 2, 3].map(l => s.questions.filter(q => q.level === l).length), label).toEqual([count * .5, count * .3, count * .2]);
            const expected = new Set(SKILLS.filter(x => x.grade === grade && !x.advanced && (term === 'all' || x.term === term)).map(x => x.strand));
            expect(new Set(s.questions.map(q => SKILL_MAP.get(q.skillId!)!.strand)), label).toEqual(expected);
            for (const q of s.questions) {
                const skill = SKILL_MAP.get(q.skillId!)!;
                expect(skill.grade).toBe(grade); expect(skill.advanced).toBeFalsy();
                if (term !== 'all') expect(skill.term).toBe(term);
            }
        }
    }), 20000);
    it('hồ sơ mới tạo đủ phiên daily đúng lớp và mức hỗ trợ', () => {
        for (const grade of [0, 1, 2, 3, 4, 5] as Grade[]) {
            const plan = dailyPlan(emptyProgress(), grade, hasTemplates, new Date('2026-10-01T10:00:00'));
            const s = buildSession({ picks: plan.picks, count: plan.count });
            expect(s.questions).toHaveLength(grade === 0 ? 6 : grade === 1 ? 8 : 10);
            expect(s.shortBy).toBe(0);
        }
    });
    it('báo thiếu khi không có nội dung, loại câu đã có trong hàng đợi', () => {
        expect(buildSession({ topicIds: ['missing'], count: 10 }).shortBy).toBe(10);
        const spec = { topicIds: ['g3_multiplication'], count: 10 };
        const original = buildSession(spec);
        const keys = original.questions.map(questionKey);
        const other = buildSession({ ...spec, excludeKeys: keys });
        expect(other.questions.every(q => !keys.includes(questionKey(q)))).toBe(true);
    });
});
