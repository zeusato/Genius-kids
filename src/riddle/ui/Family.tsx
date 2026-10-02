import React, { useMemo, useState } from 'react';
import { Check, Crown, Eye, Lightbulb, Minus, Plus, Trophy, Users, Volume2, X } from 'lucide-react';
import type { Riddle } from '../content/types';
import { judge } from '../engine/judge';
import { AnswerBadge, markLine } from './ClueReveal';
import { ChoiceInput } from './Inputs';
import { Sphinx } from './Sphinx';
import { textLines } from './lines';
import { chime, useVoice } from './voice';

const shuffle = <T,>(a: T[]) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

/** Chọn bộ câu cho chế độ gia đình: ưu tiên câu bé đã giải (bé biết đáp án để làm Nhân Sư). */
export function familyDeck(pool: Riddle[], solved: Set<string>, n: number, first?: Riddle): Riddle[] {
    const vi = pool.filter(r => r.lang === 'vi' && r.kind !== 'math');
    const known = shuffle(vi.filter(r => solved.has(r.id)));
    const rest = shuffle(vi.filter(r => !solved.has(r.id) && r.level <= 2));
    const deck = [...(first ? [first] : []), ...known, ...rest].filter((r, i, a) => a.findIndex(x => x.id === r.id) === i);
    return deck.slice(0, n);
}

export function Family({ pool, solved, first, onAsked, onDone }: { pool: Riddle[]; solved: Set<string>; first?: Riddle; onAsked: (n: number) => void; onDone: () => void }) {
    const [mode, setMode] = useState<'pick' | 'host' | 'quiz'>(first ? 'host' : 'pick');
    if (mode === 'host') return <KidHost deck={familyDeck(pool, solved, 5, first)} onFinish={n => { onAsked(n); }} onDone={onDone} />;
    if (mode === 'quiz') return <FamilyQuiz pool={pool} solved={solved} onDone={onDone} />;
    return (
        <div className="rd-family-pick">
            <div className="rd-section-head"><h1>Đố cả nhà</h1><p>Cùng chơi trên một máy. Không tính sao, chỉ tính tiếng cười.</p></div>
            <div className="rd-family-options">
                <button onClick={() => setMode('host')}>
                    <Sphinx mood="hint" size={150} />
                    <strong>Bé làm Nhân Sư</strong>
                    <span>Bé đọc câu đố cho bố mẹ đoán. Đáp án giấu kín, chỉ bé được xem.</span>
                </button>
                <button onClick={() => setMode('quiz')}>
                    <span className="rd-family-icon"><Users size={64} /></span>
                    <strong>Thi đố 2–4 người</strong>
                    <span>Lần lượt trả lời, ai giải nhiều câu nhất sẽ thắng.</span>
                </button>
            </div>
        </div>
    );
}

function KidHost({ deck, onFinish, onDone }: { deck: Riddle[]; onFinish: (n: number) => void; onDone: () => void }) {
    const [i, setI] = useState(0);
    const [peek, setPeek] = useState(false);
    const [hints, setHints] = useState(0);
    const [score, setScore] = useState(0);
    const voice = useVoice();
    const r = deck[i];
    if (!r) {
        return (
            <div className="rd-family-end">
                <Sphinx mood="cheer" size={200} />
                <h1>Bé là Nhân Sư tài ba!</h1>
                <p>Người lớn đoán đúng {score}/{deck.length} câu.</p>
                <button className="rd-btn rd-btn-primary" onClick={onDone}>Về ốc đảo</button>
            </div>
        );
    }
    const mark = (ok: boolean) => {
        chime(ok ? 'right' : 'close');
        const nextScore = score + (ok ? 1 : 0);
        setScore(nextScore); setPeek(false); setHints(0); voice.stop();
        if (i + 1 >= deck.length) onFinish(deck.length);
        setI(i + 1);
    };
    return (
        <div className="rd-host-card">
            <div className="rd-host-top"><span className="rd-chip">Câu {i + 1}/{deck.length}</span><span>Bé đọc to câu đố cho người lớn nghe nhé!</span></div>
            <blockquote className="rd-riddle" lang={r.lang}>{textLines(r).map((l, k) => <p key={k}>{peek ? markLine(l, r) : l}</p>)}</blockquote>
            <div className="rd-host-tools">
                <button className="rd-btn rd-btn-soft" onClick={() => voice.say(textLines(r).map(text => ({ text })))}><Volume2 size={18} />Nghe đọc mẫu</button>
                <button className="rd-btn rd-btn-soft" disabled={hints >= 2} onClick={() => setHints(h => h + 1)}><Lightbulb size={18} />Gợi ý cho người lớn</button>
            </div>
            {hints > 0 && <ul className="rd-hints">{r.hints.slice(0, hints).map((h, k) => <li key={k}><Lightbulb size={16} />{h}</li>)}</ul>}
            <button className={`rd-peek${peek ? ' is-on' : ''}`} onPointerDown={() => setPeek(true)} onPointerUp={() => setPeek(false)} onPointerLeave={() => setPeek(false)}
                onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') setPeek(true); }} onKeyUp={() => setPeek(false)} aria-label="Giữ để xem đáp án">
                {peek ? <AnswerBadge riddle={r} /> : <><Eye size={22} />Giữ để xem đáp án (đừng cho người lớn thấy!)</>}
            </button>
            <div className="rd-host-judge">
                <button className="rd-btn rd-btn-primary" onClick={() => mark(true)}><Check size={20} />Người lớn đoán đúng</button>
                <button className="rd-btn rd-btn-soft" onClick={() => mark(false)}><X size={20} />Chưa đoán ra</button>
            </div>
        </div>
    );
}

function FamilyQuiz({ pool, solved, onDone }: { pool: Riddle[]; solved: Set<string>; onDone: () => void }) {
    const [players, setPlayers] = useState(['Bé', 'Bố', 'Mẹ']);
    const [started, setStarted] = useState(false);
    const perPlayer = 3;
    const deck = useMemo(() => familyDeck(pool, new Set(), players.length * perPlayer), [started]); // eslint-disable-line react-hooks/exhaustive-deps
    const [turn, setTurn] = useState(0);
    const [wrong, setWrong] = useState<string[]>([]);
    const [scores, setScores] = useState<number[]>([]);
    const [shown, setShown] = useState<null | boolean>(null);
    const voice = useVoice();
    void solved;
    if (!started) {
        return (
            <div className="rd-quiz-setup">
                <div className="rd-section-head"><h1>Thi đố cả nhà</h1><p>Mỗi người {perPlayer} câu. Đúng ngay được 2 điểm, đúng lần hai được 1 điểm.</p></div>
                <ul className="rd-players">
                    {players.map((p, i) => (
                        <li key={i}><Crown size={18} /><input value={p} maxLength={12} onChange={e => setPlayers(players.map((x, j) => (j === i ? e.target.value : x)))} aria-label={`Tên người chơi ${i + 1}`} />
                            {players.length > 2 && <button className="rd-icon" onClick={() => setPlayers(players.filter((_, j) => j !== i))} aria-label="Bớt người chơi"><Minus size={18} /></button>}</li>
                    ))}
                </ul>
                {players.length < 4 && <button className="rd-btn rd-btn-soft" onClick={() => setPlayers([...players, `Người ${players.length + 1}`])}><Plus size={18} />Thêm người chơi</button>}
                <button className="rd-btn rd-btn-primary" onClick={() => { setScores(players.map(() => 0)); setStarted(true); }} disabled={players.some(p => !p.trim())}>Bắt đầu</button>
            </div>
        );
    }
    const r = deck[turn];
    if (!r) {
        const best = Math.max(...scores);
        return (
            <div className="rd-family-end">
                <Trophy size={64} className="rd-trophy" />
                <h1>{players.filter((_, i) => scores[i] === best).join(' và ')} thắng!</h1>
                <ol className="rd-scoreboard">{players.map((p, i) => <li key={i} className={scores[i] === best ? 'is-best' : ''}><span>{p}</span><b>{scores[i]}</b></li>)}</ol>
                <button className="rd-btn rd-btn-primary" onClick={onDone}>Về ốc đảo</button>
            </div>
        );
    }
    const who = turn % players.length;
    const answer = (input: string) => {
        if (shown !== null) return;
        const ok = judge(r, input) === 'correct';
        if (ok) {
            chime('right');
            setScores(scores.map((s, i) => (i === who ? s + (wrong.length ? 1 : 2) : s)));
            setShown(true);
        } else if (wrong.length >= 1) { setWrong([...wrong, input]); setShown(false); }
        else { chime('close'); setWrong([input]); }
    };
    return (
        <div className="rd-quiz">
            <ol className="rd-scoreboard is-row">{players.map((p, i) => <li key={i} className={i === who ? 'is-turn' : ''}><span>{p}</span><b>{scores[i]}</b></li>)}</ol>
            <div className="rd-host-card">
                <div className="rd-host-top"><span className="rd-chip">Lượt của {players[who]}</span><span>Câu {turn + 1}/{deck.length}</span>
                    <button className="rd-btn rd-btn-ghost" onClick={() => voice.say(textLines(r).map(text => ({ text })))}><Volume2 size={18} />Đọc</button></div>
                <blockquote className="rd-riddle" lang={r.lang}>{textLines(r).map((l, k) => <p key={k}>{l}</p>)}</blockquote>
                {shown === null ? <ChoiceInput riddle={r} seed={`q${turn}${r.id}`} wrong={wrong} disabled={false} onSubmit={answer} onSpeak={t => voice.say([{ text: t }])} />
                    : <div className="rd-quiz-result"><AnswerBadge riddle={r} /><p>{shown ? `${players[who]} giải đúng!` : 'Chưa đúng rồi, câu sau nhé!'}</p>
                        <button className="rd-btn rd-btn-primary" autoFocus onClick={() => { setTurn(turn + 1); setWrong([]); setShown(null); voice.stop(); }}>Lượt tiếp</button></div>}
            </div>
        </div>
    );
}
