// Dùng chung cho generator Lớp 5: số thập phân tính chính xác bằng số nguyên (tránh lỗi dấu phẩy động).
import { fmt } from '../../study/value';
import { rint } from '../kit';

/** Số thập phân ngẫu nhiên có `dp` chữ số sau dấu phẩy trong [lo, hi]. */
export const dec = (lo: number, hi: number, dp: number): number => rint(Math.round(lo * 10 ** dp), Math.round(hi * 10 ** dp)) / 10 ** dp;
/** Như dec nhưng luôn có phần thập phân khác 0 (để lời giải "đếm chữ số ở phần thập phân" luôn đúng). */
export const decStrict = (lo: number, hi: number, dp: number): number => { for (;;) { const x = dec(lo, hi, dp); if (Math.round(x * 10 ** dp) % 10 !== 0) return x; } };
/** Làm tròn khử sai số dấu phẩy động. */
export const fix = (x: number, dp = 6): number => Number(x.toFixed(dp));
export const fd = (x: number) => fmt(fix(x));
export const KIDS = ['Lan', 'Minh', 'An', 'Hoa', 'Nam', 'Mai', 'Bình', 'Linh'];
