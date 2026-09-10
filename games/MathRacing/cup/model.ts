export type Difficulty = 'easy' | 'medium' | 'hard';
export type Pace = 'relaxed' | 'normal' | 'fast';
export type Region = 'valley' | 'coast' | 'city';
export type Mode = 'campaign' | 'quick' | 'practice';
export interface Config {
    grade: number; difficulty: Difficulty; pace: Pace; region: Region;
    mission: number; mode: Mode; kart: number; waitForChoice: boolean; autoNitro: boolean; review?: number[];
}
export type AnswerValue = string | number;
export interface Question { id: number; text: string; answer: AnswerValue; options: AnswerValue[]; explanation: string; kind: string; a?: number; b?: number; op?: string; extra?: number; readBonus?: number; source?: { topic: string; seed: number; variant: 'original' | 'missing' } }
export interface GateRush { question: number; lane: number; from: number; startedAt: number; duration: number }
export interface RivalThought { question: number; lane: number; delay: number; startedAt: number }
export interface Racer { distance: number; lane: number; target: number; energy: number; boost: number; penalty: number; answered: number; finishAt: number | null; combo: number; thought?: RivalThought; answerRush?: GateRush }
export interface Obstacle { id: number; at: number; lane: number; type: 'cone' | 'energy'; hit: boolean }
export interface Answer { question: number; selected: AnswerValue; correct: boolean }
export interface Session {
    version: 2; questionVersion?: 2; lengthVersion?: 2; id: string; studentId: string; seed: number; config: Config;
    phase: 'ready' | 'racing' | 'finished'; paused: boolean; elapsed: number;
    racers: Racer[]; questions: Question[]; objects: Obstacle[]; answers: Answer[];
    selected: boolean; queuedBoost: boolean; collisions: number; nitros: number; bestCombo: number;
    answerRush?: GateRush;
    fx: number; feedback: string; feedbackUntil: number; lastCorrect: boolean | null;
}
export interface RacingRecord { version: 2; questionVersion?: 2; config: Config; seed: number; accuracy: number; correct: number; total: number; rank: number; bestCombo: number; collisions: number; nitros: number; stars: number; review: Question[] }
export interface RacingProgress { version: 2; missions: Record<string, number> }
export const LEVELS = [{ id: 'easy', name: 'Dễ', caption: 'Làm quen' }, { id: 'medium', name: 'Trung bình', caption: 'Vững vàng' }, { id: 'hard', name: 'Khó', caption: 'Thử sức' }] as const;
export const PACES = [{ id: 'relaxed', name: 'Thư thả', speed: 23, seconds: 10 }, { id: 'normal', name: 'Vừa sức', speed: 28, seconds: 8 }, { id: 'fast', name: 'Thần tốc', speed: 34, seconds: 6 }] as const;
export const REGIONS = [
    { id: 'valley', name: 'Thung Lũng Chong Chóng', short: 'Thung lũng', tag: 'Nắng vàng · Đồng cỏ · Cối gió', color: '#d4ebc7', ink: '#295f52' },
    { id: 'coast', name: 'Vịnh San Hô', short: 'Vịnh san hô', tag: 'Biển xanh · Cầu gỗ · Hải đăng', color: '#ccecf1', ink: '#256078' },
    { id: 'city', name: 'Thành Phố Sao Băng', short: 'Thành phố', tag: 'Hoàng hôn · Mái vòm · Đường trên cao', color: '#e4d6f0', ink: '#605078' },
] as const;
const names = ['Vạch xuất phát', 'Năng lượng đầu tiên', 'Tay lái khéo léo', 'Cúp thung lũng', 'Gió biển gọi tên', 'Bứt tốc qua cầu', 'Vòng cua san hô', 'Cúp hải đăng', 'Ánh đèn đầu tiên', 'Chuỗi sao tỏa sáng', 'Đường đến vinh quang', 'Cúp Sao Băng'];
const missionLengths = [12, 14, 16, 18, 16, 18, 20, 22, 20, 22, 24, 24];
export const MAX_QUESTIONS = 24;
export const MISSIONS = names.map((name, i) => ({ id: i, name, region: REGIONS[Math.floor(i / 4)].id, gates: missionLengths[i], cup: i % 4 === 3 }));
export function raceQuestionCount(c: Config, lengthVersion: 1 | 2 = 2): number {
    if (c.mode === 'practice' && c.review?.length) return c.review.length;
    if (lengthVersion === 1) return c.mode === 'campaign' ? c.mission === 0 ? 4 : c.mission === 1 ? 6 : c.mission % 4 === 3 ? 10 : 8 : c.mode === 'practice' ? 6 : 8;
    return c.mode === 'campaign' ? MISSIONS[c.mission].gates : c.mode === 'practice' ? 12 : 18;
}
export const KARTS = [{ name: 'Tia Nắng', color: '#efb844', unlock: 0 }, { name: 'Sóng Biếc', color: '#48bbae', unlock: 4 }, { name: 'Sao Tím', color: '#a998dc', unlock: 8 }];
export const RACER_NAMES = ['Em', 'Bông', 'Sóc', 'Mít'];
// Keep the 110-unit reading zone; shorten only the driving gap between gates.
export const SEGMENT = 160, APPROACH = 40, GATE = 150;
export function normalizeConfig(c: Partial<Config>, grade = 1): Config {
    const mission = Number.isInteger(c.mission) ? Math.max(0, Math.min(11, c.mission!)) : 0;
    const mode = ['campaign', 'quick', 'practice'].includes(c.mode!) ? c.mode! : 'campaign';
    return { grade: Math.max(1, Math.min(5, Math.round(grade) || 1)), difficulty: LEVELS.some(l => l.id === c.difficulty) ? c.difficulty! : 'easy',
        pace: PACES.some(p => p.id === c.pace) ? c.pace! : 'normal', region: mode === 'campaign' ? MISSIONS[mission].region : REGIONS.some(r => r.id === c.region) ? c.region! : 'valley',
        mission, mode, kart: Number.isInteger(c.kart) ? Math.max(0, Math.min(2, c.kart!)) : 0, waitForChoice: mode === 'practice' || c.waitForChoice === true, autoNitro: c.autoNitro === true,
        ...(mode === 'practice' && Array.isArray(c.review) && c.review.length ? { review: [...new Set(c.review.filter(i => Number.isInteger(i) && i >= 0 && i < MAX_QUESTIONS))].slice(0, MAX_QUESTIONS) } : {}) };
}
