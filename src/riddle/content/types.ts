// Hợp đồng dữ liệu câu đố v2 (docs/riddle-remake-plan.md mục 5.1; quy chuẩn soạn: scripts/riddle-validate.mjs).
export type RiddleLang = 'vi' | 'en';
export type RiddleKind = 'object' | 'wordplay' | 'logic' | 'math';
export type GateId = 'animals' | 'plants' | 'objects' | 'nature' | 'vietnam' | 'words' | 'tricks' | 'world';
export type RiddleLevel = 1 | 2 | 3;

export interface RiddleChoice { text: string; emoji?: string }
export interface RiddleClue { quote: string; means: string }

export interface Riddle {
    id: string;
    lang: RiddleLang;
    kind: RiddleKind;
    gate: GateId;
    level: RiddleLevel;
    text: string;
    answer: string;
    accept: string[];
    close?: string[];
    hints: [string, string];
    choices: [RiddleChoice, RiddleChoice, RiddleChoice];
    emoji?: string;
    clues: RiddleClue[];
    explain: string;
    /** Bản dịch câu đố (câu tiếng Anh). */
    vi?: string;
    /** Nghĩa tiếng Việt của đáp án (câu tiếng Anh). */
    answerVi?: string;
    source: 'dân gian' | 'sưu tầm' | 'biên soạn';
}

export type AnswerMode = 'choice' | 'tiles' | 'type';
