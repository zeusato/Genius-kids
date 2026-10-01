import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Music2, Search, Sparkles, Volume2, VolumeX, X } from 'lucide-react';
import { useStudent, useStudentActions } from '../../src/contexts/StudentContext';
import { useMusicControls } from '../../src/contexts/MusicContext';
import { musicManager } from '../../services/musicManager';
import { cancelSpeech, speak } from '../../src/utils/speech';
import type { StudentProfile } from '../../types';
import { PianoAudio } from './audio';
import { PianoArt, PianoModeArt } from './PianoArt';
import { INSTRUMENTS, LEVEL_NAMES, type InstrumentId, type Preferences, type Song } from './model';
import { LESSONS } from './content/lessons';
import { SONGS, phrasesOf } from './content/songs';
import { readProgress, type PianoAction } from './progress';
import { InstrumentGrid, InstrumentMenu, SettingsMenu, StagePiano, type NoteListener, type StageApi } from './stage';
import { SongPractice } from './SongPractice';
import { LessonPlayer } from './LessonPlayer';
import './piano.css';

type View='home'|'learn'|'songs'|'free'|'lesson'|'song';
const artEmoji:Record<string,string>={bakery:'🥐',bridge:'🌉',tea:'🫖',flower:'🌷',moon:'🌙',drum:'🥁',garden:'🌳',cat:'🐱',boat:'⛵',bell:'🔔',clock:'🕰️',bird:'🐦',sheep:'🐑',crown:'👑'};
export default function PianoPage(){
    const {currentStudent}=useStudent(),{savePiano}=useStudentActions(),controls=useMusicControls(),navigate=useNavigate();
    if(!currentStudent)return null;
    return <PianoRoom key={currentStudent.id} student={currentStudent} save={action=>savePiano(currentStudent.id,action)} soundEnabled={controls.soundEnabled} toggleSound={controls.toggleSound} onExit={()=>navigate('/mode')}/>;
}
export interface PianoRoomProps { student:StudentProfile; save:(action:PianoAction)=>{ok:boolean}; soundEnabled:boolean; toggleSound:()=>void; onExit:()=>void }
export function PianoRoom({student,save,soundEnabled,toggleSound,onExit}:PianoRoomProps){
    const progress=readProgress(student.piano);
    const [prefs,setPrefs]=useState<Preferences>(progress.preferences),[view,setView]=useState<View>('home'),[selection,setSelection]=useState('');
    const [audio,setAudio]=useState<PianoAudio|null>(null),[busy,setBusy]=useState(false),[audioError,setAudioError]=useState('');
    const [active,setActive]=useState<number[]>([]),[filter,setFilter]=useState('all'),[search,setSearch]=useState(''),[credits,setCredits]=useState(false);
    const [pending,setPending]=useState<PianoAction|null>(null),[leaveConfirm,setLeaveConfirm]=useState(false),[saveError,setSaveError]=useState('');
    const inputs=useRef(new Map<string,{voice:number;midi:number;at:number;recovered:boolean}>()),task=useRef(0),mounted=useRef(true),listener=useRef<NoteListener|null>(null),sayToken=useRef(0);
    const latest=useRef({prefs,soundEnabled});
    latest.current={prefs,soundEnabled};
    const lessonIndex=view==='lesson'?LESSONS.findIndex(l=>l.id===selection):-1,lesson=LESSONS[lessonIndex];
    const song=view==='song'?SONGS.find(s=>s.id===selection):undefined;
    function resetInput(){inputs.current.clear();setActive([]);audio?.stop();}
    function interrupt(){inputs.current.clear();setActive([]);listener.current?.interrupt();}
    function hush(){sayToken.current++;cancelSpeech();}
    function say(text:string,then?:()=>void){
        const token=++sayToken.current;let finished=false;
        const finish=()=>{if(finished||token!==sayToken.current||!mounted.current)return;finished=true;then?.();};
        if(!latest.current.prefs.voice||!latest.current.soundEnabled||!speak(text,{lang:'vi-VN',rate:.95,onEnd:finish,onError:finish})){cancelSpeech();if(then)setTimeout(finish,250);return;}
        // Some speech engines never report the end; do not leave a lesson waiting for it.
        if(then)setTimeout(finish,1800+text.length*95);
    }
    useEffect(()=>{
        mounted.current=true;const engine=new PianoAudio();setAudio(engine);engine.onInterrupt=interrupt;musicManager.playTrack(null);
        const suspend=()=>{engine.stop();interrupt();};
        const hidden=()=>{if(document.hidden)suspend();};
        window.addEventListener('blur',suspend);document.addEventListener('visibilitychange',hidden);
        navigator.mediaDevices?.addEventListener?.('devicechange',suspend);
        return()=>{mounted.current=false;task.current++;sayToken.current++;cancelSpeech();engine.close();window.removeEventListener('blur',suspend);document.removeEventListener('visibilitychange',hidden);navigator.mediaDevices?.removeEventListener?.('devicechange',suspend);musicManager.resumeRouteMusic();};
    },[]);
    useEffect(()=>{audio?.setMuted(!soundEnabled);audio?.setVolume(prefs.volume);if(!soundEnabled||prefs.volume===0){resetInput();listener.current?.interrupt();}if(!soundEnabled)hush();},[audio,soundEnabled,prefs.volume]);
    useEffect(()=>{if(credits){resetInput();listener.current?.interrupt();}},[credits]);
    useEffect(()=>{
        if(!pending)return;
        resetInput();listener.current?.interrupt();
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
    function updatePrefs(next:Preferences){setPrefs(next);if(!next.voice)hush();persist({type:'preferences',preferences:next});}
    async function changeInstrument(id:InstrumentId){
        if(busy||pending)return;resetInput();listener.current?.interrupt();
        if(await ensureAudio(id))updatePrefs({...prefs,instrument:id});
    }
    function down(key:string,midi:number,recovered=false){
        if(!audio?.audible||busy||pending||inputs.current.has(key)||credits||leaveConfirm)return;
        const voice=audio.noteOn(midi);if(voice===null)return;
        inputs.current.set(key,{voice,midi,at:performance.now(),recovered});setActive([...new Set([...inputs.current.values()].map(n=>n.midi))]);
        listener.current?.press(midi,new Set([...inputs.current.values()].filter(n=>!n.recovered).map(n=>n.midi)),recovered);
    }
    function up(key:string){
        const input=inputs.current.get(key);if(!input)return;
        audio?.noteOff(input.voice);inputs.current.delete(key);setActive([...new Set([...inputs.current.values()].map(n=>n.midi))]);
        listener.current?.release(input.midi,performance.now()-input.at,input.recovered);
    }
    function open(next:View,id=''){
        task.current++;resetInput();hush();setSelection(id);setView(next);
        if(next==='lesson'||next==='song'||next==='free')void ensureAudio();
    }
    function back(){if(pending){setLeaveConfirm(true);return;}doBack();}
    function doBack(){
        task.current++;setBusy(false);resetInput();hush();setLeaveConfirm(false);
        if(view==='home')onExit();else if(view==='lesson')setView('learn');else if(view==='song')setView('songs');else setView('home');
    }
    const finishedCount=Object.values(progress.records).filter(r=>r.completed).length;
    const currentInstrument=INSTRUMENTS.find(i=>i.id===prefs.instrument)!;
    const playing=view==='free'||view==='lesson'||view==='song';
    const overlay=!playing?null:!soundEnabled?<div className="pn-wake"><VolumeX size={28}/><p>Âm thanh đang tắt</p><button className="pn-primary" onClick={toggleSound}>Bật tiếng để đàn</button></div>
        :prefs.volume===0?<div className="pn-wake"><VolumeX size={28}/><p>Âm lượng đang bằng 0</p><button className="pn-primary" onClick={()=>updatePrefs({...prefs,volume:.55})}>Bật âm lượng</button></div>
        :busy?<div className="pn-wake" role="status"><span className="pn-spinner" aria-hidden="true"/><p>Đang chuẩn bị tiếng đàn…</p></div>
        :audioError?<div className="pn-wake" role="alert"><p>{audioError}</p><button className="pn-primary" onClick={()=>void ensureAudio()}>Thử lại</button></div>
        :!audio?.ready?<button className="pn-wake pn-wake-button" onClick={()=>void ensureAudio()}><Volume2 size={30}/><strong>Chạm để bật tiếng đàn</strong></button>:null;
    const api:StageApi={audio,prefs,progress,locked:!!pending||credits||leaveConfirm,persist,ensureAudio,stopSound:resetInput,say,hush,listener,
        keyboard:{active,labels:prefs.labels,onDown:down,onUp:up,onReset:resetInput,overlay,disabled:!!overlay||credits||!!pending||leaveConfirm}};
    const modeName=view==='learn'||view==='lesson'?'Làm quen với đàn':view==='songs'||view==='song'?'Tập theo bài nhạc':view==='free'?'Chơi tự do':'Phòng nhạc trong vườn';
    const title=lesson?`Bài ${lessonIndex+1} · ${lesson.title}`:song?song.title:view==='free'?'Đàn theo ý mình':'';
    const filtered=SONGS.filter(s=>(filter==='all'||s.level===filter)&&(s.title+' '+s.originalTitle).toLocaleLowerCase('vi').includes(search.toLocaleLowerCase('vi')));
    const nextLesson=LESSONS.findIndex(l=>!progress.records[l.id]?.completed),lessonsDone=LESSONS.filter(l=>progress.records[l.id]?.completed).length;
    return <div className={`pn-app ${playing?'pn-app-stage':''}`}>
        <header className="pn-header">
            <div className="pn-header-left"><button className="pn-icon pn-icon-lg" onClick={back} aria-label={view==='home'?'Về sảnh khám phá':'Quay lại'}><ArrowLeft size={22}/></button>
                {playing?<div className="pn-stage-title"><small>{modeName}</small><strong>{title}</strong></div>
                    :<div className="pn-brand"><span className="pn-brand-mark"><Music2 size={23}/></span><div><strong>Piano Nhí</strong><small>{modeName}</small></div></div>}
            </div>
            <div className="pn-header-right">
                {!playing&&<span className="pn-progress-pill"><Sparkles size={16}/>{finishedCount} <small>bài đã chơi</small></span>}
                {(view==='lesson'||view==='song')&&<InstrumentMenu value={prefs.instrument} disabled={busy||!!pending} onPick={id=>void changeInstrument(id)}/>}
                {playing&&<SettingsMenu prefs={prefs} disabled={!!pending} show={{guidance:view==='song',voice:view==='lesson'}} onChange={updatePrefs} onCredits={()=>setCredits(true)}/>}
                <button className="pn-icon pn-icon-lg" aria-label={soundEnabled?'Tắt tiếng':'Bật tiếng'} onClick={toggleSound}>{soundEnabled?<Volume2 size={22}/>:<VolumeX size={22}/>}</button>
            </div>
        </header>
        <main className={playing?'pn-stage':'pn-main'}>
            {saveError&&<div className="pn-notice" role="alert">{saveError}<button onClick={()=>pending&&persist(pending)}>Thử lưu lại</button></div>}
            {view==='home'&&<>
                <section className="pn-hero"><div className="pn-hero-copy"><span className="pn-eyebrow"><i/> MỘT KHU VƯỜN ĐẦY ÂM THANH</span><h1>Chạm một phím.<br/><em>Nở một giai điệu.</em></h1><p>Chào {student.name}! Cùng bạn Cáo làm quen với đàn,<br className="pn-desktop"/> chơi một bài nhạc, hay tạo giai điệu của riêng mình.</p><div className="pn-hero-tags"><span>🎹 6 tiếng nhạc cụ</span><span>♫ {SONGS.length} bài nhạc nhỏ</span><span>🌱 Học theo nhịp của em</span></div></div><div className="pn-hero-picture"><PianoArt/><span className="pn-art-caption">THE LITTLE MUSIC GARDEN</span></div></section>
                <div className="pn-section-title"><h2>Hôm nay mình chơi gì?</h2><span>Cứ tò mò, cứ thử nhé.</span></div>
                <div className="pn-mode-grid">
                    {[{view:'learn' as const,n:'01',title:'Làm quen với đàn',text:'Tìm phím, gọi tên nốt, nghe cao thấp rồi đàn bài đầu tiên.',tag:`${lessonsDone}/10 BÀI HỌC NHỎ`,className:'sage'},{view:'songs' as const,n:'02',title:'Tập theo bài nhạc',text:'Nghe một chút, rồi đàn liền một mạch cả bài.',tag:`${SONGS.length} GIAI ĐIỆU ĐANG CHỜ`,className:'peach'},{view:'free' as const,n:'03',title:'Chơi tự do',text:'Đổi tiếng đàn và để trí tưởng tượng bay xa.',tag:'SÁNG TẠO THEO CÁCH CỦA EM',className:'lavender'}].map(m=><button className={`pn-mode-card ${m.className}`} key={m.view} onClick={()=>open(m.view)}><div className="pn-mode-illustration"><PianoModeArt mode={m.view}/><b>{m.n}</b></div><div className="pn-mode-body"><small>{m.tag}</small><h3>{m.title}</h3><p>{m.text}</p><span className="pn-card-action">Khám phá ngay <ArrowRight size={17}/></span></div></button>)}
                </div><div className="pn-bottom-note"><span>✦ Mỗi nốt nhạc đều bắt đầu từ một lần thử.</span><button onClick={()=>setCredits(true)}>Nguồn nhạc & lời cảm ơn</button></div>
            </>}
            {view==='learn'&&<>
                <div className="pn-page-heading pn-learn-heading"><div><span className="pn-eyebrow">TỪNG NỐT, TỪNG BƯỚC</span><h1>Làm quen với đàn<span>🌱</span></h1><p>Mười bài nhỏ, mỗi bài vài trò chơi ngắn. Bạn Cáo đọc hướng dẫn cho em nghe.</p></div>
                    <div className="pn-journey-progress" aria-label={`Đã học ${lessonsDone} trên 10 bài`}><strong>{lessonsDone}<small>/10</small></strong><span>bài đã học</span><i style={{'--done':`${lessonsDone*10}%`} as React.CSSProperties}/></div></div>
                {nextLesson>=0&&<button className="pn-continue" onClick={()=>open('lesson',LESSONS[nextLesson].id)}><span className="pn-continue-icon">{LESSONS[nextLesson].icon}</span><div><small>{lessonsDone?'HỌC TIẾP':'BẮT ĐẦU TỪ ĐÂY'}</small><strong>Bài {nextLesson+1}: {LESSONS[nextLesson].title}</strong><p>{LESSONS[nextLesson].subtitle} · {LESSONS[nextLesson].activities.length} hoạt động</p></div><ArrowRight size={26}/></button>}
                <div className="pn-lessons">{LESSONS.map((l,i)=>{const r=progress.records[l.id],partial=r&&!r.completed&&r.total===l.activities.length?r.phrases.length:0;return <button key={l.id} className={`pn-lesson-card ${r?.completed?'done':''} ${i===nextLesson?'next':''}`} onClick={()=>open('lesson',l.id)}><span className="pn-lesson-icon">{l.icon}</span><div><small>BÀI {String(i+1).padStart(2,'0')} · {l.activities.length} HOẠT ĐỘNG</small><h3>{l.title}</h3><p>{l.subtitle}</p></div><span className="pn-lesson-end">{r?.completed?<Check/>:partial?<b>{partial}/{l.activities.length}</b>:i===nextLesson?<em>Học tiếp</em>:<ArrowRight/>}</span></button>;})}</div>
            </>}
            {view==='songs'&&<><div className="pn-page-heading"><span className="pn-eyebrow">NHỮNG GIAI ĐIỆU ĐI CÙNG TUỔI THƠ</span><h1>Một bài nhạc cho em<span>♫</span></h1><p>{SONGS.length} bản nhạc cổ, chuyển soạn cho những bàn tay nhỏ. Nghe, thử, rồi đàn liền một mạch cả bài.</p></div><div className="pn-library-toolbar"><div className="pn-filter" aria-label="Mức độ bài nhạc">{['all','easy','medium','hard'].map(f=><button key={f} className={filter===f?'selected':''} aria-pressed={filter===f} onClick={()=>setFilter(f)}>{f==='all'?'Tất cả':LEVEL_NAMES[f as Song['level']]}</button>)}</div><label className="pn-search"><Search size={18}/><input aria-label="Tìm bài nhạc" placeholder="Tìm một giai điệu…" value={search} onChange={e=>setSearch(e.target.value)}/></label></div><div className="pn-song-grid">{filtered.map((s,i)=>{const count=phrasesOf(s).length,r=progress.records[s.id],got=r?.completed?count:r?.total===count?r.phrases.length:0;return <button className={`pn-song-card tone-${i%5}`} key={s.id} onClick={()=>open('song',s.id)}><div className="pn-song-art"><span>{artEmoji[s.art]}</span><i>♪</i>{r?.completed&&<b><Check size={16}/></b>}</div><div className="pn-song-copy"><span className="pn-song-level">{LEVEL_NAMES[s.level]}</span><h3>{s.title}</h3><small>{s.originalTitle}</small><div><span>{got&&!r?.completed?`${got}/${count} câu`:`${count} câu nhạc`}</span><ArrowRight size={17}/></div>{got>0&&<i className="pn-song-meter" style={{'--done':`${got/count*100}%`} as React.CSSProperties}/>}</div></button>;})}</div>{!filtered.length&&<p className="pn-empty">Chưa thấy bài này. Em thử tên ngắn hơn nhé.</p>}</>}
            {lesson&&<LessonPlayer key={lesson.id} lesson={lesson} number={lessonIndex+1} api={api} next={LESSONS[lessonIndex+1]} onNext={()=>open('lesson',LESSONS[lessonIndex+1].id)} onList={()=>open('learn')}/>}
            {song&&<SongPractice key={song.id} song={song} api={api} onLibrary={()=>open('songs')}/>}
            {view==='free'&&<>
                <section className="pn-stage-panel pn-free-panel"><p className="pn-free-intro"><span aria-hidden="true">🦊</span><span><strong>{currentInstrument.detail}.</strong> Mỗi phím là một màu âm thanh. Em muốn kể câu chuyện gì?</span></p><InstrumentGrid value={prefs.instrument} disabled={busy||!!pending} onPick={id=>void changeInstrument(id)}/></section>
                <StagePiano api={api} cue={[]} expected={[]}/>
            </>}
        </main>
        {credits&&<div className="pn-overlay"><section className="pn-modal" role="dialog" aria-modal="true" aria-labelledby="pn-credits-title"><button autoFocus className="pn-modal-close pn-icon" aria-label="Đóng nguồn nhạc" onClick={()=>setCredits(false)}><X/></button><span className="pn-eyebrow">NHỮNG GIAI ĐIỆU ĐƯỢC CHIA SẺ</span><h2 id="pn-credits-title">Lời cảm ơn từ phòng nhạc</h2><p>24 giai điệu từ các tuyển tập cổ <i>The Baby’s Opera</i> và <i>The Baby’s Bouquet</i> của Walter và Lucy Crane. Bản tập một tuyến giai điệu được chuyển giọng, bỏ phần đệm và chơi một lượt ký âm.</p><p>Project Gutenberg xác định các ấn bản nguồn thuộc phạm vi công cộng tại Hoa Kỳ. Nhạc mẫu được phát từ dữ liệu nốt trong ứng dụng. Bài làm quen số 10 dùng câu nhạc Bài ca Niềm vui của Beethoven (1824).</p><a href="https://www.gutenberg.org/ebooks/25418" target="_blank" rel="noreferrer">The Baby’s Opera ↗</a><a href="https://www.gutenberg.org/ebooks/25432" target="_blank" rel="noreferrer">The Baby’s Bouquet ↗</a>{song&&<a href={song.source.url} target="_blank" rel="noreferrer">Bản ký âm của bài đang tập · trang {song.source.page} ↗</a>}<p>Tiếng piano: Salamander Grand Piano của Alexander Holm, bản MP3 từ Tone.js Audio, giấy phép CC BY 3.0. Năm âm sắc còn lại được tổng hợp trong ứng dụng.</p><a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noreferrer">Giấy phép tiếng piano ↗</a><button className="pn-primary" onClick={()=>setCredits(false)}>Về phòng nhạc</button></section></div>}
        {leaveConfirm&&<div className="pn-overlay"><section className="pn-modal" role="dialog" aria-modal="true" aria-label="Tiến độ chưa lưu"><h2>Câu nhạc chưa được lưu</h2><p>Em có thể thử lưu lại trước khi rời màn hình.</p><button autoFocus className="pn-primary" onClick={()=>{if(pending&&persist(pending))doBack();}}>Lưu và quay lại</button><button className="pn-secondary" onClick={()=>setLeaveConfirm(false)}>Ở lại</button><button className="pn-text-button" onClick={()=>{setPending(null);setSaveError('');doBack();}}>Rời màn hình, bỏ phần chưa lưu</button></section></div>}
    </div>;
}
