import { describe, expect, it } from 'vitest';
import { getMusicTrackForRoute, MusicTrack } from './musicConfig';

describe('alphabet background music', () => {
    it.each(['/piano', '/Genius-kids/piano/', '/preschool/alphabet', '/Genius-kids/preschool/alphabet', '/Genius-kids/preschool/alphabet/', '/GENIUS-KIDS/PRESCHOOL/ALPHABET', '/preschool/counting', '/Genius-kids/preschool/counting/'])('keeps %s quiet', path => {
        expect(getMusicTrackForRoute(path)).toBeNull();
    });

    it('preserves the music of menus, other preschool topics and games', () => {
        for (const path of ['/mode', '/preschool/colors']) {
            expect(getMusicTrackForRoute(path)).toBe(MusicTrack.MAIN_THEME);
        }
        expect(getMusicTrackForRoute('/game/dragonquest')).toBe(MusicTrack.DRAGON_QUEST);
        expect(getMusicTrackForRoute('/science')).toBe(MusicTrack.SCIENCE);
    });
});
