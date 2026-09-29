import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { boardPoint, displayPoint, Part, postIds, postPosition } from '../engine/circuit';
import { PARTS } from '../engine/parts';
import { routeAll } from '../engine/route';
import { reading } from '../engine/solver';
import { bulbBrightness } from '../engine/simulation';
import { bindSurface } from '../controller/surface';
import { BenchProps, layoutKey } from '../ui/benchTypes';
export function PartGlyph({ part, brightness = 0, schematic = false, scope = 'glyph',motorRps=0 }: {
    part: Part;
    motorRps?:number;
    brightness?: number;
    schematic?: boolean;
    scope?: string;
}) {
    const kind = part.kind, broken = part.broken || part.loose;
    if (schematic)
        return <g stroke="currentColor" strokeWidth="5" fill="none"><path d="M-80 0H-42M42 0H80"/>{kind === 'bulb' ? <><circle r="40"/><path d="m-28-28 56 56m-56 0 56-56"/></> : kind === 'battery' ? <><path d="M-12-40V40M12-22V22"/><text x="30" y="-30" stroke="none" fill="currentColor" fontSize="20">+</text></> : ['switch', 'button', 'spdt'].includes(kind) ? <><circle cx="-40" r="5"/><circle cx="40" r="5"/><path d={part.closed || part.position === 1 ? 'M-40 0H40' : 'M-40 0 30-40'}/></> : kind === 'led' ? <><path d="M-30-30 25 0-30 30Z M30-32V32m0-45 20-20m-6 26 20-20"/></> : ['resistor', 'rheostat', 'fuse'].includes(kind) ? <><rect x="-42" y="-20" width="84" height="40"/>{kind === 'rheostat' && <path d="M-35 45 35-45"/>}</> : <><circle r="40"/><text y="12" textAnchor="middle" stroke="none" fill="currentColor" fontSize="34">{PARTS[kind].symbol}</text></>}</g>;
    return <g>
  <rect x="-91" y="-48" width="182" height="104" rx="25" fill="#102f32" opacity=".17" transform="translate(0 8)"/>
  <rect x="-91" y="-48" width="182" height="96" rx="25" fill={kind === 'battery' ? '#295d60' : '#397778'} stroke="#235b5d" strokeWidth="3"/>
  <path d="M-63-38H63" stroke="#87b6ae" strokeWidth="3" strokeLinecap="round"/>
  {kind === 'bulb' ? <>
   {!broken && brightness > .01 && <circle r={58 + brightness * 22} fill="#ffcf66" opacity={Math.min(.48, brightness * .35)} filter={`url(#${scope}-glow)`}/>}
   <rect x="-23" y="12" width="46" height="34" rx="9" fill="#bd9060"/><path d="M-22 22H22M-22 31H22" stroke="#795b40" strokeWidth="3"/>
   <circle cy="-16" r="39" fill={broken ? '#aebbb4' : `rgba(255,216,134,${.2 + Math.min(1, brightness) * .65})`} stroke="#fff2c5" strokeWidth="3"/>
   <path d={part.broken ? 'M-14 13-9-11M7-5 13 13' : 'M-14 13-9-11 0-3 9-11 14 13'} fill="none" stroke={brightness > .03 ? '#fff9d8' : '#926d4a'} strokeWidth="4"/>
   <path d="M-27-27q4-15 20-17" stroke="white" opacity=".7" strokeWidth="4" fill="none"/>
  </> : kind === 'battery' ? <>
   {(part.cells ?? []).map((c, i) => <g key={i} transform={`translate(${(i - ((part.cells?.length ?? 1) - 1) / 2) * 29} 0)`}><rect x="-11" y="-32" width="22" height="64" rx="5" fill={c.present ? (c.charge01 > 0 ? '#e8b55e' : '#92958a') : '#193e41'}/><rect x="-5" y={c.polarity === 1 ? -36 : 31} width="10" height="6" rx="2" fill="#e8dfc6"/><text y="5" textAnchor="middle" fill="#3b3b2e" fontSize="17" fontWeight="bold">{c.present ? (c.polarity === 1 ? '+' : '−') : '·'}</text></g>)}
  </> : ['switch', 'button', 'spdt'].includes(kind) ? <><circle cx="-36" r="12" fill="#d6aa70"/><circle cx="36" r="12" fill="#d6aa70"/><g transform={`rotate(${part.closed || part.position === 1 ? 0 : -32} -36 0)`}><rect x="-42" y="-8" width="85" height="16" rx="8" fill="#cba16b"/><rect x="-8" y="-16" width="58" height="32" rx="12" fill="#e47d65"/></g></> : kind === 'led' ? <><path d="M-22 25V-10a22 22 0 0 1 44 0V25Z" fill={({ red: '#ed765d', yellow: '#edc65d', green: '#8ccba3', blue: '#77afdc' })[part.color ?? 'red']} opacity={broken ? .3 : .5 + brightness * .5}/><path d="M-25 25H25" stroke="#f5e4ca" strokeWidth="6"/>{brightness > .02 && <circle cy="-5" r="26" fill="#fff2c2" opacity={brightness * .5}/>}</> : kind === 'motor' ? <g className={brightness > 0 ? 'ew-fan-spin' : ''} style={{animationDirection:motorRps<0?'reverse':'normal',animationDuration:`${1/Math.max(.1,Math.abs(motorRps))}s`}}> <circle r="10" fill="#ddae6d"/>{[0, 120, 240].map(r => <path key={r} d="M0-7C-40-60 45-65 12-3Z" transform={`rotate(${r})`} fill="#a9d1c8" stroke="#d7eee0" strokeWidth="2"/>)}</g> : kind === 'resistor' || kind === 'rheostat' ? <><rect x="-45" y="-19" width="90" height="38" rx="16" fill="#e2c793"/>{[-24, -10, 6, 29].map((x, i) => <path key={x} d={`M${x}-18V18`} stroke={['#77503a', '#262e2a', '#c57b42', '#b99245'][i]} strokeWidth="7"/>)}</> : kind === 'fuse' ? <><rect x="-44" y="-14" width="88" height="28" rx="8" fill="#d6e5d7" opacity=".8"/><path d={part.broken ? 'M-40 0H-10M10 0H40' : 'M-40 0H40'} stroke="#bc794d" strokeWidth="4"/></> : <text textAnchor="middle" y="17" fontSize="54" fill="#e3c999">{PARTS[kind].symbol}</text>}
  {part.loose && <path d="M-26 50H26" stroke="#e47d65" strokeWidth="6" strokeDasharray="7 5"/>}
 </g>;
}
export function FlatBench(props: BenchProps) {
    const { sim, portrait, schematic, night, selected } = props, svg = useRef<SVGSVGElement>(null), latest = useRef(props);
    latest.current = props;
    const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 1 });
    const scope = useId().replace(/:/g, '');
    const paths = useMemo(() => routeAll(sim.circuit), [layoutKey(sim.circuit)]);
    const w = portrait ? 800 : 1400, h = portrait ? 1400 : 800;
    useEffect(() => { setCamera({ x: 0, y: 0, zoom: 1 }); }, [props.fitKey, portrait]);
    useEffect(() => { const el = svg.current; if (!el)
        return; const toSvg = (x: number, y: number) => { const p = new DOMPoint(x, y).matrixTransform(el.getScreenCTM()!.inverse()); return [(p.x - w / 2 - camera.x) / camera.zoom + w / 2, (p.y - h / 2 - camera.y) / camera.zoom + h / 2] as [
        number,
        number
    ]; }; const toBoard = (x: number, y: number) => { const p = toSvg(x, y); return boardPoint(p[0] / 100, p[1] / 100, portrait); }; const toScreen = (p: [
        number,
        number
    ]) => { const d = displayPoint(...p, portrait), q = new DOMPoint((d[0] * 100 - w / 2) * camera.zoom + w / 2 + camera.x, (d[1] * 100 - h / 2) * camera.zoom + h / 2 + camera.y).matrixTransform(el.getScreenCTM()!); return [q.x, q.y] as [
        number,
        number
    ]; }; return bindSurface(el, () => latest.current, toBoard, toScreen, (dx, dy, scale) => setCamera(v => ({ x: Math.max(-w / 2, Math.min(w / 2, v.x + dx)), y: Math.max(-h / 2, Math.min(h / 2, v.y + dy)), zoom: Math.max(1, Math.min(3, v.zoom * scale)) }))); }, [portrait, camera, w, h]);
    const point = (p: [
        number,
        number
    ]) => displayPoint(...p, portrait).map(v => v * 100);
    const pathString = (points: [
        number,
        number
    ][]) => points.map((p, i) => `${i ? 'L' : 'M'}${point(p).join(' ')}`).join(' ');
    return <svg ref={svg} className={`ew-board-svg ${night ? 'is-night' : ''}`} viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Bàn mạch điện tương tác. Có thể dùng danh sách cọc bên dưới để nối dây bằng bàn phím.">
  <defs><pattern id={`${scope}-holes`} width="50" height="50" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="2.3" fill={night ? '#8d927e' : '#b6ad94'} opacity=".45"/></pattern><filter id={`${scope}-glow`}><feGaussianBlur stdDeviation="13"/></filter></defs>
  <rect width={w} height={h} rx="34" fill={night ? '#253e3c' : '#f0e8d4'}/><rect x="12" y="12" width={w - 24} height={h - 24} rx="27" fill={`url(#${scope}-holes)`} stroke={night ? '#51645c' : '#d4c6aa'} strokeWidth="3"/>
  <g transform={`translate(${w / 2 + camera.x} ${h / 2 + camera.y}) scale(${camera.zoom}) translate(${-w / 2} ${-h / 2})`}>
   {[...paths].map(([id, points], i) => { const current = reading(sim.solution, id).Iab, wire = sim.circuit.wires.find(w => w.id === id)!, active = selected === id || wire.a.partId === selected || wire.b.partId === selected, color = wire.broken ? '#9b9286' : i % 2 ? '#428c86' : '#db8069'; return <g key={id} data-wire={id} className={active ? 'ew-wire-selected' : ''}><path d={pathString(points)} fill="none" stroke={night ? '#253e3c' : '#f0e8d4'} strokeWidth="18" strokeLinecap="round" strokeLinejoin="round"/><path d={pathString(points)} fill="none" stroke={color} strokeWidth={schematic ? 6 : 11} strokeLinecap="round" strokeLinejoin="round"/><path d={pathString(points)} fill="none" stroke="#e9bf83" strokeOpacity=".45" strokeWidth="3"/>{Math.abs(current) > 1e-7 && props.flow !== 'off' && !props.reduced && <path d={pathString(points)} fill="none" stroke="#fff3b8" strokeWidth="4" strokeDasharray="3 33" className="ew-current" style={{ animationDirection: (current > 0) === (props.flow === 'conventional') ? 'normal' : 'reverse', animationDuration: `${2 / Math.max(.2, Math.log1p(Math.abs(current) / .02))}s` }}/>}</g>; })}
   {sim.circuit.parts.map(p => { const [x, y] = point([p.x, p.z]), r = reading(sim.solution, p.id), brightness = p.kind === 'bulb' ? bulbBrightness(r.Pabsorbed) : p.kind === 'led' ? Math.pow(Math.max(0, Math.min(1, r.Iab / .02)), .6) : Math.abs(r.Iab) > .05 ? 1 : 0; return <g key={p.id} color={night ? '#e8dcc0' : '#315958'}><g transform={`translate(${x} ${y}) rotate(${p.rot + (portrait ? -90 : 0)})`}>{selected === p.id && <rect x="-103" y="-60" width="206" height="120" rx="29" fill="none" stroke="#edb958" strokeWidth="5"/>}<PartGlyph part={p} brightness={brightness} motorRps={sim.runtime.visual[p.id]?.motorRps??0} schematic={schematic} scope={scope}/></g><text x={x} y={y + (portrait ? 112 : 78)} textAnchor="middle" fontSize="20" fontWeight="650" fill={night ? '#f1e5ca' : '#355451'}>{PARTS[p.kind].name} {p.id.replace(/\D/g, '')}</text>{postIds(p).map(id => { const [px, py] = point(postPosition(p, id)), armed = props.preview?.from?.partId === p.id && props.preview.from.postId === id; return <g key={id}><circle cx={px} cy={py} r={armed ? 21 : 14} fill="#c7995c" stroke={armed ? '#fff7b6' : '#f4d5a0'} strokeWidth={armed ? 5 : 3}/><circle cx={px} cy={py} r="5" fill="#715b42"/><text x={px} y={py - 24} textAnchor="middle" fill={night ? '#f6e9c9' : '#574934'} fontSize="19" fontWeight="700">{id === 'plus' ? '+' : id === 'minus' ? '−' : id === 'anode' ? 'A+' : id === 'cathode' ? 'K−' : id === 'a' ? 'A' : id === 'b' ? 'B' : id === 'common' ? 'C' : id === 'node' ? '●' : id === 'throw0' ? '1' : '2'}</text></g>; })}</g>; })}
   {props.preview?.part && props.preview.point && (() => { const p = sim.circuit.parts.find(p => p.id === props.preview!.part); const [x, y] = point(props.preview!.point!); return p ? <g className="ew-ghost" transform={`translate(${x} ${y}) rotate(${p.rot + (portrait ? -90 : 0)})`}><PartGlyph part={p} schematic={schematic}/></g> : null; })()}
   {props.preview?.from && props.preview.point && (() => { const p = sim.circuit.parts.find(p => p.id === props.preview!.from!.partId); return p ? <path d={pathString([postPosition(p, props.preview!.from!.postId), props.preview!.point!])} fill="none" stroke="#e8b853" strokeWidth="7" strokeDasharray="12 8"/> : null; })()}
  </g>
 </svg>;
}
