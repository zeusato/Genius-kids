import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { newMatch, place, finish, winningLines, validateMatch, undo, replayBoard } from './engine';
import { SIZE, opposite, type Match, type Side } from './model';
import { search, winningMoves } from './bot';
import { BotController, type BotRequest, type WorkerPort } from './bot-controller';
import { loadDraft, saveDraft, clearCaroData } from './persistence';
import { persistResult } from './profile-adapter';
import type { StudentProfile } from '../../types';
const make = (overrides: Partial<Match> = {}) => ({ ...newMatch({ owner: 'child', ownerSide: 0, players: [{ name: 'An', avatar: '🌱', kind: 'human' }, { name: 'Bình', avatar: '🐰', kind: 'human' }], mode: 'human', level: 'easy', undoEnabled: true }, 'caro-test'), ...overrides });
const idx = (r: number, c: number) => r * SIZE + c;
const profile = (id = 'child'): StudentProfile => ({ id, name: 'An', grade: 3, age: 8, avatarId: 0, currentAvatarId: 'avatar_01', currentThemeId: 'default', stars: 30, ownedAvatarIds: [], ownedThemeIds: [], ownedImageIds: [], history: [], gameHistory: [], shopDailyPhotos: [] });
beforeEach(() => { const data = new Map<string, string>(); vi.stubGlobal('localStorage', { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => data.set(k, v), removeItem: (k: string) => data.delete(k) }); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
describe('Caro exact-five rules', () => {
  for (const side of [0, 1] as Side[]) for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
    it(`side ${side}, direction ${dr},${dc}: open, blocked, overline and edge`, () => {
      const board = Array(225).fill(0), line = Array.from({ length: 5 }, (_, i) => idx(5 + dr * i, 7 + dc * i));
      line.forEach(i => { board[i] = side + 1; });
      expect(winningLines(board, line[2], side)).toContainEqual(line);
      const before = idx(5 - dr, 7 - dc), after = idx(5 + dr * 5, 7 + dc * 5);
      board[before] = opposite(side) + 1; expect(winningLines(board, line[2], side)).toHaveLength(1);
      board[after] = opposite(side) + 1; expect(winningLines(board, line[2], side)).toHaveLength(0);
      board[after] = side + 1; expect(winningLines(board, line[2], side)).toHaveLength(0);
    });
  }
  it('does not wrap rows and does not count the edge as an opponent', () => {
    const board = Array(225).fill(0); [13, 14, 15, 16, 17].forEach(i => { board[i] = 1; }); expect(winningLines(board, 15, 0)).toEqual([]);
    board.fill(0); [0, 1, 2, 3, 4].forEach(i => { board[i] = 1; }); board[5] = 2; expect(winningLines(board, 0, 0)).toEqual([[0, 1, 2, 3, 4]]);
  });
  it('finds every winning axis even when another axis is an overline', () => {
    const board = Array(225).fill(0); for (let i = 3; i <= 7; i++) board[idx(i, 7)] = 1;
    for (let c = 4; c <= 9; c++) board[idx(5, c)] = 1;
    expect(winningLines(board, idx(5, 7), 0)).toEqual([[idx(3, 7), idx(4, 7), idx(5, 7), idx(6, 7), idx(7, 7)]]);
  });
  it('commits a win before the next input and validates replay, not saved claims', () => {
    let s = make(); for (const i of [0, 30, 1, 32, 2, 34, 3, 36, 4]) s = place(s, i);
    expect(s).toMatchObject({ phase: 'over', winner: 0, endReason: 'five' }); expect(validateMatch(s, 'child')).toBe(true);
    expect(place(s, 100)).toBe(s); expect(validateMatch({ ...s, winner: 1 })).toBe(false);
    expect(validateMatch({ ...s, moves: [...s.moves, 100] })).toBe(false); expect(validateMatch(s, 'other')).toBe(false);
    expect(validateMatch({ ...s, board: s.board.map(() => 0) })).toBe(false);
  });
  it('rejects invalid cells, duplicates, forged sides and malformed storage', () => {
    const s = place(make(), 112); for (const i of [112, -1, 225, .1, NaN]) expect(place(s, i)).toBe(s);
    for (const value of [null, {}, { ...s, players: [] }, { ...s, moves: [1, 1] }, { ...s, activeSide: 0 }, { ...s, elapsed: NaN }, { ...s, endReason: 'five' }]) expect(validateMatch(value)).toBe(false);
  });
  it('undo restores a full human turn while keeping revision monotonic', () => {
    let s = make({ mode: 'bot', players: [{ name: 'An', avatar: '🌱', kind: 'human' }, { name: 'Máy', avatar: '🦉', kind: 'bot' }] });
    s = place(s, 112); const waiting = undo(s); expect(waiting.moves).toEqual([]); expect(waiting.revision).toBe(2);
    s = place(s, 113); const afterBot = undo(s); expect(afterBot.moves).toEqual([]); expect(afterBot.undos).toBe(1);
    const ownerO = make({ ownerSide: 1, mode: 'bot', players: [{ name: 'Máy', avatar: '🦉', kind: 'bot' }, { name: 'An', avatar: '🌱', kind: 'human' }] });
    const opening = place(ownerO, 112); expect(undo(opening)).toBe(opening);
    const undone = undo(place(place(opening, 113), 114)); expect(undone.moves).toEqual([112]); expect(validateMatch(undone)).toBe(true);
  });
  it('handles local undo, resignation, draw agreement and immutable replays', () => {
    const s = place(place(make(), 100), 101), back = undo(s);
    expect(back.moves).toEqual([100]); expect(s.moves).toEqual([100, 101]); expect(replayBoard(s.moves, 1)[101]).toBe(0);
    expect(undo({ ...s, undoEnabled: false })).toMatchObject({ moves: [100, 101] });
    expect(validateMatch(finish(s, 'resign', 0))).toBe(true); expect(finish(s, 'resign', 0).winner).toBe(1);
    expect(validateMatch(finish(s, 'agreement'))).toBe(true); expect(undo(finish(s, 'agreement')).phase).toBe('over');
  });
});
describe('Caro bot tactical fixtures (both marks, all axes)', () => {
  for (const side of [0, 1] as Side[]) for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) for (const kind of ['win', 'block']) {
    it(`${kind}: side ${side}, ${dr},${dc}`, () => {
      const s = make({ activeSide: side }); const targetSide = kind === 'win' ? side : opposite(side);
      for (let n = 0; n < 4; n++) s.board[idx(6 + n * dr, 7 + n * dc)] = targetSide + 1;
      // The preceding position holds our own mark: completing that side would make six; only the other endpoint wins.
      s.board[idx(6 - 2 * dr, 7 - 2 * dc)] = targetSide + 1;
      const expected = idx(6 + 4 * dr, 7 + 4 * dc);
      for (const level of ['easy', 'medium', 'hard'] as const) expect(search(s, level, 123, 20).cell).toBe(expected);
    });
  }
  for (const side of [0, 1] as Side[]) for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
    it(`does not confuse overline and double block with victory: ${side}, ${dr},${dc}`, () => {
      const board = Array(225).fill(0), center = idx(6, 7);
      for (const n of [-2, -1, 1, 2]) board[idx(6 + n * dr, 7 + n * dc)] = side + 1;
      board[idx(6 - 3 * dr, 7 - 3 * dc)] = opposite(side) + 1; board[idx(6 + 3 * dr, 7 + 3 * dc)] = opposite(side) + 1;
      expect(winningMoves(board, side)).not.toContain(center);
      board[idx(6 + 3 * dr, 7 + 3 * dc)] = side + 1; expect(winningMoves(board, side)).not.toContain(center);
    });
  }
  for (const side of [0, 1] as Side[]) {
    it(`finishes exactly five against the board edge: ${side}`, () => {
      const s = make({ activeSide: side });
      for (let c = 0; c < 4; c++) s.board[idx(0, c)] = side + 1;
      s.board[idx(0, 5)] = opposite(side) + 1;
      for (const level of ['easy', 'medium', 'hard'] as const) expect(search(s, level, 7, 20).cell).toBe(idx(0, 4));
    });
    it(`answers an opponent's open four with a legal defensive endpoint: ${side}`, () => {
      const s = make({ activeSide: side });
      for (let c = 5; c <= 8; c++) s.board[idx(7, c)] = opposite(side) + 1;
      const endpoints = [idx(7, 4), idx(7, 9)];
      expect(winningMoves(s.board, opposite(side))).toEqual(endpoints);
      for (const level of ['easy', 'medium', 'hard'] as const) expect(endpoints).toContain(search(s, level, 7, 20).cell);
    });
    it(`uses the final empty cell and returns no move on a full board: ${side}`, () => {
      const s = make({ activeSide: side });
      s.board = Array.from({ length: 225 }, (_, i) => (Math.floor(i / 15) + Math.floor(i % 15 / 2)) % 2 + 1);
      s.board[224] = 0;
      for (const level of ['easy', 'medium', 'hard'] as const) expect(search(s, level, 7, 20).cell).toBe(224);
      s.board[224] = side + 1;
      expect(search(s).cell).toBe(-1);
    });
  }
  it('returns legal deterministic seeded moves without mutating the position', () => {
    let s = place(place(make(), 112), 113); const before = structuredClone(s);
    for (const level of ['easy', 'medium', 'hard'] as const) { const r = search(s, level, 44, 25); expect(s.board[r.cell]).toBe(0); expect(r.elapsed).toBeLessThan(500); }
    expect(s).toEqual(before); expect(search(s, 'easy', 44).cell).toBe(search(s, 'easy', 44).cell);
    expect(search(finish(s, 'agreement')).cell).toBe(-1);
  });
});
describe('Caro worker cancellation and recovery', () => {
  const botState = () => make({ mode: 'bot', ownerSide: 1, players: [{ name: 'Máy', avatar: '🦉', kind: 'bot' }, { name: 'An', avatar: '🌱', kind: 'human' }] });
  it('ignores stale callbacks and applies a valid reply only once', () => {
    let request!: BotRequest;
    const worker: WorkerPort = { onmessage: null, onerror: null, terminate: vi.fn(), postMessage: r => { request = r; } };
    const controller = new BotController(() => worker), done = vi.fn(); controller.start(botState(), done);
    const oldHandler = worker.onmessage!; controller.cancel(); oldHandler({ data: { ...request, cell: 112 } } as any); expect(done).not.toHaveBeenCalled();
    controller.start(botState(), done); worker.onmessage!({ data: { ...request, revision: -1, cell: 112 } } as any); expect(done).not.toHaveBeenCalled();
    worker.onmessage!({ data: { ...request, cell: 112 } } as any); worker.onmessage!({ data: { ...request, cell: 112 } } as any);
    expect(done).toHaveBeenCalledExactlyOnceWith(112, false);
  });
  it('recovers on timeout or malformed reply and can cancel the watchdog', () => {
    vi.useFakeTimers(); let request!: BotRequest;
    const worker: WorkerPort = { onmessage: null, onerror: null, terminate: vi.fn(), postMessage: r => { request = r; } };
    const controller = new BotController(() => worker), done = vi.fn(); controller.start(botState(), done); vi.advanceTimersByTime(2500);
    expect(done).toHaveBeenCalledExactlyOnceWith(112, true);
    done.mockClear(); controller.start(botState(), done); worker.onmessage!({ data: { ...request, cell: 999 } } as any); expect(done).toHaveBeenCalledExactlyOnceWith(112, true);
    done.mockClear(); controller.start(botState(), done); controller.cancel(); vi.advanceTimersByTime(3000); expect(done).not.toHaveBeenCalled();
  });
});
describe('Caro drafts and profile completion', () => {
  it('isolates owners and rejects corrupt data', () => {
    const s = place(make(), 112); expect(saveDraft(s)).toBe(true); expect(loadDraft('child').match).toEqual(s); expect(loadDraft('other').match).toBeNull();
    clearCaroData('other'); expect(loadDraft('child').match).not.toBeNull(); clearCaroData('child'); expect(loadDraft('child').match).toBeNull();
    localStorage.setItem('caro:child:draft-v1', '{'); expect(loadDraft('child').error).toBe(true);
  });
  it('records the O-owner win once, keeps currency and retries failed writes', () => {
    const profiles = [profile(), profile('other')], before = structuredClone(profiles), s = finish(make({ ownerSide: 1 }), 'resign', 0), write = vi.fn();
    const result = persistResult(profiles, 'child', s, write); expect(result.ok).toBe(true);
    expect(profiles).toEqual(before); expect(result.profiles[1]).toBe(profiles[1]); expect(result.profiles[0].stars).toBe(30);
    expect(result.profiles[0].gameHistory[0]).toMatchObject({ score: 1, starsEarned: 0, caro: { ownerSide: 1 } });
    expect(persistResult(result.profiles, 'child', s, write).profiles).toBe(result.profiles); expect(write).toHaveBeenCalledTimes(1);
    expect(persistResult(profiles, 'child', s, () => { throw Error('quota'); })).toEqual({ ok: false, profiles });
    expect(persistResult(profiles, 'other', s, write).ok).toBe(false);
  });
});
