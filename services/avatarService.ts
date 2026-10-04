import { Avatar } from '../types';

// Keep IDs and prices stable: existing selections and purchases use these IDs.
// Explorer portraits replace both the original images and the emoji avatars.
const AVATARS: Avatar[] = [
    { id: 'avatar_01', name: 'Chó con' },
    { id: 'avatar_02', name: 'Mèo con' },
    { id: 'avatar_03', name: 'Gấu trúc' },
    { id: 'avatar_04', name: 'Thỏ' },
    { id: 'avatar_05', name: 'Gấu' },
    { id: 'avatar_06', name: 'Cáo' },
    { id: 'avatar_07', name: 'Sư tử' },
    { id: 'avatar_08', name: 'Chim cánh cụt' },
    { id: 'avatar_09', name: 'Gấu túi' },
    { id: 'avatar_10', name: 'Cú mèo' },
    { id: 'avatar_11', name: 'Khỉ' },
    { id: 'avatar_12', name: 'Ếch' },
    { id: 'avatar_13', name: 'Lợn' },
    { id: 'avatar_14', name: 'Voi' },
    { id: 'avatar_15', name: 'Kỳ lân' },
    { id: 'avatar_16', name: 'Rồng' },
    { id: 'avatar_17', name: 'Robot' },
    { id: 'avatar_18', name: 'Người ngoài hành tinh' },
    { id: 'avatar_19', name: 'Sao biển' },
    { id: 'avatar_20', name: 'Cầu vồng' },
].map(avatar => ({
    ...avatar,
    imagePath: `${import.meta.env.BASE_URL}avatars/explorers/${avatar.id}.webp`,
    isEmoji: false,
    cost: 30,
}));

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

