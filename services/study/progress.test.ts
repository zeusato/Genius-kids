import { describe, it, expect } from 'vitest';
import '../mathEngine';
import { applySession, dailyPlan, dueReviews, emptyProgress, liveStreak, localDay, matrixPlan, readStudyProgress, skillStatus, topicMastery, DAY, MAX_REVIEW, currentTerm, type AnswerRecord } from './progress';
import { sessionReward } from './rewards';
import { hasTemplates, generate } from './registry';
import { SKILL_MAP, skillsOfTopic } from './catalog';
import { QuestionType, type Question, Grade } from '../../types';

const now = new Date('2026-10-05T09:00:00');
let n = 0;
const q = (skillId: string, text = `câu ${n++}`): Question => ({ id: String(n), topicId: SKILL_MAP.get(skillId)!.topicId, type: QuestionType.SingleChoice, questionText: text, options: ['1', '2'], correctAnswer: '1', explanation: 'giải thích đủ dài', skillId, level: 1 });
const rec = (skillId: string, firstTry: boolean, correct = firstTry, text?: string): AnswerRecord => ({ q: q(skillId, text), firstTry, correct });

describe('Tiến độ — thành thạo & mức', () => {
    it('m tăng theo α = 0,25, trạng thái theo ngưỡng', () => {
        let p = emptyProgress();
        p = applySession(p, [rec('g2.mul_table', true)], 'practice', now).progress;
        expect(p.skills['g2.mul_table'].m).toBeCloseTo(0.25);
        expect(skillStatus(p.skills['g2.mul_table'])).toBe('learning');
        for (let i = 0; i < 8; i++) p = applySession(p, [rec('g2.mul_table', true)], 'practice', now).progress;
        expect(p.skills['g2.mul_table'].m).toBeGreaterThan(0.8);
        expect(skillStatus(p.skills['g2.mul_table'])).toBe('mastered');
    });
    it('đúng sau thử lại được 0,5 điểm; sai về 0', () => {
        const p = applySession(emptyProgress(), [rec('g2.mul_table', false, true)], 'practice', now).progress;
        expect(p.skills['g2.mul_table'].m).toBeCloseTo(0.125);
        expect(p.skills['g2.mul_table'].c).toBe(0);
    });
    it('lên mức sau 2 câu đúng liên tiếp, xuống mức khi sai, không vượt biên catalog', () => {
        let p = applySession(emptyProgress(), [rec('g2.addsub100_c', true), rec('g2.addsub100_c', true)], 'practice', now).progress;
        expect(p.skills['g2.addsub100_c'].lvl).toBe(2);
        const atLevel2 = () => ({ ...rec('g2.addsub100_c', true), q: { ...q('g2.addsub100_c'), level: 2 as const } });
        p = applySession(p, [atLevel2(), atLevel2()], 'practice', now).progress;
        expect(p.skills['g2.addsub100_c'].lvl).toBe(3);
        p = applySession(p, [rec('g2.addsub100_c', false)], 'practice', now).progress;
        expect(p.skills['g2.addsub100_c'].lvl).toBe(2);
        let q1 = applySession(emptyProgress(), [rec('g1.count5', false)], 'practice', now).progress;
        expect(q1.skills['g1.count5'].lvl).toBe(1);
        q1 = applySession(q1, [rec('g1.count5', true), rec('g1.count5', true)], 'practice', now).progress;
        expect(q1.skills['g1.count5'].lvl).toBe(1); // chỉ có mức 1
    });
    it('% topic bỏ qua kỹ năng nâng cao', () => {
        const p = applySession(emptyProgress(), [rec('g2.mul_table', true), rec('g2.mul_table34', true)], 'practice', now).progress;
        const pct = topicMastery(p, skillsOfTopic('g2_multiplication'));
        expect(pct).toBeCloseTo(0.25 / 2); // 2 kỹ năng cơ bản (mul_meaning, mul_table)
    });
    it('làm lại câu dễ không tự nâng mức cao hơn', () => {
        let p = applySession(emptyProgress(), [rec('g2.addsub100_c', true), rec('g2.addsub100_c', true)], 'practice', now).progress;
        p = applySession(p, [rec('g2.addsub100_c', true), rec('g2.addsub100_c', true)], 'practice', now).progress;
        expect(p.skills['g2.addsub100_c'].lvl).toBe(2);
    });
});

describe('Ôn câu sai', () => {
    it('ôn sớm không nhảy bậc hoặc xoá câu để nhận thưởng', () => {
        const p = applySession(emptyProgress(), [rec('g3.mul_tables', false)], 'practice', now).progress;
        const item = p.review[0];
        const out = applySession(p, [{ q: { ...item.q, id: 'early' }, key: item.key, firstTry: true, correct: true }], 'review', now);
        expect(out.progress.review).toEqual(p.review);
        expect(out.reviewCleared).toBe(0);
    });
    it('sai thì vào hàng đợi, đến hạn sau 1 ngày; đúng ở chế độ ôn thì giãn [1,3,7,14] rồi xoá', () => {
        let p = applySession(emptyProgress(), [rec('g3.mul_tables', false, false, 'X')], 'practice', now).progress;
        expect(p.review).toHaveLength(1);
        expect(dueReviews(p, now)).toHaveLength(0);
        let t = new Date(now.getTime() + DAY + 1000);
        expect(dueReviews(p, t)).toHaveLength(1);
        const item = p.review[0];
        const again = (time: Date, ok: boolean) => applySession(p, [{ q: { ...item.q, id: 'r' }, firstTry: ok, correct: ok }], 'review', time);
        const steps: number[] = [];
        for (let i = 0; i < 4; i++) {
            const out = again(t, true); p = out.progress;
            if (p.review.length) { steps.push(p.review[0].step); t = new Date(p.review[0].due); t = new Date(t.getTime() + 1000); }
            else { expect(out.reviewCleared).toBe(1); break; }
        }
        expect(steps).toEqual([1, 2, 3]);
        expect(p.review).toHaveLength(0);
    });
    it('sai ở chế độ ôn thì về bước 0', () => {
        let p = applySession(emptyProgress(), [rec('g3.mul_tables', false, false, 'Y')], 'practice', now).progress;
        const it0 = p.review[0];
        p = applySession(p, [{ q: { ...it0.q, id: 'z' }, firstTry: true, correct: true }], 'review', new Date(now.getTime() + 2 * DAY)).progress;
        expect(p.review[0].step).toBe(1);
        p = applySession(p, [{ q: { ...it0.q, id: 'z' }, firstTry: false, correct: false }], 'review', new Date(now.getTime() + 6 * DAY)).progress;
        expect(p.review[0].step).toBe(0);
    });
    it(`giới hạn ${MAX_REVIEW} câu`, () => {
        const recs = Array.from({ length: 100 }, (_, i) => rec('g3.mul_tables', false, false, `Z${i}`));
        expect(applySession(emptyProgress(), recs, 'test', now).progress.review.length).toBe(MAX_REVIEW);
    });
});

describe('Chuỗi ngày & nhật kí', () => {
    it('daily liên tiếp tăng chuỗi, bỏ 1 ngày thì về 1, làm 2 lần trong ngày không tăng', () => {
        let p = applySession(emptyProgress(), [rec('g1.add10', true)], 'daily', now).progress;
        expect(p.streak.count).toBe(1);
        p = applySession(p, [rec('g1.add10', true)], 'daily', now).progress;
        expect(p.streak.count).toBe(1);
        p = applySession(p, [rec('g1.add10', true)], 'daily', new Date(now.getTime() + DAY)).progress;
        expect(p.streak.count).toBe(2);
        expect(liveStreak(p, new Date(now.getTime() + 2 * DAY))).toBe(2);
        expect(liveStreak(p, new Date(now.getTime() + 3 * DAY))).toBe(0);
        p = applySession(p, [rec('g1.add10', true)], 'daily', new Date(now.getTime() + 3 * DAY)).progress;
        expect(p.streak.count).toBe(1);
        expect(p.days[localDay(now)].n).toBe(2);
    });
    it('readStudyProgress làm sạch dữ liệu hỏng', () => {
        const dirty = { version: 1, skills: { 'g1.add10': { a: 3, c: 9, m: 7, lvl: 9, last: 1 }, 'khong.co': { a: 1 } }, review: [{ key: 1 }], days: { x: 1 }, streak: { count: 'a', last: '2026-10-01' }, prefs: {} };
        const p = readStudyProgress(dirty);
        expect(p.skills['g1.add10']).toEqual({ a: 3, c: 3, m: 1, lvl: 1, last: '' });
        expect(p.skills['khong.co']).toBeUndefined();
        expect(p.review).toEqual([]);
        expect(readStudyProgress(null).version).toBe(1);
    });
});

describe('Kế hoạch phiên', () => {
    const avail = (id: string) => hasTemplates(id);
    it('học kì theo tháng', () => {
        expect(currentTerm(new Date('2026-10-01'))).toBe(1);
        expect(currentTerm(new Date('2027-03-01'))).toBe(2);
        expect(currentTerm(new Date('2027-07-01'))).toBeNull();
    });
    it('daily: hồ sơ mới đủ số câu, toàn kỹ năng đúng lớp & không nâng cao', () => {
        for (const g of [Grade.Preschool, Grade.Grade1, Grade.Grade3, Grade.Grade5]) {
            const plan = dailyPlan(emptyProgress(), g, avail, now);
            expect(plan.picks.reduce((s, x) => s + x.count, 0) + plan.review.length).toBe(plan.count);
            for (const pk of plan.picks) { const s = SKILL_MAP.get(pk.skillId)!; expect(s.grade).toBe(g); expect(s.advanced).toBeFalsy(); }
        }
    });
    it('daily: ưu tiên ôn câu đến hạn (≤ 40%) và kỹ năng yếu', () => {
        let p = emptyProgress();
        const recs = Array.from({ length: 10 }, (_, i) => rec('g3.mul_tables', false, false, `D${i}`));
        p = applySession(p, [...recs, rec('g3.div_tables', true)], 'practice', now).progress;
        const plan = dailyPlan(p, Grade.Grade3, avail, new Date(now.getTime() + 2 * DAY));
        expect(plan.review.length).toBe(4);
        expect(plan.picks[0].skillId).toBe('g3.mul_tables'); // yếu nhất
    });
    it('daily loại câu ôn nâng cao và của lớp khác', () => {
        const p = applySession(emptyProgress(), [rec('g2.mul_table34', false), rec('g3.mul_tables', false)], 'practice', now).progress;
        expect(dailyPlan(p, Grade.Grade2, avail, new Date(now.getTime() + 2 * DAY)).review).toEqual([]);
    });
    it('ma trận: đủ số câu, tỉ lệ mức 5:3:2, mỗi mạch ≥ 1', () => {
        const plan = matrixPlan(Grade.Grade4, 1, 20, avail, () => 0.3);
        expect(plan).toHaveLength(20);
        const lv = [1, 2, 3].map(l => plan.filter(x => x.level === l).length);
        expect(lv).toEqual([10, 6, 4]);
        const strands = new Set(plan.map(x => SKILL_MAP.get(x.skillId)!.strand));
        expect(strands.size).toBeGreaterThanOrEqual(3);
        for (const x of plan) expect(SKILL_MAP.get(x.skillId)!.term).toBe(1);
        expect(() => generate(plan[0].skillId, plan[0].level)).not.toThrow();
    });
});

describe('Phần thưởng', () => {
    it('quy tắc sao', () => {
        expect(sessionReward({ mode: 'practice', total: 3, score: 3, firstTryCorrect: 3, masteredNow: 0, reviewCleared: 0 }).stars).toBe(0);
        expect(sessionReward({ mode: 'practice', total: 10, score: 10, firstTryCorrect: 10, masteredNow: 1, reviewCleared: 0 })).toEqual({ stars: 4, allowGacha: false });
        expect(sessionReward({ mode: 'daily', total: 10, score: 8, firstTryCorrect: 8, masteredNow: 0, reviewCleared: 0 })).toEqual({ stars: 4, allowGacha: true });
        expect(sessionReward({ mode: 'review', total: 10, score: 10, firstTryCorrect: 10, masteredNow: 0, reviewCleared: 7 })).toEqual({ stars: 1, allowGacha: false });
        expect(sessionReward({ mode: 'test', total: 20, score: 20, firstTryCorrect: 20, masteredNow: 0, reviewCleared: 0 })).toEqual({ stars: 5, allowGacha: true });
        expect(sessionReward({ mode: 'test', total: 8, score: 8, firstTryCorrect: 8, masteredNow: 0, reviewCleared: 0 }).stars).toBe(0);
    });
});
