// Trang chủ đề: hai lối vào "Học bài" và "Luyện tập" + danh sách bài (mỗi bài: Học / Luyện).
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, Check, PencilLine, Sparkles, Target } from 'lucide-react';
import { Grade, StudyMode, type StudentProfile, type Topic } from '@/types';
import { skillsWithContent } from '@/services/study/registry';
import { topicMeta } from '@/services/study/catalog';
import { skillStatus, topicMastery } from '@/services/study/progress';
import type { StudyProgress } from '@/services/study/types';
import { loadLessonBook } from '@/services/study/lessons/load';
import { gradeVisible, hasLesson, isPublished } from '@/services/study/lessons/manifest';
import { lessonMinutes, lessonPages } from '@/services/study/lessons/pages';
import { lessonStatus, readLearn, seenCount } from '@/services/study/lessons/progress';
import type { LessonBook } from '@/services/study/lessons/types';
import { MN_ACTIVITIES, preschoolHref, type PreschoolLink } from '@/services/study/lessons/preschool';
import { PRESCHOOL_TOPICS } from '@/src/components/preschool/catalog';
import { Ring, TopicIcon } from '../shared';
import { TopicSheet } from '../TopicSheet';
import '../study.css';
import './learn.css';

export interface TopicPageProps {
    student: StudentProfile;
    progress: StudyProgress;
    topic: Topic;
    advanced: boolean;
    onLearn: (skillId: string) => void;
    onPracticeSkill: (skillId: string) => void;
    onStart: (skillIds: string[], mode: StudyMode, count: number) => void;
}

export function TopicPage({ student, progress, topic, advanced, onLearn, onPracticeSkill, onStart }: TopicPageProps) {
    const grade = student.grade;
    const meta = topicMeta(topic.id);
    const all = skillsWithContent(topic.id, true);
    const showAdv = advanced || !!progress.prefs.showAdvanced;
    const basic = all.filter(s => !s.advanced), adv = all.filter(s => s.advanced);
    const list = advanced ? adv : basic;
    const [book, setBook] = useState<LessonBook | null>(null);
    const [error, setError] = useState(false);
    const [attempt, setAttempt] = useState(0);
    const [sheet, setSheet] = useState(false);
    const navigate = useNavigate();
    // Mầm non: các hoạt động có sẵn gắn với kỹ năng của chủ đề (không trùng lặp)
    const links = [...new Map(list.flatMap(s => MN_ACTIVITIES[s.id] ?? []).map(l => [preschoolHref(l), l] as const)).values()];
    const activityOf = (l: PreschoolLink) => PRESCHOOL_TOPICS.find(t => t.id === l.topic)?.activities.find(a => a.id === l.activity);
    const openActivity = (l: PreschoolLink) => navigate(preschoolHref(l), { state: { returnTo: `/study/topic/${topic.id}`, preschoolOwner: student.id } });
    useEffect(() => { let alive = true; setBook(null); setError(false); loadLessonBook(grade).then(b => { if (alive) setBook(b); }).catch(() => { if (alive) setError(true); }); return () => { alive = false; }; }, [grade, attempt]);

    const learn = readLearn(student.learn);
    const withLesson = list.filter(s => hasLesson(s.id));
    const doneCount = withLesson.filter(s => lessonStatus(learn.lessons[s.id]) === 'done').length;
    const mastery = topicMastery(progress, list);
    const practiced = list.some(s => progress.skills[s.id]?.a);
    const resume = withLesson.find(s => lessonStatus(learn.lessons[s.id]) === 'reading') ?? withLesson.find(s => lessonStatus(learn.lessons[s.id]) === 'new');
    const allDone = withLesson.length > 0 && doneCount === withLesson.length;
    const suggestLearn = !doneCount && !practiced;
    const suggestPractice = allDone && mastery < 0.8;
    const draft = !isPublished(grade);

    const row = (s: typeof list[number], i: number) => {
        const lesson = book?.[s.id];
        const activity = MN_ACTIVITIES[s.id]?.[0];
        const st = learn.lessons[s.id];
        const status = lessonStatus(st);
        const pages = lesson ? lessonPages(lesson).length : 0;
        const ss = progress.skills[s.id];
        return (
            <li key={s.id} className="learn-row">
                <span className="learn-row-no">{i + 1}</span>
                <span className="learn-row-title"><strong>{s.title}{s.advanced && <span className="study-badge"><Sparkles size={11} />Nâng cao</span>}</strong>
                    <small>
                        {hasLesson(s.id) ? <>{status === 'done' ? <b className="ok"><Check size={13} /> Đã học</b> : status === 'reading' && lesson ? `Đang học ${seenCount(st?.v === lesson.v ? st : undefined, pages)}/${pages} trang` : 'Chưa học'}{lesson ? ` · ≈ ${lessonMinutes(lesson)} phút` : ''}</> : activity ? 'Học qua hoạt động' : 'Bài học đang soạn'}
                        {' · '}{ss?.a ? `Luyện ${Math.round(ss.m * 100)}%${skillStatus(ss) === 'mastered' ? ' ⭐' : ''}` : 'Chưa luyện'}
                    </small>
                </span>
                <span className="learn-row-actions">
                    {hasLesson(s.id) ? <button className="study-btn soft" onClick={() => onLearn(s.id)}><BookOpen size={17} />Học</button> : activity && <button className="study-btn soft" onClick={() => openActivity(activity)}><BookOpen size={17} />Học</button>}
                    <button className="study-btn ghost" onClick={() => onPracticeSkill(s.id)}><Target size={17} />Luyện</button>
                </span>
            </li>
        );
    };

    return (
        <div className="study-home learn-topic">
            <header className="learn-topic-head">
                <span className="study-topic-icon"><TopicIcon name={meta?.icon} /></span>
                <div>
                    <span className="hub-eyebrow">{grade === Grade.Preschool ? 'MẦM NON' : `LỚP ${grade}`}{advanced ? ' · NÂNG CAO' : ` · ${[...new Set(list.map(s => `HK${s.term}`))].join(' · ')}`}{draft ? ' · BẢN NHÁP' : ''}</span>
                    <h1>{meta?.title ?? topic.title}</h1>
                    <p>{meta?.description ?? topic.description}</p>
                </div>
                <Ring value={mastery} done={list.length > 0 && list.every(s => skillStatus(progress.skills[s.id]) === 'mastered')} />
            </header>

            <div className="learn-paths">
                <section className={`learn-path learn${suggestLearn ? ' suggest' : ''}`}>
                    {suggestLearn && <span className="learn-suggest">Nên học trước</span>}
                    <span className="learn-path-icon"><BookOpen size={28} /></span>
                    <h2>Học bài</h2>
                    <p>{grade === Grade.Preschool ? 'Xem, nghe và chạm cùng các bạn. Bài học tự đọc to.' : 'Kiến thức và cách giải từng dạng bài, có ví dụ mẫu và chỗ dễ nhầm.'}</p>
                    {withLesson.length > 0 ? <>
                        <small>{allDone ? 'Đã học hết ✓' : `Đã học ${doneCount}/${withLesson.length} bài`}</small>
                        <button className="study-btn" onClick={() => onLearn((allDone ? withLesson[0] : resume ?? withLesson[0]).id)}>
                            {allDone ? 'Xem lại bài' : resume && lessonStatus(learn.lessons[resume.id]) === 'reading' ? `Học tiếp: ${resume.title}` : 'Bắt đầu học'}<ArrowRight size={18} />
                        </button>
                    </> : links.length > 0 && <>
                        <small>{links.length} hoạt động Mầm non</small>
                        <button className="study-btn" onClick={() => openActivity(links[0])}>Học cùng các bạn<ArrowRight size={18} /></button>
                    </>}
                </section>
                <section className={`learn-path practice${suggestPractice ? ' suggest' : ''}`}>
                    {suggestPractice && <span className="learn-suggest">Nên luyện thêm</span>}
                    <span className="learn-path-icon"><PencilLine size={28} /></span>
                    <h2>Luyện tập</h2>
                    <p>Làm bài ôn luyện, chấm từng câu, có gợi ý khi sai.</p>
                    <small>{practiced ? `Thành thạo ${Math.round(mastery * 100)}%` : 'Chưa luyện'}</small>
                    <button className="study-btn" onClick={() => setSheet(true)}>Luyện tập<ArrowRight size={18} /></button>
                </section>
            </div>
            {error && <div className="learn-msg bad" role="alert"><p>Chưa tải được danh sách bài học.</p><button className="study-btn soft" onClick={() => setAttempt(n => n + 1)}>Thử lại</button></div>}

            {links.length > 0 && <section className="study-strand">
                <div className="study-strand-head"><h2>Học cùng các bạn</h2><span>Hoạt động Mầm non</span></div>
                <div className="learn-activities">{links.map(l => { const a = activityOf(l); return a && (
                    <button key={preschoolHref(l)} className="learn-activity" onClick={() => openActivity(l)}>
                        <small>{a.label}</small><strong>{a.title}</strong><span>{a.desc}</span>
                    </button>); })}</div>
            </section>}

            <section className="study-strand">
                <div className="study-strand-head"><h2>Các bài trong chủ đề</h2><span>{list.length} bài</span></div>
                <ol className="learn-rows">{list.map(row)}</ol>
                {!advanced && showAdv && adv.length > 0 && <>
                    <div className="study-strand-head" style={{ marginTop: 18 }}><h2><Sparkles size={18} /> Nâng cao</h2></div>
                    <ol className="learn-rows">{adv.map(row)}</ol>
                </>}
            </section>
            {sheet && <TopicSheet topic={topic} grade={grade} progress={progress} learn={student.learn} onLearn={onLearn} advancedOnly={advanced} onClose={() => setSheet(false)} onStart={(ids, mode, n) => { setSheet(false); onStart(ids, mode, n); }} />}
        </div>
    );
}

/** Chủ đề có mở Trang chủ đề không (D10): có ít nhất một bài học trong lớp được hiện. */
export const topicLearnable = (topicId: string, advanced = false): boolean =>
    skillsWithContent(topicId, true).filter(s => !!s.advanced === advanced).some(s => hasLesson(s.id) || (!!MN_ACTIVITIES[s.id] && gradeVisible(s.grade)));
