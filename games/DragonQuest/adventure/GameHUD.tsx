import React, { useEffect, useState } from 'react';
import { Camera, Crosshair, Map, PersonStanding, Sparkles, Sword, Trophy, Wind, Volume2, VolumeX, Music2 } from 'lucide-react';
import { Session } from './model';
import { CameraMode } from './worldLayout';
import { nodeOf } from './engine';
import { getBuffDescription, getBuffName } from '../engine/buffs';
import { BuffType } from '../engine/types';

const PIPS:Record<number,number[]>={1:[4],2:[0,8],3:[0,4,8],4:[0,2,6,8],5:[0,2,4,6,8],6:[0,2,3,5,6,8]};
export function GameHUD({s,ready,roll,camera,overview,setCamera,setOverview,recenter,blocked,music,sound,toggleMusic,toggleSound}:{
 s:Session;ready:boolean;roll:()=>void;camera:CameraMode;overview:boolean;setCamera:(c:CameraMode)=>void;setOverview:(v:boolean)=>void;recenter:()=>void;blocked:boolean;
 music:boolean;sound:boolean;toggleMusic:()=>void;toggleSound:()=>void;
}){
 const node=nodeOf(s),rolling=s.phase==='rolling',face=rolling?Math.floor(s.phaseMs/130)%6+1:s.dice||1;
 const [help,setHelp]=useState(false),[toast,setToast]=useState('');
 useEffect(()=>{if(s.phase!=='feedback')return;setToast(s.feedback?.correct?`+${s.feedback.score} điểm${s.feedback.buff?' · '+getBuffName(s.feedback.buff):''}`:'Cố lên, nhà thám hiểm!');const t=setTimeout(()=>setToast(''),2300);return()=>clearTimeout(t);},[s.phase,s.fx]);
 const travelling=['rolling','moving','landing'].includes(s.phase);
 return <div className="dq-hud" inert={blocked?true:undefined}>
  <div className="dq-quest-status"><span>HÀNH TRÌNH RỒNG THẦN</span><strong>Ô {node.index+1}<small> / 50</small><b><Sparkles size={15}/>{s.score}</b></strong><div className="dq-hud-progress"><i style={{width:`${(node.index+1)*2}%`}}/></div><p>{node.title}</p></div>
  <div className="dq-camera-controls" aria-label="Góc nhìn bản đồ">
   <button aria-pressed={camera==='follow'&&!overview} onClick={()=>{setOverview(false);setCamera('follow');recenter();}} title="Camera theo nhân vật"><PersonStanding size={19}/><span>Theo nhân vật</span></button>
   <button aria-pressed={camera==='free'&&!overview} onClick={()=>{setOverview(false);setCamera('free');}} title="Kéo để xoay, cuộn hoặc chụm để thu phóng"><Camera size={19}/><span>3D tự do</span></button>
   <button aria-pressed={overview} onClick={()=>setOverview(!overview)} title="Xem toàn bộ 50 ô"><Map size={19}/><span>Toàn cảnh</span></button>
   <button onClick={()=>{setOverview(false);recenter();}} aria-label="Về vị trí nhân vật"><Crosshair size={19}/></button>
  </div>
  <div className="dq-bag"><button className="dq-bag-toggle" aria-expanded={help} onClick={()=>setHelp(!help)}><Sword size={18}/><b>{s.buffs.holySword}</b><Trophy size={18}/><b>{s.buffs.holyGrail}</b><Wind size={18}/><b>{s.buffs.flyingCloak?'✓':'—'}</b><span>Túi phép</span></button>{help&&<div className="dq-bag-details">{[BuffType.HolySword,BuffType.HolyGrail,BuffType.FlyingCloak].map(b=><p key={b}><strong>{getBuffName(b)}</strong>{getBuffDescription(b)}</p>)}</div>}<div className="dq-audio-controls"><button onClick={toggleMusic} aria-label={music?'Tắt nhạc nền':'Bật nhạc nền'} aria-pressed={music}><Music2 size={17}/></button><button onClick={toggleSound} aria-label={sound?'Tắt hiệu ứng âm thanh':'Bật hiệu ứng âm thanh'} aria-pressed={sound}>{sound?<Volume2 size={17}/>:<VolumeX size={17}/>}</button></div></div>
  <div className={`dq-dice-dock ${rolling?'rolling':''}`}>
   <div className={`dq-die ${rolling?'is-rolling':''}`} role="img" aria-label={rolling?'Xúc xắc đang quay':`Xúc xắc ${s.dice||'chưa gieo'}`}><div>{Array.from({length:9},(_,i)=><span key={i} className={PIPS[face].includes(i)?'pip':''}/>)}</div></div>
   <div><small>{rolling?'Đang gieo…':travelling?`Đến ô ${s.target+1}`:`Lượt ${s.turn+1}`}</small><button className="dq-primary" disabled={!ready||s.phase!=='readyToRoll'||s.paused} onClick={roll}>{s.phase==='readyToRoll'?'Gieo xúc xắc':travelling?'Đang di chuyển…':'Đang khám phá'}</button></div>
  </div>
  {s.turn===0&&s.phase==='readyToRoll'&&<p className="dq-first-step">Hành trình bắt đầu từ một lần gieo ✦</p>}
  {toast&&<div className="dq-score-toast" role="status" key={s.fx}>{toast}</div>}
 </div>;
}
