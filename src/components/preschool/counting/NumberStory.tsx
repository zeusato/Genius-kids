import React, { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowRight, Hand, MoveRight, Paintbrush, PencilLine } from 'lucide-react';
import { EN, VI, type Session } from './model';
import { storyFor } from './learnStories';
import { storyComplete } from './learnStoryModel';
import './number-stories.css';

const COLORS=['#d68c72','#d6b75b','#6b9e91'];
const positions:Record<number,number[][]>={
    2:[[32,54],[68,54]], 3:[[23,40],[50,58],[77,35]],
    4:[[33,28],[62,27],[24,53],[73,51]],
    5:[[21,32],[50,38],[79,29],[34,67],[70,66]],
    6:[[24,35],[50,35],[76,35],[24,68],[50,68],[76,68]],
    7:[[15,40],[32,23],[48,45],[66,27],[84,43],[66,72],[35,71]],
    8:[[64,25],[84,25],[64,43],[84,43],[64,61],[84,61],[64,79],[84,79]],
    9:[[23,27],[50,27],[77,27],[23,51],[50,51],[77,51],[23,75],[50,75],[77,75]],
    10:[[14,33],[32,33],[50,33],[68,33],[86,33],[14,68],[32,68],[50,68],[68,68],[86,68]],
};

function StoryBackdrop({value}:{value:number}) {
    return <svg className="ns-backdrop" viewBox="0 0 1000 520" preserveAspectRatio="none" aria-hidden="true">
        {value===1?<><path d="M0 360Q220 235 510 360T1000 340V520H0" fill="#adc59d"/><path d="M0 450Q270 330 600 440T1000 400V520H0" fill="#7ca28b"/></>:
        value===2?<><path d="M0 370Q280 325 550 375T1000 350V520H0" fill="#bfd0a1"/><path d="M0 470Q350 420 1000 450V520H0" fill="#91b08a"/><path d="M70 420V220M930 420V220M25 255H150M850 255H975" stroke="#f1e2ba" strokeWidth="18" strokeLinecap="round"/></>:
        value===3?<><path d="M0 65Q500 200 1000 65" fill="none" stroke="#b69573" strokeWidth="3"/>{[80,200,320,440,560,680,800,920].map((x,i)=><path key={x} d={`M${x} ${78+Math.sin(i/7*Math.PI)*52}l34 5 -22 44Z`} fill={COLORS[i%3]}/>)}<path d="M0 460Q500 405 1000 460V520H0" fill="#d6dcb5"/></>:
        value===4?<><path d="M0 450Q500 390 1000 450V520H0" fill="#aec395"/><path d="M475 455L470 245 285 135M480 365L190 340M485 365L660 320M480 245L630 100" stroke="#ad8157" strokeWidth="38" strokeLinecap="round" fill="none"/><path d="M480 455L520 455" stroke="#ad8157" strokeWidth="50" strokeLinecap="round"/></>:
        value===5?<><path d="M0 50Q100 20 200 50T400 50T600 50T800 50T1000 50" stroke="#e3f4ed" strokeWidth="12" fill="none"/><path d="M0 460Q400 390 1000 465V520H0" fill="#dcd3a5"/>{[60,110,875,930].map((x,i)=><path key={x} d={`M${x} 480Q${x-35} 400 ${x+10} ${300+i%2*70}`} fill="none" stroke={i%2?'#80b096':'#5c9485'} strokeWidth="17" strokeLinecap="round"/>)}<circle cx="140" cy="140" r="12" fill="none" stroke="#d5f0e8" strokeWidth="3"/><circle cx="890" cy="225" r="8" fill="none" stroke="#d5f0e8" strokeWidth="3"/></>:
        value===6?<><path d="M0 50H1000M0 200H1000M0 350H1000M0 500H1000" stroke="#ceb28a" strokeWidth="3" opacity=".4"/><path d="M0 470Q500 400 1000 470V520H0" fill="#dbc98a"/></>:
        value===7?<><path d="M850 65a45 45 0 1 0 55 55 40 40 0 0 1-55-55" fill="#efe3ae"/><path d="M0 470Q180 370 400 470T1000 455V520H0" fill="#344f62"/></>:
        value===8?<><path d="M0 435H1000V520H0" fill="#c5a37d"/><path d="M0 455H1000M380 435V520M780 435V520" stroke="#aa8865" strokeWidth="3"/><rect x="445" y="70" width="500" height="355" rx="35" fill="#e3d7be" stroke="#d5c6a8" strokeWidth="4"/></>:
        value===9?<><path d="M0 470Q500 390 1000 470V520H0" fill="#bac79b"/><path d="M65 440Q130 355 60 265M930 440Q870 320 955 240" stroke="#8fa682" strokeWidth="12" fill="none" strokeLinecap="round"/></>:
        <><path d="M0 470Q500 420 1000 470V520H0" fill="#c9bca3"/><circle cx="865" cy="68" r="28" fill="#e8d49e"/><ellipse cx="865" cy="68" rx="52" ry="11" fill="none" stroke="#bda875" strokeWidth="5"/><path d="M55 85h12m-6-6v12M735 115h10m-5-5v10M355 62h10m-5-5v10" stroke="#e9dfbd" strokeWidth="3"/></>}
    </svg>;
}

function Face({x=60,y=55}:{x?:number;y?:number}) {
    return <g fill="#43554a"><circle cx={x-9} cy={y} r="2.7"/><circle cx={x+9} cy={y} r="2.7"/><path d={`M${x-5} ${y+9}q5 5 10 0`} fill="none" stroke="#43554a" strokeWidth="2.3" strokeLinecap="round"/></g>;
}

function StoryTool({watering}:{watering:boolean}) {
    return <svg width="46" height="42" viewBox="0 0 64 56" aria-hidden="true">
        {watering?<><path d="M17 26C-1 7 9 1 23 14" fill="none" stroke="#638f8c" strokeWidth="6"/><path d="M35 28L55 13l5 8-21 25" fill="#7fa6a0"/><path d="M13 18h25l5 30H8Z" fill="#7fa6a0" stroke="#638f8c" strokeWidth="2"/><path d="M14 20h23" stroke="#c4d8c6" strokeWidth="4"/><path d="M54 11l8 12" stroke="#638f8c" strokeWidth="5" strokeLinecap="round"/><path d="M59 31v6M52 34v7" stroke="#8bbdc7" strokeWidth="3" strokeLinecap="round"/></>:<><rect x="14" y="8" width="36" height="43" rx="7" fill="#d9bc77" stroke="#b69b63" strokeWidth="2"/><rect x="12" y="5" width="40" height="9" rx="4" fill="#7fa6a0"/><path d="M32 21q-13 0-13 9t13 9q8 0 10-9-2-9-10-9M41 30l8-7v14Z" fill="#f8edcb"/><circle cx="27" cy="28" r="2" fill="#638f8c"/></>}
    </svg>;
}

function Picture({kind,done,tone,cracked=false}:{kind:string;done:boolean;tone:string;cracked?:boolean}) {
    return <svg viewBox="0 0 120 140" aria-hidden="true" className="ns-picture">
        {kind==='flowers'?<><path d="M60 122V68M60 103Q27 72 29 95Q30 110 60 113M60 100Q95 71 94 93Q90 109 60 109" fill="#79a27b" stroke="#638e68" strokeWidth="4"/>{done?<g className="ns-bloom">{[0,60,120,180,240,300].map(a=><ellipse key={a} cx="60" cy="38" rx="14" ry="23" transform={`rotate(${a} 60 61)`} fill={tone}/>)}<circle cx="60" cy="61" r="17" fill="#f2d381"/><Face y={59}/></g>:<><path d="M60 72Q25 70 32 38Q45 35 60 53Q76 28 90 39Q92 70 60 72" fill={tone}/><path d="M60 73V50" stroke="#ac7969" strokeWidth="2"/></>}<ellipse cx="60" cy="128" rx="34" ry="6" fill="#6b8a612e"/>{done&&<g className="ns-water"><path d="M31 9l-5 17M48 1l-5 17M65 8l-5 17" stroke="#82bec8" strokeWidth="5" strokeLinecap="round"/></g>}</>:
        kind==='balloons'?done?<g className="ns-pop"><path d="M60 45V27M90 60l18-4M80 87l13 15M39 87l-13 14M28 58l-18-3" stroke={tone} strokeWidth="5" strokeLinecap="round"/><path d="M52 79l8-8 9 8" fill={tone}/></g>:<><path d="M60 105q-18 12 0 27" fill="none" stroke="#ae9275" strokeWidth="2"/><ellipse cx="60" cy="56" rx="40" ry="48" fill={tone}/><ellipse cx="42" cy="35" rx="8" ry="17" fill="#fff" opacity=".4" transform="rotate(28 42 35)"/><path d="M60 101l-7 10h14Z" fill={tone}/><Face/></>:
        kind==='leaves'?<><path d="M22 104Q4 25 102 18Q120 107 22 104Z" fill={done?'#e0b35f':tone} stroke="#6e9364" strokeWidth="3"/><path d="M14 119L90 33M37 90L32 56M50 75L79 74M66 56L63 36" fill="none" stroke={done?'#aa7c3c':'#b8d299'} strokeWidth="4" strokeLinecap="round"/></>:
        kind==='fish'?<g className={done?'ns-fed':''}><path d="M88 62l26-24v51Z" fill={tone}/><ellipse cx="57" cy="64" rx="40" ry="28" fill={tone}/><path d="M54 38L70 20l10 25M58 89l17 12 5-20" fill={tone}/><path d="M73 47q12 18 0 34" fill="none" stroke="#fff" strokeWidth="5" opacity=".4"/><circle cx="39" cy="57" r="5" fill="#fff"/><circle cx="38" cy="57" r="2.5" fill="#354b49"/><path d="M25 71q8 5 13 0" fill="none" stroke="#765443" strokeWidth="2"/>{done&&<path d="M43 15q-9-12-16-3q-5 8 16 18q21-10 16-18q-7-9-16 3" fill="#dba68a"/>}</g>:
        kind==='eggs'?<><ellipse cx="60" cy="123" rx="49" ry="11" fill="#bb9758"/><path d="M15 123l90-4M22 131l76-6" stroke="#e1c083" strokeWidth="3"/>{done?<g className="ns-hatch"><ellipse cx="60" cy="90" rx="33" ry="29" fill="#efd074"/><circle cx="60" cy="56" r="29" fill="#f4d984"/><path d="M43 28l9-12 9 13 8-11 9 15" fill="#f4d984"/><Face y={51}/><path d="M54 61h12l-6 7Z" fill="#c88a49"/><path d="M22 116l10-17 15 10 12-11 16 11 14-11 11 18" fill="#fff8e4"/></g>:<><path d="M23 89C22 45 45 18 60 18S98 45 97 89Q97 122 60 123Q23 122 23 89Z" fill="#fff5dc" stroke="#d9c3a0" strokeWidth="3"/>{cracked?<path d="M29 71l20 7-4 16 21-7 14 11 15-7" fill="none" stroke="#aa8b67" strokeWidth="3"/>:<><ellipse cx="44" cy="72" rx="6" ry="9" fill="#dfc9a1"/><ellipse cx="76" cy="48" rx="4" ry="6" fill="#dfc9a1"/></>}</>}</>:
        kind==='stars'?<><path d="M60 13l14 35 38 3-29 25 9 37-32-20-32 20 9-37-29-25 38-3Z" fill={done?'#f2d68d':'#a6b8ba'} stroke={done?'#fae8b3':'#cad2c1'} strokeWidth="3"/>{done&&<Face y={62}/>}</>:
        kind==='blocks'?<><path d="M12 39l17-17h77L90 39Z" fill="#e4cfa7"/><rect x="12" y="39" width="78" height="65" rx="6" fill={tone}/><path d="M90 39l16-17v64l-16 18Z" fill="#af906c"/><path d="M24 56h48M24 66h26" stroke="#fff6d9" strokeWidth="3" opacity=".35"/></>:
        kind==='butterflies'?<g className={done?'ns-flutter':''} fill={done?tone:'#e6deca'} stroke={done?'#a9785b':'#bdb79e'} strokeWidth="2"><path d="M57 62C25 1-14 47 30 80C2 114 48 132 59 82M63 62C95 1 134 47 90 80C118 114 72 132 61 82"/><path d="M58 48Q60 38 51 32M62 48Q60 38 69 32" fill="none"/><ellipse cx="60" cy="71" rx="6" ry="30" fill="#79654f"/>{done&&<g fill="#fff1cf" stroke="none"><circle cx="30" cy="58" r="10"/><circle cx="90" cy="58" r="10"/><circle cx="40" cy="99" r="7"/><circle cx="80" cy="99" r="7"/></g>}</g>:
        <><ellipse cx="60" cy="130" rx="38" ry="6" fill="#a8967f"/><g className={done?'ns-rocket-launched':''}><path d="M45 97l-9 23 24-8 24 8-9-23" fill="#e4b159"/><path d="M35 77l-13 30 20-4M85 77l13 30-20-4" fill={tone}/><path d="M60 9Q95 38 84 96H36Q25 38 60 9Z" fill="#f7eed9" stroke="#cdbb96" strokeWidth="2"/><path d="M60 9Q74 24 78 35H42Q46 24 60 9" fill={tone}/><circle cx="60" cy="58" r="15" fill="#9bbdb4" stroke="#cfad72" strokeWidth="5"/><path d="M52 101l8 25 8-25" fill="#f1c774"/></g>{done&&<path d="M51 70l-5 35M67 74l4 30" className="ns-exhaust" stroke="#e3c688" strokeWidth="3"/>}</>}
    </svg>;
}

function RocketButton({disabled,children,onLaunch,label,style}:{disabled:boolean;children:React.ReactNode;onLaunch:()=>void;label:string;style:CSSProperties}) {
    const timer=useRef<ReturnType<typeof setTimeout>|null>(null),pointer=useRef<number|null>(null),[charging,setCharging]=useState(false);
    const clear=()=>{if(timer.current)clearTimeout(timer.current);timer.current=null;pointer.current=null;setCharging(false);};
    useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current);},[]);
    return <button className={'ns-target ns-rocket '+(disabled?'is-done ':'')+(charging?'charging':'')} style={style} disabled={disabled} aria-label={label}
        onPointerDown={e=>{if(disabled||pointer.current!==null||e.button!==0)return;e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);pointer.current=e.pointerId;setCharging(true);timer.current=setTimeout(()=>{clear();onLaunch();},650);}}
        onPointerUp={clear} onPointerCancel={clear} onLostPointerCapture={clear} onClick={e=>{if(e.detail===0&&!disabled){clear();onLaunch();}}}>{children}<i className="ns-charge"/></button>;
}

export function NumberStory({session,onAction,onTrace}:{session:Session;onAction:(index:number,paint?:number)=>void;onTrace:()=>void}) {
    const value=session.rounds[session.index].value,story=storyFor(value),complete=storyComplete(session);
    const [tool,setTool]=useState(false),[paint,setPaint]=useState(0),[cloud,setCloud]=useState(complete?100:0);
    const selected=tool || (value!==2&&value!==5),done=session.collected;
    const styleAt=(i:number):CSSProperties=>({'--x':`${positions[value][i][0]}%`,'--y':`${positions[value][i][1]}%`,'--wide-x':`${49+(i%4)*14}%`,'--wide-y':`${i<4?30:68}%`,'--tone':COLORS[i%3]} as CSSProperties);
    const countBadge=(i:number)=>done.includes(i)?<span className="ns-count-badge">{done.indexOf(i)+1}</span>:null;
    return <div className={'ns-story ns-'+story.id}>
        <div className="ns-story-top"><span><b>{value}</b><span>{VI[value]} · {EN[value]}<small>{story.noun}</small></span></span><strong aria-label={`Đã đếm ${done.length} trên ${value}`}>{done.length}<small> / {value}</small></strong><button className={'nc-primary ns-trace-next '+(complete?'ready':'')} disabled={!complete} onClick={onTrace}><PencilLine size={20}/>Tập tô số {value}<ArrowRight size={18}/></button></div>
        {<div className="ns-tools">
            {complete?<span>Đã đếm đủ {value} {story.noun}</span>:(value===2||value===5)?<><button className={tool?'ns-tool selected':'ns-tool'} aria-pressed={tool} onClick={()=>setTool(true)}><StoryTool watering={value===2}/><span>{value===2?'Bình tưới':'Thức ăn cho cá'}</span>{!tool&&<Hand size={19}/>}</button><span>{tool?(value===2?'Tưới từng bông hoa nhé':'Mời từng bạn cá ăn nào'):'Chạm để cầm lên'}<ArrowRight size={17}/></span></>:
            value===9?<><Paintbrush size={25}/><span>Chọn màu</span>{COLORS.map((color,i)=><button key={color} className={'ns-paint '+(paint===i+1?'selected':'')} style={{background:color}} aria-label={['Màu hồng','Màu vàng','Màu xanh'][i]} aria-pressed={paint===i+1} onClick={()=>setPaint(i+1)}>{paint===i+1&&<Paintbrush size={22}/>}</button>)}</>:
            <><Hand size={21}/><span>{value===1?'Kéo mây để mặt trời thức dậy':value===6?'Gõ hai lần: cốc, cốc!':value===7?'Chạm ngôi sao sáng tiếp theo':value===8?'Xếp từng khối lên tháp':value===10?'Giữ tay để nạp năng lượng':value===3?'Chọc bóng: bụp!':'Tìm từng chiếc lá trên cành'}</span></>}
        </div>}
        <div className={'ns-stage '+(complete?'ns-complete':'')} aria-label={story.title}>
            <StoryBackdrop value={value}/>
            {value===1?<div className="ns-sun-game"><svg viewBox="0 0 320 220" aria-hidden="true"><g className={complete?'ns-sun awake':'ns-sun'}>{Array.from({length:12},(_,i)=><path key={i} d="M160 24V9" transform={`rotate(${i*30} 160 104)`} stroke="#dbb45c" strokeWidth="8" strokeLinecap="round"/>)}<circle cx="160" cy="104" r="64" fill="#efcf80"/><Face x={160} y={102}/></g><g style={{transform:`translateX(${cloud*2}px)`,opacity:1-cloud/120}} className="ns-cloud"><path d="M60 165Q25 140 56 119Q45 85 90 90Q119 44 153 88Q204 70 214 112Q255 133 223 160Z" fill="#f5f2e6" stroke="#dddccc" strokeWidth="3"/></g></svg><div className="ns-sun-slider"><Hand size={21}/><input type="range" min="0" max="100" value={complete?100:cloud} disabled={complete} aria-label="Kéo mây sang phải" onChange={e=>{const amount=Number(e.target.value);setCloud(amount);if(amount>=95&&!complete)onAction(0);}}/><MoveRight size={24}/></div>{complete&&<span className="ns-sun-one">1</span>}</div>:
            <>{value===7&&<svg className="ns-constellation" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polyline points={positions[7].slice(0,done.length).map(p=>p.join(',')).join(' ')} fill="none" stroke="#edd497" strokeWidth=".5" strokeDasharray="1.5 1"/></svg>}
                {value===8&&<div className="ns-tower" aria-label={`Tòa tháp ${done.length} tầng`}>{done.map((item,i)=><div key={item} className="ns-tower-block" style={{'--floor':i,bottom:i*28,background:COLORS[item%3]} as CSSProperties}>{i+1}</div>)}<span/></div>}
                {Array.from({length:value},(_,i)=>{
                    const finished=done.includes(i),steps=session.storySteps?.[i]||0;
                    const label=`${story.action} ${i+1}`;
                    const picture=<><Picture kind={story.id} done={finished} cracked={steps===1} tone={value===4?'#8cac71':value===9?COLORS[Math.max(0,steps-1)]:COLORS[i%3]}/>{countBadge(i)}{!finished&&i===done.length&&value!==9&&<Hand className="ns-hand-hint" size={20}/>}</>;
                    if(value===10)return <RocketButton key={i} disabled={finished} label={label} style={styleAt(i)} onLaunch={()=>onAction(i)}>{picture}</RocketButton>;
                    return <button key={i} className={'ns-target '+(finished?'is-done ':'')+(value===7&&i===done.length?'ns-next-star':'')} style={styleAt(i)} aria-label={value===6&&!finished&&steps===1?`Gõ tiếp quả trứng ${i+1}`:label} disabled={finished||!selected||value===9&&!paint||value===7&&i!==done.length} onClick={()=>onAction(i,paint||1)}>{picture}</button>;
                })}
            </>}
        </div>
        <div className={'ns-result '+(complete?'ready':'')} aria-live="polite"><div className="ns-count-trail" aria-hidden="true">{Array.from({length:value},(_,i)=><span key={i} className={i<done.length?'filled':''}>{i<done.length?i+1:''}</span>)}</div>{complete&&<p>{story.complete}</p>}</div>
    </div>;
}
