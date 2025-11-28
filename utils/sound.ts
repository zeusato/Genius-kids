// Sound Manager using Web Audio API
// No external dependencies or files required

import { musicManager } from '@/services/musicManager';

class SoundManager {
    private audioCtx: AudioContext | null = null;
    private isMuted: boolean = false;
    private isUnlocked: boolean = false;

    constructor() {
        // Initialize AudioContext on first user interaction usually, 
        // but we can set it up here and resume later.
        try {
            const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
            this.audioCtx = new AudioContextClass();
        } catch (e) {
            console.error('Web Audio API not supported', e);
        }

        // Auto-unlock on first user interaction (iOS fix)
        this.setupAutoUnlock();
    }

    private setupAutoUnlock() {
        const unlock = () => {
            if (this.isUnlocked) return;
            this.unlockAudio();
            // Remove listeners after first unlock
            document.removeEventListener('touchstart', unlock, true);
            document.removeEventListener('touchend', unlock, true);
            document.removeEventListener('click', unlock, true);
            document.removeEventListener('keydown', unlock, true);
        };

        document.addEventListener('touchstart', unlock, true);
        document.addEventListener('touchend', unlock, true);
        document.addEventListener('click', unlock, true);
        document.addEventListener('keydown', unlock, true);
    }

    /**
     * Unlock audio context for iOS/Safari.
     * Must be called from a user interaction event.
     */
    public unlockAudio() {
        if (!this.audioCtx || this.isUnlocked) return;

        // Create and immediately stop a silent audio buffer
        // This is required to unlock audio on iOS
        const buffer = this.audioCtx.createBuffer(1, 1, 22050);
        const source = this.audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(this.audioCtx.destination);
        source.start(0);

        // Resume the context
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        this.isUnlocked = true;
        console.log('🔊 Audio unlocked for iOS/Safari');
    }

    private getContext() {
        if (!this.audioCtx) return null;

        // Always try to resume if suspended
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume().catch(err => {
                console.warn('Failed to resume AudioContext:', err);
            });
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

        gain.gain.setValueAtTime(0.5, ctx.currentTime + startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + startTime);
        osc.stop(ctx.currentTime + startTime + duration);
    }

    public playCorrect() {
        // High pitched "Ding" - two sine waves
        this.playTone(880, 'sine', 0.15, 0); // A5
        this.playTone(1760, 'sine', 0.45, 0.1); // A6
    }

    public playWrong() {
        // Low pitched "Buzz" - sawtooth
        this.playTone(150, 'sawtooth', 0.45, 0);
    }

    public playClick() {
        // Short click
        this.playTone(800, 'sine', 0.05, 0);
    }

    public playComplete() {
        // Ascending arpeggio
        const now = 0;
        this.playTone(523.25, 'sine', 0.3, now);       // C5
        this.playTone(659.25, 'sine', 0.3, now + 0.15); // E5
        this.playTone(783.99, 'sine', 0.3, now + 0.3); // G5
        this.playTone(1046.50, 'sine', 0.6, now + 0.45); // C6
    }
}

export const soundManager = new SoundManager();

export const playSound = (sound: 'ding' | 'buzz' | 'click' | 'complete') => {
    switch (sound) {
        case 'ding': soundManager.playCorrect(); break;
        case 'buzz': soundManager.playWrong(); break;
        case 'click': soundManager.playClick(); break;
        case 'complete': soundManager.playComplete(); break;
    }
};
