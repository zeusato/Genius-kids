import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Search, X } from 'lucide-react';
import type { EvoWorld, AtlasInfo } from '../scene/world';
import { pathToRoot } from '../engine/tree';
import { searchNodes } from '../engine/search';
import { TEXTBOOK_GROUPS } from '../../../data/evolution/overlays';
import { EVO_BADGES } from '../../../data/evolution/games';
import type { TimeEvent } from '../../../data/evolution/events';
import { getInfographicUrl } from '@/src/lib/supabase';
import { NodeIcon, Panel } from './common';
import { InfographicViewer, InfoThumb } from './NodeSheet';
import type { EvoNotebook } from '../notebookStore';

// ---------------------------------------------------------------- thanh trên: quay lại + đường dẫn tổ tiên + tìm
export const TopBar: React.FC<{ world: EvoWorld; atlas: AtlasInfo | null; selected: number | null; compact: boolean; onBack: () => void; onSelect: (i: number | null) => void; onSearch: () => void; right?: React.ReactNode }> =
    ({ world, atlas, selected, compact, onBack, onSelect, onSearch, right }) => {
        const t = world.tree;
        const path = selected === null ? [] : pathToRoot(t, selected).reverse().slice(1);
        const shown = path.length > (compact ? 2 : 4) ? [...path.slice(0, 1), -1, ...path.slice(compact ? -1 : -3)] : path;
        return (
            <div className="absolute top-0 left-0 right-0 z-30 flex items-center gap-2 p-3 pointer-events-none">
                <button type="button" onClick={onBack} className="pointer-events-auto flex items-center gap-1.5 h-11 px-3 rounded-full bg-slate-900/60 border border-white/15 text-white backdrop-blur-md hover:bg-white/15">
                    <ArrowLeft size={18} />{!compact && <span className="font-bold text-sm">Quay lại</span>}
                </button>
                <div className="pointer-events-auto flex items-center gap-1 min-w-0 overflow-hidden h-11 px-2 rounded-full bg-slate-900/60 border border-white/15 backdrop-blur-md">
                    <button type="button" onClick={() => onSelect(null)} className="px-2 py-1 rounded-full text-sm font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-emerald-300 whitespace-nowrap">🌳 {compact ? '' : 'Cây Sự Sống'}</button>
                    {shown.map((i, k) => i < 0
                        ? <span key={`e${k}`} className="text-white/40 px-1">…</span>
                        : (
                            <React.Fragment key={i}>
                                <span className="text-white/30">›</span>
                                <button type="button" onClick={() => onSelect(i)} className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs whitespace-nowrap max-w-[150px] truncate ${i === selected ? 'bg-amber-300/25 text-amber-100 font-bold' : 'text-white/75 hover:bg-white/10'}`}>
                                    {i === selected && <NodeIcon node={t.nodes[i]} atlas={atlas} size={18} />}
                                    {t.nodes[i].data.label.replace(/\s*\(.*?\)/g, '')}
                                </button>
                            </React.Fragment>
                        ))}
                </div>
                <div className="flex-1" />
                <button type="button" onClick={onSearch} aria-label="Tìm sinh vật" className="pointer-events-auto grid place-items-center w-11 h-11 rounded-full bg-slate-900/60 border border-white/15 text-white backdrop-blur-md hover:bg-white/15"><Search size={18} /></button>
                <div className="pointer-events-auto">{right}</div>
            </div>
        );
    };

// ---------------------------------------------------------------- tìm kiếm
export const SearchBox: React.FC<{ world: EvoWorld; atlas: AtlasInfo | null; onPick: (i: number) => void; onClose: () => void }> = ({ world, atlas, onPick, onClose }) => {
    const [q, setQ] = useState('');
    const input = useRef<HTMLInputElement>(null);
    useEffect(() => { input.current?.focus(); }, []);
    const results = useMemo(() => searchNodes(world.tree, q, 8), [world, q]);
    const t = world.tree;
    return (
        <div className="absolute inset-0 z-50 bg-black/40" onClick={onClose}>
            <Panel className="absolute left-1/2 -translate-x-1/2 top-16 w-[min(520px,94vw)] p-3" onClose={onClose} title="🔎 Tìm sinh vật">
                <div onClick={e => e.stopPropagation()}>
                    <input ref={input} value={q} onChange={e => setQ(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && results[0] !== undefined) onPick(results[0]); if (e.key === 'Escape') onClose(); }}
                        placeholder="Gõ tên: cá mập, khủng long, nấm, người…" className="w-full h-12 px-4 rounded-2xl bg-white/10 border border-white/15 text-white placeholder:text-white/40 outline-none focus:border-amber-300/60 text-base" />
                    <div className="mt-2 max-h-[55vh] overflow-y-auto evo-scroll">
                        {results.map(i => {
                            const n = t.nodes[i];
                            const p = pathToRoot(t, i).slice(1, 3).reverse().map(k => t.nodes[k].data.label.replace(/\s*\(.*?\)/g, '')).join(' › ');
                            return (
                                <button key={i} type="button" onClick={() => onPick(i)} className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/10 text-left">
                                    <NodeIcon node={n} atlas={atlas} size={38} />
                                    <span className="min-w-0"><span className="block font-bold text-white truncate">{n.data.label}</span><span className="block text-xs text-white/50 truncate">{p}</span></span>
                                </button>
                            );
                        })}
                        {q && !results.length && <div className="p-3 text-sm text-white/60">Chưa có sinh vật này trên cây. Thử tên khác nhé!</div>}
                    </div>
                </div>
            </Panel>
        </div>
    );
};

// ---------------------------------------------------------------- lớp phủ "Nhóm theo SGK"
export const OverlayMenu: React.FC<{ active: string | null; onPick: (id: string | null) => void; onClose: () => void; compact: boolean }> = ({ active, onPick, onClose, compact }) => {
    const [info, setInfo] = useState<string | null>(null);
    const g = TEXTBOOK_GROUPS.find(x => x.id === active) ?? null;
    return (
        <>
            <Panel className={`absolute z-40 ${compact ? 'left-2 right-2 bottom-20' : 'left-3 bottom-4 w-[360px]'} p-2 pb-3`} title="📚 Nhóm theo SGK" onClose={onClose}>
                <div className="px-2 text-xs text-white/55 mb-2">Các nhóm quen thuộc trong sách giáo khoa. Tô màu để xem chúng nằm ở đâu trên cây họ hàng.</div>
                <div className="flex flex-wrap gap-1.5 px-2">
                    {TEXTBOOK_GROUPS.map(x => (
                        <button key={x.id} type="button" onClick={() => onPick(active === x.id ? null : x.id)}
                            className={`text-xs px-2.5 py-1.5 rounded-full border font-semibold ${active === x.id ? 'text-slate-950' : 'text-white/85 bg-white/6 border-white/12 hover:bg-white/12'}`}
                            style={active === x.id ? { background: x.color, borderColor: x.color } : undefined}>{x.label}</button>
                    ))}
                </div>
                {g && (
                    <div className="mx-2 mt-3 rounded-2xl bg-white/5 border border-white/10 p-3 text-sm">
                        {g.parts && <div className="flex flex-wrap gap-2 mb-2">{g.parts.map(p => <span key={p.label} className="flex items-center gap-1 text-xs"><span className="w-3 h-3 rounded-full" style={{ background: p.color }} />{p.label}</span>)}</div>}
                        <p className="text-white/80">{g.description}</p>
                        <p className="mt-2 text-amber-100/90"><b>Vì sao đây không phải một nhánh?</b> {g.why}</p>
                        {g.infographicUrl && (
                            <button type="button" onClick={() => setInfo(g.infographicUrl!)} className="mt-2 block w-full rounded-xl overflow-hidden border border-white/10 text-left">
                                <InfoThumb url={g.infographicUrl} className="h-28" />
                                <span className="block px-2 py-1 text-xs font-bold text-sky-300">Xem tranh chi tiết →</span>
                            </button>
                        )}
                    </div>
                )}
            </Panel>
            {info && <InfographicViewer url={info} onClose={() => setInfo(null)} />}
        </>
    );
};

// ---------------------------------------------------------------- sổ tay + huy hiệu
export const NotebookPanel: React.FC<{ world: EvoWorld; notebook: EvoNotebook; badges: string[]; onClose: () => void }> = ({ world, notebook, badges, onClose }) => {
    const t = world.tree;
    const seenLeaves = new Set(notebook.seen);
    return (
        <div className="absolute inset-0 z-50 bg-black/50" onClick={onClose}>
            <Panel className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(560px,94vw)] max-h-[86vh] overflow-y-auto evo-scroll p-2 pb-4" title="📓 Sổ tay hạt giống" onClose={onClose}>
                <div onClick={e => e.stopPropagation()} className="px-2">
                    <p className="text-sm text-white/60 mb-3">Mỗi sinh vật bé xem là một hạt giống. Gom đủ để nhận huy hiệu và ⭐!</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {EVO_BADGES.map(b => {
                            const got = badges.includes(b.id);
                            let progress = '';
                            if (b.sector) {
                                const total = t.leaves.filter(l => t.nodes[l].sector === b.sector).length;
                                const seen = t.leaves.filter(l => t.nodes[l].sector === b.sector && seenLeaves.has(t.nodes[l].id)).length;
                                progress = `${seen}/${Math.min(b.need!, total)}`;
                            } else if (b.id === 'key') progress = `${notebook.keySolved.length}/6 bí ẩn`;
                            else if (b.id === 'journey') progress = `${notebook.journeys.length}/1 hành trình`;
                            else progress = 'đúng 6/8 câu';
                            return (
                                <div key={b.id} className={`flex items-center gap-3 rounded-2xl p-3 border ${got ? 'bg-amber-300/15 border-amber-300/40' : 'bg-white/5 border-white/10'}`}>
                                    <span className={`text-3xl ${got ? '' : 'grayscale opacity-50'}`}>{b.icon}</span>
                                    <span><span className="block font-bold text-sm">{b.label}</span><span className="block text-xs text-white/55">{got ? 'Đã nhận ✓ · +10 ⭐' : progress}</span></span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-3 text-xs text-white/50">Đã xem {notebook.seen.length}/{t.nodes.length} nhóm trên cây.</div>
                </div>
            </Panel>
        </div>
    );
};

// ---------------------------------------------------------------- nguồn hình
interface Credit { id: string; source: string; taxon?: string; attribution?: string; license?: string; licenseUrl?: string; pageUrl?: string }
export const CreditsModal: React.FC<{ world: EvoWorld; onClose: () => void }> = ({ world, onClose }) => {
    const [list, setList] = useState<Credit[] | null>(null);
    useEffect(() => { fetch(`${import.meta.env.BASE_URL}evolution/credits.json`).then(r => r.json()).then(setList).catch(() => setList([])); }, []);
    const byLicense = useMemo(() => {
        const m = new Map<string, Credit[]>();
        for (const c of list ?? []) { const k = c.source === 'procedural' ? 'Vẽ bằng code' : c.license ?? '?'; m.set(k, [...(m.get(k) ?? []), c]); }
        return [...m.entries()];
    }, [list]);
    return (
        <div className="absolute inset-0 z-50 bg-black/50" onClick={onClose}>
            <Panel className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(640px,94vw)] max-h-[86vh] overflow-y-auto evo-scroll p-2 pb-4" title="ⓘ Nguồn hình ảnh" onClose={onClose}>
                <div onClick={e => e.stopPropagation()} className="px-2 text-sm text-white/75 space-y-3">
                    <p>Hình bóng sinh vật từ <a className="text-sky-300 underline" href="https://www.phylopic.org/" target="_blank" rel="noreferrer">PhyloPic</a> (CC0, Public Domain Mark, CC BY). Hình đã được đổi màu và tô sáng. Vi khuẩn, cổ khuẩn và vài vi sinh vật vẽ bằng code.</p>
                    {!list && <p>Đang tải…</p>}
                    {byLicense.map(([lic, items]) => (
                        <div key={lic}>
                            <div className="font-bold text-white mb-1">{lic} · {items.length} hình</div>
                            <ul className="text-xs space-y-0.5">
                                {items.map(c => {
                                    const n = world.tree.byId.get(c.id);
                                    const name = n !== undefined ? world.tree.nodes[n].data.label : c.id;
                                    return <li key={c.id}>{name}{c.taxon ? ` (${c.taxon})` : ''}{c.attribution ? <> — {c.attribution}</> : ''}{c.pageUrl && <> · <a className="text-sky-300 underline" href={c.pageUrl} target="_blank" rel="noreferrer">nguồn</a></>}{c.licenseUrl && <> · <a className="text-sky-300 underline" href={c.licenseUrl} target="_blank" rel="noreferrer">giấy phép</a></>}</li>;
                                })}
                            </ul>
                        </div>
                    ))}
                    <p className="text-xs text-white/45">Thời gian rẽ nhánh: TimeTree 5 và các mốc hóa thạch. Cây theo nghiên cứu phát sinh chủng loại mới (nhân thực mọc ra từ cổ khuẩn Asgard).</p>
                </div>
            </Panel>
        </div>
    );
};

// ---------------------------------------------------------------- chú thích sự kiện thời gian
export const EventToast: React.FC<{ event: TimeEvent | null }> = ({ event }) => {
    if (!event) return null;
    return (
        <div key={event.id} className="absolute left-1/2 top-20 -translate-x-1/2 z-40 w-[min(460px,92vw)] evo-sheet-enter-bottom pointer-events-none">
            <div className="flex items-start gap-3 rounded-2xl bg-slate-950/88 border border-amber-300/35 shadow-2xl backdrop-blur-xl p-3 text-white">
                <span className="text-3xl leading-none">{event.icon}</span>
                <span><span className="block font-extrabold text-amber-200">{event.title}</span><span className="block text-sm text-white/85">{event.text}</span></span>
            </div>
        </div>
    );
};

export const LoadingVeil: React.FC<{ visible: boolean }> = ({ visible }) => (
    <div className={`absolute inset-0 z-30 evo-veil grid place-items-center transition-opacity duration-700 ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="text-center">
            <div className="evo-seed text-5xl mb-3">🌱</div>
            <div className="text-white/80 font-bold">Đang ươm cây sự sống…</div>
        </div>
    </div>
);

export const ContextLostVeil: React.FC<{ onReload: () => void }> = ({ onReload }) => (
    <button type="button" onClick={onReload} className="absolute inset-0 z-50 evo-veil grid place-items-center text-white">
        <span className="text-center"><span className="block text-4xl mb-2">🌳</span><span className="font-bold">Cây cần nghỉ một chút. Chạm để tải lại</span></span>
    </button>
);

export { getInfographicUrl };
