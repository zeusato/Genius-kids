import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useStudent, useStudentActions } from '@/src/contexts/StudentContext';
import { HubDialog, HubShell } from '@/src/components/hub/HubShell';
import { GachaModal } from '@/src/components/GachaModal';
import { RIDDLES, RIDDLE_MAP } from '../content';
import type { AnswerMode, GateId, Riddle } from '../content/types';
import { gateStones, planRound, type RoundKind } from '../engine/planner';
import { createRound, type RoundState } from '../engine/round';
import { currentProgress, type RiddleOutcome } from '../progress/progress';
import { clearDraft, readDraft, readLegacyIds } from '../progress/storage';
import { Home } from './Home';
import { Round } from './Round';
import { Summary } from './Summary';
import { Album } from './Album';
import { Family } from './Family';
import { Picture } from './Picture';
import './riddle.css';

type Screen =
    | { id: 'home' } | { id: 'album' } | { id: 'picture' }
    | { id: 'family'; first?: Riddle }
    | { id: 'round'; round: RoundState }
    | { id: 'summary'; round: RoundState; outcome: RiddleOutcome | null };

const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export function RiddlePage() {
    const navigate = useNavigate();
    const { currentStudent: student } = useStudent();
    const { saveRiddle } = useStudentActions();
    const [screen, setScreen] = useState<Screen>({ id: 'home' });
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [gift, setGift] = useState<RiddleOutcome | null>(null);
    const [draft, setDraft] = useState<RoundState | null>(null);
    const owner = student?.id ?? '';
    const legacyIds = useMemo(() => (student && !student.riddle ? readLegacyIds(student.id) : null), [student]);
    const progress = useMemo(() => (student ? currentProgress(student, { pool: RIDDLES, legacyIds }) : null), [student, legacyIds]);
    useEffect(() => { if (owner) setDraft(readDraft(owner)); }, [owner, screen.id]);
    useEffect(() => { window.scrollTo(0, 0); }, [screen.id]);

    const start = useCallback((kind: RoundKind, gate?: GateId) => {
        if (!student || !progress) return;
        const ids = planRound({ pool: RIDDLES, progress, grade: student.grade || 1, kind, gate });
        if (!ids.length) return;
        clearDraft(student.id);
        const riddles = ids.map(id => RIDDLE_MAP.get(id)!);
        setScreen({ id: 'round', round: createRound({ id: newId(), owner: student.id, kind, gate, riddles, pref: progress.settings.input }) });
    }, [student, progress]);

    const finish = useCallback((round: RoundState) => {
        clearDraft(round.owner);
        const res = saveRiddle(round.owner, { type: 'round', round }, RIDDLES);
        setScreen({ id: 'summary', round, outcome: res.outcome });
    }, [saveRiddle]);

    const settings = useCallback((patch: Partial<{ autoRead: boolean; showVi: boolean; input: AnswerMode | undefined }>) => {
        if (owner) saveRiddle(owner, { type: 'settings', settings: patch }, RIDDLES);
    }, [owner, saveRiddle]);

    if (!student || !progress) return <Navigate to="/" replace />;
    const back = () => (screen.id === 'home' ? navigate('/mode') : setScreen({ id: 'home' }));

    if (screen.id === 'round') {
        return (
            <div className="discovery-hub rd-root rd-immersive" data-theme={student.currentThemeId || 'theme_classic'}>
                <Round key={screen.round.id} initial={screen.round} riddles={RIDDLE_MAP} autoRead={progress.settings.autoRead} showVi={progress.settings.showVi}
                    onExit={() => setScreen({ id: 'home' })} onFinish={finish} onSettings={settings} />
            </div>
        );
    }
    if (screen.id === 'summary') {
        const { round, outcome } = screen;
        const g = (round.gate ?? RIDDLE_MAP.get(round.items[0].id)?.gate) as GateId;
        return (
            <div className="discovery-hub rd-root rd-immersive" data-theme={student.currentThemeId || 'theme_classic'}>
                <Summary round={round} outcome={outcome} riddles={RIDDLE_MAP} stones={gate => gateStones(progress, gate, RIDDLES)} autoRead={progress.settings.autoRead}
                    onNext={() => start(round.kind === 'gate' ? 'gate' : 'journey', round.kind === 'gate' ? g : undefined)}
                    onAgain={round.kind === 'journey' || round.kind === 'gate' ? () => start('gate', g) : null}
                    onHome={() => setScreen({ id: 'home' })}
                    onGift={outcome?.image ? () => setGift(outcome) : null} />
                {gift?.image && <GachaModal image={gift.image} isNew={gift.isNew} onClose={() => { setGift(null); setScreen({ ...screen, outcome: outcome ? { ...outcome, image: null } : null }); }} />}
            </div>
        );
    }

    const solved = new Set(Object.entries(progress.solved).filter(([, s]) => s.seals > 0).map(([id]) => id));
    return (
        <HubShell student={student} section="ĐỐ VUI NHÂN SƯ" onBack={back} backLabel={screen.id === 'home' ? 'Về khám phá' : 'Về ốc đảo'}>
            <main className="hub-main rd-root">
                {screen.id === 'home' && (
                    <Home name={student.name} grade={student.grade || 1} progress={progress} pool={RIDDLES} draft={draft}
                        onStart={start} onResume={() => draft && setScreen({ id: 'round', round: draft })}
                        onAlbum={() => setScreen({ id: 'album' })} onFamily={() => setScreen({ id: 'family' })} onPicture={() => setScreen({ id: 'picture' })} onSettings={() => setSettingsOpen(true)} />
                )}
                {screen.id === 'album' && <Album progress={progress} pool={RIDDLES} onAsk={r => setScreen({ id: 'family', first: r })} />}
                {screen.id === 'family' && <Family pool={RIDDLES} solved={solved} first={screen.first} onAsked={n => saveRiddle(owner, { type: 'asked', count: n }, RIDDLES)} onDone={() => setScreen({ id: 'home' })} />}
                {screen.id === 'picture' && <Picture pool={RIDDLES} onDone={() => setScreen({ id: 'home' })}
                    onFinish={(score, total) => { const stars = Math.min(3, Math.round((score / total) * 3)); const r = saveRiddle(owner, { type: 'bonus', id: `pic-${newId()}`, stars }, RIDDLES); return r.outcome?.earned ?? 0; }} />}
            </main>
            {settingsOpen && (
                <HubDialog title="Cài đặt Đố Vui" onClose={() => setSettingsOpen(false)}>
                    <div className="rd-settings">
                        <fieldset>
                            <legend>Cách trả lời</legend>
                            {([[undefined, 'Tự động theo độ khó'], ['choice', 'Chọn đáp án'], ['tiles', 'Ghép chữ'], ['type', 'Tự viết']] as [AnswerMode | undefined, string][]).map(([v, label]) => (
                                <label key={label}><input type="radio" name="rd-input" checked={progress.settings.input === v} onChange={() => settings({ input: v })} />{label}</label>
                            ))}
                        </fieldset>
                        <label className="rd-switch"><input type="checkbox" checked={progress.settings.autoRead} onChange={e => settings({ autoRead: e.target.checked })} />Nhân Sư tự đọc câu đố</label>
                        <label className="rd-switch"><input type="checkbox" checked={progress.settings.showVi} onChange={e => settings({ showVi: e.target.checked })} />Luôn hiện bản dịch câu đố tiếng Anh</label>
                        <p className="rd-settings-note">Em đã đố người lớn {progress.asked} câu. Không có phạt: gợi ý chỉ làm ít dấu ấn hơn thôi.</p>
                    </div>
                </HubDialog>
            )}
        </HubShell>
    );
}
