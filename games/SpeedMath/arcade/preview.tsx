// DEV only. Exercise the real reducer and completion transaction using an in-memory profile.
import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { StudentProfile } from '../../../types';
import { initializeStats } from '../../../services/achievementService';
import { musicManager } from '../../../services/musicManager';
import { ArcadeGame } from './ArcadeGame';
import { boardOf, createSession, reduce } from './engine';
import { completeArcade } from './progress';
import type { Action, Config, Session } from './model';
const base: StudentProfile = { id: 'speed-dev-preview', name: 'Minh Anh', age: 8, grade: 2, avatarId: 0, currentAvatarId: 'avatar_01', currentThemeId: 'default', stars: 0, ownedAvatarIds: [], ownedThemeIds: [], ownedImageIds: [], history: [], gameHistory: [], shopDailyPhotos: [], achievements: [] };
base.stats = initializeStats(base);
function fixture(phase: string, topic: Config['topic'], theme: Config['theme']): Session | undefined {
    if (phase === 'lobby')
        return;
    const config: Config = { grade: 2, difficulty: 'easy', pace: 'challenge', topic, theme, mode: ['choice', 'match', 'order', 'typing'].includes(phase) ? phase as Config['mode'] : 'cup' };
    let s = createSession(config, 42, crypto.randomUUID(), base.id), now = 0;
    const send = (e: Action) => { s = reduce(s, { ...e, now: now += 100, sessionId: s.id }); };
    send({ type: 'start' });
    if (phase === 'result') {
        for (let i = 0; i < 5000 && s.phase !== 'finished'; i++) {
            if (s.phase === 'between')
                send({ type: 'start' });
            else if (s.phase === 'boardDone' || s.phase === 'review')
                send({ type: 'next' });
            else {
                const b = boardOf(s);
                if (b.kind === 'choice')
                    send({ type: 'answer', boardId: b.id, value: b.answer[0] });
                else if (b.kind === 'match') {
                    const id = b.answer.find(v => !s.matched.includes(v))!;
                    send({ type: 'select', boardId: b.id, value: id });
                    send({ type: 'match', boardId: b.id, value: id });
                }
                else {
                    b.answer.forEach(value => send({ type: 'place', boardId: b.id, value }));
                    send({ type: 'check', boardId: b.id });
                }
            }
        }
    }
    return { ...s, clockAt: performance.now() };
}
function Preview() {
    const [student, setStudent] = useState(base), profile = useRef(student), [sound, setSound] = useState(musicManager.getMusicState()), [run, setRun] = useState(0), [initial, setInitial] = useState<Session>(), [phase, setPhase] = useState('lobby'), [topic, setTopic] = useState<Config['topic']>('mixed'), [theme, setTheme] = useState<Config['theme']>('station'), [fail, setFail] = useState(false);
    profile.current = student;
    return <><details style={{ background: '#103b45', color: '#d5e9d9', padding: '6px 16px', font: '12px system-ui' }}><summary>DEV · Kiểm thử · {student.gameHistory.length} kết quả · {student.stars} sao (chỉ trong bộ nhớ)</summary><div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', padding: '12px 0' }}><label>Cảnh <select aria-label="Cảnh kiểm thử" value={phase} onChange={e => setPhase(e.target.value)}>{['lobby', 'choice', 'match', 'order', 'typing', 'result'].map(v => <option key={v}>{v}</option>)}</select></label><label>Chủ đề <select aria-label="Chủ đề kiểm thử" value={topic} onChange={e => setTopic(e.target.value as Config['topic'])}>{['mixed', 'math', 'observe', 'words', 'knowledge'].map(v => <option key={v}>{v}</option>)}</select></label><label>Nền <select aria-label="Nền kiểm thử" value={theme} onChange={e => setTheme(e.target.value as Config['theme'])}>{['station', 'garden', 'stars'].map(v => <option key={v}>{v}</option>)}</select></label><label><input type="checkbox" checked={fail} onChange={e => setFail(e.target.checked)}/>Giả lập lỗi lưu</label><button onClick={() => { setInitial(fixture(phase, topic, theme)); setRun(v => v + 1); }}>Mở cảnh kiểm thử</button></div></details><ArcadeGame key={run} student={student} initialSession={initial} preview controls={{ ...sound, toggleMusic: () => { musicManager.toggleMusic(); setSound(musicManager.getMusicState()); }, toggleSound: () => { musicManager.toggleSound(); setSound(musicManager.getMusicState()); }, playTrack: musicManager.playTrack.bind(musicManager), resumeRouteMusic: musicManager.resumeRouteMusic.bind(musicManager) }} complete={(_, s) => { if (fail)
        return { ok: false, earned: 0 }; const r = completeArcade(profile.current, s); if (r.ok) {
        profile.current = r.profile;
        setStudent(r.profile);
    } return r; }} onBack={() => { setInitial(undefined); setRun(v => v + 1); }}/></>;
}
if (import.meta.env.DEV) {
    const root = import.meta.hot?.data.root || createRoot(document.getElementById('root')!);
    if (import.meta.hot)
        import.meta.hot.data.root = root;
    root.render(<Preview />);
}
