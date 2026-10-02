import React, { useMemo, useState } from 'react';
import { ArrowRight, Search, Star } from 'lucide-react';
import type { GateId, Riddle } from '../content/types';
import { GATE_MAP } from '../content/gates';
import { Sphinx } from './Sphinx';
import { chime, useVoice } from './voice';

type Puzzle =
    | { kind: 'shadow'; target: Riddle; options: string[] }
    | { kind: 'keyhole'; target: Riddle; options: string[] }
    | { kind: 'odd'; items: { emoji: string; name: string; odd: boolean }[]; group: GateId; oddGate: GateId };

const shuffle = <T,>(a: T[], rng: () => number) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

/** Sinh 6 câu đố hình từ kho: chỉ dùng câu có emoji cho đáp án (và đáp án nhiễu cho câu "kẻ lạ"). */
export function makePictureRound(pool: Riddle[], rng: () => number = Math.random): Puzzle[] {
    const pics = pool.filter(r => r.lang === 'vi' && r.emoji && ['animals', 'plants', 'objects', 'nature'].includes(r.gate));
    const seen = new Set<string>();
    const pickTarget = () => { const c = shuffle(pics.filter(r => !seen.has(r.emoji!)), rng)[0]; if (c) seen.add(c.emoji!); return c; };
    const optionsFor = (r: Riddle) => shuffle([r.answer, ...r.choices.map(c => c.text)], rng);
    const out: Puzzle[] = [];
    for (const kind of ['shadow', 'keyhole', 'odd', 'shadow', 'keyhole', 'odd'] as const) {
        if (kind === 'odd') {
            const gates = shuffle(['animals', 'plants', 'objects'] as GateId[], rng);
            const same = shuffle(pics.filter(r => r.gate === gates[0] && !seen.has(r.emoji!)), rng).slice(0, 3);
            const odd = shuffle(pics.filter(r => r.gate === gates[1] && !seen.has(r.emoji!)), rng)[0];
            if (same.length < 3 || !odd) continue;
            [...same, odd].forEach(r => seen.add(r.emoji!));
            out.push({ kind, group: gates[0], oddGate: gates[1], items: shuffle([...same.map(r => ({ emoji: r.emoji!, name: r.answer, odd: false })), { emoji: odd.emoji!, name: odd.answer, odd: true }], rng) });
        } else {
            const t = pickTarget();
            if (t) out.push({ kind, target: t, options: optionsFor(t) });
        }
    }
    return out;
}

const GROUP_NAME: Partial<Record<GateId, string>> = { animals: 'con vật', plants: 'cây, hoa hoặc quả', objects: 'đồ vật' };

export function Picture({ pool, onFinish, onDone }: { pool: Riddle[]; onFinish: (score: number, total: number) => number; onDone: () => void }) {
    const puzzles = useMemo(() => makePictureRound(pool), [pool]);
    const [i, setI] = useState(0);
    const [score, setScore] = useState(0);
    const [opened, setOpened] = useState(0);
    const [picked, setPicked] = useState<string | null>(null);
    const [wrong, setWrong] = useState<string[]>([]);
    const [stars, setStars] = useState<number | null>(null);
    const voice = useVoice();
    const p = puzzles[i];
    const max = puzzles.length * 3;
    if (!p) {
        return (
            <div className="rd-family-end">
                <Sphinx mood="cheer" size={200} />
                <h1>Mắt em tinh quá!</h1>
                <p>Em được {score}/{max} điểm{stars !== null ? ` · +${stars} sao` : ''}.</p>
                <button className="rd-btn rd-btn-primary" onClick={onDone}>Về ốc đảo</button>
            </div>
        );
    }
    const solvedNow = picked !== null;
    const right = (name: string) => {
        const pts = Math.max(1, 3 - wrong.length - (p.kind === 'keyhole' ? opened : 0));
        chime('right'); setPicked(name); setScore(s => s + pts);
        voice.say([{ text: p.kind === 'odd' ? `Đúng rồi! ${name} không phải ${GROUP_NAME[p.group]}.` : `Đúng rồi! Đó là ${name}.` }]);
    };
    const choose = (name: string, ok: boolean) => {
        if (solvedNow || wrong.includes(name)) return;
        if (ok) right(name);
        else { chime('close'); setWrong([...wrong, name]); if (p.kind === 'keyhole') setOpened(o => Math.min(3, o + 1)); }
    };
    const next = () => {
        voice.stop();
        setPicked(null); setWrong([]); setOpened(0);
        if (i + 1 >= puzzles.length) setStars(onFinish(score, max));
        setI(i + 1);
    };
    const title = p.kind === 'shadow' ? 'Bóng của ai?' : p.kind === 'keyhole' ? 'Nhìn qua lỗ khoá' : 'Ai là kẻ lạ?';
    const help = p.kind === 'shadow' ? 'Nhìn hình bóng và đoán xem đó là gì.' : p.kind === 'keyhole' ? 'Đoán sớm được nhiều điểm hơn. Bấm “Mở rộng” nếu cần nhìn rõ hơn.' : 'Ba hình cùng một nhóm, một hình khác nhóm. Tìm hình khác nhóm nhé!';
    return (
        <div className="rd-picture">
            <div className="rd-picture-head">
                <span className="rd-chip">{i + 1}/{puzzles.length}</span>
                <h1>{title}</h1>
                <span className="rd-picture-score"><Star size={18} fill="currentColor" />{score}</span>
            </div>
            <p className="rd-picture-help">{help}</p>
            {p.kind !== 'odd' ? (
                <>
                    <div className={`rd-picture-stage is-${p.kind}${solvedNow ? ' is-solved' : ''}`} style={{ ['--hole' as string]: `${28 + opened * 18}%`, ['--gate' as string]: GATE_MAP.get(p.target.gate)!.accent }}>
                        <span className="rd-picture-emoji" aria-hidden="true">{p.target.emoji}</span>
                        {p.kind === 'keyhole' && !solvedNow && <button className="rd-btn rd-btn-soft rd-widen" disabled={opened >= 3} onClick={() => setOpened(o => o + 1)}><Search size={18} />Mở rộng</button>}
                    </div>
                    <div className="rd-choices">
                        {p.options.map(o => (
                            <div key={o} className={`rd-choice${wrong.includes(o) ? ' is-out' : ''}${picked === o ? ' is-right' : ''}`}>
                                <button className="rd-choice-main" disabled={solvedNow || wrong.includes(o)} onClick={() => choose(o, o === p.target.answer)}><span className="rd-choice-text">{o}</span></button>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <div className="rd-odd">
                    {p.items.map(it => (
                        <button key={it.emoji} className={`rd-odd-item${wrong.includes(it.name) ? ' is-out' : ''}${solvedNow && it.odd ? ' is-right' : ''}`} disabled={solvedNow || wrong.includes(it.name)} onClick={() => choose(it.name, it.odd)} aria-label={it.name}>
                            <span aria-hidden="true">{it.emoji}</span><small>{solvedNow || wrong.includes(it.name) ? it.name : ''}</small>
                        </button>
                    ))}
                </div>
            )}
            {solvedNow && (
                <div className="rd-picture-next">
                    <p>{p.kind === 'odd' ? `Ba hình kia đều là ${GROUP_NAME[p.group]}, còn ${picked} thì không.` : `Đó là ${picked}!`}</p>
                    <button className="rd-btn rd-btn-primary" onClick={next} autoFocus>{i + 1 >= puzzles.length ? 'Xem kết quả' : 'Hình tiếp theo'}<ArrowRight size={20} /></button>
                </div>
            )}
        </div>
    );
}
