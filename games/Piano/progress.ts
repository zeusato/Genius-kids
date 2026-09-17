import type { StudentProfile } from '../../types';
import { defaultPreferences, INSTRUMENTS, SONG_IDS, type Preferences } from './model';
export interface PracticeRecord { phrases: number[]; independentPhrases: number[]; total: number; completed: boolean; independent: boolean; updatedAt: string }
export interface PianoProgress { version: 1; records: Record<string, PracticeRecord>; preferences: Preferences }
export type PianoAction = { type:'preferences'; preferences: Preferences } | { type:'practice'; id: string; phrase: number; total: number; guided: boolean };
const known = (id:string) => /^learn-(?:[1-9]|10)$/.test(id) || SONG_IDS.includes(id);
export function readProgress(value: unknown): PianoProgress {
    const clean: PianoProgress = { version:1, records:{}, preferences:{...defaultPreferences} };
    if (!value || typeof value !== 'object') return clean;
    const p = value as PianoProgress;
    if (p.version !== 1) return clean;
    const prefs = p.preferences;
    if (prefs) {
        if (INSTRUMENTS.some(i=>i.id===prefs.instrument)) clean.preferences.instrument=prefs.instrument;
        if (Number.isFinite(prefs.volume)) clean.preferences.volume=Math.max(0,Math.min(.85,prefs.volume));
        if (['solfege','letters','none'].includes(prefs.labels)) clean.preferences.labels=prefs.labels;
        if (typeof prefs.guidance==='boolean') clean.preferences.guidance=prefs.guidance;
    }
    for (const [id,r] of Object.entries(p.records || {})) {
        if (!known(id) || !r || !Number.isInteger(r.total) || r.total < 1 || r.total > 128 || !Array.isArray(r.phrases)) continue;
        const phrases=[...new Set(r.phrases.filter(n=>Number.isInteger(n)&&n>=0&&n<r.total))];
        const independentPhrases=Array.isArray(r.independentPhrases)?[...new Set(r.independentPhrases.filter(n=>phrases.includes(n)))]:r.independent&&phrases.length===r.total?[...phrases]:[];
        clean.records[id]={phrases,independentPhrases,total:r.total,completed:phrases.length===r.total,independent:independentPhrases.length===r.total,updatedAt:typeof r.updatedAt==='string'?r.updatedAt.slice(0,40):''};
    }
    return clean;
}
export function applyProgress(progress: PianoProgress, action: PianoAction): PianoProgress | null {
    if (action.type==='preferences') return readProgress({...progress,preferences:action.preferences});
    if (!known(action.id)||!Number.isInteger(action.total)||action.total<1||action.total>128||!Number.isInteger(action.phrase)||action.phrase<0||action.phrase>=action.total) return null;
    const old=progress.records[action.id];
    const phrases=[...new Set([...(old?.total===action.total?old.phrases:[]),action.phrase])];
    const independentPhrases=[...new Set([...(old?.total===action.total?old.independentPhrases:[]),...(!action.guided?[action.phrase]:[])])];
    return {...progress,records:{...progress.records,[action.id]:{phrases,independentPhrases,total:action.total,completed:phrases.length===action.total,independent:independentPhrases.length===action.total,updatedAt:new Date().toISOString()}}};
}
export function persistPiano(profiles: StudentProfile[], owner: string, action: PianoAction, write:(p:StudentProfile[])=>void) {
    const student=profiles.find(p=>p.id===owner), fail={ok:false,profiles};
    if (!student) return fail;
    const piano=applyProgress(readProgress(student.piano),action);
    if (!piano) return fail;
    const next=profiles.map(p=>p.id===owner?{...p,piano}:p);
    try { write(next); } catch { return fail; }
    return {ok:true,profiles:next};
}
