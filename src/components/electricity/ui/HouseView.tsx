import React, { Component, lazy, Suspense, useState } from 'react';
import { APPLIANCES } from '../../../data/electricity/labs';
const HouseCanvas = lazy(() => import('../bench/HouseCanvas'));
class Boundary extends Component<{
    children: React.ReactNode;
    fallback: React.ReactNode;
}, {
    failed: boolean;
}> {
    state = { failed: false };
    static getDerivedStateFromError() { return { failed: true }; }
    render() { return this.state.failed ? this.props.fallback : this.props.children; }
}
export function HouseView({ off, ledCount, onToggle }: {
    off: string[];
    ledCount: number;
    onToggle: (id: string) => void;
}) {
    const [flat, setFlat] = useState(false);
 const hourIds=['lamp0','lamp1','lamp2','lamp3','lamp4','tv','fan','fridge'];
 const visibleOff=[...off,...APPLIANCES.filter(a=>!hourIds.includes(a.id)).map(a=>a.id)];
    const fallback = <svg viewBox="0 0 620 600" className="ew-house-svg" aria-label="Ngôi nhà ba tầng"><path d="M45 95 310 15 575 95V575H45Z" fill="#e4d7bb" stroke="#bda681" strokeWidth="4"/>{[2, 1, 0].map((floor, row) => <g key={floor} transform={`translate(65 ${115 + row * 150})`}><rect width="490" height="130" rx="12" fill={row % 2 ? '#d0d9c1' : '#eae2cd'}/><text x="15" y="25" fontSize="15" fill="#42655a">Tầng {floor + 1}</text>{APPLIANCES.filter(a => a.floor === floor).map((a, i, items) => <g key={a.id} transform={`translate(${60 + i * 370 / Math.max(1, items.length - 1)} 68)`}><circle r="25" fill={off.includes(a.id) ? '#96a499' : '#f1cc81'}/><text textAnchor="middle" y="8" fontSize="30" fill="#476e61">{a.id.startsWith('lamp') ? '☼' : a.id === 'fridge' ? '▥' : '▣'}</text><text y="48" fontSize="12" textAnchor="middle" fill="#355e51">{a.name}</text></g>)}</g>)}</svg>;
    return <div><div className="ew-house-scene">{flat ? fallback : <Boundary fallback={fallback}><Suspense fallback={fallback}><HouseCanvas off={visibleOff} ledCount={0} onToggle={id=>{if(hourIds.includes(id))onToggle(id);}} onError={() => setFlat(true)}/></Suspense></Boundary>}</div><button onClick={() => setFlat(v => !v)}>{flat ? 'Xem nhà 3D' : 'Xem nhà SVG'}</button><div className="ew-house-controls">{APPLIANCES.map(a => <button key={a.id} disabled={!hourIds.includes(a.id)} aria-pressed={hourIds.includes(a.id)&&!off.includes(a.id)} onClick={() => onToggle(a.id)}>{a.name}<small>{!hourIds.includes(a.id)?'Ngoài lượt đo 1 giờ':off.includes(a.id) ? 'Đã tắt' : 'Đang dùng'}{a.essential ? ' · Cần giữ' : ''}</small></button>)}</div></div>;
}
