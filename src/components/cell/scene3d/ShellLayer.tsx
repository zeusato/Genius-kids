import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { ThreeEvent, useFrame } from '@react-three/fiber';
import { BodyRegistry, FocusState, SHARED_TIME } from './core';
import { BandMode, createFx, createOrganicMaterial, dampFx, OrganicOptions, useDisposable } from './materials';
import {
    createShellUniforms, CutUniforms, inCutWindow, ShellState, shellPoint, ShellUniforms, syncShellUniforms
} from './shell';
import { bakedShell, unitSphere } from './geo';
import { Vec3 } from './noise';
import type { QualityTier } from './params';

// === Một lớp vỏ có chiều dày: mặt ngoài + mặt trong + dải mặt cắt + protein neo trên vỏ ===

export interface ProteinSpec {
    geometry: THREE.BufferGeometry; // có thuộc tính color (vertexColors)
    dirs: Vec3[];                   // hướng neo (đơn vị, local của tế bào)
    lift: number;                   // lệch theo hướng neo (âm = lún vào màng)
    scale: (i: number) => number;
    spin?: (i: number) => number;
    material?: Partial<OrganicOptions>;
}

export interface ShellLayerSpec {
    id: string;                     // id bào quan (plasma_membrane, cell_wall...)
    state: ShellState;              // mặt ngoài — object MUTABLE, thí nghiệm sửa trực tiếp
    thickness: number;
    outer: Omit<OrganicOptions, 'shell' | 'cut' | 'fx'>;
    inner: Omit<OrganicOptions, 'shell' | 'cut' | 'fx'>;
    band: { mode: BandMode; a: string; b: string; c: string };
    cutGlow?: { color: string; strength: number };
    proteins?: ProteinSpec[];
    highlight?: string;
}

const BAND_SEGMENTS = 180;

function createBandGeometry(n: number): THREE.BufferGeometry {
    const g = new THREE.BufferGeometry();
    const count = (n + 1) * 2;
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(count * 3), 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aBand', new THREE.BufferAttribute(new Float32Array(count * 2), 2).setUsage(THREE.DynamicDrawUsage));
    const idx: number[] = [];
    for (let j = 0; j < n; j++) {
        const a = j * 2, b = a + 1, c = a + 2, d = a + 3;
        idx.push(a, c, b, b, c, d);
    }
    g.setIndex(idx);
    return g;
}

const _a = new THREE.Vector3();
const _b1 = new THREE.Vector3();
const _b2 = new THREE.Vector3();
const _u = new THREE.Vector3();
const _d = new THREE.Vector3();
const _po = new THREE.Vector3();
const _pi = new THREE.Vector3();
const _prev = new THREE.Vector3();
const _n = new THREE.Vector3();

// Dải mặt cắt = mặt nón cửa sổ kẹp giữa mặt trong và mặt ngoài của lớp vỏ. Tính trên CPU bằng
// ĐÚNG công thức shader dùng để đẩy vỏ (shellPoint) → mép cắt khớp tuyệt đối kể cả khi vỏ phập phồng.
function updateBand(g: THREE.BufferGeometry, cut: CutUniforms, outer: ShellState, inner: ShellState, time: number, n: number): boolean {
    const cosT = cut.uCutCos.value;
    if (cosT >= 0.9995) return false;
    const sinT = Math.sqrt(Math.max(0, 1 - cosT * cosT));
    const h = cut.uCutHalf.value;
    _a.copy(cut.uCutAxis.value);
    const helper = Math.abs(_a.y) < 0.9 ? _b2.set(0, 1, 0) : _b2.set(1, 0, 0);
    _b1.crossVectors(_a, helper).normalize();
    _b2.crossVectors(_a, _b1);
    const pos = g.attributes.position.array as Float32Array;
    const nor = g.attributes.normal.array as Float32Array;
    const band = g.attributes.aBand.array as Float32Array;
    let arc = 0;
    for (let j = 0; j <= n; j++) {
        const phi = (j / n) * Math.PI * 2;
        const c = Math.cos(phi), s = Math.sin(phi);
        _u.set(
            _a.x * cosT + (_b1.x * c + _b2.x * s) * sinT,
            _a.y * cosT + (_b1.y * c + _b2.y * s) * sinT,
            _a.z * cosT + (_b1.z * c + _b2.z * s) * sinT
        );
        _d.set(_u.x * h.x, _u.y * h.y, _u.z * h.z).normalize();
        shellPoint(_po, _d, outer, time);
        shellPoint(_pi, _d, inner, time);
        // pháp tuyến mặt nón (không gian chuẩn hóa: a − u·cosθ, hướng vào trục) → về local
        _n.set(_a.x - _u.x * cosT, _a.y - _u.y * cosT, _a.z - _u.z * cosT);
        _n.set(_n.x / h.x, _n.y / h.y, _n.z / h.z).normalize();
        if (j > 0) arc += _po.distanceTo(_prev);
        _prev.copy(_po);
        const i0 = j * 2, i1 = i0 + 1;
        pos.set([_pi.x, _pi.y, _pi.z], i0 * 3);
        pos.set([_po.x, _po.y, _po.z], i1 * 3);
        nor.set([_n.x, _n.y, _n.z], i0 * 3);
        nor.set([_n.x, _n.y, _n.z], i1 * 3);
        band.set([0, arc], i0 * 2);
        band.set([1, arc], i1 * 2);
    }
    g.attributes.position.needsUpdate = true;
    g.attributes.normal.needsUpdate = true;
    g.attributes.aBand.needsUpdate = true;
    // dải này là hình CPU thật → raycast được (chạm vòng mặt cắt = chọn đúng lớp vỏ đó)
    g.computeBoundingSphere();
    return true;
}

function innerOf(st: ShellState, thickness: number, out?: ShellState): ShellState {
    const half: [number, number, number] = [
        Math.max(0.01, st.shape.half[0] - thickness),
        Math.max(0.01, st.shape.half[1] - thickness),
        Math.max(0.01, st.shape.half[2] - thickness)
    ];
    if (out) {
        out.shape.half = half;
        out.shape.exp = st.shape.exp;
        out.shape.round = st.shape.round;
        out.amp = st.amp;
        out.pinch = st.pinch;
        out.pinchWidth = st.pinchWidth;
        return out;
    }
    return { ...st, shape: { ...st.shape, half } };
}

function ProteinField({ spec, shellU, cut, tier }: { spec: ProteinSpec; shellU: ShellUniforms; cut: CutUniforms; tier: QualityTier }) {
    const { geometry, material, matrices } = useMemo(() => {
        const g = spec.geometry.clone();
        const dirs = new Float32Array(spec.dirs.length * 3);
        const mats: THREE.Matrix4[] = [];
        const up = new THREE.Vector3(0, 1, 0);
        spec.dirs.forEach((d, i) => {
            dirs.set(d, i * 3);
            const dir = new THREE.Vector3(...d).normalize();
            const q = new THREE.Quaternion().setFromUnitVectors(up, dir);
            if (spec.spin) q.multiply(new THREE.Quaternion().setFromAxisAngle(up, spec.spin(i)));
            const s = spec.scale(i);
            mats.push(new THREE.Matrix4().compose(dir.clone().multiplyScalar(spec.lift), q, new THREE.Vector3(s, s, s)));
        });
        g.setAttribute('aDir', new THREE.InstancedBufferAttribute(dirs, 3));
        const m = createOrganicMaterial({
            color: '#ffffff',
            roughness: 0.4,
            clearcoat: 0.5,
            emissiveIntensity: 0.12,
            vertexColors: true,
            ...spec.material,
            anchor: { shell: shellU, cut }
        }, tier).material;
        return { geometry: g, material: m, matrices: mats };
    }, [spec, shellU, cut, tier]);
    useDisposable(geometry, material);

    const ref = useRef<THREE.InstancedMesh>(null);
    useEffect(() => {
        const mesh = ref.current;
        if (!mesh) return;
        matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
        mesh.instanceMatrix.needsUpdate = true;
    }, [matrices]);

    return (
        <instancedMesh
            ref={ref}
            args={[geometry, material, spec.dirs.length]}
            frustumCulled={false}
            raycast={() => null}
        />
    );
}

interface ShellLayerProps {
    spec: ShellLayerSpec;
    cut: CutUniforms;
    tier: QualityTier;
    focus: FocusState;
    segments: [number, number];
    onSelect: (id: string) => void;
    registry: React.MutableRefObject<BodyRegistry>;
    interiorId?: string;     // lớp trong cùng: chạm khoảng trống bên trong = chọn tế bào chất
    anchorDir?: Vec3;        // chỗ đặt nhãn của lớp vỏ
    // 'shell' = vỏ ngoài của tế bào (nhãn luôn hiện), 'body' = vỏ bên trong (màng nhân — nhãn bị
    // màng tế bào che như bào quan thường), null = không đăng ký
    registerAs?: 'shell' | 'body' | null;
    interactive?: boolean;
}

export const ShellLayer: React.FC<ShellLayerProps> = ({
    spec, cut, tier, focus, segments, onSelect, registry, interiorId, anchorDir, registerAs = 'shell', interactive = true
}) => {
    const groupRef = useRef<THREE.Group>(null);
    const anchorRef = useRef<THREE.Object3D>(null);
    const innerState = useMemo(() => innerOf(spec.state, spec.thickness), [spec]);
    const outerU = useMemo(() => createShellUniforms(spec.state), [spec]);
    const innerU = useMemo(() => createShellUniforms(innerState), [innerState]);
    const fx = useMemo(() => createFx(spec.highlight ?? '#ffffff'), [spec]);

    const outerMat = useMemo(
        () => createOrganicMaterial({ ...spec.outer, shell: outerU, cut, cutGlow: spec.cutGlow, fx }, tier).material,
        [spec, outerU, cut, fx, tier]
    );
    const innerMat = useMemo(
        () => createOrganicMaterial({ ...spec.inner, side: THREE.BackSide, shell: innerU, cut, fx }, tier).material,
        [spec, innerU, cut, fx, tier]
    );
    const bandGeo = useMemo(() => createBandGeometry(BAND_SEGMENTS), []);
    const bandMat = useMemo(
        () => createOrganicMaterial({
            color: '#ffffff',
            roughness: 0.55,
            clearcoat: 0.3,
            emissive: spec.band.a,
            emissiveIntensity: 0.12,
            side: THREE.DoubleSide,
            band: { ...spec.band, thickness: spec.thickness },
            fx
        }, tier).material,
        [spec, fx, tier]
    );
    const bandRef = useRef<THREE.Mesh>(null);

    // Vùng chạm tĩnh trên CPU (vỏ thật biến dạng trên GPU nên raycast không dùng được)
    const outerProxy = useMemo(() => bakedShell(spec.state.shape), [spec]);
    const innerProxy = useMemo(() => bakedShell(innerState.shape), [innerState]);
    useDisposable(outerMat, innerMat, bandMat, bandGeo, outerProxy, innerProxy);

    useEffect(() => {
        if (!anchorRef.current || !groupRef.current || !registerAs) return;
        const d = new THREE.Vector3(...(anchorDir ?? [0, 1, 0.4])).normalize();
        shellPoint(anchorRef.current.position, d, spec.state, 0);
        const group = groupRef.current;
        registry.current[spec.id] = {
            object: group,
            radius: Math.max(...spec.state.shape.half),
            label: anchorRef.current,
            shell: registerAs === 'shell'
        };
        return () => {
            if (registry.current[spec.id]?.object === group) delete registry.current[spec.id];
        };
    }, [spec, anchorDir, registry, registerAs]);

    useFrame((_, delta) => {
        // thí nghiệm có thể sửa spec.state (co nguyên sinh, thắt eo) → đồng bộ uniform mỗi frame
        syncShellUniforms(outerU, spec.state);
        innerOf(spec.state, spec.thickness, innerState);
        syncShellUniforms(innerU, innerState);
        dampFx(fx, focus, delta);
        const visible = updateBand(bandGeo, cut, spec.state, innerState, SHARED_TIME.value, BAND_SEGMENTS);
        if (bandRef.current) bandRef.current.visible = visible;
        // cửa sổ đóng: bỏ cả vùng chạm của dải (raycast không xét visible nhưng có xét drawRange)
        bandGeo.setDrawRange(0, visible ? Infinity : 0);
    });

    const passThroughWindow = (e: ThreeEvent<MouseEvent>) => {
        const g = groupRef.current;
        if (!g) return true;
        const local = g.worldToLocal(e.point.clone());
        return inCutWindow(local, cut, 0.02);
    };

    const onOuterClick = (e: ThreeEvent<MouseEvent>) => {
        if (!interactive || passThroughWindow(e)) return; // chạm vào cửa sổ → để tia đi tiếp vào trong
        e.stopPropagation();
        onSelect(spec.id);
    };
    const onOuterOver = (e: ThreeEvent<PointerEvent>) => {
        if (!interactive || passThroughWindow(e as unknown as ThreeEvent<MouseEvent>)) return;
        document.body.style.cursor = 'pointer';
    };

    const sphere = unitSphere(segments[0], segments[1]);

    return (
        <group ref={groupRef}>
            <object3D ref={anchorRef} />
            <mesh geometry={sphere} material={outerMat} frustumCulled={false} raycast={() => null} renderOrder={1} />
            <mesh geometry={sphere} material={innerMat} frustumCulled={false} raycast={() => null} renderOrder={0} />
            <mesh
                ref={bandRef}
                geometry={bandGeo}
                material={bandMat}
                frustumCulled={false}
                renderOrder={1}
                onClick={(e) => { if (!interactive) return; e.stopPropagation(); onSelect(spec.id); }}
                onPointerOver={(e) => { if (!interactive) return; e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
                onPointerOut={() => { document.body.style.cursor = 'default'; }}
            />
            {spec.proteins?.map((p, i) => (
                <ProteinField key={i} spec={p} shellU={outerU} cut={cut} tier={tier} />
            ))}
            <mesh
                geometry={outerProxy}
                visible={false}
                userData={{ cellShell: spec.id }}
                onClick={onOuterClick}
                onPointerOver={onOuterOver}
                onPointerOut={() => { document.body.style.cursor = 'default'; }}
            >
                <meshBasicMaterial side={THREE.FrontSide} />
            </mesh>
            {interiorId && (
                <mesh
                    geometry={innerProxy}
                    visible={false}
                    onClick={(e) => { if (!interactive) return; e.stopPropagation(); onSelect(interiorId); }}
                >
                    <meshBasicMaterial side={THREE.BackSide} />
                </mesh>
            )}
        </group>
    );
};

// === Điều khiển cửa sổ cắt: trục luôn quay về camera (nghiêng lên một chút), góc mở tween mượt ===
// Nghiêng trục về phía "trên" của camera: bé nhìn CHẾCH vào mặt cắt thay vì nhìn thẳng vào lòng bát
// → thấy cả mép cắt lẫn phần vỏ cong phía dưới, khối 3D rõ hơn hẳn (như hình cắt trong sách).
export function useCutWindow(
    cut: CutUniforms,
    groupRef: React.RefObject<THREE.Object3D | null>,
    targetAngle: React.MutableRefObject<number>,
    tilt = 0.3
): React.MutableRefObject<number> {
    const angle = useRef(0);
    const tmp = useMemo(() => new THREE.Vector3(), []);
    const up = useMemo(() => new THREE.Vector3(), []);
    useEffect(() => {
        if (!import.meta.env.DEV) return;
        const w = window as unknown as { __cellCuts?: Set<unknown> };
        (w.__cellCuts ??= new Set()).add(cut);
        return () => { w.__cellCuts?.delete(cut); };
    }, [cut]);
    useFrame(({ camera }, delta) => {
        const g = groupRef.current;
        if (!g) return;
        tmp.copy(camera.position);
        g.worldToLocal(tmp);
        const dist = tmp.length();
        if (dist > 1e-4 && tilt !== 0) {
            // hướng "lên" của camera, đổi sang toạ độ local của tế bào
            up.set(0, 1, 0).applyQuaternion(camera.quaternion).multiplyScalar(dist).add(camera.position);
            g.worldToLocal(up).sub(tmp).divideScalar(dist);
            tmp.divideScalar(dist).addScaledVector(up, tilt);
        }
        const h = cut.uCutHalf.value;
        tmp.set(tmp.x / h.x, tmp.y / h.y, tmp.z / h.z);
        if (tmp.lengthSq() > 1e-6) cut.uCutAxis.value.copy(tmp.normalize());
        const k = 1 - Math.exp(-Math.min(delta, 0.1) * 2.6);
        angle.current += (targetAngle.current - angle.current) * k;
        if (Math.abs(targetAngle.current - angle.current) < 0.002) angle.current = targetAngle.current;
        cut.uCutCos.value = angle.current < 0.015 ? 2 : Math.cos(angle.current);
    }, -0.8);
    return angle;
}
