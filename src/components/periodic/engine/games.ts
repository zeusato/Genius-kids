// Trò chơi trên bảng: truy tìm, tọa độ, ai nặng hơn, rắn-lỏng-khí. RNG có seed, nằm ngoài component. TS thuần.
import { CLUES, type Clue } from '../../../data/periodic/clues';
import { rng } from './atom';
import type { ElementFull } from './elements';
import { stateAt, type MatterState } from './states';

export function shuffle<T>(arr: T[], seed: number): T[] {
    const R = rng(seed), a = [...arr];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
}

export function pickRound<T>(bank: T[], n: number, seed: number): T[] { return shuffle(bank, seed).slice(0, n); }

export function findRound(easy: boolean, seed: number, n = 8): Clue[] {
    return pickRound(easy ? CLUES.filter(c => c.easy) : CLUES, n, seed);
}

/** Tọa độ: chỉ nguyên tố nằm ở bảng chính (có nhóm). */
export function coordRound(all: ElementFull[], seed: number, n = 8, maxPeriod = 4): ElementFull[] {
    return pickRound(all.filter(e => e.group > 0 && e.period <= maxPeriod), n, seed);
}

export const HEAVY_PAIRS: [number, number][] = [[79, 82], [13, 26], [3, 11], [76, 79], [22, 13], [47, 29], [80, 26], [50, 82], [78, 79], [12, 13]];
export function heavier(a: ElementFull, b: ElementFull): ElementFull { return (a.density ?? 0) >= (b.density ?? 0) ? a : b; }

export function stateQuestion(all: ElementFull[], seed: number): { e: ElementFull; c: number; answer: MatterState } {
    const R = rng(seed);
    const pool = all.filter(x => x.meltingPoint !== undefined && x.atomicNumber < 90);
    const e = pool[Math.floor(R() * pool.length)];
    const temps = [-200, -50, 25, 100, 500, 1000, 2000, 3000];
    const c = temps[Math.floor(R() * temps.length)];
    return { e, c, answer: stateAt(e, c) };
}

/** Nguyên tố của ngày — chọn theo ngày, trong 56 nguyên tố đầu cho dễ gần. */
export function elementOfDay(all: ElementFull[], d = new Date()): ElementFull {
    const k = d.getFullYear() * 400 + d.getMonth() * 31 + d.getDate();
    return all[Math.floor(rng(k)() * 56)];
}
