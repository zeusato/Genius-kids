/**
 * Music Configuration for MathGenius Kids
 * 
 * Defines mapping between routes and background music files
 */

// Music track identifiers
export enum MusicTrack {
    MAIN_THEME = 'MAIN_THEME',
    DRAGON_QUEST = 'DRAGON_QUEST',
    SPEED_MATH = 'SPEED_MATH',
    SPHINX_RIDDLE = 'SPHINX_RIDDLE',
    TELL_ME_WHY = 'TELL_ME_WHY',
}

// Mapping from track to file path (relative to public/)
export const MUSIC_FILES: Record<MusicTrack, string> = {
    [MusicTrack.MAIN_THEME]: '/Genius-kids/sound/mainTheme-Curious Minds.mp3',
    [MusicTrack.DRAGON_QUEST]: '/Genius-kids/sound/dragonQuest-Knights of the Playground.mp3',
    [MusicTrack.SPEED_MATH]: '/Genius-kids/sound/timeAttack-Wonder in the Air.mp3',
    [MusicTrack.SPHINX_RIDDLE]: '/Genius-kids/sound/sphinxRiddle-Mystic Sands.mp3',
    [MusicTrack.TELL_ME_WHY]: '/Genius-kids/sound/1000q.mp3',
};

/**
 * Get music track for a given route path
 * @param pathname - Current route pathname (e.g., '/mode', '/game/dragonquest')
 * @returns Music track identifier
 */
export function getMusicTrackForRoute(pathname: string): MusicTrack {
    // Normalize pathname (remove trailing slash, convert to lowercase)
    const normalizedPath = pathname.toLowerCase().replace(/\/$/, '');

    // Check for specific game routes first (more specific matches)
    if (normalizedPath.includes('dragonquest')) {
        return MusicTrack.DRAGON_QUEST;
    }
    if (normalizedPath.includes('speedmath')) {
        return MusicTrack.SPEED_MATH;
    }
    if (normalizedPath.includes('riddle')) {
        return MusicTrack.SPHINX_RIDDLE;
    }
    if (normalizedPath.includes('tellmewhy')) {
        return MusicTrack.TELL_ME_WHY;
    }

    // Default routes use main theme
    // Includes: /, /mode, /game (menu), /shop, /profile, /album
    return MusicTrack.MAIN_THEME;
}
