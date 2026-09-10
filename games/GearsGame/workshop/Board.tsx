import React, { useEffect, useId, useRef } from 'react';
import { GearFace } from './Art';
import type { Design, Mission, Evaluation } from './model';
import { buildGraph } from '../engine/graph';
interface Props { mission: Mission; design: Design; result: Evaluation; running: boolean; revealed: boolean; slow: boolean; reduced: boolean; focus: string | null; beltFrom: string | null; onSocket: (id: string) => void; onBelt: (id: string) => void; dragging: boolean; onDrop: (id: string) => void }
function beltPath(a:{x:number;y:number;radius:number},b:{x:number;y:number;radius:number},crossed:boolean) {
    const length=Math.hypot(b.x-a.x,b.y-a.y),nx=-(b.y-a.y)/length,ny=(b.x-a.x)/length,ra=a.radius*.73,rb=b.radius*.73*(crossed?-1:1);
    return `M${a.x+nx*ra} ${a.y+ny*ra}L${b.x+nx*rb} ${b.y+ny*rb}M${a.x-nx*ra} ${a.y-ny*ra}L${b.x-nx*rb} ${b.y-ny*rb}`;
}
export function Board({mission:m, design, result, running, revealed, slow, reduced, focus, beltFrom, onSocket, onBelt, dragging, onDrop}: Props) {
    const gid = useId().replaceAll(':',''), root = useRef<SVGSVGElement>(null), elapsed = useRef(0);
    const { layout, sim } = result;
    useEffect(() => {
        let frame = 0, prior = 0;
        const draw = (now: number) => {
            if (prior && running && !reduced) elapsed.current += Math.min(.05, (now-prior)/1000) * (slow ? .25 : 1);
            prior = now;
            root.current?.querySelectorAll<SVGGElement>('[data-wheel]').forEach(el => {
                const rt = sim.runtime.get(el.dataset.wheel!); const angle = revealed && rt?.state === 'driven' ? rt.phaseDeg + elapsed.current * rt.speed * rt.dir * 60 : 0;
                el.setAttribute('transform', `rotate(${angle})`);
            });
            if (running && !reduced) frame=requestAnimationFrame(draw);
        };
        frame=requestAnimationFrame(draw); return()=>cancelAnimationFrame(frame);
    },[sim,running,revealed,slow,reduced]);
    const graph = buildGraph(layout), edges: Array<[string,string]> = [];
    graph.adj.forEach((list,a)=>list.forEach(e=>{if(e.kind==='mesh'&&a<e.to)edges.push([a,e.to]);}));
    const point=(id:string)=>m.sockets.find(s=>s.id===id)!;
    return <svg ref={root} viewBox="0 0 720 360" className="ws-board-svg" aria-label="Bàn lắp máy" onPointerUp={e=>{if(!dragging)return;const box=e.currentTarget.getBoundingClientRect();const x=(e.clientX-box.left)*720/box.width,y=(e.clientY-box.top)*360/box.height;const slot=m.sockets.find(s=>Math.hypot(s.x-x,s.y-y)<52);if(slot)onDrop(slot.id);}}>
        <defs><pattern id={gid} width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="12" cy="12" r="1" fill="#aabbb0" opacity=".4"/></pattern><linearGradient id={gid+'panel'} x2="0" y2="1"><stop stopColor="#f5f2dd"/><stop offset="1" stopColor="#e4e5cd"/></linearGradient></defs>
        <rect x="10" y="16" width="700" height="335" rx="28" fill="#a9b7a2"/><rect x="10" y="7" width="700" height="334" rx="28" fill={`url(#${gid}panel)`}/><rect x="10" y="7" width="700" height="334" rx="28" fill={`url(#${gid})`}/>
        {[30,690].flatMap(x=>[28,320].map(y=><g key={`${x}-${y}`}><circle cx={x} cy={y} r="5" fill="#bdc3ab"/><path d={`M${x-2} ${y}h4`} stroke="#8f9c89"/></g>))}
        <text x="39" y="49" className="ws-board-eyebrow">BẢN THIẾT KẾ 0{m.id+1}</text><text x="679" y="49" textAnchor="end" className="ws-board-eyebrow">{running ? '● ĐANG CHẠY THỬ' : '○ BÀN LẮP RÁP'}</text>
        <path d="M55 302H665" stroke="#c8cdb6" strokeWidth="2"/><text x="360" y="336" textAnchor="middle" className="ws-board-note">{m.mode==='guess'?'Lần theo chuyển động từ Nguồn — đoán rồi chạy thử':beltFrom?'Chọn puli thứ hai để nối dây':'Chọn linh kiện bên dưới, rồi chạm trục muốn lắp'}</text>
        {m.river&&<g><rect x={m.river.x} y="82" width={m.river.width} height="195" rx="22" fill="#a9cecd"/>{[110,145,180,215,250].map(y=><path key={y} d={`M${m.river!.x+12} ${y}q10-7 20 0t20 0`} stroke="#d7eeDF" strokeWidth="3" fill="none"/>)}<text x={m.river.x+m.river.width/2} y="286" textAnchor="middle" fontSize="10" fill="#5e9491">KHE NƯỚC</text></g>}
        {edges.map(([a,b])=>{const p=point(a),q=point(b),active=revealed&&sim.runtime.get(a)?.state==='driven';return <path key={a+b} d={`M${p.x} ${p.y}L${q.x} ${q.y}`} stroke={active?'#66b49b':'#bcc7b0'} strokeWidth="10" strokeLinecap="round" opacity=".45"/>;})}
        {design.belts.map(b=>{const a=point(b.a),z=point(b.b),active=revealed&&sim.runtime.get(a.id)?.state==='driven';const path=beltPath(layout.gears.find(g=>g.id===b.a)!,layout.gears.find(g=>g.id===b.b)!,b.kind==='belt-crossed');return <g key={b.id} onClick={()=>onBelt(b.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onBelt(b.id);}}}><path d={path} stroke="transparent" strokeWidth="22"/><path d={path} stroke="#54736b" strokeWidth="9" strokeLinecap="round"/><path d={path} stroke={active?'#e7c371':'#9daf99'} strokeWidth="3" strokeDasharray="7 6" className={running&&active&&!reduced?'ws-belt-flow':''}/></g>;})}
        {m.sockets.map(s=>{const gear=layout.gears.find(g=>g.id===s.id),rt=sim.runtime.get(s.id),jam=revealed&&rt?.state==='jammed',radius=gear?.radius||36;const lit=focus===s.id||beltFrom===s.id;return <g key={s.id} transform={`translate(${s.x} ${s.y})`} role="button" tabIndex={running?-1:0} aria-label={`Trục ${s.label}${gear?` · ${gear.teeth} răng`: ' · trống'}${s.locked?' · cố định':''}`} onClick={()=>{if(!dragging)onSocket(s.id);}} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSocket(s.id);}}} className="ws-socket">
            <circle r={Math.max(radius+13,49)} fill={lit?'#f2d28566':'transparent'} stroke={lit?'#cf9c44':'transparent'} strokeWidth="3"/>
            {!gear&&<><circle r="32" fill="#d1dcc655" stroke="#90a58f" strokeWidth="2" strokeDasharray="5 6"/><path d="M-10 0h20M0-10v20" stroke="#7b9885" strokeWidth="3" strokeLinecap="round"/></>}
            {gear&&<><g data-wheel={s.id}><GearFace teeth={gear.teeth} radius={radius} color={jam?'#d89880':s.role==='motor'?'#7fae94':s.role==='target'?'#db977b':'#e8bf70'}/></g>{s.pulley&&<circle r={radius*.73} fill="none" stroke="#486e67" strokeWidth="4"/>}<circle r="11" fill="#e4d5a9" stroke="#4b6960" strokeWidth="4"/><path d="M-4 0h8" stroke="#4b6960" strokeWidth="2"/></>}
            <circle r={Math.max(radius,30)} fill="transparent"/>
            <text x={m.id===5&&s.id==='target2'?radius+22:0} y={m.id===5&&s.id==='target2'?4:m.mode==='repair'&&['b','c'].includes(s.id)?-radius-32:radius+28} textAnchor={m.id===5&&s.id==='target2'?'start':'middle'} className="ws-socket-label">{s.label}{s.locked?' •':''}{s.pulley?' ⌁':''}</text>
            {m.id===5&&revealed&&rt?.state==='driven'&&<text x={s.id==='target2'?radius+22:0} y={s.id==='target2'?24:radius+47} textAnchor={s.id==='target2'?'start':'middle'} fontSize="12" fill="#527a62">×{Number(rt.speed.toFixed(2))}</text>}
            {(s.role==='motor'&&!jam||revealed&&rt?.state==='driven')&&<text y={-radius-13} textAnchor="middle" fontSize="24" fill="#437c69">{s.role==='motor'?'↻':rt?.dir===1?'↻':'↺'}</text>}
            {jam&&<text y={-radius-12} textAnchor="middle" fontSize="19" fill="#a25d4c">!</text>}
        </g>;})}
        {design.belts.map(b=>{const a=point(b.a),z=point(b.b),x=(a.x+z.x)/2,y=(a.y+z.y)/2+(Math.hypot(a.x-z.x,a.y-z.y)<120?58:0);return <g key={'handle-'+b.id} role="button" tabIndex={running?-1:0} aria-label={`Dây đai ${a.label} – ${z.label}: ${b.kind==='belt'?'thẳng':'chéo'}`} onClick={()=>onBelt(b.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onBelt(b.id);}}} className="ws-belt-handle"><circle cx={x} cy={y} r="18" fill="#fcf1cf" stroke="#547b69" strokeWidth="2"/><text x={x} y={y+5} textAnchor="middle" fontSize="18" fontWeight="bold" fill="#527367">{b.kind==='belt'?'=':'×'}</text></g>;})}
    </svg>;
}
