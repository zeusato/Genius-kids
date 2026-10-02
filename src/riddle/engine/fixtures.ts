import type { GateId, Riddle, RiddleLevel } from '../content/types';

export function fx(id: string, over: Partial<Riddle> = {}): Riddle {
    return {
        id, lang: 'vi', kind: 'object', gate: 'animals', level: 1,
        text: 'Con gì mào đỏ\nGáy ó o o?', answer: 'Con gà trống', accept: ['gà trống'], close: ['gà', 'gà mái'],
        hints: ['Đây là một con vật nuôi.', 'Nó gáy vào buổi sáng.'],
        choices: [{ text: 'Con vịt', emoji: '🦆' }, { text: 'Con gà mái', emoji: '🐔' }, { text: 'Con chim sẻ', emoji: '🐦' }],
        emoji: '🐓', clues: [{ quote: 'mào đỏ', means: 'Gà trống có mào đỏ.' }], explain: 'Gà trống có mào đỏ và gáy buổi sáng.', source: 'dân gian',
        ...over,
    };
}

/** Kho giả: mỗi cổng n câu, mức xoay vòng 1–3, đáp án khác nhau. */
export function pool(gates: GateId[], n: number): Riddle[] {
    return gates.flatMap(g => Array.from({ length: n }, (_, i) => fx(`${g}-${i}`, {
        gate: g, lang: g === 'world' ? 'en' : 'vi', level: ((i % 3) + 1) as RiddleLevel, answer: `Đáp án ${g} ${i}`, accept: [],
    })));
}

export function seeded(seed = 7) {
    let s = seed >>> 0;
    return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; };
}
