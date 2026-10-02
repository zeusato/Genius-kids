import React from 'react';
import { GATE_STONES } from '../content/gates';

/** Cổng đá: 10 viên đá trên vòm sáng dần theo số câu đã giải; cổng mở thì hiện ánh sáng phía sau. */
export function GateArch({ stone, accent, lit, fresh = 0, open = false, glyph, size = 120 }: { stone: string; accent: string; lit: number; fresh?: number; open?: boolean; glyph?: string; size?: number }) {
    const stones = Array.from({ length: GATE_STONES }, (_, i) => {
        const a = Math.PI - (i + 0.5) * (Math.PI / GATE_STONES);
        return { x: 60 + Math.cos(a) * 44, y: 64 - Math.sin(a) * 44, r: -((a * 180) / Math.PI) + 90 };
    });
    return (
        <svg className={`rd-arch${open ? ' is-open' : ''}`} width={size} height={size} viewBox="0 0 120 120" aria-hidden="true">
            <path d="M10 112 V64 A50 50 0 0 1 110 64 V112 Z" fill={stone} />
            <path d="M28 112 V66 A32 32 0 0 1 92 66 V112 Z" fill={open ? '#fff3c4' : '#5b4a36'} className="rd-arch-door" />
            {open && <path d="M28 112 V66 A32 32 0 0 1 92 66 V112 Z" fill="url(#rd-arch-glow)" />}
            {!open && <g className="rd-arch-leaves"><path d="M30 112 V68 A30 30 0 0 1 59 36.5 V112 Z" fill="#8a6a45" /><path d="M90 112 V68 A30 30 0 0 0 61 36.5 V112 Z" fill="#7c5e3c" /><circle cx="55" cy="84" r="2.4" fill="#e4b343" /><circle cx="65" cy="84" r="2.4" fill="#e4b343" /></g>}
            <defs><radialGradient id="rd-arch-glow" cx=".5" cy=".7" r=".6"><stop offset="0" stopColor="#fff" stopOpacity=".9" /><stop offset="1" stopColor="#ffd77a" stopOpacity="0" /></radialGradient></defs>
            {stones.map((s, i) => (
                <rect key={i} x={s.x - 5} y={s.y - 7} width="10" height="14" rx="3" transform={`rotate(${s.r} ${s.x} ${s.y})`}
                    className={i < lit ? `rd-stone is-lit${i >= lit - fresh ? ' is-fresh' : ''}` : 'rd-stone'}
                    style={{ ['--d' as string]: `${(i - (lit - fresh)) * 140}ms`, ['--lit' as string]: accent }} />
            ))}
            <path d="M6 112 H114" stroke="#00000018" strokeWidth="3" />
            {glyph && <text x="60" y="104" textAnchor="middle" fontSize="20">{glyph}</text>}
        </svg>
    );
}
