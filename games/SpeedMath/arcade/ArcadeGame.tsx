import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronRight, Clock, Flame, Headphones, Music2, Pause, Play, RotateCcw, Sparkles, Star, Trophy, Volume2, VolumeX, X, Zap } from 'lucide-react';
import type { StudentProfile } from '../../../types';
import type { useMusicControls } from '../../../src/contexts/MusicContext';
import { musicManager } from '../../../services/musicManager';
import { MusicTrack } from '../../../services/musicConfig';
import { cancelSpeech, speak } from '../../../src/utils/speech';
import { boardOf, createSession, duration, recordOf, reduce, validConfig } from './engine';
import { bestFor, clearDraft, readDraft, saveDraft } from './progress';
import { ROUND_INFO, THEMES, type Action, type Config, type Session } from './model';
import { PuzzleVisual, Tia, StageProgress } from './Visuals';
import { RoundBoard } from './RoundBoard';
import { useArcadeSound } from './useArcadeSound';
import './arcade.css';
type Receipt = {
    ok: boolean;
    earned: number;
    bonusStars?: number;
    achievementNames?: string[];
};
interface Props {
    student: StudentProfile;
    controls: ReturnType<typeof useMusicControls>;
    complete: (id: string, s: Session) => Receipt;
    onBack: () => void;
    difficulty?: string;
    initialSession?: Session;
    preview?: boolean;
}
function Dialog({ title, children, onClose }: {
    title: string;
    children: React.ReactNode;
    onClose: () => void;
}) {
    const ref = useRef<HTMLDivElement>(null), close = useRef(onClose);
    close.current = onClose;
    useEffect(() => { const old = document.activeElement as HTMLElement | null; ref.current?.querySelector<HTMLButtonElement>('button')?.focus(); const key = (e: KeyboardEvent) => { if (e.key === 'Escape') {
        e.preventDefault();
        close.current();
    } if (e.key === 'Tab') {
        const items = Array.from(ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input,select,[tabindex="0"]') || []);
        const first = items[0], last = items.at(-1);
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last?.focus();
        }
        else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first?.focus();
        }
    } }; document.addEventListener('keydown', key); return () => { document.removeEventListener('keydown', key); old?.focus(); }; }, []);
    return <div className="sm-overlay"><div ref={ref} className="sm-dialog" role="dialog" aria-modal="true" aria-labelledby="sm-dialog-title"><div className="sm-dialog-heading"><h2 id="sm-dialog-title">{title}</h2><button className="sm-icon" aria-label="Đóng" onClick={onClose}><X /></button></div>{children}</div></div>;
}
const TOPICS = [['mixed', 'Tổng hợp'], ['math', 'Toán học'], ['observe', 'Quan sát'], ['words', 'Tiếng Việt'], ['knowledge', 'Khám phá']] as const;
function initialConfig(student: StudentProfile, difficulty?: string): Config {
    const fallback: Config = { grade: Math.max(1, Math.min(5, Number(student.grade) || 1)), difficulty: difficulty === 'hard' ? 'hard' : difficulty === 'medium' ? 'medium' : 'easy', pace: 'challenge', topic: 'mixed', mode: 'cup', theme: 'station' };
    try {
        const saved = JSON.parse(localStorage.getItem(`speed-config-v1:${student.id}`) || 'null');
        return validConfig(saved) ? { ...saved, grade: fallback.grade } : fallback;
    }
    catch {
        return fallback;
    }
}
export function ArcadeGame({ student, controls, complete, onBack, difficulty, initialSession, preview = false }: Props) {
    const [config, setConfig] = useState(() => initialSession?.config || initialConfig(student, difficulty));
    const [draft, setDraft] = useState(() => preview ? { session: null, corrupt: false } : readDraft(student.id));
    const [s, setSession] = useState<Session | null>(initialSession || null), state = useRef(s);
    state.current = s;
    const [dialog, setDialog] = useState<'pause' | 'leave' | 'replace' | null>(null), [receipt, setReceipt] = useState<Receipt | null>(null), [storageError, setStorageError] = useState(false), [quiet, setQuiet] = useState(false);
    const completeRef = useRef(complete), controlsRef = useRef(controls), finishId = useRef(''), speechToken = useRef(0), speechTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined), boardRef = useRef<HTMLElement>(null);
    completeRef.current = complete;
    controlsRef.current = controls;
    const savedId = useRef('');
    const stopSpeech = useCallback(() => { speechToken.current++; clearTimeout(speechTimer.current); cancelSpeech(); }, []);
    const send = useCallback((action: Action) => {
        const current = state.current;
        if (!current)
            return;
        if (!['tick', 'input', 'listen'].includes(action.type) && current.listening) {
            stopSpeech();
            state.current = reduce(current, { type: 'listen', value: false, sessionId: current.id, now: performance.now() });
        }
        const next = reduce(state.current!, { ...action, sessionId: current.id, now: performance.now() });
        state.current = next;
        setSession(next);
    }, [stopSpeech]);
    const persist = useCallback(() => { const current = state.current; if (!current || preview || savedId.current === current.id)
        return; setStorageError(!saveDraft(current)); }, [preview]);
    useEffect(() => { window.scrollTo(0, 0); controlsRef.current.playTrack(MusicTrack.SPEED_MATH); return () => { stopSpeech(); musicManager.setPaused(false); controlsRef.current.resumeRouteMusic(); }; }, [stopSpeech]);
    useEffect(() => { const timer = setInterval(() => { if (state.current?.phase === 'playing' && !state.current.paused)
        send({ type: 'tick' }); }, 100); const saver = setInterval(persist, 1000); const hide = () => { if (document.hidden) {
        send({ type: 'pause' });
        stopSpeech();
        persist();
    } }; const unload = () => { send({ type: 'pause' }); persist(); }; document.addEventListener('visibilitychange', hide); window.addEventListener('pagehide', unload); return () => { clearInterval(timer); clearInterval(saver); document.removeEventListener('visibilitychange', hide); window.removeEventListener('pagehide', unload); const current = state.current; if (current && !preview && current.phase !== 'finished')
        saveDraft({ ...current, paused: true, listening: false }); }; }, [send, persist, stopSpeech, preview]);
    useEffect(() => { persist(); }, [s?.phase, s?.paused, persist]);
    useEffect(() => { musicManager.setPaused(!!s?.paused); }, [s?.paused]);
    useEffect(() => { if (!s?.listening)
        return; const old = musicManager.getVolume(); musicManager.setVolume(old * .22); return () => musicManager.setVolume(old); }, [s?.listening]);
    useEffect(() => { if (s?.paused) {
        stopSpeech();
        setDialog(d => d || 'pause');
    } }, [s?.paused, stopSpeech]);
    const storeResult = useCallback(() => { const current = state.current; if (!current || current.phase !== 'finished')
        return; let result: Receipt; try {
        result = completeRef.current(student.id, current);
    }
    catch {
        result = { ok: false, earned: 0 };
    } setReceipt(result); if (result.ok) {
        finishId.current = current.id;
        savedId.current = current.id;
        if (!preview)
            clearDraft(student.id);
        setStorageError(false);
        setDraft({ session: null, corrupt: false });
    } }, [student.id, preview]);
    useEffect(() => { if (s?.phase === 'finished' && finishId.current !== s.id) {
        finishId.current = s.id;
        stopSpeech();
        storeResult();
    } }, [s?.phase, s?.id, stopSpeech, storeResult]);
    useEffect(() => { if (!s?.paused)
        boardRef.current?.querySelector<HTMLElement>(s?.phase === 'playing' ? '.sm-choice button:not(:disabled),.sm-match button:not(:disabled),.sm-order-source button:not(:disabled),.sm-typing input' : '.sm-next,.sm-interlude .sm-primary')?.focus({ preventScroll: true }); }, [s?.id, s?.round, s?.boardIndex, s?.phase, s?.paused]);
    useArcadeSound(s, controls.soundEnabled);
    const startNew = () => { stopSpeech(); window.scrollTo(0, 0); const seed = crypto.getRandomValues(new Uint32Array(1))[0]; const next = createSession(config, seed,crypto.randomUUID(),student.id); state.current = next; setSession(next); setReceipt(null); setDialog(null); setDraft({ session: null, corrupt: false }); finishId.current = ''; if (!preview) {
        try {
            localStorage.setItem(`speed-config-v1:${student.id}`, JSON.stringify(config));
        }
        catch {
            setStorageError(true);
        }
        saveDraft(next);
    } };
    const resumeDraft = () => { if (!draft.session)
        return; state.current = { ...draft.session, clockAt: performance.now(), paused: false }; setSession(state.current); setConfig(draft.session.config); setReceipt(null); };
    const leave = () => { stopSpeech(); if (s && s.phase !== 'finished') {
        send({ type: 'pause' });
        persist();
    } onBack(); };
    const listen = () => { if (!s || s.phase !== 'playing' || s.paused)
        return; if (s.listening) {
        stopSpeech();
        send({ type: 'listen', value: false });
        return;
    } send({ type: 'listen', value: true }); const token = ++speechToken.current, done = () => { if (token === speechToken.current) {
        clearTimeout(speechTimer.current);
        send({ type: 'listen', value: false });
    } }; const b = boardOf(s); speak(b.prompt, { onEnd: done, onError: done }); speechTimer.current = setTimeout(() => { if (token === speechToken.current) {
        stopSpeech();
        send({ type: 'listen', value: false });
    } }, 20000); };
    const activeConfig = s?.config || config, theme = THEMES.find(t => t.id === activeConfig.theme)!, score = s?.rounds.reduce((n, r) => n + r.points, 0) || 0, record = s ? recordOf(s) : null;
    const background = { '--sm-scene': `url("${import.meta.env.BASE_URL}speed-math/art/${activeConfig.theme}.webp")` } as React.CSSProperties;
    const b = s ? boardOf(s) : null, round = s ? s.rounds[s.round] : null;
    const modal = dialog || s?.paused ? 'sm-modal-open' : '';
    return <div className={`sm-game sm-theme-${activeConfig.theme} ${quiet ? 'sm-quiet' : ''}`} style={background}>
  <div className={`sm-shell ${modal}`} inert={!!modal}>
   <header className="sm-topbar"><button className="sm-icon" aria-label="Về danh sách trò chơi" onClick={() => s && s.phase !== 'finished' ? (send({ type: 'pause' }), setDialog('leave')) : onBack()}><ArrowLeft /></button><div className="sm-brand"><Zap size={20}/><div>ĐUA TỐC ĐỘ<small>Đấu Trường Tia Chớp</small></div></div><div className="sm-top-actions"><button className="sm-icon" aria-label={controls.musicEnabled ? 'Tắt nhạc nền' : 'Bật nhạc nền'} aria-pressed={controls.musicEnabled} onClick={controls.toggleMusic}><Music2 size={20}/></button><button className="sm-icon" aria-label={controls.soundEnabled ? 'Tắt hiệu ứng âm thanh' : 'Bật hiệu ứng âm thanh'} aria-pressed={controls.soundEnabled} onClick={controls.toggleSound}>{controls.soundEnabled ? <Volume2 size={20}/> : <VolumeX size={20}/>}</button><button className="sm-icon sm-motion" aria-label="Giảm chuyển động" aria-pressed={quiet} onClick={() => setQuiet(v => !v)}><Sparkles size={20}/></button>{s && s.phase !== 'finished' && <button className="sm-icon" aria-label="Tạm dừng" onClick={() => { send({ type: 'pause' }); setDialog('pause'); }}><Pause size={20}/></button>}</div></header>
   {storageError && <p className="sm-warning" role="status">Chưa lưu được lượt chơi trên thiết bị. Giữ trang này mở và thử lưu lại. <button onClick={persist}>Thử lại</button></p>}
   {!s ? <main className="sm-lobby">
    <section className="sm-hero"><div className="sm-eyebrow"><span /> SÂN KHẤU CỦA NHỮNG BỘ ÓC NHANH NHẠY</div><h1>Thắp sáng<br /><em>trí thông minh!</em></h1><p>Chọn thật chuẩn. Nối thật khéo. Xếp thật nhanh.<br />Cùng Tia chinh phục ba vòng thử thách của riêng em.</p><div className="sm-hero-badges"><span><Clock size={16}/>{config.pace === 'calm' ? '60' : '45'} giây / vòng</span><span><Zap size={16}/>3 kỹ năng · 1 sân khấu</span></div><div className="sm-host"><Tia /><div className="sm-host-bubble">Xin chào {student.name}!<br /><strong>Sẵn sàng tỏa sáng chưa?</strong></div></div></section>
    <section className="sm-launch-panel"><div className="sm-panel-heading"><span className="sm-eyebrow">CHỌN THỬ THÁCH</span><span className="sm-grade">Lớp {config.grade}</span></div><h2>Một sân khấu.<br />Ba cách tỏa sáng.</h2><div className="sm-round-list">{(['choice', 'match', 'order'] as const).map((kind, i) => <div key={kind}><span className={`sm-round-icon round-${i}`}>{i === 0 ? <Zap /> : i === 1 ? '↔' : '↗'}</span><div><strong>{ROUND_INFO[kind].name}</strong><small>{['Chọn đáp án · Phản xạ', 'Ghép từng cặp · Liên kết', 'Sắp xếp thẻ · Tư duy'][i]}</small></div><span className="sm-round-number">0{i + 1}</span></div>)}</div>
     <div className="sm-settings"><label>Chủ đề<select value={config.topic} onChange={e => setConfig({ ...config, topic: e.target.value as Config['topic'] })}>{TOPICS.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label><label>Độ thử thách<select value={config.difficulty} onChange={e => setConfig({ ...config, difficulty: e.target.value as Config['difficulty'] })}><option value="easy">Khởi động</option><option value="medium">Tiêu chuẩn</option><option value="hard">Thử sức</option></select></label><label>Nhịp chơi<select value={config.pace} onChange={e => setConfig({ ...config, pace: e.target.value as Config['pace'] })}><option value="challenge">Nhanh nhạy · 45 giây</option><option value="calm">Thong thả · 60 giây</option></select></label><label>Chế độ<select value={config.mode} onChange={e => setConfig({ ...config, mode: e.target.value as Config['mode'] })}><option value="cup">Cúp Tia Chớp · 3 vòng</option>{Object.entries(ROUND_INFO).map(([id, r]) => <option key={id} value={id}>Luyện: {r.name}</option>)}</select></label></div>
     <div className="sm-theme-picker" role="group" aria-label="Sân khấu">{THEMES.map((t, i) => <button key={t.id} aria-pressed={config.theme === t.id} onClick={() => setConfig({ ...config, theme: t.id })}><span>{['✦', '✿', '☾'][i]}</span>{t.name}</button>)}</div>
     <button className="sm-primary sm-start" onClick={() => draft.session ? setDialog('replace') : startNew()}><Play size={20} fill="currentColor"/> {config.mode === 'cup' ? 'Vào đấu trường' : 'Bắt đầu luyện tập'}<ArrowRight size={20}/></button>
     {draft.session && <button className="sm-secondary sm-resume" onClick={resumeDraft}><RotateCcw size={17}/>{draft.session.phase === 'finished' ? 'Khôi phục kết quả chưa lưu' : 'Tiếp tục lượt đang chơi'}</button>}
     {draft.corrupt && <p className="sm-warning">Lượt cũ bị lỗi dữ liệu. Em có thể bắt đầu lượt mới.</p>}
     <p className="sm-personal-best"><Trophy size={15}/>Kỷ lục cùng cấu hình: <strong>{bestFor(student, config)} điểm</strong></p>
    </section>
   </main> : <main className="sm-arena">
    <nav className="sm-round-nav" aria-label="Các vòng chơi">{s.rounds.map((r, i) => <div key={i} className={i === s.round ? 'current' : i < s.round ? 'done' : ''}><span>{i < s.round ? <Check size={16}/> : i + 1}</span>{ROUND_INFO[r.kind].name}{i < s.round && <small>{r.points}đ</small>}</div>)}</nav>
    <div className="sm-arena-layout"><aside className="sm-energy"><span className="sm-eyebrow">{theme.name}</span><div className="sm-energy-ring" style={{ '--sm-charge': `${Math.min(100, score / (s.rounds.length * 200) * 100)}%` } as React.CSSProperties}><Zap size={45} fill="currentColor"/><strong>{score}</strong><small>NĂNG LƯỢNG</small></div><StageProgress theme={activeConfig.theme} rounds={s.rounds}/><div className="sm-host-side"><Tia happy={s.lastCorrect === true}/></div><p>{s.combo >= 3 ? 'Tuyệt! Giữ nhịp này nhé.' : 'Mỗi lần thử là một bước tiến!'}</p><div className="sm-combo"><Flame size={20}/><strong>{s.combo}</strong> chuỗi đúng</div></aside>
     <section className={`sm-stage-card sm-kind-${b?.kind}`} ref={boardRef}>
      {s.fx > 0 && s.lastCorrect && <div key={`${s.id}:${s.fx}`} className="sm-score-sparks" aria-hidden="true">{Array.from({ length: 7 }, (_, i) => <i key={i} style={{ '--i': i } as React.CSSProperties}>✦</i>)}</div>}
      {s.phase === 'ready' || s.phase === 'between' ? <div className="sm-interlude"><span className="sm-stage-symbol">{s.phase === 'ready' ? <Zap size={48}/> : <Check size={48}/>}</span><span className="sm-eyebrow">{s.phase === 'ready' ? 'CHÀO MỪNG ĐẾN ĐẤU TRƯỜNG' : `HOÀN THÀNH VÒNG ${s.round + 1}`}</span><h1>{s.phase === 'ready' ? ROUND_INFO[s.rounds[0].kind].name : `${round!.points} tia năng lượng!`}</h1><p>{s.phase === 'ready' ? ROUND_INFO[s.rounds[0].kind].description : `Tiếp theo: ${ROUND_INFO[s.rounds[s.round + 1].kind].name}. ${ROUND_INFO[s.rounds[s.round + 1].kind].description}`}</p><div className="sm-rule-notes"><span><Clock size={18}/>{duration(s.config) / 1000} giây hoạt động mỗi vòng</span><span><Flame size={18}/>Đúng liên tiếp để tăng điểm</span><span><Star size={18}/>{s.config.mode === 'cup' ? 'Đạt 30 / 60 / 100 điểm ở mỗi vòng và độ chính xác 60 / 80 / 90% để nhận 1 / 2 / 3 sao.' : 'Luyện riêng một kỹ năng, không thưởng sao.'}</span></div><button className="sm-primary" onClick={() => send({ type: 'start' })}>Bắt đầu vòng {s.phase === 'ready' ? 1 : s.round + 2}<ArrowRight size={20}/></button></div>
                : s.phase === 'finished' ? <div className="sm-results"><span className="sm-eyebrow">SÂN KHẤU NÀY LÀ CỦA EM</span><Trophy className="sm-trophy" size={70}/><h1>{record?.medal ? 'Tỏa sáng rực rỡ!' : 'Một lượt chơi thật đáng nhớ!'}</h1><p>{s.config.mode === 'cup' ? 'Cả ba vòng đã hoàn thành. Cùng nhìn lại thành quả nhé.' : 'Em đã hoàn thành buổi luyện tập.'}</p><div className="sm-score-final">{score}<small>tia năng lượng</small></div><div className="sm-result-stats"><span><strong>{record?.accuracy}%</strong>Chính xác lần đầu</span><span><strong>{s.bestCombo}</strong>Chuỗi tốt nhất</span><span><strong>{receipt?.ok ? receipt.earned : '—'} ★</strong>Sao nhận được</span></div><div className="sm-round-results">{s.rounds.map((r, i) => <div key={i}><span>{ROUND_INFO[r.kind].name}</span><div><i style={{ width: `${r.points / 2}%` }}/></div><strong>{r.points}/200</strong></div>)}</div>
       {receipt?.ok ? <p className="sm-save-status"><Check size={16}/>Đã lưu kết quả{receipt.bonusStars ? ` · +${receipt.bonusStars} sao thành tích` : ''}</p> : <p className="sm-warning" role="alert">Chưa lưu được kết quả. <button onClick={storeResult}>Thử lưu lại</button></p>}
       {!!receipt?.achievementNames?.length && <p>{receipt.achievementNames.join(' · ')}</p>}
       {s.review.length > 0 && <details className="sm-review"><summary>Xem lại {s.review.length} thử thách cần luyện</summary>{s.review.map((r, i) => <div key={i}><strong>{r.prompt}</strong><p>{r.answer}</p></div>)}</details>}
       <div className="sm-result-actions"><button className="sm-primary" disabled={!receipt?.ok} onClick={startNew}><RotateCcw size={18}/>Chơi lại</button><button className="sm-secondary" disabled={!receipt?.ok} onClick={() => { state.current = null; setSession(null); setReceipt(null); }}>Chọn thử thách khác</button></div></div>
                    : <><div className="sm-board-heading"><span className="sm-eyebrow">VÒNG {s.round + 1} · {ROUND_INFO[b!.kind].name}</span><span className={`sm-timer ${s.remainingMs < 10000 ? 'low' : ''}`}><Clock size={18}/>{Math.ceil(s.remainingMs / 1000)}<small>giây</small></span></div><div className="sm-time-track" role="progressbar" aria-label="Thời gian còn lại" aria-valuemin={0} aria-valuemax={duration(s.config) / 1000} aria-valuenow={Math.ceil(s.remainingMs / 1000)}><i style={{ width: `${s.remainingMs / duration(s.config) * 100}%` }}/></div>
       <div className="sm-question-head"><span>{ROUND_INFO[b!.kind].verb}</span><button className="sm-icon" disabled={s.phase !== 'playing'} onClick={listen} aria-label={s.listening ? 'Dừng đọc câu hỏi' : 'Nghe câu hỏi'}><Headphones size={20}/></button></div><div className={`sm-question-content ${b!.visual ? 'illustrated' : ''}`}><h1 className="sm-question">{b!.prompt}</h1>{b!.visual && <PuzzleVisual visual={b!.visual}/>}</div>
       <RoundBoard key={`${s.id}:${b!.id}`} s={s} b={b!} send={send}/>
       <div className={`sm-feedback ${s.lastCorrect === false ? 'gentle' : ''}`} role="status" aria-live="polite">{s.listening ? 'Đang đọc câu hỏi · Em vẫn có thể trả lời ngay.' : s.feedback || 'Chạm thẻ để bắt đầu. Em làm được mà!'}</div>
       <div className="sm-next-slot">{(s.phase === 'review' || s.phase === 'boardDone') && <button className="sm-primary sm-next" onClick={() => send({ type: 'next' })}>Thử thách tiếp theo<ChevronRight size={20}/></button>}</div>
      </>}
     </section>
    </div>
   </main>}
   <footer className="sm-footer"><span><Zap size={14}/>CHẠM NHANH · NGHĨ SÁNG · CHƠI VUI</span><span>{s ? 'Tab để chọn · Enter để xác nhận' : 'Không mất mạng chơi khi trả lời sai'}</span></footer>
  </div>
  {(dialog === 'pause' || s?.paused && dialog !== 'leave') && <Dialog title="Nghỉ một chút nhé!" onClose={() => { setDialog(null); send({ type: 'resume' }); }}><p>Đồng hồ đã dừng. Các thẻ và phần đang nhập vẫn được giữ nguyên.</p><button className="sm-primary" onClick={() => { setDialog(null); send({ type: 'resume' }); }}><Play size={19}/>Tiếp tục chơi</button><button className="sm-secondary" onClick={() => setDialog('leave')}>Về danh sách trò chơi</button></Dialog>}
  {dialog === 'leave' && <Dialog title="Hẹn gặp lại ở sân khấu!" onClose={() => { setDialog(null); send({ type: 'resume' }); }}><p>{storageError ? 'Thiết bị chưa lưu được lượt này. Rời trang có thể làm mất tiến độ.' : 'Lượt chơi được lưu trên thiết bị này. Em có thể tiếp tục khi quay lại.'}</p><button className="sm-primary" onClick={leave}>Lưu và rời sân khấu</button><button className="sm-secondary" onClick={() => { setDialog(null); send({ type: 'resume' }); }}>Chơi tiếp</button></Dialog>}
  {dialog === 'replace' && <Dialog title="Bắt đầu lượt mới?" onClose={() => setDialog(null)}><p>Lượt đang dở sẽ được thay bằng thử thách mới.</p><button className="sm-primary" onClick={startNew}>Bắt đầu lượt mới</button><button className="sm-secondary" onClick={() => { setDialog(null); resumeDraft(); }}>Tiếp tục lượt cũ</button></Dialog>}
 </div>;
}
