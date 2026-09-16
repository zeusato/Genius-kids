import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, CircleHelp, Headphones, Merge, Pause, Play, RefreshCw, Sparkles, Star, Volume2 } from 'lucide-react';
import { useStudent, useStudentActions } from '../../../contexts/StudentContext';
import { CountingVoice } from './audio';
import { ACTIVITIES, COPY, EN, NUMBERS, VI, answerSession, comparePrompt, makeSession, mastered, nextRound, readProgress, type Activity, type Session } from './model';
import type { PendingSession } from './persistence';
import { CompareRule, CompareVisual, Demo, Toy, World } from './visuals';
import { NumberTracing } from './NumberTracing';
import { NumberStory } from './NumberStory';
import { storyFor, STORY_FINISH_GUIDE } from './learnStories';
import { advanceStory, beginTracing, isTracing, storyComplete } from './learnStoryModel';
import './counting.css';

export function CountingAdventure({activity,onBack}:{activity:Activity;onBack:()=>void}) {
    const {currentStudent}=useStudent(), {saveCounting}=useStudentActions();
    const owner=currentStudent!.id, progress=readProgress(currentStudent?.counting,owner);
    const [session,setSession]=useState<PendingSession|null>(null), live=useRef<PendingSession|null>(null);
    const [fixed,setFixed]=useState(activity==='learn'?1:0), [review,setReview]=useState(false);
    const [saved,setSaved]=useState(true), [earned,setEarned]=useState(0), [paused,setPaused]=useState(false), [notice,setNotice]=useState(''), [heard,setHeard]=useState(false), [busy,setBusy]=useState(false), [tested,setTested]=useState(false);
    const voice=useRef<CountingVoice|null>(null); if(!voice.current)voice.current=new CountingVoice();
    const audioRun=useRef(0), mounted=useRef(true), stamp=useRef(performance.now()), heading=useRef<HTMLHeadingElement>(null);
    const clockActive=useRef(false);
    const s=session, round=s?.rounds[s.index], done=s?.phase==='complete';
    const persist=(next:PendingSession)=>{
        const seconds=next.seconds+(clockActive.current?Math.max(0,performance.now()-stamp.current)/1000:0);stamp.current=performance.now();
        if(next.phase==='complete')clockActive.current=false;
        const result=saveCounting(owner,{...next,seconds});live.current=result.session;setSession(result.session);setSaved(result.ok);setEarned(result.earned);return result.ok;
    };
    const cancel=()=>{audioRun.current++;voice.current!.cancel();setBusy(false);};
    const speak=async(text:string,number?:number,lang:'vi-VN'|'en-US'='vi-VN')=>{
        const token=++audioRun.current;setBusy(true);
        const result=number!==undefined?await voice.current!.number(number):await voice.current!.play(text,lang);
        if(!mounted.current || token!==audioRun.current)return 'cancelled';
        setBusy(false);if(result==='error')setNotice('Chưa nghe được. Chạm loa để thử lại; bé vẫn có thể xem hướng dẫn bằng hình.');return result;
    };
    const prompt=()=>{
        const current=live.current;if(!current)return COPY[activity].guide;
        if(current.activity==='compare')return comparePrompt(current.rounds[current.index]);
        if(current.activity==='learn'){
            if(isTracing(current))return 'Bắt đầu ở chấm xanh. Giữ tay và tô theo đường nét nhé.';
            const story=storyFor(current.rounds[current.index].value);
            return storyComplete(current)?`${story.complete} ${STORY_FINISH_GUIDE}`:story.guide;
        }
        return COPY[current.activity].guide;
    };
    const hear=async()=>{
        setNotice('');const current=live.current;
        if(current?.activity==='pick'&&current.phase==='playing'){
            setHeard(false);const key=current.rounds[current.index].id;
            const result=await speak('',current.rounds[current.index].value);
            if(live.current?.rounds[live.current.index].id===key && result==='ended')setHeard(true);
        }else await speak(prompt());
    };
    useEffect(()=>{mounted.current=true;const timer=setTimeout(()=>void speak(COPY[activity].guide),250);return()=>{mounted.current=false;clearTimeout(timer);audioRun.current++;voice.current!.cancel();};},[]);
    useEffect(()=>{
        const hide=()=>{if(document.hidden){if(live.current && live.current.phase!=='complete')persist(live.current);clockActive.current=false;cancel();setHeard(false);setPaused(true);}};
        document.addEventListener('visibilitychange',hide);return()=>document.removeEventListener('visibilitychange',hide);
    },[]);
    useEffect(()=>{
        if(!s || paused || !saved || s.phase==='complete')return;
        let active=true;const key=s.rounds[s.index].id;let timer:ReturnType<typeof setTimeout>;
        heading.current?.focus({preventScroll:true});
        if(s.phase==='playing')heading.current?.scrollIntoView({block:'nearest',behavior:'instant'});
        if(s.phase==='playing') {setHeard(false);timer=setTimeout(()=>void hear(),250);}
        else {
            const started=performance.now();
            const feedback=s.activity==='compare'?speak('Giỏi lắm! Bé đã làm được rồi.'):speak('',s.rounds[s.index].value);
            void feedback.then(result=>{
                if(!active||result==='cancelled')return;
                timer=setTimeout(()=>{if(active&&live.current?.rounds[live.current.index].id===key)persist(nextRound(live.current));},Math.max(0,750-(performance.now()-started)));
            });
        }
        return()=>{active=false;clearTimeout(timer);audioRun.current++;voice.current!.cancel();setBusy(false);};
    },[s?.id,s?.index,s?.phase,s?.learningStep,paused,saved]);
    const begin=(resume?:Session)=>{
        cancel();setNotice('');setHeard(false);setPaused(false);stamp.current=performance.now();clockActive.current=true;
        // New trips always use the full 1–10 curriculum. Keep saved trips intact.
        const next=resume||makeSession(owner,activity,3,Date.now(),progress,fixed,review);
        persist(activity==='learn'?{...next,learningStep:isTracing(next)?'trace':'count'}:next);
    };
    const act=(next:Session)=>{if(!saved||paused||live.current?.phase!=='playing')return;persist(next);};
    const answer=(n:number)=>{
        const current=live.current;if(!current||!saved||paused)return;
        const r=current.rounds[current.index];
        if((activity==='count' || activity==='learn') && current.collected.length!==r.value)return;
        if(activity==='add' && !current.merged)return;
        const next=answerSession(current,n,heard);if(next===current)return;
        cancel();setNotice(n===r.answer?'Giỏi lắm! Bé đã làm được rồi.':'Thử lại nhé. Bé có thể nghe lại hoặc nhờ Thỏ giúp.');act(next);
        if(n!==r.answer)void speak('Thử lại nhé. Bé có thể nghe lại hoặc nhờ Thỏ giúp.');
    };
    const collect=(i:number)=>{
        const current=live.current;if(!current||current.collected.includes(i)||current.phase!=='playing'||paused||!saved)return;
        const next={...current,collected:[...current.collected,i]};act(next);
        void speak('',next.collected.length);
    };
    const storyAction=(index:number,paint?:number)=>{
        const current=live.current;if(!current||!saved||paused)return;
        const next=advanceStory(current,index,paint);if(next===current)return;
        if(!persist(next)||next.collected.length===current.collected.length)return;
        void speak('',next.collected.length).then(result=>{
            if(result==='ended'&&storyComplete(next)&&live.current?.id===next.id&&!isTracing(live.current)&&clockActive.current){
                const story=storyFor(next.rounds[next.index].value);void speak(`${story.complete} ${STORY_FINISH_GUIDE}`);
            }
        });
    };
    const toTracing=()=>{
        const current=live.current;if(!current||!saved||paused)return;
        const next=beginTracing(current);if(next===current)return;
        cancel();setNotice('');persist(next);
    };
    const help=()=>{const current=live.current;if(!current)return;act({...current,assisted:true});setNotice('Thỏ đã chỉ chỗ cần chọn. Cùng làm lại thật chậm nhé.');void speak('Thỏ đã chỉ chỗ cần chọn. Cùng làm lại thật chậm nhé.');};
    const photo=round?`${import.meta.env.BASE_URL}preschool/garden/${storyFor(round.value).art}.webp`:'';
    const draft=progress.drafts[activity];
    if(!s)return <section className={'nc-intro nc-'+activity}>
        <div className="nc-intro-picture"><World activity={activity}/><div className="nc-intro-number">{activity==='add'?'2 + 1':activity==='compare'?'2 = 2':'1 2 3'}</div><Demo activity={activity}/><span className="nc-picture-label">CHƠI TỪNG CHÚT • HIỂU TỪNG SỐ</span></div>
        <div className="nc-intro-content"><span className="nc-eyebrow">ĐẢO SỐ / {COPY[activity].subtitle}</span><h2>{COPY[activity].title}</h2><p>{COPY[activity].guide}</p><button className="nc-listen" onClick={()=>void hear()}><Volume2 size={20}/>Nghe cách chơi</button>
            {draft&&<div className="nc-resume"><span>Chuyến đi đang dở · {draft.index+1}/{draft.rounds.length}</span><button className="nc-primary" onClick={()=>begin(draft)}><Play size={18}/>Chơi tiếp</button></div>}
            <div className="nc-number-map" aria-label="Chọn số để khám phá hoặc luyện riêng">{NUMBERS.map(n=><button key={n} aria-pressed={fixed===n} className={progress.stickers.includes(n)&&activity==='learn'?'sticker':''} onClick={()=>setFixed(n)}><b>{n}</b>{activity==='learn'&&progress.stickers.includes(n)?<Star size={12}/>:mastered(progress.skills[activity]?.[n])?<Check size={12}/>:<span/>}</button>)}</div>
            {activity!=='learn'&&<div className="nc-pool"><button aria-pressed={fixed===0&&!review} onClick={()=>{setFixed(0);setReview(false);}}>Cả dãy số</button><button aria-pressed={fixed===0&&review} onClick={()=>{setFixed(0);setReview(true);}}>Ôn số cần luyện</button></div>}
            {activity==='pick'&&<button className={'nc-listen '+(tested?'tested':'')} onClick={async()=>{setNotice('');if(await speak('',2)==='ended')setTested(true);}}><Headphones size={20}/>{tested?'Đã nghe thử được':'Nghe thử trước khi chơi'}{tested&&<Check size={16}/>}</button>}
            <button className="nc-primary nc-start" disabled={activity==='pick'&&!tested} onClick={()=>begin()}>{draft?'Bắt đầu chuyến mới':'Chơi nào'}<ArrowRight size={20}/></button>
            {notice&&<p className="nc-notice" role="status">{notice}</p>}<small className="nc-intro-progress">{NUMBERS.filter(n=>mastered(progress.skills[activity]?.[n])).length}/10 số đã tự làm vững · {activity==='learn'?`${progress.stickers.length}/10 sticker`:'Nghe lại luôn miễn phí'}</small>
        </div></section>;
    return <section className={'nc-game nc-'+activity} aria-label={COPY[activity].title}>
        <header className="nc-game-header"><div><span className="nc-eyebrow">{COPY[activity].subtitle}</span><h2 ref={heading} tabIndex={-1}>{done?'Chuyến đi thật tuyệt!':activity==='learn'?storyFor(round!.value).title:COPY[activity].title}</h2></div><div className="nc-progress" aria-label={`Đã hoàn thành ${s.outcomes.length} trên ${s.rounds.length}`}><span>{s.outcomes.length}/{s.rounds.length}</span>{s.rounds.map((r,i)=><i key={r.id} className={i<s.outcomes.length?'complete':''}/>)}</div></header>
        {!saved&&<div className="nc-save-error" role="alert"><b>Chưa lưu được. Kết quả của bé vẫn đang ở đây.</b><button onClick={()=>{stamp.current=performance.now();persist(live.current!);}}><RefreshCw size={18}/>Thử lưu lại</button></div>}
        {paused&&!done?<div className="nc-paused"><Pause size={50}/><h3>Thỏ chờ bé ở đây</h3><button className="nc-primary" onClick={()=>{stamp.current=performance.now();clockActive.current=true;setPaused(false);}}>Tiếp tục<Play size={18}/></button></div>:done?<div className="nc-finish"><div className="nc-award"><span>{activity==='learn'?round!.value:<Check size={70}/>}</span><Sparkles size={35}/></div><h3>{activity==='learn'?'Một sticker mới trong sổ số!':'Bé đã hoàn thành chuyến đi!'}</h3><div className="nc-stars" aria-label={`${earned} sao`}>{[1,2,3].map(n=><Star key={n} fill={saved&&n<=earned?'currentColor':'none'}/>)}</div><p>{saved?'Tiến độ đã được lưu. Hẹn bé ở chuyến khám phá tiếp theo!':'Chạm Thử lưu lại để giữ kết quả này nhé.'}</p><div className="nc-finish-actions"><button className="nc-primary" disabled={!saved} onClick={()=>{cancel();setSession(null);live.current=null;setFixed(activity==='learn'?round!.value%10+1:0);setTested(false);}}>Chọn chuyến tiếp<ArrowRight size={18}/></button><button disabled={!saved} onClick={onBack}>Về Số đếm</button></div></div>:<>
            <div className="nc-guide"><span className={'nc-guide-face '+(s.phase==='feedback'?'happy':'')} aria-hidden="true"><i/><i/><b/></span><div><strong>{s.phase==='feedback'?'Bé làm được rồi!':activity==='compare'?comparePrompt(round!):activity==='learn'?isTracing(s)?'Giữ tay và tô theo chấm xanh':storyComplete(s)?'Bé đếm xong rồi! Ngắm lại thành quả nhé.':storyFor(round!.value).guide:activity==='add'?s.merged?'Cùng đếm tất cả bánh':'Gộp hai khay bánh lại nhé':activity==='count'?'Chạm từng vật để bỏ vào giỏ':heard?'Chọn thuyền có số vừa nghe':'Nghe xong rồi chọn thuyền nhé'}</strong><span role="status">{notice||'Cứ thong thả. Thỏ luôn ở đây giúp bé.'}</span></div><button disabled={s.phase==='feedback'} className="nc-guide-voice" onClick={()=>void hear()} aria-label="Nghe lại hướng dẫn hoặc số"><Volume2 size={22}/>{busy&&<i/>}</button></div>
            <div className="nc-playfield" inert={!saved||s.phase==='feedback'?true:undefined}>
                {activity==='compare'&&<CompareRule round={round!}/>}
                {activity==='learn'?(isTracing(s)?<div className="nc-discovery"><div className="nc-discovery-art" style={{backgroundImage:`linear-gradient(0deg,#284b39aa,transparent 65%),url("${photo}")`}}><span className="nc-number-plaque">{round!.value}<small>{VI[round!.value]} · {EN[round!.value]}</small></span><button className="nc-english" onClick={()=>void speak(EN[round!.value],undefined,'en-US')}><Volume2 size={17}/>Nghe tiếng Anh</button></div><div className="nc-discovery-task"><NumberTracing value={round!.value} initial={s.trace} onSave={trace=>act({...live.current!,trace})} onFinish={assisted=>{const current=live.current!;if(!isTracing(current)||!storyComplete(current))return;const next={...current,assisted:current.assisted||assisted};persist(answerSession(next,round!.answer));}}/></div></div>:<NumberStory session={s} onAction={storyAction} onTrace={toTracing}/>):
                <div className="nc-scene"><World activity={activity} variant={s.index}/>
                    {activity==='count'?<><div className="nc-harvest-items">{Array.from({length:round!.value},(_,i)=><button key={i} aria-label={`Thu hoạch vật ${i+1}`} className={s.collected.includes(i)?'picked':''} disabled={s.collected.includes(i)} onClick={()=>collect(i)}><Toy name={round!.object}/>{s.collected.includes(i)&&<Check size={20}/>}</button>)}</div><div className="nc-basket"><div>{s.collected.map(i=><Toy key={i} name={round!.object}/>)}</div><span/><strong>{s.collected.length?`${s.collected.length} vật trong giỏ`:'Giỏ đang chờ bé'}</strong></div></>:
                    activity==='pick'?<div className="nc-harbor"><Headphones className={busy?'nc-listening':''} size={55}/><div className="nc-boats">{round!.options.map(n=><button key={n} aria-label={`Thuyền số ${n}`} disabled={!heard||busy} className={s.assisted&&n===round!.answer?'helped':''} onClick={()=>answer(n)}><span className="nc-sail">{n}</span><span className="nc-hull"/></button>)}</div><p>{heard?'Chạm thuyền để ra khơi':'Chạm loa, nghe xong rồi chọn nhé'}</p></div>:
                    activity==='add'?<div className={'nc-bakery '+(s.merged?'merged':'')}><div className="nc-trays">{[round!.a,round!.b].map((n,side)=><div key={side} className="nc-tray"><b>{n}</b><div>{Array.from({length:n},(_,i)=><Toy key={i} name="cake"/>)}{n===0&&<span>Khay trống</span>}</div></div>)}</div>{!s.merged?<button className="nc-merge nc-primary" onClick={()=>{act({...live.current!,merged:true});void speak('Hai khay đã gộp lại. Chạm từng chiếc bánh để đếm nhé.');}}><Merge size={25}/>Gộp hai khay</button>:<><div className="nc-joined-cakes">{Array.from({length:round!.value},(_,i)=><button key={i} aria-label={`Đếm bánh ${i+1}`} disabled={s.collected.includes(i)} onClick={()=>collect(i)}><Toy name="cake"/>{s.collected.includes(i)&&<span>{s.collected.indexOf(i)+1}</span>}</button>)}</div><div className="nc-equation">{round!.a}<b>+</b>{round!.b}<b>=</b><span>?</span></div></>}</div>:
                    <div className="nc-comparison"><div className="nc-compare-sides">{[round!.a,round!.b].map((n,side)=><button className={s.assisted&&round!.answer===side?'helped':''} aria-label={side===0?'Chọn bên trái':'Chọn bên phải'} key={side} onClick={()=>answer(side)}><CompareVisual round={round!} value={n}/><span>{side===0?'Bên trái':'Bên phải'}</span></button>)}</div>{s.level===3&&<button className={'nc-equal '+(s.assisted&&round!.answer===2?'helped':'')} onClick={()=>answer(2)}><b>=</b>Bằng nhau</button>}</div>}
                </div>}
                {(activity==='count'||activity==='add')&&<div className="nc-number-answers" aria-label="Chọn số lượng">{round!.options.map(n=><button key={n} disabled={activity==='count'?s.collected.length!==round!.value:!s.merged} className={s.assisted&&n===round!.answer?'helped':''} aria-label={`Chọn số ${n}`} onClick={()=>answer(n)}>{n}</button>)}</div>}
            </div>
            <footer className="nc-game-footer"><span><Check size={15}/>{saved?'Đã giữ chỗ cho bé':'Đang chờ lưu'}</span>{s.mistakes>=2&&!s.assisted&&<button className="nc-help" onClick={help}><CircleHelp size={19}/>Thỏ giúp bé</button>}<button onClick={()=>{persist(live.current!);clockActive.current=false;cancel();setPaused(true);}}><Pause size={17}/>Nghỉ một chút</button></footer>
        </>}
    </section>;
}

export function CountingProgressStrip(){
    const {currentStudent}=useStudent();const p=readProgress(currentStudent?.counting);
    return <div className="nc-hub-progress"><span><Sparkles size={19}/><b>Sổ khám phá của bé</b></span><div>{ACTIVITIES.map(a=><span key={a}>{a==='learn'?'Sticker':{count:'Đếm',pick:'Nghe',add:'Cộng',compare:'So sánh'}[a]}<b>{a==='learn'?p.stickers.length:NUMBERS.filter(n=>mastered(p.skills[a]?.[n])).length}/10</b></span>)}</div></div>;
}
