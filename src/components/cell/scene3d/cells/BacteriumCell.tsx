import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { CellType } from '../../../../data/cellData';
import { useCellCtx, useFocus, useRegister } from '../cellContext';
import { createCutUniforms, createWaves, NO_WAVES, ShellShape, ShellState, shellPoint } from '../shell';
import { ShellLayer, ShellLayerSpec, useCutWindow } from '../ShellLayer';
import { createRandom, randomDirection, Vec3 } from '../noise';
import { bakedShell, colorize, merge } from '../geo';
import { useDisposable } from '../materials';
import { FISSION_DURATION } from '../../../../data/fissionStages';
import { Cytosol } from '../Cytosol';
import { CellLabels } from '../CellLabels';
import { labelSpecsFor } from './labels';
import { Nucleoid } from '../organelles/Nucleoid';
import { Plasmids } from '../organelles/Plasmids';
import { Ribosomes } from '../organelles/Ribosomes';
import { Flagella, FlagellumSpec } from '../organelles/Flagellum';
import { insideSuperellipsoid, pickAnchor, scatterInShell } from '../organelles/placement';
import type { CellViewSpec } from '../CellCameraRig';

// === Bố cục vi khuẩn hình que (kiểu E. coli: dài ~2 µm, rộng ~0,8 µm; bán trục x 2.5 ≙ 1 µm) ===
export const BACTERIA_HALF: [number, number, number] = [2.5, 1.02, 1.02];
const CAPSULE_THICK = 0.16;
const WALL_HALF: [number, number, number] = [2.32, 0.84, 0.84];
const WALL_THICK = 0.07;
const MEM_HALF: [number, number, number] = [2.23, 0.75, 0.75];
const MEM_THICK = 0.045;
const EXP = 3.2;
const INNER: ShellShape = { half: [MEM_HALF[0] - MEM_THICK, MEM_HALF[1] - MEM_THICK, MEM_HALF[2] - MEM_THICK], exp: EXP, round: true };
const NUCLEOID_CENTER: Vec3 = [0.1, 0, 0];
const NUCLEOID_HALF: [number, number, number] = [1.25, 0.36, 0.36];
const PLASMIDS: Vec3[] = [[-1.45, 0.3, 0.2], [1.5, -0.25, 0.25], [0.9, 0.36, -0.3]];
const SEED = 'bacteria';

export const BACTERIA_VIEW: CellViewSpec = { home: [1.5, 2.3, 7.4], introFrom: [-9, 15, 42], radius: 2.5 };

const FLAGELLA: FlagellumSpec[] = [
    { base: [-2.42, 0.05, 0], dir: [-1, 0.08, 0.05], length: 5.2, amp: 0.17, pitch: 1.1 },
    { base: [-2.05, -0.6, 0.38], dir: [-0.8, -0.52, 0.3], length: 3.6, amp: 0.14, pitch: 0.95 }
];

// Sợi lông pili: trụ mảnh gốc ở vỏ (y = 0) mọc ra ngoài (y = 1), thuôn ở ngọn
function piliGeometry(): THREE.BufferGeometry {
    return merge([
        colorize(new THREE.CylinderGeometry(0.02, 0.028, 1, 5, 1).translate(0, 0.5, 0), '#d97706'),
        colorize(new THREE.SphereGeometry(0.03, 6, 5).translate(0, 1, 0), '#fbbf24')
    ], ['position', 'normal', 'color']);
}

function CytoplasmAnchor() {
    const ref = useRef<THREE.Object3D>(null);
    useRegister('cytoplasm_bac', ref, 1.1);
    return <object3D ref={ref} position={[-1.1, -0.45, 0.42]} />;
}

// Lông pili mảnh quá không chạm trúng được → vùng chạm là "viền" mỏng bao quanh vỏ nhầy. Chỉ nhận
// cú chạm KHÔNG trúng vỏ nhầy (tia chỉ sượt qua phần lông) — chạm vào thân vẫn là vỏ nhầy.
function PiliFringe({ anchorDir }: { anchorDir: Vec3 }) {
    const { onSelect, interactive } = useCellCtx();
    const geo = useMemo(() => bakedShell({ half: [BACTERIA_HALF[0] + 0.22, BACTERIA_HALF[1] + 0.34, BACTERIA_HALF[2] + 0.34], exp: EXP, round: true }), []);
    useDisposable(geo);
    const anchor = useRef<THREE.Object3D>(null);
    const labelPos = useMemo<Vec3>(() => {
        const d = new THREE.Vector3(...anchorDir).normalize();
        return shellPoint(new THREE.Vector3(), d, { shape: { half: WALL_HALF, exp: EXP, round: true }, waves: NO_WAVES, amp: 0, pinch: 0, pinchWidth: 0.3 }, 0)
            .addScaledVector(d, 0.42).toArray() as Vec3;
    }, [anchorDir]);
    useRegister('pili', anchor, 0.45);
    return (
        <>
            <object3D ref={anchor} position={labelPos} />
            <mesh
                geometry={geo}
                visible={false}
                onClick={(e) => {
                    if (!interactive) return;
                    if (e.intersections.some((i) => i.object.userData?.cellShell === 'capsule')) return;
                    e.stopPropagation();
                    onSelect('pili');
                }}
            >
                <meshBasicMaterial />
            </mesh>
        </>
    );
}

interface BacteriumCellProps {
    cell: CellType;
    windowOpen: boolean;
    labelsHidden: boolean;
    fission?: boolean; // thí nghiệm "Nhân đôi" đang bật
}

const sstep = (a: number, b: number, x: number) => {
    const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return k * k * (3 - 2 * k);
};

// bản sao plasmid đối xứng qua mặt phẳng x = 0 (sau nhân đôi mỗi con một bộ)
const PLASMIDS_COPY: Vec3[] = PLASMIDS.map(([x, y, z]) => [-x * 0.9, -y, z] as Vec3);

export const BacteriumCell: React.FC<BacteriumCellProps> = ({ cell, windowOpen, labelsHidden, fission = false }) => {
    const { tier, focusedId, onSelect, registry, interactive, experiments } = useCellCtx();
    const stretchRef = useRef<THREE.Group>(null);
    const flagRef = useRef<THREE.Group>(null);
    const nucA = useRef<THREE.Group>(null);
    const nucB = useRef<THREE.Group>(null);
    const plasB = useRef<THREE.Group>(null);
    const high = tier === 'high';
    const groupRef = useRef<THREE.Group>(null);
    const cut = useMemo(() => createCutUniforms(BACTERIA_HALF), []);
    const openTarget = useRef(0);
    openTarget.current = !windowOpen || focusedId === 'capsule' ? 0 : 0.95;
    useCutWindow(cut, groupRef, openTarget);
    const focusCapsule = useFocus('capsule');
    const focusWall = useFocus('cell_wall_bac');
    const focusMem = useFocus('plasma_membrane');

    const capsule = useMemo<ShellLayerSpec>(() => {
        const state: ShellState = {
            shape: { half: [...BACTERIA_HALF], exp: EXP, round: true },
            waves: createWaves(`${SEED}-capsule`, { freq: 2.2, speed: 0.55 }),
            amp: 0.022, pinch: 0, pinchWidth: 0.3
        };
        return {
            id: 'capsule',
            state,
            thickness: CAPSULE_THICK,
            outer: {
                physical: true,
                color: '#fb923c', roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.08, sheen: 0.4, sheenColor: '#fed7aa',
                emissive: '#ea580c', emissiveIntensity: 0.12, jelly: { center: 0.12, edge: 0.7, power: 2.2 }
            },
            inner: { color: '#fdba74', roughness: 0.3, emissive: '#c2410c', emissiveIntensity: 0.1, jelly: { center: 0.08, edge: 0.3, power: 2 } },
            band: { mode: 'slime', a: '#fdba74', b: '#fff7ed', c: '#9a3412' },
            cutGlow: { color: '#fed7aa', strength: 0.4 },
            highlight: '#fff7ed'
        };
    }, []);

    const wall = useMemo<ShellLayerSpec>(() => {
        const state: ShellState = { shape: { half: [...WALL_HALF], exp: EXP, round: true }, waves: NO_WAVES, amp: 0, pinch: 0, pinchWidth: 0.3 };
        const rand = createRandom(`${SEED}-pili`);
        const dirs: Vec3[] = [];
        let guard = 0;
        while (dirs.length < (high ? 44 : 24) && guard++ < 2000) {
            const d = randomDirection(rand);
            // quy đổi hướng trên hình que (kéo dài theo x) để lông phân bố đều trên thân, tránh 2 đầu có roi
            const v = new THREE.Vector3(d[0] * WALL_HALF[0], d[1] * WALL_HALF[1], d[2] * WALL_HALF[2]).normalize();
            if (Math.abs(d[0]) > 0.82) continue;
            dirs.push([v.x, v.y, v.z]);
        }
        return {
            id: 'cell_wall_bac',
            state,
            thickness: WALL_THICK,
            outer: {
                color: '#b45309', roughness: 0.5, clearcoat: 0.5, sheen: 0.5, sheenColor: '#fde68a', emissive: '#78350f', emissiveIntensity: 0.14,
                surface: { mode: 'peptidoglycan', scale: 6, color2: '#fcd34d', strength: 0.45 }
            },
            inner: { color: '#92400e', roughness: 0.7, emissive: '#78350f', emissiveIntensity: 0.2 },
            band: { mode: 'mesh', a: '#fcd34d', b: '#fef3c7', c: '#78350f' },
            highlight: '#fef3c7',
            proteins: [{
                geometry: piliGeometry(),
                dirs,
                lift: 0,
                scale: (i) => 0.36 + ((i * 37) % 11) * 0.02,
                material: { roughness: 0.4, emissive: '#d97706', emissiveIntensity: 0.3 }
            }]
        };
    }, [high]);

    const membrane = useMemo<ShellLayerSpec>(() => {
        const state: ShellState = { shape: { half: [...MEM_HALF], exp: EXP, round: true }, waves: NO_WAVES, amp: 0, pinch: 0, pinchWidth: 0.3 };
        return {
            id: 'plasma_membrane',
            state,
            thickness: MEM_THICK,
            outer: { color: '#ca8a04', roughness: 0.25, clearcoat: 1, iridescence: 0.75, emissive: '#a16207', emissiveIntensity: 0.1 },
            inner: {
                color: '#d49a3a', roughness: 0.85, clearcoat: 0, emissive: '#b45309', emissiveIntensity: 0.24,
                surface: { mode: 'water', scale: 3, color2: '#fde68a', strength: 0.14 }
            },
            band: { mode: 'bilayer', a: '#fde68a', b: '#fef3c7', c: '#78350f' },
            highlight: '#fef9c3'
        };
    }, []);

    const layout = useMemo(() => {
        const rand = createRandom(`${SEED}-layout`);
        const ribo = scatterInShell(rand, high ? 330 : 150, INNER, {
            rMin: 0.1, rMax: 0.93, minGap: 0.025,
            reject: (p) => insideSuperellipsoid(p, NUCLEOID_CENTER, NUCLEOID_HALF, 2, 0.02),
            avoid: PLASMIDS.map((c) => ({ center: c, radius: 0.16 }))
        });
        const riboLabel = pickAnchor(ribo, [0.75, -0.55, 0.35], BACTERIA_VIEW.home, [new THREE.Vector3(...PLASMIDS[0])], 0.6);
        return { ribo, riboLabel };
    }, [high]);

    const labels = useMemo(() => labelSpecsFor(cell), [cell]);

    // vi khuẩn "bơi" tại chỗ: lắc nhẹ theo nhịp quay của roi. Thí nghiệm Nhân đôi: dài ra → ADN nhân
    // đôi chạy về hai đầu → vách ngăn thắt giữa (uPinch của cả 3 lớp vỏ) → tách thành 2 con.
    useFrame((st, delta) => {
        const g = groupRef.current;
        if (!g) return;
        const time = st.clock.elapsedTime;
        g.rotation.x = Math.sin(time * 0.9) * 0.035;
        g.position.y = Math.sin(time * 0.6) * 0.03;
        const f = experiments.fission;
        if (fission && f.playing) {
            f.t = Math.min(1, f.t + Math.min(delta, 0.1) / FISSION_DURATION);
            if (f.t >= 1) f.playing = false;
        }
        const t = fission ? f.t : 0;
        const elong = sstep(0, 0.22, t);
        const dup = sstep(0.2, 0.45, t);
        const pinch = sstep(0.45, 0.97, t);
        const k = 1 + 0.5 * elong;
        const bases: [ShellLayerSpec, [number, number, number]][] = [[capsule, BACTERIA_HALF], [wall, WALL_HALF], [membrane, MEM_HALF]];
        for (const [spec, base] of bases) {
            spec.state.shape.half[0] = base[0] * k;
            spec.state.pinch = 0.985 * pinch;
            spec.state.pinchWidth = 0.26;
        }
        stretchRef.current?.scale.set(k, 1, 1);
        if (flagRef.current) flagRef.current.position.x = -(k - 1) * BACTERIA_HALF[0];
        const shift = 1.05 * dup * k;
        if (nucA.current) { nucA.current.position.x = -shift; nucA.current.scale.set(1 - 0.32 * dup, 1, 1); }
        if (nucB.current) {
            nucB.current.visible = dup > 0.01;
            nucB.current.position.x = shift;
            nucB.current.scale.set((1 - 0.32 * dup) * (0.6 + 0.4 * dup), 0.6 + 0.4 * dup, 0.6 + 0.4 * dup);
        }
        if (plasB.current) { plasB.current.visible = dup > 0.01; plasB.current.scale.setScalar(Math.max(0.01, dup)); }
    });

    const nucleoidReject = (x: number, y: number, z: number) => insideSuperellipsoid(new THREE.Vector3(x, y, z), NUCLEOID_CENTER, NUCLEOID_HALF, 2, 0.05);

    return (
        <group ref={groupRef}>
            <ShellLayer spec={capsule} cut={cut} tier={tier} focus={focusCapsule} segments={high ? [110, 80] : [64, 48]}
                onSelect={onSelect} registry={registry} anchorDir={[0.25, 1, 0.35]} interactive={interactive} />
            <ShellLayer spec={wall} cut={cut} tier={tier} focus={focusWall} segments={high ? [110, 80] : [64, 48]}
                onSelect={onSelect} registry={registry} anchorDir={[-0.62, 0.8, 0.45]} interactive={interactive} />
            <ShellLayer spec={membrane} cut={cut} tier={tier} focus={focusMem} segments={high ? [110, 80] : [64, 48]}
                onSelect={onSelect} registry={registry} interiorId="cytoplasm_bac" anchorDir={[0.72, -0.62, 0.45]} interactive={interactive} />
            <CytoplasmAnchor />
            <PiliFringe anchorDir={[0.45, 0.85, 0.3]} />
            <group ref={nucA}>
                <Nucleoid center={NUCLEOID_CENTER} half={NUCLEOID_HALF} color="#f59e0b" seed={SEED} />
            </group>
            {fission && (
                <group ref={nucB} visible={false}>
                    <Nucleoid center={NUCLEOID_CENTER} half={NUCLEOID_HALF} color="#f59e0b" seed={`${SEED}-copy`} registerId={null} />
                </group>
            )}
            <Plasmids positions={PLASMIDS} color="#fde68a" />
            {fission && (
                <group ref={plasB} visible={false}>
                    <Plasmids positions={PLASMIDS_COPY} color="#fde68a" registerId={null} />
                </group>
            )}
            <group ref={stretchRef}>
                <Ribosomes points={layout.ribo} labelIndex={layout.riboLabel} color="#a3e635" size={0.026} seed={SEED} />
                <Cytosol shape={INNER} count={high ? 360 : 160} seed={`${SEED}-cytosol`} reject={nucleoidReject} color="#fff7d6" color2="#d9f99d" size={0.04} />
            </group>
            <group ref={flagRef}>
                <Flagella specs={FLAGELLA} color="#eab308" />
            </group>
            <Cytosol shape={{ half: BACTERIA_HALF, exp: EXP, round: true }} count={high ? 240 : 90} seed={`${SEED}-outside`} outside size={0.14} color="#fef3c7" color2="#bfdbfe" opacity={0.26} />
            <CellLabels specs={labels} registry={registry} cellGroup={groupRef} cut={cut} focusedId={focusedId} hidden={labelsHidden} onSelect={onSelect} />
        </group>
    );
};
