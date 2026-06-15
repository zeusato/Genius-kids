import React, { useEffect, useMemo, useRef, useState } from 'react';
import { RotateCcw, Link } from 'lucide-react';
import Gear from './components/Gear';
import GearCanvas, { Point } from './components/GearCanvas';
import GearHeader from './components/GearHeader';
import { DifficultyPill, RoleBadge } from './components/GearBits';
import { CANVAS, COLORS, MOTOR, PLAY, SIZE_LABEL, teethToRadius } from './engine/constants';
import { distance } from './engine/graph';
import { generateBuildLevel } from './engine/levelgen';
import { simulate } from './engine/simulate';
import { evaluateBuildGoal } from './engine/goals';
import { BeltSpec, BuildLevel, Difficulty, GearSpec, WaterZone } from './engine/types';

interface GearsGamePageProps {
    difficulty: Difficulty;
    onBack?: () => void;
}

const DELETE_Y = CANVAS.H - 34;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

const colorFor = (g: GearSpec): string =>
    g.role === 'motor' ? COLORS.motor : g.role === 'target' ? COLORS.target : g.role === 'anchor' ? COLORS.anchor : COLORS.gear;

const inWater = (x: number, y: number, r: number, zones: WaterZone[]): boolean =>
    zones.some((z) => {
        const cx = clamp(x, z.x, z.x + z.width);
        const cy = clamp(y, z.y, z.y + z.height);
        return distance({ x, y }, { x: cx, y: cy }) < r + 5;
    });

// Đẩy bánh răng ra khỏi chỗ chồng (về sát khoảng ăn khớp, KHÔNG tạo khe lớn),
// kẹp trong sân, và TỪ CHỐI nếu rơi vào nước / vẫn chồng. Sửa lỗi cũ bỏ qua
// nước & biên rồi huỷ luôn cú thả.
const resolvePlacement = (x: number, y: number, r: number, others: GearSpec[], zones: WaterZone[]): Point | null => {
    let cx = x;
    let cy = y;
    for (let it = 0; it < 6; it++) {
        let moved = false;
        for (const o of others) {
            const dx = cx - o.x;
            const dy = cy - o.y;
            const d = Math.hypot(dx, dy) || 0.001;
            const min = r + o.radius; // chạm = ăn khớp
            if (d < min) {
                const push = min - d + 1;
                cx += (dx / d) * push;
                cy += (dy / d) * push;
                moved = true;
            }
        }
        cx = clamp(cx, PLAY.left + r, PLAY.right - r);
        cy = clamp(cy, PLAY.top + r, PLAY.bottom - r);
        if (!moved) break;
    }
    if (inWater(cx, cy, r, zones)) return null;
    for (const o of others) {
        if (distance({ x: cx, y: cy }, o) < r + o.radius - 2) return null;
    }
    return { x: cx, y: cy };
};

const GearsGamePage: React.FC<GearsGamePageProps> = ({ difficulty, onBack }) => {
    const seedRef = useRef((Date.now() & 0x7fffffff) >>> 0);
    const idRef = useRef(0);
    const [level, setLevel] = useState<BuildLevel>(() => generateBuildLevel(difficulty, seedRef.current));

    const [userGears, setUserGears] = useState<GearSpec[]>([]);
    const [belts, setBelts] = useState<BeltSpec[]>([]);
    const [armedTeeth, setArmedTeeth] = useState<number | null>(null);
    const [beltMode, setBeltMode] = useState<{ active: boolean; sourceId: string | null }>({ active: false, sourceId: null });
    const [beltKind, setBeltKind] = useState<'belt' | 'belt-crossed'>('belt');
    const [drag, setDrag] = useState<{ id: string } | null>(null);
    const [dragPos, setDragPos] = useState<Point | null>(null);
    const [hover, setHover] = useState<Point | null>(null);

    useEffect(() => {
        setUserGears([]);
        setBelts([]);
        setArmedTeeth(null);
        setBeltMode({ active: false, sourceId: null });
        setDrag(null);
        setDragPos(null);
    }, [level]);

    const allGears = useMemo(() => [...level.layout.gears, ...userGears], [level, userGears]);
    const displayGears = useMemo(
        () => (drag && dragPos ? allGears.map((g) => (g.id === drag.id ? { ...g, x: dragPos.x, y: dragPos.y } : g)) : allGears),
        [allGears, drag, dragPos]
    );

    const sim = useMemo(
        () => simulate({ gears: displayGears, belts }, { id: 'motor', dir: MOTOR.dir, speed: MOTOR.speed }),
        [displayGears, belts]
    );
    const victory = useMemo(() => evaluateBuildGoal(sim, level), [sim, level]);

    const gearAt = (p: Point, opts: { skipFixed?: boolean } = {}): GearSpec | null => {
        for (let i = displayGears.length - 1; i >= 0; i--) {
            const g = displayGears[i];
            if (opts.skipFixed && g.fixed) continue;
            if (distance(p, g) <= g.radius) return g;
        }
        return null;
    };

    const placeNewGear = (teeth: number, p: Point) => {
        if (userGears.length >= level.maxGears) return;
        const r = teethToRadius(teeth);
        const others = allGears;
        const resolved = resolvePlacement(p.x, p.y, r, others, level.waterZones);
        if (!resolved) return;
        const id = `u${idRef.current++}`;
        setUserGears((prev) => [...prev, { id, role: 'gear', fixed: false, teeth, radius: r, x: resolved.x, y: resolved.y }]);
    };

    const connectBelt = (id: string) => {
        if (!beltMode.sourceId) {
            setBeltMode({ active: true, sourceId: id });
            return;
        }
        if (beltMode.sourceId === id) {
            setBeltMode({ active: true, sourceId: null });
            return;
        }
        const a = allGears.find((g) => g.id === beltMode.sourceId);
        const b = allGears.find((g) => g.id === id);
        if (a && b && distance(a, b) <= level.maxBeltLength && belts.length < level.maxBelts) {
            setBelts((prev) => [...prev, { id: `b${idRef.current++}`, a: a.id, b: b.id, kind: beltKind }]);
        }
        setBeltMode({ active: false, sourceId: null });
    };

    const onPointerDown = (p: Point, e: React.PointerEvent) => {
        if (beltMode.active) {
            const hit = gearAt(p);
            if (hit) connectBelt(hit.id);
            return;
        }
        if (armedTeeth != null) {
            placeNewGear(armedTeeth, p);
            setArmedTeeth(null);
            return;
        }
        const hit = gearAt(p, { skipFixed: true });
        if (hit) {
            setDrag({ id: hit.id });
            setDragPos({ x: hit.x, y: hit.y });
            try {
                (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
            } catch {
                /* con trỏ tổng hợp / môi trường không hỗ trợ — bỏ qua */
            }
        }
    };

    const onPointerMove = (p: Point) => {
        setHover(p);
        if (drag) setDragPos(p);
    };

    const onPointerUp = (p: Point) => {
        if (!drag) return;
        const id = drag.id;
        if (p.y > DELETE_Y) {
            setUserGears((prev) => prev.filter((g) => g.id !== id));
            setBelts((prev) => prev.filter((b) => b.a !== id && b.b !== id));
            setDrag(null);
            setDragPos(null);
            return;
        }
        const moving = userGears.find((g) => g.id === id)!;
        const others = allGears.filter((g) => g.id !== id);
        const resolved = resolvePlacement(p.x, p.y, moving.radius, others, level.waterZones);
        if (resolved) setUserGears((prev) => prev.map((g) => (g.id === id ? { ...g, x: resolved.x, y: resolved.y } : g)));
        setDrag(null);
        setDragPos(null);
    };

    const regen = (d: Difficulty) => {
        seedRef.current = ((seedRef.current * 1103515245 + 12345) & 0x7fffffff) >>> 0;
        setLevel(generateBuildLevel(d, seedRef.current));
    };
    const resetLevel = () => regen(level.difficulty);
    const nextLevel = () => {
        const order: Difficulty[] = ['easy', 'medium', 'hard'];
        regen(order[Math.min(order.indexOf(level.difficulty) + 1, 2)]);
    };

    const targetArrow = level.targetDirection > 0 ? '↻ (cùng chiều kim đồng hồ)' : '↺ (ngược chiều kim đồng hồ)';

    return (
        <div className="w-full h-screen bg-gradient-to-b from-amber-50 to-orange-100 flex flex-col font-sans select-none overflow-hidden">
            <GearHeader title="⚙️ Lắp Bánh Răng" onBack={onBack} />

            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="w-full px-4 py-3 flex items-center justify-between bg-white/50 gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                        <DifficultyPill difficulty={level.difficulty} />
                        <span className="text-gray-600 text-sm">
                            ĐÍCH cần quay {targetArrow} · Gear {userGears.length}/{level.maxGears}
                            {level.maxBelts > 0 ? ` · Belt ${belts.length}/${level.maxBelts}` : ''}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        {sim.jammed && (
                            <span className="text-xs text-red-700 bg-red-100 border border-red-300 px-2 py-1 rounded font-medium">
                                ⚠️ Bị kẹt! Hai bánh răng đỏ đang xung đột chiều quay
                            </span>
                        )}
                        <button onClick={resetLevel} className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-gray-50 rounded-lg border border-gray-300 text-gray-600 text-sm shadow-sm">
                            <RotateCcw size={14} /> Làm mới
                        </button>
                    </div>
                </div>

                <div className="flex-1 w-full px-4 pb-2">
                    <GearCanvas
                        gridId="build-grid"
                        gridColor="rgba(251, 146, 60, 0.15)"
                        borderClass="border-amber-200"
                        waterZones={level.waterZones}
                        belts={belts}
                        gears={displayGears}
                        runtime={sim.runtime}
                        onPointerDown={onPointerDown}
                        onPointerMove={onPointerMove}
                        onPointerUp={onPointerUp}
                        onPointerLeave={() => setHover(null)}
                        overlay={
                            victory ? (
                                <div className="w-full h-full bg-black/60 flex items-center justify-center">
                                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white px-8 py-6 rounded-2xl shadow-2xl border-4 border-white text-center">
                                        <div className="text-3xl font-bold mb-3">🎉 HOÀN THÀNH!</div>
                                        <div className="flex gap-3 justify-center">
                                            <button onClick={nextLevel} className="px-5 py-2 bg-white text-green-600 rounded-lg font-bold hover:bg-gray-100">Tiếp tục →</button>
                                            <button onClick={resetLevel} className="px-5 py-2 bg-white/20 text-white rounded-lg font-bold hover:bg-white/30">Chơi lại</button>
                                        </div>
                                    </div>
                                </div>
                            ) : undefined
                        }
                    >
                        {/* Lớp bánh răng — pointer-events none để board tự hit-test theo toạ độ design */}
                        <div className="absolute inset-0 pointer-events-none">
                            {/* Vùng xoá khi đang kéo */}
                            {drag && (
                                <div className="absolute left-0 right-0 bg-red-500/15 border-t-2 border-dashed border-red-400 flex items-center justify-center text-red-600 text-sm font-medium"
                                    style={{ top: DELETE_Y, height: CANVAS.H - DELETE_Y }}>
                                    Thả vào đây để xoá 🗑️
                                </div>
                            )}

                            {/* Bóng mờ bánh răng sắp đặt */}
                            {armedTeeth != null && hover && (
                                <div className="absolute opacity-50" style={{ left: hover.x - teethToRadius(armedTeeth), top: hover.y - teethToRadius(armedTeeth) }}>
                                    <Gear teeth={armedTeeth} radius={teethToRadius(armedTeeth)} color={COLORS.gear} />
                                </div>
                            )}

                            {displayGears.map((g) => {
                                const rt = sim.runtime.get(g.id);
                                const isSource = beltMode.sourceId === g.id;
                                return (
                                    <div key={g.id} className="absolute" style={{ left: g.x - g.radius, top: g.y - g.radius }}>
                                        {isSource && (
                                            <div className="absolute rounded-full ring-4 ring-cyan-400" style={{ inset: -4, width: g.radius * 2 + 8, height: g.radius * 2 + 8 }} />
                                        )}
                                        <RoleBadge role={g.role} />
                                        <Gear teeth={g.teeth} radius={g.radius} color={colorFor(g)} runtime={rt} isFixed={g.fixed} />
                                    </div>
                                );
                            })}
                        </div>
                    </GearCanvas>
                </div>

                <div className="w-full py-3 flex items-center justify-center gap-4 bg-white border-t border-amber-200 flex-wrap">
                    {level.availableGearSizes.map((teeth) => {
                        const disabled = userGears.length >= level.maxGears;
                        const active = armedTeeth === teeth;
                        return (
                            <button
                                key={teeth}
                                disabled={disabled}
                                aria-label={`Chọn bánh răng cỡ ${SIZE_LABEL[teeth] ?? teeth} (${teeth} răng)`}
                                aria-pressed={active}
                                onClick={() => { setArmedTeeth(active ? null : teeth); setBeltMode({ active: false, sourceId: null }); }}
                                className={`p-2 rounded-xl shadow flex flex-col items-center transition-all ${disabled ? 'bg-gray-100 opacity-40 cursor-not-allowed' : active ? 'bg-amber-300 ring-2 ring-amber-500 -translate-y-1' : 'bg-amber-100 hover:bg-amber-200 hover:-translate-y-1'}`}
                            >
                                <span className="text-[10px] font-bold text-amber-700 mb-1">{SIZE_LABEL[teeth] ?? teeth}</span>
                                <Gear teeth={teeth} radius={teeth} color={COLORS.toolboxGear} />
                            </button>
                        );
                    })}
                    {level.maxBelts > 0 && (
                        <div className="flex items-center gap-2">
                            <button
                                aria-label="Công cụ dây đai"
                                aria-pressed={beltMode.active}
                                onClick={() => { setBeltMode((prev) => ({ active: !prev.active, sourceId: null })); setArmedTeeth(null); }}
                                disabled={belts.length >= level.maxBelts}
                                className={`p-3 rounded-xl shadow flex flex-col items-center transition-all ${belts.length >= level.maxBelts ? 'bg-gray-100 opacity-40 cursor-not-allowed' : beltMode.active ? 'bg-cyan-500 text-white' : 'bg-amber-100 hover:bg-amber-200 text-amber-700'}`}
                            >
                                <Link size={20} />
                                <span className="text-[10px] font-bold mt-1">Belt ({level.maxBelts - belts.length})</span>
                            </button>
                            {beltMode.active && (
                                <div className="flex flex-col gap-1" role="group" aria-label="Loại dây đai">
                                    <button
                                        aria-pressed={beltKind === 'belt'}
                                        onClick={() => setBeltKind('belt')}
                                        className={`px-2 py-1 rounded-lg text-[11px] font-bold border ${beltKind === 'belt' ? 'bg-cyan-500 text-white border-cyan-600' : 'bg-white text-gray-600 border-gray-300'}`}
                                    >
                                        ⮕⮕ Thẳng
                                    </button>
                                    <button
                                        aria-pressed={beltKind === 'belt-crossed'}
                                        onClick={() => setBeltKind('belt-crossed')}
                                        className={`px-2 py-1 rounded-lg text-[11px] font-bold border ${beltKind === 'belt-crossed' ? 'bg-cyan-500 text-white border-cyan-600' : 'bg-white text-gray-600 border-gray-300'}`}
                                    >
                                        ⮕⬅ Chéo
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                    <span className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded">
                        {beltMode.active ? '🔗 Chạm 2 bánh răng để nối đai' : armedTeeth != null ? '👆 Chạm vào sân để đặt' : '💡 Chọn bánh răng rồi chạm vào sân · Kéo bánh răng xuống đáy để xoá'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default GearsGamePage;
