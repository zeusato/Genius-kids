import { describe, expect, it } from 'vitest';
import { checkAnswer } from './sphinxRiddleService';

describe('checkAnswer', () => {
    it('rejects fragments of the answer', () => {
        expect(checkAnswer('ày', 'Giày')).toBe(false);
        expect(checkAnswer('ng', 'Con chuồn chuồn')).toBe(false);
        expect(checkAnswer('con gà mái', 'Con gà trống')).toBe(false);
        expect(checkAnswer('mặt trời', 'Bóng mặt trăng')).toBe(false);
        expect(checkAnswer('letter', 'Letter M')).toBe(false);
    });
    it('accepts the whole answer with or without classifier and diacritics', () => {
        expect(checkAnswer('gà trống', 'Con gà trống')).toBe(true);
        expect(checkAnswer('con meo', 'Con mèo')).toBe(true);
        expect(checkAnswer('  Đôi  Giày ', 'Giày')).toBe(true);
        expect(checkAnswer('cap', 'Hat, Cap')).toBe(true);
        expect(checkAnswer('', 'Hat')).toBe(false);
    });
});
