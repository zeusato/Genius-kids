import type { Difficulty } from '../../services/sudokuGenerator';
export interface Cell { value: number; isInitial: boolean; notes: number[]; isError: boolean }
export interface SudokuDraft {
  version: 1; id: string; owner: string; difficulty: Difficulty; grid: Cell[][]; solution: number[][];
  selectedCell: { r: number; c: number } | null; isNoteMode: boolean; timer: number; isPaused: boolean; updatedAt: string;
}
const key = (owner: string) => `sudoku:${owner}:draft-v1`;
const digit = (n: unknown) => Number.isInteger(n) && Number(n) >= 1 && Number(n) <= 9;
const matrix = (v: unknown): v is unknown[][] => Array.isArray(v) && v.length === 9 && v.every(row => Array.isArray(row) && row.length === 9);
export function withConflicts(grid: Cell[][]): Cell[][] {
  return grid.map((row, r) => row.map((cell, c) => ({ ...cell, notes: [...cell.notes], isError: !!cell.value && grid.some((line, nr) => line.some((other, nc) => (nr !== r || nc !== c) && other.value === cell.value && (nr === r || nc === c || Math.floor(nr / 3) === Math.floor(r / 3) && Math.floor(nc / 3) === Math.floor(c / 3)))) })));
}
export function validDraft(value: unknown, owner?: string): value is SudokuDraft {
  if (!value || typeof value !== 'object') return false;
  const s = value as SudokuDraft;
  if (s.version !== 1 || typeof s.id !== 'string' || !s.id || s.id.length > 120 || typeof s.owner !== 'string' || !s.owner || owner !== undefined && s.owner !== owner || !['easy', 'medium', 'hard'].includes(s.difficulty)) return false;
  if (!Number.isSafeInteger(s.timer) || s.timer < 0 || typeof s.isPaused !== 'boolean' || typeof s.isNoteMode !== 'boolean' || typeof s.updatedAt !== 'string' || !Number.isFinite(Date.parse(s.updatedAt))) return false;
  if (s.selectedCell !== null && (!s.selectedCell || !Number.isInteger(s.selectedCell.r) || s.selectedCell.r < 0 || s.selectedCell.r > 8 || !Number.isInteger(s.selectedCell.c) || s.selectedCell.c < 0 || s.selectedCell.c > 8)) return false;
  if (!matrix(s.solution) || !s.solution.every(row => row.every(digit)) || !matrix(s.grid)) return false;
  for (let i = 0; i < 9; i++) {
    if (new Set(s.solution[i]).size !== 9 || new Set(s.solution.map(row => row[i])).size !== 9) return false;
    const values = []; for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) values.push(s.solution[Math.floor(i / 3) * 3 + r][i % 3 * 3 + c]);
    if (new Set(values).size !== 9) return false;
  }
  return s.grid.every((row, r) => row.every((cell, c) => cell && (cell.value === 0 || digit(cell.value)) && typeof cell.isInitial === 'boolean' && typeof cell.isError === 'boolean' && Array.isArray(cell.notes) && cell.notes.length <= 9 && cell.notes.every(digit) && new Set(cell.notes).size === cell.notes.length && (!cell.isInitial || cell.value === s.solution[r][c])));
}
export const isSolved = (s: SudokuDraft) => s.grid.every((row, r) => row.every((cell, c) => cell.value === s.solution[r][c]));
export function loadSudoku(owner: string, completedIds: string[] = []): { draft: SudokuDraft | null; error: boolean } {
  try { const raw = localStorage.getItem(key(owner)); if (!raw) return { draft: null, error: false };
    const value: unknown = JSON.parse(raw); if (!validDraft(value, owner)) return { draft: null, error: true };
    if (completedIds.includes(value.id)) { clearSudokuData(owner); return { draft: null, error: false }; }
    return { draft: { ...value, grid: withConflicts(value.grid) }, error: false };
  } catch { return { draft: null, error: true }; }
}
export function saveSudoku(s: SudokuDraft): boolean { try { localStorage.setItem(key(s.owner), JSON.stringify(s)); return true; } catch { return false; } }
export function clearSudokuData(owner: string): boolean { try { localStorage.removeItem(key(owner)); return true; } catch { return false; } }
