// Sổ tay công thức: gom mọi khung QUY TẮC của các bài học trong lớp, theo chủ đề; tìm nhanh, in được.
import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Printer, Search } from 'lucide-react';
import { Grade } from '@/types';
import { SKILL_MAP, TOPIC_META } from '@/services/study/catalog';
import { loadLessonBook } from '@/services/study/lessons/load';
import { gradeVisible, hasLesson, isPublished } from '@/services/study/lessons/manifest';
import type { LessonBook } from '@/services/study/lessons/types';
import { Formula } from './blocks';
import { Md } from '../shared';
import '../study.css';
import './learn.css';

interface RuleItem { skillId: string; say: string; formula?: string; title?: string }

export function RulesBook({ grade, showAdvanced = false, onLearn }: { grade: Grade; showAdvanced?: boolean; onLearn: (skillId: string) => void }) {
    const [book, setBook] = useState<LessonBook | null>(null);
    const [q, setQ] = useState('');
    const [error, setError] = useState(false);
    const [attempt, setAttempt] = useState(0);
    useEffect(() => {
        let alive = true;
        setBook(null); setError(false);
        if (gradeVisible(grade)) loadLessonBook(grade).then(b => { if (alive) setBook(b); }).catch(() => { if (alive) setError(true); });
        else setBook({});
        return () => { alive = false; };
    }, [grade, attempt]);
    const groups = useMemo(() => {
        if (!book) return [];
        const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
        const needle = norm(q.trim());
        return TOPIC_META.filter(t => t.grade === grade).sort((a, b) => a.order - b.order).map(t => {
            const items: RuleItem[] = Object.values(book).filter(l => SKILL_MAP.get(l.skillId)?.topicId === t.id && hasLesson(l.skillId) && (showAdvanced || !SKILL_MAP.get(l.skillId)?.advanced))
                .flatMap(l => l.know.flatMap(k => k.blocks).flatMap(b => (b.t === 'rule' ? [{ skillId: l.skillId, say: b.say, formula: b.formula, title: b.title }] : [])))
                .filter(r => !needle || norm(`${t.title} ${r.title ?? ''} ${r.say} ${r.formula ?? ''} ${SKILL_MAP.get(r.skillId)?.title ?? ''}`).includes(needle));
            return { topic: t, items };
        }).filter(g => g.items.length);
    }, [book, grade, q, showAdvanced]);

    return (
        <div className="study-home learn-rules">
            <header className="learn-topic-head">
                <span className="study-topic-icon"><BookOpen size={26} /></span>
                <div>
                    <span className="hub-eyebrow">{grade === Grade.Preschool ? 'MẦM NON' : `LỚP ${grade}`}{!isPublished(grade) && ' · BẢN NHÁP'}</span>
                    <h1>Sổ tay công thức</h1>
                    <p>Mọi quy tắc trong các bài học, xếp theo chủ đề. Chạm tên bài để mở bài học.</p>
                </div>
            </header>
            <div className="learn-rules-tools study-no-print">
                <label className="learn-search"><Search size={18} /><input type="search" placeholder="Tìm: chu vi, diện tích, phân số…" value={q} onChange={e => setQ(e.target.value)} aria-label="Tìm quy tắc" /></label>
                <button className="study-btn soft" disabled={!groups.length} onClick={() => window.print()}><Printer size={18} />In sổ tay</button>
            </div>
            {error ? <div role="alert"><p>Chưa tải được sổ tay. Em thử lại nhé.</p><button className="study-btn" onClick={() => setAttempt(n => n + 1)}>Thử lại</button></div> : !book ? <p className="learn-lead" role="status">Đang mở sổ tay…</p> : !groups.length ? <p className="learn-lead">{q ? 'Không tìm thấy quy tắc phù hợp.' : 'Lớp này chưa có sổ tay công thức.'}</p> : groups.map(({ topic, items }) => (
                <section key={topic.id} className="study-strand learn-rules-group">
                    <div className="study-strand-head"><h2>{topic.title}</h2></div>
                    <div className="learn-rules-list">{items.map((r, i) => (
                        <article key={i} className="learn-rule">
                            <button className="learn-rule-label learn-rule-link" onClick={() => onLearn(r.skillId)}>{SKILL_MAP.get(r.skillId)?.title}</button>
                            <p><Md inline>{r.say}</Md></p>
                            {r.formula && <Formula text={r.formula} />}
                        </article>
                    ))}</div>
                </section>
            ))}
        </div>
    );
}
