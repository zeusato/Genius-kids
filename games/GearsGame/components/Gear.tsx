import React, { useEffect, useMemo, useRef } from 'react';
import { COLORS, DEG_PER_SPEED } from '../engine/constants';
import { GearRuntime } from '../engine/types';

// Đồng hồ TOÀN CỤC duy nhất: mọi bánh răng quay theo cùng mốc thời gian nên
// các bánh ăn khớp giữ đúng pha với nhau (răng khít). Quay bằng rAF ghi thẳng
// transform vào DOM (không re-render React) ⇒ mượt, không "giật reset" như cũ.
const CLOCK0 = typeof performance !== 'undefined' ? performance.now() : 0;

export interface GearProps {
    teeth: number;
    radius: number;
    color?: string;
    runtime?: GearRuntime;
    isFixed?: boolean;
    /** Vẽ mũi tên chỉ chiều quay (mặc định bật). */
    showDirection?: boolean;
}

const buildPath = (teeth: number, radius: number): string => {
    const inner = radius * 0.78;
    const outer = radius;
    const step = (Math.PI * 2) / teeth;
    const pts: string[] = [];
    for (let i = 0; i < teeth; i++) {
        const a0 = i * step;
        const aMid = a0 + step / 2;
        const a1 = (i + 1) * step;
        // Khe (inner) nửa đầu, RĂNG (outer) nửa sau mỗi bước — khớp công thức pha.
        pts.push(`${Math.cos(a0) * inner},${Math.sin(a0) * inner}`);
        pts.push(`${Math.cos(aMid) * inner},${Math.sin(aMid) * inner}`);
        pts.push(`${Math.cos(aMid) * outer},${Math.sin(aMid) * outer}`);
        pts.push(`${Math.cos(a1) * outer},${Math.sin(a1) * outer}`);
    }
    return `M ${pts.join(' L ')} Z`;
};

const Gear: React.FC<GearProps> = ({
    teeth,
    radius,
    color = COLORS.gear,
    runtime,
    isFixed = false,
    showDirection = true,
}) => {
    const gRef = useRef<SVGGElement>(null);
    const path = useMemo(() => buildPath(teeth, radius), [teeth, radius]);

    const state = runtime?.state ?? 'idle';
    const dir = runtime?.dir ?? 0;
    const speed = runtime?.speed ?? 0;
    const phaseDeg = runtime?.phaseDeg ?? 0;
    const spinning = state === 'driven' && speed > 0 && dir !== 0;

    useEffect(() => {
        const g = gRef.current;
        if (!g) return;
        const setRot = (deg: number) => g.setAttribute('transform', `translate(${radius} ${radius}) rotate(${deg})`);
        if (!spinning) {
            setRot(phaseDeg);
            return;
        }
        let raf = 0;
        const tick = () => {
            const elapsed = (performance.now() - CLOCK0) / 1000;
            setRot(phaseDeg + dir * speed * DEG_PER_SPEED * elapsed);
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [spinning, dir, speed, phaseDeg, radius]);

    const fill = state === 'jammed' ? COLORS.jammed : color;
    const arrowY = -radius * 0.55;
    const arrowW = radius * 0.22;

    return (
        <svg width={radius * 2} height={radius * 2} style={{ overflow: 'visible' }}>
            {/* Thân răng — nhóm QUAY */}
            <g ref={gRef}>
                <path d={path} fill={fill} stroke={COLORS.stroke} strokeWidth={2} filter="drop-shadow(1px 2px 2px rgba(0,0,0,0.25))" />
                <circle r={radius * 0.58} fill="none" stroke={COLORS.stroke} strokeWidth={1} strokeDasharray="4 2" opacity={0.4} />
            </g>

            {/* Lớp TĨNH (không quay): trục, ghim cố định, mũi tên chiều, dấu kẹt */}
            <g transform={`translate(${radius} ${radius})`}>
                <circle r={radius * 0.2} fill={COLORS.stroke} />
                {isFixed && <circle r={radius * 0.12} fill="#b45309" stroke="white" strokeWidth={2} />}

                {showDirection && spinning && (
                    // Tam giác trên đỉnh: đỉnh-phải = quay theo chiều kim đồng hồ (dir 1),
                    // đỉnh-trái = ngược chiều (dir -1). Dạy "chiều quay" trực quan.
                    <path
                        d={dir > 0
                            ? `M ${-arrowW * 0.6} ${arrowY - arrowW} L ${arrowW * 0.9} ${arrowY} L ${-arrowW * 0.6} ${arrowY + arrowW} Z`
                            : `M ${arrowW * 0.6} ${arrowY - arrowW} L ${-arrowW * 0.9} ${arrowY} L ${arrowW * 0.6} ${arrowY + arrowW} Z`}
                        fill="#ffffff"
                        stroke={COLORS.stroke}
                        strokeWidth={1.2}
                        strokeLinejoin="round"
                    />
                )}

                {state === 'jammed' && (
                    <text textAnchor="middle" dominantBaseline="central" fontSize={radius * 0.7} fontWeight="bold">⚠️</text>
                )}
            </g>
        </svg>
    );
};

export default Gear;
