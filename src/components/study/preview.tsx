// Sân thử DEV dùng cùng component thật; hồ sơ/tiến độ chỉ ở bộ nhớ.
// URL: study-preview.html?case=choice (xem scripts/study-shots.mjs).
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { MusicProvider } from '../../contexts/MusicContext';
import { Grade, QuestionType, type Question, type StudentProfile } from '../../../types';
import '../../../services/mathEngine';
import { SKILLS } from '../../../services/study/catalog';
import { buildSession } from '../../../services/study/session';
import { withGeneratorRandom } from '../../../services/generators/random';
import { applySession, DAY, emptyProgress, localDay } from '../../../services/study/progress';
import { sessionReward } from '../../../services/study/rewards';
import { HubShell } from '../hub/HubShell';
import { StudyHome } from './StudyHome';
import { Player, type PlayRecord, type PlaySession } from './player/Player';
import { ReportView } from './ReportView';
import { PrintView } from './PrintView';
import { ResultView, type SessionSummary } from './ResultView';
import '../../index.css';

const base: StudentProfile = { id: 'g3kid', name: 'Minh Anh', age: 9, grade: 3, avatarId: 0, currentAvatarId: 'avatar_01', currentThemeId: 'theme_classic', stars: 24, ownedAvatarIds: [], ownedThemeIds: [], ownedImageIds: [], history: [], gameHistory: [], shopDailyPhotos: [] };
const common = { topicId: 'g3_multiplication', skillId: 'g3.mul_tables', level: 2 as const, explanation: 'Mỗi hàng có 3 quả, hai hàng có 3 × 2 = 6 quả.', hint: 'Đếm số quả trong từng hàng rồi cộng lại.' };
const questions: Question[] = [
    { ...common, id: 'choice', type: QuestionType.SingleChoice, questionText: 'Có tất cả bao nhiêu quả táo?', visual: { fn: 'countingSVG', args: ['🍎', 6, { perRow: 3 }] }, options: ['5', '6', '7', '8'], correctAnswer: '6' },
    { ...common, id: 'compare', topicId: 'g3_numbers', skillId: 'g3.compare', type: QuestionType.SingleChoice, questionText: 'Chọn dấu thích hợp: 24 ? 42', options: ['>', '<', '='], correctAnswer: '<', explanation: '24 có 2 chục, 42 có 4 chục. Vì 2 < 4 nên 24 < 42.', hint: 'So sánh chữ số hàng chục trước.' },
    { ...common, id: 'input', type: QuestionType.ManualInput, questionText: 'Tính: 125 + 235 = ?', correctAnswer: '360', answerKind: 'number', visual: { fn: 'columnArithSVG', args: [125, 235, '+'] }, explanation: 'Cộng từ phải sang trái, nhớ 1 từ hàng đơn vị sang hàng chục.', steps: ['5 + 5 = 10, viết 0 nhớ 1.', '2 + 3 + 1 = 6, viết 6.', '1 + 2 = 3, viết 3. Kết quả là 360.'] },
    { ...common, id: 'order', type: QuestionType.Order, questionText: 'Sắp xếp các số từ bé đến lớn.', options: ['45', '12', '28', '9'], correctAnswers: ['9', '12', '28', '45'], explanation: 'So sánh số chữ số rồi so sánh hàng chục: 9 < 12 < 28 < 45.' },
    { ...common, id: 'multi', type: QuestionType.MultipleSelect, questionText: 'Chọn tất cả phép tính có kết quả bằng 6.', options: ['3 × 2', '2 × 3', '3 + 2', '6 + 1'], correctAnswers: ['3 × 2', '2 × 3'], explanation: '3 × 2 = 6 và 2 × 3 = 6. Hai phép cộng có kết quả là 5 và 7.' },
];
const seeded = <T,>(run: () => T) => { let x = 1979; return withGeneratorRandom(() => ((x = Math.imul(x, 1664525) + 1013904223 >>> 0) / 4294967296), run); };
const printQuestions = seeded(() => buildSession({ topicIds: ['g3_multiplication', 'g3_division', 'g3_geometry'], count: 20 }).questions);

function populated() {
    const p = emptyProgress(), now = new Date();
    SKILLS.filter(s => s.grade === 3 && !s.advanced).slice(0, 12).forEach((s, i) => { p.skills[s.id] = { a: 12, c: 5 + i % 7, m: .2 + i % 5 * .18, lvl: s.levels[0], last: now.toISOString() }; });
    for (let i = 0; i < 21; i++) { const n = 8 + i % 5 * 3; p.days[localDay(now.getTime() - i * DAY)] = { n, c: n - i % 4 }; }
    p.streak = { count: 7, last: localDay(now) };
    const out = applySession(p, [{ q: questions[0], firstTry: false, correct: false }], 'practice', new Date(now.getTime() - 2 * DAY));
    return out.progress;
}
function Preview() {
    const initial = new URLSearchParams(location.search).get('case') || 'home-new';
    const [screen, setScreen] = useState(initial);
    const [progress, setProgress] = useState(() => initial === 'home-new' ? emptyProgress() : populated());
    const grade = initial.startsWith('mn') ? Grade.Preschool : initial.startsWith('g1') ? Grade.Grade1 : Grade.Grade3;
    const student = { ...base, id: grade === 1 ? 'g1kid' : grade === 0 ? 'mnkid' : 'g3kid', grade, study: progress,
        history: Array.from({ length: 10 }, (_, i) => ({ id: String(i), date: new Date(Date.now() - i * DAY).toISOString(), mode: 'matrix' as const, score: 12 + i % 8, totalQuestions: 20, durationSeconds: 800, topicIds: ['g3_multiplication'], questions: [], starsEarned: 2 })) };
    const sample = grade === 0 ? { ...questions[0], level: 1 as const, skillId: 'mn.count', topicId: 'mn_counting', speech: 'Đếm các quả táo trong hình. Có tất cả bao nhiêu quả táo?' } : questions.find(q => q.id === initial) ?? questions[0];
    const [session, setSession] = useState<PlaySession>(() => ({ title: initial === 'test' ? 'Đề kiểm tra học kì 1' : 'Cùng luyện toán', questions: grade === 0 ? [sample, ...seeded(() => buildSession({ topicIds: ['mn_counting'], count: 5 }).questions)] : initial === 'test' || initial === 'timeout' ? questions : [sample, ...questions.filter(q => q.id !== sample.id)], mode: initial === 'test' || initial === 'timeout' ? 'test' : 'practice', durationSec: initial === 'timeout' ? 2 : 600, tts: false }));
    const sampleRecords = questions.map((q, i) => ({ q, answer: i === 0 ? '5' : q.correctAnswer ?? q.correctAnswers, correct: i !== 0, firstTry: i !== 0 }));
    const [summary, setSummary] = useState<SessionSummary>({ title: 'Ôn hôm nay', mode: 'daily', records: sampleRecords, seconds: 182, stars: 3, deltas: [{ skillId: 'g3.mul_tables', title: 'Bảng nhân', before: .45, after: .68, mastered: false }], reviewCleared: 0 });
    const home = () => setScreen('home-progress');
    const start = (qs: Question[], mode: PlaySession['mode'] = 'practice') => { setSession({ questions: qs, mode, title: 'Luyện tập', tts: false }); setScreen('play'); };
    const finish = (records: PlayRecord[], seconds: number) => {
        const out = applySession(progress, records, session.mode);
        const reward = sessionReward({ mode: session.mode, total: records.length, score: records.filter(r => r.correct).length, firstTryCorrect: records.filter(r => r.firstTry).length, masteredNow: out.masteredNow.length, reviewCleared: out.reviewCleared });
        setProgress(out.progress);
        setSummary({ title: session.title, records, seconds, mode: session.mode, stars: reward.stars, deltas: [], reviewCleared: out.reviewCleared });
        setScreen('result');
    };
    const content = screen.includes('home') ? <StudyHome student={student} progress={progress} aiReady={false} actions={{ onDaily: () => start(questions), onReview: () => start(questions, 'review'), onTopic: (_topic, skills, mode, count) => start(buildSession({ picks: skills.map(skillId => ({ skillId, count: Math.ceil(count / skills.length) })), count }).questions, mode), onMatrix: () => start(questions, 'matrix'), onCustom: s => start(buildSession({ topicIds: s.topicIds, count: s.count }).questions, s.mode), onPrint: () => setScreen('print'), onReport: () => setScreen('report'), onShowAdvanced: showAdvanced => setProgress({ ...progress, prefs: { ...progress.prefs, showAdvanced } }) }} />
        : screen === 'report' ? <ReportView student={student} progress={progress} onPractice={() => start(questions)} />
        : screen === 'print' ? <PrintView title="Phiếu bài tập Toán — Lớp 3" studentName={student.name} questions={printQuestions} onRegenerate={() => {}} />
        : screen === 'result' ? <ResultView summary={summary} onHome={home} onReport={() => setScreen('report')} onRetryWrong={() => start(questions.slice(0, 1), 'review')} onPracticeWeak={() => start(questions)} /> : null;
    return content ? <HubShell section="Ôn Luyện" student={student} backText onBack={home}>{content}</HubShell>
        : <Player key={session.questions[0].id + session.mode} session={session} grade={grade} onFinish={finish} onExit={home} onToggleTts={() => {}} />;
}
if (import.meta.env.DEV) {
    const root = import.meta.hot?.data.root || createRoot(document.getElementById('root')!);
    if (import.meta.hot) import.meta.hot.data.root = root;
    root.render(<MemoryRouter><MusicProvider><Preview /></MusicProvider></MemoryRouter>);
}
