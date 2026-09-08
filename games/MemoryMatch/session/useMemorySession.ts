import { useCallback, useEffect, useRef, useState } from 'react';
import { MemoryEvent, MemorySession, activePhase } from '../engine/model';
import { reduceMemory } from '../engine/game';
import { clearMemoryDraft, saveMemoryDraft } from '../progress/progress';

export function useMemorySession(initial:MemorySession,studentId:string){
    const [state,setState]=useState(initial),ref=useRef(initial),[saved,setSaved]=useState(true),saving=useRef(true);
    const save=useCallback(()=>{if(!saving.current)return true;const ok=saveMemoryDraft(studentId,ref.current);setSaved(ok);return ok;},[studentId]);
    const finish=useCallback(()=>{saving.current=false;clearMemoryDraft(studentId);},[studentId]);
    const send=useCallback((event:Omit<MemoryEvent,'sessionId'>|{type:'flip';id:string}|{type:'tick';ms:number})=>{
        const previous=ref.current,next=reduceMemory(previous,{...event,sessionId:previous.id} as MemoryEvent);
        if(next!==previous){ref.current=next;setState(next);}
    },[]);
    useEffect(()=>{
        if(state.paused||(!activePhase(state)&&state.phase!=='preview'))return;
        let last=performance.now();const sessionId=state.id;
        const timer=setInterval(()=>{const now=performance.now(),ms=now-last;last=now;if(ref.current.id===sessionId)send({type:'tick',ms});},100);
        return()=>clearInterval(timer);
    },[state.id,state.paused,state.phase,send]);
    // Save meaningful transitions immediately; elapsed time is checkpointed separately.
    useEffect(()=>{save();},[state.phase,state.attempts,state.hints,state.paused,state.selected,save]);
    useEffect(()=>{const timer=setInterval(save,5000);return()=>clearInterval(timer);},[save]);
    useEffect(()=>{
        const hide=()=>{if(document.hidden){send({type:'pause'});save();}};
        const leave=()=>{send({type:'pause'});save();};
        document.addEventListener('visibilitychange',hide);window.addEventListener('pagehide',leave);
        return()=>{document.removeEventListener('visibilitychange',hide);window.removeEventListener('pagehide',leave);if(saving.current)saveMemoryDraft(studentId,{...ref.current,paused:true});};
    },[studentId,send,save]);
    return {state,send,saved,save,finish};
}
