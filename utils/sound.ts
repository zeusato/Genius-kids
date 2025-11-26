// Sound Manager using Web Audio API
// No external dependencies or files required

import { musicManager } from '@/services/musicManager';

class SoundManager {
    private audioCtx: AudioContext | null = null;
    private isMuted: boolean = false;

    constructor() {
        // Initialize AudioContext on first user interaction usually, 
        // but we can set it up here and resume later.
        try {
            const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
            this.audioCtx = new AudioContextClass();
        } catch (e) {
            console.error('Web Audio API not supported', e);
        }
    }

    private getContext() {
        if (!this.audioCtx) return null;
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
        return this.audioCtx;
    }

    public setMute(mute: boolean) {
        this.isMuted = mute;
    }

    public toggleMute() {
        this.isMuted = !this.isMuted;
        return this.isMuted;
    }

    public playNote(freq: number, duration: number = 0.3) {
        this.playTone(freq, 'sine', duration, 0);
    }

    // Play a tone
    private playTone(freq: number, type: OscillatorType, duration: number, startTime: number = 0) {
        const ctx = this.getContext();

        // Check both isMuted and global sound setting from musicManager
        if (!ctx || this.isMuted || !musicManager.isSoundEnabled()) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);

        gain.gain.setValueAtTime(0.1, ctx.currentTime + startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + startTime);
        osc.stop(ctx.currentTime + startTime + duration);
    }

    public playCorrect() {
        // High pitched "Ding" - two sine waves
        this.playTone(880, 'sine', 0.1, 0); // A5
        this.playTone(1760, 'sine', 0.3, 0.1); // A6
    }

    public playWrong() {
        // Low pitched "Buzz" - sawtooth
        this.playTone(150, 'sawtooth', 0.3, 0);
    }

    public playClick() {
        // Short click
        this.playTone(800, 'sine', 0.05, 0);
    }

    public playComplete() {
        // Ascending arpeggio
        const now = 0;
        this.playTone(523.25, 'sine', 0.2, now);       // C5
        this.playTone(659.25, 'sine', 0.2, now + 0.1); // E5
        this.playTone(783.99, 'sine', 0.2, now + 0.2); // G5
        this.playTone(1046.50, 'sine', 0.4, now + 0.3); // C6
    }
}

export const soundManager = new SoundManager();
