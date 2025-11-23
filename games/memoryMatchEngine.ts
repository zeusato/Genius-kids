/**
 * Memory Match Game Engine - Image/Shape Matching
 * Generate pairs of images/shapes for memory matching game
 */

export interface MemoryCard {
    id: string;
    value: string; // Emoji or shape identifier
    type: 'emoji' | 'shape';
    pairId: number;
    isFlipped: boolean;
    isMatched: boolean;
}

export interface MemoryGameState {
    cards: MemoryCard[];
    flippedCards: string[];
    matchedPairs: number;
    moves: number;
    startTime: number;
    isChecking: boolean;
}

// Difficulty levels
export enum Difficulty {
    Easy = 12,    // 6 pairs
    Medium = 20,  // 10 pairs
    Hard = 30     // 15 pairs
}

// Rich emoji collections for kids
const EMOJI_SETS = {
    animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵'],
    fruits: ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍑', '🍒', '🍍', '🥝', '🥭', '🍐', '🍈', '🥥'],
    food: ['🍕', '🍔', '🍟', '🌭', '🍿', '🧁', '🍩', '🍪', '🎂', '🍰', '🧀', '🍖', '🥐', '🥨', '🥯'],
    sports: ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🥊', '🥋', '⛳', '🏹', '🎿'],
    vehicles: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🚚', '🚛', '🚜', '✈️', '🚁'],
    nature: ['🌸', '🌺', '🌻', '🌷', '🌹', '🌼', '🌿', '☀️', '⭐', '🌙', '☁️', '🌈', '⚡', '❄️', '🔥'],
    sea: ['🐠', '🐟', '🐡', '🦈', '🐙', '🦀', '🦞', '🐚', '🐬', '🐳', '🦑', '🐋', '🦭', '🦦', '🐊']
};

// CSS shapes that we'll draw
export const SHAPE_DEFINITIONS = [
    'circle', 'square', 'triangle', 'diamond', 'star', 'heart',
    'pentagon', 'hexagon', 'oval', 'cross'
];

/**
 * Fisher-Yates shuffle algorithm
 */
function shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Select unique emojis from available sets
 */
function selectUniqueEmojis(count: number): string[] {
    // Combine all emoji sets
    const allEmojis = Object.values(EMOJI_SETS).flat();

    // Shuffle and take unique emojis
    const shuffled = shuffle(allEmojis);
    return shuffled.slice(0, count);
}

/**
 * Select unique shapes
 */
function selectUniqueShapes(count: number): string[] {
    const shuffled = shuffle([...SHAPE_DEFINITIONS]);
    return shuffled.slice(0, Math.min(count, SHAPE_DEFINITIONS.length));
}

/**
 * Generate memory card pairs with emojis and shapes
 */
export function generateMemoryCards(difficulty: Difficulty): MemoryCard[] {
    const numPairs = difficulty / 2;
    const cards: MemoryCard[] = [];

    // Mix of emojis and shapes
    const numEmojis = Math.ceil(numPairs * 0.7); // 70% emojis
    const numShapes = numPairs - numEmojis;     // 30% shapes

    const selectedEmojis = selectUniqueEmojis(numEmojis);
    const selectedShapes = selectUniqueShapes(numShapes);

    // Create emoji pairs
    selectedEmojis.forEach((emoji, index) => {
        const pairId = index;

        // Two identical cards for this emoji
        cards.push({
            id: `${pairId}-1`,
            value: emoji,
            type: 'emoji',
            pairId,
            isFlipped: false,
            isMatched: false
        });

        cards.push({
            id: `${pairId}-2`,
            value: emoji,
            type: 'emoji',
            pairId,
            isFlipped: false,
            isMatched: false
        });
    });

    // Create shape pairs
    selectedShapes.forEach((shape, index) => {
        const pairId = numEmojis + index;

        // Two identical cards for this shape
        cards.push({
            id: `${pairId}-1`,
            value: shape,
            type: 'shape',
            pairId,
            isFlipped: false,
            isMatched: false
        });

        cards.push({
            id: `${pairId}-2`,
            value: shape,
            type: 'shape',
            pairId,
            isFlipped: false,
            isMatched: false
        });
    });

    return shuffle(cards);
}

/**
 * Check if two cards are a match
 */
export function checkMatch(card1: MemoryCard, card2: MemoryCard): boolean {
    return card1.pairId === card2.pairId;
}

/**
 * Get medal based on performance
 */
export function getMedal(moves: number, totalPairs: number, timeSeconds: number): {
    type: 'gold' | 'silver' | 'bronze' | null;
    message: string;
} {
    // Medal calculation based ONLY on moves efficiency
    // Gold: moves <= totalPairs * 1.2
    // Silver: moves <= totalPairs * 1.5
    // Bronze: moves > totalPairs * 1.5

    if (moves <= totalPairs * 1.2) {
        return { type: 'gold', message: 'Xuất sắc! Trí nhớ siêu đẳng!' };
    }

    if (moves <= totalPairs * 1.5) {
        return { type: 'silver', message: 'Tuyệt vời! Rất tốt!' };
    }

    return { type: 'bronze', message: 'Giỏi lắm! Tiếp tục cố gắng!' };
}

