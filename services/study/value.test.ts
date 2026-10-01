import { describe, it, expect } from 'vitest';
import { fmt, fmtMoney, readNumberVN, parseValue, sameValue, NBSP } from './value';

describe('fmt — định dạng số theo SGK', () => {
    it('nhóm nghìn bằng khoảng trắng không ngắt từ 5 chữ số', () => {
        expect(fmt(2417)).toBe('2417');
        expect(fmt(12345)).toBe(`12${NBSP}345`);
        expect(fmt(1000000)).toBe(`1${NBSP}000${NBSP}000`);
        expect(fmtMoney(10000)).toBe(`10${NBSP}000 đồng`);
    });
    it('dấu phẩy thập phân, bỏ số 0 thừa, không lỗi dấu phẩy động', () => {
        expect(fmt(0.125)).toBe('0,125');
        expect(fmt(0.1 + 0.2)).toBe('0,3');
        expect(fmt(12.5)).toBe('12,5');
        expect(fmt(3.10, { decimals: 2, fixed: true })).toBe('3,10');
        expect(fmt(-0.0000001)).toBe('0');
        expect(fmt(12345.67)).toBe(`12${NBSP}345,67`);
    });
});

describe('readNumberVN — đọc số', () => {
    const cases: [number, string][] = [
        [0, 'không'], [5, 'năm'], [10, 'mười'], [11, 'mười một'], [14, 'mười bốn'], [15, 'mười lăm'],
        [20, 'hai mươi'], [21, 'hai mươi mốt'], [24, 'hai mươi tư'], [25, 'hai mươi lăm'],
        [100, 'một trăm'], [105, 'một trăm linh năm'], [110, 'một trăm mười'], [115, 'một trăm mười lăm'],
        [475, 'bốn trăm bảy mươi lăm'], [1000, 'một nghìn'],
        [1005, 'một nghìn không trăm linh năm'], [2050, 'hai nghìn không trăm năm mươi'],
        [5041, 'năm nghìn không trăm bốn mươi mốt'], [7017, 'bảy nghìn không trăm mười bảy'],
        [534636, 'năm trăm ba mươi tư nghìn sáu trăm ba mươi sáu'],
        [1000005, 'một triệu không trăm linh năm'],
        [6504903, 'sáu triệu năm trăm linh bốn nghìn chín trăm linh ba'],
        [2000000000, 'hai tỉ'],
    ];
    for (const [n, s] of cases) it(`${n} → ${s}`, () => expect(readNumberVN(n)).toBe(s));
    it('không chèn dấu phẩy', () => expect(readNumberVN(3284475)).not.toContain(','));
    it('số thập phân', () => {
        expect(readNumberVN(0.5)).toBe('không phẩy năm');
        expect(readNumberVN(3.05)).toBe('ba phẩy không năm');
        expect(readNumberVN(12.75)).toBe('mười hai phẩy bảy mươi lăm');
    });
});

describe('parseValue / sameValue', () => {
    const cases: [string, number | null][] = [
        ['12345', 12345], [`12${NBSP}345`, 12345], ['12 345', 12345], ['12.345', 12345],
        ['0,5', 0.5], ['0.5', 0.5], ['0.125', 0.125], ['3/4', 0.75], ['2 3/4', 2.75],
        ['36cm²', 36], ['36 cm²', 36], [`15${NBSP}000 đồng`, 15000], ['45%', 45], ['90°', 90],
        ['1 234,5', 1234.5], ['3 giờ 15 phút', null], ['7 + 2', null], ['Hình vuông', null], ['', null],
    ];
    for (const [s, v] of cases) it(`"${s}" → ${v}`, () => expect(parseValue(s)).toBe(v));
    it('so theo giá trị', () => {
        expect(sameValue('2/20', '1/10')).toBe(true);
        expect(sameValue('8/2', '4')).toBe(true);
        expect(sameValue('0,50', '0.5')).toBe(true);
        expect(sameValue('Thứ Hai', 'thứ hai')).toBe(true);
        expect(sameValue('12', '13')).toBe(false);
        expect(sameValue('>', '<')).toBe(false);
    });
});
