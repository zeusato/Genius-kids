import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { CellType } from '../../../../data/cellData';
import { useCellCtx, useFocus, useRegister } from '../cellContext';
import { createCutUniforms, createWaves, ShellState } from '../shell';
import { ShellLayer, ShellLayerSpec, useCutWindow } from '../ShellLayer';
import { createRandom, fibonacciSphere, Vec3 } from '../noise';
import { Cytosol } from '../Cytosol';
import { CellLabels } from '../CellLabels';
import { labelSpecsFor } from './labels';
import { Nucleus } from '../organelles/Nucleus';
import { EndoplasmicReticulum } from '../organelles/EndoplasmicReticulum';
import { Golgi } from '../organelles/Golgi';
import { makeMitoSpots, Mitochondria } from '../organelles/Mitochondria';
import { BlobSpot, Lysosomes } from '../organelles/Lysosomes';
import { Ribosomes } from '../organelles/Ribosomes';
import { Centrosome } from '../organelles/Centrosome';
import { pickAnchor, scatterInShell } from '../organelles/placement';
import { channelProteinGeometry, glycoproteinGeometry, peripheralProteinGeometry } from '../organelles/shared';
import type { CellViewSpec } from '../CellCameraRig';
import { ANIMAL_CENTROSOME, ANIMAL_ER, ANIMAL_GOLGI_AXIS, ANIMAL_GOLGI_POS, ANIMAL_HALF, ANIMAL_INNER, ANIMAL_NUCLEUS, ANIMAL_THICK } from './layouts';

// === Bố cục tế bào động vật: hằng số nằm ở layouts.ts (dùng chung với test) ===
export { ANIMAL_HALF };
const THICK = ANIMAL_THICK;
const NUCLEUS = ANIMAL_NUCLEUS;
const GOLGI_POS = ANIMAL_GOLGI_POS;
const GOLGI_AXIS = ANIMAL_GOLGI_AXIS;
const CENTROSOME_POS = ANIMAL_CENTROSOME;
const INNER_SHAPE = ANIMAL_INNER;
const CYTOPLASM_LABEL: Vec3 = [-1.25, -1.2, 1.05];
const SEED = 'animal';

export const ANIMAL_VIEW: CellViewSpec = { home: [3.4, 2.6, 7.9], introFrom: [-12, 21, 55], radius: 2.45 };

interface AnimalCellProps {
    cell: CellType;
    windowOpen: boolean;   // false trong cảnh lặn (tế bào còn nguyên vỏ như các tế bào lân cận)
    labelsHidden: boolean;
}

function CytoplasmAnchor() {
    const ref = useRef<THREE.Object3D>(null);
    useRegister('cytoplasm', ref, 1.5);
    return <object3D ref={ref} position={CYTOPLASM_LABEL} />;
}

export const AnimalCell: React.FC<AnimalCellProps> = ({ cell, windowOpen, labelsHidden }) => {
    const { tier, focusedId, onSelect, registry, interactive } = useCellCtx();
    const high = tier === 'high';
    const groupRef = useRef<THREE.Group>(null);
    const cut = useMemo(() => createCutUniforms(ANIMAL_HALF), []);
    const openTarget = useRef(0);
    openTarget.current = !windowOpen || focusedId === 'plasma_membrane' ? 0 : 1.02;
    useCutWindow(cut, groupRef, openTarget);
    const focusMembrane = useFocus('plasma_membrane');

    const membrane = useMemo<ShellLayerSpec>(() => {
        const state: ShellState = {
            shape: { half: [...ANIMAL_HALF], exp: 2 },
            waves: createWaves(`${SEED}-membrane`, { freq: 1.5, speed: 0.4 }),
            amp: 0.035,
            pinch: 0,
            pinchWidth: 0.3
        };
        const rand = createRandom(`${SEED}-proteins`);
        // mô hình khảm lỏng: protein xuyên màng (hồng), glycoprotein "cây kẹo" (xanh-vàng),
        // protein bám ngoài (cam) rải khắp mặt màng
        const dirs = fibonacciSphere(high ? 380 : 180, 1.4, rand);
        const kind = dirs.map(() => rand());
        const channels = dirs.filter((_, i) => kind[i] < 0.4);
        const glyco = dirs.filter((_, i) => kind[i] >= 0.4 && kind[i] < 0.68);
        const peripheral = dirs.filter((_, i) => kind[i] >= 0.68);
        return {
            id: 'plasma_membrane',
            state,
            thickness: THICK,
            outer: {
                physical: true,
                color: '#56c3f2', roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.18,
                sheen: 0.25, sheenColor: '#e0f2fe', iridescence: 1, iridescenceIOR: 1.35,
                iridescenceThicknessRange: [220, 680], emissive: '#0284c7', emissiveIntensity: 0.08,
                surface: { mode: 'lipid', scale: 30, color2: '#dff6ff', strength: 0.35 }
            },
            // lòng tế bào: thạch xanh ngọc sẫm hơn để bào quan nổi bật, vân sáng lăn tăn như ánh sáng xuyên qua thạch
            inner: {
                color: '#2c9fb0', roughness: 0.85, clearcoat: 0, emissive: '#0e6f86', emissiveIntensity: 0.22,
                surface: { mode: 'water', scale: 2.1, color2: '#a5f3fc', strength: 0.16 }
            },
            band: { mode: 'bilayer', a: '#7dd3fc', b: '#fde68a', c: '#0c4a6e' },
            cutGlow: { color: '#a5f3fc', strength: 0.7 },
            highlight: '#e0f2fe',
            proteins: [
                {
                    geometry: channelProteinGeometry('#f472b6', '#f9a8d4'),
                    dirs: channels, lift: -THICK * 0.4, scale: (i) => 0.05 + (i % 4) * 0.005,
                    spin: (i) => i * 1.3, material: { emissive: '#ec4899', emissiveIntensity: 0.2 }
                },
                {
                    geometry: glycoproteinGeometry('#34d399', '#fde047'),
                    dirs: glyco, lift: 0.004, scale: (i) => 0.042 + (i % 3) * 0.008,
                    spin: (i) => i * 2.1, material: { emissive: '#a3e635', emissiveIntensity: 0.22 }
                },
                {
                    geometry: peripheralProteinGeometry('#fb923c'),
                    dirs: peripheral, lift: -0.006, scale: (i) => 0.045 + (i % 3) * 0.006,
                    material: { emissive: '#f97316', emissiveIntensity: 0.16 }
                }
            ]
        };
    }, [high]);

    // Bố cục bào quan rải ngẫu nhiên nhưng CỐ ĐỊNH theo seed
    const layout = useMemo(() => {
        const rand = createRandom(`${SEED}-layout`);
        const avoid = [
            { center: NUCLEUS.center, radius: NUCLEUS.radius + 0.62 },
            { center: GOLGI_POS, radius: 0.72 },
            { center: CENTROSOME_POS, radius: 0.42 }
        ];
        const mitoPts = scatterInShell(rand, high ? 13 : 9, INNER_SHAPE, { rMin: 0.42, rMax: 0.79, avoid, minGap: 0.62 });
        const mito = makeMitoSpots(mitoPts, SEED, [0.17, 0.22]);
        const lysoPts = scatterInShell(rand, 7, INNER_SHAPE, {
            rMin: 0.35, rMax: 0.82, minGap: 0.4,
            avoid: [...avoid, ...mitoPts.map((p) => ({ center: p.toArray() as Vec3, radius: 0.36 }))]
        });
        const lyso: BlobSpot[] = lysoPts.map((position) => ({ position, scale: 0.09 + rand() * 0.045, phase: rand() * 6.28 }));
        const ribo = scatterInShell(rand, high ? 380 : 160, INNER_SHAPE, {
            rMin: 0.05, rMax: 0.94, minGap: 0.02,
            avoid: [{ center: NUCLEUS.center, radius: NUCLEUS.radius + 0.12 }, { center: GOLGI_POS, radius: 0.45 }]
        });
        // mỗi nhóm neo nhãn về một phía khác nhau của tế bào (nhìn từ góc mặc định)
        const view = ANIMAL_VIEW.home;
        const mitoLabel = pickAnchor(mitoPts, [0.9, -0.3, 0.3], view, [new THREE.Vector3(...NUCLEUS.center)], 1.2);
        const lysoLabel = pickAnchor(lysoPts, [-0.8, 0.45, 0.4], view, [mitoPts[mitoLabel]], 0.8);
        const riboLabel = pickAnchor(ribo, [-0.4, -0.85, 0.35], view, [mitoPts[mitoLabel], lysoPts[lysoLabel]], 0.7);
        return { mito, mitoLabel, lyso, lysoLabel, ribo, riboLabel };
    }, [high]);

    const labels = useMemo(() => labelSpecsFor(cell), [cell]);

    return (
        <group ref={groupRef}>
            <ShellLayer
                spec={membrane}
                cut={cut}
                tier={tier}
                focus={focusMembrane}
                segments={high ? [128, 96] : [72, 54]}
                onSelect={onSelect}
                registry={registry}
                interiorId="cytoplasm"
                anchorDir={[0.55, 0.95, 0.35]}
                interactive={interactive}
            />
            <CytoplasmAnchor />
            <Nucleus center={NUCLEUS.center} radius={NUCLEUS.radius} color="#a855f7" seed={SEED} pores={150} />
            <EndoplasmicReticulum {...ANIMAL_ER} color="#f472b6" ribosomeColor="#c084fc" />
            <Golgi position={GOLGI_POS} axis={GOLGI_AXIS} seed={SEED} />
            <Mitochondria spots={layout.mito} labelIndex={layout.mitoLabel} color="#ef4444" />
            <Lysosomes spots={layout.lyso} labelIndex={layout.lysoLabel} color="#60a5fa" glow="#38bdf8" />
            <Ribosomes points={layout.ribo} labelIndex={layout.riboLabel} color="#c084fc" size={0.024} seed={SEED} />
            <Centrosome position={CENTROSOME_POS} membrane={INNER_SHAPE} nucleus={NUCLEUS} seed={SEED} color="#fde047" />
            <Cytosol shape={INNER_SHAPE} count={high ? 900 : 380} seed={`${SEED}-cytosol`} avoid={[{ center: NUCLEUS.center, radius: NUCLEUS.radius + 0.05 }]} />
            <Cytosol shape={{ half: ANIMAL_HALF, exp: 2 }} count={high ? 220 : 90} seed={`${SEED}-outside`} outside size={0.16} color="#bff4ff" color2="#c7d2fe" opacity={0.28} />
            <CellLabels specs={labels} registry={registry} cellGroup={groupRef} cut={cut} focusedId={focusedId} hidden={labelsHidden} onSelect={onSelect} />
        </group>
    );
};
