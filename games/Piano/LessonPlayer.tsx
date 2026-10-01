import React, { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUp, BookOpen, Headphones, RotateCcw, Volume2 } from 'lucide-react';
import { eventsFromSteps, stepAtBeat, stepStarts } from './engine';
import { HINT_AFTER, earAnswer, holdDone, judgeFind, judgePress, keysOfClass, needOf, rangeOf } from './lessonEngine';
import { C_POSITION_FINGERS, NOTE_NAMES, noteName, type Activity, type EarActivity, type FindActivity, type FollowActivity, type Lesson, type QuizActivity } from './model';
import { HandArt } from './PianoArt';
import { FeedbackLine, NoteChip, StagePiano, praise, stepText, useListener, type Feedback, type StageApi } from './stage';

const LESSON_BPM = 84, CELEBRATE_MS = 1100;
type Done = (guided:boolean) => void;
interface RunnerProps<A extends Activity> { lesson:Lesson; activity:A; api:StageApi; onDone:Done }
/** Timers that die with the activity, so nothing fires into the next one. */
function useTimers() {
    const timers=useRef(new Set<ReturnType<typeof setTimeout>>()),alive=useRef(true);
    useEffect(()=>{alive.current=true;return()=>{alive.current=false;timers.current.forEach(clearTimeout);timers.current.clear();};},[]);
    const later=(ms:number,fn:()=>void)=>{const t=setTimeout(()=>{timers.current.delete(t);if(alive.current)fn();},ms);timers.current.add(t);};
    const clear=()=>{timers.current.forEach(clearTimeout);timers.current.clear();};
    return {later,clear,alive};
}
function Instruction({activity,api,extra}:{activity:Activity;api:StageApi;extra?:React.ReactNode}) {
    return <div className="pn-instruction">
        {activity.fingers&&<div className="pn-instruction-hand"><HandArt/></div>}
        <p>{activity.say}</p>
        <button className="pn-icon pn-icon-lg" aria-label="Nghe lại hướng dẫn" onClick={()=>api.say(activity.say)}><Volume2 size={22}/></button>
        {extra}
    </div>;
}
const fingersOf = (activity:Activity) => activity.fingers ? C_POSITION_FINGERS : undefined;
const labelsOf = (activity:Activity, api:StageApi) => activity.labels===false ? 'none' as const : api.prefs.labels;

function FollowRunner({lesson,activity,api,onDone}:RunnerProps<FollowActivity>) {
    const steps=activity.steps,[step,setStepState]=useState(0),[phase,setPhaseState]=useState<'listen'|'play'|'hold'|'rest'|'demo'|'done'>(activity.listenFirst?'listen':'play');
    const [misses,setMisses]=useState(0),[cue,setCue]=useState<number[]>([]),[demoAt,setDemoAt]=useState(-1),[feedback,setFeedback]=useState<Feedback>({tone:'idle',text:activity.listenFirst?'Lắng nghe trước nhé…':'Chạm phím đang sáng nhé.'});
    const stepRef=useRef(0),phaseRef=useRef(phase),missRef=useRef(0),hinted=useRef(activity.lights==='always'),timers=useTimers();
    const setStep=(n:number)=>{stepRef.current=n;setStepState(n);};
    const setPhase=(p:typeof phase)=>{phaseRef.current=p;setPhaseState(p);};
    async function demo(){
        api.stopSound();timers.clear();setCue([]);
        if(!await api.ensureAudio()||!api.audio?.audible){setPhase('play');return;}
        if(!timers.alive.current)return;
        const {events,beats}=eventsFromSteps(steps),starts=stepStarts(steps);
        setPhase('demo');setStep(0);setFeedback({tone:'listen',text:'Lắng nghe bạn Cáo đàn nhé…'});
        api.audio.schedule(events,beats,LESSON_BPM,1,(notes,beat)=>{setCue(notes);if(beat>=0&&notes.length)setDemoAt(stepAtBeat(starts,beat));},()=>{
            setCue([]);setDemoAt(-1);setPhase('play');setFeedback({tone:'idle',text:activity.lights==='always'?'Đến lượt em! Chạm phím đang sáng.':'Đến lượt em! Đàn lại giống bạn Cáo nhé.'});
        });
    }
    useEffect(()=>{api.say(activity.say,activity.listenFirst?()=>void demo():undefined);return()=>api.hush();},[]);
    function proceed(){
        missRef.current=0;setMisses(0);
        if(stepRef.current+1<steps.length){setStep(stepRef.current+1);setPhase('play');setFeedback(f=>f.tone==='try'||f.tone==='listen'?{tone:'idle',text:'Đúng rồi! Tiếp nào.'}:f);return;}
        setStep(steps.length);setPhase('done');setFeedback({tone:'good',text:praise(steps.length)});timers.later(CELEBRATE_MS,()=>onDone(hinted.current));
    }
    function next(){
        const goal=steps[stepRef.current];
        if(goal?.gapBeats){setPhase('rest');setFeedback({tone:'listen',text:'☁️ Nghỉ… thả tay và đếm thầm nhé.'});timers.later(goal.gapBeats*60/LESSON_BPM*1000,proceed);}
        else proceed();
    }
    useListener(api,{
        press(midi,held,recovered){
            if(phaseRef.current!=='play')return;
            const goal=steps[stepRef.current];if(!goal)return;
            const result=judgePress(goal,held,midi,recovered);
            if(result==='advance')next();
            else if(result==='hold'){setPhase('hold');setFeedback({tone:'listen',text:'Giữ phím… đợi vòng sáng đầy rồi nhả tay nhé.'});}
            else if(result==='partial')setFeedback({tone:'idle',text:`Giữ ${noteName(midi)} và chạm thêm ${stepText(goal,api.prefs)} nhé.`});
            else if(result==='needs-real-key')setFeedback({tone:'try',text:'Chuyển bộ gõ sang E để giữ phím và đàn hợp âm nhé.'});
            else{missRef.current++;setMisses(missRef.current);if(missRef.current>=HINT_AFTER)hinted.current=true;setFeedback({tone:'try',text:`Đó là ${noteName(midi)}. ${missRef.current>=HINT_AFTER||activity.lights==='always'?`Thử ${stepText(goal,api.prefs)} đang sáng nhé.`:'Nghe lại hoặc thử phím khác nhé.'}`});}
        },
        release(midi,heldMs,recovered){
            const goal=steps[stepRef.current];
            if(recovered||phaseRef.current!=='hold'||!goal?.pitches.includes(midi))return;
            if(holdDone(goal,heldMs))next();
            else{setPhase('play');setFeedback({tone:'try',text:'Sớm quá! Giữ lâu hơn một chút nhé.'});}
        },
        interrupt(){if(phaseRef.current==='done')return;timers.clear();setCue([]);setDemoAt(-1);if(phaseRef.current==='rest')proceed();else setPhase('play');},
    });
    const goal=steps[step],lit=phase==='play'||phase==='hold'?activity.lights==='always'||misses>=HINT_AFTER:false;
    return <>
        <section className="pn-stage-panel">
            <Instruction activity={activity} api={api} extra={phase==='demo'?<button className="pn-tool primary" onClick={()=>{api.stopSound();setCue([]);setDemoAt(-1);setPhase('play');}}>Dừng nghe</button>:<button className="pn-tool" disabled={api.locked||phase==='done'} onClick={()=>void demo()}><Headphones size={19}/>Nghe mẫu</button>}/>
            <div className="pn-road pn-road-single"><div className="pn-road-notes">{steps.map((s,i)=><NoteChip key={i} step={s} finger={activity.fingers&&s.pitches.length===1?C_POSITION_FINGERS[s.pitches[0]]:undefined} holding={i===step&&phase==='hold'}
                state={phase==='demo'?(i===demoAt?'demo':'todo'):i<step?'done':i===step&&phase!=='done'?'current':'todo'} label={stepText(s,api.prefs,activity.lights==='always'||i<step||(i===step&&lit))}/>)}</div></div>
            <FeedbackLine feedback={feedback}/>
        </section>
        <StagePiano api={api} range={rangeOf(lesson,activity)} fingers={fingersOf(activity)} labels={labelsOf(activity,api)} cue={cue} expected={lit&&goal?goal.pitches:[]} disabled={phase==='demo'||phase==='listen'}/>
    </>;
}

function FindRunner({lesson,activity,api,onDone}:RunnerProps<FindActivity>) {
    const need=needOf(activity),[found,setFound]=useState<number[]>([]),[misses,setMisses]=useState(0),[feedback,setFeedback]=useState<Feedback>({tone:'idle',text:'Em cứ thử, sai cũng không sao.'});
    const foundRef=useRef<number[]>([]),doneRef=useRef(false),hinted=useRef(false),timers=useTimers();
    useEffect(()=>{api.say(activity.say);return()=>api.hush();},[]);
    useListener(api,{
        press(midi){
            if(doneRef.current)return;
            const result=judgeFind(activity,new Set(foundRef.current),midi);
            if(result==='found'){
                foundRef.current=[...foundRef.current,midi];setFound(foundRef.current);
                if(foundRef.current.length>=need){doneRef.current=true;setFeedback({tone:'good',text:`${praise(need)} Em tìm đủ ${need} phím rồi!`});timers.later(CELEBRATE_MS,()=>onDone(hinted.current));}
                else setFeedback({tone:'good',text:`Đúng rồi! Còn ${need-foundRef.current.length} phím nữa.`});
            }
            else if(result==='again')setFeedback({tone:'idle',text:'Phím này em tìm rồi. Thử một phím khác nhé!'});
            else{setMisses(m=>{if(m+1>=HINT_AFTER)hinted.current=true;return m+1;});setFeedback({tone:'try',text:activity.wrongTip||'Thử một phím khác nhé.'});}
        },
        release(){},interrupt(){},
    });
    const remaining=activity.targets.filter(n=>!found.includes(n));
    return <>
        <section className="pn-stage-panel">
            <Instruction activity={activity} api={api}/>
            <div className="pn-find-count" aria-label={`Đã tìm ${found.length} trên ${need}`}>{Array.from({length:need},(_,i)=><span key={i} className={i<found.length?'got':''}>{i<found.length?'✓':i+1}</span>)}</div>
            <FeedbackLine feedback={feedback}/>
        </section>
        <StagePiano api={api} range={rangeOf(lesson,activity)} fingers={fingersOf(activity)} labels={labelsOf(activity,api)} cue={[]} found={found} marks={activity.marks} expected={misses>=HINT_AFTER&&found.length<need?remaining:[]}/>
    </>;
}

function QuizRunner({lesson,activity,api,onDone}:RunnerProps<QuizActivity>) {
    const range=rangeOf(lesson,activity),[round,setRound]=useState(0),[misses,setMisses]=useState(0),[flash,setFlash]=useState<number[]>([]);
    const [feedback,setFeedback]=useState<Feedback>({tone:'idle',text:'Nhìn kỹ rồi chạm nhé.'});
    const roundRef=useRef(0),busy=useRef(false),missRef=useRef(0),hinted=useRef(false),timers=useTimers();
    const ask=(r:number)=>api.say(`Tìm nốt ${NOTE_NAMES[activity.rounds[r]]}.`);
    useEffect(()=>{api.say(activity.say,()=>ask(0));return()=>api.hush();},[]);
    useListener(api,{
        press(midi){
            if(busy.current)return;
            const wanted=activity.rounds[roundRef.current];
            if(midi%12===wanted){
                busy.current=true;setFlash([midi]);missRef.current=0;setMisses(0);
                const last=roundRef.current+1>=activity.rounds.length;
                setFeedback({tone:'good',text:last?`${praise(midi)} Em tìm đúng hết rồi!`:`${praise(midi)} Đó là ${NOTE_NAMES[wanted]}.`});
                timers.later(last?CELEBRATE_MS:750,()=>{setFlash([]);if(last){onDone(hinted.current);return;}roundRef.current++;setRound(roundRef.current);busy.current=false;ask(roundRef.current);});
            }else{missRef.current++;setMisses(missRef.current);if(missRef.current>=HINT_AFTER)hinted.current=true;setFeedback({tone:'try',text:`Đó là ${noteName(midi)}. Mình tìm ${NOTE_NAMES[wanted]} nhé.${missRef.current>=HINT_AFTER?' Phím sáng sẽ giúp em.':''}`});}
        },
        release(){},interrupt(){},
    });
    const wanted=activity.rounds[round];
    return <>
        <section className="pn-stage-panel">
            <Instruction activity={activity} api={api}/>
            <div className="pn-quiz-card"><small>Câu đố {round+1}/{activity.rounds.length}</small><strong>Tìm nốt <em>{NOTE_NAMES[wanted]}</em></strong><button className="pn-icon pn-icon-lg" aria-label="Nghe lại tên nốt" onClick={()=>ask(round)}><Volume2 size={22}/></button></div>
            <FeedbackLine feedback={feedback}/>
        </section>
        <StagePiano api={api} range={range} fingers={fingersOf(activity)} labels={labelsOf(activity,api)} cue={[]} found={flash} expected={misses>=HINT_AFTER&&!flash.length?keysOfClass(range,wanted):[]}/>
    </>;
}

function EarRunner({lesson,activity,api,onDone}:RunnerProps<EarActivity>) {
    const [round,setRound]=useState(0),[phase,setPhase]=useState<'listen'|'answer'|'right'>('listen'),[reveal,setReveal]=useState<number[]>([]);
    const [feedback,setFeedback]=useState<Feedback>({tone:'listen',text:'Lắng nghe nhé…'}),misses=useRef(0),timers=useTimers();
    async function play(r:number){
        api.stopSound();setPhase('listen');setReveal([]);
        if(!await api.ensureAudio()||!api.audio?.audible){setPhase('answer');return;}
        if(!timers.alive.current)return;
        const [a,b]=activity.rounds[r];setFeedback({tone:'listen',text:'Tiếng thứ nhất… tiếng thứ hai…'});
        api.audio.schedule([{midi:a,at:0,beats:1},{midi:b,at:1.4,beats:1.2}],2.6,LESSON_BPM,1,()=>{},()=>{setPhase('answer');setFeedback({tone:'idle',text:'Tiếng thứ hai đi lên cao hay xuống thấp?'});});
    }
    useEffect(()=>{api.say(activity.say,()=>void play(0));return()=>api.hush();},[]);
    useListener(api,{press(){},release(){},interrupt(){timers.clear();setPhase(p=>p==='listen'?'answer':p);}});
    function answer(choice:'up'|'down'){
        const pair=activity.rounds[round],right=earAnswer(pair);
        if(choice!==right){misses.current++;setFeedback({tone:'try',text:'Chưa đúng rồi. Mình nghe lại thật kỹ nhé.'});timers.later(900,()=>void play(round));return;}
        setPhase('right');setReveal(pair);
        const last=round+1>=activity.rounds.length;
        setFeedback({tone:'good',text:right==='up'?`${praise(round)} Tiếng thứ hai cao hơn — phím của nó ở bên phải.`:`${praise(round)} Tiếng thứ hai thấp hơn — phím của nó ở bên trái.`});
        timers.later(last?CELEBRATE_MS+400:1600,()=>{if(last){onDone(misses.current>0);return;}setRound(round+1);void play(round+1);});
    }
    return <>
        <section className="pn-stage-panel">
            <Instruction activity={activity} api={api}/>
            <div className="pn-ear-card">
                <small>Lượt {round+1}/{activity.rounds.length}</small>
                <div className="pn-ear-buttons">
                    <button className="pn-ear up" disabled={phase!=='answer'||api.locked} onClick={()=>answer('up')}><ArrowUp size={30}/>Lên cao</button>
                    <button className="pn-ear down" disabled={phase!=='answer'||api.locked} onClick={()=>answer('down')}><ArrowDown size={30}/>Xuống thấp</button>
                    <button className="pn-tool" disabled={phase==='right'||api.locked} onClick={()=>void play(round)}><Headphones size={19}/>Nghe lại</button>
                </div>
            </div>
            <FeedbackLine feedback={feedback}/>
        </section>
        <StagePiano api={api} range={rangeOf(lesson,activity)} labels={labelsOf(activity,api)} cue={[]} expected={[]} marks={reveal.slice(0,1)} found={reveal.slice(1)} disabled={phase==='listen'}/>
    </>;
}

function Runner(props:RunnerProps<Activity>) {
    const a=props.activity;
    if(a.type==='follow')return <FollowRunner {...props} activity={a}/>;
    if(a.type==='find')return <FindRunner {...props} activity={a}/>;
    if(a.type==='quiz')return <QuizRunner {...props} activity={a}/>;
    return <EarRunner {...props} activity={a}/>;
}
/** One lesson as a short chain of activities that run on by themselves. */
export function LessonPlayer({lesson,number,api,next,onNext,onList}:{lesson:Lesson;number:number;api:StageApi;next?:Lesson;onNext:()=>void;onList:()=>void}) {
    const total=lesson.activities.length,record=api.progress.records[lesson.id];
    const [index,setIndex]=useState(()=>record&&!record.completed&&record.total===total?Math.max(0,Array.from({length:total},(_,i)=>i).find(i=>!record.phrases.includes(i))??0):0);
    const [finished,setFinished]=useState(false),[round,setRound]=useState(0);
    const done:Done=guided=>{
        api.persist({type:'practice',id:lesson.id,phrase:index,total,guided});
        if(index+1<total){setIndex(index+1);return;}
        setFinished(true);api.say(`Hoàn thành bài ${number}! Giỏi lắm!`);
    };
    const restart=()=>{api.stopSound();setFinished(false);setIndex(0);setRound(r=>r+1);};
    return <>
        <div className="pn-activity-dots" role="group" aria-label="Các hoạt động của bài">
            {lesson.activities.map((a,i)=><span key={i} className={`${finished||i<index?'done':''} ${!finished&&i===index?'current':''}`} title={a.say}>{finished||i<index?'✓':i+1}</span>)}
            <small>{finished?'Hoàn thành!':`Hoạt động ${index+1}/${total}`}</small>
        </div>
        {finished?<>
            <section className="pn-stage-panel"><div className="pn-finish-card">
                <span className="pn-finish-burst" aria-hidden="true">🌟</span>
                <div><h2>Hoàn thành Bài {number}: {lesson.title.replace(/!$/,'')}!</h2><p>{lesson.tip}</p></div>
                <div className="pn-finish-actions">
                    {next?<button className="pn-primary" onClick={onNext}>Bài tiếp: {next.title}<ArrowRight size={18}/></button>:<button className="pn-primary" onClick={onList}>Về danh sách bài<ArrowRight size={18}/></button>}
                    <button className="pn-secondary" onClick={restart}><RotateCcw size={18}/>Học lại</button>
                    {next&&<button className="pn-secondary" onClick={onList}><BookOpen size={18}/>Danh sách bài</button>}
                </div>
            </div></section>
            <StagePiano api={api} range={lesson.range} cue={[]} expected={[]}/>
        </>:<Runner key={`${index}:${round}`} lesson={lesson} activity={lesson.activities[index]} api={api} onDone={done}/>}
    </>;
}
