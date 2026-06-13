// Dữ liệu số đếm 0–10 (Tiếng Anh – Tiếng Việt) cho mục Mầm non.
// `emoji` được lặp lại `value` lần để bé đếm trực quan.

export interface CountingNumber {
    id: string;     // '0'..'10'
    value: number;  // 0..10
    enName: string; // 'three'
    viName: string; // 'ba'
    emoji: string;  // emoji vật để đếm
}

export const COUNTING_DATA: CountingNumber[] = [
    { id: '0', value: 0, enName: 'zero', viName: 'không', emoji: '⭕' },
    { id: '1', value: 1, enName: 'one', viName: 'một', emoji: '🍎' },
    { id: '2', value: 2, enName: 'two', viName: 'hai', emoji: '🐥' },
    { id: '3', value: 3, enName: 'three', viName: 'ba', emoji: '🐟' },
    { id: '4', value: 4, enName: 'four', viName: 'bốn', emoji: '🌸' },
    { id: '5', value: 5, enName: 'five', viName: 'năm', emoji: '⭐' },
    { id: '6', value: 6, enName: 'six', viName: 'sáu', emoji: '🍓' },
    { id: '7', value: 7, enName: 'seven', viName: 'bảy', emoji: '🚗' },
    { id: '8', value: 8, enName: 'eight', viName: 'tám', emoji: '🐞' },
    { id: '9', value: 9, enName: 'nine', viName: 'chín', emoji: '🦋' },
    { id: '10', value: 10, enName: 'ten', viName: 'mười', emoji: '🎈' },
];
