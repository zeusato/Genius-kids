import vi from './riddles.vi.json';
import en from './riddles.en.json';
import type { GateId, Riddle } from './types';

/** Kho câu đố v2 — sinh bởi scripts/riddle-build.mjs, kiểm bởi content.test.ts. */
export const RIDDLES: Riddle[] = [...(vi as Riddle[]), ...(en as Riddle[])];
export const RIDDLE_MAP = new Map(RIDDLES.map(r => [r.id, r]));
export const riddlesOf = (gate: GateId) => RIDDLES.filter(r => r.gate === gate);
