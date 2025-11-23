import { Avatar } from '../types';

// Pre-generated avatar images (limited by quota, using emoji for rest)
const AVATAR_IMAGES = [
    '/Genius-kids/avatars/avatar_01_puppy_1763891407938.png',
    '/Genius-kids/avatars/avatar_02_kitten_1763891424934.png',
    '/Genius-kids/avatars/avatar_03_panda_1763891438752.png',
    '/Genius-kids/avatars/avatar_04_bunny_1763891452217.png',
    '/Genius-kids/avatars/avatar_05_bear_1763891465009.png',
    '/Genius-kids/avatars/avatar_06_fox_1763891512636.png',
    '/Genius-kids/avatars/avatar_07_lion_1763891528246.png',
];

// Complete list of 20 avatars (7 images + 13 emojis)
const AVATARS: Avatar[] = [
    // Generated images
    { id: 'avatar_01', name: 'Chó con', imagePath: AVATAR_IMAGES[0], isEmoji: false, cost: 30 },
    { id: 'avatar_02', name: 'Mèo con', imagePath: AVATAR_IMAGES[1], isEmoji: false, cost: 30 },
    { id: 'avatar_03', name: 'Gấu trúc', imagePath: AVATAR_IMAGES[2], isEmoji: false, cost: 30 },
    { id: 'avatar_04', name: 'Thỏ', imagePath: AVATAR_IMAGES[3], isEmoji: false, cost: 30 },
    { id: 'avatar_05', name: 'Gấu', imagePath: AVATAR_IMAGES[4], isEmoji: false, cost: 30 },
    { id: 'avatar_06', name: 'Cáo', imagePath: AVATAR_IMAGES[5], isEmoji: false, cost: 30 },
    { id: 'avatar_07', name: 'Sư tử', imagePath: AVATAR_IMAGES[6], isEmoji: false, cost: 30 },

    // Emoji-based avatars
    { id: 'avatar_08', name: 'Chim cánh cụt', imagePath: '🐧', isEmoji: true, cost: 30 },
    { id: 'avatar_09', name: 'Gấu túi', imagePath: '🐨', isEmoji: true, cost: 30 },
    { id: 'avatar_10', name: 'Cú mèo', imagePath: '🦉', isEmoji: true, cost: 30 },
    { id: 'avatar_11', name: 'Khỉ', imagePath: '🐵', isEmoji: true, cost: 30 },
    { id: 'avatar_12', name: 'Ếch', imagePath: '🐸', isEmoji: true, cost: 30 },
    { id: 'avatar_13', name: 'Lợn', imagePath: '🐷', isEmoji: true, cost: 30 },
    { id: 'avatar_14', name: 'Voi', imagePath: '🐘', isEmoji: true, cost: 30 },
    { id: 'avatar_15', name: 'Kỳ lân', imagePath: '🦄', isEmoji: true, cost: 30 },
    { id: 'avatar_16', name: 'Rồng', imagePath: '🐲', isEmoji: true, cost: 30 },
    { id: 'avatar_17', name: 'Robot', imagePath: '🤖', isEmoji: true, cost: 30 },
    { id: 'avatar_18', name: 'Người ngoài hành tinh', imagePath: '👽', isEmoji: true, cost: 30 },
    { id: 'avatar_19', name: 'Sao biển', imagePath: '⭐', isEmoji: true, cost: 30 },
    { id: 'avatar_20', name: 'Cầu vồng', imagePath: '🌈', isEmoji: true, cost: 30 },
];

export const getAllAvatars = (): Avatar[] => {
    return AVATARS;
};

export const getAvatarById = (id: string): Avatar | undefined => {
    return AVATARS.find(a => a.id === id);
};

export const getDefaultAvatarId = (): string => {
    return 'avatar_01'; // Default to puppy
};

export const getAvailableAvatars = (ownedIds: string[]): Avatar[] => {
    return AVATARS.filter(a => !ownedIds.includes(a.id));
};

// Get random avatar not used by existing profiles
export const getRandomUnusedAvatar = (usedAvatarIds: string[]): string => {
    // Filter avatars not already used
    const unusedAvatars = AVATARS.filter(a => !usedAvatarIds.includes(a.id));

    // If all avatars are used, return random from all
    const pool = unusedAvatars.length > 0 ? unusedAvatars : AVATARS;

    // Random select
    const randomIndex = Math.floor(Math.random() * pool.length);
    return pool[randomIndex].id;
};

