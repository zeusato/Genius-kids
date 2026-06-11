import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { damp3 } from 'maath/easing';
import { Organelle } from '../../../data/cellData';
import { GEO, SimClock, BodyRegistry } from './core';

interface Organelle3DProps {
    data: Organelle;
    clock: SimClock;
    onSelect: (id: string) => void;
    registry: React.MutableRefObject<BodyRegistry>;
    focusedId: string | null;
    quality: 'high' | 'low';
    shellIndex?: number; // thứ tự trong nhóm vỏ (để rải label ngang); -1 nếu không phải vỏ
    shellTotal?: number;
}

function scalar(scale: number | [number, number, number]): number {
    return Array.isArray(scale) ? Math.max(...scale) : scale;
}

// Rải vị trí cho bào quan có count>1: vỏ cầu (golden angle) hoặc dọc thân que (vi khuẩn)
function scatter(count: number, spread: number, mode: 'shell' | 'rod'): [number, number, number][] {
    const pts: [number, number, number][] = [];
    for (let i = 0; i < count; i++) {
        if (mode === 'rod') {
            const t = count > 1 ? i / (count - 1) : 0.5;
            const x = -1.5 + t * 3.0;
            const ang = i * 2.39996;
            const rr = spread;
            pts.push([x, Math.cos(ang) * rr, Math.sin(ang) * rr]);
        } else {
            const y = 1 - ((i + 0.5) / count) * 2;
            const r = Math.sqrt(Math.max(0, 1 - y * y));
            const theta = i * 2.39996;
            pts.push([Math.cos(theta) * r * spread, y * spread, Math.sin(theta) * r * spread]);
        }
    }
    return pts;
}

// ---- Các khối hình procedural cho MỘT đơn vị bào quan (tâm tại gốc) ----

function NucleusUnit({ color, dim }: { color: string; dim: boolean }) {
    const pores = useMemo(() => scatter(28, 1, 'shell'), []);
    return (
        <group>
            <mesh geometry={GEO.sphereHi}>
                <meshStandardMaterial color={color} roughness={0.5} metalness={0} transparent opacity={dim ? 0.3 : 0.92} emissive={color} emissiveIntensity={0.12} />
            </mesh>
            {/* Nhân con lệch tâm */}
            <mesh geometry={GEO.sphere} position={[0.3, 0.2, 0.2]} scale={0.32}>
                <meshStandardMaterial color="#7E22CE" roughness={0.6} transparent opacity={dim ? 0.3 : 1} />
            </mesh>
            {/* Lỗ nhân — chấm nhỏ trên màng */}
            {!dim && pores.map((p, i) => (
                <mesh key={i} geometry={GEO.sphereLo} position={p as [number, number, number]} scale={0.06}>
                    <meshStandardMaterial color="#C4B5FD" roughness={0.5} />
                </mesh>
            ))}
        </group>
    );
}

function MitochondrionUnit({ color, dim }: { color: string; dim: boolean }) {
    return (
        <group rotation={[0, 0, Math.PI / 2]}>
            <mesh geometry={GEO.bean}>
                <meshStandardMaterial color={color} roughness={0.5} metalness={0} transparent opacity={dim ? 0.3 : 1} emissive={color} emissiveIntensity={0.1} />
            </mesh>
            {/* Gờ răng lược (cristae) bên trong */}
            {!dim && [-0.4, 0, 0.4].map((y, i) => (
                <mesh key={i} geometry={GEO.torus} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[0.42, 0.42, 0.42]}>
                    <meshStandardMaterial color="#B91C1C" roughness={0.6} />
                </mesh>
            ))}
        </group>
    );
}

function ChloroplastUnit({ color, dim }: { color: string; dim: boolean }) {
    return (
        <group>
            <mesh geometry={GEO.sphere} scale={[1.35, 0.72, 0.95]}>
                <meshStandardMaterial color={color} roughness={0.5} metalness={0} transparent opacity={dim ? 0.3 : 0.95} emissive="#16A34A" emissiveIntensity={0.12} />
            </mesh>
            {/* Chồng grana (đĩa diệp lục) */}
            {!dim && [-0.5, 0, 0.5].map((x, i) => (
                <group key={i} position={[x, 0, 0]}>
                    {[-0.12, 0, 0.12].map((y, j) => (
                        <mesh key={j} geometry={GEO.disc} position={[0, y, 0]} scale={[0.28, 0.7, 0.28]}>
                            <meshStandardMaterial color="#15803D" roughness={0.6} />
                        </mesh>
                    ))}
                </group>
            ))}
        </group>
    );
}

function GolgiUnit({ color, dim }: { color: string; dim: boolean }) {
    const discs = [0.9, 0.78, 0.66, 0.54, 0.42];
    return (
        <group>
            {discs.map((r, i) => (
                <mesh key={i} geometry={GEO.disc} position={[0, i * 0.16 - 0.32, 0]} scale={[r, 1, r * 0.7]}>
                    <meshStandardMaterial color={color} roughness={0.5} metalness={0} transparent opacity={dim ? 0.3 : 0.95} emissive={color} emissiveIntensity={0.1} />
                </mesh>
            ))}
            {!dim && [[0.8, 0.5, 0.3], [-0.7, -0.45, 0.2]].map((p, i) => (
                <mesh key={i} geometry={GEO.sphere} position={p as [number, number, number]} scale={0.12}>
                    <meshStandardMaterial color="#FDBA74" roughness={0.5} />
                </mesh>
            ))}
        </group>
    );
}

function CentrosomeUnit({ color, dim }: { color: string; dim: boolean }) {
    return (
        <group>
            <mesh geometry={GEO.rod} scale={[1, 1.6, 1]}>
                <meshStandardMaterial color={color} roughness={0.5} transparent opacity={dim ? 0.3 : 1} emissive={color} emissiveIntensity={0.12} />
            </mesh>
            <mesh geometry={GEO.rod} rotation={[0, 0, Math.PI / 2]} position={[0.25, 0.25, 0]} scale={[1, 1.6, 1]}>
                <meshStandardMaterial color={color} roughness={0.5} transparent opacity={dim ? 0.3 : 1} emissive={color} emissiveIntensity={0.12} />
            </mesh>
        </group>
    );
}

function VacuoleUnit({ color, dim }: { color: string; dim: boolean }) {
    return (
        <mesh geometry={GEO.sphere}>
            <meshStandardMaterial color={color} roughness={0.15} metalness={0} transparent opacity={dim ? 0.18 : 0.32} depthWrite={false} emissive={color} emissiveIntensity={0.1} />
        </mesh>
    );
}

// ER: ống quấn quanh nhân (TubeGeometry theo đường xoắn)
function ERStructure({ color, dim }: { color: string; dim: boolean }) {
    const geo = useMemo(() => {
        const pts: THREE.Vector3[] = [];
        const turns = 2.5;
        for (let i = 0; i <= 60; i++) {
            const t = i / 60;
            const a = t * Math.PI * 2 * turns;
            const r = 1.0 + 0.18 * Math.sin(t * Math.PI * 4);
            pts.push(new THREE.Vector3(Math.cos(a) * r, (t - 0.5) * 1.4, Math.sin(a) * r));
        }
        return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, 0.09, 8, false);
    }, []);
    return (
        <mesh geometry={geo}>
            <meshStandardMaterial color={color} roughness={0.5} metalness={0} transparent opacity={dim ? 0.3 : 0.95} emissive={color} emissiveIntensity={0.1} />
        </mesh>
    );
}

// Roi vi khuẩn: ống sóng sin, xoay nhẹ quanh trục
function FlagellumStructure({ color, dim, clock }: { color: string; dim: boolean; clock: SimClock }) {
    const ref = useRef<THREE.Group>(null);
    const geo = useMemo(() => {
        const pts: THREE.Vector3[] = [];
        for (let i = 0; i <= 40; i++) {
            const t = i / 40;
            pts.push(new THREE.Vector3(-t * 2.2, Math.sin(t * Math.PI * 4) * 0.32, Math.cos(t * Math.PI * 4) * 0.32));
        }
        return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.05, 6, false);
    }, []);
    useFrame((_, d) => {
        if (ref.current) ref.current.rotation.x += d * clock.timeScale * 1.5;
    });
    return (
        <group ref={ref}>
            <mesh geometry={geo}>
                <meshStandardMaterial color={color} roughness={0.5} transparent opacity={dim ? 0.3 : 1} emissive={color} emissiveIntensity={0.12} />
            </mesh>
        </group>
    );
}

// Pili: sợi mảnh tỏa ra từ bề mặt
function PiliStructure({ color, dim, positions }: { color: string; dim: boolean; positions: [number, number, number][] }) {
    return (
        <group>
            {positions.map((p, i) => {
                const dir = new THREE.Vector3(...p).normalize();
                const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
                const outer = new THREE.Vector3(...p).multiplyScalar(1.18);
                return (
                    <mesh key={i} geometry={GEO.rod} position={outer.toArray()} quaternion={q} scale={[0.5, 0.5, 0.5]}>
                        <meshStandardMaterial color={color} roughness={0.6} transparent opacity={dim ? 0.3 : 1} />
                    </mesh>
                );
            })}
        </group>
    );
}

// Trường ribôxôm: InstancedMesh chấm li ti
function RibosomeField({ color, dim, positions, scale, handlers }: { color: string; dim: boolean; positions: [number, number, number][]; scale: number; handlers: any }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    useLayoutEffect(() => {
        const mesh = ref.current;
        if (!mesh) return;
        const m = new THREE.Matrix4();
        positions.forEach((p, i) => {
            m.makeTranslation(p[0], p[1], p[2]);
            m.scale(new THREE.Vector3(scale, scale, scale));
            mesh.setMatrixAt(i, m);
        });
        mesh.instanceMatrix.needsUpdate = true;
    }, [positions, scale]);
    // InstancedMesh nhận pointer event trực tiếp — chấm ribôxôm bấm/hover được, không cần hit sphere lớn
    return (
        <instancedMesh ref={ref} args={[GEO.sphereLo, undefined, positions.length]} frustumCulled={false} {...handlers}>
            <meshStandardMaterial color={color} roughness={0.5} metalness={0} transparent opacity={dim ? 0.3 : 1} emissive={color} emissiveIntensity={0.15} />
        </instancedMesh>
    );
}

export const Organelle3D: React.FC<Organelle3DProps> = ({ data, clock, onSelect, registry, focusedId, quality, shellIndex = -1, shellTotal = 0 }) => {
    const td = data.threeD;
    const groupRef = useRef<THREE.Group>(null);
    const [hovered, setHovered] = useState(false);

    const dim = focusedId !== null && focusedId !== data.id;

    const count = td?.count ?? 1;
    const spread = td?.spread ?? 0;
    const mode = td?.scatter ?? 'shell';
    // tier thấp: giảm một nửa số instance đông (ribôxôm) để nhẹ GPU
    const effectiveCount = quality === 'low' && count > 8 ? Math.ceil(count / 2) : count;

    const positions = useMemo(
        () => (count > 1 ? scatter(effectiveCount, spread, mode) : []),
        [effectiveCount, spread, mode, count]
    );

    const baseScale = td ? scalar(td.scale) : 1;
    const regRadius = count > 1 ? spread + baseScale : (td?.geometry === 'shell' ? (td.shellRadius ?? 2.4) : baseScale);

    useEffect(() => {
        if (groupRef.current) registry.current[data.id] = { object: groupRef.current, radius: regRadius };
        return () => { delete registry.current[data.id]; };
    }, [data.id, regRadius, registry]);

    useFrame((_, d) => {
        if (groupRef.current) {
            const t = dim ? 0.72 : hovered ? 1.14 : 1;
            damp3(groupRef.current.scale, [t, t, t], 0.12, d);
        }
    });

    if (!td) return null;

    const handlers = {
        onClick: (e: any) => { e.stopPropagation(); onSelect(data.id); },
        onPointerOver: (e: any) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; },
        onPointerOut: () => { setHovered(false); document.body.style.cursor = 'default'; }
    };

    // Shell (màng/thành/vỏ nhầy): CellBody vẽ phần nhìn; ở đây chỉ label + đăng ký fly-to.
    // Label các vỏ RẢI NGANG phía trên (fan theo shellIndex) để không chồng lên nhau ở đỉnh.
    if (td.geometry === 'shell') {
        const r = td.shellRadius ?? 2.4;
        // Rải theo CUNG phía trên, lệch nhẹ azimuth để vỏ ở giữa KHÔNG nằm đúng tâm
        // (tránh đè label vùng nhân/tế bào chất vốn ở chính giữa-đỉnh).
        const t = shellTotal > 1 ? shellIndex / (shellTotal - 1) : 0.5;
        const ang = Math.PI * 0.82 - t * (Math.PI * 0.62) + 0.22;
        const rr = r + 0.7;
        const labelShell: [number, number, number] = [Math.cos(ang) * rr * 1.85, Math.sin(ang) * rr, 0];
        return (
            <group ref={groupRef}>
                <Html center position={labelShell} zIndexRange={[30, 0]} wrapperClass="pointer-events-none" style={{ opacity: dim ? 0.35 : 1, transition: 'opacity 0.3s' }}>
                    <button onClick={(e) => { e.stopPropagation(); onSelect(data.id); }} className={`pointer-events-auto px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold text-white whitespace-nowrap border transition-all ${focusedId === data.id || hovered ? 'bg-black/75 border-white/40 scale-110' : 'bg-black/45 border-white/15'}`}>
                        {data.name}
                    </button>
                </Html>
            </group>
        );
    }

    // Đơn vị hình học cho geometry "đặt theo điểm"
    const renderUnit = () => {
        switch (td.geometry) {
            case 'nucleus': return <NucleusUnit color={data.color} dim={dim} />;
            case 'bean': return <MitochondrionUnit color={data.color} dim={dim} />;
            case 'chloroplast': return <ChloroplastUnit color={data.color} dim={dim} />;
            case 'golgi': return <GolgiUnit color={data.color} dim={dim} />;
            case 'centrosome': return <CentrosomeUnit color={data.color} dim={dim} />;
            case 'vacuole': return <VacuoleUnit color={data.color} dim={dim} />;
            case 'sphere':
            default:
                return (
                    <mesh geometry={GEO.sphere}>
                        <meshStandardMaterial color={data.color} roughness={0.5} metalness={0} transparent opacity={dim ? 0.3 : 0.95} emissive={data.color} emissiveIntensity={0.12} />
                    </mesh>
                );
        }
    };

    // Vị trí label: count>1 → neo ở 1 instance "xích đạo" rồi đẩy RA NGOÀI theo phương
    // bán kính (callout quanh chu vi, tránh chụm ở đỉnh). Đơn lẻ → phía trên tâm.
    const labelPos: [number, number, number] = useMemo(() => {
        if (count > 1 && positions.length) {
            const mid = positions[Math.floor(positions.length / 2)];
            const out = new THREE.Vector3(...mid);
            if (out.lengthSq() > 0.0001) out.normalize().multiplyScalar(0.65);
            return [mid[0] + out.x, mid[1] + out.y + 0.2, mid[2] + out.z];
        }
        return [0, baseScale + 0.45, 0];
    }, [positions, count, baseScale]);
    const focusedThis = focusedId === data.id;

    return (
        <group ref={groupRef} position={td.position} rotation={td.rotation}>
            {/* Hình học */}
            {td.geometry === 'er' ? (
                <ERStructure color={data.color} dim={dim} />
            ) : td.geometry === 'flagellum' ? (
                <FlagellumStructure color={data.color} dim={dim} clock={clock} />
            ) : td.geometry === 'pili' ? (
                <PiliStructure color={data.color} dim={dim} positions={positions} />
            ) : td.geometry === 'ribosomes' ? (
                <RibosomeField color={data.color} dim={dim} positions={positions} scale={baseScale} handlers={handlers} />
            ) : count > 1 ? (
                positions.map((p, i) => (
                    <group key={i} position={p} scale={baseScale}>
                        {renderUnit()}
                    </group>
                ))
            ) : (
                <group scale={td.scale}>{renderUnit()}</group>
            )}

            {/* Vùng chạm vô hình — BackSide để cầu NHỎ NHẤT bao quanh điểm chạm thắng
                (bào quan cụ thể nhất), không bị cầu lớn của nhóm khác chặn.
                count>1 → mỗi instance một cầu nhỏ; ribôxôm tự xử lý qua InstancedMesh. */}
            {td.geometry !== 'ribosomes' && (
                count > 1 ? (
                    positions.map((p, i) => (
                        <mesh key={`hit-${i}`} position={p} visible={false} {...handlers}>
                            <sphereGeometry args={[Math.max(baseScale * 1.5, 0.45), 8, 8]} />
                            <meshBasicMaterial transparent opacity={0} side={THREE.BackSide} depthWrite={false} />
                        </mesh>
                    ))
                ) : (
                    <mesh visible={false} {...handlers}>
                        <sphereGeometry args={[td.geometry === 'er' ? 1.15 : td.geometry === 'flagellum' ? 0.8 : Math.max(baseScale * 1.1, 0.5), 10, 10]} />
                        <meshBasicMaterial transparent opacity={0} side={THREE.BackSide} depthWrite={false} />
                    </mesh>
                )
            )}

            {/* Label tiếng Việt LUÔN hiển thị (mobile không có hover) + chính là nút chạm.
                Mờ bớt khi có bào quan khác đang được focus; nổi bật khi là cái đang focus/hover. */}
            <Html center position={labelPos} zIndexRange={[30, 0]} wrapperClass="pointer-events-none" style={{ opacity: dim ? 0.35 : 1, transition: 'opacity 0.3s' }}>
                <button
                    onClick={(e) => { e.stopPropagation(); onSelect(data.id); }}
                    className={`pointer-events-auto px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold text-white whitespace-nowrap border transition-all ${focusedThis || hovered ? 'bg-black/75 border-white/40 scale-110' : 'bg-black/45 border-white/15'}`}
                >
                    {data.name}
                </button>
            </Html>
        </group>
    );
};
