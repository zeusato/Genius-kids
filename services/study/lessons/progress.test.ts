import { describe, expect, it } from 'vitest';
import type { StudentProfile } from '../../../types';
import { migrateProfile } from '../../profileService';
import { applyLesson, lessonStatus, persistLesson, readLearn, seenCount, type LessonAction } from './progress';

const kid = (over: Partial<StudentProfile> = {}): StudentProfile => ({
    id: 'k1', name: 'Minh', age: 10, grade: 5, avatarId: 0, currentAvatarId: 'avatar_01', currentThemeId: 'theme_classic', stars: 10,
    ownedAvatarIds: ['avatar_01'], ownedThemeIds: ['theme_classic'], ownedImageIds: [], history: [], gameHistory: [], shopDailyPhotos: [], ...over,
});
const SK = 'g5.sum_diff_ratio';
const visit = (page: number, v = 1): LessonAction => ({ kind: 'visit', skillId: SK, v, page, pages: 12 });
const tryA = (correct: number, v = 1): LessonAction => ({ kind: 'try', skillId: SK, v, correct, total: 3, tryIndex: 10 });
const run = (p: StudentProfile, ...as: LessonAction[]) => as.reduce((x, a) => applyLesson(x, a, '2026-10-02').profile, p);
const readAll = (p: StudentProfile, v = 1) => run(p, ...Array.from({ length: 10 }, (_, i) => visit(i, v)));

describe('readLearn', () => {
    it('làm sạch dữ liệu hỏng', () => {
        expect(readLearn(null).lessons).toEqual({});
        const r = readLearn({ version: 1, lessons: { [SK]: { v: 1, seen: -5, at: 99, best: 7, done: 'x', star: 2 }, 'nope.skill': { v: 1, seen: 1, at: 0, best: 0 } } });
        expect(Object.keys(r.lessons)).toEqual([SK]);
        expect(r.lessons[SK]).toEqual({ v: 1, seen: 0, at: 19, best: 3 });
    });
});

describe('applyLesson', () => {
    it('visit bật bit trang, không đổi sao', () => {
        const p = run(kid(), visit(0), visit(3), visit(3));
        expect(seenCount(p.learn!.lessons[SK], 12)).toBe(2);
        expect(p.stars).toBe(10);
        expect(lessonStatus(p.learn!.lessons[SK])).toBe('reading');
    });
    it('chưa xem đủ trang thì Em thử đạt cũng chưa hoàn thành', () => {
        const out = applyLesson(run(kid(), visit(0)), tryA(3), '2026-10-02');
        expect(out.earned).toBe(0);
        expect(out.profile.learn!.lessons[SK].best).toBe(3);
        expect(out.profile.learn!.lessons[SK].done).toBeUndefined();
    });
    it('đủ trang + 2/3 đúng → +1 sao đúng một lần', () => {
        const p = readAll(kid());
        expect(applyLesson(p, tryA(1), 'd').earned).toBe(0);
        const first = applyLesson(p, tryA(2), '2026-10-02');
        expect(first.earned).toBe(1);
        expect(first.completedNow).toBe(true);
        expect(first.profile.stars).toBeGreaterThanOrEqual(11);
        expect(first.profile.stats?.totalStarsEarned).toBeGreaterThanOrEqual(1);
        const again = applyLesson(first.profile, tryA(3), '2026-10-03');
        expect(again.earned).toBe(0);
        expect(again.profile.stars).toBe(first.profile.stars);
        expect(again.profile.learn!.lessons[SK].done).toBe('2026-10-02');
    });
    it('đổi phiên bản nội dung: reset trang, giữ sao, không thưởng lại', () => {
        const done = applyLesson(readAll(kid()), tryA(3), 'd').profile;
        const v2 = run(done, visit(0, 2));
        expect(seenCount(v2.learn!.lessons[SK], 12)).toBe(1);
        expect(v2.learn!.lessons[SK].star).toBe(1);
        expect(applyLesson(readAll(v2, 2), tryA(3, 2), 'e').earned).toBe(0);
    });
    it('từ chối hành động sai', () => {
        expect(applyLesson(kid(), { ...visit(0), skillId: 'x.y' }, 'd').accepted).toBe(false);
        expect(applyLesson(kid(), { ...tryA(4) }, 'd').accepted).toBe(false);
        expect(applyLesson(kid(), visit(25), 'd').accepted).toBe(false);
    });
});

describe('persistLesson', () => {
    it('sai chủ hồ sơ hoặc ghi lỗi thì không đổi gì', () => {
        const profiles = [kid()];
        expect(persistLesson(profiles, 'other', visit(0), () => undefined, 'd').ok).toBe(false);
        const r = persistLesson(profiles, 'k1', visit(0), () => { throw new Error('quota'); }, 'd');
        expect(r.ok).toBe(false);
        expect(r.profiles).toBe(profiles);
    });
    it('ghi một lần, trả hồ sơ mới', () => {
        let written: StudentProfile[] = [];
        const r = persistLesson([kid()], 'k1', visit(2), p => { written = p; }, 'd');
        expect(r.ok).toBe(true);
        expect(written[0].learn!.lessons[SK].at).toBe(2);
    });
});

describe('migrateProfile', () => {
    it('giữ learn khi chuyển hồ sơ dạng cũ', () => {
        const learn = { version: 1 as const, lessons: { [SK]: { v: 1, seen: 3, at: 1, best: 0 } } };
        expect(migrateProfile({ id: 'a', name: 'A', grade: 5, learn }).learn).toEqual(learn);
    });
});
