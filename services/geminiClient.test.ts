import { describe, it, expect } from 'vitest';
import { pickBest, rankModels, versionScore } from './geminiClient';

const mk = (name: string, gen = true) => ({
    name, supportedGenerationMethods: gen ? ['generateContent'] : ['embedContent'],
});

describe('Gemini models are ordered newest to oldest', () => {
    it('compares integer and decimal generations', () => {
        expect(versionScore('gemini-3-flash-preview')).toBe(versionScore('gemini-3.0-flash'));
        expect(versionScore('gemini-3-flash-preview')).toBeGreaterThan(versionScore('gemini-2.5-flash'));
        expect(versionScore('gemini-3.8-flash')).toBeGreaterThan(versionScore('gemini-3.7-flash'));
        expect(versionScore('gemini-4-flash-preview')).toBeGreaterThan(versionScore('gemini-3.8-flash'));
    });
    it('sorts the whole available catalog, keeping latest aliases behind explicit versions', () => {
        expect(rankModels(['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-3.6-flash',
            'gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-3.7-flash'].map(n => mk('models/' + n))))
            .toEqual(['gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.6-flash',
                'gemini-3.5-flash', 'gemini-2.5-flash', 'gemini-flash-latest']);
    });
    it('prefers a newer preview generation to an older stable generation', () => {
        expect(pickBest([mk('gemini-2.5-flash'), mk('gemini-3-flash-preview')])).toBe('gemini-3-flash-preview');
    });
    it('prefers stable releases within the same generation', () => {
        expect(rankModels(['gemini-3.8-flash-exp', 'gemini-3.8-flash-preview-09-01', 'gemini-3.8-flash'].map(n => mk(n))))
            .toEqual(['gemini-3.8-flash', 'gemini-3.8-flash-preview-09-01', 'gemini-3.8-flash-exp']);
    });
    it('uses the newer preview snapshot when no stable release is available', () => {
        expect(pickBest(['gemini-3-flash-preview-05-20', 'gemini-3-flash-preview-09-01'].map(n => mk(n))))
            .toBe('gemini-3-flash-preview-09-01');
    });
    it('orders compatible Flash-Lite and Pro models by generation too', () => {
        expect(rankModels(['gemini-3.1-pro-preview', 'gemini-3-flash-preview', 'gemini-3.5-flash-lite'].map(n => mk(n))))
            .toEqual(['gemini-3.5-flash-lite', 'gemini-3.1-pro-preview', 'gemini-3-flash-preview']);
    });
    it('excludes specialist models even when they support generateContent', () => {
        const names = ['gemini-9-flash-image', 'gemini-9-flash-lite-image', 'gemini-9-flash-tts-preview',
            'gemini-9-flash-native-audio-preview-09-2026', 'gemini-9-flash-live-preview',
            'gemini-9-pro-image', 'gemini-9-computer-use-preview', 'gemini-robotics-er-9-preview',
            'gemini-embedding-001', 'gemini-3.8-flash'];
        expect(rankModels(names.map(n => mk(n)))).toEqual(['gemini-3.8-flash']);
    });
    it('ignores malformed data, duplicates and models without generateContent', () => {
        expect(rankModels([null, {}, mk('gemini-9-flash', false), mk('gemini-3.8-flash'), mk('models/gemini-3.8-flash')]))
            .toEqual(['gemini-3.8-flash']);
        expect(pickBest([mk('embedding-001', false)])).toBeNull();
        expect(pickBest(null)).toBeNull();
        expect(pickBest([])).toBeNull();
    });
});
