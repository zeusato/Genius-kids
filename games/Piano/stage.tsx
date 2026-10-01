import React, { useEffect, useRef, useState, type MutableRefObject } from 'react';
import { Check, ChevronDown, Settings2, Volume2 } from 'lucide-react';
import { Keyboard, type KeyboardProps } from './Keyboard';
import { INSTRUMENTS, noteName, type InstrumentId, type Preferences, type Step } from './model';
import type { PianoAudio } from './audio';
import type { PianoAction, PianoProgress } from './progress';

/** What the active view hears from the keyboard after the shell has played the note. */
export interface NoteListener {
    press(midi:number, held:ReadonlySet<number>, recovered:boolean):void;
    release(midi:number, heldMs:number, recovered:boolean):void;
    /** Focus loss, mute, a dialog or a lost audio device: drop holds, timers and demonstrations. */
    interrupt():void;
}
export interface StageApi {
    audio:PianoAudio|null; prefs:Preferences; progress:PianoProgress; locked:boolean;
    persist(action:PianoAction):boolean; ensureAudio():Promise<boolean>; stopSound():void;
    /** Read an instruction aloud when voice is on; `then` runs once it ends (or right away when silent). */
    say(text:string, then?:()=>void):void; hush():void;
    listener:MutableRefObject<NoteListener|null>;
    keyboard:Pick<KeyboardProps,'active'|'labels'|'onDown'|'onUp'|'onReset'|'overlay'>&{disabled:boolean};
}
export type Tone = 'idle'|'good'|'try'|'listen';
export interface Feedback { tone:Tone; text:string }
export const PRAISE = ['Giỏi lắm!','Hay quá!','Tuyệt vời!','Em đàn hay lắm!','Đúng rồi!'];
export const praise = (seed:number) => PRAISE[Math.abs(seed) % PRAISE.length];
/** Register the view's note handlers for as long as it is mounted. */
export function useListener(api:StageApi, listener:NoteListener) {
    api.listener.current = listener;
    useEffect(() => () => { if (api.listener.current === listener) api.listener.current = null; });
}
export function StagePiano({api,disabled=false,...decor}:{api:StageApi;disabled?:boolean}&Pick<KeyboardProps,'cue'|'expected'|'range'|'fingers'|'found'|'marks'>&{labels?:Preferences['labels']}) {
    const {disabled:locked,...keyboard}=api.keyboard;
    return <section className="pn-piano pn-stage-piano"><Keyboard {...keyboard} {...decor} labels={decor.labels??keyboard.labels} disabled={locked||disabled}/></section>;
}
export function FeedbackLine({feedback,children}:{feedback:Feedback;children?:React.ReactNode}) {
    return <div className={`pn-feedback-line tone-${feedback.tone}`} role="status"><span className="pn-feedback-mascot" aria-hidden="true">🦊</span><p>{feedback.text}</p>{children}</div>;
}
export const chipWidth = (beats:number) => `${Math.round(Math.min(150, 44 + Math.max(.25, beats) * 30))}px`;
export function NoteChip({step,state,label,finger,holding}:{step:Step;state:'done'|'current'|'demo'|'todo';label:string;finger?:number;holding?:boolean}) {
    return <span className={`pn-chip ${state} ${holding?'holding':''}`} style={{'--chip':chipWidth(step.beats),'--hold':`${step.holdMs||0}ms`} as React.CSSProperties}>
        {finger&&<b className="pn-chip-finger">{finger}</b>}
        <strong>{label}</strong>
        <i>{step.holdMs?'giữ':step.beats>=2?'dài':''}</i>
        {step.gapBeats?<em className="pn-chip-rest" aria-label="nghỉ">☁</em>:null}
    </span>;
}
export const stepText = (step:Step, prefs:Preferences, show=true) => show ? step.pitches.map(n=>noteName(n,prefs.labels==='letters')).join(' + ') : '♪';
export function Segmented<T extends string|number>({value,options,onChange,label,disabled}:{value:T;options:{value:T;label:React.ReactNode}[];onChange:(v:T)=>void;label:string;disabled?:boolean}) {
    return <div className="pn-segmented" role="group" aria-label={label}>{options.map(o=><button key={String(o.value)} disabled={disabled} className={o.value===value?'selected':''} aria-pressed={o.value===value} onClick={()=>onChange(o.value)}>{o.label}</button>)}</div>;
}
function usePopover() {
    const [open,setOpen]=useState(false),ref=useRef<HTMLDivElement>(null);
    useEffect(()=>{
        if(!open)return;
        const outside=(e:PointerEvent)=>{if(!ref.current?.contains(e.target as Node))setOpen(false);};
        const escape=(e:KeyboardEvent)=>{if(e.key==='Escape')setOpen(false);};
        window.addEventListener('pointerdown',outside,true);window.addEventListener('keydown',escape);
        return()=>{window.removeEventListener('pointerdown',outside,true);window.removeEventListener('keydown',escape);};
    },[open]);
    return {open,setOpen,ref};
}
export function InstrumentMenu({value,disabled,onPick}:{value:InstrumentId;disabled:boolean;onPick:(id:InstrumentId)=>void}) {
    const {open,setOpen,ref}=usePopover(),current=INSTRUMENTS.find(i=>i.id===value)!;
    return <div className="pn-popover-anchor" ref={ref}>
        <button className="pn-header-chip" aria-haspopup="true" aria-expanded={open} disabled={disabled} onClick={()=>setOpen(!open)}><span aria-hidden="true">{current.icon}</span><strong>{current.name}</strong><ChevronDown size={16}/></button>
        {open&&<div className="pn-popover pn-instrument-popover" role="group" aria-label="Chọn tiếng đàn">{INSTRUMENTS.map(i=><button key={i.id} className={i.id===value?'selected':''} aria-pressed={i.id===value} onClick={()=>{setOpen(false);onPick(i.id);}}><span aria-hidden="true">{i.icon}</span><strong>{i.name}</strong><small>{i.detail}</small></button>)}</div>}
    </div>;
}
export function InstrumentGrid({value,disabled,onPick}:{value:InstrumentId;disabled:boolean;onPick:(id:InstrumentId)=>void}) {
    return <div className="pn-instrument-grid" role="group" aria-label="Chọn tiếng đàn">{INSTRUMENTS.map(i=><button key={i.id} disabled={disabled} className={i.id===value?'selected':''} aria-pressed={i.id===value} onClick={()=>onPick(i.id)}><span aria-hidden="true">{i.icon}</span><strong>{i.name}</strong><small>{i.detail}</small>{i.id===value&&<Check className="pn-instrument-check" size={18}/>}</button>)}</div>;
}
export function SettingsMenu({prefs,disabled,show,onChange,onCredits}:{prefs:Preferences;disabled:boolean;show:{guidance?:boolean;voice?:boolean};onChange:(p:Preferences)=>void;onCredits:()=>void}) {
    const {open,setOpen,ref}=usePopover();
    return <div className="pn-popover-anchor" ref={ref}>
        <button className="pn-icon pn-icon-lg" aria-label="Tùy chỉnh" aria-haspopup="true" aria-expanded={open} onClick={()=>setOpen(!open)}><Settings2 size={22}/></button>
        {open&&<div className="pn-popover pn-settings-popover">
            <label className="pn-setting"><span><Volume2 size={18}/>Âm lượng đàn</span><input aria-label="Âm lượng đàn" type="range" min="0" max="0.85" step="0.05" value={prefs.volume} disabled={disabled} onChange={e=>onChange({...prefs,volume:Number(e.target.value)})}/></label>
            <div className="pn-setting"><span>Tên trên phím</span><Segmented label="Tên trên phím" disabled={disabled} value={prefs.labels} onChange={labels=>onChange({...prefs,labels})} options={[{value:'solfege',label:'Đô Rê Mi'},{value:'letters',label:'C D E'},{value:'none',label:'Ẩn'}]}/></div>
            {show.guidance&&<label className="pn-setting pn-switch"><span>Phím sáng gợi ý</span><input type="checkbox" checked={prefs.guidance} disabled={disabled} onChange={e=>onChange({...prefs,guidance:e.target.checked})}/></label>}
            {show.voice&&<label className="pn-setting pn-switch"><span>Đọc to hướng dẫn</span><input type="checkbox" checked={prefs.voice} disabled={disabled} onChange={e=>onChange({...prefs,voice:e.target.checked})}/></label>}
            <button className="pn-text-button" onClick={()=>{setOpen(false);onCredits();}}>Nguồn nhạc & lời cảm ơn</button>
        </div>}
    </div>;
}
