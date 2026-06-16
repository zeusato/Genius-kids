import { describe, it, expect } from 'vitest';
import { questionToSpeech } from './questionSpeech';

describe('questionToSpeech', () => {
    it('đổi ký hiệu phép tính + "= ?" → "bằng mấy"', () => {
        expect(questionToSpeech('5 + 3 = ?')).toBe('5 cộng 3 bằng mấy');
        expect(questionToSpeech('12 - 7 = ?')).toBe('12 trừ 7 bằng mấy');
        expect(questionToSpeech('6 × 4 = ?')).toBe('6 nhân 4 bằng mấy');
        expect(questionToSpeech('8 : 2 = ?')).toBe('8 chia 2 bằng mấy');
    });

    it('đọc phân số a/b → "a phần b"', () => {
        expect(questionToSpeech('2/5 + 1/5 = ?')).toBe('2 phần 5 cộng 1 phần 5 bằng mấy');
        expect(questionToSpeech('Rút gọn phân số: 4/8')).toBe('Rút gọn phân số: 4 phần 8');
    });

    it('so sánh: "..." → ngắt, dấu so sánh giữa số', () => {
        expect(questionToSpeech('3/4 ... 2/4')).toBe('3 phần 4 2 phần 4');
        expect(questionToSpeech('5 > 3')).toBe('5 lớn hơn 3');
    });

    it('giữ nguyên câu hỏi lời văn (dấu ? cuối)', () => {
        expect(questionToSpeech('Đây là hình gì?')).toBe('Đây là hình gì?');
        expect(questionToSpeech('Đồng hồ chỉ mấy giờ?')).toBe('Đồng hồ chỉ mấy giờ?');
    });

    it('bỏ Markdown và KaTeX', () => {
        expect(questionToSpeech('**Tính:** 2 + 3')).toBe('Tính: 2 cộng 3');
        expect(questionToSpeech('$\\frac{1}{2}$ + $\\frac{1}{2}$')).toBe('1 phần 2 cộng 1 phần 2');
    });

    it('chuỗi rỗng an toàn', () => {
        expect(questionToSpeech('')).toBe('');
    });
});
