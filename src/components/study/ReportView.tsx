// Báo cáo tiến độ cho bé & phụ huynh: chuỗi ngày, 14 ngày gần nhất, kỹ năng theo chủ đề, bài gần đây.
import React, { useMemo } from 'react';
import { CheckCircle2, Flame, Printer, RotateCcw, Target, Trophy } from 'lucide-react';
import { Grade, StudentProfile } from '@/types';
import { getTopicsByGrade } from '@/services/mathEngine';
import { skillsWithContent } from '@/services/study/registry';
import { SKILLS, SKILL_MAP, STRAND_LABEL, topicMeta } from '@/services/study/catalog';
import { DAY, STATUS_LABEL, dueReviews, liveStreak, localDay, skillStatus, topicMastery } from '@/services/study/progress';
import type { StudyProgress } from '@/services/study/types';
import { Ring } from './shared';
import './study.css';

const MODE: Record<string, string> = { practice: 'Luyện tập', test: 'Kiểm tra', daily: 'Ôn hôm nay', review: 'Ôn câu sai', matrix: 'Đề tổng hợp' };
const WEEKDAY = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

export function ReportView({ student, progress, onPractice }: { student: StudentProfile; progress: StudyProgress; onPractice: (skillId: string) => void }) {
    const now = new Date();
    const days = Array.from({ length: 14 }, (_, i) => {
        const d = new Date(now.getTime() - (13 - i) * DAY);
        return { d, key: localDay(d), ...(progress.days[localDay(d)] ?? { n: 0, c: 0 }) };
    });
    const maxN = Math.max(10, ...days.map(d => d.n));
    const sum = days.reduce((a, d) => ({ n: a.n + d.n, c: a.c + d.c }), { n: 0, c: 0 });
    const topics = useMemo(() => getTopicsByGrade(student.grade).filter(t => !t.id.includes('typing')), [student.grade]);
    const all = SKILLS.filter(s => s.grade === student.grade && !s.advanced && !s.legacy);
    const mastered = all.filter(s => skillStatus(progress.skills[s.id]) === 'mastered');
    const weak = all.filter(s => progress.skills[s.id]?.a && skillStatus(progress.skills[s.id]) !== 'mastered').sort((a, b) => progress.skills[a.id].m - progress.skills[b.id].m).slice(0, 5);
    const review = [...progress.review].filter(it => SKILL_MAP.get(it.skillId)?.grade === student.grade).sort((a, b) => a.due.localeCompare(b.due)).slice(0, 5);
    const strands = [...new Set(all.map(s => s.strand))];
    const recent = [...(student.history || [])].filter(r => !r.mode || r.mode === 'test' || r.mode === 'matrix').sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);

    return (
        <div className="study-result study-report">
            <div className="study-report-heading"><h1>Báo cáo học tập · {student.name}</h1><button className="study-btn ghost study-no-print" onClick={() => window.print()}><Printer size={20} />In báo cáo</button></div>
            <section className="study-panel" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14 }}>
                <Stat icon={<Flame size={20} />} value={`${liveStreak(progress, now)}`} label="ngày liên tiếp" />
                <Stat icon={<Target size={20} />} value={`${sum.n}`} label="câu trong 14 ngày" />
                <Stat icon={<CheckCircle2 size={20} />} value={sum.n ? `${Math.round(sum.c / sum.n * 100)}%` : '—'} label="trả lời đúng" />
                <Stat icon={<Trophy size={20} />} value={`${mastered.length}/${all.length}`} label="kỹ năng thành thạo" />
                <Stat icon={<RotateCcw size={20} />} value={`${progress.review.length}`} label={`câu chờ ôn (${dueReviews(progress, now).length} đến hạn)`} />
            </section>

            <section className="study-panel">
                <h2>Thành thạo theo mạch</h2>
                {strands.map(st => {
                    const value = topicMastery(progress, all.filter(s => s.strand === st));
                    return <div className="study-report-row" key={st}><span>{STRAND_LABEL[st]}</span><progress max={1} value={value} aria-label={STRAND_LABEL[st]} /><b>{Math.round(value * 100)}%</b></div>;
                })}
            </section>
            <section className="study-panel">
                <h2>Cần luyện thêm</h2>
                {weak.length ? weak.map(s => <div key={s.id} className="study-report-row"><span>{s.title}<small>{Math.round(progress.skills[s.id].m * 100)}% thành thạo</small></span><button className="study-btn soft study-no-print" onClick={() => onPractice(s.id)}>Luyện ngay</button></div>) : <p>Hoàn thành một phiên luyện tập để xem gợi ý kỹ năng tiếp theo.</p>}
            </section>
            <section className="study-panel">
                <details><summary>Đã thành thạo: {mastered.length} kỹ năng</summary><ul className="study-mastered-list">{mastered.map(s => <li key={s.id}>{s.title}</li>)}</ul></details>
            </section>
            {review.length > 0 && <section className="study-panel"><h2>Câu sai gần đây</h2>{review.map(it => <div className="study-report-row" key={it.key}><span>{it.q.questionText}<small>Ôn ngày {new Date(it.due).toLocaleDateString('vi-VN')}</small></span></div>)}</section>}

            <section className="study-panel">
                <h2>14 ngày gần đây</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(14, 1fr)', gap: 6, alignItems: 'end', height: 150 }}>
                    {days.map(d => (
                        <div key={d.key} title={`${d.key}: ${d.c}/${d.n} câu đúng`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                            <div style={{ width: '100%', maxWidth: 26, height: `${(d.n / maxN) * 110}px`, minHeight: d.n ? 4 : 2, borderRadius: 6, background: 'var(--hub-line)', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: d.n ? `${(d.c / d.n) * 100}%` : 0, background: 'var(--hub-accent)' }} />
                            </div>
                            <small style={{ fontSize: 10.5, color: 'var(--hub-muted)', fontWeight: 800 }}>{WEEKDAY[d.d.getDay()]}</small>
                        </div>
                    ))}
                </div>
                <p style={{ fontSize: 12.5, color: 'var(--hub-muted)', marginTop: 8 }}>Cột cao = số câu đã làm; phần đậm = số câu đúng.</p>
            </section>

            <section className="study-panel">
                <h2>Kỹ năng theo chủ đề{student.grade === Grade.Preschool ? '' : ` — Lớp ${student.grade}`}</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {topics.map(t => {
                        const skills = skillsWithContent(t.id, true);
                        const started = skills.filter(s => progress.skills[s.id]?.a);
                        return (
                            <div key={t.id} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 14, alignItems: 'start' }}>
                                <Ring value={topicMastery(progress, skills)} />
                                <div>
                                    <strong style={{ fontSize: 15.5 }}>{topicMeta(t.id)?.title ?? t.title}{topicMeta(t.id)?.advanced && <span className="study-badge">Nâng cao</span>}</strong>
                                    {started.length ? (
                                        <table className="study-skilltable" style={{ marginTop: 6 }}><tbody>
                                            {started.map(s => {
                                                const ss = progress.skills[s.id];
                                                return <tr key={s.id}><td>{s.title}</td><td>{STATUS_LABEL[skillStatus(ss)]} · {ss.c}/{ss.a}</td><td style={{ width: 150 }}><div className="bar"><i style={{ width: `${ss.m * 100}%` }} /></div></td></tr>;
                                            })}
                                        </tbody></table>
                                    ) : <p style={{ fontSize: 13, color: 'var(--hub-muted)', marginTop: 2 }}>Chưa luyện · {skills.length} kỹ năng</p>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {recent.length > 0 && (
                <section className="study-panel">
                    <h2>Bài kiểm tra gần đây</h2>
                    <table className="study-skilltable"><tbody>
                        {recent.map(r => (
                            <tr key={r.id}>
                                <td>{new Date(r.date).toLocaleDateString('vi-VN')} · {MODE[r.mode || 'test']}</td>
                                <td>{r.score}/{r.totalQuestions}</td>
                                <td style={{ width: 150 }}><div className="bar"><i style={{ width: `${r.totalQuestions ? (r.score / r.totalQuestions) * 100 : 0}%` }} /></div></td>
                            </tr>
                        ))}
                    </tbody></table>
                </section>
            )}
        </div>
    );
}

const Stat = ({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ color: 'var(--hub-accent)' }}>{icon}</span>
        <b style={{ fontSize: 28, fontWeight: 900, letterSpacing: -0.5 }}>{value}</b>
        <small style={{ color: 'var(--hub-muted)', fontWeight: 700, fontSize: 12.5 }}>{label}</small>
    </div>
);
