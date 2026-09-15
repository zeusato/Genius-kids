import { coordinate, glyph, NAMES } from './model';
import type { BoardProps } from './Board3D';
import { useState } from 'react';
import type { CSSProperties } from 'react';
export default function Board2D(p: BoardProps) {
  const [focus, setFocus] = useState(4);
  const targets = new Set(p.moves.map(m => m.to)), last = p.match.history.at(-1);
  const xy = (square: number) => { const file = square % 9, rank = Math.floor(square / 9); return [50 + (p.flip ? 8 - file : file) * 50, 50 + (p.flip ? rank : 9 - rank) * 50]; };
  return <div className='kv-flat'><svg viewBox='0 0 500 550' aria-label='Lưới bàn cờ' className='kv-flat-board'><defs><linearGradient id='kv-wood' x2='1' y2='1'><stop stopColor='#efdab0'/><stop offset='1' stopColor='#d9b780'/></linearGradient></defs><rect x='10' y='10' width='480' height='530' rx='12' fill='#95663c'/><rect x='17' y='17' width='466' height='516' rx='8' fill='url(#kv-wood)'/><g stroke='#936840' strokeWidth='1.1' fill='none'>{Array.from({ length: 10 }, (_, r) => <path key={`r${r}`} d={`M50 ${50 + r * 50}H450`}/>)}{Array.from({ length: 9 }, (_, f) => <path key={`f${f}`} d={f === 0 || f === 8 ? `M${50 + f * 50} 50V500` : `M${50 + f * 50} 50V250 M${50 + f * 50} 300V500`}/>)}<path d='M200 50L300 150 M300 50L200 150 M200 400L300 500 M300 400L200 500'/><rect x='45' y='45' width='410' height='460' strokeWidth='2'/></g><g fill='#956f47' textAnchor='middle' dominantBaseline='middle' fontSize={p.vietnamese ? 14 : 23} fontFamily={p.vietnamese ? 'KyVien' : 'XiangqiPieces'}><text x='150' y='275'>{p.vietnamese ? 'SÔNG SỞ' : '楚 河'}</text><text x='350' y='275'>{p.vietnamese ? 'BỜ HÁN' : '漢 界'}</text></g></svg>
    <div className='kv-flat-points' role='group' aria-label='Bàn cờ tương tác'>{Array.from({ length: 90 }, (_, square) => {
      const piece = p.match.board[square], [x, y] = xy(square), target = targets.has(square), selected = p.selected === square, recent = last?.from === square || last?.to === square;
      const moving = p.motion?.to === square, origin = moving && p.motion ? xy(p.motion.from) : [x, y];
      const motionStyle = { '--kv-from-x': `${(origin[0] - x) / 41.75 * 100}%`, '--kv-from-y': `${(origin[1] - y) / 41.8 * 100}%`, animationDuration: `${p.motion?.duration ?? 0}ms` } as CSSProperties;
      return <button key={square} data-square={square} tabIndex={focus === square ? 0 : -1} onFocus={() => setFocus(square)} onKeyDown={event => {
        const direction = p.flip ? -1 : 1, steps: Record<string, [number, number]> = { ArrowLeft: [-direction, 0], ArrowRight: [direction, 0], ArrowUp: [0, direction], ArrowDown: [0, -direction] }, step = steps[event.key];
        if (!step) return; event.preventDefault(); const file = square % 9 + step[0], rank = Math.floor(square / 9) + step[1];
        if (file >= 0 && file < 9 && rank >= 0 && rank < 10) event.currentTarget.parentElement?.querySelector<HTMLButtonElement>(`[data-square="${rank * 9 + file}"]`)?.focus();
      }} style={{ left: `${x / 5}%`, top: `${y / 5.5}%`, zIndex: moving ? 3 : undefined }} className={`kv-square ${selected ? 'selected' : ''} ${target ? 'target' : ''} ${recent ? 'recent' : ''} ${p.checked && Math.abs(piece) === 1 && (piece > 0 ? 0 : 1) === p.match.active ? 'checked' : ''}`} disabled={!p.enabled} onClick={() => p.onPick(square)} aria-label={`${piece ? `${NAMES[Math.abs(piece)]} ${piece > 0 ? 'Đỏ' : 'Đen'}` : 'Ô'} ${coordinate(square)}${target ? ', đi được' : ''}`} aria-pressed={selected}>
        {piece ? <span key={moving ? p.match.revision : 'still'} style={moving ? motionStyle : undefined} className={`kv-coin ${piece > 0 ? 'red' : 'black'} ${p.vietnamese ? 'vietnamese' : ''} ${moving ? 'moving' : ''}`}>{p.vietnamese ? NAMES[Math.abs(piece)] : glyph(piece)}</span> : target ? <span className='kv-target-dot'/> : null}
      </button>;
    })}</div></div>;
}
