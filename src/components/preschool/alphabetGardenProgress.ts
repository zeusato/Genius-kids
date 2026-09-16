import { TRACE_LETTERS, traceFinished, type TraceState } from './letterTracingModel';

export interface AlphabetGardenProgress {
    explored: string[];
    matched: string[];
    traced: string[];
    stickers: string[];
}

const validLetter = (id: unknown): id is string => typeof id === 'string' && /^[a-z]$/.test(id);
const letterIds = (value: unknown): string[] => Array.isArray(value) ? [...new Set(value.filter(validLetter))] : [];

export function readGardenProgress(value: unknown): AlphabetGardenProgress {
    const data = value && typeof value === 'object' ? value as Partial<AlphabetGardenProgress> : {};
    const explored = letterIds(data.explored);
    const stickers = letterIds(data.stickers).filter(id => explored.includes(id));
    // Keep stickers earned before tracing was introduced. They prove a match, not a traced letter.
    const matched = [...new Set([...letterIds(data.matched), ...stickers])].filter(id => explored.includes(id));
    return { explored, matched, traced: letterIds(data.traced).filter(id => matched.includes(id)), stickers };
}

export function exploreGardenLetter(value: unknown, id: string): AlphabetGardenProgress {
    const progress = readGardenProgress(value);
    if (validLetter(id) && !progress.explored.includes(id)) progress.explored.push(id);
    return progress;
}

/** Matching opens the writing page; it no longer awards a new sticker on its own. */
export function answerGardenLetter(value: unknown, id: string, answer: string): AlphabetGardenProgress {
    const progress = readGardenProgress(value);
    if (validLetter(id) && id === answer && progress.explored.includes(id) && !progress.matched.includes(id)) {
        progress.matched.push(id);
    }
    return progress;
}

export function finishGardenTracing(value: unknown, id: string, state: TraceState): AlphabetGardenProgress {
    const progress = readGardenProgress(value);
    if (!validLetter(id) || !progress.matched.includes(id) || !traceFinished(TRACE_LETTERS[id], state)) return progress;
    if (!progress.traced.includes(id)) progress.traced.push(id);
    if (!progress.stickers.includes(id)) progress.stickers.push(id);
    return progress;
}

export const gardenComplete = (value: unknown) => readGardenProgress(value).stickers.length === 26;
