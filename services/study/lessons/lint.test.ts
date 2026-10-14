import { describe, expect, it } from 'vitest';
import { mathLint, notationLint } from './lint';
import { nb } from './build';

const ok = (s: string) => expect(mathLint(nb(s)), s).toEqual([]);
const bad = (s: string) => expect(mathLint(nb(s)).length, s).toBeGreaterThan(0);

describe('mathLint', () => {
    it('chấp nhận phép tính đúng', () => {
        [
            '3 + 5 = 8 (phần)', '(25 + 5) × 2 = 60 (cm)', '96 − 36 = 60', '96 - 36 = 60', '9 × 2 × 3,14 = 56,52',
            '1/12 + 1/24 = 3/24 = 1/8', '2 1/4 = 9/4', '12 345 + 1 = 12 346', '186 : 4 = 46 dư 2', '36 : 60 = 3/5',
            'Một phần: 96 : (3 + 5) = 12.', 'Bước 1: 3 + 5 = 8.', 'Số bé: 12 × 3 = 36, số lớn: 12 × 5 = 60.',
            'Thử lại: 36 + 60 = 96 và 36 : 60 = 3/5.', '53 − 8 × 3 = 29', '(16 − 14) × 2 = 4', '1 000 000 × 4 = 4 000 000',
            '0,1 × 100 = 10', '11,7 + 36,92 = 48,62', '107 × 82 = 8774', '2 1/4 + 4 1/4 = 26/4 = 13/2',
            '380 000 × 20 : 100 = 76 000 (đồng)', 'Tỉ số 6 : 8 = 3/4', '948 : 4 = 237 (thử lại: 237 × 4 = 948)',
        ].forEach(ok);
    });
    it('bắt phép tính sai', () => {
        ['3 + 5 = 9', '47 × 3 = 121', '96 : 8 = 11 (phần)', '53 − 8 × 3 = 135', '1/3 + 5/7 = 6/10', '186 : 4 = 46 dư 6', '186 : 4 = 45 dư 6',
            '9 × 2 × 3,14 = 56,5', '12 345 + 1 = 12 345', 'Số bé: 12 × 3 = 35.', '2 1/4 = 7/4'].forEach(bad);
    });
    it('bỏ qua chữ không phải biểu thức thuần số', () => {
        ['9 giờ 45 phút + 20 phút = 10 giờ 5 phút', 'Từ ngày 30/6 đến ngày 3/7', '25% = 25/100', '? : 9 = 10', 'p = a × 4', '35 bạn, 7 bạn = 1 phần'].forEach(ok);
    });
});

describe('notationLint', () => {
    it('bắt ký hiệu sai', () => {
        ['3 x 4 = 12', '12 ÷ 3', '3.5 m', '12345 đồng', 'Tìm x biết', 'tiền thối lại', '2 L nước', `2 417`].forEach(s => expect(notationLint(s).length, s).toBeGreaterThan(0));
    });
    it('chấp nhận ký hiệu đúng', () => {
        ['3 × 4 = 12', '12 : 3 = 4', '3,5 m', nb('12 345 đồng'), '2417', '**Tổng** là 96', '1. Vẽ sơ đồ', '0,125', '2 l nước', 'Tổng – tỉ'].forEach(s => expect(notationLint(s), s).toEqual([]));
    });
});
