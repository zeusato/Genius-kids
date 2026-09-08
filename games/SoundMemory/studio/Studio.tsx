import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Copy, Eraser, Music2, Pause, Play, Save, Settings2, Trash2, Undo2 } from 'lucide-react';
import { AudioEvent, AudioSession } from '../audio/AudioSession';
import { NOTE_NAMES, TIMBRES, TIMBRE_NAMES, Timbre } from '../audio/voices';
import { Composition, CompositionAction, blankComposition, validComposition } from './model';
import { BandStage } from '../components/BandStage';
import { SoundModal } from '../components/Modal';
export type SaveComposition = (id: string, action: CompositionAction) => { ok: boolean; error?: string };
function readDraft(id: string) { try { const c = JSON.parse(localStorage.getItem(`sound-studio-draft:${id}`) || 'null'); if (c && typeof c.name === 'string' && !c.name.trim()) c.name = 'Bài hát của mình'; return validComposition(c) ? c : null; } catch { return null; } }
export function Studio({ studentId, library, completed, audio, soundEnabled, covered, onSettings, onLeave, save }: { studentId: string; library: Composition[]; completed: number; audio: AudioSession; soundEnabled: boolean; covered: boolean; onSettings: () => void; onLeave: () => void; save: SaveComposition }) {
    const [draft, setDraft] = useState(() => readDraft(studentId) || blankComposition()), [dirty, setDirty] = useState(() => !!readDraft(studentId)), [undo, setUndo] = useState<Composition[]>([]), [selected, setSelected] = useState(0), [page, setPage] = useState(0);
    const [playing, setPlaying] = useState(false), [cursor, setCursor] = useState(-1), [message, setMessage] = useState(''), [confirm, setConfirm] = useState<'save' | 'leave' | 'new' | 'load' | 'delete' | 'replace' | null>(null), [target, setTarget] = useState<Composition | null>(null);
    const token = useRef(0), notesEnabled = completed >= 18, longEnabled = completed >= 24;
    const allowedTimbres = TIMBRES.filter((_, i) => i === 0 || (i === 1 ? completed >= 12 : completed >= 24));
    const stop = () => { token.current++; audio.stop(); setPlaying(false); setCursor(-1); };
    const edit = (next: Composition) => { stop(); setUndo(list => [...list.slice(-39), draft]); setDraft(next); setDirty(true); setMessage(''); };
    useEffect(() => { if (dirty) { try { localStorage.setItem(`sound-studio-draft:${studentId}`, JSON.stringify(draft)); } catch { setMessage('Chưa giữ được bản nháp. Hãy để trang này mở và thử Lưu bài.'); } } }, [draft, dirty, studentId]);
    useEffect(() => {
        const hidden = () => { if (document.hidden) stop(); };
        audio.onInterrupt = reason => { stop(); setMessage(reason); };
        const device = () => { stop(); setMessage('Thiết bị âm thanh đã đổi. Hãy thử tiếng trước khi phát lại.'); };
        document.addEventListener('visibilitychange', hidden); navigator.mediaDevices?.addEventListener('devicechange', device);
        return () => { token.current++; audio.stop(); audio.onInterrupt = () => {}; document.removeEventListener('visibilitychange', hidden); navigator.mediaDevices?.removeEventListener('devicechange', device); };
    }, [audio]);
    useEffect(() => { if (covered || !soundEnabled) stop(); }, [covered, soundEnabled]);
    const preview = async (note: number) => {
        stop(); const op = token.current; setSelected(note);
        if (note >= 0 && soundEnabled && await audio.unlock() && op === token.current) audio.play(draft.timbre, note);
    };
    const play = async () => {
        stop(); const op = token.current;
        if (!soundEnabled) { setMessage('Bật âm thanh để nghe bản nhạc của mình nhé.'); return; }
        if (!await audio.unlock() || op !== token.current) { if (op === token.current) setMessage('Chưa bật được tiếng. Hãy thử lại.'); return; }
        if (!draft.melody.slice(0, draft.steps).some(n => n >= 0) && !draft.kick.some(Boolean) && !draft.clap.some(Boolean)) { setMessage('Chọn một nốt rồi đặt vào ô trống nhé.'); return; }
        const step = 60 / draft.bpm / 2, events: AudioEvent[] = [];
        for (let i = 0; i < draft.steps; i++) {
            events.push({ at: i * step, cue: String(i) });
            if (draft.melody[i] >= 0) events.push({ at: i * step, voice: draft.timbre, note: draft.melody[i] });
            if (notesEnabled && draft.kick[i]) events.push({ at: i * step, voice: 'kick', gain: .7 });
            if (notesEnabled && draft.clap[i]) events.push({ at: i * step, voice: 'clap', gain: .55 });
        }
        setMessage(''); setPlaying(true);
        audio.schedule(events, draft.steps * step + .6, cue => { const n = Number(cue); setCursor(n); setPage(Math.floor(n / 8)); }, () => { setPlaying(false); setCursor(-1); });
    };
    const persist = (composition = draft, overwrite = false) => {
        const result = save(studentId, { type: 'save', composition, overwrite });
        if (result.ok) { setDraft(composition); setDirty(false); setMessage('Đã lưu bài vào tủ nhạc của mình.'); try { localStorage.removeItem(`sound-studio-draft:${studentId}`); } catch {} setConfirm(null); }
        else { setConfirm(null); setMessage(result.error || 'Chưa lưu được. Hãy thử lại.'); }
    };
    const requestSave = () => { stop(); if (library.some(c => c.id === draft.id)) setConfirm('save'); else if (library.length >= 12) setConfirm('replace'); else persist(); };
    const load = (c: Composition) => { stop(); setDraft(structuredClone(c)); setDirty(false); setUndo([]); setPage(0); setConfirm(null); try { localStorage.removeItem(`sound-studio-draft:${studentId}`); } catch {} };
    const newSong = () => { setConfirm(null); edit(blankComposition()); setPage(0); };
    const remove = () => { if (!target) return; const r = save(studentId, { type: 'delete', id: target.id }); setConfirm(null); setMessage(r.ok ? 'Đã xóa bài đã chọn khỏi tủ nhạc.' : r.error || 'Chưa xóa được.'); };
    const start = page * 8;
    return <>
        <header className="sm-topbar"><button className="sm-icon" aria-label="Về hành trình" onClick={() => { stop(); dirty ? setConfirm('leave') : onLeave(); }}><ArrowLeft size={21}/></button><div><strong>Phòng sáng tác</strong><small>Một bài nhạc mang tên mình</small></div><button className="sm-icon" aria-label="Cài đặt âm thanh" onClick={onSettings}><Settings2 size={20}/></button></header>
        <main className="sm-studio"><div className="sm-studio-heading"><div><div className="sm-eyebrow">NHẠC SĨ TÍ HON</div><h1>Chạm một nốt.<br/>Kể một câu chuyện.</h1><p>Chọn nốt nhạc, rồi đặt vào ô. Ô trống là một khoảng nghỉ.</p></div><BandStage active={playing ? (cursor % 3) : -1} compact/></div>
            <div className="sm-composer"><div className="sm-composer-bar"><label>Tên bản nhạc<input aria-label="Tên bản nhạc" value={draft.name} maxLength={40} onChange={e => edit({ ...draft, name: e.target.value })}/></label><label>Nhạc cụ<select value={draft.timbre} onChange={e => edit({ ...draft, timbre: e.target.value as Timbre })}>{allowedTimbres.map(t => <option key={t} value={t}>{TIMBRE_NAMES[t]}</option>)}</select></label><label>Tốc độ · {draft.bpm} BPM<input aria-label="Tốc độ bản nhạc" type="range" min="60" max="120" step="1" value={draft.bpm} onChange={e => edit({ ...draft, bpm: Number(e.target.value) })}/></label></div>
                <div className="sm-note-picker" role="group" aria-label="Chọn nốt để đặt">{NOTE_NAMES.map((name, n) => <button className={`sm-note-choice sm-pad-${n} ${selected === n ? 'selected' : ''}`} aria-pressed={selected === n} key={name} onClick={() => void preview(n)}>{name}</button>)}<button className={`sm-note-choice ${selected === -1 ? 'selected' : ''}`} aria-pressed={selected === -1} onClick={() => void preview(-1)}><Eraser size={17}/>Xóa nốt</button></div>
                <div className="sm-grid-pages"><span>{draft.steps} ô · mỗi ô nửa nhịp</span><div>{longEnabled && <button className="sm-text" onClick={() => { edit({ ...draft, steps: draft.steps === 8 ? 16 : 8 }); setPage(0); }}>{draft.steps === 8 ? 'Thêm 8 ô' : 'Dùng 8 ô đầu'}</button>}{draft.steps === 16 && [0, 1].map(p => <button className={`sm-page ${page === p ? 'selected' : ''}`} aria-pressed={page === p} key={p} onClick={() => setPage(p)}>{p * 8 + 1}–{p * 8 + 8}</button>)}</div></div>
                <p className="sm-mobile-scroll-hint">Vuốt ngang bảng nhạc để xem các ô bên phải.</p>
                <div className="sm-sequencer"><div className="sm-step-numbers">{Array.from({ length: 8 }, (_, n) => <span key={n}>{start + n + 1}</span>)}</div>
                    {(['melody', ...(notesEnabled ? ['kick', 'clap'] : [])] as ('melody' | 'kick' | 'clap')[]).map(lane => <div className="sm-track" key={lane}><div className="sm-track-label"><span>{lane === 'melody' ? 'Giai điệu' : lane === 'kick' ? 'Trống · bùm' : 'Vỗ tay · tách'}</span><button className="sm-icon" aria-label={`Xóa hàng ${lane === 'melody' ? 'giai điệu' : lane === 'kick' ? 'trống' : 'vỗ tay'}`} onClick={() => edit({ ...draft, [lane]: Array(16).fill(lane === 'melody' ? -1 : false) })}><Eraser size={16}/></button></div><div className="sm-track-cells">{Array.from({ length: 8 }, (_, n) => { const i = start + n, value = draft[lane][i], filled = lane === 'melody' ? Number(value) >= 0 : !!value; return <button key={i} className={`sm-cell ${filled ? lane === 'melody' ? `sm-pad-${value}` : 'percussion' : ''} ${cursor === i ? 'current' : ''}`} aria-label={`${lane === 'melody' ? 'Giai điệu' : lane === 'kick' ? 'Trống' : 'Vỗ tay'}, ô ${i + 1}, ${filled ? lane === 'melody' ? NOTE_NAMES[Number(value)] : 'có tiếng' : 'nghỉ'}`} onClick={() => { const row = [...draft[lane]]; row[i] = lane === 'melody' ? value === selected ? -1 : selected : !value; edit({ ...draft, [lane]: row }); }}>{filled ? lane === 'melody' ? NOTE_NAMES[Number(value)] : lane === 'kick' ? '●' : '✦' : '·'}</button>; })}</div></div>)}
                </div>
                <div className="sm-actions"><button className="sm-primary" onClick={() => playing ? stop() : void play()}>{playing ? <Pause size={18}/> : <Play size={18}/>} {playing ? 'Dừng' : 'Biểu diễn'}</button><button className="sm-secondary" onClick={requestSave} disabled={!draft.name.trim()}><Save size={17}/>Lưu bài</button><button className="sm-icon" aria-label="Hoàn tác" disabled={!undo.length} onClick={() => { stop(); setDraft(undo[undo.length - 1]); setUndo(undo.slice(0, -1)); setDirty(true); }}><Undo2 size={19}/></button><button className="sm-secondary" onClick={() => edit({ ...structuredClone(draft), id: crypto.randomUUID(), name: `${draft.name.slice(0, 30)} (bản sao)` })}><Copy size={17}/>Nhân bản</button></div>
                {!notesEnabled && <p className="sm-muted sm-small">Hoàn thành chương 3 để thêm trống và vỗ tay. Chương 4 mở phím mềm và 16 ô.</p>}
            </div>
            {message && <p className="sm-message" role="status">{message}</p>}
            <section className="sm-library"><header><div><h2>Tủ nhạc của mình</h2><p>{library.length}/12 bài đã lưu · lưu riêng trong hồ sơ</p></div><button className="sm-secondary" onClick={() => dirty ? setConfirm('new') : newSong()}>+ Bài mới</button></header>{!library.length ? <div className="sm-empty"><Music2 size={26}/><p>Giai điệu đầu tiên đang chờ mình đặt tên.</p></div> : <div className="sm-song-list">{library.map(c => <article key={c.id}><Music2 size={22}/><div><strong>{c.name}</strong><small>{c.steps} ô · {c.bpm} BPM · {TIMBRE_NAMES[c.timbre]}</small></div><button className="sm-secondary" onClick={() => { setTarget(c); dirty ? setConfirm('load') : load(c); }}>Mở</button><button className="sm-icon" aria-label={`Xóa ${c.name}`} onClick={() => { setTarget(c); setConfirm('delete'); }}><Trash2 size={17}/></button></article>)}</div>}</section>
        </main>
        {confirm && !covered && <SoundModal title={confirm === 'replace' ? 'Tủ nhạc đã đủ 12 bài' : confirm === 'save' ? 'Lưu thay bản trước?' : confirm === 'delete' ? 'Xóa bài đã lưu?' : 'Bản nhạc còn thay đổi chưa lưu'} onClose={() => setConfirm(null)}>
            <p>{confirm === 'save' ? `Lưu các thay đổi vào “${draft.name}”?` : confirm === 'delete' ? `Xóa “${target?.name}” khỏi tủ nhạc?` : confirm === 'replace' ? 'Chọn bài muốn thay. Các bài khác được giữ nguyên.' : 'Em có thể quay lại lưu bài trước khi tiếp tục.'}</p>
            {confirm === 'replace' ? library.map(c => <button className="sm-secondary sm-wide" key={c.id} onClick={() => { setDraft({ ...draft, id: c.id }); setConfirm('save'); }}>Thay “{c.name}”</button>) : <button className="sm-primary sm-wide" onClick={() => { if (confirm === 'save') persist(draft, true); else if (confirm === 'delete') remove(); else if (confirm === 'new') newSong(); else if (confirm === 'load' && target) load(target); else { stop(); onLeave(); } }}>{confirm === 'save' ? 'Lưu thay bản trước' : confirm === 'delete' ? 'Xóa bài này' : confirm === 'leave' ? 'Về hành trình, giữ bản nháp' : 'Tiếp tục'}</button>}
            <button className="sm-secondary sm-wide" onClick={() => setConfirm(null)}>Quay lại</button>
        </SoundModal>}
    </>;
}
