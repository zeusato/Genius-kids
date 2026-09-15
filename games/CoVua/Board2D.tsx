import { useRef } from 'react';
import { sqToAlg, algToSq } from './board';
import { PIECE_NAMES, SIDE_NAMES } from './model';
import type { BoardProps } from './Board3D';
import PieceIcon from './PieceIcon';
export default function Board2D(p:BoardProps) {
  const refs=useRef(new Map<number,HTMLButtonElement>()), squares=Array.from({length:64},(_,i)=>p.flip?i^7:i^56);
  const last=p.match.history.at(-1), recent=last?[algToSq(last.slice(0,2)),algToSq(last.slice(2,4))]:[];
  return <div className='cv-flat-wrap'><div className='cv-flat' aria-label='Bàn cờ vua 2D'>
    {squares.map((sq,index)=>{const code=p.match.board[sq], target=p.targets.includes(sq), check=p.match.inCheck&&code===(p.match.active?14:6);
      let from=p.motion?.to===sq?p.motion.from:undefined;
      if(p.motion&&(p.match.board[p.motion.to]&7)===6&&Math.abs(p.motion.from-p.motion.to)===2) { const right=p.motion.to>p.motion.from;if(sq===p.motion.to+(right?-1:1))from=p.motion.from+(right?3:-4); }
      const delta=from===undefined?undefined:{'--dx':`${((from%8)-(sq%8))*(p.flip?-100:100)}%`,'--dy':`${(Math.floor(sq/8)-Math.floor(from/8))*(p.flip?-100:100)}%`,'--move-ms':`${p.motion!.duration}ms`} as React.CSSProperties;
      return <button ref={el=>{if(el)refs.current.set(sq,el);else refs.current.delete(sq);}} key={sq} className={`cv-cell ${(sq%8+Math.floor(sq/8))%2?'light':'dark'} ${recent.includes(sq)?'recent':''} ${p.selected===sq?'selected':''} ${check?'checked':''} ${target?'target':''}`}
        aria-label={`${sqToAlg(sq)}${code?` · ${PIECE_NAMES[code&7]} ${SIDE_NAMES[code<9?0:1]}`:' · Ô trống'}${target?' · Có thể đi':''}`} aria-pressed={p.selected===sq} aria-disabled={!p.interactive}
        onClick={()=>p.interactive&&p.onPick(sq)} onKeyDown={event=>{const shifts:Record<string,number>={ArrowLeft:-1,ArrowRight:1,ArrowUp:-8,ArrowDown:8};if(event.key in shifts){event.preventDefault();const next=index+shifts[event.key];if(next>=0&&next<64)refs.current.get(squares[next])?.focus();}if(event.key==='Escape')p.onPick(-1);}}>
        {code!==0&&<span className={delta?'cv-moving':''} style={delta} key={`${sq}:${p.motion?.at??0}`}><PieceIcon code={code}/></span>}
        {index%8===0&&<small className='cv-rank'>{Math.floor(sq/8)+1}</small>}{index>=56&&<small className='cv-file'>{sqToAlg(sq)[0]}</small>}
        {target&&<i className={code?'capture':''}/>}
      </button>;})}
  </div></div>;
}
