export type AlphabetActivity = 'word' | 'match' | 'pick';
export type AlphabetLevel = 'intro' | 'practice' | 'challenge';

export interface AlphabetWord { id: string; letterId: string; wordEn: string; wordVi: string; art: string }
export interface AlphabetOutcome { roundId: string; letterId: string; correct: boolean; firstTry: boolean; assisted: boolean }
export interface AlphabetSession {
    version: 1; id: string; ownerId: string; activity: AlphabetActivity; level: AlphabetLevel; seed: number;
    startedAt: string; seconds: number; total: number; outcomes: AlphabetOutcome[]; phase: 'playing' | 'complete';
}
export interface AlphabetPracticeRecord { version: 1; activity: AlphabetActivity; level: AlphabetLevel; assisted: number }
export const LEVELS: { id: AlphabetLevel; title: string; caption: string }[] = [
    { id: 'intro', title: 'Làm quen', caption: 'Ít lựa chọn, có Cáo hướng dẫn' },
    { id: 'practice', title: 'Tự thử', caption: 'Nhiều lựa chọn hơn một chút' },
    { id: 'challenge', title: 'Thử thách', caption: 'Câu hỏi phong phú và dễ nhầm' },
];
