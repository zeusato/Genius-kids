import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Image as ImageIcon, Route, Microscope, X } from 'lucide-react';
import { SpeakButton } from '../../shared/SpeakButton';
import { InfoThumb, InfographicViewer } from '../../shared/Infographic';
import { KID } from '../../../data/evolution/kid';
import { TEXTBOOK_GROUPS } from '../../../data/evolution/overlays';
import { EXTINCT, LEAF_FIRST } from '../../../data/evolution/times';
import type { EvoWorld, AtlasInfo } from '../scene/world';
import { displayTime } from '../engine/times';
import { isAncestor, siblingsOf, leavesOf } from '../engine/tree';
import { RANK_LADDER, RANK_VI } from '../engine/lod';
import { EARTH_MA } from '../engine/timeScale';
import { NodeIcon } from './common';

interface Props {
    world: EvoWorld;
    atlas: AtlasInfo | null;
    index: number;
    portrait: boolean;
    autoSpeak: boolean;
    onClose: () => void;
    onSelect: (i: number) => void;
    onJourney: (i: number) => void;
    onOpenCell: (cell: 'animal' | 'plant' | 'bacteria') => void;
    onSymbiosis?: (id: 'mito' | 'chloro') => void;
}

function cellLinkFor(world: EvoWorld, i: number): 'animal' | 'plant' | 'bacteria' | null {
    const n = world.tree.nodes[i];
    if (n.sector === 'bacteria') return 'bacteria';
    if (n.sector === 'animal') return 'animal';
    const lp = world.tree.byId.get('land_plants')!;
    if (isAncestor(world.tree, lp, i)) return 'plant';
    return null;
}

const SYMBIOSIS_OF: Record<string, 'mito' | 'chloro'> = { alpha_proteobacteria: 'mito', eukarya: 'mito', cyanobacteria: 'chloro', archaeplastida: 'chloro' };

export const NodeSheet: React.FC<Props> = ({ world, atlas, index, portrait, autoSpeak, onClose, onSelect, onJourney, onOpenCell, onSymbiosis }) => {
    const t = world.tree;
    const n = t.nodes[index];
    const [info, setInfo] = useState<string | null>(null);
    const [expanded, setExpanded] = useState(false);
    useEffect(() => { setExpanded(false); }, [index]);
    const kid = KID[n.id]?.line ?? '';
    const sibs = useMemo(() => siblingsOf(t, index), [t, index]);
    const parent = n.parent;
    const all = parent >= 0 ? t.nodes[parent].children : [];
    const pos = all.indexOf(index);
    const groups = TEXTBOOK_GROUPS.filter(g => {
        const ids = g.members ?? g.parts?.flatMap(p => p.members) ?? [];
        return ids.some(id => { const k = t.byId.get(id); return k !== undefined && isAncestor(t, k, index); });
    }).filter(g => g.kind === 'group');
    const kingdom5 = TEXTBOOK_GROUPS.find(g => g.id === 'kingdoms5')!.parts!.find(p => p.members.some(id => isAncestor(t, t.byId.get(id)!, index)));
    const timeText = displayTime(t, world.times, index);
    const firstMa = EXTINCT[n.id]?.firstMa ?? LEAF_FIRST[n.id]?.firstMa ?? (world.times.approx[index] ? null : n.isLeaf ? null : world.times.ma[index]);
    const cell = cellLinkFor(world, index);
    const rankIdx = RANK_LADDER.indexOf(n.data.type);
    const leafCount = n.isLeaf ? 0 : leavesOf(t, index).length;

    const wrap = portrait
        ? `absolute left-0 right-0 bottom-0 ${expanded ? 'h-[85%]' : 'h-[46%]'} rounded-t-3xl evo-sheet-enter-bottom`
        : 'absolute right-3 top-20 bottom-3 w-[380px] rounded-3xl evo-sheet-enter';

    return (
        <>
            <aside key={index} className={`${wrap} z-40 bg-slate-950/90 border border-white/12 shadow-2xl backdrop-blur-xl text-slate-100 flex flex-col overflow-hidden transition-[height] duration-300`}
                onPointerDown={e => e.stopPropagation()} aria-label={`Thẻ ${n.data.label}`}>
                {portrait && <button type="button" onClick={() => setExpanded(v => !v)} className="mx-auto mt-2 w-12 h-1.5 rounded-full bg-white/25" aria-label="Kéo thẻ" />}
                <div className="flex items-start gap-3 p-4 pb-2">
                    <NodeIcon node={n} atlas={atlas} size={72} />
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap gap-1.5 mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-white/80">{RANK_VI[n.data.type] ?? 'Nhóm'}</span>
                            {n.extinct && <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-500/40 text-slate-200">Đã tuyệt chủng</span>}
                            {n.data.youAreHere && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-300 text-amber-950">Bạn ở đây</span>}
                        </div>
                        <h2 className="text-xl font-extrabold leading-tight">{n.data.label}</h2>
                        {n.data.englishLabel && <div className="text-xs text-white/50 italic truncate">{n.data.englishLabel}</div>}
                    </div>
                    <button type="button" onClick={onClose} aria-label="Đóng thẻ" className="w-9 h-9 grid place-items-center rounded-full hover:bg-white/10 text-white/70"><X size={18} /></button>
                </div>
                <div className="flex-1 overflow-y-auto evo-scroll px-4 pb-4 space-y-3">
                    {kid && (
                        <div className="flex items-start gap-2 rounded-2xl bg-sky-400/10 border border-sky-300/20 p-3">
                            <p className="flex-1 text-[15px] leading-snug text-sky-50 font-semibold">{kid}</p>
                            <SpeakButton text={kid} autoPlay={autoSpeak} autoPlayKey={n.id} size={18} className="shrink-0" />
                        </div>
                    )}
                    <div className="rounded-2xl bg-white/5 border border-white/8 p-3">
                        <div className="text-[11px] uppercase tracking-wider text-amber-300/90 font-bold mb-1">⏳ Thời gian</div>
                        <div className="text-sm text-white/90">{timeText}</div>
                        {firstMa !== null && firstMa > 0 && (
                            <div className="mt-2">
                                <div className="relative h-2 rounded-full bg-white/10 overflow-hidden">
                                    <div className="absolute inset-y-0 rounded-full" style={{ left: `${(1 - firstMa / EARTH_MA) * 100}%`, right: `${(EXTINCT[n.id] ? EXTINCT[n.id].endMa / EARTH_MA : 0) * 100}%`, background: 'linear-gradient(90deg,#fde68a,#fb923c)' }} />
                                </div>
                                <div className="flex justify-between text-[10px] text-white/40 mt-1"><span>Trái Đất ra đời</span><span>Thời gian thật (đúng tỉ lệ)</span><span>Hôm nay</span></div>
                            </div>
                        )}
                    </div>
                    {n.data.description && <p className="text-sm text-slate-300 leading-relaxed">{n.data.description}</p>}
                    {n.data.traits.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">{n.data.traits.map(tr => <span key={tr} className="text-xs px-2.5 py-1 rounded-full bg-violet-400/15 border border-violet-300/20 text-violet-100">{tr}</span>)}</div>
                    )}
                    {n.data.grade && <div className="text-xs rounded-xl bg-amber-300/10 border border-amber-300/30 text-amber-100 p-2.5"><b>Nhóm gộp:</b> nhóm này không phải một nhánh trọn vẹn trên cây họ hàng.</div>}
                    {rankIdx >= 0 && (
                        <div className="rounded-2xl bg-white/5 border border-white/8 p-3">
                            <div className="text-[11px] uppercase tracking-wider text-emerald-300/90 font-bold mb-2">Bậc phân loại (KHTN 6)</div>
                            <div className="flex flex-wrap items-center gap-1 text-[11px]">
                                {RANK_LADDER.map((r, k) => (
                                    <React.Fragment key={r}>
                                        {k > 0 && <span className="text-white/25">›</span>}
                                        <span className={`px-2 py-0.5 rounded-full ${r === n.data.type ? 'bg-emerald-400 text-emerald-950 font-bold' : 'bg-white/8 text-white/60'}`}>{RANK_VI[r]}</span>
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    )}
                    {sibs.length > 0 && (
                        <div>
                            <div className="text-[11px] uppercase tracking-wider text-white/50 font-bold mb-1.5">Họ hàng gần nhất</div>
                            <div className="flex flex-wrap gap-1.5">
                                {sibs.map(s => (
                                    <button key={s} type="button" onClick={() => onSelect(s)} className="flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full bg-white/8 hover:bg-white/15 border border-white/10 text-xs">
                                        <NodeIcon node={t.nodes[s]} atlas={atlas} size={22} /> {t.nodes[s].data.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    {!n.isLeaf && <div className="text-xs text-white/50">Nhánh này có {leafCount} nhóm con trên cây. Chạm vào các ngọn để khám phá!</div>}
                    {n.data.gallery && (
                        <div>
                            <div className="text-[11px] uppercase tracking-wider text-white/50 font-bold mb-1.5">{n.data.gallery.title}</div>
                            <div className="grid grid-cols-2 gap-2">
                                {n.data.gallery.items.map(g => (
                                    <button key={g.label + g.englishLabel} type="button" disabled={!g.infographicUrl} onClick={() => g.infographicUrl && setInfo(g.infographicUrl)}
                                        className="text-left rounded-xl bg-white/6 hover:bg-white/12 border border-white/10 p-2 overflow-hidden">
                                        {g.infographicUrl && <InfoThumb url={g.infographicUrl} className="h-20 -mx-2 -mt-2 mb-1.5" />}
                                        <div className="text-sm font-bold">{g.label}</div>
                                        {g.description && <div className="text-[11px] text-white/55 line-clamp-2">{g.description}</div>}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    {n.data.infographicUrl && (
                        <button type="button" onClick={() => setInfo(n.data.infographicUrl!)} className="group w-full block rounded-2xl overflow-hidden border border-sky-300/25 bg-sky-900/30 text-left">
                            <InfoThumb url={n.data.infographicUrl} className="h-40" />
                            <span className="flex items-center gap-2 px-3 py-2 font-bold text-sm text-sky-100 group-hover:text-white"><ImageIcon size={18} /> Xem tranh chi tiết (chạm để phóng to)</span>
                        </button>
                    )}
                    {(groups.length > 0 || kingdom5) && (
                        <div className="text-xs text-white/55">
                            Theo SGK: {kingdom5 && <b className="text-white/80">giới {kingdom5.label}</b>}{groups.length > 0 && <> · {groups.map(g => g.label).join(', ')}</>}
                        </div>
                    )}
                    <div className="flex flex-wrap gap-2 pt-1">
                        {n.isLeaf && <button type="button" onClick={() => onJourney(index)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-400 text-amber-950 font-bold text-sm"><Route size={16} /> Hành trình về tổ tiên</button>}
                        {SYMBIOSIS_OF[n.id] && onSymbiosis && <button type="button" onClick={() => onSymbiosis(SYMBIOSIS_OF[n.id])} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-400/20 hover:bg-orange-400/30 border border-orange-300/30 font-bold text-sm">{SYMBIOSIS_OF[n.id] === 'mito' ? '🔋 Chuyện ty thể' : '🌿 Chuyện lục lạp'}</button>}
                        {cell && <button type="button" onClick={() => onOpenCell(cell)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 font-bold text-sm"><Microscope size={16} /> Xem tế bào</button>}
                    </div>
                </div>
                {all.length > 1 && (
                    <div className="flex items-center justify-between px-3 py-2 border-t border-white/10 text-xs text-white/60">
                        <button type="button" onClick={() => onSelect(all[(pos - 1 + all.length) % all.length])} className="flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-white/10"><ChevronLeft size={16} /> Trước</button>
                        <span>{pos + 1} / {all.length} trong "{t.nodes[parent].data.label}"</span>
                        <button type="button" onClick={() => onSelect(all[(pos + 1) % all.length])} className="flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-white/10">Sau <ChevronRight size={16} /></button>
                    </div>
                )}
            </aside>
            {info && <InfographicViewer url={info} onClose={() => setInfo(null)} />}
        </>
    );
};

/** Ảnh xem trước infographic (tải lười từ Supabase). Lỗi / offline → ô trống nhẹ, vẫn bấm mở được. */
export { InfoThumb, InfographicViewer } from '../../shared/Infographic';
