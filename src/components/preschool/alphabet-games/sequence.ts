import { LETTER_IDS, WORDS_BY_LETTER } from './content';
import type { AlphabetLevel, AlphabetWord } from './types';

export type Random = () => number;
export function mulberry32(seed: number): Random { let value = seed >>> 0; return () => { value += 0x6D2B79F5; let t = value; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export function shuffle<T>(items: readonly T[], rng: Random): T[] { const out = [...items]; for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; } return out; }
export function letterOrder(seed: number, total = 6, fixed?: string): string[] { if (fixed && LETTER_IDS.includes(fixed)) return Array.from({ length: total }, () => fixed); return shuffle(LETTER_IDS, mulberry32(seed)).slice(0, total); }

export interface WordRound { id: string; letterId: string; mode: 'one' | 'many' | 'odd'; options: AlphabetWord[]; correctIds: string[] }
export function buildWordRounds(seed: number, level: AlphabetLevel, fixed?: string): WordRound[] {
    const rng = mulberry32(seed), letters = letterOrder(seed, 6, fixed);
    return letters.map((letterId, index) => {
        const own = shuffle(WORDS_BY_LETTER[letterId], rng), enough = own.length > 1;
        const mode = level === 'challenge' && enough ? (index % 2 ? 'odd' : 'many') : level === 'practice' && enough ? 'many' : 'one';
        const count = mode === 'many' ? Math.min(index % 3 === 0 ? 3 : 2, own.length) : mode === 'odd' ? 2 : 1;
        const correct = own.slice(0, count), others = shuffle(Object.values(WORDS_BY_LETTER).flat().filter(w => w.letterId !== letterId), rng);
        if (mode === 'odd') { const odd = others[0]; return { id: `word-${seed}-${index}`, letterId, mode, options: shuffle([...correct, odd], rng), correctIds: [odd.id] }; }
        const size = level === 'intro' ? 3 : level === 'practice' ? 4 : 5;
        return { id: `word-${seed}-${index}`, letterId, mode, options: shuffle([...correct, ...others.slice(0, size - correct.length)], rng), correctIds: correct.map(w => w.id) };
    });
}
export interface MatchBoard { id: string; letterIds: string[] }
export function buildMatchBoards(seed: number, level: AlphabetLevel, fixed?: string): MatchBoard[] {
    const size = level === 'intro' ? 3 : level === 'practice' ? 4 : 5, rng = mulberry32(seed);
    const pool = fixed ? [fixed, ...shuffle(LETTER_IDS.filter(id => id !== fixed), rng)] : shuffle(LETTER_IDS, rng); while (pool.length < size * 2) pool.push(...shuffle(LETTER_IDS, rng));
    return [0, 1].map(index => ({ id: `match-${seed}-${index}`, letterIds: pool.slice(index * size, index * size + size) }));
}
export interface ListenRound { id: string; letterId: string; options: string[]; letterCase: 'upper' | 'lower' }
export function buildListenRounds(seed: number, level: AlphabetLevel, fixed?: string): ListenRound[] {
    const rng = mulberry32(seed), count = level === 'intro' ? 2 : level === 'practice' ? 3 : 4;
    return letterOrder(seed, 6, fixed).map((letterId, index) => ({ id: `pick-${seed}-${index}`, letterId, options: shuffle([letterId, ...shuffle(LETTER_IDS.filter(id => id !== letterId), rng).slice(0, count - 1)], rng), letterCase: level === 'intro' ? 'upper' : level === 'practice' ? 'lower' : index % 2 ? 'lower' : 'upper' }));
}
