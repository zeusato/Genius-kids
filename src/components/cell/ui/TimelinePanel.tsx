import React, { useEffect, useRef, useState } from 'react';
import { X, Play, Pause, RotateCcw, Volume2 } from 'lucide-react';
import type { MitosisStage } from '../../../data/mitosisStages';
import { speak } from '@/src/utils/speech';

interface TimelinePanelProps {
    heading: string;
    stages: MitosisStage[];
    read: () => { t: number; playing: boolean } | null; // object dòng thời gian mutable của scene
    autoSpeak: boolean;
    onClose: () => void;
    note?: React.ReactNode;
    finale?: React.ReactNode; // hiện khi tới bước cuối
}

function stageIndex(stages: MitosisStage[], t: number): number {
    let i = 0;
    for (let k = 0; k < stages.length; k++) if (t >= stages[k].from) i = k;
    return i;
}

// Bảng điều khiển thí nghiệm có dòng thời gian (phân chia tế bào / vi khuẩn nhân đôi). Scene tự chạy
// t trong useFrame; bảng chỉ ĐỌC t ~8 lần/giây để vẽ thanh tua và bước hiện tại, không setState theo frame.
export const TimelinePanel: React.FC<TimelinePanelProps> = ({ heading, stages, read, autoSpeak, onClose, note, finale }) => {
    const [t, setT] = useState(0);
    const [playing, setPlaying] = useState(true);
    const lastStage = useRef(-1);

    useEffect(() => {
        const id = window.setInterval(() => {
            const s = read();
            if (!s) return;
            setT(s.t);
            setPlaying(s.playing);
        }, 120);
        return () => window.clearInterval(id);
    }, [read]);

    const idx = stageIndex(stages, t);
    const stage = stages[idx];

    useEffect(() => {
        if (idx === lastStage.current) return;
        lastStage.current = idx;
        if (autoSpeak) speak(`${stage.title}. ${stage.text}`, { lang: 'vi-VN', rate: 0.92 });
    }, [idx, stage, autoSpeak]);

    const toggle = () => {
        const s = read();
        if (!s) return;
        if (!s.playing && s.t >= 1) s.t = 0;
        s.playing = !s.playing;
        setPlaying(s.playing);
    };
    const restart = () => {
        const s = read();
        if (!s) return;
        s.t = 0;
        s.playing = true;
        lastStage.current = -1;
        setT(0);
        setPlaying(true);
    };
    const scrub = (v: number) => {
        const s = read();
        if (!s) return;
        s.t = v / 1000;
        s.playing = false;
        setT(s.t);
        setPlaying(false);
    };

    return (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-3 sm:bottom-6 z-[95] w-[min(640px,96vw)] rounded-3xl border border-white/15 bg-slate-950/85 backdrop-blur-xl shadow-2xl p-4 text-white animate-[cellCardIn_0.35s_ease-out]">
            <div className="flex items-center gap-2">
                <h3 className="text-xs font-black tracking-wider text-sky-300">{heading}</h3>
                <span className="ml-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-white/10">Bước {idx + 1}/{stages.length} · {stage.phase}</span>
                <button onClick={() => speak(`${stage.title}. ${stage.text}`, { lang: 'vi-VN', rate: 0.92 })} aria-label="Đọc bước này" className="ml-auto p-1.5 rounded-lg bg-white/10 hover:bg-white/20"><Volume2 size={16} /></button>
                <button onClick={onClose} aria-label="Đóng thí nghiệm" className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20"><X size={16} /></button>
            </div>
            <p className="mt-2 text-lg font-black leading-snug">{stage.title}</p>
            <p className="mt-0.5 text-sm text-white/75 leading-relaxed min-h-[2.5rem]">{stage.text}</p>
            {idx === stages.length - 1 && finale}
            <div className="mt-3 flex items-center gap-2">
                <button onClick={toggle} aria-label={playing ? 'Tạm dừng' : 'Chạy tiếp'} className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full bg-gradient-to-r from-sky-500 to-violet-600 hover:from-sky-400 hover:to-violet-500">
                    {playing ? <Pause size={18} /> : <Play size={18} />}
                </button>
                <div className="relative flex-1">
                    <input
                        type="range"
                        min={0}
                        max={1000}
                        value={Math.round(t * 1000)}
                        onChange={(e) => scrub(Number(e.target.value))}
                        className="w-full accent-sky-400"
                        aria-label="Tua dòng thời gian"
                    />
                    <div className="absolute inset-x-0 -bottom-1.5 flex pointer-events-none">
                        {stages.map((s, i) => (
                            <span key={i} className="absolute w-1.5 h-1.5 rounded-full" style={{ left: `calc(${s.from * 100}% - 3px)`, background: i <= idx ? '#7dd3fc' : 'rgba(255,255,255,0.25)' }} />
                        ))}
                    </div>
                </div>
                <button onClick={restart} aria-label="Xem lại từ đầu" className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20"><RotateCcw size={16} /></button>
            </div>
            {note && <p className="mt-3 text-[11px] text-white/50">{note}</p>}
        </div>
    );
};

// Bảng "vi khuẩn nhân đôi mỗi 20 phút" — lũy thừa của 2 hiện ra thành đàn chấm
export const DoublingFinale: React.FC<{ rows: { label: string; count: number }[] }> = ({ rows }) => (
    <div className="mt-2 rounded-2xl border border-amber-300/30 bg-amber-400/10 p-3">
        <p className="text-xs font-black text-amber-200">⏱️ Cứ khoảng 20 phút, mỗi con lại chia đôi:</p>
        <div className="mt-2 grid grid-cols-4 sm:grid-cols-7 gap-1.5 text-center">
            {rows.map((r) => (
                <div key={r.label} className="rounded-xl bg-black/25 px-1 py-1.5">
                    <div className="text-[10px] text-white/60">{r.label}</div>
                    <div className="text-sm font-black text-amber-100 tabular-nums">{r.count.toLocaleString('vi-VN')}</div>
                </div>
            ))}
        </div>
        <p className="mt-2 text-[11px] text-white/60">1 → 2 → 4 → 8… mỗi lần gấp đôi. Vì vậy thức ăn để lâu ngoài trời rất nhanh hỏng — nhớ cất tủ lạnh nhé!</p>
    </div>
);
