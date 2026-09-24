import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AudioButton } from '../english/LessonParts';
import { canSpeak, cancelSpeech, speak, speakSequence } from './speech';

class MockAudio {
    static instances: MockAudio[] = [];
    onended: (() => void) | null = null;
    onerror: (() => void) | null = null;
    play = vi.fn(() => Promise.resolve());
    pause = vi.fn();
    constructor(public src: string) { MockAudio.instances.push(this); }
}

class MockUtterance {
    onend: (() => void) | null = null;
    onerror: (() => void) | null = null;
    constructor(public text: string) {}
}

const synth = {
    getVoices: vi.fn((): SpeechSynthesisVoice[] => []),
    cancel: vi.fn(),
    speak: vi.fn((_utterance: MockUtterance) => {}),
};

beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    synth.getVoices.mockReturnValue([]);
    MockAudio.instances = [];
    vi.stubGlobal('Audio', MockAudio);
    vi.stubGlobal('SpeechSynthesisUtterance', MockUtterance);
    vi.stubGlobal('window', { speechSynthesis: synth, setTimeout, setInterval, clearInterval });
});

afterEach(() => {
    cancelSpeech();
    vi.useRealTimers();
    vi.unstubAllGlobals();
});

describe('TTS on devices without installed English voices', () => {
    it.each([{ voices: [] }, { voices: [{ lang: 'zh-CN' }] }])('keeps English audio enabled with voices $voices', ({ voices }) => {
        synth.getVoices.mockReturnValue(voices as SpeechSynthesisVoice[]);
        expect(canSpeak('en-US')).toBe(true);
        const html = renderToStaticMarkup(<AudioButton text="Hello" />);
        expect(html).toContain('aria-label="Nghe: Hello"');
        expect(html).toContain('<svg');
        expect(html).not.toContain('disabled');
        expect(speak('Hello', { lang: 'en-US' })).toBe(true);
        expect(MockAudio.instances[0].src).toContain('tl=en');
        expect(MockAudio.instances[0].play).toHaveBeenCalledOnce();
    });

    it('supports online audio even without the Web Speech API', () => {
        vi.stubGlobal('window', { setTimeout, setInterval, clearInterval });
        expect(canSpeak('en-US')).toBe(true);
        expect(speak('Hello', { lang: 'en-US' })).toBe(true);
        expect(MockAudio.instances).toHaveLength(1);
    });

    it('reports no playback route when both native speech and audio are absent', () => {
        vi.stubGlobal('Audio', undefined);
        const onError = vi.fn();
        expect(canSpeak('en-US')).toBe(false);
        expect(canSpeak('vi-VN', 'example')).toBe(false);
        expect(speak('Hello', { lang: 'en-US', onError })).toBe(false);
        expect(onError).toHaveBeenCalledOnce();
    });
});

describe('playback completion and errors', () => {
    it('does not show an error after successful playback when only onError is supplied', () => {
        const onError = vi.fn();
        speak('Hello', { lang: 'en-US', onError });
        MockAudio.instances[0].onended!();
        expect(onError).not.toHaveBeenCalled();
    });

    it('reports audio failure once without marking a listening exercise ready', () => {
        const onEnd = vi.fn(), onError = vi.fn();
        speak('Hello', { lang: 'en-US', onEnd, onError });
        MockAudio.instances[0].onerror!();
        MockAudio.instances[0].onerror!();
        MockAudio.instances[0].onended!();
        expect(onError).toHaveBeenCalledOnce();
        expect(onEnd).not.toHaveBeenCalled();
    });

    it('reports a rejected play promise', async () => {
        class BlockedAudio extends MockAudio {
            play = vi.fn(() => Promise.reject(new Error('Playback blocked')));
        }
        vi.stubGlobal('Audio', BlockedAudio);
        const onEnd = vi.fn(), onError = vi.fn();
        speak('Hello', { lang: 'en-US', onEnd, onError });
        await Promise.resolve();
        MockAudio.instances[0].onerror!();
        expect(onError).toHaveBeenCalledOnce();
        expect(onEnd).not.toHaveBeenCalled();
    });

    it('reports failure in a later chunk instead of silently skipping it', () => {
        const onEnd = vi.fn(), onError = vi.fn();
        speak('Hello there. '.repeat(40), { lang: 'en-US', onEnd, onError });
        MockAudio.instances[0].onended!();
        MockAudio.instances[1].onerror!();
        expect(onError).toHaveBeenCalledOnce();
        expect(onEnd).not.toHaveBeenCalled();
        expect(MockAudio.instances).toHaveLength(2);
    });

    it('marks long audio complete only after every chunk ends', () => {
        const onEnd = vi.fn(), onError = vi.fn();
        speak('Hello there. '.repeat(40), { lang: 'en-US', onEnd, onError });
        MockAudio.instances[0].onended!();
        expect(onEnd).not.toHaveBeenCalled();
        for (let i = 1; i < MockAudio.instances.length; i++) MockAudio.instances[i].onended!();
        expect(onEnd).toHaveBeenCalledOnce();
        expect(onError).not.toHaveBeenCalled();
    });

    it('ignores events from cancelled playback', () => {
        const onEnd = vi.fn(), onError = vi.fn();
        speak('Hello', { lang: 'en-US', onEnd, onError });
        cancelSpeech();
        MockAudio.instances[0].onended!();
        MockAudio.instances[0].onerror!();
        expect(MockAudio.instances[0].pause).toHaveBeenCalledOnce();
        expect(onEnd).not.toHaveBeenCalled();
        expect(onError).not.toHaveBeenCalled();
    });

    it('keeps Vietnamese MP3 playback ahead of online fallback', () => {
        const onEnd = vi.fn(), onError = vi.fn();
        speak('Nội dung kiểm thử', { audioId: 'test-audio', onEnd, onError });
        expect(MockAudio.instances[0].src).toContain('/audio/vi/test-audio.mp3');
        MockAudio.instances[0].onerror!();
        expect(MockAudio.instances[1].src).toContain('tl=vi');
        MockAudio.instances[1].onended!();
        expect(onEnd).toHaveBeenCalledOnce();
        expect(onError).not.toHaveBeenCalled();
    });

    it.each([true, false])('reports native playback success=%s accurately', success => {
        synth.getVoices.mockReturnValue([{ lang: 'en-US' }] as SpeechSynthesisVoice[]);
        const onEnd = vi.fn(), onError = vi.fn();
        speak('Hello', { lang: 'en-US', onEnd, onError });
        vi.advanceTimersByTime(60);
        const utterance = synth.speak.mock.calls[0][0] as MockUtterance;
        if (success) utterance.onend!(); else utterance.onerror!();
        expect(onEnd).toHaveBeenCalledTimes(success ? 1 : 0);
        expect(onError).toHaveBeenCalledTimes(success ? 0 : 1);
        expect(MockAudio.instances).toHaveLength(0);
    });

    it('continues bilingual sequences after a failed part', () => {
        const onEnd = vi.fn();
        speakSequence([{ text: 'Hello', lang: 'en-US' }, { text: 'Xin chào', lang: 'vi-VN' }], { onEnd });
        vi.advanceTimersByTime(120);
        MockAudio.instances[0].onerror!();
        vi.advanceTimersByTime(200);
        MockAudio.instances[1].onended!();
        vi.advanceTimersByTime(200);
        expect(onEnd).toHaveBeenCalledOnce();
    });
});
