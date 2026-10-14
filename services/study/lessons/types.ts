// Kiểu nội dung "Học bài" của Ôn Luyện (docs/study-learn-plan.md mục 5).
// Một bài = một kỹ năng; nội dung tĩnh, viết bằng TS (có hàm cho widget explore).
import type { Level } from '../types';
import type { VisualSpec } from '../../generators/svg/render';

export type { VisualSpec };

export type Block =
    | { t: 'text'; md: string }
    | { t: 'rule'; say: string; formula?: string; title?: string }
    | { t: 'pic'; visual: VisualSpec; caption?: string }
    | { t: 'table'; head: string[]; rows: string[][]; caption?: string }
    | { t: 'note'; md: string }
    | { t: 'widget'; widget: WidgetSpec };

export interface KnowPage { title: string; blocks: Block[] }

export interface WorkedStep { say: string; math?: string; visual?: VisualSpec }
export interface Worked {
    problem: string;
    visual?: VisualSpec;
    /** solution: khung "Bài giải" (câu lời giải + phép tính); calc: các bước tính */
    layout: 'solution' | 'calc';
    steps: WorkedStep[];
    answer: string;
    check?: string;
    /** calc: phát lại bằng widget đặt tính */
    replay?: ColumnSpec | DivisionSpec;
}

export interface Form {
    id: string;
    title: string;
    cue: string;
    steps: string[];
    example: Worked;
    /** mức template gần dạng này nhất → một câu Em thử */
    level?: Level;
}

export interface Mistake { wrong: string; right: string; why: string }

export interface Lesson {
    skillId: string;
    /** tăng khi đổi số/thứ tự trang → reset trang đã xem, không thưởng lại */
    v: number;
    /** phần sau "Học xong bài này, em sẽ …" */
    goal: string;
    hook?: { md: string; visual?: VisualSpec; answer?: string };
    needs?: string[];
    know: KnowPage[];
    forms: Form[];
    mistakes: Mistake[];
    remember: string[];
    tryLevels?: Level[];
    autoRead?: boolean;
}
export type LessonBook = Record<string, Lesson>;

export interface ExploreControl { label: string; min: number; max: number; step?: number; init: number; unit?: string }
export interface ExploreSpec<K extends string = string> {
    w: 'explore';
    title: string;
    controls: Record<K, ExploreControl>;
    /** null = hợp lệ; chuỗi = lời nhắc */
    valid?: (v: Record<K, number>) => string | null;
    visual: (v: Record<K, number>) => VisualSpec;
    /** phải đúng toán — test quét bằng mathLint */
    caption: (v: Record<K, number>) => string;
    speak?: (v: Record<K, number>) => string;
}
export interface PlaceValueSpec { w: 'place-value'; int: number; dec?: 0 | 1 | 2 | 3; init: number; mode?: 'build' | 'compare' | 'shift'; other?: number }
export interface ColumnSpec { w: 'column'; op: '+' | '-' | '×'; a: number; b: number; editable?: boolean }
export interface DivisionSpec { w: 'long-division'; a: number; b: number; layout?: 'short' | 'full'; editable?: boolean }
export type UnitKind = 'length' | 'mass' | 'capacity' | 'area' | 'volume';
export interface UnitLadderSpec { w: 'unit-ladder'; kind: UnitKind; value: number; from: string; to: string; editable?: boolean }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WidgetSpec = ExploreSpec<any> | PlaceValueSpec | ColumnSpec | DivisionSpec | UnitLadderSpec;

export type LessonPageKind = 'intro' | 'know' | 'form' | 'example' | 'mistake' | 'try' | 'remember';
export interface LessonPage { id: string; kind: LessonPageKind; title: string; index?: number; formId?: string }
