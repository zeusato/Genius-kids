import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Eye, Keyboard, Languages, Lightbulb, ListChecks, Puzzle, Volume2, VolumeX } from 'lucide-react';
import type { AnswerMode, Riddle } from '../content/types';
import { GATE_MAP } from '../content/gates';
import { MAX_HINTS, roundReducer, type RoundState } from '../engine/round';
import { judge } from '../engine/judge';
import { saveDraft } from '../progress/storage';
import { Sphinx, type SphinxMood } from './Sphinx';
import { ChoiceInput, TilesInput, TypeInput } from './Inputs';
import { AnswerBadge, ClueList, Seals, markLine } from './ClueReveal';
import { LINES, hintList, pick, textLines } from './lines';
import { chime, useVoice } from './voice';

const MODES: { id: AnswerMode; label: string; icon: React.ReactNode }[] = [
    { id: 'choice', label: 'Chọn', icon: <ListChecks size={18} /> },
    { id: 'tiles', label: 'Ghép chữ', icon: <Puzzle size={18} /> },
    { id: 'type', label: 'Tự viết', icon: <Keyboard size={18} /> },
];
const KIND_LABEL: Record<RoundState['kind'], string> = { journey: 'Hành trình', gate: 'Cổng', review: 'Ôn lại', daily: 'Câu đố hôm nay', replay: 'Đố lại' };

export function Round({ initial, riddles, autoRead, showVi, onExit, onFinish, onSettings }: {
    initial: RoundState; riddles: Map<string, Riddle>; autoRead: boolean; showVi: boolean;
    onExit: () => void; onFinish: (s: RoundState) => void; onSettings: (patch: { autoRead?: boolean; showVi?: boolean }) => void;
}) {
    const [s, dispatch] = useReducer(roundReducer, initial);
    const item = s.items[s.index];
    const riddle = riddles.get(item.id)!;
    const gate = GATE_MAP.get(riddle.gate)!;
    const voice = useVoice();
    const [translate, setTranslate] = useState(showVi);
    const [bubble, setBubble] = useState('');
    const [mood, setMood] = useState<SphinxMood>('read');
    const [wrongTick, setWrongTick] = useState(0);
    const [modeMenu, setModeMenu] = useState(false);
    const finished = useRef(false);
    const lines = useMemo(() => textLines(riddle), [riddle]);
    const lang = riddle.lang === 'en' ? 'en-US' as const : 'vi-VN' as const;

    // Lưu nháp sau mỗi bước để tải lại trang vẫn chơi tiếp đúng câu.
    useEffect(() => { if (s.phase !== 'summary') saveDraft(s); }, [s]);
    useEffect(() => {
        if (s.phase === 'summary' && !finished.current) { finished.current = true; voice.stop(); onFinish(s); }
    }, [s, onFinish, voice]);

    const read = useCallback(() => {
        setMood('read');
        voice.say(lines.map(text => ({ text, lang })), () => { setMood('idle'); dispatch({ type: 'ready' }); });
    }, [lines, lang, voice]);

    // Bắt đầu mỗi câu: đọc to (nếu bật) rồi mở phần trả lời.
    useEffect(() => {
        if (s.phase !== 'reading') return;
        setBubble(riddle.lang === 'en' ? 'Nghe câu đố tiếng Anh nhé…' : 'Nghe ta đọc câu đố nhé…');
        setTranslate(showVi);
        if (autoRead) read();
        else { setMood('idle'); dispatch({ type: 'ready' }); }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [s.index, s.phase === 'reading']);
    useEffect(() => { if (s.phase === 'answering' && !voice.speaking) setBubble(b => (b.startsWith('Nghe') ? pick(LINES.invite, riddle.id) : b)); }, [s.phase, voice.speaking, riddle.id]);

    const say = (text: string) => voice.say([{ text, lang: /[ăâđêôơưàáạảãèéẹẻẽìíịỉĩòóọỏõùúụủũỳýỵỷỹ]/i.test(text) ? 'vi-VN' : lang }]);

    const submit = (input: string) => {
        const before = item;
        dispatch({ type: 'submit', riddle, input });
        // Lời Nhân Sư theo cùng phán quyết thuần mà reducer dùng (reducer là nguồn sự thật cho điểm).
        {
            const v = judge(riddle, input);
            if (v === 'correct' || v === 'spelling') {
                chime('right'); setMood('cheer');
                const msg = v === 'spelling' ? `Đúng rồi! Nhớ viết là “${riddle.answer}” nhé.` : pick(LINES.right, riddle.id + before.tries);
                setBubble(msg);
                if (autoRead) voice.say([{ text: msg }, { text: riddle.explain }]);
            } else if (v === 'marks') {
                chime('close'); setMood('think');
                const msg = 'Ta chưa chắc em viết từ nào. Em gõ có dấu giúp ta nhé!';
                setBubble(msg); if (autoRead) voice.say([{ text: msg }]);
            } else if (v === 'close') {
                chime('close'); setMood('think');
                const msg = `Gần đúng rồi! Nghĩ thêm chút nữa nhé, đáp án cụ thể hơn đấy.`;
                setBubble(msg); if (autoRead) voice.say([{ text: msg }]);
            } else {
                setMood('comfort'); setWrongTick(t => t + 1);
                const autoHint = before.tries + 1 >= 2 && before.hints === 0;
                const msg = autoHint ? `${pick(LINES.hint, riddle.id)} ${riddle.hints[0]}` : pick(LINES.wrong, riddle.id + before.tries);
                setBubble(msg); if (autoRead) voice.say([{ text: msg }]);
            }
        }
    };
    const hint = () => {
        if (item.hints >= MAX_HINTS) return;
        const text = hintList(riddle, item.hints + 1)[item.hints];
        dispatch({ type: 'hint' }); setMood('hint'); setBubble(text); chime('close');
        if (autoRead) voice.say([{ text }]);
    };
    const reveal = () => { dispatch({ type: 'reveal' }); setMood('comfort'); const msg = pick(LINES.reveal, riddle.id); setBubble(msg); if (autoRead) voice.say([{ text: msg }, { text: `Đáp án là ${riddle.answer}.` }, { text: riddle.explain }]); };
    const next = () => { voice.stop(); dispatch({ type: 'next' }); };

    const feedback = s.phase === 'feedback';
    const answering = s.phase === 'answering';
    const shownHints = hintList(riddle, item.hints);
    const canReveal = item.hints >= 2 || item.tries >= 2 || item.wrong.length >= 2;

    return (
        <div className="rd-play" style={{ ['--gate' as string]: gate.accent, ['--stone' as string]: gate.stone }}>
            <header className="rd-topbar">
                <button className="rd-icon" onClick={() => { voice.stop(); onExit(); }} aria-label="Tạm dừng, về ốc đảo"><ArrowLeft size={22} /></button>
                <div className="rd-top-title"><span>{s.kind === 'journey' || s.kind === 'gate' ? gate.title : KIND_LABEL[s.kind]}</span><small>Câu {s.index + 1} / {s.items.length}</small></div>
                <ol className="rd-progress" aria-label="Tiến độ chặng">
                    {s.items.map((x, i) => <li key={x.id} className={`${i === s.index ? 'is-now' : ''}${x.done ? (x.revealed ? ' is-seen' : ' is-done') : ''}`}>{x.done && !x.revealed ? x.seals : ''}</li>)}
                </ol>
                <button className={`rd-icon${autoRead ? '' : ' is-off'}`} onClick={() => { if (autoRead) voice.stop(); onSettings({ autoRead: !autoRead }); }} aria-pressed={autoRead} aria-label={autoRead ? 'Tắt tự đọc' : 'Bật tự đọc'}>{autoRead ? <Volume2 size={20} /> : <VolumeX size={20} />}</button>
            </header>

            <main className="rd-stage">
                <section className="rd-host" aria-live="polite">
                    <div className="rd-bubble" key={bubble}>{bubble}</div>
                    <Sphinx mood={mood} talking={voice.speaking} size={260} />
                </section>

                <section className={`rd-scroll${feedback ? ' is-feedback' : ''}`}>
                    <div className="rd-scroll-paper">
                        <div className="rd-scroll-head">
                            <span className="rd-chip" style={{ background: gate.stone }}>{gate.glyph} {gate.title}</span>
                            <span className="rd-level" aria-label={`Mức ${riddle.level}`}>{'●'.repeat(riddle.level)}<i>{'●'.repeat(3 - riddle.level)}</i></span>
                            <button className="rd-btn rd-btn-ghost" onClick={read} disabled={voice.speaking}><Volume2 size={18} />Đọc lại</button>
                            {riddle.vi && <button className={`rd-btn rd-btn-ghost${translate ? ' is-on' : ''}`} onClick={() => setTranslate(t => !t)} aria-pressed={translate}><Languages size={18} />Dịch</button>}
                        </div>
                        <blockquote className={`rd-riddle${lines.length > 1 ? ' is-poem' : ''}${riddle.lang === 'en' ? ' is-en' : ''}`} lang={riddle.lang}>
                            {lines.map((l, i) => <p key={i} className={voice.line === i && s.phase === 'reading' ? 'is-reading' : ''}>{feedback ? markLine(l, riddle) : l}</p>)}
                        </blockquote>
                        {translate && riddle.vi && <p className="rd-translate">{riddle.vi}</p>}

                        {!feedback && shownHints.length > 0 && (
                            <ul className="rd-hints">{shownHints.map((h, i) => <li key={i}><Lightbulb size={16} />{h}</li>)}</ul>
                        )}

                        {feedback ? (
                            <div className="rd-reveal">
                                <div className="rd-reveal-top">
                                    <AnswerBadge riddle={riddle} />
                                    {item.revealed ? <span className="rd-reveal-tag">Cùng xem lời giải</span> : <Seals n={item.seals} />}
                                </div>
                                <h3>Soi manh mối</h3>
                                <ClueList riddle={riddle} />
                                <p className="rd-explain">{riddle.explain}</p>
                                <button className="rd-btn rd-btn-primary rd-next" onClick={next} autoFocus>{s.index + 1 >= s.items.length ? 'Xem kết quả' : 'Câu tiếp theo'}<ArrowRight size={20} /></button>
                            </div>
                        ) : (
                            <div className={`rd-answer-area${answering ? '' : ' is-waiting'}`}>
                                {item.mode === 'choice' && <ChoiceInput riddle={riddle} seed={s.id + item.id} wrong={item.wrong} disabled={!answering} onSubmit={submit} onSpeak={say} />}
                                {item.mode === 'tiles' && <TilesInput riddle={riddle} seed={s.id + item.id} wrong={item.wrong} disabled={!answering} onSubmit={submit} onSpeak={say} wrongCount={wrongTick} />}
                                {item.mode === 'type' && <TypeInput riddle={riddle} seed={s.id} wrong={item.wrong} disabled={!answering} onSubmit={submit} onSpeak={say} resetKey={wrongTick} />}
                                {!answering && <button className="rd-skip-read" onClick={() => { voice.stop(); setMood('idle'); dispatch({ type: 'ready' }); }}>Bỏ qua phần đọc</button>}
                            </div>
                        )}
                    </div>
                </section>
            </main>

            {!feedback && (
                <footer className="rd-actions">
                    <button className="rd-btn rd-btn-hint" onClick={hint} disabled={!answering || item.hints >= MAX_HINTS}><Lightbulb size={20} />Gợi ý <span className="rd-count">{item.hints}/{MAX_HINTS}</span></button>
                    <div className="rd-mode">
                        <button className="rd-btn rd-btn-soft" onClick={() => setModeMenu(m => !m)} disabled={!answering} aria-expanded={modeMenu}>{MODES.find(m => m.id === item.mode)!.icon}Cách trả lời</button>
                        {modeMenu && (
                            <div className="rd-mode-menu" role="menu">
                                {MODES.filter(m => !(riddle.kind === 'math' && m.id === 'tiles')).map(m => (
                                    <button key={m.id} role="menuitemradio" aria-checked={item.mode === m.id} className={item.mode === m.id ? 'is-on' : ''} onClick={() => { dispatch({ type: 'switch', mode: m.id }); setModeMenu(false); }}>
                                        {m.icon}{m.label}{m.id === 'choice' && item.mode !== 'choice' && <small>dễ hơn</small>}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <button className="rd-btn rd-btn-soft" onClick={reveal} disabled={!answering || !canReveal} title={canReveal ? '' : 'Thử thêm hoặc xem gợi ý trước nhé'}><Eye size={20} />Xem đáp án</button>
                </footer>
            )}
        </div>
    );
}
