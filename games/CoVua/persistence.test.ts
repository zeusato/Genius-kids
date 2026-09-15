import { persistResult } from './profile-adapter';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { StudentProfile } from '../../types';
import type { Match, Player } from './model';
import { matchFromFen, applyMove, validateMatch } from './engine';
import { algToSq } from './board';
import { clearCoVuaData, loadDraft, saveDraft, loadParty, saveParty } from './persistence';

const party: [Player, Player] = [
  { id: 'host', name: 'An', kind: 'human', level: 'medium', avatar: 'avatar_01' },
  { id: 'guest', name: 'Bông', kind: 'human', level: 'medium', avatar: 'avatar_02' },
];
const profile = (id = 'owner'): StudentProfile => ({ id, name: 'An', age: 8, grade: 3, avatarId: 0, currentAvatarId: 'avatar_01', currentThemeId: 'default', stars: 30, ownedAvatarIds: [], ownedThemeIds: [], ownedImageIds: [], history: [], gameHistory: [], shopDailyPhotos: [] } as any);

const mv = (s: string) => ({ from: algToSq(s.slice(0, 2)), to: algToSq(s.slice(2, 4)) });
// Ván kết thúc: win = Trắng chiếu bí (chủ thắng), loss = Đen chiếu bí, draw = bí nước.
function ended(result: 'win' | 'draw' | 'loss' = 'win'): Match {
  let m: Match;
  if (result === 'win') m = applyMove(matchFromFen('owner', party, 'unique-match', '6k1/5ppp/8/8/8/8/8/R6K w - - 0 1'), mv('a1a8')).match;
  else if (result === 'loss') m = applyMove(matchFromFen('owner', party, 'unique-match', 'r6k/8/8/8/8/8/5PPP/6K1 b - - 0 1'), mv('a8a1')).match;
  else m = applyMove(matchFromFen('owner', party, 'unique-match', '7k/8/6K1/8/8/8/5Q2/8 w - - 0 1'), mv('f2f7')).match;
  m = { ...m, elapsed: 125400 };
  if (!validateMatch(m) || m.phase !== 'over') throw Error('bad fixture ' + result + ' ' + m.reason);
  return m;
}

beforeEach(() => { const memory = new Map<string, string>(); vi.stubGlobal('localStorage', { getItem: (k: string) => memory.get(k) ?? null, setItem: (k: string, v: string) => memory.set(k, v), removeItem: (k: string) => memory.delete(k) }); });
afterEach(() => vi.unstubAllGlobals());

describe('Cờ Vua profile persistence', () => {
  it('khôi phục ván đã commit, tách theo chủ hồ sơ', () => {
    const s = applyMove(matchFromFen('owner', party, 'id', 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'), mv('e2e4')).match;
    expect(saveDraft(s)).toBe(true);
    expect(loadDraft('owner')).toEqual({ match: s, error: false });
    expect(loadDraft('other').match).toBeNull();
  });
  it('từ chối bản lưu hỏng, khác chủ, khác phiên bản', () => {
    for (const value of ['{', JSON.stringify({ ...ended(), owner: 'other' }), JSON.stringify({ ...ended(), rulesVersion: 'old' }), JSON.stringify({ ...ended(), winner: 3 })]) {
      localStorage.setItem('co-vua:owner:draft-v1', value);
      expect(loadDraft('owner')).toEqual({ match: null, error: true });
    }
  });
  it('vẫn chơi được khi storage bị chặn', () => {
    vi.stubGlobal('localStorage', { getItem: () => { throw Error('denied'); }, setItem: () => { throw Error('full'); } });
    expect(saveDraft(ended())).toBe(false);
    expect(loadDraft('owner').error).toBe(true);
    expect(loadParty('owner')).toBeNull();
    expect(() => saveParty('owner', party)).not.toThrow();
  });
  it('kiểm tra ghế đã lưu', () => {
    saveParty('owner', party); expect(loadParty('owner')).toEqual(party);
    for (const bad of [[{ ...party[0], kind: 'bot' as const }, party[1]], [party[0], { ...party[1], level: 'invalid' as any }]]) {
      saveParty('owner', bad as [Player, Player]); expect(loadParty('owner')).toBeNull();
    }
  });
  it.each(['win', 'draw', 'loss'] as const)('ghi kết quả chủ %s, không phát sao', result => {
    const before = [profile(), profile('other')], copy = structuredClone(before), s = ended(result);
    const r = persistResult(before, 'owner', s, () => { });
    expect(r.ok).toBe(true);
    expect(before).toEqual(copy);                       // không đột biến đầu vào
    expect(r.profiles[1]).toBe(before[1]);              // hồ sơ khác giữ nguyên tham chiếu
    expect(r.profiles[0].stars).toBe(30);              // không cộng sao
    expect(r.profiles[0].gameHistory[0]).toMatchObject({ gameType: 'co-vua', starsEarned: 0, durationSeconds: 125 });
    expect(r.profiles[0].stats?.gameWins['co-vua'] || 0).toBe(result === 'win' ? 1 : 0);
    expect(r.profiles[0].stats?.totalGamesPlayed).toBe(1);
  });
  it('ghi một lần dù thử lại', () => {
    const first = persistResult([profile()], 'owner', ended(), () => { });
    const write = vi.fn();
    const second = persistResult(first.profiles, 'owner', ended(), write);
    expect(second.profiles).toBe(first.profiles);
    expect(write).not.toHaveBeenCalled();
    expect(second.profiles[0].gameHistory).toHaveLength(1);
  });
  it('không công bố khi ghi lỗi, cho phép thử lại', () => {
    const before = [profile()], copy = structuredClone(before);
    expect(persistResult(before, 'owner', ended(), () => { throw Error('full'); })).toEqual({ ok: false, profiles: before });
    expect(before).toEqual(copy);
    expect(persistResult(before, 'owner', ended(), () => { }).ok).toBe(true);
  });
  it('từ chối ván chưa xong, chủ lạ, hồ sơ rỗng', () => {
    const write = vi.fn();
    const live = matchFromFen('owner', party, 'live', 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    expect(persistResult([profile()], 'owner', live, write).ok).toBe(false);
    expect(persistResult([profile()], 'other', ended(), write).ok).toBe(false);
    expect(persistResult([], 'owner', ended(), write).ok).toBe(false);
    expect(write).not.toHaveBeenCalled();
  });
  it('chỉ xóa dữ liệu của chủ hồ sơ được yêu cầu', () => {
    saveDraft(ended()); saveParty('owner', party); saveParty('other', party); localStorage.setItem('co-vua:owner:prefs', '{}');
    clearCoVuaData('owner');
    expect(loadDraft('owner').match).toBeNull();
    expect(loadParty('owner')).toBeNull();
    expect(localStorage.getItem('co-vua:owner:prefs')).toBeNull();
    expect(loadParty('other')).toEqual(party);
  });
});
