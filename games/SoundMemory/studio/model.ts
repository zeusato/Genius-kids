import { TIMBRES, Timbre } from '../audio/voices';
export interface Composition { id: string; name: string; bpm: number; timbre: Timbre; steps: 8 | 16; melody: number[]; kick: boolean[]; clap: boolean[]; updatedAt: string }
export const blankComposition = (id: string = crypto.randomUUID()): Composition => ({ id, name: 'Bài hát của mình', bpm: 90, timbre: 'wood', steps: 8, melody: Array(16).fill(-1), kick: Array(16).fill(false), clap: Array(16).fill(false), updatedAt: '' });
export function validComposition(value: unknown): value is Composition {
    if (!value || typeof value !== 'object') return false;
    const c = value as Composition;
    return typeof c.id === 'string' && c.id.length > 0 && c.id.length <= 100 && typeof c.name === 'string' && c.name.trim().length > 0 && c.name.length <= 40 && typeof c.updatedAt === 'string' && c.updatedAt.length < 50
        && Number.isInteger(c.bpm) && c.bpm >= 60 && c.bpm <= 120 && TIMBRES.includes(c.timbre) && [8, 16].includes(c.steps)
        && Array.isArray(c.melody) && c.melody.length === 16 && c.melody.every(n => Number.isInteger(n) && n >= -1 && n <= 4)
        && [c.kick, c.clap].every(a => Array.isArray(a) && a.length === 16 && a.every(v => typeof v === 'boolean'));
}
export type CompositionAction = { type: 'save'; composition: Composition; overwrite: boolean } | { type: 'delete'; id: string };
export function editLibrary(library: Composition[], action: CompositionAction): { ok: boolean; library: Composition[]; error?: string } {
    if (action.type === 'delete') return { ok: true, library: library.filter(c => c.id !== action.id) };
    const c = action.composition, exists = library.some(item => item.id === c.id);
    if (!validComposition(c)) return { ok: false, library, error: 'Bản nhạc chưa hợp lệ.' };
    if (exists && !action.overwrite) return { ok: false, library, error: 'Cần xác nhận thay bản đã lưu.' };
    if (!exists && library.length >= 12) return { ok: false, library, error: 'Tủ nhạc đã đủ 12 bài. Hãy chọn một bài để thay hoặc xóa.' };
    const saved = { ...c, name: c.name.trim(), updatedAt: new Date().toISOString() };
    return { ok: true, library: exists ? library.map(item => item.id === c.id ? saved : item) : [...library, saved] };
}
