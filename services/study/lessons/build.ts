// Hàm dựng nội dung bài học — giúp file content/gN.ts ngắn, đúng kiểu.
// Nhóm nghìn gõ bằng dấu cách thường ("12 345") được đổi sang khoảng trắng không ngắt.
import type { Level } from '../types';
import type {
    Block, ExploreSpec, Form, KnowPage, Lesson, Mistake, VisualSpec, WidgetSpec, Worked, WorkedStep,
} from './types';
import { NBSP } from '../value';

/** "12 345" → "12 345" (NBSP); không đụng số 1–3 chữ số đứng riêng trước số khác ít hơn 3 chữ số. */
export const nb = (s: string): string => s.replace(/(?<=\d) (?=\d{3}(?!\d))/g, NBSP);

function deep<T>(x: T): T {
    if (typeof x === 'string') return nb(x) as T;
    if (Array.isArray(x)) return x.map(deep) as T;
    if (x && typeof x === 'object') {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(x)) out[k] = typeof v === 'function' ? v : deep(v);
        return out as T;
    }
    return x;
}

type Body = Omit<Lesson, 'skillId' | 'forms' | 'mistakes'> & { forms?: Form[]; mistakes?: Mistake[] };
export const lesson = (skillId: string, body: Body): Lesson => deep({ forms: [], mistakes: [], ...body, skillId });

export const vis = (fn: string, ...args: unknown[]): VisualSpec => ({ fn, args });
export const know = (title: string, ...blocks: Block[]): KnowPage => ({ title, blocks });
export const text = (md: string): Block => ({ t: 'text', md });
export const note = (md: string): Block => ({ t: 'note', md });
export const rule = (say: string, formula?: string, title?: string): Block => ({ t: 'rule', say, ...(formula ? { formula } : {}), ...(title ? { title } : {}) });
export const pic = (fn: string, ...args: unknown[]): Block => ({ t: 'pic', visual: vis(fn, ...args) });
export const picCap = (caption: string, fn: string, ...args: unknown[]): Block => ({ t: 'pic', visual: vis(fn, ...args), caption });
export const table = (head: string[], rows: string[][], caption?: string): Block => ({ t: 'table', head, rows, ...(caption ? { caption } : {}) });
export const widget = (w: WidgetSpec): Block => ({ t: 'widget', widget: w });
export const explore = <K extends string>(spec: Omit<ExploreSpec<K>, 'w'>): ExploreSpec<K> => ({ w: 'explore', ...spec });
export const form = (f: Form): Form => f;
export const worked = (w: Omit<Worked, 'layout'> & { layout?: Worked['layout'] }): Worked => ({ layout: 'solution', ...w });
export const step = (say: string, math?: string, visual?: VisualSpec): WorkedStep => ({ say, ...(math ? { math } : {}), ...(visual ? { visual } : {}) });
export const mistake = (wrong: string, right: string, why: string): Mistake => ({ wrong, right, why });
export const levels = (...l: Level[]): Level[] => l;
