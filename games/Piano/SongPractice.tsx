import React, { useEffect, useRef, useState } from 'react';
import { BookOpen, Headphones, ListMusic, Repeat, RotateCcw, Square } from 'lucide-react';
import { eventsFromSteps, fitRange, stepAtBeat, stepStarts } from './engine';
import { judgePress } from './lessonEngine';
import { noteName, type Song } from './model';
import { phrasesOf } from './content/songs';
import { FeedbackLine, NoteChip, Segmented, StagePiano, praise, stepText, useListener, type Feedback, type StageApi } from './stage';

/** Wrong notes on one target before its key lights up even with hints turned off. */
const LIGHT_AFTER = 3;
const START:Feedback = {tone:'idle',text:'Chạm phím đang sáng để bắt đầu. Muốn nghe trước thì bấm Nghe câu này nhé.'};
/**
 * Wait-for-the-right-note practice across the whole song. Finishing a phrase saves it and moves
 * straight on to the next one, so the melody keeps flowing; "Lặp câu" keeps drilling one phrase.
 */
export function SongPractice({song,api,onLibrary}:{song:Song;api:StageApi;onLibrary:()=>void}) {
    const phrases=phrasesOf(song),total=phrases.length,record=api.progress.records[song.id];
    const saved=record?.total===total?record.phrases:[];
    const [phrase,setPhraseState]=useState(()=>record&&!record.completed&&record.total===total?Math.max(0,Array.from({length:total},(_,i)=>i).find(i=>!saved.includes(i))??0):0);
    const [step,setStepState]=useState(0),[demo,setDemoState]=useState<null|'phrase'|'song'>(null),[finished,setFinished]=useState(false);
    const [speed,setSpeed]=useState(1),[repeat,setRepeat]=useState(false),[cue,setCue]=useState<number[]>([]),[demoAt,setDemoAt]=useState<[number,number]|null>(null);
    const [feedback,setFeedback]=useState<Feedback>(START),[misses,setMisses]=useState(0),[cheer,setCheer]=useState(0);
    const phraseRef=useRef(phrase),stepRef=useRef(0),demoRef=useRef(demo),missRef=useRef(0),guided=useRef(api.prefs.guidance),road=useRef<HTMLDivElement>(null);
    const setPhrase=(n:number)=>{phraseRef.current=n;setPhraseState(n);};
    const setStep=(n:number)=>{stepRef.current=n;setStepState(n);};
    const setDemo=(d:typeof demo)=>{demoRef.current=d;setDemoState(d);};
    const resetMisses=()=>{missRef.current=0;setMisses(0);};
    useEffect(()=>{if(api.prefs.guidance)guided.current=true;},[api.prefs.guidance]);
    const current=phrases[phrase]||[],target=finished?undefined:current[step];
    const range=fitRange(phrases.flat().flatMap(s=>s.pitches));
    function advance(){
        const p=phraseRef.current,next=stepRef.current+1;resetMisses();
        if(next<phrases[p].length){setStep(next);setFeedback(f=>f.tone==='try'?{tone:'idle',text:'Đúng rồi, đàn tiếp nhé!'}:f);return;}
        api.persist({type:'practice',id:song.id,phrase:p,total,guided:guided.current});
        guided.current=api.prefs.guidance;setCheer(c=>c+1);
        if(repeat){setStep(0);setFeedback({tone:'good',text:`${praise(p)} Câu ${p+1} xong. Mình đàn lại câu này nhé.`});return;}
        if(p+1<total){setPhrase(p+1);setStep(0);setFeedback({tone:'good',text:`${praise(p)} Đàn tiếp câu ${p+2} nào!`});return;}
        setStep(phrases[p].length);setFinished(true);setFeedback({tone:'good',text:'Em đã đàn trọn cả bài!'});
    }
    useListener(api,{
        press(midi,held,recovered){
            if(demoRef.current||finished)return;
            const goal=phrases[phraseRef.current]?.[stepRef.current];if(!goal)return;
            const result=judgePress(goal,held,midi,recovered);
            if(result==='advance'||result==='hold')advance();
            else if(result==='needs-real-key')setFeedback({tone:'try',text:'Chuyển bộ gõ sang E để đàn hợp âm nhé.'});
            else if(result==='wrong'){
                missRef.current++;setMisses(missRef.current);if(missRef.current>=LIGHT_AFTER)guided.current=true;
                const lit=api.prefs.guidance||missRef.current>=LIGHT_AFTER;
                setFeedback({tone:'try',text:lit?`Đó là ${noteName(midi)}. Thử phím ${stepText(goal,api.prefs)} đang sáng nhé.`:'Lắng nghe và thử lại nhé.'});
            }
        },
        release(){},
        interrupt(){if(demoRef.current){setDemo(null);setCue([]);setDemoAt(null);setFeedback({tone:'idle',text:'Mình tạm dừng nghe. Chạm phím đang sáng để đàn tiếp nhé.'});}},
    });
    async function listen(scope:'phrase'|'song'){
        api.stopSound();setCue([]);
        if(!await api.ensureAudio()||!api.audio?.audible)return;
        const first=scope==='song'?0:phraseRef.current,steps=scope==='song'?phrases.flat():phrases[first];
        const offsets=phrases.map((_,i)=>phrases.slice(0,i).reduce((n,p)=>n+p.length,0)),starts=stepStarts(steps);
        const locate=(index:number):[number,number]=>{if(scope==='phrase')return [first,index];let p=0;while(p+1<total&&offsets[p+1]<=index)p++;return [p,index-offsets[p]];};
        const {events,beats}=eventsFromSteps(steps);
        guided.current=true;setDemo(scope);resetMisses();
        setFeedback({tone:'listen',text:scope==='song'?'Lắng nghe cả bài nhé… Phím sáng xanh là nốt đang vang.':'Lắng nghe câu nhạc nhé…'});
        api.audio.schedule(events,beats,song.bpm,speed,(notes,beat)=>{setCue(notes);if(beat>=0&&notes.length)setDemoAt(locate(stepAtBeat(starts,beat)));},()=>{
            setDemo(null);setCue([]);setDemoAt(null);setStep(0);
            setFeedback({tone:'idle',text:'Đến lượt em! Chạm phím đang sáng nhé.'});
        });
    }
    function stopListening(){api.stopSound();setDemo(null);setCue([]);setDemoAt(null);setStep(0);setFeedback({tone:'idle',text:'Đến lượt em!'});}
    function jump(p:number){if(demoRef.current)stopListening();api.stopSound();setFinished(false);setPhrase(p);setStep(0);resetMisses();guided.current=api.prefs.guidance;setFeedback({tone:'idle',text:`Câu ${p+1}. Chạm phím đang sáng nhé.`});}
    // Keep the next notes in view: the current chip sits a third of the way in.
    useEffect(()=>{
        const container=road.current,chip=container?.querySelector<HTMLElement>('.pn-chip.demo, .pn-chip.current');if(!container||!chip)return;
        const left=chip.offsetLeft-container.offsetLeft-container.clientWidth*.32;
        container.scrollTo({left:Math.max(0,left),behavior:'smooth'});
    },[phrase,step,demoAt,finished]);
    const doneSet=new Set(saved),lights=!demo&&!finished&&(api.prefs.guidance||misses>=LIGHT_AFTER)?target?.pitches||[]:[];
    const busy=!!demo||api.locked;
    return <>
        <section className="pn-stage-panel pn-song-panel">
            <div className="pn-stage-row">
                <div className="pn-phrase-dots" role="group" aria-label="Các câu nhạc">
                    <span className="pn-phrase-count">Câu <b>{Math.min(phrase+1,total)}</b>/{total}</span>
                    {phrases.map((_,i)=><button key={i} aria-label={`Câu ${i+1}${doneSet.has(i)?', đã xong':''}`} aria-current={i===phrase?'step':undefined} disabled={api.locked} className={`${doneSet.has(i)?'done':''} ${i===phrase?'current':''}`} onClick={()=>jump(i)}>{doneSet.has(i)?'✓':i+1}</button>)}
                </div>
                <div className="pn-tools">
                    {demo?<button className="pn-tool primary" onClick={stopListening}><Square size={18}/>Dừng nghe</button>:<>
                        <button className="pn-tool" disabled={busy} onClick={()=>void listen('phrase')}><Headphones size={19}/>Nghe câu này</button>
                        <button className="pn-tool" disabled={busy} onClick={()=>void listen('song')}><ListMusic size={19}/>Cả bài</button>
                    </>}
                    <Segmented<number> label="Tốc độ nghe mẫu" value={speed} disabled={!!demo} onChange={setSpeed} options={[{value:.5,label:'🐢 Chậm'},{value:.75,label:'Vừa'},{value:1,label:'Nhanh'}]}/>
                    <button className={`pn-tool toggle ${repeat?'on':''}`} aria-pressed={repeat} onClick={()=>setRepeat(!repeat)}><Repeat size={18}/>Lặp câu</button>
                </div>
            </div>
            {finished&&!demo?<div className="pn-finish-card" key={cheer}>
                <span className="pn-finish-burst" aria-hidden="true">🎉</span>
                <div><h2>Hoàn thành “{song.title}”!</h2><p>{record?.independent?'⭐ Em đã tự đàn mọi câu mà không cần gợi ý.':'Lần sau thử tắt phím sáng trong Tùy chỉnh để tự đàn nhé.'}</p></div>
                <div className="pn-finish-actions"><button className="pn-primary" onClick={()=>jump(0)}><RotateCcw size={18}/>Đàn lại từ đầu</button><button className="pn-secondary" disabled={busy} onClick={()=>void listen('song')}><Headphones size={18}/>Nghe cả bài</button><button className="pn-secondary" onClick={onLibrary}><BookOpen size={18}/>Chọn bài khác</button></div>
            </div>:<div className="pn-road" ref={road} aria-label="Các nốt của bài nhạc">
                {phrases.map((p,pi)=><div key={pi} className={`pn-road-phrase ${pi===phrase?'current':''} ${pi<phrase?'past':''}`}>
                    <span className="pn-road-label">Câu {pi+1}{doneSet.has(pi)?' ✓':''}</span>
                    <div className="pn-road-notes">{p.map((s,si)=>{
                        const isDemo=!!demoAt&&demoAt[0]===pi&&demoAt[1]===si;
                        const state=isDemo?'demo':pi<phrase||(pi===phrase&&si<step)?'done':pi===phrase&&si===step&&!demo?'current':'todo';
                        return <NoteChip key={si} step={s} state={state} label={stepText(s,api.prefs,api.prefs.guidance||state==='done'||(state==='current'&&misses>=LIGHT_AFTER))}/>;
                    })}</div>
                </div>)}
            </div>}
            <FeedbackLine feedback={feedback}>{!finished&&<span key={cheer} className={cheer?'pn-cheer':''} aria-hidden="true">{cheer?'✦':''}</span>}</FeedbackLine>
        </section>
        <StagePiano api={api} range={range} cue={cue} expected={lights} disabled={!!demo}/>
    </>;
}
