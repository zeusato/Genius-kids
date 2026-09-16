import React, { useId } from 'react';
import { ArrowDown, ArrowRight, Equal, Hand, Headphones, Plus, PencilLine } from 'lucide-react';
import type { Activity, Round } from './model';
export const toyUrl=(object:string)=>`${import.meta.env.BASE_URL}preschool/alphabet-games/objects/${object}.webp`;
export function Toy({name,className=''}:{name:string;className?:string}) {return <img className={'nc-toy '+className} src={toyUrl(name)} alt="" draggable={false} onError={e=>{e.currentTarget.style.visibility='hidden';e.currentTarget.parentElement?.setAttribute('data-image-error','Ảnh chưa tải được');}}/>;}
export function Demo({activity}:{activity:Activity}) {return <div className={'nc-demo nc-demo-'+activity} aria-hidden="true">
    {activity==='learn'?<><span className="nc-demo-digit">3</span><ArrowRight/><PencilLine size={36}/><span className="nc-demo-dots">•••</span></>:activity==='pick'?<><Headphones size={38}/><i className="nc-sound-waves"/><span className="nc-demo-boat">3</span></>:activity==='compare'?<><span className="nc-demo-dots">••</span><Equal/><span className="nc-demo-dots">••</span></>:activity==='add'?<><Toy name="cake"/><Plus/><Toy name="cake"/><ArrowRight/><b>2</b></>:<><Toy name="apple"/><ArrowDown/><span className="nc-mini-basket"/></>}
    <Hand className="nc-demo-hand" size={28}/>
    </div>;}
export function World({activity,variant=0}:{activity:Activity;variant?:number}) {
    const id=useId().replace(/:/g,'');
    const sky=activity==='pick'?'#cde9e7':activity==='add'?'#f8e7ce':activity==='compare'?'#e5e8cb':'#e3ebd6';
    return <svg className="nc-world" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><pattern id={id} width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".5" fill="#5f563a" opacity=".08"/></pattern></defs><rect width="1000" height="600" fill={sky}/>
        {activity==='pick'?<><circle cx="770" cy="105" r="52" fill="#f7d892"/><path d="M0 300Q200 230 400 300T1000 290V600H0" fill="#a0cfce"/><path d="M0 390Q200 340 450 405T1000 380V600H0" fill="#6eaaa9"/><path d="M0 510Q250 455 520 510T1000 480V600H0" fill="#dce9ca"/>{[140,350,660,850].map((x,i)=><path key={x} d={`M${x} ${360+i%2*90}q25 14 50 0`} fill="none" stroke="#e3f4e9" strokeWidth="5" strokeLinecap="round"/>)}<path d="M75 300L95 130H140L160 300Z" fill="#f9f3df"/><path d="M85 220H150M90 180H145" stroke="#b77e60" strokeWidth="22"/><path d="M83 133L117 94L151 133Z" fill="#4b7067"/><rect x="105" y="132" width="25" height="25" fill="#edc276"/></>:activity==='add'?<><rect x="60" y="95" width="880" height="385" rx="20" fill="#fff6e4"/><rect x="75" y="130" width="850" height="230" fill="#dfd3b7"/>{[150,440,730].map(x=><g key={x}><rect x={x} y="170" width="125" height="150" rx="50" fill="#b7ccc0"/><path d={`M${x+62} 170V320M${x} 245h125`} stroke="#fff7e9" strokeWidth="12"/></g>)}<path d="M40 95H960L930 40H70Z" fill="#759a80"/>{Array.from({length:10},(_,i)=><path key={i} d={`M${50+i*90} 95v25q45 40 90 0V95`} fill={i%2?'#f9e7c5':'#d48e71'}/>)}<rect y="425" width="1000" height="175" fill="#bc9167"/><path d="M0 455H1000M0 530H1000" stroke="#a07855" strokeWidth="3"/></>:activity==='compare'?<><path d="M0 340Q150 195 400 330T1000 270V600H0" fill="#b9c990"/><path d="M0 460Q200 325 470 440T1000 400V600H0" fill="#91ab82"/><path d="M120 370L175 160L245 370M175 160H360L410 370" fill="none" stroke="#9d7955" strokeWidth="14" strokeLinecap="round"/><path d="M230 165V285M295 165V285" stroke="#ece3bf" strokeWidth="5"/><path d="M215 290H310" stroke="#ba7959" strokeWidth="16" strokeLinecap="round"/>{[0,1,2].map(i=><rect key={i} x={760+i*50} y={350-i*45} width="48" height={80+i*45} rx="6" fill={['#be8061','#e0b86c','#6f9884'][i]}/>)}</>:<><circle cx={variant%2?150:815} cy="100" r="55" fill="#f2dc9a"/><path d="M0 330Q250 200 530 320T1000 290V600H0" fill="#b6c89b"/><path d="M0 490Q200 355 450 420T1000 410V600H0" fill="#8caa82"/>{[85,875].map((x,i)=><g key={x}><path d={`M${x} 390V200`} stroke="#ac865e" strokeWidth="28"/><circle cx={x} cy="180" r={85+i*12} fill="#789971"/><circle cx={x+35} cy="145" r="66" fill="#9ab183"/>{[[-30,-5],[35,25],[4,-40]].map(([dx,dy])=><circle key={dx} cx={x+dx} cy={180+dy} r="14" fill="#d99566"/>)}</g>)}<path d="M380 600Q450 490 610 480" fill="none" stroke="#e5d3ab" strokeWidth="75"/></>}
        <rect width="1000" height="600" fill={`url(#${id})`}/></svg>;
}
export function CompareVisual({round,value}:{round:Round;value:number}) {
    if(round.kind==='number')return <strong className="nc-big-number">{value}</strong>;
    if(round.kind==='count')return <div className="nc-compare-objects">{Array.from({length:value},(_,i)=><Toy key={i} name={round.object}/>)}</div>;
    if(round.kind==='length')return <div className="nc-measure-track"><div className="nc-ribbon" style={{width:`${20+value*7}%`}}/></div>;
    if(round.kind==='height')return <div className="nc-height-track"><div className="nc-block-tower" style={{height:30+value*12}}/></div>;
    return <div className="nc-size-track" style={{maxWidth:160,margin:'auto'}}><img src={toyUrl(round.object)} alt="" style={{width:`${25+value*7}%`,height:'auto',aspectRatio:'1'}}/></div>;
}

/** A small worked visual example expresses the instruction without requiring reading. */
export function CompareRule({round}:{round:Round}) {
    const equal=round.direction==='equal', chooseLarge=round.direction==='more';
    return <div className="nc-compare-rule" aria-label="Hình mẫu yêu cầu so sánh"><span>Mẫu</span>{[true,false].map((large,i)=><React.Fragment key={i}>{i===1&&<span>{equal?'=':'·'}</span>}<div className={(equal||large===chooseLarge?'target ':'')+'rule-'+round.kind}>
        {round.kind==='number'?<b>{large||equal?5:2}</b>:round.kind==='count'?<span>{large||equal?'● ● ●':'●'}</span>:<i style={round.kind==='height'?{height:large||equal?35:18,width:17}:round.kind==='length'?{width:large||equal?48:22,height:15}:{width:large||equal?32:18,height:large||equal?32:18}}/>}
        {(equal||large===chooseLarge)&&<Hand size={15}/>}</div></React.Fragment>)}</div>;
}
