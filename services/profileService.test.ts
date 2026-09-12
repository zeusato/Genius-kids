import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    createProfile,
    updateProfile,
    migrateProfile,
    getAllProfiles,
    saveProfiles,
    MAX_PROFILE_NAME_LENGTH,
} from './profileService';
import { Grade } from '../types';

describe('profileService - Profile Name Length Limit', () => {
    let mockStore: Record<string, string> = {};

    beforeEach(() => {
        mockStore = {};
        vi.stubGlobal('localStorage', {
            getItem: (key: string) => mockStore[key] ?? null,
            setItem: (key: string, value: string) => {
                mockStore[key] = value;
            },
            removeItem: (key: string) => {
                delete mockStore[key];
            },
            clear: () => {
                mockStore = {};
            },
        });
    });

    it('defines MAX_PROFILE_NAME_LENGTH as 50', () => {
        expect(MAX_PROFILE_NAME_LENGTH).toBe(50);
    });

    it('creates profile with name truncated to at most 50 characters', () => {
        const longName = 'A'.repeat(60);
        const profile = createProfile(longName, Grade.Grade1);

        expect(profile.name.length).toBe(50);
        expect(profile.name).toBe('A'.repeat(50));
    });

    it('preserves name under 50 characters in createProfile', () => {
        const normalName = 'Nguyễn Văn An';
        const profile = createProfile(normalName, Grade.Grade2);

        expect(profile.name).toBe(normalName);
        expect(profile.name.length).toBeLessThanOrEqual(50);
    });

    it('trims whitespace and truncates to 50 characters in createProfile', () => {
        const nameWithSpaces = '   ' + 'B'.repeat(55) + '   ';
        const profile = createProfile(nameWithSpaces, Grade.Grade3);

        expect(profile.name.length).toBe(50);
        expect(profile.name).toBe('B'.repeat(50));
    });

    it('truncates name when updating profile via updateProfile', () => {
        const profile = createProfile('Bé Bo', Grade.Grade1);
        const longUpdatedName = 'C'.repeat(70);

        const updatedProfiles = updateProfile({
            ...profile,
            name: longUpdatedName,
        });

        const stored = updatedProfiles.find(p => p.id === profile.id);
        expect(stored).toBeDefined();
        expect(stored!.name.length).toBe(50);
        expect(stored!.name).toBe('C'.repeat(50));
    });

    it('truncates overlong names during migrateProfile', () => {
        // Case 1: unmigrated format with >50 char name
        const oldUnmigrated = {
            id: 'legacy-1',
            name: 'D'.repeat(65),
            stars: 10,
        };
        const migrated = migrateProfile(oldUnmigrated);
        expect(migrated.name.length).toBe(50);
        expect(migrated.name).toBe('D'.repeat(50));

        // Case 2: already migrated structure but name exceeds 50 chars
        const alreadyMigrated = {
            id: 'migrated-1',
            name: 'E'.repeat(80),
            currentAvatarId: 'avatar_01',
            stars: 5,
            stats: { totalTests: 0 },
        };
        const migrated2 = migrateProfile(alreadyMigrated);
        expect(migrated2.name.length).toBe(50);
        expect(migrated2.name).toBe('E'.repeat(50));
    });
});
