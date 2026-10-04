// Trang bài học (toàn màn hình như Player): Mở đầu → Em cần biết → Dạng / Ví dụ mẫu → Chỗ dễ nhầm → Em thử → Ghi nhớ.
import React, { useEffect, useRef, useState } from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, Check, List, Target, X } from 'lucide-react';
import type { StudentProfile } from '@/types';
import { SKILL_MAP, topicMeta } from '@/services/study/catalog';
import { skillsWithContent } from '@/services/study/registry';
import { gradeOfSkill, loadLessonBook } from '@/services/study/lessons/load';
import { hasLesson, isPublished, topicLessonIds } from '@/services/study/lessons/manifest';
import { lessonPages, tryIndex } from '@/services/study/lessons/pages';
import { missingBefore, passed, readLearn, seenCount } from '@/services/study/lessons/progress';
import type { Lesson, LessonPage } from '@/services/study/lessons/types';
import { useStudentActions } from '@/src/contexts/StudentContext';
import type { LessonAction } from '@/services/study/lessons/progress';
import { HubDialog } from '@/src/components/hub/HubShell';
import { SpeakButton } from '@/src/components/shared/SpeakButton';
import { cancelSpeech } from '@/src/utils/speech';
import { questionToSpeech } from '@/src/utils/questionSpeech';
import { Md } from '../shared';
import { BlockView, MistakeCard, Pic, RuleBox, WorkedSteps } from './blocks';
import { LessonTry, type TryResult } from './LessonTry';
import '../study.css';
import './learn.css';

interface Nav { onExit: (topicId: string) => void; onPractice: (skillId: string) => void; onOpenLesson: (skillId: string) => void }

/** Route /study/learn/:skillId — tải nội dung lớp rồi mở bài. */
export function LessonScreen({ student, tts, ...nav }: Nav & { student: StudentProfile; tts: boolean }) {
    const { saveLesson } = useStudentActions();
    const { skillId = '' } = useParams();
    const [book, setBook] = useState<Record<string, Lesson> | null>(null);
    const [error, setError] = useState('');
    const grade = gradeOfSkill(skillId);
    const available = hasLesson(skillId);
    useEffect(() => {
        let alive = true;
        setBook(null); setError('');
        if (available) loadLessonBook(grade).then(b => { if (alive) setBook(b); }).catch(() => { if (alive) setError('Chưa tải được bài học. Em kiểm tra mạng rồi thử lại nhé.'); });
        return () => { alive = false; };
    }, [grade, available]);
    if (!available) return <Navigate to="/study" replace />;
    const lesson = book?.[skillId];
    const shell = (body: React.ReactNode) => <div className="discovery-hub" data-theme={student.currentThemeId || 'theme_classic'}><div className="learn-loading">{body}</div></div>;
    if (error) return shell(<><p>{error}</p><button className="study-btn" onClick={() => nav.onExit(SKILL_MAP.get(skillId)?.topicId ?? '')}>Quay lại</button></>);
    if (!book) return shell(<p>Đang mở bài học…</p>);
    if (!lesson) return shell(<><p>Bài này chưa có nội dung.</p><button className="study-btn" onClick={() => nav.onExit(SKILL_MAP.get(skillId)?.topicId ?? '')}>Quay lại</button></>);
    return <LessonReader key={`${student.id}:${skillId}`} lesson={lesson} student={student} tts={tts || !!lesson.autoRead} saveLesson={saveLesson} {...nav} />;
}

function pageSpeech(lesson: Lesson, page: LessonPage): string {
    const parts: string[] = [page.title];
    if (page.kind === 'intro') parts.push(`Học xong bài này, em sẽ ${lesson.goal}`, lesson.hook?.md ?? '');
    if (page.kind === 'know') for (const b of lesson.know[page.index!].blocks) {
        if (b.t === 'text' || b.t === 'note') parts.push(b.md);
        if (b.t === 'rule') parts.push(b.say);
    }
    if (page.kind === 'form') { const f = lesson.forms[page.index!]; parts.push('Dấu hiệu nhận biết.', f.cue, 'Cách làm.', ...f.steps); }
    if (page.kind === 'example') parts.push('Đề bài.', lesson.forms[page.index!].example.problem);
    if (page.kind === 'mistake') { const m = lesson.mistakes[page.index!]; parts.push('Bạn Bi làm thế này.', m.wrong, 'Cách đúng.', m.right); }
    if (page.kind === 'remember') parts.push(...lesson.remember);
    return questionToSpeech(parts.filter(Boolean).join('. ').replace(/\*\*/g, ''));
}

export function LessonReader({ lesson, student, tts, saveLesson, onExit, onPractice, onOpenLesson }: Nav & { lesson: Lesson; student: StudentProfile; tts: boolean; saveLesson: (owner: string, action: LessonAction) => { ok: boolean; earned: number; completedNow: boolean } }) {
    const pages = lessonPages(lesson);
    const tIdx = tryIndex(pages);
    const [params, setParams] = useSearchParams();
    const found = pages.findIndex(p => p.id === params.get('page'));
    const state0 = readLearn(student.learn).lessons[lesson.skillId];
    const idx = found >= 0 ? found : state0 && state0.v === lesson.v && !state0.done && state0.at < pages.length ? state0.at : 0;
    const page = pages[idx];
    const skill = SKILL_MAP.get(lesson.skillId)!;
    const topic = topicMeta(skill.topicId);
    const inTopic = topicLessonIds(skillsWithContent(skill.topicId, !!student.study?.prefs.showAdvanced || !!skill.advanced).map(s => s.id));
    const nextLesson = inTopic[inTopic.indexOf(lesson.skillId) + 1];
    const state = readLearn(student.learn).lessons[lesson.skillId];
    const seen = state && state.v === lesson.v ? seenCount(state, pages.length) : 0;
    const [showList, setShowList] = useState(false);
    const [saveError, setSaveError] = useState(false);
    const [tryOut, setTryOut] = useState<(TryResult & { ok: boolean; earned: number }) | null>(null);
    const heading = useRef<HTMLHeadingElement>(null);
    const first = useRef(true);
    const atRef = useRef(idx);
    atRef.current = idx;

    // mở lần đầu không có ?page= thì về trang đang đọc dở
    useEffect(() => {
        if (found < 0 && state0 && state0.v === lesson.v && state0.at > 0 && state0.at < pages.length && !state0.done) setParams({ page: pages[state0.at].id }, { replace: true });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => {
        cancelSpeech();
        setSaveError(!saveLesson(student.id, { kind: 'visit', skillId: lesson.skillId, v: lesson.v, page: idx, pages: pages.length }).ok);
        if (!first.current) { heading.current?.focus({ preventScroll: true }); window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior }); }
        first.current = false;
    }, [idx]); // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => {
        const leave = () => saveLesson(student.id, { kind: 'leave', skillId: lesson.skillId, v: lesson.v, page: atRef.current });
        const onVis = () => { if (document.visibilityState === 'hidden') leave(); };
        document.addEventListener('visibilitychange', onVis);
        return () => { document.removeEventListener('visibilitychange', onVis); leave(); cancelSpeech(); };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const go = (i: number) => { if (i >= 0 && i < pages.length) { setParams({ page: pages[i].id }); setShowList(false); } };
    const exit = () => onExit(skill.topicId);
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement)?.tagName;
            if (showList || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON' || tag === 'SELECT' || (e.target as HTMLElement)?.isContentEditable || e.ctrlKey || e.altKey || e.metaKey) return;
            if (e.key === 'ArrowRight') { e.preventDefault(); go(idx + 1); }
            if (e.key === 'ArrowLeft') { e.preventDefault(); go(idx - 1); }
            if (e.key === 'Escape') exit();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    });

    const finishTry = (r: TryResult) => {
        const res = saveLesson(student.id, { kind: 'try', skillId: lesson.skillId, v: lesson.v, correct: r.correct, total: r.total, tryIndex: tIdx });
        setTryOut({ ...r, ok: res.ok, earned: res.earned });
    };
    const missing = missingBefore(state && state.v === lesson.v ? state : undefined, tIdx);
    const firstExample = pages.findIndex(p => p.kind === 'example');
    const draft = !isPublished(skill.grade);

    const body = () => {
        switch (page.kind) {
            case 'intro': return <>
                <p className="learn-goal">Học xong bài này, em sẽ <b>{lesson.goal}</b></p>
                {lesson.hook && <div className="learn-hook"><span>THỬ NGHĨ XEM</span><Md>{lesson.hook.md}</Md>{lesson.hook.visual && <Pic visual={lesson.hook.visual} />}<small>Câu trả lời ở trang Ghi nhớ cuối bài.</small></div>}
                {!!lesson.needs?.length && <div className="learn-needs"><span>Em cần nhớ:</span>{lesson.needs.map(n => hasLesson(n)
                    ? <button key={n} className="study-chip" onClick={() => onOpenLesson(n)}><BookOpen size={16} />{SKILL_MAP.get(n)?.title}</button>
                    : <span key={n} className="study-pill">{SKILL_MAP.get(n)?.title}</span>)}</div>}
                <div className="learn-plan">{pages.slice(1).map((p, i) => <span key={p.id} className={state && state.v === lesson.v && Math.floor(state.seen / 2 ** (i + 1)) % 2 ? 'seen' : ''}>{p.title}</span>)}</div>
                <button className="study-btn" onClick={() => go(1)}>Bắt đầu học <ArrowRight size={20} /></button>
            </>;
            case 'know': return <>{lesson.know[page.index!].blocks.map((b, i) => <BlockView key={i} b={b} />)}</>;
            case 'form': {
                const f = lesson.forms[page.index!];
                return <>
                    <div className="learn-cue"><span>DẤU HIỆU NHẬN BIẾT</span><Md>{f.cue}</Md></div>
                    <div className="learn-how"><span>CÁCH LÀM</span><ol>{f.steps.map((s, i) => <li key={i}><Md inline>{s}</Md></li>)}</ol></div>
                    <button className="study-btn soft" onClick={() => go(idx + 1)}>Xem ví dụ mẫu <ArrowRight size={18} /></button>
                </>;
            }
            case 'example': return <WorkedSteps key={page.id} worked={lesson.forms[page.index!].example} autoRead={tts} />;
            case 'mistake': return <MistakeCard key={page.id} m={lesson.mistakes[page.index!]} />;
            case 'try': return <>
                <p className="learn-lead">Làm 3 câu để kiểm tra điều vừa học. Sai lần đầu em được gợi ý và thử lại.</p>
                <LessonTry lesson={lesson} grade={skill.grade} tts={tts} onDone={finishTry}>
                    {tryOut && <TryOutcome r={tryOut} missing={missing} pages={pages} go={go} firstExample={firstExample} onRetrySave={() => finishTry(tryOut)} onRemember={() => go(idx + 1)} />}
                </LessonTry>
            </>;
            case 'remember': return <>
                <ul className="learn-remember">{lesson.remember.map((r, i) => <li key={i}><Check size={18} /><Md inline>{r}</Md></li>)}</ul>
                {lesson.hook?.answer && <div className="learn-hook answer"><span>CÂU HỎI ĐẦU BÀI</span><Md>{lesson.hook.md}</Md><p className="learn-math"><Md inline>{lesson.hook.answer}</Md></p></div>}
                {lesson.forms.length > 0 && <RuleBox title="Mẹo" say="Gặp bài mới, em đọc đề và tìm **dấu hiệu nhận biết** để biết đó là dạng nào, rồi làm theo các bước." />}
                <div className="learn-cta">
                    <button className="study-btn" onClick={() => onPractice(lesson.skillId)}><Target size={20} />Luyện kỹ năng này</button>
                    {nextLesson && <button className="study-btn soft" onClick={() => onOpenLesson(nextLesson)}>Bài tiếp: {SKILL_MAP.get(nextLesson)?.title} <ArrowRight size={18} /></button>}
                    <button className="study-btn ghost" onClick={exit}>Về chủ đề</button>
                </div>
            </>;
        }
    };

    return (
        <div className="discovery-hub" data-theme={student.currentThemeId || 'theme_classic'}>
            <div className={`learn-reader${skill.grade === 0 ? " preschool" : ""}`}>
                <div className="study-topbar learn-topbar">
                    <button className="hub-icon" aria-label="Về chủ đề" title="Về chủ đề" onClick={exit}><X size={20} /></button>
                    <span className="title">{skill.title}</span>
                    <div className="learn-progress" aria-label={`Trang ${idx + 1} trên ${pages.length}`}><i style={{ width: `${((idx + 1) / pages.length) * 100}%` }} /></div>
                    <b className="learn-count">{idx + 1}/{pages.length}</b>
                    {page.kind !== 'try' && <SpeakButton key={page.id} text={pageSpeech(lesson, page)} lang="vi-VN" autoPlay={tts} autoPlayKey={page.id} size={22} />}
                    <button className="hub-icon" aria-label="Danh sách trang" title="Danh sách trang" onClick={() => setShowList(true)}><List size={20} /></button>
                </div>
                <main className="learn-paper">
                    {saveError && <div className="learn-msg bad" role="alert"><p>Chưa lưu được trang đã xem, em thử lại nhé.</p><button className="study-btn soft" onClick={() => setSaveError(!saveLesson(student.id, { kind: 'visit', skillId: lesson.skillId, v: lesson.v, page: idx, pages: pages.length }).ok)}>Lưu lại</button></div>}
                    <span className="learn-eyebrow">{topic?.title?.toUpperCase()} · {page.kind === 'intro' ? 'BÀI HỌC' : page.kind === 'know' ? 'EM CẦN BIẾT' : page.kind === 'form' ? 'DẠNG BÀI' : page.kind === 'example' ? 'VÍ DỤ MẪU' : page.kind === 'mistake' ? 'CHỖ DỄ NHẦM' : page.kind === 'try' ? 'EM THỬ' : 'GHI NHỚ'}{draft ? ' · BẢN NHÁP' : ''}</span>
                    <h1 ref={heading} tabIndex={-1}>{page.kind === 'intro' ? skill.title : page.title}</h1>
                    <div key={page.id} className="learn-page">{body()}</div>
                </main>
                <nav className="learn-nav" aria-label="Lật trang">
                    <button className="study-btn ghost" disabled={idx === 0} onClick={() => go(idx - 1)}><ArrowLeft size={18} />Trang trước</button>
                    <span>{seen}/{pages.length} trang đã xem</span>
                    {idx < pages.length - 1
                        ? <button className="study-btn" onClick={() => go(idx + 1)}>Trang tiếp <ArrowRight size={18} /></button>
                        : <button className="study-btn" onClick={exit}>Về chủ đề <ArrowRight size={18} /></button>}
                </nav>
            </div>
            {showList && <HubDialog title={skill.title} onClose={() => setShowList(false)}>
                <div className="learn-pagelist">{pages.map((p, i) => {
                    const done = !!state && state.v === lesson.v && Math.floor(state.seen / 2 ** i) % 2 === 1;
                    return <button key={p.id} className={i === idx ? 'cur' : ''} onClick={() => go(i)}><span>{i + 1}</span>{p.title}{done && <Check size={16} aria-label="Đã xem" />}</button>;
                })}</div>
            </HubDialog>}
        </div>
    );
}

function TryOutcome({ r, missing, pages, go, firstExample, onRemember, onRetrySave }: { r: TryResult & { ok: boolean; earned: number }; missing: number[]; pages: LessonPage[]; go: (i: number) => void; firstExample: number; onRemember: () => void; onRetrySave: () => void }) {
    if (!r.ok) return <div className="learn-msg bad" role="alert"><p>Chưa lưu được kết quả, em thử lại nhé.</p><button className="study-btn soft" onClick={onRetrySave}>Lưu lại kết quả</button></div>;
    if (!passed(r.correct, r.total)) return <div className="learn-msg">
        <p>Cần đúng ít nhất {Math.ceil(r.total * 2 / 3)} câu để hoàn thành bài. Em xem lại ví dụ mẫu rồi thử lại nhé!</p>
        {firstExample >= 0 && <button className="hub-text-link" onClick={() => go(firstExample)}>Xem lại ví dụ mẫu</button>}
    </div>;
    if (missing.length) return <div className="learn-msg">
        <p>Giỏi lắm! Em còn {missing.length} trang chưa xem. Xem hết để hoàn thành bài nhé:</p>
        <div className="learn-needs">{missing.map(i => <button key={i} className="study-chip" onClick={() => go(i)}>{pages[i].title}</button>)}</div>
    </div>;
    return <div className={`learn-msg ok${r.earned ? ' star' : ''}`}>
        {r.earned ? <div className="study-confetti" aria-hidden>{Array.from({ length: 12 }, (_, i) => <i key={i} style={{ left: `${(i + 0.5) * 100 / 12}%`, background: ['#e56b3c', '#d69a2d', '#2f8f5b'][i % 3], animationDelay: `${i % 3 * .08}s` }} />)}</div> : null}
        <p><b>{r.earned ? 'Em đã học xong bài! +1 ⭐' : 'Giỏi lắm! Em đã học xong bài này.'}</b></p>
        <button className="study-btn" onClick={onRemember}>Sang trang Ghi nhớ <ArrowRight size={18} /></button>
    </div>;
}
