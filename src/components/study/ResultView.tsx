// Kết quả một phiên: điểm, sao, tiến bộ từng kỹ năng, xem lại từng câu.
import React, { useEffect, useState } from 'react';
import { BarChart3, ChevronDown, Check, Home, RotateCcw, Star, Target, Trophy, X, BookOpen } from 'lucide-react';
import { hasLesson } from '@/services/study/lessons/manifest';
import type { StudyMode } from '@/types';
import { soundManager } from '@/utils/sound';
import type { PlayRecord } from './player/Player';
import { answerText, correctText } from './player/Answers';
import { Md, QuestionVisual, SolutionVisual, fmtDuration } from './shared';
import './study.css';

export interface SkillDelta { skillId: string; title: string; before: number; after: number; mastered: boolean }
export interface SessionSummary {
    title: string;
    mode: StudyMode;
    records: PlayRecord[];
    seconds: number;
    stars: number;
    deltas: SkillDelta[];
    reviewCleared: number;
}

const CONFETTI = ['#e56b3c', '#d69a2d', '#2f8f5b', '#3d7cc9', '#c24f8e'];

function Confetti() {
    const [bits] = useState(() => Array.from({ length: 36 }, (_, i) => ({ left: Math.random() * 100, delay: Math.random() * 0.5, color: CONFETTI[i % CONFETTI.length], rot: Math.random() * 180 })));
    return <div className="study-confetti" aria-hidden>{bits.map((b, i) => <i key={i} style={{ left: `${b.left}%`, background: b.color, animationDelay: `${b.delay}s`, transform: `rotate(${b.rot}deg)` }} />)}</div>;
}

export function ResultView({ summary, onHome, onRetryWrong, onPracticeWeak, onLearnWeak, onLearn, onReport }: { summary: SessionSummary; onHome: () => void; onRetryWrong?: () => void; onPracticeWeak?: () => void; onLearnWeak?: () => void; onLearn?: (skillId: string) => void; onReport: () => void }) {
    const { records } = summary;
    const total = records.length, score = records.filter(r => r.correct).length;
    const first = records.filter(r => r.firstTry).length;
    const pct = total ? score / total : 0;
    const wrong = records.filter(r => !r.correct);
    const [open, setOpen] = useState<number | null>(null);
    const mastered = summary.deltas.filter(d => d.mastered);
    const party = pct >= 0.9 || mastered.length > 0;
    useEffect(() => { soundManager.playComplete(); }, []);

    const headline = pct === 1 ? 'Tuyệt vời, đúng hết!' : pct >= 0.8 ? 'Làm tốt lắm!' : pct >= 0.5 ? 'Cố thêm chút nữa nhé!' : 'Mình cùng ôn lại nhé!';
    const testLike = summary.mode === 'test' || summary.mode === 'matrix';

    return (
        <div className="study-result">
            {party && <Confetti />}
            <section className="study-score">
                <div className="study-score-ring" style={{ '--p': Math.round(pct * 100) } as React.CSSProperties}>
                    <div><span><b>{score}/{total}</b><br /><small>câu đúng · {Math.round(pct * 100)}%</small></span></div>
                </div>
                <div>
                    <span className="hub-eyebrow">{summary.title}</span>
                    <h1>{headline}</h1>
                    <p>{testLike ? `Thời gian ${fmtDuration(summary.seconds)}.` : `Đúng ngay lần đầu ${first}/${total} câu · ${fmtDuration(summary.seconds)}.`}
                        {summary.reviewCleared > 0 && ` Đã thuộc hẳn ${summary.reviewCleared} câu từng sai.`}</p>
                    {summary.stars > 0 ? <span className="study-stars"><Star size={18} fill="currentColor" />+{summary.stars} sao</span>
                        : summary.mode === 'review' ? <p style={{ fontSize: 13 }}>Ôn lại để nhớ chắc hơn. Sao được tính khi hoàn tất lịch ôn.</p> : total < (testLike ? 10 : 5) ? <p style={{ fontSize: 13 }}>Làm từ {testLike ? 10 : 5} câu trở lên để nhận sao nhé.</p> : null}
                    {mastered.length > 0 && <p style={{ marginTop: 10, fontWeight: 800, color: '#8a5a0d' }}><Trophy size={16} style={{ verticalAlign: -3 }} /> Thành thạo: {mastered.map(m => m.title).join(', ')}</p>}
                </div>
            </section>

            <div className="study-dialog-actions">
                <button className="study-btn" onClick={onHome}><Home size={20} />Về Ôn Luyện</button>
                {onRetryWrong && wrong.length > 0 && <button className="study-btn soft" onClick={onRetryWrong}><RotateCcw size={20} />Làm lại {wrong.length} câu sai</button>}
                {onPracticeWeak && <button className="study-btn soft" onClick={onPracticeWeak}><Target size={20} />Luyện tiếp kỹ năng yếu</button>}
                {onLearnWeak && <button className="study-btn soft" onClick={onLearnWeak}><BookOpen size={20} />Học lại bài</button>}
                <button className="study-btn ghost" onClick={onReport}><BarChart3 size={20} />Xem báo cáo</button>
            </div>

            {summary.deltas.length > 0 && (
                <section className="study-panel">
                    <h2>Tiến bộ kỹ năng</h2>
                    <table className="study-skilltable"><tbody>
                        {summary.deltas.map(d => {
                            const diff = Math.round((d.after - d.before) * 100);
                            return (
                                <tr key={d.skillId}>
                                    <td>{d.title}{d.mastered && <span className="study-badge"><Trophy size={11} />Thành thạo</span>}<small className="study-skill-score">{records.filter(r => r.q.skillId === d.skillId && r.correct).length}/{records.filter(r => r.q.skillId === d.skillId).length} câu đúng{onLearn && hasLesson(d.skillId) && <> · <button className="hub-text-link learn-inline-link" onClick={() => onLearn(d.skillId)}>Học bài</button></>}</small></td>
                                    <td>{Math.round(d.before * 100)} → {Math.round(d.after * 100)}% {diff > 0 ? <span className="study-up">▲{diff}</span> : diff < 0 ? <span className="study-down">▼{-diff}</span> : null}</td>
                                    <td style={{ width: 150 }}><div className="bar"><s style={{ width: `${Math.min(d.before, d.after) * 100}%` }} /><i style={{ width: `${d.after * 100}%`, opacity: d.after >= d.before ? 1 : 0.6 }} /></div></td>
                                </tr>
                            );
                        })}
                    </tbody></table>
                </section>
            )}

            <section className="study-panel">
                <h2>Xem lại bài làm</h2>
                <div className="study-review-list">
                    {records.map((r, i) => (
                        <div key={r.q.id} className="study-review-item">
                            <button onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}>
                                <span className={`mark ${r.correct ? 'ok' : 'bad'}`}>{r.correct ? <Check size={15} /> : <X size={15} />}</span>
                                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Câu {i + 1}. <Md inline>{r.q.questionText.split('\n')[0].replace(/[*_|#]/g, '')}</Md></span>
                                <ChevronDown size={18} style={{ transform: open === i ? 'rotate(180deg)' : 'none' }} />
                            </button>
                            {open === i && (
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: 16 }}><Md>{r.q.questionText}</Md></div>
                                    <QuestionVisual q={r.q} className="study-mini-visual" />
                                    <p>Em trả lời: <b style={{ color: r.correct ? 'var(--st-ok)' : 'var(--st-bad)' }}><Md inline>{answerText(r.answer)}</Md></b></p>
                                    <p>Đáp án đúng: <b style={{ color: 'var(--st-ok)' }}><Md inline>{correctText(r.q)}</Md></b></p>
                                    {r.q.explanation && <p style={{ whiteSpace: 'pre-line', color: 'var(--hub-muted)' }}><Md inline>{r.q.explanation}</Md></p>}
                                    <SolutionVisual q={r.q} />
                                    {r.q.steps && r.q.steps.length > 0 && <ol style={{ paddingLeft: 20 }}>{r.q.steps.map((s, k) => <li key={k}><Md inline>{s}</Md></li>)}</ol>}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
