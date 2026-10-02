import { describe, expect, it } from 'vitest';
import { longDivision } from './algo';

describe('longDivision', () => {
    it('đúng số học trên 2000 cặp ngẫu nhiên', () => {
        let seed = 7;
        const rnd = (n: number) => { seed = (seed * 16807) % 2147483647; return seed % n; };
        for (let k = 0; k < 2000; k++) {
            const a = rnd(99999) + 1, b = rnd(9) + 1;
            const r = longDivision(a, b);
            expect(r.quotient * b + r.remainder, `${a}:${b}`).toBe(a);
            expect(r.remainder).toBeLessThan(b);
            for (const s of r.steps) { expect(s.rem).toBeLessThan(b); expect(s.prod).toBe(s.q * b); }
        }
    });
    it('dòng dưới đúng kiểu SGK rút gọn', () => {
        expect(longDivision(948, 4).steps.map(s => s.next)).toEqual(['14', '28', null]);
        const r = longDivision(186, 4);
        expect(r.first).toBe(1);
        expect(r.steps.map(s => s.next)).toEqual(['26', null]);
        expect(r.remainder).toBe(2);
        expect(r.steps[0].say).toMatch(/^1 bé hơn 4 nên lấy 18\. 18 chia 4 được 4/);
        expect(longDivision(812, 4).steps.map(s => s.q)).toEqual([2, 0, 3]);
        expect(longDivision(812, 4).steps[1].say).toMatch(/1 bé hơn 4 nên viết 0 vào thương/);
    });
});

describe('longDivision — số thập phân', () => {
    it('đặt dấu phẩy vào thương đúng chỗ', () => {
        const r = longDivision(176.4, 4);
        expect(r.quotient).toBe(44.1);
        expect(r.steps.map(s => s.say).join(' ')).toMatch(/Viết dấu phẩy vào bên phải 44 ở thương\. Hạ 4/);
        expect(longDivision(2337, 57).quotient).toBe(41);
        expect(longDivision(8.4, 6).quotient).toBe(1.4);
    });
    it('thương × số chia + số dư = số bị chia', () => {
        let seed = 3;
        const rnd = (n: number) => { seed = (seed * 16807) % 2147483647; return seed % n; };
        for (let k = 0; k < 1000; k++) {
            const b = rnd(9) + 1, q = (rnd(99999) + 1) / [1, 10, 100][rnd(3)];
            const a = Math.round(q * b * 1000) / 1000;
            const r = longDivision(a, b);
            expect(Math.abs(r.quotient * b + r.remainder - a), `${a}:${b}`).toBeLessThan(1e-6);
        }
    });
});
