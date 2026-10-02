import React, { useEffect, useRef, useState } from 'react';
import { BookOpen, CalendarHeart, Check, Image, PlayCircle, RefreshCcw, Settings2, Star, Users } from 'lucide-react';
import type { GateId, Riddle } from '../content/types';
import { GATES, GATE_MAP, GATE_STONES } from '../content/gates';
import { gateCounts, gateStones, journeyGate, localDay, roundSize } from '../engine/planner';
import type { RiddleProgress } from '../progress/model';
import type { RoundState } from '../engine/round';
import { GateArch } from './GateArch';
import { Sphinx } from './Sphinx';
import { useVoice } from './voice';

/** Cảnh ốc đảo nhiều lớp, lệch nhẹ theo con trỏ (tắt khi giảm chuyển động). */
function Oasis({ children }: { children: React.ReactNode }) {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const el = ref.current;
        if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const move = (e: PointerEvent) => {
            const r = el.getBoundingClientRect();
            el.style.setProperty('--px', String(((e.clientX - r.left) / r.width - 0.5).toFixed(3)));
            el.style.setProperty('--py', String(((e.clientY - r.top) / r.height - 0.5).toFixed(3)));
        };
        el.addEventListener('pointermove', move);
        return () => el.removeEventListener('pointermove', move);
    }, []);
    return (
        <div className="rd-oasis" ref={ref}>
            <svg className="rd-oasis-bg" viewBox="0 0 800 420" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
                <defs>
                    <linearGradient id="rd-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f9e7c4" /><stop offset=".6" stopColor="#fbefd9" /><stop offset="1" stopColor="#f6e2bc" /></linearGradient>
                    <radialGradient id="rd-sun" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#ffe6a3" /><stop offset=".55" stopColor="#ffd77a" stopOpacity=".55" /><stop offset="1" stopColor="#ffd77a" stopOpacity="0" /></radialGradient>
                </defs>
                <rect width="800" height="420" fill="url(#rd-sky)" />
                <g className="rd-layer rd-l0"><circle cx="610" cy="96" r="90" fill="url(#rd-sun)" /><circle cx="610" cy="96" r="34" fill="#ffe2a0" /></g>
                <g className="rd-layer rd-l1" fill="#ecd3a6">
                    <path d="M420 300 L520 168 L620 300 Z" /><path d="M520 168 L620 300 L560 300 Z" fill="#dfbf8a" />
                    <path d="M590 300 L660 210 L730 300 Z" /><path d="M660 210 L730 300 L690 300 Z" fill="#dfbf8a" />
                </g>
                <g className="rd-layer rd-l2"><path d="M0 300 C140 250 260 270 400 292 C540 314 660 262 800 280 V420 H0 Z" fill="#efd6a8" /></g>
                <g className="rd-layer rd-l3">
                    {[[704, 304, 1], [752, 318, 0.8], [96, 316, 0.9]].map(([x, y, k], i) => (
                        <g key={i} transform={`translate(${x} ${y}) scale(${k})`} className="rd-palm">
                            <path d="M0 0 C4 -40 2 -80 -6 -120" stroke="#9a7148" strokeWidth="9" fill="none" strokeLinecap="round" />
                            {[-150, -110, -60, -20, 20].map(a => <path key={a} d="M-6 -120 q40 -14 70 10 q-36 -4 -70 -10z" fill="#5f9a6c" transform={`rotate(${a + 90} -6 -120)`} />)}
                        </g>
                    ))}
                    <path d="M0 340 C180 310 300 330 470 344 C620 356 720 330 800 336 V420 H0 Z" fill="#e7c48d" />
                    <ellipse cx="650" cy="352" rx="70" ry="10" fill="#8fc4c0" opacity=".8" />
                </g>
            </svg>
            {children}
        </div>
    );
}

export function Home({ name, grade, progress, pool, draft, onStart, onResume, onAlbum, onFamily, onPicture, onSettings }: {
    name: string; grade: number; progress: RiddleProgress; pool: Riddle[]; draft: RoundState | null;
    onStart: (kind: 'journey' | 'gate' | 'review' | 'daily', gate?: GateId) => void; onResume: () => void;
    onAlbum: () => void; onFamily: () => void; onPicture: () => void; onSettings: () => void;
}) {
    const voice = useVoice();
    const next = journeyGate(progress, grade, pool);
    const gate = next ? GATE_MAP.get(next)! : GATES[0];
    const lit = next ? gateStones(progress, next, pool) : GATE_STONES;
    const draftGateId = draft ? (draft.gate ?? pool.find(r => r.id === draft.items[0].id)?.gate) : undefined;
    const draftGate = draftGateId ? GATE_MAP.get(draftGateId)! : gate;
    const solvedCount = Object.values(progress.solved).filter(s => s.seals > 0).length;
    const due = progress.review.filter(r => r.due <= new Date().toISOString()).length;
    const today = localDay();
    const dailyDone = progress.daily?.date === today && progress.daily.done;
    const first = solvedCount === 0;
    const greet = first
        ? `Chào ${name}! Ta là Nhân Sư, người gác những cánh cổng câu đố. Giải đố để thắp sáng đá cổng nhé!`
        : draft ? `${name} ơi, chặng đố hôm trước vẫn đang chờ em đấy!` : `Chào ${name}! Hôm nay ${gate.title} đang chờ em.`;
    const [hello, setHello] = useState(false);
    useEffect(() => { if (progress.settings.autoRead) { setHello(true); voice.say([{ text: greet }], () => setHello(false)); } }, []); // eslint-disable-line react-hooks/exhaustive-deps
    const eligibleGates = GATES.filter(g => g.minGrade <= grade || progress.gates[g.id] || gateCounts(progress, g.id, pool).solved);
    const lockedGates = GATES.filter(g => !eligibleGates.includes(g));

    return (
        <div className="rd-home">
            <section className="rd-hero">
                <Oasis>
                    <div className="rd-hero-host">
                        <Sphinx mood={hello ? 'idle' : 'idle'} talking={voice.speaking} size={230} />
                        <p className="rd-bubble rd-bubble-hero">{greet}</p>
                    </div>
                    <button className="rd-icon rd-hero-settings" onClick={onSettings} aria-label="Cài đặt Đố Vui"><Settings2 size={20} /></button>
                </Oasis>
                <div className="rd-hero-side">
                    {draft ? (
                        <button className="rd-journey" onClick={onResume}>
                            <GateArch stone={draftGate.stone} accent={draftGate.accent} lit={gateStones(progress, draftGate.id, pool)} glyph={draftGate.glyph} size={104} />
                            <span><small>CHẶNG ĐANG DỞ · {draftGate.title.toUpperCase()}</small><strong>Tiếp tục câu {draft.index + 1}/{draft.items.length}</strong><em>Em dừng ở giữa chặng, chơi tiếp nhé</em></span>
                            <PlayCircle className="rd-journey-go" size={44} />
                        </button>
                    ) : (
                        <button className="rd-journey" onClick={() => onStart('journey')} disabled={!next}>
                            <GateArch stone={gate.stone} accent={gate.accent} lit={lit} glyph={gate.glyph} size={104} />
                            <span><small>HÀNH TRÌNH · {lit}/{GATE_STONES} ĐÁ</small><strong>{next ? gate.title : 'Em đã mở mọi cổng!'}</strong><em>{roundSize(grade)} câu đố · khoảng 4 phút</em></span>
                            <PlayCircle className="rd-journey-go" size={44} />
                        </button>
                    )}
                    <button className={`rd-daily${dailyDone ? ' is-done' : ''}`} onClick={() => onStart('daily')}>
                        <CalendarHeart size={28} />
                        <span><strong>Câu đố hôm nay</strong><small>{dailyDone ? 'Em đã giải rồi! Đố lại cả nhà nhé' : 'Cả nhà cùng một câu · +2 sao'}</small></span>
                        {dailyDone ? <Check size={22} /> : <Star size={20} fill="currentColor" />}
                    </button>
                    <div className="rd-quick">
                        <button onClick={onAlbum}><BookOpen size={22} /><span>Sổ Đố</span><small>{solvedCount} câu</small></button>
                        <button onClick={() => onStart('review')} disabled={!progress.review.length}><RefreshCcw size={22} /><span>Ôn lại</span><small>{due ? `${due} câu đến hạn` : `${progress.review.length} câu`}</small></button>
                        <button onClick={onPicture}><Image size={22} /><span>Đố hình</span><small>Bóng, lỗ khoá</small></button>
                        <button onClick={onFamily}><Users size={22} /><span>Đố cả nhà</span><small>Cùng một máy</small></button>
                    </div>
                </div>
            </section>

            <section className="rd-gates" aria-labelledby="rd-gates-title">
                <div className="rd-section-head"><h2 id="rd-gates-title">Các cánh cổng</h2><p>Mỗi cổng có {GATE_STONES} viên đá. Giải đúng một câu mới là thắp một viên.</p></div>
                <div className="rd-gate-grid">
                    {[...eligibleGates, ...lockedGates].map(g => {
                        const c = gateCounts(progress, g.id, pool);
                        const stones = gateStones(progress, g.id, pool);
                        const locked = lockedGates.includes(g);
                        return (
                            <button key={g.id} className={`rd-gate${progress.gates[g.id] ? ' is-open' : ''}${g.id === next ? ' is-next' : ''}`} style={{ ['--gate' as string]: g.accent, ['--stone' as string]: g.stone }} onClick={() => onStart('gate', g.id)} disabled={!c.total}>
                                <GateArch stone={g.stone} accent={g.accent} lit={stones} open={!!progress.gates[g.id]} glyph={g.glyph} size={78} />
                                <span className="rd-gate-text">
                                    <strong>{g.title}</strong>
                                    <small>{g.blurb}</small>
                                    <em>{locked ? `Dành cho lớp ${g.minGrade}+ · vẫn chơi thử được` : `${c.solved}/${c.total} câu`}</em>
                                </span>
                            </button>
                        );
                    })}
                </div>
            </section>
        </div>
    );
}
