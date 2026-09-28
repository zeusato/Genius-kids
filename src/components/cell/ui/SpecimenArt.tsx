import React, { useMemo } from 'react';
import { createRandom } from '../scene3d/noise';
import type { CellId } from '../../../data/cellStory';

// Hình "nhìn qua thị kính" của từng mẫu vật — SVG vẽ bằng code (0 byte ảnh), chuyển động nhẹ bằng
// SMIL nên không tốn JS. Là lời hứa thị giác của cảnh lặn 3D phía sau: mô → một tế bào.

type Pt = [number, number];

// Vòng Catmull-Rom khép kín → path Bezier: tế bào hình giọt thạch méo tự nhiên
function blobPath(cx: number, cy: number, r: number, rand: () => number, opts: { n?: number; jitter?: number; squash?: number; rot?: number } = {}): string {
    const n = opts.n ?? 9, jitter = opts.jitter ?? 0.2, squash = opts.squash ?? 1, rot = opts.rot ?? 0;
    const pts: Pt[] = [];
    for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const rr = r * (1 - jitter / 2 + rand() * jitter);
        const x = Math.cos(a) * rr, y = Math.sin(a) * rr * squash;
        pts.push([cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]);
    }
    const f = (p: Pt) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
    let d = `M ${f(pts[0])}`;
    for (let i = 0; i < n; i++) {
        const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
        const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
        const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
        d += ` C ${f(c1)} ${f(c2)} ${f(p2)}`;
    }
    return `${d} Z`;
}

const FIELD = { cx: 120, cy: 90, r: 84 };

function AnimalField({ uid }: { uid: string }) {
    const cells = useMemo(() => {
        const rand = createRandom('lab-animal');
        const spots: [number, number, number][] = [[80, 60, 29], [150, 54, 26], [115, 110, 33], [184, 112, 25], [52, 122, 24], [150, 158, 22], [78, 164, 18], [200, 62, 18]];
        return spots.map(([x, y, r], i) => ({
            d: blobPath(x, y, r, rand, { rot: rand() * 3 }),
            nx: x + (rand() - 0.5) * r * 0.3,
            ny: y + (rand() - 0.5) * r * 0.3,
            nr: r * 0.3,
            mito: Array.from({ length: 3 }, () => [x + (rand() - 0.5) * r * 1.1, y + (rand() - 0.5) * r * 1.1, rand() * 180] as [number, number, number]),
            dots: Array.from({ length: 6 }, () => [x + (rand() - 0.5) * r * 1.3, y + (rand() - 0.5) * r * 1.3] as Pt),
            hero: i === 2
        }));
    }, []);
    return (
        <>
            <defs>
                <radialGradient id={`${uid}-bg`} cx="50%" cy="45%" r="60%">
                    <stop offset="0%" stopColor="#fff1f2" />
                    <stop offset="100%" stopColor="#fbcfe8" />
                </radialGradient>
                <radialGradient id={`${uid}-cell`} cx="40%" cy="35%" r="70%">
                    <stop offset="0%" stopColor="#ffe4e6" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#fda4af" stopOpacity="0.85" />
                </radialGradient>
                <radialGradient id={`${uid}-nuc`} cx="38%" cy="35%" r="70%">
                    <stop offset="0%" stopColor="#e9d5ff" />
                    <stop offset="100%" stopColor="#9333ea" />
                </radialGradient>
            </defs>
            <rect x="0" y="0" width="240" height="180" fill={`url(#${uid}-bg)`} />
            <g>
                <animateTransform attributeName="transform" type="translate" values="0 0; 3 -2; -2 2; 0 0" dur="14s" repeatCount="indefinite" />
                {cells.map((c, i) => (
                    <g key={i}>
                        <path d={c.d} fill={`url(#${uid}-cell)`} stroke={c.hero ? '#e11d48' : '#fb7185'} strokeWidth={c.hero ? 2.4 : 1.5} />
                        {c.dots.map(([x, y], k) => <circle key={k} cx={x} cy={y} r="1.1" fill="#c084fc" opacity="0.8" />)}
                        {c.mito.map(([x, y, a], k) => <ellipse key={k} cx={x} cy={y} rx="4.2" ry="2" fill="#ef4444" opacity="0.85" transform={`rotate(${a} ${x} ${y})`} />)}
                        <circle cx={c.nx} cy={c.ny} r={c.nr} fill={`url(#${uid}-nuc)`} />
                        <circle cx={c.nx + c.nr * 0.25} cy={c.ny - c.nr * 0.1} r={c.nr * 0.32} fill="#6b21a8" opacity="0.7" />
                    </g>
                ))}
            </g>
        </>
    );
}

function PlantField({ uid }: { uid: string }) {
    const cells = useMemo(() => {
        const rand = createRandom('lab-plant');
        const out: { x: number; y: number; w: number; h: number; chl: [number, number, number][]; nuc: Pt | null; hero: boolean }[] = [];
        const rowH = 40;
        for (let row = 0; row < 5; row++) {
            const y = 6 + row * rowH;
            const off = row % 2 ? -34 : 0;
            for (let x = off; x < 240; x += 68) {
                const w = 64, h = rowH - 4;
                const chl: [number, number, number][] = [];
                const n = 7 + Math.floor(rand() * 4);
                for (let k = 0; k < n; k++) {
                    // lục lạp bám sát mép trong (không bào chiếm giữa)
                    const t = rand();
                    const side = Math.floor(rand() * 4);
                    const px = side < 2 ? x + 8 + t * (w - 16) : side === 2 ? x + 8 : x + w - 8;
                    const py = side === 0 ? y + 7 : side === 1 ? y + h - 7 : y + 8 + t * (h - 16);
                    chl.push([px, py, side < 2 ? 0 : 90]);
                }
                out.push({ x, y, w, h, chl, nuc: rand() < 0.5 ? [x + 12 + rand() * 8, y + 10 + rand() * 6] : null, hero: row === 2 && x > 80 && x < 140 });
            }
        }
        return out;
    }, []);
    return (
        <>
            <defs>
                <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#f7fee7" />
                    <stop offset="100%" stopColor="#d9f99d" />
                </linearGradient>
            </defs>
            <rect x="0" y="0" width="240" height="180" fill={`url(#${uid}-bg)`} />
            <g>
                <animateTransform attributeName="transform" type="translate" values="0 0; -2 1; 1 -1; 0 0" dur="16s" repeatCount="indefinite" />
                {cells.map((c, i) => (
                    <g key={i}>
                        <rect x={c.x + 2} y={c.y + 2} width={c.w} height={c.h} rx="9" fill="#ecfccb" stroke={c.hero ? '#365314' : '#65a30d'} strokeWidth={c.hero ? 4 : 3} />
                        <rect x={c.x + 11} y={c.y + 11} width={c.w - 18} height={c.h - 18} rx="8" fill="#bae6fd" opacity="0.6" />
                        {c.chl.map(([x, y, a], k) => (
                            <ellipse key={k} cx={x} cy={y} rx="4.4" ry="2.6" fill="#16a34a" transform={`rotate(${a} ${x} ${y})`}>
                                {/* dòng tế bào chất: lục lạp nhúc nhích */}
                                <animateTransform attributeName="transform" type="translate" additive="sum" values={`0 0; ${(k % 3) - 1} ${((k + 1) % 3) - 1}; 0 0`} dur={`${5 + (k % 4)}s`} repeatCount="indefinite" />
                            </ellipse>
                        ))}
                        {c.nuc && <circle cx={c.nuc[0]} cy={c.nuc[1]} r="5" fill="#a855f7" opacity="0.85" />}
                    </g>
                ))}
            </g>
        </>
    );
}

function BacteriaField({ uid }: { uid: string }) {
    const rods = useMemo(() => {
        const rand = createRandom('lab-bacteria');
        return Array.from({ length: 14 }, (_, i) => ({
            x: 30 + rand() * 180,
            y: 20 + rand() * 140,
            a: rand() * 360,
            s: 0.8 + rand() * 0.45,
            tail: rand() < 0.6,
            dur: 7 + rand() * 6,
            dx: (rand() - 0.5) * 18,
            dy: (rand() - 0.5) * 12,
            hero: i === 5
        }));
    }, []);
    return (
        <>
            <defs>
                <radialGradient id={`${uid}-bg`} cx="50%" cy="45%" r="65%">
                    <stop offset="0%" stopColor="#fefce8" />
                    <stop offset="100%" stopColor="#fde68a" />
                </radialGradient>
            </defs>
            <rect x="0" y="0" width="240" height="180" fill={`url(#${uid}-bg)`} />
            {rods.map((r, i) => (
                <g key={i}>
                    <animateTransform attributeName="transform" type="translate" values={`0 0; ${r.dx} ${r.dy}; 0 0`} dur={`${r.dur}s`} repeatCount="indefinite" />
                    <g transform={`translate(${r.x} ${r.y}) rotate(${r.a}) scale(${r.s})`}>
                        {r.tail && (
                            <path d="M -15 0 q -5 -5 -10 0 t -10 0 t -10 0" fill="none" stroke="#ca8a04" strokeWidth="1.3" strokeLinecap="round">
                                <animate attributeName="d" values="M -15 0 q -5 -5 -10 0 t -10 0 t -10 0; M -15 0 q -5 5 -10 0 t -10 0 t -10 0; M -15 0 q -5 -5 -10 0 t -10 0 t -10 0" dur="0.9s" repeatCount="indefinite" />
                            </path>
                        )}
                        <rect x="-16" y="-6" width="32" height="12" rx="6" fill="#fdba74" stroke={r.hero ? '#9a3412' : '#ea580c'} strokeWidth={r.hero ? 2 : 1.2} />
                        <path d="M -9 0 q 3 -4 6 0 t 6 0 t 6 0" fill="none" stroke="#b45309" strokeWidth="1.1" opacity="0.8" />
                    </g>
                </g>
            ))}
        </>
    );
}

// Khung thị kính: vùng tròn sáng + viền kim loại + bóng tối xung quanh + vệt lóa thấu kính
export const SpecimenArt: React.FC<{ id: CellId; className?: string }> = ({ id, className = '' }) => {
    const uid = `spec-${id}`;
    return (
        <svg viewBox="0 0 240 180" className={className} role="img" aria-hidden="true">
            <defs>
                <clipPath id={`${uid}-clip`}>
                    <circle cx={FIELD.cx} cy={FIELD.cy} r={FIELD.r} />
                </clipPath>
                <radialGradient id={`${uid}-vig`} cx="50%" cy="50%" r="50%">
                    <stop offset="72%" stopColor="#000" stopOpacity="0" />
                    <stop offset="100%" stopColor="#000" stopOpacity="0.42" />
                </radialGradient>
                <linearGradient id={`${uid}-ring`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#e2e8f0" />
                    <stop offset="50%" stopColor="#64748b" />
                    <stop offset="100%" stopColor="#cbd5e1" />
                </linearGradient>
            </defs>
            <g clipPath={`url(#${uid}-clip)`}>
                {id === 'animal' && <AnimalField uid={uid} />}
                {id === 'plant' && <PlantField uid={uid} />}
                {id === 'bacteria' && <BacteriaField uid={uid} />}
                <circle cx={FIELD.cx} cy={FIELD.cy} r={FIELD.r} fill={`url(#${uid}-vig)`} />
                <ellipse cx="92" cy="46" rx="34" ry="14" fill="#fff" opacity="0.22" transform="rotate(-22 92 46)" />
            </g>
            <circle cx={FIELD.cx} cy={FIELD.cy} r={FIELD.r + 2} fill="none" stroke={`url(#${uid}-ring)`} strokeWidth="5" />
            <circle cx={FIELD.cx} cy={FIELD.cy} r={FIELD.r + 5} fill="none" stroke="#0f172a" strokeOpacity="0.5" strokeWidth="1.5" />
        </svg>
    );
};
