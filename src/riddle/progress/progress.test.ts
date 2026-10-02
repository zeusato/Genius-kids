import { describe, expect, it } from 'vitest';
import type { StudentProfile } from '../../../types';
import { createRound, roundReducer, type RoundState } from '../engine/round';
import { fx, pool } from '../engine/fixtures';
import { applyRiddle, persistRiddle } from './progress';
import { readProgress } from './model';

const P = pool(['animals', 'plants', 'world'], 12);
const profile = (over: Partial<StudentProfile> = {}): StudentProfile => ({
    id: 'u1', name: 'Bé', age: 8, grade: 3, avatarId: 0, currentAvatarId: 'avatar_01', currentThemeId: 'theme_classic', stars: 5,
    ownedAvatarIds: [], ownedThemeIds: [], ownedImageIds: [], history: [], gameHistory: [], shopDailyPhotos: [], ...over,
} as StudentProfile);

function play(ids: string[], answers: ('right' | 'reveal')[], id = 'round-1', kind: RoundState['kind'] = 'journey'): RoundState {
    const riddles = ids.map(i => P.find(r => r.id === i)!);
    let s = createRound({ id, owner: 'u1', kind, riddles, pref: 'type' });
    riddles.forEach((r, i) => {
        s = roundReducer(s, { type: 'ready' });
        s = answers[i] === 'right' ? roundReducer(s, { type: 'submit', riddle: r, input: r.answer }) : roundReducer(s, { type: 'reveal' });
        s = roundReducer(s, { type: 'next' });
    });
    return s;
}

describe('applyRiddle', () => {
    it('cộng sao và thành tích trong CÙNG một lần ghi', () => {
        const round = play(['animals-0', 'animals-1', 'animals-2'], ['right', 'right', 'right']);
        const out = applyRiddle(profile(), { type: 'round', round }, { pool: P });
        expect(out.accepted).toBe(true);
        expect(out.earned).toBe(3); // 9 dấu ấn / 3
        expect(out.profile.stars).toBeGreaterThanOrEqual(8);
        expect(out.profile.stats!.riddlesSolved).toBe(3);
        expect(out.profile.stats!.riddlesSolvedByCategory.vn_riddle).toBe(3);
        expect(Object.keys(out.profile.riddle!.solved)).toHaveLength(3);
    });
    it('không bao giờ trừ sao; xem đáp án vào danh sách ôn', () => {
        const round = play(['animals-0', 'animals-1'], ['reveal', 'reveal']);
        const out = applyRiddle(profile(), { type: 'round', round }, { pool: P });
        expect(out.profile.stars).toBe(5);
        expect(out.profile.riddle!.review.map(r => r.id)).toEqual(['animals-0', 'animals-1']);
        expect(out.profile.riddle!.rating.vi).toBeLessThan(1.8);
    });
    it('chống ghi trùng cùng một chặng', () => {
        const round = play(['animals-0'], ['right']);
        const first = applyRiddle(profile(), { type: 'round', round }, { pool: P });
        const again = applyRiddle(first.profile, { type: 'round', round }, { pool: P });
        expect(again.changed).toBe(false);
        expect(again.profile.stars).toBe(first.profile.stars);
    });
    it('giải lại câu cũ không có sao', () => {
        const a = applyRiddle(profile(), { type: 'round', round: play(['animals-0'], ['right'], 'r1') }, { pool: P });
        const b = applyRiddle(a.profile, { type: 'round', round: play(['animals-0'], ['right'], 'r2') }, { pool: P });
        expect(b.earned).toBe(0);
    });
    it('đủ 10 câu thì mở cổng, chỉ một lần', () => {
        let p = profile();
        const ids = P.filter(r => r.gate === 'animals').map(r => r.id);
        p = applyRiddle(p, { type: 'round', round: play(ids.slice(0, 5), Array(5).fill('right'), 'g1') }, { pool: P }).profile;
        const out = applyRiddle(p, { type: 'round', round: play(ids.slice(5, 10), Array(5).fill('right'), 'g2') }, { pool: P });
        expect(out.gatesOpened).toEqual(['animals']);
        const later = applyRiddle(out.profile, { type: 'round', round: play(ids.slice(10, 12), ['right', 'right'], 'g3') }, { pool: P });
        expect(later.gatesOpened).toEqual([]);
    });
    it('câu đố hôm nay thưởng thêm một lần trong ngày', () => {
        const now = new Date('2026-10-02T08:00:00');
        const d1 = applyRiddle(profile(), { type: 'round', round: play(['plants-0'], ['right'], 'd1', 'daily') }, { pool: P, now });
        expect(d1.dailyBonus).toBe(2);
        const d2 = applyRiddle(d1.profile, { type: 'round', round: play(['plants-0'], ['right'], 'd2', 'daily') }, { pool: P, now });
        expect(d2.dailyBonus).toBe(0);
    });
    it('nhập tiến độ bản cũ: id còn trong kho vào solved, id đã loại vẫn được đếm', () => {
        const out = applyRiddle(profile(), { type: 'settings', settings: { autoRead: false } }, { pool: P, legacyIds: ['animals-0', 'VN-999', 'animals-0'] });
        const r = out.profile.riddle!;
        expect(r.solved['animals-0'].legacy).toBe(true);
        expect(r.legacySolved).toEqual(['VN-999']);
        expect(r.settings.autoRead).toBe(false);
    });
    it('chặng chưa xong hoặc của người khác bị từ chối', () => {
        const s = createRound({ id: 'x', owner: 'u1', kind: 'journey', riddles: [fx('animals-0')] });
        expect(applyRiddle(profile(), { type: 'round', round: s }, { pool: P }).accepted).toBe(false);
        expect(applyRiddle(profile({ id: 'u2' }), { type: 'round', round: play(['animals-0'], ['right']) }, { pool: P }).accepted).toBe(false);
    });
    it('persistRiddle: hai lần hoàn tất liên tiếp trước khi render không mất sao', () => {
        let store: StudentProfile[] = [profile()];
        const write = (next: StudentProfile[]) => { store = next; };
        const r1 = persistRiddle(store, 'u1', { type: 'round', round: play(['animals-0'], ['right'], 'a') }, write, { pool: P });
        const r2 = persistRiddle(r1.profiles, 'u1', { type: 'round', round: play(['animals-1'], ['right'], 'b') }, write, { pool: P });
        expect(r2.ok).toBe(true);
        expect(store[0].stars).toBe(5 + 1 + 1 + (store[0].stars - 7));
        expect(store[0].riddle!.recentRounds).toEqual(['a', 'b']);
    });
    it('đọc dữ liệu hỏng an toàn', () => {
        const r = readProgress({ version: 1, solved: { x: { at: 'bad', seals: 9 } }, rating: { vi: 99 } }, 2);
        expect(r.solved).toEqual({});
        expect(r.rating.vi).toBe(3);
    });
});
