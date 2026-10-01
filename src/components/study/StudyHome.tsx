// Trang chủ Ôn Luyện: thẻ "Ôn hôm nay", lối tắt, chủ đề theo mạch kiến thức (vòng % thành thạo).
import React, { useMemo, useState } from 'react';
import { BarChart3, CheckCircle2, ChevronDown, ChevronRight, ClipboardList, Flame, Keyboard, Play, Printer, RotateCcw, SlidersHorizontal, Sparkles, Target } from 'lucide-react';
import { Grade, StudentProfile, StudyMode, Topic } from '@/types';
import { getTopicsByGrade } from '@/services/mathEngine';
import { skillsWithContent } from '@/services/study/registry';
import { SKILL_MAP, STRAND_LABEL, topicMeta } from '@/services/study/catalog';
import { STATUS_LABEL, currentTerm, dailyCount, dueReviews, liveStreak, localDay, skillStatus, topicMastery } from '@/services/study/progress';
import type { Level, Strand, StudyProgress, Term } from '@/services/study/types';
import { HubDialog } from '@/src/components/hub/HubShell';
import { Ring, TopicIcon } from './shared';
import './study.css';

const STRAND_ORDER: Strand[] = ['number', 'geometry', 'measurement', 'statistics', 'probability', 'explore'];
const isTyping = (id: string) => id.includes('typing');
const countChoices = (g: Grade) => (g === Grade.Preschool ? [6] : g === Grade.Grade1 ? [8, 10, 15] : [10, 15, 20, 30]);
export interface CustomSpec { topicIds: string[]; skillIds: string[]; count: number; mode: StudyMode; timed: boolean; story: boolean; level?: Level }

export interface HomeActions {
    onDaily: () => void;
    onReview: () => void;
    onTopic: (topicId: string, skillIds: string[], mode: StudyMode, count: number) => void;
    onMatrix: (term: Term | 'all', count: number) => void;
    onCustom: (spec: CustomSpec) => void;
    onPrint: (spec: CustomSpec) => void;
    onReport: () => void;
    onShowAdvanced: (v: boolean) => void;
}

export function StudyHome({ student, progress, aiReady, actions }: { student: StudentProfile; progress: StudyProgress; aiReady: boolean; actions: HomeActions }) {
    const grade = student.grade;
    const now = new Date();
    const topics = useMemo(() => getTopicsByGrade(grade), [grade]);
    const [sheet, setSheet] = useState<Topic | null>(null);
    const [advancedOnly, setAdvancedOnly] = useState(false);
    const [dialog, setDialog] = useState<'matrix' | 'custom' | 'print' | null>(null);
    const showAdv = !!progress.prefs.showAdvanced;

    const due = dueReviews(progress, now).length;
    const streak = liveStreak(progress, now);
    const doneToday = progress.dailyDone === localDay(now);
    const basic = topics.filter(t => !isTyping(t.id) && !topicMeta(t.id)?.advanced);
    const advanced = topics.filter(t => skillsWithContent(t.id, true).some(s => s.advanced));
    const typing = topics.filter(t => isTyping(t.id));
    const byStrand = STRAND_ORDER.map(st => ({ st, list: basic.filter(t => (topicMeta(t.id)?.strand ?? 'number') === st) })).filter(x => x.list.length);
    const gradeName = grade === Grade.Preschool ? 'Mầm non' : `Lớp ${grade}`;

    const card = (t: Topic, advancedCard = false) => {
        const meta = topicMeta(t.id);
        const skills = skillsWithContent(t.id, true).filter(s => !!s.advanced === advancedCard);
        const m = topicMastery(progress, skills);
        const done = skills.filter(s => !s.advanced && skillStatus(progress.skills[s.id]) === 'mastered').length;
        const nBasic = skills.filter(s => !s.advanced).length || skills.length;
        return (
            <button key={t.id} className="study-topic" onClick={() => { setSheet(t); setAdvancedOnly(advancedCard); }}>
                <span className="study-topic-icon">{isTyping(t.id) ? <Keyboard size={24} /> : <TopicIcon name={meta?.icon} />}</span>
                <span>
                    <strong>{meta?.title ?? t.title}</strong>
                    <small>{meta?.description ?? t.description}</small>
                    {!isTyping(t.id) && <span className="term">{advancedCard ? 'NÂNG CAO' : `${[...new Set(skills.map(s => `HK${s.term}`))].join(' · ')} · ${done === nBasic ? 'THÀNH THẠO ⭐' : skills.some(s => progress.skills[s.id]?.a) ? `ĐANG HỌC ${skills.filter(s => progress.skills[s.id]?.a).length}/${nBasic}` : 'CHƯA HỌC'}`}</span>}
                </span>
                {!isTyping(t.id) && !advancedCard ? <Ring value={m} done={done === nBasic && nBasic > 0} /> : <ChevronRight size={20} />}
            </button>
        );
    };

    return (
        <div className="study-home">
            <section className="study-daily">
                <div className="study-daily-copy">
                    <span className="hub-eyebrow">ÔN LUYỆN · {gradeName.toUpperCase()}{currentTerm(now) ? ` · HỌC KÌ ${currentTerm(now)}` : ''}</span>
                    <h1>{doneToday ? 'Hôm nay em đã ôn rồi!' : 'Ôn hôm nay'}</h1>
                    <p>{doneToday ? 'Giỏi lắm! Em có thể ôn thêm một lượt hoặc chọn chủ đề bên dưới.' : `${dailyCount(grade)} câu chọn riêng cho em: ôn lại câu từng sai, luyện kỹ năng còn yếu và thử kỹ năng mới.`}</p>
                    <div className="study-daily-meta">
                        <span className="study-pill flame"><Flame size={15} />{streak ? `${streak} ngày liên tiếp` : 'Bắt đầu chuỗi ngày'}</span>
                        {due > 0 && <span className="study-pill"><RotateCcw size={15} />{due} câu cần ôn</span>}
                        {doneToday && <span className="study-pill"><CheckCircle2 size={15} />Đã xong hôm nay</span>}
                    </div>
                    <button className="study-btn" onClick={actions.onDaily}><Play size={20} fill="currentColor" />{doneToday ? 'Ôn thêm' : 'Bắt đầu'}</button>
                </div>
                <div className="study-daily-art"><picture><source media="(max-width: 767px)" srcSet="/Genius-kids/hub/art/study-sm.webp" /><img src="/Genius-kids/hub/art/study.webp" alt="" /></picture></div>
            </section>

            {grade !== Grade.Preschool && <div className="study-chips">
                {progress.review.length > 0 && <button className="study-chip" onClick={actions.onReview}><RotateCcw size={18} />Ôn câu sai<b>{due || progress.review.length}</b></button>}
                <button className="study-chip" onClick={() => setDialog('matrix')}><ClipboardList size={18} />Đề kiểm tra</button>
                <button className="study-chip" onClick={() => setDialog('custom')}><SlidersHorizontal size={18} />Tự chọn đề</button>
                <button className="study-chip" onClick={() => setDialog('print')}><Printer size={18} />In phiếu bài tập</button>
                <button className="study-chip" onClick={actions.onReport}><BarChart3 size={18} />Báo cáo</button>
            </div>}

            {byStrand.map(({ st, list }) => (
                <section key={st} className="study-strand">
                    <div className="study-strand-head"><h2>{STRAND_LABEL[st]}</h2><span>{list.length} chủ đề</span></div>
                    <div className="study-grid">{list.map(t => card(t))}</div>
                </section>
            ))}
            {advanced.length > 0 && <>
                <button className="study-advanced-toggle" onClick={() => actions.onShowAdvanced(!showAdv)} aria-expanded={showAdv}>
                    <Sparkles size={18} />Nâng cao ({advanced.length} chủ đề ngoài chương trình lớp {grade}) <ChevronDown size={18} style={{ transform: showAdv ? 'rotate(180deg)' : 'none' }} />
                </button>
                {showAdv && <div className="study-grid" style={{ marginTop: 12 }}>{advanced.map(t => card(t, true))}</div>}
            </>}
            {typing.length > 0 && <section className="study-strand">
                <div className="study-strand-head"><h2>Luyện gõ phím</h2></div>
                <div className="study-grid">{typing.map(t => card(t))}</div>
            </section>}

            {sheet && <TopicSheet topic={sheet} grade={grade} progress={progress} advancedOnly={advancedOnly} onClose={() => setSheet(null)} onStart={(ids, mode, n) => { setSheet(null); actions.onTopic(sheet.id, ids, mode, n); }} />}
            {dialog === 'matrix' && <MatrixDialog grade={grade} onClose={() => setDialog(null)} onStart={(t, n) => { setDialog(null); actions.onMatrix(t, n); }} />}
            {(dialog === 'custom' || dialog === 'print') && <CustomDialog print={dialog === 'print'} grade={grade} topics={topics.filter(t => (!isTyping(t.id) || dialog === 'custom') && (!topicMeta(t.id)?.advanced || showAdv))} aiReady={aiReady} progress={progress}
                onClose={() => setDialog(null)}
                onStart={spec => { setDialog(null); if (dialog === 'print') actions.onPrint(spec); else actions.onCustom(spec); }} />}
        </div>
    );
}

function Seg<T extends string | number>({ value, options, onChange, label }: { value: T; options: { v: NoInfer<T>; label: string }[]; onChange: (v: NoInfer<T>) => void; label: string }) {
    return <div className="study-seg" role="group" aria-label={label}>{options.map(o => <button key={String(o.v)} aria-label={o.label} aria-pressed={o.v === value} onClick={() => onChange(o.v)}>{o.label}</button>)}</div>;
}

function TopicSheet({ topic, grade, progress, advancedOnly, onClose, onStart }: { topic: Topic; grade: Grade; progress: StudyProgress; advancedOnly: boolean; onClose: () => void; onStart: (skillIds: string[], mode: StudyMode, count: number) => void }) {
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

function MatrixDialog({ grade, onClose, onStart }: { grade: Grade; onClose: () => void; onStart: (term: Term | 'all', count: number) => void }) {
    const [term, setTerm] = useState<Term | 'all'>(currentTerm() ?? 'all');
    const [count, setCount] = useState(grade <= Grade.Grade1 ? 10 : 20);
    return (
        <HubDialog title="Đề kiểm tra tổng hợp" onClose={onClose}>
            <p style={{ color: 'var(--hub-muted)', fontSize: 14, margin: '4px 0 14px', lineHeight: 1.6 }}>Đề trộn đủ các mạch kiến thức, theo tỉ lệ mức độ Nhận biết – Thông hiểu – Vận dụng là 5 : 3 : 2. Có tính giờ, chấm điểm khi nộp bài.</p>
            <div className="study-form" style={{ marginBottom: 18 }}>
                <label>Phạm vi<Seg label="Phạm vi" value={term} onChange={setTerm} options={[{ v: 1 as Term, label: 'Học kì 1' }, { v: 2 as Term, label: 'Học kì 2' }, { v: 'all' as const, label: 'Cả năm' }]} /></label>
                <label>Số câu<Seg label="Số câu" value={count} onChange={setCount} options={[10, 20, 30].map(n => ({ v: n, label: `${n} câu · ${Math.round(n * (grade <= 2 ? 1.5 : 1))} phút` }))} /></label>
            </div>
            <div className="study-dialog-actions"><button className="study-btn" onClick={() => onStart(term, count)}><Play size={20} fill="currentColor" />Làm bài</button></div>
        </HubDialog>
    );
}

function CustomDialog({ print, grade, topics, aiReady, progress, onClose, onStart }: { print: boolean; grade: Grade; topics: Topic[]; aiReady: boolean; progress: StudyProgress; onClose: () => void; onStart: (spec: CustomSpec) => void }) {
    const available = topics.flatMap(t => skillsWithContent(t.id, !!progress.prefs.showAdvanced)).filter(s => !s.advanced || progress.prefs.showAdvanced);
    const [bySkill, setBySkill] = useState(print);
    const [sel, setSel] = useState<string[]>([]);
    const [skillIds, setSkillIds] = useState<string[]>(() => print ? available.filter(s => !s.advanced && !s.legacy)
        .sort((a, b) => (progress.skills[a.id]?.m ?? 0) - (progress.skills[b.id]?.m ?? 0)).slice(0, 3).map(s => s.id) : []);
    const counts = print ? [10, 20, 30] : countChoices(grade);
    const [count, setCount] = useState(print ? 20 : grade === 0 ? 6 : 10);
    const [mode, setMode] = useState<StudyMode>('practice');
    const [timed, setTimed] = useState(true);
    const [level, setLevel] = useState<0 | Level>(0);
    const [story, setStory] = useState(false);
    const toggle = (id: string) => (bySkill ? setSkillIds : setSel)(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
    const selected = bySkill ? skillIds : sel;
    const choices = bySkill ? available.map(s => ({ id: s.id, title: s.title, advanced: s.advanced })) : topics.map(t => ({ id: t.id, title: topicMeta(t.id)?.title ?? t.title, advanced: topicMeta(t.id)?.advanced }));
    const start = () => onStart({ topicIds: bySkill ? [...new Set(skillIds.map(id => SKILL_MAP.get(id)?.topicId ?? id.replace(/\.legacy$/, '')))] : sel,
        skillIds: bySkill ? skillIds : [], count, mode: grade === 0 ? 'practice' : mode, timed: grade > 0 && timed, story, level: level || undefined });
    return (
        <HubDialog title={print ? 'In phiếu bài tập' : 'Tự chọn đề'} onClose={onClose}>
            <div className="study-form" style={{ margin: '8px 0 18px' }}>
                <Seg label="Chọn nội dung" value={bySkill ? 'skill' : 'topic'} onChange={v => setBySkill(v === 'skill')} options={[{ v: 'topic', label: 'Theo chủ đề' }, { v: 'skill', label: 'Theo kỹ năng' }]} />
                <button className="hub-text-link" onClick={() => (bySkill ? setSkillIds : setSel)(selected.length === choices.length ? [] : choices.map(c => c.id))}>{selected.length === choices.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}</button>
                <div className="study-check-list">
                    {choices.map(c => <label key={c.id}><input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggle(c.id)} />{c.title}{c.advanced && <span className="study-badge">Nâng cao</span>}</label>)}
                </div>
                <label>Số câu<Seg label="Số câu" value={count} onChange={setCount} options={counts.map(n => ({ v: n, label: `${n} câu` }))} /></label>
                <label>Mức độ<Seg label="Mức độ" value={level} onChange={setLevel} options={[{ v: 0, label: 'Tự động' }, { v: 1, label: 'M1 · Nhận biết' }, { v: 2, label: 'M2 · Thông hiểu' }, { v: 3, label: 'M3 · Vận dụng' }]} /></label>
                {!print && grade > 0 && <>
                    <label>Cách làm<Seg label="Cách làm" value={mode} onChange={setMode} options={[{ v: 'practice', label: 'Luyện tập' }, { v: 'test', label: 'Kiểm tra' }]} /></label>
                    {mode === 'test' && <label className="study-check"><input type="checkbox" checked={timed} onChange={e => setTimed(e.target.checked)} />Có tính giờ</label>}
                </>}
                {!print && aiReady && <label className="study-check"><input type="checkbox" checked={story} onChange={e => setStory(e.target.checked)} /><Sparkles size={16} />Cốt truyện AI (không tính tiến độ kỹ năng)</label>}
            </div>
            <div className="study-dialog-actions">
                <button className="study-btn" disabled={!selected.length} onClick={start}>{print ? <><Printer size={20} />Tạo phiếu</> : <><Play size={20} fill="currentColor" />Bắt đầu</>}</button>
            </div>
        </HubDialog>
    );
}
