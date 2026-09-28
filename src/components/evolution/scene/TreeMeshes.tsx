import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { SECTOR_COLOR, EXTINCT_COLOR, HUMAN_COLOR } from '../../../data/evolution/sectors';
import { ERA_BANDS, fracEras } from '../engine/timeScale';
import { LAYOUT } from '../engine/layout';
import type { AtlasInfo, EvoWorld } from './world';
import * as S from './shaders';
import type { QualityTier } from './params';

// ------------------------------------------------------------------ Cành + hào quang
export function Branches({ world, tier }: { world: EvoWorld; tier: QualityTier }) {
    const { geometry, material, aura } = useMemo(() => {
        const rb = world.ribbon;
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(rb.position, 3).setUsage(THREE.DynamicDrawUsage));
        g.setAttribute('aNormal', new THREE.BufferAttribute(rb.normal, 2).setUsage(THREE.DynamicDrawUsage));
        g.setAttribute('aFrac', new THREE.BufferAttribute(rb.frac, 1).setUsage(THREE.DynamicDrawUsage));
        g.setAttribute('aHalfW', new THREE.BufferAttribute(rb.halfW, 1).setUsage(THREE.DynamicDrawUsage));
        g.setAttribute('aSide', new THREE.BufferAttribute(rb.side, 1));
        g.setAttribute('aS', new THREE.BufferAttribute(rb.s, 1));
        g.setAttribute('aDist', new THREE.BufferAttribute(rb.dist, 1));
        g.setAttribute('aBranch', new THREE.BufferAttribute(rb.branch, 1));
        g.setAttribute('aColor', new THREE.BufferAttribute(world.ribbonColorLinear, 3));
        g.setIndex(new THREE.BufferAttribute(rb.index, 1));
        g.computeBoundingSphere();
        const u = world.uniforms;
        const m = new THREE.ShaderMaterial({
            vertexShader: S.branchVertex, fragmentShader: S.branchFragment,
            uniforms: { uTime: u.uTime, uNowFrac: u.uNowFrac, uFrontOn: u.uFrontOn, uTier: u.uTier, uWind: u.uWind, uWiden: { value: 0 }, uPxPerUnit: u.uPxPerUnit, uState: { value: world.branchTex } },
            // ribbon không có chiều mặt cố định (xoay màn dọc đảo chiều) → vẽ cả hai mặt
            transparent: true, depthWrite: false, depthTest: false, side: THREE.DoubleSide,
        });
        const a = new THREE.ShaderMaterial({
            vertexShader: S.branchVertex, fragmentShader: S.auraFragment,
            uniforms: { uTime: u.uTime, uNowFrac: u.uNowFrac, uWind: u.uWind, uWiden: { value: 9 }, uPxPerUnit: u.uPxPerUnit, uOverlay: { value: world.overlayTex } },
            transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
        });
        return { geometry: g, material: m, aura: a };
    }, [world]);
    useEffect(() => () => { geometry.dispose(); material.dispose(); aura.dispose(); }, [geometry, material, aura]);
    const ver = useRef(world.geometryVersion);
    const auraRef = useRef<THREE.Mesh>(null);
    useFrame(() => {
        if (ver.current !== world.geometryVersion) {
            ver.current = world.geometryVersion;
            (['position', 'aNormal', 'aFrac', 'aHalfW'] as const).forEach(k => { (geometry.getAttribute(k) as THREE.BufferAttribute).needsUpdate = true; });
            geometry.computeBoundingSphere();
        }
        if (auraRef.current) auraRef.current.visible = world.uniforms.uOverlayOn.value > 0.5;
    });
    useEffect(() => { world.uniforms.uWind.value = tier === 'high' ? 0.6 : 0; world.uniforms.uTier.value = tier === 'high' ? 1 : 0; }, [tier, world]);
    return (
        <>
            <mesh ref={auraRef} geometry={geometry} material={aura} renderOrder={4} frustumCulled={false} visible={false} />
            <mesh geometry={geometry} material={material} renderOrder={5} frustumCulled={false} />
        </>
    );
}

// ------------------------------------------------------------------ Ngọn + nút rẽ nhánh
function kindOf(world: EvoWorld, i: number): number {
    const n = world.tree.nodes[i];
    if (!n.isLeaf) return 5;
    if (n.extinct) return 4;
    if (n.data.youAreHere) return 6;
    if (n.sector === 'animal') return 0;
    if (n.sector === 'fungi') return 2;
    if (n.sector === 'plant') {
        let c = i; while (c >= 0) { if (world.tree.nodes[c].id === 'land_plants') return 1; c = world.tree.nodes[c].parent; }
        return 3;
    }
    return 3;
}

export function Tips({ world, atlasInfo }: { world: EvoWorld; atlasInfo: AtlasInfo }) {
    const atlas = useTexture(`${import.meta.env.BASE_URL}evolution/atlas.webp`);
    const { size } = useThree();
    const n = world.tree.nodes.length;
    const { mesh } = useMemo(() => {
        atlas.anisotropy = 4;
        atlas.generateMipmaps = true;
        atlas.minFilter = THREE.LinearMipmapLinearFilter;
        const geo = new THREE.PlaneGeometry(2, 2);
        const iColor = new Float32Array(n * 3), iIcon = new Float32Array(n * 4), iKind = new Float32Array(n), iPhase = new Float32Array(n);
        const iState = new Float32Array(n * 4), iVis = new Float32Array(n).fill(1);
        const c = new THREE.Color();
        const inv = 1 / atlasInfo.cols;
        for (const nd of world.tree.nodes) {
            const i = nd.i;
            const kind = kindOf(world, i);
            c.set(kind === 4 ? EXTINCT_COLOR : kind === 6 ? HUMAN_COLOR : SECTOR_COLOR[nd.sector]);
            iColor.set([c.r, c.g, c.b], i * 3);
            iKind[i] = kind;
            iPhase[i] = (i * 2.399) % (Math.PI * 2);
            const it = nd.isLeaf ? atlasInfo.items[nd.id] : undefined;
            if (it) {
                const col = it.i % atlasInfo.cols, row = Math.floor(it.i / atlasInfo.cols);
                iIcon.set([col * inv, 1 - (row + 1) * inv, inv, inv], i * 4);
            }
        }
        geo.setAttribute('iColor', new THREE.InstancedBufferAttribute(iColor, 3));
        geo.setAttribute('iIcon', new THREE.InstancedBufferAttribute(iIcon, 4));
        geo.setAttribute('iKind', new THREE.InstancedBufferAttribute(iKind, 1));
        geo.setAttribute('iPhase', new THREE.InstancedBufferAttribute(iPhase, 1));
        geo.setAttribute('iState', new THREE.InstancedBufferAttribute(iState, 4).setUsage(THREE.DynamicDrawUsage));
        geo.setAttribute('iVis', new THREE.InstancedBufferAttribute(iVis, 1).setUsage(THREE.DynamicDrawUsage));
        const mat = new THREE.ShaderMaterial({
            vertexShader: S.tipVertex, fragmentShader: S.tipFragment,
            uniforms: { uAtlas: { value: atlas }, uTime: world.uniforms.uTime, uPxPerUnit: world.uniforms.uPxPerUnit, uIconPx: { value: 14 } },
            transparent: true, depthWrite: false, depthTest: false,
        });
        const m = new THREE.InstancedMesh(geo, mat, n);
        m.frustumCulled = false;
        m.renderOrder = 6;
        return { mesh: m };
    }, [world, atlas, atlasInfo, n]);
    useEffect(() => () => { mesh.geometry.dispose(); (mesh.material as THREE.Material).dispose(); }, [mesh]);
    const mat4 = useMemo(() => new THREE.Matrix4(), []);
    const st = useMemo(() => [0, 0, 0, 0], []);
    useFrame(() => {
        const stAttr = mesh.geometry.getAttribute('iState') as THREE.InstancedBufferAttribute;
        const visAttr = mesh.geometry.getAttribute('iVis') as THREE.InstancedBufferAttribute;
        for (let i = 0; i < n; i++) {
            const r = world.tipR[i];
            mat4.makeScale(r, r, 1);
            mat4.setPosition(world.nodePos[i * 2], world.nodePos[i * 2 + 1], 0);
            mesh.setMatrixAt(i, mat4);
            world.nodeStateOf(i, st);
            (stAttr.array as Float32Array).set(st, i * 4);
            (visAttr.array as Float32Array)[i] = world.nodeVisible[i];
        }
        mesh.instanceMatrix.needsUpdate = true;
        stAttr.needsUpdate = true;
        visAttr.needsUpdate = true;
    });
    void size;
    return <primitive object={mesh} />;
}

// ------------------------------------------------------------------ Vòng đại
export function EraRings({ world }: { world: EvoWorld }) {
    const { geometry, material } = useMemo(() => {
        const g = new THREE.PlaneGeometry(LAYOUT.R * 2.5, LAYOUT.R * 4.4); // đủ cao cho quạt giãn ở màn dọc
        const u = world.uniforms;
        const bandColor = ERA_BANDS.map(b => new THREE.Color(b.color));
        const m = new THREE.ShaderMaterial({
            vertexShader: S.ringsVertex, fragmentShader: S.ringsFragment,
            uniforms: {
                uR: u.uR, uOrient: u.uOrient, uNowFrac: u.uNowFrac, uTime: u.uTime, uLUT: { value: world.lutTex },
                uBandColor: { value: bandColor }, uBandFrom: { value: ERA_BANDS.map(b => b.fromMa) },
                uShock: u.uShock, uFrost: u.uFrost, uTier: u.uTier,
            },
            transparent: true, depthWrite: false, depthTest: false,
        });
        return { geometry: g, material: m };
    }, [world]);
    useEffect(() => () => { geometry.dispose(); material.dispose(); }, [geometry, material]);
    return <mesh geometry={geometry} material={material} renderOrder={2} frustumCulled={false} />;
}

// ------------------------------------------------------------------ Nền trời + hạt bụi (nhiều lớp sâu → thị sai)
export function Backdrop({ world, tier }: { world: EvoWorld; tier: QualityTier }) {
    const { gl } = useThree();
    const count = tier === 'high' ? 1600 : 500;
    const { sky, skyMat, points, pointsMat } = useMemo(() => {
        const sg = new THREE.PlaneGeometry(14000, 14000);
        const sm = new THREE.ShaderMaterial({
            vertexShader: S.skyVertex, fragmentShader: S.skyFragment,
            uniforms: { uSkyTint: world.uniforms.uSkyTint, uRoot: { value: new THREE.Vector2(0, 0) }, uFrost: world.uniforms.uFrost, uTime: world.uniforms.uTime },
            depthWrite: false, depthTest: false,
        });
        const pos = new Float32Array(count * 3), seed = new Float32Array(count), col = new Float32Array(count * 3);
        const c = new THREE.Color();
        let s = 12345;
        const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
        for (let k = 0; k < count; k++) {
            const r = LAYOUT.R * Math.sqrt(rnd()) * 1.15;
            const th = -0.1 + rnd() * (Math.PI + 0.2);
            pos.set([r * Math.cos(th), r * Math.sin(th), -120 + rnd() * 170], k * 3);
            seed[k] = rnd();
            const f = r / LAYOUT.R;
            const band = ERA_BANDS.find(b => fracEras(b.toMa) >= f) ?? ERA_BANDS[ERA_BANDS.length - 1];
            c.set(band.color).lerp(new THREE.Color('#e0f2fe'), 0.55);
            col.set([c.r, c.g, c.b], k * 3);
        }
        const pg = new THREE.BufferGeometry();
        pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        pg.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
        pg.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
        const pm = new THREE.ShaderMaterial({
            vertexShader: S.particleVertex, fragmentShader: S.particleFragment,
            uniforms: { uTime: world.uniforms.uTime, uPixelRatio: { value: gl.getPixelRatio() } },
            transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
        });
        return { sky: sg, skyMat: sm, points: pg, pointsMat: pm };
    }, [world, count, gl]);
    useEffect(() => () => { sky.dispose(); skyMat.dispose(); points.dispose(); pointsMat.dispose(); }, [sky, skyMat, points, pointsMat]);
    const groupRef = useRef<THREE.Points>(null);
    useFrame(() => {
        // hạt nằm theo hướng quạt
        if (groupRef.current) groupRef.current.scale.y = world.orientation === 'portrait' ? 1.7 : 1;
    });
    return (
        <>
            <mesh geometry={sky} material={skyMat} position={[0, 0, -400]} renderOrder={0} frustumCulled={false} />
            <points ref={groupRef} geometry={points} material={pointsMat} renderOrder={3} frustumCulled={false} />
        </>
    );
}
