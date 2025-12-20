import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, PanInfo } from 'framer-motion';
import Gear from './components/Gear';
import Belt from './components/Belt';
import WaterZone from './components/WaterZone';
import { GearData, BeltData, calculateNetwork, resolveCollision } from './engine/Physics';
import { LevelData, generateLevel, isInWaterZone } from './engine/LevelGenerator';
import { ArrowLeft, RotateCcw, Link, Music, Volume2 } from 'lucide-react';

interface DraggingGear {
    teeth: number;
    x: number;
    y: number;
}

interface GearsGamePageProps {
    difficulty: 'easy' | 'medium' | 'hard';
    onBack?: () => void;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;

const GearsGamePage: React.FC<GearsGamePageProps> = ({ difficulty, onBack }) => {
    const [level, setLevel] = useState<LevelData>(() => generateLevel(difficulty));
    const [gears, setGears] = useState<GearData[]>([]);
    const [belts, setBelts] = useState<BeltData[]>([]);
    const [showVictory, setShowVictory] = useState(false);
    const [userGearCount, setUserGearCount] = useState(0);
    const [userBeltCount, setUserBeltCount] = useState(0);
    const [draggingGear, setDraggingGear] = useState<DraggingGear | null>(null);
    const [beltMode, setBeltMode] = useState<{ active: boolean; sourceId: string | null }>({ active: false, sourceId: null });
    const [musicOn, setMusicOn] = useState(true);
    const [soundOn, setSoundOn] = useState(true);
    const canvasRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const motor: GearData = { id: 'motor', x: level.motorPosition.x, y: level.motorPosition.y, teeth: 12, radius: 40, speed: 0, direction: 0, isFixed: true };
        const target: GearData = { id: 'target', x: level.targetPosition.x, y: level.targetPosition.y, teeth: 14, radius: 48, speed: 0, direction: 0, isFixed: true };
        setGears([motor, target, ...level.fixedGears]);
        setBelts([...level.belts]);
        setUserGearCount(0);
        setUserBeltCount(0);
        setShowVictory(false);
        setBeltMode({ active: false, sourceId: null });
        setDraggingGear(null);
    }, [level]);

    useEffect(() => {
        const interval = setInterval(() => {
            setGears(prevGears => {
                const updated = calculateNetwork(prevGears, belts, 'motor');
                const target = updated.find(g => g.id === 'target');
                const directionOk = target && target.direction === level.targetDirection;
                const speedOk = !level.targetMinSpeed || (target && target.speed >= level.targetMinSpeed);
                const fixedGears = updated.filter(g => g.id.startsWith('fixed'));
                const allFixedSpinning = fixedGears.length === 0 || fixedGears.every(g => g.speed !== 0);
                setShowVictory(!!(directionOk && speedOk && allFixedSpinning));
                return updated;
            });
        }, 100);
        return () => clearInterval(interval);
    }, [belts, level.targetDirection, level.targetMinSpeed]);

    const getContentOffset = () => {
        if (!canvasRef.current) return 0;
        const canvasWidth = canvasRef.current.offsetWidth;
        return (canvasWidth - CANVAS_WIDTH) / 2;
    };

    const handleToolboxPointerDown = useCallback((teeth: number, e: React.PointerEvent) => {
        if (userGearCount >= level.maxGears) return;
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const offset = getContentOffset();
        setDraggingGear({ teeth, x: e.clientX - rect.left - offset, y: e.clientY - rect.top });
    }, [level.maxGears, userGearCount]);

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        if (!draggingGear) return;
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const offset = getContentOffset();
        setDraggingGear(prev => prev ? { ...prev, x: e.clientX - rect.left - offset, y: e.clientY - rect.top } : null);
    }, [draggingGear]);

    const handlePointerUp = useCallback((e: React.PointerEvent) => {
        if (!draggingGear) return;
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const offset = getContentOffset();

        const dropX = e.clientX - rect.left - offset;
        const dropY = e.clientY - rect.top;
        const radius = draggingGear.teeth * 3;

        if (dropY > CANVAS_HEIGHT - 60 || dropY < 40 || dropX < 40 || dropX > CANVAS_WIDTH - 40) {
            setDraggingGear(null);
            return;
        }

        if (isInWaterZone(dropX, dropY, radius, level.waterZones)) {
            setDraggingGear(null);
            return;
        }

        const newGear: GearData = { id: `gear-${Date.now()}`, x: dropX, y: dropY, teeth: draggingGear.teeth, radius, speed: 0, direction: 0, isFixed: false };
        const resolved = resolveCollision(newGear, gears);
        if (isInWaterZone(resolved.x, resolved.y, radius, level.waterZones)) {
            setDraggingGear(null);
            return;
        }

        newGear.x = resolved.x;
        newGear.y = resolved.y;
        setGears(prev => [...prev, newGear]);
        setUserGearCount(prev => prev + 1);
        setDraggingGear(null);
    }, [draggingGear, gears, level.waterZones]);

    const handleGearDragEnd = useCallback((gearId: string, info: PanInfo) => {
        const gear = gears.find(g => g.id === gearId);
        if (!gear || gear.isFixed) return;
        const newY = gear.y + info.offset.y;
        if (newY > CANVAS_HEIGHT - 40) {
            setGears(prev => prev.filter(g => g.id !== gearId));
            setUserGearCount(prev => Math.max(0, prev - 1));
            setBelts(prev => prev.filter(b => b.sourceId !== gearId && b.targetId !== gearId));
            return;
        }
        const newX = gear.x + info.offset.x;
        if (isInWaterZone(newX, newY, gear.radius, level.waterZones)) return;
        const tempGear = { ...gear, x: newX, y: newY };
        const resolved = resolveCollision(tempGear, gears.filter(g => g.id !== gearId));
        if (isInWaterZone(resolved.x, resolved.y, gear.radius, level.waterZones)) return;
        setGears(prev => prev.map(g => g.id === gearId ? { ...g, x: resolved.x, y: resolved.y } : g));
    }, [gears, level.waterZones]);

    const handleGearClick = useCallback((gearId: string) => {
        if (!beltMode.active) return;
        if (!beltMode.sourceId) {
            setBeltMode({ active: true, sourceId: gearId });
        } else if (beltMode.sourceId !== gearId) {
            const sourceGear = gears.find(g => g.id === beltMode.sourceId);
            const targetGear = gears.find(g => g.id === gearId);
            if (sourceGear && targetGear) {
                const beltLength = Math.sqrt((targetGear.x - sourceGear.x) ** 2 + (targetGear.y - sourceGear.y) ** 2);
                if (beltLength <= level.maxBeltLength && userBeltCount < level.maxBelts) {
                    setBelts(prev => [...prev, { id: `belt-${Date.now()}`, sourceId: beltMode.sourceId!, targetId: gearId }]);
                    setUserBeltCount(prev => prev + 1);
                }
            }
            setBeltMode({ active: false, sourceId: null });
        }
    }, [beltMode, gears, level.maxBeltLength, level.maxBelts, userBeltCount]);

    const resetLevel = () => setLevel(generateLevel(level.difficulty));
    const nextLevel = () => {
        const diffs: ('easy' | 'medium' | 'hard')[] = ['easy', 'medium', 'hard'];
        const idx = diffs.indexOf(level.difficulty);
        setLevel(generateLevel(diffs[Math.min(idx + 1, 2)]));
    };

    return (
        <div className="w-full h-screen bg-gradient-to-b from-amber-50 to-orange-100 flex flex-col font-sans select-none overflow-hidden">
            {/* ========== PAGE HEADER ========== */}
            <div className="flex items-center justify-between bg-gradient-to-r from-amber-100 via-orange-100 to-amber-100 px-4 py-3 border-b border-amber-200 shadow-sm z-50 relative">
                <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-full font-medium shadow hover:shadow-md transition-all">
                    <ArrowLeft size={18} />
                    Menu
                </button>
                <h1 className="text-xl font-bold text-amber-800">⚙️ Lắp Bánh Răng</h1>
                <div className="flex items-center gap-2">
                    <button onClick={() => setMusicOn(!musicOn)} className={`p-2 rounded-full ${musicOn ? 'bg-amber-200 text-amber-700' : 'bg-gray-200 text-gray-400'}`}>
                        <Music size={20} />
                    </button>
                    <button onClick={() => setSoundOn(!soundOn)} className={`p-2 rounded-full ${soundOn ? 'bg-amber-200 text-amber-700' : 'bg-gray-200 text-gray-400'}`}>
                        <Volume2 size={20} />
                    </button>
                </div>
            </div>

            {/* ========== GAME CONTENT ========== */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* ----- GAME HEADER ----- */}
                <div className="w-full px-4 py-3 flex items-center justify-between bg-white/50">
                    <div className="flex items-center gap-3">
                        <span className={`text-sm px-3 py-1 rounded-full font-medium ${level.difficulty === 'easy' ? 'bg-green-100 text-green-700 border border-green-300' : level.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' : 'bg-red-100 text-red-700 border border-red-300'}`}>
                            {level.difficulty === 'easy' ? 'Dễ' : level.difficulty === 'medium' ? 'Trung bình' : 'Khó'}
                        </span>
                        <span className="text-gray-600 text-sm">Kết nối MOTOR → ĐÍCH | Gear: {userGearCount}/{level.maxGears} | Belt: {userBeltCount}/{level.maxBelts}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded">💡 Kéo gear xuống để trả lại</span>
                        <button onClick={resetLevel} className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-gray-50 rounded-lg border border-gray-300 text-gray-600 text-sm shadow-sm">
                            <RotateCcw size={14} />
                            Làm mới
                        </button>
                    </div>
                </div>

                {/* ----- MAIN CANVAS (full width, content centered) ----- */}
                <div className="flex-1 w-full px-4 pb-2">
                    <div
                        ref={canvasRef}
                        className="relative w-full h-full bg-white rounded-2xl shadow-lg border border-amber-200 overflow-hidden touch-none"
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerLeave={() => setDraggingGear(null)}
                    >
                        {/* Centered content container */}
                        <div ref={contentRef} className="absolute inset-0 flex justify-center">
                            <div className="relative" style={{ width: CANVAS_WIDTH, height: '100%' }}>
                                {/* Grid + Water + Belts */}
                                <svg className="absolute inset-0 w-full h-full z-0 pointer-events-none">
                                    <defs>
                                        <pattern id="build-grid" width="25" height="25" patternUnits="userSpaceOnUse">
                                            <circle cx="12.5" cy="12.5" r="1" fill="rgba(251, 146, 60, 0.1)" />
                                        </pattern>
                                    </defs>
                                    <rect width="100%" height="100%" fill="url(#build-grid)" />
                                    {level.waterZones.map(zone => <WaterZone key={zone.id} {...zone} />)}
                                    {belts.map(belt => {
                                        const g1 = gears.find(g => g.id === belt.sourceId);
                                        const g2 = gears.find(g => g.id === belt.targetId);
                                        if (!g1 || !g2) return null;
                                        return <Belt key={belt.id} x1={g1.x} y1={g1.y} r1={g1.radius} x2={g2.x} y2={g2.y} r2={g2.radius} speed={Math.abs(g1.speed)} />;
                                    })}
                                </svg>

                                {/* Victory overlay */}
                                {showVictory && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
                                        <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white px-8 py-6 rounded-2xl shadow-2xl border-4 border-white text-center">
                                            <div className="text-3xl font-bold mb-3">🎉 HOÀN THÀNH!</div>
                                            <div className="flex gap-3 justify-center">
                                                <button onClick={nextLevel} className="px-5 py-2 bg-white text-green-600 rounded-lg font-bold hover:bg-gray-100">Tiếp tục →</button>
                                                <button onClick={resetLevel} className="px-5 py-2 bg-white/20 text-white rounded-lg font-bold hover:bg-white/30">Chơi lại</button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Gears */}
                                {gears.map(gear => (
                                    <motion.div
                                        key={gear.id}
                                        className={`absolute z-10 ${gear.isFixed ? '' : 'cursor-grab active:cursor-grabbing'} ${beltMode.active ? 'cursor-pointer' : ''} ${beltMode.sourceId === gear.id ? 'ring-4 ring-cyan-400 rounded-full' : ''}`}
                                        style={{ left: gear.x - gear.radius, top: gear.y - gear.radius }}
                                        drag={!gear.isFixed}
                                        dragMomentum={false}
                                        onDragEnd={(_, info) => handleGearDragEnd(gear.id, info)}
                                        onClick={() => handleGearClick(gear.id)}
                                    >
                                        {gear.id === 'motor' && <div className="absolute -left-16 top-1/2 -translate-y-1/2 text-emerald-600 font-bold text-xs bg-white px-2 py-1 rounded shadow border-2 border-emerald-300">⚡ MOTOR</div>}
                                        {gear.id === 'target' && <div className="absolute -right-12 top-1/2 -translate-y-1/2 text-rose-600 font-bold text-xs bg-white px-2 py-1 rounded shadow border-2 border-rose-300">🎯 ĐÍCH</div>}
                                        <Gear x={gear.radius} y={gear.radius} teeth={gear.teeth} radius={gear.radius} speed={gear.speed} direction={gear.direction} color={gear.id === 'motor' ? '#22c55e' : gear.id === 'target' ? '#f43f5e' : gear.isFixed ? '#94a3b8' : '#facc15'} isFixed={gear.isFixed} />
                                    </motion.div>
                                ))}

                                {/* Dragging preview */}
                                {draggingGear && (
                                    <div className="absolute pointer-events-none z-50 opacity-70" style={{ left: draggingGear.x - draggingGear.teeth * 3, top: draggingGear.y - draggingGear.teeth * 3 }}>
                                        <Gear x={draggingGear.teeth * 3} y={draggingGear.teeth * 3} teeth={draggingGear.teeth} radius={draggingGear.teeth * 3} speed={0} color="#facc15" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ----- TOOLBOX ----- */}
                <div className="w-full py-3 flex items-center justify-center gap-4 bg-white border-t border-amber-200">
                    {level.availableGearSizes.map(teeth => (
                        <div
                            key={teeth}
                            className={`p-2 rounded-xl shadow flex flex-col items-center transition-all ${userGearCount >= level.maxGears ? 'bg-gray-100 opacity-40 cursor-not-allowed' : 'bg-amber-100 hover:bg-amber-200 cursor-grab hover:-translate-y-1'}`}
                            onPointerDown={e => handleToolboxPointerDown(teeth, e)}
                        >
                            <span className="text-[10px] font-bold text-amber-700 mb-1">{teeth === 8 ? 'S' : teeth === 12 ? 'M' : 'L'}</span>
                            <div className="pointer-events-none"><Gear x={0} y={0} teeth={teeth} radius={teeth * 2} speed={0} color="#f59e0b" /></div>
                        </div>
                    ))}
                    {level.maxBelts > 0 && (
                        <button
                            onClick={() => setBeltMode(prev => ({ active: !prev.active, sourceId: null }))}
                            className={`p-3 rounded-xl shadow flex flex-col items-center transition-all ${userBeltCount >= level.maxBelts ? 'bg-gray-100 opacity-40 cursor-not-allowed' : beltMode.active ? 'bg-cyan-500 text-white' : 'bg-amber-100 hover:bg-amber-200 text-amber-700'}`}
                            disabled={userBeltCount >= level.maxBelts}
                        >
                            <Link size={20} />
                            <span className="text-[10px] font-bold mt-1">Belt ({level.maxBelts - userBeltCount})</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GearsGamePage;
