import type { Session } from './model';

// Old checkpoints with actual tracing progress stay on their tracing page.
export const isTracing = (s:Session) => s.learningStep==='trace' || (s.learningStep===undefined && (s.trace.stroke>0 || s.trace.point>0));
export const storyComplete = (s:Session) => s.collected.length===s.rounds[s.index].value;

export function advanceStory(s:Session, index:number, paint=1):Session {
    const value=s.rounds[s.index].value;
    if(s.activity!=='learn'||s.phase!=='playing'||isTracing(s)||!Number.isInteger(index)||index<0||index>=value||s.collected.includes(index))return s;
    if(value===7 && index!==s.collected.length)return s;
    if(value===9 && (!Number.isInteger(paint)||paint<1||paint>3))return s;
    const steps=Array.from({length:value},(_,i)=>s.storySteps?.[i]||0);
    steps[index]=value===6?Math.min(2,steps[index]+1):value===9?paint:1;
    const complete=value!==6 || steps[index]===2;
    return {...s,learningStep:'count',storySteps:steps,collected:complete?[...s.collected,index]:s.collected};
}

export function beginTracing(s:Session):Session {
    if(s.activity!=='learn'||s.phase!=='playing'||!storyComplete(s)||isTracing(s))return s;
    return {...s,learningStep:'trace'};
}
