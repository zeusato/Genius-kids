// Shared utility functions for all generators

// Format number with thousand separators
export const formatNumber = (num: number): string => {
    return num.toLocaleString('en-US');
};

// Capitalize first letter of string
export const capitalize = (str: string): string => {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
};

// Đọc số bằng chữ theo SGK (mốt, lăm, linh, không trăm) — xem services/study/value.ts
export { readNumberVN as numberToVietnamese } from "../study/value";

// Helper to ensure unique options
export const ensureUniqueOptions = (correctAnswer: string, wrongOptions: string[], totalOptions: number = 4): string[] => {
    const uniqueSet = new Set<string>();
    uniqueSet.add(correctAnswer);

    // Add wrong options until we have enough unique ones
    for (const opt of wrongOptions) {
        if (opt !== correctAnswer && !uniqueSet.has(opt)) {
            uniqueSet.add(opt);
            if (uniqueSet.size >= totalOptions) break;
        }
    }

    return Array.from(uniqueSet);
};

// Helper to create options that ALWAYS include correct answer
export const createOptionsWithAnswer = (correctAnswer: string, allOptions: string[]): string[] => {
    // Filter out correctAnswer from pool
    const wrongOptions = allOptions.filter(x => x !== correctAnswer);
    // Shuffle and take 3 wrong options
    const selectedWrong = shuffleArrayLocal(wrongOptions).slice(0, 3);
    // Combine with correctAnswer and shuffle again
    return shuffleArrayLocal([correctAnswer, ...selectedWrong]);
};

// Local shuffle helper
const shuffleArrayLocal = <T,>(array: T[]): T[] => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
};
