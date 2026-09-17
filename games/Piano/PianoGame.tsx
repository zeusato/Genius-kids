import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight, Headphones, Music2, Play, RotateCcw, Search, Sparkles, Square, Volume2, VolumeX, X } from 'lucide-react';
import { useStudent, useStudentActions } from '../../src/contexts/StudentContext';
import { useMusicControls } from '../../src/contexts/MusicContext';
import { musicManager } from '../../services/musicManager';
import type { StudentProfile } from '../../types';
import { PianoAudio } from './audio';
import { PianoArt, PianoModeArt, HandArt } from './PianoArt';
import { Keyboard } from './Keyboard';
import { INSTRUMENTS, LEVEL_NAMES, noteName, type InstrumentId, type Preferences, type Song, type Step } from './model';
import { LESSONS } from './content/lessons';
import { SONGS } from './content/songs';
import { canAdvance, eventsFromSteps, phrasesFor, stepsFromNotes } from './engine';
import { readProgress, type PianoAction } from './progress';
import './piano.css';

type View='home'|'learn'|'songs'|'free'|'practice';
type Phase='ready'|'playing'|'holding'|'resting'|'demo'|'complete'|'paused';
const artEmoji:Record<string,string>={bakery:'🥐',bridge:'🌉',tea:'🫖',flower:'🌷',moon:'🌙',drum:'🥁',garden:'🌳',cat:'🐱',boat:'⛵',bell:'🔔',clock:'🕰️',bird:'🐦',sheep:'🐑',crown:'👑'};
export default function PianoPage(){
    const {currentStudent}=useStudent(),{savePiano}=useStudentActions(),controls=useMusicControls(),navigate=useNavigate();
    if(!currentStudent)return null;
    return <PianoRoom key={currentStudent.id} student={currentStudent} save={action=>savePiano(currentStudent.id,action)} soundEnabled={controls.soundEnabled} toggleSound={controls.toggleSound} onExit={()=>navigate('/mode')}/>;
}
export interface PianoRoomProps { student:StudentProfile; save:(action:PianoAction)=>{ok:boolean}; soundEnabled:boolean; toggleSound:()=>void; onExit:()=>void }
export function PianoRoom({student,save,soundEnabled,toggleSound,onExit}:PianoRoomProps){
    const progress=readProgress(student.piano);
    const [prefs,setPrefs]=useState<Preferences>(progress.preferences),[view,setView]=useState<View>('home');
    const [audio,setAudio]=useState<PianoAudio|null>(null),[busy,setBusy]=useState(false),[audioError,setAudioError]=useState('');
    const [active,setActive]=useState<number[]>([]),[cue,setCue]=useState<number[]>([]),[message,setMessage]=useState('');
    const [selection,setSelection]=useState<{kind:'lesson'|'song';id:string}|null>(null),[phrase,setPhrase]=useState(0),[step,setStepState]=useState(0),[phase,setPhaseState]=useState<Phase>('ready');
    const [speed,setSpeed]=useState(1),[loop,setLoop]=useState(false),[filter,setFilter]=useState('all'),[search,setSearch]=useState(''),[credits,setCredits]=useState(false);
    const [pending,setPending]=useState<PianoAction|null>(null),[leaveConfirm,setLeaveConfirm]=useState(false),[saveError,setSaveError]=useState('');
    const inputs=useRef(new Map<string,{voice:number;midi:number;at:number;recovered:boolean}>()),phaseRef=useRef<Phase>('ready'),stepRef=useRef(0),gapTimer=useRef<ReturnType<typeof setTimeout>|null>(null),task=useRef(0),mounted=useRef(true),guided=useRef(false);
    const noteStrip=useRef<HTMLDivElement>(null);
    const setPhase=(p:Phase)=>{phaseRef.current=p;setPhaseState(p);};
    const setStep=(n:number)=>{stepRef.current=n;setStepState(n);};
    const lesson=selection?.kind==='lesson'?LESSONS.find(l=>l.id===selection.id):undefined;
    const song=selection?.kind==='song'?SONGS.find(s=>s.id===selection.id):undefined;
    const allSteps:Step[]=lesson?.steps||(song?stepsFromNotes(song.notes):[]);
    const phrases=lesson?[lesson.steps]:phrasesFor(allSteps);
    const current=phrases[phrase]||[],expected=current[step];
    const bpm=song?.bpm||84;
    const latest=useRef({view,phase,phrase,selection,current,phrases,bpm,speed,prefs,save,soundEnabled,pending,loop});
    latest.current={view,phase,phrase,selection,current,phrases,bpm,speed,prefs,save,soundEnabled,pending,loop};
    function clearGap(){if(gapTimer.current!==null)clearTimeout(gapTimer.current);gapTimer.current=null;}
    function resetInput(){inputs.current.clear();setActive([]);audio?.stop();setCue([]);clearGap();}
    function interrupt(){
        inputs.current.clear();setActive([]);setCue([]);clearGap();
        if(latest.current.view==='practice'&&phaseRef.current!=='complete'){setPhase('paused');setStep(0);setMessage('Mình tạm nghỉ nhé. Chạm Chơi tiếp để bắt đầu lại câu này.');}
    }
    useEffect(()=>{
        mounted.current=true;const engine=new PianoAudio();setAudio(engine);engine.onInterrupt=interrupt;musicManager.playTrack(null);
        const suspend=()=>{engine.stop();interrupt();};
        const hidden=()=>{if(document.hidden)suspend();};
        window.addEventListener('blur',suspend);document.addEventListener('visibilitychange',hidden);
        navigator.mediaDevices?.addEventListener?.('devicechange',suspend);
        return()=>{mounted.current=false;task.current++;clearGap();engine.close();window.removeEventListener('blur',suspend);document.removeEventListener('visibilitychange',hidden);navigator.mediaDevices?.removeEventListener?.('devicechange',suspend);musicManager.resumeRouteMusic();};
    },[]);
    useEffect(()=>{audio?.setMuted(!soundEnabled);audio?.setVolume(prefs.volume);if(!soundEnabled||prefs.volume===0){resetInput();if(view==='practice'&&phaseRef.current!=='complete')setPhase('paused');}},[audio,soundEnabled,prefs.volume]);
    useEffect(()=>{if(credits){resetInput();if(view==='practice'&&phaseRef.current!=='complete')setPhase('paused');}},[credits]);
    useEffect(()=>{
        const container=noteStrip.current,chip=container?.children[step] as HTMLElement|undefined;
        if(container&&chip)container.scrollTo({left:Math.max(0,chip.offsetLeft-container.offsetLeft-container.clientWidth/2+chip.offsetWidth/2),behavior:'instant'});
    },[step,phrase,view]);
    useEffect(()=>{
        if(!pending)return;
        resetInput();if(view==='practice'&&phaseRef.current!=='complete')setPhase('paused');
        const warn=(e:BeforeUnloadEvent)=>{e.preventDefault();e.returnValue='';};
        window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);
    },[pending]);
    useEffect(()=>{
        if(!credits&&!leaveConfirm)return;
        const previous=document.activeElement as HTMLElement|null;
        const dialog=document.querySelector<HTMLElement>('.pn-app [role="dialog"]');
        const focusable=()=>Array.from(dialog?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input,select,[tabindex="0"]')||[]);
        focusable()[0]?.focus();
        const trap=(e:KeyboardEvent)=>{
            if(e.key==='Escape'){e.preventDefault();setCredits(false);setLeaveConfirm(false);}
            if(e.key==='Tab'){const items=focusable(),first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}
        };
        window.addEventListener('keydown',trap);return()=>{window.removeEventListener('keydown',trap);previous?.focus();};
    },[credits,leaveConfirm]);
    async function ensureAudio(instrument=prefs.instrument){
        if(!audio)return false;
        const token=++task.current;setBusy(true);setAudioError('');
        try {
            if(!await audio.unlock())throw new Error('Chạm Thử lại để bật âm thanh trên thiết bị này.');
            await audio.prepare(instrument);
            if(!mounted.current||token!==task.current)return false;
            audio.setInstrument(instrument);audio.setMuted(!latest.current.soundEnabled);audio.setVolume(latest.current.prefs.volume);
            return true;
        } catch(e){if(mounted.current&&token===task.current)setAudioError(e instanceof Error?e.message:'Chưa mở được âm thanh. Hãy thử lại.');return false;}
        finally{if(mounted.current&&token===task.current)setBusy(false);}
    }
    function persist(action:PianoAction){
        const r=save(action);if(!r.ok){setPending(action);setSaveError('Chưa lưu được trên máy. Em có thể thử lưu lại.');}else{setPending(null);setSaveError('');}return r.ok;
    }
    function updatePrefs(next:Preferences){setPrefs(next);if(next.guidance)guided.current=true;persist({type:'preferences',preferences:next});}
    async function changeInstrument(id:InstrumentId){
        if(busy||pending)return;resetInput();if(view==='practice'&&phase!=='complete'){setPhase('paused');setStep(0);}
        if(await ensureAudio(id))updatePrefs({...prefs,instrument:id});
    }
    async function beginPractice(){
        resetInput();setStep(0);setMessage('');guided.current=prefs.guidance;
        if(await ensureAudio()){setPhase(audio?.audible?'playing':'paused');}
    }
    async function openPractice(kind:'lesson'|'song',id:string){
        resetInput();setSelection({kind,id});setView('practice');setPhase('ready');setStep(0);setMessage('');
        const r=progress.records[id];setPhrase(r&&!r.completed?Math.min(r.total-1,Array.from({length:r.total},(_,i)=>i).find(i=>!r.phrases.includes(i))??0):0);
        await ensureAudio();
    }
    function finish(){
        setPhase('complete');setMessage('Em đã chơi trọn câu rồi!');
        if(selection)persist({type:'practice',id:selection.id,phrase,total:phrases.length,guided:guided.current});
    }
    function advance(){
        const state=latest.current,index=stepRef.current,target=state.current[index];
        if(!target)return;
        const next=()=>{if(index+1>=state.current.length){finish();}else{setStep(index+1);setPhase('playing');setMessage('');}};
        if(target.gapBeats){setPhase('resting');setMessage('Một khoảng nghỉ… thả tay và lắng nghe nhé.');gapTimer.current=setTimeout(()=>{gapTimer.current=null;next();},target.gapBeats*60/state.bpm/state.speed*1000);}
        else next();
    }
    function down(key:string,midi:number,recovered=false){
        if(!audio?.audible||busy||pending||inputs.current.has(key)||phaseRef.current==='demo'||credits||leaveConfirm)return;
        const voice=audio.noteOn(midi);if(voice===null)return;
        inputs.current.set(key,{voice,midi,at:performance.now(),recovered});const held=new Set([...inputs.current.values()].filter(n=>!n.recovered).map(n=>n.midi));setActive([...new Set([...inputs.current.values()].map(n=>n.midi))]);
        if(view!=='practice'||phaseRef.current!=='playing')return;
        const target=current[stepRef.current];if(!target)return;
        if(recovered){
            if(target.pitches.length===1&&!target.holdMs&&target.pitches[0]===midi)advance();
            else if(target.pitches.includes(midi))setMessage('Chuyển bộ gõ sang E để tập giữ phím và hợp âm nhé.');
            return;
        }
        if(canAdvance(target,held,midi)){
            if(target.holdMs){setPhase('holding');setMessage('Giữ phím một chút… rồi nhả tay nhé.');}
            else advance();
        }else if(!target.pitches.includes(midi))setMessage(prefs.guidance?`Thử ${target.pitches.map(n=>noteName(n)).join(' + ')} nhé.`:'Lắng nghe và thử lại nhé.');
    }
    function up(key:string){
        const input=inputs.current.get(key);if(!input)return;
        audio?.noteOff(input.voice);inputs.current.delete(key);setActive([...new Set([...inputs.current.values()].map(n=>n.midi))]);
        const target=current[stepRef.current];
        if(!input.recovered&&view==='practice'&&phaseRef.current==='holding'&&target?.pitches.includes(input.midi)){
            if(performance.now()-input.at>=(target.holdMs||0)){advance();}
            else{setPhase('playing');setMessage('Mình thử giữ nốt lâu hơn một chút nhé.');}
        }
    }
    async function demo(whole=false){
        resetInput();setPhase('ready');setStep(0);
        if(!await ensureAudio()||!audio?.audible)return;
        guided.current=true;setPhase('demo');setMessage(whole?'Lắng nghe cả bài nhé…':'Lắng nghe câu nhạc nhé…');
        const sequence=whole&&song?{events:song.notes,beats:song.totalBeats}:eventsFromSteps(whole?allSteps:current);
        const play=()=>audio.schedule(sequence.events,sequence.beats,bpm,speed,setCue,()=>{
            if(latest.current.loop&&latest.current.view==='practice'&&!document.hidden){play();return;}
            setPhase('ready');setMessage('Đến lượt em! Chạm Bắt đầu đàn nhé.');
        });play();
    }
    function back(){
        if(pending){setLeaveConfirm(true);return;}
        doBack();
    }
    function doBack(){
        task.current++;setBusy(false);resetInput();setPhase('ready');setMessage('');setLeaveConfirm(false);
        if(view==='home')onExit();else if(view==='practice')setView(selection?.kind==='lesson'?'learn':'songs');else setView('home');
    }
    function movePhrase(next:number){resetInput();setPhrase(next);setStep(0);setPhase('ready');setMessage('');}
    const finishedCount=Object.values(progress.records).filter(r=>r.completed).length;
    const currentInstrument=INSTRUMENTS.find(i=>i.id===prefs.instrument)!;
    const modeName=view==='learn'?'Làm quen với đàn':view==='songs'?'Tập theo bài nhạc':view==='free'?'Chơi tự do':view==='practice'?(lesson?'Làm quen với đàn':'Tập theo bài nhạc'):'Phòng nhạc trong vườn';
    const keyboardVisible=view==='free'||view==='practice';
    const filtered=SONGS.filter(s=>(filter==='all'||s.level===filter)&&(s.title+' '+s.originalTitle).toLocaleLowerCase('vi').includes(search.toLocaleLowerCase('vi')));
    return <div className="pn-app">
        <header className="pn-header"><div className="pn-header-left"><button className="pn-icon" onClick={back} aria-label={view==='home'?'Về sảnh khám phá':'Quay lại'}><ArrowLeft size={20}/></button><div className="pn-brand"><span className="pn-brand-mark"><Music2 size={23}/></span><div><strong>Piano Nhí</strong><small>{modeName}</small></div></div></div><div className="pn-header-right"><span className="pn-progress-pill"><Sparkles size={16}/>{finishedCount} <small>bài đã chơi</small></span><button className="pn-icon" aria-label={soundEnabled?'Tắt tiếng':'Bật tiếng'} onClick={toggleSound}>{soundEnabled?<Volume2 size={20}/>:<VolumeX size={20}/>}</button></div></header>
        <main className={`pn-main ${keyboardVisible?'pn-main-play':''}`}>
            {saveError&&<div className="pn-notice" role="alert">{saveError}<button onClick={()=>pending&&persist(pending)}>Thử lưu lại</button></div>}
            {view==='home'&&<>
                <section className="pn-hero"><div className="pn-hero-copy"><span className="pn-eyebrow"><i/> MỘT KHU VƯỜN ĐẦY ÂM THANH</span><h1>Chạm một phím.<br/><em>Nở một giai điệu.</em></h1><p>Chào {student.name}! Cùng bạn Cáo làm quen với đàn,<br className="pn-desktop"/> chơi một bài nhạc, hay tạo giai điệu của riêng mình.</p><div className="pn-hero-tags"><span>🎹 6 tiếng nhạc cụ</span><span>♫ {SONGS.length} bài nhạc nhỏ</span><span>🌱 Học theo nhịp của em</span></div></div><div className="pn-hero-picture"><PianoArt/><span className="pn-art-caption">THE LITTLE MUSIC GARDEN</span></div></section>
                <div className="pn-section-title"><h2>Hôm nay mình chơi gì?</h2><span>Cứ tò mò, cứ thử nhé.</span></div>
                <div className="pn-mode-grid">
                    {[{view:'learn' as const,n:'01',title:'Làm quen với đàn',text:'Gặp bảy nốt nhạc, tập những bước đầu tiên.',tag:'10 BÀI HỌC NHỎ',className:'sage'},{view:'songs' as const,n:'02',title:'Tập theo bài nhạc',text:'Nghe một chút, đàn từng câu. Em làm được mà!',tag:`${SONGS.length} GIAI ĐIỆU ĐANG CHỜ`,className:'peach'},{view:'free' as const,n:'03',title:'Chơi tự do',text:'Đổi tiếng đàn và để trí tưởng tượng bay xa.',tag:'SÁNG TẠO THEO CÁCH CỦA EM',className:'lavender'}].map(m=><button className={`pn-mode-card ${m.className}`} key={m.view} onClick={()=>{setView(m.view);if(m.view==='free'){setPhase('ready');void ensureAudio();}}}><div className="pn-mode-illustration"><PianoModeArt mode={m.view}/><b>{m.n}</b></div><div className="pn-mode-body"><small>{m.tag}</small><h3>{m.title}</h3><p>{m.text}</p><span className="pn-card-action">Khám phá ngay <ArrowRight size={17}/></span></div></button>)}
                </div><div className="pn-bottom-note"><span>✦ Mỗi nốt nhạc đều bắt đầu từ một lần thử.</span><button onClick={()=>setCredits(true)}>Nguồn nhạc & lời cảm ơn</button></div>
            </>}
            {view==='learn'&&<><div className="pn-page-heading"><span className="pn-eyebrow">TỪNG NỐT, TỪNG BƯỚC</span><h1>Làm quen với đàn<span>🌱</span></h1><p>Mười cuộc khám phá nhỏ. Chọn một bài và cùng bạn Cáo thử nhé.</p></div><div className="pn-lessons">{LESSONS.map((l,i)=><button key={l.id} className="pn-lesson-card" onClick={()=>void openPractice('lesson',l.id)}><span className="pn-lesson-icon">{l.icon}</span><div><small>BÀI {String(i+1).padStart(2,'0')}</small><h3>{l.title}</h3><p>{l.subtitle}</p></div><span className="pn-lesson-end">{progress.records[l.id]?.completed?<Check/>:<ArrowRight/>}</span></button>)}</div></>}
            {view==='songs'&&<><div className="pn-page-heading"><span className="pn-eyebrow">NHỮNG GIAI ĐIỆU ĐI CÙNG TUỔI THƠ</span><h1>Một bài nhạc cho em<span>♫</span></h1><p>{SONGS.length} bản nhạc cổ, chuyển soạn cho những bàn tay nhỏ. Nghe, thử, rồi chơi trọn bài.</p></div><div className="pn-library-toolbar"><div className="pn-filter" aria-label="Mức độ bài nhạc">{['all','easy','medium','hard'].map(f=><button key={f} className={filter===f?'selected':''} aria-pressed={filter===f} onClick={()=>setFilter(f)}>{f==='all'?'Tất cả':LEVEL_NAMES[f as Song['level']]}</button>)}</div><label className="pn-search"><Search size={17}/><input aria-label="Tìm bài nhạc" placeholder="Tìm một giai điệu…" value={search} onChange={e=>setSearch(e.target.value)}/></label></div><div className="pn-song-grid">{filtered.map((s,i)=><button className={`pn-song-card tone-${i%5}`} key={s.id} onClick={()=>void openPractice('song',s.id)}><div className="pn-song-art"><span>{artEmoji[s.art]}</span><i>♪</i>{progress.records[s.id]?.completed&&<b><Check size={16}/></b>}</div><div className="pn-song-copy"><span className="pn-song-level">{LEVEL_NAMES[s.level]}</span><h3>{s.title}</h3><small>{s.originalTitle}</small><div><span>{phrasesFor(stepsFromNotes(s.notes)).length} câu nhạc</span><ArrowRight size={17}/></div></div></button>)}</div>{!filtered.length&&<p className="pn-empty">Chưa thấy bài này. Em thử tên ngắn hơn nhé.</p>}</>}
            {keyboardVisible&&<>
                <section className="pn-play-heading"><div><span className="pn-eyebrow">{view==='free'?'MỌI GIAI ĐIỆU ĐỀU CÓ THỂ BẮT ĐẦU TỪ ĐÂY':lesson?'BÀI HỌC NHỎ':`TẬP THEO BÀI NHẠC · ${song?.meter}`}</span><h1>{view==='free'?'Đàn theo ý mình.':lesson?.title||song?.title}</h1><p>{view==='free'?'Thử một tiếng đàn mới. Chơi một nốt, rồi thêm một nốt nữa…':lesson?.instruction||song?.originalTitle}</p></div><span className="pn-play-mascot">{view==='free'?'🦊':lesson?.icon||artEmoji[song?.art||'garden']}</span></section>
                <div className="pn-instrument-bar" role="group" aria-label="Chọn tiếng đàn">{INSTRUMENTS.map(i=><button key={i.id} disabled={busy||!!pending} className={prefs.instrument===i.id?'selected':''} aria-pressed={prefs.instrument===i.id} onClick={()=>void changeInstrument(i.id)} title={i.detail}><span>{i.icon}</span><strong>{i.name}</strong>{prefs.instrument===i.id&&<i/>}</button>)}</div>
                {!soundEnabled&&<div className="pn-notice"><VolumeX size={19}/>Âm thanh đang tắt.<button onClick={toggleSound}>Bật tiếng để đàn</button></div>}
                {prefs.volume===0&&soundEnabled&&<div className="pn-notice">Âm lượng đang bằng 0.<button onClick={()=>updatePrefs({...prefs,volume:.55})}>Bật âm lượng</button></div>}
                {(busy||audioError)&&<div className="pn-notice" role={audioError?'alert':'status'}>{busy?'Đang chuẩn bị tiếng đàn…':audioError}{audioError&&<button onClick={()=>void ensureAudio()}>Thử lại</button>}</div>}
                {view==='practice'&&<section className="pn-practice-panel">
                    <div className="pn-practice-top"><div className="pn-phrase-controls"><button className="pn-icon" aria-label="Câu trước" disabled={phrase===0||!!pending} onClick={()=>movePhrase(phrase-1)}><ChevronLeft size={18}/></button><span>Câu <b>{phrase+1}</b> / {phrases.length}</span><button className="pn-icon" aria-label="Câu sau" disabled={phrase>=phrases.length-1||!!pending} onClick={()=>movePhrase(phrase+1)}><ChevronRight size={18}/></button></div><div className="pn-demo-controls"><button disabled={busy||phase==='demo'||!!audioError} onClick={()=>void demo(false)}><Headphones size={17}/>Nghe câu này</button>{song&&<button disabled={busy||phase==='demo'||!!audioError} onClick={()=>void demo(true)}>Nghe cả bài</button>}<label>Tốc độ <select aria-label="Tốc độ nghe mẫu" value={speed} onChange={e=>{resetInput();setPhase('ready');setStep(0);setSpeed(Number(e.target.value));}}><option value="0.5">50%</option><option value="0.75">75%</option><option value="1">100%</option></select></label><label className="pn-loop"><input type="checkbox" checked={loop} onChange={e=>setLoop(e.target.checked)}/>Lặp mẫu</label></div></div>
                    <div ref={noteStrip} className="pn-note-strip" aria-label="Các nốt của câu nhạc">{current.map((target,i)=><div className={`pn-note-chip ${i<step||phase==='complete'?'done':''} ${i===step&&phase!=='complete'?'current':''}`} key={i}><small>{i+1}</small><span>{prefs.guidance?target.pitches.map(n=>noteName(n,prefs.labels==='letters')).join(' + '):'♪'}</span><i>{target.holdMs?'Giữ & nhả':target.beats>=2?'Ngân dài':target.gapBeats?'Có khoảng nghỉ':'Chạm'}</i></div>)}</div>
                    <div className="pn-practice-bottom"><div className="pn-feedback" role="status">{phase==='complete'?<span className="pn-success">✦ {message}</span>:phase==='resting'?<span>☁️ {message}</span>:<span>{message||'Nghe mẫu hoặc chạm Bắt đầu đàn. Mình không cần vội.'}</span>}{lesson&&<small>{lesson.tip}</small>}</div><div className="pn-practice-actions">{phase==='demo'?<button className="pn-primary" onClick={()=>{resetInput();setPhase('ready');setMessage('Đến lượt em!');}}><Square size={16}/>Dừng nghe</button>:phase==='complete'?<><button className="pn-secondary" disabled={!!pending} onClick={()=>void beginPractice()}><RotateCcw size={16}/>Chơi lại</button>{phrase<phrases.length-1?<button className="pn-primary" disabled={!!pending} onClick={()=>movePhrase(phrase+1)}>Câu tiếp <ArrowRight size={17}/></button>:<button className="pn-primary" disabled={!!pending} onClick={back}>Xong rồi <Check size={17}/></button>}</>:['playing','holding','resting'].includes(phase)?<button className="pn-secondary" onClick={()=>{resetInput();setPhase('paused');setStep(0);setMessage('Mình tạm nghỉ một chút nhé.');}}>Tạm nghỉ</button>:<button className="pn-primary" disabled={busy||!!audioError||!soundEnabled||prefs.volume===0||!!pending} onClick={()=>void beginPractice()}><Play size={17}/>{phase==='paused'?'Chơi tiếp':'Bắt đầu đàn'}</button>}</div></div>
                    {lesson?.demonstration==='hand'&&<div className="pn-hand-tip"><HandArt/><p>Ngón cái là 1, ngón út là 5.<br/>Chạm nhẹ thôi, bàn tay luôn thoải mái.</p></div>}
                </section>}
                {view==='free'&&<div className="pn-free-note"><span>✦</span><p><strong>{currentInstrument.detail}.</strong> Mỗi phím là một màu âm thanh. Em muốn kể câu chuyện gì?</p><span>♫</span></div>}
                <section className="pn-piano"><div className="pn-piano-top"><span><Music2 size={16}/> LITTLE MELODIES</span><div><label><Volume2 size={17}/><input aria-label="Âm lượng đàn" type="range" min="0" max="0.85" step="0.05" value={prefs.volume} disabled={!!pending} onChange={e=>updatePrefs({...prefs,volume:Number(e.target.value)})}/></label><select aria-label="Tên trên phím" value={prefs.labels} disabled={!!pending} onChange={e=>updatePrefs({...prefs,labels:e.target.value as Preferences['labels']})}><option value="solfege">Đô · Rê · Mi</option><option value="letters">C · D · E</option><option value="none">Ẩn tên nốt</option></select>{view==='practice'&&<label><input type="checkbox" checked={prefs.guidance} disabled={!!pending} onChange={e=>updatePrefs({...prefs,guidance:e.target.checked})}/>Gợi ý</label>}</div></div><Keyboard active={active} cue={cue} expected={view==='practice'&&prefs.guidance&&['playing','holding','ready'].includes(phase)?expected?.pitches||[]:[]} labels={prefs.labels} disabled={busy||!!audioError||!soundEnabled||prefs.volume===0||!audio?.ready||phase==='demo'||credits||!!pending||leaveConfirm} onDown={down} onUp={up} onReset={resetInput}/></section>
                <div className="pn-bottom-note"><span>{audio?.samplesLoaded?'Piano đã sẵn sàng · Âm thanh phát ngay trên thiết bị':'Chọn một nhạc cụ và chạm để khám phá'}</span><button onClick={()=>setCredits(true)}>Nguồn nhạc & lời cảm ơn</button></div>
            </>}
        </main>
        {credits&&<div className="pn-overlay"><section className="pn-modal" role="dialog" aria-modal="true" aria-labelledby="pn-credits-title"><button autoFocus className="pn-modal-close pn-icon" aria-label="Đóng nguồn nhạc" onClick={()=>setCredits(false)}><X/></button><span className="pn-eyebrow">NHỮNG GIAI ĐIỆU ĐƯỢC CHIA SẺ</span><h2 id="pn-credits-title">Lời cảm ơn từ phòng nhạc</h2><p>24 giai điệu từ các tuyển tập cổ <i>The Baby’s Opera</i> và <i>The Baby’s Bouquet</i> của Walter và Lucy Crane. Bản tập một tuyến giai điệu được chuyển giọng, bỏ phần đệm và chơi một lượt ký âm.</p><p>Project Gutenberg xác định các ấn bản nguồn thuộc phạm vi công cộng tại Hoa Kỳ. Nhạc mẫu được phát từ dữ liệu nốt trong ứng dụng.</p><a href="https://www.gutenberg.org/ebooks/25418" target="_blank" rel="noreferrer">The Baby’s Opera ↗</a><a href="https://www.gutenberg.org/ebooks/25432" target="_blank" rel="noreferrer">The Baby’s Bouquet ↗</a>{song&&<a href={song.source.url} target="_blank" rel="noreferrer">Bản ký âm của bài đang tập · trang {song.source.page} ↗</a>}<p>Tiếng piano: Salamander Grand Piano của Alexander Holm, bản MP3 từ Tone.js Audio, giấy phép CC BY 3.0. Năm âm sắc còn lại được tổng hợp trong ứng dụng.</p><a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noreferrer">Giấy phép tiếng piano ↗</a><button className="pn-primary" onClick={()=>setCredits(false)}>Về phòng nhạc</button></section></div>}
        {leaveConfirm&&<div className="pn-overlay"><section className="pn-modal" role="dialog" aria-modal="true" aria-label="Tiến độ chưa lưu"><h2>Câu nhạc chưa được lưu</h2><p>Em có thể thử lưu lại trước khi rời màn hình.</p><button autoFocus className="pn-primary" onClick={()=>{if(pending&&persist(pending))doBack();}}>Lưu và quay lại</button><button className="pn-secondary" onClick={()=>setLeaveConfirm(false)}>Ở lại</button><button className="pn-text-button" onClick={()=>{setPending(null);setSaveError('');doBack();}}>Rời màn hình, bỏ phần chưa lưu</button></section></div>}
    </div>;
}
