// Thể của nguyên tố theo nhiệt độ (1 atm) + thang nhiệt độ phi tuyến cho thanh trượt. TS thuần.
import type { ElementFull } from './elements';

export type MatterState = 'solid' | 'liquid' | 'gas' | 'unknown';

/** Nguyên tố thăng hoa (C, As): rắn → khí thẳng ở điểm "sôi" (điểm thăng hoa). */
const SUBLIME_AT: Record<number, number> = { 6: 3642, 33: 614 };

export function stateAt(el: Pick<ElementFull, 'atomicNumber' | 'meltingPoint' | 'boilingPoint'>, c: number): MatterState {
    const s = SUBLIME_AT[el.atomicNumber];
    if (s !== undefined) return c >= s ? 'gas' : 'solid';
    const mp = el.meltingPoint, bp = el.boilingPoint;
    if (mp === undefined || mp === null) return 'unknown';
    if (c < mp) return 'solid';
    if (bp === undefined || bp === null || c < bp) return 'liquid';
    return 'gas';
}

/** Nút của thang phi tuyến: nhiệt độ (°C) → vị trí 0..1 trên thanh. */
export const TEMP_KNOTS: [number, number][] = [[-273, 0], [-200, 0.08], [-100, 0.16], [0, 0.26], [100, 0.36], [500, 0.5], [1000, 0.6], [2000, 0.73], [3500, 0.86], [6000, 1]];
export const TEMP_MIN = -273, TEMP_MAX = 6000, ROOM_TEMP = 25;

export function fracTemp(c: number): number {
    if (c <= TEMP_KNOTS[0][0]) return 0;
    for (let i = 1; i < TEMP_KNOTS.length; i++) {
        const [b, fb] = TEMP_KNOTS[i];
        if (c <= b) { const [a, fa] = TEMP_KNOTS[i - 1]; return fa + (fb - fa) * (c - a) / (b - a); }
    }
    return 1;
}

export function tempAtFrac(f: number): number {
    if (f <= 0) return TEMP_MIN;
    for (let i = 1; i < TEMP_KNOTS.length; i++) {
        const [b, fb] = TEMP_KNOTS[i];
        if (f <= fb) { const [a, fa] = TEMP_KNOTS[i - 1]; return a + (b - a) * (f - fa) / (fb - fa); }
    }
    return TEMP_MAX;
}

/** Làm tròn "đẹp" khi kéo: gần mốc thì hút vào mốc. */
export function niceTemp(c: number): number {
    const snap = TEMP_MARKS.find(m => Math.abs(m.c - c) <= Math.max(2, Math.abs(c) * 0.02));
    if (snap) return snap.c;
    const step = Math.abs(c) < 100 ? 1 : Math.abs(c) < 1000 ? 5 : 25;
    return Math.round(c / step) * step;
}

export const TEMP_MARKS: { c: number; label: string; icon: string }[] = [
    { c: -196, label: 'Nitơ lỏng', icon: '🧊' }, { c: -89, label: 'Nam Cực', icon: '🐧' }, { c: 25, label: 'Phòng', icon: '🏠' },
    { c: 37, label: 'Tay em', icon: '✋' }, { c: 100, label: 'Nước sôi', icon: '♨️' }, { c: 1200, label: 'Dung nham', icon: '🌋' },
    { c: 3422, label: 'Dây tóc đèn', icon: '💡' }, { c: 5500, label: 'Mặt Trời', icon: '☀️' },
];

export function countStates(els: ElementFull[], c: number): Record<MatterState, number> {
    const out: Record<MatterState, number> = { solid: 0, liquid: 0, gas: 0, unknown: 0 };
    for (const e of els) out[stateAt(e, c)]++;
    return out;
}
