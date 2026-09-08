import { afterEach, describe, expect, it, vi } from 'vitest';
import { AudioSession } from './AudioSession';
import { PITCHES, renderVoice, TIMBRES } from './voices';
import { calibrationOffset } from './calibration';
function fakeContext() {
    const sources: any[] = [];
    const param = () => ({ value: 1, setTargetAtTime: vi.fn(), cancelScheduledValues: vi.fn() });
    const ctx: any = { state: 'running', currentTime: 1, sampleRate: 24000, destination: {}, resume: vi.fn(async () => { ctx.state = 'running'; }), close: vi.fn(async () => { ctx.state = 'closed'; }),
        createGain: () => ({ gain: param(), connect: vi.fn(), disconnect: vi.fn() }),
        createWaveShaper: () => ({ curve: null, oversample: 'none', connect: vi.fn() }),
        createDynamicsCompressor: () => ({ threshold: param(), knee: param(), ratio: param(), attack: param(), release: param(), connect: vi.fn() }),
        createBuffer: () => ({ copyToChannel: vi.fn() }),
        createBufferSource: () => { const s = { buffer: null, connect: vi.fn(), disconnect: vi.fn(), start: vi.fn(), stop: vi.fn(), onended: null }; sources.push(s); return s; },
        getOutputTimestamp: () => ({ contextTime: ctx.currentTime - .035, performanceTime: performance.now() }) };
    return { ctx, sources, audio: new AudioSession(() => ctx) };
}
afterEach(() => vi.useRealTimers());
describe('original instrument patches', () => {
    it.each(TIMBRES)('%s has usable level, a clean tail and correct fundamental', timbre => {
        const rate = 24000;
        for (let note = 0; note < 5; note++) {
            const pcm = renderVoice(timbre, note, rate), peak = Math.max(...pcm.map(Math.abs));
            expect(peak).toBeLessThan(.65); expect(peak).toBeGreaterThan(.18); expect(pcm[0]).toBe(0); expect(pcm.at(-1)).toBe(0); expect(pcm.every(Number.isFinite)).toBe(true);
            const energy = (f: number) => { let re = 0, im = 0; for (let i = 500; i < 8000; i++) { re += pcm[i] * Math.cos(2 * Math.PI * f * i / rate); im += pcm[i] * Math.sin(2 * Math.PI * f * i / rate); } return re * re + im * im; };
            const e = energy(PITCHES[note]); expect(e).toBeGreaterThan(energy(PITCHES[note] * .97) * 5); expect(e).toBeGreaterThan(energy(PITCHES[note] * 1.03) * 5);
            expect(pcm.slice(-300).every(n => Math.abs(n) < .002)).toBe(true);
        }
    });
    it('percussion is deterministic, finite and headroom-bounded', () => {
        for (const v of ['kick', 'clap', 'tick'] as const) { const a = renderVoice(v, 0, 48000); expect(a).toEqual(renderVoice(v, 0, 48000)); expect(a.every(n => Number.isFinite(n) && Math.abs(n) < .7)).toBe(true); expect(a.at(-1)).toBe(0); }
    });
});
describe('audio lifecycle and clock', () => {
    it('awaits successful resume and never plays after unlock failure', async () => {
        const { audio, ctx, sources } = fakeContext(); ctx.state = 'suspended'; ctx.resume = vi.fn(async () => { throw new Error('gesture'); });
        expect(await audio.unlock()).toBe(false); audio.play('wood'); expect(sources).toHaveLength(0);
        ctx.resume = vi.fn(async () => { ctx.state = 'running'; }); expect(await audio.unlock()).toBe(true); audio.play('wood'); expect(sources).toHaveLength(1); audio.close();
    });
    it('schedules on the audio clock, cancels future cues and all playing sources', async () => {
        vi.useFakeTimers(); const { audio, ctx, sources } = fakeContext(); await audio.unlock(); const cue = vi.fn(), done = vi.fn();
        const start = audio.schedule([{ at: 0, voice: 'wood', cue: 'first' }, { at: .8, voice: 'bell', cue: 'second' }], 1.2, cue, done);
        expect(sources).toHaveLength(0); ctx.currentTime = start - .1; vi.advanceTimersByTime(20); expect(sources).toHaveLength(1); expect(sources[0].start).toHaveBeenCalledWith(start);
        audio.stop(); expect(sources[0].stop).toHaveBeenCalled(); ctx.currentTime = start + 2; vi.advanceTimersByTime(2000); expect(sources).toHaveLength(1); expect(cue).not.toHaveBeenCalled(); expect(done).not.toHaveBeenCalled(); audio.close();
    });
    it('mute stops sources and scheduler rather than merely silencing a bus', async () => {
        vi.useFakeTimers(); const { audio, ctx, sources } = fakeContext(); await audio.unlock(); audio.play('bell'); const done = vi.fn(); audio.schedule([{ at: .5, voice: 'wood' }], 1, vi.fn(), done); audio.setMuted(true);
        ctx.currentTime += 3; vi.advanceTimersByTime(3000); expect(done).not.toHaveBeenCalled(); expect(sources[0].stop).toHaveBeenCalled(); audio.play('wood'); expect(sources).toHaveLength(1); audio.close();
    });
    it('detects delayed scheduling, interrupts instead of playing a late sequence', async () => {
        vi.useFakeTimers(); const { audio, ctx } = fakeContext(); await audio.unlock(); const interrupt = audio.onInterrupt = vi.fn(), done = vi.fn();
        audio.schedule([{ at: .2, voice: 'clap' }], 1, vi.fn(), done); ctx.currentTime += 1; vi.advanceTimersByTime(20); expect(interrupt).toHaveBeenCalledOnce(); expect(done).not.toHaveBeenCalled(); audio.close();
    });
    it('limits polyphony, disconnects finished voices, and closes cleanly', async () => {
        const { audio, sources, ctx } = fakeContext(); await audio.unlock(); for (let i = 0; i < 40; i++) audio.play('wood', i % 5); expect(audio.activeVoices).toBe(16); expect(sources[0].stop).toHaveBeenCalled(); sources.at(-1).onended(); expect(audio.activeVoices).toBe(15); expect(sources.at(-1).disconnect).toHaveBeenCalled(); audio.close(); expect(audio.activeVoices).toBe(0); expect(ctx.close).toHaveBeenCalled(); expect(await audio.unlock()).toBe(false);
    });
    it('maps event timestamp and explicit offset, with an honest estimated fallback', async () => {
        const { audio, ctx } = fakeContext(); await audio.unlock(); const now = performance.now(); expect(audio.inputTime(now, 50)).toBeCloseTo(ctx.currentTime - .085, 2); expect(audio.timingQuality).toBe('output-clock'); ctx.getOutputTimestamp = undefined; expect(audio.timingQuality).toBe('estimated'); expect(audio.inputTime(performance.now())).toBeCloseTo(ctx.currentTime, 2); audio.close();
    });
    it('rejects unreliable calibration samples', () => { expect(calibrationOffset([40, 50, 55, 45, 60, 50, 45, 50])).toBe(50); expect(calibrationOffset([1, 2])).toBe(null); expect(calibrationOffset([-220, -170, -70, 60, 180, 230, 200, 20])).toBe(null); expect(calibrationOffset(Array(8).fill(300))).toBe(null); });
});
