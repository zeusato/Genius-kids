import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Delete, Undo2, Volume2, X } from 'lucide-react';
import type { Riddle } from '../content/types';
import { makeTiles, tilesAnswer, type Tile } from '../engine/tiles';
import { chime } from './voice';

function seededShuffle<T>(list: T[], seed: string): T[] {
    let h = 2166136261;
    for (const c of seed) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
    const rng = () => { h = (Math.imul(h, 1664525) + 1013904223) >>> 0; return h / 2 ** 32; };
    const a = [...list];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
}

export interface InputProps { riddle: Riddle; seed: string; wrong: string[]; disabled: boolean; onSubmit: (input: string) => void; onSpeak: (text: string) => void }

/** Bốn thẻ đáp án. Thẻ chọn sai mờ đi và không bấm lại được. */
export function ChoiceInput({ riddle, seed, wrong, disabled, onSubmit, onSpeak }: InputProps) {
    const options = useMemo(() => seededShuffle([{ text: riddle.answer, emoji: riddle.emoji }, ...riddle.choices], seed), [riddle, seed]);
    // Chỉ hiện hình khi cả bốn thẻ đều có hình, để thẻ thiếu hình không thành dấu hiệu lộ đáp án.
    const withPictures = options.every(o => o.emoji);
    return (
        <div className={`rd-choices${withPictures ? ' has-pictures' : ''}`} role="group" aria-label="Chọn đáp án">
            {options.map(o => {
                const out = wrong.includes(o.text);
                return (
                    <div key={o.text} className={`rd-choice${out ? ' is-out' : ''}`}>
                        <button className="rd-choice-main" disabled={disabled || out} onClick={() => { chime('tap'); onSubmit(o.text); }} aria-label={out ? `${o.text} (chưa đúng)` : o.text}>
                            {withPictures && <span className="rd-choice-pic" aria-hidden="true">{o.emoji}</span>}
                            <span className="rd-choice-text">{o.text}</span>
                            {out && <X className="rd-choice-x" size={22} aria-hidden="true" />}
                        </button>
                        <button className="rd-choice-say" onClick={() => onSpeak(o.text)} aria-label={`Nghe: ${o.text}`} tabIndex={-1}><Volume2 size={16} /></button>
                    </div>
                );
            })}
        </div>
    );
}

/** Ghép chữ: chạm ô chữ để đặt vào chỗ trống, chạm chỗ đã điền để trả lại. Đủ ô thì tự kiểm. */
export function TilesInput({ riddle, seed, disabled, onSubmit, wrongCount }: InputProps & { wrongCount: number }) {
    const puzzle = useMemo(() => {
        let h = 0; for (const c of seed) h = (h * 33 + c.charCodeAt(0)) >>> 0;
        return makeTiles(riddle, () => { h = (Math.imul(h, 1664525) + 1013904223) >>> 0; return h / 2 ** 32; });
    }, [riddle, seed]);
    const [placed, setPlaced] = useState<(Tile | null)[]>(() => Array(puzzle.slots).fill(null));
    const [shake, setShake] = useState(false);
    const first = useRef(true);
    useEffect(() => { setPlaced(Array(puzzle.slots).fill(null)); }, [puzzle]);
    // Sai thì rung nhẹ rồi trả chữ về để ghép lại.
    useEffect(() => {
        if (first.current) { first.current = false; return; }
        setShake(true);
        const t = window.setTimeout(() => { setShake(false); setPlaced(Array(puzzle.slots).fill(null)); }, 650);
        return () => clearTimeout(t);
    }, [wrongCount, puzzle.slots]);
    const used = new Set(placed.filter(Boolean).map(t => t!.id));
    const put = (t: Tile) => {
        if (disabled) return;
        const i = placed.findIndex(p => !p);
        if (i < 0) return;
        chime('tap');
        const next = placed.map((p, j) => (j === i ? t : p));
        setPlaced(next);
        if (next.every(Boolean)) window.setTimeout(() => onSubmit(tilesAnswer(puzzle, next)), 260);
    };
    return (
        <div className="rd-tiles">
            <div className={`rd-slots${shake ? ' is-shaking' : ''}${riddle.lang === 'en' ? ' is-letters' : ''}`} aria-label="Ô đáp án">
                {puzzle.prefix && <span className="rd-slot-prefix">{puzzle.prefix}</span>}
                {placed.map((p, i) => (
                    <React.Fragment key={i}>
                        {puzzle.gaps.includes(i) && <span className="rd-slot-gap" />}
                        <button className={`rd-slot${p ? ' is-filled' : ''}`} disabled={disabled || !p} onClick={() => setPlaced(placed.map((x, j) => (j === i ? null : x)))} aria-label={p ? `Bỏ chữ ${p.text}` : `Ô trống ${i + 1}`}>{p?.text ?? ''}</button>
                    </React.Fragment>
                ))}
            </div>
            <div className="rd-tile-pool" role="group" aria-label="Các chữ để ghép">
                {puzzle.tiles.map(t => <button key={t.id} className="rd-tile" disabled={disabled || used.has(t.id)} onClick={() => put(t)}>{t.text}</button>)}
                <button className="rd-tile rd-tile-undo" disabled={disabled || !used.size} onClick={() => { const i = placed.map(Boolean).lastIndexOf(true); if (i >= 0) setPlaced(placed.map((x, j) => (j === i ? null : x))); }} aria-label="Bỏ chữ vừa đặt"><Undo2 size={20} /></button>
            </div>
        </div>
    );
}

/** Tự viết. Toán mẹo có bàn phím số; tiếng Việt chấp nhận gõ không dấu. */
export function TypeInput({ riddle, disabled, onSubmit, resetKey }: InputProps & { resetKey: number }) {
    const [value, setValue] = useState('');
    const ref = useRef<HTMLInputElement>(null);
    const numeric = riddle.kind === 'math';
    useEffect(() => { setValue(''); if (!numeric && window.matchMedia('(pointer: fine)').matches) ref.current?.focus(); }, [riddle.id, resetKey, numeric]);
    const send = () => { if (value.trim() && !disabled) onSubmit(value); };
    if (numeric) return (
        <div className="rd-keypad-wrap">
            <output className="rd-keypad-screen" aria-live="polite">{value || <span>?</span>}</output>
            <div className="rd-keypad" role="group" aria-label="Bàn phím số">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(k => <button key={k} disabled={disabled} onClick={() => { chime('tap'); setValue(v => (v + k).slice(0, 4)); }}>{k}</button>)}
                <button disabled={disabled} onClick={() => setValue(v => v.slice(0, -1))} aria-label="Xoá"><Delete size={22} /></button>
                <button disabled={disabled} onClick={() => { chime('tap'); setValue(v => (v + '0').slice(0, 4)); }}>0</button>
                <button className="is-ok" disabled={disabled || !value} onClick={send} aria-label="Trả lời"><Check size={24} /></button>
            </div>
        </div>
    );
    return (
        <form className="rd-type" onSubmit={e => { e.preventDefault(); send(); }}>
            <input ref={ref} value={value} onChange={e => setValue(e.target.value)} disabled={disabled} maxLength={40}
                placeholder={riddle.lang === 'en' ? 'Type in English…' : 'Gõ đáp án của em…'} aria-label="Đáp án"
                autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false} enterKeyHint="done" />
            <button className="rd-btn rd-btn-primary" disabled={disabled || !value.trim()}>Trả lời</button>
            {riddle.lang === 'vi' && <small>Gõ không dấu cũng được, Nhân Sư sẽ hiểu.</small>}
        </form>
    );
}
