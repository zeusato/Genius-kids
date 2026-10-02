// Hộp "Luyện tập" của một chủ đề: chọn kỹ năng, số câu, Luyện tập / Kiểm tra nhanh.
import React, { useState } from 'react';
import { ClipboardList, Sparkles, Target } from 'lucide-react';
import { Grade, StudyMode, Topic } from '@/types';
import { skillsWithContent } from '@/services/study/registry';
import { topicMeta } from '@/services/study/catalog';
import { STATUS_LABEL, skillStatus } from '@/services/study/progress';
import type { StudyProgress } from '@/services/study/types';
import { HubDialog } from '@/src/components/hub/HubShell';
import './study.css';

export const isTyping = (id: string) => id.includes('typing');
export const countChoices = (g: Grade) => (g === Grade.Preschool ? [6] : g === Grade.Grade1 ? [8, 10, 15] : [10, 15, 20, 30]);

export function Seg<T extends string | number>({ value, options, onChange, label }: { value: T; options: { v: NoInfer<T>; label: string }[]; onChange: (v: NoInfer<T>) => void; label: string }) {
    return <div className="study-seg" role="group" aria-label={label}>{options.map(o => <button key={String(o.v)} aria-label={o.label} aria-pressed={o.v === value} onClick={() => onChange(o.v)}>{o.label}</button>)}</div>;
}

export function TopicSheet({ topic, grade, progress, advancedOnly, onClose, onStart }: { topic: Topic; grade: Grade; progress: StudyProgress; advancedOnly: boolean; onClose: () => void; onStart: (skillIds: string[], mode: StudyMode, count: number) => void }) {
    const skills = skillsWithContent(topic.id, true).filter(s => !!s.advanced === advancedOnly);
    const [sel, setSel] = useState<string[]>(() => skills.map(s => s.id));
    const counts = countChoices(grade);
    const [count, setCount] = useState(grade === 0 ? 6 : 10);
    const toggle = (id: string) => setSel(p => (p.includes(id) ? p.filter(x => x !== id) : [...p, id]));
    const typing = isTyping(topic.id);
    return (
        <HubDialog title={topicMeta(topic.id)?.title ?? topic.title} onClose={onClose}>
            {!typing && skills.length > 0 && <>
                <p style={{ color: 'var(--hub-muted)', fontSize: 14, marginTop: 4 }}>Chọn kỹ năng muốn luyện:</p>
                <div className="study-skills">
                    {skills.map(s => {
                        const ss = progress.skills[s.id];
                        return (
                            <button key={s.id} className={`study-skill${sel.includes(s.id) ? ' selected' : ''}`} onClick={() => toggle(s.id)} aria-pressed={sel.includes(s.id)}>
                                <strong>{s.title}{s.advanced && <span className="study-badge"><Sparkles size={11} />Nâng cao</span>}</strong>
                                <em>{STATUS_LABEL[skillStatus(ss)]} · M{ss?.lvl ?? s.levels[0]}{ss?.a ? ` · ${Math.round(ss.m * 100)}%` : ''}</em>
                                <span className="bar"><i style={{ width: `${(ss?.m ?? 0) * 100}%` }} /></span>
                            </button>
                        );
                    })}
                </div>
            </>}
            <div className="study-form" style={{ margin: '12px 0 18px' }}>
                <label>Số câu<Seg label="Số câu" value={count} onChange={setCount} options={counts.map(n => ({ v: n, label: `${n} câu` }))} /></label>
            </div>
            <div className="study-dialog-actions">
                <button className="study-btn" disabled={!typing && !sel.length} onClick={() => onStart(typing ? [] : sel, 'practice', count)}><Target size={20} />Luyện tập</button>
                {grade !== Grade.Preschool && <button className="study-btn soft" disabled={!typing && !sel.length} onClick={() => onStart(typing ? [] : sel, 'test', count)}><ClipboardList size={20} />Kiểm tra nhanh</button>}
            </div>
        </HubDialog>
    );
}
