import { describe, expect, it } from 'vitest';
import { column } from './column';

const rnd = (() => { let seed = 11; return (n: number) => { seed = (seed * 16807) % 2147483647; return seed % n; }; })();
const dec = (max: number, d: number) => rnd(max * 10 ** d) / 10 ** d;
const close = (x: number, y: number) => Math.abs(x - y) < 1e-9;

describe('column', () => {
    it('cộng, trừ, nhân số tự nhiên đúng trên 2000 cặp mỗi phép', () => {
        for (let k = 0; k < 2000; k++) {
            const a = rnd(100000), b = rnd(100000);
            expect(column('+', a, b).result, `${a}+${b}`).toBe(a + b);
            const [x, y] = a >= b ? [a, b] : [b, a];
            expect(column('-', x, y).result, `${x}-${y}`).toBe(x - y);
            const m = rnd(10), n = rnd(100);
            expect(column('×', a % 1000, m).result, `${a % 1000}×${m}`).toBe((a % 1000) * m);
            expect(column('×', a % 1000, n).result, `${a % 1000}×${n}`).toBe((a % 1000) * n);
        }
    });
    it('số thập phân đúng', () => {
        for (let k = 0; k < 1000; k++) {
            const a = dec(1000, rnd(3)), b = dec(1000, rnd(3));
            expect(close(column('+', a, b).result, a + b), `${a}+${b}`).toBe(true);
            const [x, y] = a >= b ? [a, b] : [b, a];
            expect(close(column('-', x, y).result, x - y), `${x}-${y}`).toBe(true);
            const p = dec(100, rnd(3)), q = dec(100, rnd(2));
            expect(close(column('×', p, q).result, p * q), `${p}×${q}`).toBe(true);
        }
    });
    it('lời đọc theo SGK', () => {
        const add = column('+', 47, 25).steps.map(s => s.say);
        expect(add).toEqual(['7 cộng 5 bằng 12, viết 2 nhớ 1.', '4 cộng 2 bằng 6, thêm 1 bằng 7, viết 7.']);
        const sub = column('-', 52, 27).steps.map(s => s.say);
        expect(sub).toEqual(['2 không trừ được 7, lấy 12 trừ 7 bằng 5, viết 5 nhớ 1.', '2 thêm 1 bằng 3; 5 trừ 3 bằng 2, viết 2.']);
        const mul = column('×', 47, 3).steps.map(s => s.say);
        expect(mul).toEqual(['3 nhân 7 bằng 21, viết 1 nhớ 2.', '3 nhân 4 bằng 12, thêm 2 bằng 14, viết 14.']);
        expect(column('-', 30.7, 2.77).steps[0].say).toMatch(/30,7 = 30,70/);
        expect(column('×', 10.7, 8.2).steps.at(-1)!.say).toMatch(/2 chữ số ở phần thập phân/);
        expect(column('+', 99, 1).result).toBe(100);
        expect(column('-', 1000, 999).result).toBe(1);
    });
});
