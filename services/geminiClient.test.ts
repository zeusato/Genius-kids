import { describe, it, expect } from 'vitest';
import { pickBest, versionScore } from './geminiClient';

const mk = (name: string, gen = true) => ({
    name,
    supportedGenerationMethods: gen ? ['generateContent'] : ['embedContent'],
});

describe('geminiClient — chọn model mới nhất tự động', () => {
    it('versionScore: phiên bản cao hơn → điểm cao hơn', () => {
        expect(versionScore('gemini-2.5-flash')).toBeGreaterThan(versionScore('gemini-2.0-flash'));
        expect(versionScore('gemini-2.0-flash')).toBeGreaterThan(versionScore('gemini-1.5-flash'));
        expect(versionScore('gemini-3.0-flash')).toBeGreaterThan(versionScore('gemini-2.5-flash'));
    });

    it('ưu tiên alias family-latest nếu API có', () => {
        const best = pickBest([mk('models/gemini-2.5-flash'), mk('models/gemini-flash-latest')]);
        expect(best).toBe('gemini-flash-latest');
    });

    it('không có alias → chọn flash ổn định version cao nhất', () => {
        const best = pickBest([
            mk('models/gemini-1.5-flash'),
            mk('models/gemini-2.5-flash'),
            mk('models/gemini-2.0-flash'),
        ]);
        expect(best).toBe('gemini-2.5-flash');
    });

    it('tự động ưu tiên model mới hơn khi Google ra version mới', () => {
        const best = pickBest([mk('models/gemini-2.5-flash'), mk('models/gemini-3.0-flash')]);
        expect(best).toBe('gemini-3.0-flash');
    });

    it('bỏ qua model không hỗ trợ generateContent', () => {
        const best = pickBest([mk('models/embedding-001', false), mk('models/gemini-2.5-flash')]);
        expect(best).toBe('gemini-2.5-flash');
    });

    it('tránh bản preview/exp khi có bản ổn định', () => {
        const best = pickBest([
            mk('models/gemini-2.5-flash-preview-05-20'),
            mk('models/gemini-2.5-flash'),
        ]);
        expect(best).toBe('gemini-2.5-flash');
    });

    it('không có gemini hỗ trợ generateContent → null', () => {
        expect(pickBest([mk('models/embedding-001', false)])).toBeNull();
        expect(pickBest([])).toBeNull();
    });
});
