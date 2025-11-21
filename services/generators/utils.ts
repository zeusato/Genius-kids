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

// Format number to Vietnamese words with commas
export const numberToVietnamese = (num: number): string => {
    if (num === 0) return 'không';

    const ones = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
    const tens = ['', 'mười', 'hai mươi', 'ba mươi', 'bốn mươi', 'năm mươi', 'sáu mươi', 'bảy mươi', 'tám mươi', 'chín mươi'];

    const readGroup = (n: number): string => {
        if (n === 0) return '';
        const h = Math.floor(n / 100);
        const t = Math.floor((n % 100) / 10);
        const u = n % 10;

        let result = h > 0 ? ones[h] + ' trăm' : '';
        if (t > 0) {
            result += (result ? ' ' : '') + (t === 1 ? 'mười' : ones[t] + ' mươi');
        }
        if (u > 0) {
            if (t === 0 && h > 0) result += ' lẻ';
            result += (result && !result.endsWith('lẻ') ? ' ' : result.endsWith('lẻ') ? ' ' : '') + ones[u];
        }
        return result.trim();
    };

    const billions = Math.floor(num / 1000000000);
    const millions = Math.floor((num % 1000000000) / 1000000);
    const thousands = Math.floor((num % 1000000) / 1000);
    const units = num % 1000;

    let result = '';
    if (billions > 0) result += readGroup(billions) + ' tỷ';
    if (millions > 0) result += (result ? ', ' : '') + readGroup(millions) + ' triệu';
    if (thousands > 0) result += (result ? ', ' : '') + readGroup(thousands) + ' nghìn';
    if (units > 0) result += (result ? ', ' : '') + readGroup(units);

    return result.trim();
};

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
