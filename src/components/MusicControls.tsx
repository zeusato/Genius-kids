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
}

export function MusicControls({ className = '', vertical = false, hideSound = false }: MusicControlsProps) {
    const { musicEnabled, soundEnabled, toggleMusic, toggleSound } = useMusicControls();

    const buttonBaseClass = 'p-2.5 rounded-lg transition-all hover:scale-110 active:scale-95';

    return (
        <div className={`flex ${vertical ? 'flex-col' : 'items-center'} gap-2 ${className}`}>
            {/* Music Toggle */}
            <button
                onClick={toggleMusic}
                className={`${buttonBaseClass} ${musicEnabled
                    ? 'bg-brand-100 text-brand-600 hover:bg-brand-200'
                    : 'bg-slate-200 text-slate-400 hover:bg-slate-300'
                    }`}
                title={musicEnabled ? 'Tắt nhạc nền' : 'Bật nhạc nền'}
                aria-label={musicEnabled ? 'Tắt nhạc nền' : 'Bật nhạc nền'}
            >
                {musicEnabled ? (
                    <Music size={20} className="animate-in zoom-in duration-200" />
                ) : (
                    <Music2 size={20} className="animate-in zoom-in duration-200 opacity-50" />
                )}
            </button>

            {/* Sound Toggle - Conditionally render */}
            {!hideSound && (
                <button
                    onClick={toggleSound}
                    className={`${buttonBaseClass} ${soundEnabled
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
