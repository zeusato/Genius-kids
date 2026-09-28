import React, { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html, Line } from '@react-three/drei';
import { SYMBIOSES } from '../../../data/evolution/overlays';
import { idx } from '../engine/tree';
import type { EvoWorld } from './world';

// Cung "cộng sinh nội bào": một vi khuẩn bị nuốt và ở lại thành ty thể (→ nhân thực) hoặc lục lạp
// (→ nhánh thực vật). Đường cong nét đứt chạy về phía nhánh nhận, đốm sáng đi dọc cung = vi khuẩn "được nuốt".
const COLORS = { mito: '#fb923c', chloro: '#4ade80' } as const;

function arcPoints(world: EvoWorld, from: string, to: string, n = 48): THREE.Vector3[] {
    const t = world.tree;
    const a = new THREE.Vector2(world.pr.nodeXY[idx(t, from) * 2], world.pr.nodeXY[idx(t, from) * 2 + 1]);
    const b = new THREE.Vector2(world.pr.nodeXY[idx(t, to) * 2], world.pr.nodeXY[idx(t, to) * 2 + 1]);
    const mid = a.clone().add(b).multiplyScalar(0.5);
    const out = mid.lengthSq() > 1 ? mid.clone().normalize() : new THREE.Vector2(0, 1);
    const c = mid.clone().add(out.multiplyScalar(a.distanceTo(b) * 0.45 + 60));
    const pts: THREE.Vector3[] = [];
    for (let k = 0; k <= n; k++) {
        const s = k / n, u = 1 - s;
        pts.push(new THREE.Vector3(u * u * a.x + 2 * u * s * c.x + s * s * b.x, u * u * a.y + 2 * u * s * c.y + s * s * b.y, 0));
    }
    return pts;
}

const Arc: React.FC<{ world: EvoWorld; id: 'mito' | 'chloro' }> = ({ world, id }) => {
    const sym = SYMBIOSES.find(s => s.id === id)!;
    const [version, setVersion] = useState(world.geometryVersion);
    const pts = useMemo(() => arcPoints(world, sym.from, sym.to), [world, sym, version]);
    const curve = useMemo(() => new THREE.CatmullRomCurve3(pts), [pts]);
    const lineRef = useRef<any>(null);
    const glowRef = useRef<any>(null);
    const dotRef = useRef<THREE.Mesh>(null);
    const [shown, setShown] = useState(false);
    const tmp = useMemo(() => new THREE.Vector3(), []);
    useFrame((_, dt) => {
        if (world.geometryVersion !== version) setVersion(world.geometryVersion);
        const o = world.symbiosis[id];
        if ((o > 0.05) !== shown) setShown(o > 0.05);
        const m = lineRef.current?.material;
        if (m) { m.opacity = o; m.dashOffset -= dt * 60; }
        const g = glowRef.current?.material;
        if (g) g.opacity = o * 0.4;
        if (dotRef.current) {
            const s = (world.uniforms.uTime.value * 0.35) % 1;
            curve.getPointAt(s, tmp);
            dotRef.current.position.copy(tmp);
            (dotRef.current.material as THREE.MeshBasicMaterial).opacity = o;
            dotRef.current.visible = o > 0.02;
        }
    });
    const apex = pts[Math.floor(pts.length / 2)];
    return (
        <group renderOrder={7}>
            <Line ref={glowRef} points={pts} color={COLORS[id]} lineWidth={16} transparent opacity={0} depthTest={false} renderOrder={7} />
            <Line ref={lineRef} points={pts} color={COLORS[id]} lineWidth={5} dashed dashSize={22} gapSize={9} transparent opacity={0} depthTest={false} renderOrder={8} />
            <mesh ref={dotRef} renderOrder={9} visible={false}>
                <circleGeometry args={[9, 20]} />
                <meshBasicMaterial color="#fff7e0" transparent opacity={0} depthTest={false} toneMapped={false} />
            </mesh>
            {shown && (
                <Html position={apex} center zIndexRange={[25, 0]} wrapperClass="pointer-events-none">
                    <div className="px-3 py-1 rounded-full text-xs font-extrabold whitespace-nowrap shadow-lg" style={{ background: COLORS[id], color: '#1a1206' }}>
                        {id === 'mito' ? '🔋 Vi khuẩn → ty thể' : '🌿 Vi khuẩn lam → lục lạp'}
                    </div>
                </Html>
            )}
        </group>
    );
};

export const SymbiosisArcs: React.FC<{ world: EvoWorld }> = ({ world }) => (
    <>
        <Arc world={world} id="mito" />
        <Arc world={world} id="chloro" />
    </>
);
