import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { X, Volume2, Square } from 'lucide-react';
import { CUTAWAY_BODIES, CutawayBody, PlanetLayer } from '../../data/planetLayersData';
import { SOLAR_SYSTEM_DATA, SUN_DATA } from '../../data/solarData';
import { CutawayControls, CutawayPlanet, createCutawayControls } from './scene3d/CutawayPlanet';
import { supportsWebGL } from './scene3d/core';
import { playBlip, playSlice } from './sfx';
import { canSpeakVietnamese, onSpeechAvailabilityChanged, speakVietnamese, cancelSpeech } from './speech';

// "Cắt hành tinh" — chọn thiên thể rồi chém, gọt, bóc để xem các lớp địa tầng.
// Cử chỉ: VUỐT DỌC = chém dao tại vị trí vuốt, KÉO NGANG = xoay hành tinh.
// Hành tinh bán kính 1 world unit đặt ở gốc; camera hơi cao nhìn xuống.

const FOV = 42;
// Camera lùi đủ xa để hành tinh (bán kính 1) chiếm ~72% chiều cao khung —
// nằm CHÍNH GIỮA, không bao giờ bị cắt đỉnh/đáy
const CAM_Z = 3.6;
const CAM_Y = 0.75;

// Màu chấm chọn + gradient fallback 2D lấy từ dữ liệu hành tinh sẵn có
function bodyVisual(id: string) {
    if (id === 'sun') return SUN_DATA;
    return SOLAR_SYSTEM_DATA.find(p => p.id === id) ?? SUN_DATA;
}

// Nút đọc to thông tin lớp — bản rút gọn của SpeakButton (không có audio tạo sẵn cho lớp)
const SpeakLayerButton: React.FC<{ text: string; resetKey: string }> = ({ text, resetKey }) => {
    const [available, setAvailable] = useState(canSpeakVietnamese());
    const [speaking, setSpeaking] = useState(false);
    const speakingRef = useRef(false);

    useEffect(() => onSpeechAvailabilityChanged(() => setAvailable(canSpeakVietnamese())), []);

    useEffect(() => {
        return () => {
            if (speakingRef.current) {
                cancelSpeech();
                speakingRef.current = false;
                setSpeaking(false);
            }
        };
    }, [resetKey]);

    if (!available) return null;

    const toggle = () => {
        if (speaking) {
            cancelSpeech();
            speakingRef.current = false;
            setSpeaking(false);
            return;
        }
        const done = () => { speakingRef.current = false; setSpeaking(false); };
        if (speakVietnamese(text, { onEnd: done, onError: done })) {
            speakingRef.current = true;
            setSpeaking(true);
        }
    };

    return (
        <button
            onClick={toggle}
            title={speaking ? 'Dừng đọc' : 'Đọc cho bé nghe'}
            className={`p-2 rounded-xl border transition-all shrink-0 ${speaking
                ? 'bg-green-500/25 border-green-400/60 text-green-200 animate-pulse'
                : 'bg-white/10 border-white/15 text-white hover:bg-white/20'
                }`}
        >
            {speaking ? <Square size={16} /> : <Volume2 size={16} />}
        </button>
    );
};

// Đường chỉ dẫn từ lớp đang chọn trên mô hình 3D xuống thẻ diễn giải bên dưới.
// Toạ độ neo do CutawayPlanet chiếu sẵn mỗi frame (controls.anchorX/Y) — ở đây
// chỉ chạy rAF đọc ref và ghi thẳng attribute SVG, KHÔNG setState mỗi frame.
const LeaderLine: React.FC<{
    controls: React.MutableRefObject<CutawayControls>;
    wrapRef: React.RefObject<HTMLDivElement>;
    cardRef: React.RefObject<HTMLDivElement>;
    color: string;
}> = ({ controls, wrapRef, cardRef, color }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const lineRef = useRef<SVGLineElement>(null);
    const dotRef = useRef<SVGCircleElement>(null);
    const arrowRef = useRef<SVGPolygonElement>(null);

    useEffect(() => {
        let raf = 0;
        const tick = () => {
            raf = requestAnimationFrame(tick);
            const svg = svgRef.current, line = lineRef.current, dot = dotRef.current, arrow = arrowRef.current;
            const wrap = wrapRef.current, card = cardRef.current;
            if (!svg || !line || !dot || !arrow) return;
            const c = controls.current;
            if (!c.anchorOn || !wrap || !card) {
                svg.style.visibility = 'hidden';
                return;
            }
            // Overlay là fixed inset-0 → toạ độ viewport dùng được trực tiếp
            const wr = wrap.getBoundingClientRect();
            const cr = card.getBoundingClientRect();
            const x1 = wr.left + c.anchorX;
            const y1 = wr.top + c.anchorY;
            const x2 = cr.left + cr.width / 2;
            const y2 = cr.top - 2; // mũi tên kết thúc ngay TRÊN mép thẻ, không chui xuống dưới thẻ
            svg.style.visibility = 'visible';
            dot.setAttribute('cx', String(x1));
            dot.setAttribute('cy', String(y1));
            line.setAttribute('x1', String(x1));
            line.setAttribute('y1', String(y1));
            line.setAttribute('x2', String(x2));
            line.setAttribute('y2', String(y2 - 8));
            arrow.setAttribute('points', `${x2 - 6},${y2 - 9} ${x2 + 6},${y2 - 9} ${x2},${y2}`);
        };
        tick();
        return () => cancelAnimationFrame(raf);
    }, [controls, wrapRef, cardRef]);

    return (
        <svg ref={svgRef} className="absolute inset-0 w-full h-full pointer-events-none z-10" style={{ visibility: 'hidden' }}>
            <line ref={lineRef} stroke="white" strokeWidth={2} opacity={0.85} strokeDasharray="7 5" strokeLinecap="round" />
            <circle ref={dotRef} r={5.5} fill={color} stroke="white" strokeWidth={2.5} />
            <polygon ref={arrowRef} fill="white" opacity={0.9} />
        </svg>
    );
};

// Fallback không WebGL: mặt cắt tĩnh bằng vòng tròn đồng tâm, nửa trái là vỏ ngoài
const Cutaway2D: React.FC<{
    body: CutawayBody;
    selectedLayerId: string | null;
    onSelect: (id: string) => void;
}> = ({ body, selectedLayerId, onSelect }) => {
    const visual = bodyVisual(body.id);
    const gradient = `radial-gradient(circle at 30% 30%, ${visual.gradientColors[0]}, ${visual.gradientColors[1]}, ${visual.gradientColors[2] || visual.gradientColors[1]})`;
    const outerFirst = [...body.layers].reverse();

    return (
        <div className="flex-1 flex items-center justify-center p-4">
            <div className="relative" style={{ width: 'min(78vw, 46vh)', aspectRatio: '1' }}>
                {outerFirst.map(layer => (
                    <button
                        key={layer.id}
                        onClick={() => onSelect(layer.id)}
                        className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all ${selectedLayerId === layer.id ? 'ring-4 ring-yellow-300' : ''}`}
                        style={{
                            width: `${layer.radiusFrac * 100}%`,
                            height: `${layer.radiusFrac * 100}%`,
                            backgroundColor: layer.color,
                            backgroundImage: 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.28), rgba(0,0,0,0.22) 80%)'
                        }}
                    />
                ))}
                {/* Nửa trái giữ nguyên "vỏ" hành tinh — trông như đã bị bổ đôi */}
                <div
                    className="absolute inset-0 rounded-full pointer-events-none"
                    style={{ clipPath: 'inset(0 50% 0 0)', background: gradient }}
                />
            </div>
        </div>
    );
};

interface PlanetCutawayProps {
    onClose: () => void;
    initialBodyId?: string;
}

export const PlanetCutaway: React.FC<PlanetCutawayProps> = ({ onClose, initialBodyId }) => {
    const webgl = useMemo(() => supportsWebGL(), []);
    const [bodyId, setBodyId] = useState(initialBodyId ?? 'earth');
    const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
    const [peelCount, setPeelCount] = useState(0);
    const [angleDeg, setAngleDeg] = useState(0);
    const [knife, setKnife] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
    const [cutSet, setCutSet] = useState<Set<string>>(new Set());
    const [hintHidden, setHintHidden] = useState(false);

    const controls = useRef(createCutawayControls());
    const wrapRef = useRef<HTMLDivElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);
    // dragged: cú chạm này đã thành cử chỉ kéo — để onPointerMissed phân biệt
    // "bấm ra ngoài" (hủy chọn lớp) với thả tay sau khi xoay/chém
    const gest = useRef({ down: false, sx: 0, sy: 0, lx: 0, cx: 0, cy: 0, mode: null as null | 'rotate' | 'slice', dragged: false });

    const body = CUTAWAY_BODIES.find(b => b.id === bodyId) ?? CUTAWAY_BODIES[0];
    const outerIdx = body.layers.length - 1;
    const selectedLayer: PlanetLayer | undefined = body.layers.find(l => l.id === selectedLayerId);

    const markCut = (id: string) => setCutSet(prev => (prev.has(id) ? prev : new Set(prev).add(id)));

    const setAngle = (deg: number) => {
        setAngleDeg(deg);
        controls.current.targetAngle = (deg * Math.PI) / 180;
        if (deg >= 25) markCut(bodyId);
    };

    const selectBody = (id: string) => {
        if (id === bodyId) return;
        playBlip();
        setBodyId(id);
        setSelectedLayerId(null);
        setPeelCount(0);
        // Khép múi lại để bé được "chém" hành tinh mới — nghi thức vui mỗi lần đổi.
        // Reset cả góc xoay: component remount (key=body.id) bắt đầu từ rotY=0.
        setAngleDeg(0);
        controls.current.targetAngle = 0;
        controls.current.targetCenter = Math.PI / 2;
        controls.current.targetRotY = 0;
        controls.current.curRotY = 0;
    };

    // Chém tại vị trí x trên màn hình: đổi pixel → azimuth world trên hành tinh
    // (bán kính 1), rồi CỘNG góc xoay hiện tại để ra tọa độ LOCAL (world = local − rotY)
    // — vết cắt từ đó dán chặt vào hành tinh, xoay cùng nhau như một chỉnh thể.
    const doSlice = (clientX: number | null) => {
        let center = Math.PI / 2; // mặc định: múi quay về camera
        const rect = wrapRef.current?.getBoundingClientRect();
        if (clientX !== null && rect) {
            const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
            const worldX = ndcX * Math.tan((FOV / 2) * (Math.PI / 180)) * CAM_Z * (rect.width / rect.height);
            const s = Math.max(-0.8, Math.min(0.8, worldX));
            center = Math.atan2(Math.sqrt(1 - s * s), s);
        }
        controls.current.targetCenter = center + controls.current.curRotY;
        controls.current.shake = 1;
        setAngle(Math.max(angleDeg, 100));
        playSlice();
        setHintHidden(true);
    };

    const selectLayer = (id: string) => {
        playBlip();
        setSelectedLayerId(id);
        const idx = body.layers.findIndex(l => l.id === id);
        // Lớp đang bị bóc mất → đắp lại vừa đủ để lộ nó
        if (idx >= 0 && idx >= body.layers.length - peelCount) {
            setPeelCount(outerIdx - idx);
        }
        // Lớp trong mà múi đang khép → tự động chém mở cho thấy
        if (webgl && idx < outerIdx && angleDeg < 25) doSlice(null);
    };

    const peel = () => {
        if (peelCount >= outerIdx) return;
        const next = peelCount + 1;
        setPeelCount(next);
        playBlip();
        setSelectedLayerId(body.layers[outerIdx - next].id);
    };

    const unpeel = () => {
        if (peelCount <= 0) return;
        const next = peelCount - 1;
        setPeelCount(next);
        playBlip();
        setSelectedLayerId(body.layers[outerIdx - next].id);
    };

    // Cử chỉ trên vùng canvas: dọc = chém, ngang = xoay. KHÔNG setPointerCapture
    // để click trên mesh của R3F vẫn hoạt động (sự kiện nổi bọt từ canvas lên đây).
    const onPointerDown = (e: React.PointerEvent) => {
        gest.current = { down: true, sx: e.clientX, sy: e.clientY, lx: e.clientX, cx: e.clientX, cy: e.clientY, mode: null, dragged: false };
    };

    const onPointerMove = (e: React.PointerEvent) => {
        const g = gest.current;
        if (!g.down) return;
        g.cx = e.clientX;
        g.cy = e.clientY;
        const dx = e.clientX - g.sx;
        const dy = e.clientY - g.sy;
        if (!g.mode && Math.hypot(dx, dy) > 12) {
            g.mode = Math.abs(dy) > Math.abs(dx) * 1.2 ? 'slice' : 'rotate';
            g.dragged = true;
            setHintHidden(true);
        }
        if (g.mode === 'rotate') {
            controls.current.targetRotY += (e.clientX - g.lx) * 0.012;
        } else if (g.mode === 'slice') {
            const rect = wrapRef.current?.getBoundingClientRect();
            if (rect) {
                setKnife({ x1: g.sx - rect.left, y1: g.sy - rect.top, x2: e.clientX - rect.left, y2: e.clientY - rect.top });
            }
        }
        g.lx = e.clientX;
    };

    const endGesture = () => {
        const g = gest.current;
        if (g.down && g.mode === 'slice' && Math.abs(g.cy - g.sy) > 50) {
            doSlice((g.sx + g.cx) / 2);
        }
        g.down = false;
        g.mode = null;
        setKnife(null);
    };

    const speakText = selectedLayer
        ? `${selectedLayer.name}. ${selectedLayer.description}${selectedLayer.funFact ? ` Điều thú vị: ${selectedLayer.funFact}` : ''}`
        : `${body.name}. ${body.tagline}`;

    // Thẻ diễn giải — ở chế độ 3D là thẻ NỔI đè đáy canvas (giữ hành tinh luôn to),
    // ở chế độ 2D xếp bên dưới như bình thường
    const infoCard = (
        <div ref={cardRef} className="mx-auto w-full max-w-xl bg-slate-900/90 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-3">
            {selectedLayer ? (
                <div>
                    <div className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 rounded-md shrink-0" style={{ backgroundColor: selectedLayer.color }} />
                        <h3 className="text-white font-bold text-sm sm:text-base flex-1">{selectedLayer.name}</h3>
                        <SpeakLayerButton text={speakText} resetKey={`${body.id}-${selectedLayer.id}`} />
                        <button
                            onClick={() => setSelectedLayerId(null)}
                            className="p-1.5 rounded-lg text-white/60 hover:bg-white/10"
                        >
                            <X size={16} />
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                        <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/80 text-[10px] sm:text-[11px]">📏 {selectedLayer.thickness}</span>
                        <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/80 text-[10px] sm:text-[11px]">🌡️ {selectedLayer.temperature}</span>
                    </div>
                    <p className="text-white/85 text-xs sm:text-sm mt-1.5 leading-relaxed">{selectedLayer.description}</p>
                    {selectedLayer.funFact && (
                        <p className="text-yellow-200/90 text-xs sm:text-sm mt-1 leading-relaxed">💡 {selectedLayer.funFact}</p>
                    )}
                </div>
            ) : (
                <div className="flex items-center gap-2.5">
                    <span className="text-xl">🪐</span>
                    <p className="text-white/85 text-xs sm:text-sm flex-1 leading-relaxed">
                        <b className="text-white">{body.name}:</b> {body.tagline} Chạm vào từng lớp để khám phá nhé!
                    </p>
                    <SpeakLayerButton text={speakText} resetKey={body.id} />
                </div>
            )}
        </div>
    );

    return (
        <div className="fixed inset-0 z-[200] bg-[#05060f] flex flex-col animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2 z-20">
                <div>
                    <h2 className="text-white text-xl sm:text-2xl font-black flex items-center gap-2">
                        <span>🔪</span> Cắt hành tinh
                    </h2>
                    <p className="text-white/60 text-xs sm:text-sm mt-0.5">
                        Bổ đôi thiên thể để xem các lớp bên trong nhé!
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all border border-white/15"
                >
                    <X size={22} />
                </button>
            </div>

            {/* Chọn thiên thể */}
            <div className="px-3 py-1.5 flex gap-1.5 overflow-x-auto z-20 shrink-0" style={{ scrollbarWidth: 'none' }}>
                {CUTAWAY_BODIES.map(b => {
                    const active = b.id === bodyId;
                    return (
                        <button
                            key={b.id}
                            onClick={() => selectBody(b.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold whitespace-nowrap transition-all ${active
                                ? 'bg-white/25 border-yellow-300/70 text-white'
                                : 'bg-white/5 border-white/15 text-white/80 hover:bg-white/15'
                                }`}
                        >
                            <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: bodyVisual(b.id).color, boxShadow: `0 0 6px ${bodyVisual(b.id).color}90` }}
                            />
                            {b.name}
                            {cutSet.has(b.id) && <span className="text-green-300">✓</span>}
                        </button>
                    );
                })}
            </div>

            {/* Vùng cắt gọt */}
            {webgl ? (
                <div
                    ref={wrapRef}
                    className="flex-1 relative min-h-0"
                    style={{ touchAction: 'none' }}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={endGesture}
                    onPointerCancel={endGesture}
                    onPointerLeave={endGesture}
                >
                    <Canvas
                        dpr={[1, 1.5]}
                        camera={{ fov: FOV, position: [0, CAM_Y, CAM_Z], near: 0.1, far: 50 }}
                        gl={{ antialias: true }}
                        onCreated={({ gl }) => { gl.localClippingEnabled = true; }}
                        onPointerMissed={() => {
                            // Bấm vào khoảng không (không trúng lớp nào) = hủy chọn lớp
                            if (!gest.current.dragged) setSelectedLayerId(null);
                        }}
                    >
                        <color attach="background" args={['#05060f']} />
                        <ambientLight intensity={0.55} />
                        <directionalLight position={[2.5, 3, 5]} intensity={1.5} color="#FFF4E0" />
                        <Suspense fallback={null}>
                            <CutawayPlanet
                                key={body.id}
                                body={body}
                                controls={controls}
                                peelCount={peelCount}
                                selectedLayerId={selectedLayerId}
                                onSelectLayer={selectLayer}
                            />
                        </Suspense>
                    </Canvas>

                    {/* Vệt dao khi đang vuốt */}
                    {knife && (
                        <svg className="absolute inset-0 w-full h-full pointer-events-none">
                            <line
                                x1={knife.x1} y1={knife.y1} x2={knife.x2} y2={knife.y2}
                                stroke="white" strokeWidth={3} strokeDasharray="8 6" strokeLinecap="round" opacity={0.9}
                            />
                            <text x={knife.x2 + 8} y={knife.y2 + 8} fontSize="26">🔪</text>
                        </svg>
                    )}

                    {/* Gợi ý thao tác — ẩn sau lần tương tác đầu */}
                    {!hintHidden && (
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3.5 py-2 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full text-white/90 text-xs sm:text-sm font-semibold pointer-events-none animate-pulse whitespace-nowrap">
                            🔪 Vuốt dọc để chém · 🔄 Kéo ngang để xoay
                        </div>
                    )}

                    {/* Danh sách lớp — ngoài → trong */}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 max-w-[46vw] z-10">
                        {[...body.layers].reverse().map(layer => {
                            const idx = body.layers.findIndex(l => l.id === layer.id);
                            const peeled = idx >= body.layers.length - peelCount;
                            const active = layer.id === selectedLayerId;
                            return (
                                <button
                                    key={layer.id}
                                    onClick={() => selectLayer(layer.id)}
                                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[11px] font-semibold text-left transition-all backdrop-blur-sm ${active
                                        ? 'bg-white/25 border-yellow-300/70 text-white'
                                        : 'bg-black/40 border-white/15 text-white/85 hover:bg-white/15'
                                        } ${peeled ? 'opacity-40' : ''}`}
                                >
                                    <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: layer.color }} />
                                    <span className={peeled ? 'line-through' : ''}>{layer.name}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Thẻ diễn giải nổi góc trái-dưới canvas (mobile ~ full width) —
                        chặn pointer để không kích hoạt cử chỉ chém/xoay khi bấm trong thẻ */}
                    <div
                        className="absolute left-2 bottom-2 w-[min(94vw,26rem)] z-20"
                        onPointerDown={(e) => e.stopPropagation()}
                    >
                        {infoCard}
                    </div>
                </div>
            ) : (
                <>
                    <Cutaway2D body={body} selectedLayerId={selectedLayerId} onSelect={selectLayer} />
                    <div className="px-3 pb-2 z-20 shrink-0">{infoCard}</div>
                </>
            )}

            {/* Đường chỉ dẫn lớp đang chọn → thẻ diễn giải */}
            {webgl && selectedLayer && (
                <LeaderLine controls={controls} wrapRef={wrapRef} cardRef={cardRef} color={selectedLayer.color} />
            )}

            {/* Thanh điều khiển cắt gọt — chỉ ở chế độ 3D. Khi chưa cắt, cả thanh là
                một nút CẮT to canh giữa (thay vì nút lơ lửng đè lên canvas) */}
            {webgl && (
                <div className="px-4 pb-3 z-20 shrink-0 max-w-xl w-full mx-auto">
                    {angleDeg < 5 ? (
                        <button
                            onClick={() => doSlice(null)}
                            className="block w-full max-w-xs mx-auto py-3 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-black text-base shadow-lg shadow-orange-500/40 animate-pulse hover:from-orange-400 hover:to-red-400 transition-colors"
                        >
                            🔪 CẮT NÀO!
                        </button>
                    ) : (
                        <div className="flex items-center gap-3">
                            <span className="text-lg shrink-0" title="Khép lại">🔒</span>
                            <input
                                type="range"
                                min={0}
                                max={180}
                                value={angleDeg}
                                onChange={(e) => setAngle(Number(e.target.value))}
                                className="flex-1 accent-orange-400"
                                title="Độ mở múi cắt"
                            />
                            <span className="text-lg shrink-0" title="Bổ đôi">🍉</span>
                            <button
                                onClick={peel}
                                disabled={peelCount >= outerIdx}
                                className="px-3 py-2 rounded-full bg-white/10 border border-white/15 text-white text-xs font-bold hover:bg-white/20 disabled:opacity-30 transition-all whitespace-nowrap"
                            >
                                🧅 Bóc lớp
                            </button>
                            <button
                                onClick={unpeel}
                                disabled={peelCount <= 0}
                                className="px-3 py-2 rounded-full bg-white/10 border border-white/15 text-white text-xs font-bold hover:bg-white/20 disabled:opacity-30 transition-all whitespace-nowrap"
                            >
                                ↩️ Đắp lại
                            </button>
                        </div>
                    )}
                </div>
            )}

            <p className="text-center text-white/35 text-[10px] pb-2 z-20">
                Độ dày các lớp đã được phóng to để dễ quan sát · Dữ liệu: NASA
            </p>
        </div>
    );
};
