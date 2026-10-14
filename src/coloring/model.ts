export type Tier = 'easy' | 'medium' | 'hard';
export type Scene = 'ocean' | 'garden' | 'sky' | 'meadow';
export type Brush = 'marker' | 'crayon' | 'watercolor' | 'glitter' | 'rainbow' | 'erase';
export type Style = 'solid' | 'gradient' | 'dots' | 'stripes' | 'stars' | 'hearts' | 'checks' | 'scales' | 'bricks' | 'clouds' | 'crayon' | 'glitter' | 'watercolor' | 'rainbow';
export type Mode = 'free' | 'number' | 'math' | 'listen';
export interface Region {
    id: number;
    d: string;
    area: number;
    bg: boolean;
    decor?: boolean;
    listen?: boolean;
    anchor: number[];
    bbox: number[];
    inr: number;
    color: number;
    name: string;
}
export interface PageInfo {
    id: string;
    title: string;
    book: string;
    tier: Tier;
    scene: Scene;
    count: number;
}
export interface Page extends PageInfo {
    version: 1;
    rev: string;
    size: number;
    regions: Region[];
    ink: string;
    symmetry?: boolean;
}
export interface Catalog {
    books: {
        id: string;
        title: string;
        icon: string;
    }[];
    pages: PageInfo[];
}
export type Op = {
    kind: 'fill';
    at?:number[];
    color2?:string;
    r: number;
    color: string;
    style: Style;
    seed: number;
} | {
    kind: 'stroke';
    r: number;
    color: string;
    brush: Brush;
    size: number;
    pts: number[];
    seed: number;
};
export interface Artwork {
    owner: string;
    id: string;
    rev: string;
    revision: number;
    ops: Op[];
    updated: number;
    thumb?: string;
    livingThumb?: string;
    complete: boolean;
    living?: boolean;
    scene: Scene;
    page?: Page;
}
export interface ColoringProgress {
    version: 1;
    completed: string[];
    badges: string[];
    last?: string;
    daily?: string;
    medals?: Partial<Record<Mode, 'gold' | 'silver' | 'bronze'>>;
}
export interface CompletionDetail {
    paintingComplete?: boolean;
    tier: Tier;
    regions: number;
    colors: number;
    patterns: number;
    bookPages?: string[];
    daily?: boolean;
    mode: Mode;
    correct: number;
    total: number;
    math?: {
        region: number;
        answer: number;
        firstTry: boolean;
    }[];
}
export const PALETTE = [['#f25763', 'Đỏ', 'Red'], ['#ff9670', 'Cam', 'Orange'], ['#ffd45e', 'Vàng', 'Yellow'], ['#88bf65', 'Xanh lá', 'Green'], ['#49b6a0', 'Xanh ngọc', 'Teal'], ['#7ed4e5', 'Xanh nhạt', 'Light blue'], ['#588cdb', 'Xanh dương', 'Blue'], ['#9a7dcc', 'Tím', 'Purple'], ['#eb89b5', 'Hồng', 'Pink'], ['#ae6c49', 'Nâu', 'Brown'], ['#89949c', 'Xám', 'Grey'], ['#ffffff', 'Trắng', 'White'], ['#263b4a', 'Đen', 'Black'], ['#ffbdab', 'Hồng đào', 'Peach'], ['#fff0a7', 'Vàng nhạt', 'Light yellow'], ['#c3e7af', 'Xanh non', 'Light green'], ['#b3edf0', 'Xanh băng', 'Ice blue'], ['#c6b1e9', 'Tím nhạt', 'Lavender'], ['#d63d4f','Đỏ đậm','Crimson'],['#edaa36','Vàng cam','Amber'],['#28785e','Xanh lá đậm','Dark green'],['#326599','Xanh biển đậm','Navy blue'],['#705195','Tím đậm','Deep purple'],['#ddb986','Vàng cát','Sand'],['#f9ddc3', 'Da sáng', 'Light skin'], ['#eac09d', 'Da be', 'Beige skin'], ['#d49a70', 'Da vàng nâu', 'Tan skin'], ['#ac724f', 'Da nâu', 'Brown skin'], ['#815136', 'Da nâu đậm', 'Dark brown skin'], ['#513727', 'Da sẫm', 'Deep skin']] as const;
export const TIERS: Record<Tier, string> = { easy: 'Mầm', medium: 'Chồi', hard: 'Họa sĩ' };
