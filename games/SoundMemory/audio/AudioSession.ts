import { renderVoice, TIMBRES, Voice } from './voices';
import { createOutput } from './output';
export interface AudioEvent { at: number; voice?: Voice; note?: number; gain?: number; cue?: string }
interface ActiveVoice { source: AudioBufferSourceNode; gain: GainNode }
export type TimingQuality = 'output-clock' | 'estimated';

export class AudioSession {
    private context: AudioContext | null = null;
    private master: GainNode | null = null;
    private buffers = new Map<string, AudioBuffer>();
    private voices = new Set<ActiveVoice>();
    private timer: ReturnType<typeof setInterval> | null = null;
    private epoch = 0;
    private volume = .65;
    private muted = false;
    private disposed = false;
    onInterrupt: (reason: string) => void = () => {};
    constructor(private factory: () => AudioContext = () => new AudioContext({ latencyHint: 'interactive' })) {}
    get now() { return this.context?.currentTime || 0; }
    get ready() { return this.context?.state === 'running'; }
    get activeVoices() { return this.voices.size; }
    get timingQuality(): TimingQuality { return this.outputStamp() ? 'output-clock' : 'estimated'; }
    private outputStamp() {
        try {
            const stamp = this.context?.getOutputTimestamp?.();
            if (stamp && stamp.contextTime > 0 && stamp.performanceTime > 0 && Math.abs(performance.now() - stamp.performanceTime) < 250) return stamp;
        } catch { /* Older implementations use the estimated clock. */ }
        return null;
    }
    /** Map input timestamps to the output clock, rather than React processing time. */
    inputTime(eventTime: number, offsetMs = 0) {
        const now = performance.now(), time = Number.isFinite(eventTime) && Math.abs(eventTime - now) < 2000 ? eventTime : now;
        const stamp = this.outputStamp();
        return (stamp ? stamp.contextTime + (time - stamp.performanceTime) / 1000 : this.now + (time - now) / 1000) - offsetMs / 1000;
    }
    async unlock() {
        if (this.disposed) return false;
        try {
            if (!this.context) {
                const ctx = this.context = this.factory();
                this.master = createOutput(ctx, this.muted ? 0 : this.volume);
                ctx.onstatechange = () => { if (!this.disposed && ctx.state !== 'running') { this.stop(); this.onInterrupt('Âm thanh vừa bị gián đoạn. Mình nghe lại câu này nhé.'); } };
                for (const voice of [...TIMBRES, 'kick', 'clap', 'tick'] as Voice[]) {
                    for (let n = 0; n < (TIMBRES.includes(voice as typeof TIMBRES[number]) ? 5 : 1); n++) {
                        const pcm = renderVoice(voice, n, ctx.sampleRate), buffer = ctx.createBuffer(1, pcm.length, ctx.sampleRate);
                        buffer.copyToChannel(pcm, 0); this.buffers.set(`${voice}:${n}`, buffer);
                    }
                }
            }
            if (this.context.state !== 'running') await this.context.resume();
            return !this.disposed && this.context.state === 'running';
        } catch { return false; }
    }
    setVolume(value: number) {
        this.volume = Math.max(0, Math.min(.85, value));
        this.master?.gain.setTargetAtTime(this.muted ? 0 : this.volume, this.now, .015);
    }
    setMuted(muted: boolean) {
        this.muted = muted; if (muted) this.stop();
        this.master?.gain.setTargetAtTime(muted ? 0 : this.volume, this.now, .01);
    }
    play(voice: Voice, note = 0, at = this.now, level = 1) {
        if (!this.ready || this.muted || !this.master) return;
        const ctx = this.context!, buffer = this.buffers.get(`${voice}:${TIMBRES.includes(voice as typeof TIMBRES[number]) ? note : 0}`);
        if (!buffer) return;
        if (this.voices.size >= 16) this.release(this.voices.values().next().value!, this.now);
        const source = ctx.createBufferSource(), gain = ctx.createGain(), v = { source, gain };
        source.buffer = buffer; gain.gain.value = Math.max(0, Math.min(1, level)); source.connect(gain); gain.connect(this.master);
        source.onended = () => { source.disconnect(); gain.disconnect(); this.voices.delete(v); };
        this.voices.add(v); source.start(Math.max(this.now, at));
    }
    private release(v: ActiveVoice, at: number) {
        v.gain.gain.cancelScheduledValues(at); v.gain.gain.setTargetAtTime(0, at, .004);
        try { v.source.stop(at + .018); } catch { /* Already ended. */ }
        this.voices.delete(v);
    }
    stop() {
        this.epoch++;
        if (this.timer !== null) clearInterval(this.timer);
        this.timer = null; for (const v of [...this.voices]) this.release(v, this.now);
    }
    /** Audio-clock lookahead; UI cues follow the output timestamp. */
    schedule(events: AudioEvent[], duration: number, cue: (id: string) => void, done: () => void) {
        this.stop(); const epoch = this.epoch, start = this.now + .14;
        const queue = [...events].sort((a, b) => a.at - b.at);
        let scheduled = 0, shown = 0;
        const pump = () => {
            if (epoch !== this.epoch || this.disposed) return;
            if (!this.ready) { this.stop(); this.onInterrupt('Mình chạm Tiếp tục để bật lại âm thanh nhé.'); return; }
            while (scheduled < queue.length && start + queue[scheduled].at <= this.now + .12) {
                const e = queue[scheduled++];
                if (e.voice && start + e.at < this.now - .08) { this.stop(); this.onInterrupt('Máy vừa chậm một chút. Mình nghe lại câu này nhé.'); return; }
                if (e.voice) this.play(e.voice, e.note, start + e.at, e.gain ?? 1);
            }
            const heard = this.inputTime(performance.now());
            while (shown < queue.length && start + queue[shown].at <= heard) {
                const e = queue[shown++]; if (e.cue) cue(e.cue); if (epoch !== this.epoch) return;
            }
            if (heard >= start + duration) { if (this.timer !== null) clearInterval(this.timer); this.timer = null; done(); }
        };
        this.timer = setInterval(pump, 20); pump(); return start;
    }
    close() { this.disposed = true; this.stop(); if (this.context) { this.context.onstatechange = null; void this.context.close().catch(() => {}); } this.buffers.clear(); }
}
