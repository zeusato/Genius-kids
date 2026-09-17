import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { clearSudokuData, loadSudoku, saveSudoku, validDraft, isSolved, withConflicts, type SudokuDraft } from './persistence';
import { persistSudoku } from './profile-adapter';
import type { StudentProfile } from '../../types';
const solution = Array.from({ length: 9 }, (_, r) => Array.from({ length: 9 }, (_, c) => (r * 3 + Math.floor(r / 3) + c) % 9 + 1));
const draft = (): SudokuDraft => ({ version: 1, id: 'sudoku-test', owner: 'child', difficulty: 'medium', solution: structuredClone(solution), grid: solution.map((row, r) => row.map((value, c) => ({ value: r === 0 ? 0 : value, isInitial: r !== 0, notes: r === 0 && c === 0 ? [1, 3, 9] : [], isError: false }))), selectedCell: { r: 0, c: 0 }, isNoteMode: true, timer: 137, isPaused: true, updatedAt: '2026-09-17T00:00:00.000Z' });
const profile = (id = 'child'): StudentProfile => ({ id, name: 'An', grade: 3, age: 8, avatarId: 0, currentAvatarId: 'avatar_01', currentThemeId: 'default', stars: 30, ownedAvatarIds: [], ownedThemeIds: [], ownedImageIds: [], history: [], gameHistory: [], shopDailyPhotos: [] });
beforeEach(() => { const data = new Map<string, string>(); vi.stubGlobal('localStorage', { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => data.set(k, v), removeItem: (k: string) => data.delete(k) }); });
afterEach(() => vi.unstubAllGlobals());
it('round-trips puzzle, solution, notes, selection, elapsed time and pause separately per child', () => {
  const s = draft(); expect(validDraft(s)).toBe(true); expect(saveSudoku(s)).toBe(true); expect(loadSudoku('child').draft).toEqual(s);
  expect(loadSudoku('other').draft).toBeNull(); clearSudokuData('other'); expect(loadSudoku('child').draft).not.toBeNull();
  clearSudokuData('child'); expect(loadSudoku('child').draft).toBeNull();
});
it('rejects corrupt, foreign, impossible solution, changed clues and invalid note values', () => {
  const s = draft();
  const broken = structuredClone(s); broken.solution[0][0] = broken.solution[0][1];
  const clue = structuredClone(s); clue.grid[1][1].value = 0;
  const note = structuredClone(s); note.grid[0][0].notes = [0, 10];
  for (const v of [null, {}, { ...s, version: 2 }, { ...s, timer: -1 }, { ...s, selectedCell: { r: 9, c: 0 } }, { ...s, solution: [] }, broken, clue, note]) expect(validDraft(v)).toBe(false);
  expect(validDraft(s, 'other')).toBe(false); localStorage.setItem('sudoku:child:draft-v1', '{'); expect(loadSudoku('child').error).toBe(true);
});
it('restores conflicts from values, rather than trusting saved flags', () => {
  const s = draft(); s.grid[0][0].value = 2; s.grid[0][1].value = 2;
  saveSudoku(s); const loaded = loadSudoku('child').draft!; expect(loaded.grid[0][0].isError).toBe(true); expect(loaded.grid[0][1].isError).toBe(true);
  loaded.grid[0][0].value = 0; loaded.grid[0][1].value = 0; expect(withConflicts(loaded.grid).flat().some(c => c.isError)).toBe(false);
});
it('does not resurrect a completed puzzle, even if removing its old draft previously failed', () => {
  const s = draft(); saveSudoku(s); expect(loadSudoku('child', [s.id]).draft).toBeNull(); expect(localStorage.getItem('sudoku:child:draft-v1')).toBeNull();
});
it('reports storage failures without crashing', () => {
  vi.stubGlobal('localStorage', { getItem: () => { throw Error('denied'); }, setItem: () => { throw Error('quota'); }, removeItem: () => { throw Error('denied'); } });
  expect(loadSudoku('child').error).toBe(true); expect(saveSudoku(draft())).toBe(false); expect(clearSudokuData('child')).toBe(false);
});
it('commits a solved saved session exactly once and keeps another profile unchanged', () => {
  const s = draft(); s.grid = s.grid.map((row, r) => row.map((cell, c) => ({ ...cell, value: solution[r][c], notes: [] })));
  expect(isSolved(s)).toBe(true); const profiles = [profile(), profile('other')], before = structuredClone(profiles), write = vi.fn();
  const result = persistSudoku(profiles, 'child', s, write, () => 1); expect(result.ok).toBe(true); expect(result.earned).toBe(5);
  expect(profiles).toEqual(before); expect(result.profiles[1]).toBe(profiles[1]); expect(result.profiles[0].gameHistory[0]).toMatchObject({ id: s.id, durationSeconds: 137, starsEarned: 5 });
  const repeat = persistSudoku(result.profiles, 'child', s, write, () => 1); expect(repeat.profiles).toBe(result.profiles); expect(write).toHaveBeenCalledTimes(1);
  expect(persistSudoku(profiles, 'other', s, write).ok).toBe(false);
  const failed = persistSudoku(profiles, 'child', s, () => { throw Error('quota'); }, () => 1); expect(failed.ok).toBe(false); expect(failed.profiles).toBe(profiles); expect(profiles).toEqual(before);
});
it('cannot award completion from an unfinished draft', () => { const write = vi.fn(); expect(persistSudoku([profile()], 'child', draft(), write).ok).toBe(false); expect(write).not.toHaveBeenCalled(); });
