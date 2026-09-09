import React from 'react';
import type { Visual, Theme, RoundResult } from './model';
export function StageProgress({ theme, rounds }: {
    theme: Theme;
    rounds: RoundResult[];
}) {
    const symbols = { station: 'ϟ', garden: '✿', stars: '✦' }, labels = { station: 'Cột năng lượng', garden: 'Hoa ánh sáng', stars: 'Chòm sao' };
    return <div className={`sm-stage-lights lights-${theme}`} role="img" aria-label={`${labels[theme]}: ${rounds.filter(r => r.points >= 30).length}/${rounds.length} đã sáng`}>{rounds.map((r, i) => <div key={i} className={r.points >= 30 ? 'lit' : ''} style={{ '--charge': r.points / 200 } as React.CSSProperties}><i>{symbols[theme]}</i><span>{i + 1}</span></div>)}</div>;
}
export function PuzzleVisual({ visual, small = false }: {
    visual: Visual;
    small?: boolean;
}) {
    if (visual.kind === 'groups')
        return <div className="sm-groups">{[visual.left, visual.right].map((count, i) => <div className="sm-group" key={i}><span>Nhóm {i + 1}</span><div aria-label={`${count} vật`} className="sm-objects">{count === 0 ? <em>Không có vật nào</em> : Array.from({ length: count }, (_, n) => <i key={n} aria-hidden="true"/>)}</div></div>)}</div>;
    if (visual.kind === 'color')
        return <div className="sm-color" role="img" aria-label="Mẫu màu cần nhận diện" style={{ background: visual.color }}/>;
    if (visual.kind === 'shape')
        return <svg className={`sm-visual ${small ? 'small' : ''}`} viewBox="0 0 120 120" role="img" aria-label="Hình cần nhận diện">{visual.shape === 'circle' ? <circle cx="60" cy="60" r="43" fill={visual.color}/> : visual.shape === 'square' ? <rect x="18" y="18" width="84" height="84" rx="8" fill={visual.color}/> : visual.shape === 'triangle' ? <path d="M60 12 110 103H10Z" fill={visual.color}/> : <path d="m60 8 15 33 36 4-27 25 8 36-32-18-32 18 8-36L9 45l36-4Z" fill={visual.color}/>}</svg>;
    const h = (visual.hour % 12 + visual.minute / 60) * Math.PI / 6, m = visual.minute * Math.PI / 30;
    return <svg className={`sm-visual ${small ? 'small' : ''}`} viewBox="0 0 120 120" role="img" aria-label="Đồng hồ kim"><circle cx="60" cy="60" r="55" fill="#fffdf4" stroke="#63877b" strokeWidth="3"/>{Array.from({ length: 12 }, (_, i) => { const a = (i + 1) * Math.PI / 6; return <text key={i} x={60 + 44 * Math.sin(a)} y={60 - 44 * Math.cos(a)} textAnchor="middle" dominantBaseline="central" fontSize="12" fontFamily="system-ui" fill="#25483f">{i + 1}</text>; })}<path d={`M60 60L${60 + 25 * Math.sin(h)} ${60 - 25 * Math.cos(h)}`} stroke="#204e45" strokeWidth="5" strokeLinecap="round"/><path d={`M60 60L${60 + 36 * Math.sin(m)} ${60 - 36 * Math.cos(m)}`} stroke="#d07745" strokeWidth="3" strokeLinecap="round"/><circle cx="60" cy="60" r="4" fill="#204e45"/></svg>;
}
export function Tia({ happy = false }: {
    happy?: boolean;
}) {
    const [failed, setFailed] = React.useState(false);
    return <div className={`sm-tia ${happy ? 'happy' : ''}`} aria-label="Tia, robot dẫn chương trình" role="img">{!failed ? <img src={import.meta.env.BASE_URL + 'speed-math/art/tia.webp'} alt="" onError={() => setFailed(true)}/> : <div className="sm-robot"><i className="sm-antenna"/><div className="sm-robot-head"><div className="sm-robot-face"><i /><i /><b /></div></div><div className="sm-robot-body"><span>✦</span></div><i className="sm-arm left"/><i className="sm-arm right"/></div>}</div>;
}
