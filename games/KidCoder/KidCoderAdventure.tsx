import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronRight, Flag, Gem, HelpCircle, LockKeyhole, Pause, Play, Rocket, RotateCcw, Settings2, SkipBack, SkipForward, Sparkles, Star, Volume2, X } from 'lucide-react';
import type { StudentProfile } from '../../types';
import { useStudentActions } from '../../src/contexts/StudentContext';
import { cancelSpeech, speak } from '../../src/utils/speech';
import { CAMPAIGN, CHAPTERS, ROVERS } from './content/campaign';
import { ChapterId, COMMANDS, Mission, ProgramNode, copyProgram } from './engine/model';
import { sense } from './engine/runtime';
import { ProgramEditor } from './editor/ProgramEditor';
import { readDraft, readProgress, saveDraft } from './progress/progress';
import { useExecution } from './session/useExecution';
import { RoverBoard2D } from './rendering/RoverBoard2D';
import { RoverPortrait } from './rendering/RoverPortrait';
import type { Quality } from './rendering/RoverBoard3D';
import './kidcoder.css';

const RoverBoard3D = lazy(() => import('./rendering/RoverBoard3D'));
interface Preferences { view: '3d' | '2d'; quality: Quality; sound: boolean; reduced: boolean; rover: string }
function loadPreferences(studentId: string): Preferences {
    const defaults: Preferences = { view: '3d', quality: navigator.hardwareConcurrency <= 4 ? 'light' : 'balanced', sound: true, reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches, rover: 'pioneer' };
    try {
        const p = JSON.parse(localStorage.getItem(`kidcoder-prefs:${studentId}`) || '{}');
        return { view: p.view === '2d' ? '2d' : '3d', quality: ['light','balanced','detailed'].includes(p.quality) ? p.quality : defaults.quality,
            sound: typeof p.sound === 'boolean' ? p.sound : defaults.sound, reduced: typeof p.reduced === 'boolean' ? p.reduced : defaults.reduced, rover: ROVERS.some(r => r.id === p.rover) ? p.rover : defaults.rover };
    } catch { return defaults; }
}
function PlanetOrb({ chapter, small = false }: { chapter: typeof CHAPTERS[number]; small?: boolean }) {
    return <div className={`kc-orb ${small ? 'small' : ''}`} style={{ '--planet-color': chapter.color, ...(chapter.texture ? { backgroundImage: `url(${import.meta.env.BASE_URL}textures/${chapter.texture}.webp)` } : {}) } as React.CSSProperties}><span/></div>;
}
function Modal({ title, children, onClose, dismissible = true }: { title: string; children: React.ReactNode; onClose: () => void; dismissible?: boolean }) {
    const ref = useRef<HTMLDivElement>(null), close = useRef(onClose); close.current = onClose;
    useEffect(() => {
        const previous = document.activeElement as HTMLElement | null;
        ref.current?.querySelector<HTMLElement>('button')?.focus();
        const key = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close.current(); }
            if (e.key !== 'Tab') return;
            const items = Array.from(ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled), select:not(:disabled), input:not(:disabled), [tabindex="0"]') || []);
            if (!items.length) return;
            if (e.shiftKey && document.activeElement === items[0]) { e.preventDefault(); items.at(-1)!.focus(); }
            else if (!e.shiftKey && document.activeElement === items.at(-1)) { e.preventDefault(); items[0].focus(); }
        };
        document.addEventListener('keydown', key); return () => { document.removeEventListener('keydown',key); if (previous?.isConnected) previous.focus(); };
    }, []);
    return <div className="kc-modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}><div className="kc-modal" role="dialog" aria-modal="true" aria-label={title} ref={ref}>{dismissible&&<button className="kc-modal-close kc-icon-button" aria-label="Đóng" onClick={onClose}><X size={20}/></button>}{children}</div></div>;
}
class SceneBoundary extends React.Component<{ children: React.ReactNode; fallback: React.ReactNode; onError: () => void }, { failed: boolean }> {
    state = { failed: false };
    static getDerivedStateFromError() { return { failed: true }; }
    componentDidCatch() { this.props.onError(); }
    render() { return this.state.failed ? this.props.fallback : this.props.children; }
}
let audio: AudioContext | null = null;
function tone(kind: 'click' | 'sample' | 'win', enabled: boolean) {
    if (!enabled) return;
    try {
        audio ||= new AudioContext(); if (audio.state === 'suspended') void audio.resume().catch(() => {});
        const notes = kind === 'win' ? [523,659,784] : kind === 'sample' ? [659,880] : [440];
        notes.forEach((frequency,i) => {
            const osc = audio!.createOscillator(), gain = audio!.createGain(), t = audio!.currentTime + i*.11;
            osc.type = 'sine'; osc.frequency.value = frequency; gain.gain.setValueAtTime(.0001,t); gain.gain.exponentialRampToValueAtTime(.035,t+.015); gain.gain.exponentialRampToValueAtTime(.0001,t+.15);
            osc.connect(gain); gain.connect(audio!.destination); osc.start(t); osc.stop(t+.17); osc.onended = () => { osc.disconnect(); gain.disconnect(); };
        });
    } catch { /* Text and animation provide the same feedback when audio is unavailable. */ }
}

interface AdventureProps { student: StudentProfile; onExit: () => void; onLegacy: () => void }
export function KidCoderAdventure({ student, onExit, onLegacy }: AdventureProps) {
    const progress = useMemo(() => readProgress(student.kidCoder), [student.kidCoder]), completed = Object.keys(progress.missions).length;
    const next = CAMPAIGN.find(m => !progress.missions[m.id]);
    const [chapterId, setChapterId] = useState<ChapterId>(next?.chapter || 'station'), [mission, setMission] = useState<Mission | null>(null);
    const [prefs, setPrefs] = useState(() => loadPreferences(student.id)), [panel, setPanel] = useState<'settings' | 'garage' | 'journal' | null>(null);
    const [loading, setLoading] = useState(false), [notice, setNotice] = useState('');
    const worker = useRef<Worker | null>(null), workerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const exitRequest = useRef<(() => void) | null>(null);
    const chapter = CHAPTERS.find(c => c.id === chapterId)!;
    const rover = ROVERS.find(r => r.id === prefs.rover && r.needed <= completed) || ROVERS[0];
    const unlocked = (m: Mission) => { const i = CAMPAIGN.indexOf(m); return i === 0 || !!progress.missions[m.id] || !!progress.missions[CAMPAIGN[i-1].id]; };
    useEffect(() => { try { localStorage.setItem(`kidcoder-prefs:${student.id}`,JSON.stringify(prefs)); } catch { /* Preferences are optional. */ } }, [prefs,student.id]);
    useEffect(() => () => { worker.current?.terminate(); if (workerTimer.current) clearTimeout(workerTimer.current); cancelSpeech(); if (audio) { void audio.close().catch(() => {}); audio = null; } }, []);
    const fallback = useCallback(() => { setPrefs(p => ({ ...p, view: '2d' })); setNotice('Đã chuyển sang bàn 2D để tiếp tục chuyến đi.'); }, []);
    const lowerQuality = useCallback(() => { setPrefs(p => p.quality==='light'?p:{...p,quality:'light'}); }, []);
    function practice() {
        worker.current?.terminate(); if (workerTimer.current) clearTimeout(workerTimer.current); setLoading(true); setNotice('');
        const seed = crypto.getRandomValues(new Uint32Array(1))[0];
        const base = CAMPAIGN.find(m => m.chapter === chapterId && unlocked(m)) || CAMPAIGN[0];
        const fallbackMission = () => { worker.current?.terminate(); worker.current = null; setLoading(false); setMission({ ...structuredClone(base), practice: true, seed, starter: undefined }); };
        try {
            const w = new Worker(new URL('./generation/generationWorker.ts',import.meta.url), { type: 'module' }); worker.current = w;
            workerTimer.current = setTimeout(fallbackMission,2000);
            w.onmessage = e => { if (worker.current !== w) return; clearTimeout(workerTimer.current!); w.terminate(); worker.current = null; setLoading(false); if (e.data.mission) setMission(e.data.mission); else fallbackMission(); };
            w.onerror = () => { if (worker.current === w) fallbackMission(); };
            w.postMessage({ seed, unlockedIds: CAMPAIGN.filter(m => m.chapter === chapterId && progress.missions[m.id]).map(m=>m.id).concat(base.id) });
        } catch { fallbackMission(); }
    }
    function choose(m: Mission) { if (unlocked(m)) { tone('click',prefs.sound); setMission(m); } }
    function nextMission() {
        if (!mission) return;
        if (mission.practice) { practice(); return; }
        const index = CAMPAIGN.findIndex(m => m.id === mission.id), upcoming = CAMPAIGN[index+1];
        if (upcoming) { setChapterId(upcoming.chapter); setMission(upcoming); } else { setMission(null); setPanel('journal'); }
    }
    return <div className={`kidcoder ${prefs.reduced ? 'reduce-motion' : ''}`} style={{ '--accent': (mission ? CHAPTERS.find(c=>c.id===mission.chapter)! : chapter).color } as React.CSSProperties}>
        <header className="kc-topbar"><button className="kc-icon-button" aria-label={mission ? 'Về hành trình' : 'Về trò chơi'} onClick={() => mission ? exitRequest.current?.() : onExit()}><ArrowLeft size={20}/></button>
            <button className="kc-brand" onClick={() => mission ? exitRequest.current?.() : setMission(null)}><span className="kc-brand-icon"><Rocket size={21}/></span><span>KidCoder<small>BIỆT ĐỘI ROVER</small></span></button>
            <div className="kc-top-actions"><span className="kc-star-total"><Star size={17} fill="currentColor"/> {student.stars}</span><button className="kc-icon-button" title="Sổ khám phá" aria-label="Sổ khám phá" onClick={() => setPanel('journal')}><BookOpen size={20}/></button><button className="kc-icon-button" title="Tùy chọn" aria-label="Tùy chọn" onClick={() => setPanel('settings')}><Settings2 size={20}/></button></div>
        </header>
        {notice && <div className="kc-global-notice" role="status">{notice}<button aria-label="Đóng thông báo" onClick={()=>setNotice('')}><X size={15}/></button></div>}
        {mission ? <PlayMission key={`${mission.id}:${mission.seed ?? 'campaign'}`} student={student} mission={mission} prefs={prefs} rover={rover} onExit={()=>setMission(null)} onNext={nextMission} onFallback={fallback} onMode={()=>setPrefs(p=>({...p,view:p.view==='3d'?'2d':'3d'}))} exitRequest={exitRequest} suspended={panel!==null} onSlow={lowerQuality}/> : <main className="kc-map">
            <section className="kc-map-hero"><div className="kc-hero-copy"><span className="kc-eyebrow"><span className="kc-live-dot"/> HÀNH TRÌNH CỦA {student.name.toLocaleUpperCase('vi')}</span><h1>Một ý tưởng nhỏ.<br/><em>Một chuyến đi lớn.</em></h1><p>Cùng {rover.name} khám phá những thế giới mới.<br/>Xếp lệnh, thử nghiệm và tìm ra cách của riêng mình.</p>
                <button className="kc-primary" onClick={()=>choose(next || CAMPAIGN[39])}><Play size={18} fill="currentColor"/>{completed === 0 ? 'Bắt đầu thám hiểm' : next ? 'Tiếp tục hành trình' : 'Thử lại thử thách cuối'}<ArrowRight size={18}/></button>
                <div className="kc-expedition-progress"><div><span>{completed} / 40 nhiệm vụ</span><strong>{completed === 40 ? 'Đã khám phá trọn hành trình!' : `Còn ${8-completed%8} bài tới dấu mốc tiếp theo`}</strong></div><div className="kc-progress-track"><i style={{width:`${completed/40*100}%`}}/></div></div>
            </div><div className="kc-hero-art"><div className="kc-orbit orbit-one"/><div className="kc-orbit orbit-two"/><PlanetOrb chapter={chapter}/><div className="kc-star-point star-a">✦</div><div className="kc-star-point star-b">✧</div><RoverPortrait color={rover.color} className="kc-hero-rover"/><button className="kc-rover-tag" onClick={()=>setPanel('garage')}><span style={{background:rover.color}}/>{rover.name}<ChevronRight size={16}/></button></div></section>
            <nav className="kc-chapters" aria-label="Các chương">{CHAPTERS.map((c,i) => { const done = CAMPAIGN.filter(m=>m.chapter===c.id && progress.missions[m.id]).length, open = i===0 || !!progress.missions[CAMPAIGN[i*8-1].id]; return <button key={c.id} aria-pressed={chapterId===c.id} disabled={!open} className={chapterId===c.id?'active':''} onClick={()=>setChapterId(c.id)}><span className="kc-chapter-icon">{c.icon}</span><span><small>CHƯƠNG {i+1}</small><strong>{c.place}</strong><em>{open ? `${done} / 8 nhiệm vụ` : 'Hoàn thành chương trước'}</em></span>{!open && <LockKeyhole size={15}/>}</button>; })}</nav>
            <section className="kc-chapter-section"><div className="kc-section-heading"><div><span className="kc-eyebrow">ĐIỂM ĐẾN TIẾP THEO</span><h2>{chapter.name}</h2><p>{chapter.description}</p></div><button className="kc-secondary" disabled={loading} onClick={practice}><Sparkles size={17}/>{loading?'Đang chuẩn bị…':'Khảo sát tự do'}</button></div>
                <div className="kc-mission-grid">{CAMPAIGN.filter(m=>m.chapter===chapterId).map(m=>{const done=progress.missions[m.id],open=unlocked(m),current=next?.id===m.id; return <button key={m.id} className={`kc-mission-card ${current?'current':''} ${done?'completed':''}`} disabled={!open} onClick={()=>choose(m)}><div className="kc-mission-card-top"><span className="kc-mission-number">{done?<Check size={20}/>:!open?<LockKeyhole size={17}/>:String(m.number).padStart(2,'0')}</span><div className="kc-small-stars">{[0,1,2].map(i=><Star key={i} size={14} fill={i<(done?.badges.length||0)?'currentColor':'none'} className={i<(done?.badges.length||0)?'earned':''}/>)}</div></div><h3>{m.title}</h3><p>{m.skill}</p><div className="kc-mission-bottom">{current?'Khám phá ngay':done?'Thử một cách khác':open?'Sẵn sàng lên đường':'Chưa mở'}{open?<ArrowRight size={16}/>:null}</div></button>;})}</div>
            </section><footer className="kc-map-footer"><span><Flag size={16}/> Mỗi lần thử là một phát hiện mới.</span><button onClick={onLegacy}>KidCoder phiên bản cũ</button></footer>
        </main>}
        {panel==='settings' && <Modal title="Tùy chọn" onClose={()=>setPanel(null)}><span className="kc-eyebrow">BUỒNG ĐIỀU KHIỂN</span><h2>Chơi theo cách của em</h2><div className="kc-settings">
            <label>Góc nhìn<select value={prefs.view} onChange={e=>setPrefs(p=>({...p,view:e.target.value as Preferences['view']}))}><option value="3d">Thế giới 3D</option><option value="2d">Bàn chơi 2D</option></select></label>
            <label>Độ chi tiết<select value={prefs.quality} onChange={e=>setPrefs(p=>({...p,quality:e.target.value as Quality}))}><option value="light">Nhẹ</option><option value="balanced">Cân bằng</option><option value="detailed">Đẹp hơn</option></select></label>
            <label>Âm thanh phản hồi<input type="checkbox" checked={prefs.sound} onChange={e=>{if(!e.target.checked)cancelSpeech();setPrefs(p=>({...p,sound:e.target.checked}));}}/></label>
            <label>Giảm chuyển động<input type="checkbox" checked={prefs.reduced} onChange={e=>setPrefs(p=>({...p,reduced:e.target.checked}))}/></label>
        </div><button className="kc-primary" onClick={()=>{setPanel('garage');}}>Chọn rover đồng hành <ArrowRight size={17}/></button></Modal>}
        {panel==='garage' && <Modal title="Đội rover" onClose={()=>setPanel(null)}><span className="kc-eyebrow">ĐỒNG ĐỘI CỦA EM</span><h2>Đội rover thám hiểm</h2><p className="kc-muted">Hoàn thành nhiệm vụ để gặp thêm những người bạn mới.</p><div className="kc-garage">{ROVERS.map(r=><button key={r.id} disabled={completed<r.needed} className={rover.id===r.id?'selected':''} onClick={()=>setPrefs(p=>({...p,rover:r.id}))}><RoverPortrait color={r.color}/><strong>{r.name}</strong><span>{completed<r.needed?<><LockKeyhole size={13}/>{r.needed} nhiệm vụ</>:rover.id===r.id?'✓ Đang đồng hành':'Chọn rover'}</span></button>)}</div></Modal>}
        {panel==='journal' && <Modal title="Sổ khám phá" onClose={()=>setPanel(null)}><span className="kc-eyebrow">NHỮNG ĐIỀU EM ĐÃ LÀM ĐƯỢC</span><h2>{completed===40?'Nhà thám hiểm tài ba!':'Sổ khám phá'}</h2><p className="kc-muted">{completed} nhiệm vụ · {Object.values(progress.missions).reduce((s,p)=>s+p.badges.length,0)} huy hiệu · {ROVERS.filter(r=>r.needed<=completed).length} rover đồng hành</p><div className="kc-journal">{CHAPTERS.map(c=>{const done=CAMPAIGN.filter(m=>m.chapter===c.id&&progress.missions[m.id]);return <article key={c.id}><span>{c.icon}</span><div><h3>{c.place} <small>{done.length}/8</small></h3><p>{done.length?done.at(-1)!.fact:'Một vùng đất mới đang chờ được khám phá.'}</p></div></article>;})}</div><button className="kc-primary" onClick={()=>setPanel('garage')}>Gặp đội rover <ArrowRight size={17}/></button></Modal>}
    </div>;
}

interface PlayProps { student: StudentProfile; mission: Mission; prefs: Preferences; rover: typeof ROVERS[number]; onExit: () => void; onNext: () => void; onFallback: () => void; onMode: () => void; exitRequest: React.MutableRefObject<(() => void) | null>; suspended: boolean; onSlow:()=>void }
function PlayMission({ student, mission, prefs, rover, onExit, onNext, onFallback, onMode, exitRequest, suspended, onSlow }: PlayProps) {
    const chapter=CHAPTERS.find(c=>c.id===mission.chapter)!, progress=readProgress(student.kidCoder), {completeKidCoder}=useStudentActions();
    const [program,setProgram]=useState<ProgramNode[]>(()=>readDraft(student.id,mission) ?? copyProgram(mission.starter||[]));
    const [brief,setBrief]=useState(!progress.missions[mission.id]&&!mission.practice), [hint,setHint]=useState(0), [showHelp,setShowHelp]=useState(false), [showResult,setShowResult]=useState(false), [speed,setSpeed]=useState(1);
    const [saved,setSaved]=useState<{ok:boolean;earned:number}|null>(null), [draftSaved,setDraftSaved]=useState(true);
    const session=useExecution(mission,program,speed), awarded=useRef<unknown>(null), seconds=useRef(0), prevSamples=useRef(0);
    const saveFn=useRef(completeKidCoder); saveFn.current=completeKidCoder;
    const programRef=useRef(program); programRef.current=program;
    const {frame}=session, board=mission.boards[frame.scenario], samples=board.samples.filter(s=>frame.world.scanned.includes(s.id)).length;
    useEffect(()=>{const t=setTimeout(()=>setDraftSaved(saveDraft(student.id,mission,program)),350);return()=>clearTimeout(t);},[student.id,mission,program]);
    useEffect(()=>{const t=setInterval(()=>{if(!document.hidden&&!brief&&!showResult&&!suspended&&(!session.run||session.playing))seconds.current++;},1000);return()=>clearInterval(t);},[brief,showResult,suspended,session.run,session.playing]);
    useEffect(()=>()=>cancelSpeech(),[]);
    useEffect(()=>()=>{saveDraft(student.id,mission,programRef.current);},[student.id,mission]);
    useEffect(()=>{if(suspended)session.pause();},[suspended]);
    useEffect(()=>{if(samples>prevSamples.current)tone('sample',prefs.sound);prevSamples.current=samples;},[samples,prefs.sound]);
    useEffect(()=>{
        if(!session.finished||!session.run?.success||awarded.current===session.run)return;
        awarded.current=session.run;
        const result=mission.practice?{ok:true,earned:0}:saveFn.current(student.id,mission,session.executedProgram,seconds.current);
        setSaved(result);setShowResult(true);tone('win',prefs.sound);
    },[session.finished,session.run,mission,student.id]);
    const change=(nodes:ProgramNode[])=>{session.reset();setSaved(null);setShowResult(false);setProgram(nodes);tone('click',prefs.sound);};
    const read=()=>{session.pause();speak(`${mission.title}. ${mission.brief} ${mission.hints[0]}`,{rate:.87});};
    const exit=()=>{if(saved&&!saved.ok){setShowResult(true);return;}saveDraft(student.id,mission,program);onExit();};
    exitRequest.current=exit;
    const showArea=(area:'world'|'code')=>{if(window.matchMedia('(max-width:760px)').matches)document.querySelector(`.kc-${area==='world'?'world':'code'}-panel`)?.scrollIntoView({block:'start',behavior:prefs.reduced?'auto':'smooth'});};
    const start=()=>{if(saved&&!saved.ok){setShowResult(true);return;}cancelSpeech();tone('click',prefs.sound);setShowResult(false);session.play();showArea('world');};
    const completedAtStart=useRef(Object.keys(progress.missions).length);
    const wasComplete=useRef(!!progress.missions[mission.id]);
    const newRover=ROVERS.find(r=>r.needed===completedAtStart.current+1&&!wasComplete.current&&!mission.practice);
    return <main className="kc-play">
        <div className="kc-mission-heading"><div><span className="kc-eyebrow">{chapter.place} <ChevronRight size={12}/> {mission.practice?'KHẢO SÁT TỰ DO':`NHIỆM VỤ ${mission.number} / 8`}</span><h1>{mission.title}</h1></div><button className="kc-secondary kc-list-button" onClick={exit}><Flag size={16}/> Hành trình</button></div>
        <div className="kc-workspace"><section className="kc-world-panel">
            <div className="kc-objectives"><span><Flag size={16}/> Về bến sáng</span>{board.samples.length>0&&<span className={samples===board.samples.length?'complete':''}><Gem size={16}/>{samples}/{board.samples.length} mẫu</span>}{board.devices.length>0&&<span className={frame.world.activated.length===board.devices.length?'complete':''}>ϟ {frame.world.activated.length}/{board.devices.length} thiết bị</span>}<button onClick={read} aria-label="Nghe nhiệm vụ" title="Nghe nhiệm vụ"><Volume2 size={18}/></button></div>
            <div className={`kc-scene ${prefs.reduced?'':'landing'}`}><div className="kc-scene-grid"/><div className="kc-coordinates">{chapter.icon} {chapter.place}<small>{board.size} × {board.size}</small></div><button className="kc-view-button" onClick={onMode} aria-label={prefs.view==='3d'?'Đổi sang bàn 2D':'Đổi sang thế giới 3D'}>{prefs.view==='3d'?'2D':'3D'}</button>
                {prefs.view==='3d'?<SceneBoundary onError={onFallback} fallback={<RoverBoard2D board={board} world={frame.world} color={rover.color}/>}><Suspense fallback={<div className="kc-loading"><Rocket size={30}/><span>Đang hạ cánh…</span></div>}><RoverBoard3D board={board} world={frame.world} chapter={mission.chapter} color={rover.color} reduced={prefs.reduced} scanning={frame.kind==='action'&&frame.message.includes('mẫu mới')} moving={session.playing} quality={prefs.quality} onUnavailable={onFallback} onSlow={onSlow}/></Suspense></SceneBoundary>:<RoverBoard2D board={board} world={frame.world} color={rover.color}/>}
                <div className="kc-scene-caption"><span className="kc-rover-dot" style={{background:rover.color}}/>{rover.name}<span>↑ theo hướng mũi tên</span></div>
            </div>
            {mission.boards.length>1&&<div className="kc-scenarios"><span>Cùng chương trình, {mission.boards.length} tình huống</span>{mission.boards.map((_,i)=><button key={i} disabled={session.playing} aria-pressed={frame.scenario===i} onClick={()=>session.preview(i)}>{i+1}</button>)}</div>}
            {mission.allowed.includes('if')&&<div className="kc-sensors"><span><i className={sense(board,frame.world,'clear')?'yes':''}/>Phía trước đi được: <b>{sense(board,frame.world,'clear')?'Đúng':'Sai'}</b></span><span><i className={sense(board,frame.world,'sample')?'yes':''}/>Có mẫu mới: <b>{sense(board,frame.world,'sample')?'Đúng':'Sai'}</b></span></div>}
            <div className={`kc-feedback ${frame.kind==='error'?'error':''}`} role="status" aria-live="polite"><div className="kc-buddy-icon">{frame.kind==='error'?'?':frame.kind==='end'?'✓':'✦'}</div><div><strong>{frame.kind==='error'?'Một phát hiện để sửa!':frame.context||(!session.run?'Sẵn sàng khám phá':'Rover đang làm gì?')}</strong><p>{!session.run&&mission.id==='earth-01'?mission.hints[0]:frame.message}</p></div></div>
            <div className="kc-board-footer"><button className="kc-text-button" onClick={()=>{session.pause();setShowHelp(true);}}><HelpCircle size={17}/> Cần một gợi ý?</button><span>{frame.world.actions} hành động{session.total>0?` · Bước ${session.cursor}/${session.total-1}`:''}</span></div>
            {mission.concept&&<p className="kc-concept-goal">✦ Huy hiệu Viết gọn: dùng {mission.concept==='repeat'?'Lặp':'Nếu'} và tối đa {mission.blockBudget} khối.</p>}
        </section><aside className="kc-code-panel"><ProgramEditor program={program} onChange={change} allowed={mission.allowed} disabled={session.playing||brief} activeId={session.playing||session.run?frame.nodeId:null} errorId={frame.kind==='error'?frame.nodeId:null} budget={mission.blockBudget}/>
            <div className="kc-run-controls"><div className="kc-mobile-nav"><button onClick={()=>showArea('world')}>◎ Xem bàn chơi</button><button onClick={()=>{session.pause();showArea('code');}}>≡ Sửa lệnh</button></div><div className="kc-run-options"><button aria-label="Về đầu chương trình" title="Về đầu · giữ lệnh" onClick={()=>{session.reset();setSaved(null);}}><RotateCcw size={18}/></button><button disabled={!session.cursor} aria-label="Xem bước trước" title="Xem bước trước" onClick={session.back}><SkipBack size={18}/></button><button disabled={!program.length||brief} onClick={()=>{cancelSpeech();session.step();showArea('world');}}><SkipForward size={17}/><span>Từng bước</span></button><select aria-label="Tốc độ chạy" value={speed} onChange={e=>setSpeed(Number(e.target.value))}><option value={.5}>0,5×</option><option value={1}>1×</option><option value={2}>2×</option></select></div>
                <button className="kc-run-button" disabled={!program.length||brief} onClick={session.playing?session.pause:start}>{session.playing?<Pause size={21} fill="currentColor"/>:<Play size={21} fill="currentColor"/>}{session.playing?'Tạm dừng':session.run&&!session.finished?'Tiếp tục':'Chạy chương trình'}<span>→</span></button>
                <p className="kc-draft-status">{draftSaved?'✓ Bản nháp tự lưu trên thiết bị':'Chưa lưu được bản nháp · giữ trang để tiếp tục'}{saved&&!saved.ok&&<button onClick={()=>setShowResult(true)}>Kết quả chưa lưu · thử lại</button>}</p>
            </div>
        </aside></div>
        {brief&&<Modal title="Chuẩn bị nhiệm vụ" onClose={()=>setBrief(false)}><div className="kc-brief-art"><PlanetOrb chapter={chapter} small/><RoverPortrait color={rover.color}/></div><span className="kc-eyebrow">{chapter.place} · BÀI {mission.number}</span><h2>{mission.title}</h2><p className="kc-brief-goal">{mission.brief}</p><div className="kc-brief-tip"><Sparkles size={20}/><p>{mission.hints[0]}</p></div><div className="kc-brief-actions"><button className="kc-primary" onClick={()=>{cancelSpeech();tone('click',prefs.sound);setBrief(false);}}>Bắt đầu khảo sát <ArrowRight size={19}/></button><button className="kc-icon-button" aria-label="Nghe hướng dẫn" onClick={read}><Volume2 size={21}/></button></div></Modal>}
        {showHelp&&<Modal title="Gợi ý nhiệm vụ" onClose={()=>setShowHelp(false)}><span className="kc-eyebrow">CÙNG NGHĨ MỘT CHÚT</span><h2>Một ý tưởng cho chuyến đi</h2><p className="kc-hint-text">{mission.hints[hint]}</p><div className="kc-hint-dots">{mission.hints.map((_,i)=><button key={i} onClick={()=>setHint(i)} aria-label={`Gợi ý ${i+1}`} className={hint===i?'active':''}>{i+1}</button>)}</div><div className="kc-command-help">{mission.allowed.map(c=><div key={c}><span style={{color:COMMANDS[c].color}}>{COMMANDS[c].icon}</span><p><b>{COMMANDS[c].label}</b>{COMMANDS[c].help}</p></div>)}</div><button className="kc-primary" onClick={()=>setShowHelp(false)}>Để em thử! <ArrowRight size={18}/></button></Modal>}
        {showResult&&session.run?.success&&<Modal title="Hoàn thành nhiệm vụ" dismissible={saved?.ok!==false} onClose={()=>{if(saved?.ok)setShowResult(false);}}><div className="kc-success-art"><div>✦</div><RoverPortrait color={rover.color}/>{!prefs.reduced&&Array.from({length:12},(_,i)=><i key={i} style={{'--i':i} as React.CSSProperties}/>)}</div><span className="kc-eyebrow">MỘT CHUYẾN ĐI, THÊM MỘT KHÁM PHÁ</span><h2>{mission.number===8?'Dấu mốc mới của em!':'Rover đã về trạm!'}</h2><p className="kc-muted">{mission.fact}</p><div className="kc-result-badges">{[{id:'complete',name:'Hoàn thành',detail:'Đủ mục tiêu'},{id:'explorer',name:'Khéo léo',detail:`≤ ${mission.actionBudget} hành động`},{id:'coder',name:'Viết gọn',detail:`≤ ${mission.blockBudget} khối`}].map(b=><div key={b.id} className={session.run!.badges.includes(b.id)?'earned':''}><Star size={27} fill={session.run!.badges.includes(b.id)?'currentColor':'none'}/><strong>{b.name}</strong><small>{b.detail}</small></div>)}</div>
            <div className="kc-saved-result" role="status">{saved?.ok?(mission.practice?'Khảo sát tự do hoàn thành · không dùng sao':saved.earned?`Đã lưu thành tích · +${saved.earned} sao mới`:'Đã lưu · huy hiệu này đã được nhận trước đó'):'Chưa lưu được kết quả. Thử lưu lại để giữ thành tích nhé.'}</div>
            {newRover&&saved?.ok&&<p className="kc-unlock">✦ Đã mở rover {newRover.name} trong đội đồng hành!</p>}
            {saved&&!saved.ok?<button className="kc-primary" onClick={()=>setSaved(completeKidCoder(student.id,mission,session.executedProgram,seconds.current))}>Thử lưu lại</button>:<button className="kc-primary" onClick={onNext}>{mission.practice?'Khảo sát một nơi khác':mission.id==='station-08'?'Xem sổ hành trình':mission.number===8?'Khám phá chương mới':'Nhiệm vụ tiếp theo'}<ArrowRight size={18}/></button>}
            <div className="kc-result-actions"><button disabled={saved?.ok===false} onClick={()=>{setShowResult(false);session.reset();}}>Thử cách khác</button><button onClick={onExit}>{saved&&!saved.ok?'Rời bài, bỏ kết quả chưa lưu':'Về hành trình'}</button></div>
        </Modal>}
    </main>;
}
