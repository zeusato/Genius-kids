import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Headphones, LockKeyhole, Music2, Play, Settings2, Sparkles, Star, VolumeX } from 'lucide-react';
import type { StudentProfile } from '../../types';
import { useStudent, useStudentActions } from '../../src/contexts/StudentContext';
import { useMusicControls } from '../../src/contexts/MusicContext';
import { musicManager } from '../../services/musicManager';
import { AudioSession } from './audio/AudioSession';
import { CHAPTERS, SOUND_MISSIONS, SoundMission } from './content/missions';
import { newSession, SoundSession } from './engine/game';
import { readSoundDraft, readSoundProgress } from './progress/progress';
import { BandStage, STAGES, StageThemeContext } from './components/BandStage';
import { AudioSettings, readSoundPreferences } from './components/AudioSettings';
import { SoundModal } from './components/Modal';
import { Completion, SoundRound } from './components/SoundRound';
import { SaveComposition, Studio } from './studio/Studio';
import './sound.css';

export default function ConnectedSound({ onExit, onLegacy }: { onExit: () => void; onLegacy: () => void }) {
    const { currentStudent } = useStudent(), { completeSoundGame, saveSoundComposition } = useStudentActions(), controls = useMusicControls();
    if (!currentStudent) return null;
    return <SoundAdventure key={currentStudent.id} student={currentStudent} complete={completeSoundGame} saveComposition={saveSoundComposition} soundEnabled={controls.soundEnabled} toggleSound={controls.toggleSound} onExit={onExit} onLegacy={onLegacy}/>;
}
export interface SoundAdventureProps { student: StudentProfile; complete: Completion; saveComposition: SaveComposition; soundEnabled: boolean; toggleSound: () => void; onExit: () => void; onLegacy: () => void }
export function SoundAdventure({ student, complete, saveComposition, soundEnabled, toggleSound, onExit, onLegacy }: SoundAdventureProps) {
    const progress = readSoundProgress(student.soundMemory), completed = Object.keys(progress.missions).length, next = SOUND_MISSIONS.find(m => !progress.missions[m.id]);
    const [audio, setAudio] = useState<AudioSession | null>(null), [prefs, setPrefs] = useState(() => readSoundPreferences(student.id)), [settings, setSettings] = useState(false), [tab, setTab] = useState<'journey' | 'practice'>('journey');
    const [chapter, setChapter] = useState(next?.chapter || 0), [round, setRound] = useState<SoundSession | null>(null), [studio, setStudio] = useState(false), [draft, setDraft] = useState(() => readSoundDraft(student.id)), [pending, setPending] = useState<{ mission: SoundMission; campaign: boolean } | null>(null), [message, setMessage] = useState('');
    const [practiceId, setPracticeId] = useState('band-1');
    const [stagePicker, setStagePicker] = useState(false);
    useEffect(() => {
        const engine = new AudioSession(); setAudio(engine); musicManager.playTrack(null);
        return () => { engine.close(); musicManager.resumeRouteMusic(); };
    }, []);
    useEffect(() => { audio?.setVolume(prefs.volume); audio?.setMuted(!soundEnabled || prefs.volume === 0); }, [audio, prefs.volume, soundEnabled]);
    const fresh = (mission: SoundMission, campaign: boolean) => { audio?.stop(); setRound(newSession(mission.id, crypto.getRandomValues(new Uint32Array(1))[0], campaign)); setPending(null); setDraft({ session: null, corrupt: false }); };
    const start = (mission: SoundMission, campaign = true) => { if (draft.session) setPending({ mission, campaign }); else fresh(mission, campaign); };
    const leaveRound = () => { setRound(null); setDraft(readSoundDraft(student.id)); };
    const stars = Object.values(progress.missions).reduce((sum, m) => sum + m.stars, 0);
    const members = completed >= 12 ? 3 : completed >= 6 ? 2 : 1;
    const savePrefs = (p: typeof prefs) => { setPrefs(p); try { localStorage.setItem(`sound-prefs:${student.id}`, JSON.stringify(p)); } catch { setMessage('Cài đặt dùng được trong lần chơi này, nhưng chưa lưu được trên máy.'); } };
    if (!audio) return <div className="sm-app"><p role="status">Ban nhạc đang chuẩn bị…</p></div>;
    return <StageThemeContext.Provider value={prefs.stage}><div className="sm-app">
        <div className="sm-shell">
            {round ? <SoundRound key={round.id} initial={round} studentId={student.id} audio={audio} soundEnabled={soundEnabled && prefs.volume > 0} offset={prefs.offset} complete={complete} covered={settings} onSettings={() => setSettings(true)} onLeave={leaveRound} onNext={() => { const index = SOUND_MISSIONS.findIndex(m => m.id === round.missionId); if (round.campaign && index < 23) fresh(SOUND_MISSIONS[index + 1], true); else leaveRound(); }}/>
                : studio ? <Studio studentId={student.id} library={progress.compositions} completed={completed} audio={audio} soundEnabled={soundEnabled && prefs.volume > 0} save={saveComposition} covered={settings} onSettings={() => setSettings(true)} onLeave={() => setStudio(false)}/>
                : <>
                    <header className="sm-topbar"><button className="sm-icon" aria-label="Về danh sách trò chơi" onClick={onExit}><ArrowLeft size={21}/></button><div><strong>Giai Điệu Vui Nhộn</strong><small>Nghe bằng tai. Chơi bằng cả niềm vui.</small></div><div className="sm-star-pill"><Star size={16} fill="currentColor"/>{stars}<span>/72</span></div><button className="sm-icon" aria-label="Cài đặt âm thanh" onClick={() => setSettings(true)}><Settings2 size={21}/></button></header>
                    <main>
                        <section className="sm-hero"><div className="sm-hero-copy"><span className="sm-eyebrow"><span/> SÂN KHẤU NHỎ, NIỀM VUI TO</span><h1>Ban nhạc<br/><em>tí hon.</em></h1><p>Một chút lắng nghe.<br/>Một chút ngân nga.<br/>Và một bài nhạc của riêng mình.</p><button className="sm-primary" onClick={() => draft.session ? setRound(draft.session) : start(next || SOUND_MISSIONS[0])}><Play size={18} fill="currentColor"/>{draft.session ? 'Tiếp tục bài đang chơi' : completed ? next ? 'Chơi bài tiếp theo' : 'Biểu diễn lần nữa' : 'Bắt đầu chơi'}<ArrowRight size={18}/></button><button className="sm-text sm-try-sound" onClick={() => setSettings(true)}><Headphones size={16}/>Thử tiếng trước khi chơi</button></div><div className="sm-hero-art"><BandStage members={members}/><div className="sm-stage-caption"><span>THE LITTLE BAND</span><i>♪</i><span>{completed}/24 bài đã hoàn thành</span></div></div></section>
                        {(!soundEnabled || prefs.volume === 0) && <button className="sm-warning sm-wide" onClick={() => setSettings(true)}><VolumeX size={18}/>Âm thanh đang tắt. Chạm để bật tiếng.</button>}
                        {draft.corrupt && <p className="sm-warning">Bài đang chơi chưa đọc được. Thành tích đã lưu vẫn còn trong hành trình.</p>}
                        <nav className="sm-navigation" aria-label="Chế độ âm nhạc"><button className={tab === 'journey' ? 'selected' : ''} aria-pressed={tab === 'journey'} onClick={() => setTab('journey')}><Music2 size={18}/>Hành trình<span>24 bài nhạc</span></button><button className={tab === 'practice' ? 'selected' : ''} aria-pressed={tab === 'practice'} onClick={() => setTab('practice')}><Headphones size={18}/>Chơi tự do<span>Chọn nhịp của mình</span></button><button onClick={() => { audio.stop(); setStudio(true); }}><Sparkles size={18}/>Phòng sáng tác<span>Viết bài nhạc mới<ArrowRight size={14}/></span></button></nav>
                        {tab === 'journey' ? <section className="sm-journey"><div className="sm-section-heading"><div><div className="sm-eyebrow">TỪNG NỐT, TỪNG BƯỚC</div><h2>Hành trình của mình</h2></div><p>Mỗi bài 3 câu ngắn. Cứ thong thả nhé.</p></div><div className="sm-chapters" role="group" aria-label="Chọn chương">{CHAPTERS.map((c, i) => <button className={chapter === i ? 'selected' : ''} key={c.title} aria-pressed={chapter === i} onClick={() => setChapter(i)}><span>0{i + 1}</span>{c.title}<small>{SOUND_MISSIONS.filter(m => m.chapter === i && progress.missions[m.id]).length}/6</small></button>)}</div><div className="sm-chapter-heading"><div><h3>{CHAPTERS[chapter].title}</h3><p>{CHAPTERS[chapter].subtitle}</p></div><span><Sparkles size={15}/>{CHAPTERS[chapter].gift}</span></div><div className="sm-missions">{SOUND_MISSIONS.filter(m => m.chapter === chapter).map(m => { const p = progress.missions[m.id], locked = m.number > 1 && !p && !progress.missions[SOUND_MISSIONS[m.number - 2].id]; return <button className={`sm-mission ${p ? 'done' : ''} ${next?.id === m.id ? 'next' : ''}`} key={m.id} disabled={locked} onClick={() => start(m)}><span className="sm-mission-number">{locked ? <LockKeyhole size={19}/> : String(m.number).padStart(2, '0')}</span><div><strong>{m.title}</strong><small>{m.phrases.some(p => p.kind === 'rhythm') ? 'Gõ nhịp' : 'Nghe & nhớ'} · 3 câu nhạc</small></div><span className="sm-mission-stars" aria-label={p ? `${p.stars} sao` : locked ? 'Chưa mở' : 'Sẵn sàng'}>{p ? '★'.repeat(p.stars) : locked ? '' : <ArrowRight size={18}/>}</span></button>; })}</div></section>
                            : <section className="sm-practice"><div><span className="sm-eyebrow">KHÔNG VỘI, KHÔNG ÁP LỰC</span><h2>Hôm nay mình muốn chơi gì?</h2><p>Chơi bao nhiêu lần tùy thích. Thành tích tự chơi, có hướng dẫn và luyện bằng hình được ghi riêng.</p></div><label>Chọn bài luyện<select value={practiceId} onChange={e => setPracticeId(e.target.value)}>{[['band-1', 'Nghe & nhớ · 2 nốt'], ['band-9', 'Nghe & nhớ · 3–4 nốt'], ['band-11', 'Nghe & nhớ · 5–6 nốt'], ['band-13', 'Gõ nhịp · bốn tiếng đều'], ['band-15', 'Gõ nhịp · trống và vỗ tay'], ['band-17', 'Gõ nhịp · cặp tiếng nhanh']].map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label><button className="sm-primary" onClick={() => start(SOUND_MISSIONS.find(m => m.id === practiceId)!, false)}>Chơi tự do<Play size={17}/></button><small className="sm-muted">Chơi tự do không cộng sao mua vật phẩm.</small></section>}
                        <footer className="sm-footer"><span>Không cần chơi hoàn hảo. Cứ chơi vui.</span><button className="sm-text" onClick={() => setStagePicker(true)}>Sân khấu của mình</button><button className="sm-text" onClick={onLegacy}>Mở phiên bản cũ</button></footer>
                    </main>
                </>}
        </div>
        {message && <p className="sm-message" role="status">{message}</p>}
        {settings && <AudioSettings audio={audio} enabled={soundEnabled} toggleSound={toggleSound} prefs={prefs} onPrefs={savePrefs} onClose={() => { audio.stop(); setSettings(false); }}/>} 
        {stagePicker && <SoundModal title="Sân khấu của mình" onClose={() => setStagePicker(false)}><BandStage members={members}/><p>Một nơi thật đẹp cho bài nhạc của mình.</p>{STAGES.map(stage => <button key={stage.id} className="sm-secondary sm-wide" disabled={completed < stage.at} aria-pressed={prefs.stage === stage.id} onClick={() => savePrefs({ ...prefs, stage: stage.id })}><span style={{ width: 18, height: 18, borderRadius: 5, background: stage.color }}/>{stage.name}{completed < stage.at ? <small>· Hoàn thành {stage.at} bài</small> : prefs.stage === stage.id ? ' ✓' : ''}</button>)}</SoundModal>}
        {pending && <SoundModal title="Mình còn một bài đang chơi" onClose={() => setPending(null)}><p>Chơi tiếp bài dở, hoặc bắt đầu bài mới? Các câu trong bài dở sẽ được thay bằng bài mới.</p><button className="sm-primary sm-wide" onClick={() => { setRound(draft.session); setPending(null); }}>Chơi tiếp bài dở</button><button className="sm-secondary sm-wide" onClick={() => fresh(pending.mission, pending.campaign)}>Bắt đầu bài mới</button></SoundModal>}
    </div></StageThemeContext.Provider>;
}
