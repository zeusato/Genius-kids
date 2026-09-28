// Zoom ngữ nghĩa + chọn nhãn không chồng nhau.
import type { EvoTree, FlatNode } from './tree';

export const LOD = { DOT_PX: 5, ICON_PX: 14, NAME_PX: 26, BUDGET: { wide: 36, mid: 24, narrow: 16 } } as const;

export function labelBudget(viewportWidth: number): number {
    return viewportWidth >= 1024 ? LOD.BUDGET.wide : viewportWidth >= 640 ? LOD.BUDGET.mid : LOD.BUDGET.narrow;
}

const MAJOR = new Set(['bacteria', 'archaea', 'eukarya', 'fungi_simple', 'animalia', 'plantae_simple', 'land_plants', 'archaeplastida', 'sar', 'amoebozoa']);

export function labelPriority(n: FlatNode, ctx: { selected: number | null; youAreHere: number; approx: boolean }): number {
    if (ctx.selected === n.i) return 200;
    if (n.i === ctx.youAreHere) return 95;
    if (MAJOR.has(n.id)) return 100;
    let p: number;
    if (!n.isLeaf) p = n.leafCount >= 10 ? 60 + Math.log2(n.leafCount) : 40 - n.depth / 2;
    else p = 20;
    return ctx.approx ? p - 15 : p;
}

export interface LabelCand { i: number; x: number; y: number; w: number; h: number; prio: number; gap: number }
export interface PlacedLabel { i: number; x: number; y: number; side: 'r' | 'l' | 't' | 'b' }

/** Tham lam theo ưu tiên giảm dần; thử phải → trái → trên → dưới; đệm 4 px. x,y = tâm điểm neo (px màn). */
export function placeLabels(cands: LabelCand[], budget: number, vw: number, vh: number): PlacedLabel[] {
    const sorted = [...cands].sort((a, b) => b.prio - a.prio);
    const taken: [number, number, number, number][] = [];
    const out: PlacedLabel[] = [];
    const PAD = 4;
    for (const c of sorted) {
        if (out.length >= budget) break;
        const g = c.gap;
        const options: [PlacedLabel['side'], number, number][] = [
            ['r', c.x + g, c.y - c.h / 2],
            ['l', c.x - g - c.w, c.y - c.h / 2],
            ['t', c.x - c.w / 2, c.y - g - c.h],
            ['b', c.x - c.w / 2, c.y + g],
        ];
        for (const [side, x, y] of options) {
            if (x < 2 || y < 2 || x + c.w > vw - 2 || y + c.h > vh - 2) continue;
            const r: [number, number, number, number] = [x - PAD, y - PAD, x + c.w + PAD, y + c.h + PAD];
            if (taken.some(q => r[0] < q[2] && r[2] > q[0] && r[1] < q[3] && r[3] > q[1])) continue;
            taken.push(r);
            out.push({ i: c.i, x, y, side });
            break;
        }
    }
    return out;
}

/** Tên bậc phân loại tiếng Việt. */
export const RANK_VI: Record<string, string> = {
    root: 'Gốc', domain: 'Lãnh giới', kingdom: 'Giới', phylum: 'Ngành', class: 'Lớp', order: 'Bộ', family: 'Họ',
    genus: 'Chi', species: 'Loài', clade: 'Nhánh', branch: 'Nhóm', superorder: 'Liên bộ', suborder: 'Phân bộ', milestone: 'Mốc',
};
export const RANK_LADDER = ['kingdom', 'phylum', 'class', 'order', 'family', 'genus', 'species'];

export function isMajor(t: EvoTree, i: number): boolean { return MAJOR.has(t.nodes[i].id); }
