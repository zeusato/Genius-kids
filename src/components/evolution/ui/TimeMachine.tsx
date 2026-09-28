import React, { useEffect, useRef, useState } from 'react';
import { Pause, Play, SkipBack, X, CalendarDays, Ruler } from 'lucide-react';
import type { EvoWorld } from '../scene/world';
import { TIME_EVENTS } from '../../../data/evolution/events';
import { cosmicDate, ERA_BANDS, frac, maAtFrac, shortMa } from '../engine/timeScale';

interface Props {
    world: EvoWorld;
    trueScale: boolean;
    onTrueScale: (on: boolean) => void;
    onClose: () => void;
    compact: boolean;
}

const PLAY_SECONDS = 30;

// Thanh thời gian: vị trí trên thanh = bán kính chuẩn hóa f (khớp đúng với bán kính cây).
// Núm cập nhật bằng rAF đọc world.nowMa — không setState theo frame (chỉ ghi DOM qua ref).
export const TimeMachine: React.FC<Props> = ({ world, trueScale, onTrueScale, onClose, compact }) => {
    const track = useRef<HTMLDivElement>(null);
    const thumb = useRef<HTMLDivElement>(null);
    const label = useRef<HTMLSpanElement>(null);
    const [calendar, setCalendar] = useState(false);
    const [playing, setPlaying] = useState(false);
    const dragging = useRef(false);
    const calRef = useRef(calendar);
    calRef.current = calendar;

    useEffect(() => {
        let raf = 0;
        const tick = () => {
            const f = world.nowMa <= 0 ? 1 : frac(world.nowMa, world.mix);
            if (thumb.current) thumb.current.style.left = `${f * 100}%`;
            if (label.current) label.current.textContent = calRef.current ? `Lịch 1 năm: ${cosmicDate(world.nowMa).text}` : shortMa(world.nowMa);
            if (playing && !world.timeAnimating) setPlaying(false);
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [world, playing]);

    const setFromPointer = (clientX: number) => {
        const r = track.current!.getBoundingClientRect();
        const f = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
        world.setNow(f >= 0.998 ? 0 : maAtFrac(f, world.mix));
        setPlaying(false);
    };

    const play = () => {
        if (playing) { world.stopTimeAnim(); setPlaying(false); return; }
        if (world.nowMa <= 0) world.setNow(4540);
        const f0 = frac(world.nowMa, world.mix);
        world.animateNowTo(0, Math.max(2, PLAY_SECONDS * (1 - f0)));
        setPlaying(true);
    };

    const bands = ERA_BANDS.map(b => ({ ...b, a: frac(b.fromMa, world.mix), z: frac(b.toMa, world.mix) }));

    return (
        <div className={`absolute left-1/2 -translate-x-1/2 ${compact ? 'bottom-20 w-[94vw]' : 'bottom-4 w-[min(860px,92vw)]'} z-40 rounded-3xl bg-slate-950/90 border border-white/12 shadow-2xl backdrop-blur-xl text-white p-3`}
            onPointerDown={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">⏳</span>
                <span className="font-extrabold text-sm">Cỗ máy thời gian</span>
                <span ref={label} className="ml-2 text-sm font-bold text-amber-200 tabular-nums" />
                <div className="flex-1" />
                <button type="button" onClick={() => setCalendar(v => !v)} title="Nếu lịch sử Trái Đất là 1 năm" className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs ${calendar ? 'bg-amber-300 text-amber-950' : 'bg-white/10'}`}><CalendarDays size={14} />{!compact && 'Lịch 1 năm'}</button>
                <button type="button" onClick={() => onTrueScale(!trueScale)} title="Thời gian đúng tỉ lệ" className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs ${trueScale ? 'bg-amber-300 text-amber-950' : 'bg-white/10'}`}><Ruler size={14} />{!compact && 'Thời gian thật'}</button>
                <button type="button" onClick={onClose} aria-label="Đóng cỗ máy thời gian" className="w-8 h-8 grid place-items-center rounded-full hover:bg-white/10"><X size={16} /></button>
            </div>
            <div className="flex items-center gap-2">
                <button type="button" onClick={() => { world.setNow(4540); setPlaying(false); }} aria-label="Về lúc Trái Đất ra đời" className="w-9 h-9 grid place-items-center rounded-full bg-white/10 hover:bg-white/20"><SkipBack size={16} /></button>
                <button type="button" onClick={play} aria-label={playing ? 'Dừng' : 'Chạy tới hôm nay'} className="w-11 h-11 grid place-items-center rounded-full bg-amber-400 text-amber-950 shadow-lg">{playing ? <Pause size={20} /> : <Play size={20} />}</button>
                <div className="flex-1 relative pt-5 pb-1 select-none">
                    {/* biểu tượng sự kiện */}
                    {TIME_EVENTS.map(ev => (
                        <button key={ev.id} type="button" title={ev.title} onClick={() => { world.animateNowTo(ev.ma, 1.2); setPlaying(false); }}
                            className="absolute top-0 -translate-x-1/2 text-[13px] leading-none hover:scale-125 transition-transform" style={{ left: `${frac(ev.ma, world.mix) * 100}%` }}>{ev.icon}</button>
                    ))}
                    <div ref={track} className="relative h-4 rounded-full overflow-hidden cursor-pointer touch-none"
                        onPointerDown={e => { dragging.current = true; (e.target as HTMLElement).setPointerCapture?.(e.pointerId); setFromPointer(e.clientX); }}
                        onPointerMove={e => { if (dragging.current) setFromPointer(e.clientX); }}
                        onPointerUp={() => { dragging.current = false; }}>
                        {bands.map(b => <div key={b.name} className="absolute inset-y-0" title={b.name} style={{ left: `${b.a * 100}%`, width: `${(b.z - b.a) * 100}%`, background: b.color, filter: 'brightness(1.8) saturate(1.3)' }} />)}
                    </div>
                    <div ref={thumb} className="absolute top-[18px] w-5 h-5 -ml-2.5 rounded-full bg-white border-2 border-amber-400 shadow-[0_0_14px_rgba(253,230,138,0.9)] pointer-events-none" />
                    {!compact && (
                        <div className="relative h-4 mt-1 text-[10px] text-white/45">
                            {bands.map(b => <span key={b.name} className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `${((b.a + b.z) / 2) * 100}%` }}>{b.name}</span>)}
                        </div>
                    )}
                </div>
            </div>
            {trueScale && <div className="mt-2 text-xs text-amber-100/90">Thời gian đúng tỉ lệ: hơn 3 tỷ năm đầu gần như chỉ có vi sinh vật!</div>}
        </div>
    );
};
