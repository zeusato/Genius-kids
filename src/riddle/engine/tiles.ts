import type { Riddle } from '../content/types';
import { clean } from './normalize';

const CLASSIFIER = new Set(['con', 'cái', 'chiếc', 'quả', 'trái', 'cây', 'củ', 'hoa', 'bông', 'đôi', 'tấm', 'viên', 'ngọn', 'cục', 'tờ', 'quyển', 'cuốn', 'bức']);

export interface Tile { id: string; text: string }
export interface TilePuzzle {
    /** Phần điền sẵn (từ chỉ loại) hiển thị trước các ô trống. */
    prefix: string;
    /** Số ô trống theo từng nhóm (EN: theo từ; VI: mỗi tiếng một ô). */
    slots: number;
    /** Lời giải theo thứ tự ô. */
    solution: string[];
    /** Khoảng trắng hiển thị: index ô mà trước nó có khoảng cách từ (EN nhiều từ). */
    gaps: number[];
    tiles: Tile[];
    joiner: '' | ' ';
}

type Rng = () => number;
function shuffle<T>(list: T[], rng: Rng): T[] {
    const a = [...list];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
}

/** Cắt từ tiếng Anh dài thành cụm 2–3 chữ để ghép không quá nhiều ô. */
function chunkWord(word: string, force = false): string[] {
    if (word.length <= 7 && !force) return [...word];
    const parts: string[] = [];
    for (let i = 0; i < word.length;) { const n = word.length - i === 4 ? 2 : Math.min(3, word.length - i); parts.push(word.slice(i, i + n)); i += n; }
    return parts;
}

export function makeTiles(riddle: Riddle, rng: Rng = Math.random): TilePuzzle {
    const answer = riddle.answer.normalize('NFC').trim();
    if (riddle.lang === 'en') {
        const words = answer.toUpperCase().replace(/[^A-Z ]/g, '').split(/\s+/).filter(Boolean);
        const solution: string[] = [], gaps: number[] = [];
        const letters = words.join('').length;
        // Câu trả lời dài: từ ngắn thành một ô, từ dài cắt cụm, để không quá nhiều ô.
        words.forEach((w, i) => {
            if (i) gaps.push(solution.length);
            solution.push(...(letters <= 8 ? chunkWord(w) : w.length <= 4 ? [w] : chunkWord(w, true)));
        });
        const pool = 'ABCDEFGHIJKLMNOPRSTUWY';
        const decoys: string[] = [];
        const want = solution.length <= 4 ? 2 : 3;
        while (decoys.length < want) {
            const d = solution.some(s => s.length > 1)
                ? pool[Math.floor(rng() * pool.length)] + pool[Math.floor(rng() * pool.length)]
                : pool[Math.floor(rng() * pool.length)];
            if (!solution.includes(d) && !decoys.includes(d)) decoys.push(d);
        }
        return { prefix: '', slots: solution.length, solution, gaps, joiner: '', tiles: shuffle([...solution, ...decoys].map((text, i) => ({ id: `t${i}`, text })), rng) };
    }
    const words = clean(answer).split(' ');
    // Giữ hoa thường như đáp án hiển thị.
    const shown = answer.replace(/\s+/g, ' ').split(' ');
    let start = 0;
    while (start < words.length - 1 && CLASSIFIER.has(words[start])) start++;
    const prefix = shown.slice(0, start).join(' ');
    // Tên riêng (cổng Đất Việt) giữ hoa; còn lại viết thường như trong câu.
    const solution = shown.slice(start).map(w => riddle.gate === 'vietnam' ? w : w.toLowerCase());
    const taken = new Set(solution);
    const decoys: string[] = [];
    for (const c of shuffle(riddle.choices, rng)) {
        for (const w of clean(c.text).split(' ')) if (!CLASSIFIER.has(w) && !taken.has(w) && !decoys.includes(w)) decoys.push(w);
    }
    const want = solution.length === 1 ? 3 : 2;
    const picked = shuffle(decoys, rng).slice(0, want);
    return { prefix, slots: solution.length, solution, gaps: [], joiner: ' ', tiles: shuffle([...solution, ...picked].map((text, i) => ({ id: `t${i}`, text })), rng) };
}

export const tilesAnswer = (p: TilePuzzle, placed: (Tile | null)[]) =>
    [p.prefix, placed.map((t, i) => (p.gaps.includes(i) ? ' ' : '') + (t?.text ?? '')).join(p.joiner)].filter(Boolean).join(' ');
