export type ZoneId = 'garden' | 'town' | 'space' | 'shapes' | 'festival';
export type MatchRule = 'same' | 'shadow';
export type Phase = 'ready' | 'preview' | 'first' | 'second' | 'resolving' | 'complete';
export interface MemoryConfig {
    zone: ZoneId; pairs: number; rule: MatchRule; preview: number; relaxed: boolean; missionId?: string;
}
export interface MemoryTile { id: string; picture: string; face: 'picture' | 'shadow' }
export interface MemorySession {
    version: 2; id: string; seed: number; columns: number; config: MemoryConfig; deck: MemoryTile[];
    phase: Phase; selected: string[]; matched: string[]; attempts: number; hints: number;
    hintIds: string[]; hintMs: number; waitMs: number; elapsedMs: number; started: boolean; paused: boolean;
}
export type MemoryEvent = { sessionId: string } & (
    { type: 'begin' | 'endPreview' | 'pause' | 'resume' | 'hint' } |
    { type: 'flip'; id: string } | { type: 'tick'; ms: number }
);
export interface MemoryMission { id: string; zone: ZoneId; number: number; title: string; skill: string; pairs: number; preview: number; rule: MatchRule; gift: string; tip: string }
export interface MemoryRecord { version: 2; missionId?: string; pairs: number; attempts: number; hints: number; preview: number; relaxed: boolean; rule: MatchRule; seed: number; sessionId: string }
export const PAIR_COUNTS = [3,4,6,8,10,12,15] as const;
export const columnsFor = (pairs:number,width=1280)=>pairs===3?3:pairs<=8?4:pairs===10?5:pairs===12?(width<650?4:6):(width<650?5:6);
export const activePhase = (s: MemorySession) => ['first','second','resolving'].includes(s.phase);
export function matching(a: MemoryTile, b: MemoryTile, rule: MatchRule) {
    return a.id !== b.id && a.picture === b.picture && (rule === 'same' || a.face !== b.face);
}
export const difficultyOf = (pairs: number): 'easy' | 'medium' | 'hard' => pairs <= 6 ? 'easy' : pairs <= 10 ? 'medium' : 'hard';
export function resultOf(s: MemorySession) {
    const p=s.config.pairs, stars=s.attempts<=Math.floor(p*1.5)?3:s.attempts<=p*2?2:1;
    return { stars, score: Math.round(1000*p/Math.max(p,s.attempts)), seconds: Math.round(s.elapsedMs/1000),
        record: { version:2,missionId:s.config.missionId,pairs:p,attempts:s.attempts,hints:s.hints,preview:s.config.preview,relaxed:s.config.relaxed,rule:s.config.rule,seed:s.seed,sessionId:s.id } as MemoryRecord };
}
