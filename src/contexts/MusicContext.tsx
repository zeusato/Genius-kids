/**
 * Music Context
 * 
 * Provides global music state and controls to all components
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { musicManager } from '@/services/musicManager';
import { getMusicTrackForRoute } from '@/services/musicConfig';

import { MusicTrack } from '@/services/musicConfig';

interface MusicContextValue {
    musicEnabled: boolean;
    soundEnabled: boolean;
    toggleMusic: () => void;
    toggleSound: () => void;
    playTrack: (track: MusicTrack | null) => void;
    resumeRouteMusic: () => void;
}

const MusicContext = createContext<MusicContextValue | undefined>(undefined);

interface MusicProviderProps {
    children: ReactNode;
}

export function MusicProvider({ children }: MusicProviderProps) {
    const location = useLocation();
    const [version, setVersion] = useState(0);

    // Subscribe to music manager state changes
    useEffect(() => {
        const unsubscribe = musicManager.subscribe(() => {
            setVersion(v => v + 1);
        });

        return unsubscribe;
    }, []);

    // Handle route changes - play appropriate music
    useEffect(() => {
        const track = getMusicTrackForRoute(location.pathname);
        musicManager.playTrack(track);
    }, [location.pathname]);

    const { musicEnabled, soundEnabled } = musicManager.getMusicState();

    const value: MusicContextValue = {
        musicEnabled,
        soundEnabled,
        toggleMusic: () => musicManager.toggleMusic(),
        toggleSound: () => musicManager.toggleSound(),
        playTrack: (track) => musicManager.playTrack(track),
        resumeRouteMusic: () => musicManager.resumeRouteMusic(),
    };

    return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>;
}

/**
 * Hook to access music controls
 */
export function useMusicControls(): MusicContextValue {
    const context = useContext(MusicContext);

    if (!context) {
        throw new Error('useMusicControls must be used within MusicProvider');
    }

    return context;
}
