// Màn làm bài Ôn Luyện. Luyện tập (practice/daily/review): chấm từng câu, sai lần đầu được thử lại kèm gợi ý,
// sai lần hai hiện lời giải. Kiểm tra (test/matrix): không tiếng đúng/sai, đi lại tự do, đồng hồ theo Date.now.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Lightbulb, Timer, Volume2, VolumeX, X, LayoutGrid, CheckCircle2, XCircle } from 'lucide-react';
import { Grade, Question, QuestionType, StudyMode } from '@/types';
import { isAnswered, isCorrect } from '@/services/study/grading';
import { soundManager } from '@/utils/sound';
import { cancelSpeech, speakVietnamese } from '@/src/utils/speech';
import { questionToSpeech } from '@/src/utils/questionSpeech';
import { SpeakButton } from '@/src/components/shared/SpeakButton';
import { HubDialog } from '@/src/components/hub/HubShell';
import { AnswerArea, correctText, isCompare, type Answer } from './Answers';
import { Md, QuestionVisual, SolutionVisual, fmtDuration, hasVisual } from '../shared';
import '../study.css';

export interface PlaySession {
    questions: Question[];
    mode: StudyMode;
    title: string;
    /** giây; chỉ chế độ Kiểm tra */
    durationSec?: number;
    tts: boolean;
    /** id câu → khoá hàng đợi ôn (câu lấy từ hàng đợi) */
    reviewKeys?: Record<string, string>;
}
export interface PlayRecord { q: Question; answer: Answer; firstTry: boolean; correct: boolean; key?: string }

interface Props {
    session: PlaySession;
    grade: Grade;
    themeId?: string;
    onFinish: (records: PlayRecord[], seconds: number) => void;
    onExit: () => void;
    onToggleTts: (on: boolean) => void;
}

type Phase = 'answer' | 'retry' | 'done';
interface QState { answer: Answer; phase: Phase; tries: number; eliminated: string[]; correct?: boolean }

export const isTestMode = (m: StudyMode) => m === 'test' || m === 'matrix';
const MODE_LABEL: Record<StudyMode, string> = { practice: 'Luyện tập', daily: 'Ôn hôm nay', review: 'Ôn câu sai', test: 'Kiểm tra', matrix: 'Kiểm tra' };
const GENERIC_HINT = 'Đọc lại đề thật chậm, làm từng bước rồi thử lại nhé!';

export function Player({ session, grade, themeId, onFinish, onExit, onToggleTts }: Props) {
    const { questions, mode } = session;
    const test = isTestMode(mode);
    const preschool = grade === Grade.Preschool;
    const [idx, setIdx] = useState(0);
    const [st, setSt] = useState<Record<string, QState>>({});
    const [showExit, setShowExit] = useState(false);
    const [showGrid, setShowGrid] = useState(false);
    const [showSubmit, setShowSubmit] = useState(false);
    const [tts, setTts] = useState(session.tts);
    const startedAt = useRef(Date.now());
    const finished = useRef(false);
    const [now, setNow] = useState(Date.now());

    const q = questions[idx];
    const s: QState = st[q.id] ?? { answer: undefined, phase: 'answer', tries: 0, eliminated: [] };
    const isLast = idx === questions.length - 1;
    const elapsed = () => Math.round((Date.now() - startedAt.current) / 1000);

    const finish = useCallback((state: Record<string, QState>) => {
        if (finished.current) return;
        finished.current = true;
        cancelSpeech();
        const records = questions.map(x => {
            const y = state[x.id];
            const correct = test ? isCorrect(x, y?.answer) : !!y?.correct;
            return { q: x, answer: y?.answer, correct, firstTry: correct && (test || (y?.tries ?? 0) === 0), key: session.reviewKeys?.[x.id] };
        });
        onFinish(records, elapsed());
    }, [questions, test, onFinish, session.reviewKeys]);

    // đồng hồ (Kiểm tra)
    const left = session.durationSec ? Math.max(0, session.durationSec - Math.round((now - startedAt.current) / 1000)) : null;
    const stRef = useRef(st);
    stRef.current = st;
    useEffect(() => {
        if (!test || !session.durationSec) return;
        const t = setInterval(() => setNow(Date.now()), 500);
        return () => clearInterval(t);
    }, [test, session.durationSec]);
    useEffect(() => { if (left === 0) finish(stRef.current); }, [left, finish]);
    useEffect(() => () => cancelSpeech(), []);
    useEffect(() => {
        if (!preschool || !tts || test || s.phase === 'answer') return;
        speakVietnamese(s.phase === 'retry' ? q.hint || GENERIC_HINT : s.correct ? (idx % 2 ? 'Giỏi quá!' : 'Đúng rồi!') : q.explanation);
    }, [q.id, s.phase, s.correct, preschool, tts, test]);

    const put = (patch: Partial<QState>) => setSt(prev => ({ ...prev, [q.id]: { ...s, ...patch } }));

    const setAnswer = (v: Answer) => {
        if (s.phase === 'done' || typeof v === 'string' && s.eliminated.includes(v)) return;
        if (q.type !== QuestionType.Typing && q.type !== QuestionType.ManualInput) soundManager.playClick();
        put({ answer: v });
        // Mầm non, Luyện tập: chạm là chấm luôn (không cần nút Trả lời)
        if (!test && preschool && q.type === QuestionType.SingleChoice && typeof v === 'string') check(v);
    };

    const check = (override?: Answer) => {
        const ans = override ?? s.answer ?? (q.type === QuestionType.Order ? q.options : undefined);
        if (test || s.phase === 'done' || !isAnswered(q, ans)) return;
        const ok = isCorrect(q, ans);
        if (ok) { soundManager.playCorrect(); put({ answer: ans, phase: 'done', correct: true }); return; }
        soundManager.playWrong();
        const choices = q.type === QuestionType.SingleChoice || q.type === QuestionType.SelectWrong ? (q.options?.length ?? 0) : 0;
        // còn ý nghĩa thử lại? (câu 2 lựa chọn thì không)
        const canRetry = s.tries === 0 && (choices === 0 || choices - 1 - s.eliminated.length >= 2 || isCompare(q));
        if (canRetry) {
            const eliminated = typeof ans === 'string' && choices ? [...s.eliminated, ans] : s.eliminated;
            put({ answer: choices ? undefined : ans, phase: 'retry', tries: 1, eliminated });
        } else put({ answer: ans, phase: 'done', correct: false, tries: s.tries + 1 });
    };

    const go = (to: number) => {
        if (to < 0 || to >= questions.length) return;
        cancelSpeech();
        setIdx(to);
        setShowGrid(false);
        window.scrollTo({ top: 0 });
    };
    const submit = (state = st) => {
        if (questions.some(x => !isAnswered(x, state[x.id]?.answer))) setShowSubmit(true);
        else finish(state);
    };
    const next = () => {
        let state = st;
        if (test && q.type === QuestionType.Order && !s.answer) { state = { ...st, [q.id]: { ...s, answer: q.options } }; setSt(state); }
        if (isLast) { if (test) submit(state); else finish(state); } else go(idx + 1);
    };

    const primary = (): { label: string; run: () => void; disabled: boolean } => {
        if (test) return isLast
            ? { label: 'Nộp bài', run: next, disabled: false }
            : { label: 'Câu tiếp', run: next, disabled: false };
        if (s.phase === 'done') return { label: isLast ? 'Xem kết quả' : 'Câu tiếp', run: next, disabled: false };
        return { label: 'Trả lời', run: () => check(), disabled: q.type !== QuestionType.Order && !isAnswered(q, s.answer) };
    };
    const pr = primary();

    // phím tắt: 1–4 / A–D chọn, Enter = nút chính, ← → (Kiểm tra)
    const prRef = useRef(pr); prRef.current = pr;
    const optsRef = useRef<{ q: Question; set: (v: Answer) => void }>({ q, set: setAnswer }); optsRef.current = { q, set: setAnswer };
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement)?.tagName;
            if (showExit || showGrid || showSubmit || e.ctrlKey || e.altKey || e.metaKey) return;
            if (e.key === 'Enter' && tag !== 'INPUT' && (tag !== 'BUTTON' || (e.target as HTMLElement).closest('.study-opt'))) { if (!prRef.current.disabled) { e.preventDefault(); prRef.current.run(); } return; }
            if (tag === 'INPUT' || tag === 'TEXTAREA') return;
            const { q: cq, set } = optsRef.current;
            if (cq.type === QuestionType.SingleChoice || cq.type === QuestionType.SelectWrong) {
                const k = e.key.toLowerCase();
                const i = '1234'.indexOf(k) >= 0 ? '1234'.indexOf(k) : 'abcd'.indexOf(k);
                if (i >= 0 && cq.options?.[i]) { e.preventDefault(); set(cq.options[i]); }
                if (isCompare(cq) && ['>', '<', '='].includes(e.key)) set(e.key);
            }
            if (test && e.key === 'ArrowRight') { e.preventDefault(); go(idx + 1); }
            if (test && e.key === 'ArrowLeft') { e.preventDefault(); go(idx - 1); }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    });

    const speech = q.speech || questionToSpeech(q.questionText);
    const visual = hasVisual(q);
    const dot = (x: Question, i: number) => {
        const y = st[x.id];
        if (i === idx) return 'cur';
        if (test) return y && isAnswered(x, y.answer) ? 'done' : '';
        if (y?.phase === 'done') return y.correct ? 'ok' : 'bad';
        return '';
    };
    const answeredCount = questions.filter(x => isAnswered(x, st[x.id]?.answer)).length;

    return (
        <div className="discovery-hub" data-theme={themeId || 'theme_classic'}>
            <div className={`study-player${preschool ? ' preschool' : ''}`}>
                <div className="study-topbar">
                    <button className="hub-icon" aria-label="Thoát" title="Thoát" onClick={() => setShowExit(true)}><X size={20} /></button>
                    <span className="title">{session.title}</span>
                    <div className="study-dots" aria-label={`Câu ${idx + 1} trên ${questions.length}`}>{questions.map((x, i) => <i key={x.id} className={dot(x, i)} />)}</div>
                    <b style={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{idx + 1}/{questions.length}</b>
                    {test && left !== null && <span className={`study-timer${left <= 30 ? ' low' : ''}`}><Timer size={16} />{fmtDuration(left)}</span>}
                    {test && <button className="hub-icon" aria-label="Danh sách câu" title="Danh sách câu" onClick={() => setShowGrid(true)}><LayoutGrid size={20} /></button>}
                    <button className="hub-icon" aria-label={tts ? 'Tắt tự đọc đề' : 'Bật tự đọc đề'} title={tts ? 'Tắt tự đọc đề' : 'Bật tự đọc đề'}
                        onClick={() => { const v = !tts; setTts(v); if (!preschool) onToggleTts(v); if (!v) cancelSpeech(); }}>{tts ? <Volume2 size={20} /> : <VolumeX size={20} />}</button>
                </div>

                <div className={`study-stage${visual ? ' two' : ''}`}>
                    {visual && <QuestionVisual q={q} />}
                    <div className="study-qcol">
                        <div className="study-qhead">
                            <span className="study-qtag">{MODE_LABEL[mode]} · Câu {idx + 1}{q.advanced ? ' · Nâng cao' : ''}</span>
                            <span style={{ flex: 1 }} />
                            <SpeakButton key={q.id} text={speech} lang="vi-VN" autoPlay={tts} autoPlayKey={idx} size={22} />
                        </div>
                        <div className="study-qtext"><Md>{q.questionText}</Md></div>

                        <AnswerArea q={q} value={s.answer} onChange={setAnswer} onSubmit={() => (test ? next() : check())}
                            reveal={!test && s.phase === 'done' ? 'final' : 'none'} eliminated={test ? [] : s.eliminated} correct={s.correct} hideFeedback={test} />

                        {!test && s.phase === 'done' && s.correct && <div key={q.id} className="study-confetti" aria-hidden>{Array.from({ length: 12 }, (_, i) => <i key={i} style={{ left: `${(i + 0.5) * 100 / 12}%`, background: ['#e56b3c', '#d69a2d', '#2f8f5b'][i % 3], animationDelay: `${i % 3 * .08}s` }} />)}</div>}

                        {!test && s.phase === 'retry' && (
                            <div className="study-feedback retry" role="status">
                                <h3><Lightbulb size={20} />Chưa đúng, thử lại nhé!</h3>
                                <p>{q.hint || GENERIC_HINT}</p>
                            </div>
                        )}
                        {!test && s.phase === 'done' && (
                            <div className={`study-feedback ${s.correct ? 'ok' : 'bad'}`} role="status">
                                <h3>{s.correct ? <><CheckCircle2 size={20} />{s.tries ? 'Đúng rồi, giỏi lắm!' : 'Chính xác!'}</> : <><XCircle size={20} />Đáp án đúng: <Md inline>{correctText(q)}</Md></>}</h3>
                                {q.explanation && <p style={{ whiteSpace: 'pre-line' }}><Md inline>{q.explanation}</Md></p>}
                                <SolutionVisual q={q} />
                                {!s.correct && q.steps && q.steps.length > 0 && <ol>{q.steps.map((x, i) => <li key={i}><Md inline>{x}</Md></li>)}</ol>}
                            </div>
                        )}

                        <div className="study-actions">
                            {test ? <button className="study-btn ghost" onClick={() => go(idx - 1)} disabled={idx === 0}><ChevronLeft size={20} />Câu trước</button>
                                : <span className="study-kbd">{!preschool && (q.type === QuestionType.SingleChoice && !isCompare(q) ? <>Phím <kbd>1</kbd>–<kbd>{q.options?.length ?? 4}</kbd> để chọn, <kbd>Enter</kbd> để trả lời</> : <><kbd>Enter</kbd> để trả lời</>)}</span>}
                            {!(preschool && !test && s.phase !== 'done' && q.type === QuestionType.SingleChoice) &&
                                <button className="study-btn" onClick={pr.run} disabled={pr.disabled}>{pr.label}{pr.label === 'Trả lời' ? <Check size={20} /> : <ChevronRight size={20} />}</button>}
                        </div>
                    </div>
                </div>
            </div>

            {showExit && (
                <HubDialog title="Dừng bài làm?" onClose={() => setShowExit(false)}>
                    <p style={{ color: 'var(--hub-muted)', margin: '6px 0 18px' }}>{test ? 'Bài kiểm tra chưa nộp sẽ không được lưu.' : 'Những câu em đã làm sẽ không được tính.'}</p>
                    <div className="study-dialog-actions">
                        <button className="study-btn ghost" onClick={() => setShowExit(false)}>Làm tiếp</button>
                        <button className="study-btn" style={{ background: 'var(--st-bad)' }} onClick={() => { cancelSpeech(); onExit(); }}>Thoát</button>
                    </div>
                </HubDialog>
            )}
            {showGrid && (
                <HubDialog title={`Đã làm ${answeredCount}/${questions.length} câu`} onClose={() => setShowGrid(false)}>
                    <div className="study-grid-nav">{questions.map((x, i) => <button key={x.id} className={`${isAnswered(x, st[x.id]?.answer) ? 'done' : ''}${i === idx ? ' cur' : ''}`} onClick={() => go(i)}>{i + 1}</button>)}</div>
                    <div className="study-dialog-actions"><button className="study-btn" onClick={() => { setShowGrid(false); submit(); }}>Nộp bài</button></div>
                </HubDialog>
            )}
            {showSubmit && <HubDialog title="Còn câu chưa trả lời" onClose={() => setShowSubmit(false)}>
                <p className="study-dialog-note">Em mới làm {answeredCount}/{questions.length} câu. Em muốn làm tiếp hay nộp bài ngay?</p>
                <div className="study-dialog-actions">
                    <button className="study-btn ghost" onClick={() => setShowSubmit(false)}>Làm tiếp</button>
                    <button className="study-btn" onClick={() => finish(st)}>Nộp bài ngay</button>
                </div>
            </HubDialog>}
        </div>
    );
}
