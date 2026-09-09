export type RoundKind = 'choice' | 'match' | 'order' | 'typing';
export type Topic = 'mixed' | 'math' | 'observe' | 'words' | 'knowledge';
export type Theme = 'station' | 'garden' | 'stars';
export interface Config {
    grade: number;
    difficulty: 'easy' | 'medium' | 'hard';
    pace: 'calm' | 'challenge';
    topic: Topic;
    mode: 'cup' | RoundKind;
    theme: Theme;
}
export type Visual = {
    kind: 'clock';
    hour: number;
    minute: number;
} | {
    kind: 'shape';
    shape: 'circle' | 'square' | 'triangle' | 'star';
    color: string;
} | {
    kind: 'color';
    color: string;
} | {
    kind: 'groups';
    left: number;
    right: number;
};
export interface Tile {
    id: string;
    text: string;
    visual?: Visual;
}
export interface Board {
    id: string;
    kind: RoundKind;
    prompt: string;
    explanation: string;
    options: Tile[];
    answer: string[];
    left?: Tile[];
    visual?: Visual;
}
export interface RoundResult {
    kind: RoundKind;
    points: number;
    attempts: number;
    firstCorrect: number;
    solved: number;
    elapsedMs: number;
}
export interface Session {
    version: 1;
    id: string;
    studentId: string;
    seed: number;
    config: Config;
    phase: 'ready' | 'playing' | 'review' | 'boardDone' | 'between' | 'finished';
    round: number;
    boardIndex: number;
    rounds: RoundResult[];
    remainingMs: number;
    clockAt: number;
    paused: boolean;
    listening: boolean;
    combo: number;
    bestCombo: number;
    selected: string | null;
    matched: string[];
    order: string[];
    mistakes: string[];
    wrongPairs: string[];
    input: string;
    feedback: string;
    lastCorrect: boolean | null;
    fx: number;
    review: {
        prompt: string;
        answer: string;
    }[];
}
export type Action = {
    type: 'start' | 'next' | 'pause' | 'resume' | 'tick';
} | {
    type: 'listen';
    value: boolean;
} | {
    type: 'answer' | 'select' | 'match' | 'place' | 'input';
    boardId: string;
    value: string;
} | {
    type: 'remove';
    boardId: string;
    index: number;
} | {
    type: 'undo' | 'check';
    boardId: string;
};
export type Event = Action & {
    sessionId: string;
    now: number;
};
export interface ArcadeRecord {
    version: 1;
    config: Config;
    seed: number;
    rounds: RoundResult[];
    accuracy: number;
    bestCombo: number;
    medal: 'bronze' | 'silver' | 'gold' | null;
}
export const ROUND_INFO: Record<RoundKind, {
    name: string;
    verb: string;
    description: string;
}> = {
    choice: { name: 'Chớp đúng', verb: 'Chọn đáp án', description: 'Chạm một đáp án đúng. Mỗi câu đúng thắp sáng thêm một tia năng lượng.' },
    match: { name: 'Nối đúng', verb: 'Ghép từng cặp', description: 'Chạm một thẻ bên trái, rồi chọn thẻ tương ứng bên phải. Cặp đúng được giữ lại.' },
    order: { name: 'Xếp nhanh', verb: 'Sắp xếp thứ tự', description: 'Chạm thẻ để đưa vào các ô theo thứ tự. Có thể hoàn tác trước khi kiểm tra.' },
    typing: { name: 'Gõ chính xác', verb: 'Gõ lại từ', description: 'Gõ đúng cả dấu tiếng Việt. Nhấn Enter hoặc Gửi để trả lời.' },
};
export const THEMES: {
    id: Theme;
    name: string;
    description: string;
}[] = [
    { id: 'station', name: 'Trạm Tia Chớp', description: 'Thắp sáng lõi năng lượng' },
    { id: 'garden', name: 'Vườn Sắc Màu', description: 'Đánh thức khu vườn kỳ diệu' },
    { id: 'stars', name: 'Đài Quan Sát Sao', description: 'Nối sáng những chòm sao' },
];
