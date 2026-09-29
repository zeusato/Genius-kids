// Cỗ máy thời gian khám phá nguyên tố. TS thuần.
import type { ElementFull } from './elements';
import { MENDELEEV_GAPS } from '../../../data/periodic/discovery';

export const YEAR_KNOTS: [number, number][] = [[-9000, 0], [1000, 0.12], [1600, 0.18], [1750, 0.26], [1800, 0.36], [1869, 0.55], [1900, 0.7], [1940, 0.8], [1960, 0.88], [2016, 1]];
export const YEAR_MIN = -9000, YEAR_MAX = 2016;

export function fracYear(y: number): number {
    if (y <= YEAR_KNOTS[0][0]) return 0;
    for (let i = 1; i < YEAR_KNOTS.length; i++) {
        const [b, fb] = YEAR_KNOTS[i];
        if (y <= b) { const [a, fa] = YEAR_KNOTS[i - 1]; return fa + (fb - fa) * (y - a) / (b - a); }
    }
    return 1;
}
export function yearAtFrac(f: number): number {
    if (f <= 0) return YEAR_MIN;
    for (let i = 1; i < YEAR_KNOTS.length; i++) {
        const [b, fb] = YEAR_KNOTS[i];
        if (f <= fb) { const [a, fa] = YEAR_KNOTS[i - 1]; return Math.round(a + (b - a) * (f - fa) / (fb - fa)); }
    }
    return YEAR_MAX;
}

export const isDiscovered = (e: ElementFull, year: number) => e.found.year <= year;

/** Ô Mendeleev để trống (đang trong khoảng 1869 → năm tìm ra). */
export const isMendeleevGap = (e: ElementFull, year: number) =>
    MENDELEEV_GAPS[e.atomicNumber] !== undefined && year >= 1869 && !isDiscovered(e, year);

export function formatYear(y: number): string {
    return y < 0 ? `${Math.abs(y).toLocaleString('vi-VN')} TCN` : String(y);
}
