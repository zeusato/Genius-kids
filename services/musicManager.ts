/**
 * Music Manager Service
 * 
 * Singleton service to manage background music playback across the app.
 * Features:
 * - Auto-loop music
 * - Seamless transitions (no restart when same track)
 * - Persistent settings in localStorage
 * - Independent music/sound toggles
 */

import { MusicTrack, MUSIC_FILES, getMusicTrackForRoute } from './musicConfig';

// LocalStorage keys
const STORAGE_KEY_MUSIC_ENABLED = 'mathgenius_music_enabled';
const STORAGE_KEY_SOUND_ENABLED = 'mathgenius_sound_enabled';

class MusicManager {
    private audio: HTMLAudioElement | null = null;
    private currentTrack: MusicTrack | null = null;
    private musicEnabled: boolean = true;
    private soundEnabled: boolean = true;
    private listeners: Set<() => void> = new Set();

    constructor() {
        this.loadSettings();
        this.initializeAudio();
    }

    /**
     * Load settings from localStorage
     */
    private loadSettings(): void {
        const musicSetting = localStorage.getItem(STORAGE_KEY_MUSIC_ENABLED);
        const soundSetting = localStorage.getItem(STORAGE_KEY_SOUND_ENABLED);

        this.musicEnabled = musicSetting !== null ? musicSetting === 'true' : true;
        this.soundEnabled = soundSetting !== null ? soundSetting === 'true' : true;
    }

    /**
     * Save settings to localStorage
     */
    private saveSettings(): void {
        localStorage.setItem(STORAGE_KEY_MUSIC_ENABLED, String(this.musicEnabled));
        localStorage.setItem(STORAGE_KEY_SOUND_ENABLED, String(this.soundEnabled));
    }

    /**
     * Initialize audio element
     */
    private initializeAudio(): void {
        if (typeof window === 'undefined') return; // SSR safety

        this.audio = new Audio();
        this.audio.loop = true;
        this.audio.volume = 0.4; // Set reasonable default volume (40%)

        // Preload metadata for faster playback
        this.audio.preload = 'metadata';
    }

    /**
     * Play music for a specific track
     * @param track - Music track to play, or null to stop
     */
    public playTrack(track: MusicTrack | null): void {
        if (!this.audio) return;

        // If track is null, stop music
        if (track === null) {
            this.stopCurrentTrack();
            this.currentTrack = null;
            return;
        }

        // If music is disabled, don't play (but set current track so it resumes if enabled)
        if (!this.musicEnabled) {
            this.currentTrack = track;
            this.stopCurrentTrack();
            return;
        }

        // If same track is already playing, do nothing (seamless)
        if (this.currentTrack === track && !this.audio.paused) {
            return;
        }

        // Switch to new track
        this.currentTrack = track;
        const filePath = MUSIC_FILES[track];

        // Set new source and play
        this.audio.src = filePath;
        this.audio.load();

        // Auto-play (handle potential browser restrictions)
        this.audio.play().catch(err => {
            console.warn('Music autoplay prevented by browser:', err);
            // User interaction required - will play when user clicks music toggle
        });
    }

    /**
     * Resume music based on current route
     * Used when exiting a game with custom music
     */
    public resumeRouteMusic(): void {
        if (typeof window === 'undefined') return;
        const track = getMusicTrackForRoute(window.location.pathname);
        this.playTrack(track);
    }

    /**
     * Stop current track
     */
    private stopCurrentTrack(): void {
        if (!this.audio) return;

        this.audio.pause();
        this.audio.currentTime = 0;
    }

    /**
     * Toggle music on/off
     */
    public toggleMusic(): void {
        this.musicEnabled = !this.musicEnabled;
        this.saveSettings();

        if (this.audio) {
            if (this.musicEnabled && this.currentTrack) {
                // Resume current track
                this.playTrack(this.currentTrack);
            } else {
                // Stop music
                this.stopCurrentTrack();
            }
        }

        this.notifyListeners();
    }

    /**
     * Toggle sound effects on/off
     */
    public toggleSound(): void {
        this.soundEnabled = !this.soundEnabled;
        this.saveSettings();
        this.notifyListeners();
    }

    /**
     * Get current music state
     */
    public getMusicState(): { musicEnabled: boolean; soundEnabled: boolean } {
        return {
            musicEnabled: this.musicEnabled,
            soundEnabled: this.soundEnabled,
        };
    }

    /**
     * Check if sound effects should play
     */
    public isSoundEnabled(): boolean {
        return this.soundEnabled;
    }

    /**
     * Subscribe to state changes
     */
    public subscribe(listener: () => void): () => void {
        this.listeners.add(listener);
        // Return unsubscribe function
        return () => {
            this.listeners.delete(listener);
        };
    }

    /**
     * Notify all listeners of state change
     */
    private notifyListeners(): void {
        this.listeners.forEach(listener => listener());
    }

    /**
     * Set volume (0.0 to 1.0)
     */
    public setVolume(volume: number): void {
        if (this.audio) {
            this.audio.volume = Math.max(0, Math.min(1, volume));
        }
    }
}

// Export singleton instance
export const musicManager = new MusicManager();
