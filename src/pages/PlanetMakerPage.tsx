import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { ArrowLeft, Undo2, Save, Palette, X } from 'lucide-react';
import { useStudent } from '../contexts/StudentContext';
import { supportsWebGL } from '../components/solar/scene3d/core';
import { playBlip, playSuccess } from '../components/solar/sfx';
import {
    createTerrain, applyBrush, randomizeTerrain, makeSnap, restoreSnap,
    serializeTerrain, deserializeTerrain, BrushTool, TerrainSnap
} from '../components/planetmaker/terrainOps';
import { PlanetModel } from '../components/planetmaker/PlanetModel';
import {
    loadCustomPlanet, saveCustomPlanet, CustomPlanetDoc, PlanetCosmetics, DEFAULT_COSMETICS
} from '../components/planetmaker/planetStore';

// 🪐 Xưởng Hành Tinh — trẻ nặn địa hình, trồng rừng, trang trí và đưa hành tinh
// của mình vào Hệ Mặt Trời. Cử chỉ: vẽ TRÊN hành tinh = nặn (OrbitControls tạm
// tắt trong nét cọ), kéo chỗ trống = xoay, cuộn/chụm = zoom.

type ToolId = BrushTool | 'rotate';

const TOOLS: { id: ToolId; emoji: string; label: string; title: string }[] = [
    { id: 'rotate', emoji: '🔄', label: 'Xoay', title: 'Chỉ xoay ngắm, không nặn' },
    { id: 'raise', emoji: '🏔️', label: 'Núi', title: 'Nâng đất thành đồi núi' },
    { id: 'lower', emoji: '🕳️', label: 'Đào', title: 'Đào sâu thành biển, sông, hồ' },
    { id: 'smooth', emoji: '🪄', label: 'Mượt', title: 'Làm mượt địa hình' },
    { id: 'forest', emoji: '🌲', label: 'Rừng', title: 'Trồng rừng cây' },
    { id: 'volcano', emoji: '🌋', label: 'Núi lửa', title: 'Chạm để mọc núi lửa' },
    { id: 'erase', emoji: '🧽', label: 'Xoá', title: 'San phẳng và xoá cây' }
];

const BRUSH_RADII = { S: 0.18, M: 0.32, L: 0.5 } as const;
type BrushSize = keyof typeof BRUSH_RADII;

const ATMO_SWATCHES = ['#7EC8E3', '#9FE38B', '#E3B8FF', '#FFC178'];

const noRaycast = () => null as any;
const Z_AXIS = new THREE.Vector3(0, 0, 1);

// Công tắc bật/tắt bo tròn thân thiện trẻ em
const Toggle: React.FC<{ on: boolean; onChange: (v: boolean) => void }> = ({ on, onChange }) => (
    <button
        onClick={() => onChange(!on)}
        className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${on ? 'bg-green-500' : 'bg-white/20'}`}
    >
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
);

export function PlanetMakerPage() {
    const navigate = useNavigate();
    const { currentStudent } = useStudent();
    const studentId = currentStudent?.id;
    const webgl = useMemo(() => supportsWebGL(), []);

    // Địa hình: tạo 1 lần; nạp bản lưu nếu có, không thì gieo ngẫu nhiên
    const terrain = useMemo(() => createTerrain(5), []);
    const initial = useMemo<CustomPlanetDoc | null>(() => {
        const doc = loadCustomPlanet(studentId);
        if (doc && deserializeTerrain(terrain, doc)) return doc;
        randomizeTerrain(terrain, Math.floor(Math.random() * 100000), 0.02);
        return null;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [terrain]);

    const [tool, setTool] = useState<ToolId>('raise');
    const [brushSize, setBrushSize] = useState<BrushSize>('M');
    const [name, setName] = useState(initial?.name ?? `Hành tinh ${currentStudent?.name ?? 'của bé'}`);
    const [seaLevel, setSeaLevel] = useState(initial?.seaLevel ?? 0.02);
    const [cosmetics, setCosmetics] = useState<PlanetCosmetics>(initial?.cosmetics ?? DEFAULT_COSMETICS);
    const [showInSolar, setShowInSolar] = useState(initial?.showInSolar ?? true);
    const [panelOpen, setPanelOpen] = useState(false);
    const [canUndo, setCanUndo] = useState(false);
    const [savedFlash, setSavedFlash] = useState(false);
    const [hintHidden, setHintHidden] = useState(false);

    const dirtyRef = useRef(true);
    const controlsRef = useRef<any>(null);
    const cursorRef = useRef<THREE.Mesh>(null);
    const undoStack = useRef<TerrainSnap[]>([]);
    const stroke = useRef({ active: false, lx: 0, ly: 0, lz: 0 });
    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Ref gương cho handler chạy trong frame/sự kiện (không re-bind mỗi render)
    const toolRef = useRef<ToolId>(tool);
    toolRef.current = tool;
    const brushRef = useRef(BRUSH_RADII[brushSize]);
    brushRef.current = BRUSH_RADII[brushSize];
    const seaRef = useRef(seaLevel);
    seaRef.current = seaLevel;

    // Lưu: persistRef luôn là closure mới nhất; autosave debounce + lưu khi rời trang
    const persistRef = useRef<() => void>(() => { });
    persistRef.current = () => {
        saveCustomPlanet(studentId, {
            version: 1,
            name: name.trim() || 'Hành tinh của bé',
            ...serializeTerrain(terrain),
            seaLevel,
            cosmetics,
            showInSolar,
            updatedAt: new Date().toISOString()
        });
    };
    const scheduleSave = () => {
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => persistRef.current(), 1200);
    };
    useEffect(() => { scheduleSave(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [name, seaLevel, cosmetics, showInSolar]);
    useEffect(() => {
        return () => {
            if (saveTimer.current) clearTimeout(saveTimer.current);
            persistRef.current(); // rời trang = lưu ngay
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const pushUndo = () => {
        undoStack.current.push(makeSnap(terrain));
        if (undoStack.current.length > 12) undoStack.current.shift();
        setCanUndo(true);
    };

    const undo = () => {
        const s = undoStack.current.pop();
        if (!s) return;
        restoreSnap(terrain, s);
        dirtyRef.current = true;
        setCanUndo(undoStack.current.length > 0);
        playBlip();
        scheduleSave();
    };

    const rollRandom = () => {
        pushUndo();
        randomizeTerrain(terrain, Math.floor(Math.random() * 100000), seaRef.current);
        dirtyRef.current = true;
        playBlip();
        scheduleSave();
    };

    const saveNow = () => {
        persistRef.current();
        playSuccess();
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 1800);
    };

    // ----- Cử chỉ nặn trên mesh địa hình -----
    const sculptStrength = () => (toolRef.current === 'raise' || toolRef.current === 'lower' ? 0.014 : 0.5);

    const updateCursor = (p: THREE.Vector3 | null) => {
        const m = cursorRef.current;
        if (!m) return;
        if (!p || toolRef.current === 'rotate') { m.visible = false; return; }
        m.visible = true;
        m.position.copy(p).multiplyScalar(1.01);
        m.quaternion.setFromUnitVectors(Z_AXIS, p.clone().normalize());
        m.scale.setScalar(brushRef.current);
    };

    const onTerrainDown = (e: any) => {
        if (toolRef.current === 'rotate') return;
        e.stopPropagation();
        setHintHidden(true);
        if (controlsRef.current) controlsRef.current.enabled = false;
        pushUndo();
        const p = e.point as THREE.Vector3;
        applyBrush(terrain, toolRef.current, p.x, p.y, p.z, brushRef.current, sculptStrength(), seaRef.current);
        dirtyRef.current = true;
        stroke.current = { active: true, lx: p.x, ly: p.y, lz: p.z };
    };

    const onTerrainMove = (e: any) => {
        const p = e.point as THREE.Vector3;
        updateCursor(p);
        if (!stroke.current.active) return;
        if (toolRef.current === 'volcano') return; // núi lửa: đóng dấu 1 lần mỗi chạm
        const s = stroke.current;
        if (Math.hypot(p.x - s.lx, p.y - s.ly, p.z - s.lz) < brushRef.current * 0.3) return;
        applyBrush(terrain, toolRef.current as BrushTool, p.x, p.y, p.z, brushRef.current, sculptStrength(), seaRef.current);
        dirtyRef.current = true;
        stroke.current = { active: true, lx: p.x, ly: p.y, lz: p.z };
    };

    const endStroke = () => {
        if (stroke.current.active) {
            stroke.current.active = false;
            scheduleSave();
        }
        if (controlsRef.current) controlsRef.current.enabled = true;
    };

    if (!webgl) {
        return (
            <div className="w-full h-screen bg-[#05060f] flex flex-col items-center justify-center gap-4 p-6 text-center">
                <span className="text-5xl">🪐</span>
                <p className="text-white text-lg font-bold">Xưởng Hành Tinh cần thiết bị hỗ trợ 3D (WebGL)</p>
                <p className="text-white/60 text-sm">Hãy thử trên trình duyệt hoặc thiết bị khác nhé!</p>
                <button
                    onClick={() => navigate('/science')}
                    className="mt-2 px-5 py-2.5 bg-white/10 border border-white/20 rounded-full text-white font-bold hover:bg-white/20"
                >
                    ← Quay lại
                </button>
            </div>
        );
    }

    return (
        <div className="w-full h-screen bg-[#05060f] flex flex-col overflow-hidden">
            {/* Header: tên hành tinh + hành động chính */}
            <div className="shrink-0 px-3 pt-3 pb-2 flex items-center gap-2 z-20">
                <button
                    onClick={() => navigate('/science')}
                    className="p-2.5 bg-white/10 border border-white/15 rounded-full text-white hover:bg-white/20 transition-all shrink-0"
                >
                    <ArrowLeft size={20} />
                </button>
                <span className="text-2xl shrink-0">🪐</span>
                <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={24}
                    placeholder="Đặt tên hành tinh..."
                    className="flex-1 min-w-0 max-w-[280px] bg-white/10 border border-white/15 rounded-full px-4 py-2 text-white font-bold text-sm outline-none focus:border-yellow-300/60"
                />
                <div className="flex-1" />
                <button
                    onClick={rollRandom}
                    title="Gieo hành tinh ngẫu nhiên"
                    className="p-2.5 bg-white/10 border border-white/15 rounded-full text-white text-lg leading-none hover:bg-white/20 transition-all shrink-0"
                >
                    🎲
                </button>
                <button
                    onClick={undo}
                    disabled={!canUndo}
                    title="Hoàn tác"
                    className="p-2.5 bg-white/10 border border-white/15 rounded-full text-white hover:bg-white/20 disabled:opacity-30 transition-all shrink-0"
                >
                    <Undo2 size={20} />
                </button>
                <button
                    onClick={saveNow}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full text-white text-sm font-bold shadow-lg shadow-green-500/25 hover:from-green-400 hover:to-emerald-500 transition-all shrink-0"
                >
                    <Save size={16} /> Lưu
                </button>
            </div>

            {/* Vùng 3D */}
            <div className="flex-1 relative min-h-0">
                <Canvas
                    dpr={[1, 1.5]}
                    camera={{ fov: 45, position: [0, 0.7, 2.9], near: 0.1, far: 100 }}
                    gl={{ antialias: true }}
                    style={{ touchAction: 'none' }}
                >
                    <color attach="background" args={['#05060f']} />
                    <ambientLight intensity={0.55} />
                    <directionalLight position={[3, 4, 5]} intensity={1.4} color="#FFF4E0" />
                    <directionalLight position={[-4, -2, -3]} intensity={0.25} color="#88AAFF" />
                    <Stars radius={30} depth={25} count={1200} factor={3} fade speed={0.4} />

                    {/* useTexture (mây) suspend → PHẢI có Suspense trong Canvas, không là trắng cả scene */}
                    <Suspense fallback={null}>
                    <PlanetModel
                        terrain={terrain}
                        seaLevel={seaLevel}
                        cosmetics={cosmetics}
                        dirtyRef={dirtyRef}
                        terrainEvents={{
                            onPointerDown: onTerrainDown,
                            onPointerMove: onTerrainMove,
                            onPointerUp: endStroke,
                            onPointerLeave: (e: any) => { endStroke(); updateCursor(null); }
                        }}
                    >
                        {/* Vòng cọ preview — cập nhật qua ref, không setState */}
                        <mesh ref={cursorRef} visible={false} raycast={noRaycast} renderOrder={10}>
                            <ringGeometry args={[0.85, 1, 48]} />
                            <meshBasicMaterial color="#FFFFFF" transparent opacity={0.7} side={THREE.DoubleSide} depthTest={false} />
                        </mesh>
                    </PlanetModel>
                    </Suspense>

                    <OrbitControls
                        ref={controlsRef}
                        enablePan={false}
                        minDistance={1.5}
                        maxDistance={4.2}
                        enableDamping
                        dampingFactor={0.08}
                        rotateSpeed={0.7}
                    />
                </Canvas>

                {/* Gợi ý lần đầu */}
                {!hintHidden && (
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3.5 py-2 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full text-white/90 text-xs sm:text-sm font-semibold pointer-events-none animate-pulse whitespace-nowrap max-w-[94vw] overflow-hidden text-ellipsis">
                        🖌️ Vẽ lên hành tinh để nặn · kéo chỗ trống để xoay · cuộn để zoom
                    </div>
                )}

                {/* Toast đã lưu */}
                {savedFlash && (
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 px-4 py-2 bg-green-500/90 rounded-full text-white text-sm font-bold shadow-lg z-30">
                        ✅ Đã lưu{showInSolar ? ' — hành tinh đang ở trong Hệ Mặt Trời!' : '!'}
                    </div>
                )}

                {/* Bảng công cụ */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 bg-black/45 backdrop-blur-md rounded-2xl p-1.5 border border-white/10 max-w-[96vw] overflow-x-auto z-10">
                    {TOOLS.map(t => (
                        <button
                            key={t.id}
                            title={t.title}
                            onClick={() => { setTool(t.id); playBlip(); setHintHidden(true); }}
                            className={`flex flex-col items-center px-2.5 py-1.5 rounded-xl transition-all shrink-0 ${tool === t.id ? 'bg-white/25 ring-1 ring-yellow-300/70' : 'hover:bg-white/10'}`}
                        >
                            <span className="text-xl leading-none">{t.emoji}</span>
                            <span className="text-[10px] font-bold text-white/85 mt-0.5">{t.label}</span>
                        </button>
                    ))}
                </div>

                {/* Nút mở bảng trang trí */}
                <button
                    onClick={() => setPanelOpen(!panelOpen)}
                    className={`absolute right-3 top-3 flex items-center gap-1.5 px-3.5 py-2.5 backdrop-blur-md border rounded-full text-white text-xs font-bold transition-all z-20 ${panelOpen ? 'bg-white/25 border-yellow-300/60' : 'bg-white/10 border-white/15 hover:bg-white/20'}`}
                >
                    <Palette size={15} /> Trang trí
                </button>

                {/* Bảng trang trí */}
                {panelOpen && (
                    <div className="absolute right-3 top-14 w-[272px] max-w-[92vw] bg-slate-900/95 backdrop-blur-md border border-white/15 rounded-2xl p-4 flex flex-col gap-3.5 z-20 max-h-[calc(100%-70px)] overflow-y-auto">
                        <div className="flex items-center justify-between">
                            <span className="text-white font-bold text-sm">🎨 Trang trí hành tinh</span>
                            <button onClick={() => setPanelOpen(false)} className="p-1 text-white/60 hover:text-white"><X size={16} /></button>
                        </div>

                        <div>
                            <div className="text-white/70 text-xs font-semibold mb-1.5">Cỡ cọ</div>
                            <div className="flex gap-1.5">
                                {(Object.keys(BRUSH_RADII) as BrushSize[]).map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setBrushSize(s)}
                                        className={`flex-1 py-1.5 rounded-full text-xs font-bold border transition-all ${brushSize === s ? 'bg-white/25 border-yellow-300/60 text-white' : 'bg-white/5 border-white/15 text-white/70 hover:bg-white/15'}`}
                                    >
                                        {s === 'S' ? 'Nhỏ' : s === 'M' ? 'Vừa' : 'To'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <div className="text-white/70 text-xs font-semibold mb-1.5">🌊 Mực nước biển</div>
                            <input
                                type="range"
                                min={-0.05}
                                max={0.1}
                                step={0.005}
                                value={seaLevel}
                                onChange={(e) => setSeaLevel(Number(e.target.value))}
                                className="w-full accent-cyan-400"
                            />
                        </div>

                        <div>
                            <div className="text-white/70 text-xs font-semibold mb-1.5">💨 Khí quyển</div>
                            <div className="flex gap-2 items-center">
                                <button
                                    onClick={() => setCosmetics({ ...cosmetics, atmosphere: null })}
                                    title="Không có khí quyển"
                                    className={`w-8 h-8 rounded-full border-2 text-white/60 text-xs font-bold ${cosmetics.atmosphere === null ? 'border-yellow-300' : 'border-white/20'}`}
                                >
                                    ∅
                                </button>
                                {ATMO_SWATCHES.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setCosmetics({ ...cosmetics, atmosphere: c })}
                                        className={`w-8 h-8 rounded-full border-2 ${cosmetics.atmosphere === c ? 'border-yellow-300 scale-110' : 'border-white/20'} transition-all`}
                                        style={{ backgroundColor: c, boxShadow: `0 0 10px ${c}70` }}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-white/85 text-xs font-semibold">☁️ Mây</span>
                            <Toggle on={cosmetics.clouds} onChange={(v) => setCosmetics({ ...cosmetics, clouds: v })} />
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-white/85 text-xs font-semibold">💫 Vành đai</span>
                            <Toggle on={cosmetics.rings} onChange={(v) => setCosmetics({ ...cosmetics, rings: v })} />
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-white/85 text-xs font-semibold">🌙 Mặt trăng</span>
                            <div className="flex gap-1">
                                {[0, 1, 2].map(n => (
                                    <button
                                        key={n}
                                        onClick={() => setCosmetics({ ...cosmetics, moons: n })}
                                        className={`w-8 h-8 rounded-full text-xs font-bold border transition-all ${cosmetics.moons === n ? 'bg-white/25 border-yellow-300/60 text-white' : 'bg-white/5 border-white/15 text-white/70'}`}
                                    >
                                        {n}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="border-t border-white/10 pt-3 flex items-center justify-between">
                            <span className="text-white/85 text-xs font-semibold">🌌 Hiện trong Hệ Mặt Trời</span>
                            <Toggle on={showInSolar} onChange={setShowInSolar} />
                        </div>
                    </div>
                )}
            </div>

            <p className="shrink-0 text-center text-white/35 text-[10px] py-1.5">
                Bật 🌌 trong Trang trí để hành tinh của bé bay quanh Mặt Trời cùng 8 hành tinh thật!
            </p>
        </div>
    );
}
