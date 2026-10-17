// Phát lại tất định một Recipe (plan mục 5.3, 10). Sheet và facets không lưu — luôn dựng lại từ recipe.
import type { FoldEntry, Op, PaperSpec } from '../model';
import { cut } from './cut';
import { type Facet, foldStack } from './fold';
import type { Shape } from './poly';
import { initialSheet, type Sheet } from './sheet';

export interface StudioState {
  sheet: Sheet;
  entries: FoldEntry[];
  facets: Facet[];
}

export function initialState(spec: PaperSpec): StudioState {
  const sheet = initialSheet(spec);
  return { sheet, entries: [], facets: foldStack(sheet, []) };
}

/** Áp một thao tác. `dropped` là các mảnh rơi (toạ độ xấp) khi op là cắt. */
export function applyOp(s: StudioState, op: Op): StudioState & { dropped?: Shape[] } {
  switch (op.kind) {
    case 'fold': case 'flip': {
      const entries = [...s.entries, op];
      return { sheet: s.sheet, entries, facets: foldStack(s.sheet, entries) };
    }
    case 'unfold': {
      if (!s.entries.length) return s;
      const entries = s.entries.slice(0, -1);
      return { sheet: s.sheet, entries, facets: foldStack(s.sheet, entries) };
    }
    case 'cut': {
      const r = cut(s.sheet, s.facets, op.region);
      if (r.sheet === s.sheet) return { ...s, dropped: [] };
      return { sheet: r.sheet, entries: s.entries, facets: r.facets, dropped: r.dropped };
    }
  }
}

export function replay(spec: PaperSpec, ops: readonly Op[]): StudioState {
  let s = initialState(spec);
  for (const op of ops) s = applyOp(s, op);
  return s;
}
