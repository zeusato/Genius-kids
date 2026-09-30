import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { reading } from '../engine/solver';
import { materials, PALETTE } from './materials';
import { GEO } from './parts/geometry';
import type { LiveState } from './parts/PartModel';
import { wireCurve } from './wireGeometry';
import type { WireTone } from './wireColors';

export interface WireView {
    id: string;
    points: THREE.Vector3[];
    curve: THREE.CatmullRomCurve3;
    length: number;
    tone: WireTone;
    broken: boolean;
}

export function makeWireView(id: string, points: THREE.Vector3[], tone: WireTone, broken: boolean): WireView {
    const curve = wireCurve(points);
    return { id, points, curve, length: curve.getLength(), tone, broken };
}

// Vỏ nhựa trong có độ bóng + lõi đồng đọc được bên trong (bản thử bench.html).
let sheathCache: Record<string, THREE.MeshPhysicalMaterial> | null = null;
export function sheathMaterials() {
    return sheathCache ??= {
        teal: new THREE.MeshPhysicalMaterial({ color: PALETTE.wireTeal, roughness: 0.25, transparent: true, opacity: 0.58, clearcoat: 1, clearcoatRoughness: 0.2, depthWrite: false }),
        coral: new THREE.MeshPhysicalMaterial({ color: PALETTE.wireCoral, roughness: 0.25, transparent: true, opacity: 0.58, clearcoat: 1, clearcoatRoughness: 0.2, depthWrite: false }),
        gold: new THREE.MeshPhysicalMaterial({ color: PALETTE.wireGold, roughness: 0.25, transparent: true, opacity: 0.72, clearcoat: 1, emissive: '#6a4a10', emissiveIntensity: 0.4, depthWrite: false }),
        grey: new THREE.MeshPhysicalMaterial({ color: PALETTE.wireGrey, roughness: 0.4, transparent: true, opacity: 0.7, depthWrite: false }),
        drag: new THREE.MeshPhysicalMaterial({ color: PALETTE.wireGold, roughness: 0.25, transparent: true, opacity: 0.55, clearcoat: 1, depthWrite: false }),
    };
}

function tube(curve: THREE.Curve<THREE.Vector3>, length: number, radius: number, radial: number) {
    return new THREE.TubeGeometry(curve, Math.max(10, Math.ceil(length * (radial > 6 ? 14 : 8))), radius, radial, false);
}

/** Hai nửa của dây đứt (chừa khe giữa); dây lành trả về chính đường cong. */
function segments(view: WireView): { curve: THREE.Curve<THREE.Vector3>; length: number }[] {
    if (!view.broken) return [{ curve: view.curve, length: view.length }];
    const gap = Math.min(0.2, 0.12 / Math.max(0.5, view.length));
    return [[0, 0.5 - gap], [0.5 + gap, 1]].map(([u0, u1]) => {
        const c = wireCurve(Array.from({ length: 24 }, (_, i) => view.curve.getPointAt(u0 + (u1 - u0) * i / 23)));
        return { curve: c, length: c.getLength() };
    });
}

function Sheath({ view, highlight }: { view: WireView; highlight: boolean }) {
    const sheaths = sheathMaterials();
    const geos = useMemo(() => segments(view).map(sg => tube(sg.curve, sg.length, 0.085, 10)), [view]);
    useEffect(() => () => geos.forEach(g => g.dispose()), [geos]);
    const material = view.broken ? sheaths.grey : highlight ? sheaths.gold : sheaths[view.tone];
    return <>{geos.map((g, i) => <mesh key={i} geometry={g} material={material} castShadow renderOrder={1} userData={{ wireId: view.id }} />)}</>;
}

/** Lõi đồng của mọi dây gộp một khối + khoen đồng đầu dây instanced: 2 lượt vẽ cho cả bàn. */
function Cores({ views, live }: { views: WireView[]; live: React.MutableRefObject<LiveState> }) {
    const m = materials(), group = useRef<THREE.Group>(null), lugs = useRef<THREE.InstancedMesh>(null);
    const merged = useMemo(() => {
        const list = views.flatMap(v => segments(v).map(sg => tube(sg.curve, sg.length, 0.03, 5).toNonIndexed()));
        const g = list.length ? mergeGeometries(list) : null;
        list.forEach(x => x.dispose());
        return g;
    }, [views]);
    useEffect(() => () => { merged?.dispose(); }, [merged]);
    const ends = useMemo(() => views.flatMap(v => [v.points[0], v.points[v.points.length - 1]]), [views]);
    useEffect(() => {
        const inst = lugs.current; if (!inst) return;
        const m4 = new THREE.Matrix4();
        ends.forEach((p, i) => inst.setMatrixAt(i, m4.makeTranslation(p.x, p.y - 0.06, p.z)));
        inst.instanceMatrix.needsUpdate = true;
    }, [ends]);
    useFrame(() => { if (group.current) group.current.visible = live.current.morph < 0.55; });
    return <group ref={group}>
        {merged && <mesh geometry={merged} material={m.copper} />}
        {ends.length > 0 && <instancedMesh key={ends.length} ref={lugs} args={[GEO.lug(), m.brass, ends.length]} frustumCulled={false} />}
    </group>;
}

/** Tất cả dây + một InstancedMesh electron cho cả bàn. Vỏ nhựa mờ dần khi chuyển sang sơ đồ. */
export function Wires({ views, highlighted, live, flow }: {
    views: WireView[];
    highlighted: Set<string>;
    live: React.MutableRefObject<LiveState>;
    flow: 'electron' | 'conventional' | 'off';
}) {
    const sheaths = sheathMaterials();
    useFrame(() => {
        const k = 1 - Math.min(1, live.current.morph * 1.6);
        sheaths.teal.opacity = sheaths.coral.opacity = 0.58 * k; sheaths.gold.opacity = 0.72 * k; sheaths.grey.opacity = 0.7 * k;
        for (const s of Object.values(sheaths)) s.visible = k > 0.01;
    });
    return <>
        {views.map(v => <Sheath key={`${v.id}:${v.tone}:${v.broken}`} view={v} highlight={highlighted.has(v.id)} />)}
        <Cores views={views} live={live} />
        {flow !== 'off' && <Electrons views={views} live={live} flow={flow} />}
    </>;
}

const CAPACITY = 1600;
/**
 * Electron (chấm xanh) chạy trong lõi, ngược chiều dòng điện quy ước; chế độ "quy ước" đổi màu vàng và chạy xuôi.
 * Tốc độ theo log |I| (nối tiếp chậm hơn song song thấy rõ) — là minh họa, không phải vận tốc trôi thật.
 */
function Electrons({ views, live, flow }: { views: WireView[]; live: React.MutableRefObject<LiveState>; flow: 'electron' | 'conventional' }) {
    const mesh = useRef<THREE.InstancedMesh>(null);
    const geo = useMemo(() => new THREE.IcosahedronGeometry(0.046, 0), []);
    const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false }), []);
    useEffect(() => () => { geo.dispose(); mat.dispose(); }, [geo, mat]);
    const frames = useMemo(() => views.map(v => ({ v, n: Math.max(3, Math.floor(v.length / 0.26)), phase: new Float32Array(Math.max(3, Math.floor(v.length / 0.26))).map((_, k) => (k * 2.39996) % (Math.PI * 2)) })), [views]);
    const m4 = useMemo(() => new THREE.Matrix4(), []), p = useMemo(() => new THREE.Vector3(), []), t0 = useRef(0), offsets = useRef(new Map<string, number>());
    useFrame((_, dt) => {
        const inst = mesh.current; if (!inst) return;
        const { sim, hdr, reduced, morph } = live.current;
        mat.color.set(flow === 'electron' ? PALETTE.electron : PALETTE.conventional).multiplyScalar(hdr ? 3 : 1.05);
        const s = sim().solution; let count = 0;
        t0.current += reduced ? 0 : Math.min(dt, 0.1);
        for (const { v, n, phase } of frames) {
            if (v.broken) continue;
            const I = reading(s, v.id).Iab; if (Math.abs(I) < 2e-6) continue;
            const speed = Math.min(1.6, 0.15 + 0.55 * Math.log10(1 + Math.abs(I) / 0.005));
            // Iab > 0: dòng quy ước đi từ đầu a → b của dây (đúng chiều đường cong). Electron đi ngược lại.
            const dir = Math.sign(I) * (flow === 'electron' ? -1 : 1);
            const off = (offsets.current.get(v.id) ?? 0) + dir * speed * (reduced ? 0 : Math.min(dt, 0.1)) / v.length;
            offsets.current.set(v.id, off);
            for (let k = 0; k < n && count < CAPACITY; k++) {
                let u = ((k + 0.5) / n + off) % 1; if (u < 0) u += 1;
                v.curve.getPointAt(u, p);
                const r = 0.035 * (1 - morph);
                p.x += Math.cos(phase[k] + t0.current * 3) * r; p.y += Math.sin(phase[k] + t0.current * 3) * r * (1 - morph);
                m4.makeTranslation(p.x, p.y, p.z); inst.setMatrixAt(count++, m4);
            }
        }
        inst.count = count; inst.instanceMatrix.needsUpdate = true;
    });
    return <instancedMesh ref={mesh} args={[geo, mat, CAPACITY]} frustumCulled={false} renderOrder={4} />;
}

/** Dây tạm đi theo ngón tay khi kéo từ một cọc. */
export function DragWire({ points }: { points: THREE.Vector3[] }) {
    const geo = useMemo(() => { const c = wireCurve(points); return tube(c, c.getLength(), 0.08, 10); }, [points]);
    useEffect(() => () => geo.dispose(), [geo]);
    return <mesh geometry={geo} material={sheathMaterials().drag} renderOrder={5} />;
}
