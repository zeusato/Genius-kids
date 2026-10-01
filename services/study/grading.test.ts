import { describe, it, expect } from 'vitest';
import { isCorrect } from './grading';
import { QuestionType } from '../../types';

describe('isCorrect', () => {
    it('SingleChoice so đúng chuỗi lựa chọn', () => {
        const q = { type: QuestionType.SingleChoice, correctAnswer: '12' };
        expect(isCorrect(q, '12')).toBe(true);
        expect(isCorrect(q, '13')).toBe(false);
        expect(isCorrect(q, undefined)).toBe(false);
    });
    it('MultipleSelect so tập', () => {
        const q = { type: QuestionType.MultipleSelect, correctAnswers: ['a', 'b'] };
        expect(isCorrect(q, ['b', 'a'])).toBe(true);
        expect(isCorrect(q, ['a'])).toBe(false);
        expect(isCorrect(q, ['a', 'b', 'c'])).toBe(false);
    });
    it('ManualInput số: so theo giá trị + accept', () => {
        const q = { type: QuestionType.ManualInput, correctAnswer: '12345', answerKind: 'number' as const };
        expect(isCorrect(q, '12 345')).toBe(true);
        expect(isCorrect(q, '12.345')).toBe(true);
        expect(isCorrect(q, ' 12345 ')).toBe(true);
        expect(isCorrect(q, '1234')).toBe(false);
        const d = { type: QuestionType.ManualInput, correctAnswer: '0', accept: ['2', '4', '6', '8'] };
        expect(isCorrect(d, '4')).toBe(true);
        expect(isCorrect(d, '5')).toBe(false);
        expect(isCorrect({ type: QuestionType.ManualInput, correctAnswer: '0,5' }, '0.5')).toBe(true);
    });
    it('ManualInput chữ', () => {
        const q = { type: QuestionType.ManualInput, correctAnswer: 'Thứ Hai', answerKind: 'text' as const };
        expect(isCorrect(q, 'thứ hai')).toBe(true);
    });
    it('Order so mảng', () => {
        const q = { type: QuestionType.Order, correctAnswers: ['1', '2', '3'] };
        expect(isCorrect(q, ['1', '2', '3'])).toBe(true);
        expect(isCorrect(q, ['2', '1', '3'])).toBe(false);
    });
});
