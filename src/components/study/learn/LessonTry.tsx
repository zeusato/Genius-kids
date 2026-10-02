// "Em thử": 3 câu sinh từ template, chấm như Luyện tập (gợi ý → thử lại → lời giải). Không vào tiến độ luyện tập.
import React, { useState } from 'react';
import { Check, ChevronRight, RotateCcw } from 'lucide-react';
import { Grade, QuestionType, type Question } from '@/types';
import { isAnswered } from '@/services/study/grading';
import { buildTry } from '@/services/study/lessons/try';
import type { Lesson } from '@/services/study/lessons/types';
import { soundManager } from '@/utils/sound';
import { SpeakButton } from '@/src/components/shared/SpeakButton';
import { questionToSpeech } from '@/src/utils/questionSpeech';
import { AnswerArea, type Answer } from '../player/Answers';
import { Feedback, checkItem, freshState, type QState } from '../player/Feedback';
import { Md, QuestionVisual, hasVisual } from '../shared';

export interface TryResult { correct: number; total: number }

export function LessonTry({ lesson, grade, tts, onDone, children }: {
    lesson: Lesson; grade: Grade; tts: boolean;
    onDone: (r: TryResult) => void;
    /** nội dung hiện sau khi làm xong (kết quả lưu / thưởng) */
    children?: React.ReactNode;
}) {
    const [round, setRound] = useState(0);
    const [qs, setQs] = useState<Question[]>(() => buildTry(lesson));
    const [idx, setIdx] = useState(0);
    const [st, setSt] = useState<Record<string, QState>>({});
    const [finished, setFinished] = useState<TryResult | null>(null);
    const preschool = grade === Grade.Preschool;

    const again = () => { setQs(buildTry(lesson)); setIdx(0); setSt({}); setFinished(null); setRound(r => r + 1); };
    if (!qs.length) return <p className="learn-lead">Chưa tạo được câu cho phần này. Em vào Luyện tập để thử nhé!</p>;

    if (finished) return (
        <div className="learn-try-done">
            <p className="learn-try-score">Em làm đúng <b>{finished.correct}/{finished.total}</b> câu.</p>
            {children}
            <div className="learn-widget-actions"><button className="study-btn soft" onClick={again}><RotateCcw size={18} />Thử 3 câu khác</button></div>
        </div>
    );

    const q = qs[idx], s = st[q.id] ?? freshState();
    const put = (next: QState) => setSt(p => ({ ...p, [q.id]: next }));
    const check = (override?: Answer) => {
        const next = checkItem(q, s, override);
        if (!next) return;
        if (next.correct) soundManager.playCorrect(); else soundManager.playWrong();
        put(next);
    };
    const setAnswer = (v: Answer) => {
        if (s.phase === 'done' || (typeof v === 'string' && s.eliminated.includes(v))) return;
        put({ ...s, answer: v });
        if (preschool && q.type === QuestionType.SingleChoice && typeof v === 'string') check(v);
    };
    const nextQ = () => {
        if (idx < qs.length - 1) { setIdx(idx + 1); return; }
        const all = { ...st };
        const r = { correct: qs.filter(x => all[x.id]?.correct).length, total: qs.length };
        setFinished(r);
        onDone(r);
    };
    return (
        <div className="learn-try" key={round}>
            <div className="learn-try-head"><span className="study-qtag">Câu {idx + 1}/{qs.length}</span>
                <span className="learn-try-dots">{qs.map((x, i) => <i key={x.id} className={i === idx ? 'cur' : st[x.id]?.phase === 'done' ? (st[x.id].correct ? 'ok' : 'bad') : ''} />)}</span>
                <SpeakButton key={q.id} text={q.speech || questionToSpeech(q.questionText)} lang="vi-VN" autoPlay={tts} autoPlayKey={`${round}-${idx}`} size={22} />
            </div>
            <div className={`learn-try-body${hasVisual(q) ? ' two' : ''}`}>
                {hasVisual(q) && <QuestionVisual q={q} />}
                <div className="learn-try-q">
                    <div className="study-qtext"><Md>{q.questionText}</Md></div>
                    <AnswerArea q={q} value={s.answer} onChange={setAnswer} onSubmit={() => check()} reveal={s.phase === 'done' ? 'final' : 'none'} eliminated={s.eliminated} correct={s.correct} />
                    <Feedback q={q} s={s} />
                    <div className="study-actions">
                        <span />
                        {s.phase === 'done'
                            ? <button className="study-btn" onClick={nextQ}>{idx < qs.length - 1 ? 'Câu tiếp' : 'Xem kết quả'}<ChevronRight size={20} /></button>
                            : !(preschool && q.type === QuestionType.SingleChoice) && <button className="study-btn" onClick={() => check()} disabled={q.type !== QuestionType.Order && !isAnswered(q, s.answer)}>Trả lời<Check size={20} /></button>}
                    </div>
                </div>
            </div>
        </div>
    );
}
