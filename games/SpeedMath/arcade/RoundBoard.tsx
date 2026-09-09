import React, { useEffect, useRef } from 'react';
import { Check, Undo2, ArrowRight } from 'lucide-react';
import type { Action, Board, Session, Tile } from './model';
import { PuzzleVisual } from './Visuals';
export function RoundBoard({ s, b, send }: {
    s: Session;
    b: Board;
    send: (a: Action) => void;
}) {
    const input = s.input, setInput = (value: string) => send({ type: 'input', boardId: b.id, value }), inputRef = useRef<HTMLInputElement>(null), composing = useRef(false);
    const active = s.phase === 'playing' && !s.paused, review = s.phase === 'review';
    useEffect(() => { if (b.kind === 'typing' && active)
        inputRef.current?.focus({ preventScroll: true }); }, [active, b.kind]);
    const act = (a: Action) => (e: React.MouseEvent) => { if (e.detail > 1)
        return; send(a); };
    const tile = (t: Tile) => t.visual ? <PuzzleVisual visual={t.visual} small/> : <span>{t.text}</span>;
    const keepKey = (e: React.KeyboardEvent) => { if (e.repeat && (e.key === 'Enter' || e.key === ' '))
        e.preventDefault(); };
    if (b.kind === 'choice')
        return <div className="sm-choice" role="group" aria-label="Chọn đáp án">{b.options.map((o, i) => <button key={o.id} className={`sm-answer ${review && b.answer.includes(o.id) ? 'correct' : ''}`} disabled={!active} onKeyDown={keepKey} onClick={act({ type: 'answer', boardId: b.id, value: o.id })}><small>{String.fromCharCode(65 + i)}</small>{tile(o)}{review && b.answer.includes(o.id) && <Check size={20}/>}</button>)}</div>;
    if (b.kind === 'typing')
        return <form className="sm-typing" onSubmit={e => { e.preventDefault(); if (!composing.current && active && input.trim())
            send({ type: 'answer', boardId: b.id, value: input }); }}><label htmlFor="sm-type-answer">Từ em gõ</label><input id="sm-type-answer" ref={inputRef} autoComplete="off" spellCheck={false} value={input} disabled={!active} onChange={e => setInput(e.target.value)} onCompositionStart={() => { composing.current = true; }} onCompositionEnd={() => { composing.current = false; }} onKeyDown={e => { if (e.key === 'Enter' && (e.repeat || e.nativeEvent.isComposing || composing.current))
            e.preventDefault(); }} placeholder="Gõ câu trả lời…"/><button className="sm-primary" type="submit" disabled={!active || !input.trim()}>Gửi <ArrowRight size={18}/></button></form>;
    if (b.kind === 'match')
        return <div className="sm-match"><div className="sm-match-group"><span className="sm-group-label">Nhóm 1 · Chọn thẻ</span>{b.left!.map(t => <button key={t.id} className={`sm-match-tile ${s.matched.includes(t.id) ? 'matched' : ''}`} aria-pressed={s.selected === t.id} disabled={!active || s.matched.includes(t.id)} aria-label={t.text} onKeyDown={keepKey} onClick={act({ type: 'select', boardId: b.id, value: t.id })}>{tile(t)}{s.matched.includes(t.id) && <Check size={20}/>}</button>)}</div><div className="sm-match-divider" aria-hidden="true"><span>↔</span></div><div className="sm-match-group"><span className="sm-group-label">Nhóm 2 · Ghép với</span>{b.options.map(t => <button key={t.id} className={`sm-match-tile ${s.matched.includes(t.id) ? 'matched' : ''}`} disabled={!active || s.matched.includes(t.id)} onKeyDown={keepKey} onClick={act({ type: 'match', boardId: b.id, value: t.id })}>{tile(t)}{s.matched.includes(t.id) && <Check size={20}/>}</button>)}</div><p className="sm-match-progress">{s.matched.length}/{b.left!.length} cặp đã nối · {s.selected === null ? 'Chạm một thẻ ở nhóm 1' : `Đã chọn ${b.left!.find(t => t.id === s.selected)?.text}. Chọn ở nhóm 2.`}</p></div>;
    return <div className="sm-order"><div className="sm-order-destination"><span className="sm-group-label">Thứ tự của em</span><div className="sm-order-slots">{b.answer.map((_, i) => { const t = b.options.find(o => o.id === s.order[i]); return <button className={`sm-order-slot ${t ? 'filled' : ''}`} key={i} disabled={!active || !t} aria-label={`Ô ${i + 1}${t ? `: ${t.text}, bấm để trả lại` : ': trống'}`} onKeyDown={keepKey} onClick={act({ type: 'remove', boardId: b.id, index: i })}><small>{i + 1}</small>{t ? tile(t) : <span className="sm-slot-empty">Chọn thẻ</span>}</button>; })}</div></div><div className="sm-order-source" role="group" aria-label="Các thẻ để xếp">{b.options.map(t => <button key={t.id} className="sm-order-tile" disabled={!active || s.order.includes(t.id)} onKeyDown={keepKey} onClick={act({ type: 'place', boardId: b.id, value: t.id })}>{tile(t)}</button>)}</div><div className="sm-order-actions"><button className="sm-secondary" disabled={!active || !s.order.length} onClick={act({ type: 'undo', boardId: b.id })}><Undo2 size={18}/> Hoàn tác</button><button className="sm-primary" disabled={!active || s.order.length !== b.answer.length} onKeyDown={keepKey} onClick={act({ type: 'check', boardId: b.id })}>Kiểm tra <Check size={18}/></button></div></div>;
}
