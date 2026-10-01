import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { isBlack, noteName, type KeyRange, type Preferences } from './model';
import { whiteKeys } from './engine';
import { KEY_CODES, PianoKeyboardInput } from './keyboardInput';
export { KEY_CODES } from './keyboardInput';
const hint=(midi:number)=>KEY_CODES[midi-60].replace('Key','').replace('Semicolon',';').replace('Quote',"'").replace('BracketRight',']');
const FULL:KeyRange=[60,84];
export interface KeyboardProps {
    active:number[]; cue:number[]; expected:number[]; labels:Preferences['labels']; disabled:boolean;
    range?:KeyRange; fingers?:Readonly<Record<number,number>>; found?:number[]; marks?:number[]; overlay?:React.ReactNode;
    onDown:(key:string,midi:number,recovered?:boolean)=>void; onUp:(key:string)=>void; onReset:()=>void;
}
export function Keyboard({active,cue,expected,labels,disabled,range=FULL,fingers,found=[],marks=[],overlay,onDown,onUp,onReset}:KeyboardProps){
    const scroller=useRef<HTMLDivElement>(null),pointers=useRef(new Map<number,number>()),callbacks=useRef({onDown,onUp,onReset,disabled,range});
    callbacks.current={onDown,onUp,onReset,disabled,range};
    const [imeHelp,setImeHelp]=useState(false),[scrollable,setScrollable]=useState(false),input=useRef<PianoKeyboardInput|null>(null);
    if(!input.current)input.current=new PianoKeyboardInput({onDown:(id,midi,recovered)=>{const [from,to]=callbacks.current.range;if(midi>=from&&midi<=to)callbacks.current.onDown(id,midi,recovered);},onUp:id=>callbacks.current.onUp(id),onReset:()=>callbacks.current.onReset(),onIme:()=>setImeHelp(true)});
    const reset=()=>{pointers.current.clear();input.current?.reset();};
    useEffect(()=>{
        const blocked=(e:KeyboardEvent)=>callbacks.current.disabled||!!(e.target as HTMLElement)?.closest?.('input,select,textarea,[contenteditable]:not([contenteditable="false"]),[role="textbox"],[role="dialog"]');
        const down=(e:KeyboardEvent)=>{if(input.current?.keyDown(e,blocked(e)))e.preventDefault();};
        const up=(e:KeyboardEvent)=>{if(input.current?.keyUp(e,blocked(e)))e.preventDefault();};
        const hidden=()=>{if(document.hidden)reset();};
        window.addEventListener('keydown',down,true);window.addEventListener('keyup',up,true);window.addEventListener('blur',reset);document.addEventListener('visibilitychange',hidden);
        return()=>{window.removeEventListener('keydown',down,true);window.removeEventListener('keyup',up,true);window.removeEventListener('blur',reset);document.removeEventListener('visibilitychange',hidden);reset();};
    },[]);
    // The parent already stops live notes before disabling input (e.g. demo).
    // Forget held keys here without cancelling a newly scheduled demonstration.
    useEffect(()=>{if(disabled){pointers.current.clear();input.current?.reset(false);}},[disabled]);
    useLayoutEffect(()=>{
        const container=scroller.current;if(!container)return;
        const measure=()=>setScrollable(container.scrollWidth>container.clientWidth+2);
        measure();const observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(measure);observer?.observe(container);
        return()=>observer?.disconnect();
    },[range[0],range[1]]);
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
    const whites=whiteKeys(range),width=100/whites.length,keys:number[]=[];
    for(let midi=range[0];midi<=range[1];midi++)keys.push(midi);
    const nudge=(direction:number)=>{reset();scroller.current?.scrollBy({left:direction*(scroller.current.clientWidth*.6),behavior:'smooth'});};
    return <div className="pn-keyboard-wrap">
        {scrollable&&<div className="pn-keyboard-meta"><span><i/> Vuốt hoặc chạm mũi tên để xem thêm phím</span><div><button aria-label="Xem phím thấp hơn" onClick={()=>nudge(-1)}><ChevronLeft size={20}/></button><button aria-label="Xem phím cao hơn" onClick={()=>nudge(1)}><ChevronRight size={20}/></button></div></div>}
        <div className="pn-key-area"><div className="pn-key-scroll" ref={scroller}><div className="pn-keys" role="group" aria-label="Bàn phím đàn piano" style={{'--whites':whites.length} as React.CSSProperties}>
            {keys.map(midi=>{
                const black=isBlack(midi),whiteBefore=whites.filter(n=>n<midi).length,finger=fingers?.[midi];
                const style=black?{left:`calc(${whiteBefore*width}% - ${width*.31}%)`,width:`${width*.62}%`}:{left:`${whiteBefore*width}%`,width:`calc(${width}% - 3px)`};
                const isFound=found.includes(midi),isMarked=marks.includes(midi);
                return <button key={midi} data-midi={midi} aria-label={`${noteName(midi)} ${Math.floor(midi/12)-1}${isMarked?' — phím mốc':''}${isFound?' — đã tìm thấy':''}`} aria-pressed={active.includes(midi)} disabled={disabled} style={style}
                    className={`pn-key ${black?'black':'white'} ${active.includes(midi)?'pressed':''} ${cue.includes(midi)?'demo':''} ${expected.includes(midi)?'expected':''} ${isFound?'found':''} ${isMarked?'marked':''}`}
                    onPointerDown={e=>{if(e.button!==0&&e.pointerType==='mouse')return;e.preventDefault();if(callbacks.current.disabled)return;e.currentTarget.setPointerCapture(e.pointerId);pointers.current.set(e.pointerId,midi);onDown('pointer:'+e.pointerId,midi);}}
                    onPointerMove={e=>{if(!pointers.current.has(e.pointerId))return;const next=midiAt(e);if(next!==pointers.current.get(e.pointerId)){onUp('pointer:'+e.pointerId);pointers.current.set(e.pointerId,next??-1);if(next!==null)onDown('pointer:'+e.pointerId,next);}}}
                    onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end}
                    onKeyDown={e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();if(!e.repeat)onDown('button:'+midi,midi);}}}
                    onKeyUp={e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();onUp('button:'+midi);}}} onBlur={()=>onUp('button:'+midi)}>
                    {isMarked&&<span className="pn-key-badge marked" aria-hidden="true"><Star size={15} fill="currentColor"/></span>}
                    {isFound&&!isMarked&&<span className="pn-key-badge found" aria-hidden="true"><Check size={15} strokeWidth={3}/></span>}
                    <span className="pn-key-light"/>
                    {finger&&!black&&<span className="pn-finger" aria-hidden="true">{finger}</span>}
                    {labels!=='none'&&<span className="pn-note-label">{noteName(midi,labels==='letters')}{!black&&<small>{Math.floor(midi/12)-1}</small>}</span>}
                    <kbd>{hint(midi)}</kbd>
                </button>;
            })}
        </div></div>{overlay&&<div className="pn-keyboard-overlay">{overlay}</div>}</div>
        {imeHelp&&<p className="pn-ime-help" role="status">Bộ gõ đang xử lý phím. Nếu còn thiếu nốt hoặc muốn giữ phím, chơi hợp âm, hãy chuyển UniKey/EVKey từ V sang E khi đàn.</p>}
    </div>;
}
