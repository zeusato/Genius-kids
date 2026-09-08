import React, { useId } from 'react';

type Point = readonly [number, number, number];

// All faces, axles and wheels share one orthographic camera. X points toward
// the rover's face, Y across its chassis and Z upward.
const project = ([x, y, z]: Point) => [128 + .9 * x - .66 * y, 137 + .27 * x + .42 * y - z] as const;
const polygon = (points: Point[]) => points.map(p => project(p).join(',')).join(' ');
const wheelPositions = [-54, 0, 54];

function Panel({ points, fill, stroke }: { points: Point[]; fill: string; stroke?: string }) {
    return <polygon points={polygon(points)} fill={fill} stroke={stroke} strokeWidth="1.2" strokeLinejoin="round"/>;
}

function Shell({ x0, x1, y0, y1, z0, z1, top, side, front }: {
    x0: number; x1: number; y0: number; y1: number; z0: number; z1: number;
    top: string; side: string; front: string;
}) {
    return <>
        <Panel points={[[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]]} fill={side}/>
        <Panel points={[[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],[x1,y0,z1]]} fill={front}/>
        <Panel points={[[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]]} fill={top}/>
    </>;
}

function Wheel({ x, y, near }: { x: number; y: number; near: boolean }) {
    const [cx, cy] = project([x,y,12]);
    const [backX, backY] = project([x,y-9,12]);
    // The circular wheel lies in the X/Z plane, not the screen plane.
    const face = `matrix(.9 .27 0 -1 ${cx} ${cy})`;
    return <g>
        <ellipse transform={`matrix(.9 .27 0 -1 ${backX} ${backY})`} rx="20" ry="20" fill="#102537"/>
        <path d={`M${backX},${backY-20} L${cx},${cy-20} L${cx},${cy+20} L${backX},${backY+20}Z`} fill="#102537"/>
        <g transform={face}>
            <circle r="20" fill={near?'#233c50':'#1b3245'} stroke="#0e2638" strokeWidth="2"/>
            <circle r="16.5" fill="none" stroke="#4c697b" strokeWidth="2" strokeDasharray="3 5"/>
            <circle r="11.5" fill={near?'#bdced1':'#8aa8b5'}/>
            <circle r="8" fill="#7496a5"/>
            {[0,120,240].map(a=><path key={a} d="M0 3V8" transform={`rotate(${a})`} stroke="#dce9e7" strokeWidth="2.6" strokeLinecap="round"/>)}
            <circle r="3.5" fill="#29485d"/>
        </g>
    </g>;
}

export function RoverPortrait({ color, className = '' }: { color: string; className?: string }) {
    const id = useId().replace(/:/g, '');
    const antennaBase = project([-47,-19,53]), antennaTop = project([-47,-19,109]);
    const faceOrigin = project([55,0,0]);
    const face = `matrix(-.66 .42 0 -1 ${faceOrigin[0]} ${faceOrigin[1]})`;
    return <svg className={className} viewBox="0 0 260 200" aria-hidden="true" focusable="false">
        <defs>
            <linearGradient id={`${id}-paint`} x1="0" y1="0" x2="0" y2="1">
                <stop stopColor={color}/><stop offset="1" stopColor={color} stopOpacity=".65"/>
            </linearGradient>
            <linearGradient id={`${id}-glass`} x1="0" y1="0" x2="1" y2="1">
                <stop stopColor="#294e63"/><stop offset="1" stopColor="#102d42"/>
            </linearGradient>
        </defs>
        <ellipse cx="130" cy="167" rx="99" ry="17" fill="#061624" opacity=".24" transform="rotate(13 130 167)"/>
        {wheelPositions.map(x=><Wheel key={x} x={x} y={-39} near={false}/>)}

        <Shell x0={-67} x1={62} y0={-28} y1={31} z0={20} z1={33} top="#4d6c7b" side="#28475b" front="#385a6b"/>
        <Shell x0={-74} x1={66} y0={-35} y1={35} z0={32} z1={51} top="#e6f1e8" side={`url(#${id}-paint)`} front={color}/>
        <Panel points={[[-74,35,47],[66,35,47],[66,35,51],[-74,35,51]]} fill="#b3f0dc"/>
        <Panel points={[[66,-35,32],[66,35,32],[66,35,37],[66,-35,37]]} fill="#3b7e83"/>
        <Panel points={[[68,-24,27],[68,25,27],[68,25,32],[68,-24,32]]} fill="#d4e4dc"/>

        {/* Rear deck solar cells lie on the same plane as the chassis top. */}
        <Panel points={[[-65,-27,53],[-15,-27,53],[-15,27,53],[-65,27,53]]} fill="#254c68" stroke="#b4d8df"/>
        {[-49,-32].map(x=><Panel key={x} points={[[x,-26,53.1],[x+1,-26,53.1],[x+1,26,53.1],[x,26,53.1]]} fill="#719fb8"/>)}
        {[-9,9].map(y=><Panel key={y} points={[[-64,y,53.1],[-16,y,53.1],[-16,y+1,53.1],[-64,y+1,53.1]]} fill="#719fb8"/>)}
        <path d={`M${antennaBase.join(',')}L${antennaTop.join(',')}`} stroke="#bdced0" strokeWidth="4" strokeLinecap="round"/>
        <circle cx={antennaTop[0]} cy={antennaTop[1]} r="6.5" fill={color}/>
        <circle cx={antennaTop[0]-1.8} cy={antennaTop[1]-2} r="2" fill="#f0fff6" opacity=".75"/>

        {/* Low, broad instrument head with the face on the actual front plane. */}
        <Shell x0={0} x1={55} y0={-29} y1={29} z0={52} z1={92} top="#f4f5e7" side="#bdcec9" front="#e7eee0"/>
        <Panel points={[[0,29,52],[55,29,52],[55,29,59],[0,29,59]]} fill={color}/>
        <Panel points={[[4,29.1,67],[37,29.1,67],[37,29.1,82],[4,29.1,82]]} fill="#45677a"/>
        {[11,20,29].map(x=><Panel key={x} points={[[x,29.2,70],[x+2,29.2,70],[x+2,29.2,79],[x,29.2,79]]} fill="#9fbfcb"/>)}
        <g transform={face}>
            <rect x="-26" y="59" width="52" height="29" rx="6" fill={`url(#${id}-glass)`}/>
            <path d="M-19 84H11" stroke="#7dabb9" strokeWidth="1.5" strokeLinecap="round" opacity=".45"/>
            {[-13,13].map(y=><g key={y}><ellipse cx={y} cy="75" rx="5.5" ry="6.5" fill="#89f4dd"/><circle cx={y-1} cy="77" r="1.5" fill="#f2fff5"/></g>)}
            <path d="M-5 65Q0 62 5 65" fill="none" stroke="#89f4dd" strokeWidth="1.8" strokeLinecap="round"/>
        </g>

        {/* Visible rocker arms attach the three near wheels to the chassis. */}
        <polyline points={polygon([[-54,40,12],[-27,40,28],[0,40,12],[26,40,28],[54,40,12]])} fill="none" stroke="#597d8c" strokeWidth="7" strokeLinejoin="round"/>
        {wheelPositions.map(x=><Wheel key={x} x={x} y={44} near/>)}
    </svg>;
}
