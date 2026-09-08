import React, { useEffect, useRef, useState } from 'react';
import { Headphones, Play, Volume2, VolumeX } from 'lucide-react';
import { AudioEvent, AudioSession } from '../audio/AudioSession';
import { calibrationOffset } from '../audio/calibration';
import { TIMBRES, TIMBRE_NAMES } from '../audio/voices';
import { SoundModal } from './Modal';
import type { StageTheme } from './BandStage';
export interface SoundPreferences { volume: number; offset: number; stage: StageTheme }
export function readSoundPreferences(id: string): SoundPreferences {
    try { const p = JSON.parse(localStorage.getItem(`sound-prefs:${id}`) || '{}'); return { volume: Number.isFinite(p.volume) ? Math.max(0, Math.min(.85, p.volume)) : .65, offset: Number.isFinite(p.offset) ? Math.max(-250, Math.min(250, p.offset)) : 0, stage: ['night', 'garden', 'festival'].includes(p.stage) ? p.stage : 'night' }; } catch { return { volume: .65, offset: 0, stage: 'night' }; }
}
export function AudioSettings({ audio, enabled, toggleSound, prefs, onPrefs, onClose }: { audio: AudioSession; enabled: boolean; toggleSound: () => void; prefs: SoundPreferences; onPrefs: (p: SoundPreferences) => void; onClose: () => void }) {
    const [message, setMessage] = useState(''), [calibrating, setCalibrating] = useState(false), [beat, setBeat] = useState(-1);
    const operation = useRef(0), start = useRef(0), hits = useRef(new Map<number, number>());
    const stop = () => { operation.current++; audio.stop(); setCalibrating(false); setBeat(-1); };
    useEffect(() => {
        const hidden = () => { if (document.hidden) stop(); };
        document.addEventListener('visibilitychange', hidden); return () => { operation.current++; audio.stop(); document.removeEventListener('visibilitychange', hidden); };
    }, [audio]);
    const audition = async (timbre: typeof TIMBRES[number]) => {
        stop(); const op = operation.current;
        if (!enabled || prefs.volume === 0) { setMessage('Bật tiếng và tăng âm lượng để thử nhạc cụ.'); return; }
        if (!await audio.unlock() || op !== operation.current) { if (op === operation.current) setMessage('Trình duyệt chưa bật được âm thanh. Hãy thử chạm lại.'); return; }
        setMessage(`Đang thử ${TIMBRE_NAMES[timbre].toLowerCase()}…`);
        audio.schedule([0, 2, 3, 4, 2, 0].map((note, i) => ({ at: i * .42, voice: timbre, note })), 3.4, () => {}, () => setMessage('Nếu chưa nghe thấy, hãy kiểm tra âm lượng loa hoặc tai nghe.'));
    };
    const calibrate = async () => {
        stop(); const op = operation.current;
        if (!enabled || prefs.volume === 0) { setMessage('Bật tiếng để hiệu chỉnh.'); return; }
        if (!await audio.unlock() || op !== operation.current) return;
        setCalibrating(true); setMessage('Nghe 4 nhịp chuẩn bị, rồi gõ 8 lần đúng lúc nghe tiếng tách.'); hits.current = new Map();
        const events: AudioEvent[] = Array.from({ length: 12 }, (_, i) => ({ at: i * .75, voice: 'tick', gain: .8, cue: String(i) }));
        start.current = audio.schedule(events, 9.2, c => setBeat(Number(c)), () => {
            setCalibrating(false); setBeat(-1); const offset = calibrationOffset([...hits.current.values()]);
            if (offset === null) setMessage('Nhịp gõ chưa đều để hiệu chỉnh. Mình có thể thử lại, hoặc dùng đèn hướng dẫn.');
            else { onPrefs({ ...prefs, offset }); setMessage(`Đã lưu hiệu chỉnh ${offset > 0 ? '+' : ''}${offset} ms. Hãy thử lại khi đổi loa hoặc tai nghe.`); }
        });
    };
    const tap = (time: number) => {
        if (!calibrating) return; const t = audio.inputTime(time) - start.current, target = Math.round(t / .75), error = (t - target * .75) * 1000;
        if (target >= 4 && target < 12 && Math.abs(error) < 350 && !hits.current.has(target)) hits.current.set(target, error);
    };
    return <SoundModal title="Nghe thật rõ, chơi thật vui" onClose={() => { stop(); onClose(); }}>
        <p className="sm-muted">Tiếng nhạc là một phần của trò chơi. Mình thử trước khi lên sân khấu nhé.</p>
        <button className="sm-secondary sm-wide" onClick={() => { stop(); toggleSound(); }}>{enabled ? <Volume2 size={19}/> : <VolumeX size={19}/>} {enabled ? 'Âm thanh đang bật' : 'Âm thanh đang tắt'}</button>
        <label className="sm-setting-label">Âm lượng · {Math.round(prefs.volume / .85 * 100)}%<input aria-label="Âm lượng trò chơi" type="range" min="0" max="85" value={Math.round(prefs.volume * 100)} onChange={e => { stop(); onPrefs({ ...prefs, volume: Number(e.target.value) / 100 }); }}/></label>
        <div className="sm-auditions">{TIMBRES.map(t => <button key={t} className="sm-secondary" onClick={() => void audition(t)}><Play size={15}/>{TIMBRE_NAMES[t]}</button>)}</div>
        <details className="sm-calibration"><summary><Headphones size={17}/> Gõ nhịp & độ trễ thiết bị</summary><p className="sm-muted">Chỉ áp dụng cho phần gõ nhịp. Hiệu chỉnh theo loa hoặc tai nghe đang dùng; nghe và nhớ nốt không cần bước này.</p>
            <label className="sm-setting-label">Hiệu chỉnh · {prefs.offset} ms<input aria-label="Hiệu chỉnh độ trễ" type="range" min="-250" max="250" step="5" value={prefs.offset} onChange={e => { stop(); onPrefs({ ...prefs, offset: Number(e.target.value) }); }}/></label>
            <div className="sm-actions"><button className="sm-secondary" onClick={() => calibrating ? stop() : void calibrate()}>{calibrating ? 'Dừng hiệu chỉnh' : 'Gõ để hiệu chỉnh'}</button><button className="sm-text" onClick={() => { stop(); onPrefs({ ...prefs, offset: 0 }); }}>Đặt lại 0 ms</button></div>
            {calibrating && <button className={`sm-calibrate-pad ${beat >= 4 ? 'ready' : ''}`} onPointerDown={e => { if (e.button === 0) { e.preventDefault(); tap(e.timeStamp); } }} onKeyDown={e => { if ([' ', 'Enter'].includes(e.key)) { e.preventDefault(); if (!e.repeat) tap(e.timeStamp); } }} onClick={e => { if (e.detail === 0) tap(e.timeStamp); }}>{beat < 4 ? `Chuẩn bị ${Math.max(1, beat + 1)}/4` : 'Gõ cùng tiếng tách'}</button>}
        </details>
        {message && <p className="sm-message" role="status">{message}</p>}
    </SoundModal>;
}
