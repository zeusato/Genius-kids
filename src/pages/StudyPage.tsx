// Ôn Luyện: trang chủ → làm bài → kết quả; báo cáo; phiếu in. Tiến độ ở StudentProfile.study (services/study/progress).
import React, { useMemo, useRef, useState } from 'react';
import { Navigate, Route, Routes, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Question, QuestionType, StudyMode, TestResult } from '@/types';
import { useStudent, useStudentActions } from '@/src/contexts/StudentContext';
import { HubDialog, HubShell } from '@/src/components/hub/HubShell';
import { StudyHome, type CustomSpec } from '@/src/components/study/StudyHome';
import { Player, PlayRecord, PlaySession, isTestMode } from '@/src/components/study/player/Player';
import { ResultView, SessionSummary } from '@/src/components/study/ResultView';
import { ReportView } from '@/src/components/study/ReportView';
import { PrintView } from '@/src/components/study/PrintView';
import { TopicPage, topicLearnable } from '@/src/components/study/learn/TopicPage';
import { LessonScreen } from '@/src/components/study/learn/LessonReader';
import { generateTestWithFallback, getTopicsByGrade } from '@/services/mathEngine';
import { buildSession, questionKey, type Session } from '@/services/study/session';
import { hasTemplates, skillDef } from '@/services/study/registry';
import { SKILL_MAP, topicMeta } from '@/services/study/catalog';
import { applySession, dailyPlan, dueReviews, matrixPlan, readStudyProgress } from '@/services/study/progress';
import { sessionReward } from '@/services/study/rewards';
import { compactResult } from '@/services/study/compact';
import type { Level, ReviewItem, StudyProgress, Term } from '@/services/study/types';
import { gachaImage, shouldReceiveImage } from '@/services/albumService';
import { generatorRandom } from '@/services/generators/random';

const newId = () => Math.random().toString(36).slice(2, 10);
const shuffle = <T,>(a: T[]): T[] => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(generatorRandom() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
/** chia n câu đều cho các kỹ năng */
const spread = (ids: string[], n: number, level: (id: string) => Level | undefined) =>
    ids.map((skillId, i) => ({ skillId, level: level(skillId), count: Math.floor(n / ids.length) + (i < n % ids.length ? 1 : 0) })).filter(p => p.count > 0);

interface Busy { status: string; error?: string; fallback?: () => void }

export function StudyPage() {
    const navigate = useNavigate();
    const { currentStudent: student } = useStudent();
    const { updateStudent, setGachaResult, addTestResult, setStudent } = useStudentActions();
    const [session, setSession] = useState<PlaySession | null>(null);
    const [summary, setSummary] = useState<SessionSummary | null>(null);
    const [print, setPrint] = useState<{ title: string; questions: Question[]; again: () => void } | null>(null);
    const [busy, setBusy] = useState<Busy | null>(null);
    const [notice, setNotice] = useState('');
    const pendingAi = useRef(0);
    const [pendingPlay, setPendingPlay] = useState<(() => void) | null>(null);
    const progress = useMemo(() => readStudyProgress(student?.study), [student?.study]);

    if (!student) return <Navigate to="/" replace />;
    const grade = student.grade;
    const aiReady = !!student.aiEnabled && !!localStorage.getItem('mathgenius_gemini_key');
    const ttsDefault = grade === 0 || (progress.prefs.tts ?? grade <= 1);

    const savePrefs = (prefs: Partial<StudyProgress['prefs']>) => updateStudent({ ...student, study: { ...progress, prefs: { ...progress.prefs, ...prefs } } });

    const play = (questions: Question[], mode: StudyMode, title: string, minutesPerQ = grade <= 2 ? 1.5 : 1, reviewKeys?: Record<string, string>) => {
        if (!questions.length) { setNotice('Chưa tạo được câu hỏi cho lựa chọn này. Em thử chọn chủ đề khác nhé!'); return; }
        const safeMode = grade === 0 && isTestMode(mode) ? 'practice' : mode;
        setSession({ questions, mode: safeMode, title, tts: ttsDefault, reviewKeys, durationSec: isTestMode(safeMode) && minutesPerQ > 0 ? Math.round(questions.length * minutesPerQ * 60) : undefined });
        navigate('/study/play');
    };
    const levelFor = (id: string) => progress.skills[id]?.lvl;
    const offerSession = (built: Session, mode: StudyMode, title: string, minutesPerQ?: number, keys?: Record<string, string>) => {
        if (built.shortBy && built.questions.length) {
            setNotice(`Đã tạo được ${built.questions.length} câu khác nhau; còn thiếu ${built.shortBy} câu cho lựa chọn này.`);
            setPendingPlay(() => () => play(built.questions, mode, title, minutesPerQ, keys));
        } else play(built.questions, mode, title, minutesPerQ, keys);
    };

    const fromQueue = (items: ReviewItem[]) => {
        const keys: Record<string, string> = {};
        const qs = items.map(it => { const id = newId(); keys[id] = it.key; return { ...it.q, id } as Question; });
        return { qs, keys };
    };
    const startDaily = () => {
        const plan = dailyPlan(progress, grade, hasTemplates);
        const { qs, keys } = fromQueue(plan.review);
        const fresh = buildSession({ picks: plan.picks, count: plan.count - qs.length, excludeKeys: plan.review.map(it => it.key) });
        offerSession({ questions: shuffle([...qs, ...fresh.questions]), shortBy: fresh.shortBy }, 'daily', 'Ôn hôm nay', 1, keys);
    };
    const startReview = () => {
        const due = dueReviews(progress);
        const { qs, keys } = fromQueue((due.length ? due : [...progress.review].sort((a, b) => a.due.localeCompare(b.due))).slice(0, 10));
        play(qs, 'review', 'Ôn câu sai', 1, keys);
    };
    const startTopic = (topicId: string, skillIds: string[], mode: StudyMode, count: number) => {
        const title = topicMeta(topicId)?.title ?? 'Luyện tập';
        const s = skillIds.length
            ? buildSession({ picks: spread(mode === 'practice' ? [...skillIds].sort((a, b) => (progress.skills[a]?.m ?? 0) - (progress.skills[b]?.m ?? 0)) : shuffle(skillIds), count, mode === 'practice' ? levelFor : () => undefined), count, includeAdvanced: skillIds.some(id => SKILL_MAP.get(id)?.advanced) })
            : buildSession({ topicIds: [topicId], count });
        offerSession(s, mode, title);
    };
    const startMatrix = (term: Term | 'all', count: number) => {
        const plan = matrixPlan(grade, term, count, hasTemplates);
        const built = buildSession({ picks: plan, count, keepOrder: true });
        const ordered = [...built.questions].sort((a, b) => (a.level ?? 1) - (b.level ?? 1));
        offerSession({ ...built, questions: ordered }, 'matrix', `Đề kiểm tra ${term === 'all' ? 'cả năm' : `học kì ${term}`}`);
    };
    const localCustom = (spec: CustomSpec) => buildSession({ topicIds: spec.topicIds,
        picks: spec.skillIds.length ? spread(spec.skillIds, spec.count, id => spec.level ?? (spec.mode === 'practice' ? levelFor(id) : undefined)) : undefined,
        count: spec.count, includeAdvanced: !!progress.prefs.showAdvanced, levelFor: spec.level ? () => spec.level : spec.mode === 'practice' ? levelFor : undefined });
    const startCustom = async (spec: CustomSpec) => {
        const { topicIds, count, mode, story } = spec;
        const minutes = spec.timed ? (grade <= 2 ? 1.5 : 1) : 0;
        const title = topicIds.length === 1 ? (topicMeta(topicIds[0])?.title ?? 'Tự chọn') : 'Đề tự chọn';
        if (!story || !aiReady) { offerSession(localCustom(spec), mode, title, minutes); return; }
        const request = ++pendingAi.current;
        const fallback = () => { setBusy(null); offerSession(localCustom(spec), mode, title, minutes); };
        setBusy({ status: 'Đang nhờ Bo Biết Tuốt soạn đề…' });
        try {
            const qs = await generateTestWithFallback(student, topicIds, count, true, localStorage.getItem('mathgenius_gemini_key') || undefined, status => { if (pendingAi.current === request) setBusy({ status }); });
            if (pendingAi.current !== request) return;
            setBusy(null);
            play(qs, mode, `${title} · AI kể chuyện`, minutes);
        } catch (e) {
            if (pendingAi.current !== request) return;
            setBusy({ status: 'AI chưa soạn được đề.', error: e instanceof Error ? e.message : String(e), fallback });
        }
    };
    const startPrint = (spec: CustomSpec) => {
        const { topicIds } = spec;
        const make = () => {
            const built = localCustom({ ...spec, mode: 'test' });
            const qs = built.questions.filter(q => q.type !== QuestionType.Typing);
            if (built.shortBy) setNotice(`Phiếu có ${qs.length} câu; chưa đủ ${spec.count} câu khác nhau ở lựa chọn này.`);
            setPrint({ title: topicIds.length === 1 ? `Phiếu bài tập: ${topicMeta(topicIds[0])?.title ?? ''}` : `Phiếu bài tập Toán ${grade ? `lớp ${grade}` : 'mầm non'}`, questions: qs, again: make });
        };
        make();
        navigate('/study/print');
    };

    const finish = (records: PlayRecord[], seconds: number) => {
        if (!session) return;
        const mode = session.mode;
        // Ôn hôm nay: câu lấy từ hàng đợi ôn được tính như chế độ ôn (giãn lịch), phần còn lại tính là daily
        const asReview = mode === 'daily' ? records.filter(r => r.key) : [];
        const rest = mode === 'daily' ? records.filter(r => !r.key) : records;
        const first = asReview.length ? applySession(progress, asReview, 'review') : null;
        const out = applySession(first?.progress ?? progress, rest, mode);
        const masteredNow = new Set([...(first?.masteredNow ?? []), ...out.masteredNow]);
        const reviewCleared = (first?.reviewCleared ?? 0) + out.reviewCleared;

        const total = records.length, score = records.filter(r => r.correct).length;
        const reward = sessionReward({ mode, total, score, firstTryCorrect: records.filter(r => r.firstTry).length, masteredNow: masteredNow.size, reviewCleared });
        const skills = [...new Set(records.map(r => r.q.skillId).filter((id): id is string => !!id && SKILL_MAP.has(id)))];
        const deltas = skills.map(id => ({ skillId: id, title: skillDef(id)?.title ?? id, before: progress.skills[id]?.m ?? 0, after: out.progress.skills[id]?.m ?? 0, mastered: masteredNow.has(id) }));

        let gacha;
        if (reward.allowGacha && shouldReceiveImage()) {
            const g = gachaImage(student.ownedImageIds);
            if (g) { gacha = g.image; setGachaResult({ image: g.image, isNew: !student.ownedImageIds.includes(g.image.id) }); }
        }
        const result: TestResult = {
            id: Date.now().toString(), date: new Date().toISOString(), score, totalQuestions: total, durationSeconds: seconds,
            topicIds: [...new Set(records.map(r => r.q.topicId))], questions: records.map(r => ({ ...r.q, userAnswer: r.answer })),
            starsEarned: reward.stars, mode,
        };
        const typingScore = records.filter(r => r.q.type === QuestionType.Typing && r.correct).length;
        addTestResult(compactResult(result), gacha, typingScore, out.progress);
        setSummary({ title: session.title, mode, records, seconds, stars: reward.stars, deltas, reviewCleared });
        navigate('/study/result', { replace: true });
    };

    const retryWrong = () => {
        if (!summary) return;
        const keys: Record<string, string> = {};
        const wrong = summary.records.filter(r => !r.correct).map(r => {
            const id = newId(); keys[id] = r.key ?? questionKey(r.q);
            return { ...r.q, id, userAnswer: undefined };
        });
        play(wrong, 'review', 'Làm lại câu sai', 0, keys);
    };
    const practiceSkill = (id: string) => { const s = skillDef(id); if (s) startTopic(s.topicId, [id], 'practice', grade === 0 ? 6 : 10); };
    const weakest = summary?.deltas.filter(d => !SKILL_MAP.get(d.skillId)?.advanced).sort((a, b) => a.after - b.after)[0];
    const cancelAi = () => { pendingAi.current++; setBusy(null); };

    const shell = (section: string, children: React.ReactNode, back: () => void = () => navigate('/mode'), backLabel = 'Về khám phá') => (
        <HubShell student={student} section={section} backText backLabel={backLabel} onBack={back}
            onProfile={() => navigate('/profile')} onShop={() => navigate('/shop')} onLogout={() => { setStudent(null); navigate('/'); }}>
            {children}
        </HubShell>
    );
    const toHome = () => navigate('/study');

    return <>
        <Routes>
            <Route index element={shell('Ôn Luyện', <StudyHome student={student} progress={progress} aiReady={aiReady} actions={{
                onDaily: startDaily, onReview: startReview, onTopic: startTopic, onMatrix: startMatrix, onCustom: startCustom, onPrint: startPrint,
                onReport: () => navigate('/study/report'), onShowAdvanced: v => savePrefs({ showAdvanced: v }),
                onOpenTopic: (id, adv) => navigate(`/study/topic/${id}${adv ? '?adv=1' : ''}`),
            }} />)} />
            <Route path="topic/:topicId" element={<TopicRoute render={(topic, advanced) => shell(topicMeta(topic.id)?.title ?? topic.title,
                <TopicPage student={student} progress={progress} topic={topic} advanced={advanced}
                    onLearn={id => navigate(`/study/learn/${id}`)} onPracticeSkill={practiceSkill}
                    onStart={(ids, mode, n) => startTopic(topic.id, ids, mode, n)} />, toHome, 'Về Ôn Luyện')} grade={grade} />} />
            <Route path="learn/:skillId" element={<LessonScreen student={student} tts={ttsDefault}
                onExit={topicId => navigate(topicId && topicLearnable(topicId) ? `/study/topic/${topicId}` : '/study', { replace: true })}
                onPractice={practiceSkill} onOpenLesson={id => navigate(`/study/learn/${id}`)} />} />
            <Route path="play" element={session
                ? <Player key={session.questions[0]?.id} session={session} grade={grade} themeId={student.currentThemeId} onFinish={finish} onExit={toHome} onToggleTts={v => savePrefs({ tts: v })} />
                : <Navigate to="/study" replace />} />
            <Route path="test" element={<Navigate to={session ? '/study/play' : '/study'} replace />} />
            <Route path="result" element={summary
                ? shell('Kết quả', <ResultView summary={summary} onHome={toHome} onRetryWrong={retryWrong} onPracticeWeak={weakest ? () => practiceSkill(weakest.skillId) : undefined} onReport={() => navigate('/study/report')} />, toHome, 'Về Ôn Luyện')
                : <Navigate to="/study" replace />} />
            <Route path="report" element={shell('Báo cáo học tập', <ReportView student={student} progress={progress} onPractice={practiceSkill} />, toHome, 'Về Ôn Luyện')} />
            <Route path="print" element={print
                ? shell('Phiếu bài tập', <PrintView title={print.title} studentName={student.name} questions={print.questions} onRegenerate={print.again} />, toHome, 'Về Ôn Luyện')
                : <Navigate to="/study" replace />} />
        </Routes>
        {busy && (
            <div className="discovery-hub" style={{ position: 'fixed', inset: 0, background: 'transparent', minHeight: 0, zIndex: 80 }}>
                <HubDialog title={busy.error ? 'Chưa soạn được đề' : 'Đang soạn đề…'} onClose={cancelAi}>
                    <p style={{ margin: '6px 0 14px', color: 'var(--hub-muted)' }}>{busy.status}</p>
                    {busy.error && <p style={{ margin: '0 0 16px', fontSize: 13, color: '#b5483a', wordBreak: 'break-word' }}>{busy.error}</p>}
                    <div className="study-dialog-actions">
                        <button className="study-btn ghost" onClick={cancelAi}>Huỷ</button>
                        {busy.fallback && <button className="study-btn" onClick={busy.fallback}>Dùng đề có sẵn</button>}
                    </div>
                </HubDialog>
            </div>
        )}
        {notice && (
            <div className="discovery-hub" style={{ position: 'fixed', inset: 0, background: 'transparent', minHeight: 0, zIndex: 80 }}>
                <HubDialog title="Số câu trong đề" onClose={() => { setNotice(''); setPendingPlay(null); }}>
                    <p style={{ margin: '6px 0 16px', color: 'var(--hub-muted)' }}>{notice}</p>
                    <div className="study-dialog-actions"><button className="study-btn ghost" onClick={() => { setNotice(''); setPendingPlay(null); }}>Đóng</button>{pendingPlay && <button className="study-btn" onClick={() => { pendingPlay(); setPendingPlay(null); setNotice(''); }}>Làm đề này</button>}</div>
                </HubDialog>
            </div>
        )}
    </>;
}

/** /study/topic/:topicId — chủ đề của lớp hiện tại; không có bài học thì về trang chủ. */
function TopicRoute({ grade, render }: { grade: number; render: (topic: import('@/types').Topic, advanced: boolean) => React.ReactNode }) {
    const { topicId = '' } = useParams();
    const [params] = useSearchParams();
    const advanced = params.get('adv') === '1';
    const topic = getTopicsByGrade(grade).find(t => t.id === topicId);
    if (!topic || !topicLearnable(topic.id, advanced)) return <Navigate to="/study" replace />;
    return <>{render(topic, advanced)}</>;
}
