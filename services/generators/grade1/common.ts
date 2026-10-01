// Dùng chung cho generator Lớp 1.
import { readNumberVN } from '../../study/value';
export { THINGS } from '../preschool/counting';

export const word = (n: number) => readNumberVN(n);
export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/** Đọc phép tính: "3 + 4" → "3 cộng 4". */
export const sayExpr = (s: string) => s.replace(/\s\+\s/g, ' cộng ').replace(/\s[-−]\s/g, ' trừ ').replace(/=\s*\?/g, 'bằng mấy').replace(/=/g, 'bằng').replace(/□/g, 'ô trống').replace(/\.\.\./g, ' và ');
export const MINUS = '-';
