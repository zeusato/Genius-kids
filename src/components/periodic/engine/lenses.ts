// Kính lọc: bảng giữ nguyên bố cục, chỉ đổi NỘI DUNG ô. lookFor(el, lens, ctx) → CellLook. TS thuần.
import { CATEGORY_COLORS } from '../../../data/elementsData';
import { ORIGIN_INFO, ORIGIN_IDS, type OriginId } from '../../../data/periodic/origin';
import { AROUND_INFO, COMPOSITION, type AroundId } from '../../../data/periodic/composition';
import type { ElementFull } from './elements';
import { stateAt, type MatterState } from './states';
import { isDiscovered, isMendeleevGap } from './history';

export type LensId = 'group' | 'state' | 'uses' | 'origin' | 'history' | 'around' | 'metal' | 'radioactive';

export interface LensCtx { tempC: number; year: number; around: AroundId }
export const DEFAULT_CTX: LensCtx = { tempC: 25, year: 2016, around: 'body' };

export interface CellLook {
    key: string;                    // đổi key ↔ ô cần vẽ lại
    color: string;                  // viền + chữ
    glow: string;                   // quầng
    text?: string;                  // màu chữ nếu khác `color`
    dim: boolean;
    dashed?: boolean;
    pattern?: MatterState;          // kính 🌡️
    big?: string;                   // emoji thay tên (kính 🏠)
    sub?: string;                   // dòng dưới thay tên
    symbol?: string;                // thay ký hiệu (vd "?" ở kính 🕰️)
    stripes?: { color: string; frac: number }[];
    badge?: string;                 // góc phải trên
}

export const LENSES: { id: LensId; label: string; icon: string }[] = [
    { id: 'group', label: 'Nhóm', icon: '🎨' },
    { id: 'state', label: 'Rắn · lỏng · khí', icon: '🌡️' },
    { id: 'uses', label: 'Đời sống', icon: '🏠' },
    { id: 'origin', label: 'Nguồn gốc vũ trụ', icon: '✨' },
    { id: 'history', label: 'Lịch sử', icon: '🕰️' },
    { id: 'around', label: 'Quanh em', icon: '🧍' },
    { id: 'metal', label: 'Kim loại?', icon: '🧲' },
    { id: 'radioactive', label: 'Phóng xạ', icon: '☢️' },
];

export const STATE_STYLE: Record<MatterState, { color: string; text: string; label: string; icon: string }> = {
    solid: { color: '#93c5fd', text: '#dbeafe', label: 'Rắn', icon: '❄️' },
    liquid: { color: '#22d3ee', text: '#ecfeff', label: 'Lỏng', icon: '💧' },
    gas: { color: '#fb923c', text: '#ffedd5', label: 'Khí', icon: '💨' },
    unknown: { color: '#64748b', text: '#94a3b8', label: 'Chưa biết', icon: '❓' },
};

export type MetalClass = 'metal' | 'metalloid' | 'nonmetal' | 'noble';
export const METAL_STYLE: Record<MetalClass, { color: string; label: string }> = {
    metal: { color: '#FFD43B', label: 'Kim loại' }, metalloid: { color: '#38D9A9', label: 'Á kim' },
    nonmetal: { color: '#4DABF7', label: 'Phi kim' }, noble: { color: '#DA77F2', label: 'Khí hiếm' },
};
export function metalClass(e: ElementFull): MetalClass {
    if (e.category === 'noble-gas') return 'noble';
    if (e.category === 'metalloid') return 'metalloid';
    if (e.category === 'nonmetal' || e.category === 'halogen') return 'nonmetal';
    return 'metal';
}

const DIM = '#475569';

export function formatPct(p: number): string {
    if (p >= 1) return `${p.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%`;
    if (p >= 0.01) return `${p.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}%`;
    return 'vi lượng';
}

/** Chu kỳ bán rã dễ hiểu từ số giây. */
export function formatHalfLife(sec?: number): string {
    if (!sec) return '';
    const Y = 365.25 * 86400;
    if (sec >= 1e9 * Y) return `${(sec / (1e9 * Y)).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} tỷ năm`;
    if (sec >= 1e6 * Y) return `${(sec / (1e6 * Y)).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} triệu năm`;
    if (sec >= 1e3 * Y) return `${Math.round(sec / (1e3 * Y)).toLocaleString('vi-VN')} nghìn năm`;
    if (sec >= Y) return `${Math.round(sec / Y).toLocaleString('vi-VN')} năm`;
    if (sec >= 86400) return `${Math.round(sec / 86400)} ngày`;
    if (sec >= 3600) return `${Math.round(sec / 3600)} giờ`;
    if (sec >= 60) return `${Math.round(sec / 60)} phút`;
    if (sec >= 1) return `${Math.round(sec)} giây`;
    return 'chưa tới 1 giây';
}

export function dominantOrigin(e: ElementFull): OriginId {
    let best: OriginId = 'human_made', v = -1;
    for (const id of ORIGIN_IDS) { const f = e.origin[id] ?? 0; if (f > v) { v = f; best = id; } }
    return best;
}

export function lookFor(e: ElementFull, lens: LensId, ctx: LensCtx): CellLook {
    const cat = CATEGORY_COLORS[e.category];
    const base: CellLook = { key: 'g', color: cat.color, glow: cat.glow, dim: false };
    switch (lens) {
        case 'group': return base;
        case 'state': {
            const s = stateAt(e, ctx.tempC), st = STATE_STYLE[s];
            return { key: `s${s}`, color: st.color, glow: `${st.color}80`, text: st.text, dim: false, pattern: s, dashed: s === 'unknown', badge: s === 'unknown' ? '?' : undefined };
        }
        case 'uses': {
            const u = e.uses[0];
            return { ...base, key: 'u', big: u?.emoji ?? '🔬', sub: e.symbol };
        }
        case 'origin': {
            const parts = ORIGIN_IDS.map(id => ({ id, f: e.origin[id] ?? 0 })).filter(p => p.f > 0.02).sort((a, b) => b.f - a.f);
            const c = ORIGIN_INFO[parts[0]?.id ?? 'human_made'].color;
            return { key: 'o', color: c, glow: `${c}80`, dim: false, stripes: parts.map(p => ({ color: ORIGIN_INFO[p.id].color, frac: p.f })) };
        }
        case 'history': {
            if (isMendeleevGap(e, ctx.year)) return { key: 'hm', color: '#fde047', glow: '#fde04799', dim: false, symbol: '?', sub: 'Mendeleev đoán' };
            if (!isDiscovered(e, ctx.year)) return { key: 'h0', color: DIM, glow: 'transparent', dim: true, symbol: '?', sub: '' };
            const fresh = ctx.year - e.found.year < 12 && !e.found.ancient;
            return { ...base, key: fresh ? 'hn' : 'h1', badge: fresh ? '✨' : undefined };
        }
        case 'around': {
            const p = COMPOSITION[ctx.around][e.atomicNumber];
            if (!p) return { key: 'a0', color: cat.color, glow: 'transparent', dim: true };
            const k = Math.min(1, Math.max(0, (Math.log10(p) + 6) / 7.8));
            return { key: `a${Math.round(k * 10)}`, color: '#34d399', glow: `rgba(52,211,153,${(0.25 + 0.6 * k).toFixed(2)})`, dim: false, sub: formatPct(p) };
        }
        case 'metal': {
            const m = METAL_STYLE[metalClass(e)];
            return { key: `m${m.label}`, color: m.color, glow: `${m.color}80`, dim: false };
        }
        case 'radioactive': {
            if (e.isotope.stable) return { key: 'r0', color: cat.color, glow: 'transparent', dim: true };
            return { key: 'r1', color: '#a3e635', glow: '#a3e635', dim: false, badge: '☢', sub: formatHalfLife(e.isotope.halfLifeSec) };
        }
    }
}

export function legendFor(lens: LensId, ctx: LensCtx, all: ElementFull[]): { color: string; label: string; count?: number }[] {
    switch (lens) {
        case 'state': {
            const n: Record<MatterState, number> = { solid: 0, liquid: 0, gas: 0, unknown: 0 };
            all.forEach(e => n[stateAt(e, ctx.tempC)]++);
            return (Object.keys(STATE_STYLE) as MatterState[]).map(s => ({ color: STATE_STYLE[s].color, label: `${STATE_STYLE[s].icon} ${STATE_STYLE[s].label}`, count: n[s] }));
        }
        case 'origin': return ORIGIN_IDS.map(id => ({ color: ORIGIN_INFO[id].color, label: `${ORIGIN_INFO[id].icon} ${ORIGIN_INFO[id].label}` }));
        case 'metal': return (Object.keys(METAL_STYLE) as MetalClass[]).map(k => ({ color: METAL_STYLE[k].color, label: METAL_STYLE[k].label, count: all.filter(e => metalClass(e) === k).length }));
        case 'history': return [{ color: '#fbbf24', label: 'Đã tìm ra', count: all.filter(e => isDiscovered(e, ctx.year)).length }];
        case 'radioactive': return [{ color: '#a3e635', label: '☢ Không có đồng vị bền', count: all.filter(e => !e.isotope.stable).length }];
        case 'around': return [{ color: '#34d399', label: AROUND_INFO[ctx.around].title }];
        default: return [];
    }
}
