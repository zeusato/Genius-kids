import React from 'react';
import { Info, Pause, Play } from 'lucide-react';
import { CATEGORY_COLORS } from '@/src/data/elementsData';
import { AROUND_INFO, COMPOSITION, type AroundId } from '@/src/data/periodic/composition';
import { HISTORY_MARKS } from '@/src/data/periodic/discovery';
import { ELEMENTS, type ElementFull } from '../engine/elements';
import { LENSES, legendFor, formatPct, type LensCtx, type LensId } from '../engine/lenses';
import { TEMP_MARKS, fracTemp, tempAtFrac, niceTemp, ROOM_TEMP } from '../engine/states';
import { fracYear, yearAtFrac, formatYear } from '../engine/history';
import { elementOfDay } from '../engine/games';
import { categoryNames } from '../PeriodicTable';

export const LensBar: React.FC<{ lens: LensId; onLens: (l: LensId) => void; hintUses?: boolean }> = ({ lens, onLens, hintUses }) => (
    <div className="flex gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar px-2 pb-1 justify-start sm:justify-center">
        {LENSES.map(l => (
            <button key={l.id} type="button" onClick={() => onLens(l.id)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs sm:text-sm border transition-all ${l.id === lens ? 'bg-cyan-400 text-slate-900 border-cyan-300 font-bold shadow-[0_0_14px_rgba(34,211,238,.6)]' : 'bg-white/5 text-white/85 border-white/15 hover:bg-white/15'} ${hintUses && l.id === 'uses' && lens !== 'uses' ? 'animate-bounce' : ''}`}>
                {l.icon} {l.label}
            </button>
        ))}
    </div>
);

const Track: React.FC<{ value: number; onChange: (f: number) => void; gradient: string; marks: { f: number; label: string }[]; label: string }> = ({ value, onChange, gradient, marks, label }) => (
    <div className="relative flex-1 min-w-[220px] pb-10">
        <div className="relative h-3.5 rounded-full" style={{ background: gradient }}>
            {marks.map((m, i) => (
                <button key={i} type="button" onClick={() => onChange(m.f)} className="absolute -translate-x-1/2 text-[10px] sm:text-[11px] text-slate-300 whitespace-nowrap leading-tight hover:text-white" style={{ left: `${m.f * 100}%`, top: i % 2 ? 36 : 20 }}>
                    <span className="block mx-auto w-px bg-slate-400 mb-0.5" style={{ height: i % 2 ? 22 : 6, marginTop: i % 2 ? -22 : -6 }} />{m.label}
                </button>
            ))}
        </div>
        <input type="range" min={0} max={1000} value={Math.round(value * 1000)} aria-label={label}
            onChange={e => onChange(Number(e.target.value) / 1000)}
            className="ptable-range absolute inset-x-0 -top-1.5 w-full h-6 appearance-none bg-transparent cursor-pointer" />
    </div>
);

interface ControlsProps {
    lens: LensId; ctx: LensCtx; onCtx: (c: Partial<LensCtx>) => void;
    playing: boolean; onPlay: () => void; onStory: () => void; storyOn: boolean; onInfo: () => void;
}

export const LensControls: React.FC<ControlsProps> = ({ lens, ctx, onCtx, playing, onPlay, onStory, storyOn, onInfo }) => {
    const legend = legendFor(lens, ctx, ELEMENTS);
    if (lens === 'group') {
        return (
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 justify-center px-2">
                {Object.entries(CATEGORY_COLORS).filter(([k]) => k !== 'unknown').map(([key, value]) => (
                    <div key={key} className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs sm:text-sm" style={{ backgroundColor: `${value.color}20`, border: `1px solid ${value.color}`, color: value.color }}>
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full" style={{ backgroundColor: value.color, boxShadow: `0 0 6px ${value.glow}` }} />
                        <span className="hidden sm:inline">{categoryNames[key] || key}</span>
                    </div>
                ))}
                <button onClick={onInfo} className="relative z-20 flex items-center justify-center w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/30" title="Xem hướng dẫn"><Info size={18} /></button>
            </div>
        );
    }
    const box = 'max-w-5xl mx-auto px-4 py-3 rounded-2xl bg-slate-900/70 border border-white/10 text-slate-100';
    const Legend = () => (
        <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center text-xs sm:text-sm mt-1">
            {legend.map((l, i) => <span key={i} className="flex items-center gap-1.5"><i className="inline-block w-3 h-3 rounded" style={{ background: l.color }} />{l.label}{l.count !== undefined && <b>{l.count}</b>}</span>)}
        </div>
    );
    if (lens === 'state') return (
        <div className={box}>
            <div className="flex flex-wrap items-center gap-3">
                <b className="whitespace-nowrap">🌡️ Nhiệt kế thần kỳ</b>
                <Track label="Nhiệt độ" value={fracTemp(ctx.tempC)} onChange={f => onCtx({ tempC: niceTemp(tempAtFrac(f)) })}
                    gradient="linear-gradient(90deg,#1e3a8a,#38bdf8 22%,#a7f3d0 30%,#fde68a 45%,#fb923c 70%,#ef4444 88%,#fff7ed)"
                    marks={TEMP_MARKS.filter(m => m.c !== 37).map(m => ({ f: fracTemp(m.c), label: `${m.icon} ${m.label}` }))} />
                <b className="text-xl sm:text-2xl tabular-nums min-w-[96px] text-right">{ctx.tempC.toLocaleString('vi-VN')} °C</b>
                <button onClick={() => onCtx({ tempC: ROOM_TEMP })} className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs">🏠 Nhiệt độ phòng</button>
                <button onClick={() => onCtx({ tempC: 37 })} className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs">✋ Tay em 37°</button>
            </div>
            <Legend />
        </div>
    );
    if (lens === 'history') return (
        <div className={box}>
            <div className="flex flex-wrap items-center gap-3">
                <b className="whitespace-nowrap">🕰️ Cỗ máy thời gian</b>
                <button onClick={onPlay} className="w-9 h-9 grid place-items-center rounded-full bg-amber-300 text-slate-900" aria-label={playing ? 'Dừng' : 'Chạy'}>{playing ? <Pause size={18} /> : <Play size={18} />}</button>
                <Track label="Năm" value={fracYear(ctx.year)} onChange={f => onCtx({ year: yearAtFrac(f) })}
                    gradient="linear-gradient(90deg,#78350f,#b45309 30%,#0e7490 60%,#6d28d9 85%,#db2777)"
                    marks={HISTORY_MARKS.map(m => ({ f: fracYear(m.year), label: m.label }))} />
                <b className="text-xl sm:text-2xl tabular-nums min-w-[96px] text-right">{formatYear(ctx.year)}</b>
            </div>
            <Legend />
        </div>
    );
    if (lens === 'origin') return (
        <div className={box}>
            <div className="flex flex-wrap items-center justify-between gap-2">
                <b>✨ Các nguyên tố được "nấu" ở đâu trong vũ trụ?</b>
                <button onClick={onStory} className="px-4 py-1.5 rounded-full bg-yellow-300 text-indigo-950 font-bold text-sm">{storyOn ? '⏹ Dừng kể' : '▶ Xem chuyện của vũ trụ'}</button>
            </div>
            <Legend />
            <p className="text-[11px] text-white/45 text-center mt-1">Tỉ lệ gần đúng theo J. A. Johnson, Science 2019</p>
        </div>
    );
    if (lens === 'around') {
        const comp = COMPOSITION[ctx.around];
        const top = Object.entries(comp).sort((a, b) => b[1] - a[1]).slice(0, 6);
        const byZ = (z: string) => ELEMENTS[Number(z) - 1];
        return (
            <div className={box}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <b>{AROUND_INFO[ctx.around].icon} {AROUND_INFO[ctx.around].title}</b>
                    <div className="flex gap-1">
                        {(Object.keys(AROUND_INFO) as AroundId[]).map(a => (
                            <button key={a} onClick={() => onCtx({ around: a })} className={`px-3 py-1 rounded-full text-xs ${a === ctx.around ? 'bg-emerald-400 text-slate-900 font-bold' : 'bg-white/10 hover:bg-white/20'}`}>{AROUND_INFO[a].icon} {AROUND_INFO[a].label}</button>
                        ))}
                    </div>
                </div>
                <div className="flex h-4 rounded-full overflow-hidden mt-2">
                    {top.map(([z, p], i) => <div key={z} title={`${byZ(z).sgkName} ${formatPct(p)}`} style={{ flex: p, background: ['#34d399', '#10b981', '#059669', '#047857', '#065f46', '#064e3b'][i] }} />)}
                </div>
                <p className="text-xs sm:text-sm text-center mt-1 text-white/80">{top.map(([z, p]) => `${byZ(z).sgkName} ${formatPct(p)}`).join(' · ')}</p>
            </div>
        );
    }
    if (lens === 'uses') return <div className={box + ' text-center text-sm'}>🏠 <b>Nguyên tố quanh nhà em</b> — mỗi hình là một thứ em gặp hằng ngày. Chạm vào hình để nghe và mở nguyên tố.</div>;
    return <div className={box}><Legend />{lens === 'metal' && <p className="text-xs text-center text-white/60 mt-1">Kim loại sáng bóng, dẫn điện và dẫn nhiệt tốt — dây điện làm bằng đồng là vì thế!</p>}</div>;
};

const LENS_TIP: Record<LensId, string> = {
    group: 'Chạm vào một ô để mở mẫu vật, làm thí nghiệm và lặn vào nguyên tử.',
    state: 'Kéo nhiệt kế: nguyên tố nào tan chảy, nguyên tố nào sôi thành hơi?',
    uses: 'Mỗi hình là một thứ quanh nhà em có nguyên tố đó.',
    origin: 'Mọi nguyên tố được "nấu" trong các vì sao — trừ vài nguyên tố do con người tạo ra.',
    history: 'Kéo về năm 1869 để thấy ba ô Mendeleev để trống!',
    around: 'Chỉ vài nguyên tố làm nên cơ thể em, không khí và Trái Đất.',
    metal: 'Đường bậc thang chia kim loại (bên trái) và phi kim (bên phải).',
    radioactive: 'Các ô sáng lục không có dạng bền — hạt nhân của chúng tự vỡ dần.',
};

export const TableBay: React.FC<{ hover: ElementFull | null; lens: LensId; onOpen: (e: ElementFull) => void; avatar?: React.ReactNode; caption?: string | null }> = ({ hover, lens, onOpen, avatar, caption }) => {
    const e = hover ?? null;
    const day = elementOfDay(ELEMENTS);
    if (caption) return (
        <div className="w-full h-full grid place-items-center text-center px-4">
            <div>
                {avatar}
                <p className="text-base sm:text-xl font-bold text-white drop-shadow-[0_0_12px_rgba(253,230,138,.8)] ptable-fade-in">{caption}</p>
            </div>
        </div>
    );
    const show = e ?? day;
    const c = CATEGORY_COLORS[show.category].color;
    return (
        <div className="w-full h-full flex items-center gap-3 sm:gap-4 px-2 sm:px-4 pointer-events-auto">
            <button onClick={() => onOpen(show)} className="shrink-0 w-[4.5rem] h-[4.5rem] sm:w-24 sm:h-24 rounded-2xl flex flex-col items-center justify-center" style={{ background: `${c}22`, border: `3px solid ${c}`, boxShadow: `0 0 18px ${c}80`, color: c }}>
                <span className="text-[10px] sm:text-xs opacity-70">{show.atomicNumber}</span>
                <span className="text-2xl sm:text-4xl font-bold leading-none">{show.symbol}</span>
                <span className="text-lg sm:text-2xl leading-none mt-0.5">{show.uses[0]?.emoji}</span>
            </button>
            <div className="min-w-0 text-left">
                <p className="text-[10px] sm:text-xs uppercase tracking-wide text-white/50">{e ? categoryNames[show.category] : '⭐ Nguyên tố của ngày'}</p>
                <p className="text-sm sm:text-lg font-bold truncate" style={{ color: c }}>{show.sgkName}{show.oldName !== show.sgkName && <span className="text-white/40 font-normal text-xs sm:text-sm"> · {show.oldName}</span>}</p>
                <p className="text-[11px] sm:text-sm text-white/75 line-clamp-2">{show.kid}</p>
                {!e && <p className="text-[10px] sm:text-xs text-cyan-300/80 mt-0.5 hidden sm:block">{LENS_TIP[lens]}</p>}
            </div>
        </div>
    );
};
