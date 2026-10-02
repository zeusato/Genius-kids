// Chấm một câu kiểu Luyện tập (dùng chung Player và "Em thử" của Học bài):
// sai lần đầu → gợi ý + loại lựa chọn sai, thử lại; sai lần hai → hiện lời giải.
import React from 'react';
import { CheckCircle2, Lightbulb, XCircle } from 'lucide-react';
import { Question, QuestionType } from '@/types';
import { isAnswered, isCorrect } from '@/services/study/grading';
import { correctText, isCompare, type Answer } from './Answers';
import { Md, SolutionVisual } from '../shared';

export type Phase = 'answer' | 'retry' | 'done';
export interface QState { answer: Answer; phase: Phase; tries: number; eliminated: string[]; correct?: boolean }
export const freshState = (): QState => ({ answer: undefined, phase: 'answer', tries: 0, eliminated: [] });
export const GENERIC_HINT = 'Đọc lại đề thật chậm, làm từng bước rồi thử lại nhé!';

/** Trạng thái mới sau khi bấm "Trả lời"; null nếu chưa chấm được (chưa trả lời / đã xong). */
export function checkItem(q: Question, s: QState, override?: Answer): QState | null {
    const ans = override ?? s.answer ?? (q.type === QuestionType.Order ? q.options : undefined);
    if (s.phase === 'done' || !isAnswered(q, ans)) return null;
    if (isCorrect(q, ans)) return { ...s, answer: ans, phase: 'done', correct: true };
    const choices = q.type === QuestionType.SingleChoice || q.type === QuestionType.SelectWrong ? (q.options?.length ?? 0) : 0;
    // còn ý nghĩa thử lại? (câu 2 lựa chọn thì không)
    const canRetry = s.tries === 0 && (choices === 0 || choices - 1 - s.eliminated.length >= 2 || isCompare(q));
    if (canRetry) {
        const eliminated = typeof ans === 'string' && choices ? [...s.eliminated, ans] : s.eliminated;
        return { ...s, answer: choices ? undefined : ans, phase: 'retry', tries: 1, eliminated };
    }
    return { ...s, answer: ans, phase: 'done', correct: false, tries: s.tries + 1 };
}

export function Feedback({ q, s }: { q: Question; s: QState }) {
    if (s.phase === 'retry') return (
        <div className="study-feedback retry" role="status">
            <h3><Lightbulb size={20} />Chưa đúng, thử lại nhé!</h3>
            <p><Md inline>{q.hint || GENERIC_HINT}</Md></p>
        </div>
    );
    if (s.phase !== 'done') return null;
    return (
        <div className={`study-feedback ${s.correct ? 'ok' : 'bad'}`} role="status">
            <h3>{s.correct ? <><CheckCircle2 size={20} />{s.tries ? 'Đúng rồi, giỏi lắm!' : 'Chính xác!'}</> : <><XCircle size={20} />Đáp án đúng: <Md inline>{correctText(q)}</Md></>}</h3>
            {q.explanation && <p style={{ whiteSpace: 'pre-line' }}><Md inline>{q.explanation}</Md></p>}
            <SolutionVisual q={q} />
            {!s.correct && q.steps && q.steps.length > 0 && <ol>{q.steps.map((x, i) => <li key={i}><Md inline>{x}</Md></li>)}</ol>}
        </div>
    );
}
