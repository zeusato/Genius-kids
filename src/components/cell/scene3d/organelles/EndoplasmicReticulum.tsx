import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useCellCtx, useFocus, useRegister, useSelectHandlers } from '../cellContext';
import { createFx, createOrganicMaterial, dampFx, useDisposable } from '../materials';
import { getRibosomeGeometry } from './shared';
import { buildER, ERShapeParams } from './erGeometry';

interface ERProps extends ERShapeParams {
    color: string;
    ribosomeColor: string;
}


export const EndoplasmicReticulum: React.FC<ERProps> = (props) => {
    const { tier } = useCellCtx();
    const high = tier === 'high';
    const focusER = useFocus('er');
    const focusRibo = useFocus('ribosome');
    const erHandlers = useSelectHandlers('er');
    const riboHandlers = useSelectHandlers('ribosome');
    // Bố cục là hằng số của từng loại tế bào → chỉ dựng lại khi đổi seed/tier
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const geo = useMemo(() => buildER(props, high), [props.seed, high]);

    const erFx = useMemo(() => createFx('#fce7f3'), []);
    const riboFx = useMemo(() => createFx('#faf5ff'), []);
    const sheetMat = useMemo(() => createOrganicMaterial({
        color: props.color, roughness: 0.34, clearcoat: 0.9, clearcoatRoughness: 0.22,
        sheen: 0.7, sheenColor: '#fbcfe8', emissive: '#db2777', emissiveIntensity: 0.12,
        side: THREE.DoubleSide, fx: erFx
    }, tier).material, [props.color, tier, erFx]);
    const tubeMat = useMemo(() => createOrganicMaterial({
        color: '#f9a8d4', roughness: 0.3, clearcoat: 0.9, sheen: 0.5, sheenColor: '#fdf2f8',
        emissive: '#ec4899', emissiveIntensity: 0.14, fx: erFx
    }, tier).material, [tier, erFx]);
    const riboMat = useMemo(() => createOrganicMaterial({
        color: props.ribosomeColor, vertexColors: true, roughness: 0.4, clearcoat: 0.3,
        emissive: props.ribosomeColor, emissiveIntensity: 0.55, fx: riboFx
    }, tier).material, [props.ribosomeColor, tier, riboFx]);

    useDisposable(geo.sheets, geo.smooth, sheetMat, tubeMat, riboMat);

    const riboRef = useRef<THREE.InstancedMesh>(null);
    useEffect(() => {
        const m = riboRef.current;
        if (!m) return;
        geo.ribosomes.forEach((mat, i) => m.setMatrixAt(i, mat));
        m.instanceMatrix.needsUpdate = true;
        m.computeBoundingSphere();
    }, [geo]);

    const anchor = useRef<THREE.Object3D>(null);
    useRegister('er', anchor, props.nucleusRadius * 1.25);

    useFrame((state, delta) => {
        const pulse = focusER === 'this' ? 0.2 * Math.sin(state.clock.elapsedTime * 2.4) : 0;
        dampFx(erFx, focusER, delta, pulse);
        // ribôxôm trên lưới hạt: sáng khi chọn ribôxôm, giữ nguyên khi chọn lưới nội chất
        dampFx(riboFx, focusRibo === 'this' ? 'this' : focusER === 'this' ? 'none' : focusRibo, delta);
    });

    return (
        <group>
            <object3D ref={anchor} position={geo.labelPoint} />
            <mesh geometry={geo.sheets} material={sheetMat} {...erHandlers} />
            <mesh geometry={geo.smooth} material={tubeMat} {...erHandlers} />
            <instancedMesh
                ref={riboRef}
                args={[getRibosomeGeometry(), riboMat, geo.ribosomes.length]}
                {...riboHandlers}
            />
        </group>
    );
};
