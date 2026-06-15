import React, { useEffect, useRef, useState } from 'react';
import { CANVAS } from '../engine/constants';
import { BeltSpec, GearRuntime, GearSpec, WaterZone as WaterZoneT } from '../engine/types';
import Belt from './Belt';
import WaterZone from './WaterZone';

export interface Point {
    x: number;
    y: number;
}

interface GearCanvasProps {
    gridId: string;
    /** Màu chấm lưới (rgba). */
    gridColor: string;
    borderClass?: string;
    waterZones: WaterZoneT[];
    belts: BeltSpec[];
    gears: GearSpec[];
    runtime: Map<string, GearRuntime>;
    /** Hiện chuyển động của đai (BUILD luôn, GUESS chỉ khi đã lật đáp án). */
    beltsAnimated?: boolean;
    /** Lớp bánh răng + tương tác do từng mode tự dựng (đặt tuyệt đối trong board). */
    children?: React.ReactNode;
    overlay?: React.ReactNode;
    onPointerDown?: (p: Point, e: React.PointerEvent) => void;
    onPointerMove?: (p: Point, e: React.PointerEvent) => void;
    onPointerUp?: (p: Point, e: React.PointerEvent) => void;
    onPointerLeave?: () => void;
}

// Board cố định CANVAS.W×CANVAS.H, scale-to-fit + canh giữa. Nhờ vậy toạ độ
// design (engine/levelgen) LUÔN khớp với pixel hiển thị ⇒ hết lệch hệ toạ độ
// và vùng xoá/thả không còn rơi vào giữa canvas như bản cũ.
const GearCanvas: React.FC<GearCanvasProps> = ({
    gridId,
    gridColor,
    borderClass = 'border-amber-200',
    waterZones,
    belts,
    gears,
    runtime,
    beltsAnimated = true,
    children,
    overlay,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerLeave,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const boardRef = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState<{ w: number; h: number }>({ w: CANVAS.W, h: CANVAS.H });

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
        ro.observe(el);
        setSize({ w: el.clientWidth, h: el.clientHeight });
        return () => ro.disconnect();
    }, []);

    const scale = Math.min(size.w / CANVAS.W, size.h / CANVAS.H) || 1;
    const offsetX = (size.w - CANVAS.W * scale) / 2;
    const offsetY = (size.h - CANVAS.H * scale) / 2;

    const toDesign = (e: React.PointerEvent): Point => {
        const rect = boardRef.current!.getBoundingClientRect();
        return { x: (e.clientX - rect.left) / scale, y: (e.clientY - rect.top) / scale };
    };

    const gearMap = new Map(gears.map((g) => [g.id, g]));

    return (
        <div
            ref={containerRef}
            className={`relative w-full h-full bg-white rounded-2xl shadow-lg border ${borderClass} overflow-hidden touch-none`}
        >
            <div
                ref={boardRef}
                className="absolute"
                style={{
                    left: offsetX,
                    top: offsetY,
                    width: CANVAS.W,
                    height: CANVAS.H,
                    transform: `scale(${scale})`,
                    transformOrigin: '0 0',
                }}
                onPointerDown={onPointerDown ? (e) => onPointerDown(toDesign(e), e) : undefined}
                onPointerMove={onPointerMove ? (e) => onPointerMove(toDesign(e), e) : undefined}
                onPointerUp={onPointerUp ? (e) => onPointerUp(toDesign(e), e) : undefined}
                onPointerLeave={onPointerLeave}
            >
                <svg className="absolute inset-0 w-full h-full z-0 pointer-events-none" viewBox={`0 0 ${CANVAS.W} ${CANVAS.H}`}>
                    <defs>
                        <pattern id={gridId} width={25} height={25} patternUnits="userSpaceOnUse">
                            <circle cx={12.5} cy={12.5} r={1} fill={gridColor} />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill={`url(#${gridId})`} />
                    {waterZones.map((z) => (
                        <WaterZone key={z.id} x={z.x} y={z.y} width={z.width} height={z.height} />
                    ))}
                    {belts.map((belt) => {
                        const a = gearMap.get(belt.a);
                        const b = gearMap.get(belt.b);
                        if (!a || !b) return null;
                        const rt = runtime.get(belt.a);
                        return (
                            <Belt
                                key={belt.id}
                                x1={a.x}
                                y1={a.y}
                                r1={a.radius}
                                x2={b.x}
                                y2={b.y}
                                r2={b.radius}
                                speed={beltsAnimated ? rt?.speed ?? 0 : 0}
                                dir={beltsAnimated ? rt?.dir ?? 0 : 0}
                                crossed={belt.kind === 'belt-crossed'}
                            />
                        );
                    })}
                </svg>

                {children}

                {overlay && <div className="absolute inset-0 z-50">{overlay}</div>}
            </div>
        </div>
    );
};

export default GearCanvas;
