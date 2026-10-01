// Phiếu bài tập in được (A4) + đáp án ở trang riêng. In bằng hộp thoại in của trình duyệt.
import React, { useState } from 'react';
import { Printer, RefreshCw } from 'lucide-react';
import { Question, QuestionType } from '@/types';
import { correctText } from './player/Answers';
import { Md, QuestionVisual } from './shared';
import './study.css';

const KEYS = ['A', 'B', 'C', 'D', 'E', 'F'];

export function PrintView({ title, studentName, questions, onRegenerate }: { title: string; studentName: string; questions: Question[]; onRegenerate: () => void }) {
    const [answers, setAnswers] = useState(true);
    return (
        <div className="study-print">
            <div className="study-print-bar">
                <button className="study-btn" onClick={() => window.print()}><Printer size={20} />In / Lưu PDF</button>
                <button className="study-btn ghost" onClick={onRegenerate}><RefreshCw size={20} />Đổi đề khác</button>
                <label className="study-check"><input type="checkbox" checked={answers} onChange={e => setAnswers(e.target.checked)} />Kèm đáp án</label>
            </div>
            <article className="study-sheet">
                <header>
                    <h1>{title}</h1>
                    <p>Họ và tên: <b>{studentName}</b> <span>Ngày: ………………</span> <span>Điểm: ………</span></p>
                </header>
                <ol className="study-sheet-list">
                    {questions.map(q => (
                        <li key={q.id}>
                            <div className="q"><Md>{q.questionText}</Md></div>
                            <QuestionVisual q={q} className="study-sheet-visual" />
                            {q.type === QuestionType.ManualInput ? <p className="blank">Trả lời: ……………………………………</p>
                                : q.type === QuestionType.Order ? <p className="blank">{(q.options || []).join(' ; ')}<br />Sắp xếp: ……………………………………</p>
                                    : <div className="opts">{(q.options || []).map((o, i) => <span key={i}><b>{KEYS[i]}.</b> <Md inline>{o}</Md></span>)}</div>}
                        </li>
                    ))}
                </ol>
            </article>
            {answers && <article className="study-sheet answers">
                <header><h1>Đáp án — {title}</h1></header>
                <ol className="study-sheet-key">
                    {questions.map(q => {
                        const i = q.options && q.correctAnswer ? q.options.indexOf(q.correctAnswer) : -1;
                        return <li key={q.id}><b>{i >= 0 && q.type !== QuestionType.ManualInput ? `${KEYS[i]}. ` : ''}<Md inline>{correctText(q)}</Md></b>{q.explanation && <> — <span style={{ whiteSpace: 'pre-line' }}><Md inline>{q.explanation}</Md></span></>}</li>;
                    })}
                </ol>
            </article>}
        </div>
    );
}
