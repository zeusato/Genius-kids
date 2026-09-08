import React from 'react';
import { NOTE_NAMES } from '../audio/voices';
export function Pads({ count, rhythm = false, active, guided = -1, disabled, onHit }: { count: number; rhythm?: boolean; active: number; guided?: number; disabled: boolean; onHit: (note: number, time: number) => void }) {
    return <div className={`sm-pads ${rhythm ? 'drums' : ''}`} role="group" aria-label={rhythm ? 'Trống và vỗ tay' : 'Các phím nhạc'} style={{ '--pad-count': count } as React.CSSProperties}>
        {Array.from({ length: count }, (_, i) => <button key={i} disabled={disabled} className={`sm-pad sm-pad-${i} ${active === i ? 'lit' : ''} ${guided === i ? 'guided' : ''}`}
            aria-label={`${rhythm ? ['Bùm', 'Tách'][i] : NOTE_NAMES[i]}, phím ${i + 1}`} aria-keyshortcuts={String(i + 1)}
            onPointerDown={e => { if (e.button !== 0) return; e.preventDefault(); e.currentTarget.focus(); onHit(i, e.timeStamp); }}
            onKeyDown={e => { if (['Enter', ' '].includes(e.key)) { e.preventDefault(); if (!e.repeat) onHit(i, e.timeStamp); } }}
            onClick={e => { if (e.detail === 0) onHit(i, e.timeStamp); }}>
            <span className="sm-pad-glyph" aria-hidden="true">{rhythm ? ['◉', '✦'][i] : ['●', '◆', '▲', '✦', '☀'][i]}</span><strong>{rhythm ? ['Bùm', 'Tách'][i] : NOTE_NAMES[i]}</strong><small>{rhythm ? ['Trống trầm', 'Vỗ tay'][i] : String(i + 1)}</small>
        </button>)}
    </div>;
}
