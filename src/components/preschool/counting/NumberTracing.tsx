import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Hand, Play, RotateCcw } from 'lucide-react';
import { advanceTrace, canStartTrace, pointsAttribute, traceAnchor, traceFinished, type TraceLetter, type TracePoint, type TraceState } from '../letterTracingModel';

const line=(points:TracePoint[])=>points.flatMap((p,i)=>{if(!i)return [p];const a=points[i-1],steps=Math.ceil(Math.hypot(p[0]-a[0],p[1]-a[1])/5);return Array.from({length:steps},(_,j)=>[a[0]+(p[0]-a[0])*(j+1)/steps,a[1]+(p[1]-a[1])*(j+1)/steps] as TracePoint);});
const oval:TracePoint[]=Array.from({length:91},(_,i)=>[200-80*Math.sin(i/90*Math.PI*2),202-117*Math.cos(i/90*Math.PI*2)]);
const paths:Record<string,TracePoint[][]>={
    '0':[oval], '1':[[[145,135],[200,85],[200,320]]],
    '2':[[[120,125],[135,98],[170,85],[220,85],[255,102],[272,135],[270,162],[246,193],[120,320],[280,320]]],
    '3':[[[125,100],[170,85],[222,86],[260,105],[272,138],[263,166],[230,194],[190,202],[235,208],[266,232],[277,270],[260,305],[220,320],[170,318],[124,296]]],
    '4':[[[230,85],[115,240],[285,240]],[[240,85],[240,320]]],
    '5':[[[275,85],[135,85],[125,193],[165,177],[215,180],[255,204],[275,245],[267,282],[238,310],[190,320],[142,308],[117,286]]],
    '6':[[[265,98],[222,85],[175,108],[139,154],[120,220],[122,272],[145,308],[190,320],[237,309],[268,278],[271,240],[251,209],[216,192],[178,196],[142,217],[120,242]]],
    '7':[[[120,85],[280,85],[165,320]]],
    '8':[[[200,85],[155,89],[127,119],[134,157],[172,184],[226,214],[264,248],[270,277],[248,309],[200,320],[150,309],[125,277],[130,246],[168,215],[225,184],[263,154],[270,124],[244,91],[200,85]]],
    '9':[[[280,164],[260,110],[223,86],[178,88],[138,115],[123,155],[132,194],[163,218],[207,220],[250,198],[280,164],[270,242],[245,291],[206,317],[159,320],[126,306]]],
};
export function numberTrace(n:number):TraceLetter {
    const raw=n===10?[...paths['1'].map(p=>p.map(([x,y])=>[x*.5+20,y] as TracePoint)),...paths['0'].map(p=>p.map(([x,y])=>[x*.5+160,y] as TracePoint))]:paths[String(n)]||paths['1'];
    return {strokes:raw.map(p=>({instruction:'Bắt đầu ở chấm xanh, đi theo đường nét.',points:line(p)}))};
}
export function NumberTracing({value,initial,onSave,onFinish}:{value:number;initial:TraceState;onSave:(s:TraceState)=>void;onFinish:(assisted:boolean)=>void}) {
    const model=useMemo(()=>numberTrace(value),[value]), [state,setState]=useState(initial), live=useRef(initial);
    const svg=useRef<SVGSVGElement>(null), pointer=useRef<{id:number;from:TracePoint}|null>(null), [demo,setDemo]=useState(false);
    const done=traceFinished(model,state), anchor=traceAnchor(model,state);
    useEffect(()=>()=>{pointer.current=null;},[]);
    const point=(e:React.PointerEvent):TracePoint=>{const matrix=svg.current!.getScreenCTM()!;const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(matrix.inverse());return [p.x,p.y];};
    const commit=(next:TraceState)=>{live.current=next;setState(next);};
    const end=(e:React.PointerEvent<SVGSVGElement>)=>{if(pointer.current?.id!==e.pointerId)return;pointer.current=null;if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);onSave(live.current);if(traceFinished(model,live.current))onFinish(false);};
    return <div className="nc-trace"><div className="nc-trace-heading"><span><Hand size={18}/> Tô từ chấm xanh</span><button onClick={()=>{commit({stroke:0,point:0});onSave({stroke:0,point:0});}} aria-label="Tô lại số"><RotateCcw size={18}/></button></div>
        <svg ref={svg} viewBox="60 40 280 330" aria-label={`Khung tập tô số ${value}`} role="group" onPointerDown={e=>{if(pointer.current||e.button!==0||done)return;const p=point(e);if(!canStartTrace(model,live.current,p))return;e.preventDefault();setDemo(false);pointer.current={id:e.pointerId,from:p};e.currentTarget.setPointerCapture(e.pointerId);}}
            onPointerMove={e=>{if(pointer.current?.id!==e.pointerId)return;e.preventDefault();const p=point(e),result=advanceTrace(model,live.current,pointer.current.from,p);pointer.current.from=p;commit(result.state);if(result.offPath||result.state.stroke!==state.stroke)end(e);}}
            onPointerUp={end} onPointerCancel={end}>
            {[85,202,320].map(y=><line key={y} x1="64" x2="336" y1={y} y2={y} stroke="#dfe5d4" strokeDasharray="5 5"/>)}
            {model.strokes.map((s,i)=><g key={i} fill="none" strokeLinecap="round" strokeLinejoin="round"><polyline points={pointsAttribute(s.points)} stroke="#e3e5d8" strokeWidth="32"/><polyline points={pointsAttribute(s.points)} stroke="#99aa8c" strokeWidth="2" strokeDasharray="1 9"/>{i<=state.stroke&&<polyline points={pointsAttribute(i<state.stroke?s.points:s.points.slice(0,state.point+1))} stroke="#47876e" strokeWidth="18"/>}{demo&&<polyline className="nc-trace-demo" pathLength="1" points={pointsAttribute(s.points)} stroke="#d79840" strokeWidth="8"/>}</g>)}
            {anchor&&<g><circle cx={anchor[0]} cy={anchor[1]} r="13" fill="#407d66"/><text x={anchor[0]} y={anchor[1]+5} textAnchor="middle" fill="white" fontSize="15">{state.stroke+1}</text></g>}
        </svg>
        <div className="nc-trace-tools"><button onClick={()=>setDemo(!demo)}><Play size={16}/>Xem nét mẫu</button><button onClick={()=>onFinish(true)} title="Hoàn thành với hỗ trợ, không tính tự tô độc lập"><Hand size={16}/>Cùng người lớn</button></div>
        <small>Nếu dùng bàn phím, chọn “Cùng người lớn”. Tiến độ ghi nhận có hỗ trợ.</small>
    </div>;
}
