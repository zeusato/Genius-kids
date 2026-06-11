import React, { Suspense, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, useTexture } from '@react-three/drei';
import { damp } from 'maath/easing';
import { X } from 'lucide-react';
import { SOLAR_SYSTEM_DATA, PlanetData } from '../../data/solarData';
import { DETAIL_SPHERE, getGlowTexture, texUrl, supportsWebGL } from './scene3d/core';
import { AtmosphereRim, ATMOSPHERE_COLORS } from './scene3d/AtmosphereRim';
import { SaturnRings, UranusRings } from './scene3d/PlanetRings';

// "Kích thước thật" — khoảnh khắc dạy học đập tan ngộ nhận phổ biến nhất:
// trẻ em tưởng các hành tinh to gần bằng nhau. Mọi thiên thể là QUẢ CẦU 3D
// texture NASA tự xoay, đường kính ĐÚNG tỷ lệ (Trái Đất = 0.5 unit chuẩn),
// đứng thẳng hàng trên một "đường chân trời" — label nằm ở dải riêng bên dưới
// nên không bao giờ bị mô hình che (camera định khung theo world unit,
// Sao Mộc luôn vừa khung ở mọi cỡ màn hình).

const EARTH_KM = 12756;
const EARTH_R = 0.5; // bán kính Trái Đất trong world units
const SUN_R = (1392000 / EARTH_KM) * EARTH_R; // ≈ 54.6
// Camera lùi đủ xa để hành tinh lớn nhất (Sao Mộc, cao 11.2 unit) chiếm ~65%
// chiều cao khung nhìn — luôn hiện FULL SIZE kèm lề thở ở mọi cỡ màn hình
const CAM_Z = 23.5;
const CAM_Y = 4.4;
const FOV = 40;
const VISIBLE_H = 2 * CAM_Z * Math.tan((FOV / 2) * (Math.PI / 180)); // ≈ 17.1 world units
const LABEL_Y = -2.0; // dải label hạ sâu dưới đường chân trời y=0 — cách hẳn mô hình
const GAP = 2.6;
// Khoảng cách tâm-tâm tối thiểu để label (≈110px) không chồng chữ giữa các
// hành tinh nhỏ — 6.6 world unit ≈ 130px ngay cả ở dải hiển thị thấp nhất ~340px
const MIN_SPACING = 6.6;

function bodyRadius(p: PlanetData): number {
    return ((p.physical?.diameterKm ?? EARTH_KM) / EARTH_KM) * EARTH_R;
}

// Nửa bề rộng chiếm chỗ (Sao Thổ tính cả vành)
function halfWidth(p: PlanetData): number {
    const r = bodyRadius(p);
    if (p.id === 'saturn') return r * 2.4;
    if (p.id === 'uranus') return r * 1.95;
    return r;
}

interface LineupEntry {
    planet: PlanetData;
    r: number;
    x: number;
}

function computeLineup(): { entries: LineupEntry[]; maxCamX: number } {
    let cursor = 8.5; // bắt đầu sau mép phải Mặt Trời (x=2.2) + vùng glow + chỗ cho label Mặt Trời
    let prevCenter = 1.1; // vị trí label Mặt Trời
    const entries = SOLAR_SYSTEM_DATA.map(planet => {
        const half = halfWidth(planet);
        const x = Math.max(cursor + half, prevCenter + MIN_SPACING);
        cursor = x + half + GAP;
        prevCenter = x;
        return { planet, r: bodyRadius(planet), x };
    });
    return { entries, maxCamX: entries[entries.length - 1].x - 1.5 };
}

const LINEUP = computeLineup();

function formatRatio(diameterKm: number): string {
    const ratio = diameterKm / EARTH_KM;
    if (ratio >= 10) return `${Math.round(ratio)}× Trái Đất`;
    if (ratio >= 0.99 && ratio <= 1.01) return 'Chuẩn so sánh';
    return `${ratio.toFixed(2).replace('.', ',')}× Trái Đất`;
}

function BodyLabel({ position, name, ratio, sub }: {
    position: [number, number, number];
    name: string;
    ratio: string;
    sub?: string;
}) {
    return (
        <Html center position={position} zIndexRange={[15, 0]} wrapperClass="pointer-events-none">
            <div className="pointer-events-none text-center whitespace-nowrap select-none bg-black/40 backdrop-blur-[2px] rounded-xl px-2.5 py-1">
                <div className="text-white font-bold text-sm">{name}</div>
                <div className="text-cyan-300 text-xs font-semibold">{ratio}</div>
                {sub && <div className="text-white/50 text-[10px]">{sub}</div>}
            </div>
        </Html>
    );
}

// Mặt Trời: vòng cung khổng lồ bên trái (54,6 unit — không bao giờ vừa khung, đó là bài học)
function LineupSun() {
    const tex = useTexture(texUrl('sun'));
    tex.colorSpace = THREE.SRGBColorSpace;
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((_, delta) => {
        if (meshRef.current) meshRef.current.rotation.y += delta * 0.02;
    });

    return (
        <group position={[-SUN_R + 2.2, CAM_Y, 0]}>
            <mesh ref={meshRef} geometry={DETAIL_SPHERE} scale={SUN_R}>
                <meshBasicMaterial map={tex} toneMapped={false} color={[1.35, 1.15, 0.9] as unknown as THREE.Color} />
            </mesh>
            <sprite scale={[SUN_R * 2.05, SUN_R * 2.05, 1]} renderOrder={2}>
                <spriteMaterial
                    map={getGlowTexture()}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                    transparent
                    opacity={0.38}
                    color="#FFCC80"
                />
            </sprite>
        </group>
    );
}

function LineupBody({ entry }: { entry: LineupEntry }) {
    const { planet, r, x } = entry;
    const phys = planet.physical!;
    const texture = useTexture(texUrl(planet.id === 'earth' ? 'earth_day' : planet.id));
    texture.colorSpace = THREE.SRGBColorSpace;
    const spinRef = useRef<THREE.Group>(null);

    const renderTiltDeg = planet.id === 'venus' ? 180 - phys.axialTiltDeg : phys.axialTiltDeg;
    // Nghiêng nhẹ trục X cho thấy mặt vành (Sao Thổ/Thiên Vương) có chiều sâu
    const ringPerspective = planet.id === 'saturn' ? 0.35 : planet.id === 'uranus' ? 0.18 : 0;
    const atmosphereColor = ATMOSPHERE_COLORS[planet.id];

    useFrame((_, delta) => {
        if (spinRef.current) spinRef.current.rotation.y += delta * 0.22;
    });

    return (
        <group position={[x, r, 0]}>
            <group rotation={[ringPerspective, 0, -THREE.MathUtils.degToRad(renderTiltDeg)]}>
                <group ref={spinRef}>
                    <mesh geometry={DETAIL_SPHERE} scale={r}>
                        <meshStandardMaterial map={texture} roughness={1} metalness={0} />
                    </mesh>
                </group>
                {planet.id === 'saturn' && <SaturnRings radius={r} />}
                {planet.id === 'uranus' && <UranusRings radius={r} />}
                {atmosphereColor && (
                    <AtmosphereRim
                        radius={r}
                        color={atmosphereColor}
                        strength={planet.id === 'mars' ? 0.45 : 0.75}
                        geometry={DETAIL_SPHERE}
                    />
                )}
            </group>
            {/* Label ở dải riêng dưới đường chân trời — mô hình không bao giờ che */}
            <BodyLabel
                position={[0, LABEL_Y - r, 0]}
                name={planet.name}
                ratio={formatRatio(phys.diameterKm)}
                sub={planet.diameter}
            />
        </group>
    );
}

// Camera trượt ngang mượt theo targetX (kéo/lăn chuột) — chỉ tịnh tiến trục X.
// R3F mặc định lookAt(0,0,0) làm camera cúi xuống → ép nhìn thẳng -Z mỗi frame
// để phép chiếu khớp đúng bố cục world-unit (Sao Mộc full size + lề thở).
function LineupRig({ targetX }: { targetX: React.MutableRefObject<number> }) {
    useFrame((state, delta) => {
        damp(state.camera.position, 'x', targetX.current, 0.18, delta);
        state.camera.position.y = CAM_Y;
        state.camera.position.z = CAM_Z;
        state.camera.rotation.set(0, 0, 0);
    });
    return null;
}

function TrueScale3D() {
    const targetX = useRef(0);
    const drag = useRef({ down: false, lastX: 0 });
    const stripRef = useRef<HTMLDivElement>(null);
    const [hintHidden, setHintHidden] = useState(false);

    const clampX = (v: number) => Math.max(-0.5, Math.min(LINEUP.maxCamX, v));
    const worldPerPixel = () => VISIBLE_H / (stripRef.current?.clientHeight || 500);

    return (
        <div
            ref={stripRef}
            className="flex-1 relative cursor-grab active:cursor-grabbing"
            style={{ touchAction: 'none' }}
            onPointerDown={(e) => {
                drag.current = { down: true, lastX: e.clientX };
                setHintHidden(true);
                (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
                if (!drag.current.down) return;
                targetX.current = clampX(targetX.current - (e.clientX - drag.current.lastX) * worldPerPixel());
                drag.current.lastX = e.clientX;
            }}
            onPointerUp={() => { drag.current.down = false; }}
            onPointerCancel={() => { drag.current.down = false; }}
            onWheel={(e) => {
                const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
                targetX.current = clampX(targetX.current + delta * worldPerPixel() * 0.6);
                setHintHidden(true);
            }}
        >
            <Canvas
                dpr={[1, 1.5]}
                camera={{ fov: FOV, position: [0, CAM_Y, CAM_Z], near: 0.1, far: 300 }}
                gl={{ antialias: true, stencil: false }}
            >
                <color attach="background" args={['#05060f']} />
                <ambientLight intensity={0.55} />
                <directionalLight position={[-4, 6, 8]} intensity={1.7} color="#FFF4E0" />
                <Suspense fallback={null}>
                    <LineupSun />
                    {LINEUP.entries.map(entry => (
                        <LineupBody key={entry.planet.id} entry={entry} />
                    ))}
                    {/* Label Mặt Trời đặt cạnh mép vòng cung */}
                    <BodyLabel
                        position={[1.1, LABEL_Y, 0]}
                        name="Mặt Trời"
                        ratio="109× Trái Đất"
                        sub="1,4 triệu km — không vừa màn hình!"
                    />
                </Suspense>
                <LineupRig targetX={targetX} />
            </Canvas>

            {/* Gợi ý kéo — ẩn sau lần tương tác đầu */}
            {!hintHidden && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full text-white/90 text-sm font-semibold pointer-events-none animate-pulse">
                    Kéo sang phải 👉
                </div>
            )}
        </div>
    );
}

// Fallback cho máy không có WebGL: vòng tròn gradient, kích thước theo CHIỀU CAO
// màn hình (Sao Mộc = 62% dải hiển thị) và đáy thẳng hàng — label ở dải riêng.
function TrueScale2D() {
    const earthPx = useMemo(() => {
        const stripH = Math.max(window.innerHeight - 220, 240);
        return (stripH * 0.62) / 11.21; // Jupiter (11,21× Trái Đất) chiếm 62% chiều cao dải
    }, []);
    const sunPx = earthPx * 109.2;

    return (
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
            <div className="h-full flex items-stretch gap-10 px-6 w-max">
                {/* Mặt Trời — vòng cung bên trái */}
                <div className="flex flex-col justify-end items-center shrink-0">
                    <div className="relative flex-1" style={{ width: `${sunPx * 0.18}px` }}>
                        <div
                            className="absolute rounded-full"
                            style={{
                                width: `${sunPx}px`,
                                height: `${sunPx}px`,
                                left: `-${sunPx * 0.82}px`,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'radial-gradient(circle at 35% 35%, #FFF8E1, #FFB300 55%, #E65100)',
                                boxShadow: '0 0 100px rgba(255, 152, 0, 0.5)'
                            }}
                        />
                    </div>
                    <div className="h-16 flex flex-col justify-start text-center relative z-10 pt-1.5">
                        <div className="text-white font-bold text-sm">Mặt Trời</div>
                        <div className="text-yellow-300/90 text-xs font-semibold">109× Trái Đất</div>
                    </div>
                </div>

                {SOLAR_SYSTEM_DATA.map(planet => {
                    const px = Math.max(((planet.physical?.diameterKm ?? EARTH_KM) / EARTH_KM) * earthPx, 5);
                    const gradient = `radial-gradient(circle at 30% 30%, ${planet.gradientColors[0]}, ${planet.gradientColors[1]}, ${planet.gradientColors[2] || planet.gradientColors[1]})`;
                    return (
                        <div key={planet.id} className="flex flex-col justify-end items-center shrink-0">
                            <div
                                className="rounded-full"
                                style={{
                                    width: `${px}px`,
                                    height: `${px}px`,
                                    background: gradient,
                                    boxShadow: `inset -${px / 4}px -${px / 4}px ${px / 3}px rgba(0,0,0,0.55)`
                                }}
                            />
                            <div className="h-16 flex flex-col justify-start text-center pt-1.5">
                                <div className="text-white font-bold text-sm whitespace-nowrap">{planet.name}</div>
                                <div className="text-cyan-300/90 text-xs font-semibold">{formatRatio(planet.physical?.diameterKm ?? EARTH_KM)}</div>
                                <div className="text-white/40 text-[10px]">{planet.diameter}</div>
                            </div>
                        </div>
                    );
                })}
                <div className="w-6 shrink-0" />
            </div>
        </div>
    );
}

interface TrueScaleOverlayProps {
    onClose: () => void;
}

export const TrueScaleOverlay: React.FC<TrueScaleOverlayProps> = ({ onClose }) => {
    const webgl = useMemo(() => supportsWebGL(), []);

    return (
        <div className="fixed inset-0 z-[200] bg-[#05060f] flex flex-col animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-4 z-20 relative">
                <div>
                    <h2 className="text-white text-xl sm:text-2xl font-black flex items-center gap-2">
                        <span>🌍</span> Kích thước thật
                    </h2>
                    <p className="text-white/60 text-xs sm:text-sm mt-0.5">
                        Đúng tỷ lệ đường kính theo NASA — kéo ngang để khám phá nhé!
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all border border-white/15"
                >
                    <X size={22} />
                </button>
            </div>

            {webgl ? <TrueScale3D /> : <TrueScale2D />}

            {/* Fact quy đổi + lưu ý mô hình */}
            <div className="p-4 space-y-1.5 text-center z-20 relative">
                <p className="text-white/85 text-xs sm:text-sm">
                    ⚽ Nếu thu nhỏ Mặt Trời bằng quả bóng đá, Trái Đất chỉ là <b>hạt đậu 2mm</b> nằm cách xa <b>24 mét</b>!
                </p>
                <p className="text-white/40 text-[10px] sm:text-xs">
                    Trong mô hình 3D, kích thước và khoảng cách được phóng to để dễ quan sát — vũ trụ thật rộng lớn hơn rất nhiều.
                </p>
            </div>
        </div>
    );
};
