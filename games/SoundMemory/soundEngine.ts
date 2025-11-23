import { soundManager } from '../../utils/sound';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface GameConfig {
    gridSize: number; // 4 (2x2), 6 (2x3), 9 (3x3)
    sequenceLength: { min: number; max: number };
    sameColor: boolean;
    totalQuestions: number;
}

export const DIFFICULTY_CONFIG: Record<Difficulty, GameConfig> = {
    easy: {
        gridSize: 4,
        sequenceLength: { min: 3, max: 5 },
        sameColor: false,
        totalQuestions: 5
    },
    medium: {
        gridSize: 6,
        sequenceLength: { min: 4, max: 6 },
        sameColor: false,
        totalQuestions: 8
    },
    hard: {
        gridSize: 9,
        sequenceLength: { min: 5, max: 10 },
        sameColor: true,
        totalQuestions: 10
    }
};

// C Major Scale frequencies
export const BUTTON_FREQUENCIES = [
    261.63, // C4
    293.66, // D4
    329.63, // E4
    349.23, // F4
    392.00, // G4
    440.00, // A4
    493.88, // B4
    523.25, // C5
    587.33  // D5
];

export const BUTTON_COLORS = [
    'bg-red-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-teal-500',
    'bg-orange-500',
    'bg-indigo-500'
];

export const generateSequence = (length: number, gridSize: number): number[] => {
    return Array.from({ length }, () => Math.floor(Math.random() * gridSize));
};

export const playNote = (index: number) => {
    const freq = BUTTON_FREQUENCIES[index % BUTTON_FREQUENCIES.length];
    soundManager.playNote(freq, 0.4);
};
