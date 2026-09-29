// Trò chơi trên bảng (🔎 Truy tìm, 🧭 Tọa độ) + trò trong khung (⚖️ Ai nặng hơn?, 🌡️ Rắn-lỏng-khí?).
// Chạm ô khi đang chơi được trang chuyển vào `onCell` của trò đang mở.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { SpeakButton } from '../../shared/SpeakButton';
import { speak } from '@/src/utils/speech';
import { playBlip, playSuccess } from '../../solar/sfx';
import { ELEMENTS, byZ, type ElementFull } from '../engine/elements';
import { coordRound, findRound, HEAVY_PAIRS, heavier, stateQuestion } from '../engine/games';
import { STATE_STYLE } from '../engine/lenses';
import type { MatterState } from '../engine/states';
import type { CellMark } from '../ElementCell';

export type GameId = 'find' | 'coord' | 'scale' | 'state';
export const GAMES: { id: GameId; icon: string; label: string; desc: string }[] = [
    { id: 'find', icon: '🔎', label: 'Truy tìm', desc: 'Nghe câu đố, chạm đúng ô' },
    { id: 'coord', icon: '🧭', label: 'Tọa độ', desc: 'Chu kỳ mấy, nhóm mấy?' },
    { id: 'scale', icon: '⚖️', label: 'Ai nặng hơn?', desc: 'Cân hai khối 1 cm³' },
    { id: 'state', icon: '🌡️', label: 'Rắn, lỏng hay khí?', desc: 'Đoán thể ở nhiệt độ lạ' },
];

interface TableGameProps {
    easy: boolean;
    register: (fn: ((e: ElementFull) => void) | null) => void;
    setMarks: (m: Map<number, CellMark>) => void;
    onDone: (score: number) => void;
    onClose: () => void;
}

const Banner: React.FC<React.PropsWithChildren<{ title: string; progress: string; onClose: () => void }>> = ({ title, progress, onClose, children }) => (
    <div className="fixed left-1/2 top-3 z-[58] -translate-x-1/2 w-[min(680px,94vw)] rounded-2xl bg-slate-900/92 backdrop-blur-md border border-amber-300/40 shadow-2xl p-3 text-slate-100">
        <div className="flex items-center gap-2">
            <b className="text-amber-200">{title}</b><span className="text-xs text-white/50">{progress}</span>
            <div className="flex-1" /><button onClick={onClose} className="w-8 h-8 grid place-items-center rounded-full bg-white/10 hover:bg-white/20" aria-label="Thoát"><X size={16} /></button>
        </div>
        <div className="mt-1">{children}</div>
    </div>
);

export const FindGame: React.FC<TableGameProps> = ({ easy, register, setMarks, onDone, onClose }) => {
    const round = useMemo(() => findRound(easy, Date.now() % 100000), [easy]);
    const [i, setI] = useState(0);
    const [score, setScore] = useState(0);
    const [msg, setMsg] = useState<string | null>(null);
    const miss = useRef(false);
    const clue = round[i];
    useEffect(() => {
        register(e => {
            if (!clue) return;
            if (e.atomicNumber === clue.z) {
                playSuccess();
                setMarks(new Map([[e.atomicNumber, 'ok']]));
                const ns = score + (miss.current ? 0 : 1);
                setScore(ns);
                setMsg(`Đúng rồi! Đó là ${e.sgkName}.`);
                speak(`Đúng rồi! Đó là ${e.sgkName}.`, { rate: 0.92 });
                window.setTimeout(() => {
                    setMarks(new Map()); setMsg(null); miss.current = false;
                    if (i + 1 >= round.length) onDone(ns); else setI(i + 1);
                }, 1600);
            } else {
                playBlip();
                miss.current = true;
                setMarks(new Map([[e.atomicNumber, 'bad']]));
                setMsg(`Đây là ${e.sgkName} — ${e.uses[0]?.text ?? ''}. Thử lại nhé!`);
                speak(`Đây là ${e.sgkName}. Thử lại nhé!`, { rate: 0.92 });
                window.setTimeout(() => setMarks(new Map()), 1200);
            }
        });
        return () => register(null);
    }, [clue, i, score, round.length, register, setMarks, onDone]);
    if (!clue) return <Banner title="🔎 Truy tìm" progress="" onClose={onClose}><p>Hết câu! Em đúng {score}/{round.length} câu.</p></Banner>;
    return (
        <Banner title="🔎 Truy tìm nguyên tố" progress={`câu ${i + 1}/${round.length} · đúng ${score}`} onClose={onClose}>
            <div className="flex items-center gap-2">
                <p className="flex-1 text-base sm:text-lg">"{clue.text}"</p>
                <SpeakButton text={clue.text} autoPlay autoPlayKey={i} />
            </div>
            {msg && <p className="text-sm text-amber-200 mt-1">{msg}</p>}
        </Banner>
    );
};

export const CoordGame: React.FC<TableGameProps> = ({ easy, register, setMarks, onDone, onClose }) => {
    const round = useMemo(() => coordRound(ELEMENTS, Date.now() % 100000, 8, easy ? 3 : 5), [easy]);
    const [i, setI] = useState(0), [score, setScore] = useState(0), [msg, setMsg] = useState<string | null>(null);
    const miss = useRef(false);
    const q = round[i];
    const text = q ? `Chu kỳ ${q.period}, nhóm ${q.group} là nguyên tố nào?` : '';
    useEffect(() => {
        register(e => {
            if (!q) return;
            if (e.atomicNumber === q.atomicNumber) {
                playSuccess(); setMarks(new Map([[e.atomicNumber, 'ok']]));
                const ns = score + (miss.current ? 0 : 1); setScore(ns); setMsg(`Đúng! ${e.sgkName} ở hàng ${q.period}, cột ${q.group}.`);
                window.setTimeout(() => { setMarks(new Map()); setMsg(null); miss.current = false; if (i + 1 >= round.length) onDone(ns); else setI(i + 1); }, 1400);
            } else {
                playBlip(); miss.current = true; setMarks(new Map([[e.atomicNumber, 'bad']]));
                setMsg(e.group > 0 ? `${e.sgkName} ở chu kỳ ${e.period}, nhóm ${e.group}. Chu kỳ là HÀNG ngang, nhóm là CỘT dọc.` : 'Ô này nằm ở hàng dưới cùng — thử bảng chính nhé.');
                window.setTimeout(() => setMarks(new Map()), 1200);
            }
        });
        return () => register(null);
    }, [q, i, score, round.length, register, setMarks, onDone]);
    if (!q) return <Banner title="🧭 Tọa độ" progress="" onClose={onClose}><p>Xong! Đúng {score}/{round.length}.</p></Banner>;
    return (
        <Banner title="🧭 Tọa độ nguyên tố" progress={`câu ${i + 1}/${round.length} · đúng ${score}`} onClose={onClose}>
            <div className="flex items-center gap-2"><p className="flex-1 text-base sm:text-lg">{text}</p><SpeakButton text={text} autoPlay autoPlayKey={i} /></div>
            {msg && <p className="text-sm text-amber-200 mt-1">{msg}</p>}
        </Banner>
    );
};

const Cube: React.FC<{ e: ElementFull; onPick: () => void; y: number; reveal: boolean }> = ({ e, onPick, y, reveal }) => (
    <button onClick={onPick} className="flex flex-col items-center gap-1 transition-transform duration-700" style={{ translate: `0 ${y}px` }}>
        <span className="w-20 h-20 rounded-xl grid place-items-center text-2xl font-bold shadow-xl" style={{ background: `linear-gradient(135deg, ${e.specimen.color}, #1f2937)`, color: '#fff', textShadow: '0 1px 3px #000' }}>{e.symbol}</span>
        <span className="text-sm">{e.sgkName}</span>
        {reveal && <span className="text-xs text-amber-200">{e.density?.toLocaleString('vi-VN')} g</span>}
    </button>
);

export const ScaleGame: React.FC<{ onClose: () => void; onDone: (s: number) => void }> = ({ onClose, onDone }) => {
    const [i, setI] = useState(0), [score, setScore] = useState(0), [pick, setPick] = useState<number | null>(null);
    const pair = HEAVY_PAIRS[i];
    if (!pair) return <Frame title="⚖️ Ai nặng hơn?" onClose={onClose}><p className="text-center">Em đoán đúng {score}/{HEAVY_PAIRS.length} lần!</p></Frame>;
    const a = byZ(pair[0])!, b = byZ(pair[1])!, h = heavier(a, b);
    const tilt = pick === null ? 0 : h === a ? -1 : 1;
    const choose = (e: ElementFull) => {
        if (pick !== null) return;
        setPick(e.atomicNumber);
        const ok = e === h; if (ok) { playSuccess(); setScore(score + 1); } else playBlip();
        speak(ok ? `Đúng! ${h.sgkName} nặng hơn.` : `Ồ, ${h.sgkName} mới nặng hơn!`, { rate: 0.92 });
        window.setTimeout(() => { setPick(null); if (i + 1 >= HEAVY_PAIRS.length) onDone(score + (ok ? 1 : 0)); setI(i + 1); }, 2200);
    };
    return (
        <Frame title="⚖️ Ai nặng hơn? (hai khối cùng cỡ 1 cm³)" onClose={onClose}>
            <div className="relative h-52 flex items-end justify-center">
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-28 bg-slate-500 rounded" />
                <div className="absolute bottom-28 left-1/2 w-[300px] h-2 bg-slate-300 rounded origin-center transition-transform duration-700" style={{ translate: '-50% 0', rotate: `${tilt * 12}deg` }} />
                <div className="absolute bottom-28 left-1/2 w-[300px] flex justify-between transition-transform duration-700" style={{ translate: '-50% 0', rotate: `${tilt * 12}deg` }}>
                    <Cube e={a} onPick={() => choose(a)} y={0} reveal={pick !== null} />
                    <Cube e={b} onPick={() => choose(b)} y={0} reveal={pick !== null} />
                </div>
            </div>
            <p className="text-center text-sm text-white/70">Chạm vào khối em nghĩ là NẶNG hơn · {i + 1}/{HEAVY_PAIRS.length} · đúng {score}</p>
        </Frame>
    );
};

export const StateGame: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [seed, setSeed] = useState(() => Date.now() % 9999);
    const q = useMemo(() => stateQuestion(ELEMENTS, seed), [seed]);
    const [ans, setAns] = useState<MatterState | null>(null);
    const text = `Ở ${q.c.toLocaleString('vi-VN')} °C, ${q.e.sgkName} là rắn, lỏng hay khí?`;
    const choose = (s: MatterState) => { if (ans) return; setAns(s); if (s === q.answer) playSuccess(); else playBlip(); };
    return (
        <Frame title="🌡️ Rắn, lỏng hay khí?" onClose={onClose}>
            <div className="flex items-center gap-2 justify-center"><p className="text-lg text-center">{text}</p><SpeakButton text={text} autoPlay autoPlayKey={seed} /></div>
            <div className="flex gap-2 justify-center mt-3">
                {(['solid', 'liquid', 'gas'] as MatterState[]).map(s => (
                    <button key={s} onClick={() => choose(s)} className={`px-4 py-2 rounded-xl border text-sm font-bold ${ans ? (s === q.answer ? 'bg-emerald-400 text-slate-900' : s === ans ? 'bg-rose-400/60' : 'bg-white/5') : 'bg-white/10 hover:bg-white/20'}`} style={{ borderColor: STATE_STYLE[s].color }}>{STATE_STYLE[s].icon} {STATE_STYLE[s].label}</button>
                ))}
            </div>
            {ans && (
                <div className="text-center mt-3 text-sm">
                    <p>{q.answer === ans ? 'Chính xác!' : `Đáp án: ${STATE_STYLE[q.answer].label}.`} {q.e.sgkName} chảy ở {Math.round(q.e.meltingPoint!).toLocaleString('vi-VN')} °C{q.e.boilingPoint !== undefined ? `, sôi ở ${Math.round(q.e.boilingPoint).toLocaleString('vi-VN')} °C` : ''}.</p>
                    <button onClick={() => { setAns(null); setSeed(seed + 1); }} className="mt-2 px-4 py-1.5 rounded-full bg-amber-300 text-slate-900 font-bold">Câu khác →</button>
                </div>
            )}
        </Frame>
    );
};

export const Frame: React.FC<React.PropsWithChildren<{ title: string; onClose: () => void; wide?: boolean }>> = ({ title, onClose, wide, children }) => (
    <div className="fixed inset-0 z-[60] bg-black/60 grid place-items-center p-3" onClick={onClose}>
        <div onClick={e => e.stopPropagation()} className={`w-full ${wide ? 'max-w-4xl' : 'max-w-xl'} max-h-[88vh] overflow-y-auto ptable-scroll rounded-3xl bg-slate-900/95 border border-white/15 shadow-2xl p-4 text-slate-100`}>
            <div className="flex items-center gap-2 mb-3"><b className="text-lg">{title}</b><div className="flex-1" /><button onClick={onClose} className="w-9 h-9 grid place-items-center rounded-full bg-white/10 hover:bg-white/20" aria-label="Đóng"><X size={18} /></button></div>
            {children}
        </div>
    </div>
);
