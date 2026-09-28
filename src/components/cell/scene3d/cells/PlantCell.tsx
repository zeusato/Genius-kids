import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { CellType } from '../../../../data/cellData';
import { useCellCtx, useFocus, useRegister } from '../cellContext';
import { createCutUniforms, createWaves, NO_WAVES, ShellState } from '../shell';
import { ShellLayer, ShellLayerSpec, useCutWindow } from '../ShellLayer';
import { createRandom, Vec3 } from '../noise';
import { Cytosol } from '../Cytosol';
import { CellLabels } from '../CellLabels';
import { labelSpecsFor } from './labels';
import { Nucleus } from '../organelles/Nucleus';
import { EndoplasmicReticulum } from '../organelles/EndoplasmicReticulum';
import { Golgi } from '../organelles/Golgi';
import { makeMitoSpots, Mitochondria } from '../organelles/Mitochondria';
import { Ribosomes } from '../organelles/Ribosomes';
import { Vacuole } from '../organelles/Vacuole';
import { Chloroplasts, StreamPath } from '../organelles/Chloroplasts';
import { insideSuperellipsoid, pickAnchor, scatterInShell } from '../organelles/placement';
import type { CellViewSpec } from '../CellCameraRig';
import {
    PLANT_ER, PLANT_GOLGI_POS, PLANT_INNER, PLANT_MEM_HALF, PLANT_MEM_THICK, PLANT_NUCLEUS, PLANT_VAC_CENTER, PLANT_VAC_EXP,
    PLANT_VAC_HALF, PLANT_WALL_HALF, PLANT_WALL_THICK
} from './layouts';

// === Bố cục tế bào thực vật: hằng số nằm ở layouts.ts (dùng chung với test) ===
export { PLANT_WALL_HALF };
const WALL_THICK = PLANT_WALL_THICK;
const MEM_HALF = PLANT_MEM_HALF;
const MEM_THICK = PLANT_MEM_THICK;
const INNER = PLANT_INNER;
const VAC_CENTER = PLANT_VAC_CENTER;
const VAC_HALF = PLANT_VAC_HALF;
const VAC_EXP = PLANT_VAC_EXP;
const NUCLEUS = PLANT_NUCLEUS;
const GOLGI_POS = PLANT_GOLGI_POS;
const SEED = 'plant';

export const PLANT_VIEW: CellViewSpec = { home: [5.2, 3.7, 8.9], introFrom: [-16, 27, 72], radius: 3.0 };

// Dòng tế bào chất chảy vòng quanh không bào (2 vòng nghiêng) — lục lạp trôi theo
const STREAMS: StreamPath[] = [
    { center: new THREE.Vector3(...VAC_CENTER), radii: [2.18, 1.52], normal: new THREE.Vector3(0.08, 0.05, 1), speed: 0.07 },
    { center: new THREE.Vector3(...VAC_CENTER), radii: [2.18, 1.32], normal: new THREE.Vector3(0.05, 1, 0.1), speed: -0.06 }
];

function CytoplasmAnchor() {
    const ref = useRef<THREE.Object3D>(null);
    useRegister('cytoplasm', ref, 1.4);
    return <object3D ref={ref} position={[1.7, -1.55, 1.1]} />;
}

interface PlantCellProps {
    cell: CellType;
    windowOpen: boolean;
    labelsHidden: boolean;
}

export const PlantCell: React.FC<PlantCellProps> = ({ cell, windowOpen, labelsHidden }) => {
    const { tier, focusedId, onSelect, registry, interactive, experiments } = useCellCtx();
    const high = tier === 'high';
    const groupRef = useRef<THREE.Group>(null);
    const protoplast = useRef<THREE.Group>(null);
    const cut = useMemo(() => createCutUniforms(PLANT_WALL_HALF), []);
    const openTarget = useRef(0);
    openTarget.current = !windowOpen || focusedId === 'cell_wall' ? 0 : 0.95;
    useCutWindow(cut, groupRef, openTarget);
    const focusWall = useFocus('cell_wall');
    const focusMem = useFocus('plasma_membrane');

    const wall = useMemo<ShellLayerSpec>(() => {
        const state: ShellState = { shape: { half: [...PLANT_WALL_HALF], exp: 5 }, waves: NO_WAVES, amp: 0, pinch: 0, pinchWidth: 0.3 };
        return {
            id: 'cell_wall',
            state,
            thickness: WALL_THICK,
            outer: {
                color: '#4d7c0f', roughness: 0.6, clearcoat: 0.35, clearcoatRoughness: 0.4, sheen: 0.7, sheenColor: '#d9f99d',
                emissive: '#365314', emissiveIntensity: 0.12, surface: { mode: 'cellulose', scale: 7, color2: '#bef264', strength: 0.4 }
            },
            inner: { color: '#84cc16', roughness: 0.7, clearcoat: 0, emissive: '#3f6212', emissiveIntensity: 0.2 },
            band: { mode: 'fibers', a: '#bef264', b: '#fef9c3', c: '#3f6212' },
            cutGlow: { color: '#d9f99d', strength: 0.45 },
            highlight: '#ecfccb'
        };
    }, []);

    const membrane = useMemo<ShellLayerSpec>(() => {
        const state: ShellState = {
            shape: { half: [...MEM_HALF], exp: 5 },
            waves: createWaves(`${SEED}-membrane`, { freq: 1.8, speed: 0.3 }),
            amp: 0.006,
            pinch: 0,
            pinchWidth: 0.3
        };
        return {
            id: 'plasma_membrane',
            state,
            thickness: MEM_THICK,
            outer: {
                color: '#4ade80', roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.15, iridescence: 0.8,
                iridescenceIOR: 1.32, emissive: '#16a34a', emissiveIntensity: 0.1
            },
            inner: {
                color: '#5fbf8b', roughness: 0.85, clearcoat: 0, emissive: '#15803d', emissiveIntensity: 0.24,
                surface: { mode: 'water', scale: 2.3, color2: '#bbf7d0', strength: 0.14 }
            },
            band: { mode: 'bilayer', a: '#86efac', b: '#fef08a', c: '#14532d' },
            highlight: '#dcfce7'
        };
    }, []);

    const layout = useMemo(() => {
        const rand = createRandom(`${SEED}-layout`);
        const inVac = (p: THREE.Vector3, m: number) => insideSuperellipsoid(p, VAC_CENTER, VAC_HALF, VAC_EXP, m);
        const avoid = [
            { center: NUCLEUS.center, radius: NUCLEUS.radius + 0.42 },
            { center: GOLGI_POS, radius: 0.5 }
        ];
        const mitoPts = scatterInShell(rand, high ? 8 : 6, INNER, { rMin: 0.6, rMax: 0.86, avoid, minGap: 0.62, reject: (p) => inVac(p, 0.28) });
        const mito = makeMitoSpots(mitoPts, SEED, [0.15, 0.19]);
        const ribo = scatterInShell(rand, high ? 240 : 110, INNER, {
            rMin: 0.3, rMax: 0.95, minGap: 0.02, avoid: [{ center: NUCLEUS.center, radius: NUCLEUS.radius + 0.08 }],
            reject: (p) => inVac(p, 0.06)
        });
        const mitoLabel = pickAnchor(mitoPts, [0.85, -0.45, 0.3], PLANT_VIEW.home, [], 0.5);
        const riboLabel = pickAnchor(ribo, [0.2, -0.9, 0.4], PLANT_VIEW.home, [mitoPts[mitoLabel]], 0.6);
        return { mito, mitoLabel, ribo, riboLabel };
    }, [high]);

    const labels = useMemo(() => labelSpecsFor(cell), [cell]);

    // Thí nghiệm tưới nước: tween lượng nước; thiếu nước → CẢ khối nguyên sinh (màng + tế bào chất +
    // bào quan) co lại tách khỏi thành cứng = co nguyên sinh; thành vẫn giữ nguyên hình.
    useFrame((_, delta) => {
        const w = experiments.water;
        w.value += (w.target - w.value) * (1 - Math.exp(-Math.min(delta, 0.1) * 1.8));
        // co ĐỀU (scale đồng nhất) để cửa sổ cắt của màng vẫn trùng hướng với cửa sổ của thành
        protoplast.current?.scale.setScalar(0.76 + 0.24 * Math.pow(w.value, 0.7));
        membrane.state.amp = 0.006 + (1 - w.value) * 0.03;
    });

    const vacReject = (x: number, y: number, z: number) => insideSuperellipsoid(new THREE.Vector3(x, y, z), VAC_CENTER, VAC_HALF, VAC_EXP, 0.04);

    return (
        <group ref={groupRef}>
            <ShellLayer
                spec={wall}
                cut={cut}
                tier={tier}
                focus={focusWall}
                segments={high ? [120, 90] : [72, 54]}
                onSelect={onSelect}
                registry={registry}
                anchorDir={[-0.55, 0.9, 0.3]}
                interactive={interactive}
            />
            <group ref={protoplast}>
                <ShellLayer
                    spec={membrane}
                    cut={cut}
                    tier={tier}
                    focus={focusMem}
                    segments={high ? [120, 90] : [72, 54]}
                    onSelect={onSelect}
                    registry={registry}
                    interiorId="cytoplasm"
                    anchorDir={[0.8, 0.55, 0.55]}
                    interactive={interactive}
                />
                <CytoplasmAnchor />
                <Vacuole center={VAC_CENTER} half={VAC_HALF} exp={VAC_EXP} color="#38bdf8" seed={SEED} water={experiments.water} />
                <Nucleus center={NUCLEUS.center} radius={NUCLEUS.radius} color="#a855f7" seed={SEED} pores={90} strands={5} />
                <EndoplasmicReticulum {...PLANT_ER} color="#f472b6" ribosomeColor="#c084fc" tubes={high ? 5 : 3} />
                <Golgi position={GOLGI_POS} axis={[0.3, -0.8, 0.5]} scale={0.75} seed={SEED} />
                <Mitochondria spots={layout.mito} labelIndex={layout.mitoLabel} color="#ef4444" drift={0.04} />
                <Ribosomes points={layout.ribo} labelIndex={layout.riboLabel} color="#c084fc" size={0.024} seed={SEED} />
                <Chloroplasts count={high ? 18 : 11} paths={STREAMS} scale={[0.2, 0.26]} color="#22c55e" seed={SEED} />
                <Cytosol shape={INNER} count={high ? 520 : 240} seed={`${SEED}-cytosol`} reject={vacReject}
                    avoid={[{ center: NUCLEUS.center, radius: NUCLEUS.radius + 0.04 }]} color="#e8ffe9" color2="#fef9c3" />
            </group>
            <Cytosol shape={{ half: PLANT_WALL_HALF, exp: 5 }} count={high ? 200 : 80} seed={`${SEED}-outside`} outside size={0.18} color="#d9f99d" color2="#a7f3d0" opacity={0.25} />
            <CellLabels specs={labels} registry={registry} cellGroup={groupRef} cut={cut} focusedId={focusedId} hidden={labelsHidden} onSelect={onSelect} />
        </group>
    );
};
