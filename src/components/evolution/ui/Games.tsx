import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play, SkipForward, X } from 'lucide-react';
import type { EvoWorld, AtlasInfo } from '../scene/world';
import type { CameraApi } from '../scene/CameraRig';
import { KID } from '../../../data/evolution/kid';
import { JOURNEY, KEY_PASS, KEY_START, KeyNext, MYSTERY_KEY, MYSTERY_NAMES, RELATIVES_BANK, RELATIVES_PASS, RELATIVES_ROUND } from '../../../data/evolution/games';
import { idx, mrca } from '../engine/tree';
import { ancestorTime } from '../engine/times';
import { journeyStops, keyStep, keyTruth, mulberry32, pickRound } from '../engine/games';
import { NodeIcon, Panel } from './common';
import { playSuccess, playBlip } from '../../solar/sfx';

export interface GameProps {
    world: EvoWorld;
    atlas: AtlasInfo | null;
    camera: React.MutableRefObject<CameraApi | null>;
    compact: boolean;
    /** onEnd: gọi khi đọc xong (hoặc hết thời gian đọc ước tính nếu máy không có giọng). */
    say: (text: string, onEnd?: () => void) => void;
    onExit: () => void;
    onAward: (badgeId: string) => void;
}

const cardPos = (compact: boolean) => compact ? 'left-2 right-2 bottom-3' : 'left-1/2 -translate-x-1/2 top-20 w-[min(560px,92vw)]';
const label = (world: EvoWorld, id: string) => world.tree.nodes[idx(world.tree, id)].data.label.replace(/\s*\(.*?\)/g, '');

// ---------------------------------------------------------------- Ai là họ hàng gần nhất?
export const RelativesQuiz: React.FC<GameProps> = ({ world, atlas, camera, compact, say, onExit, onAward }) => {
    const [seed] = useState(() => (Date.now() % 100000) + 1);
    const round = useMemo(() => {
        const rnd = mulberry32(seed);
        return pickRound(RELATIVES_BANK, RELATIVES_ROUND, rnd).map(q => ({ ...q, flip: rnd() < 0.5 }));
    }, [seed]);
    const [k, setK] = useState(0);
    const [chosen, setChosen] = useState<string | null>(null);
    const [score, setScore] = useState(0);
    const done = k >= round.length;
    const q = round[Math.min(k, round.length - 1)];
    const t = world.tree;

    useEffect(() => {
        if (done) return;
        world.select(null);
        setChosen(null);
        camera.current?.fitNodes([idx(t, q.a), idx(t, q.b), idx(t, q.c)], 1.5);
        world.pulse([q.a]);
        say(`Họ hàng gần nhất của ${label(world, q.a)} là ai? ${label(world, q.flip ? q.c : q.b)} hay ${label(world, q.flip ? q.b : q.c)}?`);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [k, done]);

    useEffect(() => {
        if (done && score >= RELATIVES_PASS) onAward('relatives');
        if (done) { world.select(null); camera.current?.fitAll(); say(score >= RELATIVES_PASS ? `Giỏi quá! Đúng ${score} trên ${round.length} câu. Em nhận được huy hiệu!` : `Em đúng ${score} trên ${round.length} câu. Chơi lại nhé!`); }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [done]);

    const pick = (id: string) => {
        if (chosen) return;
        setChosen(id);
        const ok = id === q.answer;
        if (ok) { setScore(s => s + 1); playSuccess(); } else playBlip();
        const m = mrca(t, idx(t, q.a), idx(t, q.answer));
        world.select(idx(t, q.a));
        world.pulse([q.a, q.answer]);
        say(`${ok ? 'Đúng rồi!' : 'Chưa đúng.'} ${label(world, q.answer)} là họ hàng gần hơn. Tổ tiên chung sống ${ancestorTime(t, world.times, m)}. ${q.fact}`);
    };

    const opts = q.flip ? [q.c, q.b] : [q.b, q.c];
    return (
        <Panel className={`absolute z-40 ${cardPos(compact)} p-2 pb-4`} title={<>🧬 Ai là họ hàng gần nhất? <span className="text-white/50 text-sm font-bold">{done ? '' : `${k + 1}/${round.length}`}</span></>} onClose={onExit}>
            <div className="px-3" onPointerDown={e => e.stopPropagation()}>
                {done ? (
                    <div className="text-center py-3">
                        <div className="text-4xl mb-1">{score >= RELATIVES_PASS ? '🏅' : '🌱'}</div>
                        <div className="font-extrabold text-lg">Đúng {score}/{round.length} câu</div>
                        <div className="text-sm text-white/60 mb-3">{score >= RELATIVES_PASS ? 'Em nhận huy hiệu "Thánh đoán họ hàng"!' : `Cần đúng ${RELATIVES_PASS} câu để nhận huy hiệu.`}</div>
                        <button type="button" onClick={onExit} className="px-4 py-2 rounded-xl bg-amber-400 text-amber-950 font-bold">Xong</button>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center gap-3 mb-3">
                            <NodeIcon node={t.nodes[idx(t, q.a)]} atlas={atlas} size={52} />
                            <div className="text-base font-bold">Họ hàng gần nhất của <span className="text-amber-200">{label(world, q.a)}</span> là ai?</div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {opts.map(id => {
                                const state = chosen ? (id === q.answer ? 'ok' : id === chosen ? 'bad' : '') : '';
                                return (
                                    <button key={id} type="button" disabled={!!chosen} onClick={() => pick(id)}
                                        className={`flex flex-col items-center gap-1 rounded-2xl p-3 border-2 transition-all ${state === 'ok' ? 'border-emerald-400 bg-emerald-400/15' : state === 'bad' ? 'border-rose-400 bg-rose-400/10' : 'border-white/12 bg-white/5 hover:bg-white/12'}`}>
                                        <NodeIcon node={t.nodes[idx(t, id)]} atlas={atlas} size={56} />
                                        <span className="font-bold text-sm text-center">{label(world, id)}</span>
                                    </button>
                                );
                            })}
                        </div>
                        {chosen && (
                            <div className="mt-3 text-sm">
                                <p className={chosen === q.answer ? 'text-emerald-300 font-bold' : 'text-rose-300 font-bold'}>{chosen === q.answer ? '✓ Đúng rồi!' : '✗ Chưa đúng.'} {q.fact}</p>
                                <p className="text-white/60 text-xs mt-1">Tổ tiên chung của {label(world, q.a)} và {label(world, q.answer)} sống {ancestorTime(t, world.times, mrca(t, idx(t, q.a), idx(t, q.answer)))}.</p>
                                <button type="button" onClick={() => setK(v => v + 1)} className="mt-2 px-4 py-2 rounded-xl bg-amber-400 text-amber-950 font-bold">Câu tiếp →</button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </Panel>
    );
};

// ---------------------------------------------------------------- Đoán xem tớ là ai? (khóa lưỡng phân)
const MYSTERIES = Object.keys(MYSTERY_NAMES);

export const MysteryKey: React.FC<GameProps & { solved: string[]; onSolved: (id: string) => void }> = ({ world, atlas, camera, compact, say, onExit, onAward, solved, onSolved }) => {
    const [target, setTarget] = useState(() => {
        const left = MYSTERIES.filter(m => !solved.includes(m));
        const pool = left.length ? left : MYSTERIES;
        return pool[Math.floor(Math.random() * pool.length)];
    });
    const [qid, setQid] = useState<string>(KEY_START);
    const [result, setResult] = useState<string | null>(null);
    const [hint, setHint] = useState<string | null>(null);
    const [steps, setSteps] = useState(0);
    const t = world.tree;
    const q = MYSTERY_KEY[qid];

    useEffect(() => { world.select(null); camera.current?.fitAll(); }, [world, camera, target]);
    useEffect(() => { if (!result) say(`Tớ là ai? ${q.q}`); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [qid, result]);

    const answer = (yes: boolean) => {
        const truth = keyTruth(t, qid, target);
        if (yes !== truth) {
            const h = truth ? 'Ồ, tớ có đặc điểm đó đấy! Nhìn kỹ lại hình của tớ nhé.' : 'Hình như tớ không có đặc điểm đó. Thử lại nhé!';
            setHint(h); say(h); playBlip();
            return;
        }
        setHint(null);
        setSteps(s => s + 1);
        const next: KeyNext = keyStep(qid, yes);
        const fly = yes ? q.truth : q.flyNo;
        if (fly) { const i = idx(t, fly); world.select(i); camera.current?.flyToNode(i, true); }
        if ('result' in next) {
            setResult(next.result);
            const i = idx(t, next.result);
            world.select(i);
            world.pulse([next.result]);
            camera.current?.flyToNode(i, false);
            playSuccess();
            say(`Tớ là ${MYSTERY_NAMES[next.result]}`);
            onSolved(next.result);
            if (new Set([...solved, next.result]).size >= KEY_PASS) onAward('key');
        } else setQid(next.q);
    };

    const another = () => {
        const left = MYSTERIES.filter(m => !solved.includes(m) && m !== target);
        const pool = left.length ? left : MYSTERIES.filter(m => m !== target);
        setTarget(pool[Math.floor(Math.random() * pool.length)]);
        setQid(KEY_START); setResult(null); setHint(null); setSteps(0);
    };

    const node = t.nodes[idx(t, target)];
    return (
        <Panel className={`absolute z-40 ${cardPos(compact)} p-2 pb-4`} title={<>🗝️ Đoán xem tớ là ai? <span className="text-white/50 text-sm font-bold">{solved.length}/{KEY_PASS} bí ẩn</span></>} onClose={onExit}>
            <div className="px-3" onPointerDown={e => e.stopPropagation()}>
                <div className="flex items-center gap-4">
                    <NodeIcon node={node} atlas={atlas} size={84} dark={!result} className="transition-all" />
                    <div className="flex-1">
                        {result ? (
                            <>
                                <div className="text-lg font-extrabold text-amber-200">Tớ là {MYSTERY_NAMES[result]}</div>
                                <div className="text-sm text-white/70">{KID[result]?.line}</div>
                                <div className="text-xs text-white/45 mt-1">Em đã đi {steps} bước trên khóa lưỡng phân.</div>
                            </>
                        ) : (
                            <>
                                <div className="text-sm text-white/55 mb-1">Câu hỏi {steps + 1}</div>
                                <div className="text-base font-bold leading-snug">{q.q}</div>
                            </>
                        )}
                    </div>
                </div>
                {hint && <div className="mt-2 text-sm text-amber-200">{hint}</div>}
                <div className="mt-3 flex gap-2">
                    {result ? (
                        <button type="button" onClick={another} className="flex-1 py-2.5 rounded-xl bg-amber-400 text-amber-950 font-bold">Bí ẩn khác →</button>
                    ) : (
                        <>
                            <button type="button" onClick={() => answer(true)} className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-extrabold text-lg">Có</button>
                            <button type="button" onClick={() => answer(false)} className="flex-1 py-3 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-extrabold text-lg">Không</button>
                        </>
                    )}
                </div>
            </div>
        </Panel>
    );
};

// ---------------------------------------------------------------- Hành trình về tổ tiên
export const AncestorJourney: React.FC<GameProps & { leaf: number; onDone: (leafId: string) => void }> = ({ world, atlas, camera, compact, say, onExit, leaf, onDone }) => {
    const t = world.tree;
    const stops = useMemo(() => [leaf, ...journeyStops(t, t.nodes[leaf].id)], [t, leaf]);
    const [k, setK] = useState(0);
    const [playing, setPlaying] = useState(true);
    const doneRef = useRef(false);
    const end = k >= stops.length;
    const cur = stops[Math.min(k, stops.length - 1)];

    const lineOf = (i: number, step: number) => {
        const n = t.nodes[i];
        if (step === 0) return `Bắt đầu từ ${n.data.label.replace(/\s*\(.*?\)/g, '')}. Cùng lùi về quá khứ tìm tổ tiên nhé!`;
        return `Lùi về ${ancestorTime(t, world.times, i)}: ${JOURNEY[n.id] ?? KID[n.id]?.line ?? n.data.label}`;
    };

    // Chuyển chặng CHỈ khi đã đọc xong câu của chặng này (+1 s nghỉ) — trước đây cố định 4,2 s làm câu dài bị cắt.
    const [spokenK, setSpokenK] = useState(-1);
    useEffect(() => {
        if (end) {
            if (!doneRef.current) { doneRef.current = true; world.select(null); camera.current?.fitAll(); say('Mọi sinh vật trên Trái Đất đều là họ hàng!'); onDone(t.nodes[leaf].id); }
            return;
        }
        world.select(cur);
        if (k === 0) camera.current?.flyToNode(cur, false); else camera.current?.focus(cur, 240);
        const myK = k;
        say(lineOf(cur, k), () => setSpokenK(myK));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [k, end]);
    useEffect(() => {
        if (!playing || end || spokenK !== k) return;
        const id = window.setTimeout(() => setK(v => v + 1), 1000);
        return () => window.clearTimeout(id);
    }, [playing, k, end, spokenK]);

    return (
        <Panel className={`absolute z-40 ${cardPos(compact)} p-2 pb-4`} title={<>🧭 Hành trình về tổ tiên</>} onClose={onExit}>
            <div className="px-3" onPointerDown={e => e.stopPropagation()}>
                <div className="flex items-center gap-3">
                    <NodeIcon node={t.nodes[end ? 1 : cur]} atlas={atlas} size={56} />
                    <div className="flex-1 text-sm leading-snug">{end ? 'Mọi sinh vật trên Trái Đất đều là họ hàng! Em nhận huy hiệu "Nhà du hành thời gian".' : lineOf(cur, k)}</div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-amber-400 transition-all" style={{ width: `${Math.min(1, k / (stops.length)) * 100}%` }} /></div>
                    {!end && <button type="button" onClick={() => setPlaying(p => !p)} aria-label={playing ? 'Dừng' : 'Tiếp tục'} className="w-9 h-9 grid place-items-center rounded-full bg-white/10">{playing ? <Pause size={16} /> : <Play size={16} />}</button>}
                    {!end && <button type="button" onClick={() => setK(v => v + 1)} aria-label="Chặng tiếp" className="w-9 h-9 grid place-items-center rounded-full bg-white/10"><SkipForward size={16} /></button>}
                    {end && <button type="button" onClick={onExit} className="px-4 py-2 rounded-xl bg-amber-400 text-amber-950 font-bold">Xong</button>}
                    {!end && <button type="button" onClick={onExit} aria-label="Dừng hành trình" className="w-9 h-9 grid place-items-center rounded-full bg-white/10"><X size={16} /></button>}
                </div>
            </div>
        </Panel>
    );
};
