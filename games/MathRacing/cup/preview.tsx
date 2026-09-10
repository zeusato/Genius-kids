// DEV only: actual game/transactions, isolated in-memory profile and no student storage writes.
import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { StudentProfile } from '../../../types';
import { RacingCup } from './RacingCup';
import { Difficulty, LEVELS, Session, normalizeConfig } from './model';
import { activeQuestion, chooseLane, createSession, step } from './engine';
import { completeRacing } from './progress';
const base: StudentProfile = { id: 'racing-dev-preview', name: 'Minh Anh', grade: 2, age: 8, avatarId: 0, currentAvatarId: 'avatar_01', currentThemeId: 'default', stars: 0, ownedAvatarIds: [], ownedThemeIds: [], ownedImageIds: [], history: [], gameHistory: [], shopDailyPhotos: [], achievements: [] };
function fixture(kind: string, grade: number, difficulty: Difficulty): Session | undefined {
    if (kind === 'garage') return;
    const s = createSession(normalizeConfig({ difficulty, mode: 'quick', autoNitro: true }, grade), 763, crypto.randomUUID(), base.id); s.phase = 'racing';
    if (kind === 'traffic') {
        // Repro for cars overtaking beside/below the camera. No saved profiles.
        s.racers.forEach((r, i) => { r.distance = [12, 24, 6, 2][i]; r.lane = r.target = [1, 0, 2, 1][i]; r.boost = i === 0 || i === 2 ? 2.5 : 0; });
        s.paused = true; return s;
    }
    for (let i = 0; i < 60000 && s.phase === 'racing'; i++) {
        const q = activeQuestion(s); if (q >= 0) { if (kind === 'gate') break; chooseLane(s, i % 5 === 0 ? (s.questions[q].options.indexOf(s.questions[q].answer) + 1) % 3 : s.questions[q].options.indexOf(s.questions[q].answer), q); }
        step(s, 1 / 60); if (kind === 'race' && s.elapsed > 2) break;
    }
    s.paused = s.phase === 'racing'; return s;
}
function Preview() {
    const [student, setStudent] = useState(base), profile = useRef(student), [key, setKey] = useState(0), [sound, setSound] = useState(false), [kind, setKind] = useState('garage'), [grade, setGrade] = useState(2), [difficulty, setDifficulty] = useState<Difficulty>('easy'), [initial, setInitial] = useState<Session>(), [fail, setFail] = useState(false);
    profile.current = student;
    return <><details style={{ position: 'relative', zIndex: 150, background: '#294c4f', color: '#fff6d9', font: '11px system-ui', padding: '5px 12px' }}><summary>DEV · Hồ sơ trong bộ nhớ · {student.gameHistory.length} kết quả · {student.stars} sao</summary><div style={{ display: 'flex', gap: 15, padding: 10, flexWrap: 'wrap' }}><label>Cảnh <select aria-label="Cảnh kiểm thử" value={kind} onChange={e => setKind(e.target.value)}>{['garage', 'race', 'traffic', 'gate', 'result'].map(k => <option key={k}>{k}</option>)}</select></label><label>Độ khó <select aria-label="Độ khó kiểm thử" value={difficulty} onChange={e => setDifficulty(e.target.value as Difficulty)}>{LEVELS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select></label><label>Lớp <select aria-label="Lớp kiểm thử" value={grade} onChange={e => setGrade(Number(e.target.value))}>{[1, 2, 3, 4, 5].map(g => <option key={g}>{g}</option>)}</select></label><label><input type="checkbox" checked={fail} onChange={e => setFail(e.target.checked)}/>Giả lập lỗi lưu</label><button onClick={() => { const p = { ...profile.current, grade }; profile.current = p; setStudent(p); setInitial(fixture(kind, grade, difficulty)); setKey(k => k + 1); }}>Mở cảnh kiểm thử</button></div></details><RacingCup key={key} student={student} difficulty={difficulty} preview initialSession={initial} soundEnabled={sound} toggleSound={() => setSound(s => !s)} complete={(_, s) => { if (fail) return { ok: false, earned: 0 }; const r = completeRacing(profile.current, s); if (r.ok) { profile.current = r.profile; setStudent(r.profile); } return r; }} onBack={() => { setInitial(undefined); setKey(k => k + 1); }}/></>;
}
if (import.meta.env.DEV) { const root = import.meta.hot?.data.root || createRoot(document.getElementById('root')!); if (import.meta.hot) import.meta.hot.data.root = root; root.render(<Preview/>); }
