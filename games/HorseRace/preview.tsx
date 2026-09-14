import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {HorseRace} from './HorseRaceGame';
import type {StudentProfile} from '../../types';
import {newMatch} from './engine';
import type {Match,Player} from './model';
const profile:StudentProfile={id:'horse-race-dev-preview',name:'Minh Anh',age:8,grade:3,avatarId:0,currentAvatarId:'avatar_01',currentThemeId:'default',stars:0,ownedAvatarIds:[],ownedThemeIds:[],ownedImageIds:[],history:[],gameHistory:[],shopDailyPhotos:[]};
function Preview(){const [sound,setSound]=useState(false),[music,setMusic]=useState(false),[run,setRun]=useState(0),[fixture,setFixture]=useState<Match|undefined>();
 const setup=(kind:string)=>{const players:Player[]=Array.from({length:4},(_,i)=>({id:'p'+i,name:['Minh Anh','Bông','Máy Lá','Máy Sao'][i],color:i,kind:i>1?'bot':'human',level:'hard',avatar:'avatar_0'+(i+1)}));let s=newMatch(profile.id,players,crypto.randomUUID(),0);if(kind==='capture'){s={...s,pieces:[4,23,-1,-1,49,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],dice:3,phase:'choose'};}if(kind==='finish'){s={...s,pieces:[61,60,59,55,...Array(12).fill(-1)],locked:[true,true,true,false,...Array(12).fill(false)],finished:[3,0,0,0],dice:3,phase:'choose'};}if(kind==='board'){s={...s,pieces:[0,8,-1,-1,2,20,-1,-1,3,23,-1,-1,7,18,-1,-1]};}setFixture(s);setRun(v=>v+1);};
 return <><details className='hr-dev-tools'><summary>DEV · Kiểm thử cờ cá ngựa</summary><button onClick={()=>setup('board')}>Bàn 4 người</button><button onClick={()=>setup('capture')}>Tình huống đá ngựa</button><button onClick={()=>setup('finish')}>Tình huống thắng</button><button onClick={()=>{setFixture(undefined);setRun(v=>v+1);}}>Màn chuẩn bị</button><button onClick={()=>document.querySelector('canvas')?.getContext('webgl2')?.getExtension('WEBGL_lose_context')?.loseContext()}>Mất WebGL</button></details><HorseRace key={run} student={profile} manageMusic={false} initialMatch={fixture} onExit={()=>{setFixture(undefined);setRun(v=>v+1);}} complete={()=>({ok:true})} sound={{soundEnabled:sound,musicEnabled:music,toggleSound:()=>setSound(v=>!v),toggleMusic:()=>setMusic(v=>!v)}}/></>;
}
const root:ReturnType<typeof createRoot>=import.meta.hot?.data.root??createRoot(document.getElementById('root')!);
if(import.meta.hot)import.meta.hot.data.root=root;
root.render(<React.StrictMode><Preview/></React.StrictMode>);
