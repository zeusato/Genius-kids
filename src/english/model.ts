import type { Sentence, Pos, RoleSpan, Level, Vocab, Passage, Rewrite, Phrase } from "../data/english/schema";
import type { AlbumImage } from "../../types";

export const SKILLS = [
  "be-affirmative",
  "be-negative",
  "be-question",
  "be-short-answer",
  "demonstratives",
] as const;
export type Skill = string;
export const SKILL_NAMES: Record<Skill, string> = {
  "be-affirmative": "Câu khẳng định",
  "be-negative": "Câu phủ định",
  "be-question": "Câu hỏi",
  "be-short-answer": "Trả lời ngắn",
  demonstratives: "This, that, these, those",
};
export type ExerciseKind = "fill" | "order" | "pos" | "roles" | "conjugate";
export type ActivityKind = ExerciseKind | 'meaning' | 'spelling' | 'picture' | 'listen' | 'reading' | 'rewrite' | 'phrase' | 'letter';
export type Answer = string | number[];
export interface SentenceExercise {
  id: string;
  kind: ExerciseKind;
  skill: Skill;
  sentence: Sentence;
  target: number; // blank, token or roleSpan index, depending on kind
  shuffledIndices: number[];
}
export interface OtherExercise {
  id: string; kind: Exclude<ActivityKind, ExerciseKind>; skill: string;
  level: Level; sourceId: string; source: 'seed' | 'ai';
  prompt: string; answer: string; alternatives: string[]; options: string[];
  explanation: string; hint: string; audio?: string; letters?: string[];
  vocab?: Vocab; passage?: Passage; rewrite?: Rewrite; phrase?: Phrase;
}
export type Exercise = SentenceExercise | OtherExercise;
export const isSentenceExercise = (e: Exercise): e is SentenceExercise => 'sentence' in e;
export const sourceId = (e: Exercise) => isSentenceExercise(e) ? e.sentence.id : e.sourceId;
export const exerciseLevel = (e: Exercise): Level => isSentenceExercise(e) ? e.sentence.level : e.level;
export interface Response {
  answer: Answer;
  firstAnswer?: Answer;
  firstCorrect?: boolean;
  correct?: boolean;
  hints: number;
  attempts: number;
}
export interface EnglishSession {
  schemaVersion: 1;
  id: string;
  studentId: string;
  contentVersion: string;
  level: Level;
  levels?: Level[];
  mode: "practice" | "test" | "review" | "placement";
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
  elapsedSeconds: number;
  status: "draft" | "submitted" | "completed";
  exercises: Exercise[];
  responses: Record<string, Response>;
  cursor: number;
  revision: number;
  rewardDraw?: AlbumImage | null;
  result?: SessionSummary;
}
export interface SessionSummary {
  id: string;
  level: Level;
  mode: EnglishSession['mode'];
  date: string;
  score: number;
  total: number;
  seconds: number;
  stars: number;
  image?: AlbumImage | null;
  rewardLimited: boolean;
}
export interface SkillProgress {
  attempts: number;
  firstTryCorrect: number;
  lastAttemptAt: string;
  lastWrongAt?: string;
  reviewStep: number;
  nextReviewAt?: string;
}
export interface ExamEvidence {
  id: string;
  score: number;
  total: number;
  date: string;
  sourceIds: string[];
  skills: string[];
}
export interface EnglishProgress {
  schemaVersion: 1;
  selectedLevel: Level;
  skills: Partial<Record<Skill, SkillProgress>>;
  masteryByLevel: Partial<
    Record<Level, { mastered: boolean; updatedAt: string }>
  >;
  qualifyingExams: Partial<Record<Level, ExamEvidence[]>>;
  recentSessions: SessionSummary[];
  reviewItems: { sourceId: string; skill: Skill; nextReviewAt: string; level?: Level; step?: number; exercise?: Exercise }[];
  ledger: Record<string, SessionSummary>;
  minimumAcceptedStartedAt: string;
}
export const POS_NAMES: Record<Pos, string> = {
  pronoun: "Đại từ",
  noun: "Danh từ",
  verb: "Động từ",
  adjective: "Tính từ",
  adverb: "Trạng từ",
  article: "Mạo từ",
  preposition: "Giới từ",
  conjunction: "Liên từ",
  determiner: "Từ hạn định",
  numeral: "Số từ",
  punct: "Dấu câu",
  interjection: "Thán từ",
  particle: "Tiểu từ",
};
export const ROLE_NAMES: Record<RoleSpan["role"], string> = {
  subject: "Chủ ngữ",
  verb: "Cụm động từ",
  object: "Tân ngữ",
  complement: "Bổ ngữ",
  adverbial: "Trạng ngữ",
};
export function emptyProgress(): EnglishProgress {
  return {
    schemaVersion: 1,
    selectedLevel: "A1",
    skills: {},
    masteryByLevel: {},
    qualifyingExams: {},
    recentSessions: [],
    reviewItems: [],
    ledger: {},
    minimumAcceptedStartedAt: "1970-01-01T00:00:00.000Z",
  };
}
