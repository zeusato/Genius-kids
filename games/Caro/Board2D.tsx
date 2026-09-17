import { useEffect, useRef, useState } from 'react';
import { Minus, Plus, Scan } from 'lucide-react';
import { SIZE, mark, type Side } from './model';

export function Mark({ value, preview = false }: { value: number; preview?: boolean }) {
  return <svg className={`caro-mark ${value === 1 ? 'caro-x' : 'caro-o'} ${preview ? 'caro-preview' : ''}`} viewBox="0 0 40 40" aria-hidden="true">
    {value === 1 ? <><path d="M11 10 29 30"/><path d="M29 10 11 30"/></> : <circle cx="20" cy="20" r="12"/>}
  </svg>;
}
export default function Board2D({ board, activeSide, selected, onSelect, onPlace, disabled, last, lines, confirmTouch }: {
  board: number[]; activeSide: Side; selected: number | null; onSelect(cell: number | null): void; onPlace(cell: number): void;
  disabled: boolean; last?: number; lines: number[][]; confirmTouch: boolean;
}) {
  const viewport = useRef<HTMLDivElement>(null), grid = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1), [base, setBase] = useState(400), [focus, setFocus] = useState(112);
  const gesture = useRef({ x: 0, y: 0, moved: false, touch: false, pointers: new Set<number>() });
  const suppressUntil = useRef(0);
  const wins = new Set(lines.flat());
  useEffect(() => {
    const el = viewport.current; if (!el) return;
    const resize = new ResizeObserver(() => setBase(el.clientWidth)); resize.observe(el); setBase(el.clientWidth);
    return () => resize.disconnect();
  }, []);
  const changeZoom = (next: number) => {
    const el = viewport.current; if (!el) return;
    const bounded = Math.max(1, Math.min(3, next)), ratio = bounded / zoom;
    const left = (el.scrollLeft + el.clientWidth / 2) * ratio - el.clientWidth / 2;
    const top = (el.scrollTop + el.clientHeight / 2) * ratio - el.clientHeight / 2;
    setZoom(bounded); requestAnimationFrame(() => el.scrollTo({ left, top }));
  };
  return <div className="caro-board-shell">
    <div className="caro-board-tools"><span>15 × 15 <i>·</i> Nối đúng 5 quân</span><div>
      <button aria-label="Thu nhỏ bàn cờ" disabled={zoom === 1} onClick={() => changeZoom(zoom - .5)}><Minus size={16}/></button>
      <button aria-label="Phóng to bàn cờ" disabled={zoom === 3} onClick={() => changeZoom(zoom + .5)}><Plus size={16}/></button>
      <button aria-label="Xem toàn bàn" onClick={() => changeZoom(1)}><Scan size={16}/></button>
    </div></div>
    <div ref={viewport} className="caro-board-viewport" onScroll={() => { gesture.current.moved = true; suppressUntil.current = Date.now() + 160; }}
      onPointerDown={e => { const g = gesture.current; g.pointers.add(e.pointerId); g.x = e.clientX; g.y = e.clientY; g.moved = g.pointers.size > 1; g.touch = e.pointerType !== 'mouse'; }}
      onPointerMove={e => { const g = gesture.current; if (g.pointers.size && Math.hypot(e.clientX - g.x, e.clientY - g.y) > 7) g.moved = true; }}
      onPointerUp={e => { const g = gesture.current; g.pointers.delete(e.pointerId); if (g.moved) suppressUntil.current = Date.now() + 300; }}
      onPointerCancel={e => { gesture.current.pointers.delete(e.pointerId); gesture.current.moved = true; suppressUntil.current = Date.now() + 300; }}>
      <div ref={grid} className="caro-grid" role="grid" aria-label="Bàn cờ Ca-rô 15 hàng, 15 cột" aria-disabled={disabled} style={{ width: base * zoom, height: base * zoom }}
        onKeyDown={e => {
          if (e.altKey || e.ctrlKey || e.metaKey || e.nativeEvent.isComposing || disabled) return;
          const r = Math.floor(focus / SIZE), c = focus % SIZE;
          let next = focus;
          if (e.key === 'ArrowUp') next = Math.max(0, r - 1) * SIZE + c;
          else if (e.key === 'ArrowDown') next = Math.min(14, r + 1) * SIZE + c;
          else if (e.key === 'ArrowLeft') next = r * SIZE + Math.max(0, c - 1);
          else if (e.key === 'ArrowRight') next = r * SIZE + Math.min(14, c + 1);
          else if (e.key === 'Escape') { e.preventDefault(); onSelect(null); return; }
          else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!e.repeat && !board[focus]) onPlace(focus); return; }
          else return;
          e.preventDefault(); setFocus(next); onSelect(board[next] ? null : next);
          grid.current?.querySelector<HTMLButtonElement>(`[data-cell="${next}"]`)?.focus();
        }}>
        {Array.from({ length: SIZE }, (_, r) => <div role="row" key={r} className="caro-row">{board.slice(r * SIZE, r * SIZE + SIZE).map((value, c) => {
          const i = r * SIZE + c;
          return <button key={i} data-cell={i} type="button" role="gridcell" tabIndex={i === focus ? 0 : -1}
            aria-label={`Hàng ${r + 1}, cột ${c + 1}: ${value ? value === 1 ? 'X' : 'O' : 'trống'}${last === i ? ', nước mới nhất' : ''}`}
            aria-selected={selected === i} aria-disabled={disabled || !!value}
            className={`caro-cell ${selected === i ? 'is-selected' : ''} ${wins.has(i) ? 'is-winning' : ''} ${last === i ? 'is-last' : ''}`}
            onFocus={() => setFocus(i)}
            onClick={e => {
              if (disabled || value || Date.now() < suppressUntil.current || e.detail > 1) return;
              setFocus(i);
              if (confirmTouch || gesture.current.touch && e.detail !== 0) onSelect(i); else onPlace(i);
            }}>
            {!!value && <Mark value={value}/>}{!value && selected === i && !disabled && <Mark value={activeSide + 1} preview/>}
            {!value && !disabled && selected !== i && <span className="caro-hover"><Mark value={activeSide + 1} preview/></span>}
          </button>;
        })}</div>)}
        {!!lines.length && <svg className="caro-win-lines" viewBox="0 0 15 15" aria-hidden="true">{lines.map((line, i) => <line key={i} x1={line[0] % 15 + .5} y1={Math.floor(line[0] / 15) + .5} x2={line.at(-1)! % 15 + .5} y2={Math.floor(line.at(-1)! / 15) + .5}/>)}</svg>}
      </div>
    </div>
    <p className="caro-board-caption">{zoom > 1 ? 'Vuốt để xem các ô khác · Hướng bàn luôn cố định' : disabled ? '15 × 15 ô · Hướng bàn luôn cố định' : confirmTouch ? `Chạm ô rồi bấm “Đặt ${mark(activeSide)}”` : 'Chọn ô trống để đặt quân · Mũi tên + Enter cũng được'}</p>
  </div>;
}
