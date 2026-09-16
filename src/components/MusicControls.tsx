/**
 * Music Controls Component
 * 
 * Displays music and sound toggle buttons
 * - Music: Background music on/off
 * - Sound: Sound effects on/off
 */

import React from 'react';
import { Music, Volume2, VolumeX, Music2 } from 'lucide-react';
import { useMusicControls } from '@/src/contexts/MusicContext';

interface MusicControlsProps {
    className?: string;
    vertical?: boolean;
    hideSound?: boolean;
    variant?: 'default' | 'hub';
}

export function MusicControls({ className = '', vertical = false, hideSound = false, variant = 'default' }: MusicControlsProps) {
    const { musicEnabled, musicTemporarilyMuted = false, soundEnabled, toggleMusic, toggleSound } = useMusicControls();
    const musicActive = musicEnabled && !musicTemporarilyMuted;
    const musicLabel = musicTemporarilyMuted
        ? 'Nhạc nền tạm tắt để nghe bài học rõ hơn'
        : musicEnabled ? 'Tắt nhạc nền' : 'Bật nhạc nền';

    const buttonBaseClass = 'p-2.5 rounded-lg transition-all hover:scale-110 active:scale-95';

    return (
        <div className={variant === 'hub' ? `hub-audio ${className}` : `flex ${vertical ? 'flex-col' : 'items-center'} gap-2 ${className}`}>
            {/* Music Toggle */}
            <button
                onClick={toggleMusic}
                disabled={musicTemporarilyMuted}
                aria-pressed={musicActive}
                className={variant === 'hub' ? 'hub-icon' : `${buttonBaseClass} ${musicActive
                    ? 'bg-brand-100 text-brand-600 hover:bg-brand-200'
                    : 'bg-slate-200 text-slate-400 hover:bg-slate-300'
                    }`}
                title={musicLabel}
                aria-label={musicLabel}
            >
                {musicActive ? (
                    <Music size={20} className="animate-in zoom-in duration-200" />
                ) : (
                    <Music2 size={20} className="animate-in zoom-in duration-200 opacity-50" />
                )}
            </button>

            {/* Sound Toggle - Conditionally render */}
            {!hideSound && (
                <button
                    onClick={toggleSound}
                    aria-pressed={soundEnabled}
                    className={variant === 'hub' ? 'hub-icon' : `${buttonBaseClass} ${soundEnabled
                        ? 'bg-brand-100 text-brand-600 hover:bg-brand-200'
                        : 'bg-slate-200 text-slate-400 hover:bg-slate-300'
                        }`}
                    title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
                    aria-label={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
                >
                    {soundEnabled ? (
                        <Volume2 size={20} className="animate-in zoom-in duration-200" />
                    ) : (
                        <VolumeX size={20} className="animate-in zoom-in duration-200" />
                    )}
                </button>
            )}
        </div>
    );
}
