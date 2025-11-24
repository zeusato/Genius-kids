// Dragon Quest Game Engine
// Core logic for map generation, dice rolling, buffs, and game mechanics

import { SpeedQuestion, generateSpeedQuestion, SpeedDifficulty } from '../SpeedMath/speedMathEngine';

export type DragonDifficulty = 'easy' | 'medium' | 'hard';

export enum TileType {
    Normal = 'normal',
    Combat = 'combat',
    Buff = 'buff',
    Teleport = 'teleport',
    Boss = 'boss'
}

export enum BuffType {
    HolySword = 'holySword',
    HolyGrail = 'holyGrail',
    FlyingCloak = 'flyingCloak'
}

export interface MapTile {
    id: number;
    type: TileType;
    position: number;
}

export interface PlayerBuffs {
    holySword: number; // 0-2
    holyGrail: number; // 0-3 (affects max HP)
    flyingCloak: boolean;
}

// --- DIALOGUE DATA ---

export const COMBAT_DIALOGUES = [
    "Muốn đi qua đây ư? Trả lời câu hỏi của ta trước đã!",
    "Ngươi nghĩ dễ vượt qua à? Hãy chứng minh đi!",
    "Trả lời sai là ta ăn thịt ngươi đó nhé!",
    "Hừ! Xem nào, ngươi có thông minh không?",
    "Ta sẽ chặn đường ngươi tại đây!"
];

export const BUFF_DIALOGUES = [
    "Nếu ngươi trả lời đúng, ta sẽ ban cho ngươi một điều ước.",
    "Hãy chứng tỏ bản lĩnh, phần thưởng đang chờ!",
    "Một câu hỏi nhỏ, phần thưởng lớn.",
    "Ngươi muốn sức mạnh? Trả lời câu hỏi này đi!",
    "Ta thấy ngươi có duyên, hãy nhận phép thuật của ta!"
];

export const BOSS_DIALOGUES = [
    "Ngươi thật to gan khi dám đến đây!",
    "Ta sẽ thiêu rụi ngươi bằng ngọn lửa tri thức!",
    "Muốn đánh bại ta? Trả lời hết câu hỏi này đi!",
    "Sai một câu thôi… và ngươi sẽ cháy thành tro!",
    "Cuối cùng ngươi cũng tới! Chuẩn bị chiến đấu!",
    "Đây là trận chiến cuối cùng của ngươi!"
];

// --- CORE FUNCTIONS ---

/**
 * Generate random game map with 40-50 tiles
 */
export const generateMap = (): MapTile[] => {
    const mapLength = 50; // 40-50 tiles
    const tiles: MapTile[] = [];

    // Calculate how many of each type (excluding boss)
    const tilesExcludingBoss = mapLength - 1;
    const combatCount = Math.floor(tilesExcludingBoss * 0.4); // 40%
    const buffCount = Math.floor(tilesExcludingBoss * 0.2); // 20%
    const teleportCount = Math.floor(tilesExcludingBoss * 0.15); // 15%
    // Rest are normal tiles

    // Create array of tile types
    const tileTypes: TileType[] = [];

    // Add combat tiles
    for (let i = 0; i < combatCount; i++) {
        tileTypes.push(TileType.Combat);
    }

    // Add buff tiles
    for (let i = 0; i < buffCount; i++) {
        tileTypes.push(TileType.Buff);
    }

    // Add teleport tiles
    for (let i = 0; i < teleportCount; i++) {
        tileTypes.push(TileType.Teleport);
    }

    // Fill rest with normal tiles
    while (tileTypes.length < tilesExcludingBoss) {
        tileTypes.push(TileType.Normal);
    }

    // Shuffle tile types
    for (let i = tileTypes.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tileTypes[i], tileTypes[j]] = [tileTypes[j], tileTypes[i]];
    }

    // Create tile objects
    for (let i = 0; i < tilesExcludingBoss; i++) {
        tiles.push({
            id: i,
            type: tileTypes[i],
            position: i
        });
    }

    // Add boss tile at the end
    tiles.push({
        id: mapLength - 1,
        type: TileType.Boss,
        position: mapLength - 1
    });

    return tiles;
};

/**
 * Roll dice - return 1-6
 */
export const rollDice = (): number => {
    return Math.floor(Math.random() * 6) + 1;
};

/**
 * Calculate teleport distance and new position
 */
export const calculateTeleport = (currentPos: number, mapLength: number): {
    distance: number;
    newPosition: number;
    isBackward: boolean;
} => {
    const distance = Math.floor(Math.random() * 17) - 8; // -8 to +8
    const newPosition = Math.max(0, Math.min(currentPos + distance, mapLength - 1));

    return {
        distance,
        newPosition,
        isBackward: distance < 0
    };
};

/**
 * Get random buff type
 */
export const getRandomBuff = (): BuffType => {
    const buffs = [BuffType.HolySword, BuffType.HolyGrail, BuffType.FlyingCloak];
    return buffs[Math.floor(Math.random() * buffs.length)];
};

/**
 * Calculate number of boss questions based on holy swords owned
 */
export const calculateBossQuestions = (holySwords: number): number => {
    return Math.max(3, 5 - holySwords);
};

/**
 * Get random dialogue from array
 */
export const getRandomDialogue = (dialogues: string[]): string => {
    return dialogues[Math.floor(Math.random() * dialogues.length)];
};

/**
 * Generate question for given difficulty
 */
export const generateQuestion = (difficulty: DragonDifficulty): SpeedQuestion => {
    return generateSpeedQuestion(difficulty as SpeedDifficulty);
};

/**
 * Get buff name in Vietnamese
 */
export const getBuffName = (buff: BuffType): string => {
    switch (buff) {
        case BuffType.HolySword:
            return 'Kiếm Thánh';
        case BuffType.HolyGrail:
            return 'Chén Thánh';
        case BuffType.FlyingCloak:
            return 'Áo Choàng Bay';
    }
};

/**
 * Get buff description
 */
export const getBuffDescription = (buff: BuffType): string => {
    switch (buff) {
        case BuffType.HolySword:
            return 'Giảm số câu hỏi khi đánh boss (Tối đa 2)';
        case BuffType.HolyGrail:
            return 'Tăng 1 mạng (+1 HP)';
        case BuffType.FlyingCloak:
            return 'Miễn nhiễm dịch chuyển lùi';
    }
};

/**
 * Get buff icon
 */
export const getBuffIcon = (buff: BuffType): string => {
    switch (buff) {
        case BuffType.HolySword:
            return '🗡️';
        case BuffType.HolyGrail:
            return '🏆';
        case BuffType.FlyingCloak:
            return '🦸‍♂️';
    }
};
