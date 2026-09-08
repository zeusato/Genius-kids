import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Headphones, Pause, Play, Settings2, RotateCcw, Sparkles } from 'lucide-react';
import { AudioEvent, AudioSession } from '../audio/AudioSession';
import { NOTE_NAMES, TIMBRE_NAMES } from '../audio/voices';
import { Hit, judgeRhythm, missionOf, phraseOf, SoundSession, soundResult } from '../engine/game';
import { clearSoundDraft, saveSoundDraft } from '../progress/progress';
import { useSoundSession } from '../session/useSoundSession';
import { BandStage } from './BandStage';
import { Pads } from './Pads';
import { SoundModal } from './Modal';
export type Completion = (id: string, session: SoundSession) => { ok: boolean; earned: number; bonusStars?: number; achievementNames?: string[] };
export function SoundRound({ initial, studentId, audio, soundEnabled, offset, covered, onSettings, onLeave, onNext, complete }: { initial: SoundSession; studentId: string; audio: AudioSession; soundEnabled: boolean; offset: number; covered: boolean; onSettings: () => void; onLeave: () => void; onNext: () => void; complete: Completion }) {
    const { state: s, ref, send, storageError } = useSoundSession(initial, studentId), mission = missionOf(s), phrase = phraseOf(s);
    const [active, setActive] = useState(-1), [beat, setBeat] = useState(-1), [count, setCount] = useState(0), [message, setMessage] = useState(''), [pauseReason, setPauseReason] = useState('Mình nghỉ một chút nhé.'), [busy, setBusy] = useState(false);
    const [result, setResult] = useState<ReturnType<Completion> | null>(null), [performing, setPerforming] = useState(false), [visual, setVisual] = useState(s.visual), [leavingUnsaved, setLeavingUnsaved] = useState(false);
    const operation = useRef(0), taps = useRef<Hit[]>([]), responseStart = useRef(0), flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null), finishRef = useRef(complete), saveAttempted = useRef(false);
    finishRef.current = complete;
    const stop = () => { operation.current++; audio.stop(); setActive(-1); setBeat(-1); setCount(0); setBusy(false); setPerforming(false); if (flashTimer.current) clearTimeout(flashTimer.current); };
    const pause = (why = 'Mình nghỉ một chút nhé.') => { stop(); setPauseReason(why); send({ type: 'pause' }); };
    const pauseRef = useRef(pause); pauseRef.current = pause;
    useEffect(() => {
        audio.onInterrupt = why => pauseRef.current(why);
        const hidden = () => { if (document.hidden) pauseRef.current('Mình đã dừng tiếng và giữ những câu hoàn thành.'); };
        const devices = () => pauseRef.current('Thiết bị âm thanh vừa thay đổi. Hãy thử tiếng trước khi chơi tiếp.');
        document.addEventListener('visibilitychange', hidden); navigator.mediaDevices?.addEventListener('devicechange', devices);
        return () => { operation.current++; audio.stop(); audio.onInterrupt = () => {}; if (flashTimer.current) clearTimeout(flashTimer.current); document.removeEventListener('visibilitychange', hidden); navigator.mediaDevices?.removeEventListener('devicechange', devices); };
    }, [audio]);
    useEffect(() => { if (covered) pauseRef.current('Đã giữ câu đang chơi.'); }, [covered]);
    const priorSound = useRef(soundEnabled);
    useEffect(() => { if (priorSound.current !== soundEnabled) pauseRef.current('Cài đặt âm thanh đã thay đổi.'); priorSound.current = soundEnabled; }, [soundEnabled]);
    const save = () => {
        const r = finishRef.current(studentId, ref.current); setResult(r);
        if (r.ok) { clearSoundDraft(studentId); setLeavingUnsaved(false); }
    };
    useEffect(() => { if (s.phase === 'complete' && !saveAttempted.current) { saveAttempted.current = true; audio.stop(); save(); } }, [s.phase]);
    const flash = (note: number) => { if (flashTimer.current) clearTimeout(flashTimer.current); setActive(note); flashTimer.current = setTimeout(() => setActive(-1), 200); };
    const cue = (id: string) => {
        if (id.startsWith('note:')) setActive(Number(id.split(':')[1]));
        if (id === 'off') setActive(-1);
        if (id.startsWith('beat:')) setBeat(Number(id.split(':')[1]));
        if (id.startsWith('count:')) setCount(Number(id.split(':')[1]));
        if (id === 'input') { setCount(0); send({ type: 'input' }); }
    };
    const listen = async (guided = s.guided, slow = s.slow) => {
        stop(); setMessage('');
        if (!soundEnabled && !visual) { setMessage('Âm thanh đang tắt. Bật tiếng, hoặc chọn luyện bằng hình bên dưới.'); return; }
        const token = operation.current; setBusy(true);
        if (!await audio.unlock()) { if (token === operation.current) { setBusy(false); setMessage('Chưa bật được âm thanh. Hãy chạm Thử lại, hoặc kiểm tra thiết bị âm thanh.'); } return; }
        if (token !== operation.current) return;
        setBusy(false);
        const p = phraseOf(ref.current), m = missionOf(ref.current), quality = audio.timingQuality;
        const help = guided;
        send({ type: 'demo', guided: help, slow, visual: !soundEnabled || visual, quality });
        const step = 60 / m.bpm * (slow ? 1.4 : 1), events: AudioEvent[] = [];
        const at = (i: number) => p.beats[i] * step + (help && p.kind === 'melody' ? Math.floor(i / 2) * .6 : 0);
        p.notes.forEach((note, i) => { events.push({ at: at(i), voice: p.kind === 'melody' ? m.timbre : note ? 'clap' : 'kick', note, cue: `note:${note}` }, { at: at(i) + Math.min(.28, step * .4), cue: 'off' }); });
        if (p.kind === 'rhythm') for (let b = 0; b < p.length * 2; b++) events.push({ at: b * step / 2, cue: `beat:${b}` });
        const duration = p.kind === 'rhythm' ? p.length * step + .35 : at(p.notes.length - 1) + step + .25;
        audio.schedule(events, duration, cue, () => {
            setActive(-1); setBeat(-1);
            // Recheck after the demo: output timestamps can be zero immediately after unlock.
            const responseQuality = audio.timingQuality;
            const responseHelp = help || (p.kind === 'rhythm' && responseQuality === 'estimated');
            if (responseHelp && !help) setMessage('Thiết bị chưa xác định được độ trễ: mình luyện theo đèn, không chấm độ chính xác thời gian.');
            send({ type: 'demo', guided: responseHelp, slow, visual: !soundEnabled || visual, quality: responseQuality });
            if (p.kind === 'melody' || responseHelp) { send({ type: 'input' }); return; }
            const response: AudioEvent[] = [];
            taps.current = [];
            for (let i = 0; i < 4; i++) response.push({ at: i * step, voice: 'tick', gain: .6, cue: `count:${i + 1}` });
            response.push({ at: 4 * step - .18, cue: 'input' });
            for (let b = 0; b < p.length * 2; b++) response.push({ at: (4 + b / 2) * step, cue: `beat:${b}` });
            const start = audio.schedule(response, (4 + p.length) * step + .2, cue, () => {
                setBeat(-1); const judged = judgeRhythm(p, taps.current, step); setMessage(`${judged.hits}/${p.notes.length} tiếng đúng nhịp${judged.extra ? ` · ${judged.extra} tiếng thêm` : ''}`); send({ type: 'rhythm', accuracy: judged.accuracy });
            });
            responseStart.current = start + 4 * step;
        });
    };
    const hit = (note: number, time: number) => {
        const current = ref.current; if (current.paused || current.phase !== 'input' || covered) return;
        const p = phraseOf(current);
        if (!audio.ready) { pause('Âm thanh đã nghỉ. Mình bật lại trước nhé.'); return; }
        audio.play(p.kind === 'melody' ? missionOf(current).timbre : note ? 'clap' : 'kick', note); flash(note);
        if (p.kind === 'rhythm' && !current.guided) { if (taps.current.length < 512) taps.current.push({ note, at: audio.inputTime(time, offset) - responseStart.current }); }
        else send({ type: 'note', note });
    };
    const hitRef = useRef(hit); hitRef.current = hit;
    useEffect(() => {
        const key = (e: KeyboardEvent) => {
            if (e.repeat || e.altKey || e.ctrlKey || e.metaKey || covered || ref.current.paused) return;
            if (/^[1-5]$/.test(e.key)) { const p = phraseOf(ref.current), n = Number(e.key) - 1; if (n < (p.kind === 'rhythm' ? Math.max(...p.notes) + 1 : missionOf(ref.current).pads)) { e.preventDefault(); hitRef.current(n, e.timeStamp); } }
            if (e.key === 'Escape') pauseRef.current();
        };
        window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
    }, [covered]);
    const perform = async () => {
        stop(); const token = operation.current;
        if (!soundEnabled) { setMessage('Bật âm thanh để nghe ban nhạc biểu diễn nhé.'); return; }
        if (!await audio.unlock() || token !== operation.current) return;
        setPerforming(true); const step = 60 / mission.bpm, events: AudioEvent[] = [];
        const notes = mission.phrases.find(p => p.kind === 'melody')?.notes || [0, 2, 3, 2, 0, 1, 2, 0];
        for (let i = 0; i < 8; i++) { events.push({ at: i * step, voice: mission.timbre, note: notes[i % notes.length], cue: `note:${i % 3}` }, { at: i * step, voice: i % 2 ? 'clap' : 'kick', gain: .5 }); }
        audio.schedule(events, 8 * step + .8, cue, () => { setPerforming(false); setActive(-1); });
    };
    const leave = () => { stop(); if (s.phase === 'complete' && !result?.ok) { setLeavingUnsaved(true); return; } if (s.phase !== 'complete') saveSoundDraft(studentId, ref.current); onLeave(); };
    const next = () => { stop(); setMessage(''); send({ type: 'next' }); };
    const info = soundResult(s), input = s.phase === 'input';
    return <>
        <header className="sm-topbar"><button className="sm-icon" aria-label="Về hành trình" onClick={() => s.phase === 'complete' ? leave() : pause()}><ArrowLeft size={21}/></button><div><strong>{mission.title}</strong><small>{s.campaign ? `Bài ${mission.number} / 24` : 'Chơi tự do · không nhận sao'} · {TIMBRE_NAMES[mission.timbre]}</small></div><button className="sm-icon" aria-label="Cài đặt âm thanh" onClick={onSettings}><Settings2 size={20}/></button>{s.phase !== 'complete' && <button className="sm-icon" aria-label="Tạm dừng" onClick={() => pause()}><Pause size={20}/></button>}</header>
        {storageError && <p className="sm-warning" role="alert">Chưa giữ được bài đang chơi trên máy. Hãy để trang này mở và thử lưu lại khi hoàn thành.</p>}
        {s.phase === 'complete' ? <section className="sm-result"><div className="sm-eyebrow">BUỔI DIỄN CỦA MÌNH</div><h1>Thêm một giai điệu, thêm một niềm vui.</h1><BandStage active={performing ? active % 3 : -1}/><div className="sm-star-display" aria-label={`${info.stars} sao`}>{'★'.repeat(info.stars)}<span>{'☆'.repeat(3 - info.stars)}</span></div>
            <p>{info.record.visual ? 'Đã hoàn thành với hình hướng dẫn.' : info.record.assisted ? 'Đã hoàn thành cùng hướng dẫn.' : 'Mình đã tự hoàn thành cả ba câu!'}</p>
            {!result?.ok ? <div className="sm-warning" role="alert"><p>Chưa lưu được kết quả. Bài hoàn thành vẫn đang ở đây.</p><button className="sm-primary" onClick={save}>Thử lưu lại</button></div> : <><p className="sm-muted">Đã lưu vào hồ sơ · {result.earned ? `+${result.earned} sao mới` : 'Thành tích đã được giữ'}{result.bonusStars ? ` · +${result.bonusStars} sao thành tựu` : ''}</p>{result.achievementNames?.map(name => <p key={name}>{name}</p>)}<div className="sm-actions"><button className="sm-secondary" onClick={() => performing ? stop() : void perform()}>{performing ? <Pause size={18}/> : <Play size={18}/>} {performing ? 'Dừng biểu diễn' : 'Nghe ban nhạc'}</button><button className="sm-primary" onClick={() => { stop(); onNext(); }}>{s.campaign && mission.number < 24 ? 'Bài tiếp theo' : 'Về hành trình'}<ArrowRight size={18}/></button></div></>}
        </section> : <main className="sm-round">
            <div className="sm-round-status"><span className="sm-eyebrow">{phrase.kind === 'melody' ? 'NGHE RỒI ĐÁP LẠI' : 'GÕ THEO NHỊP'}{s.visual ? ' · LUYỆN BẰNG HÌNH' : ''}</span><div className="sm-phrase-progress" aria-label={`Câu ${s.index + 1} trên 3`}>{[0, 1, 2].map(i => <span className={i < s.outcomes.length ? 'done' : i === s.index ? 'current' : ''} key={i}>{i < s.outcomes.length ? '✓' : i + 1}</span>)}</div></div>
            <div className="sm-round-title" aria-live="polite"><h1>{s.phase === 'ready' ? 'Mình nghe một câu nhé.' : count ? `Chuẩn bị… ${count}` : s.phase === 'demo' ? 'Tai lắng nghe, tay nghỉ một chút.' : input ? s.guided ? 'Chạm theo phím được viền sáng.' : phrase.kind === 'melody' ? 'Đến lượt mình!' : 'Cùng gõ theo nhịp!' : s.failed ? 'Mình thử lại câu này nhé.' : 'Hay lắm, mình làm được rồi!'}</h1><p>{s.phase === 'ready' ? mission.detail : input && phrase.kind === 'melody' ? 'Nhớ đúng thứ tự. Không cần chạm nhanh.' : s.failed ? 'Những câu đã hoàn thành vẫn được giữ.' : s.guided ? 'Luyện có hướng dẫn · vẫn mở được bài tiếp theo.' : 'Nghe, cảm nhận và chơi theo cách của mình.'}</p></div>
            <BandStage active={active < 0 ? -1 : phrase.kind === 'rhythm' ? 1 : mission.timbre === 'bell' ? 2 : 0} compact/>
            {phrase.kind === 'rhythm' ? <div className="sm-beat-strip" aria-label="Dòng nhịp, chấm là tiếng gõ, gạch là khoảng nghỉ">{Array.from({ length: phrase.length * 2 }, (_, b) => { const i = phrase.beats.indexOf(b / 2); return <div key={b} className={`${beat === b ? 'current' : ''} ${b % 2 === 0 ? 'downbeat' : ''}`}><small>{b % 2 === 0 ? b / 2 + 1 : '·'}</small><span>{i < 0 ? '–' : phrase.notes[i] ? '✦' : '●'}</span></div>; })}</div> : <div className="sm-answer-dots" aria-label={`${s.entered.length} trên ${phrase.notes.length} nốt đã đáp`}>{phrase.notes.map((_, i) => <span key={i} className={i < s.entered.length ? 'filled' : ''}>{i < s.entered.length ? '♪' : '·'}</span>)}</div>}
            <Pads count={phrase.kind === 'melody' ? mission.pads : Math.max(...phrase.notes) + 1} rhythm={phrase.kind === 'rhythm'} active={active} guided={input && s.guided ? phrase.notes[s.entered.length] : -1} disabled={!input || s.paused || covered} onHit={hit}/>
            <div className="sm-round-controls">{s.phase === 'ready' && <button className="sm-primary" disabled={busy} onClick={() => void listen()}><Headphones size={20}/>{busy ? 'Đang bật tiếng…' : 'Nghe mẫu'}</button>}{s.phase === 'feedback' && !s.failed && <button className="sm-primary" onClick={next}>{s.index === 2 ? 'Hoàn thành bài' : 'Câu tiếp theo'}<ArrowRight size={18}/></button>}
                {(input || s.failed) && <><button className="sm-secondary" onClick={() => { send({ type: 'replay' }); void listen(false, false); }}><RotateCcw size={17}/>Nghe lại</button><button className="sm-secondary" onClick={() => { send({ type: 'replay' }); void listen(false, true); }}>Nghe chậm</button><button className="sm-secondary" onClick={() => { send({ type: 'replay' }); void listen(true, true); }}><Sparkles size={17}/>Từng nhóm & đèn gợi ý</button></>}
            </div>
            {s.failed && s.phraseAttempts >= 2 && <p className="sm-hint">Thử “Từng nhóm & đèn gợi ý”: nghe từng nhóm ngắn, rồi chạm theo viền sáng.</p>}
            {!soundEnabled && s.phase === 'ready' && <label className="sm-check"><input type="checkbox" checked={visual} onChange={e => setVisual(e.target.checked)}/> {phrase.kind === 'rhythm' ? 'Nhìn và gõ' : 'Nhìn và nhớ'} · lưu là luyện bằng hình</label>}
        </main>}
        {message && <p className="sm-message" role="status">{message}</p>}
        {leavingUnsaved && !covered && <SoundModal title="Kết quả chưa lưu vào hồ sơ" onClose={() => setLeavingUnsaved(false)}><p>Thử lưu lại trước khi rời bài nhé. Nếu bộ nhớ đang đầy, rời bài có thể làm mất kết quả này.</p><button className="sm-primary sm-wide" onClick={save}>Thử lưu lại</button><button className="sm-secondary sm-wide" onClick={() => { stop(); saveSoundDraft(studentId, ref.current); onLeave(); }}>Vẫn rời bài</button></SoundModal>}
        {s.paused && !covered && <SoundModal title="Nghỉ một nhịp"><BandStage compact/><p>{pauseReason}</p><p className="sm-muted">Câu đang nghe sẽ bắt đầu lại. Các câu đã hoàn thành được giữ.</p><button className="sm-primary sm-wide" onClick={() => { setMessage(''); send({ type: 'resume' }); }}>Tiếp tục<Play size={18}/></button><button className="sm-secondary sm-wide" onClick={leave}>Về hành trình</button></SoundModal>}
    </>;
}
