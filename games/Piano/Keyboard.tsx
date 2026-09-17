import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { isBlack, noteName, type Preferences } from './model';
import { KEY_CODES, PianoKeyboardInput } from './keyboardInput';
export { KEY_CODES } from './keyboardInput';
const hint=(i:number)=>KEY_CODES[i].replace('Key','').replace('Semicolon',';').replace('Quote',"'").replace('BracketRight',']');
export function Keyboard({active,cue,expected,labels,disabled,onDown,onUp,onReset}:{active:number[];cue:number[];expected:number[];labels:Preferences['labels'];disabled:boolean;onDown:(key:string,midi:number,recovered?:boolean)=>void;onUp:(key:string)=>void;onReset:()=>void}){
    const scroller=useRef<HTMLDivElement>(null),pointers=useRef(new Map<number,number>()),callbacks=useRef({onDown,onUp,onReset,disabled});
    callbacks.current={onDown,onUp,onReset,disabled};
    const [imeHelp,setImeHelp]=useState(false),input=useRef<PianoKeyboardInput|null>(null);
    if(!input.current)input.current=new PianoKeyboardInput({onDown:(...args)=>callbacks.current.onDown(...args),onUp:id=>callbacks.current.onUp(id),onReset:()=>callbacks.current.onReset(),onIme:()=>setImeHelp(true)});
    const reset=()=>{pointers.current.clear();input.current?.reset();};
    useEffect(()=>{
        const blocked=(e:KeyboardEvent)=>callbacks.current.disabled||!!(e.target as HTMLElement)?.closest?.('input,select,textarea,[contenteditable]:not([contenteditable="false"]),[role="textbox"],[role="dialog"]');
        const down=(e:KeyboardEvent)=>{
            if(input.current?.keyDown(e,blocked(e)))e.preventDefault();
        };
        const up=(e:KeyboardEvent)=>{if(input.current?.keyUp(e,blocked(e)))e.preventDefault();};
        const hidden=()=>{if(document.hidden)reset();};
        window.addEventListener('keydown',down,true);window.addEventListener('keyup',up,true);window.addEventListener('blur',reset);document.addEventListener('visibilitychange',hidden);
        return()=>{window.removeEventListener('keydown',down,true);window.removeEventListener('keyup',up,true);window.removeEventListener('blur',reset);document.removeEventListener('visibilitychange',hidden);reset();};
    },[]);
    // The parent already stops live notes before disabling input (e.g. demo).
    // Forget held keys here without cancelling a newly scheduled demonstration.
    useEffect(()=>{if(disabled){pointers.current.clear();input.current?.reset(false);}},[disabled]);
    const target=cue[0]??expected[0];
    useEffect(()=>{
        const container=scroller.current;if(!container||active.length||target===undefined)return;
        const key=container.querySelector<HTMLElement>(`[data-midi="${target}"]`);if(!key)return;
        const left=key.offsetLeft,right=left+key.offsetWidth;
        if(left<container.scrollLeft+12||right>container.scrollLeft+container.clientWidth-12)container.scrollTo({left:Math.max(0,left-container.clientWidth/2+key.offsetWidth/2),behavior:'instant'});
    },[target,active.length]);
    const end=(e:React.PointerEvent)=>{pointers.current.delete(e.pointerId);onUp('pointer:'+e.pointerId);};
    const midiAt=(e:React.PointerEvent)=>{
        const el=document.elementFromPoint(e.clientX,e.clientY)?.closest<HTMLElement>('[data-midi]');
        return el&&scroller.current?.contains(el)?Number(el.dataset.midi):null;
    };
    return <div className="pn-keyboard-wrap">
        <div className="pn-keyboard-meta"><span><i/> C4 — C6 <small>· 25 phím để khám phá</small></span><div><button aria-label="Xem phím thấp hơn" onClick={()=>{reset();scroller.current?.scrollBy({left:-240,behavior:'smooth'});}}><ChevronLeft size={18}/></button><button aria-label="Xem phím cao hơn" onClick={()=>{reset();scroller.current?.scrollBy({left:240,behavior:'smooth'});}}><ChevronRight size={18}/></button></div></div>
        <div className="pn-key-scroll" ref={scroller}><div className="pn-keys" role="group" aria-label="Bàn phím đàn piano">
            {Array.from({length:25},(_,i)=>{
                const midi=60+i,black=isBlack(midi),whiteBefore=Array.from({length:i},(_,j)=>60+j).filter(n=>!isBlack(n)).length;
                const style=black?{left:`calc(${whiteBefore*100/15}% - 2.1%)`}:{left:`${whiteBefore*100/15}%`};
                return <button key={midi} data-midi={midi} aria-label={`${noteName(midi)} ${Math.floor(midi/12)-1}`} aria-pressed={active.includes(midi)} disabled={disabled} style={style}
                    className={`pn-key ${black?'black':'white'} ${active.includes(midi)?'pressed':''} ${cue.includes(midi)?'demo':''} ${expected.includes(midi)?'expected':''}`}
                    onPointerDown={e=>{if(e.button!==0&&e.pointerType==='mouse')return;e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);pointers.current.set(e.pointerId,midi);onDown('pointer:'+e.pointerId,midi);}}
                    onPointerMove={e=>{if(!pointers.current.has(e.pointerId))return;const next=midiAt(e);if(next!==pointers.current.get(e.pointerId)){onUp('pointer:'+e.pointerId);pointers.current.set(e.pointerId,next??-1);if(next!==null)onDown('pointer:'+e.pointerId,next);}}}
                    onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end}
                    onKeyDown={e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();if(!e.repeat)onDown('button:'+midi,midi);}}}
                    onKeyUp={e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();onUp('button:'+midi);}}} onBlur={()=>onUp('button:'+midi)}>
                    <span className="pn-key-light"/>{labels!=='none'&&<span className="pn-note-label">{noteName(midi,labels==='letters')}<small>{Math.floor(midi/12)-1}</small></span>}<kbd>{hint(i)}</kbd>
                </button>;
            })}
        </div></div>
        <p className="pn-keyboard-hint">Chạm để đàn · Giữ để ngân · Thử nhiều ngón cùng lúc <span>Máy tính: A S D F G H J K</span></p>
        {imeHelp&&<p className="pn-ime-help" role="status">Bộ gõ đang xử lý phím. Nếu còn thiếu nốt hoặc muốn giữ phím, chơi hợp âm, hãy chuyển UniKey/EVKey từ V sang E khi đàn.</p>}
    </div>;
}
