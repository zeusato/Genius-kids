import React, { useEffect, useMemo, useRef, useState } from 'react';
import { worldLayout, worldBounds } from './worldLayout';
import { regionMood } from './art';
import { buildScenery } from './scenery';
import { createMap, regionOf, TILE_STYLE } from './content';
import type { WorldProps } from './World3D';

export function DragonPortrait({color='#287768',className=''}:{color?:string;className?:string}){return <svg className={className} viewBox="0 0 200 180" aria-hidden="true"><path d="M59 103 10 58 23 117 55 130M141 103l49-45-13 59-32 13" fill={color} stroke="#234b48" strokeWidth="4" strokeLinejoin="round"/><path d="m18 70 37 45M181 70l-37 45" stroke="#b9d4b2" strokeWidth="5"/><ellipse cx="100" cy="132" rx="47" ry="41" fill={color}/><ellipse cx="100" cy="141" rx="24" ry="29" fill="#f4dca0"/><path d="m65 58-5-32 27 22m47 10 6-32-27 22" fill="#f2d187" stroke="#234b48" strokeWidth="3"/><rect x="49" y="46" width="102" height="81" rx="37" fill={color}/><ellipse cx="100" cy="104" rx="43" ry="24" fill="#b9d4b2"/><ellipse cx="76" cy="80" rx="11" ry="15" fill="#fffbee"/><ellipse cx="124" cy="80" rx="11" ry="15" fill="#fffbee"/><ellipse cx="79" cy="82" rx="6" ry="10" fill="#203e3b"/><ellipse cx="121" cy="82" rx="6" ry="10" fill="#203e3b"/><circle cx="81" cy="78" r="2" fill="white"/><circle cx="123" cy="78" r="2" fill="white"/><path d="M85 108q15 13 30 0" fill="none" stroke="#234b48" strokeWidth="3" strokeLinecap="round"/><circle cx="81" cy="98" r="3" fill="#618c77"/><circle cx="119" cy="98" r="3" fill="#618c77"/><ellipse cx="63" cy="167" rx="18" ry="9" fill={color}/><ellipse cx="137" cy="167" rx="18" ry="9" fill={color}/></svg>;}

export default function World2D(props:WorldProps){
 const s=props.session, map=useMemo(()=>worldLayout(s?.map||createMap(props.missionId,props.seed),regionOf(props.missionId).id),[s?.map,props.missionId,props.seed]),region=regionOf(props.missionId),mood=regionMood[region.id];
 const scenery=useMemo(()=>buildScenery(region.id,map,props.seed,'light'),[region.id,map,props.seed]);
 const point=(n:{x:number;y?:number;z:number})=>[450+n.x*24-n.z*5,330+n.z*11-n.x*3-(n.y||0)*14];
 const node=map.find(n=>n.id===s?.position)||map[0],hero=point(node),ref=useRef<SVGSVGElement>(null),drag=useRef<{x:number;y:number}|null>(null);
 const [aspect,setAspect]=useState(1.5),[zoom,setZoom]=useState(1),[pan,setPan]=useState({x:0,y:0});
 useEffect(()=>{const el=ref.current;if(!el)return;const ro=new ResizeObserver(([entry])=>setAspect(entry.contentRect.width/Math.max(1,entry.contentRect.height)));ro.observe(el);return()=>ro.disconnect();},[]);
 useEffect(()=>{setZoom(1);setPan({x:0,y:0});},[props.overview,props.cameraMode,props.recenter,props.missionId]);
 useEffect(()=>{props.onReady();},[props.onReady]);
 const bounds=worldBounds(map),middle=point({x:bounds.x,z:bounds.z});
 const height=(props.overview?Math.max(bounds.depth*15,bounds.width*32/aspect):aspect<1?520:350)/zoom,width=height*aspect;
 const cx=(props.overview?middle[0]:hero[0])+pan.x,cy=(props.overview?middle[1]:hero[1]-40)+pan.y;
 useEffect(()=>{const el=ref.current;if(!el)return;const wheel=(e:WheelEvent)=>{if(props.blocked||s?.paused)return;e.preventDefault();setZoom(z=>Math.max(.65,Math.min(2,z*Math.exp(-e.deltaY*.001))));};el.addEventListener('wheel',wheel,{passive:false});return()=>el.removeEventListener('wheel',wheel);},[props.blocked,s?.paused]);
 return <svg ref={ref} className="dq-map2d" viewBox={`${cx-width/2} ${cy-height/2} ${width} ${height}`} role="img" aria-label={`Bản đồ góc chếch 2D của ${region.name}, đủ 50 ô, nhân vật ở ô ${node.index+1}`}
 onPointerDown={e=>{if(props.cameraMode!=='free'||props.blocked||s?.paused)return;drag.current={x:e.clientX,y:e.clientY};e.currentTarget.setPointerCapture(e.pointerId);}}
 onPointerMove={e=>{if(!drag.current)return;const ratio=width/e.currentTarget.clientWidth;setPan(p=>({x:p.x-(e.clientX-drag.current!.x)*ratio,y:p.y-(e.clientY-drag.current!.y)*ratio}));drag.current={x:e.clientX,y:e.clientY};}}
 onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}}>
 <defs><filter id="dq-soft-shadow"><feGaussianBlur stdDeviation="5"/></filter></defs>
 {scenery.islands.map((island,i)=>{const [x,y]=point({x:island.x,y:island.y+.375,z:island.z}),rx=island.rx*25,ry=island.rz*12;return <g key={i}><ellipse cx={x} cy={y+23} rx={rx} ry={ry} fill={mood.rock}/><ellipse cx={x} cy={y} rx={rx} ry={ry} fill={mood.ground}/></g>;})}
 <g aria-hidden="true">{scenery.parts.map((p,i)=>{const [x,y]=point({x:p.p[0],y:p.p[1],z:p.p[2]}),w=p.s[0]*23,h=p.s[1]*14;return <g key={i} transform={`translate(${x} ${y})`} fill={p.color}>
  {p.shape==='trunk'?<rect x={-w} y={-h/2} width={w*2} height={h} rx={2}/>:p.shape==='cone'?<path d={`M0 ${-h/2} ${w} ${h/2} ${-w} ${h/2}Z`}/>:p.shape==='crystal'?<path d={`M0 ${-h} ${w} 0 0 ${h*.55} ${-w} 0Z`} stroke="#d5e9ed66" strokeWidth={1}/>:<ellipse rx={w} ry={p.shape==='pool'?p.s[2]*11:Math.max(2,h)}/>}
 </g>;})}</g>
 {map.slice(0,-1).map((n,i)=><path key={n.id} d={`M${point(n)}L${point(map[i+1])}`} stroke="#d3bd83" strokeWidth="7"/>)}
 {map.map(n=>{const [x,y]=point(n),style=TILE_STYLE[n.kind],current=s?.position===n.id,target=s&&['rolling','moving','landing'].includes(s.phase)&&s.target===n.index;return <g key={n.id} transform={`translate(${x} ${y})`} aria-label={`Ô ${n.index+1}: ${style.name}${current?', nhân vật đang ở đây':''}`}><ellipse cy="6" rx="18" ry="12" fill="#526550"/><ellipse rx="18" ry="12" fill={target?'#ffe092':style.color} stroke={current?'#ffe5a0':'#ffffff66'} strokeWidth={current?3:1}/><text y="4" textAnchor="middle" fontSize="12" fontWeight="850" fill={style.ink}>{n.index+1}</text>{n.kind!=='normal'&&<text y="-16" textAnchor="middle" fontSize="12" fill={style.ink}>{style.symbol}</text>}</g>;})}
 <g transform={`translate(${hero[0]} ${hero[1]-24})`} aria-label="Dũng sĩ cưỡi ngựa">
 <ellipse cy="27" rx="24" ry="7" fill="#143a3544"/><path d="M-16 13v15M-8 15v15M12 13v16M18 12v14" stroke="#754a30" strokeWidth="5" strokeLinecap="round"/>
 <ellipse cy="10" rx="23" ry="12" fill="#995f39"/><path d="M-21 7q-14 0-11 15" fill="none" stroke="#49372c" strokeWidth="5" strokeLinecap="round"/><path d="m13 4 2-20 13 0 1 24Z" fill="#995f39"/>
 <ellipse cx="25" cy="-14" rx="12" ry="9" fill="#a87046"/><ellipse cx="33" cy="-11" rx="7" ry="6" fill="#dcc295"/><path d="m19-21-1-10 6 8 4-9 3 12Z" fill="#805137"/><circle cx="28" cy="-17" r="2" fill="#1e342c"/>
 <path d="m-9-8-11 20h18L3-9Z" fill={props.heroColor}/><path d="m-5-12-2 14h15L6-12Z" fill="#9bbbc6"/><path d="m-2 1 8 11v10" stroke="#54727c" fill="none" strokeWidth="5"/><circle cy="-23" r="9" fill="#f0cba2"/>
 <path d="M-10-23a10 10 0 0 1 20 0v-1h-20Z" fill="#c9dce1"/><path d="M-1-34q-8-14 8-7l4 10Z" fill={props.heroColor}/><circle cx="4" cy="-23" r="1.5" fill="#264535"/><path d="m5-8 10 5 9-8" stroke="#61472f" fill="none" strokeWidth="2"/>
 </g>
 <g transform={`translate(${point(map[49])[0]-30} ${point(map[49])[1]-80}) scale(.38)`}><DragonPortrait color={region.color}/></g>
 </svg>;
}
